
# Tempo Cash: Decentralized Pay-by-Link

Tempo Cash is a non-custodial payment protocol designed for the Tempo EVM testnet. It allows anyone to generate stablecoin payment links that can be shared via email, text, or QR code.

## How it Works

1.  **Merchant Link Generation**: A merchant interacts with the `TempoCash` smart contract to register a payment intent (Token, Amount, Memo). The contract generates a unique `paymentId`.
2.  **Stateless Registry**: The contract stores the payment details. It does **not** hold any funds.
3.  **One-Click Checkout**: The payer opens the link, which looks up the `paymentId` in the registry. 
4.  **Direct Settlement**: When the payer confirms, the contract calls `transferFrom` on the stablecoin's ERC20 contract, moving funds directly from the `payer` to the `merchant`.
5.  **Immutability**: Once a `paymentId` is marked as `isPaid`, the contract prevents any further transactions for that ID.

## Deployment Steps

1.  **Smart Contract**:
    *   Deploy `contracts/TempoCash.sol` using Hardhat, Foundry, or Remix.
    *   Copy the deployed address to `constants.tsx`.
2.  **Stablecoins**:
    *   On a testnet, you can deploy a mock ERC20 or use existing test tokens.
    *   Update `SUPPORTED_TOKENS` in `constants.tsx`.
3.  **Frontend**:
    *   Run `npm install` and `npm start`.
    *   Ensure your MetaMask is pointed to the correct network.

## User Flow
*   **Merchant**: Connect wallet -> Input 50 USDC -> Get link `.../#/pay/0x...`.
*   **Payer**: Open link -> Click Approve -> Click Pay -> Done!
