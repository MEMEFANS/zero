import React from 'react';
import { NFTCard } from './NFTCard';

export const NFTList = ({
  items = [],
  userHistory,
  selectedTab,
  onBuy,
  onList,
  onDelist,
  onStake
}) => {
  console.log('NFTList items:', items); // 调试日志

  if (selectedTab === 'history') {
    return <div className="text-center text-gray-400 py-8">历史记录</div>;
  }

  if (!items || items.length === 0) {
    return (
      <div className="text-center text-gray-400 py-8">
        {selectedTab === 'market' ? '市场暂无 NFT 上架' : '您暂无 NFT'}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
      {items.map((nft) => (
        <NFTCard
          key={nft.id}
          nft={nft}
          isMyNFT={selectedTab !== 'market'}
          onBuy={onBuy}
          onList={onList}
          onDelist={onDelist}
          onStake={onStake}
        />
      ))}
    </div>
  );
};
