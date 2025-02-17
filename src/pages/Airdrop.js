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
      rule1: 'BSC wallet address must be active in the past 6 months',
      rule2: 'Transaction volume must exceed 3,000 USDT',
      rule3: 'Eligible addresses will receive 500 ZONE tokens',
      checkEligibility: 'Check Eligibility',
      inputAddress: 'Enter your BSC wallet address',
      placeholder: 'Please enter BSC address',
      checkButton: 'Check Now',
      checking: 'Checking...',
      results: 'Results',
      totalVolume: 'Total Volume:',
      usdtVolume: 'USDT Volume:',
      bnbVolume: 'BNB Volume:',
      congratulations: 'Congratulations! You are eligible',
      allocation: 'Your allocation:',
      claimButton: 'Claim Airdrop',
      notStarted: 'Airdrop has not started yet, please try again later',
      claimFailed: 'Claim failed, please try again later',
      invalidAddress: 'Please enter a valid BSC address',
      enterAddress: 'Please enter BSC address',
      confirm: 'Confirm',
      sorry: 'Sorry!',
      requirementNotMet: 'You need at least 3,000 USDT transaction volume to be eligible for the airdrop'
    },
    'ko': {
      title: 'ZONE 토큰 에어드롭',
      rules: '자격 규칙',
      rule1: 'BSC 지갑 주소는 지난 6개월 동안 활성 상태여야 합니다',
      rule2: '거래량은 3,000 USDT를 초과해야 합니다',
      rule3: '자격이 있는 주소는 500 ZONE 토큰을 받게 됩니다',
      checkEligibility: '자격 확인',
      inputAddress: 'BSC 지갑 주소 입력',
      placeholder: 'BSC 주소를 입력하세요',
      checkButton: '지금 확인',
      checking: '확인 중...',
      results: '결과',
      totalVolume: '총 거래량:',
      usdtVolume: 'USDT 거래량:',
      bnbVolume: 'BNB 거래량:',
      congratulations: '축하합니다! 자격이 있습니다',
      allocation: '할당량:',
      claimButton: '에어드롭 받기',
      notStarted: '에어드롭이 아직 시작되지 않았습니다. 나중에 다시 시도하세요',
      claimFailed: '받기 실패, 나중에 다시 시도하세요',
      invalidAddress: '유효한 BSC 주소를 입력하세요',
      enterAddress: 'BSC 주소를 입력하세요',
      confirm: '확인',
      sorry: '죄송합니다!',
      requirementNotMet: '에어드롭에 참여하려면 3,000 USDT 이상의 거래량이 필요합니다'
    },
    'zh': {
      title: 'ZONE 代币空投',
      rules: '资格规则',
      rule1: 'BSC 钱包地址在过去 6 个月内必须处于活跃状态',
      rule2: '交易量必须超过 3,000 USDT',
      rule3: '符合条件的地址将获得 500 个 ZONE 代币',
      checkEligibility: '检查资格',
      inputAddress: '输入您的 BSC 钱包地址',
      placeholder: '0x...',
      checkButton: '立即检查',
      checking: '查询中...',
      results: '查询结果',
      totalVolume: '总交易额：',
      usdtVolume: 'USDT 交易额：',
      bnbVolume: 'BNB 交易额：',
      congratulations: '恭喜！您符合空投条件',
      allocation: '您的空投分配是：',
      claimButton: '领取空投',
      notStarted: '空投暂未开始，请稍后再试',
      claimFailed: '领取失败，请稍后重试',
      invalidAddress: '请输入有效的 BSC 地址',
      enterAddress: '0x...',
      confirm: '确定',
      sorry: '抱歉！',
      requirementNotMet: '需要至少 3,000 USDT 的交易额才能获得空投资格'
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

  const USDT_CONTRACT = '0x55d398326f99059ff775485246999027b3197955'.toLowerCase();
  const USDT_DECIMALS = 18;
  const BNB_TO_USDT_RATE = 650;
  const REQUIRED_USDT_AMOUNT = 3000;
  const RPC_URL = 'https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110/';
  const BLOCKS_PER_QUERY = 5000;
  const MAX_CONCURRENT_REQUESTS = 2;
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  const cache = {
    blockNumber: null,
    lastUpdate: 0,
    results: new Map(),
  };

  const getCurrentBlock = async () => {
    const now = Date.now();
    if (cache.blockNumber && now - cache.lastUpdate < 30000) {
      return cache.blockNumber;
    }

    const blockHex = await sendRPCRequest('eth_blockNumber', []);
    cache.blockNumber = parseInt(blockHex, 16);
    cache.lastUpdate = now;
    return cache.blockNumber;
  };

  const getTimeRanges = () => {
    const ranges = [];
    const now = Math.floor(Date.now() / 1000);
    const MONTH_IN_SECONDS = 30 * 24 * 60 * 60;
    
    for (let i = 0; i < 6; i++) {
      ranges.push({
        from: now - (i + 1) * MONTH_IN_SECONDS,
        to: now - i * MONTH_IN_SECONDS
      });
    }
    return ranges;
  };

  const getBlockRange = async (timeFrom, timeTo) => {
    const currentBlock = await getCurrentBlock();
    const BLOCKS_PER_SECOND = 1 / 3; 

    const blockTo = currentBlock;
    const blockFrom = Math.max(
      blockTo - Math.ceil((Date.now() / 1000 - timeFrom) * BLOCKS_PER_SECOND),
      0
    );

    return { blockFrom, blockTo };
  };

  const updateProgress = (current, total) => {
    setLoading(true);
    setResult(prev => ({
      ...prev,
      progress: Math.floor((current / total) * 100)
    }));
  };

  const rateLimiter = {
    queue: [],
    processing: false,
    lastRequestTime: 0,
    
    async add(fn) {
      return new Promise((resolve, reject) => {
        this.queue.push({ fn, resolve, reject });
        this.process();
      });
    },
    
    async process() {
      if (this.processing) return;
      this.processing = true;
      
      while (this.queue.length > 0) {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;
        
        if (timeSinceLastRequest < 100) {
          await new Promise(resolve => setTimeout(resolve, 100 - timeSinceLastRequest));
        }
        
        const { fn, resolve, reject } = this.queue.shift();
        try {
          this.lastRequestTime = Date.now();
          const result = await fn();
          resolve(result);
        } catch (error) {
          reject(error);
        }
      }
      
      this.processing = false;
    }
  };

  const sendRPCRequest = async (method, params) => {
    return rateLimiter.add(async () => {
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method,
          params
        })
      });

      const data = await response.json();
      if (data.error) {
        if (data.error.message?.includes('request limit reached')) {
          throw new Error('API请求频率限制，请稍后再试');
        }
        throw new Error(`RPC Error: ${data.error.message || 'Unknown error'}`);
      }

      return data.result;
    });
  };

  const batchRPCRequest = async (methods) => {
    return rateLimiter.add(async () => {
      try {
        const response = await fetch(RPC_URL, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(methods.map((method, id) => ({
            jsonrpc: '2.0',
            id: id + 1,
            method: method.method,
            params: method.params
          }))),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const results = await response.json();
        return results.map(result => {
          if (result.error) {
            console.warn('RPC错误:', result.error);
            return null;
          }
          return result.result;
        });
      } catch (error) {
        console.error('批量RPC请求失败:', error);
        throw error;
      }
    });
  };

  const queryBlockRanges = async (ranges, address) => {
    try {
      const requests = ranges.map(([start, end]) => ({
        method: 'eth_getLogs',
        params: [{
          fromBlock: '0x' + start.toString(16),
          toBlock: '0x' + end.toString(16),
          address: USDT_CONTRACT,
          topics: [
            TRANSFER_TOPIC,
            null,
            '0x000000000000000000000000' + address.slice(2).toLowerCase()
          ]
        }]
      }));

      const BATCH_SIZE = 5;
      const results = [];
      
      for (let i = 0; i < requests.length; i += BATCH_SIZE) {
        const batch = requests.slice(i, i + BATCH_SIZE);
        const batchResults = await batchRPCRequest(batch);
        results.push(...batchResults.filter(Boolean));
        
        updateProgress(
          Math.min(95, (i + BATCH_SIZE) * 100 / requests.length),
          100
        );
      }

      return results.flat();
    } catch (error) {
      if (error.message.includes('请求频率限制')) {
        throw error;
      }
      console.warn('查询失败:', error.message);
      return [];
    }
  };

  const queryBNBTransfers = async (address, blockRange) => {
    try {
      const [start, end] = blockRange;
      const response = await fetch(RPC_URL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_getLogs',
          params: [{
            fromBlock: '0x' + start.toString(16),
            toBlock: '0x' + end.toString(16),
            address: null,
            topics: [
              TRANSFER_TOPIC,
              null,
              '0x000000000000000000000000' + address.slice(2).toLowerCase()
            ]
          }]
        })
      });

      const data = await response.json();
      if (data.error) {
        throw new Error(`RPC Error: ${data.error.message || 'Unknown error'}`);
      }

      return data.result || [];
    } catch (error) {
      console.error('查询BNB转账失败:', error);
      return [];
    }
  };

  const batchProcessor = async (items, processor, batchSize = MAX_CONCURRENT_REQUESTS) => {
    const results = [];
    for (let i = 0; i < items.length; i += batchSize) {
      const batch = items.slice(i, Math.min(i + batchSize, items.length));
      const batchResults = await Promise.all(batch.map(processor));
      results.push(...batchResults);
    }
    return results;
  };

  const queryRecentTransactions = async (address, currentBlock) => {
    try {
      // 只查询最近10000个区块
      const end = currentBlock;
      const start = currentBlock - 10000;
      
      console.log(`快速查询最近区块: ${start} - ${end}`);
      
      const [usdtLogs, bnbLogs] = await Promise.all([
        queryBlockRanges([[start, end]], address),
        queryBNBTransfers(address, [start, end])
      ]);

      return processTransactionLogs(usdtLogs, bnbLogs);
    } catch (error) {
      console.error('查询最近交易失败:', error);
      return {
        transactions: [],
        usdtVolume: ethers.BigNumber.from(0),
        bnbVolume: ethers.BigNumber.from(0)
      };
    }
  };

  const processTransactionLogs = (usdtLogs, bnbLogs) => {
    const transactions = [];
    let usdtVolume = ethers.BigNumber.from(0);
    let bnbVolume = ethers.BigNumber.from(0);

    // 处理USDT交易
    if (usdtLogs.length > 0) {
      const usdtTxs = usdtLogs.map(log => ({
        hash: log.transactionHash,
        from: '0x' + log.topics[1].slice(26).toLowerCase(),
        to: '0x' + log.topics[2].slice(26).toLowerCase(),
        value: ethers.utils.formatUnits(log.data, USDT_DECIMALS),
        type: 'USDT',
        blockNumber: parseInt(log.blockNumber, 16)
      }));
      transactions.push(...usdtTxs);
      usdtVolume = usdtTxs.reduce(
        (sum, tx) => sum.add(ethers.utils.parseUnits(tx.value, USDT_DECIMALS)),
        ethers.BigNumber.from(0)
      );
    }

    // 处理BNB交易
    if (bnbLogs.length > 0) {
      const bnbTxs = bnbLogs.map(log => ({
        hash: log.transactionHash,
        from: '0x' + log.topics[1].slice(26).toLowerCase(),
        to: '0x' + log.topics[2].slice(26).toLowerCase(),
        value: ethers.utils.formatEther(log.data),
        type: 'BNB',
        blockNumber: parseInt(log.blockNumber, 16)
      }));
      transactions.push(...bnbTxs);
      bnbVolume = bnbTxs.reduce(
        (sum, tx) => sum.add(ethers.utils.parseEther(tx.value)),
        ethers.BigNumber.from(0)
      );
    }

    return {
      transactions,
      usdtVolume,
      bnbVolume
    };
  };

  const getTransactionHistory = async (address) => {
    try {
      setLoading(true);
      setError('');
      console.log('开始查询地址:', address);
      
      // 检查缓存
      const cacheKey = `${address}-${Math.floor(Date.now() / (60 * 1000))}`;
      if (cache.results.has(cacheKey)) {
        const cachedResult = cache.results.get(cacheKey);
        setTransactions(cachedResult.transactions);
        setResult(cachedResult.result);
        setLoading(false);
        return;
      }

      // 获取当前区块
      const currentBlock = await getCurrentBlock();
      updateProgress(10, 100);

      // 首先只查询最近10000个区块
      const recentEnd = currentBlock;
      const recentStart = currentBlock - 10000;
      
      console.log(`快速查询最近区块: ${recentStart} - ${recentEnd}`);
      
      // 先查询一小段区块，检查是否有活动
      const [usdtLogs, bnbLogs] = await Promise.all([
        queryBlockRanges([[recentStart, recentEnd]], address),
        queryBNBTransfers(address, [recentStart, recentEnd])
      ]);

      // 如果最近没有任何交易，认为地址不活跃，立即结束查询
      if (usdtLogs.length === 0 && bnbLogs.length === 0) {
        console.log('地址不活跃，停止查询');
        const result = {
          transactionCount: 0,
          usdtVolume: '0.00',
          bnbVolume: '0.0000',
          totalValueInUSDT: '0.00',
          isEligible: false,
          progress: 100,
          isInactive: true
        };

        setTransactions([]);
        setResult(result);
        setLoading(false);
        
        // 保存到缓存
        cache.results.set(cacheKey, {
          transactions: [],
          result
        });
        
        return;
      }

      // 如果有交易，处理交易数据
      let allTransactions = [];
      let totalUSDTVolume = ethers.BigNumber.from(0);
      let totalBNBVolume = ethers.BigNumber.from(0);

      const initialResult = processTransactionLogs(usdtLogs, bnbLogs);
      allTransactions.push(...initialResult.transactions);
      totalUSDTVolume = totalUSDTVolume.add(initialResult.usdtVolume);
      totalBNBVolume = totalBNBVolume.add(initialResult.bnbVolume);

      // 检查是否已达到要求
      let usdtAmount = parseFloat(ethers.utils.formatUnits(totalUSDTVolume, USDT_DECIMALS));
      let bnbAmount = parseFloat(ethers.utils.formatEther(totalBNBVolume));
      let totalValueInUSDT = usdtAmount + (bnbAmount * BNB_TO_USDT_RATE);

      // 如果已经达到要求，不需要继续查询
      if (totalValueInUSDT >= REQUIRED_USDT_AMOUNT) {
        console.log(`已达到${REQUIRED_USDT_AMOUNT} USDT，停止查询`);
      } else {
        // 继续查询更早的区块
        const remainingStart = recentStart - BLOCKS_PER_QUERY;
        const remainingEnd = recentStart;
        
        console.log(`查询更早区块: ${remainingStart} - ${remainingEnd}`);
        updateProgress(50, 100);

        const [moreLogs, moreBnbLogs] = await Promise.all([
          queryBlockRanges([[remainingStart, remainingEnd]], address),
          queryBNBTransfers(address, [remainingStart, remainingEnd])
        ]);

        const moreResults = processTransactionLogs(moreLogs, moreBnbLogs);
        allTransactions.push(...moreResults.transactions);
        totalUSDTVolume = totalUSDTVolume.add(moreResults.usdtVolume);
        totalBNBVolume = totalBNBVolume.add(moreResults.bnbVolume);

        usdtAmount = parseFloat(ethers.utils.formatUnits(totalUSDTVolume, USDT_DECIMALS));
        bnbAmount = parseFloat(ethers.utils.formatEther(totalBNBVolume));
        totalValueInUSDT = usdtAmount + (bnbAmount * BNB_TO_USDT_RATE);
      }

      // 准备最终结果
      allTransactions.sort((a, b) => b.blockNumber - a.blockNumber);
      
      const result = {
        transactionCount: allTransactions.length,
        usdtVolume: usdtAmount.toFixed(2),
        bnbVolume: bnbAmount.toFixed(4),
        totalValueInUSDT: totalValueInUSDT.toFixed(2),
        isEligible: totalValueInUSDT >= REQUIRED_USDT_AMOUNT,
        progress: 100,
        isInactive: false
      };

      // 保存到缓存
      cache.results.set(cacheKey, {
        transactions: allTransactions,
        result
      });

      setTransactions(allTransactions);
      setResult(result);
      setLoading(false);

    } catch (error) {
      console.error('查询交易记录失败:', error);
      handleError('空投暂未开始，请稍后再试');
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

  const checkEligibility = async () => {
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
      await getTransactionHistory(address);
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
    checkEligibility();
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
            onClick={() => getTransactionHistory(address)}
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
                style={{ width: `${result?.progress || 0}%` }}
              ></div>
            </div>
            <p className="text-gray-400 text-sm mt-2">{t.checking}</p>
          </div>
        )}

        {result && error && (
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
                  {t.totalVolume} <span className="text-green-400">${result.totalValueInUSDT} USDT</span>
                </p>
                <p className="text-gray-300">
                  {t.usdtVolume} <span className="text-green-400">${result.usdtVolume} USDT</span>
                </p>
                <p className="text-gray-300">
                  {t.bnbVolume} <span className="text-green-400">{result.bnbVolume} BNB</span>
                </p>
              </div>
            </div>

            {result.isEligible && (
              <div className="p-4 bg-green-900/50 border border-green-500 rounded">
                <h3 className="text-lg font-medium mb-2 text-green-400">{t.congratulations}</h3>
                <p className="text-gray-300 mb-4">{t.allocation} <span className="text-green-400">500 ZONE Token</span></p>
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
    </div>
  );
};

export default Airdrop;
