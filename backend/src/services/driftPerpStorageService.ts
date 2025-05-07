import { Collection } from 'mongodb';
import { DriftPerpsDataService } from './driftPerpsData.js';
import { MongoService } from './mongoService.js';
import { BN } from '@drift-labs/sdk';

/**
 * Service for storing Drift perpetual market data in MongoDB
 */
export class DriftPerpStorageService {
  private collection: Collection;
  private driftPerpsService: DriftPerpsDataService;
  
  /**
   * Initialize the Drift Perp Storage Service
   * @param driftPerpsService - Initialized Drift Perps Data Service
   */
  constructor(driftPerpsService: DriftPerpsDataService) {
    this.driftPerpsService = driftPerpsService;
    this.collection = MongoService.getCollection('market_data');
  }
  
  /**
   * Store current perp market data in the database
   * @param forceInsert - If true, forces insertion of new records regardless of existing data
   * @returns Array of stored market data items
   */
  async storePerpMarketData(forceInsert = false): Promise<any[]> {
    try {
      // Get perp market details from Drift
      const marketDetails = await this.driftPerpsService.getPerpMarketsDetails();
      
      if (!marketDetails.length) {
        throw new Error('No market data retrieved from Drift');
      }
      
      // Add timestamp and DEX identifier to each record and prepare for MongoDB storage
      const timestamp = new Date();
      const enrichedData = marketDetails.map(market => {
        // Process the market data for storage
        const processedMarket = this.prepareForStorage(market);
        
        return {
          ...processedMarket,
          timestamp,
          dex: 'drift', // Add DEX identifier
          pubKey: market.pubKey.toString() // Convert PublicKey to string for storage
        };
      });
      
      // Store the data with upsert
      if (forceInsert) {
        // Insert new records without updating existing ones
        await this.collection.insertMany(enrichedData);
        console.log(`Inserted ${enrichedData.length} new drift perp market records`);
      } else {
        // Use updateMany with upsert to update existing records or insert new ones
        const bulkOps = enrichedData.map(market => ({
          updateOne: {
            filter: { ticker: market.ticker, dex: 'drift' },
            update: { $set: market },
            upsert: true
          }
        }));
        
        const result = await this.collection.bulkWrite(bulkOps);
        console.log(`Updated/inserted drift perp market records - modified: ${result.modifiedCount}, inserted: ${result.upsertedCount}`);
      }
      
      return enrichedData;
    } catch (error) {
      console.error('Error storing drift perp market data:', error);
      throw error;
    }
  }
  
  /**
   * Store market data as a historical snapshot without updating existing records
   * @returns Array of stored market data items
   */
  async storeHistoricalSnapshot(): Promise<any[]> {
    return this.storePerpMarketData(true);
  }
  
  /**
   * Prepare market data for MongoDB storage by converting BN objects to strings
   * @param data - The market data object to process
   * @returns Processed data ready for MongoDB storage
   */
  private prepareForStorage(data: any): any {
    // Create a deep copy to avoid modifying the original
    const result = { ...data };
    
    // Convert fundingRate to string if it's a BN
    if (result.fundingRate instanceof BN) {
      result.fundingRate = result.fundingRate.toString();
    }
    
    // Convert twapPrice to string if it's a BN
    if (result.twapPrice instanceof BN) {
      result.twapPrice = result.twapPrice.toString();
    }
    
    // Process AMM data - these might be nested objects with BN instances
    if (result.amm) {
      result.amm = { ...result.amm };
      
      // Convert baseAssetReserve
      if (result.amm.baseAssetReserve instanceof BN) {
        result.amm.baseAssetReserve = result.amm.baseAssetReserve.toString();
      }
      
      // Convert quoteAssetReserve
      if (result.amm.quoteAssetReserve instanceof BN) {
        result.amm.quoteAssetReserve = result.amm.quoteAssetReserve.toString();
      }
      
      // Convert lastFundingRate
      if (result.amm.lastFundingRate instanceof BN) {
        result.amm.lastFundingRate = result.amm.lastFundingRate.toString();
      }
      
      // Convert historical oracle data fields
      if (result.amm.historicalOracleData) {
        result.amm.historicalOracleData = { ...result.amm.historicalOracleData };
        
        if (result.amm.historicalOracleData.lastOraclePriceTwap5Min instanceof BN) {
          result.amm.historicalOracleData.lastOraclePriceTwap5Min = 
            result.amm.historicalOracleData.lastOraclePriceTwap5Min.toString();
        }
        
        if (result.amm.historicalOracleData.lastOraclePriceTwap1Min instanceof BN) {
          result.amm.historicalOracleData.lastOraclePriceTwap1Min = 
            result.amm.historicalOracleData.lastOraclePriceTwap1Min.toString();
        }
      }
    }
    
    // Handle oracleData if present
    if (result.oracleData) {
      result.oracleData = { ...result.oracleData };
      
      if (result.oracleData.price instanceof BN) {
        result.oracleData.price = result.oracleData.price.toString();
      }
      
      if (result.oracleData.twap instanceof BN) {
        result.oracleData.twap = result.oracleData.twap.toString();
      }
    }
    
    return result;
  }
}