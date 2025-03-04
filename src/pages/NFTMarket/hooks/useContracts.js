import { useMemo } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { toast } from 'react-toastify';
import {
  ZONE_NFT_ADDRESS,
  ZONE_NFT_ABI,
  NFT_MARKETPLACE_ADDRESS,
  NFT_MARKETPLACE_ABI,
  NFT_MINING_ADDRESS,
  STAKING_ABI
} from '../../../constants/contracts';
import { getProvider } from '../../../config/web3Config';

// 缓存数据
let cachedData = null;

// 获取缓存数据
const getCachedData = () => cachedData;

// 设置缓存数据
const setCachedData = (data) => {
  cachedData = data;
};

export function useContracts() {
  const { library, account } = useWeb3React();

  // 创建合约实例
  const contracts = useMemo(() => {
    try {
      // 如果没有连接钱包，使用只读提供者
      const provider = library || getProvider();
      const contractProvider = library ? library.getSigner() : provider;

      return {
        nftContract: new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, contractProvider),
        marketContract: new ethers.Contract(NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, contractProvider),
        stakingContract: new ethers.Contract(NFT_MINING_ADDRESS, STAKING_ABI, contractProvider)
      };
    } catch (error) {
      console.error('Error creating contracts:', error);
      return null;
    }
  }, [library]);

  return useMemo(() => {
    if (!contracts) return null;

    // 添加延迟函数
    const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    // 添加重试函数
    const retryOperation = async (operation, retries = 3, delayMs = 2000) => {
      let lastError;
      for (let i = 0; i < retries; i++) {
        try {
          return await operation();
        } catch (error) {
          if (error.message.includes('API rate limit exceeded')) {
            console.log(`Rate limit hit, waiting longer...`);
            await delay(5000); // 遇到速率限制时等待更长时间
            continue;
          }
          console.log(`Attempt ${i + 1} failed, retrying in ${delayMs}ms...`);
          lastError = error;
          await delay(delayMs);
        }
      }
      throw lastError;
    };

    const loadMarketItems = async (page = 1, pageSize = 20) => {
      try {
        console.log('Loading market items...');
        
        // 尝试从缓存获取数据
        const cachedItems = getCachedData();
        let displayItems = cachedItems || [];
        
        // 如果是第一页，立即返回缓存的数据（如果有的话）
        if (page === 1 && cachedItems) {
          return {
            items: cachedItems.slice(0, pageSize),
            total: cachedItems.length,
            loading: false
          };
        }

        // 获取总供应量
        const totalSupply = await contracts.nftContract.totalSupply();
        console.log('Total supply:', totalSupply.toString());

        // 计算本页需要加载的范围
        const startIndex = Math.max(1, (page - 1) * pageSize);
        const endIndex = Math.min(totalSupply, page * pageSize);
        
        // 优先加载当前页面需要的数据
        const currentPageBatch = [];
        for (let i = startIndex; i <= endIndex; i++) {
          currentPageBatch.push(
            (async () => {
              try {
                const marketInfo = await contracts.marketContract.getNFTMarketInfo(i);
                if (marketInfo && marketInfo.isActive) {
                  const [attributes, imageURI] = await Promise.all([
                    contracts.nftContract.getNFTAttributes(i),
                    contracts.nftContract.getNFTImageURI(i)
                  ]);
                  
                  return {
                    id: i.toString(),
                    tokenId: i.toString(),
                    seller: marketInfo.seller,
                    price: ethers.utils.formatEther(marketInfo.price),
                    rarity: attributes[0],
                    power: attributes[1]?.toString() || '0',
                    dailyReward: attributes[2] ? ethers.utils.formatEther(attributes[2]) : '0',
                    maxReward: attributes[3] ? ethers.utils.formatEther(attributes[3]) : '0',
                    minedAmount: attributes[4] ? ethers.utils.formatEther(attributes[4]) : '0',
                    image: imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                    listed: true
                  };
                }
                return null;
              } catch (error) {
                console.error(`Error loading NFT ${i}:`, error);
                return null;
              }
            })()
          );
        }

        // 等待当前页的数据加载完成
        const currentPageResults = await Promise.all(currentPageBatch);
        const currentPageItems = currentPageResults.filter(item => item !== null);
        
        // 更新显示的数据
        displayItems = [...displayItems, ...currentPageItems];
        
        // 在后台继续加载其他数据
        if (!cachedItems) {
          (async () => {
            const allItems = [...displayItems];
            const batchSize = 5;
            
            for (let i = 1; i <= totalSupply; i += batchSize) {
              if (i >= startIndex && i <= endIndex) continue; // 跳过已加载的部分
              
              const batch = [];
              for (let j = i; j < Math.min(i + batchSize, totalSupply + 1); j++) {
                batch.push(
                  (async () => {
                    try {
                      const marketInfo = await contracts.marketContract.getNFTMarketInfo(j);
                      if (marketInfo && marketInfo.isActive) {
                        const [attributes, imageURI] = await Promise.all([
                          contracts.nftContract.getNFTAttributes(j),
                          contracts.nftContract.getNFTImageURI(j)
                        ]);
                        
                        return {
                          id: j.toString(),
                          tokenId: j.toString(),
                          seller: marketInfo.seller,
                          price: ethers.utils.formatEther(marketInfo.price),
                          rarity: attributes[0],
                          power: attributes[1]?.toString() || '0',
                          dailyReward: attributes[2] ? ethers.utils.formatEther(attributes[2]) : '0',
                          maxReward: attributes[3] ? ethers.utils.formatEther(attributes[3]) : '0',
                          minedAmount: attributes[4] ? ethers.utils.formatEther(attributes[4]) : '0',
                          image: imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                          listed: true
                        };
                      }
                      return null;
                    } catch (error) {
                      console.error(`Error loading NFT ${j}:`, error);
                      return null;
                    }
                  })()
                );
              }
              
              const results = await Promise.all(batch);
              const validItems = results.filter(item => item !== null);
              allItems.push(...validItems);
              
              // 更新缓存
              setCachedData(allItems);
              
              await delay(3000);
            }
          })();
        }
        
        return {
          items: displayItems.slice((page - 1) * pageSize, page * pageSize),
          total: displayItems.length,
          loading: !cachedItems // 如果没有缓存，说明还在后台加载
        };
      } catch (error) {
        console.error('Error loading market items:', error);
        toast.error('加载市场列表失败');
        return { items: [], total: 0, loading: false };
      }
    };

    const loadMyNFTs = async (page = 1, pageSize = 10) => {
      try {
        console.log('Loading my NFTs...');
        const balance = await contracts.nftContract.balanceOf(account);
        console.log('NFT balance:', balance.toString());

        // 计算当前页的起始和结束索引
        const start = (page - 1) * pageSize;
        const end = Math.min(start + pageSize, balance);

        // 并行加载当前页的 NFT 数据
        const promises = [];
        for (let i = start; i < end; i++) {
          promises.push(
            (async () => {
              try {
                const tokenId = await contracts.nftContract.tokenOfOwnerByIndex(account, i);
                const [attributes, imageURI, marketInfo] = await Promise.all([
                  contracts.nftContract.getNFTAttributes(tokenId),
                  contracts.nftContract.getNFTImageURI(tokenId),
                  contracts.marketContract.getNFTMarketInfo(tokenId)
                ]);

                return {
                  id: tokenId.toString(),
                  tokenId: tokenId.toString(),
                  rarity: attributes[0],
                  power: attributes[1]?.toString() || '0',
                  dailyReward: attributes[2] ? ethers.utils.formatEther(attributes[2]) : '0',
                  maxReward: attributes[3] ? ethers.utils.formatEther(attributes[3]) : '0',
                  minedAmount: attributes[4] ? ethers.utils.formatEther(attributes[4]) : '0',
                  image: imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/'),
                  listed: marketInfo.isActive,
                  price: marketInfo.isActive ? ethers.utils.formatEther(marketInfo.price) : '0'
                };
              } catch (error) {
                console.error(`Error loading NFT at index ${i}:`, error);
                return null;
              }
            })()
          );
        }

        const results = await Promise.all(promises);
        const validItems = results.filter(item => item !== null);

        return {
          items: validItems,
          total: balance.toNumber()
        };
      } catch (error) {
        console.error('Error loading my NFTs:', error);
        toast.error('加载我的NFT失败');
        return { items: [], total: 0 };
      }
    };

    const loadMarketStats = async () => {
      try {
        // 获取 NFT 总数
        const totalSupply = await contracts.nftContract.totalSupply();
        console.log('NFT Total Supply:', totalSupply.toString());

        // 获取市场数据
        const [totalVol, dailyVol, floor] = await Promise.all([
          contracts.marketContract.totalVolume(),
          contracts.marketContract.dailyVolume(),
          contracts.marketContract.floorPrice()
        ]);
        console.log('Market stats:', {
          totalVol: totalVol.toString(),
          dailyVol: dailyVol.toString(),
          floor: floor.toString()
        });

        // 获取已上架列表
        const { items } = await loadMarketItems();

        return {
          totalVolume: ethers.utils.formatEther(totalVol || 0),
          dailyVolume: ethers.utils.formatEther(dailyVol || 0),
          floorPrice: ethers.utils.formatEther(floor || 0),
          listedCount: items.length.toString(),
          totalSupply: totalSupply.toString()
        };
      } catch (error) {
        console.error('Error loading market stats:', error);
        return {
          totalVolume: '0',
          dailyVolume: '0',
          floorPrice: '0',
          listedCount: '0',
          totalSupply: '0'
        };
      }
    };

    const buyNFT = async (tokenId) => {
      try {
        const marketContract = contracts.marketContract;
        const [isActive, price] = await marketContract.getNFTMarketInfo(tokenId);
        if (!isActive) throw new Error('NFT not listed');
        
        const tx = await marketContract.buyNFT(tokenId, {
          value: price,
          gasLimit: 300000
        });
        
        return tx.wait();
      } catch (error) {
        console.error('Error buying NFT:', error);
        toast.error('购买失败');
        return false;
      }
    };

    const listNFT = async (tokenId, price) => {
      try {
        const marketContract = contracts.marketContract;
        const nftContract = contracts.nftContract;
        const priceInWei = ethers.utils.parseEther(price.toString());
        
        // Check approval
        const isApproved = await nftContract.isApprovedForAll(account, NFT_MARKETPLACE_ADDRESS);
        if (!isApproved) {
          const approveTx = await nftContract.setApprovalForAll(NFT_MARKETPLACE_ADDRESS, true);
          await approveTx.wait();
        }
        
        const tx = await marketContract.listNFT(tokenId, priceInWei, {
          gasLimit: 300000
        });
        
        // 清除缓存
        setCachedData(null);
        
        return tx.wait();
      } catch (error) {
        console.error('Error listing NFT:', error);
        toast.error('上架失败');
        return false;
      }
    };

    const delistNFT = async (tokenId) => {
      try {
        const marketContract = contracts.marketContract;
        const tx = await marketContract.unlistNFT(tokenId, {
          gasLimit: 300000
        });
        
        // 清除缓存
        setCachedData(null);
        
        return tx.wait();
      } catch (error) {
        console.error('Error delisting NFT:', error);
        toast.error('下架失败');
        return false;
      }
    };

    const stakeNFT = async (tokenId) => {
      try {
        const stakingContract = contracts.stakingContract;
        // Check approval
        const isApproved = await contracts.nftContract.isApprovedForAll(account, NFT_MINING_ADDRESS);
        if (!isApproved) {
          const approveTx = await contracts.nftContract.setApprovalForAll(NFT_MINING_ADDRESS, true);
          await approveTx.wait();
        }
        
        const tx = await stakingContract.stake(tokenId);
        return tx.wait();
      } catch (error) {
        console.error('Error staking NFT:', error);
        toast.error('质押失败');
        return false;
      }
    };

    return {
      loadMarketItems,
      loadMyNFTs,
      loadMarketStats,
      buyNFT,
      listNFT,
      delistNFT,
      stakeNFT,
    };
  }, [contracts, account]);
}
