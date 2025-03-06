import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { LanguageContext } from '../App';
import boxImage from '../images/mystery-box/box-bg.png';
import { ZONE_NFT_ADDRESS, ZONE_TOKEN_ADDRESS } from '../constants/contracts';

// 导入预览图
import NFTPreviewN from '../images/nft-preview/N.png';
import NFTPreviewR from '../images/nft-preview/R.png';
import NFTPreviewSR from '../images/nft-preview/SR.png';
import NFTPreviewSSR from '../images/nft-preview/SSR.png';

const NFT_PREVIEW = {
  N: NFTPreviewN,
  R: NFTPreviewR,
  SR: NFTPreviewSR,
  SSR: NFTPreviewSSR
};

// NFT合约ABI
const ZONE_NFT_ABI = [
  "function openBox() external returns (uint256)",
  "function boxPrice() view returns (uint256)",
  "function nftAttributes(uint256 tokenId) view returns (uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity)"
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
  N: { probability: 79, power: 100, price: 100, dailyReward: 2.8, maxReward: 252, roi: 35.7, yearReturn: 152 },
  R: { probability: 15, power: 400, price: 100, dailyReward: 10, maxReward: 900, roi: 11.1, yearReturn: 800 },
  SR: { probability: 5, power: 1600, price: 100, dailyReward: 40, maxReward: 3600, roi: 2.8, yearReturn: 3500 },
  SSR: { probability: 1, power: 6400, price: 100, dailyReward: 160, maxReward: 14400, roi: 0.7, yearReturn: 14300 }
};

// 机器人图片映射
const ROBOT_IMAGES = {
  N: [
    "ipfs://bafkreicg2o5srn26flfurg3aks2ozenazepewyug776xxsc3hznrtjvdfq",
    "ipfs://bafkreigygfxouqc2wwarzqbjpbuk5px7q6ywkihxopy6svzbw5i6ks6jnq",
    "ipfs://bafkreibjwpuw2f7vm42efx5f2yf3nmjqrvf2yn45iepys2do5deecjcwaq",
    "ipfs://bafkreidqbaffdedxivwncxb3n4ivzr75jj25od35lz7urgyvih7g3rpfdm"
  ],
  R: [
    "ipfs://bafkreib75y2zt6dygbqvr675k77qkvamuozrq3ehcjhj63uiwvatfpnwcy",
    "ipfs://bafkreifzp2mf37rqhv7jbllgdtno3pafny66neyr4chfun5dipt7pyc5lq",
    "ipfs://bafkreib44hbtd5mw6bnljd5idvmyheedw4uldyngqdqyrnr237zbtd5ydy",
    "ipfs://bafkreidbzii233sbt53kprnpguupt4r3vkrnkzxkqtojitsinclbbrxmmy"
  ],
  SR: [
    "ipfs://bafkreiejcncdya3dofutwzjbppr7iesbnbqny5hiuivkkmqizolmsul7wa",
    "ipfs://bafkreicg7kb3yq22s3jh4jxp7nd4rovzvmsnpuf4dnn7syctstlaec7aja",
    "ipfs://bafkreifdm6yc2ey6qlejbg3ohhcgtswy4uywcxrvvys37k745t54xqoscu",
    "ipfs://bafkreibrsyio7fwpb773vryfo7byr5mzor5pty6i6cdle3qxvsm7qoq2ba"
  ],
  SSR: [
    "ipfs://bafkreigggfktmbu4foz3dwtcbhfldvqbvv73ogdn3hcphfyvwaswwqjbna",
    "ipfs://bafkreidhdgn3bhyyjyiy6nj7nix72fbnyry2iesz3gjyav6tv7ych63wme",
    "ipfs://bafkreibyitzhuxdf46ynyyyw6jzavd2o54vlndrkn2d2pfwanu3cq3ouke",
    "ipfs://bafkreihtjpm2wxxpf5fcm7fdo73ycrm5thvybi6mpom4ml47gadrzq2yd4"
  ]
};

// 获取 NFT 图片
const getNFTImage = (rarity, tokenId) => {
  const images = ROBOT_IMAGES[rarity];
  if (!images) return null;
  // 使用 tokenId 作为索引来选择图片，如果超出范围则循环
  const index = tokenId % images.length;
  return images[index];
};

