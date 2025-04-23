import { BN, IdlAccounts } from "@coral-xyz/anchor";
import { JUPITER_PERPETUALS_PROGRAM, USDC_DECIMALS } from "../constants";
import { Perpetuals } from "../idl/jupiter-perpetuals-idl";
import { BNToUSDRepresentation } from "../utils";

function getPnlForSize(
  sizeUsdDelta: BN,
  positionAvgPrice: BN,
  positionSide: "long" | "short",
  tokenPrice: BN,
) {
  if (sizeUsdDelta.eqn(0)) return [false, new BN(0)];

  const hasProfit =
    positionSide === "long"
      ? tokenPrice.gt(positionAvgPrice)
      : positionAvgPrice.gt(tokenPrice);

  const tokenPriceDelta = tokenPrice.sub(positionAvgPrice).abs();

  const pnl = sizeUsdDelta.mul(tokenPriceDelta).div(positionAvgPrice);

  return [hasProfit, pnl];
}

export async function getGlobalShortUnrealizedPnl() {
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
  const openPositions = positions.filter(
    (position) =>
      position.account.sizeUsd.gtn(0) && position.account.side.short,
  );

  // NOTE: We assume the token price is $100 (scaled to 6 decimal places as per the USDC mint) as an example here for simplicity
  const tokenPrice = new BN(100_000_000);

  let totalPnl = new BN(0);

  openPositions.forEach((position) => {
    const [hasProfit, pnl] = getPnlForSize(
      position.account.sizeUsd,
      position.account.price,
      position.account.side.long ? "long" : "short",
      tokenPrice,
    );

    totalPnl = hasProfit ? totalPnl.add(pnl) : totalPnl.sub(pnl);
  });

  console.log(
    "Global short unrealized PNL ($)",
    BNToUSDRepresentation(totalPnl, USDC_DECIMALS),
  );
}

export async function getGlobalShortUnrealizedPnlEstimate() {
  const custodies = await JUPITER_PERPETUALS_PROGRAM.account.custody.all();

  let totalPnl = new BN(0);

  custodies.forEach((custody) => {
    // NOTE: We assume the token price is $100 (scaled to 6 decimal places as per the USDC mint) as an example here for simplicity
    const tokenPrice = new BN(100_000_000);
    const tokenPriceDelta = custody.account.assets.globalShortAveragePrices
      .sub(tokenPrice)
      .abs();

    totalPnl = totalPnl.add(
      custody.account.assets.globalShortSizes
        .mul(tokenPriceDelta)
        .div(custody.account.assets.globalShortAveragePrices),
    );
  });

  console.log(
    "Global short unrealized PNL estimate ($)",
    BNToUSDRepresentation(totalPnl, USDC_DECIMALS),
  );
}
