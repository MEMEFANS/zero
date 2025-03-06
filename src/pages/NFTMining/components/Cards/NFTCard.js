import React from 'react';
import PropTypes from 'prop-types';
import { NFT_RARITY_COLORS } from '../../../../constants/contracts';

const NFTCard = ({ nft, onStake, onUnstake, isStaked }) => {
  const { tokenId, power, level, rarity, dailyReward, maxReward, minedAmount, stakeTime, imageURI } = nft;
  const rarityColor = NFT_RARITY_COLORS[rarity] || NFT_RARITY_COLORS['N'];

  // 计算已挖矿进度
  const miningProgress = maxReward > 0 ? (minedAmount / maxReward) * 100 : 0;
  
  // 格式化质押时间
  const formatStakeTime = (timestamp) => {
    if (!timestamp) return '未质押';
    const now = Math.floor(Date.now() / 1000);
    const duration = now - timestamp;
    const days = Math.floor(duration / (24 * 60 * 60));
    const hours = Math.floor((duration % (24 * 60 * 60)) / (60 * 60));
    return `${days}天${hours}小时`;
  };

  return (
    <div className="relative group">
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${rarityColor.gradient} rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur`}></div>
      <div className="relative bg-[#1A2438]/80 p-6 rounded-lg border border-green-500/20">
        {/* NFT 图片 */}
        <div className="mb-4 relative aspect-square rounded-lg overflow-hidden">
          <img
            src={imageURI}
            alt={`NFT #${tokenId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null; // 防止无限循环
              e.target.src = '/images/nft-placeholder.png'; // 设置默认图片
            }}
          />
          <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${rarityColor.bg} ${rarityColor.text}`}>
            {rarity}
          </div>
        </div>

        {/* NFT 信息 */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium text-gray-400">ID</span>
            <span className={`text-sm font-medium ${rarityColor.text}`}>#{tokenId}</span>
          </div>
          
          <div className="flex justify-between items-center">
            <span className="text-gray-400">算力</span>
            <span className="text-green-400 font-bold">{power} H/s</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">等级</span>
            <span className="text-green-400 font-bold">Lv.{level}</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-gray-400">日收益</span>
            <span className="text-amber-400 font-bold">{dailyReward / 1e18} ZONE</span>
          </div>

          {/* 挖矿进度条 */}
          <div className="space-y-1">
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">挖矿进度</span>
              <span className="text-gray-400">{miningProgress.toFixed(1)}%</span>
            </div>
            <div className="w-full h-2 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full bg-green-500 rounded-full transition-all duration-500"
                style={{ width: `${miningProgress}%` }}
              />
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-400">已挖矿</span>
              <span className="text-gray-400">{minedAmount / 1e18} / {maxReward / 1e18} ZONE</span>
            </div>
          </div>

          {/* 质押时间和挖矿状态 */}
          {isStaked && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">质押时长</span>
                <span className="text-blue-400">{formatStakeTime(stakeTime)}</span>
              </div>
              <div className="flex items-center justify-center space-x-2 py-2 px-4 rounded-lg bg-green-500/10">
                <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                <span className="text-green-400 text-sm">正在挖矿中...</span>
              </div>
            </>
          )}

          {/* 操作按钮 */}
          {!isStaked && (
            <button
              onClick={() => onStake(tokenId)}
              className="w-full py-2 px-4 rounded-lg font-medium transition-colors bg-green-500/20 text-green-400 hover:bg-green-500/30"
            >
              质押
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

NFTCard.propTypes = {
  nft: PropTypes.shape({
    tokenId: PropTypes.number.isRequired,
    power: PropTypes.number.isRequired,
    level: PropTypes.number.isRequired,
    rarity: PropTypes.string.isRequired,
    dailyReward: PropTypes.number.isRequired,
    maxReward: PropTypes.number.isRequired,
    minedAmount: PropTypes.number.isRequired,
    stakeTime: PropTypes.number,
    imageURI: PropTypes.string.isRequired
  }).isRequired,
  onStake: PropTypes.func.isRequired,
  onUnstake: PropTypes.func.isRequired,
  isStaked: PropTypes.bool.isRequired
};

export default NFTCard;
