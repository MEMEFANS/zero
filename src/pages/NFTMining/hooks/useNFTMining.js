import { useState, useEffect, useCallback } from 'react';
import { toast } from 'react-toastify';
import { NFT_MINING_ADDRESS, NFT_MINING_ABI, ZONE_NFT_ADDRESS, ZONE_NFT_ABI, MARKETPLACE_CONTRACT, NFT_MARKETPLACE_ABI, NFT_RARITY } from '../../../constants/contracts';
import { getContract } from '../../../utils/web3';

const useNFTMining = (account, provider) => {
  const [stats, setStats] = useState({
    totalPower: 0,
    directPower: 0,
    teamPower: 0,
    level: 0,
    nfts: [],
    stakedNfts: [],
    lastClaimTime: 0,
    claimableReward: 0,
    teamBonus: 0,
    totalStakedPower: 0,
    totalMiners: 0,
    todayOutput: 0,
    totalOutput: 0,
    levelConfigs: []
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // 添加延迟函数
  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  // 添加重试函数
  const retryOperation = async (operation, maxRetries = 3, initialDelay = 1000) => {
    let lastError;
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error;
        if (error.message.includes('rate limit') || error.code === 429) {
          // 如果是速率限制错误，增加等待时间
          const waitTime = initialDelay * Math.pow(2, i);
          await delay(waitTime);
          continue;
        }
        throw error;
      }
    }
    throw lastError;
  };

  // 加载挖矿统计数据
  const loadMiningStats = useCallback(async () => {
    if (!account || !provider) {
      setLoading(false);
      return;
    }

    try {
      const contract = getContract(NFT_MINING_ADDRESS, NFT_MINING_ABI, provider);
      const nftContract = getContract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, provider);
      
      // 使用重试机制获取用户质押信息
      const userInfo = await retryOperation(() => contract.getUserStakeInfo(account));
      
      // 使用重试机制获取可领取的收益
      const [reward, teamBonus] = await retryOperation(() => contract.getClaimableReward(account));

      // 使用重试机制获取全局统计数据
      const [totalStakedPower, totalMiners, todayOutput, totalOutput, maxLevel] = await retryOperation(() => Promise.all([
        contract.totalStakedPower(),
        contract.totalMiners(),
        contract.todayOutput(),
        contract.totalOutput(),
        contract.currentMaxLevel()
      ]));

      // 获取所有等级配置
      const levelConfigs = [];
      for (let i = 1; i <= Number(maxLevel); i++) {
        const config = await retryOperation(() => contract.levelConfigs(i));
        levelConfigs.push({
          level: i,
          minPower: Number(config.minPower),
          maxPower: Number(config.maxPower),
          bonusRate: Number(config.bonusRate),
          teamRequired: Number(config.teamRequired),
          teamBonusRate: Number(config.teamBonusRate)
        });
      }

      // 使用重试机制获取用户的 NFT 列表
      const nftCount = await retryOperation(() => nftContract.balanceOf(account));
      const nfts = [];
      
      // 获取市场合约
      const marketContract = getContract(MARKETPLACE_CONTRACT, NFT_MARKETPLACE_ABI, provider);
      
      // 分批获取 NFT 数据，避免一次性请求过多
      const batchSize = 5;
      for (let i = 0; i < nftCount; i += batchSize) {
        const batch = [];
        for (let j = 0; j < batchSize && i + j < nftCount; j++) {
          batch.push(
            retryOperation(async () => {
              const tokenId = await nftContract.tokenOfOwnerByIndex(account, i + j);
              const nftAttributes = await nftContract.getNFTAttributes(tokenId);
              const imageURI = await nftContract.getNFTImageURI(tokenId);
              
              // 检查 NFT 是否在市场上架
              const listing = await marketContract.listings(tokenId);
              const isListed = listing.isActive;
              
              // 处理 IPFS URL
              const processedImageURI = imageURI.startsWith('ipfs://')
                ? `https://ipfs.io/ipfs/${imageURI.replace('ipfs://', '')}`
                : imageURI;

              return {
                tokenId: Number(tokenId),
                power: Number(nftAttributes.power),
                level: 0, // 暂时设为0，因为合约中没有这个属性
                rarity: NFT_RARITY[Number(nftAttributes.rarity)] || 'N',
                isStaked: nftAttributes.isStaked,
                isListed, // 添加是否上架的状态
                dailyReward: Number(nftAttributes.dailyReward),
                maxReward: Number(nftAttributes.maxReward),
                minedAmount: Number(nftAttributes.minedAmount),
                stakeTime: Number(nftAttributes.stakeTime),
                imageURI: processedImageURI
              };
            })
          );
        }
        
        // 等待当前批次完成
        const batchResults = await Promise.all(batch);
        nfts.push(...batchResults);
        
        // 在批次之间添加延迟
        if (i + batchSize < nftCount) {
          await delay(1000);
        }
      }

      setStats(prev => ({
        ...prev,
        totalPower: Number(userInfo.totalPower),
        directPower: Number(userInfo.directPower),
        teamPower: Number(userInfo.teamPower),
        level: Number(userInfo.level),
        nfts,
        lastClaimTime: Number(userInfo.lastClaimTime),
        stakedNfts: userInfo.tokenIds.map(Number),
        claimableReward: Number(reward) / 1e20,
        teamBonus: Number(teamBonus) / 1e20,
        totalStakedPower: Number(totalStakedPower),
        totalMiners: Number(totalMiners),
        todayOutput: Number(todayOutput),
        totalOutput: Number(totalOutput),
        levelConfigs
      }));
      
      setError(null);
    } catch (err) {
      console.error('Error loading mining stats:', err);
      setError(err.message);
      toast.error('加载挖矿数据失败');
    } finally {
      setLoading(false);
    }
  }, [account, provider]);

  // 自动刷新数据，但间隔时间更长一些
  useEffect(() => {
    loadMiningStats();
    const interval = setInterval(loadMiningStats, 60000); // 改为每60秒刷新一次
    return () => clearInterval(interval);
  }, [loadMiningStats]);

  // 质押 NFT
  const stakeNFT = async (tokenId) => {
    if (!account || !provider) return;
    
    try {
      const contract = getContract(NFT_MINING_ADDRESS, NFT_MINING_ABI, provider.getSigner());
      const tx = await contract.stakeNFT(tokenId);
      await tx.wait();
      toast.success('质押成功');
      await loadMiningStats();
    } catch (err) {
      console.error('Error staking NFT:', err);
      toast.error('质押失败');
      throw err;
    }
  };

  // 解除质押
  const unstakeNFT = async (tokenId) => {
    if (!account || !provider) return;
    
    try {
      const contract = getContract(NFT_MINING_ADDRESS, NFT_MINING_ABI, provider.getSigner());
      const tx = await contract.unstakeNFT(tokenId);
      await tx.wait();
      toast.success('解除质押成功');
      await loadMiningStats();
    } catch (err) {
      console.error('Error unstaking NFT:', err);
      toast.error('解除质押失败');
      throw err;
    }
  };

  // 领取收益
  const claimReward = async () => {
    if (!account || !provider) return;
    
    try {
      const contract = getContract(NFT_MINING_ADDRESS, NFT_MINING_ABI, provider.getSigner());
      const tx = await contract.claimReward();
      await tx.wait();
      toast.success('领取成功');
      await loadMiningStats();
    } catch (err) {
      console.error('Error claiming rewards:', err);
      toast.error('领取失败');
      throw err;
    }
  };

  return {
    stats,
    loading,
    error,
    stakeNFT,
    unstakeNFT,
    claimReward,
    loadMiningStats
  };
};

export default useNFTMining;
