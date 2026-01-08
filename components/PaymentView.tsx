
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
        setStep('view');
      } else {
        const provider = new ethers.JsonRpcProvider("https://rpc.tempo.testnet");
        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, provider);
        const p = await contract.getPayment(paymentId);
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

        if (p.isPaid) setStep('success');
        else setStep('view');
      }
    } catch (err) {
      console.error("Failed to fetch payment", err);
      // Fallback Demo
      setDetails({
        id: paymentId,
        merchant: "0xMerchantFallback",
        token: SUPPORTED_TOKENS[0].address,
        amount: "150.00",
        rawAmount: ethers.parseUnits("150.00", 18).toString(),
        memo: "Demo Checkout Flow",
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
      alert("Approval failed: " + (err.reason || err.message));
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
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const signer = await provider.getSigner();
        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);
        const tx = await contract.pay(paymentId);
        const receipt = await tx.wait();
        setTxHash(receipt.hash);
      }
      setStep('success');
    } catch (err: any) {
      alert("Payment failed: " + (err.reason || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return (
    <div className="flex flex-col items-center justify-center py-32 gap-6">
      <div className="w-12 h-12 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
      <p className="text-slate-400 font-bold uppercase tracking-widest text-[10px] animate-pulse">Syncing Tempo Node...</p>
    </div>
  );

  if (!details) return <div className="text-center py-20 text-red-500 font-bold">Payment intent not found on Tempo.</div>;

  const currentToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === details.token.toLowerCase()) || SUPPORTED_TOKENS[0];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-[2.5rem] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.1)] overflow-hidden border border-slate-100 ring-1 ring-slate-900/5 transition-all">
        <div className="bg-slate-900 p-12 text-white text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-transparent to-purple-500/10 opacity-30"></div>
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-600 via-sky-400 to-indigo-600 animate-gradient-x"></div>
          
          <div className="relative">
            <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.2em] mb-4">Requesting Secure Payment</p>
            <div className="flex items-center justify-center gap-1 mb-2">
              <span className="text-5xl font-black tracking-tight leading-none">${details.amount}</span>
            </div>
            <div className="inline-flex items-center gap-2 bg-white/10 px-3 py-1 rounded-full backdrop-blur-sm border border-white/10">
              <div className="w-2 h-2 rounded-full bg-indigo-400"></div>
              <span className="text-[10px] font-black text-indigo-300 uppercase tracking-widest">{currentToken.symbol}</span>
            </div>
          </div>
        </div>

        <div className="p-10">
          <div className="space-y-6 mb-12">
            <div className="flex justify-between items-center group">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Merchant Entity</span>
              <span className="text-xs font-mono font-bold text-slate-900 bg-slate-50 px-3 py-1 rounded-lg border border-slate-100">
                {details.merchant.slice(0, 10)}...
              </span>
            </div>
            <div className="flex justify-between items-start">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-1">Ref / Memo</span>
              <span className="text-sm font-bold text-slate-900 text-right max-w-[180px] leading-snug">{details.memo}</span>
            </div>
            <div className="pt-6 border-t border-slate-50 flex justify-between items-center">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Gas (Estimated)</span>
              <div className="flex items-center gap-1 text-[10px] font-bold text-green-600 uppercase">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zM10 16a6 6 0 100-12 6 6 0 000 12z" clipRule="evenodd" />
                </svg>
                ~0.12 {currentToken.symbol}
              </div>
            </div>
          </div>

          {!account ? (
            <div className="bg-slate-50 p-8 rounded-[2rem] text-center border border-slate-100 shadow-inner">
              <p className="text-xs text-slate-500 mb-6 font-bold uppercase tracking-wider italic">Secure Authorization Required</p>
              <button 
                onClick={() => (window as any).location.reload()}
                className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-slate-800 transition-all shadow-2xl active:scale-95"
              >
                Unlock Wallet
              </button>
            </div>
          ) : step === 'success' ? (
            <div className="text-center animate-in zoom-in slide-in-from-bottom-8 duration-700">
              <div className="w-24 h-24 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 border-8 border-white shadow-[0_0_0_1px_rgba(34,197,94,0.1)]">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-3xl font-black text-slate-900 mb-3 tracking-tight">Settled!</h4>
              <p className="text-sm text-slate-500 mb-10 font-medium leading-relaxed px-4">
                Payment has been successfully verified and distributed via the Tempo TIP-20 Protocol.
              </p>
              {txHash && (
                <div className="bg-slate-50 p-5 rounded-2xl border border-slate-200 group hover:border-indigo-200 transition-colors">
                  <p className="text-[8px] text-slate-400 font-black uppercase tracking-[0.2em] mb-2">Network Transaction ID</p>
                  <code className="text-[10px] text-indigo-600 font-mono break-all font-bold group-hover:text-indigo-700">{txHash}</code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               {step === 'view' && (
                 <button
                   onClick={handleApprove}
                   disabled={processing}
                   className="group w-full bg-indigo-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.3)] flex items-center justify-center gap-3 active:scale-95"
                 >
                   {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                   {processing ? 'Network Handshake...' : `Authorize ${currentToken.symbol}`}
                 </button>
               )}
               {step === 'pay' && (
                 <button
                   onClick={handlePay}
                   disabled={processing}
                   className="w-full bg-green-600 text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.1em] hover:bg-green-700 transition-all disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(22,163,74,0.3)] flex items-center justify-center gap-3 animate-pulse-slow active:scale-95"
                 >
                   {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                   {processing ? 'Finalizing Settlement...' : 'Submit One-Click Payment'}
                 </button>
               )}
               <div className="bg-slate-50 p-6 rounded-[1.5rem] border border-slate-100 mt-8">
                 <div className="flex items-start gap-4">
                    <div className="bg-white p-2 rounded-xl text-slate-400 border border-slate-100 shadow-sm">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <div>
                      <h5 className="text-[10px] font-black text-slate-900 uppercase tracking-widest mb-1">Stablecoin Gas-Enabled</h5>
                      <p className="text-[10px] text-slate-500 leading-normal font-medium">
                        On Tempo, your transaction fees are paid in <span className="text-indigo-600 font-bold">{currentToken.symbol}</span>. 
                        No secondary native token required.
                      </p>
                    </div>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-12 flex justify-center items-center gap-6 grayscale opacity-30 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">Tempo Core Protocol</span>
         <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">TIP-20 Secure</span>
         <div className="w-1 h-1 bg-slate-300 rounded-full"></div>
         <span className="text-[9px] font-black text-slate-600 uppercase tracking-[0.2em]">P2P Settled</span>
      </div>
    </div>
  );
};

export default PaymentView;
