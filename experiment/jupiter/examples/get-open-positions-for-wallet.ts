import { PublicKey } from "@solana/web3.js";
import { type IdlAccounts } from "@coral-xyz/anchor";
import { Perpetuals } from "../idl/jupiter-perpetuals-idl";
import { JUPITER_PERPETUALS_PROGRAM, RPC_CONNECTION } from "../constants";

// This function fetches all the open positions for a given wallet address, similar to `getOpenPositions`.
export async function getOpenPositionsForWallet(walletAddress: string) {
  try {
    const gpaResult = await RPC_CONNECTION.getProgramAccounts(
      JUPITER_PERPETUALS_PROGRAM.programId,
      {
        commitment: "confirmed",
        filters: [
          // Pass in a wallet address here to filter for positions for
          // a specific wallet address
          {
            memcmp: {
              bytes: new PublicKey(walletAddress).toBase58(),
              offset: 8,
            },
          },
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
    // Remove this filter to retrieve closed positions as well
    const openPositions = positions.filter((position) =>
      position.account.sizeUsd.gtn(0),
    );

    console.log(
      `Open positions for wallet address ${walletAddress}: `,
      openPositions,
    );

    // This `onProgramAccountChange` call subscribes to position changes for the wallet address, which is the same
    // as the logic above but via streaming instead of polling.
    RPC_CONNECTION.onProgramAccountChange(
      JUPITER_PERPETUALS_PROGRAM.programId,
      async ({
        accountId: positionPubkey,
        accountInfo: { data: positionBuffer },
      }) => {
        try {
          const position = JUPITER_PERPETUALS_PROGRAM.coder.accounts.decode(
            "position",
            positionBuffer,
          ) as IdlAccounts<Perpetuals>["position"];

          console.log("Position updated:", positionPubkey.toString());
        } catch (err) {
          console.error(
            `Failed to decode position ${positionPubkey.toString()}`,
            err,
          );
        }
      },
      {
        commitment: "confirmed",
        filters: [
          {
            memcmp: {
              bytes: new PublicKey(walletAddress).toBase58(),
              offset: 8,
            },
          },
          {
            memcmp:
              JUPITER_PERPETUALS_PROGRAM.coder.accounts.memcmp("position"),
          },
        ],
      },
    );
  } catch (error) {
    console.error(
      `Failed to fetch open positions for wallet address ${walletAddress}`,
      error,
    );
  }
}