// 将 IPFS URL 转换为可访问的 URL
const ipfsToHttp = (ipfsUrl) => {
  if (!ipfsUrl) return null;
  return ipfsUrl.replace('ipfs://', 'https://ipfs.io/ipfs/');
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
      
      // 检查余额
      if (balance.lt(boxPrice)) {
        throw new Error(`余额不足，需要 ${ethers.utils.formatEther(boxPrice)} ZONE`);
      }
      
      // 检查授权
      if (allowance.lt(boxPrice)) {
        const approved = await approveToken();
        if (!approved) {
          throw new Error('授权失败');
        }
      }
      
      // 开盲盒
      console.log('Opening mystery box...');
      
      // 调用合约的 openBox 函数
      const tx = await nftContract.openBox({
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
          rarity = event.args.rarity; // 这是一个字符串
          break;
        }
      }
      
      if (!tokenId) {
        throw new Error('Failed to get NFT ID from event');
      }
      
      // 获取 NFT 属性
      const attrs = await nftContract.nftAttributes(tokenId);
      console.log('NFT attributes:', attrs);
      
      // 获取 NFT 图片
      const imageUrl = ipfsToHttp(getNFTImage(rarity, tokenId));
      
      // 设置开盒结果
      setOpeningResult({
        tokenId: tokenId.toString(),
        rarity,
        power: attrs.power.toNumber(),  // 使用实际算力
        dailyReward: ethers.utils.formatEther(attrs.dailyReward),
        maxReward: ethers.utils.formatEther(attrs.maxReward),
        imageUrl
      });
      
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
      alert(error.message || '开盲盒失败，请查看控制台获取详细信息');
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
                <img 
                  src={NFT_PREVIEW.N}
                  alt="N级别NFT" 
                  className="w-48 h-48 mx-auto mb-6 rounded-lg"
                />
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">概率:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.N.probability}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">算力:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.N.power} H/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">日收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.N.dailyReward} ZONE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">最大收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.N.maxReward}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">挖矿时长:</span>
                    <span className="text-[#00ff94]">90D</span>
                  </div>
                </div>
              </div>

              {/* R NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">R</h2>
                <img 
                  src={NFT_PREVIEW.R}
                  alt="R级别NFT" 
                  className="w-48 h-48 mx-auto mb-6 rounded-lg"
                />
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">概率:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.R.probability}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">算力:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.R.power} H/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">日收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.R.dailyReward} ZONE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">最大收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.R.maxReward}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">挖矿时长:</span>
                    <span className="text-[#00ff94]">90D</span>
                  </div>
                </div>
              </div>

              {/* SR NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">SR</h2>
                <img 
                  src={NFT_PREVIEW.SR}
                  alt="SR级别NFT" 
                  className="w-48 h-48 mx-auto mb-6 rounded-lg"
                />
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">概率:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SR.probability}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">算力:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SR.power} H/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">日收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SR.dailyReward} ZONE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">最大收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SR.maxReward}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">挖矿时长:</span>
                    <span className="text-[#00ff94]">90D</span>
                  </div>
                </div>
              </div>

              {/* SSR NFT */}
              <div className="bg-[#1e2839] p-6 rounded-xl border border-[#2e3c51]">
                <h2 className="text-xl font-bold text-[#00ff94] mb-4">SSR</h2>
                <img 
                  src={NFT_PREVIEW.SSR}
                  alt="SSR级别NFT" 
                  className="w-48 h-48 mx-auto mb-6 rounded-lg"
                />
                <div className="grid gap-2">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">概率:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.probability}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">算力:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.power} H/s</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">日收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.dailyReward} ZONE</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">最大收益:</span>
                    <span className="text-[#00ff94]">{NFT_SETTINGS.SSR.maxReward}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-300">挖矿时长:</span>
                    <span className="text-[#00ff94]">90D</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 开箱结果弹窗 */}
      {openingResult && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A1B1F] rounded-lg p-6 max-w-md w-full mx-4">
            <div className="relative">
              {openingResult.imageUrl ? (
                <img 
                  src={openingResult.imageUrl} 
                  alt={`NFT #${openingResult.tokenId}`} 
                  className="w-full h-auto rounded-lg mb-4"
                />
              ) : (
                <div className="w-full h-64 bg-gray-800 rounded-lg mb-4 flex items-center justify-center">
                  <span className="text-gray-400">Loading NFT Image...</span>
                </div>
              )}
              <div className="absolute top-2 right-2 bg-[#2C2D31] px-2 py-1 rounded">
                #{openingResult.tokenId}
              </div>
            </div>
            
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-300">稀有度:</span>
                <span className={`font-bold ${
                  openingResult.rarity === 'SSR' ? 'text-purple-500' :
                  openingResult.rarity === 'SR' ? 'text-yellow-500' :
                  openingResult.rarity === 'R' ? 'text-blue-500' :
                  'text-gray-500'
                }`}>{openingResult.rarity}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">算力:</span>
                <span className="text-white">{openingResult.power} H/s</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">日收益:</span>
                <span className="text-green-500">{openingResult.dailyReward} ZONE</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-300">最大收益:</span>
                <span className="text-green-500">{openingResult.maxReward}%</span>
              </div>
            </div>
            
            <button
              onClick={() => setOpeningResult(null)}
              className="mt-4 w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded transition-colors"
            >
              确认
            </button>
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