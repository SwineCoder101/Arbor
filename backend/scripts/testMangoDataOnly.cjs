/**
 * Test script to fetch Mango Markets perp data
 * This uses the actual Mango v4 SDK without mocks
 */
require('dotenv').config();
const { Connection, Keypair, PublicKey } = require('@solana/web3.js');
const { MangoClient, MANGO_V4_ID } = require('@blockworks-foundation/mango-v4');
const { AnchorProvider, Wallet } = require('@coral-xyz/anchor');
const fs = require("fs");

/**
 * Service for handling wallet operations
 */
class WalletService {
  /**
   * Load a keypair from a file path
   * @param keyPath - Path to the keypair file
   * @returns The loaded Keypair
   */
  static loadKeypair(keyPath){
    try {
      const keypairData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      return Keypair.fromSecretKey(new Uint8Array(keypairData));
    } catch (error) {
      console.error('Error loading keypair:', error);
      throw new Error(`Failed to load keypair from ${keyPath}`);
    }
  }

  /**
   * Create a wallet from a keypair
   * @param keypair - The keypair to create the wallet from
   * @returns A wallet instance
   */
  static createWalletFromKeypair(keypair){
    return new Wallet(keypair);
  }

  /**
   * Create a Solana connection
   * @param endpoint - RPC endpoint URL
   * @param commitment - Transaction commitment level
   * @returns Solana connection instance
   */
  static createConnection(endpoint, commitment = 'confirmed'){
    return new Connection(endpoint, commitment);
  }

  /**
   * Get the token address for a specific mint and owner
   * @param mintAddress - Mint address as string
   * @param ownerAddress - Owner address as string
   * @returns Promise resolving to the token address
   */
  static async getTokenAddress(mintAddress, ownerAddress) {
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    return getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(ownerAddress)
    );
  }

  /**
   * Initialize connection and wallet from environment variables
   * @param rpcEndpoint - RPC endpoint URL
   * @param keypairPath - Path to keypair file
   * @param commitment - Transaction commitment level
   * @returns Object containing connection and wallet
   */
  static initializeFromEnv(
    rpcEndpoint, 
    keypairPath, 
    commitment = 'confirmed'
  ) {
    const connection = this.createConnection(rpcEndpoint, commitment);
    const keypair = this.loadKeypair(keypairPath);
    const wallet = this.createWalletFromKeypair(keypair);
    
    return { connection, wallet };
  }
}


// Configuration
const RPC_ENDPOINT = process.env.RPC_ENDPOINT;
const CLUSTER = 'mainnet-beta';
const MANGO_GROUP_PK = '78b8f4cGCwmZ9ysPFMWLaLTkkaYnUjwMJYStWe5RTSSX';

// Set up options to reduce RPC load
const COMMITMENT_LEVEL = 'confirmed';
const PREFLIGHT_COMMITMENT = 'processed';

