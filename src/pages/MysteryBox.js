import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';
import boxImage from '../assets/box-bg.png';

// 这些地址需要替换为实际部署的合约地址
const ZONE_TOKEN_ADDRESS = "YOUR_TOKEN_CONTRACT_ADDRESS";
const MYSTERY_BOX_ADDRESS = "YOUR_MYSTERY_BOX_CONTRACT_ADDRESS";

// 代币ABI
const ZONE_TOKEN_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function allowance(address owner, address spender) public view returns (uint256)"
];

// 盲盒ABI
const MYSTERY_BOX_ABI = [
  "function openBox() public returns (uint8)",
  "function BOX_PRICE() public view returns (uint256)"
];

const NFT_SETTINGS = {
  N: { probability: 55, power: 100, price: 100, dailyReward: 2.8, maxReward: 400, roi: 35.7, yearReturn: 308 },
  R: { probability: 15, power: 400, price: 100, dailyReward: 10, maxReward: 100, roi: 10, yearReturn: 900 },
  SR: { probability: 5, power: 1600, price: 100, dailyReward: 40, maxReward: 600, roi: 2.5, yearReturn: 2400 },
  SSR: { probability: 1, power: 6400, price: 100, dailyReward: 160, maxReward: 2400, roi: 0.6, yearReturn: 9600 }
};

