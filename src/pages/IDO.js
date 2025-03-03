import React, { useState, useContext, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { useParams } from 'react-router-dom';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';
import { IDO_DISTRIBUTOR_ADDRESS, REFERRAL_REGISTRY_ADDRESS } from '../constants/contracts';

// IDO合约ABI
const IDO_ABI = [
  "function invest() external payable",
  "function projectWallet() external view returns (address)",
  "function paused() external view returns (bool)",
  "function zoneToken() external view returns (address)",
  "function MIN_INVESTMENT() external view returns (uint256)",
  "function MAX_INVESTMENT() external view returns (uint256)",
  "function EXCHANGE_RATE() external view returns (uint256)",
  "function idoEndTime() external view returns (uint256)",
  "function claimStartTime() external view returns (uint256)",
  "function getIDOInfo() external view returns (uint256 _totalRaised, uint256 _participantsCount, uint256 _averageInvestment)",
  "function getUserInvestment(address user) external view returns (uint256 investmentAmount, uint256 tokenAllocation, bool claimed)",
  "function claimTokens() external",
  "function totalRaisedBNB() external view returns (uint256)",
  "function bindReferrer(address referrer) external"
];

// 推荐系统合约ABI
const REFERRAL_ABI = [
  "function bindReferrer(address user, address referrer) external",
  "function getUserReferrer(address user) external view returns (address)",
  "function hasReferrer(address user) external view returns (bool)",
  "function getReferrerUsers(address referrer) external view returns (address[])",
  "function getDirectReferrals(address user) external view returns (uint256)"
];

const IDO = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const { referrer: urlReferrer } = useParams();
  const [amount, setAmount] = useState('');
  const [userContribution, setUserContribution] = useState(0);
  const [expectedTokens, setExpectedTokens] = useState(0);
  const [totalRaised, setTotalRaised] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ show: false, type: '', message: '', loading: false });
  const [referrer, setReferrer] = useState(null);
  const [contract, setContract] = useState(null);
  const [referralContract, setReferralContract] = useState(null);
  const [userReferrer, setUserReferrer] = useState(null);
  const [copySuccess, setCopySuccess] = useState(false);
  const [hasClaimed, setHasClaimed] = useState(false);
  const [participantsCount, setParticipantsCount] = useState(0);
  const [averageInvestment, setAverageInvestment] = useState(0);
  const [idoStatus, setIdoStatus] = useState({
    endTime: 1742428826,  // 2025-03-18 10:00:26
    claimTime: 1742515226,  // 2025-03-19 10:00:26
    isActive: true,
    isClaimable: false
  });

  // 显示通知的函数
  const showNotification = (type, message, loading = false) => {
    setNotification({ show: true, type, message, loading });
    setTimeout(() => setNotification({ show: false, type: '', message: '', loading: false }), 5000);
  };

  // 检查并处理推荐人绑定
  useEffect(() => {
    const checkAndBindReferrer = async () => {
      if (!contract || !account || !referralContract) {
        console.log('Dependencies not ready:', { contract: !!contract, account: !!account, referralContract: !!referralContract });
        return;
      }

      try {
        console.log('Checking referrer with contracts:', {
          idoAddress: contract.address,
          referralAddress: referralContract.address,
          account: account
        });

        // 检查是否已经绑定过推荐人
        const currentReferrer = await referralContract.getUserReferrer(account);
        console.log('Current referrer:', currentReferrer);
        
        if (currentReferrer === ethers.constants.AddressZero) {
          console.log('User does not have a referrer');
          
          // 使用路由参数中的推荐人地址
          console.log('URL referrer:', urlReferrer);
          
          if (urlReferrer && ethers.utils.isAddress(urlReferrer)) {
            // 检查是否尝试自己推荐自己
            if (urlReferrer.toLowerCase() === account.toLowerCase()) {
              console.log('Cannot refer self');
              showNotification('error', '不能将自己设为推荐人');
              return;
            }

            // 弹出确认框
            if (window.confirm(`检测到推荐人地址：${urlReferrer}\n是否将其设置为您的推荐人？`)) {
              console.log('User confirmed, binding referrer...');
              try {
                setIsLoading(true);
                console.log('Attempting to bind referrer:', {
                  account,
                  urlReferrer,
                  contract: contract.address
                });

                // 先检查是否已经有推荐人
                const hasRef = await referralContract.hasReferrer(account);
                console.log('Has referrer check:', hasRef);
                if (hasRef) {
                  showNotification('error', '您已经有推荐人了');
                  return;
                }

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

                // 检查是否是项目钱包地址
                const projectWallet = await contract.projectWallet();
                if (urlReferrer.toLowerCase() === projectWallet.toLowerCase()) {
                  showNotification('error', '不能将项目钱包设为推荐人');
                  return;
                }

                // 检查合约权限
                try {
                  const AUTHORIZED_ROLE = ethers.utils.keccak256(
                    ethers.utils.toUtf8Bytes('AUTHORIZED_CONTRACT_ROLE')
                  );
                  const hasRole = await referralContract.hasRole(AUTHORIZED_ROLE, contract.address);
                  console.log('Contract authorization check:', {
                    hasRole,
                    idoAddress: contract.address,
                    roleHash: AUTHORIZED_ROLE
                  });
                } catch (error) {
                  console.error('Error checking contract role:', error);
                }

                // 通过 IDO 合约绑定推荐人
                console.log('Calling IDO contract bindReferrer with:', urlReferrer);
                const bindTx = await contract.bindReferrer(urlReferrer, {
                  gasLimit: 500000
                });
                showNotification('info', '等待交易确认...', true);
                console.log('Binding transaction sent:', bindTx.hash);
                
                // 等待交易确认
                const receipt = await bindTx.wait();
                console.log('Transaction receipt:', receipt);

                // 再次检查是否绑定成功
                const newReferrer = await referralContract.getUserReferrer(account);
                console.log('New referrer check:', {
                  expected: urlReferrer.toLowerCase(),
                  actual: newReferrer.toLowerCase()
                });

                if (newReferrer.toLowerCase() === urlReferrer.toLowerCase()) {
                  setUserReferrer(urlReferrer);
                  showNotification('success', '推荐人绑定成功！');
                  console.log('Binding successful');
                } else {
                  throw new Error('Binding verification failed');
                }
              } catch (error) {
                console.error('绑定推荐人失败:', error);
                // 解析错误信息
                let errorMessage = '绑定推荐人失败';
                if (error.message.includes('Already has referrer')) {
                  errorMessage = '您已经有推荐人了';
                } else if (error.message.includes('Cannot refer self')) {
                  errorMessage = '不能将自己设为推荐人';
                } else if (error.message.includes('Circular referral')) {
                  errorMessage = '不能形成循环推荐';
                } else if (error.message.includes('Invalid address')) {
                  errorMessage = '无效的推荐人地址';
                } else if (error.message.includes('user rejected')) {
                  errorMessage = '您取消了交易';
                } else if (error.message.includes('insufficient funds')) {
                  errorMessage = 'BNB余额不足';
                } else if (error.message.includes('Cannot bind project wallet')) {
                  errorMessage = '不能将项目钱包设为推荐人';
                } else if (error.message.includes('execution reverted')) {
                  // 记录详细错误信息
                  console.error('Contract execution error:', {
                    message: error.message,
                    code: error.code,
                    data: error.data,
                    error
                  });
                  errorMessage = '合约执行失败，请查看控制台日志';
                } else {
                  console.error('Unknown error:', {
                    error,
                    message: error.message,
                    code: error.code,
                    data: error.data
                  });
                  errorMessage = '未知错误，请查看控制台日志';
                }
                showNotification('error', errorMessage);
              } finally {
                setIsLoading(false);
              }
            } else {
              console.log('User declined to bind referrer');
            }
          }
        } else {
          console.log('User already has a referrer:', currentReferrer);
          setUserReferrer(currentReferrer);
        }
      } catch (error) {
        console.error('检查推荐人状态失败:', {
          error,
          message: error.message,
          code: error.code,
          data: error.data,
          stack: error.stack
        });
      }
    };

    checkAndBindReferrer();
  }, [contract, account, urlReferrer, referralContract]);

  // 初始化合约
  useEffect(() => {
    console.log('Contract initialization effect running...', { library, active });
    if (library && active) {
      const signer = library.getSigner();
      const idoContract = new ethers.Contract(IDO_DISTRIBUTOR_ADDRESS, IDO_ABI, signer);
      const referralRegistryContract = new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_ABI, signer);
      setContract(idoContract);
      setReferralContract(referralRegistryContract);
      console.log('Contracts initialized');
    }
  }, [library, active]);

  // 处理投资
  const handleContribute = async () => {
    if (!active || !account) {
      showNotification('error', t('pleaseConnect'));
      return;
    }

    if (!contract || !referralContract) {
      showNotification('error', '合约未初始化');
      return;
    }

    if (!idoStatus.isActive) {
      showNotification('error', 'IDO未开始或已结束');
      return;
    }

    const bnbAmount = parseFloat(amount);
    if (isNaN(bnbAmount) || bnbAmount < 0.1 || bnbAmount > 2) {
      showNotification('error', t('invalidAmount').replace('{min}', '0.1').replace('{max}', '2'));
      return;
    }

    try {
      setIsLoading(true);
      
      // 投资
      const tx = await contract.invest({
        value: ethers.utils.parseEther(amount),
        gasLimit: 500000 // 设置足够的 gas 限制
      });

      showNotification('info', '交易已发送，等待确认...', true);
      await tx.wait();
      showNotification('success', '投资成功！');

      // 更新数据
      fetchUserInvestment();
      fetchTotalRaised();
      setAmount('');
    } catch (error) {
      console.error('投资失败:', error);
      if (error.message.includes('insufficient funds')) {
        showNotification('error', '钱包 BNB 余额不足，请确保有足够的 BNB 支付 gas 费用');
      } else {
        showNotification('error', error.message || '交易失败，请重试');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 获取IDO状态
  const fetchIDOStatus = async () => {
    if (!contract) return;
    try {
      // 直接获取各个状态
      const endTime = await contract.idoEndTime();
      const claimTime = await contract.claimStartTime();
      const isPaused = await contract.paused();
      const now = Math.floor(Date.now() / 1000);

      // 计算状态
      const isActive = !isPaused && now <= endTime.toNumber();
      const isClaimable = now >= claimTime.toNumber();

      setIdoStatus({
        endTime: endTime.toNumber(),
        claimTime: claimTime.toNumber(),
        isActive,
        isClaimable
      });

    } catch (error) {
      console.error('获取IDO状态失败:', error);
    }
  };

  // 获取用户投资信息
  const fetchUserInvestment = async () => {
    if (!contract || !account) return;
    try {
      const investment = await contract.getUserInvestment(account);
      setUserContribution(ethers.utils.formatEther(investment.investmentAmount));
      setExpectedTokens(ethers.utils.formatEther(investment.tokenAllocation));
      setHasClaimed(investment.claimed);
    } catch (error) {
      console.error('获取用户投资信息失败:', error);
    }
  };

  // 获取总募集信息
  const fetchTotalRaised = async () => {
    if (!contract) return;
    try {
      const info = await contract.getIDOInfo();
      setTotalRaised(ethers.utils.formatEther(info._totalRaised));
      setParticipantsCount(info._participantsCount.toNumber());
      setAverageInvestment(ethers.utils.formatEther(info._averageInvestment));
    } catch (error) {
      console.error('获取总筹集量失败:', error);
    }
  };

  // 定期更新数据
  useEffect(() => {
    if (contract) {
      fetchIDOStatus();
      fetchTotalRaised();
      if (account) {
        fetchUserInvestment();
      }
      
      const interval = setInterval(() => {
        fetchIDOStatus();
        fetchTotalRaised();
        if (account) {
          fetchUserInvestment();
        }
      }, 15000);
      
      return () => clearInterval(interval);
    }
  }, [contract, account]);

  // 处理代币领取
  const handleClaim = async () => {
    if (!contract || !account) return;
    if (!idoStatus.isClaimable) {
      showNotification('error', '还未到领取时间');
      return;
    }
    if (hasClaimed) {
      showNotification('error', '已经领取过代币');
      return;
    }
    
    try {
      setIsLoading(true);
      const tx = await contract.claimTokens();
      showNotification('info', '正在领取代币...', true);
      await tx.wait();
      showNotification('success', '代币领取成功！');
      setHasClaimed(true);
    } catch (error) {
      console.error('领取代币失败:', error);
      showNotification('error', error.message || '领取失败');
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
    return `${window.location.origin}/mint/${account}`;
  };

  // 复制推荐链接
  const copyReferralLink = () => {
    const link = generateReferralLink();
    navigator.clipboard.writeText(link);
    setCopySuccess(true);
    setTimeout(() => setCopySuccess(false), 2000);
  };

  // 获取URL中的推荐人地址
  useEffect(() => {
    const pathParts = window.location.pathname.split('/');
    const ref = pathParts[2]; // /mint/0x... 中的地址部分
    if (ref && ethers.utils.isAddress(ref)) {
      setReferrer(ref);
    }
  }, []);

  // 添加一个格式化日期的函数
  const formatDate = (timestamp) => {
    if (!timestamp) return 'Loading...';
    const date = new Date(timestamp * 1000);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}/${month}/${day}`;
  };

  // 检查合约中的代币余额和IDO状态
  const checkContractStatus = async () => {
    if (!contract) return;
    try {
      // 1. 获取ZONE代币地址和合约
      const zoneTokenAddress = await contract.zoneToken();
      console.log("ZONE Token Address:", zoneTokenAddress);
      
      const zoneTokenContract = new ethers.Contract(zoneTokenAddress, [
        "function balanceOf(address) view returns (uint256)",
        "function decimals() view returns (uint8)"
      ], library.getSigner());

      // 2. 检查合约中的ZONE余额
      const balance = await zoneTokenContract.balanceOf(IDO_DISTRIBUTOR_ADDRESS);
      const decimals = await zoneTokenContract.decimals();
      console.log("IDO Contract ZONE Balance:", ethers.utils.formatUnits(balance, decimals));

      // 3. 检查IDO状态
      const endTime = await contract.idoEndTime();
      const claimTime = await contract.claimStartTime();
      const isPaused = await contract.paused();
      console.log("IDO Status:", {
        endTime: new Date(endTime.toNumber() * 1000).toLocaleString(),
        claimTime: new Date(claimTime.toNumber() * 1000).toLocaleString(),
        isPaused: isPaused
      });

      // 4. 检查是否暂停
      console.log("Contract Paused:", isPaused);

      // 5. 获取当前总募集量
      const totalRaised = await contract.totalRaisedBNB();
      console.log("Total Raised BNB:", ethers.utils.formatEther(totalRaised));

      return {
        zoneBalance: ethers.utils.formatUnits(balance, decimals),
        isPaused: isPaused,
        totalRaised: ethers.utils.formatEther(totalRaised)
      };

    } catch (error) {
      console.error('检查合约状态失败:', error);
      return null;
    }
  };

  // 检查合约状态并输出详细信息
  const checkDetailedStatus = async () => {
    if (!contract) return;
    try {
      console.log("检查合约状态...");
      
      // 1. 检查 ZONE 代币地址
      const zoneTokenAddress = await contract.zoneToken();
      console.log("ZONE Token 地址:", zoneTokenAddress);
      
      // 2. 检查时间设置
      const endTime = await contract.idoEndTime();
      const claimTime = await contract.claimStartTime();
      console.log("IDO结束时间:", new Date(endTime.toNumber() * 1000).toLocaleString());
      console.log("代币领取时间:", new Date(claimTime.toNumber() * 1000).toLocaleString());

      // 3. 检查投资限制
      const minInvest = await contract.MIN_INVESTMENT();
      const maxInvest = await contract.MAX_INVESTMENT();
      console.log("最小投资额:", ethers.utils.formatEther(minInvest), "BNB");
      console.log("最大投资额:", ethers.utils.formatEther(maxInvest), "BNB");

      // 4. 检查是否暂停
      const isPaused = await contract.paused();
      console.log("合约是否暂停:", isPaused);

      // 5. 获取项目钱包
      const projectWallet = await contract.projectWallet();
      console.log("项目钱包地址:", projectWallet);

    } catch (error) {
      console.error("检查失败:", error);
    }
  };

  // 在组件加载时检查状态
  useEffect(() => {
    if (contract && library) {
      checkContractStatus();
      checkDetailedStatus();
    }
  }, [contract, library]);

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

      {/* 通知组件 */}
      {notification.show && (
        <div className={`fixed top-4 right-4 p-4 rounded-xl shadow-lg z-50 ${
          notification.type === 'success' ? 'bg-[#1A2235] border border-green-500/20' :
          notification.type === 'error' ? 'bg-[#1A2235] border border-red-500/20' :
          'bg-[#1A2235] border border-blue-500/20'
        }`}>
          <div className="flex items-center gap-3">
            {notification.loading ? (
              <div className="w-5 h-5 relative">
                <div className="w-5 h-5 rounded-full border-2 border-blue-500/20 border-t-blue-500 animate-spin"></div>
              </div>
            ) : notification.type === 'success' ? (
              <div className="w-5 h-5 rounded-full bg-green-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-green-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
            ) : notification.type === 'error' ? (
              <div className="w-5 h-5 rounded-full bg-red-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-red-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M6 18L18 6M6 6l12 12"></path>
                </svg>
              </div>
            ) : (
              <div className="w-5 h-5 rounded-full bg-blue-500/20 flex items-center justify-center">
                <svg className="w-3 h-3 text-blue-500" fill="none" strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" viewBox="0 0 24 24" stroke="currentColor">
                  <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
              </div>
            )}
            <span className={`text-sm ${
              notification.type === 'success' ? 'text-green-500' :
              notification.type === 'error' ? 'text-red-500' :
              'text-blue-500'
            }`}>{notification.message}</span>
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
              <span className="text-gray-400 mr-2">⏰</span>
              <span className="text-white">{formatDate(idoStatus.endTime)}</span>
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
              <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
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
                  <p className="text-base md:text-2xl font-bold text-white">1 BNB = <span className="text-green-400">10,000 ZONE</span></p>
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
                    <p className="text-xs md:text-sm text-gray-400 mt-1">1,000 - 20,000 ZONE</p>
                  </div>
                </div>
              </div>

              {/* 统计信息 */}
              <div className="grid grid-cols-2 gap-3 md:gap-6 mb-6">
                {/* 参与人数 */}
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">参与人数</p>
                  <p className="text-base md:text-2xl font-bold text-white">{participantsCount}</p>
                </div>

                {/* 平均投资 */}
                <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                  <p className="text-gray-400 text-xs md:text-sm mb-1 md:mb-2">平均投资</p>
                  <p className="text-base md:text-2xl font-bold text-white">
                    {parseFloat(averageInvestment).toFixed(2)} <span className="text-green-400">BNB</span>
                  </p>
                </div>
              </div>

              {/* 领取代币和推荐链接 */}
              {active && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-6 mb-6">
                  {/* 领取代币按钮 */}
                  <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-xs md:text-sm">代币领取</p>
                      <div className="flex items-center">
                        <span className={`inline-block w-2 h-2 rounded-full mr-2 ${idoStatus.isClaimable ? 'bg-green-400' : 'bg-gray-400'}`}></span>
                        <span className="text-gray-400 text-xs">{idoStatus.isClaimable ? '可领取' : '未开始'}</span>
                      </div>
                    </div>
                    {/* 显示可获得的代币数量 */}
                    <div className="mb-4">
                      <p className="text-gray-400 text-xs md:text-sm mb-1">可获得代币</p>
                      <p className="text-2xl md:text-3xl font-bold">
                        <span className="text-white">{parseFloat(expectedTokens).toLocaleString()}</span>
                        <span className="text-green-400 ml-2">ZONE</span>
                      </p>
                    </div>
                    <button
                      onClick={handleClaim}
                      disabled={isLoading || !idoStatus.isClaimable || hasClaimed}
                      className={`
                        w-full py-4 px-6 rounded-xl text-lg font-bold transition-all
                        ${isLoading || !idoStatus.isClaimable || hasClaimed
                          ? 'bg-gray-600 cursor-not-allowed'
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        }
                        text-white
                      `}
                    >
                      {isLoading ? '处理中...' : hasClaimed ? '已领取' : '领取代币'}
                    </button>
                  </div>

                  {/* 推荐链接 */}
                  <div className="bg-gray-900/50 rounded-xl md:rounded-2xl p-3 md:p-6">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-gray-400 text-xs md:text-sm">推荐链接</p>
                      {copySuccess && (
                        <span className="text-green-400 text-xs">已复制</span>
                      )}
                    </div>
                    <div className="relative">
                      <input
                        type="text"
                        readOnly
                        value={generateReferralLink()}
                        className="w-full bg-gray-800 border-2 border-gray-700 rounded-xl px-4 py-4 text-gray-400 text-sm focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all pr-24"
                      />
                      <button
                        onClick={copyReferralLink}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-green-500/20 hover:bg-green-500/30 text-green-400 px-4 py-2 rounded-lg text-sm font-semibold transition-all"
                      >
                        复制
                      </button>
                    </div>
                    {userReferrer && (
                      <p className="mt-2 text-gray-400 text-xs">
                        您的推荐人: <span className="text-white">{userReferrer.slice(0, 6)}...{userReferrer.slice(-4)}</span>
                      </p>
                    )}
                  </div>
                </div>
              )}

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
                        min={0.1}
                        max={2}
                        step="0.1"
                        value={amount}
                        onChange={(e) => {
                          const value = parseFloat(e.target.value);
                          if (value > 2) {
                            setAmount('2');
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
                          {(parseFloat(amount || 0) * 10000).toLocaleString()} ZONE
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
                          : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
                        }
                        text-white
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
      {userReferrer && (
        <div className="referrer-info">
          <p>您的推荐人: {userReferrer}</p>
        </div>
      )}
    </div>
  );
};

export default IDO;
