import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';

// IDO合约ABI
const IDO_ABI = [
  "function invest() external payable",
  "function bindReferrer(address referrer) external",
  "function getUserReferrer(address user) external view returns (address)",
  "function projectWallet() external view returns (address)",
  "function referralPercentage() external view returns (uint256)",
  "function paused() external view returns (bool)",
  "function isUserBound(address user) external view returns (bool)",
  "function userReferrers(address) external view returns (address)",
  "function referrerUsers(address, uint256) external view returns (address)"
];

// IDO合约地址 - BSC主网
const IDO_CONTRACT_ADDRESS = "0x342b119B3329e244df1Da8D8c9AaCaAFD3E9Ff4c";

const IDO = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [amount, setAmount] = useState('');
  const [userContribution, setUserContribution] = useState(0);
  const [expectedTokens, setExpectedTokens] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const [referrer, setReferrer] = useState(null);
  const [contract, setContract] = useState(null);
  const [userReferrer, setUserReferrer] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);

  const idoInfo = {
    totalSupply: 100000000,
    privateSale: {
      amount: 10000000,
      bnbTarget: 769.23,
      dpapPerBNB: 13000,
      minContribution: 0.1,
      maxContribution: 2
    },
    startTime: '2025-02-20 20:00:00',
    endTime: '2025-02-28 20:00:00'
  };

  // 显示通知
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 5000);
  };

  // 初始化合约
  useEffect(() => {
    if (library && active) {
      const signer = library.getSigner();
      const idoContract = new ethers.Contract(IDO_CONTRACT_ADDRESS, IDO_ABI, signer);
      setContract(idoContract);
    }
  }, [library, active]);

  // 获取URL中的推荐人地址
  useEffect(() => {
    const queryParams = new URLSearchParams(window.location.search);
    const ref = queryParams.get('ref');
    if (ref && ethers.utils.isAddress(ref)) {
      setReferrer(ref);
    }
  }, []);

  // 获取总筹集量
  const fetchTotalRaised = async () => {
    try {
      if (!contract) return;
      const provider = new ethers.providers.JsonRpcProvider('https://bsc-dataseed.binance.org');
      const balance = await provider.getBalance(IDO_CONTRACT_ADDRESS);
      setTotalRaised(parseFloat(ethers.utils.formatEther(balance)));
    } catch (error) {
      console.error('获取总筹集量失败:', error);
    }
  };

  // 定期更新总筹集量
  useEffect(() => {
    fetchTotalRaised();
    const interval = setInterval(fetchTotalRaised, 15000);
    return () => clearInterval(interval);
  }, [contract]);

  // 初始化时检查用户是否已有绑定的推荐人
  useEffect(() => {
    const checkUserReferrer = async () => {
      if (contract && account) {
        try {
          const referrer = await contract.getUserReferrer(account);
          if (referrer !== ethers.constants.AddressZero) {
            setUserReferrer(referrer);
          }
        } catch (error) {
          console.error('获取用户推荐人失败:', error);
        }
      }
    };
    
    checkUserReferrer();
  }, [contract, account]);

  // 处理推荐人绑定
  const handleReferrerBinding = async () => {
    if (!contract || !account || !referrer) return;

    try {
      setIsLoading(true);
      
      // 检查是否已经绑定过推荐人
      const currentReferrer = await contract.getUserReferrer(account);
      if (currentReferrer !== ethers.constants.AddressZero) {
        showNotification('error', '您已经绑定了推荐人');
        return;
      }

      // 绑定推荐人
      const tx = await contract.bindReferrer(referrer);
      showNotification('info', '正在绑定推荐人...');
      
      await tx.wait();
      setUserReferrer(referrer);
      showNotification('success', '推荐人绑定成功！');
      
    } catch (error) {
      console.error('绑定推荐人失败:', error);
      showNotification('error', error.message || '绑定失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件加载时检查URL中的推荐人并尝试绑定
  useEffect(() => {
    const bindReferrerFromURL = async () => {
      if (contract && account && referrer && !userReferrer) {
        try {
          await handleReferrerBinding();
        } catch (error) {
          console.error('自动绑定推荐人失败:', error);
        }
      }
    };

    bindReferrerFromURL();
  }, [contract, account, referrer]);

  // 处理用户参与
  const handleContribute = async () => {
    if (!active || !account) {
      showNotification('error', t('pleaseConnect'));
      return;
    }

    if (!contract) {
      showNotification('error', '合约未初始化');
      return;
    }

    const bnbAmount = parseFloat(amount);
    if (isNaN(bnbAmount) || bnbAmount < idoInfo.privateSale.minContribution || bnbAmount > idoInfo.privateSale.maxContribution) {
      showNotification('error', t('invalidAmount').replace('{min}', idoInfo.privateSale.minContribution).replace('{max}', idoInfo.privateSale.maxContribution));
      return;
    }

    try {
      setIsLoading(true);
      
      // 调用合约invest函数，不再需要传入推荐人地址
      const tx = await contract.invest({
        value: ethers.utils.parseEther(amount)
      });

      showNotification('info', '交易已发送，等待确认...');
      console.log('Transaction hash:', tx.hash);

      await tx.wait();
      showNotification('success', '投资成功！');

      // 更新显示
      setUserContribution(prev => prev + bnbAmount);
      setExpectedTokens(prev => prev + (bnbAmount * idoInfo.privateSale.dpapPerBNB));
      setAmount('');

      // 更新总筹集量
      await fetchTotalRaised();

    } catch (error) {
      console.error('投资失败:', error);
      showNotification('error', error.message || '交易失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 连接钱包函数
  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Failed to connect wallet:', error);
    }
  };

  // 生成推荐链接
  const generateReferralLink = () => {
    if (!account) return '';
    return `${window.location.origin}?ref=${account}`;
  };

  // 复制推荐链接
  const copyReferralLink = () => {
    const link = generateReferralLink();
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#0B1120] relative overflow-hidden">
      {/* 背景效果 */}
      <div className="absolute inset-0">
        {/* 网格线 */}
        <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
          {[...Array(96)].map((_, i) => (
            <div key={i} className="border-[0.5px] border-green-500/5"></div>
          ))}
        </div>
        {/* 顶部光晕 */}
        <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-green-500/10 to-transparent"></div>
      </div>

      {/* 通知弹窗 */}
      {notification.show && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotification({ show: false, type: '', message: '' })}></div>
          <div className={`
            relative rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4
            ${notification.type === 'success'
              ? 'bg-green-500/10 border-2 border-green-500/20'
              : 'bg-red-500/10 border-2 border-red-500/20'
            }
            backdrop-blur-xl animate-fade-in
          `}>
            <div className="flex items-center gap-4">
              <div className={`
                w-12 h-12 rounded-full flex items-center justify-center
                ${notification.type === 'success'
                  ? 'bg-green-500/20 text-green-400'
                  : 'bg-red-500/20 text-red-400'
                }
              `}>
                {notification.type === 'success' ? (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                  </svg>
                ) : (
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                )}
              </div>
              <div>
                <h3 className={`text-xl font-bold mb-1 ${notification.type === 'success' ? 'text-green-400' : 'text-red-400'}`}>
                  {notification.type === 'success' ? t('transactionSuccess') : t('transactionFailed')}
                </h3>
                <p className="text-gray-300">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', message: '' })}
              className={`
                mt-6 w-full py-3 rounded-lg font-semibold transition-all
                ${notification.type === 'success'
                  ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                  : 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                }
              `}
            >
              确定
            </button>
          </div>
        </div>
      )}

      <div className="relative container mx-auto px-4 py-16">
        {/* 标题区域 */}
        <div className="text-center mb-16">
          <h1 className="text-6xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-6">
            {t('idoTitle')}
          </h1>
          <div className="flex flex-col md:flex-row items-center justify-center gap-3 md:gap-6 text-base md:text-xl">
            <div className="w-full md:w-auto bg-gray-800/50 backdrop-blur px-4 md:px-6 py-3 rounded-full border border-green-500/20">
              <span className="text-green-400">{t('totalSupply')}: </span>
              <span className="text-white">{t('oneHundredMillion')} <span className="text-green-400">ZONE</span></span>
            </div>
            <div className="w-full md:w-auto bg-gray-800/50 backdrop-blur px-4 md:px-6 py-3 rounded-full border border-green-500/20">
              <span className="text-green-400 mr-2">⏰</span>
              <span className="text-white text-sm md:text-base whitespace-nowrap">{idoInfo.startTime} - {idoInfo.endTime}</span>
            </div>
          </div>
        </div>

        {/* 主内容区域 */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-green-500/20 overflow-hidden">
            {/* 我的参与信息 */}
            {active && (
              <div className="bg-gray-900/50 rounded-2xl p-6 mb-8">
                <h2 className="text-2xl font-bold text-green-400 mb-6">{t('myParticipation')}</h2>
                <div className="grid grid-cols-2 gap-6">
                  <div>
                    <p className="text-gray-400 text-sm mb-2">{t('participatedAmount')}</p>
                    {isLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-700 rounded w-32"></div>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white">
                        {userContribution.toFixed(2)} <span className="text-green-400">BNB</span>
                      </p>
                    )}
                  </div>
                  <div>
                    <p className="text-gray-400 text-sm mb-2">{t('expectedToReceive')}</p>
                    {isLoading ? (
                      <div className="animate-pulse">
                        <div className="h-8 bg-gray-700 rounded w-32"></div>
                      </div>
                    ) : (
                      <p className="text-3xl font-bold text-white">
                        {expectedTokens.toFixed(2)} <span className="text-green-400">ZONE</span>
                      </p>
                    )}
                  </div>
                </div>
              </div>
            )}

            <div className="p-4 md:p-8">
              {/* IDO信息网格 */}
              <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6 md:mb-8">
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('totalIssuance')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">{t('oneHundredMillion')} <span className="text-green-400">ZONE</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('privateSaleAmount')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">{t('tenMillion')} <span className="text-green-400">ZONE</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('raisedAmount')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">{totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-green-400">BNB</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('exchangeRate')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">1 BNB = <span className="text-green-400">13,000 ZONE</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('privateSalePrice')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">≈ <span className="text-green-400">0.05U</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('participationLimit')}</p>
                  <div>
                    <p className="text-base md:text-xl font-bold text-white">
                      <span className="text-green-400">0.1</span> - <span className="text-green-400">2</span> BNB
                    </p>
                    <p className="text-xs md:text-sm text-gray-400 mt-1">1,300 - 26,000 ZONE</p>
                  </div>
                </div>
              </div>

              {/* 参与表单 */}
              {!active ? (
                <button
                  onClick={connectWallet}
                  className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-6 rounded-xl hover:from-green-600 hover:to-green-700 transition-all text-lg"
                >
                  {t('connectWalletToParticipate')}
                </button>
              ) : (
                <div className="space-y-6">
                  <div className="bg-gray-900/50 rounded-2xl p-6">
                    <label className="block text-gray-400 text-sm mb-3">
                      {t('enterParticipationAmount')}
                    </label>
                    <div className="relative">
                      <input
                        type="number"
                        min={idoInfo.privateSale.minContribution}
                        max={idoInfo.privateSale.maxContribution}
                        step="0.1"
                        value={amount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > idoInfo.privateSale.maxContribution) {
                            setAmount(idoInfo.privateSale.maxContribution.toString());
                          } else {
                            setAmount(e.target.value);
                          }
                        }}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-4 text-white text-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="0.0"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="text-green-400 font-bold text-lg">BNB</span>
                      </div>
                    </div>
                    {amount && (
                      <div className="mt-4 bg-green-500/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">{t('expectedToReceive')}</p>
                        <p className="text-xl font-bold text-green-400">
                          {(parseFloat(amount || 0) * idoInfo.privateSale.dpapPerBNB).toLocaleString()} ZONE
                        </p>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-center mt-8">
                    <button
                      onClick={handleContribute}
                      disabled={isLoading}
                      className={`
                        w-full py-4 px-6 rounded-xl text-lg font-bold transition-all
                        ${isLoading
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white'
                        }
                      `}
                    >
                      {isLoading ? t('processing') : 'Mint'}
                    </button>
                  </div>

                  <div className="mt-8 pt-8 border-t border-[#2E3A52]">
                    <h3 className="text-xl font-semibold text-white mb-4 flex items-center gap-2">
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-yellow-500" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M5 2a1 1 0 011 1v1h1a1 1 0 010 2H6v1a1 1 0 01-2 0V6H3a1 1 0 010-2h1V3a1 1 0 011-1zm0 10a1 1 0 011 1v1h1a1 1 0 110 2H6v1a1 1 0 11-2 0v-1H3a1 1 0 110-2h1v-1a1 1 0 011-1zM12 2a1 1 0 01.967.744L14.146 7.2 17.5 9.134a1 1 0 010 1.732l-3.354 1.935-1.18 4.455a1 1 0 01-1.933 0L9.854 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" clipRule="evenodd" />
                      </svg>
                      {t('referralReward')}
                    </h3>
                    <div className="flex items-center gap-3">
                      <input 
                        type="text" 
                        value={account ? generateReferralLink() : t('pleaseConnectWallet')}
                        readOnly
                        className="flex-1 bg-[#0B1120] text-gray-300 px-4 py-3 rounded-lg border border-[#2E3A52] focus:outline-none"
                      />
                      <button
                        onClick={copyReferralLink}
                        disabled={!account}
                        className={`px-6 py-3 rounded-lg font-medium transition-all duration-200 ${
                          copySuccess 
                            ? 'bg-green-600 hover:bg-green-700' 
                            : 'bg-[#3B82F6] hover:bg-[#2563EB]'
                        } ${!account && 'opacity-50 cursor-not-allowed'}`}
                      >
                        {copySuccess ? (
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                            </svg>
                            {t('copied')}
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                              <path d="M8 2a1 1 0 000 2h2a1 1 0 100-2H8z" />
                              <path d="M3 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v6h-4.586l1.293-1.293a1 1 0 00-1.414-1.414l-3 3a1 1 0 000 1.414l3 3a1 1 0 001.414-1.414L10.414 13H15v3a2 2 0 01-2 2H5a2 2 0 01-2-2V5zM15 11h2a1 1 0 110 2h-2v-2z" />
                            </svg>
                            {t('copyLink')}
                          </div>
                        )}
                      </button>
                    </div>
                    <p className="mt-4 text-sm text-gray-400">
                      {t('referralDescription')}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      {userReferrer && (
        <div className="referrer-info">
          <p>您的推荐人: {userReferrer}</p>
        </div>
      )}
    </div>
  );
};

export default IDO;
