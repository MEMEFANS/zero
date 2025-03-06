import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { ethers } from 'ethers';
import { REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI } from '../../../../constants/contracts';

const ReferralTree = ({ account, provider }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState(null);

  const init = async () => {
    console.log('Initializing ReferralTree with account:', account);
    if (!account || !provider) {
      console.log('Missing account or provider');
      setLoading(false);
      return;
    }

    try {
      // 先检查合约地址是否存在
      const code = await provider.getCode(REFERRAL_REGISTRY_ADDRESS);
      console.log('Contract code length:', code.length);
      if (code === '0x' || code === '0x0') {
        throw new Error('Contract not deployed at address: ' + REFERRAL_REGISTRY_ADDRESS);
      }

      console.log('Creating contract instance...');
      const contract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, provider);
      console.log('Contract instance created');
      
      try {
        // 1. 检查是否有推荐人
        console.log('Checking hasReferrer...');
        const hasReferrer = await contract.hasReferrer(account);
        console.log('Has referrer:', hasReferrer);
        
        // 2. 获取推荐人
        let referrer = null;
        if (hasReferrer) {
          console.log('Getting referrer...');
          referrer = await contract.getUserReferrer(account);
          console.log('Referrer:', referrer);
        }

        // 3. 获取推荐统计数据，如果失败则默认为0
        let referralCount = 0;
        let teamMembers = [];
        let directReferrals = [];
        let directRewards = ethers.BigNumber.from(0);
        let teamRewards = ethers.BigNumber.from(0);

        try {
          referralCount = await contract.getReferralCount(account);
        } catch (e) {
          console.log('No referrals yet');
        }

        try {
          teamMembers = await contract.getTeamMembers(account);
        } catch (e) {
          console.log('No team members yet');
        }

        try {
          if (referralCount > 0) {
            directReferrals = await contract.getDirectReferrals(account);
          }
        } catch (e) {
          console.log('Failed to get direct referrals');
        }

        try {
          directRewards = await contract.getDirectRewards(account);
        } catch (e) {
          console.log('No direct rewards yet');
        }

        try {
          teamRewards = await contract.getTeamRewards(account);
        } catch (e) {
          console.log('No team rewards yet');
        }

        setStats({
          directCount: Number(referralCount || 0),
          teamCount: teamMembers.length,
          hasReferrer,
          referrer: hasReferrer ? referrer : null,
          directReferrals,
          teamMembers,
          directRewards: directRewards || ethers.BigNumber.from(0),
          teamRewards: teamRewards || ethers.BigNumber.from(0)
        });

        setError(null);
      } catch (err) {
        console.error('Error initializing referral tree:', err);
        setError('加载推荐系统数据失败');
      }
    } catch (err) {
      console.error('Error initializing referral tree:', err);
      if (err.message.includes('Contract not deployed')) {
        setError('推荐系统合约未部署，请联系管理员');
      } else if (err.code === 'CALL_EXCEPTION') {
        setError('无法读取推荐关系数据，请确认合约地址是否正确');
      } else {
        setError(`加载推荐系统失败: ${err.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    init();
  }, [account, provider]);

  const bindReferrer = async (referrerAddress) => {
    if (!account || !provider) return;
    try {
      const signer = provider.getSigner();
      const contract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);
      await contract.bindReferrer(account, referrerAddress);
      // 重新加载数据
      init();
    } catch (err) {
      console.error('Error binding referrer:', err);
      setError('绑定推荐人失败');
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64 text-red-400">
        {error}
      </div>
    );
  }

  if (!account || !provider) {
    return (
      <div className="flex items-center justify-center h-64 text-gray-400">
        请先连接钱包
      </div>
    );
  }

  const formatAddress = (address) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`;
  };

  const copyToClipboard = async (text) => {
    try {
      await navigator.clipboard.writeText(text);
      // 这里可以添加一个提示，比如使用 toast
      console.log('已复制到剪贴板');
    } catch (err) {
      console.error('复制失败:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* 邀请信息 */}
      <div className="bg-gray-800/50 rounded-lg p-4">
        <div className="text-gray-400 text-sm mb-2">我的邀请链接</div>
        <div className="flex items-center gap-2">
          <div className="flex-1 text-sm text-green-400 bg-gray-800/30 p-3 rounded break-all select-all">
            {window.location.origin + '/#/nft-mining?referrer=' + account}
          </div>
          <button
            onClick={() => copyToClipboard(window.location.origin + '/#/nft-mining?referrer=' + account)}
            className="px-4 py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors whitespace-nowrap"
          >
            复制链接
          </button>
        </div>
        <div className="mt-4 text-xs text-gray-500">
          分享此链接给好友，好友通过此链接访问并绑定你作为推荐人
        </div>
      </div>

      {/* 绑定推荐人 */}
      {!stats?.hasReferrer && (
        <div className="bg-gray-800/50 rounded-lg p-4">
          <div className="text-gray-400 text-sm mb-2">绑定推荐人</div>
          {new URLSearchParams(window.location.search).get('referrer') ? (
            <button
              onClick={() => bindReferrer(new URLSearchParams(window.location.search).get('referrer'))}
              className="w-full py-2 bg-green-500/20 text-green-400 rounded hover:bg-green-500/30 transition-colors"
            >
              确认绑定推荐人
            </button>
          ) : (
            <div className="text-xs text-gray-500">
              通过推荐人的邀请链接访问此页面，即可绑定推荐人
            </div>
          )}
        </div>
      )}

      {/* 推荐统计 */}
      {stats && (
        <div className="grid grid-cols-1 gap-4 p-4 bg-gray-800/50 rounded-lg">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-gray-400 text-sm">直推人数</div>
              <div className="text-xl font-bold text-green-400">{stats.directCount}</div>
            </div>
            <div className="text-center">
              <div className="text-gray-400 text-sm">团队人数</div>
              <div className="text-xl font-bold text-blue-400">{stats.teamCount}</div>
            </div>
          </div>
          
          {stats.hasReferrer && stats.referrer && (
            <div className="border-t border-gray-700 pt-4">
              <div className="text-gray-400 text-sm mb-2">我的推荐人</div>
              <div className="text-sm text-blue-400 bg-gray-800/30 p-2 rounded">
                {formatAddress(stats.referrer)}
              </div>
            </div>
          )}
          
          {stats.directReferrals && stats.directReferrals.length > 0 && (
            <div className="border-t border-gray-700 pt-4">
              <div className="text-gray-400 text-sm mb-2">我的直推</div>
              <div className="space-y-2">
                {stats.directReferrals.map((address, index) => (
                  <div key={address} className="text-sm text-green-400 bg-gray-800/30 p-2 rounded flex justify-between items-center">
                    <span>{index + 1}.</span>
                    <span>{formatAddress(address)}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

ReferralTree.propTypes = {
  account: PropTypes.string.isRequired,
  provider: PropTypes.object.isRequired
};

export default ReferralTree;
