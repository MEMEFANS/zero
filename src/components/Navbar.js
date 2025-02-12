import React, { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { injected, setupNetwork } from '../utils/connectors';
import { MdKeyboardArrowDown } from 'react-icons/md';
import { SG, US, KR } from 'country-flag-icons/react/3x2';

const Navbar = () => {
  const { active, account, activate, deactivate } = useWeb3React();
  const location = useLocation();
  const [connecting, setConnecting] = useState(false);
  const [showLanguageMenu, setShowLanguageMenu] = useState(false);
  const [currentLang, setCurrentLang] = useState('zh');

  const languages = [
    { code: 'zh', name: '简体中文', Flag: SG },
    { code: 'en', name: 'English', Flag: US },
    { code: 'ko', name: '한국어', Flag: KR }
  ];

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
    <div className="fixed top-0 left-0 right-0 z-50">
      <div className="w-full px-4 md:max-w-[1000px] mx-auto">
        <div className="flex justify-between h-16 bg-[#0B1120]/80 backdrop-blur border-b border-green-500/20">
          <div className="flex">
            <Link to="/" className="flex items-center px-4">
              <span className="text-xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                ZERO
              </span>
            </Link>
            <div className="hidden md:flex md:items-center md:ml-6 space-x-8">
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
              <div className="relative">
                <button 
                  onClick={() => setShowLanguageMenu(!showLanguageMenu)}
                  className="flex items-center px-3 py-2 text-sm font-medium text-gray-300 hover:text-green-400 transition-colors space-x-2"
                >
                  {(() => {
                    const currentLanguage = languages.find(l => l.code === currentLang);
                    const Flag = currentLanguage?.Flag;
                    return (
                      <>
                        {Flag && <Flag className="w-5 h-5" />}
                        <span>{currentLanguage?.code.toUpperCase()}</span>
                        <MdKeyboardArrowDown className="w-4 h-4" />
                      </>
                    );
                  })()}
                </button>
                {showLanguageMenu && (
                  <div className="absolute right-0 mt-2 w-40 rounded-md shadow-lg bg-[#0B1120] border border-green-500/20">
                    <div className="py-1">
                      {languages.map((lang) => {
                        const Flag = lang.Flag;
                        return (
                          <button
                            key={lang.code}
                            onClick={() => {
                              setCurrentLang(lang.code);
                              setShowLanguageMenu(false);
                            }}
                            className="flex items-center w-full px-4 py-2 text-sm text-left text-gray-300 hover:text-green-400 hover:bg-black/30 space-x-3"
                          >
                            <Flag className="w-5 h-5" />
                            <span>{lang.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
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
                  className="px-6 py-2 text-sm font-medium text-white bg-red-600 rounded-lg hover:bg-red-700"
                >
                  断开连接
                </button>
              </div>
            ) : (
              <button
                onClick={connectWallet}
                disabled={connecting}
                className={`px-6 py-2 text-sm font-medium text-white bg-gradient-to-r from-green-500 to-green-600 rounded-lg hover:from-green-600 hover:to-green-700 transition-all ${
                  connecting ? 'opacity-50 cursor-not-allowed' : ''
                }`}
              >
                {connecting ? '连接中...' : '连接钱包'}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
