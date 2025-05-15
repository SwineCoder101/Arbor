import { Router } from 'express';
import { HistoricalDataController } from '../controllers/historicalDataController.js';

const router = Router();
const historicalDataController = new HistoricalDataController();

// User related endpoints
router.get('/user/:accountKey/trades/:date', historicalDataController.getUserTrades);
router.get('/user/:accountKey/funding-payments/:date', historicalDataController.getFundingPayments);
router.get('/user/:accountKey/deposits/:date', historicalDataController.getDeposits);
router.get('/user/:accountKey/liquidations/:date', historicalDataController.getLiquidations);
router.get('/user/:accountKey/settle-pnl/:date', historicalDataController.getSettlePnl);
router.get('/user/:accountKey/lp-records/:date', historicalDataController.getLpRecords);

// Market related endpoints
router.get('/market/:marketSymbol/trades/:date', historicalDataController.getMarketTrades);
router.get('/market/:marketSymbol/funding-rates/:date', historicalDataController.getFundingRates);
router.get('/market/:marketSymbol/insurance-fund/:date', historicalDataController.getInsuranceFund);

// Authority related endpoints
router.get('/authority/:authorityAccountKey/insurance-fund-stake/:date', historicalDataController.getInsuranceFundStake);

export default router;
