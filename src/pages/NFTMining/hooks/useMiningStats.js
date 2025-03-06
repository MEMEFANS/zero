import { useState, useEffect, useCallback } from 'react';
import { ethers } from 'ethers';
import { ZONE_NFT_ADDRESS, ZONE_NFT_ABI, NFT_MINING_ADDRESS, NFT_MINING_ABI, REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI } from '../../../constants/contracts';

// 格式化大数字，添加精度控制和单位显示
const formatBigNumber = (value, decimals = 18, displayDecimals = 4) => {
  try {
    const formatted = ethers.utils.formatUnits(value || '0', decimals);
    const number = parseFloat(formatted);
    
    // 如果数字非常小但不为0，保留更多小数位
    if (number > 0 && number < 0.0001) {
      return number.toExponential(2); // 使用科学计数法，如 1.23e-5
    }
    
    // 根据数字大小选择合适的显示方式
    if (number >= 1000000) {
      return (number / 1000000).toFixed(displayDecimals) + 'M';
    } else if (number >= 1000) {
      return (number / 1000).toFixed(displayDecimals) + 'K';
    } else if (number === 0) {
      return '0';
    } else {
      // 动态确定小数位数
      let decimalPlaces = displayDecimals;
      if (number < 1) {
        // 对于小于1的数，找到第一个非零数字后再多显示2位
        const numberStr = number.toString();
        const firstNonZeroIndex = numberStr.match(/[1-9]/);
        if (firstNonZeroIndex) {
          decimalPlaces = Math.min(firstNonZeroIndex.index + 2, 8); // 最多显示8位小数
        }
      }
      return number.toFixed(decimalPlaces);
    }
  } catch (error) {
    console.error('Error formatting big number:', error);
    return '0';
  }
};

// 格式化地址显示：0x....5678
const formatAddress = (address) => {
  if (!address) return null;
  const suffix = address.slice(-6);   // 最后6位
  return `0x....${suffix}`;
};

// 添加延迟函数
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 优化后的重试机制
const retryWithDelay = async (fn, retries = 3, delayMs = 1000) => {
  let lastError;
  for (let i = 0; i < retries; i++) {
    try {
      const result = await fn();
      return result;
    } catch (error) {
      lastError = error;
      console.log(`Attempt ${i + 1} failed:`, {
        message: error.message,
        code: error.code,
        data: error.data
      });
      
      // 如果是合约调用错误，直接抛出
      if (error.code === 'CALL_EXCEPTION') {
        throw error;
      }
      
      if (i === retries - 1) break;
      await delay(delayMs * (i + 1));
    }
  }
  throw lastError;
};

// 安全的合约调用
const safeContractCall = async (contract, method, ...args) => {
  try {
    // 首先检查方法是否存在
    if (typeof contract[method] !== 'function') {
      console.warn(`Method ${method} not found in contract, trying alternative names...`);
      
      // Try alternative method names
      const alternatives = {
        'getStakedNFTs': ['getUserStakedNFTs', 'stakedNFTs', 'getStakedTokens'],
        'minerCount': ['totalMiners', 'getTotalMiners'],
        'dailyOutput': ['getDailyOutput', 'todayOutput'],
        'totalOutput': ['getTotalOutput', 'cumulativeOutput'],
        'minerPower': ['getUserPower', 'getMinerPower'],
        'pendingRewards': ['getPendingRewards', 'claimableRewards'],
        'dailyRewards': ['getDailyRewards', 'rewardsPerDay'],
        'referralCount': ['getReferralCount', 'directReferrals']
      };

      const altMethods = alternatives[method] || [];
      for (const altMethod of altMethods) {
        if (typeof contract[altMethod] === 'function') {
          console.log(`Using alternative method: ${altMethod}`);
          const result = await contract[altMethod](...args);
          return result;
        }
      }
      
      throw new Error(`Method ${method} and alternatives not found in contract`);
    }
    
    const result = await contract[method](...args);
    return result;
  } catch (error) {
    console.warn(`Contract call failed for ${method}:`, {
      message: error.message,
      code: error.code,
      data: error.data
    });

    // 处理不同类型的错误
    if (error.code === 'CALL_EXCEPTION') {
      // 如果是 revert 错误
      if (error.message.includes('missing revert data') || error.message.includes('execution reverted')) {
        console.log(`${method} call reverted, returning default value`);
        // 根据方法名返回默认值
        if (method.toLowerCase().includes('count') || method.includes('Count')) {
          return ethers.BigNumber.from(0);
        } else if (method.toLowerCase().includes('rewards') || 
                  method.includes('output') || 
                  method.includes('power') ||
                  method.includes('amount')) {
          return ethers.BigNumber.from(0);
        } else if (method.toLowerCase().includes('nft') || method.includes('tokens')) {
          return [];
        } else if (method.toLowerCase().includes('is') || method.includes('has')) {
          return false;
        }
        // 其他情况返回 0
        return ethers.BigNumber.from(0);
      }
    } else if (error.code === 'NETWORK_ERROR') {
      // 网络错误，可以重试
      throw new Error('Network error, please try again');
    } else if (error.code === 'TIMEOUT') {
      // 超时错误，可以重试
      throw new Error('Request timeout, please try again');
    }
    
    // 其他错误直接抛出
    throw error;
  }
};

