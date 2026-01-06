# ForgeBase Backend API

Backend API for ForgeBase - Smart Contract Workbench for Base. Provides endpoints for transaction decoding, event decoding, contract information, and transaction receipts.

## Base URL

All endpoints are prefixed with `/api/v1` (configurable via `API_PREFIX` env variable).

## Endpoints

### Health Check

**GET** `/health`

Check if the server is running.

**Response:**
```json
{
  "success": true,
  "message": "Server is healthy",
  "timestamp": "2024-01-01T00:00:00.000Z"
}
```

### Transactions

#### Decode Transaction

**POST** `/api/v1/transactions/decode`

Decode a transaction hash to get detailed information including call trace, events, and state changes.

**Request Body:**
```json
{
  "txHash": "0x...",
  "network": "mainnet" // or "testnet"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "txHash": "0x...",
    "status": "success",
    "blockNumber": "12345",
    "timestamp": "2024-01-01 00:00:00 UTC",
    "gasUsed": "21,000",
    "gasPrice": "20.00",
    "from": "0x...",
    "to": "0x...",
    "value": "0",
    "callTrace": { ... },
    "events": [ ... ],
    "stateChanges": [ ... ]
  }
}
```

#### Get Transaction

**GET** `/api/v1/transactions/:txHash?network=mainnet`

Get decoded transaction information by hash (same as decode endpoint but via GET).

**Query Parameters:**
- `network` (optional): `mainnet` or `testnet` (default: `mainnet`)

### Contracts

#### Get Contract

**GET** `/api/v1/contracts?address=0x...&network=mainnet`

Fetch contract information and ABI from Base block explorer.

**Query Parameters:**
- `address` (required): Contract address (0x format)
- `network` (optional): `mainnet` or `testnet` (default: `mainnet`)

**Response:**
```json
{
  "success": true,
  "data": {
    "address": "0x...",
    "name": "MyContract",
    "abi": [ ... ],
    "isVerified": true
  }
}
```

### Events

#### Decode Events

**POST** `/api/v1/events/decode`

Decode events from transaction logs. Optionally provide ABI for better decoding.

**Request Body:**
```json
{
  "events": [
    {
      "address": "0x...",
      "topics": ["0x..."],
      "data": "0x..."
    }
  ],
  "abi": [ ... ] // optional, for custom event signatures
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "name": "Transfer",
      "address": "0x...",
      "topics": ["0x..."],
      "data": "0x...",
      "decoded": {
        "name": "Transfer",
        "params": [
          {
            "name": "from",
            "type": "address",
            "value": "0x..."
          }
        ]
      }
    }
  ]
}
```

### Receipts

#### Get Transaction Receipt

**GET** `/api/v1/receipts/:txHash?network=mainnet`

Get detailed transaction receipt information including decoded events.

**Query Parameters:**
- `network` (optional): `mainnet` or `testnet` (default: `mainnet`)

**Response:**
```json
{
  "success": true,
  "data": {
    "transactionHash": "0x...",
    "blockNumber": "12345",
    "blockHash": "0x...",
    "transactionIndex": 0,
    "from": "0x...",
    "to": "0x...",
    "gasUsed": "21,000",
    "effectiveGasPrice": "20.00",
    "status": "success",
    "timestamp": "2024-01-01 00:00:00 UTC",
    "events": [ ... ],
    "logs": [ ... ]
  }
}
```

## Error Responses

All endpoints return errors in the following format:

```json
{
  "success": false,
  "error": "Error message",
  "details": { ... } // optional, for validation errors
}
```

Common HTTP status codes:
- `400` - Bad Request (invalid parameters)
- `404` - Not Found (transaction/contract not found)
- `429` - Too Many Requests (rate limit exceeded)
- `500` - Internal Server Error

## Rate Limiting

Rate limiting is applied to all endpoints. Default limits:
- Window: 60 seconds
- Max requests: 100 per window

Rate limit headers are included in responses:
- `X-RateLimit-Limit`
- `X-RateLimit-Remaining`
- `X-RateLimit-Reset`

## Environment Variables

Required environment variables:
- `BASE_RPC_URL` - Mainnet RPC endpoint
- `BASE_ARCHIVE_NODE_URL` - Mainnet archive node (for transaction tracing)
- `MONGODB_URI` - MongoDB connection string (for caching)
- `CORS_ORIGIN` - Allowed CORS origins (comma-separated)

Optional:
- `BASE_SEPOLIA_RPC_URL` - Testnet RPC endpoint
- `BASE_SEPOLIA_ARCHIVE_NODE_URL` - Testnet archive node
- `PORT` - Server port (default: 3001)
- `API_PREFIX` - API prefix (default: `/api/v1`)

