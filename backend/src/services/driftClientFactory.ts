import { Connection, Commitment, PublicKey } from '@solana/web3.js';
import { DriftClient, Wallet, DRIFT_PROGRAM_ID as DRIFT_PROGRAM_ID_STRING } from '@drift-labs/sdk';
import { WalletService } from './walletService.js';

// Convert Drift program ID string to PublicKey
const DRIFT_PROGRAM_ID = new PublicKey(DRIFT_PROGRAM_ID_STRING);

/**
 * Factory service for creating and managing Drift clients
 */
export class DriftClientFactory {
  /**
   * Create a Drift client instance
   * @param connection - Solana connection
   * @param wallet - Wallet instance
   * @param env - Environment ('devnet' or 'mainnet-beta')
   * @param programID - Optional custom program ID
   * @returns DriftClient instance
   */
  static createDriftClient(
    connection: Connection,
    wallet: Wallet,
    env: 'devnet' | 'mainnet-beta',
    programID: PublicKey = DRIFT_PROGRAM_ID
  ): DriftClient {
    return new DriftClient({
      connection,
      wallet,
      programID,
      env,
      accountSubscription: { type: 'websocket' },
    });
  }

  /**
   * Initialize a Drift client from environment variables
   * @param rpcEndpoint - RPC endpoint URL
   * @param keypairPath - Path to keypair file
   * @param env - Environment ('devnet' or 'mainnet-beta')
   * @param commitment - Transaction commitment level
   * @returns DriftClient instance
   */
  static initializeFromEnv(
    rpcEndpoint: string,
    keypairPath: string,
    env: 'devnet' | 'mainnet-beta',
    commitment: Commitment = 'confirmed'
  ): DriftClient {
    const { connection, wallet } = WalletService.initializeFromEnv(
      rpcEndpoint,
      keypairPath,
      commitment
    );
    
    return this.createDriftClient(connection, wallet, env);
  }
}