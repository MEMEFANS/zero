import React from 'react';
import { Card, Button, Tag, Tooltip } from 'antd';
import { formatEther } from 'ethers/lib/utils';
import { EyeOutlined, ShoppingCartOutlined, TagOutlined, StopOutlined } from '@ant-design/icons';
import { motion } from 'framer-motion';
import { ethers } from 'ethers';

const rarityColors = {
  0: '#4B5563',   // N - 灰色
  1: '#3B82F6',   // R - 蓝色
  2: '#8B5CF6',   // SR - 紫色
  3: '#F59E0B'    // SSR - 金色
};

const rarityNames = ['N', 'R', 'SR', 'SSR'];

const NFTCard = ({ nft, type, onAction, onSelect, isSelected, NFT_SETTINGS }) => {
  const handleAction = (action) => {
    onAction?.(action, nft);
  };

  const handleSelect = () => {
    onSelect?.(nft.id);
  };

  const renderRarityBadge = () => (
    <div 
      className="absolute top-2 right-2 px-3 py-1 rounded-full text-white text-sm font-medium"
      style={{ backgroundColor: rarityColors[nft.rarity] }}
    >
      {rarityNames[nft.rarity]}
    </div>
  );

  const renderPrice = () => {
    if (!nft.price || nft.price === '0') return null;
    
    return (
      <div className="flex items-center gap-2 mt-2">
        <img src="/bnb-logo.png" alt="BNB" className="w-5 h-5" />
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
          <div className="text-lg font-semibold text-green-400">{nft.power}</div>
        </div>
        <div className="text-center p-2 bg-[#1F2937] rounded-lg">
          <div className="text-sm text-gray-400">收益</div>
          <div className="text-lg font-semibold text-blue-400">{formatReward(nft.dailyReward)} ZONE</div>
        </div>
      </div>
    );
  };

  const renderActionButtons = () => {
    switch (type) {
      case 'market':
        return (
          <div className="flex gap-2 mt-4">
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
          </div>
        );
      case 'myNFT':
        // 如果NFT正在质押中，显示质押状态
        if (nft.isStaked) {
          return (
            <div className="flex items-center justify-center mt-4 py-2 px-4 rounded-lg bg-gradient-to-r from-blue-500/20 to-purple-500/20 border border-blue-500/30">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                <span className="text-blue-400 font-medium">质押中</span>
              </div>
            </div>
          );
        }
        return nft.isActive ? (
          <Button
            type="primary"
            danger
            icon={<StopOutlined />}
            onClick={() => handleAction('unlist')}
            block
          >
            下架
          </Button>
        ) : (
          <Button
            type="primary"
            icon={<TagOutlined />}
            onClick={() => handleAction('list')}
            block
          >
            上架
          </Button>
        );
      default:
        return null;
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      transition={{ type: "spring", stiffness: 300 }}
    >
      <Card
        className={`bg-[#1A2333] border-[#2D3748] hover:border-green-500 transition-all duration-300 ${
          isSelected ? 'border-green-500' : ''
        }`}
        cover={
          <div className="relative">
            <img
              src={nft.imageURI || '/placeholder.png'}
              alt={`NFT #${nft.id}`}
              className="w-full h-48 object-cover"
            />
            {renderRarityBadge()}
          </div>
        }
        onClick={handleSelect}
      >
        <Card.Meta
          title={
            <div className="flex justify-between items-center">
              <span className="text-white">NFT #{nft.id}</span>
              {nft.isListed && <Tag color="green">已上架</Tag>}
            </div>
          }
          description={
            <div className="space-y-4">
              {type === 'market' && renderPrice()}
              {renderStats()}
              {renderActionButtons()}
            </div>
          }
        />
      </Card>
    </motion.div>
  );
};

export default NFTCard;
