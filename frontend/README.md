# ForgeBase

A developer-focused dApp to interact with any verified Base smart contract. Load contracts, execute functions, and manage transactions with an intuitive GUI.

## Project info

ForgeBase provides a Postman-like experience for Smart Contracts on Base. Load any verified contract, execute read/write functions, and save your workflows.

## Features

- **Contract Loader**: Load verified contracts from Base explorer by address.
- **Function List**: Automatically parses ABI and displays all available read and write functions.
- **Response Panel**: View execution results, transaction hashes, and error messages.
- **Workspace**: Save your frequently used contracts and function calls.
- **Web3 Integration**: seamlessly connect with Base-supported wallets.

## How to run locally

1. **Clone the repository**
   ```sh
   git clone <YOUR_GIT_URL>
   ```

2. **Navigate to the frontend directory**
   ```sh
   cd frontend
   ```

3. **Install dependencies**
   ```sh
   npm install
   ```

4. **Start the development server**
   ```sh
   npm run dev
   ```

## Technologies Used

- **Frontend**: Vite, React, TypeScript, Tailwind CSS
- **UI Components**: shadcn-ui, Lucide React
- **Web3**: Wagmi, Viem, TanStack Query

## Deployment

Build the project for production:
```sh
npm run build
```
The output will be in the `dist` directory.
