import { ethers } from 'ethers';
import { useState, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { message } from 'antd';
import { getContracts, NFT_SETTINGS, MARKETPLACE_CONTRACT } from '../../../constants/contracts';
import useLoadingError from './useLoadingError';
import useNFTCache from './useNFTCache';
import { getNFTMetadata } from '../../../utils/ipfs';

const useNFTMarket = () => {
  const { active, library, account } = useWeb3React();
  const { loadingState, withLoading } = useLoadingError({
    market: { isLoading: false, error: null },
    listing: { isLoading: false, error: null },
    buying: { isLoading: false, error: null }
  });
  const { cache, updateCache, getCache } = useNFTCache();

  const [marketState, setMarketState] = useState({
    isLoading: false,
    selectedTab: 'market',
    filterType: 'all',
    searchTerm: '',
    marketItems: [],
    myNFTs: [],
    marketStats: {
      totalVolume: '0',
      dailyVolume: '0',
      floorPrice: '0',
      totalSupply: 0
    },
    tradeHistory: [],
    priceHistory: {},
    pagination: {
      currentPage: 1,
      pageSize: 12,
      total: 0
    },
    modals: {
      listing: { isOpen: false, nft: null },
      detail: { isOpen: false, nft: null }
    },
    stats: {
      totalVolume: '0',
      dailyVolume: '0',
      floorPrice: '0',
      marketFeeRate: '0',
      minPrice: '0'
    }
  });

  // 加载我的NFT
  const loadMyNFTs = useCallback(withLoading(async () => {
    if (!library || !account) return;
    
    try {
      const contracts = await getContracts(library.getSigner());
      
      // 获取用户拥有的NFT总数
      const balance = await contracts.nft.balanceOf(account);
      const totalNFTs = balance.toNumber();
      
      // 获取每个NFT的详细信息
      const nftPromises = [];
      for (let i = 0; i < totalNFTs; i++) {
        nftPromises.push((async () => {
          try {
            // 获取tokenId
            const tokenId = await contracts.nft.tokenOfOwnerByIndex(account, i);
            
            // 获取NFT属性、URI和质押状态
            const [attributes, tokenUri] = await Promise.all([
              contracts.nft.getNFTAttributes(tokenId),
              contracts.nft.tokenURI(tokenId)
            ]);
            
            // 获取市场信息
            const listing = await contracts.marketplace.listings(tokenId);
            
            // 获取元数据
            const metadata = await getNFTMetadata(tokenUri);
            const imageURI = metadata?.image || '/placeholder.png';
            
            return {
              id: tokenId.toString(),
              price: listing.isActive ? ethers.utils.formatEther(listing.price) : '0',
              seller: listing.seller,
              isActive: listing.isActive,
              rarity: attributes.rarity,
              power: attributes.power.toString(),
              dailyReward: attributes.dailyReward.toString(),
              maxReward: attributes.maxReward.toString(),
              minedAmount: attributes.minedAmount.toString(),
              isStaked: attributes.isStaked,
              stakeTime: attributes.stakeTime.toString(),
              imageURI
            };
          } catch (error) {
            console.error('Error loading NFT:', error);
            return null;
          }
        })());
      }
      
      const nfts = (await Promise.all(nftPromises)).filter(Boolean);
      console.log('Loaded NFTs:', nfts);
      
      setMarketState(prev => ({
        ...prev,
        myNFTs: nfts
      }));
    } catch (error) {
      console.error('Error loading my NFTs:', error);
      message.error('Failed to load NFTs');
    }
  }, 'myNFTs'), [library, account]);

  // 获取市场统计数据
  const fetchMarketStats = useCallback(async () => {
    try {
      const contracts = await getContracts(library);
      if (!contracts) return;

      // 分别获取各项市场数据
      const [totalVolume, dailyVolume, floorPrice, marketFeeRate, feeReceiver, minPrice] = await Promise.all([
        contracts.marketplace.totalVolume(),
        contracts.marketplace.dailyVolume(),
        contracts.marketplace.floorPrice(),
        contracts.marketplace.marketFeeRate(),
        contracts.marketplace.feeReceiver(),
        contracts.marketplace.minPrice()
      ]);

      setMarketState(prev => ({
        ...prev,
        stats: {
          totalVolume: ethers.utils.formatEther(totalVolume),
          dailyVolume: ethers.utils.formatEther(dailyVolume),
          floorPrice: ethers.utils.formatEther(floorPrice),
          marketFeeRate: marketFeeRate.toString(),
          minPrice: ethers.utils.formatEther(minPrice)
        }
      }));
    } catch (error) {
      console.error('Error fetching market stats:', error);
      message.error('Failed to load market statistics');
    }
  }, [library]);

  // 获取在售NFT列表
  const fetchMarketItems = useCallback(withLoading(async (page = 1, pageSize = 12) => {
    if (!library) return;
    
    try {
      const contracts = await getContracts(library.getSigner());
      const offset = (page - 1) * pageSize;
      
      // 获取在售NFT总数
      const totalCount = await contracts.marketplace.getActiveListingsCount();
      console.log('Total active listings:', totalCount.toString());
      
      // 获取当前页的在售NFT
      const { tokenIds, prices, sellers } = await contracts.marketplace.getActiveListings(offset, pageSize);
      console.log('Active listings:', { 
        tokenIds: tokenIds.map(id => id.toString()),
        prices: prices.map(p => ethers.utils.formatEther(p)),
        sellers 
      });
      
      // 获取NFT详细信息
      const items = await Promise.all(
        tokenIds.map(async (tokenId, index) => {
          try {
            // 验证NFT是否真的在售
            const listing = await contracts.marketplace.listings(tokenId);
            if (!listing.isActive) {
              console.log(`NFT ${tokenId.toString()} is not active`);
              return null;
            }
            
            // 获取NFT属性和URI
            const [attributes, tokenUri] = await Promise.all([
              contracts.nft.getNFTAttributes(tokenId),
              contracts.nft.tokenURI(tokenId)
            ]);
            
            console.log(`NFT ${tokenId.toString()} attributes:`, attributes);
            console.log(`NFT ${tokenId.toString()} URI:`, tokenUri);
            
            // 获取元数据
            const metadata = await getNFTMetadata(tokenUri);
            console.log(`NFT ${tokenId.toString()} metadata:`, metadata);
            
            const imageURI = metadata?.image || '/placeholder.png';

            return {
              id: tokenId.toString(),
              price: ethers.utils.formatEther(prices[index] || '0'),
              seller: sellers[index],
              isActive: true,
              rarity: attributes.rarity,
              power: attributes.power.toString(),
              dailyReward: attributes.dailyReward.toString(),
              maxReward: attributes.maxReward.toString(),
              minedAmount: attributes.minedAmount.toString(),
              isStaked: attributes.isStaked,
              stakeTime: attributes.stakeTime.toString(),
              imageURI
            };
          } catch (error) {
            console.error('Error loading NFT details:', tokenId.toString(), error);
            return null;
          }
        })
      );

      const validItems = items.filter(Boolean);
      console.log('Processed market items:', validItems);

      setMarketState(prev => ({
        ...prev,
        marketItems: validItems,
        pagination: {
          ...prev.pagination,
          currentPage: page,
          total: totalCount.toNumber()
        }
      }));
    } catch (error) {
      console.error('Error loading market data:', error);
      message.error('Failed to load market data');
    }
  }, 'market'), [library]);

  // 上架NFT
  const listNFT = useCallback(async (tokenId, price) => {
    if (!library || !account) return;
    
    try {
      const contracts = await getContracts(library.getSigner());
      
      // 检查是否已授权
      const isApproved = await contracts.nft.isApprovedForAll(account, contracts.marketplace.address);
      if (!isApproved) {
        const approveTx = await contracts.nft.setApprovalForAll(contracts.marketplace.address, true);
        await approveTx.wait();
      }
      
      const priceInWei = ethers.utils.parseEther(price.toString());
      const tx = await contracts.marketplace.listNFT(tokenId, priceInWei);
      await tx.wait();
      
      message.success('NFT上架成功');
      fetchMarketItems();
      loadMyNFTs();
    } catch (error) {
      console.error('Error listing NFT:', error);
      message.error('Failed to list NFT');
    }
  }, [library, account, fetchMarketItems, loadMyNFTs]);

  // 下架NFT
  const unlistNFT = useCallback(async (tokenId) => {
    if (!library || !account) return;
    
    const contracts = await getContracts(library.getSigner());
    const tx = await contracts.marketplace.unlistNFT(tokenId);
    await tx.wait();
    
    message.success('NFT下架成功');
    fetchMarketItems();
  }, [library, account, fetchMarketItems]);

  // 购买NFT
  const buyNFT = useCallback(async (tokenId, price) => {
    if (!library || !account) return;
    
    const contracts = await getContracts(library.getSigner());
    const tx = await contracts.marketplace.buyNFT(tokenId, {
      value: price
    });
    await tx.wait();
    
    message.success('NFT购买成功');
    fetchMarketItems();
  }, [library, account, fetchMarketItems]);

  // 加载价格历史
  const loadPriceHistory = useCallback(async (tokenId) => {
    if (!active || !library) return;

    const cachedHistory = getCache(`price_history_${tokenId}`);
    if (cachedHistory) {
      setMarketState(prev => ({
        ...prev,
        priceHistory: {
          ...prev.priceHistory,
          [tokenId]: cachedHistory
        }
      }));
      return;
    }

    const contracts = getContracts();
    if (!contracts) return;

    const filter = contracts.marketplace.filters.NFTSold(tokenId);
    const events = await contracts.marketplace.queryFilter(filter, -10000);

    const history = await Promise.all(events.map(async (event) => {
      const { price } = event.args;
      const block = await event.getBlock();
      
      return {
        price: price.toString(),
        timestamp: block.timestamp
      };
    }));

    updateCache(`price_history_${tokenId}`, history);
    setMarketState(prev => ({
      ...prev,
      priceHistory: {
        ...prev.priceHistory,
        [tokenId]: history
      }
    }));
  }, [active, library, getCache, updateCache]);

  // 加载交易历史
  const loadTradeHistory = useCallback(async () => {
    if (!active || !library) return;

    try {
      const contracts = getContracts();
      if (!contracts) return;

      const filter = contracts.marketplace.filters.NFTSold();
      const events = await contracts.marketplace.queryFilter(filter, -10000); // 获取最近的交易记录

      const history = await Promise.all(events.map(async (event) => {
        const { tokenId, seller, buyer, price } = event.args;
        const block = await event.getBlock();
        
        return {
          id: `${event.transactionHash}-${event.logIndex}`,
          tokenId: tokenId.toString(),
          seller,
          buyer,
          price: price.toString(),
          timestamp: block.timestamp,
        };
      }));

      setMarketState(prev => ({
        ...prev,
        tradeHistory: history.reverse()
      }));
    } catch (error) {
      console.error('Error loading trade history:', error);
    }
  }, [active, library]);

  // 加载市场统计数据
  const loadMarketStats = useCallback(async () => {
    if (!active || !library) return;

    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      // 获取市场统计数据
      const [totalVolume, dailyVolume, floorPrice, marketFeeRate, minPrice] = await Promise.all([
        contracts.marketplace.totalVolume(),
        contracts.marketplace.dailyVolume(),
        contracts.marketplace.floorPrice(),
        contracts.marketplace.marketFeeRate(),
        contracts.marketplace.minPrice()
      ]);

      console.log('Market stats:', {
        totalVolume: totalVolume.toString(),
        dailyVolume: dailyVolume.toString(),
        floorPrice: floorPrice.toString(),
        marketFeeRate: marketFeeRate.toString(),
        minPrice: minPrice.toString()
      });

      setMarketState(prev => ({
        ...prev,
        stats: {
          totalVolume: totalVolume.toString(),
          dailyVolume: dailyVolume.toString(),
          floorPrice: floorPrice.toString(),
          marketFeeRate: marketFeeRate.toString(),
          minPrice: minPrice.toString()
        }
      }));
    } catch (error) {
      console.error('Error loading market stats:', error);
    }
  }, [active, library]);

  // 监听连接状态，加载市场统计数据
  useEffect(() => {
    if (active) {
      fetchMarketStats();
    }
  }, [active, fetchMarketStats]);

  // 处理购买
  const handleBuy = async (nft) => {
    try {
      const contracts = getContracts();
      const tx = await contracts.marketplace.buyNFT(nft.id, { 
        value: nft.price,
        gasLimit: 500000 
      });
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFT purchased successfully');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('Buy error:', error);
      message.error(error.message || 'Failed to buy NFT');
    }
  };

  // 处理上架
  const handleList = async (nft, price) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      const priceInWei = ethers.utils.parseEther(price.toString());
      
      // 检查授权
      const approved = await contracts.nft.getApproved(nft.id);
      if (approved !== MARKETPLACE_CONTRACT) {
        const approveTx = await contracts.nft.approve(MARKETPLACE_CONTRACT, nft.id);
        message.info('Approving NFT...');
        await approveTx.wait();
      }

      const tx = await contracts.marketplace.listNFT(nft.id, priceInWei, {
        gasLimit: 500000
      });
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFT listed successfully');
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('List error:', error);
      message.error(error.message || 'Failed to list NFT');
    }
  };

  // 处理下架
  const handleDelist = async (nft) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      const tx = await contracts.marketplace.unlistNFT(nft.id, {
        gasLimit: 500000
      });
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFT delisted successfully');
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('Delist error:', error);
      message.error(error.message || 'Failed to delist NFT');
    }
  };

  // 批量上架
  const handleBatchList = async (nfts, prices) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      // 批量授权
      const isApproved = await contracts.nft.isApprovedForAll(account, MARKETPLACE_CONTRACT);
      if (!isApproved) {
        const approveTx = await contracts.nft.setApprovalForAll(MARKETPLACE_CONTRACT, true);
        message.info('Approving NFTs...');
        await approveTx.wait();
      }

      // 转换价格为Wei
      const pricesInWei = prices.map(price => ethers.utils.parseEther(price.toString()));

      // 批量上架
      const tx = await contracts.marketplace.batchListNFTs(
        nfts.map(nft => nft.id),
        pricesInWei,
        { gasLimit: 1000000 }
      );
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFTs listed successfully');
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('Batch list error:', error);
      message.error(error.message || 'Failed to list NFTs');
    }
  };

  // 批量下架
  const handleBatchUnlist = async (nfts) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      const tx = await contracts.marketplace.batchUnlistNFTs(
        nfts.map(nft => nft.id),
        { gasLimit: 1000000 }
      );
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFTs unlisted successfully');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('Batch unlist error:', error);
      message.error(error.message || 'Failed to unlist NFTs');
    }
  };

  // 下架单个NFT
  const handleUnlist = async (nft) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      const tx = await contracts.marketplace.unlistNFT(nft.id, {
        gasLimit: 500000
      });
      message.info('Transaction submitted...');
      await tx.wait();
      message.success('NFT unlisted successfully');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('Unlist error:', error);
      message.error(error.message || 'Failed to unlist NFT');
    }
  };

  // 验证价格
  const validatePrice = useCallback(async (price) => {
    if (!active || !library) return false;

    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return false;

      const minPrice = await contracts.marketplace.minPrice();
      const priceInWei = ethers.utils.parseEther(price.toString());
      
      return priceInWei.gte(minPrice);
    } catch (error) {
      console.error('Price validation error:', error);
      return false;
    }
  }, [active, library]);

  // 设置选中的标签页
  const setSelectedTab = (tab) => {
    setMarketState(prev => ({ ...prev, selectedTab: tab }));
    fetchMarketItems(1);
  };

  // 设置筛选类型
  const setFilterType = (type) => {
    setMarketState(prev => ({ ...prev, filterType: type }));
    fetchMarketItems(1);
  };

  // 设置搜索词
  const setSearchTerm = (term) => {
    setMarketState(prev => ({ ...prev, searchTerm: term }));
    fetchMarketItems(1);
  };

  // 设置模态框状态
  const setModal = (modalType, isOpen, nft = null) => {
    setMarketState(prev => ({
      ...prev,
      modals: {
        ...prev.modals,
        [modalType]: { isOpen, nft }
      }
    }));
  };

  // 监听账户变化，重新加载NFT
  useEffect(() => {
    if (active && account) {
      loadMyNFTs();
    }
  }, [active, account, loadMyNFTs]);

  // 初始加载
  useEffect(() => {
    if (active) {
      fetchMarketItems(1);
      fetchMarketStats();
      loadTradeHistory();
      loadMyNFTs(); // 添加加载我的NFT
    }
  }, [active, fetchMarketItems, fetchMarketStats, loadTradeHistory, loadMyNFTs]);

  // 处理分页变化
  const handlePageChange = (page) => {
    fetchMarketItems(page);
  };

  // 初始化市场数据
  useEffect(() => {
    if (library) {
      fetchMarketStats();
    }
  }, [library, fetchMarketStats]);

  // 每60秒更新一次市场数据
  useEffect(() => {
    if (library) {
      const interval = setInterval(fetchMarketStats, 60000);
      return () => clearInterval(interval);
    }
  }, [library, fetchMarketStats]);

  return {
    marketState,
    loadingState,
    fetchMarketItems,
    handlePageChange,
    loadMyNFTs,
    loadPriceHistory,
    loadTradeHistory,
    handleBuy,
    handleList,
    handleUnlist,
    handleBatchList,
    handleBatchUnlist,
    setSelectedTab,
    setFilterType,
    setSearchTerm,
    setModal,
    validatePrice,
    listNFT,
    unlistNFT,
    buyNFT
  };
};

export { useNFTMarket };
