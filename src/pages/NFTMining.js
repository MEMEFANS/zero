import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';

const MYSTERY_BOX_ADDRESS = "YOUR_MYSTERY_BOX_CONTRACT_ADDRESS";

const MYSTERY_BOX_ABI = [
  "function getNFTAttributes(uint256 tokenId) external view returns (tuple(uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime))",
  "function getStakedNFTs(address user) external view returns (uint256[])",
  "function calculateReward(uint256 tokenId) public view returns (uint256)",
  "function getTotalMiners() external view returns (uint256)",
  "function getTodayOutput() external view returns (uint256)",
  "function getTotalOutput() external view returns (uint256)",
  "function stakeNFT(uint256 tokenId) external",
  "function stakeNFTWithInvite(uint256 tokenId, string memory inviteCode) external",
  "function getUserPower(address user) external view returns (uint256)",
  "function pendingReward(address user) external view returns (uint256)",
  "function getDailyRewards(address user) external view returns (uint256)",
  "function getDirectReferrals(address user) external view returns (uint256)"
];

const NFT_RARITY = ['N', 'R', 'SR', 'SSR'];

const NFT_SETTINGS = {
  N: { power: 100, price: 100, dailyReward: 2.8, maxReward: 252, roi: 35.7, yearReturn: 152 },
  R: { power: 400, price: 100, dailyReward: 10, maxReward: 900, roi: 11.1, yearReturn: 800 },
  SR: { power: 1600, price: 100, dailyReward: 40, maxReward: 3600, roi: 2.8, yearReturn: 3500 },
  SSR: { power: 6400, price: 100, dailyReward: 160, maxReward: 14400, roi: 0.7, yearReturn: 14300 }
};

const NFT_PROBABILITIES = {
  N: 0.55,
  R: 0.15,
  SR: 0.05,
  SSR: 0.01
};

const NFT_LEVELS = {
  N: { power: 100, daily: 2.8, maxReward: 252, roi: 35.7, annual: 152, rate: 55, price: 100 },
  R: { power: 400, daily: 10, maxReward: 900, roi: 11.1, annual: 800, rate: 15, price: 100 },
  SR: { power: 1600, daily: 40, maxReward: 3600, roi: 2.8, annual: 3500, rate: 5, price: 100 },
  SSR: { power: 6400, daily: 160, maxReward: 14400, roi: 0.7, annual: 14300, rate: 1, price: 100 }
};

const MINING_LEVELS = [
  { name: 'LV1', min: 0, max: 10000, directBonus: 0.05 },
  { name: 'LV2', min: 10001, max: 30000, directBonus: 0.08 },
  { name: 'LV3', min: 30001, max: 100000, directBonus: 0.12 },
  { name: 'LV4', min: 100001, max: 500000, directBonus: 0.18 },
  { name: 'LV5', min: 500001, max: Infinity, directBonus: 0.25 }
];

const calculateMiningLevel = (power) => {
  const level = MINING_LEVELS.find(l => power >= l.min && power <= l.max);
  return level || MINING_LEVELS[0];
};

const calculateDirectBonus = (power, directCount) => {
  const level = calculateMiningLevel(power);
  return directCount * level.directBonus; // 只计算直推奖励
};

