import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { LanguageContext } from '../App';

const Airdrop = () => {
  const { active, account, library } = useWeb3React();
  const { language = 'zh' } = useContext(LanguageContext) || {};
  const translations = {
    'en': {
      title: 'ZONE Token Airdrop',
      rules: 'Eligibility Rules',
      checkEligibility: 'Check Eligibility',
      inputAddress: 'Enter your BSC wallet address',
      placeholder: '0x...',
      checking: 'Checking...',
      checkButton: 'Check Eligibility',
      results: 'Results',
      congratulations: 'Congratulations!',
      allocation: 'Your allocation:',
      confirm: 'Confirm',
      sorry: 'Sorry!',
      holdAmount: 'Hold more than 10,000 Broccoli tokens',
      rewardAmount: 'Eligible addresses will receive 500 ZONE tokens',
      claimOnce: 'Each address can only claim once',
      eventPeriod: 'Event period: March 1, 2025 - July 14, 2025',
      chainRequirement: 'Please ensure your address is on the BSC chain',
      distributionTime: 'Airdrop tokens will be distributed immediately after verification',
      requirementNotMet: 'You do not meet the requirements',
      claimButton: 'Claim Airdrop',
      holdingAmount: 'Current Holdings'
    },
    'ko': {
      title: 'ZONE 토큰 에어드롭',
      rules: '참여 자격',
      checkEligibility: '자격 확인',
      inputAddress: 'BSC 지갑 주소를 입력하세요',
      placeholder: '0x...',
      checking: '확인 중...',
      checkButton: '자격 확인',
      results: '결과',
      congratulations: '축하합니다!',
      allocation: '받을 수 있는 수량:',
      confirm: '확인',
      sorry: '죄송합니다!',
      holdAmount: '브로콜리 토큰 10,000개 이상 보유',
      rewardAmount: '자격이 있는 주소는 500 ZONE 토큰을 받게 됩니다',
      claimOnce: '각 주소는 한 번만 클레임할 수 있습니다',
      eventPeriod: '이벤트 기간: 2025년 3월 1일 - 2025년 7월 14일',
      chainRequirement: '주소가 BSC 체인에 있는지 확인하세요',
      distributionTime: '에어드롭 토큰은 검증 후 즉시 배포됩니다',
      requirementNotMet: '요구 사항을 충족하지 않습니다',
      claimButton: '에어드롭 받기',
      holdingAmount: '보유 수량',
    },
    'zh': {
      title: 'ZONE 代币空投',
      rules: '资格规则',
      checkEligibility: '检查资格',
      inputAddress: '输入您的 BSC 钱包地址',
      placeholder: '0x...',
      checking: '查询中...',
      checkButton: '检查资格',
      results: '查询结果',
      congratulations: '恭喜！',
      allocation: '您的空投数量：',
      confirm: '确定',
      sorry: '抱歉！',
      holdAmount: '持有超过 10,000 枚 Broccoli 代币',
      rewardAmount: '符合条件的地址将获得 500 ZONE 代币',
      claimOnce: '每个地址仅能领取一次空投',
      eventPeriod: '活动时间：2025年3月1日 - 2025年7月14日',
      chainRequirement: '请确保您的地址是 BSC 链上的地址',
      distributionTime: '空投代币将在验证后立即发放',
      requirementNotMet: '您不符合领取条件',
      claimButton: '领取空投',
      holdingAmount: '持有数量',
    }
  };
  const t = translations[language] || translations.zh;

  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [eligible, setEligible] = useState(false);

  // Broccoli 代币合约地址
  const BROCCOLI_CONTRACT = '0x6d5ad1592ed9d6d1df9b93c793ab759573ed6714';
  
  // ERC20 ABI
  const ERC20_ABI = [
    'function balanceOf(address account) view returns (uint256)',
    'function decimals() view returns (uint8)'
  ];

  const RPC_URL = 'https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110/';

  const checkEligibility = async (address) => {
    if (!address || !ethers.utils.isAddress(address)) {
      setResult({ error: '请输入有效的BSC地址' });
      return;
    }

    setLoading(true);
    setResult(null);
    setError(null);

    try {
      // 创建合约实例
      const provider = new ethers.providers.JsonRpcProvider(RPC_URL);
      const contract = new ethers.Contract(BROCCOLI_CONTRACT, ERC20_ABI, provider);

      // 获取代币精度
      const decimals = await contract.decimals();
      console.log('代币精度:', decimals);

      // 查询余额
      const balance = await contract.balanceOf(address);
      const balanceInTokens = parseFloat(ethers.utils.formatUnits(balance, decimals));
      console.log('持有数量:', balanceInTokens);

      // 检查是否满足条件（持有超过10000枚）
      const isEligible = balanceInTokens >= 10000;
      setEligible(isEligible);

      setResult({
        balance: balanceInTokens.toFixed(2),
        eligible: isEligible,
        reward: isEligible ? '500 ZONE' : '0 ZONE'
      });

    } catch (error) {
      console.error('检查资格失败:', error);
      setError('检查资格失败: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const claimAirdrop = async () => {
    try {
      setLoading(true);
      // 这里是领取空投的逻辑
      showMessage(t.notStarted);
    } catch (error) {
      console.error('领取空投失败:', error);
      showMessage(t.claimFailed);
    } finally {
      setLoading(false);
    }
  };

  const checkEligibilityWrapper = async () => {
    if (!address) {
      return;
    }

    if (!ethers.utils.isAddress(address)) {
      handleError(t.invalidAddress);
      return;
    }

    setError(null);
    setResult(null);
    
    try {
      await checkEligibility(address);
    } catch (error) {
      console.error('检查资格失败:', error);
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (message) => {
    setToastMessage(message);
    setShowToast(true);
    setTimeout(() => setShowToast(false), 3000);
  };

  const handleError = (errorMessage) => {
    setError(errorMessage);
    showMessage(errorMessage);
    setLoading(false);
  };

  useEffect(() => {
    checkEligibilityWrapper();
  }, []);

  return (
    <div className="container mx-auto px-4 pt-24 pb-8">
      {showToast && (
        <div className="fixed inset-0 flex items-center justify-center z-50">
          <div className="absolute inset-0 bg-black bg-opacity-30"></div>
          <div className="relative bg-gray-800 rounded-xl p-6 w-[400px]">
            <div className="text-center text-gray-200 text-base mb-6">{toastMessage}</div>
            <div className="flex justify-center">
              <button
                onClick={() => setShowToast(false)}
                className="px-8 py-2 rounded-full bg-[#6B4C95] text-white border-2 border-[#6B4C95] hover:bg-[#553B77]"
              >
                {t.confirm}
              </button>
            </div>
          </div>
        </div>
      )}
      
      <h1 className="text-3xl font-bold text-center text-green-400 mb-8">{t.title}</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-400">{t.rules}</h2>
        <ul className="space-y-2 text-gray-300">
          <li>• {t.holdAmount}</li>
          <li>• {t.rewardAmount}</li>
          <li>• {t.claimOnce}</li>
          <li>• {t.eventPeriod}</li>
          <li>• {t.chainRequirement}</li>
          <li>• {t.distributionTime}</li>
        </ul>
      </div>

      <div className="bg-gray-800 rounded-lg p-6">
        <h2 className="text-xl font-semibold mb-4 text-green-400">{t.checkEligibility}</h2>
        <div className="space-y-4">
          <div>
            <label className="block text-gray-300 mb-2">{t.inputAddress}</label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              className="w-full px-4 py-2 rounded bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-green-400"
              placeholder={t.placeholder}
            />
          </div>
          <button
            onClick={() => checkEligibility(address)}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
          >
            {loading ? t.checking : t.checkButton}
          </button>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-400"></div>
            </div>
            <p className="text-gray-400 text-sm mt-2 text-center">{t.checking}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {result && !loading && !error && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-700/50 rounded">
              <h3 className="text-lg font-medium mb-4 text-white">{t.results}</h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  {t.holdingAmount}: <span className="text-green-400">{result.balance} Broccoli</span>
                </p>
              </div>
            </div>

            {result.eligible && (
              <div className="p-4 bg-green-900/50 border border-green-500 rounded">
                <h3 className="text-lg font-medium mb-2 text-green-400">{t.congratulations}</h3>
                <p className="text-gray-300 mb-4">{t.allocation} <span className="text-green-400">{result.reward}</span></p>
                <div className="flex flex-col space-y-2">
                  <button
                    onClick={claimAirdrop}
                    className="w-full py-3 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {t.claimButton}
                  </button>
                </div>
              </div>
            )}

            {!result.eligible && (
              <div className="p-4 bg-yellow-900/50 border border-yellow-500 rounded">
                <h3 className="text-lg font-medium mb-2 text-yellow-400">{t.sorry}</h3>
                <p className="text-gray-300">{t.requirementNotMet}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default Airdrop;