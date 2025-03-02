import React, { useEffect, useState, useContext, useRef } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useWeb3React } from '@web3-react/core';
import { injected, setupNetwork } from '../utils/connectors';
import { LanguageContext } from '../App';

const Navbar = () => {
  const { active, account, activate, deactivate } = useWeb3React();
  const location = useLocation();
  const [connecting, setConnecting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [isLangOpen, setIsLangOpen] = useState(false);
  const { language, setLanguage, t } = useContext(LanguageContext);
  const langMenuRef = useRef(null);

  const languages = {
    en: { 
      name: 'English', 
      flag: 'https://flagcdn.com/w40/us.png', 
      shortName: 'English' 
    },
    ko: { 
      name: '한국어', 
      flag: 'https://flagcdn.com/w40/kr.png', 
      shortName: 'Korean' 
    },
    zh: { 
      name: '新加坡', 
      flag: 'https://flagcdn.com/w40/sg.png', 
      shortName: 'Singapore' 
    }
  };

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

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (langMenuRef.current && !langMenuRef.current.contains(event.target)) {
        setIsLangOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

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
    <div className="w-full bg-[#0B1120] fixed z-50">
      <div className="max-w-[1400px] mx-auto px-4">
        <div className="flex justify-between h-20">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <Link to="/" className="flex items-center space-x-2">
                <img 
                  src="/images/logo.png" 
                  alt="ZERO Logo" 
                  style={{ 
                    width: '64px',
                    height: '64px',
                    objectFit: 'contain',
                    imageRendering: 'crisp-edges',
                    transform: 'translateY(2px)'
                  }}
                />
                <span className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                  ZERO
                </span>
              </Link>
            </div>
            {/* Desktop menu */}
            <div className="hidden md:flex md:items-center md:ml-10 space-x-8">
              <Link
                to="/mint"
                className={`${
                  location.pathname === '/mint'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                Mint
              </Link>
              <Link
                to="/mystery-box"
                className={`${
                  location.pathname === '/mystery-box'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                {t('mysteryBox')}
              </Link>
              <Link
                to="/mining"
                className={`${
                  location.pathname === '/mining'
                    ? 'text-green-400 font-medium'
                    : 'text-gray-300 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
              >
                NFT挖矿
              </Link>
              <Link
                to="/lpmining"
                className={`${
                  location.pathname === '/lpmining'
                    ? 'text-green-400 font-medium'
                    : 'text-gray-300 hover:text-white'
                } px-3 py-2 rounded-md text-sm font-medium`}
              >
                LP挖矿
              </Link>
              <Link
                to="/market"
                className={`${
                  location.pathname === '/market'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                {t('market')}
              </Link>
              <Link
                to="/airdrop"
                className={`${
                  location.pathname === '/airdrop'
                    ? 'text-green-400 border-green-400'
                    : 'text-gray-300 hover:text-green-400 border-transparent'
                } px-3 py-2 text-sm font-medium border-b-2 transition-colors`}
              >
                {t('airdrop')}
              </Link>
            </div>
          </div>

          <div className="flex items-center">
            {/* Mobile menu button */}
            <button
              onClick={() => setIsOpen(!isOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none"
            >
              <span className="sr-only">Open main menu</span>
              {!isOpen ? (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              ) : (
                <svg className="block h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </button>

            {/* Language Selector Dropdown */}
            <div className="relative hidden md:block mr-4" ref={langMenuRef}>
              <button
                onClick={() => setIsLangOpen(!isLangOpen)}
                className="flex items-center space-x-2 px-3 py-2 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md"
              >
                <img src={languages[language].flag} alt={languages[language].shortName} className="w-5 h-4 object-cover" />
                <span>{languages[language].shortName}</span>
                <svg
                  className={`h-4 w-4 transition-transform ${isLangOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isLangOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-gray-800 ring-1 ring-black ring-opacity-5">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {Object.entries(languages).map(([code, { name, flag, shortName }]) => (
                      <button
                        key={code}
                        onClick={() => {
                          setLanguage(code);
                          setIsLangOpen(false);
                        }}
                        className={`${
                          language === code
                            ? 'bg-gray-700 text-white'
                            : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                        } group flex items-center w-full px-4 py-2 text-sm`}
                        role="menuitem"
                      >
                        <img src={flag} alt={shortName} className="w-5 h-4 mr-3 object-cover" />
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <div className="flex items-center ml-4">
              {active ? (
                <div className="flex items-center">
                  <span className="hidden sm:inline text-sm text-gray-300 mr-4">
                    {account.slice(0, 6)}...{account.slice(-4)}
                  </span>
                  <button
                    onClick={disconnectWallet}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-red-700 transition-colors"
                  >
                    {t('disconnect')}
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
                  {connecting ? t('connecting') : t('connectWallet')}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile menu */}
        <div className={`${isOpen ? 'block' : 'hidden'} md:hidden`}>
          <div className="px-2 pt-2 pb-3 space-y-1">
            {/* Language Selector for Mobile */}
            <div className="px-3 py-2">
              {Object.entries(languages).map(([code, { name, flag, shortName }]) => (
                <button
                  key={code}
                  onClick={() => {
                    setLanguage(code);
                    setIsOpen(false);
                  }}
                  className={`flex items-center w-full px-4 py-2 text-sm ${
                    language === code
                      ? 'bg-gray-700 text-white'
                      : 'text-gray-300 hover:bg-gray-700 hover:text-white'
                  } rounded-md mb-1`}
                >
                  <img src={flag} alt={shortName} className="w-5 h-4 mr-3 object-cover" />
                  {name}
                </button>
              ))}
            </div>

            <Link
              to="/mint"
              className={`${
                location.pathname === '/mint'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              Mint
            </Link>
            <Link
              to="/mystery-box"
              className={`${
                location.pathname === '/mystery-box'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              {t('mysteryBox')}
            </Link>
            <Link
              to="/mining"
              className={`${
                location.pathname === '/mining'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              NFT挖矿
            </Link>
            <Link
              to="/lpmining"
              className={`${
                location.pathname === '/lpmining'
                  ? 'bg-gray-900 text-white'
                  : 'text-gray-300 hover:bg-gray-700 hover:text-white'
              } block px-3 py-2 rounded-md text-base font-medium`}
              onClick={() => setIsOpen(false)}
            >
              LP挖矿
            </Link>
            <Link
              to="/market"
              className={`${
                location.pathname === '/market'
                  ? 'text-green-400'
                  : 'text-gray-300'
              } block px-3 py-2 text-base font-medium hover:text-green-400`}
              onClick={() => setIsOpen(false)}
            >
              {t('market')}
            </Link>
            <Link
              to="/airdrop"
              className={`${
                location.pathname === '/airdrop'
                  ? 'text-green-400'
                  : 'text-gray-300'
              } block px-3 py-2 text-base font-medium hover:text-green-400`}
              onClick={() => setIsOpen(false)}
            >
              {t('airdrop')}
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
