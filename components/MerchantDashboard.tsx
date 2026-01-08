
import React, { useState } from 'react';
import { ethers } from 'ethers';
import { SUPPORTED_TOKENS, TEMPO_CASH_ABI, TEMPO_CASH_CONTRACT_ADDRESS } from '../constants';

const MerchantDashboard: React.FC<{ account: string | null }> = ({ account }) => {
  const [amount, setAmount] = useState('');
  const [memo, setMemo] = useState('');
  const [selectedToken, setSelectedToken] = useState(SUPPORTED_TOKENS[0]);
  const [loading, setLoading] = useState(false);
  const [generatedLink, setGeneratedLink] = useState<string | null>(null);

  const createLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!account) return alert("Connect wallet first!");
    
    setLoading(true);
    try {
      // Cast window to any to access injected ethereum provider
      const provider = new ethers.BrowserProvider((window as any).ethereum);
      const signer = await provider.getSigner();
      const contract = new ethers.Contract(TEMPO_CASH_CONTRACT_ADDRESS, TEMPO_CASH_ABI, signer);

      const parsedAmount = ethers.parseUnits(amount, selectedToken.decimals);
      const tx = await contract.createPayment(selectedToken.address, parsedAmount, memo);
      const receipt = await tx.wait();

      // In a real environment, you'd find the paymentId in the event logs
      // For this demo, we'll simulate the ID generation or use a predictable hash
      const log = receipt.logs.find((l: any) => l.eventName === 'PaymentCreated');
      const paymentId = log ? log.args[0] : ethers.id(Date.now().toString());

      const url = `${window.location.origin}/#/pay/${paymentId}`;
      setGeneratedLink(url);
    } catch (err: any) {
      console.error(err);
      alert("Error: " + (err.message || "Failed to create link"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden">
        <div className="bg-slate-900 p-6 text-white">
          <h2 className="text-2xl font-bold">Merchant Dashboard</h2>
          <p className="text-slate-400 text-sm">Create a new payment request link</p>
        </div>

        {!generatedLink ? (
          <form onSubmit={createLink} className="p-8 space-y-6">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Stablecoin Asset</label>
              <div className="grid grid-cols-3 gap-3">
                {SUPPORTED_TOKENS.map((t) => (
                  <button
                    key={t.symbol}
                    type="button"
                    onClick={() => setSelectedToken(t)}
                    className={`py-3 px-4 rounded-xl border text-sm font-bold transition-all ${
                      selectedToken.symbol === t.symbol 
                        ? 'border-indigo-600 bg-indigo-50 text-indigo-600' 
                        : 'border-slate-200 text-slate-500 hover:border-slate-300'
                    }`}
                  >
                    {t.symbol}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Payment Amount</label>
              <div className="relative">
                <input
                  type="number"
                  step="0.01"
                  required
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all"
                />
                <span className="absolute right-4 top-1/2 -translate-y-1/2 font-bold text-slate-400">
                  {selectedToken.symbol}
                </span>
              </div>
            </div>

            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">Description / Memo</label>
              <textarea
                required
                value={memo}
                onChange={(e) => setMemo(e.target.value)}
                placeholder="e.g. Invoice for Graphic Design Services"
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none transition-all h-24 resize-none"
              />
            </div>

            <button
              disabled={loading || !account}
              type="submit"
              className="w-full bg-indigo-600 text-white py-4 rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
            >
              {loading ? "Generating Link..." : account ? "Generate Payment Link" : "Connect Wallet to Start"}
            </button>
          </form>
        ) : (
          <div className="p-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="mb-6 inline-block p-4 bg-green-100 rounded-full text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-slate-900 mb-2">Link Created!</h3>
            <p className="text-slate-500 mb-8">Share this link with your customer to receive payment.</p>
            
            <div className="bg-slate-50 p-4 rounded-xl border border-dashed border-slate-300 flex items-center justify-between mb-8 group">
              <code className="text-xs text-slate-600 truncate mr-4">{generatedLink}</code>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(generatedLink);
                  alert("Link copied!");
                }}
                className="text-indigo-600 font-bold text-sm hover:underline flex-shrink-0"
              >
                Copy
              </button>
            </div>

            <div className="flex justify-center mb-8">
              <div className="p-4 bg-white border border-slate-100 rounded-2xl shadow-sm">
                 {/* QR Code Placeholder - In real app use qrcode.react */}
                 <div className="w-48 h-48 bg-slate-100 flex flex-col items-center justify-center text-slate-400 gap-2">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
                    </svg>
                    <span className="text-xs">QR Code</span>
                 </div>
              </div>
            </div>

            <button
              onClick={() => setGeneratedLink(null)}
              className="text-slate-400 hover:text-slate-600 font-medium text-sm transition-colors"
            >
              Create another payment request
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default MerchantDashboard;
