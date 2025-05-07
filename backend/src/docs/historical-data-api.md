# Historical Data API Documentation

This API provides access to Drift Protocol historical data including trades, funding rates, deposits, liquidations, and more.

## Base URL
```
http://localhost:3000/api/historical
```

## Endpoints

### User Specific Data

#### Get User Trades
```
GET /user/:accountKey/trades/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

#### Get User Funding Payments
```
GET /user/:accountKey/funding-payments/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

#### Get User Deposits
```
GET /user/:accountKey/deposits/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

#### Get User Liquidations
```
GET /user/:accountKey/liquidations/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

#### Get User Settle PNL
```
GET /user/:accountKey/settle-pnl/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

#### Get User LP Records
```
GET /user/:accountKey/lp-records/:date
```
- `accountKey`: User sub account public key
- `date`: Date in YYYYMMDD format

### Market Specific Data

#### Get Market Trades
```
GET /market/:marketSymbol/trades/:date
```
- `marketSymbol`: Market name (e.g., SOL-PERP)
- `date`: Date in YYYYMMDD format

#### Get Market Funding Rates
```
GET /market/:marketSymbol/funding-rates/:date
```
- `marketSymbol`: Market name (e.g., SOL-PERP)
- `date`: Date in YYYYMMDD format

#### Get Market Insurance Fund
```
GET /market/:marketSymbol/insurance-fund/:date
```
- `marketSymbol`: Market name (e.g., SOL-PERP)
- `date`: Date in YYYYMMDD format

### Authority Specific Data

#### Get Insurance Fund Stake
```
GET /authority/:authorityAccountKey/insurance-fund-stake/:date
```
- `authorityAccountKey`: Authority account public key
- `date`: Date in YYYYMMDD format

## Response Format

All endpoints return JSON data in the original format provided by the Drift protocol.

### Success Response
```json
{
  "data": [
    // Array of records
  ]
}
```

### Error Response
```json
{
  "error": "Error message"
}
```

## Error Codes
- 400: Bad Request (Invalid parameters)
- 404: Not Found (Data not found for the requested date or parameters)
- 500: Internal Server Error

## Examples

### Example Request
```
GET /api/historical/market/SOL-PERP/trades/20240101
```

### Example Response
```json
{
  "data": [
    {
      "ts": 1704067200000,
      "takerSide": "sell",
      "marketIndex": 5,
      "amount": "0.1",
      "price": "112.58"
    },
    // More trade records...
  ]
}
```