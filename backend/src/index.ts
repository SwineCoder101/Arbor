import dotenv from "dotenv"
dotenv.config();
import express, { Request, Response } from 'express';
// Interface for request body
import { StoreDataRequest } from '#types.js';
import historicalDataRoutes from '#routes/historicalDataRoutes.js';
import { WalletService } from "#services/walletService.js";
import { DriftEnv } from "@drift-labs/sdk";
import { DriftClientFactory } from "#services/driftClientFactory.js";
import { DriftPerpsDataService } from "#services/driftPerpsData.js";
import { HistoricalDataService as DriftHistoricalService } from "#services/driftHistoricalDataService.js";
import { MongoService } from "#services/mongoService.js";
import { DriftPerpStorageService } from "#services/driftPerpStorageService.js";
import { DriftPerpReaderService } from "#services/driftPerpReaderService.js";

// App setup
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

(async () => {
  try {
    // Connect to MongoDB
    await MongoService.connect();
    
    // Initialize Drift client and services
    const {connection, wallet} = WalletService.initializeFromEnv(
      process.env.RPC_ENDPOINT as string, 
      process.env.KEYPAIR as string
    );
    
    const env = 
      process.env.RPC_ENDPOINT === "https://api.devnet.solana.com" ? 
      'devnet' : 'mainnet-beta' as DriftEnv;
    
    const driftClient = DriftClientFactory.createDriftClient(
      connection, 
      wallet, 
      env
    );
    
    const driftPerpsService = new DriftPerpsDataService(driftClient);
    const driftPerpStorageService = new DriftPerpStorageService(driftPerpsService);
    
    // Store initial market data with upsert (updating records based on ticker and dex)
    await driftPerpStorageService.storePerpMarketData();
    
    // Initialize reader service for retrieving stored data
    const driftPerpReaderService = new DriftPerpReaderService();
    
    // Test retrieving data
    const latestData = await driftPerpReaderService.getLatestMarketData();
    console.log(`Retrieved ${latestData.length} latest market records`);
    
    // Add API routes for market data
    app.get('/api/markets', async (req: Request, res: Response) => {
      try {
        const dex = req.query.dex as string || 'drift';
        const data = await driftPerpReaderService.getLatestMarketData(dex);
        res.json(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
      }
    });
    
    app.get('/api/markets/all', async (req: Request, res: Response) => {
      try {
        const marketMap = await driftPerpReaderService.getAllMarkets();
        // Convert map to object for JSON response
        const result: Record<string, any[]> = {};
        marketMap.forEach((value, key) => {
          result[key] = value;
        });
        
        res.json(result);
      } catch (error) {
        console.error('Error fetching all markets data:', error);
        res.status(500).json({ error: 'Failed to fetch markets data' });
      }
    });
    
    app.get('/api/markets/:ticker', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const dex = req.query.dex as string || 'drift';
        const data = await driftPerpReaderService.getLatestMarketDataByTicker(ticker, dex);
        
        if (!data) {
          return res.status(404).json({ error: `Market with ticker ${ticker} on DEX ${dex} not found` });
        }
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
      }
    });
    
    app.get('/api/markets/:ticker/history', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await driftPerpReaderService.getHistoricalMarketData(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching market history:', error);
        res.status(500).json({ error: 'Failed to fetch market history' });
      }
    });
    
    app.get('/api/markets/:ticker/funding', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await driftPerpReaderService.getFundingRateHistory(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching funding rate history:', error);
        res.status(500).json({ error: 'Failed to fetch funding rate history' });
      }
    });
    
    app.get('/api/markets/:ticker/twap', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await driftPerpReaderService.getTwapPriceHistory(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching TWAP price history:', error);
        res.status(500).json({ error: 'Failed to fetch TWAP price history' });
      }
    });
    
    // Register historical data routes
    app.use('/api/historical', historicalDataRoutes);
    
    // Start the server
    app.listen(port, () => {
      console.log(`Server running at http://localhost:${port}`);
    });
    
    // Setup cleanup for graceful shutdown
    process.on('SIGINT', async () => {
      console.log('Shutting down server...');
      await driftPerpsService.cleanup();
      await MongoService.disconnect();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
