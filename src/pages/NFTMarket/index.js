import React, { useState, useEffect } from 'react';
import { Tabs } from 'antd';
import { useWeb3React } from '@web3-react/core';
import MarketStats from './components/MarketStats';
import NFTList from './components/NFTList';
import ListingModal from './components/ListingModal';
import TradeHistory from './components/TradeHistory';
import { useNFTMarket } from './hooks/useNFTMarket';
import { motion } from 'framer-motion';
import './styles/market.css';

const NFTMarket = () => {
  const { active } = useWeb3React();
  const { 
    marketState, 
    loadingState, 
    fetchMarketItems, 
    handlePageChange, 
    handleBuy, 
    handleList, 
    handleUnlistNFT,
    loadTradeHistory,
    setSelectedTab, 
    setFilterType, 
    setSearchTerm, 
    setModal 
  } = useNFTMarket();
  const [activeTab, setActiveTab] = useState('market');

  const handleTabChange = (key) => {
    setActiveTab(key);
    if (key === 'history') {
      loadTradeHistory();
    }
  };

  // 处理分页变化
  const onPageChange = (page) => {
    handlePageChange(page);
  };

  // 初始加载
  useEffect(() => {
    fetchMarketItems(1);
  }, [fetchMarketItems]);

  // 监听钱包连接状态，加载交易历史
  useEffect(() => {
    if (active && activeTab === 'history') {
      loadTradeHistory();
    }
  }, [active, activeTab, loadTradeHistory]);

  const items = [
    {
      key: 'market',
      label: <span className="text-lg">NFT市场</span>,
      children: <NFTList type="market" onPageChange={onPageChange} />
    },
    ...(active ? [{
      key: 'myNFTs',
      label: <span className="text-lg">我的NFT</span>,
      children: <NFTList type="myNFTs" />
    }] : []),
    {
      key: 'history',
      label: <span className="text-lg">交易历史</span>,
      children: <TradeHistory history={marketState.tradeHistory} />
    }
  ];

  return (
    <div className="min-h-screen relative overflow-hidden" style={{ backgroundColor: '#0B1120' }}>
      {/* 背景动画效果 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          {/* 网格线 */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
            {[...Array(96)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-green-500/5"></div>
            ))}
          </div>
          {/* 渐变背景 */}
          <div 
            className="absolute inset-0" 
            style={{
              backgroundImage: 'linear-gradient(to bottom, rgba(0, 255, 157, 0.05), transparent, rgba(0, 255, 157, 0.05))'
            }}
          ></div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 relative mt-16">
        {/* 标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-500 to-purple-500 bg-clip-text text-transparent">NFT交易市场</h1>
        </div>

        {/* 市场数据统计 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <MarketStats />
        </motion.div>
        
        {/* 市场/我的NFT切换标签 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mt-8 rounded-xl p-6 shadow-xl"
          style={{ backgroundColor: '#1A2333' }}
        >
          <Tabs 
            activeKey={activeTab} 
            onChange={handleTabChange}
            className="custom-tabs"
            items={items}
          />
        </motion.div>

        {/* 上架模态框 */}
        <ListingModal 
          isOpen={marketState.modals?.listing?.isOpen}
          nft={marketState.modals?.listing?.nft}
          onClose={() => setModal('listing', false)}
          onSubmit={(price) => handleList(marketState.modals?.listing?.nft, price)}
        />
      </div>
    </div>
  );
};

export default NFTMarket;
