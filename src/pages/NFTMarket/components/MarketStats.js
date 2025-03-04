import React from 'react';
import { formatBNB, formatZONE } from '../utils/formatters';

export const MarketStats = ({ stats }) => {
  if (!stats) return null;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <StatCard
        title="总交易额"
        value={`${formatBNB(stats.totalVolume)} BNB`}
      />
      <StatCard
        title="地板价"
        value={`${formatBNB(stats.floorPrice)} BNB`}
      />
      <StatCard
        title="已上架"
        value={stats.listedCount}
      />
      <StatCard
        title="NFT数量"
        value={stats.totalSupply || '0'}
      />
    </div>
  );
};

const StatCard = ({ title, value }) => (
  <div className="bg-gray-800 rounded-lg p-4">
    <div className="text-gray-400 text-sm mb-1">{title}</div>
    <div className="text-white text-xl font-bold">{value}</div>
  </div>
);
