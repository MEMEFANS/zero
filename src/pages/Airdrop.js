import React, { useState, useContext } from 'react';
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
  const BSC_API = 'https://side-falling-ensemble.bsc.quiknode.pro/049fcfd0e81b7b299018b5774557ae1c0d4c9110';
  const USDT_CONTRACT = '0x55d398326f99059fF775485246999027B3197955'; // BSC USDT 合约地址
  const AIRDROP_CONTRACT = '0x...'; // 需要替换为实际的空投合约地址

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const checkEligibility = async () => {
    if (!ethers.utils.isAddress(address)) {
      setError(t('invalidAddress'));
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      // 获取过去6个月的时间戳
      const currentTimestamp = Math.floor(Date.now() / 1000);
      const sixMonthsAgo = currentTimestamp - (180 * 24 * 60 * 60);

      // 查询用户的 USDT 交易记录
      const response = await fetch(BSC_API, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          id: 1,
          jsonrpc: '2.0',
          method: 'eth_getLogs',
          params: [{
            fromBlock: '0x' + Math.floor(sixMonthsAgo).toString(16),
            toBlock: 'latest',
            address: USDT_CONTRACT,
            topics: [
              ethers.utils.id('Transfer(address,address,uint256)'),
              null,
              '0x000000000000000000000000' + address.slice(2).toLowerCase()
            ]
          }]
        })
      });

      if (!response.ok) {
        throw new Error('API request failed');
      }

      const data = await response.json();
      
      // 计算总交易量
      let totalVolume = ethers.BigNumber.from(0);
      if (data.result) {
        for (const log of data.result) {
          const amount = ethers.BigNumber.from(log.data);
          totalVolume = totalVolume.add(amount);
        }
      }

      // USDT 有18位小数
      const volumeInUSDT = parseFloat(ethers.utils.formatUnits(totalVolume, 18));
      const isEligible = volumeInUSDT >= 3000;

      // 如果已连接钱包，检查是否已认领
      let claimed = false;
      if (active && library) {
        const airdropContract = new ethers.Contract(
          AIRDROP_CONTRACT,
          ['function claimed(address) view returns (bool)'],
          library
        );
        claimed = await airdropContract.claimed(address);
      }

      setResult({
        eligible: isEligible && !claimed,
        transactionVolume: volumeInUSDT,
        airdropAmount: (isEligible && !claimed) ? 500 : 0,
        claimed: claimed
      });
    } catch (err) {
      setError(t('checkFailed'));
      console.error('Error checking eligibility:', err);
    } finally {
      setLoading(false);
    }
  };

  const claimAirdrop = async () => {
    // 暂时不开放认领
    setError(t('claimNotStarted'));
  };

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
                onChange={(e) => setAddress(e.target.value)}
                className="w-full bg-gray-900 border-2 border-gray-700 rounded-xl px-4 py-3 text-white focus:ring-2 focus:ring-green-400 focus:border-transparent transition-all"
                placeholder="0x..."
              />
            </div>
            <button
              onClick={checkEligibility}
              disabled={loading || !address}
              className={`w-full py-3 rounded-xl font-semibold transition-all ${
                loading || !address
                  ? 'bg-gray-700 cursor-not-allowed'
                  : 'bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700'
              }`}
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
                  <span className={result.eligible ? 'text-green-400' : 'text-red-400'}>
                    {result.claimed ? t('claimed') : result.eligible ? t('eligible') : t('notEligible')}
                  </span>
                </p>
                <p>
                  <span className="text-gray-400">{t('transactionVolume')}: </span>
                  <span className="text-white">${result.transactionVolume.toLocaleString()}</span>
                </p>
                <p>
                  <span className="text-gray-400">{t('airdropAmount')}: </span>
                  <span className="text-green-400">{result.airdropAmount} ZONE</span>
                </p>
                <button
                  disabled={true}
                  className="mt-4 w-full py-3 rounded-xl font-semibold transition-all bg-gray-700 cursor-not-allowed"
                >
                  {result.claimed 
                    ? t('alreadyClaimed')
                    : result.eligible 
                      ? t('claimNotStarted') 
                      : t('notEligibleToClaim')}
                </button>
                {result.eligible && (
                  <p className="mt-2 text-sm text-gray-400 text-center">
                    {t('claimStartsSoon')}
                  </p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Airdrop;
