import dotenv from "dotenv"
dotenv.config();
import express, { Request, Response } from 'express';
// Interface for request body
import { StoreDataRequest } from '#types.js';
import historicalDataRoutes from './routes/historicalDataRoutes.js';

// App setup
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());



// Self-invoking async function to connect Redis and start server
(async () => {
  
  // Register historical data routes
  app.use('/api/historical', historicalDataRoutes);
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();
