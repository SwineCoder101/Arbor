import { Collection } from 'mongodb';
import { DriftPerpsDataService } from './driftPerpsData.js';
import { MongoService } from './mongoService.js';
import { BNConverter } from '../utils/bnConverter.js';

/**
 * Service for storing Drift perpetual market data in MongoDB
 */
export class DriftPerpStorageService {
  private collection: Collection;
  private driftPerpsService: DriftPerpsDataService;
  private readonly DEX_TYPE = 'drift';
  
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
        // Convert BN objects to MongoDB format
        const processedMarket = BNConverter.toMongoFormat(market);
        
        return {
          ...processedMarket,
          timestamp,
          dex: this.DEX_TYPE,
          pubKey: market.pubKey.toString() // Convert PublicKey to string for storage
        };
      });
      
      // Store the data with upsert
      if (forceInsert) {
        // Insert new records without updating existing ones
        await this.collection.insertMany(enrichedData);
        console.log(`Inserted ${enrichedData.length} new ${this.DEX_TYPE} perp market records`);
      } else {
        // Use updateMany with upsert to update existing records or insert new ones
        const bulkOps = enrichedData.map(market => ({
          updateOne: {
            filter: { ticker: market.ticker, dex: this.DEX_TYPE },
            update: { $set: market },
            upsert: true
          }
        }));
        
        const result = await this.collection.bulkWrite(bulkOps);
        console.log(`Updated/inserted ${this.DEX_TYPE} perp market records - modified: ${result.modifiedCount}, inserted: ${result.upsertedCount}`);
      }
      
      return enrichedData;
    } catch (error) {
      console.error(`Error storing ${this.DEX_TYPE} perp market data:`, error);
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
}
