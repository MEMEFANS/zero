import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';

const IDO = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [amount, setAmount] = useState('');
  const [bnbAmount, setBnbAmount] = useState(0);
  const [tokenAmount, setTokenAmount] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', title: '', message: '' });
  const receivingAddress = '0xE2d38187EC26F5d35Cd309898Ef78F12E083De3A';
  const FIST_CONTRACT_ADDRESS = '0xC9882dEF23bc42D53895b8361D0b1EDC7570Bc6A';  // BSC 网络上的 FIST 代币合约地址
  
  // FIST 代币的 ABI，从 BSCScan 获取的标准 BEP20 接口
  const FIST_ABI = [
    "function balanceOf(address owner) view returns (uint256)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
    "function transfer(address to, uint256 amount) returns (bool)",
    "function approve(address spender, uint256 amount) returns (bool)",
    "function allowance(address owner, address spender) view returns (uint256)"
  ];

  // 检查并切换到 BSC 网络
  const switchToBSC = async () => {
    if (!window.ethereum) return;
    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: '0x38' }], // BSC Mainnet chainId
      });
    } catch (switchError) {
      // 如果用户没有添加 BSC 网络，则添加
      if (switchError.code === 4902) {
        try {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [
              {
                chainId: '0x38',
                chainName: 'Binance Smart Chain',
                nativeCurrency: {
                  name: 'BNB',
                  symbol: 'BNB',
                  decimals: 18
                },
                rpcUrls: ['https://bsc-dataseed.binance.org/'],
                blockExplorerUrls: ['https://bscscan.com/']
              }
            ]
          });
        } catch (addError) {
          console.error('添加 BSC 网络失败:', addError);
        }
      }
      console.error('切换到 BSC 网络失败:', switchError);
    }
  };

  // 在组件加载时检查网络
  useEffect(() => {
    if (active) {
      switchToBSC();
    }
  }, [active]);

  // 获取用户的参与记录
  const fetchUserContribution = async () => {
    if (!active || !account) return;
    
    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const fistContract = new ethers.Contract(FIST_CONTRACT_ADDRESS, FIST_ABI, provider);
      
      // 检查 FIST 余额
      const balance = await fistContract.balanceOf(receivingAddress);
      console.log('Contract FIST balance:', ethers.utils.formatEther(balance), 'FIST');

      // 从localStorage获取历史记录
      const previousRecord = localStorage.getItem(`ido_contribution_${account}`);
      let contribution = 0;
      if (previousRecord) {
        const { bnbAmount } = JSON.parse(previousRecord);
        contribution = bnbAmount;
      }
      
      console.log('Current contribution:', contribution, 'FIST');
      
      // 更新状态
      setBnbAmount(contribution);
      setTokenAmount(contribution);  // 1:1 兑换
      
    } catch (error) {
      console.error('获取参与记录失败:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 获取私募合约地址的FIST余额
  const fetchTotalRaised = async () => {
    try {
      console.log('Fetching total raised...');
      const provider = new ethers.providers.JsonRpcProvider('https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110/');
      const fistContract = new ethers.Contract(FIST_CONTRACT_ADDRESS, FIST_ABI, provider);
      const balance = await fistContract.balanceOf(receivingAddress);
      const fistBalance = parseFloat(ethers.utils.formatEther(balance));
      console.log('Total raised:', fistBalance, 'FIST');
      setTotalRaised(fistBalance);
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
      showNotification('error', t('transactionFailed'), t('pleaseConnect'));
      return;
    }

    // 确保在 BSC 网络上
    await switchToBSC();

    const fistAmount = parseFloat(amount);
    if (isNaN(fistAmount) || fistAmount <= 0) {
      showNotification('error', t('transactionFailed'), t('invalidAmount'));
      return;
    }

    // 检查是否是 1000 的整数倍
    if (fistAmount % 1000 !== 0) {
      showNotification('error', t('transactionFailed'), t('amountMustBeMultipleOf1000'));
      return;
    }

    try {
      setIsLoading(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const fistContract = new ethers.Contract(FIST_CONTRACT_ADDRESS, FIST_ABI, signer);
      
      // 检查用户的 FIST 余额
      const balance = await fistContract.balanceOf(account);
      const userBalance = parseFloat(ethers.utils.formatEther(balance));
      
      if (userBalance < fistAmount) {
        showNotification('error', t('transactionFailed'), t('insufficientFISTBalance'));
        setIsLoading(false);
        return;
      }

      // 转换金额为 wei 单位
      const amountInWei = ethers.utils.parseEther(fistAmount.toString());
      
      // 发送 FIST 代币
      const tx = await fistContract.transfer(receivingAddress, amountInWei);
      const receipt = await tx.wait();
      
      console.log('Transaction hash:', receipt.transactionHash);
      
      // 交易发送成功后立即显示成功消息
      showNotification('success', t('transactionSuccess'), '');
      
      // 更新用户的参与记录
      const tokenAmount = fistAmount;  // 1:1 兑换
      const previousRecord = localStorage.getItem(`ido_contribution_${account}`);
      let newBnbAmount = fistAmount;
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
        lastTx: receipt.transactionHash
      }));

      // 更新显示
      setBnbAmount(newBnbAmount);
      setTokenAmount(newTokenAmount);
      setAmount('');

      // 在后台等待交易确认并更新总筹集量
      provider.waitForTransaction(receipt.transactionHash).then(async (receipt) => {
        if (receipt.status === 1) {
          // 等待1秒后刷新总筹集量，确保链上数据已更新
          setTimeout(async () => {
            await fetchTotalRaised();
          }, 1000);
        }
      });

    } catch (error) {
      console.error('参与失败:', error);
      showNotification('error', t('transactionFailed'), t('transactionFailed'));
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
  const showNotification = (type, title, message) => {
    setNotification({ show: true, type, title, message });
    setTimeout(() => setNotification({ show: false, type: '', title: '', message: '' }), 3000);
  };

  const idoInfo = {
    totalSupply: 100000000,
    privateSale: {
      amount: 1000000,
      fistTarget: 1000000,  // 改为与 amount 相同，因为 1:1 兑换
      dpapPerFIST: 1,      // 1 FIST = 1 ZONE
      unitAmount: 1000,    // 每份 1000 FIST
      minContribution: 0.1,
      maxContribution: 2
    },
    startTime: '2025-02-20 20:00:00',
    endTime: '2025-02-28 20:00:00'
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
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotification({ show: false, type: '', title: '', message: '' })}></div>
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
                  {notification.title}
                </h3>
                <p className="text-gray-300">{notification.message}</p>
              </div>
            </div>
            <button
              onClick={() => setNotification({ show: false, type: '', title: '', message: '' })}
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
                        {bnbAmount.toFixed(2)} <span className="text-green-400">FIST</span>
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
                        {tokenAmount.toFixed(2)} <span className="text-green-400">ZONE</span>
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
                  <p className="text-base md:text-2xl font-bold text-white">{t('oneMillion')} <span className="text-green-400">ZONE</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('raisedAmount')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">{totalRaised.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} <span className="text-green-400">FIST</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('exchangeRate')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">1 FIST = <span className="text-green-400">1 ZONE</span></p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('privateSalePrice')}</p>
                  <p className="text-base md:text-2xl font-bold text-white">≈ <span className="text-green-400">0.03</span> USDT</p>
                </div>
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">{t('participationLimit')}</p>
                  <div>
                    <p className="text-base md:text-xl font-bold text-white">
                      <span className="text-green-400">1,000</span> FIST
                    </p>
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
                        value={amount}
                        onChange={(e) => {
                          const value = e.target.value;
                          setAmount(value);
                        }}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-4 text-white text-xl focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        placeholder="1000"
                      />
                      <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center">
                        <span className="text-green-400 font-bold text-lg">FIST</span>
                      </div>
                    </div>
                    {amount && (
                      <div className="mt-4 bg-green-500/10 rounded-xl p-4">
                        <p className="text-gray-400 text-sm">{t('expectedToReceive')}</p>
                        <p className="text-xl font-bold text-green-400">
                          {(parseFloat(amount || 0)).toLocaleString()} ZONE
                        </p>
                        {parseFloat(amount) % 1000 !== 0 && (
                          <p className="text-sm text-red-400 mt-2">{t('amountMustBeMultipleOf1000')}</p>
                        )}
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
