
import fs from "fs";
import { resolve } from "path";

export type InputPoolType = {
    address: string;
    owner: string;
    name: string | null;
    authorityAddress: string;
    reserves: InputReserveType[];
  };
  
export type InputReserveType = {
    address: string;
    liquidityAddress: string;
    cTokenMint: string;
    cTokenLiquidityAddress: string;
    pythOracle: string;
    switchboardOracle: string;
    mintAddress: string;
    liquidityFeeReceiverAddress: string;
  };

export class DevnetConfig 
{
  private data: any;

  constructor(jsonPath: string) {
    this.data = JSON.parse(fs.readFileSync(resolve(jsonPath), "utf8"));
  }

  /** The lending‐program ID on dev‑net */
  get programId(): string {
    return this.data.programID;
  }

  /** Return an InputPoolType by case‑insensitive name */
  getPool(name: string): InputPoolType {
    const raw = this.data.markets.find(
      (m: any) => m.name.toLowerCase() === name.toLowerCase()
    );
    if (!raw) throw new Error(`Pool '${name}' not found in config file`);

    return {
      address: raw.address,
      owner: this.programId,
      name: raw.name,
      authorityAddress: raw.authorityAddress,
      reserves: raw.reserves.map((r: any) => this.toReserve(r)),
    };
  }

  /** Return a specific reserve inside a pool by asset symbol */
  getReserve(poolName: string, symbol: string): InputReserveType {
    const pool = this.getPool(poolName);
    const res = pool.reserves.find((r) => this.assetOfReserve(r) === symbol);
    if (!res) {
      throw new Error(`Reserve '${symbol}' not present in pool '${poolName}'`);
    }
    return res;
  }

  /* ───────────── helpers ───────────── */

  /** Map raw JSON → InputReserveType expected by SDK */
  private toReserve(r: any): InputReserveType {
    const oracle = this.data.oracles.assets.find(
      (o: any) => o.asset === r.asset
    ) || { priceAddress: "", switchboardFeedAddress: "" };

    const asset = this.data.assets.find((a: any) => a.symbol === r.asset);

    return {
      address: r.address,
      liquidityAddress: r.liquidityAddress,
      cTokenMint: r.collateralMintAddress,
      cTokenLiquidityAddress: r.collateralSupplyAddress,
      pythOracle: oracle.priceAddress,
      switchboardOracle: oracle.switchboardFeedAddress,
      mintAddress: asset.mintAddress,
      liquidityFeeReceiverAddress: r.liquidityFeeReceiverAddress,
    };
  }

  /** Helper to look up the reserve’s human symbol */
  private assetOfReserve(reserve: InputReserveType): string {
    const asset = this.data.assets.find(
      (a: any) => a.mintAddress === reserve.mintAddress
    );
    return asset?.symbol ?? "UNKNOWN";
  }
}
