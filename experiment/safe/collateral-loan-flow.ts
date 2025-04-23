/**
 * collateral-flow.ts
 * ------------------
 * A self‑contained demo of collateral deposit / conventional loan on Solend‑Save
 * using the Devnet market definition that lives in `solend-devnet.json`.
 *
 * yarn add @solana/web3.js @solendprotocol/solend-sdk fs
 * ts-node collateral-flow.ts
 */

import {
    Connection,
    Keypair
} from "@solana/web3.js";
import {
    EnvironmentType,
    SolendActionCore as SolendAction,
} from "@solendprotocol/solend-sdk";


import wallet from "../dev-wallet.json";
import { DevnetConfig } from "./dto/devnet-config";
import { sendAll } from "./util";


(async () => {
  /* --- initialise dev‑net connection & wallet --- */
  const connection = new Connection("https://api.devnet.solana.com");
  const user = Keypair.fromSecretKey(new Uint8Array(wallet.privateKey));

  const cfg = new DevnetConfig("./solend-devnet.json");

  /* choose the pool & reserve you want to work with */
  const poolName = "main";  // or "TURBO SOL", etc.
  const collateralSymbol = "SOL";
  const debtSymbol = "USDC";

  const pool = cfg.getPool(poolName);
  const collateralReserve = cfg.getReserve(poolName, collateralSymbol);
  const debtReserve = cfg.getReserve(poolName, debtSymbol);

  /* a tiny ActionConfig with only the dev‑net flag turned on */
  const baseCfg = {
    environment: "devnet" as EnvironmentType,
    debug: true,
  };

  /* ---------------- 1. deposit 5 SOL collateral ---------------- */
  const deposit = await SolendAction.buildDepositTxns(
    pool,
    collateralReserve,
    connection,
    "5",                         // UI units
    { publicKey: user.publicKey },
    baseCfg
  );
  await sendAll(deposit, connection, user);
  console.log("✅  5 SOL deposited → cSOL minted");

  /* ---------------- 2. borrow 10 000 USDC ---------------------- */
  const borrow = await SolendAction.buildBorrowTxns(
    pool,
    debtReserve,
    connection,
    "10000",                     // UI units
    { publicKey: user.publicKey },
    baseCfg
  );
  await sendAll(borrow, connection, user);
  console.log("✅  Borrowed 10 000 USDC");

  /* -------- here you would hedge or do whatever you like -------- */

  /* ---------------- 3. repay full USDC loan -------------------- */
  const repay = await SolendAction.buildRepayTxns(
    pool,
    debtReserve,
    connection,
    "max",                       // repay everything
    { publicKey: user.publicKey },
    baseCfg
  );
  await sendAll(repay, connection, user);
  console.log("✅  Repaid USDC debt");

  /* ---------------- 4. withdraw all SOL collateral ------------- */
  const withdraw = await SolendAction.buildWithdrawTxns(
    pool,
    collateralReserve,
    connection,
    "max",                       // withdraw everything
    { publicKey: user.publicKey },
    baseCfg
  );
  await sendAll(withdraw, connection, user);
  console.log("✅  Withdrew collateral – cycle complete");
})();

