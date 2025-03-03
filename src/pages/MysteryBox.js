import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';
import boxImage from '../images/mystery-box/box-bg.png';
import { ZONE_NFT_ADDRESS, ZONE_TOKEN_ADDRESS } from '../constants/contracts';

// NFT合约ABI
const ZONE_NFT_ABI = [
  "function openBox(string memory _inviteCode) external returns (uint256)",
  "function openBoxDirect() external returns (uint256)",
  "function boxPrice() view returns (uint256)",
  "function nftAttributes(uint256 tokenId) view returns (uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime)",
  "event BoxOpened(address indexed user, uint256 indexed tokenId, uint8 rarity)"
];

// ZONE代币ABI
const ZONE_TOKEN_ABI = [
  "function name() view returns (string)",
  "function symbol() view returns (string)",
  "function decimals() view returns (uint8)",
  "function totalSupply() view returns (uint256)",
  "function balanceOf(address account) view returns (uint256)",
  "function allowance(address owner, address spender) view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)",
  "function transfer(address to, uint256 amount) external returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) external returns (bool)",
  "event Transfer(address indexed from, address indexed to, uint256 value)",
  "event Approval(address indexed owner, address indexed spender, uint256 value)"
];

const NFT_SETTINGS = {
  N: { probability: 55, power: 100, price: 100, dailyReward: 2.8, maxReward: 252, roi: 35.7, yearReturn: 152 },
  R: { probability: 15, power: 400, price: 100, dailyReward: 10, maxReward: 900, roi: 11.1, yearReturn: 800 },
  SR: { probability: 5, power: 1600, price: 100, dailyReward: 40, maxReward: 3600, roi: 2.8, yearReturn: 3500 },
  SSR: { probability: 1, power: 6400, price: 100, dailyReward: 160, maxReward: 14400, roi: 0.7, yearReturn: 14300 }
};

const getNFTImage = (rarity, tokenId) => {
  // TODO: 根据稀有度和tokenId获取NFT图片地址
  return `/images/nft-${rarity}-${tokenId}.svg`;
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
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      
      // 检查盲盒价格
      const boxPrice = await nftContract.boxPrice();
      console.log('Box Price:', ethers.utils.formatEther(boxPrice));
      
      // 检查余额
      const balance = await tokenContract.balanceOf(account);
      console.log('ZONE Balance:', ethers.utils.formatEther(balance));
      if (balance.lt(boxPrice)) {
        alert('ZONE Token 余额不足');
        return false;
      }
      
      // 检查授权
      const allowance = await tokenContract.allowance(account, ZONE_NFT_ADDRESS);
      console.log('Current Allowance:', ethers.utils.formatEther(allowance));
      return allowance.gte(boxPrice);
    } catch (error) {
      console.error('Error checking allowance:', error);
      return false;
    }
  };

  const approveToken = async () => {
    try {
      setIsApproving(true);
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      
      // 获取代币信息
      const tokenContract = new ethers.Contract(ZONE_TOKEN_ADDRESS, ZONE_TOKEN_ABI, signer);
      const symbol = await tokenContract.symbol();
      const decimals = await tokenContract.decimals();
      console.log('Token symbol:', symbol);
      console.log('Token decimals:', decimals);
      
      // 获取盲盒价格
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
      const boxPrice = await nftContract.boxPrice();
      console.log('Box price:', ethers.utils.formatUnits(boxPrice, decimals));
      
      // 检查代币余额
      const balance = await tokenContract.balanceOf(account);
      console.log('Current balance:', ethers.utils.formatUnits(balance, decimals));
      
      if (balance.lt(boxPrice)) {
        alert(`${symbol} 余额不足以开盲盒`);
        setIsApproving(false);
        return false;
      }
      
      // 检查当前授权
      const currentAllowance = await tokenContract.allowance(account, ZONE_NFT_ADDRESS);
      console.log('Current allowance:', ethers.utils.formatUnits(currentAllowance, decimals));
      
      if (currentAllowance.gte(boxPrice)) {
        console.log('Already approved enough');
        setIsApproving(false);
        return true;
      }
      
      // 发送授权交易
      console.log('Sending approve transaction...');
      const tx = await tokenContract.approve(ZONE_NFT_ADDRESS, ethers.constants.MaxUint256, {  // 授权最大值
        gasLimit: 200000  // 增加 gas limit
      });
      console.log('Approve tx hash:', tx.hash);
      
      // 等待交易确认
      const receipt = await tx.wait();
      console.log('Transaction confirmed!');
      
      // 验证授权结果
      const newAllowance = await tokenContract.allowance(account, ZONE_NFT_ADDRESS);
      console.log('New allowance:', ethers.utils.formatUnits(newAllowance, decimals));
      
      if (newAllowance.lt(boxPrice)) {
        console.error('Approval failed: allowance not increased');
        setIsApproving(false);
        return false;
      }
      
      setIsApproving(false);
      return true;
    } catch (error) {
      console.error('Detailed error:', error);
      if (error.error) {
        console.error('Inner error:', error.error);
      }
      if (error.transaction) {
        console.error('Failed transaction:', error.transaction);
      }
      alert('授权失败，请查看控制台获取详细信息');
      setIsApproving(false);
      return false;
    }
  };
