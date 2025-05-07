# Backend Services

This backend provides services for both:
1. Market Data Storage and Retrieval with MongoDB
2. Drift Protocol Perpetual Markets Data Service
3. Historical Data API

## Setup

1. Install dependencies:
```bash
npm install
```

2. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

3. Edit the `.env` file with your configuration:
```
# Server settings
PORT=3000

# Data collection settings
COLLECT_DATA_ON_START=false
DATA_COLLECTION_INTERVAL_MINUTES=30

# MongoDB settings
MONGO_URL=mongodb://mongo:password@hostname:port
MONGO_DB=mainnet

# Solana settings
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
KEYPAIR=/path/to/your/keypair.json
CLUSTER=mainnet-beta
```

4. Start the development server:
```bash
npm run dev
```

## API Endpoints and Example Requests

### Market Data API

The Market Data API provides access to perpetual market data stored in MongoDB.

#### Get All Markets
Retrieve latest data for all markets:
```bash
curl http://localhost:3000/api/markets
```

Filter by a specific DEX:
```bash
curl "http://localhost:3000/api/markets?dex=drift"
```

#### Get a Specific Market
Retrieve data for a specific market by ticker:
```bash
curl http://localhost:3000/api/markets/SOL-PERP
```

#### Get Market History
Retrieve historical data for a specific market:
```bash
curl http://localhost:3000/api/markets/SOL-PERP/history
```

Limit the number of records:
```bash
curl "http://localhost:3000/api/markets/SOL-PERP/history?limit=10"
```

#### Get Funding Rate History
Retrieve funding rate history for a specific market:
```bash
curl http://localhost:3000/api/markets/SOL-PERP/funding
```

#### Get TWAP Price History
Retrieve TWAP price history for a specific market:
```bash
curl http://localhost:3000/api/markets/SOL-PERP/twap
```

### Historical Data API

The Historical Data API provides access to historical data from Drift Protocol.

#### Market Funding Rates
Retrieve funding rates for a specific market on a specific date (YYYYMMDD):
```bash
curl "http://localhost:3000/api/historical/market/SOL-PERP/funding-rates/20240319"
```

#### Market Trades
Retrieve trades for a specific market on a specific date:
```bash
curl "http://localhost:3000/api/historical/market/SOL-PERP/trades/20240319"
```

#### Insurance Fund
Retrieve insurance fund data for a specific market:
```bash
curl "http://localhost:3000/api/historical/market/SOL-PERP/insurance-fund/20240319"
```

#### User Trades
Retrieve trades for a specific user:
```bash
curl "http://localhost:3000/api/historical/user/USER_ACCOUNT_KEY/trades/20240319"
```

#### User Funding Payments
Retrieve funding payments for a specific user:
```bash
curl "http://localhost:3000/api/historical/user/USER_ACCOUNT_KEY/funding-payments/20240319"
```

### Data Management API

#### Manual Data Collection
Trigger manual data collection and update:
```bash
curl -X POST http://localhost:3000/api/markets/collect
```

Store as historical snapshot without updating existing records:
```bash
curl -X POST "http://localhost:3000/api/markets/collect?historical=true"
```

### Diagnostic API Endpoints

#### Check BN Conversion
Test BigNumber conversion from MongoDB storage:
```bash
curl http://localhost:3000/api/markets/test/bn-conversion
```

#### Get Raw MongoDB Data
Examine raw data stored in MongoDB:
```bash
curl http://localhost:3000/api/markets/test/raw
```

#### List Available Fields
See all available fields in the market data:
```bash
curl http://localhost:3000/api/markets/test/fields
```

## Drift Perpetual Markets Data Service

This service provides functionality to interact with Drift Protocol's perpetual markets.

### Features

- Wallet management abstraction
- Drift client initialization
- Perpetual markets data retrieval and storage in MongoDB
- BigNumber handling for precision arithmetic

### Testing

Run the test suite:
```bash
npm test
```

### Documentation

For detailed documentation on the Drift services and methods, see:
- [Drift Perps Services Documentation](./src/docs/drift-perps-services.md)
- [Historical Data API Documentation](./src/docs/historical-data-api.md)

## Building for Production
```bash
npm run build
npm start
```