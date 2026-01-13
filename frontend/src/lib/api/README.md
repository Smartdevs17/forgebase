# API Integration Documentation

This directory contains the complete API integration layer for the ForgeBase frontend, following a repository pattern with centralized state management.

## Structure

```
lib/api/
├── config.ts          # API configuration (base URL, timeout, etc.)
├── routes.ts          # Centralized route definitions
├── client.ts          # Base HTTP client with error handling
├── services/          # Repository pattern services
│   ├── transaction.service.ts
│   ├── contract.service.ts
│   ├── event.service.ts
│   ├── receipt.service.ts
│   └── index.ts
└── index.ts           # Main export

contexts/
└── ApiContext.tsx      # React Query state management
```

## Architecture

### 1. Configuration (`config.ts`)

Centralized API configuration:
- Base URL (from env or default)
- API prefix
- Request timeout
- Default headers

**Environment Variable:**
```bash
VITE_API_BASE_URL=http://localhost:3001
```

### 2. Routes (`routes.ts`)

Type-safe route definitions for all endpoints:
- Transactions: decode, get
- Contracts: get
- Events: decode
- Receipts: get

### 3. Client (`client.ts`)

Base HTTP client with:
- Error handling
- Timeout management
- Type-safe responses
- Consistent error format

### 4. Services (Repository Pattern)

Each service module provides:
- Type-safe request/response interfaces
- Service functions for API calls
- Error handling

**Services:**
- `transaction.service.ts` - Transaction decoding
- `contract.service.ts` - Contract ABI fetching
- `event.service.ts` - Event decoding
- `receipt.service.ts` - Receipt fetching

### 5. State Management (`ApiContext.tsx`)

React Query hooks for:
- Automatic caching
- Request deduplication
- Loading states
- Error handling
- Refetch capabilities

## Usage

### Setup

Wrap your app with `ApiProvider`:

```tsx
import { ApiProvider } from '@/contexts/ApiContext';

<ApiProvider>
  <App />
</ApiProvider>
```

### Using API Hooks

```tsx
import { useApi } from '@/contexts/ApiContext';

function MyComponent() {
  const { useGetContract, useDecodeTransaction } = useApi();
  
  // Query hook (auto-fetches when enabled)
  const { data, isLoading, error } = useGetContract(
    '0x...',
    'mainnet',
    { enabled: true }
  );
  
  // Mutation hook (manual trigger)
  const decodeMutation = useDecodeEvents();
  
  const handleDecode = async () => {
    const result = await decodeMutation.mutateAsync({
      events: [...],
      abi: [...]
    });
  };
}
```

### Direct Service Calls

For one-off calls without state management:

```tsx
import { getContract, decodeTransaction } from '@/lib/api/services';

// Direct call
const result = await getContract('0x...', 'mainnet');
if (result.success) {
  console.log(result.data);
} else {
  console.error(result.error);
}
```

## Available Hooks

### Transaction Hooks

```tsx
// Decode transaction
const { data, isLoading, error } = useDecodeTransaction(
  { txHash: '0x...', network: 'mainnet' },
  { enabled: true }
);

// Get transaction
const { data } = useGetTransaction('0x...', 'mainnet');
```

### Contract Hooks

```tsx
// Get contract
const { data } = useGetContract('0x...', 'mainnet');
```

### Event Hooks

```tsx
// Decode events (mutation)
const decodeEvents = useDecodeEvents();

await decodeEvents.mutateAsync({
  events: [...],
  abi: [...] // optional
});
```

### Receipt Hooks

```tsx
// Get receipt
const { data } = useGetReceipt('0x...', 'mainnet');
```

## Error Handling

All API calls return a consistent error format:

```tsx
interface ApiError {
  success: false;
  error: string;
  details?: any;
}
```

React Query hooks throw errors that can be caught:

```tsx
const { data, error } = useGetContract('0x...');

if (error) {
  console.error(error.message);
}
```

## Examples

### Example 1: Fetch Contract with Fallback

```tsx
// Try backend API first, fallback to explorer
const apiResult = await getContract(address, network);
if (apiResult.success) {
  // Use backend data
} else {
  // Fallback to explorer API
  const explorerData = await fetchContractFromExplorer(address, isTestnet);
}
```

### Example 2: Decode Transaction on Button Click

```tsx
const { useDecodeTransaction } = useApi();
const { data, refetch } = useDecodeTransaction(
  { txHash, network },
  { enabled: false } // Don't auto-fetch
);

<Button onClick={() => refetch()}>Decode</Button>
```

### Example 3: Decode Events from Receipt

```tsx
const decodeEvents = useDecodeEvents();

const handleDecode = async (receipt) => {
  const result = await decodeEvents.mutateAsync({
    events: receipt.logs,
    abi: contract.abi
  });
  console.log('Decoded events:', result);
};
```

## Best Practices

1. **Use Hooks for UI State**: Use React Query hooks when you need loading states, caching, etc.
2. **Use Services for One-offs**: Use direct service calls for programmatic operations
3. **Error Handling**: Always check `result.success` or catch errors from hooks
4. **Caching**: React Query automatically caches responses (5-10 min stale time)
5. **Fallbacks**: Implement fallback strategies (e.g., backend → explorer API)

## Type Safety

All services are fully typed:
- Request parameters
- Response data
- Error types
- Network types

## Configuration

Update API base URL via environment variable:

```bash
# .env
VITE_API_BASE_URL=http://localhost:3001
```

Or modify `config.ts` directly for development.

