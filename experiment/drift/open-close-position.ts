import * as dotenv from 'dotenv';
dotenv.config();
import * as fs from 'fs';
import { createAssociatedTokenAccountInstruction, getAssociatedTokenAddress, TOKEN_PROGRAM_ID } from '@solana/spl-token';
import { Transaction, Connection, Keypair, PublicKey, Commitment, } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import {
  DriftClient,
  SpotMarkets,
  TokenFaucet,
  OrderType,
  PositionDirection,
  BN
} from '@drift-labs/sdk';


const DRIFT_PROGRAM_ID = new PublicKey( 'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH');
const TOKEN_FAUCET_PROGRAM_ID = new PublicKey( 'V4v1mQiAdLz4qwckEb45WqHYceYizoib39cDBHSWfaB');

// ---------- helper to load the keypair ----------
function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

const checkUserExistsInitialiseIfNot = async (driftClient: DriftClient): Promise<PublicKey> => {
  try {
    const user = driftClient.getUser();
    const userPK = user.getUserAccountPublicKey()
    console.log('User account already exists: ', userPK);
    return userPK;

  } catch (e) {
    console.log('Initializing user account...');
    const userAccountPublicKey = await driftClient.initializeUserAccount();
    console.log(`User account initialized: ${userAccountPublicKey.toString()}`);
    // Need to subscribe again to load the newly created user account
    await driftClient.subscribe();
    console.log('Resubscribed to load the new user account');
    return userAccountPublicKey[1];
  }
}

const mintToUser = async (driftClient: DriftClient, wallet: Wallet, marketIndex: number, amount: BN, opts: any) => {
  try {
    const mint = SpotMarkets["devnet"][marketIndex].mint;
    const tokenFaucet = new TokenFaucet(driftClient.connection, wallet, TOKEN_FAUCET_PROGRAM_ID, mint, opts);
    const ata = await getTokenAddress(mint.toBase58(), wallet.publicKey.toBase58());

    const tokenAccountInfo = await driftClient.connection.getAccountInfo(ata);
    if (!tokenAccountInfo) {
      const createAtaIx = createAssociatedTokenAccountInstruction(
        wallet.publicKey, // payer
        ata, // ata address
        wallet.publicKey, // owner
        mint // mint
      );
      const tx = new Transaction().add(createAtaIx);
      const signature = await driftClient.provider.sendAndConfirm(tx);
      console.log("Token account created:", signature);
    }

    let mint_res = await tokenFaucet.mintToUser(ata, amount);
    console.log("usdc faucet mintToUser Response", mint_res);
  } catch(e) {
    console.log(e)
  }
}


const getTokenAddress = ( mintAddress: string, userPubKey: string): Promise<PublicKey> => {
  return getAssociatedTokenAddress(
    new PublicKey(mintAddress),
    new PublicKey(userPubKey)
  );
};

async function main() {
  const commitment: Commitment = 'confirmed';
  const connection = new Connection(process.env.RPC_ENDPOINT!, commitment);
  const keypair     = loadKeypair(process.env.KEYPAIR!);
  const wallet      = new Wallet(keypair);

  const driftClient = new DriftClient({
    connection,
    wallet,
    programID: DRIFT_PROGRAM_ID,
    env: process.env.CLUSTER as 'devnet' | 'mainnet-beta',
    accountSubscription: { type: 'websocket' },
  });

  try {
    await driftClient.subscribe();          // loads markets, user account, etc.

    // Check if user account exists, if not initialize it
    const userPK = await checkUserExistsInitialiseIfNot(driftClient);

    const SOL_PERP_INDEX = 0;               // SOL‑PERP is index 0 on Drift
    const baseAmount     = new BN(10 * 1e9);   // 0.01 SOL in base precision
    const usdcMarketIndex = 0;

    if (process.env.CLUSTER == "devnet") {
      const opts = { skipPreflight: false, preflightCommitment: commitment }

      await mintToUser(driftClient, wallet, usdcMarketIndex, baseAmount, opts) // mint usdc to user
    }
    
    
    const mint = SpotMarkets["devnet"][usdcMarketIndex].mint;
    const ata = await getTokenAddress(mint.toBase58(), wallet.publicKey.toBase58());
    let res = await driftClient.deposit(baseAmount, SOL_PERP_INDEX, ata)
    console.log("deposit response: ", res)

    const openSig = await driftClient.placeAndTakePerpOrder({
      marketIndex: SOL_PERP_INDEX,
      direction:   PositionDirection.SHORT,
      baseAssetAmount: baseAmount,
      orderType: OrderType.MARKET,
      reduceOnly: false,
    });
    console.log(`Opened 0.01 SOL‑PERP long → tx ${openSig}`);


    const userAccount = driftClient.getUserAccount();

    // const settledPnL = userAccount.settledPerpPnl;
    // console.log("Settled PnL", settledPnL)

    // const orders = userAccount.orders;
    // console.log("Users Orders: ", orders);

    // Find the SOL-PERP position
    const userPositions = userAccount.perpPositions;
    const solPosition = userPositions.find(p => p.marketIndex === SOL_PERP_INDEX);
    if (solPosition) {
      console.log("Position details:");
      console.log(solPosition);
    }

    await new Promise((r) => setTimeout(r, 6000));

    const closeSig = await driftClient.placeAndTakePerpOrder({
      marketIndex: SOL_PERP_INDEX,
      direction: PositionDirection.LONG,   // Opposite of your SHORT position
      baseAssetAmount: baseAmount,
      orderType: OrderType.MARKET,
      reduceOnly: true,                    // Set to true to close position
    });

    console.log(`Closed SOL-PERP position → tx ${closeSig}`);

    // const closeSig = await driftClient.closePosition(SOL_PERP_INDEX);
    // console.log(`Closed position          → tx ${closeSig}`);
  } catch (e) {
    console.log(e)
  }

  await driftClient.unsubscribe();

}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
