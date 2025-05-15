# Drift Data API Integration

This document describes the integration with the Drift Data API, which provides information about Drift's perp markets, funding rates, and other market data.

## Overview

The Drift Data API integration consists of the following components:

1. **Service**: `drift-funding-data.service.ts` - Responsible for fetching data from the Drift API and storing it in MongoDB
2. **Router**: `drift-funding-routes.ts` - Exposes endpoints for accessing the stored Drift API data
3. **Job**: `fetch-drift-funding.ts` - Scheduled job that periodically fetches and updates the data

## Drift Data API

The Drift Data API provides public access to various APIs that Drift uses, offering information about markets, contracts, and tokenomics.

**API Endpoints:**
- Mainnet: https://data.api.drift.trade
- Devnet: https://master-data.drift.trade

### Key Endpoints Used

1. **GET /contracts**
   - Returns information about all available perp markets
   - Example: https://data.api.drift.trade/contracts

2. **GET /fundingRates**
   - Returns the last 30 days of funding rates by marketName
   - Requires `marketName` parameter
   - Example: https://data.api.drift.trade/fundingRates?marketName=SOL-PERP

## Service Implementation

The `DriftFundingDataService` class provides methods for:

- Fetching and storing contracts data
- Fetching and storing funding rates for specific markets
- Retrieving latest funding rates for all markets
- Retrieving historical funding rate data for a specific market

### Data Storage

Data is stored in the `drift_funding_data` MongoDB collection with the following structure:

1. **Contracts Data:**
   - `marketIndex` - The market index (used as the unique key for upsert operations)
   - `symbol` - Market symbol (e.g., "SOL-PERP")
   - `timestamp` - When the data was fetched
   - `dex` - Always "drift"
   - `dataType` - "contract"
   - Plus all fields returned by the Drift API

2. **Funding Rate Data:**
   - `recordId` - Unique identifier for the funding rate record (used as the unique key for upsert operations)
   - `marketName` - Market symbol
   - `fundingRate` - Processed funding rate
   - `fundingRatePct` - Funding rate as a percentage
   - `fundingRateApr` - Annualized funding rate (hourly rate * 24 * 365)
   - `timestamp` - When the data was fetched
   - `dex` - Always "drift"
   - Plus all fields returned by the Drift API

## API Endpoints

The integration provides the following API endpoints:

### GET Endpoints

- `GET /api/drift-funding/markets` - Get all available markets
- `GET /api/drift-funding/funding-rates` - Get latest funding rates for all markets
- `GET /api/drift-funding/funding-rates/:marketName` - Get funding rate history for a specific market

### POST Endpoints (Manual Triggers)

- `POST /api/drift-funding/fetch/contracts` - Manually fetch and store contracts data
- `POST /api/drift-funding/fetch/funding-rates/:marketName` - Manually fetch and store funding rates for a specific market
- `POST /api/drift-funding/fetch/all` - Manually fetch and store all data (contracts and funding rates)

Query Parameters:
- `forceInsert=true` - Force insertion of new records (useful for historical data)

## Scheduled Job

The `fetch-drift-funding.ts` script can be run as a standalone process or scheduled via cron to periodically fetch and update data.

### Configuration

The job uses the following environment variables:

- `MONGO_URI` - MongoDB connection string
- `DB_NAME` - MongoDB database name
- `DRIFT_API_URL` - Drift API base URL
- `DRIFT_FUNDING_FETCH_INTERVAL` - Interval in milliseconds between fetches (default: 900000 = 15 minutes)
- `DRIFT_FUNDING_FORCE_INSERT` - If "true", forces insertion of new records instead of upserting

### Running the Job

To run the job manually:

```
npm run fetch-drift-funding
```

## Usage Examples

### Fetching Funding Rate History

```javascript
// Example: Get funding rate history for SOL-PERP
fetch('/api/drift-funding/funding-rates/SOL-PERP?limit=7')
  .then(response => response.json())
  .then(data => {
    // Process the funding rate data
    console.log(data);
  });
```

### Manual Data Update

```javascript
// Example: Manually trigger updating all data
fetch('/api/drift-funding/fetch/all', { method: 'POST' })
  .then(response => response.json())
  .then(result => {
    console.log('Data update complete:', result);
  });
```