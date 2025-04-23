import { BN } from "@coral-xyz/anchor";
import { PublicKey } from "@solana/web3.js";
import { BPS_POWER, JUPITER_PERPETUALS_PROGRAM } from "../constants";
import { divCeil } from "../utils";

export async function getPriceImpactFee(
  tradeSizeUsd: BN,
  custodyPubkey: PublicKey,
) {
  const custody =
    await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(custodyPubkey);

  const priceImpactFeeBps = divCeil(
    tradeSizeUsd.mul(BPS_POWER),
    custody.pricing.tradeImpactFeeScalar,
  );

  const priceImpactFeeUsd = tradeSizeUsd.mul(priceImpactFeeBps).div(BPS_POWER);

  console.log("Price impact fee ($): ", priceImpactFeeUsd);
}
