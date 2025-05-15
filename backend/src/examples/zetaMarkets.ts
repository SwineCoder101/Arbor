import dotenv from 'dotenv';
import { 
  constants, 
  Exchange, 
  utils, 
  types,
  assets,
  Decimal
} from '@zetamarkets/sdk';
import { ZetaClientFactory } from '../services/zetaClientFactory.js';

const { Asset } = constants;

// Load environment variables
dotenv.config();

/**
 * Example demonstrating how to use the Zeta Markets SDK via our ZetaClientFactory
 */
async function main() {
  console.log("Environment variables check:");
  console.log("RPC_ENDPOINT:", process.env.RPC_ENDPOINT);
  console.log("KEYPAIR:", process.env.KEYPAIR);
  console.log("CLUSTER:", process.env.CLUSTER);
  console.log("SERVER_URL:", process.env.SERVER_URL);

  // Validate environment variables
  if (!process.env.RPC_ENDPOINT || !process.env.KEYPAIR || !process.env.CLUSTER) {
    console.error('Missing required environment variables: RPC_ENDPOINT, KEYPAIR, and CLUSTER must be set');
    process.exit(1);
  }

  if (process.env.CLUSTER !== 'devnet' && process.env.CLUSTER !== 'mainnet-beta') {
    console.error('CLUSTER environment variable must be either "devnet" or "mainnet-beta"');
    process.exit(1);
  }

  try {
    // Initialize Zeta Markets client from environment variables
    const crossClient = await ZetaClientFactory.initializeFromEnv(
      process.env.RPC_ENDPOINT,
      process.env.KEYPAIR,
      process.env.CLUSTER as 'devnet' | 'mainnet-beta',
      process.env.SERVER_URL
    );

    console.log("Successfully initialized Zeta Markets CrossClient!");
    
    // Get account state
    const accountState = crossClient.getAccountState();
    console.log("Account State:", accountState);
    
    // Display balance
    if (crossClient.account) {
      console.log(`Balance: ${crossClient.account.balance.toNumber() / 1_000_000} USDC`);
    }
    
    // Display available assets
    console.log('\nAvailable assets on Zeta:');
    Object.values(Asset)
      .filter(asset => typeof asset === 'number')
      .forEach(asset => {
        console.log(`- ${Asset[asset as number]}`);
      });
    
    // Get market data for specific assets
    const assetsToCheck = [Asset.SOL, Asset.BTC, Asset.ETH];
    
    for (const asset of assetsToCheck) {
      console.log(`\n--------- ${Asset[asset]} Market Data ---------`);
      
      // Get and display orderbook
      console.log('\nOrderbook:');
      const orderbook = Exchange.getOrderbook(asset);
      console.log('Bids (top 5):');
      if (orderbook.bids.length > 0) {
        orderbook.bids.slice(0, 5).forEach(bid => {
          console.log(`  Price: $${bid.price.toFixed(3)}, Size: ${bid.size}`);
        });
      } else {
        console.log('  No bids available');
      }
      
      console.log('Asks (top 5):');
      if (orderbook.asks.length > 0) {
        orderbook.asks.slice(0, 5).forEach(ask => {
          console.log(`  Price: $${ask.price.toFixed(3)}, Size: ${ask.size}`);
        });
      } else {
        console.log('  No asks available');
      }
      
      // Get and display mark price
      const markPrice = Exchange.getMarkPrice(asset);
      console.log(`\nMark Price: $${markPrice !== undefined ? markPrice.toFixed(4) : 'N/A'}`);
      
      // Get and display oracle price
      try {
        const oraclePrice = Exchange.oracle.getPrice(asset);
        console.log(`Oracle Price: $${oraclePrice.toFixed(4)}`);
      } catch (error) {
        console.log('Oracle Price: Not available');
      }
      
      // Get and display funding rate information
      try {
        const pricing = Exchange.pricing;
        const fundingRate = Decimal.fromAnchorDecimal(
          pricing.latestFundingRates[assets.assetToIndex(asset)]
        ).toNumber();
        console.log(`Daily Funding Rate: ${(fundingRate * 100).toFixed(4)}%`);
      } catch (error) {
        console.log('Funding Rate: Not available');
      }
      
      // Get perp market for this asset
      try {
        const perpMarket = Exchange.getPerpMarket(asset);
        console.log(`\nPerp Market Address: ${perpMarket.address.toString()}`);
      } catch (error) {
        console.log('Perp Market Address: Not available');
      }
      
      // Display positions and orders if any
      const positions = crossClient.getPositions(asset);
      if (positions.length > 0) {
        console.log('\nPositions:');
        positions.forEach(position => {
          console.log(`  Market Index: ${position.marketIndex}`);
          console.log(`  Position Size: ${position.position}`);
          console.log(`  Cost of Trades: $${position.costOfTrades}`);
        });
      } else {
        console.log('\nPositions: None');
      }
      
      const orders = crossClient.getOrders(asset);
      if (orders.length > 0) {
        console.log('\nOrders:');
        orders.forEach(order => {
          console.log(`  Market Index: ${order.marketIndex}`);
          console.log(`  Price: $${order.price}`);
          console.log(`  Size: ${order.size}`);
          console.log(`  Side: ${order.side === 0 ? 'BID' : 'ASK'}`);
        });
      } else {
        console.log('\nOrders: None');
      }
    }

    // Get margin account risk state
    try {
      const marginAccountState = Exchange.riskCalculator.getCrossMarginAccountState(
        crossClient.account
      );
      console.log('\n--------- Account Risk State ---------');
      console.log(`Balance: $${marginAccountState.balance}`);
      console.log(`Initial Margin: $${marginAccountState.initialMargin}`);
      console.log(`Maintenance Margin: $${marginAccountState.maintenanceMargin}`);
      console.log(`Unrealized PnL: $${marginAccountState.unrealizedPnl}`);
      console.log(`Unpaid Funding: $${marginAccountState.unpaidFunding}`);
      console.log(`Withdrawable Balance: $${marginAccountState.availableBalanceWithdrawable}`);
    } catch (error) {
      console.log('\nAccount Risk State: Not available');
    }
    
    // Clean up by closing the client
    await crossClient.close();
    await Exchange.close();
    console.log("\nClosed all connections");
    
  } catch (error) {
    console.error("Error in Zeta Markets example:", error);
  }
}

// Execute main function
main()
  .then(() => {
    console.log("Example completed successfully");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Example failed with error:", error);
    process.exit(1);
  });