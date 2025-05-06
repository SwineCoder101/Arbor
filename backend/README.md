# Backend Services

This backend provides services for both:
1. Express Redis Storage API
2. Drift Protocol Perpetual Markets Data Service

## Express Redis Storage API

A simple Express API that connects to Redis for storing and retrieving JSON data.

### Requirements

- Node.js 
- Redis server running locally

### Setup

1. Install dependencies:
```bash
npm install
```

2. Make sure Redis is running:
```bash
# Check Redis status or start it if it's not running
redis-cli ping
```

3. Start the development server:
```bash
npm run dev
```

### API Endpoints

#### Store Data
- **POST** `/data`
- **Body**:
  ```json
  {
    "key": "your-key",
    "data": {
      "any": "json data",
      "can": "go here"
    }
  }
  ```
- **Response**: 
  - Success (201):
    ```json
    {
      "message": "Data stored successfully"
    }
    ```
  - Error (400): Missing key or data
  - Error (500): Server error

#### Retrieve Data
- **GET** `/data/:key`
- **Response**:
  - Success (200):
    ```json
    {
      "data": {
        "any": "json data",
        "can": "go here"
      }
    }
    ```
  - Error (404): Data not found
  - Error (500): Server error

## Drift Perpetual Markets Data Service

This service provides functionality to interact with Drift Protocol's perpetual markets.

### Features

- Wallet management abstraction
- Drift client initialization
- Perpetual markets data retrieval

### Setup

1. Create a `.env` file based on `.env.example`:
```bash
cp .env.example .env
```

2. Edit the `.env` file with your Solana RPC endpoint and keypair path:
```
RPC_ENDPOINT=https://api.devnet.solana.com  # or mainnet RPC
KEYPAIR=/path/to/your/keypair.json
CLUSTER=devnet  # or mainnet-beta
```

### Testing

Run the test suite:
```bash
npm test
```

### Usage

The services provide a clean abstraction for wallet management and Drift client initialization:

```typescript
// Example initialization
import { DriftClientFactory } from './services/driftClientFactory.js';
import { DriftPerpsDataService } from './services/driftPerpsData.js';

// Initialize Drift client using environment variables
const driftClient = DriftClientFactory.initializeFromEnv(
  process.env.RPC_ENDPOINT!,
  process.env.KEYPAIR!,
  process.env.CLUSTER as 'devnet' | 'mainnet-beta'
);

// Create perps data service
const driftPerpsService = new DriftPerpsDataService(driftClient);

// Get all perp markets with details
const perpMarketsDetails = await driftPerpsService.getPerpMarketsDetails();
```

### Running the Example

With a properly configured `.env` file:
```bash
npx tsx src/examples/driftPerpsExample.ts
```

### Documentation

For detailed documentation on the Drift services and methods, see:
- [Drift Perps Services Documentation](./src/docs/drift-perps-services.md)

## Building for Production
```bash
npm run build
npm start
```