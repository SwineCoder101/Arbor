#!/bin/bash
# Test script for Drift Funding Rates API endpoints

# Set base URL - change this to match your server
BASE_URL="http://localhost:3000/api/drift-funding-rates"
# Set a test market (SOL-PERP is usually available)
TEST_MARKET="SOL-PERP"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Testing Drift Funding Rates API endpoints...${NC}\n"

# Function to make a request and check status
test_endpoint() {
  local method=$1
  local endpoint=$2
  local description=$3
  
  echo -e "${BLUE}Testing ${method} ${endpoint}${NC}"
  echo -e "${BLUE}${description}${NC}"
  
  # Make the request
  if [ "$method" = "GET" ]; then
    response=$(curl -s -o /dev/null -w "%{http_code}" "${BASE_URL}${endpoint}")
  else
    response=$(curl -s -o /dev/null -w "%{http_code}" -X "${method}" "${BASE_URL}${endpoint}")
  fi
  
  # Check response
  if [ "$response" = "200" ]; then
    echo -e "${GREEN}✓ Success (HTTP $response)${NC}\n"
  else
    echo -e "${RED}✗ Failed (HTTP $response)${NC}\n"
  fi
}

# GET endpoints
test_endpoint "GET" "/latest" "Getting latest funding rates for all markets"
test_endpoint "GET" "/market/${TEST_MARKET}" "Getting funding rate history for ${TEST_MARKET}"
test_endpoint "GET" "/stats/${TEST_MARKET}?days=7" "Getting funding rate stats for ${TEST_MARKET} (7 days)"

# Note: The POST endpoints are commented out by default to avoid unwanted data changes
# Uncomment these if you want to test the POST endpoints

# POST endpoints (these will actually store data)
#test_endpoint "POST" "/store?forceInsert=false" "Storing all funding rates data (upsert mode)"
#test_endpoint "POST" "/store/${TEST_MARKET}?forceInsert=false" "Storing funding rates for ${TEST_MARKET} (upsert mode)"

echo -e "${BLUE}To actually fetch and store data, run:${NC}"
echo -e "${BLUE}curl -X POST ${BASE_URL}/store${NC}"
echo -e "${BLUE}curl -X POST ${BASE_URL}/store/${TEST_MARKET}${NC}"

# Detailed output for one endpoint as an example
echo -e "\n${BLUE}Example of full response for GET /latest:${NC}"
curl -s "${BASE_URL}/latest" | jq . 2>/dev/null || echo "Response too large or jq not installed"

echo -e "\n${BLUE}Example of full response for GET /market/${TEST_MARKET}:${NC}"
curl -s "${BASE_URL}/market/${TEST_MARKET}" | jq . 2>/dev/null || echo "Response too large or jq not installed"

echo -e "\n${BLUE}Complete!${NC}"