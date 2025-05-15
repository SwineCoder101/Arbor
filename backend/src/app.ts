import express, { Express } from 'express';
import { MongoService } from './services/mongoService.js';
import { WalletService } from './services/walletService.js';
import { DriftClientFactory } from './services/driftClientFactory.js';
import { DriftPerpsDataService } from './services/driftPerpsData.js';
import { DriftPerpStorageService } from './services/driftPerpStorageService.js';
import { DriftPerpReaderService } from './services/driftPerpReaderService.js';
import { DataCollectorService } from './services/dataCollectorService.js';
import {DriftFundingDataService} from "./services/driftFundingDataService.js"
import { DriftEnv } from '@drift-labs/sdk';

import historicalDataRoutes from './routes/driftHistoricalDataRoutes.js';
import createMarketDataRoutes  from './routes/marketDataRoutes.js';
import createDriftFundingRoutes from './routes/driftFundingRoutes.js';

/**
 * Application class for managing the Express server and services
 */
export class Application {
  private app: Express;
  private dataCollectorService: DataCollectorService | null = null;
  private driftPerpsService: DriftPerpsDataService | null = null;
  
  /**
   * Initialize the application
   * @param options - Application configuration options
   */
  constructor(private options: {
    collectDataOnStart?: boolean;
    dataCollectionIntervalMinutes?: number;
  } = {}) {
    this.app = express();
    this.setupMiddleware();
    
    // Set default options
    this.options.collectDataOnStart = 
      this.options.collectDataOnStart !== undefined ? this.options.collectDataOnStart : true;
    this.options.dataCollectionIntervalMinutes = 
      this.options.dataCollectionIntervalMinutes || 30;
  }
  
  /**
   * Configure Express middleware
   */
  private setupMiddleware(): void {
    this.app.use(express.json());
  }
  
  /**
   * Initialize all services and routes
   */
  async initialize(): Promise<void> {
    try {
      // Connect to MongoDB
      await MongoService.connect();
      
      // Initialize Drift services
      const { connection, wallet } = WalletService.initializeFromEnv(
        process.env.RPC_ENDPOINT as string,
        process.env.KEYPAIR as string
      );
      
      const env = process.env.RPC_ENDPOINT === "https://api.devnet.solana.com"
        ? 'devnet'
        : 'mainnet-beta' as DriftEnv;

      const driftFundingService = new DriftFundingDataService();
      
      const driftClient = DriftClientFactory.createDriftClient(connection, wallet, env);
      this.driftPerpsService = new DriftPerpsDataService(driftClient);
      
      const driftPerpStorageService = new DriftPerpStorageService(this.driftPerpsService);
      const driftPerpReaderService = new DriftPerpReaderService();
      
      // Initialize data collector service
      this.dataCollectorService = new DataCollectorService(
        this.driftPerpsService,
        driftPerpStorageService
      );
      
      // Collect initial data if configured to do so
      if (this.options.collectDataOnStart) {
        console.log('COLLECT_DATA_ON_START is enabled - collecting initial data');
        await this.dataCollectorService.collectInitialData();
      } else {
        console.log('COLLECT_DATA_ON_START is disabled - skipping initial data collection');
      }
      
      // Start periodic data collection with configured interval
      this.dataCollectorService.startPeriodicCollection(this.options.dataCollectionIntervalMinutes);
      
      // Set up API routes
      this.setupRoutes(driftPerpReaderService);
      
      console.log('Application initialized successfully');
    } catch (error) {
      console.error('Failed to initialize application:', error);
      throw error;
    }
  }
  
  /**
   * Configure API routes
   */
  private setupRoutes(driftPerpReaderService: DriftPerpReaderService): void {
    // Market data routes with access to data collector for manual triggering
    if (this.dataCollectorService) {
      // If we have a data collector service, use the version with collector
      this.app.use('/api/markets', createMarketDataRoutes(
        driftPerpReaderService 
      ));
    } else {
      // Otherwise, use the simple version
      this.app.use('/api/markets', createMarketDataRoutes(driftPerpReaderService));
    }
    
    // Historical data routes
    this.app.use('/api/historical', historicalDataRoutes);
    
    // Drift funding data routes
    const fundingDb = MongoService.getDb();
    console.log(fundingDb?.databaseName)
    this.app.use('/api/drift-funding', createDriftFundingRoutes(fundingDb));
    
  }
  
  /**
   * Start the server
   * @param port - Port to listen on
   */
  async start(port: number): Promise<void> {
    return new Promise((resolve) => {
      this.app.listen(port, () => {
        console.log(`Server running at http://localhost:${port}`);
        resolve();
      });
    });
  }
  
  /**
   * Gracefully shut down the application
   */
  async shutdown(): Promise<void> {
    console.log('Shutting down server...');
    
    // Clean up services
    if (this.dataCollectorService) {
      await this.dataCollectorService.cleanup();
    }
    
    // Disconnect from MongoDB
    await MongoService.disconnect();
    
    console.log('Server shutdown complete');
  }
  
  /**
   * Get the Express application instance
   */
  getApp(): Express {
    return this.app;
  }
}
