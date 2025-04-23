import { Connection, Keypair, PublicKey } from "@solana/web3.js";
import {
    SolendActionCore as SolendAction
} from "@solendprotocol/solend-sdk";

export const MAINNET_PROGRAM_ID = new PublicKey("So1endDq2YkqhipRh3WViPa8hdiSpxWy6z3Z6tMCpAo");
export const DEVNET_PROGRAM_ID = new PublicKey("ALend7Ketfx5bxh6ghsCDXAoDrhvEmsXT3cynB6aPLgx");



export async function sendAll(
    action: SolendAction,
    connection: Connection,
    user: Keypair
  ) {
    const vtx = await action.getVersionedTransaction(); // returns vtx[]
    await vtx.sign([user]);
    const txid = await connection.sendTransaction(vtx, { maxRetries: 5 });
    console.log("   ✅ - Transaction sent to network", txid);
  }