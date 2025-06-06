export interface Strategy {
  asset: string;
  longDex: {
    name: string;
    fundingRate: number;
    price?: number;
  };
  shortDex: {
    name: string;
    fundingRate: number;
    price?: number;
  };
  arbitrageRateAnnualized: string;
  arbitrageRateDaily: string;
  recommendedSize: number;
  estimatedDailyProfit: string;
  estimatedAnnualProfit: string;
  riskAssessment: 'Low' | 'Medium' | 'High';
  strategyType: string;
  identifiedAt: string;
  activeOrders: Array<{
    id: string;
    side: string;
    dex: string;
    size: string;
    entryPrice: string;
    status: string;
    createdAt: string;
    wallet: string;
    pnl: string;
  }>;
} 