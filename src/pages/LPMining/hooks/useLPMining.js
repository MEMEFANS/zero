import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';

const LP_MINING_ADDRESS = "YOUR_LP_MINING_CONTRACT_ADDRESS";
const LP_TOKEN_ADDRESS = "YOUR_LP_TOKEN_ADDRESS";

const LP_MINING_ABI = [
  "function getUserStakeInfo(address user) external view returns (tuple(uint256 stakedAmount, uint256 pendingRewards))",
  "function stake(uint256 amount) external",
  "function unstake(uint256 amount) external",
  "function claimReward() external",
  "function totalStaked() external view returns (uint256)",
  "function rewardPerDay() external view returns (uint256)"
];

const LP_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

const useLPMining = () => {
  const { account, library } = useWeb3React();
  const [lpMiningContract, setLPMiningContract] = useState(null);
  const [lpTokenContract, setLPTokenContract] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // LP挖矿数据
  const [miningInfo, setMiningInfo] = useState({
    stakedAmount: '0',
    pendingRewards: '0',
    lpBalance: '0',
    totalStaked: '0',
    rewardPerDay: '0',
    zonePerLp: '0',
    usdtPerLp: '0'
  });

  // 初始化合约
  useEffect(() => {
    if (library && account) {
      const signer = library.getSigner();
      setLPMiningContract(new ethers.Contract(LP_MINING_ADDRESS, LP_MINING_ABI, signer));
      setLPTokenContract(new ethers.Contract(LP_TOKEN_ADDRESS, LP_TOKEN_ABI, signer));
    }
  }, [library, account]);

  // 加载挖矿数据
  const loadMiningData = async () => {
    if (!account || !lpMiningContract || !lpTokenContract) return;

    try {
      const [info, balance, totalStaked, rewardPerDay] = await Promise.all([
        lpMiningContract.getUserStakeInfo(account),
        lpTokenContract.balanceOf(account),
        lpMiningContract.totalStaked(),
        lpMiningContract.rewardPerDay()
      ]);
      
      setMiningInfo({
        stakedAmount: ethers.utils.formatEther(info.stakedAmount),
        pendingRewards: ethers.utils.formatEther(info.pendingRewards),
        lpBalance: ethers.utils.formatEther(balance),
        totalStaked: ethers.utils.formatEther(totalStaked),
        rewardPerDay: ethers.utils.formatEther(rewardPerDay),
        zonePerLp: '0',
        usdtPerLp: '0'
      });
    } catch (error) {
      console.error('Error loading mining data:', error);
    }
  };

  useEffect(() => {
    loadMiningData();
    const interval = setInterval(loadMiningData, 10000);
    return () => clearInterval(interval);
  }, [account, lpMiningContract, lpTokenContract]);

  // 质押LP
  const handleStake = async (amount) => {
    if (!amount) return;
    try {
      setIsSubmitting(true);
      const parsedAmount = ethers.utils.parseEther(amount);
      
      // 先授权
      const allowance = await lpTokenContract.allowance(account, lpMiningContract.address);
      if (allowance.lt(parsedAmount)) {
        const tx = await lpTokenContract.approve(lpMiningContract.address, ethers.constants.MaxUint256);
        await tx.wait();
      }
      
      // 质押
      const tx = await lpMiningContract.stake(parsedAmount);
      await tx.wait();
      
      loadMiningData();
      return true;
    } catch (error) {
      console.error('Error staking LP:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 解除质押
  const handleUnstake = async (amount) => {
    if (!amount) return;
    try {
      setIsSubmitting(true);
      const parsedAmount = ethers.utils.parseEther(amount);
      const tx = await lpMiningContract.unstake(parsedAmount);
      await tx.wait();
      
      loadMiningData();
      return true;
    } catch (error) {
      console.error('Error unstaking LP:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  // 领取奖励
  const handleClaim = async () => {
    try {
      setIsSubmitting(true);
      const tx = await lpMiningContract.claimReward();
      await tx.wait();
      loadMiningData();
      return true;
    } catch (error) {
      console.error('Error claiming rewards:', error);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };

  return {
    miningInfo,
    isSubmitting,
    handleStake,
    handleUnstake,
    handleClaim,
    loadMiningData
  };
};

export default useLPMining;
