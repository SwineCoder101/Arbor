import { DriftClientFactory } from '../services/driftClientFactory.js';
import { DriftPerpsDataService } from '../services/driftPerpsData.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function main() {
  console.log("ENV VARS: ", )
  console.log("RPCS_ENDPOINT: ", process.env.RPC_ENDPOINT)
  console.log("KEYPAIR: ", process.env.KEYPAIR)
  console.log("CLUSTER: ", process.env.CLUSTER)

  // Validate environment variables
  if (!process.env.RPC_ENDPOINT || !process.env.KEYPAIR || !process.env.CLUSTER) {
    console.error('Missing required environment variables: RPC_ENDPOINT, KEYPAIR, and CLUSTER must be set');
    process.exit(1);
  }

  if (process.env.CLUSTER !== 'devnet' && process.env.CLUSTER !== 'mainnet-beta') {
    console.error('CLUSTER environment variable must be either "devnet" or "mainnet-beta"');
    process.exit(1);
  }

  // Initialize the Drift client using factory
  const driftClient = DriftClientFactory.initializeFromEnv(
    process.env.RPC_ENDPOINT,
    process.env.KEYPAIR,
    process.env.CLUSTER as 'devnet' | 'mainnet-beta'
  );

  // Create the perps data service
  const driftPerpsService = new DriftPerpsDataService(driftClient);

  try {
    // Subscribe to the Drift program - loads markets, user account, etc.
    await driftClient.subscribe();

    // Check if user account exists, initialize if not
    const userPK = await driftPerpsService.checkUserExistsInitialiseIfNot();
    console.log('User account public key:', userPK.toString());

    // Get all perp markets with details
    const perpMarketsDetails = await driftPerpsService.getPerpMarketsDetails();
    
    // Display market details
    console.log('Perpetual Markets:');
    perpMarketsDetails.forEach((market, index) => {
      console.log('=================================================');
      console.log(`Market ${index + 1}: ${market.ticker}`);
      console.log(`Market Index: ${market.marketIndex}`);
      console.log(`Public Key: ${market.pubKey.toString()}`);
      console.log(`Funding Rate: ${market.fundingRate}`);
      console.log(`Last Funding Rate Timestamp: ${market.lastFundingRateTs}`);
      console.log(`TWAP Price (5min): ${market.twapPrice}`);
    });

    // Get user positions
    const userPositions = await driftPerpsService.getUserPerpPositions();
    
    if (userPositions.length > 0) {
      console.log('=================================================');
      console.log('User Perpetual Positions:');
      userPositions.forEach((position, index) => {
        console.log(`Position ${index + 1}: ${JSON.stringify(position)}`);
        console.log('-------------------------------------------------');
      });
    } else {
      console.log('=================================================');
      console.log('User has no active perpetual positions');
    }

  } catch (error) {
    console.error('Error occurred:', error);
  } finally {
    // Clean up by unsubscribing
    await driftPerpsService.cleanup();
  }
}

// Run the main function
main().catch((error) => {
  console.error('Uncaught error:', error);
  process.exit(1);
});
