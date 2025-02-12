import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useInView } from 'react-intersection-observer';

const Home = () => {
  const navigate = useNavigate();
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
        <div className="text-center py-8">
          <h1 className="text-5xl md:text-7xl font-bold mb-4 bg-gradient-to-r from-green-400 to-blue-500 text-transparent bg-clip-text">
            ZERO
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            基于人工智能的 NFT 挖矿平台，通过智能合约实现自动化挖矿和收益分配，打造去中心化的数字资产生态系统。
          </p>
        </div>

        {/* 数据统计 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">12,580</div>
              <div className="text-green-400/60">总算力</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">5,280</div>
              <div className="text-green-400/60">活跃矿工</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">1.2M</div>
              <div className="text-green-400/60">已挖出代币</div>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-xl text-center transform hover:scale-105 transition-transform border border-green-500/20">
              <div className="text-3xl md:text-4xl font-bold text-green-400 mb-2">$2.8M</div>
              <div className="text-green-400/60">总市值</div>
            </div>
          </div>
        </div>

        {/* 核心特点 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">🎯</div>
              <h3 className="text-xl font-bold mb-2">AI 智能合约</h3>
              <p className="text-gray-400">
                智能合约自动执行，交易安全透明，收益实时结算
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">🎁</div>
              <h3 className="text-xl font-bold mb-2">神秘盲盒系统</h3>
              <p className="text-gray-400">
                四种稀有度 NFT，独特外观设计，特殊属性加成
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="text-yellow-500 text-4xl mb-4">💎</div>
              <h3 className="text-xl font-bold mb-2">NFT 交易市场</h3>
              <p className="text-gray-400">
                自由交易 NFT，实时市场行情，安全交易保障
              </p>
            </div>
          </div>
        </div>

        {/* NFT 等级介绍 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">NFT 等级系统</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-gray-400">普通 NFT</span>
                <span className="text-white font-bold">N</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>• 抽取概率: 55%</li>
                <li>• Pity 值: 1</li>
                <li>• 无特殊保底</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-blue-400">稀有 NFT</span>
                <span className="text-blue-400 font-bold">R</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>• 抽取概率: 15%</li>
                <li>• Pity 值: 1</li>
                <li>• 无特殊保底</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-purple-400">超稀有 NFT</span>
                <span className="text-purple-400 font-bold">SR</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>• 抽取概率: 5%</li>
                <li>• Pity 值: 1</li>
                <li>• 保底: 每100次必得SR级</li>
              </ul>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="flex justify-between items-center mb-4">
                <span className="text-yellow-400">传说 NFT</span>
                <span className="text-yellow-400 font-bold">SSR</span>
              </div>
              <ul className="text-gray-400 space-y-2">
                <li>• 抽取概率: 1%</li>
                <li>• Pity 值: 1</li>
                <li>• 保底: 每300次必得SSR</li>
              </ul>
            </div>
          </div>
        </div>

        {/* 代币信息 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* 代币分配 */}
            <div className="bg-[#1e2839] p-8 rounded-lg">
              <h3 className="text-2xl font-bold mb-8">代币分配</h3>
              <div className="space-y-6">
                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">NFT挖矿</span>
                    <span className="text-yellow-500">60%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '60%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">私募</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">联合坐庄</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">上市预留</span>
                    <span className="text-yellow-500">10%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '10%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">LP加池</span>
                    <span className="text-yellow-500">5%</span>
                  </div>
                  <div className="bg-gray-700 h-2 rounded-full overflow-hidden">
                    <div className="bg-yellow-500 h-full" style={{ width: '5%' }}></div>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-400">空投</span>
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
              <h3 className="text-2xl font-bold mb-8">代币信息</h3>
              <div className="space-y-6">
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <span className="text-gray-400">代币名称</span>
                  <span className="text-yellow-500 text-xl font-bold">ZERO</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <span className="text-gray-400">代币总量</span>
                  <span className="text-yellow-500 text-xl font-bold">1亿枚</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <span className="text-gray-400">发行价格</span>
                  <span className="text-yellow-500 text-xl font-bold">0.05 USDT</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <span className="text-gray-400">IDO价格</span>
                  <span className="text-yellow-500 text-xl font-bold">0.05 USDT</span>
                </div>
                <div className="flex justify-between items-center border-b border-gray-700 pb-4">
                  <span className="text-gray-400">上线价格</span>
                  <span className="text-yellow-500 text-xl font-bold">0.1 USDT</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 挖矿收益说明 */}
        <div className="max-w-6xl mx-auto px-4 py-8">
          <h2 className="text-3xl font-bold text-center mb-12">挖矿收益说明</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* 基础收益 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">基础收益</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">NFT 等级决定算力</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">每日固定收益发放</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">收益与算力成正比</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 质押机制 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">质押机制</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">质押即可挖矿</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">不可解除质押</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">无锁定期限制</span>
                  </div>
                </div>
              </div>
            </div>

            {/* 收益加成 */}
            <div className="bg-[#1A2438]/80 backdrop-blur-xl rounded-2xl p-8">
              <div>
                <h3 className="text-xl font-bold mb-4">收益加成</h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">NFT 特殊属性加成</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">质押时长加成</span>
                  </div>
                  <div className="flex items-center">
                    <div className="w-2 h-2 bg-gray-400 rounded-full mr-4"></div>
                    <span className="text-gray-400">活动期间额外加成</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 项目路线图 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">发展路线</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                第一阶段
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>• 完成智能合约开发</li>
                <li>• 完成 NFT 系统设计</li>
                <li>• 完成官网开发</li>
                <li>• 启动私募</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                第二阶段
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>• IDO 启动</li>
                <li>• NFT 挖矿系统上线</li>
                <li>• 交易市场开放</li>
                <li>• 开启流动性挖矿</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                第三阶段
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>• 上线主流交易所</li>
                <li>• 开启 NFT 升级系统</li>
                <li>• 推出团队挖矿系统</li>
                <li>• 启动社区治理</li>
              </ul>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg relative">
              <div className="absolute -top-3 left-6 bg-yellow-500 text-black px-3 py-1 rounded-full text-sm font-bold">
                第四阶段
              </div>
              <ul className="space-y-3 text-gray-300 mt-4">
                <li>• AI智能交易系统</li>
                <li>• AI市场分析预测</li>
                <li>• AI个性化投资建议</li>
                <li>• AI风险管理系统</li>
              </ul>
            </div>
          </div>
        </div>

        {/* AI 智能系统 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">AI 智能系统</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* 闪电套利 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">闪电套利</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• 跨链套利机器人</li>
                <li>• 实时价差监控</li>
                <li>• 自动执行交易</li>
                <li>• 风险控制系统</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 SR 及以上级别 NFT</div>
            </div>

            {/* 智能交易 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">智能交易</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• AI 趋势分析</li>
                <li>• 智能止盈止损</li>
                <li>• 多策略组合</li>
                <li>• 实时市场洞察</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 R 及以上级别 NFT</div>
            </div>

            {/* MEME 雷达 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">MEME 雷达</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• 社交媒体监控</li>
                <li>• 热点币种预警</li>
                <li>• 情绪指标分析</li>
                <li>• 早期项目发现</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 SSR 级别 NFT</div>
            </div>

            {/* 定时交易 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">定时交易</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• 自定义交易计划</li>
                <li>• 条件触发执行</li>
                <li>• 多币种监控</li>
                <li>• 邮件/TG通知</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 R 及以上级别 NFT</div>
            </div>

            {/* 风险预警 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">风险预警</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• 市场风险监控</li>
                <li>• 异常波动预警</li>
                <li>• 资金流向分析</li>
                <li>• 智能风控策略</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 SR 及以上级别 NFT</div>
            </div>

            {/* 数据分析 */}
            <div className="bg-[#1e2839] p-6 rounded-lg">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">数据分析</h3>
              </div>
              <ul className="space-y-2 text-gray-400">
                <li>• 深度市场分析</li>
                <li>• 链上数据追踪</li>
                <li>• 交易模式识别</li>
                <li>• 投资报告生成</li>
              </ul>
              <div className="mt-4 text-blue-500">需要持有 SR 及以上级别 NFT</div>
            </div>
          </div>
        </div>

        {/* 合作伙伴 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">合作伙伴</h2>
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
                  <p className="text-sm text-gray-500 mt-1">全球领先交易所</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 项目亮点 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">项目亮点</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">AI技术优势</h3>
              </div>
              <p className="text-gray-400">
                采用最新的人工智能技术，提供精准的市场分析和交易策略，帮助用户实现最大化收益。
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-green-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">安全保障</h3>
              </div>
              <p className="text-gray-400">
                多重安全机制保护，资金安全有保障，智能风控系统24小时监控。
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-purple-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">社区治理</h3>
              </div>
              <p className="text-gray-400">
                社区驱动的治理机制，用户可参与重要决策，真正实现去中心化。
              </p>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 bg-yellow-600 rounded-lg flex items-center justify-center">
                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
                  </svg>
                </div>
                <h3 className="text-xl font-bold">生态扩展</h3>
              </div>
              <p className="text-gray-400">
                持续扩展生态系统，跨链整合，打造完整的数字资产生态。
              </p>
            </div>
          </div>
        </div>

        {/* 新闻公告 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">新闻公告</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-12</div>
              <h3 className="text-xl font-bold mb-2">重大更新：AI智能系统2.0版本发布</h3>
              <p className="text-gray-400">
                全新升级的AI智能系统现已上线，带来更精准的市场分析和交易策略...
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-10</div>
              <h3 className="text-xl font-bold mb-2">社区活动：NFT空投计划启动</h3>
              <p className="text-gray-400">
                为回馈社区用户，我们将启动新一轮的NFT空投活动，活动时间为期一个月...
              </p>
            </div>
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="text-yellow-500 mb-2">2025-02-08</div>
              <h3 className="text-xl font-bold mb-2">新增功能：多链资产聚合器</h3>
              <p className="text-gray-400">
                现在您可以在一个界面管理所有链上资产，支持跨链交易和资产统计...
              </p>
            </div>
          </div>
        </div>

        {/* 加入社区 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">加入社区</h2>
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
                  <p className="text-gray-400">加入我们的电报群</p>
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
                  <p className="text-gray-400">关注最新动态</p>
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
                  <p className="text-gray-400">加入社区讨论</p>
                </div>
              </div>
            </a>
          </div>
        </div>

        {/* 社区列表 */}
        <div className="container mx-auto px-4 py-8 mb-12">
          <h2 className="text-3xl font-bold text-center mb-12">社区列表</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/binance.png" alt="Binance" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">币安社区</h3>
                  <p className="text-gray-400">全球最大交易所</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/okx.png" alt="OKX" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">OKX社区</h3>
                  <p className="text-gray-400">领先数字资产平台</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/huobi.png" alt="Huobi" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">火币社区</h3>
                  <p className="text-gray-400">专业数字货币交易</p>
                </div>
              </div>
            </div>

            <div className="bg-[#1e2839] p-6 rounded-lg hover:scale-105 transition-transform">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-lg overflow-hidden">
                  <img src="/images/communities/gate.png" alt="Gate" className="w-full h-full object-cover" />
                </div>
                <div>
                  <h3 className="text-xl font-bold">Gate社区</h3>
                  <p className="text-gray-400">创新数字资产平台</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* 底部信息 */}
        <div className="text-center text-gray-400 py-8">
          <p> 2025 ZERO. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
};

export default Home;