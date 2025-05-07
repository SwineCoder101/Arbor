import { Collection } from 'mongodb';
import { MongoService } from './mongoService.js';
import { BN } from '@drift-labs/sdk';

/**
 * Service for reading and processing stored Drift perpetual market data
 */
export class DriftPerpReaderService {
  private collection: Collection;
  
  /**
   * Initialize the Drift Perp Reader Service
   */
  constructor() {
    this.collection = MongoService.getCollection('market_data');
  }
  
  /**
   * Get the most recent market data for all markets
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Array of market data with properly restored number types
   */
  async getLatestMarketData(dex = 'drift'): Promise<any[]> {
    // Get the latest record for each ticker by sorting by timestamp in descending order
    const pipeline = [
      { $match: { dex } },
      { $sort: { timestamp: -1 } },
      { $group: { _id: { ticker: "$ticker", dex: "$dex" }, latestDoc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latestDoc" } }
    ];
    
    const results = await this.collection.aggregate(pipeline).toArray();
    return this.processResults(results);
  }
  
  /**
   * Get the most recent market data for a specific ticker
   * @param ticker - Market ticker symbol
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Latest market data for the specified ticker with properly restored number types
   */
  async getLatestMarketDataByTicker(ticker: string, dex = 'drift'): Promise<any | null> {
    const result = await this.collection.findOne(
      { ticker, dex },
      { sort: { timestamp: -1 } }
    );
    
    if (!result) {
      return null;
    }
    
    return this.processResult(result);
  }
  
  /**
   * Get historical market data for a specific ticker
   * @param ticker - Market ticker symbol
   * @param limit - Maximum number of records to return (default: 100)
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Array of historical market data with properly restored number types
   */
  async getHistoricalMarketData(ticker: string, limit = 100, dex = 'drift'): Promise<any[]> {
    const results = await this.collection.find(
      { ticker, dex }
    ).sort({ timestamp: -1 }).limit(limit).toArray();
    
    return this.processResults(results);
  }
  
  /**
   * Get all available markets with their latest data
   * @returns Map of tickers to markets, with data from all available DEXes
   */
  async getAllMarkets(): Promise<Map<string, any[]>> {
    const pipeline = [
      { $sort: { timestamp: -1 } },
      { $group: { _id: { ticker: "$ticker", dex: "$dex" }, latestDoc: { $first: "$$ROOT" } } },
      { $replaceRoot: { newRoot: "$latestDoc" } }
    ];
    
    const results = await this.collection.aggregate(pipeline).toArray();
    const processedResults = this.processResults(results);
    
    // Group by ticker
    const marketsMap = new Map<string, any[]>();
    
    for (const market of processedResults) {
      const ticker = market.ticker;
      if (!marketsMap.has(ticker)) {
        marketsMap.set(ticker, []);
      }
      marketsMap.get(ticker)?.push(market);
    }
    
    return marketsMap;
  }
  
  /**
   * Process an array of market data results to restore proper number types
   * @param results - Array of market data records from MongoDB
   * @returns Processed market data with restored number types
   */
  private processResults(results: any[]): any[] {
    return results.map(result => this.processResult(result));
  }
  
  /**
   * Process a single market data result to restore proper number types
   * @param result - Market data record from MongoDB
   * @returns Processed market data with restored number types
   */
  private processResult(result: any): any {
    const processed = { ...result };
    
    // Convert string number representations back to BN objects
    // Handle fundingRate
    if (typeof processed.fundingRate === 'string') {
      processed.fundingRate = new BN(processed.fundingRate);
    }
    
    // Handle twapPrice
    if (typeof processed.twapPrice === 'string') {
      processed.twapPrice = new BN(processed.twapPrice);
    }
    
    // Handle AMM fields - these might be nested objects with number strings
    if (processed.amm) {
      // Convert baseAssetReserve
      if (typeof processed.amm.baseAssetReserve === 'string') {
        processed.amm.baseAssetReserve = new BN(processed.amm.baseAssetReserve);
      }
      
      // Convert quoteAssetReserve
      if (typeof processed.amm.quoteAssetReserve === 'string') {
        processed.amm.quoteAssetReserve = new BN(processed.amm.quoteAssetReserve);
      }
      
      // Convert lastFundingRate
      if (typeof processed.amm.lastFundingRate === 'string') {
        processed.amm.lastFundingRate = new BN(processed.amm.lastFundingRate);
      }
      
      // Convert historical oracle data fields
      if (processed.amm.historicalOracleData) {
        if (typeof processed.amm.historicalOracleData.lastOraclePriceTwap5Min === 'string') {
          processed.amm.historicalOracleData.lastOraclePriceTwap5Min = 
            new BN(processed.amm.historicalOracleData.lastOraclePriceTwap5Min);
        }
        
        if (typeof processed.amm.historicalOracleData.lastOraclePriceTwap1Min === 'string') {
          processed.amm.historicalOracleData.lastOraclePriceTwap1Min = 
            new BN(processed.amm.historicalOracleData.lastOraclePriceTwap1Min);
        }
      }
    }
    
    // Handle oracleData if present
    if (processed.oracleData) {
      if (typeof processed.oracleData.price === 'string') {
        processed.oracleData.price = new BN(processed.oracleData.price);
      }
      
      if (typeof processed.oracleData.twap === 'string') {
        processed.oracleData.twap = new BN(processed.oracleData.twap);
      }
    }
    
    return processed;
  }
  
  /**
   * Get funding rates for a specific market over time
   * @param ticker - Market ticker symbol
   * @param limit - Maximum number of records to return (default: 100)
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Array of funding rate data points with timestamps
   */
  async getFundingRateHistory(ticker: string, limit = 100, dex = 'drift'): Promise<any[]> {
    const results = await this.collection.find(
      { ticker, dex }
    ).sort({ timestamp: -1 }).limit(limit).toArray();
    
    return results.map(result => ({
      ticker: result.ticker,
      dex: result.dex,
      timestamp: result.timestamp,
      fundingRate: new BN(result.fundingRate || "0"),
      lastFundingRateTs: result.lastFundingRateTs
    }));
  }
  
  /**
   * Get TWAP prices for a specific market over time
   * @param ticker - Market ticker symbol
   * @param limit - Maximum number of records to return (default: 100)
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Array of TWAP price data points with timestamps
   */
  async getTwapPriceHistory(ticker: string, limit = 100, dex = 'drift'): Promise<any[]> {
    const results = await this.collection.find(
      { ticker, dex }
    ).sort({ timestamp: -1 }).limit(limit).toArray();
    
    return results.map(result => ({
      ticker: result.ticker,
      dex: result.dex,
      timestamp: result.timestamp,
      twapPrice: new BN(result.twapPrice || "0")
    }));
  }
}