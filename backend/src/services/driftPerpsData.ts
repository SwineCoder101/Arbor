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
    const perpMarkets = await this.getAllPerpMarkets();
    
    return perpMarkets.map(perpMarket => {
      const ticker = String.fromCharCode(...perpMarket.name).trim();
      const marketIndex = perpMarket.marketIndex;
      const pubKey = perpMarket.pubkey;
      const amm = perpMarket.amm;
      const nextFundingRateRecordId = perpMarket.nextFundingRateRecordId;
      
      // Get oracle data for this market
      const oracleData = this.driftClient.getOracleDataForPerpMarket(marketIndex);
      
      // Extract funding rate data
      const fundingRate = perpMarket.amm.lastFundingRate;
      const lastFundingRateTs = perpMarket.amm.lastFundingRateTs;
      const twapPrice = perpMarket.amm.historicalOracleData.lastOraclePriceTwap5Min;
      
      return {
        ticker,
        marketIndex,
        pubKey,
        status: perpMarket.status,
        oracleData,
        fundingRate,
        lastFundingRateTs,
        twapPrice,
        nextFundingRateRecordId,
        amm
      };
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
