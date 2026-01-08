
export interface PaymentDetails {
  id: string;
  merchant: string;
  token: string;
  amount: string; // Human readable
  rawAmount: string; // BigInt string
  memo: string;
  isPaid: boolean;
  createdAt: number;
}

export interface TokenInfo {
  symbol: string;
  address: string;
  decimals: number;
}
