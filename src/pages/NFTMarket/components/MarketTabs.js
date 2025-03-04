import React from 'react';

export const MarketTabs = ({ selectedTab, onTabChange }) => {
  const tabs = [
    { id: 'market', label: '市场列表' },
    { id: 'my-nfts', label: '我的 NFT' },
    { id: 'history', label: '交易历史' }
  ];

  return (
    <div className="flex space-x-4 mb-8">
      {tabs.map(tab => (
        <button
          key={tab.id}
          className={`px-6 py-2 rounded-lg ${
            selectedTab === tab.id ? 'bg-green-600' : 'bg-gray-800'
          } text-white`}
          onClick={() => onTabChange(tab.id)}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
};
