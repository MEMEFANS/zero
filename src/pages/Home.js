import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';
import { LanguageContext } from '../App';

const Home = () => {
  const navigate = useNavigate();
  const { t } = useContext(LanguageContext);
  const [cursorVariant, setCursorVariant] = useState("default");
  const { ref, inView } = useInView({
    triggerOnce: true,
    threshold: 0.1
  });

  const containerVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: {
        duration: 0.6,
        staggerChildren: 0.2
      }
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] relative overflow-hidden">
      {/* 背景动画效果 */}
      <div className="absolute inset-0">
        <div className="absolute inset-0">
          {/* 网格线 */}
          <div className="absolute inset-0 grid grid-cols-12 grid-rows-8">
            {[...Array(96)].map((_, i) => (
              <div key={i} className="border-[0.5px] border-green-500/5"></div>
            ))}
          </div>
          {/* 渐变背景 */}
          <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-green-500/5"></div>
        </div>
      </div>

      {/* 主要内容 */}
      <div className="relative">
        {/* 标题介绍 */}
        <div className="text-center py-24 pb-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            {t('welcome')}
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            {t('description')}
          </p>
        </div>

        {/* 数据统计 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">12,580</div>
              <div className="text-green-400/60">{t('totalPowerLabel')}</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">5,280</div>
              <div className="text-green-400/60">{t('activeMinersLabel')}</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">1.2M</div>
              <div className="text-green-400/60">{t('minedTokensLabel')}</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">$2.8M</div>
              <div className="text-green-400/60">{t('totalValueLabel')}</div>
            </div>
          </div>
        </div>

                {/* 核心特点 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">{t('aiContractTitle')}</h3>
              <p className="text-gray-400">
                {t('aiContractDescription')}
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">{t('mysteryBoxTitle')}</h3>
              <p className="text-gray-400">
                {t('mysteryBoxDescription')}
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-2">{t('nftMarketTitle')}</h3>
              <p className="text-gray-400">
                {t('nftMarketDescription')}
              </p>
            </div>
          </div>
        </div>

                {/* NFT 等级介绍 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">{t('nftLevelSystemTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">{t('normalNFT')}</span>
                <span className="text-white font-bold">N</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>{t('drawProbability', { value: '55%' })}</li>
                <li>{t('pityValue', { value: '1' })}</li>
                <li>{t('noSpecialGuarantee')}</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-400">{t('rareNFT')}</span>
                <span className="text-blue-400 font-bold">R</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>{t('drawProbability', { value: '15%' })}</li>
                <li>{t('pityValue', { value: '1' })}</li>
                <li>{t('noSpecialGuarantee')}</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-purple-400">{t('superRareNFT')}</span>
                <span className="text-purple-400 font-bold">SR</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>{t('drawProbability', { value: '5%' })}</li>
                <li>{t('pityValue', { value: '1' })}</li>
                <li>{t('srGuarantee')}</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-yellow-400">{t('legendaryNFT')}</span>
                <span className="text-yellow-400 font-bold">SSR</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>{t('drawProbability', { value: '1%' })}</li>
                <li>{t('pityValue', { value: '1' })}</li>
                <li>{t('ssrGuarantee')}</li>
              </ul>
            </div>
          </div>
        </div>

                        {/* 代币信息 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 代币分配 */}
            <div className="bg-[#1e2839] p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-8">{t('tokenDistributionTitle')}</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('nftMiningAllocation')}</span>
                    <span className="text-yellow-500">60%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('privateSaleAllocation')}</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('liquidityAllocation')}</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('listingReserveAllocation')}</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('lpAllocation')}</span>
                    <span className="text-yellow-500">5%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">{t('airdropAllocation')}</span>
                    <span className="text-yellow-500">5%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '5%' }}></div>
                  </div>
                </div>
              </div>
            </div>

                        {/* 代币信息 */}
                        <div className="bg-[#1e2839] p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-8">{t('tokenInfoTitle')}</h3>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('tokenName')}</span>
                  <span className="text-white">ZERO</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('tokenSymbol')}</span>
                  <span className="text-white">ZONE</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('totalSupply')}</span>
                  <span className="text-white">100,000,000</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('network')}</span>
                  <span className="text-white">BSC</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('initialPrice')}</span>
                  <span className="text-white">$0.05</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">{t('listingPrice')}</span>
                  <span className="text-white">$0.1</span>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* 挖矿收益说明 */}
                <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-12">{t('miningRevenueTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 基础收益 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{t('basicRevenueTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('nftLevelPower')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('dailyRevenueDistribution')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('revenueProportionalToPower')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 质押机制 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{t('stakingMechanismTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('stakeToMine')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('cannotUnstake')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('noLockupPeriod')}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 收益加成 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">{t('revenueBoostTitle')}</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('nftAttributeBonus')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('stakingDurationBonus')}</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">{t('eventBonus')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

                {/* 项目路线图 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('developmentRoadmap')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                {t('phaseOne')}
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>{t('phaseOneItem1')}</li>
                <li>{t('phaseOneItem2')}</li>
                <li>{t('phaseOneItem3')}</li>
                <li>{t('phaseOneItem4')}</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                {t('phaseTwo')}
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>{t('phaseTwoItem1')}</li>
                <li>{t('phaseTwoItem2')}</li>
                <li>{t('phaseTwoItem3')}</li>
                <li>{t('phaseTwoItem4')}</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                {t('phaseThree')}
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>{t('phaseThreeItem1')}</li>
                <li>{t('phaseThreeItem2')}</li>
                <li>{t('phaseThreeItem3')}</li>
                <li>{t('phaseThreeItem4')}</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                {t('phaseFour')}
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>{t('phaseFourItem1')}</li>
                <li>{t('phaseFourItem2')}</li>
                <li>{t('phaseFourItem3')}</li>
                <li>{t('phaseFourItem4')}</li>
              </ul>
            </div>
          </div>
        </div>

                {/* AI 智能系统 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('aiSystemTitle')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 闪电套利 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('flashArbitrageTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('flashArbitrageItem1')}</li>
                <li>{t('flashArbitrageItem2')}</li>
                <li>{t('flashArbitrageItem3')}</li>
                <li>{t('flashArbitrageItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('srRequirement')}</div>
            </div>

            {/* 智能交易 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('smartTradingTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('smartTradingItem1')}</li>
                <li>{t('smartTradingItem2')}</li>
                <li>{t('smartTradingItem3')}</li>
                <li>{t('smartTradingItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('rRequirement')}</div>
            </div>

            {/* MEME 雷达 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('memeRadarTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('memeRadarItem1')}</li>
                <li>{t('memeRadarItem2')}</li>
                <li>{t('memeRadarItem3')}</li>
                <li>{t('memeRadarItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('ssrRequirement')}</div>
            </div>

                          {/* 定时交易 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('scheduledTradingTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('scheduledTradingItem1')}</li>
                <li>{t('scheduledTradingItem2')}</li>
                <li>{t('scheduledTradingItem3')}</li>
                <li>{t('scheduledTradingItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('rRequirement')}</div>
            </div>

            {/* 风险预警 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('riskWarningTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('riskWarningItem1')}</li>
                <li>{t('riskWarningItem2')}</li>
                <li>{t('riskWarningItem3')}</li>
                <li>{t('riskWarningItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('srRequirement')}</div>
            </div>

            {/* 数据分析 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('dataAnalysisTitle')}</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>{t('dataAnalysisItem1')}</li>
                <li>{t('dataAnalysisItem2')}</li>
                <li>{t('dataAnalysisItem3')}</li>
                <li>{t('dataAnalysisItem4')}</li>
              </ul>
              <div className="mt-4 text-blue-500">{t('srRequirement')}</div>
            </div>
          </div>
        </div>

                        {/* 合作伙伴 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('partners')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {[
              {
                name: "Binance",
                logo: "/images/partners/binance.png",
                link: "https://www.binance.com"
              },
              {
                name: "OKX",
                logo: "/images/partners/okx.png",
                link: "https://www.okx.com"
              },
              {
                name: "Huobi",
                logo: "/images/partners/huobi.png",
                link: "https://www.huobi.com"
              },
              {
                name: "KuCoin",
                logo: "/images/partners/kucoin.png",
                link: "https://www.kucoin.com"
              },
              {
                name: "Coinbase",
                logo: "/images/partners/coinbase.png",
                link: "https://www.coinbase.com"
              },
              {
                name: "Kraken",
                logo: "/images/partners/kraken.png",
                link: "https://www.kraken.com"
              },
              {
                name: "MEXC",
                logo: "/images/partners/mexc.png",
                link: "https://www.mexc.com"
              },
              {
                name: "Bitget",
                logo: "/images/partners/bitget.png",
                link: "https://www.bitget.com"
              }
            ].map((partner) => (
              <div
                key={partner.name}
                className="bg-[#1e2839] p-6 rounded-lg flex flex-col items-center justify-center cursor-pointer hover:scale-105 transition-transform"
                onClick={() => window.open(partner.link, '_blank')}
              >
                <div className="w-32 h-32 flex items-center justify-center mb-4">
                  <img 
                    src={partner.logo} 
                    alt={partner.name} 
                    className="w-full h-full object-contain opacity-70 hover:opacity-100 transition-opacity"
                  />
                </div>
                <div className="text-center">
                  <h3 className="text-lg font-medium text-gray-300">{partner.name}</h3>
                  <p className="text-sm text-gray-500 mt-1">{t('globalLeadingExchange')}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

                {/* 项目亮点 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('projectHighlights')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('aiTechnologyAdvantage')}</h3>
              </div>
              <p className="text-gray-400">
                {t('aiTechnologyDesc')}
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('securityGuarantee')}</h3>
              </div>
              <p className="text-gray-400">
                {t('securityDesc')}
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('communityGovernance')}</h3>
              </div>
              <p className="text-gray-400">
                {t('governanceDesc')}
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">{t('ecosystemExpansion')}</h3>
              </div>
              <p className="text-gray-400">
                {t('expansionDesc')}
              </p>
            </div>
          </div>
        </div>

                {/* 新闻公告 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('newsAnnouncements')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-12</div>
              <h3 className="text-xl font-bold mb-2">{t('newsTitle1')}</h3>
              <p className="text-gray-400">
                {t('newsContent1')}
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-10</div>
              <h3 className="text-xl font-bold mb-2">{t('newsTitle2')}</h3>
              <p className="text-gray-400">
                {t('newsContent2')}
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-08</div>
              <h3 className="text-xl font-bold mb-2">{t('newsTitle3')}</h3>
              <p className="text-gray-400">
                {t('newsContent3')}
              </p>
            </div>
          </div>
        </div>

        {/* 加入社区 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('joinCommunity')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <a href="https://t.me/ZeroAI" target="_blank" rel="noopener noreferrer" 
               className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#229ED9] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212-.07-.064-.15-.042-.215-.025-.09.024-1.523.968-4.301 2.83-.406.278-.774.416-1.103.413-.363-.006-1.062-.172-1.58-.335-.637-.2-1.142-.402-1.095-.85.024-.232.274-.474.74-.722 2.903-1.262 4.842-2.093 5.815-2.493 2.767-1.143 3.346-1.34 3.72-1.35z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Telegram</h3>
                  <p className="text-gray-400">{t('joinTelegramGroup')}</p>
                </div>
              </div>
            </a>

            <a href="https://twitter.com/ZeroAI" target="_blank" rel="noopener noreferrer"
               className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Twitter</h3>
                  <p className="text-gray-400">{t('followLatestUpdates')}</p>
                </div>
              </div>
            </a>

            <a href="https://discord.gg/ZeroAI" target="_blank" rel="noopener noreferrer"
               className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-[#5865F2] rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-semibold">Discord</h3>
                  <p className="text-gray-400">{t('joinCommunityDiscussion')}</p>
                </div>
              </div>
            </a>
          </div>
        </div>

                {/* 社区列表 */}
                <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">{t('communityList')}</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/binance.png" alt="Binance" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('binanceCommunity')}</h3>
                  <p className="text-gray-400">{t('globalLeadingExchange')}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/okx.png" alt="OKX" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('okxCommunity')}</h3>
                  <p className="text-gray-400">{t('globalLeadingExchange')}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/huobi.png" alt="Huobi" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('huobiCommunity')}</h3>
                  <p className="text-gray-400">{t('globalLeadingExchange')}</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/kucoin.png" alt="KuCoin" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">{t('kucoinCommunity')}</h3>
                  <p className="text-gray-400">{t('globalLeadingExchange')}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
        
               {/* 底部信息 */}
               <div className="text-center text-gray-400 py-8">
          <p>© 2025 ZERO. {t('allRightsReserved')}</p>
        </div>
      </div>
    </div>
  );
};

export default Home;