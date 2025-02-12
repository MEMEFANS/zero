import React from 'react';
import PropTypes from 'prop-types';
import NFTCard from './NFTCard';

const NFTGrid = ({ 
  nfts, 
  onSelect, 
  showPrice = true,
  showAttributes = true,
  emptyMessage = '暂无 NFT',
  loading = false
}) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {[...Array(8)].map((_, index) => (
          <div key={index} className="animate-pulse">
            <div className="bg-gray-700/30 h-48 rounded-lg mb-4"></div>
            <div className="h-4 bg-gray-700/30 rounded mb-2"></div>
            <div className="h-4 bg-gray-700/30 rounded w-2/3"></div>
          </div>
        ))}
      </div>
    );
  }

  if (!nfts || nfts.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-400">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
      {nfts.map((nft) => (
        <NFTCard
          key={nft.tokenId}
          nft={nft}
          onSelect={onSelect}
          showPrice={showPrice}
          showAttributes={showAttributes}
        />
      ))}
    </div>
  );
};

NFTGrid.propTypes = {
  nfts: PropTypes.arrayOf(
    PropTypes.shape({
      tokenId: PropTypes.number.isRequired,
      image: PropTypes.string,
      price: PropTypes.number,
      attributes: PropTypes.shape({
        rarity: PropTypes.number.isRequired,
        power: PropTypes.number.isRequired,
        dailyReward: PropTypes.number.isRequired,
        minedAmount: PropTypes.number.isRequired
      }).isRequired
    })
  ).isRequired,
  onSelect: PropTypes.func.isRequired,
  showPrice: PropTypes.bool,
  showAttributes: PropTypes.bool,
  emptyMessage: PropTypes.string,
  loading: PropTypes.bool
};

export default React.memo(NFTGrid);
