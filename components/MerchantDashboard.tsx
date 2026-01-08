
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { QRCodeSVG } from 'qrcode.react';
import { SUPPORTED_TOKENS, TEMPO_CASH_ABI, TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_NETWORK_CONFIG } from '../constants';

const MerchantDashboard: React.FC<{ account: string | null; isDemoMode: boolean }> = ({ account, isDemoMode }) => {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Please connect your wallet first.");
    
    setLoading(true);
    try {
      let paymentId;
      
      if (isDemoMode) {
        await new Promise(r => setTimeout(r, 1000));
        paymentId = "demo-" + Math.random().toString(36).substring(2, 12);
        
        // Use exactly what the merchant typed for display consistency
        const demoData = {
          id: paymentId,
          merchant: account,
          token: selectedToken.address,
          amount: amount, 
          rawAmount: ethers.parseUnits(amount || "0", selectedToken.decimals).toString(),
          memo: memo,
          isPaid: false,
          createdAt: Date.now() / 1000
        };
        localStorage.setItem(paymentId, JSON.stringify(demoData));
      } else {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Network Check
        const network = await provider.getNetwork();
        if (Number(network.chainId) !== parseInt(TEMPO_NETWORK_CONFIG.chainId, 16)) {
          throw new Error("Wrong network. Please switch to Tempo Testnet in MetaMask.");
        }

        const signer = await provider.getSigner();
        const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);

        const parsedAmount = ethers.parseUnits(amount, selectedToken.decimals);
        const tx = await contract.createPayment(selectedToken.address, parsedAmount, memo);
        const receipt = await tx.wait();

        const log = receipt.logs.find((l: any) => l.fragment && l.fragment.name === 'PaymentCreated');
        paymentId = log ? log.args[0] : null;
        
        if (!paymentId) {
          throw new Error("Transaction succeeded but no payment ID was emitted.");
        }
      }

      const url = `${window.location.origin}/#/pay/${paymentId}`;
      setGeneratedLink(url);
    } catch (err: any) {
      console.error(err);
      alert(err.reason || err.message || "Failed to create payment link.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden ring-1 ring-slate-900/5">
        <div className="bg-slate-900 p-8 text-white relative">
          {isDemoMode && (
            <div className="absolute top-4 right-4 bg-amber-400 text-slate-900 text-[10px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Demo Mode Enabled</div>
          )}
          <h2 className="text-2xl font-bold mb-1">Payment Request Link</h2>
          <p className="text-slate-400 text-sm font-medium">Define your invoice and generate a shareable URL.</p>
        </div>

        {!generatedLink ? (
          <form onSubmit={createLink} className="p-8 space-y-8">
            <div className="space-y-4">
              <label className="block text-sm font-bold text-slate-700">Receive in Asset</label>
              <div className="grid grid-cols-3 gap-3">
                {SUPPORTED_TOKENS.map((t) => (
                  <button
                    key={t.symbol}
                    type="button"
                    onClick={() => setSelectedToken(t)}
                    className={`py-4 px-4 rounded-2xl border-2 text-sm font-bold transition-all ${
                      selectedToken.symbol === t.symbol 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-700 shadow-md shadow-indigo-100' 
                        : 'border-slate-100 bg-slate-50/50 text-slate-500 hover:border-slate-200'
                    }`}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <span>{t.symbol}</span>
                      {t.isNativeFeeToken && <span className="text-[8px] opacity-60 uppercase font-black">Fee Native</span>}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Amount to Request</label>
                <div className="relative group">
                  <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold">$</div>
                  <input
                    type="number"
                    step="any"
                    required
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="w-full pl-8 pr-16 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all font-mono font-bold text-lg"
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400 text-xs uppercase tracking-widest">
                    {selectedToken.symbol}
                  </span>
                </div>
              </div>

              <div className="space-y-4">
                <label className="block text-sm font-bold text-slate-700">Payment Memo</label>
                <input
                  type="text"
                  required
                  value={memo}
                  onChange={(e) => setMemo(e.target.value)}
                  placeholder="Invoice #101"
                  className="w-full px-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 focus:outline-none transition-all font-medium"
                />
              </div>
            </div>

            <button
              disabled={loading || !account}
              type="submit"
              className="w-full bg-indigo-600 text-white py-5 rounded-2xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-xl shadow-indigo-100 flex items-center justify-center gap-3 active:scale-[0.98]"
            >
              {loading && <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>}
              {loading ? "Confirming on Ledger..." : account ? "Generate Payment Link" : "Connect Wallet to Continue"}
            </button>
          </form>
        ) : (
          <div className="p-10 text-center animate-in fade-in slide-in-from-bottom-6 duration-700">
            <div className="mb-8 inline-block p-5 bg-green-50 rounded-3xl text-green-500 border border-green-100">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-3xl font-black text-slate-900 mb-2">Ready to Share</h3>
            <p className="text-slate-500 mb-8 font-medium">Your request is live. Share this link to receive funds.</p>
            
            <div className="bg-slate-50 p-5 rounded-2xl border border-dashed border-slate-300 flex items-center justify-between mb-10 group hover:border-indigo-300 transition-colors">
              <code className="text-[10px] text-slate-500 font-mono truncate mr-6 italic">{generatedLink}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink || '');
                  alert("Link copied!");
                }}
                className="bg-indigo-600 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all flex-shrink-0"
              >
                Copy
              </button>
            </div>

            <div className="flex flex-col items-center justify-center mb-10">
              <div className="p-10 bg-white border border-slate-100 rounded-[2.5rem] shadow-2xl shadow-slate-200 ring-1 ring-slate-100">
                 <div className="bg-slate-50 p-4 rounded-3xl border border-slate-100 shadow-inner">
                    <QRCodeSVG 
                      value={generatedLink || ''} 
                      size={200} 
                      level="H" 
                      includeMargin={false}
                      className="rounded-xl overflow-hidden"
                    />
                 </div>
                 <p className="mt-6 text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Scan to Settle</p>
              </div>
            </div>

            <button
              onClick={() => setGeneratedLink(null)}
              className="text-indigo-600 hover:text-indigo-700 font-bold text-sm transition-colors flex items-center justify-center gap-2 mx-auto"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Payment Link
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
