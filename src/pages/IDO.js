import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';

const IDO = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [amount, setAmount] = useState('');
  const [userContribution, setUserContribution] = useState(0);
  const [expectedTokens, setExpectedTokens] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '' });
  const receivingAddress = '0x82fa012F68420B7e30Eb48eF321d599343902e11';
  // 改用您的服务器地址
  const API_URL = 'https://api.your-domain.com/api';

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

  // 获取用户的参与记录
  const fetchUserContribution = async () => {
    if (!active || !account) return;
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      
      // 使用 getBalance 检查接收地址的余额
      const balance = await provider.getBalance(receivingAddress);
      console.log('Contract balance:', ethers.utils.formatEther(balance), 'BNB');

      // 获取用户向合约的转账记录
      const filter = {
        fromBlock: 0,
        toBlock: 'latest',
        from: account,
        to: receivingAddress
      };

      const history = await provider.send('eth_getTransactionCount', [account, 'latest']);
      console.log('Transaction count:', history);

      // 获取最近的交易
      const blockNumber = await provider.getBlockNumber();
      const block = await provider.getBlock(blockNumber);
      console.log('Latest block:', blockNumber);
      console.log('Block timestamp:', new Date(block.timestamp * 1000).toLocaleString());

      // 从localStorage获取历史记录
      const previousRecord = localStorage.getItem(`ido_contribution_${account}`);
      let contribution = 0;
      if (previousRecord) {
        const { bnbAmount } = JSON.parse(previousRecord);
        contribution = bnbAmount;
      }
      
      console.log('Current contribution:', contribution, 'BNB');
      
      // 更新状态
      setUserContribution(contribution);
      setExpectedTokens(contribution * idoInfo.privateSale.dpapPerBNB);
      
    } catch (error) {
      console.error('获取参与记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取私募合约地址的BNB余额
  const fetchTotalRaised = async () => {
    try {
      console.log('Fetching total raised...');
      const provider = new ethers.providers.JsonRpcProvider('https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110/');
      const balance = await provider.getBalance(receivingAddress);
      const bnbBalance = parseFloat(ethers.utils.formatEther(balance));
      console.log('Total raised:', bnbBalance, 'BNB');
      setTotalRaised(bnbBalance);
    } catch (error) {
      console.error('获取总筹集量失败:', error);
    }
  };

  // 在组件加载时获取总筹集量
  useEffect(() => {
    const init = async () => {
      await fetchTotalRaised();
    };
    init();
  }, []);

  // 每15秒自动刷新总筹集量
  useEffect(() => {
    const interval = setInterval(async () => {
      await fetchTotalRaised();
    }, 15000);
    return () => clearInterval(interval);
  }, []);

  // 处理用户参与
  const handleContribute = async () => {
    if (!active || !account) {
      showNotification('error', t('pleaseConnect'));
      return;
    }

    const bnbAmount = parseFloat(amount);
    if (isNaN(bnbAmount) || bnbAmount < idoInfo.privateSale.minContribution || bnbAmount > idoInfo.privateSale.maxContribution) {
      showNotification('error', t('invalidAmount').replace('{min}', idoInfo.privateSale.minContribution).replace('{max}', idoInfo.privateSale.maxContribution));
      return;
    }

    try {
      setIsLoading(true);
      // 使用window.ethereum直接发送交易
      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: receivingAddress,
          value: '0x' + (bnbAmount * 1e18).toString(16)
        }]
      });

      console.log('Transaction hash:', txHash);

      // 等待交易确认
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const receipt = await provider.waitForTransaction(txHash);
      console.log('Transaction receipt:', receipt);

      if (receipt.status === 1) {
        // 更新用户的参与记录
        const tokenAmount = bnbAmount * idoInfo.privateSale.dpapPerBNB;
        const previousRecord = localStorage.getItem(`ido_contribution_${account}`);
        let newBnbAmount = bnbAmount;
        let newTokenAmount = tokenAmount;
        
        if (previousRecord) {
          const { bnbAmount: prevBnb, tokenAmount: prevToken } = JSON.parse(previousRecord);
          newBnbAmount += prevBnb;
          newTokenAmount += prevToken;
        }

        // 保存到localStorage
        localStorage.setItem(`ido_contribution_${account}`, JSON.stringify({
          bnbAmount: newBnbAmount,
          tokenAmount: newTokenAmount,
          lastTx: txHash
        }));

        // 更新显示
        setUserContribution(newBnbAmount);
        setExpectedTokens(newTokenAmount);
        setAmount('');

        // 等待2秒后刷新总筹集量，确保链上数据已更新
        setTimeout(async () => {
          await fetchTotalRaised();
        }, 2000);

        // 触发重新获取数据
        fetchUserContribution();
        
        // 显示成功消息
        showNotification('success', t('transactionSuccess'));
      }
    } catch (error) {
      console.error('转账失败:', error);
      if (error.code === 4001) {
        showNotification('error', t('transactionCancelled'));
      }
      // 只在用户取消交易时显示错误消息，其他错误不显示
    } finally {
      setIsLoading(false);
    }
  };

  // 在组件加载和账户变化时获取数据
  useEffect(() => {
    if (active && account) {
      fetchUserContribution();
    }
  }, [active, account]);

  // 每30秒自动刷新一次
  useEffect(() => {
    if (active && account) {
      const interval = setInterval(fetchUserContribution, 30000);
      return () => clearInterval(interval);
    }
  }, [active, account]);

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // 显示通知
  const showNotification = (type, message) => {
    setNotification({ show: true, type, message });
    setTimeout(() => setNotification({ show: false, type: '', message: '' }), 3000);
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
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IDO;
