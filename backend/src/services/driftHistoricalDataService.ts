import axios from 'axios';

const BASE_URL = 'https://drift-historical-data-v2.s3.eu-west-1.amazonaws.com/program/dRiftyHA39MWEi3m9aunc5MzRF1JYuBsbn6VPcn33UH';

/**
 * Service to fetch historical data from Drift protocol
 */
export class HistoricalDataService {
  /**
   * Get user trades for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns trade records
   */
  async getUserTrades(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/tradeRecords/${year}/${date}`);
  }

  /**
   * Get market trades for a specific date
   * @param marketSymbol - market name (e.g., SOL-PERP)
   * @param date - date in format YYYYMMDD
   * @returns market trade records
   */
  async getMarketTrades(marketSymbol: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/market/${marketSymbol}/tradeRecords/${year}/${date}`);
  }

  /**
   * Get funding rates for a specific date
   * @param marketSymbol - market name (e.g., SOL-PERP)
   * @param date - date in format YYYYMMDD
   * @returns funding rate records
   */
  async getFundingRates(marketSymbol: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/market/${marketSymbol}/fundingRateRecords/${year}/${date}`);
  }

  /**
   * Get funding payments for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns funding payment records
   */
  async getFundingPayments(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/fundingPaymentRecords/${year}/${date}`);
  }

  /**
   * Get deposits for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns deposit records
   */
  async getDeposits(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/depositRecords/${year}/${date}`);
  }

  /**
   * Get liquidations for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns liquidation records
   */
  async getLiquidations(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/liquidationRecords/${year}/${date}`);
  }

  /**
   * Get settle PNL records for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns settle PNL records
   */
  async getSettlePnl(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/settlePnlRecords/${year}/${date}`);
  }

  /**
   * Get LP (BAL) records for a specific date
   * @param accountKey - user sub account public key
   * @param date - date in format YYYYMMDD
   * @returns LP records
   */
  async getLpRecords(accountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/user/${accountKey}/lpRecord/${year}/${date}`);
  }

  /**
   * Get insurance fund records for a specific date
   * @param marketSymbol - market name (e.g., SOL-PERP)
   * @param date - date in format YYYYMMDD
   * @returns insurance fund records
   */
  async getInsuranceFund(marketSymbol: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/market/${marketSymbol}/insuranceFundRecords/${year}/${date}`);
  }

  /**
   * Get insurance fund stake records for a specific date
   * @param authorityAccountKey - authority account public key
   * @param date - date in format YYYYMMDD
   * @returns insurance fund stake records
   */
  async getInsuranceFundStake(authorityAccountKey: string, date: string) {
    const year = date.substring(0, 4);
    return this.fetchData(`/authority/${authorityAccountKey}/insuranceFundStakeRecords/${year}/${date}`);
  }

  /**
   * Fetch data from the API
   * @param path - path to fetch
   * @returns data from API
   */
  private async fetchData(path: string) {
    try {
      const url = `${BASE_URL}${path}`;
      const response = await axios.get(url, {
        responseType: 'text',
        headers: {
          Accept: 'text/csv'
        }
      });
      
      // Parse CSV data into JSON
      return this.parseCSV(response.data);
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        return { error: 'Data not found for the requested date or parameters' };
      }
      throw error;
    }
  }
  
  /**
   * Parse CSV string into structured data
   * @param csvString - CSV data as string
   * @returns Structured data object
   */
  private parseCSV(csvString: string) {
    // Split the CSV by lines and remove any trailing newlines
    const lines = csvString.trim().split('\n');
    if (lines.length === 0) {
      return { records: [] };
    }
    
    // Extract headers from first line
    const headers = lines[0].split(',').map(header => header.trim().replace(/^"|"$/g, ''));
    
    // Parse the remaining lines into records
    const records = [];
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i];
      if (!line.trim()) continue;
      
      const values = line.split(',');
      const record: Record<string, string> = {};
      
      headers.forEach((header, index) => {
        record[header] = values[index] ? values[index].trim().replace(/^"|"$/g, '') : '';
      });
      
      records.push(record);
    }
    
    return { headers, records };
  }
}
