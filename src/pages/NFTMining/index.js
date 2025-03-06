import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';
import { CpuChipIcon, CurrencyDollarIcon, BanknotesIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Background from '../../components/Layout/Background';
import { StatusCard, NFTCard } from './components/Cards';
import ReferralTree from './components/Referral/ReferralTree';
import GlobalStats from './components/Stats/GlobalStats';
import OutputStats from './components/Stats/OutputStats';
import LevelSystem from './components/Stats/LevelSystem';
import { injected } from '../../utils/web3';
import useNFTMining from './hooks/useNFTMining';

const NFTMining = () => {
  const { active, account, activate, library } = useWeb3React();
  const { 
    stats, 
    loading, 
    error, 
    stakeNFT, 
    unstakeNFT, 
    claimReward 
  } = useNFTMining(account, library);

  // 连接钱包
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (err) {
      console.error('Error connecting wallet:', err);
      toast.error('连接钱包失败');
    }
  };

  if (!active) {
    return (
      <Background>
        <div className="flex flex-col items-center justify-center min-h-screen p-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3 sm:mb-4">NFT 挖矿</h1>
          <div className="max-w-2xl text-center mb-6 sm:mb-8">
            <p className="text-gray-400 text-sm sm:text-base mb-3">
              质押您的 NFT 参与挖矿，获得算力产出 ZONE 代币
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-500 text-xs sm:text-sm px-4 sm:px-0">
              <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
                <p className="text-green-400 mb-1">⚡ 等级加成</p>
                <p>NFT 等级越高，获得的基础算力越大</p>
              </div>
              <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
                <p className="text-green-400 mb-1">🤝 团队收益</p>
                <p>邀请好友加入，获得直推和团队算力加成</p>
              </div>
            </div>
          </div>
          <button
            onClick={connectWallet}
            className="px-6 py-3 bg-green-500/20 text-green-400 rounded-lg font-medium hover:bg-green-500/30 transition-colors"
          >
            连接钱包
          </button>
        </div>
      </Background>
    );
  }

  if (loading) {
    return (
      <Background>
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-400"></div>
        </div>
      </Background>
    );
  }

  if (error) {
    return (
      <Background>
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-red-400 text-center">
            <p className="text-xl font-bold mb-2">出错了</p>
            <p>{error}</p>
          </div>
        </div>
      </Background>
    );
  }

  return (
    <Background>
      <div className="container mx-auto px-4 py-6 sm:py-8 space-y-6 sm:space-y-8">
        {/* 页面说明 */}
        <div className="max-w-2xl mx-auto text-center">
          <h1 className="text-2xl sm:text-3xl font-bold text-green-400 mb-3 sm:mb-4">NFT 挖矿</h1>
          <p className="text-gray-400 text-sm sm:text-base mb-3">
            质押您的 NFT 参与挖矿，获得算力产出 ZONE 代币
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-gray-500 text-xs sm:text-sm px-4 sm:px-0">
            <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
              <p className="text-green-400 mb-1">⚡ 等级加成</p>
              <p>NFT 等级越高，获得的基础算力越大</p>
            </div>
            <div className="bg-[#1A2438]/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/10">
              <p className="text-green-400 mb-1">🤝 团队收益</p>
              <p>邀请好友加入，获得直推和团队算力加成</p>
            </div>
          </div>
        </div>

        {/* 头部状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
          <StatusCard
            title="总算力"
            value={`${stats.totalPower} H/s`}
            icon={<CpuChipIcon className="w-6 h-6" />}
          />
          <StatusCard
            title="直推算力"
            value={`${stats.directPower} H/s`}
            icon={<CpuChipIcon className="w-6 h-6" />}
          />
          <StatusCard
            title="团队算力"
            value={`${stats.teamPower} H/s`}
            icon={<UserGroupIcon className="w-6 h-6" />}
          />
          <StatusCard
            title="可领取收益"
            value={`${Number(stats.claimableReward).toFixed(4)} ZONE`}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
          />
          <StatusCard
            title="团队奖励"
            value={`${Number(stats.teamBonus).toFixed(4)} ZONE`}
            icon={<TrophyIcon className="w-6 h-6" />}
          />
        </div>

        {/* 全局统计面板 */}
        <GlobalStats
          totalStakedPower={stats.totalStakedPower}
          totalMiners={stats.totalMiners}
        />

        {/* 产出统计面板 */}
        <div className="mt-6">
          <OutputStats
            todayOutput={stats.todayOutput}
            totalOutput={stats.totalOutput}
          />
        </div>

        {/* 等级系统面板 */}
        <div className="mt-6">
          <LevelSystem
            currentLevel={stats.level}
            currentPower={stats.totalPower}
            levelConfigs={stats.levelConfigs}
          />
        </div>

        {/* 操作按钮 */}
        <div className="flex justify-end space-x-4">
          <button
            onClick={claimReward}
            disabled={stats.claimableReward === 0}
            className={`px-6 py-3 rounded-lg font-medium transition-colors ${
              stats.claimableReward === 0
                ? 'bg-gray-500/20 text-gray-400 cursor-not-allowed'
                : 'bg-green-500/20 text-green-400 hover:bg-green-500/30'
            }`}
          >
            领取收益
          </button>
        </div>

        {/* NFT 列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.nfts.map(nft => (
            <NFTCard
              key={nft.tokenId}
              nft={nft}
              onStake={stakeNFT}
              onUnstake={unstakeNFT}
              isStaked={stats.stakedNfts.includes(nft.tokenId)}
            />
          ))}
        </div>

        {/* 推荐关系树 */}
        <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
          <h2 className="text-2xl font-bold text-green-400 mb-6">推荐关系</h2>
          <ReferralTree account={account} provider={library} />
        </div>
      </div>
    </Background>
  );
};

export default NFTMining;
