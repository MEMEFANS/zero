import React, { useState, useEffect } from 'react';
import { Card, Button, Tag, Tooltip } from 'antd';
import { formatEther } from 'ethers/lib/utils';
import { EyeOutlined, ShoppingCartOutlined, TagOutlined, StopOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';
import { NFT_RARITY_IMAGES } from '../../../constants/nftImages';
import { NFT_RARITY_COLORS } from '../../../constants/contracts';

const rarityNames = ['N', 'R', 'SR', 'SSR'];

const NFTCard = ({ nft, type, onAction, onSelect, isSelected, NFT_SETTINGS }) => {
  // 获取本地占位图
  const placeholderImage = NFT_RARITY_IMAGES[rarityNames[nft.rarity]] || '/images/nft-placeholder.png';
  const rarityColor = NFT_RARITY_COLORS[rarityNames[nft.rarity]] || NFT_RARITY_COLORS['N'];
  
  // 状态管理
  const [currentImage, setCurrentImage] = useState(placeholderImage);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // 加载实际的 NFT 图片
  useEffect(() => {
    if (!nft.imageURI) {
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    setIsError(false);

    const img = new Image();
    img.src = nft.imageURI;
    
    img.onload = () => {
      setCurrentImage(nft.imageURI);
      setIsLoading(false);
    };
    
    img.onerror = () => {
      console.log('Failed to load NFT image:', nft.imageURI);
      setIsError(true);
      setIsLoading(false);
    };

    // 清理函数
    return () => {
      img.onload = null;
      img.onerror = null;
    };
  }, [nft.imageURI]);

  const handleAction = (action) => {
    onAction?.(action, nft);
  };

  const handleSelect = () => {
    onSelect?.(nft.id);
  };

  const renderRarityBadge = () => (
    <div className={`absolute top-2 right-2 px-2 py-1 rounded text-xs font-medium ${rarityColor.bg} ${rarityColor.text}`}>
      {rarityNames[nft.rarity]}
    </div>
  );

  const renderPrice = () => {
    if (!nft.price || nft.price === '0') return null;
    
    return (
      <div className="flex items-center gap-2 mt-2">
        <img src="/images/partners/binance.png" alt="BNB" className="w-5 h-5" />
        <span className="text-lg font-semibold text-yellow-500">
          {nft.price} BNB
        </span>
      </div>
    );
  };

  const renderStats = () => {
    // 格式化收益显示
    const formatReward = (reward) => {
      if (!reward) return '0.0';
      // 将收益转换为实际币数（除以1e20）
      const value = ethers.BigNumber.from(reward);
      return ethers.utils.formatEther(value.mul(100));
    };
    
    return (
      <div className="grid grid-cols-2 gap-4 mt-4">
        <div className="text-center p-2 bg-[#1F2937] rounded-lg">
          <div className="text-sm text-gray-400">算力</div>
          <div className="text-lg font-semibold text-green-400">{nft.power} H/s</div>
        </div>
        <div className="text-center p-2 bg-[#1F2937] rounded-lg">
          <div className="text-sm text-gray-400">收益</div>
          <div className="text-lg font-semibold text-blue-400">{formatReward(nft.dailyReward)} %</div>
        </div>
      </div>
    );
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      className="relative group"
    >
      <div className={`absolute -inset-0.5 bg-gradient-to-r ${rarityColor.gradient} rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur`}></div>
      <div className="relative bg-[#1A2438]/80 p-6 rounded-lg border border-green-500/20">
        {/* NFT 图片 */}
        <div className="relative aspect-square rounded-lg overflow-hidden mb-4">
          <img
            src={isError ? placeholderImage : currentImage}
            alt={`NFT #${nft.id}`}
            className={`w-full h-full object-cover transition-all duration-300 ${
              isLoading ? 'scale-105 blur-sm' : 'scale-100 blur-0'
            }`}
            loading="lazy"
          />
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-[#1A2438]/50">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            </div>
          )}
          {renderRarityBadge()}
        </div>

        {/* NFT 信息 */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-lg font-semibold text-white">#{nft.id}</h3>
            {renderPrice()}
          </div>
          {renderStats()}
          
          {/* 操作按钮 */}
          <div className="flex gap-2 mt-4">
            {type === 'market' ? (
              <>
                <Button
                  type="primary"
                  icon={<ShoppingCartOutlined />}
                  onClick={() => handleAction('buy')}
                  block
                >
                  购买
                </Button>
                <Button
                  icon={<EyeOutlined />}
                  onClick={() => handleAction('view')}
                >
                  详情
                </Button>
              </>
            ) : type === 'myNFT' ? (
              nft.isStaked ? (
                // 质押中状态
                <div className="flex items-center justify-center w-full py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                    <span className="text-blue-400 font-medium">质押中</span>
                  </div>
                </div>
              ) : nft.isListed ? (
                // 已上架状态
                <>
                  <Button
                    type="primary"
                    danger
                    icon={<StopOutlined />}
                    onClick={() => handleAction('unlist')}
                    block
                  >
                    下架
                  </Button>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handleAction('view')}
                  >
                    详情
                  </Button>
                </>
              ) : (
                // 普通状态
                <>
                  <Button
                    type="primary"
                    icon={<TagOutlined />}
                    onClick={() => handleAction('list')}
                    block
                  >
                    出售
                  </Button>
                  <Button
                    icon={<EyeOutlined />}
                    onClick={() => handleAction('view')}
                  >
                    详情
                  </Button>
                </>
              )
            ) : null}
          </div>
        </div>
      </div>
    </motion.div>
  );
};

export default NFTCard;