const NFTMining = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [miningStats, setMiningStats] = useState({
    totalPower: 0,
    personalPower: 0,
    currentRewards: 0,
    dailyRewards: 0,
    miningLevel: 'LV1',
    directCount: 0,
    directBonus: 0,
    maxRewards: 0,
    annualRoi: 0,
    inviteCode: '',
    totalMiners: 0,
    todayOutput: 0,
    totalOutput: 0
  });
  const [nfts, setNfts] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [inviteCodeInput, setInviteCodeInput] = useState('');
  const [selectedNFTId, setSelectedNFTId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // 加载所有挖矿数据
  const loadMiningData = async () => {
    if (!account) return;
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, provider);
      
      // 获取用户的 NFT 列表
      const stakedNFTs = await contract.getStakedNFTs(account);
      
      // 计算总算力
      let totalPower = ethers.BigNumber.from(0);
      for (const nftId of stakedNFTs) {
        const attrs = await contract.getNFTAttributes(nftId);
        totalPower = totalPower.add(attrs.power);
      }

      const [rewards, dailyRewards, directCount, totalMiners, todayOutput, totalOutput] = await Promise.all([
        contract.pendingReward(account),
        contract.getDailyRewards(account),
        contract.getDirectReferrals(account),
        contract.getTotalMiners(),
        contract.getTodayOutput(),
        contract.getTotalOutput()
      ]);

      const level = calculateMiningLevel(totalPower);
      const inviteCode = account?.slice(-6).toUpperCase();
      
      setMiningStats({
        totalPower: ethers.utils.formatUnits(totalPower, 18),
        personalPower: ethers.utils.formatUnits(totalPower, 18),
        currentRewards: ethers.utils.formatUnits(rewards, 18),
        dailyRewards: ethers.utils.formatUnits(dailyRewards, 18),
        directCount: directCount.toNumber(),
        directBonus: 0,
        miningLevel: level.name,
        maxRewards: 0,
        annualRoi: 0,
        inviteCode: inviteCode,
        totalMiners: totalMiners.toNumber(),
        todayOutput: ethers.utils.formatUnits(todayOutput, 18),
        totalOutput: ethers.utils.formatUnits(totalOutput, 18)
      });
    } catch (error) {
      console.error('Error loading mining data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNFTs = async () => {
    try {
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      
      // 加载质押的NFT
      const stakedTokenIds = await contract.getStakedNFTs(account);
      const stakedNFTsData = await Promise.all(
        stakedTokenIds.map(async (tokenId) => {
          const attributes = await contract.getNFTAttributes(tokenId);
          const reward = await contract.calculateReward(tokenId);
          
          return {
            id: tokenId.toString(),
            type: NFT_RARITY[attributes.rarity],
            power: attributes.power.toString(),
            dailyReward: ethers.utils.formatEther(attributes.dailyReward),
            maxReward: ethers.utils.formatEther(attributes.maxReward),
            minedAmount: ethers.utils.formatEther(attributes.minedAmount),
            currentReward: ethers.utils.formatEther(reward),
            isStaked: attributes.isStaked
          };
        })
      );
      setNfts(stakedNFTsData);

      // 计算总算力和每日收益
      const totalPower = stakedNFTsData.reduce((sum, nft) => sum + parseInt(nft.power), 0);
      const dailyRewards = stakedNFTsData.reduce((sum, nft) => sum + parseFloat(nft.dailyReward), 0);
      
      setMiningStats(prev => ({
        ...prev,
        personalPower: totalPower,
        dailyRewards
      }));

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading NFTs:', error);
      setIsLoading(false);
    }
  };

  // 获取全局挖矿数据
  const fetchGlobalStats = async () => {
    if (!account) return;
    
    try {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, provider);
      
      const [totalMiners, todayOutput, totalOutput] = await Promise.all([
        contract.getTotalMiners(),
        contract.getTodayOutput(),
        contract.getTotalOutput()
      ]);

      setMiningStats(prev => ({
        ...prev,
        totalMiners: totalMiners.toNumber(),
        todayOutput: ethers.utils.formatUnits(todayOutput, 18),
        totalOutput: ethers.utils.formatUnits(totalOutput, 18)
      }));
    } catch (error) {
      console.error('Error fetching global stats:', error);
    }
  };

  const handleStakeWithInvite = async (nftId) => {
    setSelectedNFTId(nftId);
    setShowInviteModal(true);
  };

  const handleStakeConfirm = async (useInviteCode = false) => {
    if (isSubmitting) return;
    
    try {
      setIsSubmitting(true);
      setIsLoading(true);
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      
      let tx;
      if (useInviteCode && inviteCodeInput) {
        tx = await contract.stakeNFTWithInvite(selectedNFTId, inviteCodeInput);
      } else {
        tx = await contract.stakeNFT(selectedNFTId);
      }
      
      await tx.wait();
      alert('质押成功！');
      
      // 重置状态
      setShowInviteModal(false);
      setInviteCodeInput('');
      setSelectedNFTId(null);
      
      // 刷新数据
      loadMiningData();
      fetchNFTs();
    } catch (error) {
      console.error('Error staking NFT:', error);
    } finally {
      setIsSubmitting(false);
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (active && account) {
      // 初始加载
      loadMiningData();
      fetchNFTs();
      
      // 设置定时器，每10秒更新一次全局数据
      const globalTimer = setInterval(fetchGlobalStats, 10000);
      // 每30秒更新一次收益数据
      const rewardsTimer = setInterval(loadMiningData, 30000);
      
      // 清理函数
      return () => {
        clearInterval(globalTimer);
        clearInterval(rewardsTimer);
      };
    }
  }, [active, account]);

  return (
    <div className="min-h-screen bg-[#0B1120] relative overflow-hidden">
      {/* 挖矿动画背景 */}
      <div className="absolute inset-0">
        {/* 电路背景 */}
        <div className="absolute inset-0">
          {/* 水平线 */}
          {[...Array(12)].map((_, i) => (
            <div
              key={`h-${i}`}
              className="absolute w-full h-[1px] bg-green-500/20"
              style={{ 
                top: `${i * 10}%`,
                transform: i % 2 === 0 ? 'translateX(-20%)' : 'translateX(20%)'
              }}
            >
              {/* 折线 */}
              <div 
                className="absolute right-[30%] w-[100px] h-[1px] bg-green-500/20"
                style={{
                  transform: `rotate(${i % 2 === 0 ? 45 : -45}deg)`,
                  transformOrigin: i % 2 === 0 ? 'right bottom' : 'right top'
                }}
              />
            </div>
          ))}
          
          {/* 垂直线 */}
          {[...Array(8)].map((_, i) => (
            <div
              key={`v-${i}`}
              className="absolute h-full w-[1px] bg-green-500/20"
              style={{ 
                left: `${i * 15}%`,
                transform: i % 2 === 0 ? 'translateY(-10%)' : 'translateY(10%)'
              }}
            >
              {/* 交叉点 */}
              {[...Array(4)].map((_, j) => (
                <div
                  key={`node-${i}-${j}`}
                  className="absolute w-1.5 h-1.5 bg-green-400/30 rounded-full"
                  style={{ 
                    top: `${j * 30}%`,
                    left: '-2px',
                    boxShadow: '0 0 4px #22c55e'
                  }}
                />
              ))}
            </div>
          ))}

          {/* 流动的粒子 */}
          {[...Array(6)].map((_, i) => (
            <div
              key={`particle-${i}`}
              className="absolute w-1 h-1 rounded-full bg-green-400/60"
              style={{
                left: `${Math.random() * 100}%`,
                top: '0',
                animation: `flowParticle 4s infinite linear`,
                animationDelay: `${i * 0.6}s`
              }}
            />
          ))}

          {/* 光束效果 */}
          {[...Array(3)].map((_, i) => (
            <div
              key={`beam-${i}`}
              className="absolute h-full w-[2px]"
              style={{
                left: `${30 + i * 20}%`,
                background: 'linear-gradient(to bottom, transparent, #22c55e20, transparent)',
                animation: `lightBeam 3s infinite ease-in-out`,
                animationDelay: `${i * 1}s`
              }}
            />
          ))}
        </div>

        {/* 矿机运行动画 */}
        <div className="absolute inset-0">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-16 bg-green-500/20"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animation: `mine ${Math.random() * 2 + 1}s infinite`,
                animationDelay: `${Math.random() * 2}s`
              }}
            />
          ))}
        </div>

        {/* 电路板背景 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50h20l10-10 10 10h20m20 0h20' stroke='%2330FF94' stroke-width='1' fill='none'/%3E%3Cpath d='M50 0v20l10 10-10 10v20m0 20v20' stroke='%2330FF94' stroke-width='1' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px'
          }}
        />

        {/* 能量波动 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1/2 bg-gradient-to-b from-green-500/5 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/2 bg-gradient-to-t from-green-500/5 to-transparent"></div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative container mx-auto px-4 py-32">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <div className="relative inline-block">
            <div className="absolute -inset-2 bg-green-500/20 rounded-lg blur-lg"></div>
            <h1 className="relative text-4xl font-bold text-green-400">{t('nftMining')}</h1>
          </div>
          <div className="mt-4 text-green-400/80">{t('realTimeMonitoring')}</div>
        </div>

        {/* 全局挖矿统计 */}
        <div className="grid grid-cols-3 gap-6 mb-6">
          <div className="bg-[#1A2438]/80 backdrop-blur-xl p-4 rounded-lg border border-green-500/20">
            <div className="text-green-300/80 text-sm mb-1">{t('minerCount')}</div>
            <div className="text-green-400 text-2xl font-bold flex items-center">
              {miningStats.totalMiners.toLocaleString()} {t('people')}
              <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
          <div className="bg-[#1A2438]/80 backdrop-blur-xl p-4 rounded-lg border border-green-500/20">
            <div className="text-green-300/80 text-sm mb-1">{t('todayOutput')}</div>
            <div className="text-green-400 text-2xl font-bold flex items-center">
              {parseFloat(miningStats.todayOutput).toLocaleString()} ZONE
              <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
          <div className="bg-[#1A2438]/80 backdrop-blur-xl p-4 rounded-lg border border-green-500/20">
            <div className="text-green-300/80 text-sm mb-1">{t('totalOutput')}</div>
            <div className="text-green-400 text-2xl font-bold flex items-center">
              {parseFloat(miningStats.totalOutput).toLocaleString()} ZONE
              <div className="ml-2 h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
          </div>
        ) : (
          <>
            {/* 挖矿状态展示 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {/* NFT 状态卡片 */}
              <div className="relative group h-[240px]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                <div className="relative bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">{t('nftStatus')}</h3>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('holdingCount')}</span>
                      <span className="text-green-400 font-bold">{nfts.length}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('totalPower')}</span>
                      <span className="text-green-400 font-bold">{miningStats.totalPower} H/s</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('miningLevel')}</span>
                      <span className="text-green-400 font-bold">{miningStats.miningLevel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('directBonus')}</span>
                      <span className="text-green-400 font-bold">+{(MINING_LEVELS.find(l => l.name === miningStats.miningLevel)?.directBonus * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 收益统计卡片 */}
              <div className="relative group h-[240px]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                <div className="relative bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">{t('revenueStats')}</h3>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('currentRevenue')}</span>
                      <span className="text-green-400 font-bold">{miningStats.currentRewards} ZONE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('dailyRevenue')}</span>
                      <span className="text-green-400 font-bold">{miningStats.dailyRewards} ZONE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('maxRevenue')}</span>
                      <span className="text-green-400 font-bold">{miningStats.maxRewards} ZONE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('estimatedAnnual')}</span>
                      <span className="text-green-400 font-bold">{miningStats.annualRoi}%</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 直推状态卡片 */}
              <div className="relative group h-[240px]">
                <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                <div className="relative bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-xl font-bold text-green-400">{t('directStatus')}</h3>
                    <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse"></div>
                  </div>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('directCount')}</span>
                      <span className="text-green-400 font-bold">{miningStats.directCount} {t('people')}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('directIncome')}</span>
                      <span className="text-green-400 font-bold">{miningStats.directBonus} ZONE</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('currentLevel')}</span>
                      <span className="text-green-400 font-bold">{miningStats.miningLevel}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-green-300/80">{t('directIncrease')}</span>
                      <span className="text-green-400 font-bold">+{(MINING_LEVELS.find(l => l.name === miningStats.miningLevel)?.directBonus * 100).toFixed(0)}%</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* 邀请码区域 */}
            <div className="mt-6 bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20 max-w-md">
              <div className="flex items-center">
                <div className="text-green-400 mb-2">{t('myInviteCode')}</div>
              </div>
              <div className="flex items-center space-x-3">
                <div className="bg-[#0B1120] border border-green-500/20 rounded-lg px-4 py-2 text-white font-mono text-xl text-center flex-1">
                  {miningStats.inviteCode || account?.slice(-6).toUpperCase()}
                </div>
                <button
                  onClick={() => {
                    const code = miningStats.inviteCode || account?.slice(-6).toUpperCase();
                    if (code) {
                      navigator.clipboard.writeText(code);
                      alert('复制成功！');
                    }
                  }}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-2 px-6 rounded-lg hover:from-green-600 hover:to-green-700 transition-all whitespace-nowrap"
                >
                  {t('copy')}
                </button>
              </div>
            </div>

            {/* NFT列表 */}
            <div className="mb-8">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-green-400">{t('myNFT')}</h2>
                <div className="flex items-center space-x-4">
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400/80">{t('runningMachines')}:</span>
                    <span className="text-green-400 font-bold">{nfts.filter(nft => nft.isStaked).length}/{nfts.length}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400/80">{t('networkPower')}:</span>
                    <span className="text-green-400 font-bold">{miningStats.totalPower} H/s</span>
                  </div>
                </div>
              </div>
              
              {nfts.length === 0 ? (
                <div className="bg-[#1A2438]/80 backdrop-blur-xl p-8 rounded-lg border border-green-500/20 text-center relative overflow-hidden h-[600px] w-full">
                  {/* 矿机运行动画 */}
                  <div className="absolute inset-0 flex items-center justify-center p-8">
                    {/* 主机外壳 */}
                    <div className="relative w-full h-full bg-[#0d1117] rounded-lg p-8 before:absolute before:inset-0 before:border-2 before:border-green-500/20 before:rounded-lg before:z-0">
                      {/* 装饰性边角 */}
                      <div className="absolute -top-1 -left-1 w-4 h-4 border-t-2 border-l-2 border-green-400/60"></div>
                      <div className="absolute -top-1 -right-1 w-4 h-4 border-t-2 border-r-2 border-green-400/60"></div>
                      <div className="absolute -bottom-1 -left-1 w-4 h-4 border-b-2 border-l-2 border-green-400/60"></div>
                      <div className="absolute -bottom-1 -right-1 w-4 h-4 border-b-2 border-r-2 border-green-400/60"></div>

                      {/* 顶部信息栏 */}
                      <div className="relative flex justify-between items-center mb-6 z-10">
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                          <span className="text-xs text-green-400/80 font-mono">{t('systemOnline')}</span>
                        </div>
                        <div className="flex items-center space-x-3">
                          {/* CPU温度 */}
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
                            </svg>
                            <span className="text-xs text-green-400/80 font-mono">45°C</span>
                          </div>
                          {/* 内存使用 */}
                          <div className="flex items-center space-x-1">
                            <svg className="w-3 h-3 text-green-400/60" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            <span className="text-xs text-green-400/80 font-mono">8.2GB</span>
                          </div>
                        </div>
                      </div>

                      {/* 主要显示区域 */}
                      <div className="relative grid grid-cols-2 gap-12 z-10 mt-8">
                        {/* 左侧：计算单元 */}
                        <div className="space-y-3">
                          <div className="text-xs text-green-400/60 font-mono mb-2">{t('computingUnits')}</div>
                          <div className="grid grid-cols-3 max-[768px]:grid-cols-2 gap-4 max-[768px]:gap-2">
                            {[...Array(9)].map((_, i) => (
                              <div key={i} className="aspect-square border border-green-400/20 rounded-sm relative overflow-hidden">
                                {/* 计算动画 */}
                                <div 
                                  className="absolute inset-0 bg-gradient-to-b from-green-500/10 via-green-400/5 to-transparent"
                                  style={{
                                    animation: `computeFlow 1.5s infinite`,
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                ></div>
                                {/* 状态指示灯 */}
                                <div 
                                  className="absolute top-1 right-1 w-1 h-1 rounded-full bg-green-400"
                                  style={{
                                    animation: `blink 1s infinite`,
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                ></div>
                                {/* 十六进制数字 */}
                                <div className="absolute bottom-1 left-1 text-[8px] text-green-400/40 font-mono">
                                  {(Math.random() * 0xFF).toString(16).padStart(2, '0').toUpperCase()}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* 右侧：系统监控 */}
                        <div className="space-y-3">
                          <div className="text-xs text-green-400/60 font-mono mb-2">{t('systemMonitor')}</div>
                          {/* 系统状态图表 */}
                          <div className="h-[200px] border border-green-400/20 rounded-sm p-2 relative">
                            <div className="absolute inset-0 flex items-end justify-around p-2">
                              {[...Array(12)].map((_, i) => (
                                <div
                                  key={i}
                                  className="w-[3px] bg-green-400/30 rounded-t"
                                  style={{
                                    height: `${Math.random() * 100}%`,
                                    animation: 'barHeight 2s infinite',
                                    animationDelay: `${i * 0.1}s`
                                  }}
                                ></div>
                              ))}
                            </div>
                            {/* 网格线 */}
                            {[...Array(5)].map((_, i) => (
                              <div
                                key={i}
                                className="absolute w-full h-[1px] bg-green-400/10"
                                style={{ top: `${20 * (i + 1)}%` }}
                              ></div>
                            ))}
                          </div>
                        </div>
                      </div>

                      {/* 底部状态栏 */}
                      <div className="absolute bottom-8 left-8 right-8 z-10">
                        <div className="h-12 border border-green-400/20 rounded-sm overflow-hidden relative">
                          {/* 终端输出 */}
                          <div className="absolute inset-0 flex items-center px-2 font-mono">
                            <span className="text-green-400/60 animate-pulse mr-1">&gt;</span>
                            <div className="relative h-4 overflow-hidden">
                              <div className="whitespace-nowrap text-[10px] text-green-400/60" style={{ animation: 'slideText 10s infinite linear' }}>
                                {t('initializingSystem')}... {t('checkingMemory')}... {t('verifyingHashRate')}... {t('connectingToNetwork')}... {t('startingMiningProcess')}...
                              </div>
                            </div>
                          </div>
                          {/* 进度条 */}
                          <div 
                            className="absolute bottom-0 left-0 h-[1px] bg-gradient-to-r from-green-500/40 to-green-400/60"
                            style={{ animation: 'progressBar 3s infinite' }}
                          ></div>
                        </div>
                      </div>

                      {/* 背景网格 */}
                      <div className="absolute inset-0 grid grid-cols-12 grid-rows-8 gap-[1px] opacity-5 pointer-events-none">
                        {[...Array(96)].map((_, i) => (
                          <div key={i} className="border-[0.5px] border-green-400/10"></div>
                        ))}
                      </div>

                      {/* 装饰性数据线 */}
                      {[...Array(8)].map((_, i) => (
                        <div
                          key={i}
                          className="absolute h-[1px]"
                          style={{
                            width: '20%',
                            background: 'linear-gradient(90deg, transparent, #22c55e20, transparent)',
                            left: `${10 + i * 10}%`,
                            top: `${20 + i * 8}%`,
                            animation: `dataTransfer 2s infinite`,
                            animationDelay: `${i * 0.2}s`
                          }}
                        ></div>
                      ))}
                    </div>
                  </div>

                  {/* 文字内容 */}
                  <div className="absolute bottom-8 left-0 right-0 text-center">
                    <p className="text-green-400/80 text-xl mb-2">{t('noNFT')}</p>
                    <p className="text-sm text-green-400/60">{t('getNFTFirst')}</p>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {nfts.map((nft) => (
                    <div key={nft.id} className="relative group">
                      <div className="absolute -inset-0.5 bg-gradient-to-r from-green-500 to-green-300 rounded-lg opacity-20 group-hover:opacity-30 transition duration-500 blur"></div>
                      <div className="relative bg-[#1A2438]/80 backdrop-blur-xl p-6 rounded-lg border border-green-500/20">
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-green-300/80">{t('nftId')}</span>
                            <span className="text-green-400 font-bold">#{nft.id}</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-green-300/80">{t('power')}</span>
                            <span className="text-green-400 font-bold">{nft.power} H/s</span>
                          </div>
                          <div className="flex justify-between items-center">
                            <span className="text-green-300/80">{t('status')}</span>
                            <span className={nft.isStaked ? "text-yellow-400 font-bold" : "text-green-400 font-bold"}>
                              {nft.isStaked ? t('destroyed') : t('unstaked')}
                            </span>
                          </div>
                          
                          {/* 只在未质押时显示质押按钮 */}
                          {!nft.isStaked && (
                            <button
                              onClick={() => handleStakeWithInvite(nft.id)}
                              className="w-full mt-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                            >
                              {t('stakeMining')}
                            </button>
                          )}

                          {/* 已质押的NFT显示提示 */}
                          {nft.isStaked && (
                            <div className="mt-4 text-yellow-400/80 text-sm text-center">
                              {t('nftDestroyed')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 操作按钮 */}
            <div className="flex justify-center gap-4">
              <button 
                onClick={() => {}}
                disabled={nfts.length === 0}
                className={`relative group overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-8 rounded-lg transition-all ${
                  nfts.length === 0 ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'
                }`}
              >
                <span className="relative z-10">{t('stakeNFT')}</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
              </button>
              <button 
                onClick={() => {}}
                disabled={miningStats.currentRewards <= 0}
                className={`relative group overflow-hidden bg-transparent text-green-500 border-2 border-green-500 font-bold py-3 px-8 rounded-lg transition-colors ${
                  miningStats.currentRewards <= 0 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-green-500 hover:text-white'
                }`}
              >
                <span className="relative z-10">{t('claimRewards')}</span>
                <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
              </button>
            </div>
          </>
        )}
      </div>

      {/* 添加样式 */}
      <style jsx>{`
        @keyframes mine {
          0% { transform: translateY(0) scale(1); opacity: 0; }
          50% { transform: translateY(100vh) scale(0.5); opacity: 1; }
          100% { transform: translateY(200vh) scale(0.25); opacity: 0; }
        }
        
        @keyframes dataStream {
          0% { transform: translateY(-100%) translateX(-50%) rotate(45deg); opacity: 0; }
          50% { opacity: 1; }
          100% { transform: translateY(100%) translateX(50%) rotate(45deg); opacity: 0; }
        }

        @keyframes ripple {
          0% { transform: scale(0.8); opacity: 1; }
          100% { transform: scale(1.2); opacity: 0; }
        }

        .animate-spin-slow {
          animation: spin 3s linear infinite;
        }

        .animate-ripple {
          animation: ripple 2s linear infinite;
        }

        @keyframes computeFlow {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes blink {
          0%, 100% { opacity: 0.3; }
          50% { opacity: 1; }
        }

        @keyframes dataTransfer {
          0% { transform: translateX(-100%); opacity: 0; }
          50% { transform: translateX(0); opacity: 1; }
          100% { transform: translateX(100%); opacity: 0; }
        }

        @keyframes progressBar {
          0% { width: 0%; }
          50% { width: 100%; }
          50.1% { width: 0%; }
          100% { width: 0%; }
        }

        @keyframes barHeight {
          0%, 100% { height: 30%; }
          50% { height: 100%; }
        }

        @keyframes slideText {
          0% { transform: translateX(100%); }
          100% { transform: translateX(-100%); }
        }

        @keyframes flowParticle {
          0% { 
            transform: translateY(-100%) scale(1);
            opacity: 0;
          }
          50% { 
            transform: translateY(50%) scale(1.5);
            opacity: 1;
          }
          100% { 
            transform: translateY(200%) scale(1);
            opacity: 0;
          }
        }

        @keyframes lightBeam {
          0% { 
            opacity: 0;
            transform: translateX(-50px) scaleY(0.8);
          }
          50% { 
            opacity: 1;
            transform: translateX(0) scaleY(1);
          }
          100% { 
            opacity: 0;
            transform: translateX(50px) scaleY(0.8);
          }
        }
      `}</style>

      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A2438] rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-xl font-bold text-green-400 mb-4">{t('stakeNFT')}</h3>
            <div className="space-y-4">
              <div>
                <label className="text-green-300/80 block mb-2">{t('inviteCodeOptional')}</label>
                <input
                  type="text"
                  value={inviteCodeInput}
                  onChange={(e) => setInviteCodeInput(e.target.value)}
                  placeholder={t('enterInviteCode')}
                  className="w-full bg-[#0B1120] border border-green-500/20 rounded-lg px-4 py-2 text-white"
                />
              </div>
              <div className="flex gap-4">
                <button
                  onClick={() => handleStakeConfirm(false)}
                  className="flex-1 bg-[#0B1120] border border-green-500/20 text-white font-medium py-2 px-4 rounded-lg hover:bg-[#0B1120]/80 transition-all"
                >
                  {t('stakeDirectly')}
                </button>
                <button
                  onClick={() => handleStakeConfirm(true)}
                  className="flex-1 bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-2 px-4 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
                >
                  {t('useInviteCode')}
                </button>
              </div>
              <button
                onClick={() => {
                  setShowInviteModal(false);
                  setInviteCodeInput('');
                  setSelectedNFTId(null);
                }}
                className="w-full mt-2 text-green-400/60 hover:text-green-400"
              >
                {t('cancel')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMining;
