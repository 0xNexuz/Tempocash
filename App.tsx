
import React, { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import Layout from './components/Layout';
import MerchantDashboard from './components/MerchantDashboard';
import PaymentView from './components/PaymentView';
import Home from './components/Home';
import { TEMPO_NETWORK_CONFIG } from './constants';

function App() {
  const [view, setView] = useState<'home' | 'merchant' | 'payer'>('home');
  const [paymentId, setPaymentId] = useState<string | null>(null);
  const [account, setAccount] = useState<string | null>(null);
  const [isDemoMode, setIsDemoMode] = useState(false);
  const [isWrongNetwork, setIsWrongNetwork] = useState(false);

  useEffect(() => {
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash.startsWith('#/pay/')) {
        const id = hash.replace('#/pay/', '');
        setPaymentId(id);
        setView('payer');
      } else if (hash === '#/merchant') {
        setView('merchant');
      } else {
        setView('home');
      }
    };

    window.addEventListener('hashchange', handleHashChange);
    handleHashChange();

    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (!isDemoMode) setAccount(accounts[0] || null);
      });
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isDemoMode]);

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      setAccount("0xTempoDemoAccount723940182347");
    } else {
      setAccount(null);
    }
  };

  const connectWallet = async () => {
    if (isDemoMode) return;
    
    if ((window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        const network = await provider.getNetwork();
        
        if (network.chainId.toString(16) !== TEMPO_NETWORK_CONFIG.chainId.replace('0x', '')) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: TEMPO_NETWORK_CONFIG.chainId }],
            });
          } catch (switchError: any) {
            if (switchError.code === 4902) {
              await (window as any).ethereum.request({
                method: 'wallet_addEthereumChain',
                params: [TEMPO_NETWORK_CONFIG],
              });
            }
          }
        }

        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);
        setIsWrongNetwork(false);
      } catch (err) {
        console.error("Wallet connection failed", err);
      }
    } else {
      alert("Please install an EVM wallet like MetaMask to test Live Mode, or toggle Demo Mode above!");
    }
  };

  return (
    <Layout 
      account={account} 
      onConnect={connectWallet} 
      isDemoMode={isDemoMode} 
      onToggleDemo={toggleDemoMode}
    >
      {isWrongNetwork && !isDemoMode && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl mb-6 flex justify-between items-center shadow-sm">
          <span className="text-sm font-medium">Please switch to Tempo Testnet to use this app.</span>
          <button onClick={connectWallet} className="bg-red-600 text-white text-xs px-3 py-1 rounded-lg hover:bg-red-700 transition-colors">Switch</button>
        </div>
      )}
      {view === 'home' && <Home onGoToMerchant={() => window.location.hash = '#/merchant'} />}
      {view === 'merchant' && <MerchantDashboard account={account} isDemoMode={isDemoMode} />}
      {view === 'payer' && paymentId && <PaymentView paymentId={paymentId} account={account} isDemoMode={isDemoMode} />}
    </Layout>
  );
}

export default App;