const MysteryBox = () => {
  const { active, account, activate, library } = useWeb3React();
  const { t } = useContext(LanguageContext);
  const [openingResult, setOpeningResult] = useState(null);
  const [isOpening, setIsOpening] = useState(false);
  const [isApproving, setIsApproving] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);

  useEffect(() => {
    if (active && library) {
      // fetchBoxPrice();
    }
  }, [active, library]);

  // const fetchBoxPrice = async () => {
  //   try {
  //     const boxContract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
  //     const price = await boxContract.BOX_PRICE();
  //     setBoxPrice(ethers.utils.formatEther(price));
  //   } catch (error) {
  //     console.error('Error fetching box price:', error);
  //   }
  // };

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const checkAllowance = async () => {
    try {
      const tokenContract = new ethers.Contract(ZONE_TOKEN_ADDRESS, ZONE_TOKEN_ABI, library.getSigner());
      const allowance = await tokenContract.allowance(account, MYSTERY_BOX_ADDRESS);
      const boxContract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      const boxPrice = await boxContract.BOX_PRICE();
      return allowance.gte(boxPrice);
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  };

  const approveToken = async () => {
    try {
      setIsApproving(true);
      const tokenContract = new ethers.Contract(ZONE_TOKEN_ADDRESS, ZONE_TOKEN_ABI, library.getSigner());
      const boxContract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      const boxPrice = await boxContract.BOX_PRICE();
      
      const approveAmount = boxPrice.mul(1000);
      const tx = await tokenContract.approve(MYSTERY_BOX_ADDRESS, approveAmount);
      await tx.wait();
      
      setIsApproving(false);
      return true;
    } catch (error) {
      console.error('Error approving token:', error);
      setIsApproving(false);
      return false;
    }
  };

  const openBox = async () => {
    if (!active) {
      alert(t('connectWalletFirst'));
      return;
    }

    try {
      setIsOpening(true);
      setShowAnimation(true);

      const hasAllowance = await checkAllowance();
      if (!hasAllowance) {
        const approved = await approveToken();
        if (!approved) {
          setIsOpening(false);
          setShowAnimation(false);
          alert(t('approvalFailed'));
          return;
        }
      }

      const boxContract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      const tx = await boxContract.openBox();
      const receipt = await tx.wait();

      // 模拟开箱动画
      setTimeout(() => {
        setShowAnimation(false);
        setOpeningResult('SSR'); // 这里应该根据实际结果设置
        setIsOpening(false);
      }, 3000);

    } catch (error) {
      console.error('Error opening box:', error);
      setIsOpening(false);
      setShowAnimation(false);
      alert(t('openFailed'));
    }
  };

  return (
    <div className="min-h-screen bg-[#0B1120] pt-20 relative overflow-hidden">
      {/* 科技感背景 */}
      <div className="absolute inset-0">
        {/* 矩阵点阵背景 */}
        <div 
          className="absolute inset-0 opacity-10"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='20' height='20' viewBox='0 0 20 20' xmlns='http://www.w3.org/2000/svg'%3E%3Ccircle cx='10' cy='10' r='1' fill='%2322c55e'/%3E%3C/svg%3E")`,
            backgroundSize: '20px 20px'
          }}
        ></div>

        {/* 电路线条 */}
        <div 
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M0 50h40v-10h20v20h40' stroke='%2322c55e' stroke-width='0.5' fill='none'/%3E%3C/svg%3E")`,
            backgroundSize: '100px 100px',
            animation: 'circuit 20s linear infinite'
          }}
        ></div>

        {/* 动态光效 */}
        <div className="absolute inset-0">
          <div className="absolute top-0 left-0 w-full h-1/3 bg-gradient-to-b from-green-500/10 to-transparent"></div>
          <div className="absolute bottom-0 left-0 w-full h-1/3 bg-gradient-to-t from-green-500/10 to-transparent"></div>
        </div>

        {/* 流动光线 */}
        <div className="absolute inset-0">
          <div className="absolute h-[2px] w-1/4 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-flow-right"></div>
          <div className="absolute right-0 h-[2px] w-1/4 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-flow-left" style={{top: '30%'}}></div>
          <div className="absolute h-[2px] w-1/4 bg-gradient-to-r from-transparent via-green-500/50 to-transparent animate-flow-right" style={{top: '60%'}}></div>
        </div>
      </div>

      {/* 页面内容 */}
      <div className="relative py-16">
        <div className="container mx-auto px-4">
          {/* 头部信息 */}
          <div className="text-center mb-16 relative">
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-40 h-40">
              <div className="absolute inset-0 border-2 border-green-500/30 rounded-full animate-spin-slow"></div>
              <div className="absolute inset-2 border-2 border-green-400/20 rounded-full animate-spin-slow-reverse"></div>
              <div className="absolute inset-4 border-2 border-green-300/10 rounded-full animate-spin-slow"></div>
            </div>
            <h1 className="text-4xl font-bold relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">{t('mysteryBoxTitle')}</span>
              <div className="absolute -inset-2 bg-green-500/10 blur-lg rounded-lg -z-10"></div>
            </h1>
            <p className="text-xl text-green-300/80 mt-4">{t('mysteryBoxDesc')}</p>
          </div>

          {/* 主要内容区 */}
          <div className="max-w-3xl mx-auto">
            <div className="relative">
              {/* 主卡片 */}
              <div className="relative bg-[#1A2438]/90 backdrop-blur-xl rounded-lg p-8 border border-green-500/20">
                {/* 装饰性边角 */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/50"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500/50"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500/50"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500/50"></div>

                {/* 内容 */}
                <div className="relative">
                  {/* 盲盒图片 */}
                  <div className="flex justify-center items-center mb-8">
                    <img 
                      src={boxImage}
                      alt={t('mysteryBoxTitle')}
                      style={{ maxWidth: '500px', width: '100%' }}
                    />
                  </div>

                  {/* 价格显示 */}
                  <div className="text-center mb-8 relative">
                    <div className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600">
                      100 ZONE
                    </div>
                    <div className="absolute -inset-4 bg-green-500/5 blur-lg rounded-full"></div>
                  </div>

                  {/* 开启按钮 */}
                  <div className="flex justify-center">
                    {active ? (
                      <button
                        onClick={openBox}
                        disabled={isOpening || isApproving}
                        className={`w-full max-w-xs relative group overflow-hidden bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-4 px-8 rounded-lg ${
                          (isOpening || isApproving) ? 'opacity-50 cursor-not-allowed' : 'hover:from-green-600 hover:to-green-700'
                        }`}
                      >
                        <span className="relative z-10">
                          {isApproving ? t('approving') : isOpening ? t('opening') : t('openBox')}
                        </span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
                      </button>
                    ) : (
                      <button
                        onClick={connectWallet}
                        className="w-full max-w-xs relative group overflow-hidden bg-transparent text-green-500 border-2 border-green-500 font-bold py-4 px-8 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                      >
                        <span className="relative z-10">{t('connectWallet')}</span>
                        <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 装饰性光效 */}
              <div className="absolute -inset-4 bg-green-500/20 blur-2xl -z-10"></div>
            </div>
          </div>

          {/* NFT概率展示 */}
          <div className="max-w-6xl mx-auto mt-16">
            <h2 className="text-2xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-green-400 to-green-600 mb-8 text-center relative">
              {t('nftProbability')}
              <div className="absolute -inset-4 bg-green-500/10 blur-lg rounded-lg -z-10"></div>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {Object.entries(NFT_SETTINGS).map(([rarity, data]) => (
                <div key={rarity} className="group relative">
                  <div className="relative bg-[#1A2438]/80 backdrop-blur-xl rounded-lg p-6 border border-green-500/20 transition-transform duration-300 hover:-translate-y-1">
                    <div className={`text-2xl font-bold mb-4 ${
                      rarity === 'SSR' ? 'text-green-400' :
                      rarity === 'SR' ? 'text-green-500' :
                      rarity === 'R' ? 'text-green-600' :
                      'text-green-700'
                    }`}>
                      {t(`nftRarity${rarity}`)}
                    </div>
                    <div className="text-green-300/80">
                      <div className="mb-2">
                        <span className="text-sm">{t('probability')}：</span>
                        <span className="text-lg font-bold">{data.probability}%</span>
                      </div>
                      <div>
                        <span className="text-sm">{t('quantity')}：</span>
                        <span className="text-lg font-bold">{data.count}</span>
                      </div>
                    </div>
                    {/* 悬停时显示的装饰边框 */}
                    <div className="absolute inset-0 border-2 border-transparent group-hover:border-green-500/30 rounded-lg transition-colors duration-300"></div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* 开箱结果弹窗 */}
      {openingResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="relative">
            <div className="relative bg-[#1A2438]/90 backdrop-blur-xl rounded-lg p-8 max-w-md w-full mx-4 border border-green-500/30">
              {/* 装饰性边角 */}
              <div className="absolute top-0 left-0 w-12 h-12 border-t-2 border-l-2 border-green-500/50"></div>
              <div className="absolute top-0 right-0 w-12 h-12 border-t-2 border-r-2 border-green-500/50"></div>
              <div className="absolute bottom-0 left-0 w-12 h-12 border-b-2 border-l-2 border-green-500/50"></div>
              <div className="absolute bottom-0 right-0 w-12 h-12 border-b-2 border-r-2 border-green-500/50"></div>

              <button 
                onClick={() => setOpeningResult(null)}
                className="absolute top-4 right-4 text-green-400 hover:text-white transition-colors"
              >
                ✕
              </button>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-400 mb-4">{t('congratulations')}</div>
                <div className={`text-4xl font-bold mb-6 ${
                  openingResult === 'SSR' ? 'text-green-400' :
                  openingResult === 'SR' ? 'text-green-500' :
                  openingResult === 'R' ? 'text-green-600' :
                  'text-green-700'
                }`}>
                  {t(`nftRarity${openingResult}`)} NFT
                </div>
                <div className="w-48 h-48 bg-[#0B1120] rounded-lg mx-auto mb-6 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-b from-transparent via-green-500/10 to-transparent animate-pulse"></div>
                  {/* 装饰性边角 */}
                  <div className="absolute top-0 left-0 w-8 h-8 border-t-2 border-l-2 border-green-500/50"></div>
                  <div className="absolute top-0 right-0 w-8 h-8 border-t-2 border-r-2 border-green-500/50"></div>
                  <div className="absolute bottom-0 left-0 w-8 h-8 border-b-2 border-l-2 border-green-500/50"></div>
                  <div className="absolute bottom-0 right-0 w-8 h-8 border-b-2 border-r-2 border-green-500/50"></div>
                </div>
                <button
                  onClick={() => setOpeningResult(null)}
                  className="bg-gradient-to-r from-green-500 to-green-600 text-white font-bold py-3 px-8 rounded-lg hover:from-green-600 hover:to-green-700 transition-colors relative group overflow-hidden"
                >
                  <span className="relative z-10">{t('confirm')}</span>
                  <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 添加样式 */}
      <style jsx>{`
        @keyframes circuit {
          0% { background-position: 0 0; }
          100% { background-position: 100px 0; }
        }
        @keyframes flow-right {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(400%); }
        }
        @keyframes flow-left {
          0% { transform: translateX(400%); }
          100% { transform: translateX(-100%); }
        }
        .animate-flow-right {
          animation: flow-right 8s linear infinite;
        }
        .animate-flow-left {
          animation: flow-left 8s linear infinite;
        }
        .animate-spin-slow {
          animation: spin 10s linear infinite;
        }
        .animate-spin-slow-reverse {
          animation: spin 15s linear reverse infinite;
        }
      `}</style>
    </div>
  );
};

export default MysteryBox;
