import { Connection, Commitment, PublicKey } from '@solana/web3.js';
import { DriftClient, PerpMarketAccount } from '@drift-labs/sdk';

/**
 * Service for handling Drift protocol perpetual market data
 */
export class DriftPerpsDataService {
  private driftClient: DriftClient;
  
  /**
   * Initialize the Drift Perps Data Service
   * @param driftClient - Initialized Drift client instance
   */
  constructor(driftClient: DriftClient) {
    this.driftClient = driftClient;
  }

  /**
   * Get all perpetual markets available on Drift
   * @returns Array of all perpetual market accounts
   */
  async getAllPerpMarkets(): Promise<PerpMarketAccount[]> {
    // Ensure client is subscribed
    if (!this.driftClient.activeSubAccountId) {
      await this.driftClient.subscribe();
    }
    
    return this.driftClient.getPerpMarketAccounts();
  }

  /**
   * Get a specific perpetual market by index
   * @param marketIndex - The index of the perpetual market
   * @returns The perpetual market account or null if not found
   */
  async getPerpMarketByIndex(marketIndex: number): Promise<PerpMarketAccount | null> {
    // Ensure client is subscribed
    if (!this.driftClient.activeSubAccountId) {
      await this.driftClient.subscribe();
    }
    
    const perpMarketAccount = this.driftClient.getPerpMarketAccount(marketIndex);
    return perpMarketAccount ?? null;
  }

  /**
   * Get detailed information for all perpetual markets
   * @returns Array of detailed market information
   */
  async getPerpMarketsDetails(): Promise<any[]> {
    // Get all perp markets
    const perpMarkets = await this.getAllPerpMarkets();
    
    return perpMarkets.map(perpMarket => {
      try {
        // Create a detailed representation of the market data
        const detailedMarket: any = {};
        
        // Extract core fields directly (to maintain top-level access)
        detailedMarket.marketIndex = perpMarket.marketIndex;
        detailedMarket.status = perpMarket.status;
        detailedMarket.name = perpMarket.name;
        detailedMarket.nextFundingRateRecordId = perpMarket.nextFundingRateRecordId;
        
        // Add human-readable ticker derived from bytes
        detailedMarket.ticker = String.fromCharCode(...perpMarket.name).trim();
        
        // Get oracle data for this market
        detailedMarket.oracleData = this.driftClient.getOracleDataForPerpMarket(perpMarket.marketIndex);
        
        // Add public key
        detailedMarket.pubKey = perpMarket.pubkey;
        
        // Include the entire AMM data
        detailedMarket.amm = perpMarket.amm;
        
        // Extract commonly accessed AMM fields for easier access
        detailedMarket.fundingRate = perpMarket.amm.lastFundingRate;
        detailedMarket.lastFundingRateTs = perpMarket.amm.lastFundingRateTs;
        detailedMarket.twapPrice = perpMarket.amm.historicalOracleData.lastOraclePriceTwap5Min;
        detailedMarket.markPrice = perpMarket.amm.historicalOracleData.lastOraclePrice;
        detailedMarket.baseAssetReserve = perpMarket.amm.baseAssetReserve;
        detailedMarket.quoteAssetReserve = perpMarket.amm.quoteAssetReserve;
        
        // Add market statistics
        detailedMarket.volumeStats = {
          volume24h: perpMarket.amm.volume24H,
        };
        
        // Include any remaining fields directly from perpMarket
        for (const [key, value] of Object.entries(perpMarket)) {
          if (!(key in detailedMarket) && key !== 'amm' && key !== 'pubkey') {
            detailedMarket[key] = value;
          }
        }
        
        return detailedMarket;
      } catch (error) {
        // If there's an error processing a market, still include it with basic info
        console.error(`Error processing market ${perpMarket.marketIndex}:`, error);
        return {
          error: `Failed to process market data`,
          marketIndex: perpMarket.marketIndex,
          ticker: perpMarket.name ? String.fromCharCode(...perpMarket.name).trim() : 'Unknown',
          pubKey: perpMarket.pubkey ? perpMarket.pubkey.toString() : null
        };
      }
    });
  }

  /**
   * Check if a user account exists, initialize if it doesn't
   * @returns The user's public key
   */
  async checkUserExistsInitialiseIfNot(): Promise<PublicKey> {
    try {
      const userAccount = this.driftClient.getUserAccount();
      if (!userAccount) {
        await this.driftClient.initializeUserAccount();
      }
      return this.driftClient.getUserAccountPublicKey();
    } catch (error) {
      console.error('Error checking/initializing user account:', error);
      throw error;
    }
  }

  /**
   * Get user's perpetual positions
   * @returns Array of user's perpetual positions
   */
  async getUserPerpPositions(): Promise<any[]> {
    const userAccount = this.driftClient.getUserAccount();
    if (!userAccount) {
      throw new Error('User account not found or not initialized');
    }
    
    return userAccount.perpPositions.filter(
      position => position.marketIndex !== 65535 // Filter out empty positions
    ).map(position => {
      const market = this.driftClient.getPerpMarketAccount(position.marketIndex);
      const ticker = market ? String.fromCharCode(...market.name).trim() : 'Unknown';
      
      return {
        marketIndex: position.marketIndex,
        ticker,
        baseAssetAmount: position.baseAssetAmount,
        quoteAssetAmount: position.quoteAssetAmount,
        lastCumulativeFundingRate: position.lastCumulativeFundingRate,
        openOrders: position.openOrders,
        settledPnl: position.settledPnl
      };
    });
  }
  
  /**
   * Safely unsubscribe the Drift client
   */
  async cleanup(): Promise<void> {
    try {
      await this.driftClient.unsubscribe();
    } catch (error) {
      console.error('Error unsubscribing from Drift client:', error);
    }
  }
}
