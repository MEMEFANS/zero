import React from 'react';
import PropTypes from 'prop-types';
import Card from '../shared/Card';

const StatCard = ({ title, value, change, icon }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between">
      <div>
        <p className="text-gray-400 mb-1">{title}</p>
        <p className="text-2xl font-bold">{value}</p>
        {change && (
          <p className={`text-sm ${change >= 0 ? 'text-green-500' : 'text-red-500'}`}>
            {change >= 0 ? '+' : ''}{change}%
          </p>
        )}
      </div>
      <div className="text-blue-500">
        {icon}
      </div>
    </div>
  </Card>
);

const MarketStats = ({ 
  totalVolume,
  dailyVolume,
  totalNFTs,
  listedNFTs,
  volumeChange,
  loading = false 
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-[#1e2839] p-4 rounded-xl">
              <div className="h-4 bg-gray-700/30 rounded w-1/2 mb-2"></div>
              <div className="h-6 bg-gray-700/30 rounded w-3/4"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <StatCard
        title="总交易量"
        value={`${totalVolume} BNB`}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
          </svg>
        }
      />

      <StatCard
        title="24h 交易量"
        value={`${dailyVolume} BNB`}
        change={volumeChange}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        }
      />

      <StatCard
        title="NFT 总量"
        value={totalNFTs}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        }
      />

      <StatCard
        title="在售 NFT"
        value={listedNFTs}
        icon={
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
        }
      />
    </div>
  );
};

MarketStats.propTypes = {
  totalVolume: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  dailyVolume: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  totalNFTs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  listedNFTs: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  volumeChange: PropTypes.oneOfType([PropTypes.number, PropTypes.string]),
  loading: PropTypes.bool
};

export default React.memo(MarketStats);
