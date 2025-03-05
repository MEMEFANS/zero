import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useParams } from 'react-router-dom';
import { LanguageContext } from '../../App';
import { injected } from '../../utils/connectors';
import { ethers } from 'ethers';
import { REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, NFT_MINING_ADDRESS } from '../../constants/contracts';
import MiningBackground from './components/MiningBackground';
import GlobalStats from './components/GlobalStats';
import { NFTStatusCard, RevenueStatsCard } from './components/StatusCards';
import NFTList from './components/NFTList';
import { useMiningStats } from './hooks/useMiningStats';
import { toast } from 'react-toastify';
import './styles/mining.css';

const NFTMining = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const { referrer: urlReferrer } = useParams();
  const { stats, isLoading, error, loadMiningData } = useMiningStats(account, library);
  const [nfts, setNfts] = useState([]);
  const [notification, setNotification] = useState({ show: false, type: '', message: '', loading: false });
  const [referrerInput, setReferrerInput] = useState('');

  // 从 NFTList 组件获取 NFTs 数据
  const handleNFTsLoaded = (loadedNfts) => {
    setNfts(loadedNfts);
  };

  // 显示通知
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message, loading: false });
    setTimeout(() => {
      setNotification({ show: false, type: '', message: '', loading: false });
    }, 3000);
  };

  // 处理推荐人绑定
  useEffect(() => {
    const bindReferrer = async () => {
      if (!account || !library || !urlReferrer) return;

      try {
        const signer = library.getSigner();
        const referralContract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);

        // 检查是否已经有推荐人
        const hasRef = await referralContract.hasReferrer(account);
        if (hasRef) {
          console.log('User already has a referrer');
          return;
        }

        if (window.confirm(`检测到推荐人地址：${urlReferrer}\n是否将其设置为您的推荐人？`)) {
          // 检查推荐人地址是否有效
          if (!ethers.utils.isAddress(urlReferrer)) {
            showNotification('error', '无效的推荐人地址');
            return;
          }

          // 检查是否是自己
          if (urlReferrer.toLowerCase() === account.toLowerCase()) {
            showNotification('error', '不能将自己设为推荐人');
            return;
          }

          // 绑定推荐人
          const tx = await referralContract.bindReferrer(account, urlReferrer);
          await tx.wait();
          showNotification('success', '推荐人绑定成功');
        }
      } catch (error) {
        console.error('绑定推荐人失败:', error);
        showNotification('error', '绑定推荐人失败');
      }
    };

    bindReferrer();
  }, [account, library, urlReferrer]);

  // 绑定推荐人
  const bindReferrer = async () => {
    if (!account || !library || !referrerInput) {
      toast.error('请输入推荐码');
      return;
    }

    try {
      // 检查推荐人地址是否有效
      if (!ethers.utils.isAddress(referrerInput)) {
        toast.error('无效的推荐码');
        return;
      }

      // 检查是否是自己
      if (referrerInput.toLowerCase() === account.toLowerCase()) {
        toast.error('不能将自己设为推荐人');
        return;
      }

      const signer = library.getSigner();
      const referralContract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer);

      // 检查是否已经有推荐人
      const hasRef = await referralContract.hasReferrer(account);
      if (hasRef) {
        toast.error('您已经有推荐人了');
        return;
      }

      // 绑定推荐人
      const tx = await referralContract.bindReferrer(account, referrerInput);
      await tx.wait();
      toast.success('推荐人绑定成功');
      loadMiningData(); // 刷新数据
    } catch (error) {
      console.error('绑定推荐人失败:', error);
      toast.error('绑定推荐人失败: ' + (error.data?.message || error.message));
    }
  };

  // 连接钱包
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('连接钱包失败:', error);
    }
  };

  return (
    <div className="relative min-h-screen">
      <MiningBackground />
      
      <div className="relative z-10 container mx-auto px-4 pt-20">
        {!active ? (
          <div className="flex justify-center items-center min-h-[60vh]">
            <button
              onClick={connectWallet}
              className="bg-gradient-to-r from-blue-500 to-purple-500 text-white px-6 py-3 rounded-lg shadow-lg hover:from-blue-600 hover:to-purple-600 transition duration-300"
            >
              {t('connectWallet')}
            </button>
          </div>
        ) : (
          <div className="space-y-8">
            <GlobalStats stats={stats} />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <NFTStatusCard stats={stats} nfts={nfts} />
              <RevenueStatsCard stats={stats} />
            </div>

            {/* 推荐系统卡片 */}
            <div className="bg-gray-800 p-4 rounded-lg">
              <h2 className="text-xl font-bold text-green-400 mb-4">推荐系统</h2>
              <div className="space-y-4">
                {!stats.referrer ? (
                  <div className="flex items-center space-x-2">
                    <input
                      type="text"
                      value={referrerInput}
                      onChange={(e) => setReferrerInput(e.target.value)}
                      placeholder="请输入推荐码"
                      className="flex-1 bg-gray-700 text-green-400 px-3 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                    />
                    <button
                      onClick={bindReferrer}
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors"
                    >
                      绑定
                    </button>
                  </div>
                ) : (
                  <div className="flex justify-between items-center">
                    <span className="text-green-400">推荐人</span>
                    <span className="text-green-400">{stats.referrer}</span>
                  </div>
                )}
                <div className="flex justify-between items-center">
                  <span className="text-green-400">推荐码</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-green-400">{account}</span>
                    <button
                      onClick={() => {
                        navigator.clipboard.writeText(account);
                        toast.success('推荐码已复制');
                      }}
                      className="text-sm text-blue-500 hover:text-blue-400"
                    >
                      复制
                    </button>
                  </div>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">直推收益</span>
                  <span className="text-green-400">{stats.directIncome} ZONE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">团队收益</span>
                  <span className="text-green-400">{stats.teamIncome || '0.0000'} ZONE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-green-400">已邀请</span>
                  <span className="text-green-400">{stats.directCount} 人</span>
                </div>
              </div>
            </div>

            <NFTList onNFTsLoaded={handleNFTsLoaded} />
          </div>
        )}

        {notification.show && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg ${
            notification.type === 'error' ? 'bg-red-500' : 'bg-green-500'
          } text-white`}>
            {notification.message}
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTMining;
