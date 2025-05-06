import dotenv from "dotenv"
dotenv.config();
import express, { Request, Response } from 'express';
import { createClient } from 'redis';
// Interface for request body
import { StoreDataRequest } from '#types.js';
import historicalDataRoutes from './routes/historicalDataRoutes.js';

// App setup
const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(express.json());

// Create Redis client
const redisPass = process.env.REDIS_PASS;
const redisHost = process.env.REDIS_HOST;
const redisPort = process.env.REDIS_PORT;

const url = `redis://:${redisPass}@${redisHost}:${redisPort}`
console.log(`Connecting to Redis at @${redisHost}:${redisPort}`)
const redisClient = createClient({url:url})
await redisClient.connect();
if (await redisClient.ping() === 'PONG') {
  console.log("redis connected")
}
redisClient.on('error', (err) => console.log('Redis Client Error', err));


// Self-invoking async function to connect Redis and start server
(async () => {
  
  // API route to store data
  app.post('/data', (req: Request, res: Response) => {
    const { key, data } = req.body as StoreDataRequest;
    
    if (!key || !data) {
      return res.status(400).json({ error: 'Key and data are required' });
    }
    
    // Store stringified JSON data
    const jsonString = JSON.stringify(data);
    redisClient.set(key, jsonString)
      .then(() => {
        res.status(201).json({ message: 'Data stored successfully' });
      })
      .catch((error) => {
        console.error('Error storing data:', error);
        res.status(500).json({ error: 'Failed to store data' });
      });
  });
  
  // API route to retrieve data
  app.get('/data/:key', (req: Request, res: Response) => {
    const { key } = req.params;
    
    // Get data from Redis
    redisClient.get(key)
      .then((jsonString) => {
        if (!jsonString) {
          return res.status(404).json({ error: 'Data not found' });
        }
        
        // Parse JSON string back to object
        const data = JSON.parse(jsonString);
        res.json({ data });
      })
      .catch((error) => {
        console.error('Error retrieving data:', error);
        res.status(500).json({ error: 'Failed to retrieve data' });
      });
  });
  
  // Register historical data routes
  app.use('/api/historical', historicalDataRoutes);
  
  // Start the server
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
})();
