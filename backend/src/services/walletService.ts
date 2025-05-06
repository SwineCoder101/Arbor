import { Connection, Keypair, Commitment, PublicKey } from '@solana/web3.js';
import { Wallet } from '@drift-labs/sdk';
import * as fs from 'fs';

/**
 * Service for handling wallet operations
 */
export class WalletService {
  /**
   * Load a keypair from a file path
   * @param keyPath - Path to the keypair file
   * @returns The loaded Keypair
   */
  static loadKeypair(keyPath: string): Keypair {
    try {
      const keypairData = JSON.parse(fs.readFileSync(keyPath, 'utf-8'));
      return Keypair.fromSecretKey(new Uint8Array(keypairData));
    } catch (error) {
      console.error('Error loading keypair:', error);
      throw new Error(`Failed to load keypair from ${keyPath}`);
    }
  }

  /**
   * Create a wallet from a keypair
   * @param keypair - The keypair to create the wallet from
   * @returns A wallet instance
   */
  static createWalletFromKeypair(keypair: Keypair): Wallet {
    return new Wallet(keypair);
  }

  /**
   * Create a Solana connection
   * @param endpoint - RPC endpoint URL
   * @param commitment - Transaction commitment level
   * @returns Solana connection instance
   */
  static createConnection(endpoint: string, commitment: Commitment = 'confirmed'): Connection {
    return new Connection(endpoint, commitment);
  }

  /**
   * Get the token address for a specific mint and owner
   * @param mintAddress - Mint address as string
   * @param ownerAddress - Owner address as string
   * @returns Promise resolving to the token address
   */
  static async getTokenAddress(mintAddress: string, ownerAddress: string): Promise<PublicKey> {
    const { getAssociatedTokenAddress } = await import('@solana/spl-token');
    return getAssociatedTokenAddress(
      new PublicKey(mintAddress),
      new PublicKey(ownerAddress)
    );
  }

  /**
   * Initialize connection and wallet from environment variables
   * @param rpcEndpoint - RPC endpoint URL
   * @param keypairPath - Path to keypair file
   * @param commitment - Transaction commitment level
   * @returns Object containing connection and wallet
   */
  static initializeFromEnv(
    rpcEndpoint: string, 
    keypairPath: string, 
    commitment: Commitment = 'confirmed'
  ): { connection: Connection; wallet: Wallet } {
    const connection = this.createConnection(rpcEndpoint, commitment);
    const keypair = this.loadKeypair(keypairPath);
    const wallet = this.createWalletFromKeypair(keypair);
    
    return { connection, wallet };
  }
}