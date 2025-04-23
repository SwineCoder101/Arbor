import { BN } from "@coral-xyz/anchor";
import { JUPITER_PERPETUALS_PROGRAM, USDC_DECIMALS } from "../constants";
import { PublicKey } from "@solana/web3.js";
import { BNToUSDRepresentation } from "../utils";

// Note that the calculation below gets the position's PNL before fees
export async function getPositionPnl(positionPubkey: PublicKey) {
  const position =
    await JUPITER_PERPETUALS_PROGRAM.account.position.fetch(positionPubkey);

  // NOTE: We assume the token price is $100 (scaled to 6 decimal places as per the USDC mint) as an example here for simplicity
  const tokenPrice = new BN(100_000_000);

  const hasProfit = position.side.long
    ? tokenPrice.gt(position.price)
    : position.price.gt(tokenPrice);

  const tokenPriceDelta = tokenPrice.sub(position.price).abs();

  const pnl = position.sizeUsd.mul(tokenPriceDelta).div(position.price);

  console.log(
    "Position PNL ($): ",
    BNToUSDRepresentation(hasProfit ? pnl : pnl.neg(), USDC_DECIMALS),
  );
}
