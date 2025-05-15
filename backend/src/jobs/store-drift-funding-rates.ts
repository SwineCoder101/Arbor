import * as dotenv from 'dotenv';
import { MongoClient } from 'mongodb';
import { DriftFundingRatesStorageService } from '../services/drift-funding-rates-storage.service.js';
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

// Flag to create historical snapshots at specific intervals (e.g., daily)
// Set this to true to create a new set of records instead of updating existing ones
const CREATE_HISTORICAL_SNAPSHOT = process.env.DRIFT_FUNDING_HISTORICAL_SNAPSHOT === 'true';

/**
 * Main function to store Drift funding rate data
 */
export async function storeDriftFundingRates(): Promise<void> {
  let mongoClient: MongoClient | null = null;
  let isRunning = false;

  try {
    console.log(`[${new Date().toISOString()}] Starting Drift funding rates storage job`);
    
    if (isRunning) {
      console.log('Previous job still running, skipping this run');
      return;
    }
    
    isRunning = true;
    
    // Connect to MongoDB
    mongoClient = new MongoClient(MONGO_URI);
    await mongoClient.connect();
    console.log('Connected to MongoDB');
    
    const db = mongoClient.db(DB_NAME);
    
    // Initialize services
    const driftFundingDataService = new DriftFundingDataService(db);
    const storageService = new DriftFundingRatesStorageService(driftFundingDataService);
    
    // Ensure indexes exist for optimized queries
    await storageService.ensureIndexes();
    
    let result;
    
    // Determine if we should create a historical snapshot or update existing data
    if (CREATE_HISTORICAL_SNAPSHOT) {
      console.log('Creating historical snapshot of funding rates...');
      result = await storageService.createHistoricalSnapshot();
    } else {
      console.log(`Storing funding rates (force insert: ${FORCE_INSERT})...`);
      result = await storageService.storeFundingRatesForAllMarkets(FORCE_INSERT);
    }
    
    // Log results
    if (result.success) {
      console.log('Contracts storage result:', {
        matched: result.contracts.matchedCount || 0,
        upserted: result.contracts.upsertedCount || 0,
        inserted: result.contracts.insertedCount || 0
      });
      
      const successfulMarkets = result.markets.filter(m => m.success).length;
      const failedMarkets = result.markets.filter(m => !m.success).length;
      
      console.log(`Successfully processed ${successfulMarkets} markets, failed: ${failedMarkets}`);
      
      if (failedMarkets > 0) {
        console.warn('Failed markets:');
        result.markets
          .filter(m => !m.success)
          .forEach(m => console.warn(`- ${m.message}: ${m.error}`));
      }
    } else {
      console.error('Failed to store funding rates:', result.contracts.error);
    }
    
    console.log(`[${new Date().toISOString()}] Drift funding rates storage job completed`);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error(`[${new Date().toISOString()}] Error in Drift funding rates storage job:`, errorMessage);
  } finally {
    isRunning = false;
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
  try {
    // Run once immediately
    await storeDriftFundingRates();
    
    // Schedule to run at the specified interval
    if (process.env.NODE_ENV !== 'test') {
      console.log(`Scheduling to run every ${RUN_INTERVAL / 1000 / 60} minutes`);
      setInterval(storeDriftFundingRates, RUN_INTERVAL);
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    console.error('Fatal error in Drift funding rates storage job:', errorMessage);
    process.exit(1);
  }
}

// Run if directly executed (not imported)
if (typeof require !== 'undefined' && require.main === module) {
  main().catch(error => {
    console.error('Unhandled error in main:', error);
    process.exit(1);
  });
}

// Export for use in other modules
export default storeDriftFundingRates;