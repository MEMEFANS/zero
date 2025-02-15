import React from 'react';
import PropTypes from 'prop-types';
import Card from '../shared/Card';
import { NFT_RARITY, NFT_RARITY_COLORS } from '../../constants/contracts';
import { ethers } from 'ethers';

const NFTCard = ({ 
  nft, 
  onSelect, 
  showPrice = true,
  showAttributes = true 
}) => {
  const getRarityColor = (rarity) => {
    return NFT_RARITY_COLORS[NFT_RARITY[rarity]] || NFT_RARITY_COLORS['N'];
  };

  const getRarityName = (rarity) => {
    switch(NFT_RARITY[rarity]) {
      case 'N': return 'Normal NFT';
      case 'R': return 'Rare NFT';
      case 'SR': return 'Super Rare NFT';
      case 'SSR': return 'Super Super Rare NFT';
      default: return 'Normal NFT';
    }
  };

  const calculateROI = (dailyReward, price) => {
    if (!price || !dailyReward) return 0;
    const priceInBNB = ethers.BigNumber.isBigNumber(price) 
      ? parseFloat(ethers.utils.formatEther(price))
      : price;
    return ((dailyReward * 365) / (priceInBNB * 100)).toFixed(1);
  };

  return (
    <Card 
      onClick={() => onSelect(nft)} 
      className={`p-4 flex flex-col bg-gradient-to-br ${getRarityColor(nft.attributes.rarity).gradient} border ${getRarityColor(nft.attributes.rarity).border} rounded-xl`}
    >
      {/* Rarity Badge */}
      <div className="mb-2">
        <span className={`px-3 py-1 rounded-lg text-sm ${getRarityColor(nft.attributes.rarity).text} ${getRarityColor(nft.attributes.rarity).bg}`}>
          {NFT_RARITY[nft.attributes.rarity]}
        </span>
      </div>

      {/* NFT Title */}
      <div className="text-center mb-4">
        <h2 className="text-3xl font-bold mb-1 text-white">{NFT_RARITY[nft.attributes.rarity]}</h2>
        <p className="text-gray-300">{getRarityName(nft.attributes.rarity)}</p>
      </div>

      {/* Power Display */}
      <div className="text-center mb-6">
        <div className="bg-black/30 backdrop-blur-sm rounded-lg py-3 px-4">
          <span className="text-2xl font-bold text-white">{nft.attributes.power} POW</span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
          <p className="text-gray-300 text-sm">日收益</p>
          <p className="font-bold text-white">{nft.attributes.dailyReward} ZONE</p>
        </div>
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
          <p className="text-gray-300 text-sm">最大收益</p>
          <p className="font-bold text-white">{nft.attributes.maxReward}</p>
        </div>
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
          <p className="text-gray-300 text-sm">roi</p>
          <p className="font-bold text-white">{calculateROI(nft.attributes.dailyReward, nft.price)}%</p>
        </div>
        <div className="bg-black/20 backdrop-blur-sm rounded-lg p-3">
          <p className="text-gray-300 text-sm">价格</p>
          <p className="font-bold text-white">
            {ethers.BigNumber.isBigNumber(nft.price) 
              ? ethers.utils.formatEther(nft.price) 
              : nft.price} BNB
          </p>
        </div>
      </div>

      {/* Buy Button */}
      <button 
        className="w-full py-3 px-4 bg-green-500 hover:bg-green-600 text-white font-bold rounded-lg transition-colors duration-200 shadow-lg hover:shadow-xl"
        onClick={(e) => {
          e.stopPropagation();
          onSelect(nft);
        }}
      >
        立即购买
      </button>
    </Card>
  );
};

NFTCard.propTypes = {
  nft: PropTypes.shape({
    tokenId: PropTypes.number.isRequired,
    image: PropTypes.string,
    price: PropTypes.oneOfType([PropTypes.number, PropTypes.instanceOf(ethers.BigNumber)]),
    attributes: PropTypes.shape({
      rarity: PropTypes.number.isRequired,
      power: PropTypes.number.isRequired,
      dailyReward: PropTypes.number.isRequired,
      maxReward: PropTypes.number.isRequired,
      minedAmount: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  showPrice: PropTypes.bool,
  showAttributes: PropTypes.bool
};

export default React.memo(NFTCard);
