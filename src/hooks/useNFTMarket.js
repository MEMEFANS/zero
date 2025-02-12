import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import useNFTContract from './useNFTContract';

const NFT_RARITY = {
  COMMON: 'common',
  UNCOMMON: 'uncommon',
  RARE: 'rare',
  EPIC: 'epic',
  LEGENDARY: 'legendary'
};

const useNFTMarket = () => {
  const { contracts, getOwnedNFTs } = useNFTContract();
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    dailyVolume: 0,
    totalNFTs: 0,
    listedNFTs: 0,
    volumeChange: 0
  });
  const [loading, setLoading] = useState(true);

  const fetchMarketStats = useCallback(async () => {
    if (!contracts.nft) return;
    
    try {
      setLoading(true);
      
      // 从合约获取实际数据
      const totalVolume = await contracts.nft.getTotalVolume();
      const dailyVolume = await contracts.nft.getDailyVolume();
      const totalNFTs = await contracts.nft.getTotalSupply();
      const listedNFTs = await contracts.nft.getListedNFTCount();
      const volumeChange = await contracts.nft.getVolumeChange();
      
      setMarketStats({
        totalVolume: ethers.utils.formatEther(totalVolume),
        dailyVolume: ethers.utils.formatEther(dailyVolume),
        totalNFTs: totalNFTs.toNumber(),
        listedNFTs: listedNFTs.toNumber(),
        volumeChange: volumeChange.toNumber()
      });
    } catch (error) {
      console.error('Failed to fetch market stats:', error);
    } finally {
      setLoading(false);
    }
  }, [contracts.nft]);

  const filterAndSortNFTs = useCallback((nfts, { sortBy, filterType, searchTerm }) => {
    let filtered = [...nfts];

    // 应用搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(nft => 
        nft.tokenId.toString().includes(searchTerm)
      );
    }

    // 应用稀有度过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(nft => 
        NFT_RARITY[nft.attributes.rarity] === filterType
      );
    }

    // 应用排序
    switch (sortBy) {
      case 'price-asc':
        filtered.sort((a, b) => (a.price || 0) - (b.price || 0));
        break;
      case 'price-desc':
        filtered.sort((a, b) => (b.price || 0) - (a.price || 0));
        break;
      case 'power-asc':
        filtered.sort((a, b) => a.attributes.power - b.attributes.power);
        break;
      case 'power-desc':
        filtered.sort((a, b) => b.attributes.power - a.attributes.power);
        break;
      default:
        filtered.sort((a, b) => b.tokenId - a.tokenId);
    }

    return filtered;
  }, []);

  useEffect(() => {
    fetchMarketStats();
  }, [fetchMarketStats]);

  return {
    marketStats,
    loading,
    filterAndSortNFTs,
    refreshStats: fetchMarketStats
  };
};

export default useNFTMarket;
