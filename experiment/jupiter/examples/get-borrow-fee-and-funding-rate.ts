import { PublicKey } from "@solana/web3.js";
import { BN } from "@coral-xyz/anchor";
import {
  BPS_POWER,
  JUPITER_PERPETUALS_PROGRAM,
  RATE_POWER,
  USDC_DECIMALS,
} from "../constants";
import { BNToUSDRepresentation, divCeil } from "../utils";
import { Custody } from "../types";

const HOURS_IN_A_YEAR = 24 * 365;

export const getBorrowFee = async (
  positionPubkey: PublicKey | string,
  curtime: BN,
) => {
  const position =
    await JUPITER_PERPETUALS_PROGRAM.account.position.fetch(positionPubkey);

  const custody = await JUPITER_PERPETUALS_PROGRAM.account.custody.fetch(
    position.custody,
  );

  if (position.sizeUsd.eqn(0)) return new BN(0);

  const cumulativeInterest = getCumulativeInterest(custody, curtime);
  const positionInterest = cumulativeInterest.sub(
    position.cumulativeInterestSnapshot,
  );

  const borrowFee = divCeil(positionInterest.mul(position.sizeUsd), RATE_POWER);

  console.log(
    "Outstanding borrow fee ($): ",
    BNToUSDRepresentation(borrowFee, USDC_DECIMALS),
  );
};

export const getCumulativeInterest = (custody: Custody, curtime: BN) => {
  if (curtime.gt(custody.fundingRateState.lastUpdate)) {
    const fundingRate = getFundingRate(custody, curtime);
    return custody.fundingRateState.cumulativeInterestRate.add(fundingRate);
  } else {
    return custody.fundingRateState.cumulativeInterestRate;
  }
};

export const getHourlyBorrowRate = (custody: Custody) => {
  const { minRateBps, maxRateBps, targetRateBps, targetUtilizationRate } =
    custody.jumpRateState;

  const utilizationRate =
    custody.assets.owned.gtn(0) && custody.assets.locked.gtn(0)
      ? custody.assets.locked.mul(RATE_POWER).div(custody.assets.owned)
      : new BN(0);

  let yearlyRate: BN;

  if (utilizationRate.lte(targetUtilizationRate)) {
    yearlyRate = targetRateBps
      .sub(minRateBps)
      .mul(utilizationRate)
      .div(targetUtilizationRate)
      .add(minRateBps)
      .mul(RATE_POWER)
      .div(BPS_POWER);
  } else {
    const rateDiff = maxRateBps.sub(targetRateBps);
    const utilDiff = utilizationRate.sub(targetUtilizationRate);
    const denom = RATE_POWER.sub(targetUtilizationRate);

    yearlyRate = rateDiff
      .mul(utilDiff)
      .div(denom)
      .add(targetRateBps)
      .mul(RATE_POWER)
      .div(BPS_POWER);
  }

  return yearlyRate.divn(HOURS_IN_A_YEAR);
};

export function getBorrowRatePct(custody: Custody): number {
  return (
    getHourlyBorrowRate(custody).muln(100).toNumber() / RATE_POWER.toNumber()
  );
}

export const getFundingRate = (custody: Custody, curtime: BN) => {
  if (custody.assets.owned.eqn(0)) return new BN(0);

  const interval = curtime.sub(custody.fundingRateState.lastUpdate);
  const currentFundingRate = getHourlyBorrowRate(custody);

  return divCeil(currentFundingRate.mul(interval), new BN(3600));
};
