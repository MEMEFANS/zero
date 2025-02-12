import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { injected, setupNetwork } from '../utils/connectors';

const Navbar = () => {
  const { active, account, activate, deactivate } = useWeb3React();
  const location = useLocation();
  const [connecting, setConnecting] = useState(false);

  useEffect(() => {
    const connectWalletOnPageLoad = async () => {
      if (window.ethereum && window.ethereum.isConnected() && localStorage.getItem('previouslyConnected') === 'true') {
        try {
          await activate(injected);
        } catch (error) {
          console.error('Error on auto connect:', error);
        }
      }
    };
    connectWalletOnPageLoad();
  }, [activate]);

  const connectWallet = async () => {
    if (connecting) return;
    setConnecting(true);
    
    try {
      if (!window.ethereum) {
        alert('请安装MetaMask或其他Web3钱包');
        return;
      }

      // First request account access
      await window.ethereum.request({
        method: 'eth_requestAccounts'
      });

      // Then setup network and activate
      await setupNetwork();
      await activate(injected);
      localStorage.setItem('previouslyConnected', 'true');
    } catch (error) {
      console.error('Error connecting wallet:', error);
      if (error.name === 'UnsupportedChainIdError') {
        const hasSetup = await setupNetwork();
        if (hasSetup) {
          await activate(injected);
        }
      }
    } finally {
      setConnecting(false);
    }
  };

  const disconnectWallet = () => {
    try {
      deactivate();
      localStorage.removeItem('previouslyConnected');
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
    }
  };

  return (
    <nav className="bg-[#0B1120]/80 backdrop-blur-md border-b border-green-500/20 fixed w-full z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between h-16">
          <div className="flex">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                ZERO
              </span>
            </Link>
            <div className="hidden md:flex md:items-center md:ml-10 space-x-8">
              <Link
                to="/ido"
                className={`${
                  location.pathname === '/ido'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                IDO
              </Link>
              <Link
                to="/mystery-box"
                className={`${
                  location.pathname === '/mystery-box'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                盲盒
              </Link>
              <Link
                to="/mining"
                className={`${
                  location.pathname === '/mining'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                挖矿
              </Link>
              <Link
                to="/market"
                className={`${
                  location.pathname === '/market'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                市场
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            {active ? (
              <div className="flex items-center">
                <span className="text-sm text-gray-300 mr-4">
                  {account.slice(0, 6)}...{account.slice(-4)}
                </span>
                <button
                  onClick={disconnectWallet}
                  className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                >
                  断开连接
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className={`bg-gradient-to-r from-green-500 to-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:from-green-600 hover:to-green-700 transition-all ${
                  connecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {connecting ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
