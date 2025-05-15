import axios from 'axios';
import { Collection, Db } from 'mongodb';
import { MongoService } from './mongoService.js';

// Define interfaces for the Drift API responses
interface DriftContractData {
  contract_index: number;
  ticker_id: string;
  base_currency: string;
  quote_currency: string;
  last_price: string;
  base_volume: string;
  quote_volume: string;
  high: string;
  low: string;
  product_type: string;
  open_interest: string;
  index_price: string;
  index_name: string;
  index_currency: string;
  start_timestamp: string;
  end_timestamp: string;
  funding_rate: string;
  next_funding_rate: string;
  next_funding_rate_timestamp: string;
  symbol?: string; // Added for compatibility with existing code
  marketIndex?: number | string; // Added for compatibility with existing code
  [key: string]: any; // Allow additional properties
}

interface DriftFundingRateData {
  txSig: string;
  slot: number;
  ts: string;
  recordId: string;
  marketIndex: number;
  fundingRate: string;
  cumulativeFundingRateLong: string;
  cumulativeFundingRateShort: string;
  oraclePriceTwap: string;
  markPriceTwap: string;
  fundingRateLong?: string;
  fundingRateShort?: string;
  periodRevenue?: string;
  baseAssetAmountWithAmm?: string;
  baseAssetAmountWithUnsettledLp?: string;
  marketName?: string; // Added for our use
  [key: string]: any; // Allow additional properties
}

interface ProcessedFundingRateData extends DriftFundingRateData {
  fundingRateRaw?: string;
  fundingRatePct?: number;
  fundingRateApr?: number;
  timestamp: string;
  dex: string;
  marketName: string;
}

interface StorageOperationResult {
  success: boolean;
  message?: string;
  error?: string;
  count?: number;
  insertedCount?: number;
  matchedCount?: number;
  upsertedCount?: number;
  modifiedCount?: number;
}

interface FetchAndStoreAllResult {
  success: boolean;
  error?: string;
  message?: string;
  contracts?: StorageOperationResult;
  fundingRates?: Array<StorageOperationResult & { marketName: string }>;
}

/**
 * Service for fetching and storing data from Drift's external data API
 */
export class DriftFundingDataService {
  private db: Db | null;
  private baseUrl: string;
  private collection: Collection | null;

  constructor(db: Db | null = null) {
    this.db = db;
    this.baseUrl = process.env.DRIFT_API_URL || 'https://data.api.drift.trade';
    this.collection = db ? db.collection('drift_funding_data') : null;
    
    // If we don't have a DB passed in, try to get it from MongoService
    if (!this.collection) {
      try {
        this.collection = MongoService.getCollection('drift_funding_data');
      } catch (error) {
        console.error('Failed to get collection from MongoService:', error);
      }
    }
  }