const openBox = async () => {
  try {
    setIsOpening(true);
    const provider = new ethers.providers.Web3Provider(window.ethereum);
    const signer = provider.getSigner();
    const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
    
    // 检查合约状态
    const boxPrice = await nftContract.boxPrice();
    console.log('Box Price:', ethers.utils.formatEther(boxPrice));
    
    // 获取代币合约
    const tokenContract = new ethers.Contract(ZONE_TOKEN_ADDRESS, ZONE_TOKEN_ABI, signer);
    const balance = await tokenContract.balanceOf(account);
    const allowance = await tokenContract.allowance(account, ZONE_NFT_ADDRESS);
    
    console.log('Current Balance:', ethers.utils.formatEther(balance));
    console.log('Current Allowance:', ethers.utils.formatEther(allowance));
    
    // 开盲盒
    console.log('Opening mystery box...');
    const tx = await nftContract.openBox({  // 使用 openBox 而不是 openBoxDirect
      gasLimit: 1000000
    });
    console.log('Transaction hash:', tx.hash);
    
    // 等待交易确认
    const receipt = await tx.wait();
    console.log('Transaction confirmed!');
    
    // 从事件中获取 NFT ID 和稀有度
    let tokenId, rarity;
    for (const event of receipt.events) {
      if (event.event === 'BoxOpened') {
        tokenId = event.args.tokenId.toNumber();
        rarity = event.args.rarity;  // 这里不需要 toNumber() 因为是 string 类型
        break;
      }
    }
    
    if (!tokenId) {
      throw new Error('Failed to get NFT ID from event');
    }
    
    // 获取 NFT 属性
    const attrs = await nftContract.nftAttributes(tokenId);
    console.log('NFT attributes:', attrs);
    
    // 显示结果
    alert(`恭喜！你获得了一个${rarity}级 NFT！\n算力：${attrs.power}\n日收益：${ethers.utils.formatUnits(attrs.dailyReward, 18)} ZONE\n最大收益：${ethers.utils.formatUnits(attrs.maxReward, 18)} ZONE`);
    
    setIsOpening(false);
    return true;
  } catch (error) {
    console.error('Detailed error:', error);
    if (error.error) {
      console.error('Inner error:', error.error);
      // 解析错误信息
      if (error.error.message) {
        alert(`开盲盒失败: ${error.error.message}`);
      }
    }
    if (error.transaction) {
      console.error('Failed transaction:', error.transaction);
    }
    setIsOpening(false);
    return false;
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
              <div className="relative backdrop-blur-xl rounded-lg overflow-hidden">
                {/* 装饰性边角 */}
                <div className="absolute top-0 left-0 w-16 h-16 border-t-2 border-l-2 border-green-500/50 z-10"></div>
                <div className="absolute top-0 right-0 w-16 h-16 border-t-2 border-r-2 border-green-500/50 z-10"></div>
                <div className="absolute bottom-0 left-0 w-16 h-16 border-b-2 border-l-2 border-green-500/50 z-10"></div>
                <div className="absolute bottom-0 right-0 w-16 h-16 border-b-2 border-r-2 border-green-500/50 z-10"></div>

                {/* 内容 */}
                <div className="flex flex-col">
                  {/* 盲盒图片区域 */}
                  <div className="w-full">
                    <img 
                      src={boxImage} 
                      alt="Mystery Box" 
                      className="w-full"
                    />
                  </div>

                  {/* 价格和按钮区域 */}
                  <div className="p-6 space-y-4">
                    {/* 价格显示 */}
                    <div className="text-center">
                      <div className="text-3xl font-bold text-[#00ff94]">
                        100 ZONE
                      </div>
                    </div>

                    {/* 开启按钮 */}
                    <div>
                      {active ? (
                        <button
                          onClick={openBox}
                          disabled={isOpening || isApproving}
                          className={`
                            w-full py-4 px-8 rounded-lg text-xl font-bold
                            bg-[#00ff94] hover:bg-[#00ff94]/90 text-black
                            disabled:bg-[#00ff94]/50 disabled:cursor-not-allowed
                            transition-colors duration-200
                          `}
                        >
                          {t('openBox')}
                        </button>
                      ) : (
                        <button
                          onClick={connectWallet}
                          className="w-full relative group overflow-hidden bg-transparent text-green-500 border-2 border-green-500 font-bold py-4 px-8 rounded-lg hover:bg-green-500 hover:text-white transition-colors"
                        >
                          <span className="relative z-10">{t('connectWallet')}</span>
                          <div className="absolute inset-0 -translate-x-full group-hover:translate-x-0 bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-1000"></div>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* 装饰性光效 */}
              <div className="absolute -inset-4 bg-green-500/20 blur-2xl -z-10"></div>
            </div>
          </div>

          {/* NFT概率展示 */}
          <div className="container mx-auto px-4 py-8">
            <h1 className="text-3xl font-bold text-center text-[#00ff94] mb-12">{t('nftProbability')}</h1>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {/* N NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">N</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">{t('probability')}: <span className="text-[#00ff94]">{NFT_SETTINGS.N.probability}%</span></p>
                  <p className="text-gray-300">{t('power')}: <span className="text-[#00ff94]">{NFT_SETTINGS.N.power} H/s</span></p>
                  <p className="text-gray-300">{t('dailyReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.N.dailyReward} ZONE</span></p>
                  <p className="text-gray-300">{t('maxReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.N.maxReward}</span></p>
                  <p className="text-gray-300">{t('yearReturn')}: <span className="text-[#00ff94]">{NFT_SETTINGS.N.yearReturn}%</span></p>
                </div>
              </div>

              {/* R NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">R</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">{t('probability')}: <span className="text-[#00ff94]">{NFT_SETTINGS.R.probability}%</span></p>
                  <p className="text-gray-300">{t('power')}: <span className="text-[#00ff94]">{NFT_SETTINGS.R.power} H/s</span></p>
                  <p className="text-gray-300">{t('dailyReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.R.dailyReward} ZONE</span></p>
                  <p className="text-gray-300">{t('maxReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.R.maxReward}</span></p>
                  <p className="text-gray-300">{t('yearReturn')}: <span className="text-[#00ff94]">{NFT_SETTINGS.R.yearReturn}%</span></p>
                </div>
              </div>

              {/* SR NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">SR</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">{t('probability')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SR.probability}%</span></p>
                  <p className="text-gray-300">{t('power')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SR.power} H/s</span></p>
                  <p className="text-gray-300">{t('dailyReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SR.dailyReward} ZONE</span></p>
                  <p className="text-gray-300">{t('maxReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SR.maxReward}</span></p>
                  <p className="text-gray-300">{t('yearReturn')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SR.yearReturn}%</span></p>
                </div>
              </div>

              {/* SSR NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">SSR</h2>
                <div className="space-y-2">
                  <p className="text-gray-300">{t('probability')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.probability}%</span></p>
                  <p className="text-gray-300">{t('power')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.power} H/s</span></p>
                  <p className="text-gray-300">{t('dailyReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.dailyReward} ZONE</span></p>
                  <p className="text-gray-300">{t('maxReward')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.maxReward}</span></p>
                  <p className="text-gray-300">{t('yearReturn')}: <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.yearReturn}%</span></p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 开箱结果弹窗 */}
      {openingResult && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-[#1A2438]/95 backdrop-blur-xl rounded-2xl p-8 max-w-lg w-full mx-4 relative">
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/10 to-blue-500/10 rounded-2xl"></div>
            <div className="relative">
              {/* NFT 图片 */}
              <div className="relative group mb-6">
                <img 
                  src={getNFTImage(openingResult.rarity, openingResult.tokenId)}
                  alt={`NFT ${openingResult.rarity}`}
                  className="w-full aspect-square object-cover rounded-xl"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = '/images/nft-placeholder.svg';
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl"></div>
                {/* 稀有度标签 */}
                <div className={`absolute top-4 left-4 px-3 py-1 rounded-lg ${
                  openingResult.rarity === 'SSR' ? 'bg-amber-500/90' :
                  openingResult.rarity === 'SR' ? 'bg-purple-500/90' :
                  openingResult.rarity === 'R' ? 'bg-blue-500/90' :
                  'bg-gray-500/90'
                }`}>
                  <span className="text-white font-medium">{openingResult.rarity}</span>
                </div>
                {/* 战力标签 */}
                <div className="absolute bottom-4 right-4 px-3 py-1 rounded-lg bg-black/70">
                  <span className="text-white font-medium">{NFT_SETTINGS[openingResult.rarity].power} H/s</span>
                </div>
              </div>

              {/* NFT 属性 */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">{t('dailyReward')}</div>
                  <div className="text-green-400 font-bold">
                    {NFT_SETTINGS[openingResult.rarity].dailyReward} ZONE
                  </div>
                </div>
                <div className="bg-black/20 rounded-lg p-4">
                  <div className="text-gray-400 text-sm mb-1">{t('maxReward')}</div>
                  <div className="text-green-400 font-bold">
                    {NFT_SETTINGS[openingResult.rarity].maxReward}
                  </div>
                </div>
              </div>

              {/* 关闭按钮 */}
              <button
                onClick={() => setOpeningResult(null)}
                className="w-full py-3 rounded-lg bg-gradient-to-r from-green-500 to-green-600 text-white font-bold hover:from-green-600 hover:to-green-700 transition-colors"
              >
                {t('confirm')}
              </button>
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
