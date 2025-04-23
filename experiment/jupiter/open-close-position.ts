/**
 *  Jupiter Perpetuals – open & close example.
 *
 *  USAGE
 *  -----
 *  # set RPC_URL and KEYPAIR in a .env (or replace inline)
 *  ts-node jupiter-perps.ts
 */

import "dotenv/config";
import {
  AnchorProvider,
  BN,
  Program,
  Wallet,
} from "@coral-xyz/anchor";
import {
  Blockhash,
  ComputeBudgetProgram,
  Connection,
  Keypair,
  PublicKey,
  SystemProgram,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  createAssociatedTokenAccountIdempotentInstruction,
  createCloseAccountInstruction,
  createSyncNativeInstruction,
  getAssociatedTokenAddressSync,
  NATIVE_MINT,
} from "@solana/spl-token";
import axios from "axios";

// ─────────────────────────────────────────────────────────────────────────
//  CONSTANTS  (copied from the official example repo)                     ─
const RPC = new Connection(
  process.env.RPC_URL ?? "https://api.mainnet-beta.solana.com"
);

// your local keypair
const WALLET = Keypair.fromSecretKey(
  Uint8Array.from(JSON.parse(process.env.PRIVATE_KEY!))
);
const PROVIDER = new AnchorProvider(RPC, new Wallet(WALLET), {
  commitment: "confirmed",
});

// Program + pool IDs
const PERPS_ID = new PublicKey("PERPHjGBqRHArX4DySjwM6UJHiR3sWAatqfdBS2qQJu");
const POOL_ID  = new PublicKey("5BUwFW4nRbftYTDMbgxykoFWqWHPzahFSNAaaaJtVKsq");

// Custodies (SOL only here – add the rest if you want)
const SOL_CUSTODY = new PublicKey("7xS2gz2bTp3fwCC7knJvUWTEU9Tycczu6VhJYKgi1wdz");

// Import the IDL JSON (put it next to this file)
import IDL_JSON from "./jupiter-perpetuals-idl.json";
type Perpetuals = typeof IDL_JSON;

const PROGRAM = new Program<Perpetuals>(IDL_JSON as any, PERPS_ID, PROVIDER);

// ─────────────────────────────────────────────────────────────────────────
//  PDA helpers (unchanged from example repo)                              ─
function generatePositionPda(owner: PublicKey, custody: PublicKey) {
  return PublicKey.findProgramAddressSync(
    [Buffer.from("position"), owner.toBuffer(), custody.toBuffer()],
    PERPS_ID
  )[0];
}

function generatePositionRequestPda(position: PublicKey, counter: number) {
  return PublicKey.findProgramAddressSync(
    [
      Buffer.from("position_request"),
      position.toBuffer(),
      Buffer.from(Uint8Array.of(counter)),
    ],
    PERPS_ID
  )[0];
}

