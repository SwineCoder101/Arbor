import {
  JLP_POOL_ACCOUNT_PUBKEY,
  JUPITER_PERPETUALS_PROGRAM,
} from "../constants";

const compoundToAPY = (apr: number, frequency = 365) => {
  const apy = (Math.pow(apr / 100 / frequency + 1, frequency) - 1) * 100;
  return apy;
};

// This function fetches the `poolApr.feeAprBps` which is updated roughly once a week.
// The following documentation contains more info on how the pool APY / APR is calculated:
// https://station.jup.ag/guides/jlp/How-JLP-Works#jlp-fee-distribution-and-apr-calculation
export async function getPoolApy() {
  const pool = await JUPITER_PERPETUALS_PROGRAM.account.pool.fetch(
    JLP_POOL_ACCOUNT_PUBKEY,
  );

  const poolApr = pool.poolApr.feeAprBps.toNumber() / 100;

  console.log("Pool APR (%):", poolApr);
  console.log("Pool APY (%):", compoundToAPY(poolApr));
}
