import * as express from 'express';
import { Request, Response, Router } from 'express';
import { Db } from 'mongodb';
import { DriftFundingDataService } from '../services/driftFundingDataService.js';

/**
 * Route handler for Drift funding data from the external API
 * @param db - MongoDB database connection
 * @returns Express router
 */
export default function createDriftFundingRoutes(db: Db | null): Router {
  const router = express.Router();
  const driftFundingService = new DriftFundingDataService(db);

  /**
   * Get all available markets from contracts data
   */
  router.get('/markets', async (req: Request, res: Response) => {
    try {
      const markets = await driftFundingService.getAvailableMarkets();
      res.json({ success: true, data: markets });
    } catch (error) {
      console.error('Error fetching Drift markets:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  /**
   * Get latest funding rates for all markets
   */
  router.get('/funding-rates', async (req: Request, res: Response) => {
    try {
      const limit = parseInt(req.query.limit as string || '100', 10);
      const rates = await driftFundingService.getLatestFundingRates(limit);
      res.json({ success: true, data: rates });
    } catch (error) {
      console.error('Error fetching funding rates:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  /**
   * Get funding rate history for a specific market
   */
  router.get('/funding-rates/:marketName', async (req: Request, res: Response) => {
    try {
      const { marketName } = req.params;
      const limit = parseInt(req.query.limit as string || '30', 10);
      
      const history = await driftFundingService.getFundingRateHistory(marketName, limit);
      
      if (!history || history.length === 0) {
        return res.status(404).json({ 
          success: false, 
          error: `No funding rate data found for market: ${marketName}` 
        });
      }
      
      res.json({ success: true, data: history });
    } catch (error) {
      console.error(`Error fetching funding history for ${req.params.marketName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  /**
   * Manually trigger fetching and storing contract data
   */
  router.post('/fetch/contracts', async (req: Request, res: Response) => {
    try {
      const forceInsert = req.query.forceInsert === 'true';
      const result = await driftFundingService.fetchAndStoreContracts(forceInsert);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error fetching contracts:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  /**
   * Manually trigger fetching and storing funding rates for a specific market
   */
  router.post('/fetch/funding-rates/:marketName', async (req: Request, res: Response) => {
    try {
      const { marketName } = req.params;
      const forceInsert = req.query.forceInsert === 'true';
      
      const result = await driftFundingService.fetchAndStoreFundingRates(marketName, forceInsert);
      res.json({ success: true, result });
    } catch (error) {
      console.error(`Error fetching funding rates for ${req.params.marketName}:`, error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  /**
   * Manually trigger fetching and storing all data (contracts and funding rates)
   */
  router.post('/fetch/all', async (req: Request, res: Response) => {
    try {
      const forceInsert = req.query.forceInsert === 'true';
      const result = await driftFundingService.fetchAndStoreAllData(forceInsert);
      res.json({ success: true, result });
    } catch (error) {
      console.error('Error fetching all drift data:', error);
      const errorMessage = error instanceof Error ? error.message : String(error);
      res.status(500).json({ success: false, error: errorMessage });
    }
  });

  return router;
}
