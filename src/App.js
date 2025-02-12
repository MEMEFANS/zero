import React, { createContext, useState } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { ethers } from 'ethers';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IDO from './pages/IDO';
import NFTMining from './pages/NFTMining';
import NFTMarket from './pages/NFTMarket';
import MysteryBox from './pages/MysteryBox';
import { translations } from './translations';

export const LanguageContext = createContext();

function getLibrary(provider) {
  return new ethers.providers.Web3Provider(provider);
}

function App() {
  const [language, setLanguage] = useState('zh'); // 'zh', 'en', 'ko'

  // 翻译助手函数
  const t = (key) => {
    return translations[language]?.[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      <Web3ReactProvider getLibrary={getLibrary}>
        <Router>
          <div className="min-h-screen bg-[#0B1120] text-white">
            <Navbar />
            <div className="container mx-auto px-4 py-8">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/ido" element={<IDO />} />
                <Route path="/mystery-box" element={<MysteryBox />} />
                <Route path="/mining" element={<NFTMining />} />
                <Route path="/market" element={<NFTMarket />} />
              </Routes>
            </div>
          </div>
        </Router>
      </Web3ReactProvider>
    </LanguageContext.Provider>
  );
}

export default App;
