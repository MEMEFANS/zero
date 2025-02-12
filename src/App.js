import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Web3ReactProvider } from '@web3-react/core';
import { Web3Provider } from '@ethersproject/providers';
import Navbar from './components/Navbar';
import Home from './pages/Home';
import IDO from './pages/IDO';
import NFTMining from './pages/NFTMining';
import NFTMarket from './pages/NFTMarket';
import MysteryBox from './pages/MysteryBox';

function getLibrary(provider) {
  const library = new Web3Provider(provider);
  library.pollingInterval = 12000;
  return library;
}

function App() {
  return (
    <Web3ReactProvider getLibrary={getLibrary}>
      <Router>
        <div className="min-h-screen bg-binance-dark text-white">
          <Navbar />
          <div className="w-full px-4 md:max-w-[1000px] mx-auto mt-16">
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
  );
}

export default App;
