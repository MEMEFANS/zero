import React from 'react';
import { formatPower, formatZONE, formatAddress } from '../utils/formatters';

export const NFTDetailModal = ({ nft, onClose, onBuy, onList, onDelist, onStake, selectedTab }) => {
  if (!nft) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-[#1A2438] rounded-2xl max-w-2xl w-full mx-4 overflow-hidden">
        <div className="relative">
          {/* 关闭按钮 */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-white"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* NFT图片 */}
          <div className="aspect-square bg-gray-800 relative">
            <img 
              src={nft.image}
              alt={`NFT #${nft.tokenId}`}
              className="w-full h-full object-cover"
            />
          </div>

          {/* NFT信息 */}
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">#{nft.tokenId}</h3>
              {nft.owner && (
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">拥有者:</span>
                  <span className="text-white">{formatAddress(nft.owner)}</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">算力</div>
                <div className="text-xl font-bold text-white">
                  {formatPower(nft.power)} H/s
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">每日收益</div>
                <div className="text-xl font-bold text-white">
                  {formatZONE(nft.dailyReward)} ZONE
                </div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">最大收益</div>
                <div className="text-xl font-bold text-white">
                  {formatZONE(nft.maxReward)} ZONE
                </div>
              </div>
              {nft.price && (
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">当前价格</div>
                  <div className="text-xl font-bold text-white">
                    {nft.price} BNB
                  </div>
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            {selectedTab === 'market' ? (
              <button
                onClick={() => onBuy(nft)}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                立即购买
              </button>
            ) : (
              <div className="space-y-3">
                {!nft.listed ? (
                  <>
                    <button
                      onClick={() => onList(nft)}
                      className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      上架出售
                    </button>
                    <button
                      onClick={() => onStake(nft)}
                      className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                    >
                      质押挖矿
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => onDelist(nft)}
                    className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                  >
                    取消上架
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
