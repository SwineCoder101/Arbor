import { DriftPerpsDataService } from './driftPerpsData.js';
import { DriftPerpStorageService } from './driftPerpStorageService.js';

/**
 * Service for coordinating data collection and storage
 */
export class DataCollectorService {
  private driftPerpsService: DriftPerpsDataService;
  private driftPerpStorageService: DriftPerpStorageService;
  private collectionInterval: NodeJS.Timeout | null = null;
  
  /**
   * Initialize the Data Collector Service
   * @param driftPerpsService - Service for retrieving Drift perp data
   * @param driftPerpStorageService - Service for storing Drift perp data
   */
  constructor(
    driftPerpsService: DriftPerpsDataService,
    driftPerpStorageService: DriftPerpStorageService
  ) {
    this.driftPerpsService = driftPerpsService;
    this.driftPerpStorageService = driftPerpStorageService;
  }
  
  /**
   * Start the initial data collection and store the results
   */
  async collectInitialData(): Promise<void> {
    try {
      console.log('Collecting initial market data...');
      await this.driftPerpStorageService.storePerpMarketData();
    } catch (error) {
      console.error('Error collecting initial data:', error);
      throw error;
    }
  }
  
  /**
   * Start the periodic data collection process
   * @param intervalMinutes - Minutes between collection runs (default: 30)
   */
  startPeriodicCollection(intervalMinutes = 30): void {
    // Clear any existing interval
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
    }
    
    const intervalMs = intervalMinutes * 60 * 1000;
    
    // Set up periodic collection
    this.collectionInterval = setInterval(async () => {
      try {
        console.log(`Running scheduled market data collection at ${new Date().toISOString()}`);
        await this.driftPerpStorageService.storePerpMarketData();
      } catch (error) {
        console.error('Error in scheduled data collection:', error);
      }
    }, intervalMs);
    
    console.log(`Periodic market data collection started. Running every ${intervalMinutes} minutes.`);
  }
  
  /**
   * Collect a historical snapshot without overwriting existing data
   */
  async collectHistoricalSnapshot(): Promise<void> {
    try {
      console.log('Collecting historical market data snapshot...');
      await this.driftPerpStorageService.storeHistoricalSnapshot();
    } catch (error) {
      console.error('Error collecting historical snapshot:', error);
      throw error;
    }
  }
  
  /**
   * Stop the periodic data collection process
   */
  stopPeriodicCollection(): void {
    if (this.collectionInterval) {
      clearInterval(this.collectionInterval);
      this.collectionInterval = null;
      console.log('Periodic market data collection stopped.');
    }
  }
  
  /**
   * Clean up resources when shutting down
   */
  async cleanup(): Promise<void> {
    this.stopPeriodicCollection();
    await this.driftPerpsService.cleanup();
  }
}