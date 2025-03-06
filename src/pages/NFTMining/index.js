import React from 'react';
import { useWeb3React } from '@web3-react/core';
import { toast } from 'react-toastify';
import { CpuChipIcon, CurrencyDollarIcon, BanknotesIcon, TrophyIcon, UserGroupIcon } from '@heroicons/react/24/outline';
import Background from '../../components/Layout/Background';
import { StatusCard, NFTCard } from './components/Cards';
import ReferralTree from './components/Referral/ReferralTree';
import { RewardsChart } from './components/Charts';
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
          <h1 className="text-3xl font-bold text-green-400 mb-8">NFT 挖矿</h1>
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
      <div className="container mx-auto px-4 py-8 space-y-8">
        {/* 头部状态卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
            value={`${stats.claimableReward} ZONE`}
            icon={<CurrencyDollarIcon className="w-6 h-6" />}
          />
          <StatusCard
            title="团队奖励"
            value={`${stats.teamBonus} ZONE`}
            icon={<BanknotesIcon className="w-6 h-6" />}
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

        {/* 收益图表 */}
        <div className="bg-[#1A2438]/80 backdrop-blur-sm p-6 rounded-lg border border-green-500/20">
          <h2 className="text-2xl font-bold text-green-400 mb-6">收益历史</h2>
          <RewardsChart account={account} provider={library} />
        </div>
      </div>
    </Background>
  );
};

export default NFTMining;
