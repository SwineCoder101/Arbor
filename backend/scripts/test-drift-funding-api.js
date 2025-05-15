/**
 * Test script for Drift Funding Rates API
 * Run with: node scripts/test-drift-funding-api.js
 */

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:3000/api/drift-funding-rates';
const TEST_MARKET = 'SOL-PERP';

// Helper for console output
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  blue: '\x1b[34m',
  yellow: '\x1b[33m'
};

// Format console output
const log = {
  info: (msg) => console.log(`${colors.blue}${msg}${colors.reset}`),
  success: (msg) => console.log(`${colors.green}✓ ${msg}${colors.reset}`),
  error: (msg) => console.log(`${colors.red}✗ ${msg}${colors.reset}`),
  json: (data) => console.log(JSON.stringify(data, null, 2))
};

// Test a specific endpoint
async function testEndpoint(method, endpoint, description) {
  log.info(`\nTesting ${method} ${endpoint}`);
  log.info(description);
  
  try {
    const url = `${BASE_URL}${endpoint}`;
    const response = await axios({
      method,
      url,
      timeout: 5000
    });
    
    log.success(`Success (HTTP ${response.status})`);
    
    // Return a sample of the data (first item or truncated response)
    if (response.data && response.data.data) {
      if (Array.isArray(response.data.data)) {
        return response.data.data.length > 0 ? 
          { sample: response.data.data[0], count: response.data.data.length } : 
          { count: 0 };
      } else {
        return { sample: response.data.data };
      }
    }
    return { status: response.status };
  } catch (error) {
    const status = error.response ? error.response.status : 'No response';
    log.error(`Failed (HTTP ${status}): ${error.message}`);
    return { error: error.message };
  }
}

// Main test function
async function runTests() {
  log.info('Testing Drift Funding Rates API endpoints...');
  
  // GET endpoints
  const latestResult = await testEndpoint('GET', '/latest', 'Getting latest funding rates for all markets');
  const marketResult = await testEndpoint('GET', `/market/${TEST_MARKET}`, `Getting funding rate history for ${TEST_MARKET}`);
  const statsResult = await testEndpoint('GET', `/stats/${TEST_MARKET}?days=7`, `Getting funding rate stats for ${TEST_MARKET} (7 days)`);
  
  // Show some results
  if (latestResult.count) {
    log.info(`\nFound ${latestResult.count} markets. Sample data:`);
    log.json(latestResult.sample);
  }
  
  if (marketResult.count) {
    log.info(`\nFound ${marketResult.count} funding rate records for ${TEST_MARKET}. Sample data:`);
    log.json(marketResult.sample);
  }
  
  if (statsResult.sample) {
    log.info(`\nFunding rate stats for ${TEST_MARKET}:`);
    log.json(statsResult.sample);
  }
  
  // POST endpoints (commented out to avoid unwanted data changes)
  // Uncomment these if you want to test the POST endpoints
  /*
  log.info('\nTesting POST endpoints (these will actually store data)');
  await testEndpoint('POST', '/store?forceInsert=false', 'Storing all funding rates data (upsert mode)');
  await testEndpoint('POST', `/store/${TEST_MARKET}?forceInsert=false`, `Storing funding rates for ${TEST_MARKET} (upsert mode)`);
  */
  
  log.info('\nTo actually fetch and store data, run:');
  log.info(`curl -X POST ${BASE_URL}/store`);
  log.info(`curl -X POST ${BASE_URL}/store/${TEST_MARKET}`);
  
  log.info('\nTest complete!');
}

// Run the tests
runTests().catch(error => {
  console.error('Error running tests:', error);
  process.exit(1);
});