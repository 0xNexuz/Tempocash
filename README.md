
# Tempo Cash: Decentralized Pay-by-Link

Tempo Cash is a non-custodial payment protocol designed for the Tempo EVM testnet. It allows anyone to generate stablecoin payment links that can be shared via email, text, or QR code.

## How it Works

1.  **Merchant Link Generation**: A merchant interacts with the `TempoCash` smart contract to register a payment intent (Token, Amount, Memo). The contract generates a unique `paymentId`.
2.  **Stateless Registry**: The contract stores the payment details. It does **not** hold any funds.
3.  **One-Click Checkout**: The payer opens the link, which looks up the `paymentId` in the registry. 
4.  **Direct Settlement**: When the payer confirms, the contract calls `transferFrom` on the stablecoin's ERC20 contract, moving funds directly from the `payer` to the `merchant`.
5.  **Immutability**: Once a `paymentId` is marked as `isPaid`, the contract prevents any further transactions for that ID.

## Vercel Deployment

Deploying to Vercel is straightforward:

1.  **Push to GitHub**: Push these files to a GitHub repository.
2.  **Import to Vercel**: Go to [Vercel](https://vercel.com), click "Add New" -> "Project", and select your repo.
3.  **Automatic Detection**: Vercel will detect the `package.json` and use Vite to build the project automatically.
4.  **Environment Variables**: If you add any backend features later, you can add your API keys in the Project Settings.
5.  **Deploy**: Click "Deploy". Your app will be live on a `.vercel.app` domain.

## Testing with Wallets

You can test this using any EVM-compatible wallet (MetaMask, Rabby, etc.). 
*   **Demo Mode**: Use the toggle in the header to simulate the payment flow without a wallet or testnet tokens.
*   **Live Mode**: Switch your wallet to **Tempo Testnet** (RPC: `https://rpc.tempo.testnet`, Chain ID: `123`).

## User Flow
*   **Merchant**: Connect wallet -> Input 50 USDC -> Get link `.../#/pay/0x...`.
*   **Payer**: Open link -> Click Approve -> Click Pay -> Done!
