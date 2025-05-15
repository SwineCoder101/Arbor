import { Connection, Keypair, Commitment, PublicKey } from '@solana/web3.js';
import {
  CrossClient,
  Exchange,
  Network,
  utils,
  types,
  assets,
  constants,
} from '@zetamarkets/sdk';
import { Wallet } from '@zetamarkets/anchor';
import { WalletService } from './walletService.js';
import fetch from 'node-fetch';

// Mainnet program ID
const ZETA_MAINNET_PROGRAM_ID = new PublicKey('ZETAxsqBRek56DhiGXrn75yj2NHU3aYUnxvHXpkf3aD');
// Devnet program ID
const ZETA_DEVNET_PROGRAM_ID = new PublicKey('BG3oRikW8d16YjUEmX3ZxHm9SiJzrGtMhsSR8aCw1Cd7');

export class ZetaClientFactory {
  /**
   * Initialize Zeta Markets Exchange
   * @param connection - Solana connection
   * @param wallet - Zeta Markets wallet
   * @param network - Network type ('devnet' or 'mainnet-beta')
   * @param serverUrl - Optional server URL for faucet operations
   * @returns Promise resolving to initialized Exchange singleton
   */
  static async initializeExchange(
    connection: Connection,
    wallet: Wallet,
    networkName: 'devnet' | 'mainnet-beta',
    serverUrl?: string
  ): Promise<typeof Exchange> {
    // Convert network name to Zeta Markets Network enum
    const network = networkName === 'devnet' ? Network.DEVNET : Network.MAINNET;
    
    // Configure load exchange options
    const loadExchangeConfig = types.defaultLoadExchangeConfig(
      network,
      connection,
      utils.defaultCommitment(),
      0, // ThrottleMs - increase if you are running into rate limit issues on startup
      true // LoadFromStore - whether to load market addresses from static storage (faster)
    );

    // Load the SDK exchange singleton
    await Exchange.load(loadExchangeConfig);
    
    // If devnet environment and server URL is provided, we can request USDC from faucet
    if (network === Network.DEVNET && serverUrl && wallet) {
      await this.requestUsdcFromFaucet(connection, wallet, serverUrl);
    }
    
    return Exchange;
  }

  /**
   * Request USDC from faucet (devnet only)
   * @param connection - Solana connection
   * @param wallet - Wallet to fund
   * @param serverUrl - Faucet server URL
   * @param amount - Amount of USDC to request (default 10,000)
   */
  static async requestUsdcFromFaucet(
    connection: Connection,
    wallet: Wallet,
    serverUrl: string,
    amount: number = 10_000
  ): Promise<void> {
    // Only available on devnet
    await fetch(`${serverUrl}/faucet/USDC`, {
      method: 'post',
      body: JSON.stringify({
        key: wallet.publicKey.toString(),
        amount: amount,
      }),
      headers: { 'Content-Type': 'application/json' },
    });
  }

  /**
   * Create a CrossClient instance for Zeta Markets
   * @param connection - Solana connection
   * @param wallet - Wallet instance
   * @param networkName - Network type ('devnet' or 'mainnet-beta')
   * @returns Promise resolving to CrossClient instance
   */
  static async createCrossClient(
    connection: Connection,
    wallet: Wallet,
    networkName: 'devnet' | 'mainnet-beta'
  ): Promise<CrossClient> {
    // Convert network name to Zeta Markets Network enum
    const network = networkName === 'devnet' ? Network.DEVNET : Network.MAINNET;
    
    // Load the CrossClient
    return await CrossClient.load(
      connection, 
      wallet,
      undefined, // Default confirm options
      undefined, // Callback
      false      // Throttle
    );
  }

  /**
   * Initialize from environment variables
   * @param rpcEndpoint - RPC endpoint URL
   * @param keypairPath - Path to keypair file
   * @param networkName - Network type ('devnet' or 'mainnet-beta')
   * @param serverUrl - Optional server URL for faucet operations
   * @param commitment - Transaction commitment level
   * @returns Promise resolving to initialized CrossClient
   */
  static async initializeFromEnv(
    rpcEndpoint: string,
    keypairPath: string,
    networkName: 'devnet' | 'mainnet-beta',
    serverUrl?: string,
    commitment: Commitment = 'confirmed'
  ): Promise<CrossClient> {
    // Initialize connection and wallet
    const { connection, wallet } = WalletService.initializeFromEnv(
      rpcEndpoint,
      keypairPath,
      commitment
    );
    
    // Initialize Exchange singleton first
    await this.initializeExchange(connection, wallet, networkName, serverUrl);
    
    // Return CrossClient instance
    return await this.createCrossClient(connection, wallet, networkName);
  }
}
