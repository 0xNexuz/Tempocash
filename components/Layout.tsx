
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  account: string | null;
  onConnect: () => void;
  isDemoMode: boolean;
  onToggleDemo: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, account, onConnect, isDemoMode, onToggleDemo }) => {
  return (
    <div className="min-h-screen flex flex-col bg-slate-50/50">
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer group" onClick={() => window.location.hash = ''}>
            <div className="w-9 h-9 bg-indigo-600 rounded-xl flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-200 group-hover:scale-105 transition-transform">T</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Tempo Cash</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* Demo Toggle */}
            <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-100 rounded-full border border-slate-200 mr-2">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Demo Mode</span>
              <button 
                onClick={onToggleDemo}
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors focus:outline-none ${isDemoMode ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <span className={`inline-block h-3 w-3 transform rounded-full bg-white transition-transform ${isDemoMode ? 'translate-x-5' : 'translate-x-1'}`} />
              </button>
            </div>

            <nav className="hidden md:flex gap-6 mr-4">
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Home</a>
              <a href="#/merchant" className="text-sm font-medium text-slate-600 hover:text-indigo-600 transition-colors">Merchant</a>
            </nav>

            {account ? (
              <div className="flex items-center gap-3">
                <div className="hidden sm:flex items-center bg-indigo-50 rounded-full px-3 py-1 border border-indigo-100">
                  <div className={`w-1.5 h-1.5 rounded-full mr-2 ${isDemoMode ? 'bg-amber-400 animate-pulse' : 'bg-indigo-500'}`}></div>
                  <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider">
                    {isDemoMode ? 'Demo Network' : 'Tempo Testnet'}
                  </span>
                </div>
                <div className="flex items-center gap-2 px-3 py-1.5 bg-white rounded-xl border border-slate-200 shadow-sm">
                  <span className="text-xs font-mono font-bold text-slate-600">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                </div>
              </div>
            ) : (
              <button 
                onClick={onConnect}
                className="bg-indigo-600 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95"
              >
                Connect Wallet
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 w-full">
        {children}
      </main>

      <footer className="bg-white border-t border-slate-100 py-10 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 opacity-50">
            <div className="w-6 h-6 bg-slate-400 rounded-md flex items-center justify-center text-white text-[10px] font-bold">T</div>
            <span className="text-sm font-bold text-slate-900 tracking-tight">Tempo Cash</span>
          </div>
          <p className="text-xs text-slate-400 font-medium tracking-wide">
            The Payments-First Blockchain. No Native Token. Pure Stablecoin Settlement.
          </p>
          <div className="flex gap-6">
            <a href="https://viem.sh/tempo" target="_blank" className="text-xs font-bold text-slate-400 hover:text-indigo-600">Protocol Docs</a>
            <a href="#" className="text-xs font-bold text-slate-400 hover:text-indigo-600">Explorer</a>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
