import React from 'react';
import { motion } from 'framer-motion';
import { useNFTMarket } from '../hooks/useNFTMarket';

const StatCard = ({ title, value, unit = '' }) => (
  <div className="bg-[#1A2333] rounded-xl p-6 backdrop-blur-lg border border-[#2D3748] hover:border-green-500/30 transition-all duration-300">
    <h3 className="text-[#94A3B8] text-sm mb-2 opacity-70">{title}</h3>
    <div className="flex items-end gap-1">
      <span className="text-2xl font-semibold bg-gradient-to-r from-[#00FF9D] to-[#00B8FF] bg-clip-text text-transparent">
        {value}
      </span>
      {unit && <span className="text-[#94A3B8] mb-1">{unit}</span>}
    </div>
  </div>
);

const MarketStats = () => {
  const { marketState } = useNFTMarket();
  const stats = marketState.stats || {};

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <StatCard 
          title="总交易量" 
          value={parseFloat(stats.totalVolume || '0').toFixed(2)} 
          unit="BNB" 
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.1 }}
      >
        <StatCard 
          title="24h交易量" 
          value={parseFloat(stats.dailyVolume || '0').toFixed(2)} 
          unit="BNB" 
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.2 }}
      >
        <StatCard 
          title="地板价" 
          value={parseFloat(stats.floorPrice || '0').toFixed(2)} 
          unit="BNB" 
        />
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.3 }}
      >
        <StatCard 
          title="市场费率" 
          value={parseFloat(stats.marketFeeRate || '0') / 10} 
          unit="%" 
        />
      </motion.div>
    </div>
  );
};

export default MarketStats;