// ─────────────────────────────────────────────────────────────────────────
//  OPEN position                                                          ─
export async function openPerpPosition(params: {
  side: "long" | "short";
  sizeUsd: number;             // e.g. 100  ==  $100 notional
  collateralSol: number;       // lamports of SOL to post
  maxPriceSlippagePct?: number // default 1 %
}) {
  const {
    side,
    sizeUsd,
    collateralSol,
    maxPriceSlippagePct = 1,
  } = params;

  // basic inputs
  const owner          = WALLET.publicKey;
  const counter        = Math.floor(Math.random() * 1e6);
  const sizeUsdDelta   = new BN(sizeUsd * 1e6);            // USDC 6 decimals
  const collateralDelta= new BN(collateralSol);

  // derive PDAs
  const positionPda        = generatePositionPda(owner, SOL_CUSTODY);
  const positionRequestPda = generatePositionRequestPda(positionPda, counter);

  // Need a wrapped‑SOL ATA that lives *under the positionRequest PDA*
  const fundingAccount = getAssociatedTokenAddressSync(
    NATIVE_MINT,
    positionRequestPda,
    true
  );

  // Quoting – only needed when the trade requires a swap (SOL→SOL doesn’t),
  // but I include the pattern for completeness.
  const jupiterMinimumOut = null; // leave null for native SOL longs

  // Slippage in quote units (USDC 6dp)
  const priceSlippage = new BN(
    (maxPriceSlippagePct / 100) * 1e6 * 1 // $1 in quote units
  );

  // — Build instruction list —
  const preIxs  = [
    // create wSOL ATA
    createAssociatedTokenAccountIdempotentInstruction(
      owner,
      fundingAccount,
      positionRequestPda,
      NATIVE_MINT
    ),
    SystemProgram.transfer({
      fromPubkey: owner,
      toPubkey:   fundingAccount,
      lamports:   BigInt(collateralDelta.toString()),
    }),
    createSyncNativeInstruction(fundingAccount),
  ];

  const increaseIx = await PROGRAM.methods
    .createIncreasePositionMarketRequest({
      counter,
      collateralTokenDelta: collateralDelta,
      jupiterMinimumOut,
      priceSlippage,
      side: side === "long" ? { long: {} } : { short: {} },
      sizeUsdDelta,
    })
    .accounts({
      // mandatory accounts
      owner,
      pool: POOL_ID,
      position: positionPda,
      positionRequest: positionRequestPda,
      positionRequestAta: fundingAccount,
      custody:          SOL_CUSTODY,
      collateralCustody: SOL_CUSTODY,
      fundingAccount,
      inputMint: NATIVE_MINT,
      perpetuals: PublicKey.findProgramAddressSync(
        [Buffer.from("perpetuals")],
        PERPS_ID
      )[0],
      referral: null,
    })
    .instruction();

  // compute budget – sim first to size it correctly
  const recentBlockhash = (await RPC.getLatestBlockhash()).blockhash;
  const simMessage = new TransactionMessage({
    payerKey: owner,
    recentBlockhash,
    instructions: preIxs.concat(increaseIx),
  }).compileToV0Message();
  const simTx = new VersionedTransaction(simMessage);
  const sim   = await RPC.simulateTransaction(simTx, {
    replaceRecentBlockhash: true,
    sigVerify: false,
  });
  const cuLimit = sim.value.unitsConsumed ?? 1_400_000;

  // final tx
  const txMsg = new TransactionMessage({
    payerKey: owner,
    recentBlockhash,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: cuLimit }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      ...preIxs,
      increaseIx,
      // close wSOL ATA after keeper executes
      createCloseAccountInstruction(fundingAccount, owner, owner),
    ],
  }).compileToV0Message();

  const tx = new VersionedTransaction(txMsg);
  tx.sign([WALLET]);
  const sig = await RPC.sendTransaction(tx, {
    skipPreflight: true,
  });
  console.log("📤  open request sent:", sig);
}

// ─────────────────────────────────────────────────────────────────────────
//  CLOSE (full)                                                           ─
export async function closePerpPosition(positionPda: PublicKey) {
  const position     = await PROGRAM.account.position.fetch(positionPda);
  const counter      = Math.floor(Math.random() * 1e6);
  const positionReq  = generatePositionRequestPda(positionPda, counter);

  // choose which token you want back; here we redeem as SOL
  const desiredMint  = NATIVE_MINT;
  const receivingATA = getAssociatedTokenAddressSync(
    desiredMint,
    position.owner,
    true
  );

  const decIx = await PROGRAM.methods
    .createDecreasePositionMarketRequest({
      collateralUsdDelta: new BN(0),
      sizeUsdDelta:       new BN(0),
      priceSlippage:      new BN(100_000_000_000), // generous
      jupiterMinimumOut:  null,
      counter,
      entirePosition:     true,
    })
    .accounts({
      owner: position.owner,
      pool:  POOL_ID,
      position: positionPda,
      positionRequest: positionReq,
      positionRequestAta: getAssociatedTokenAddressSync(
        desiredMint,
        positionReq,
        true
      ),
      custody: position.custody,
      collateralCustody: position.collateralCustody,
      desiredMint,
      receivingAccount: receivingATA,
      perpetuals: PublicKey.findProgramAddressSync(
        [Buffer.from("perpetuals")],
        PERPS_ID
      )[0],
      referral: null,
    })
    .instruction();

  const bh  = (await RPC.getLatestBlockhash()).blockhash;
  const msg = new TransactionMessage({
    payerKey: position.owner,
    recentBlockhash: bh,
    instructions: [
      ComputeBudgetProgram.setComputeUnitLimit({ units: 1_200_000 }),
      ComputeBudgetProgram.setComputeUnitPrice({ microLamports: 100_000 }),
      decIx,
    ],
  }).compileToV0Message();
  const tx = new VersionedTransaction(msg);
  tx.sign([WALLET]);

  const sig = await RPC.sendTransaction(tx, { skipPreflight: true });
  console.log("📤  close request sent:", sig);
}

// ─────────────────────────────────────────────────────────────────────────
//  DEMO – open 0.1 SOL long worth $100, then close it                     ─
(async () => {
  await openPerpPosition({
    side: "long",
    sizeUsd: 100,
    collateralSol: 0.1 * 1e9, // lamports
  });

  // wait a few seconds then close the exact same position
  // (you'd normally fetch the PDA list first)
  const posPda = generatePositionPda(WALLET.publicKey, SOL_CUSTODY);
  await closePerpPosition(posPda);
})();
