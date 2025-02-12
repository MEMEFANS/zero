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

  return (
    <Card 
      onClick={() => onSelect(nft)} 
      className="p-4 flex flex-col"
    >
      <div className="relative">
        <img 
          src={nft.image || '/images/nft-placeholder.png'} 
          alt={`NFT #${nft.tokenId}`}
          className="w-full h-48 object-cover rounded-lg mb-4"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = '/images/nft-placeholder.png';
          }}
        />
        <span className={`absolute top-2 right-2 px-2 py-1 rounded-full bg-black/50 ${getRarityColor(nft.attributes.rarity)}`}>
          {NFT_RARITY[nft.attributes.rarity]}
        </span>
      </div>

      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-bold">#{nft.tokenId}</h3>
        {showPrice && nft.price && (
          <div className="text-right">
            <p className="text-sm text-gray-400">价格</p>
            <p className="font-bold">
              {ethers.BigNumber.isBigNumber(nft.price) 
                ? ethers.utils.formatEther(nft.price) 
                : nft.price} BNB
            </p>
          </div>
        )}
      </div>

      {showAttributes && (
        <div className="space-y-1 text-sm text-gray-400">
          <p>算力: {nft.attributes.power}</p>
          <p>日收益: {nft.attributes.dailyReward}</p>
          <p>已挖取: {nft.attributes.minedAmount}</p>
        </div>
      )}
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
      minedAmount: PropTypes.number.isRequired
    }).isRequired
  }).isRequired,
  onSelect: PropTypes.func.isRequired,
  showPrice: PropTypes.bool,
  showAttributes: PropTypes.bool
};

export default React.memo(NFTCard);
