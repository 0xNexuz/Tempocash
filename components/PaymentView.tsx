
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_TOKENS, TEMPO_CASH_ABI, TEMPO_CASH_CONTRACT_ADDRESS, ERC20_ABI, TEMPO_NETWORK_CONFIG } from '../constants';
import { PaymentDetails } from '../types';

const PaymentView: React.FC<{ paymentId: string; account: string | null; isDemoMode: boolean }> = ({ paymentId, account, isDemoMode: globalDemoMode }) => {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'view' | 'approve' | 'pay' | 'success'>('view');
  const [txHash, setTxHash] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Force demo mode if the ID is a demo ID, regardless of header toggle
  const effectiveDemoMode = paymentId.startsWith('demo-') || globalDemoMode;

  const fetchPayment = async () => {
    setLoading(true);
    setError(null);
    try {
      if (effectiveDemoMode) {
        await new Promise(r => setTimeout(r, 600));
        const saved = localStorage.getItem(paymentId);
        if (saved) {
          const data = JSON.parse(saved);
          setDetails(data);
          if (data.isPaid) setStep('success');
        } else {
          // Default demo fallback if ID is unknown but starts with demo-
          setDetails({
            id: paymentId,
            merchant: "0xMerchantDemo72394",
            token: SUPPORTED_TOKENS[0].address,
            amount: "150.00",
            rawAmount: ethers.parseUnits("150.00", 18).toString(),
            memo: "Standard Demo Invoice",
            isPaid: false,
            createdAt: Date.now() / 1000
          });
        }
        setStep('view');
      } else {
        // Real Mode - Connect to Provider
        const provider = new ethers.JsonRpcProvider(TEMPO_NETWORK_CONFIG.rpcUrls[0]);
        
        // Verify contract existence to avoid generic CALL_EXCEPTION
        const code = await provider.getCode(TEMPO_CASH_CONTRACT_ADDRESS);
        if (code === "0x" || code === "0x0") {
          throw new Error("Contract not found on this network. Please switch to Tempo Testnet.");
        }

        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, provider);
        
        // Validate hex paymentId format
        if (!paymentId.startsWith('0x') || paymentId.length !== 66) {
          throw new Error("Invalid payment link format. Expected a bytes32 ID.");
        }

        const p = await contract.getPayment(paymentId);
        
        if (p.merchant === ethers.ZeroAddress) {
          throw new Error("This payment request does not exist or has expired.");
        }

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
          const isNative = p.token === ethers.ZeroAddress;
          setStep(isNative ? 'pay' : 'view');
        }
      }
    } catch (err: any) {
      console.error("Fetch error:", err);
      setError(err.message || "Failed to load payment details.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [paymentId, globalDemoMode]);

  const handleApprove = async () => {
    if (!account || !details) return;
    setProcessing(true);
    setError(null);
    try {
      if (effectiveDemoMode) {
        await new Promise(r => setTimeout(r, 1000));
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        // Ensure user is on correct network
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== parseInt(TEMPO_NETWORK_CONFIG.chainId, 16)) {
          throw new Error("Wrong network detected. Switch to Tempo Testnet in your wallet.");
        }

        const tokenContract = new ethers.Contract(details.token, ERC20_ABI, signer);
        const tx = await tokenContract.approve(TEMPO_CASH_CONTRACT_ADDRESS, details.rawAmount);
        await tx.wait();
      }
      setStep('pay');
    } catch (err: any) {
      setError(err.reason || err.message || "Transaction failed.");
    } finally {
      setProcessing(false);
    }
  };

  const handlePay = async () => {
    if (!account || !details) return;
    setProcessing(true);
    setError(null);
    try {
      if (effectiveDemoMode) {
        await new Promise(r => setTimeout(r, 1500));
        setTxHash(ethers.id("mock-tx-" + Date.now()));
        
        // Update mock persistence
        const saved = localStorage.getItem(paymentId);
        if (saved) {
          const data = JSON.parse(saved);
          data.isPaid = true;
          localStorage.setItem(paymentId, JSON.stringify(data));
        }
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== parseInt(TEMPO_NETWORK_CONFIG.chainId, 16)) {
          throw new Error("Wrong network. Switch to Tempo Testnet.");
        }

        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);
        const isNative = details.token === ethers.ZeroAddress;
        const txOptions = isNative ? { value: details.rawAmount } : {};

        // Robust gas estimation logic
        try {
          await contract.pay.estimateGas(details.id, txOptions);
        } catch (gasErr: any) {
          console.error("Gas Error Details:", gasErr);
          if (gasErr.message.includes('insufficient funds')) {
            throw new Error("Insufficient balance for payment + gas fees.");
          } else if (gasErr.message.includes('revert')) {
            throw new Error("Payment already completed or invalid request ID.");
          } else {
            throw new Error("Execution predicted to fail. Check your wallet balance.");
          }
        }

        const tx = await contract.pay(details.id, txOptions);
        const receipt = await tx.wait();
        setTxHash(receipt?.hash || '');
      }
      setStep('success');
    } catch (err: any) {
      setError(err.reason || err.message || "Settlement failed.");
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Syncing Tempo Protocol...</p>
    </div>
  );

  if (error) return (
    <div className="max-w-md mx-auto p-12 bg-white rounded-[2.5rem] border border-red-100 shadow-xl text-center">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
        </svg>
      </div>
      <h3 className="text-xl font-bold text-slate-900 mb-2">Request Error</h3>
      <p className="text-slate-500 text-sm mb-8 leading-relaxed">{error}</p>
      <button 
        onClick={fetchPayment}
        className="px-6 py-3 bg-indigo-600 text-white rounded-xl font-bold text-sm hover:bg-indigo-700 transition-all"
      >
        Retry Connection
      </button>
    </div>
  );

  if (!details) return null;

  const currentToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === details.token.toLowerCase()) || SUPPORTED_TOKENS[0];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 transition-all">
        <div className="bg-slate-900 p-12 text-white text-center relative overflow-hidden">
          {effectiveDemoMode && (
            <div className="absolute top-4 left-4 bg-amber-400 text-slate-900 text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-tighter z-20">Simulation Mode</div>
          )}
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
                className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {processing && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                {account ? `Authorize ${currentToken.symbol}` : "Connect Wallet to Proceed"}
              </button>
            )}

            {step === 'pay' && (
              <button
                onClick={handlePay}
                disabled={processing}
                className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-green-700 disabled:opacity-50 transition-all shadow-xl shadow-green-100 flex items-center justify-center gap-3 active:scale-[0.98]"
              >
                {processing && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                Confirm Settlement
              </button>
            )}

            {step === 'success' && (
              <div className="text-center animate-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 mb-2">Settlement Finalized</h3>
                <p className="text-slate-500 text-sm font-medium mb-6">Your transaction has been written to the Tempo ledger.</p>
                {txHash && (
                  <a 
                    href={`${TEMPO_NETWORK_CONFIG.blockExplorerUrls[0]}/tx/${txHash}`} 
                    target="_blank" 
                    rel="noreferrer"
                    className="text-indigo-600 text-xs font-bold hover:underline"
                  >
                    View on Explorer
                  </a>
                )}
              </div>
            )}
            
            {!processing && step !== 'success' && account && (
               <p className="text-center text-[10px] text-slate-400 font-bold uppercase tracking-wider">
                  Payment processed via Tempo Protocol
               </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PaymentView;
