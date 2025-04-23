import { BN } from "@coral-xyz/anchor";
import { getMint } from "@solana/spl-token";
import { getPoolAum } from "./get-pool-aum";
import { JLP_MINT_PUBKEY, RPC_CONNECTION, USDC_DECIMALS } from "../constants";
import { BNToUSDRepresentation } from "../utils";

export async function getJlpVirtualPrice() {
  const poolAum = await getPoolAum();

  const jlpMint = await getMint(RPC_CONNECTION, JLP_MINT_PUBKEY, "confirmed");

  const jlpVirtualPrice = poolAum
    // Give some buffer to the numerator so that we don't get a quotient that is large enough to give us precision for the JLP virtual price
    .muln(Math.pow(10, USDC_DECIMALS))
    .div(new BN(jlpMint.supply));

  console.log(
    "JLP virtual price ($): ",
    // We want to show 4 decimal places for the JLP virtual price for precision
    BNToUSDRepresentation(jlpVirtualPrice, USDC_DECIMALS, 4),
  );
}

getJlpVirtualPrice();
