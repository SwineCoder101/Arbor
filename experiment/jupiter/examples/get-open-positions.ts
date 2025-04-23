import { type IdlAccounts } from "@coral-xyz/anchor";
import { Perpetuals } from "../idl/jupiter-perpetuals-idl";
import { JUPITER_PERPETUALS_PROGRAM } from "../constants";

// This function returns all open positions (i.e. `Position` accounts with `sizeUsd > 0`)
// Note that your RPC provider needs to enable `getProgramAccounts` for this to work. This
// also returns *a lot* of data so you also need to ensure your `fetch` implementation
// does not timeout before it returns the data.
//
// More info on the `Position` account here: https://station.jup.ag/guides/perpetual-exchange/onchain-accounts#position-account
export async function getOpenPositions() {
  try {
    const gpaResult =
      await JUPITER_PERPETUALS_PROGRAM.provider.connection.getProgramAccounts(
        JUPITER_PERPETUALS_PROGRAM.programId,
        {
          commitment: "confirmed",
          filters: [
            {
              memcmp:
                JUPITER_PERPETUALS_PROGRAM.coder.accounts.memcmp("position"),
            },
          ],
        },
      );

    const positions = gpaResult.map((item) => {
      return {
        publicKey: item.pubkey,
        account: JUPITER_PERPETUALS_PROGRAM.coder.accounts.decode(
          "position",
          item.account.data,
        ) as IdlAccounts<Perpetuals>["position"],
      };
    });

    // Old positions accounts are not closed, but have `sizeUsd = 0`
    // i.e. open positions have a non-zero `sizeUsd`
    const openPositions = positions.filter((position) =>
      position.account.sizeUsd.gtn(0),
    );

    console.log("Open positions: ", openPositions);
  } catch (error) {
    console.error("Failed to fetch open positions", error);
  }
}
