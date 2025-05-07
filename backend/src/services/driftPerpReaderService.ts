import { Collection } from 'mongodb';
import { MongoService } from './mongoService.js';
import { BN } from '@drift-labs/sdk';
import { BNConverter } from '../utils/bnConverter.js';

/**
 * Service for reading and processing stored Drift perpetual market data
 */
export class DriftPerpReaderService {
  private collection: Collection;
  private readonly DEFAULT_DEX = 'drift';
  
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
  async getLatestMarketData(dex = this.DEFAULT_DEX): Promise<any[]> {
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
  async getLatestMarketDataByTicker(ticker: string, dex = this.DEFAULT_DEX): Promise<any | null> {
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
  async getHistoricalMarketData(ticker: string, limit = 100, dex = this.DEFAULT_DEX): Promise<any[]> {
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
    // Use our utility to convert MongoDB format back to normal objects with BN instances
    return BNConverter.fromMongoFormat(result);
  }
  
  /**
   * Get funding rates for a specific market over time
   * @param ticker - Market ticker symbol
   * @param limit - Maximum number of records to return (default: 100)
   * @param dex - Optional DEX name to filter by (default: 'drift')
   * @returns Array of funding rate data points with timestamps
   */
  async getFundingRateHistory(ticker: string, limit = 100, dex = this.DEFAULT_DEX): Promise<any[]> {
    const results = await this.collection.find(
      { ticker, dex }
    ).sort({ timestamp: -1 }).limit(limit).toArray();
    
    // Process the results to handle BN objects
    const processedResults = this.processResults(results);
    
    // Extract only the fields we need
    return processedResults.map(result => ({
      ticker: result.ticker,
      dex: result.dex,
      timestamp: result.timestamp,
      fundingRate: result.fundingRate || new BN(0),
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
  async getTwapPriceHistory(ticker: string, limit = 100, dex = this.DEFAULT_DEX): Promise<any[]> {
    const results = await this.collection.find(
      { ticker, dex }
    ).sort({ timestamp: -1 }).limit(limit).toArray();
    
    // Process the results to handle BN objects
    const processedResults = this.processResults(results);
    
    // Extract only the fields we need
    return processedResults.map(result => ({
      ticker: result.ticker,
      dex: result.dex,
      timestamp: result.timestamp,
      twapPrice: result.twapPrice || new BN(0)
    }));
  }
}