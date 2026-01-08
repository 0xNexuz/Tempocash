
export const TEMPO_CASH_CONTRACT_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";

export const TEMPO_NETWORK_CONFIG = {
  chainId: "0x7b", // 123 in hex (placeholder for Tempo Testnet)
  chainName: "Tempo Testnet",
  nativeCurrency: {
    name: "pathUSD",
    symbol: "pathUSD",
    decimals: 18
  },
  rpcUrls: ["https://rpc.tempo.testnet"],
  blockExplorerUrls: ["https://explorer.tempo.testnet"]
};

export const TEMPO_CASH_ABI = [
  "function createPayment(address _token, uint256 _amount, string calldata _memo) external returns (bytes32)",
  "function pay(bytes32 _paymentId) external",
  "function getPayment(bytes32 _paymentId) external view returns (address merchant, address token, uint256 amount, string memory memo, bool isPaid, uint256 createdAt)",
  "event PaymentCreated(bytes32 indexed paymentId, address indexed merchant, address token, uint256 amount, string memo)",
  "event PaymentCompleted(bytes32 indexed paymentId, address indexed payer, address indexed merchant, uint256 amount)"
];

export const ERC20_ABI = [
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function balanceOf(address account) external view returns (uint256)",
  "function symbol() external view returns (string)",
  "function decimals() external view returns (uint8)"
];

export const SUPPORTED_TOKENS = [
  { symbol: "pathUSD", address: "0xAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA", decimals: 18, isNativeFeeToken: true },
  { symbol: "USDC", address: "0x2791Bca1f2de4661ED88A30C99A7a9449Aa84174", decimals: 6, isNativeFeeToken: false },
  { symbol: "USDT", address: "0xc2132D05D31c914a87C6611C10748AEb04B58e8F", decimals: 6, isNativeFeeToken: false }
];
