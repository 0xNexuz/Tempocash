
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_TOKENS, TEMPO_CASH_ABI, TEMPO_CASH_CONTRACT_ADDRESS, ERC20_ABI } from '../constants';
import { PaymentDetails } from '../types';

const PaymentView: React.FC<{ paymentId: string; account: string | null; isDemoMode: boolean }> = ({ paymentId, account, isDemoMode }) => {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'view' | 'approve' | 'pay' | 'success'>('view');
  const [txHash, setTxHash] = useState('');

  const fetchPayment = async () => {
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 800));
        
        // Try to load persisted demo data
        const saved = localStorage.getItem(paymentId);
        if (saved) {
          setDetails(JSON.parse(saved));
        } else {
          // Fallback if link opened directly in demo mode without creation
          setDetails({
            id: paymentId,
            merchant: "0xMerchant72394Demo",
            token: SUPPORTED_TOKENS[0].address,
            amount: "150.00",
            rawAmount: ethers.parseUnits("150.00", 18).toString(),
            memo: "Demo Service Invoice #123",
            isPaid: false,
            createdAt: Date.now() / 1000
          });
        }
        setStep('view');
      } else {
        const provider = new ethers.JsonRpcProvider("https://rpc.tempo.testnet");
        
        const code = await provider.getCode(TEMPO_CASH_CONTRACT_ADDRESS);
        if (code === "0x") {
          throw new Error("Contract not found at address. Check network connection.");
        }

        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, provider);
        const p = await contract.getPayment(paymentId);
        
        // Use case-insensitive find for robustness
        const tokenInfo = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === p.token.toLowerCase());
        const formattedAmount = ethers.formatUnits(p.amount, tokenInfo?.decimals || 18);

        setDetails({
          id: paymentId,
          merchant: p.merchant,
          token: p.token,
          amount: formattedAmount,
          rawAmount: p.amount.toString(),
          memo: p.memo,
          isPaid: p.isPaid,
          createdAt: Number(p.createdAt)
        });

        if (p.isPaid) {
          setStep('success');
        } else {
          const isNative = p.token === "0x0000000000000000000000000000000000000000";
          setStep(isNative ? 'pay' : 'view');
        }
      }
    } catch (err: any) {
      console.error("Failed to fetch payment", err);
      // Failover for testing purposes
      setDetails({
        id: paymentId,
        merchant: "0xMerchantErrorFallback",
        token: SUPPORTED_TOKENS[0].address,
        amount: "0.00",
        rawAmount: "0",
        memo: "Error fetching link data",
        isPaid: false,
        createdAt: Date.now() / 1000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [paymentId, isDemoMode]);

  const handleApprove = async () => {
    if (!account || !details) return;
    setProcessing(true);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1200));
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const tokenContract = new ethers.Contract(details.token, ERC20_ABI, signer);
        const tx = await tokenContract.approve(TEMPO_CASH_CONTRACT_ADDRESS, details.rawAmount);
        await tx.wait();
      }
      setStep('pay');
    } catch (err: any) {
      console.error(err);
      alert("Approval failed: " + (err.reason || err.message || "Rejected"));
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!account || !details) return;
    setProcessing(true);
    try {
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1800));
        setTxHash(ethers.id("tx-" + Date.now()));
        
        // Update local mock state
        const saved = localStorage.getItem(paymentId);
        if (saved) {
          const data = JSON.parse(saved);
          data.isPaid = true;
          localStorage.setItem(paymentId, JSON.stringify(data));
        }
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);
        
        const isNative = details.token === "0x0000000000000000000000000000000000000000";
        const txOptions = isNative ? { value: details.rawAmount } : {};

        try {
          await contract.pay.estimateGas(paymentId, txOptions);
        } catch (gasErr: any) {
          throw new Error("Transaction likely to fail. Ensure you have enough balance.");
        }

        const tx = await contract.pay(paymentId, txOptions);
        const receipt = await tx.wait();
        setTxHash(receipt?.hash || '');
      }
      setStep('success');
    } catch (err: any) {
      console.error(err);
      alert("Payment failed: " + (err.reason || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Querying Tempo Ledger...</p>
    </div>
  );

  if (!details) return <div className="text-center py-20 text-red-500 font-bold">Payment intent not found.</div>;

  const currentToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === details.token.toLowerCase()) || SUPPORTED_TOKENS[0];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 transition-all">
        <div className="bg-slate-900 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-indigo-500/5 pointer-events-none"></div>
          <div className="relative z-10">
            <p className="text-indigo-400 text-xs font-black uppercase tracking-[0.2em] mb-4">Payment Request</p>
            <h2 className="text-5xl font-black mb-2 tracking-tighter">${details.amount}</h2>
            <p className="text-slate-400 font-bold text-sm">{currentToken.symbol}</p>
          </div>
        </div>

        <div className="p-8 space-y-8">
          <div className="flex justify-between items-center py-4 border-b border-slate-50">
            <span className="text-slate-500 text-sm font-bold">To Merchant</span>
            <span className="text-slate-900 font-mono text-xs font-bold">{details.merchant.slice(0, 10)}...{details.merchant.slice(-6)}</span>
          </div>
          <div className="flex justify-between items-center py-4 border-b border-slate-50">
            <span className="text-slate-500 text-sm font-bold">Reference</span>
            <span className="text-slate-900 font-bold">{details.memo}</span>
          </div>

          <div className="space-y-4">
            {step === 'view' && (
              <button
                onClick={handleApprove}
                disabled={processing || !account}
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
              >
                {processing && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {account ? `Approve ${currentToken.symbol}` : "Connect Wallet to Pay"}
              </button>
            )}

            {step === 'pay' && (
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3"
              >
                {processing && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Settle Payment
              </button>
            )}

            {step === 'success' && (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Payment Complete</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">Transaction has been finalized on Tempo.</p>
                {txHash && (
                  <a 
                    href={`https://explorer.tempo.testnet/tx/${txHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-600 text-xs font-bold hover:underline"
                  >
                    View Receipt on Explorer
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
