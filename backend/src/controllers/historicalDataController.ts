import { Request, Response } from 'express';
import { HistoricalDataService } from '../services/historicalDataService.js';

/**
 * Controller for historical data endpoints
 */
export class HistoricalDataController {
  private historicalDataService: HistoricalDataService;

  constructor() {
    this.historicalDataService = new HistoricalDataService();
  }

  /**
   * Get user trades
   */
  getUserTrades = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getUserTrades(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get market trades
   */
  getMarketTrades = async (req: Request, res: Response) => {
    try {
      const { marketSymbol, date } = req.params;
      this.validateMarketParams(marketSymbol, date);
      
      const data = await this.historicalDataService.getMarketTrades(marketSymbol, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get funding rates
   */
  getFundingRates = async (req: Request, res: Response) => {
    try {
      const { marketSymbol, date } = req.params;
      this.validateMarketParams(marketSymbol, date);
      
      const data = await this.historicalDataService.getFundingRates(marketSymbol, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get funding payments
   */
  getFundingPayments = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getFundingPayments(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get deposits
   */
  getDeposits = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getDeposits(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get liquidations
   */
  getLiquidations = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getLiquidations(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get settle PNL
   */
  getSettlePnl = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getSettlePnl(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get LP records
   */
  getLpRecords = async (req: Request, res: Response) => {
    try {
      const { accountKey, date } = req.params;
      this.validateParams(accountKey, date);
      
      const data = await this.historicalDataService.getLpRecords(accountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get insurance fund
   */
  getInsuranceFund = async (req: Request, res: Response) => {
    try {
      const { marketSymbol, date } = req.params;
      this.validateMarketParams(marketSymbol, date);
      
      const data = await this.historicalDataService.getInsuranceFund(marketSymbol, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Get insurance fund stake
   */
  getInsuranceFundStake = async (req: Request, res: Response) => {
    try {
      const { authorityAccountKey, date } = req.params;
      this.validateParams(authorityAccountKey, date);
      
      const data = await this.historicalDataService.getInsuranceFundStake(authorityAccountKey, date);
      res.json(data);
    } catch (error) {
      this.handleError(error, res);
    }
  };

  /**
   * Validate account and date parameters
   */
  private validateParams(accountKey: string, date: string) {
    if (!accountKey) {
      throw new Error('Account key is required');
    }
    this.validateDate(date);
  }

  /**
   * Validate market and date parameters
   */
  private validateMarketParams(marketSymbol: string, date: string) {
    if (!marketSymbol) {
      throw new Error('Market symbol is required');
    }
    this.validateDate(date);
  }

  /**
   * Validate date format
   */
  private validateDate(date: string) {
    if (!date || !/^\d{8}$/.test(date)) {
      throw new Error('Invalid date format. Date should be in YYYYMMDD format');
    }
    
    const year = parseInt(date.substring(0, 4));
    const month = parseInt(date.substring(4, 6));
    const day = parseInt(date.substring(6, 8));
    
    if (month < 1 || month > 12 || day < 1 || day > 31) {
      throw new Error('Invalid date. Month should be 1-12 and day should be 1-31');
    }
  }

  /**
   * Handle errors
   */
  private handleError(error: unknown, res: Response) {
    if (error instanceof Error) {
      res.status(400).json({ error: error.message });
    } else {
      console.error('Unexpected error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}
