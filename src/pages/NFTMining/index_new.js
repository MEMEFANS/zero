import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { LanguageContext } from '../../App';
import { injected } from '../../utils/connectors';
import MiningBackground from './components/MiningBackground';
import GlobalStats from './components/GlobalStats';
import { NFTStatusCard, RevenueStatsCard, DirectStatusCard } from './components/StatusCards';
import InviteCode from './components/InviteCode';
import NFTList from './components/NFTList';
import InviteModal from './components/InviteModal';
import { useMiningStats } from './hooks/useMiningStats';
import { useNFTData } from './hooks/useNFTData';
import toast from 'react-hot-toast';
import { useParams } from 'react-router-dom';
import { ethers } from 'ethers';
import { REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI } from '../../constants';

const NFTMining = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const { referrer: urlReferrer } = useParams();  // 从 URL 获取推荐人地址
  const { stats, loadMiningData } = useMiningStats(account, library);
  const { 
    nfts, 
    isLoading, 
    error, 
    stakeNFT, 
    unstakeNFT, 
    claimReward 
  } = useNFTData(account, library);

  const [showReferrerModal, setShowReferrerModal] = useState(false);
  const [referrerInput, setReferrerInput] = useState(urlReferrer || '');
  const [selectedNFTId, setSelectedNFTId] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '', loading: false });

  // 显示通知的函数
  const showNotification = (type, message, loading = false) => {
    setNotification({ show: true, type, message, loading });
    if (!loading) {
      setTimeout(() => setNotification({ show: false, type: '', message: '', loading: false }), 5000);
    }
  };

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
      showNotification('error', '连接钱包失败');
    }
  };

  const handleStakeWithReferrer = async (nftId) => {
    setSelectedNFTId(nftId);
    setShowReferrerModal(true);
  };

  const handleStakeConfirm = async (useReferrer = false) => {
    if (!selectedNFTId) return;
    
    try {
      setIsSubmitting(true);
      showNotification('info', '处理中...', true);

      await stakeNFT(selectedNFTId, useReferrer ? referrerInput : '');
      
      setShowReferrerModal(false);
      setReferrerInput(urlReferrer || '');
      setSelectedNFTId(null);
      showNotification('success', '质押成功！');
    } catch (error) {
      console.error('质押失败:', error);
      showNotification('error', '质押失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUnstake = async (nftId) => {
    try {
      setIsSubmitting(true);
      showNotification('info', '处理中...', true);
      
      await unstakeNFT(nftId);
      showNotification('success', '解除质押成功！');
    } catch (error) {
      console.error('解除质押失败:', error);
      showNotification('error', '解除质押失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClaim = async (nftId) => {
    try {
      setIsSubmitting(true);
      showNotification('info', '处理中...', true);
      
      await claimReward(nftId);
      showNotification('success', '领取奖励成功！');
    } catch (error) {
      console.error('领取奖励失败:', error);
      showNotification('error', '领取奖励失败: ' + (error.message || '未知错误'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // 检查并自动绑定推荐人
  useEffect(() => {
    const checkAndBindReferrer = async () => {
      if (!account || !library || !urlReferrer) return;

      try {
        const referralContract = new ethers.Contract(
          REFERRAL_REGISTRY_ADDRESS,
          REFERRAL_REGISTRY_ABI,
          library.getSigner()
        );

        // 检查是否已经有推荐人
        const currentReferrer = await referralContract.getUserReferrer(account);
        
        if (currentReferrer === ethers.constants.AddressZero && 
            urlReferrer && 
            ethers.utils.isAddress(urlReferrer) &&
            urlReferrer.toLowerCase() !== account.toLowerCase()) {
          
          // 弹出确认框
          if (window.confirm(`检测到推荐人地址：${urlReferrer}\n是否将其设置为您的推荐人？`)) {
            setIsSubmitting(true);
            showNotification('info', '正在绑定推荐人...', true);
            
            try {
              const tx = await referralContract.bindReferrer(account, urlReferrer, {
                gasLimit: 300000
              });
              await tx.wait();
              showNotification('success', '推荐人绑定成功！');
            } catch (error) {
              console.error('绑定推荐人失败:', error);
              showNotification('error', '绑定推荐人失败: ' + (error.message || '未知错误'));
            } finally {
              setIsSubmitting(false);
            }
          }
        }
      } catch (error) {
        console.error('检查推荐人失败:', error);
      }
    };

    checkAndBindReferrer();
  }, [account, library, urlReferrer]);

  if (!active) {
    return (
      <div className="min-h-screen bg-[#0B1120] relative overflow-hidden flex items-center justify-center">
        <MiningBackground />
        <div className="relative text-center">
          <h1 className="text-4xl font-bold text-green-400 mb-8">{t('connectWalletTitle')}</h1>
          <button
            onClick={connectWallet}
            className="bg-gradient-to-r from-green-500 to-green-600 text-white font-medium py-3 px-8 rounded-lg hover:from-green-600 hover:to-green-700 transition-all"
          >
            {t('connectWallet')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0B1120] relative overflow-hidden">
      <MiningBackground />
      
      <div className="container mx-auto px-4 py-8 relative z-10">
        {/* 通知提示 */}
        {notification.show && (
          <div className={`fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 ${
            notification.type === 'success' ? 'bg-green-500' :
            notification.type === 'error' ? 'bg-red-500' :
            'bg-blue-500'
          } text-white`}>
            <div className="flex items-center">
              {notification.loading && (
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
              )}
              <span>{notification.message}</span>
            </div>
          </div>
        )}

        {/* NFT 列表 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {nfts.map((nft) => (
            <div key={nft.id} className="bg-gray-800 p-4 rounded-lg">
              <img src={nft.image} alt={`NFT #${nft.id}`} className="w-full rounded-lg mb-4" />
              <div className="text-white">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-lg font-bold">#{nft.id}</span>
                  <span className={`px-2 py-1 rounded ${nft.type === 'Common' ? 'bg-blue-500' : nft.type === 'Uncommon' ? 'bg-green-500' : 'bg-red-500'}`}>{nft.type}</span>
                </div>
                <div className="space-y-2">
                  <p>算力: {nft.power}</p>
                  <p>每日收益: {nft.dailyReward} ZONE</p>
                  <p>已挖出: {nft.minedAmount} ZONE</p>
                  <p>当前可领取: {nft.currentReward} ZONE</p>
                </div>
                <div className="mt-4 space-y-2">
                  {nft.isStaked ? (
                    <>
                      <button
                        onClick={() => handleUnstake(nft.id)}
                        disabled={isSubmitting}
                        className="w-full bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        解除质押
                      </button>
                      {parseFloat(nft.currentReward) > 0 && (
                        <button
                          onClick={() => handleClaim(nft.id)}
                          disabled={isSubmitting}
                          className="w-full bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:opacity-50"
                        >
                          领取奖励
                        </button>
                      )}
                    </>
                  ) : (
                    <button
                      onClick={() => handleStakeWithReferrer(nft.id)}
                      disabled={isSubmitting}
                      className="w-full bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                    >
                      质押
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 推荐人地址弹窗 */}
        {showReferrerModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-96">
              <h3 className="text-xl text-white font-bold mb-4">输入推荐人地址（可选）</h3>
              <input
                type="text"
                value={referrerInput}
                onChange={(e) => setReferrerInput(e.target.value)}
                placeholder="请输入推荐人地址"
                className="w-full px-4 py-2 rounded bg-gray-700 text-white mb-4"
              />
              <div className="flex space-x-4">
                <button
                  onClick={() => handleStakeConfirm(true)}
                  disabled={isSubmitting || !referrerInput || !ethers.utils.isAddress(referrerInput)}
                  className="flex-1 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
                >
                  使用推荐人
                </button>
                <button
                  onClick={() => handleStakeConfirm(false)}
                  disabled={isSubmitting}
                  className="flex-1 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700 disabled:opacity-50"
                >
                  跳过
                </button>
                <button
                  onClick={() => setShowReferrerModal(false)}
                  className="flex-1 bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  取消
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NFTMining;
