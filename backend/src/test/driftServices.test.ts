import { describe, it, beforeEach, afterEach, expect, vi } from 'vitest';
import { Connection, Keypair, PublicKey } from '@solana/web3.js';
import { Wallet, DriftClient } from '@drift-labs/sdk';
import { DriftPerpsDataService } from '../services/driftPerpsData.js';
import { WalletService } from '../services/walletService.js';
import { DriftClientFactory } from '../services/driftClientFactory.js';

// Mock the modules
vi.mock('@solana/web3.js', async () => {
  const actual = await vi.importActual('@solana/web3.js');
  return {
    ...actual,
    Connection: vi.fn(),
    Keypair: {
      fromSecretKey: vi.fn(),
    },
  };
});

vi.mock('@drift-labs/sdk', async () => {
  const actual = await vi.importActual('@drift-labs/sdk');
  return {
    ...actual,
    DriftClient: vi.fn().mockImplementation(() => ({
      subscribe: vi.fn().mockResolvedValue(undefined),
      unsubscribe: vi.fn().mockResolvedValue(undefined),
      getPerpMarketAccounts: vi.fn(),
      getPerpMarketAccount: vi.fn(),
      getUserAccount: vi.fn(),
      getUserAccountPublicKey: vi.fn(),
      getOracleDataForPerpMarket: vi.fn(),
      initializeUserAccount: vi.fn(),
    })),
    Wallet: vi.fn(),
  };
});

vi.mock('fs', () => ({
  readFileSync: vi.fn().mockReturnValue(JSON.stringify(Array(32).fill(1))),
}));

describe('WalletService', () => {
  it('should load a keypair from a file', () => {
    const keypair = WalletService.loadKeypair('/path/to/keypair.json');
    expect(Keypair.fromSecretKey).toHaveBeenCalled();
  });

  it('should create a connection', () => {
    const connection = WalletService.createConnection('https://api.mainnet-beta.solana.com');
    expect(Connection).toHaveBeenCalledWith('https://api.mainnet-beta.solana.com', 'confirmed');
  });

  it('should initialize from environment variables', () => {
    const { connection, wallet } = WalletService.initializeFromEnv(
      'https://api.mainnet-beta.solana.com',
      '/path/to/keypair.json'
    );
    expect(Connection).toHaveBeenCalled();
    expect(Wallet).toHaveBeenCalled();
  });
});

describe('DriftClientFactory', () => {
  let mockConnection: Connection;
  let mockWallet: Wallet;

  beforeEach(() => {
    mockConnection = new Connection('url') as any;
    mockWallet = new Wallet({} as any) as any;
  });

  it('should create a drift client', () => {
    const client = DriftClientFactory.createDriftClient(
      mockConnection,
      mockWallet,
      'mainnet-beta'
    );
    expect(DriftClient).toHaveBeenCalled();
    // We can't test the exact arguments since programID might be different
  });

  it('should initialize from environment variables', () => {
    const client = DriftClientFactory.initializeFromEnv(
      'https://api.mainnet-beta.solana.com',
      '/path/to/keypair.json',
      'devnet'
    );
    expect(DriftClient).toHaveBeenCalled();
  });
});

describe('DriftPerpsDataService', () => {
  let mockDriftClient: DriftClient;
  let service: DriftPerpsDataService;

  beforeEach(() => {
    mockDriftClient = new DriftClient({} as any);
    service = new DriftPerpsDataService(mockDriftClient);
    
    // Setup mocks
    mockDriftClient.getPerpMarketAccounts = vi.fn().mockReturnValue([
      {
        name: new Uint8Array([83, 79, 76, 45, 80, 69, 82, 80, 0, 0, 0, 0, 0, 0, 0, 0]), // "SOL-PERP"
        marketIndex: 0,
        pubkey: new PublicKey('11111111111111111111111111111111'),
        amm: { 
          lastFundingRate: 1,
          lastFundingRateTs: 123456789,
          historicalOracleData: { lastOraclePriceTwap5Min: 100 }
        },
        nextFundingRateRecordId: 123,
        status: { initialized: {} }
      }
    ]);
    
    mockDriftClient.getUserAccount = vi.fn().mockReturnValue({
      perpPositions: [
        { 
          marketIndex: 0,
          baseAssetAmount: BigInt(1000),
          quoteAssetAmount: BigInt(1000),
          lastCumulativeFundingRate: 1,
          openOrders: 2,
          unsettledPnl: BigInt(100)
        }
      ]
    });
    
    mockDriftClient.activeSubAccountId = 0;
    mockDriftClient.getOracleDataForPerpMarket = vi.fn().mockReturnValue({ price: 100 });
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should get all perp markets', async () => {
    const result = await service.getAllPerpMarkets();
    expect(mockDriftClient.getPerpMarketAccounts).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].marketIndex).toBe(0);
  });

  it('should get perp market details', async () => {
    const result = await service.getPerpMarketsDetails();
    expect(result).toHaveLength(1);
    // Check that the ticker contains SOL-PERP without exact string matching
    expect(result[0].ticker).toContain('SOL-PERP');
    expect(result[0].marketIndex).toBe(0);
    expect(mockDriftClient.getOracleDataForPerpMarket).toHaveBeenCalledWith(0);
  });

  it('should get user perp positions', async () => {
    const result = await service.getUserPerpPositions();
    expect(mockDriftClient.getUserAccount).toHaveBeenCalled();
    expect(result).toHaveLength(1);
    expect(result[0].marketIndex).toBe(0);
  });

  it('should check user exists and initialize if not', async () => {
    mockDriftClient.getUserAccountPublicKey = vi.fn().mockReturnValue(
      new PublicKey('11111111111111111111111111111111')
    );
    
    const result = await service.checkUserExistsInitialiseIfNot();
    expect(mockDriftClient.getUserAccount).toHaveBeenCalled();
    expect(result).toBeInstanceOf(PublicKey);
  });

  it('should initialize user account if it does not exist', async () => {
    mockDriftClient.getUserAccount = vi.fn().mockReturnValue(null);
    mockDriftClient.getUserAccountPublicKey = vi.fn().mockReturnValue(
      new PublicKey('11111111111111111111111111111111')
    );
    
    const result = await service.checkUserExistsInitialiseIfNot();
    expect(mockDriftClient.initializeUserAccount).toHaveBeenCalled();
    expect(result).toBeInstanceOf(PublicKey);
  });

  it('should properly cleanup by unsubscribing', async () => {
    await service.cleanup();
    expect(mockDriftClient.unsubscribe).toHaveBeenCalled();
  });
});