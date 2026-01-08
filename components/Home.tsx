
import React from 'react';

const Home: React.FC<{ onGoToMerchant: () => void }> = ({ onGoToMerchant }) => {
  return (
    <div className="max-w-4xl mx-auto text-center py-12">
      <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-indigo-50 text-indigo-700 rounded-full text-xs font-bold mb-6 border border-indigo-100 uppercase tracking-widest">
        Native Stablecoin Payments
      </div>
      <h1 className="text-6xl font-extrabold text-slate-900 mb-6 tracking-tight leading-[1.1]">
        The protocol for <span className="text-indigo-600">instant</span> stablecoin checkouts.
      </h1>
      <p className="text-xl text-slate-600 mb-10 max-w-2xl mx-auto leading-relaxed">
        Built on Tempo Testnet. Zero gas in ETH. Pay fees natively in USDC or pathUSD. 
        Experience the first blockchain optimized for the global payment sandwich.
      </p>
      
      <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-20">
        <button 
          onClick={onGoToMerchant}
          className="w-full sm:w-auto px-8 py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 shadow-xl shadow-indigo-200 transition-all hover:-translate-y-1 active:translate-y-0"
        >
          Create Payment Link
        </button>
        <a 
          href="https://tempo.testnet.explorer/" 
          target="_blank"
          className="w-full sm:w-auto px-8 py-4 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold text-lg hover:bg-slate-50 transition-all flex items-center justify-center gap-2"
        >
          View Explorer
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 opacity-40" viewBox="0 0 20 20" fill="currentColor">
            <path d="M11 3a1 1 0 100 2h2.586l-6.293 6.293a1 1 0 101.414 1.414L15 6.414V9a1 1 0 102 0V4a1 1 0 00-1-1h-5z" />
            <path d="M5 5a2 2 0 00-2 2v8a2 2 0 002 2h8a2 2 0 002-2v-3a1 1 0 10-2 0v3H5V7h3a1 1 0 000-2H5z" />
          </svg>
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-left">
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-indigo-100 rounded-2xl flex items-center justify-center text-indigo-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">Native Fees</h3>
          <p className="text-slate-500 text-sm leading-relaxed">No need for ETH. Transaction fees are paid directly in the stablecoin you are already sending.</p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-green-100 rounded-2xl flex items-center justify-center text-green-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">TIP-20 Optimized</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Leverages Tempo's native token standard for low-latency settlement and built-in payment memos.</p>
        </div>
        <div className="p-8 bg-white rounded-3xl border border-slate-100 shadow-sm hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-amber-100 rounded-2xl flex items-center justify-center text-amber-600 mb-6">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.603 2L9 4.343 7.397 2a3.323 3.323 0 00-4.015 4.984L5.45 10l-2.068 3.016a3.323 3.323 0 004.015 4.984L9 15.657 10.603 18a3.323 3.323 0 004.015-4.984L12.55 10l2.068-3.016a3.323 3.323 0 00-1.015-4.984z" />
            </svg>
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">Enshrined DEX</h3>
          <p className="text-slate-500 text-sm leading-relaxed">Integrated liquidity ensures merchants can receive their preferred stablecoin regardless of payer asset.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;
