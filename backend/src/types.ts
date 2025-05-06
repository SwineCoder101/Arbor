export interface StoreDataRequest {
  key: string;
  data: Record<string, any>;
}

export interface HistoricalDataParams {
  date: string; // Format: YYYYMMDD
}

export interface UserHistoricalDataParams extends HistoricalDataParams {
  accountKey: string;
}

export interface MarketHistoricalDataParams extends HistoricalDataParams {
  marketSymbol: string;
}

export interface AuthorityHistoricalDataParams extends HistoricalDataParams {
  authorityAccountKey: string;
}
