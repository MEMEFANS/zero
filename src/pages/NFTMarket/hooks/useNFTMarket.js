import { ethers } from 'ethers';
import { useState, useCallback, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
// import { message } from 'antd'; 
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
            
            // 检查NFT是否真的属于当前用户
            const currentOwner = await contracts.nft.ownerOf(tokenId);
            if (currentOwner.toLowerCase() !== account.toLowerCase()) {
              console.log(`NFT ${tokenId.toString()} 不再属于当前用户`);
              return null;
            }
            
            // 检查NFT是否在市场上出售
            const isListed = listing.isActive && listing.seller.toLowerCase() === account.toLowerCase();
            
            return {
              id: tokenId.toString(),
              price: isListed ? ethers.utils.formatEther(listing.price) : '0',
              seller: listing.seller,
              isActive: listing.isActive,
              rarity: Number(attributes.rarity),
              power: ethers.BigNumber.from(attributes.power).toString(),
              dailyReward: ethers.BigNumber.from(attributes.dailyReward).toString(),
              maxReward: ethers.BigNumber.from(attributes.maxReward).toString(),
              minedAmount: ethers.BigNumber.from(attributes.minedAmount).toString(),
              isStaked: attributes.isStaked,
              stakeTime: ethers.BigNumber.from(attributes.stakeTime).toString(),
              imageURI,
              isListed: isListed
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
    }
  }, 'myNFTs'), [library, account]);

  // 获取市场统计数据
  const fetchMarketStats = useCallback(async () => {
    try {
      const contracts = await getContracts(library);
      if (!contracts) return;
  
      // 分别获取各项市场数据
      const [totalVolume, dailyVolume, floorPrice, marketFeeRate, feeReceiver, minPrice, totalSupply, activeListingsCount] = await Promise.all([
        contracts.marketplace.totalVolume(),
        contracts.marketplace.dailyVolume(),
        contracts.marketplace.floorPrice(),
        contracts.marketplace.marketFeeRate(),
        contracts.marketplace.feeReceiver(),
        contracts.marketplace.minPrice(),
        contracts.nft.totalSupply(),
        contracts.marketplace.getActiveListingsCount()
      ]);
  
      setMarketState(prev => ({
        ...prev,
        stats: {
          totalVolume: ethers.utils.formatEther(totalVolume),
          dailyVolume: ethers.utils.formatEther(dailyVolume),
          floorPrice: ethers.utils.formatEther(floorPrice),
          marketFeeRate: marketFeeRate.toString(),
          minPrice: ethers.utils.formatEther(minPrice),
          totalSupply: totalSupply.toString(),
          activeListings: activeListingsCount.toString()
        }
      }));
    } catch (error) {
      console.error('Error fetching market stats:', error);
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
              rarity: Number(attributes.rarity),
              power: ethers.BigNumber.from(attributes.power).toString(),
              dailyReward: ethers.BigNumber.from(attributes.dailyReward).toString(),
              maxReward: ethers.BigNumber.from(attributes.maxReward).toString(),
              minedAmount: ethers.BigNumber.from(attributes.minedAmount).toString(),
              isStaked: attributes.isStaked,
              stakeTime: ethers.BigNumber.from(attributes.stakeTime).toString(),
              imageURI,
              isListed: true
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
      
      console.log('NFT上架成功');
      fetchMarketItems();
      loadMyNFTs();
    } catch (error) {
      console.error('Error listing NFT:', error);
    }
  }, [library, account, fetchMarketItems, loadMyNFTs]);

  // 下架NFT
  const unlistNFT = useCallback(async (tokenId) => {
    if (!library || !account) return;
    
    const contracts = await getContracts(library.getSigner());
    const tx = await contracts.marketplace.unlistNFT(tokenId);
    await tx.wait();
    
    console.log('NFT下架成功');
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
    
    console.log('NFT购买成功');
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
      const [totalVolume, dailyVolume, floorPrice, marketFeeRate, minPrice, totalSupply, activeListingsCount] = await Promise.all([
        contracts.marketplace.totalVolume(),
        contracts.marketplace.dailyVolume(),
        contracts.marketplace.floorPrice(),
        contracts.marketplace.marketFeeRate(),
        contracts.marketplace.minPrice(),
        contracts.nft.totalSupply(),
        contracts.marketplace.getActiveListingsCount()
      ]);

      console.log('Market stats:', {
        totalVolume: totalVolume.toString(),
        dailyVolume: dailyVolume.toString(),
        floorPrice: floorPrice.toString(),
        marketFeeRate: marketFeeRate.toString(),
        minPrice: minPrice.toString(),
        totalSupply: totalSupply.toString(),
        activeListings: activeListingsCount.toString()
      });

      setMarketState(prev => ({
        ...prev,
        stats: {
          totalVolume: ethers.utils.formatEther(totalVolume),
          dailyVolume: ethers.utils.formatEther(dailyVolume),
          floorPrice: ethers.utils.formatEther(floorPrice),
          marketFeeRate: marketFeeRate.toString(),
          minPrice: ethers.utils.formatEther(minPrice),
          totalSupply: totalSupply.toString(),
          activeListings: activeListingsCount.toString()
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
  const handleBuy = async (nftId, price) => {
    try {
      if (!nftId) {
        console.log('NFT ID无效');
        return;
      }

      const contracts = getContracts(library.getSigner());
      if (!contracts) {
        console.log('无法获取合约');
        return;
      }

      // 确保价格是有效的值
      let valueToSend;
      try {
        // 支持直接传入价格字符串、数字或BigNumber
        valueToSend = ethers.BigNumber.isBigNumber(price) 
          ? price 
          : ethers.utils.parseEther(price.toString());
      } catch (error) {
        console.error('价格转换错误:', error);
        console.log('价格格式无效');
        return;
      }

      console.log('正在购买NFT...');
      const tx = await contracts.marketplace.buyNFT(nftId, { 
        value: valueToSend,
        gasLimit: 500000 
      });
      console.log('交易已提交...');
      await tx.wait();
      console.log('NFT购买成功');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('购买错误:', error);
      console.log('购买失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理上架
  const handleList = async (nft, price) => {
    try {
      if (!nft) {
        console.log('NFT数据无效');
        return;
      }

      const contracts = getContracts(library.getSigner());
      if (!contracts) {
        console.log('无法获取合约');
        return;
      }

      // 确保价格是有效的数字并转换为Wei
      let priceInWei;
      try {
        priceInWei = ethers.utils.parseEther(price.toString());
      } catch (error) {
        console.error('价格转换错误:', error);
        console.log('价格格式无效');
        return;
      }
      
      // 获取NFT ID (支持直接传入ID或完整NFT对象)
      const tokenId = typeof nft === 'object' ? nft.id : nft;
      
      // 检查授权
      try {
        const approved = await contracts.nft.getApproved(tokenId);
        if (approved !== MARKETPLACE_CONTRACT) {
          console.log('正在授权NFT...');
          const approveTx = await contracts.nft.approve(MARKETPLACE_CONTRACT, tokenId);
          await approveTx.wait();
          console.log('NFT授权成功');
        }
      } catch (error) {
        console.error('授权检查失败:', error);
        console.log('NFT授权失败: ' + (error.message || '未知错误'));
        return;
      }

      // 执行上架
      console.log('正在上架NFT...');
      const tx = await contracts.marketplace.listNFT(tokenId, priceInWei, {
        gasLimit: 500000
      });
      console.log('交易已提交...');
      await tx.wait();
      console.log('NFT上架成功');
      
      // 刷新数据
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('上架错误:', error);
      console.log('上架失败: ' + (error.message || '未知错误'));
    }
  };

  // 处理下架
  const handleUnlist = async (nftId) => {
    try {
      if (!nftId) {
        console.log('NFT ID无效');
        return;
      }

      const contracts = getContracts(library.getSigner());
      if (!contracts) {
        console.log('无法获取合约');
        return;
      }

      console.log('正在下架NFT...');
      const tx = await contracts.marketplace.unlistNFT(nftId, {
        gasLimit: 500000
      });
      console.log('交易已提交...');
      await tx.wait();
      console.log('NFT下架成功');
      
      // 刷新数据
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('下架错误:', error);
      console.log('下架失败: ' + (error.message || '未知错误'));
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
        console.log('Approving NFTs...');
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
      console.log('Transaction submitted...');
      await tx.wait();
      console.log('NFTs listed successfully');
      fetchMarketItems(marketState.pagination.currentPage);
      loadMyNFTs();
    } catch (error) {
      console.error('Batch list error:', error);
      console.log(error.message || 'Failed to list NFTs');
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
      console.log('Transaction submitted...');
      await tx.wait();
      console.log('NFTs unlisted successfully');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('Batch unlist error:', error);
      console.log(error.message || 'Failed to unlist NFTs');
    }
  };

  // 下架单个NFT
  const handleUnlistNFT = async (nft) => {
    try {
      const contracts = getContracts(library.getSigner());
      if (!contracts) return;

      const tx = await contracts.marketplace.unlistNFT(nft.id, {
        gasLimit: 500000
      });
      console.log('Transaction submitted...');
      await tx.wait();
      console.log('NFT unlisted successfully');
      fetchMarketItems(marketState.pagination.currentPage);
    } catch (error) {
      console.error('Unlist error:', error);
      console.log(error.message || 'Failed to unlist NFT');
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
    handleUnlistNFT,
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
