import { PublicKey } from "@solana/web3.js";
import { CUSTODY_PUBKEY, JUPITER_PERPETUALS_PROGRAM } from "../constants";

// The JLP pool has 5 tokens under custody (SOL, wBTC, wETH, USDC, USDT). Each of these tokens have a custody
// account onchain which contains data used by the Jupiter Perpetuals program, all of which is described here:
// https://station.jup.ag/guides/perpetual-exchange/onchain-accounts#custody-account
//
// This function shows how to fetch a custody account onchain with Anchor:
export async function getCustodyData() {
  try {
    const solCustodyData =
      await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(
        new PublicKey(CUSTODY_PUBKEY.SOL),
      );

    console.log("Custody data: ", solCustodyData);
  } catch (error) {
    console.error("Failed to parse Jupiter Perps IDL", error);
  }
}
