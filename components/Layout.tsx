
import React from 'react';

interface LayoutProps {
  children: React.ReactNode;
  account: string | null;
  onConnect: () => void;
}

const Layout: React.FC<LayoutProps> = ({ children, account, onConnect }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.location.hash = ''}>
            <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center text-white font-bold shadow-indigo-200 shadow-md">T</div>
            <span className="text-xl font-bold text-slate-900 tracking-tight">Tempo Cash</span>
          </div>
          
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center bg-slate-100 rounded-full px-3 py-1 border border-slate-200">
              <span className="w-2 h-2 rounded-full bg-indigo-500 mr-2"></span>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Tempo Testnet</span>
            </div>

            <nav className="hidden md:flex gap-6 mr-4">
              <a href="#" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Home</a>
              <a href="#/merchant" className="text-sm font-medium text-slate-600 hover:text-indigo-600">Merchant</a>
            </nav>
            {account ? (
              <div className="flex items-center gap-2 px-3 py-1.5 bg-slate-50 rounded-full border border-slate-200">
                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                <span className="text-xs font-mono text-slate-600">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
              </div>
            ) : (
              <button 
                onClick={onConnect}
                className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-semibold hover:bg-indigo-700 transition-colors shadow-lg shadow-indigo-100"
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

      <footer className="bg-white border-t border-slate-200 py-8">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <p className="text-xs text-slate-400 font-medium">© 2024 Tempo Cash. Built on the Tempo Protocol — The Payments-First Blockchain.</p>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
