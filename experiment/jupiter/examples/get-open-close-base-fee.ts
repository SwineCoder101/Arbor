import { BN } from "@coral-xyz/anchor";
import {
  BPS_POWER,
  JUPITER_PERPETUALS_PROGRAM,
  USDC_DECIMALS,
} from "../constants";
import { BNToUSDRepresentation } from "../utils";
import { PublicKey } from "@solana/web3.js";

export async function getOpenCloseBaseFee(
  tradeSizeUsd: BN,
  custodyPubkey: PublicKey | string,
) {
  const custody =
    await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(custodyPubkey);

  const baseFeeBps = custody.increasePositionBps;
  // Use `decreasePositionBps` for close position or withdraw collateral trades
  // const baseFeeBps = custody.decreasePositionBps;

  const feeUsd = tradeSizeUsd.mul(baseFeeBps).div(BPS_POWER);

  console.log("Base fee ($): ", BNToUSDRepresentation(feeUsd, USDC_DECIMALS));
}
