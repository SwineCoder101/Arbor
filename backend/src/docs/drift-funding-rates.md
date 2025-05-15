# Drift Funding Rates Service

This document describes the implementation of the Drift Funding Rates service, which collects and stores funding rate data from the Drift Data API.

## Overview

The Drift Funding Rates implementation consists of the following components:

1. **Data Service**: `drift-funding-data.service.ts` - Responsible for fetching data from the Drift API
2. **Storage Service**: `drift-funding-rates-storage.service.ts` - Stores and manages funding rate data in MongoDB
3. **Routes**: `drift-funding-rates-routes.ts` - Exposes endpoints for accessing funding rate data
4. **Storage Job**: `store-drift-funding-rates.ts` - Scheduled job that periodically fetches and stores funding rate data

## Data Storage

Funding rate data is stored in the `drift_funding_rate` MongoDB collection with the following document types:

### Funding Rate Documents

```javascript
{
  recordId: "12345",               // Unique identifier from Drift API
  marketName: "SOL-PERP",          // Market name
  dex: "drift",                    // Always "drift"
  dataType: "funding_rate",        // Document type
  timestamp: "2023-04-01T12:00:00Z", // When this record was stored
  ts: "1680350400",                // Timestamp from Drift API
  
  // Raw funding rate data
  fundingRate: "0.0000123",        // Processed funding rate
  fundingRateRaw: "12300",         // Original raw value
  
  // Calculated fields
  fundingRatePct: 0.00012,         // Funding rate as percentage
  fundingRateApr: 1.05,            // Annualized funding rate (24hr * 365)
  
  // Additional data from Drift API
  slot: 123456789,
  txSig: "abcdef...",
  oraclePriceTwap: "123.45",
  markPriceTwap: "123.56",
  // ... other fields from API
}
```

### Contract Documents

```javascript
{
  ticker_id: "SOL-PERP",           // Market identifier
  dex: "drift",                    // Always "drift"
  dataType: "contract",            // Document type
  timestamp: "2023-04-01T12:00:00Z", // When this record was stored
  
  // Contract data from API
  contract_index: 0,               // Market index
  base_currency: "SOL",
  quote_currency: "USDC",
  last_price: "123.45",
  base_volume: "1000.5",
  // ... other fields from API
}
```

## API Endpoints

The implementation provides the following API endpoints:

### GET Endpoints

- `GET /api/drift-funding-rates/latest` - Get latest funding rates for all markets
- `GET /api/drift-funding-rates/market/:marketName` - Get funding rate history for a specific market
- `GET /api/drift-funding-rates/stats/:marketName` - Get funding rate statistics for a specific market

### POST Endpoints (Manual Triggers)

- `POST /api/drift-funding-rates/store` - Manually trigger storing all funding rates data
- `POST /api/drift-funding-rates/store/:marketName` - Manually trigger storing funding rates for a specific market

Query Parameters:
- `forceInsert=true` - Force insertion instead of upserting (useful for historical data)
- `snapshot=true` - Create a historical snapshot (with POST /store only)

## Scheduled Job

The `store-drift-funding-rates.ts` job periodically fetches and stores funding rate data. It can be configured using the following environment variables:

- `DRIFT_API_URL` - Drift API base URL (default: https://data.api.drift.trade)
- `DRIFT_FUNDING_FETCH_INTERVAL` - Interval in milliseconds between fetches (default: 900000 = 15 minutes)
- `DRIFT_FUNDING_FORCE_INSERT` - If "true", forces insertion of new records instead of upserting
- `DRIFT_FUNDING_HISTORICAL_SNAPSHOT` - If "true", creates a historical snapshot instead of updating existing records

## Running the Job

To run the job manually:

```bash
npm run store-drift-funding
```

## Using the Storage Service

The `DriftFundingRatesStorageService` provides methods for working with funding rate data:

```typescript
// Store funding rates for a market
await storageService.storeFundingRatesForMarket("SOL-PERP");

// Store funding rates for all markets
await storageService.storeFundingRatesForAllMarkets();

// Create a historical snapshot
await storageService.createHistoricalSnapshot();

// Get latest funding rates
const rates = await storageService.getLatestFundingRates();

// Get funding rate history for a market
const history = await storageService.getFundingRateHistory("SOL-PERP", 30);

// Get funding rate statistics
const stats = await storageService.getFundingRateStats("SOL-PERP", 7);
```