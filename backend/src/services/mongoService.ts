import { MongoClient, Collection, Db, Document } from 'mongodb';

/**
 * Service for managing MongoDB connections and operations
 */
export class MongoService {
  private static client: MongoClient | null = null;
  private static db: Db | null = null;
  
  /**
   * Initialize the MongoDB connection
   * @returns Promise that resolves when connection is established
   */
  static async connect(): Promise<void> {
    if (this.client) {
      return; // Already connected
    }
    
    let uri = process.env.MONGO_URL;
    const dbName = process.env.MONGO_DB;
    
    // If MONGO_URL is not defined, try to build it from individual components
    if (!uri) {
      const host = process.env.MONGOHOST;
      const port = process.env.MONGOPORT;
      const user = process.env.MONGOUSER;
      const password = process.env.MONGOPASSWORD;
      
      if (host && port && user && password) {
        uri = `mongodb://${user}:${password}@${host}:${port}`;
      } else {
        throw new Error('MongoDB connection details not found in environment variables');
      }
    }
    
    if (!dbName) {
      throw new Error('MONGO_DB environment variable is not defined');
    }
    
    try {
      this.client = new MongoClient(uri);
      await this.client.connect();
      this.db = this.client.db(dbName);
      console.log(`Connected to MongoDB database: ${dbName}`);
    } catch (error) {
      console.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }
  
  /**
   * Get a collection from the database
   * @param collectionName - Name of the collection
   * @returns MongoDB collection
   */
  static getCollection<T extends Document = Document>(collectionName: string): Collection<T> {
    if (!this.db) {
      throw new Error('Database connection not established. Call connect() first.');
    }
    
    return this.db.collection<T>(collectionName);
  }
  
  /**
   * Get the database instance
   * @returns MongoDB database instance
   */
  static getDb(): Db | null {
    return this.db;
  }
  
  /**
   * Close the MongoDB connection
   */
  static async disconnect(): Promise<void> {
    if (this.client) {
      await this.client.close();
      this.client = null;
      this.db = null;
      console.log('Disconnected from MongoDB');
    }
  }
}