import dotenv from "dotenv";
dotenv.config();
import { Application } from "#app.js";

// Get configuration from environment variables
const port = parseInt(process.env.PORT || '3000', 10);
const collectDataOnStart = process.env.COLLECT_DATA_ON_START !== 'false'; // Default to true
const dataCollectionInterval = parseInt(process.env.DATA_COLLECTION_INTERVAL_MINUTES || '30', 10);

// Create application instance with configuration
const app = new Application({
  collectDataOnStart,
  dataCollectionIntervalMinutes: dataCollectionInterval
});

// Start the application
(async () => {
  try {
    await app.initialize();
    await app.start(port);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      await app.shutdown();
      process.exit(0);
    });
    
    process.on('SIGTERM', async () => {
      await app.shutdown();
      process.exit(0);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
})();