async function main() {
  try {
    console.log('Testing Mango Markets data fetching');
    console.log(`Using RPC endpoint: ${RPC_ENDPOINT}`);


    const { connection, wallet } = WalletService.initializeFromEnv(
      process.env.RPC_ENDPOINT ,
      process.env.KEYPAIR 
    );

    
    // // Set up connection with reduced preflight
    // const connection = new Connection(RPC_ENDPOINT, {
    //   commitment: COMMITMENT_LEVEL,
    //   confirmTransactionInitialTimeout: 60000,
    //   disableRetryOnRateLimit: true, // Disable auto-retry to avoid spamming the RPC
    // });
    // 
    // const wallet = new Wallet("id.json");
    const provider = new AnchorProvider(connection, wallet, {
      commitment: COMMITMENT_LEVEL,
      preflightCommitment: PREFLIGHT_COMMITMENT,
      skipPreflight: true, // Skip preflight to reduce RPC calls
    });
    
    // Connect to Mango client 
    const programId = MANGO_V4_ID[CLUSTER];

    console.log(`Using Mango program ID: ${programId.toString()}`);
    
    const client = MangoClient.connect(provider, CLUSTER, programId, {
      idsSource: 'get-program-accounts', // Use program accounts directly
      prioritizationFee: 1000, // Set a prioritization fee to help with rate limits
      fallbackOracleConfig: 'never', // Don't use fallback oracles to reduce RPC calls
    });
    
    console.log('Client connected');

    // const res = await client.getMangoAccount(new PublicKey(MANGO_GROUP_PK));
    // console.log(res)

   //  const res = await client.getGroupForCreator(new PublicKey("8SSLjXBEVk9nesbhi9UMCA32uijbVBUqWoKPPQPTekzt"), 0);
   //  console.log(res)

    // Get group
    console.log(`\nFetching Mango group: ${MANGO_GROUP_PK}`);
    console.log(`Found Mango group: ${group.publicKey.toString()}`);
    
    // // Fetch perp markets
    // console.log('\nFetching perp markets...');
    // const perpMarkets = await client.perpGetMarkets(group);
    // console.log(`Found ${perpMarkets.length} perp markets`);
    // 
    // // Display market names 
    // console.log('\nAvailable markets:');
    // perpMarkets.forEach((market, i) => {
    //   console.log(`${i+1}. ${market.name || 'Unnamed'} (Index: ${market.perpMarketIndex})`);
    // });
    // 
    // // Process and display data for first market only
    // if (perpMarkets.length > 0) {
    //   const market = perpMarkets[0];
    //   console.log(`\nDisplaying data for first market: ${market.name || market.perpMarketIndex}`);
    //   
    //   // Create market data object
    //   const marketData = {
    //     ticker: market.name,
    //     dex: 'mango',
    //     timestamp: new Date().toISOString(),
    //     pubKey: market.publicKey.toString(), 
    //     marketIndex: market.perpMarketIndex,
    //     
    //     // Market prices
    //     markPrice: market.uiPrice,
    //     fundingRate: market.fundingInfo?.rate?.toNumber() || null,
    //     lastFundingRateTs: market.fundingInfo?.lastUpdated?.toNumber() || null,
    //     
    //     // Market size
    //     baseAssetAmount: market.baseLotsToUi(market.openInterest),
    //     
    //     // Fees
    //     makerFee: market.makerFee.toNumber(),
    //     takerFee: market.takerFee.toNumber(),
    //     
    //     // Constraints
    //     minFunding: market.minFunding.toNumber(),
    //     maxFunding: market.maxFunding.toNumber(),
    //     impactQuantity: market.impactQuantity.toNumber(),
    //     
    //     // Oracle info
    //     oracle: market.oracle.toString(),
    //     oraclePrice: market.oracleCache?.price?.toNumber() || null,
    //     oracleConfidence: market.oracleCache?.confidence?.toNumber() || null,
    //     
    //     // Status
    //     status: market.reduceOnly ? 'reduce_only' : 'active',
    //   };
    //   
    //   console.log('\n----- Market Data -----');
    //   console.log(JSON.stringify(marketData, null, 2));
    //   console.log('------------------------');
    //   
    //   // Display key properties for reference
    //   console.log('\nKey properties:');
    //   console.log('- Name:', market.name);
    //   console.log('- Base Decimals:', market.baseDecimals);
    //   console.log('- Mark Price:', market.uiPrice);
    //   console.log('- Oracle:', market.oracle.toString());
    //   console.log('- Open Interest:', market.baseLotsToUi(market.openInterest));
    // }
    // 
    // console.log('\nTest completed successfully!');
  } catch (error) {
    console.error('\nError fetching Mango data:');
    console.error(error.message);
    
    // Analyze the error for rate limit issues
    if (error.message.includes('429') || error.message.includes('Too Many Requests')) {
      console.error('\nRPC RATE LIMIT ISSUE DETECTED:');
      console.error('The RPC endpoint is returning 429 Too Many Requests errors.');
      console.error('This indicates you are hitting rate limits on your current RPC endpoint.');
      console.error('\nPossible solutions:');
      console.error('1. Use a dedicated RPC endpoint with higher rate limits');
      console.error('2. Reduce the frequency of requests');
      console.error('3. Implement exponential backoff retry logic');
      console.error('4. Consider a paid RPC service like QuickNode, Alchemy, or Triton');
      console.error('\nMango v4 requires significant RPC capacity because:');
      console.error('- It needs to load many accounts for the group and markets');
      console.error('- It makes multiple requests to fetch oracle prices, etc.');
      console.error('- The SDK attempts to retry failed requests, which can multiply the load');
    }
  }
}

main();
