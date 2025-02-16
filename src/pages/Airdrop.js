import React, { useState, useContext, useEffect } from 'react';
import { ethers } from 'ethers';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { LanguageContext } from '../App';

const Airdrop = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [claiming, setClaiming] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');
  const [transactions, setTransactions] = useState([]);

  const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'.toLowerCase();
  const USDT_DECIMALS = 18;
  const RPC_URL = 'https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110/';
  
  // Transfer 事件的 topic
  const TRANSFER_TOPIC = '0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef';

  // 每次查询的区块范围
  const BLOCKS_PER_QUERY = 9000; // 保持在 10,000 以下的安全值

  // 发送 RPC 请求
  const sendRPCRequest = async (method, params) => {
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
      throw new Error(`RPC Error: ${data.error.message || 'Unknown error'}`);
    }

    return data.result;
  };

  // 并行查询函数
  const queryBlockRange = async (startBlock, endBlock, address) => {
    try {
      console.log(`查询区块 ${startBlock} 到 ${endBlock}`);
      const logs = await sendRPCRequest('eth_getLogs', [{
        fromBlock: '0x' + startBlock.toString(16),
        toBlock: '0x' + endBlock.toString(16),
        address: USDT_CONTRACT,
        topics: [
          TRANSFER_TOPIC,
          null,
          '0x000000000000000000000000' + address.slice(2).toLowerCase()
        ]
      }]);
      return logs || [];
    } catch (error) {
      console.warn(`查询区块 ${startBlock}-${endBlock} 失败:`, error.message);
      if (error.message.includes('10,000 range')) {
        // 如果区块范围太大，分成两半查询
        const midBlock = Math.floor((startBlock + endBlock) / 2);
        const [firstHalf, secondHalf] = await Promise.all([
          queryBlockRange(startBlock, midBlock, address),
          queryBlockRange(midBlock + 1, endBlock, address)
        ]);
        return [...firstHalf, ...secondHalf];
      }
      throw error;
    }
  };

  const getTransactionHistory = async (address) => {
    try {
      console.log('开始查询地址:', address);
      
      // 获取当前区块
      const currentBlockHex = await sendRPCRequest('eth_blockNumber', []);
      const currentBlock = parseInt(currentBlockHex, 16);
      
      // 计算六个月前的区块（假设平均出块时间为3秒）
      const SIX_MONTHS_IN_SECONDS = 180 * 24 * 60 * 60;
      const BLOCKS_PER_SECOND = 1 / 3;
      const blockRange = Math.floor(SIX_MONTHS_IN_SECONDS * BLOCKS_PER_SECOND);
      const fromBlock = currentBlock - blockRange;
      
      console.log('查询区块范围:', {
        currentBlock,
        fromBlock,
        range: blockRange
      });

      // 计算需要多少批次查询
      const batchCount = Math.ceil(blockRange / BLOCKS_PER_QUERY);
      const queryRanges = [];
      
      for (let i = 0; i < batchCount; i++) {
        const start = fromBlock + (i * BLOCKS_PER_QUERY);
        const end = Math.min(start + BLOCKS_PER_QUERY - 1, currentBlock);
        queryRanges.push([start, end]);
      }

      console.log(`分成 ${queryRanges.length} 批查询`);
      
      // 分批并行执行查询，每次最多4个并行查询
      const allLogs = [];
      for (let i = 0; i < queryRanges.length; i += 4) {
        const batch = queryRanges.slice(i, i + 4);
        console.log(`执行第 ${i/4 + 1} 批查询，共 ${batch.length} 个查询`);
        
        const batchResults = await Promise.all(
          batch.map(([start, end]) => queryBlockRange(start, end, address))
        );
        
        allLogs.push(...batchResults.flat());
      }

      console.log(`总共找到 ${allLogs.length} 条交易记录`);

      // 处理交易数据
      const txs = allLogs.map(log => ({
        hash: log.transactionHash,
        from: '0x' + log.topics[1].slice(26).toLowerCase(),
        to: address.toLowerCase(),
        value: ethers.utils.formatUnits(log.data, USDT_DECIMALS),
        blockNumber: parseInt(log.blockNumber, 16)
      }));

      // 计算总交易量
      const totalVolume = txs.reduce(
        (sum, tx) => sum.add(ethers.utils.parseUnits(tx.value, USDT_DECIMALS)),
        ethers.BigNumber.from(0)
      );

      const formattedVolume = ethers.utils.formatUnits(totalVolume, USDT_DECIMALS);
      const sortedTransactions = txs.sort((a, b) => b.blockNumber - a.blockNumber);

      if (txs.length === 0) {
        throw new Error('该地址在过去6个月内没有USDT交易记录');
      }

      setTransactions(sortedTransactions);
      setResult({
        transactionCount: txs.length,
        totalVolume: formattedVolume,
        isEligible: parseFloat(formattedVolume) >= 3000
      });

    } catch (error) {
      console.error('查询交易记录失败:', error);
      throw new Error(error.message);
    }
  };

  const checkEligibility = async () => {
    if (!address) return;

    setError(null);
    setResult(null);
    setTransactions([]);
    setLoading(true);

    try {
      await getTransactionHistory(address);
    } catch (error) {
      console.error('检查资格失败:', error);
      setError(error.message || '查询失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkEligibility();
  }, []);

  return (
    <div className="min-h-screen bg-[#0B1120] text-white py-16 px-4">
      <div className="max-w-4xl mx-auto">
        {/* 标题区域 */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-6">
            {t('airdropTitle')}
          </h1>
          <p className="text-gray-400 text-lg mb-8">
            {t('airdropDescription')}
          </p>
        </div>

        {/* 规则说明 */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-green-500/20 p-6 mb-8">
          <h2 className="text-2xl font-bold text-green-400 mb-4">{t('eligibilityRules')}</h2>
          <ul className="space-y-3 text-gray-300">
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              {t('rule1')}
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              {t('rule2')}
            </li>
            <li className="flex items-start">
              <span className="text-green-400 mr-2">•</span>
              {t('rule3')}
            </li>
          </ul>
        </div>

        {/* 检查资格表单 */}
        <div className="bg-gray-800/40 backdrop-blur-xl rounded-3xl border border-green-500/20 p-6">
          <h3 className="text-xl font-bold text-green-400 mb-4">{t('checkEligibility')}</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-gray-400 text-sm mb-2">{t('enterBscAddress')}</label>
              <input
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value.trim())}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                placeholder=""
                style={{
                  background: '#1a1b23',
                  border: '1px solid #2a2b33',
                  color: '#fff',
                  padding: '12px',
                  borderRadius: '8px',
                  width: '100%',
                  marginBottom: '15px'
                }}
              />
            </div>
            <button
              onClick={() => {
                if (address) {
                  checkEligibility();
                }
              }}
              disabled={loading || !address}
              style={{
                background: address ? '#00b574' : '#1a1b23',
                color: '#fff',
                border: 'none',
                padding: '12px',
                borderRadius: '8px',
                width: '100%',
                cursor: address ? 'pointer' : 'not-allowed',
                opacity: address ? 1 : 0.5
              }}
            >
              {loading ? t('checking') : t('checkNow')}
            </button>
          </div>

          {/* 结果显示 */}
          {error && (
            <div className="mt-4 p-4 bg-red-500/20 border border-red-500/20 rounded-xl">
              <p className="text-red-400">{error}</p>
            </div>
          )}

          {result && (
            <div className="mt-4 p-4 bg-gray-900/50 rounded-xl">
              <div className="space-y-2">
                <p className="text-lg">
                  <span className="text-gray-400">{t('status')}: </span>
                  <span className="text-white">{result.transactionCount} {t('transactions')}</span>
                </p>
                <p>
                  <span className="text-gray-400">{t('lastTransaction')}: </span>
                  <span className="text-white">{result.transactionCount > 0 ? transactions[0].date : 'N/A'}</span>
                </p>
                <p>
                  <span className="text-gray-400">{t('totalVolume')}: </span>
                  <span className="text-white">${parseFloat(result.totalVolume).toLocaleString()}</span>
                </p>
              </div>

              <div className="mt-3">
                <h6>{t('recentTransactions')}:</h6>
                <div className="table-responsive">
                  <table className="table table-sm">
                    <thead>
                      <tr>
                        <th>{t('date')}</th>
                        <th>{t('transactionHash')}</th>
                        <th>{t('from')}</th>
                        <th>{t('to')}</th>
                        <th>{t('amount')} (USDT)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {transactions.slice(0, 10).map((tx, index) => (
                        <tr key={index}>
                          <td>{new Date(tx.date).toLocaleString()}</td>
                          <td>
                            <a 
                              href={`https://bscscan.com/tx/${tx.hash}`} 
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-truncate d-inline-block"
                              style={{maxWidth: "150px"}}
                            >
                              {tx.hash}
                            </a>
                          </td>
                          <td className="text-truncate" style={{maxWidth: "100px"}}>
                            {tx.from}
                          </td>
                          <td className="text-truncate" style={{maxWidth: "100px"}}>
                            {tx.to}
                          </td>
                          <td>{parseFloat(tx.value).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Airdrop;