const useMiningStats = (account, library) => {
  const [stats, setStats] = useState({
    // NFT 状态
    hasNFT: false,          // 是否持有 NFT
    totalPower: 0,          // 总算力
    nftLevel: 1,            // 挖矿等级
    directIncrease: 5,      // 直推加成

    // 收益统计
    currentReward: '0',     // 当前收益
    dailyOutput: '0',       // 日收益
    totalOutput: '0',       // 总收益上限
    yearReturn: '0',        // 预计年化

    // 直推状态
    directCount: 0,         // 直推人数
    directIncome: '0',      // 直推收益
    teamIncome: '0',        // 团队收益
    currentLevel: 1,        // 当前等级
    directStatus: 5,        // 直推加成

    // 矿工数量
    minerCount: 0,

    // 产出统计
    todayOutput: '0',       // 今日产出
    totalOutputAll: '0',    // 累计产出

    // 推荐关系
    referrer: null,         // 推荐人地址
    stakedNFTs: [],         // 质押的NFT

    // 新增邀请相关数据
    inviteCode: '',         // 邀请码
    totalReferrals: 0,      // 总邀请人数
    teamCount: 0,           // 团队人数
    
    // 新增收益相关数据
    todayDirectRewards: '0', // 今日直推收益
    todayTeamRewards: '0',   // 今日团队收益
    totalRewards: '0',       // 累计总收益
    
    // 新增等级相关数据
    nextLevelRequirement: 0, // 下一等级要求
    currentPower: 0,         // 当前算力
    nextLevelPower: 0,       // 下一等级算力要求
    directBonus: 0,          // 直推加成比例
    teamBonus: 0            // 团队加成比例
  });

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const loadMiningData = useCallback(async () => {
    if (!account || !library) {
      console.log('No account or library available');
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      const signer = library.getSigner();
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
      const miningContract = new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer);
      const referralContract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);

      console.log('Loading mining stats for account:', account);

      // 获取用户的质押信息
      const [totalPower, directPower, teamPower, level, lastClaimTime, stakedTokenIds] = 
        await miningContract.getUserStakeInfo(account);
      
      // 获取可领取的奖励
      const [reward, teamBonus] = await miningContract.getClaimableReward(account);
      
      // 获取每个质押的 NFT 的日收益总和
      let dailyOutput = ethers.BigNumber.from(0);
      for (const tokenId of stakedTokenIds) {
        const [, , dailyReward] = await nftContract.getNFTAttributes(tokenId);
        dailyOutput = dailyOutput.add(dailyReward);
      }

      // 获取推荐系统信息
      let referrer = null;
      let directCount = 0;
      let inviteCode = '';
      let totalReferrals = 0;
      let teamCount = 0;
      let todayDirectRewards = ethers.BigNumber.from(0);
      let todayTeamRewards = ethers.BigNumber.from(0);

      try {
        // 获取推荐人和邀请码
        referrer = await referralContract.getUserReferrer(account);
        inviteCode = await referralContract.getInviteCode(account);
        
        if (referrer !== ethers.constants.AddressZero) {
          // 获取直推和团队统计
          directCount = await referralContract.getReferralCount(account);
          totalReferrals = directCount;
          teamCount = await referralContract.getTeamCount(account);
          
          // 获取今日奖励
          todayDirectRewards = await referralContract.getDirectRewards(account);
          todayTeamRewards = await referralContract.getTeamRewards(account);
        }
      } catch (error) {
        console.warn('从推荐系统获取信息失败:', error);
        directCount = directPower.gt(0) ? 1 : 0;
      }

      // 更新状态
      setStats(prevStats => ({
        ...prevStats,
        // NFT 状态
        totalPower: formatBigNumber(totalPower, 0),
        hasNFT: stakedTokenIds.length > 0,
        nftLevel: level.toNumber(),
        directIncrease: 5,

        // 收益统计
        currentReward: formatBigNumber(reward),
        dailyOutput: formatBigNumber(dailyOutput),
        totalOutput: formatBigNumber(reward.add(teamBonus)),
        yearReturn: dailyOutput.gt(0) ? 
          formatBigNumber(dailyOutput.mul(365).mul(100).div(reward.add(teamBonus))) + '%' : 
          '0%',

        // 直推和团队状态
        directCount: directCount,
        directIncome: formatBigNumber(directPower),
        teamIncome: formatBigNumber(teamPower),
        currentLevel: level.toNumber(),
        directStatus: 5,

        // 矿工数量
        minerCount: stakedTokenIds.length,

        // 产出统计
        todayOutput: formatBigNumber(dailyOutput),
        totalOutputAll: formatBigNumber(reward.add(teamBonus)),

        // 推荐关系
        referrer: referrer === ethers.constants.AddressZero ? null : formatAddress(referrer),
        stakedNFTs: stakedTokenIds.map(id => id.toString()),

        // 新增邀请相关数据
        inviteCode,
        totalReferrals,
        teamCount,
        
        // 新增收益相关数据
        todayDirectRewards: formatBigNumber(todayDirectRewards),
        todayTeamRewards: formatBigNumber(todayTeamRewards),
        totalRewards: formatBigNumber(reward.add(teamBonus)),
        
        // 新增等级相关数据
        nextLevelRequirement: level.toNumber() + 1,
        currentPower: totalPower.toNumber(),
        nextLevelPower: totalPower.mul(2).toNumber(), // 示例：下一级需要当前算力的2倍
        directBonus: level.toNumber() * 5, // 示例：每级增加5%直推加成
        teamBonus: level.toNumber() * 2  // 示例：每级增加2%团队加成
      }));

    } catch (error) {
      console.error('Error loading mining data:', error);
      setError(error);
    } finally {
      setIsLoading(false);
    }
  }, [account, library]);

  // 每 30 秒更新一次数据
  useEffect(() => {
    loadMiningData();
    const interval = setInterval(loadMiningData, 30000);
    return () => clearInterval(interval);
  }, [loadMiningData]);

  return { stats, isLoading, error, loadMiningData };
};

export default useMiningStats;