  /**
   * Fetch funding rates for a specific market
   * @param marketName - The market name (e.g., "SOL-PERP")
   * @returns Funding rate data
   */
  async fetchFundingRates(marketName: string): Promise<DriftFundingRateData[]> {
    try {
      const url = `${this.baseUrl}/fundingRates?marketName=${encodeURIComponent(marketName)}`;
      const response = await axios.get<{ fundingRates: DriftFundingRateData[] }>(url, {
        timeout: 10000, // 10 second timeout
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'arbor-backend-service',
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Drift API returned status ${response.status}`);
      }
      
      return response.data?.fundingRates || [];
    } catch (error) {
      console.error(`Error fetching funding rates for ${marketName}:`, error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Fetch contracts data (all markets)
   * @returns Contract data for all markets
   */
  async fetchContracts(): Promise<DriftContractData[]> {
    try {
      const url = `${this.baseUrl}/contracts`;
      const response = await axios.get<{ contracts: DriftContractData[] }>(url, {
        timeout: 10000,
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'arbor-backend-service',
        }
      });
      
      if (response.status !== 200) {
        throw new Error(`Drift API returned status ${response.status}`);
      }
      
      return response.data?.contracts || [];
    } catch (error) {
      console.error('Error fetching contracts data:', error instanceof Error ? error.message : String(error));
      throw error;
    }
  }

  /**
   * Process funding rate data into a more usable format
   * Converts string values to appropriate types and calculates actual funding rate percentage
   * @param fundingRateData - Raw funding rate data from API
   * @returns Processed funding rate data
   */
  processFundingRateData(fundingRateData: DriftFundingRateData): ProcessedFundingRateData {
    try {
      // Convert strings to numbers where appropriate
      const processed = { ...fundingRateData } as ProcessedFundingRateData;
      
      // Extract market name from the data if available
      const marketName = processed.marketName || 'unknown';
      
      // Convert string values to numbers
      if (processed.fundingRate) processed.fundingRateRaw = processed.fundingRate;
      if (processed.fundingRate) {
        const fundingRateBigInt = BigInt(processed.fundingRate);
        const fundingRateNumber = Number(fundingRateBigInt) / 1e9;
        // Keep as string to match the interface
        processed.fundingRate = fundingRateNumber.toString();
      }
      
      if (processed.oraclePriceTwap) {
        const oracleTwapBigInt = BigInt(processed.oraclePriceTwap);
        const oracleTwapNumber = Number(oracleTwapBigInt) / 1e6;
        // Keep as string to match the interface
        processed.oraclePriceTwap = oracleTwapNumber.toString();
      }
      
      // Calculate funding rate percentage if possible
      if (processed.fundingRate && processed.oraclePriceTwap) {
        const fundingRateNum = parseFloat(processed.fundingRate);
        const oraclePriceNum = parseFloat(processed.oraclePriceTwap);
        
        if (oraclePriceNum > 0 && !isNaN(fundingRateNum) && !isNaN(oraclePriceNum)) {
          processed.fundingRatePct = fundingRateNum / oraclePriceNum;
          processed.fundingRateApr = processed.fundingRatePct * 24 * 365;
        }
      }
      
      // Add additional metadata
      processed.timestamp = new Date().toISOString();
      processed.dex = 'drift';
      processed.marketName = marketName;
      
      return processed;
    } catch (error) {
      console.error('Error processing funding rate data:', error);
      return {
        ...fundingRateData,
        timestamp: new Date().toISOString(),
        dex: 'drift',
        marketName: fundingRateData.marketName || 'unknown'
      };
    }
  }

  /**
   * Store funding rate data in the database
   * Uses the record ID as a unique key for upsert operations
   * @param fundingRates - Array of funding rate objects
   * @param marketName - The market name
   * @param forceInsert - If true, forces insertion (no upsert)
   * @returns Operation result
   */
  async storeFundingRates(
    fundingRates: DriftFundingRateData[], 
    marketName: string, 
    forceInsert = false
  ): Promise<StorageOperationResult> {
    if (!this.collection) {
      throw new Error('MongoDB collection not available');
    }
    
    try {
      if (!fundingRates || fundingRates.length === 0) {
        return { success: true, message: 'No funding rates to store', count: 0 };
      }
      
      // Process funding rates to convert string numbers and calculate percentages
      const processedRates = fundingRates.map(rate => this.processFundingRateData({
        ...rate,
        marketName
      }));
      
      let result;
      
      if (forceInsert) {
        // Force insert (for historical data)
        result = await this.collection.insertMany(processedRates);
        console.log(`Inserted ${result.insertedCount} funding rates for ${marketName}`);
        
        return {
          success: true,
          insertedCount: result.insertedCount,
          message: `Inserted ${result.insertedCount} funding rates for ${marketName}`
        };
      } else {
        // Upsert using bulk operations
        const bulkOps = processedRates.map(rate => ({
          updateOne: {
            filter: { recordId: rate.recordId, marketName },
            update: { $set: rate },
            upsert: true
          }
        }));
        
        result = await this.collection.bulkWrite(bulkOps);
        console.log(`Upserted funding rates for ${marketName} - matched: ${result.matchedCount}, upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}`);
        
        return {
          success: true,
          matchedCount: result.matchedCount,
          upsertedCount: result.upsertedCount,
          modifiedCount: result.modifiedCount,
          message: `Upserted funding rates for ${marketName}`
        };
      }
    } catch (error) {
      console.error(`Error storing funding rates for ${marketName}:`, error);
      throw error;
    }
  }

  /**
   * Store contracts data for all markets
   * @param contracts - Array of contract objects
   * @param forceInsert - If true, forces insertion (no upsert)
   * @returns Operation result
   */
  async storeContracts(
    contracts: DriftContractData[], 
    forceInsert = false
  ): Promise<StorageOperationResult> {
    if (!this.collection) {
      throw new Error('MongoDB collection not available');
    }
    
    try {
      if (!contracts || contracts.length === 0) {
        return { success: true, message: 'No contracts to store', count: 0 };
      }
      
      // Add timestamp and source info
      const timestamp = new Date().toISOString();
      const enrichedContracts = contracts.map(contract => ({
        ...contract,
        timestamp,
        dex: 'drift',
        dataType: 'contract',
        marketIndex: contract.contract_index // Ensure marketIndex exists for storage key
      }));
      
      let result;
      
      if (forceInsert) {
        // Force insert
        result = await this.collection.insertMany(enrichedContracts);
        console.log(`Inserted ${result.insertedCount} contracts`);
        
        return {
          success: true,
          insertedCount: result.insertedCount,
          message: `Inserted ${result.insertedCount} contracts`
        };
      } else {
        // Upsert using marketIndex as the key
        const bulkOps = enrichedContracts.map(contract => ({
          updateOne: {
            filter: { 
              marketIndex: contract.marketIndex, 
              dataType: 'contract' 
            },
            update: { $set: contract },
            upsert: true
          }
        }));
        
        result = await this.collection.bulkWrite(bulkOps);
        console.log(`Upserted contracts - matched: ${result.matchedCount}, upserted: ${result.upsertedCount}, modified: ${result.modifiedCount}`);
        
        return {
          success: true,
          matchedCount: result.matchedCount,
          upsertedCount: result.upsertedCount,
          modifiedCount: result.modifiedCount,
          message: 'Upserted contracts data'
        };
      }
    } catch (error) {
      console.error('Error storing contracts:', error);
      throw error;
    }
  }

  /**
   * Fetch and store funding rates for a specific market
   * @param marketName - The market name
   * @param forceInsert - If true, forces insertion (no upsert)
   * @returns Operation result
   */
  async fetchAndStoreFundingRates(
    marketName: string, 
    forceInsert = false
  ): Promise<StorageOperationResult> {
    try {
      const fundingRates = await this.fetchFundingRates(marketName);
      return await this.storeFundingRates(fundingRates, marketName, forceInsert);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error(`Error fetching and storing funding rates for ${marketName}:`, error);
      return {
        success: false,
        error: errorMessage,
        message: `Failed to fetch and store funding rates for ${marketName}`
      };
    }
  }

  /**
   * Fetch and store contracts data
   * @param forceInsert - If true, forces insertion (no upsert)
   * @returns Operation result
   */
  async fetchAndStoreContracts(forceInsert = false): Promise<StorageOperationResult> {
    try {
      const contracts = await this.fetchContracts();
      return await this.storeContracts(contracts, forceInsert);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching and storing contracts:', error);
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to fetch and store contracts'
      };
    }
  }

  /**
   * Fetch and store all available data (contracts and funding rates for each market)
   * @param forceInsert - If true, forces insertion (no upsert)
   * @returns Operation result
   */
  async fetchAndStoreAllData(forceInsert = false): Promise<FetchAndStoreAllResult> {
    try {
      // First fetch contracts to get market names
      const contracts = await this.fetchContracts();
      const contractsResult = await this.storeContracts(contracts, forceInsert);
      
      // Then fetch funding rates for each market
      const fundingResults: Array<StorageOperationResult & { marketName: string }> = [];
      
      for (const contract of contracts) {
        try {
          const marketName = contract.ticker_id;
          const result = await this.fetchAndStoreFundingRates(marketName, forceInsert);
          fundingResults.push({
            marketName,
            ...result
          });
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          console.error(`Error processing market ${contract.ticker_id}:`, error);
          fundingResults.push({
            marketName: contract.ticker_id,
            success: false,
            error: errorMessage
          });
        }
      }
      
      return {
        success: true,
        contracts: contractsResult,
        fundingRates: fundingResults
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      console.error('Error fetching and storing all data:', error);
      return {
        success: false,
        error: errorMessage,
        message: 'Failed to fetch and store all data'
      };
    }
  }

  /**
   * Get latest funding rates for all markets
   * @param limit - Maximum number of markets to return
   * @returns Array of latest funding rates by market
   */
  async getLatestFundingRates(limit = 100): Promise<ProcessedFundingRateData[]> {
    if (!this.collection) {
      throw new Error('MongoDB collection not available');
    }
    
    try {
      // Get latest funding rate for each market using aggregation
      const result = await this.collection.aggregate([
        { 
          $match: { 
            dex: 'drift',
            fundingRate: { $exists: true }
          } 
        },
        { $sort: { timestamp: -1 } },
        {
          $group: {
            _id: '$marketName',
            latestRate: { $first: '$$ROOT' }
          }
        },
        { $replaceRoot: { newRoot: '$latestRate' } },
        { $limit: limit }
      ]).toArray();
      
      // Cast the results to the expected type
      const latestRates = result as unknown as ProcessedFundingRateData[];
      
      return latestRates;
    } catch (error) {
      console.error('Error getting latest funding rates:', error);
      throw error;
    }
  }

  /**
   * Get latest funding rates for a specific market
   * @param marketName - The market name
   * @param limit - Maximum number of records to return
   * @returns Funding rate history for the market
   */
  async getFundingRateHistory(marketName: string, limit = 30): Promise<ProcessedFundingRateData[]> {
    if (!this.collection) {
      throw new Error('MongoDB collection not available');
    }
    
    try {
      const result = await this.collection.find({
        marketName,
        dex: 'drift',
        fundingRate: { $exists: true }
      })
      .sort({ timestamp: -1 })
      .limit(limit)
      .toArray();
      
      // Cast the results to the expected type
      const history = result as unknown as ProcessedFundingRateData[];
      
      return history;
    } catch (error) {
      console.error(`Error getting funding rate history for ${marketName}:`, error);
      throw error;
    }
  }

  /**
   * Get all available markets from stored contracts data
   * @returns Array of market data
   */
  async getAvailableMarkets(): Promise<DriftContractData[]> {
    if (!this.collection) {
      throw new Error('MongoDB collection not available');
    }
    
    try {
      const result = await this.collection.find({
        dex: 'drift',
        dataType: 'contract'
      })
      .sort({ marketIndex: 1 })
      .toArray();
      
      // Cast the results to the expected type
      const markets = result as unknown as DriftContractData[];
      
      return markets;
    } catch (error) {
      console.error('Error getting available markets:', error);
      throw error;
    }
  }
}

export default DriftFundingDataService;

