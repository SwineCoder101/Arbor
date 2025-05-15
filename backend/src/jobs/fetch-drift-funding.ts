import { MongoClient, Db, Collection } from 'mongodb';
import axios from 'axios';
import * as dotenv from 'dotenv';
dotenv.config();
import { DriftFundingDataService } from '../services/drift-funding-data.service.js';

// Load environment variables
dotenv.config();

// Configuration
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
const DB_NAME = process.env.DB_NAME || 'arbor';
const DRIFT_API_URL = process.env.DRIFT_API_URL || 'https://data.api.drift.trade';

// Run interval in milliseconds (default: 15 minutes)
// Funding rates typically update hourly, so 15 minutes provides a good balance
const RUN_INTERVAL = parseInt(process.env.DRIFT_FUNDING_FETCH_INTERVAL || '900000', 10);

// Flag to determine if we want to force insert to create historical records
// This can be set to true via environment variable for certain intervals
const FORCE_INSERT = process.env.DRIFT_FUNDING_FORCE_INSERT === 'true';

/**
 * Main function to fetch and store Drift funding data
 */
export async function fetchAndStoreDriftFunding(): Promise<void> {
  let mongoClient: MongoClient | null = null;
  let cronRunning = false;

  try {
    console.log(`[${new Date().toISOString()}] Starting Drift funding data fetch job`);
    
    if (cronRunning) {
      console.log('Previous job still running, skipping this run');
      return;
    }
    
    cronRunning = true;
    
    // Connect to MongoDB
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const db = mongoClient.db(DB_NAME);
    const driftFundingService = new DriftFundingDataService(db);
    
    // Fetch and store contracts data
    console.log(`Fetching Drift funding data (force insert: ${FORCE_INSERT})`);
    
    // First get the contracts
    const contractsResult = await driftFundingService.fetchAndStoreContracts(FORCE_INSERT);
    
    if (!contractsResult.success) {
      throw new Error(`Failed to fetch contracts: ${contractsResult.error}`);
    }
    
    console.log(`Successfully processed contracts data: ${JSON.stringify({
      matched: contractsResult.matchedCount || 0,
      upserted: contractsResult.upsertedCount || 0,
      modified: contractsResult.modifiedCount || 0
    })}`);
    
    // Get all available markets
    const markets = await driftFundingService.getAvailableMarkets();
    console.log(`Found ${markets.length} markets, fetching funding rates for each`);
    
    const fundingResults: Array<any> = [];
    const failedMarkets: Array<string> = [];
    
    // Process each market
    for (const market of markets) {
      try {
        const marketName = market.ticker_id;
        if (!marketName) {
          console.warn(`Market missing ticker_id: ${JSON.stringify(market)}`);
          continue;
        }
        
        console.log(`Fetching funding rates for ${marketName}`);
        const result = await driftFundingService.fetchAndStoreFundingRates(marketName, FORCE_INSERT);
        
        fundingResults.push({
          marketName,
          success: result.success,
          matched: result.matchedCount || 0,
          upserted: result.upsertedCount || 0,
          modified: result.modifiedCount || 0
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Error processing market ${market.ticker_id}:`, error);
        failedMarkets.push(market.ticker_id);
      }
    }
    
    // Log summary
    const successCount = fundingResults.filter(r => r.success !== false).length;
    console.log(`Successfully processed funding rates for ${successCount}/${markets.length} markets`);
    
    if (failedMarkets.length > 0) {
      console.warn(`Failed to process funding rates for markets: ${failedMarkets.join(', ')}`);
    }
    
    console.log(`[${new Date().toISOString()}] Drift funding data fetch job completed`);
  } catch (error) {
    console.error(`[${new Date().toISOString()}] Error in Drift funding data fetch job:`, error);
  } finally {
    cronRunning = false;
    if (mongoClient) {
      await mongoClient.close();
      console.log('MongoDB connection closed');
    }
  }
}

/**
 * Run as a standalone script
 */
async function main(): Promise<void> {
  console.log("started")
  try {
    // Run once immediately
    await fetchAndStoreDriftFunding();
    
    // Schedule to run at the specified interval
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Scheduling to run every ${RUN_INTERVAL / 1000 / 60} minutes`);
      setInterval(fetchAndStoreDriftFunding, RUN_INTERVAL);
    }
  } catch (error) {
    console.error('Fatal error in Drift funding data job:', error);
    process.exit(1);
  }
}

// Run if directly executed (not imported)
// Note: This check works in ESM environment
// if (typeof require !== 'undefined' && require.main === module) {
  main().catch(console.error);
// }

// Export for use in other modules
export default fetchAndStoreDriftFunding;
