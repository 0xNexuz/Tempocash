
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

    const checkInitialConnection = async () => {
      if ((window as any).ethereum && !isDemoMode) {
        try {
          const provider = new ethers.BrowserProvider((window as any).ethereum);
          const accounts = await provider.listAccounts();
          if (accounts.length > 0) {
            setAccount(accounts[0].address);
            checkNetwork();
          }
        } catch (e) {
          console.error("Initial check failed", e);
        }
      }
    };
    checkInitialConnection();

    if ((window as any).ethereum) {
      (window as any).ethereum.on('chainChanged', () => window.location.reload());
      (window as any).ethereum.on('accountsChanged', (accounts: string[]) => {
        if (!isDemoMode) setAccount(accounts[0] || null);
      });
    }

    return () => window.removeEventListener('hashchange', handleHashChange);
  }, [isDemoMode]);

  const checkNetwork = async () => {
    if (!(window as any).ethereum) return;
    const provider = new ethers.BrowserProvider((window as any).ethereum);
    const network = await provider.getNetwork();
    const targetChainId = parseInt(TEMPO_NETWORK_CONFIG.chainId, 16);
    setIsWrongNetwork(Number(network.chainId) !== targetChainId);
  };

  const toggleDemoMode = () => {
    setIsDemoMode(!isDemoMode);
    if (!isDemoMode) {
      setAccount("0xTempoDemoAccount723940182347");
      setIsWrongNetwork(false);
    } else {
      setAccount(null);
    }
  };

  const connectWallet = async () => {
    if (isDemoMode) return;
    
    // Check if on mobile and not in a wallet browser
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    if (isMobile && !(window as any).ethereum) {
      const dappUrl = window.location.href.split('//')[1];
      window.location.href = `https://metamask.app.link/dapp/${dappUrl}`;
      return;
    }

    if ((window as any).ethereum) {
      try {
        const provider = new ethers.BrowserProvider((window as any).ethereum);
        
        // Step 1: Request Accounts First
        const accounts = await provider.send("eth_requestAccounts", []);
        setAccount(accounts[0]);

        // Step 2: Check and Switch Network
        const network = await provider.getNetwork();
        const targetChainIdHex = TEMPO_NETWORK_CONFIG.chainId;
        
        if (network.chainId.toString(16) !== targetChainIdHex.replace('0x', '')) {
          try {
            await (window as any).ethereum.request({
              method: 'wallet_switchEthereumChain',
              params: [{ chainId: targetChainIdHex }],
            });
            setIsWrongNetwork(false);
          } catch (switchError: any) {
            // This error code indicates that the chain has not been added to MetaMask.
            if (switchError.code === 4902) {
              try {
                await (window as any).ethereum.request({
                  method: 'wallet_addEthereumChain',
                  params: [TEMPO_NETWORK_CONFIG],
                });
                setIsWrongNetwork(false);
              } catch (addError) {
                console.error("Failed to add network", addError);
              }
            } else if (switchError.code === 4001) {
              setIsWrongNetwork(true);
              alert("Switch rejected. Please switch to Tempo Testnet manually to proceed.");
            }
          }
        } else {
          setIsWrongNetwork(false);
        }
      } catch (err: any) {
        console.error("Wallet connection failed", err);
        if (err.code === 4001) {
          alert("Connection request was rejected.");
        } else {
          alert("Connection failed. Please ensure your wallet is unlocked.");
        }
      }
    } else {
      alert("No EVM wallet detected. Please install MetaMask or open this page inside your wallet's browser.");
    }
  };

  return (
    <Layout 
      account={account} 
      onConnect={connectWallet} 
      isDemoMode={isDemoMode} 
      onToggleDemo={toggleDemoMode}
    >
      {isWrongNetwork && !isDemoMode && account && (
        <div className="max-w-4xl mx-auto mb-8 animate-in fade-in slide-in-from-top-4 duration-500">
          <div className="bg-amber-50 border border-amber-200 text-amber-800 px-6 py-4 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-2 h-2 bg-amber-500 rounded-full animate-pulse"></div>
              <span className="text-sm font-semibold tracking-tight">You are connected to the wrong network.</span>
            </div>
            <button 
              onClick={connectWallet} 
              className="w-full sm:w-auto bg-amber-600 text-white text-xs font-black uppercase tracking-widest px-6 py-2.5 rounded-xl hover:bg-amber-700 transition-all shadow-md active:scale-95"
            >
              Switch to Tempo Testnet
            </button>
          </div>
        </div>
      )}
      {view === 'home' && <Home onGoToMerchant={() => window.location.hash = '#/merchant'} />}
      {view === 'merchant' && <MerchantDashboard account={account} isDemoMode={isDemoMode} />}
      {view === 'payer' && paymentId && <PaymentView paymentId={paymentId} account={account} isDemoMode={isDemoMode} />}
    </Layout>
  );
}

export default App;
