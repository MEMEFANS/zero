import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { LanguageContext } from '../App';

const Airdrop = () => {
  const { active, account, activate, library } = useWeb3React();
  const { language = 'zh' } = useContext(LanguageContext) || {};
  const translations = {
    'en': {
      title: 'ZONE Token Airdrop',
      rules: 'Eligibility Rules',
      rule1: 'BSC wallet address must be active',
      rule2: 'FIST token balance must exceed 2,000 FIST',
      rule3: 'Eligible addresses will receive 500 ZONE tokens',
      checkEligibility: 'Check Eligibility',
      inputAddress: 'Enter your BSC wallet address',
      placeholder: 'Please enter BSC address',
      checkButton: 'Check Now',
      checking: 'Checking...',
      results: 'Results',
      totalVolume: 'FIST Balance:',
      congratulations: 'Congratulations! You are eligible',
      allocation: 'Your allocation:',
      claimButton: 'Claim Airdrop',
      notStarted: 'Airdrop has not started yet, please try again later',
      claimFailed: 'Claim failed, please try again later',
      invalidAddress: 'Please enter a valid BSC address',
      enterAddress: 'Please enter BSC address',
      confirm: 'Confirm',
      sorry: 'Sorry!',
      requirementNotMet: 'You need at least 2,000 FIST tokens to be eligible for the airdrop'
    },
    'ko': {
      title: 'ZONE 토큰 에어드롭',
      rules: '자격 규칙',
      rule1: 'BSC 지갑 주소가 활성화되어 있어야 합니다',
      rule2: 'FIST 토큰 잔액이 2,000 FIST 이상이어야 합니다',
      rule3: '자격이 있는 주소는 500 ZONE 토큰을 받게 됩니다',
      checkEligibility: '자격 확인',
      inputAddress: 'BSC 지갑 주소 입력',
      placeholder: 'BSC 주소를 입력하세요',
      checkButton: '지금 확인',
      checking: '확인 중...',
      results: '결과',
      totalVolume: 'FIST 잔액:',
      congratulations: '축하합니다! 자격이 있습니다',
      allocation: '할당량:',
      claimButton: '에어드롭 받기',
      notStarted: '에어드롭이 아직 시작되지 않았습니다. 나중에 다시 시도하세요',
      claimFailed: '받기 실패, 나중에 다시 시도하세요',
      invalidAddress: '유효한 BSC 주소를 입력하세요',
      enterAddress: 'BSC 주소를 입력하세요',
      confirm: '확인',
      sorry: '죄송합니다!',
      requirementNotMet: '에어드롭 자격을 얻으려면 2,000 FIST 토큰이 필요합니다'
    },
    'zh': {
      title: 'ZONE 代币空投',
      rules: '资格规则',
      rule1: 'BSC 钱包地址必须处于活跃状态',
      rule2: 'FIST 代币余额必须超过 2,000 FIST',
      rule3: '符合条件的地址将获得 500 个 ZONE 代币',
      checkEligibility: '检查资格',
      inputAddress: '输入您的 BSC 钱包地址',
      placeholder: '0x...',
      checkButton: '立即检查',
      checking: '查询中...',
      results: '查询结果',
      totalVolume: 'FIST 余额：',
      congratulations: '恭喜！您符合空投条件',
      allocation: '您的空投分配是：',
      claimButton: '领取空投',
      notStarted: '空投暂未开始，请稍后再试',
      claimFailed: '领取失败，请稍后重试',
      invalidAddress: '请输入有效的 BSC 地址',
      enterAddress: '0x...',
      confirm: '确定',
      sorry: '抱歉！',
      requirementNotMet: '需要至少 2,000 FIST 代币才能获得空投资格'
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
  const [shouldCheck, setShouldCheck] = useState(false);

  const FIST_CONTRACT = '0xC9882dEF23bc42D53895b8361D0b1EDC7570Bc6A';
  const FIST_ABI = [
    {
      "constant": true,
      "inputs": [{"name": "account","type": "address"}],
      "name": "balanceOf",
      "outputs": [{"name": "","type": "uint256"}],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
    }
  ];

  const BSC_RPC_URLS = [
    'https://bsc-dataseed1.binance.org',
    'https://bsc-dataseed2.binance.org',
    'https://bsc-dataseed3.binance.org',
    'https://bsc-dataseed4.binance.org',
    'https://bsc.nodereal.io'
  ];

  const checkEligibility = async (address) => {
    if (!ethers.utils.isAddress(address)) {
      setError(t.invalidAddress);
      return;
    }

    setLoading(true);
    setError('');
    
    // 尝试不同的 RPC 节点
    for (const rpcUrl of BSC_RPC_URLS) {
      try {
        console.log('Trying RPC:', rpcUrl);
        console.log('Checking address:', address);
        
        const provider = new ethers.providers.JsonRpcProvider(rpcUrl);
        const fistContract = new ethers.Contract(FIST_CONTRACT, FIST_ABI, provider);
        
        console.log('Contract:', FIST_CONTRACT);
        console.log('Getting balance...');
        
        // 获取 FIST 余额
        const balance = await fistContract.balanceOf(address);
        console.log('Raw balance:', balance.toString());
        
        // 使用字符串操作确保精确计算，FIST 代币精度为 6
        const rawBalance = balance.toString();
        const fistBalance = parseFloat(rawBalance.slice(0, -6) + '.' + rawBalance.slice(-6));
        
        console.log('Formatted balance:', fistBalance);
        
        setResult({
          address,
          fistBalance: fistBalance.toLocaleString(undefined, {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          }),
          isEligible: fistBalance >= 2000,
          allocation: fistBalance >= 2000 ? 500 : 0
        });
        
        setLoading(false);
        
        // 如果成功就退出循环
        return;
      } catch (error) {
        console.error('Error with RPC', rpcUrl, ':', error);
        // 继续尝试下一个 RPC
        continue;
      }
    }
    
    // 如果所有 RPC 都失败了
    setError('无法连接到 BSC 网络，请稍后再试');
    setLoading(false);
  };

  const claimAirdrop = async () => {
    try {
      setLoading(true);
      showMessage(t.notStarted);
    } catch (error) {
      console.error('领取空投失败:', error);
      showMessage(t.claimFailed);
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
    let mounted = true;

    const check = async () => {
      if (address && mounted && shouldCheck) {
        await checkEligibility(address);
        setShouldCheck(false);
      }
    };

    check();

    return () => {
      mounted = false;
    };
  }, [address, shouldCheck]);

  const handleCheck = () => {
    if (!address) {
      setError(t.enterAddress);
      return;
    }
    setShouldCheck(true);
  };

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
      
      <h1 className="text-3xl font-bold mb-8 text-green-400 text-center">{t.title}</h1>
      
      <div className="bg-gray-800 rounded-lg p-6 mb-8">
        <h2 className="text-xl font-semibold mb-4 text-green-400">{t.rules}</h2>
        <ul className="space-y-2 text-gray-300">
          <li>• {t.rule1}</li>
          <li>• {t.rule2}</li>
          <li>• {t.rule3}</li>
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
            onClick={handleCheck}
            disabled={loading}
            className="w-full py-3 px-4 bg-green-500 text-white rounded hover:bg-green-600 focus:outline-none focus:ring-2 focus:ring-green-400 disabled:opacity-50"
          >
            {loading ? t.checking : t.checkButton}
          </button>
        </div>

        {loading && (
          <div className="mt-4">
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div 
                className="bg-green-500 h-2.5 rounded-full transition-all duration-500" 
                style={{ width: '100%' }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">{t.checking}</p>
          </div>
        )}

        {error && (
          <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded">
            <p className="text-red-500">{error}</p>
          </div>
        )}

        {result && !loading && (
          <div className="mt-6 space-y-4">
            <div className="p-4 bg-gray-700/50 rounded">
              <h3 className="text-lg font-medium mb-4 text-white">{t.results}</h3>
              <div className="space-y-2">
                <p className="text-gray-300">
                  {t.totalVolume} <span className="text-green-400">{result.fistBalance} FIST</span>
                </p>
              </div>
            </div>

            {result.isEligible && (
              <div className="p-4 bg-green-900/50 border border-green-500 rounded">
                <h3 className="text-lg font-medium mb-2 text-green-400">{t.congratulations}</h3>
                <p className="text-gray-300 mb-4">{t.allocation} <span className="text-green-400">{result.allocation} ZONE Token</span></p>
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

            {!result.isEligible && (
              <div className="p-4 bg-yellow-900/50 border border-yellow-500 rounded">
                <h3 className="text-lg font-medium mb-2 text-yellow-400">{t.sorry}</h3>
                <p className="text-gray-300">{t.requirementNotMet}</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Debug Info */}
      <div className="mt-4 text-xs text-gray-500">
        <p>Loading: {loading.toString()}</p>
        <p>Error: {error}</p>
        <p>Result: {result ? JSON.stringify(result, null, 2) : 'null'}</p>
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-900/50 border border-red-500 rounded">
          <p className="text-red-500">{error}</p>
        </div>
      )}
    </div>
  );
};

export default Airdrop;
