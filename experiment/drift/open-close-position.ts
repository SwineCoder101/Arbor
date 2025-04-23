import 'dotenv/config';
import fs from 'fs';
import { BN } from 'bn.js';
import { Connection, Keypair, PublicKey, Commitment } from '@solana/web3.js';
import { Wallet } from '@project-serum/anchor';
import {
  DriftClient,
  OrderType,
  PositionDirection,
} from '@drift-labs/sdk';

// ---------- helper to load the keypair ----------
function loadKeypair(path: string): Keypair {
  const secret = JSON.parse(fs.readFileSync(path, 'utf8'));
  return Keypair.fromSecretKey(new Uint8Array(secret));
}

async function main() {
  /*** 1. basic setup ***/
  const commitment: Commitment = 'confirmed';
  const connection = new Connection(process.env.RPC_ENDPOINT!, commitment);
  const keypair     = loadKeypair(process.env.KEYPAIR!);
  const wallet      = new Wallet(keypair);

  /*** 2. spin‑up the Drift client ***/
  const driftProgramId = new PublicKey(
    'dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH'
  );

  const driftClient = new DriftClient({
    connection,
    wallet,
    programID: driftProgramId,
    env: process.env.CLUSTER as 'devnet' | 'mainnet-beta',
    accountSubscription: { type: 'websocket' },
  });

  await driftClient.subscribe();          // loads markets, user account, etc.

  /*** 3. OPEN position – market order via `placeAndTakePerpOrder` ***/
  const SOL_PERP_INDEX = 0;               // SOL‑PERP is index 0 on Drift
  const baseAmount     = new BN(0.1 * 1e9);   // 0.1 SOL in base precision

  const openSig = await driftClient.placeAndTakePerpOrder({
    marketIndex: SOL_PERP_INDEX,
    direction:   PositionDirection.LONG,
    baseAssetAmount: baseAmount,
    orderType: OrderType.MARKET,
    reduceOnly: false,
  });
  console.log(`Opened 0.1 SOL‑PERP long → tx ${openSig}`);

  /*** 4. wait a few blocks (simple demo‑delay) ***/
  await new Promise((r) => setTimeout(r, 6000));

  /*** 5. CLOSE position – convenient helper (market order in opposite dir.) ***/
  const closeSig = await driftClient.closePosition(SOL_PERP_INDEX);
  console.log(`Closed position          → tx ${closeSig}`);

  await driftClient.unsubscribe();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});