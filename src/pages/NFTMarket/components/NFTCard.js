import React, { memo } from 'react';
import { NFT_RARITY_COLORS } from '../../../constants/contracts';

export const NFTCard = memo(({ nft, isMyNFT, onBuy, onList, onDelist, onStake }) => {
  if (!nft || !nft.tokenId) return null;

  const getRarityColor = (rarity) => {
    return NFT_RARITY_COLORS[rarity] || 'bg-gray-500';
  };

  return (
    <div className="bg-gray-800 rounded-lg overflow-hidden">
      {/* NFT 图片容器 */}
      <div className="relative w-full pb-[100%]">
        <img
          src={nft.image}
          alt={`NFT #${nft.id}`}
          className="absolute top-0 left-0 w-full h-full object-cover"
          onError={(e) => {
            e.target.onerror = null;
            e.target.style.backgroundColor = NFT_RARITY_COLORS[nft.rarity] || '#6c757d';
          }}
        />
        <div className="absolute top-2 right-2">
          <span className={`px-2 py-1 rounded text-xs md:text-sm ${getRarityColor(nft.rarity)}`}>
            {nft.rarity}
          </span>
        </div>
      </div>

      {/* NFT 信息 */}
      <div className="p-2 md:p-3">
        <div className="text-sm md:text-base font-semibold mb-1 text-white">NFT #{nft.id}</div>
        <div className="space-y-1 text-xs md:text-sm text-gray-300">
          <div>算力: {parseFloat(nft.power).toFixed(2)} H/s</div>
          <div>每日收益: {parseFloat(nft.dailyReward).toFixed(4)} ZONE</div>
          <div>最大收益: {parseFloat(nft.maxReward).toFixed(4)} ZONE</div>
          <div>已挖矿量: {parseFloat(nft.minedAmount).toFixed(4)} ZONE</div>
          {nft.listed && (
            <div className="text-sm md:text-base font-semibold text-white">
              价格: {nft.price} BNB
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="mt-2 space-y-2">
          {isMyNFT ? (
            <>
              {nft.listed ? (
                <button
                  onClick={() => onDelist(nft)}
                  className="w-full bg-red-600 text-white px-3 py-1 md:px-4 md:py-2 rounded text-xs md:text-sm hover:bg-red-700 transition-colors"
                >
                  下架
                </button>
              ) : (
                <>
                  <button
                    onClick={() => onList(nft)}
                    className="w-full bg-green-600 text-white px-3 py-1 md:px-4 md:py-2 rounded text-xs md:text-sm hover:bg-green-700 transition-colors"
                  >
                    上架出售
                  </button>
                  <button
                    onClick={() => onStake(nft)}
                    className="w-full bg-blue-600 text-white px-3 py-1 md:px-4 md:py-2 rounded text-xs md:text-sm hover:bg-blue-700 transition-colors"
                  >
                    质押
                  </button>
                </>
              )}
            </>
          ) : (
            <button
              onClick={() => onBuy(nft)}
              className="w-full bg-blue-600 text-white px-3 py-1 md:px-4 md:py-2 rounded text-xs md:text-sm hover:bg-blue-700 transition-colors"
            >
              购买
            </button>
          )}
        </div>
      </div>
    </div>
  );
});
