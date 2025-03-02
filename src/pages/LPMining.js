import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';

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

const LPMining = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
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
  const [stakeAmount, setStakeAmount] = useState('');
  const [unstakeAmount, setUnstakeAmount] = useState('');

  // 连接钱包
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

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
  const handleStake = async () => {
    if (!stakeAmount) return;
    try {
      setIsSubmitting(true);
      const amount = ethers.utils.parseEther(stakeAmount);
      
      // 先授权
      const allowance = await lpTokenContract.allowance(account, lpMiningContract.address);
      if (allowance.lt(amount)) {
        const tx = await lpTokenContract.approve(lpMiningContract.address, ethers.constants.MaxUint256);
        await tx.wait();
      }
      
      // 质押
      const tx = await lpMiningContract.stake(amount);
      await tx.wait();
      
      setStakeAmount('');
      loadMiningData();
    } catch (error) {
      console.error('Error staking LP:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // 解除质押
  const handleUnstake = async () => {
    if (!unstakeAmount) return;
    try {
      setIsSubmitting(true);
      const amount = ethers.utils.parseEther(unstakeAmount);
      const tx = await lpMiningContract.unstake(amount);
      await tx.wait();
      
      setUnstakeAmount('');
      loadMiningData();
    } catch (error) {
      console.error('Error unstaking LP:', error);
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
    } catch (error) {
      console.error('Error claiming rewards:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {!active ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-green-400">ZONE-USDT LP挖矿</h1>
          <button
            onClick={connectWallet}
            className="mt-4 px-6 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
          >
            连接钱包
          </button>
        </div>
      ) : (
        <div>
          <h1 className="text-4xl font-bold text-green-400 mb-8">ZONE-USDT LP挖矿</h1>
          
          {/* 挖矿统计 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">总质押ZONE-USDT LP</h3>
              <p className="text-2xl font-bold">{Number(miningInfo.totalStaked).toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">每日产出</h3>
              <p className="text-2xl font-bold">{Number(miningInfo.rewardPerDay).toFixed(2)} ZONE</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">我的算力占比</h3>
              <p className="text-2xl font-bold">
                {miningInfo.totalStaked === '0' 
                  ? '0.00'
                  : ((Number(miningInfo.stakedAmount) / Number(miningInfo.totalStaked)) * 100).toFixed(2)}%
              </p>
            </div>
          </div>

          {/* LP信息说明 */}
          <div className="bg-gray-800 p-6 rounded-lg mb-8">
            <h3 className="text-xl font-bold mb-4">LP代币说明</h3>
            <div className="space-y-2 text-gray-300">
              <p>• 1个ZONE-USDT LP代币 = 1份流动性份额</p>
              <p>• 当前1个LP代币包含:</p>
              <div className="ml-4">
                <p>- {Number(miningInfo.zonePerLp || 0).toFixed(4)} ZONE</p>
                <p>- {Number(miningInfo.usdtPerLp || 0).toFixed(4)} USDT</p>
              </div>
              <p>• 您的LP余额价值: {Number(miningInfo.lpBalance * miningInfo.usdtPerLp || 0).toFixed(2)} USDT</p>
              <p className="text-sm text-gray-400 mt-4">
                * 提示: 在DEX添加流动性时，输入等值的ZONE和USDT，系统会自动计算出对应的LP代币数量。
                比如提供500 ZONE + 500 USDT，可能会得到10个LP代币（具体数量取决于当前池子状态）。
              </p>
            </div>
          </div>

          {/* 个人数据 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">已质押ZONE-USDT LP</h3>
              <p className="text-2xl font-bold">{Number(miningInfo.stakedAmount).toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">可领取ZONE</h3>
              <p className="text-2xl font-bold">{Number(miningInfo.pendingRewards).toFixed(4)}</p>
            </div>
            <div className="bg-gray-800 p-6 rounded-lg">
              <h3 className="text-lg text-gray-400 mb-2">ZONE-USDT LP余额</h3>
              <p className="text-2xl font-bold">{Number(miningInfo.lpBalance).toFixed(4)}</p>
            </div>
          </div>

          {/* 操作区域 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
            <div>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-400 mb-2">当前输入的LP代币价值约:</p>
                <p className="text-lg">
                  {Number(stakeAmount || 0) * Number(miningInfo.zonePerLp || 0)} ZONE +{' '}
                  {Number(stakeAmount || 0) * Number(miningInfo.usdtPerLp || 0)} USDT
                </p>
              </div>
              <input
                type="text"
                placeholder="输入质押LP代币数量"
                value={stakeAmount}
                onChange={(e) => setStakeAmount(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white mb-2"
              />
              <button
                onClick={handleStake}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-green-500 text-white rounded hover:bg-green-600 disabled:opacity-50"
              >
                质押LP代币
              </button>
            </div>
            <div>
              <div className="bg-gray-700 p-4 rounded-lg mb-4">
                <p className="text-sm text-gray-400 mb-2">当前输入的LP代币价值约:</p>
                <p className="text-lg">
                  {Number(unstakeAmount || 0) * Number(miningInfo.zonePerLp || 0)} ZONE +{' '}
                  {Number(unstakeAmount || 0) * Number(miningInfo.usdtPerLp || 0)} USDT
                </p>
              </div>
              <input
                type="text"
                placeholder="输入解押LP代币数量"
                value={unstakeAmount}
                onChange={(e) => setUnstakeAmount(e.target.value)}
                className="w-full p-3 bg-gray-700 rounded border border-gray-600 text-white mb-2"
              />
              <button
                onClick={handleUnstake}
                disabled={isSubmitting}
                className="w-full px-4 py-3 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
              >
                解押LP代币
              </button>
            </div>
          </div>

          <button
            onClick={handleClaim}
            disabled={isSubmitting || Number(miningInfo.pendingRewards) <= 0}
            className="w-full px-4 py-3 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
          >
            领取奖励
          </button>
        </div>
      )}
    </div>
  );
};

export default LPMining;
