import {
  JLP_POOL_ACCOUNT_PUBKEY,
  JUPITER_PERPETUALS_PROGRAM,
  RPC_CONNECTION,
  USDC_DECIMALS,
} from "../constants";
import { type IdlAccounts } from "@coral-xyz/anchor";
import { Perpetuals } from "../idl/jupiter-perpetuals-idl";
import { BNToUSDRepresentation } from "../utils";

// This function fetches the pool's AUM which is updated whenever:
// 1) Liquidity is added to the pool
// 2) Liquidity is removed from the pool
// 3) The `refresh_assets_under_management` instruction is called (which is refreshed constantly in a background job)
//
// The function also shows how to subscribe to the pool's account data change which lets you stream
// the AUM change in real time (useful for arbitraging the JLP, for example)
export async function getPoolAum() {
  const pool = await JUPITER_PERPETUALS_PROGRAM.account.pool.fetch(
    JLP_POOL_ACCOUNT_PUBKEY,
  );

  const poolAum = pool.aumUsd;

  console.log("Pool AUM ($):", BNToUSDRepresentation(poolAum, USDC_DECIMALS));

  RPC_CONNECTION.onProgramAccountChange(
    JUPITER_PERPETUALS_PROGRAM.programId,
    ({ accountId, accountInfo }) => {
      if (accountId.equals(JLP_POOL_ACCOUNT_PUBKEY)) {
        const pool = JUPITER_PERPETUALS_PROGRAM.coder.accounts.decode(
          "pool",
          accountInfo.data,
        ) as IdlAccounts<Perpetuals>["pool"];

        console.log(
          "Pool AUM: ($): ",
          BNToUSDRepresentation(pool.aumUsd, USDC_DECIMALS),
        );
      }
    },
  );

  return poolAum;
}
