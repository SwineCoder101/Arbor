# Drift Perpetual Markets Services

This documentation describes the services for interacting with Drift Protocol's perpetual markets.

## Services Overview

1. **WalletService** - Manages Solana wallet operations, keypair loading, and connection creation.
2. **DriftClientFactory** - Factory for creating and managing Drift client instances.
3. **DriftPerpsDataService** - Service for fetching and processing perpetual market data from Drift Protocol.

## Environment Setup

Create a `.env` file with the following variables:

```
RPC_ENDPOINT=https://api.mainnet-beta.solana.com
KEYPAIR=/path/to/your/keypair.json
CLUSTER=mainnet-beta  # or 'devnet'
```

## Usage Examples

### Initializing Services

```typescript
import { DriftClientFactory } from '../services/driftClientFactory.js';
import { DriftPerpsDataService } from '../services/driftPerpsData.js';
import dotenv from 'dotenv';

dotenv.config();

// Initialize Drift client using factory
const driftClient = DriftClientFactory.initializeFromEnv(
  process.env.RPC_ENDPOINT!,
  process.env.KEYPAIR!,
  process.env.CLUSTER as 'devnet' | 'mainnet-beta'
);

// Create perps data service
const driftPerpsService = new DriftPerpsDataService(driftClient);

// Subscribe to the Drift program
await driftClient.subscribe();

// Always clean up when done
await driftPerpsService.cleanup();
```

### Fetching Perpetual Market Data

```typescript
// Get all perp markets with details
const perpMarketsDetails = await driftPerpsService.getPerpMarketsDetails();

// Get a specific market by index
const solPerpMarket = await driftPerpsService.getPerpMarketByIndex(0); // SOL-PERP is typically index 0

// Check if user account exists, initialize if it doesn't
const userPK = await driftPerpsService.checkUserExistsInitialiseIfNot();

// Get user's open positions
const userPositions = await driftPerpsService.getUserPerpPositions();
```

## Service Architecture

- **WalletService**: Handles wallet-related operations like loading keypairs and creating Solana connections.
- **DriftClientFactory**: Creates preconfigured DriftClient instances with proper settings.
- **DriftPerpsDataService**: Provides methods for fetching and processing perpetual market data.

## Testing

Tests are written using Vitest. Run the tests with:

```bash
npm run test
```

## Example Script

See `src/examples/driftPerpsExample.ts` for a complete working example that:
1. Loads environment variables
2. Initializes the Drift client
3. Fetches all perpetual markets
4. Gets user positions
5. Properly cleans up resources

Run the example with:

```bash
npx tsx src/examples/driftPerpsExample.ts
```