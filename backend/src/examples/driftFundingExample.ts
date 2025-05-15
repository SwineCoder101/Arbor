import dotenv from 'dotenv';
import path from 'path';
import { MongoService } from '../services/mongoService.js';
import DriftFundingDataService from '../services/driftFundingDataService.js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

/**
 * Example script for testing the Drift Funding Data Service
 */
async function main() {
  try {
    console.log('Initializing MongoDB connection...');
    await MongoService.connect();
    
    // Create the Drift Funding Data Service
    const fundingService = new DriftFundingDataService(MongoService.getDb());
    
    // Test fetching contracts data
    console.log('\n--- Fetching Contracts Data ---');
    const contracts = await fundingService.fetchContracts();
    console.log(`Fetched ${contracts.length} contracts from Drift API`);
    console.log('First few contracts:');
    console.log(contracts.slice(0, 3));

    // Get SOL-PERP market name for further tests
    const solPerpMarket = contracts.find((c) => c.ticker_id.includes('SOL-PERP'));
    const marketName = solPerpMarket?.ticker_id || 'SOL-PERP';
    
    // Test fetching funding rates for a specific market
    console.log('\n--- Fetching Funding Rates ---');
    console.log(`Fetching funding rates for ${marketName}...`);
    const fundingRates = await fundingService.fetchFundingRates(marketName);
    console.log(`Fetched ${fundingRates.length} funding rates for ${marketName}`);
    
    if (fundingRates.length > 0) {
      console.log('Sample funding rate data:');
      console.log(fundingRates[0]);
      
      // Test processing funding rate data
      console.log('\n--- Processing Funding Rate Data ---');
      const processedRate = fundingService.processFundingRateData({
        ...fundingRates[0],
        marketName
      });
      console.log('Processed funding rate:');
      console.log({
        marketName: processedRate.marketName,
        fundingRate: processedRate.fundingRate,
        fundingRateRaw: processedRate.fundingRateRaw,
        fundingRatePct: processedRate.fundingRatePct,
        fundingRateApr: processedRate.fundingRateApr,
        timestamp: processedRate.timestamp
      });
    }
    
    // Test storing contracts data
    console.log('\n--- Storing Contracts Data ---');
    const storeContractsResult = await fundingService.storeContracts(contracts);
    console.log('Store contracts result:', storeContractsResult);
    
    // Test storing funding rates
    if (fundingRates.length > 0) {
      console.log('\n--- Storing Funding Rates ---');
      const storeFundingResult = await fundingService.storeFundingRates(fundingRates, marketName);
      console.log('Store funding rates result:', storeFundingResult);
    }
    
    // Test fetching and storing in one operation
    console.log('\n--- Fetch and Store Funding Rates ---');
    const fetchStoreResult = await fundingService.fetchAndStoreFundingRates(marketName);
    console.log('Fetch and store result:', fetchStoreResult);
    
    // Test fetching all available markets from database
    console.log('\n--- Getting Available Markets ---');
    const availableMarkets = await fundingService.getAvailableMarkets();
    console.log(`Found ${availableMarkets.length} markets in the database`);
    console.log('First few markets:');
    console.log(availableMarkets.slice(0, 3).map(m => ({
      ticker_id: m.ticker_id,
      marketIndex: m.contract_index,
      base: m.base_currency,
      quote: m.quote_currency
    })));
    
    // Test getting latest funding rates for all markets
    console.log('\n--- Getting Latest Funding Rates ---');
    const latestRates = await fundingService.getLatestFundingRates(1000);
    console.log(`Retrieved ${latestRates.length} latest funding rates`);
    
    if (latestRates.length > 0) {
      console.log('Sample latest rates:');
      console.log(latestRates.slice(0, 3).map(rate => ({
        marketName: rate.marketName,
        fundingRate: rate.fundingRate,
        fundingRatePct: rate.fundingRatePct,
        fundingRateApr: rate.fundingRateApr,
        timestamp: rate.timestamp
      })));
    }
    
    // Test getting funding rate history for a specific market
    console.log('\n--- Getting Funding Rate History ---');
    const rateHistory = await fundingService.getFundingRateHistory(marketName, 1000);
    console.log(`Retrieved ${rateHistory.length} historical funding rates for ${marketName}`);
    
    if (rateHistory.length > 0) {
      console.log('Historical rates:');
      console.log(rateHistory.map(rate => ({
        marketName: rate.marketName,
        fundingRate: rate.fundingRate,
        fundingRatePct: rate.fundingRatePct,
        timestamp: rate.timestamp,
        slot: rate.slot
      })));
    }
    
    // Test the full fetch and store all data operation
    console.log('\n--- Fetching and Storing All Data ---');
    console.log('This may take a while as it fetches data for all markets...');
    const allDataResult = await fundingService.fetchAndStoreAllData();
    console.log('Fetch and store all data result:');
    console.log({
      success: allDataResult.success,
      contractsSuccess: allDataResult.contracts?.success,
      fundingRatesProcessed: allDataResult.fundingRates?.length
    });
    
    console.log('\nExample completed successfully!');
  } catch (error) {
    console.error('Error running example:', error);
  } finally {
    // Close the MongoDB connection
    await MongoService.disconnect();
  }
}

// Run the example
main().catch(console.error);
