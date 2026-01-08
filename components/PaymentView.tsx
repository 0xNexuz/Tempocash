
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_TOKENS, TEMPO_CASH_ABI, TEMPO_CASH_CONTRACT_ADDRESS, ERC20_ABI } from '../constants';
import { PaymentDetails } from '../types';

const PaymentView: React.FC<{ paymentId: string; account: string | null }> = ({ paymentId, account }) => {
  const [details, setDetails] = useState<PaymentDetails | null>(null);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [step, setStep] = useState<'view' | 'approve' | 'pay' | 'success'>('view');
  const [txHash, setTxHash] = useState('');

  const fetchPayment = async () => {
    try {
      // In a real Tempo app, we'd use the Tempo RPC
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
    } catch (err) {
      console.error("Failed to fetch payment", err);
      // Demo fallback
      setDetails({
        id: paymentId,
        merchant: "0xMerchantAddress782394",
        token: SUPPORTED_TOKENS[0].address,
        amount: "150.00",
        rawAmount: ethers.parseUnits("150.00", 18).toString(),
        memo: "Demo: Invoice #4421 - Tempo Integration",
        isPaid: false,
        createdAt: Date.now() / 1000
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPayment();
  }, [paymentId]);

  const handleApprove = async () => {
    if (!account || !details) return;
    setProcessing(true);
    try {
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const tokenContract = new ethers.Contract(details.token, ERC20_ABI, signer);
      
      const tx = await tokenContract.approve(TEMPO_CASH_CONTRACT_ADDRESS, details.rawAmount);
      await tx.wait();
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
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);
      
      const tx = await contract.pay(paymentId);
      const receipt = await tx.wait();
      setTxHash(receipt.hash);
      setStep('success');
    } catch (err: any) {
      alert("Payment failed: " + (err.reason || err.message));
    } finally {
      setProcessing(false);
    }
  };

  if (loading) return <div className="text-center py-20 text-slate-400 animate-pulse font-medium">Querying Tempo Protocol...</div>;
  if (!details) return <div className="text-center py-20 text-red-500">Payment request expired or invalid.</div>;

  const currentToken = SUPPORTED_TOKENS.find(t => t.address.toLowerCase() === details.token.toLowerCase()) || SUPPORTED_TOKENS[0];

  return (
    <div className="max-w-md mx-auto">
      <div className="bg-white rounded-[2rem] shadow-2xl overflow-hidden border border-slate-100 ring-1 ring-slate-900/5">
        <div className="bg-slate-900 p-10 text-white text-center relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 animate-gradient-x"></div>
          <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mb-3">Tempo Payment Intent</p>
          <div className="flex items-center justify-center gap-2 mb-2">
            <span className="text-5xl font-extrabold tracking-tight">${details.amount}</span>
          </div>
          <p className="text-indigo-400 text-xs font-bold tracking-wider">{currentToken.symbol}</p>
        </div>

        <div className="p-8">
          <div className="space-y-5 mb-10">
            <div className="flex justify-between items-center py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Merchant</span>
              <span className="text-sm font-mono font-bold text-slate-900">{details.merchant.slice(0, 10)}...</span>
            </div>
            <div className="flex justify-between items-start py-3 border-b border-slate-50">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Memo</span>
              <span className="text-sm font-semibold text-slate-900 text-right max-w-[200px] leading-tight">{details.memo}</span>
            </div>
            <div className="flex justify-between items-center py-3">
              <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Network</span>
              <div className="flex items-center gap-1.5 bg-indigo-50 px-2 py-0.5 rounded-full border border-indigo-100">
                <div className="w-1.5 h-1.5 bg-indigo-500 rounded-full"></div>
                <span className="text-[10px] font-bold text-indigo-700">TEMPO TESTNET</span>
              </div>
            </div>
          </div>

          {!account ? (
            <div className="bg-slate-50 p-6 rounded-3xl text-center border border-slate-100">
              <p className="text-sm text-slate-600 mb-4 font-medium italic">Authorize wallet to proceed</p>
              <button 
                onClick={() => (window as any).location.reload()}
                className="w-full bg-slate-900 text-white py-4 rounded-2xl font-bold hover:bg-slate-800 transition-all shadow-lg"
              >
                Connect Wallet
              </button>
            </div>
          ) : step === 'success' ? (
            <div className="text-center animate-in zoom-in duration-500">
              <div className="w-20 h-20 bg-green-50 text-green-500 rounded-full flex items-center justify-center mx-auto mb-6 border-4 border-white shadow-inner">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h4 className="text-2xl font-black text-slate-900 mb-2">Settled!</h4>
              <p className="text-sm text-slate-500 mb-8 font-medium">Funds transferred directly to merchant via Tempo Protocol.</p>
              {txHash && (
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200">
                  <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">Transaction Hash</p>
                  <code className="text-[10px] text-indigo-600 font-mono break-all">{txHash}</code>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-4">
               {step === 'view' && (
                 <button
                   onClick={handleApprove}
                   disabled={processing}
                   className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 transition-all disabled:opacity-50 shadow-xl shadow-indigo-100 flex items-center justify-center gap-3"
                 >
                   {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                   {processing ? 'Processing Approval...' : `Unlock ${currentToken.symbol}`}
                 </button>
               )}
               {step === 'pay' && (
                 <button
                   onClick={handlePay}
                   disabled={processing}
                   className="w-full bg-green-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-green-700 animate-pulse-slow transition-all disabled:opacity-50 shadow-xl shadow-green-100 flex items-center justify-center gap-3"
                 >
                   {processing && <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
                   {processing ? 'Settling Payment...' : 'Confirm One-Click Pay'}
                 </button>
               )}
               <div className="bg-indigo-50/50 p-4 rounded-2xl border border-indigo-100 mt-6">
                 <div className="flex items-start gap-3">
                    <div className="bg-indigo-100 p-1.5 rounded-lg text-indigo-600">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <p className="text-[10px] text-indigo-800 leading-normal font-medium">
                      <strong>Tempo Fee Model:</strong> On Tempo, you pay transaction fees directly in stablecoins. 
                      You do not need native ETH or tokens to complete this payment.
                    </p>
                 </div>
               </div>
            </div>
          )}
        </div>
      </div>

      <div className="mt-8 flex justify-center items-center gap-4 grayscale opacity-50 hover:grayscale-0 hover:opacity-100 transition-all cursor-default">
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Secured by Tempo</span>
         <div className="w-px h-3 bg-slate-300"></div>
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">TIP-20 Compliant</span>
         <div className="w-px h-3 bg-slate-300"></div>
         <span className="text-[10px] font-bold text-slate-500 uppercase tracking-tighter">Non-Custodial</span>
      </div>
    </div>
  );
};

export default PaymentView;
