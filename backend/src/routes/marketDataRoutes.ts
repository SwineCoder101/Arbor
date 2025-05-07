import express, { Request, Response, Router } from 'express';
import { DriftPerpReaderService } from '../services/driftPerpReaderService.js';
import { DataCollectorService } from '../services/dataCollectorService.js';

/**
 * Router for market data related endpoints
 */
export class MarketDataRoutes {
  private router: Router;
  private driftPerpReaderService: DriftPerpReaderService;
  private dataCollectorService?: DataCollectorService;
  
  /**
   * Initialize the market data routes
   * @param driftPerpReaderService - Service for reading market data
   * @param dataCollectorService - Optional service for collecting market data
   */
  constructor(
    driftPerpReaderService: DriftPerpReaderService, 
    dataCollectorService?: DataCollectorService
  ) {
    this.router = express.Router();
    this.driftPerpReaderService = driftPerpReaderService;
    this.dataCollectorService = dataCollectorService;
    this.setupRoutes();
  }
  
  /**
   * Configure all market data routes
   */
  private setupRoutes(): void {
    // Manual data collection trigger
    if (this.dataCollectorService) {
      this.router.post('/collect', async (req: Request, res: Response) => {
        try {
          console.log('Manual data collection triggered');
          const forceHistorical = req.query.historical === 'true';
          
          if (forceHistorical) {
            await this.dataCollectorService!.collectHistoricalSnapshot();
            res.json({ success: true, message: 'Historical market data snapshot collected successfully' });
          } else {
            await this.dataCollectorService!.collectInitialData();
            res.json({ success: true, message: 'Market data collected and updated successfully' });
          }
        } catch (error) {
          console.error('Error in manual data collection:', error);
          res.status(500).json({ success: false, error: 'Failed to collect market data' });
        }
      });
    }
    
    // Get all markets latest data
    this.router.get('/', async (req: Request, res: Response) => {
      try {
        const dex = req.query.dex as string || 'drift';
        const data = await this.driftPerpReaderService.getLatestMarketData(dex);
        res.json(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
      }
    });
    
    // Get all markets from all DEXes
    this.router.get('/all', async (req: Request, res: Response) => {
      try {
        const marketMap = await this.driftPerpReaderService.getAllMarkets();
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
    
    // Get specific market by ticker
    this.router.get('/:ticker', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const dex = req.query.dex as string || 'drift';
        const data = await this.driftPerpReaderService.getLatestMarketDataByTicker(ticker, dex);
        
        if (!data) {
          return res.status(404).json({ error: `Market with ticker ${ticker} on DEX ${dex} not found` });
        }
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching market data:', error);
        res.status(500).json({ error: 'Failed to fetch market data' });
      }
    });
    
    // Get historical data for a specific market
    this.router.get('/:ticker/history', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await this.driftPerpReaderService.getHistoricalMarketData(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching market history:', error);
        res.status(500).json({ error: 'Failed to fetch market history' });
      }
    });
    
    // Get funding rate history for a specific market
    this.router.get('/:ticker/funding', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await this.driftPerpReaderService.getFundingRateHistory(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching funding rate history:', error);
        res.status(500).json({ error: 'Failed to fetch funding rate history' });
      }
    });
    
    // Get TWAP price history for a specific market
    this.router.get('/:ticker/twap', async (req: Request, res: Response) => {
      try {
        const ticker = req.params.ticker;
        const limit = req.query.limit ? parseInt(req.query.limit as string) : 100;
        const dex = req.query.dex as string || 'drift';
        const data = await this.driftPerpReaderService.getTwapPriceHistory(ticker, limit, dex);
        
        res.json(data);
      } catch (error) {
        console.error('Error fetching TWAP price history:', error);
        res.status(500).json({ error: 'Failed to fetch TWAP price history' });
      }
    });
  }
  
  /**
   * Get the configured router
   */
  getRouter(): Router {
    return this.router;
  }
}

/**
 * Create market data routes with provided reader service
 * @param driftPerpReaderService - Service for reading market data
 * @returns Configured Express router
 */
export default function createMarketDataRoutes(
  driftPerpReaderService: DriftPerpReaderService
): Router {
  const routes = new MarketDataRoutes(driftPerpReaderService);
  return routes.getRouter();
}

/**
 * Create market data routes with provided services including data collector
 * @param driftPerpReaderService - Service for reading market data
 * @param dataCollectorService - Service for collecting market data
 * @returns Configured Express router
 */
export function createMarketDataRoutesWithCollector(
  driftPerpReaderService: DriftPerpReaderService,
  dataCollectorService: DataCollectorService
): Router {
  const routes = new MarketDataRoutes(driftPerpReaderService, dataCollectorService);
  return routes.getRouter();
}