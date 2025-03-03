import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { 
  ZONE_NFT_ADDRESS, 
  ZONE_NFT_ABI, 
  NFT_RARITY,
  NFT_RARITY_COLORS,
  NFT_SETTINGS,
  NFT_IMAGES,
  NFT_MINING_ADDRESS
} from '../constants/contracts';

// NFT Mining合约 ABI
const STAKING_ABI = [
  "function stake(uint256 tokenId) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external"
];

const NFTMarket = () => {
  const { active, account, activate, library } = useWeb3React();
  const navigate = useNavigate();
  const { t, language } = useContext(LanguageContext);
  const [marketItems, setMarketItems] = useState([]);
  const [myNFTs, setMyNFTs] = useState([]);
  const [selectedTab, setSelectedTab] = useState('market');
  const [isLoading, setIsLoading] = useState(true);
  const [sortBy, setSortBy] = useState('default');
  const [filterType, setFilterType] = useState('all');
  const [searchTerm, setSearchTerm] = useState([]);
  const [selectedNFT, setSelectedNFT] = useState(null);
  const [listingPrice, setListingPrice] = useState('');
  const [showListingModal, setShowListingModal] = useState(false);
  const [selectedListingNFT, setSelectedListingNFT] = useState(null);
  const [showStakeModal, setShowStakeModal] = useState(false);
  const [selectedStakeNFT, setSelectedStakeNFT] = useState(null);
  const [showNFTHistoryModal, setShowNFTHistoryModal] = useState(false);
  const [showUserHistoryModal, setShowUserHistoryModal] = useState(false);
  const [selectedNFTHistory, setSelectedNFTHistory] = useState([]);
  const [userHistory, setUserHistory] = useState({ tokenIds: [], trades: [] });
  const [marketStats, setMarketStats] = useState({
    totalVolume: 0,
    dailyVolume: 0,
    floorPrice: 0,
    totalListings: 0,
    totalHolders: 0
  });

  // 筛选和排序函数
  const getFilteredAndSortedItems = (items) => {
    let filtered = [...items];
    
    // 搜索过滤
    if (searchTerm) {
      filtered = filtered.filter(item => 
        item.id.toString().includes(searchTerm) ||
        item.type.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // 类型过滤
    if (filterType !== 'all') {
      filtered = filtered.filter(item => item.type === filterType);
    }

    // 排序
    switch (sortBy) {
      case 'price_asc':
        filtered.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
        break;
      case 'price_desc':
        filtered.sort((a, b) => parseFloat(b.price) - parseFloat(a.price));
        break;
      case 'power_desc':
        filtered.sort((a, b) => parseFloat(b.power) - parseFloat(a.power));
        break;
      case 'reward_desc':
        filtered.sort((a, b) => parseFloat(b.dailyReward) - parseFloat(a.dailyReward));
        break;
      default:
        break;
    }

    return filtered;
  };

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  const loadMarketData = async () => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      
      // 加载我的NFT
      const myTokenIds = await contract.getOwnedNFTs(account);
      const myNFTsData = await Promise.all(
        myTokenIds.map(async (tokenId) => {
          const attributes = await contract.getNFTAttributes(tokenId);
          const listing = await contract.getMarketListing(tokenId);
          
          // 如果已质押，跳过
          if (attributes.isStaked) return null;
          
          return {
            id: tokenId.toString(),
            type: NFT_RARITY[attributes.rarity],
            power: attributes.power.toString(),
            dailyReward: ethers.utils.formatEther(attributes.dailyReward),
            maxReward: ethers.utils.formatEther(attributes.maxReward),
            listed: listing.isActive,
            price: listing.isActive ? ethers.utils.formatEther(listing.price) : null
          };
        })
      );
      setMyNFTs(myNFTsData.filter(nft => nft !== null));

      // 加载市场列表
      const activeListings = await contract.getActiveListings();
      const marketItemsData = await Promise.all(
        activeListings.map(async (listing) => {
          const tokenId = listing.tokenId;
          const attributes = await contract.getNFTAttributes(tokenId);
          return {
            id: tokenId.toString(),
            type: NFT_RARITY[attributes.rarity],
            power: attributes.power.toString(),
            dailyReward: ethers.utils.formatEther(attributes.dailyReward),
            maxReward: ethers.utils.formatEther(attributes.maxReward),
            price: ethers.utils.formatEther(listing.price),
            seller: listing.seller
          };
        })
      );
      setMarketItems(marketItemsData);

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading market data:', error);
      setIsLoading(false);
    }
  };

  const loadNFTHistory = async (tokenId) => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      const history = await contract.getTradeHistory(tokenId);
      setSelectedNFTHistory(history.map(trade => ({
        seller: trade.seller,
        buyer: trade.buyer,
        price: ethers.utils.formatEther(trade.price),
        time: new Date(trade.timestamp.toNumber() * 1000)
      })));
      setShowNFTHistoryModal(true);
    } catch (error) {
      console.error('Error loading NFT history:', error);
    }
  };

  const loadUserHistory = async () => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      const [tokenIds, trades] = await contract.getUserTradeHistory(account);
      setUserHistory({
        tokenIds: tokenIds.map(id => id.toString()),
        trades: trades.map(trade => ({
          seller: trade.seller,
          buyer: trade.buyer,
          price: ethers.utils.formatEther(trade.price),
          time: new Date(trade.timestamp.toNumber() * 1000)
        }))
      });
    } catch (error) {
      console.error('Error loading user history:', error);
    }
  };

  const loadMarketStats = async () => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      const stats = await contract.getMarketStats();
      
      setMarketStats({
        totalVolume: ethers.utils.formatEther(stats._totalVolume),
        dailyVolume: ethers.utils.formatEther(stats._dailyVolume),
        floorPrice: ethers.utils.formatEther(stats._floorPrice),
        totalListings: stats._totalListings.toString(),
        totalHolders: stats._totalHolders.toString()
      });
    } catch (error) {
      console.error('Error loading market stats:', error);
    }
  };

  useEffect(() => {
    const loadNFTs = async () => {
      try {
        setIsLoading(true);
        // 使用测试数据
        const TEST_NFTS = [
          {
            id: 1,
            type: 'N',
            power: 100,
            dailyReward: 2.8,
            maxReward: 252,
            price: 0.1,
            listed: true
          },
          {
            id: 2,
            type: 'R',
            power: 400,
            dailyReward: 10,
            maxReward: 900,
            price: 0.3,
            listed: true
          },
          {
            id: 3,
            type: 'SR',
            power: 1600,
            dailyReward: 40,
            maxReward: 3600,
            price: 0.8,
            listed: true
          },
          {
            id: 4,
            type: 'SSR',
            power: 6400,
            dailyReward: 160,
            maxReward: 14400,
            price: 2,
            listed: true
          }
        ];
        setMarketItems(TEST_NFTS);
        setMarketStats({
          totalVolume: 100,
          dailyVolume: 10,
          floorPrice: 0.1,
          totalListings: 4,
          totalHolders: 3
        });
      } catch (error) {
        console.error('Failed to load NFTs:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadNFTs();
  }, [selectedTab]);

  const handleBuy = async (nftId) => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      const listing = await contract.getMarketListing(nftId);
      
      const tx = await contract.buyNFT(nftId, {
        value: listing.price
      });
      await tx.wait();
      
      alert(t('buySuccess'));
      loadMarketData();
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert(t('buyFailed') + error.message);
    }
  };

  const handleList = async (tokenId, price) => {
    try {
      if (!price) {
        setSelectedListingNFT({ id: tokenId });
        setShowListingModal(true);
        return;
      }

      const priceInWei = ethers.utils.parseEther(price.toString());
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      
      // 检查NFT授权
      const isApproved = await contract.isApprovedForAll(account, ZONE_NFT_ADDRESS);
      if (!isApproved) {
        const approveTx = await contract.setApprovalForAll(ZONE_NFT_ADDRESS, true);
        await approveTx.wait();
      }

      const tx = await contract.listNFT(tokenId, priceInWei);
      await tx.wait();
      
      alert(t('listSuccess'));
      loadMarketData();
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert(t('listFailed') + error.message);
    }
  };

  const handleDelist = async (nftId) => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      const tx = await contract.unlistNFT(nftId);
      await tx.wait();
      
      alert(t('delistSuccess'));
      loadMarketData();
    } catch (error) {
      console.error('Error delisting NFT:', error);
      alert(t('delistFailed') + error.message);
    }
  };

  const handleStake = (nftId) => {
    navigate(`/mining?nftId=${nftId}`); // 跳转到挖矿页面并传递NFT ID
  };

  const handleStakeConfirm = async () => {
    try {
      const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());
      
      // 检查NFT授权
      const isApproved = await contract.isApprovedForAll(account, NFT_MINING_ADDRESS);
      if (!isApproved) {
        const approveTx = await contract.setApprovalForAll(NFT_MINING_ADDRESS, true);
        await approveTx.wait();
      }

      const stakingContract = new ethers.Contract(NFT_MINING_ADDRESS, STAKING_ABI, library.getSigner());
      const tx = await stakingContract.stake(selectedStakeNFT.id);
      await tx.wait();
      
      alert(t('stakeSuccess'));
      loadMarketData();
      setShowStakeModal(false);
    } catch (error) {
      console.error('Error staking NFT:', error);
      alert(t('stakeFailed') + error.message);
    }
  };

  // 市场统计组件
  const MarketStats = () => {
    const labels = {
      totalVolume: {
        zh: '总交易额',
        en: 'Total Volume',
        ko: '총 거래량'
      },
      dailyVolume: {
        zh: '24h交易额',
        en: '24h Volume',
        ko: '24시간 거래량'
      },
      floorPrice: {
        zh: '地板价',
        en: 'Floor Price',
        ko: '바닥가'
      },
      listedNFTs: {
        zh: '在售NFT',
        en: 'Listed NFTs',
        ko: '판매 중인 NFT'
      },
      holders: {
        zh: '持有人数',
        en: 'Holders',
        ko: '보유자 수'
      }
    };

    return (
      <div className="grid grid-cols-5 gap-2 md:gap-4 p-3 md:p-4 bg-[#1A2438] rounded-xl mb-4 md:mb-6 text-center">
        <div>
          <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">{labels.totalVolume[language]}</div>
          <div className="text-white font-bold text-sm md:text-base mt-0.5 md:mt-1">
            <span className="block">{marketStats.totalVolume}</span>
            <span className="text-xs md:text-sm text-gray-400">BNB</span>
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">{labels.dailyVolume[language]}</div>
          <div className="text-white font-bold text-sm md:text-base mt-0.5 md:mt-1">
            <span className="block">{marketStats.dailyVolume}</span>
            <span className="text-xs md:text-sm text-gray-400">BNB</span>
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">{labels.floorPrice[language]}</div>
          <div className="text-white font-bold text-sm md:text-base mt-0.5 md:mt-1">
            <span className="block">{marketStats.floorPrice}</span>
            <span className="text-xs md:text-sm text-gray-400">BNB</span>
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">{labels.listedNFTs[language]}</div>
          <div className="text-white font-bold text-sm md:text-base mt-0.5 md:mt-1">
            {marketStats.totalListings}
          </div>
        </div>
        <div>
          <div className="text-gray-400 text-xs md:text-sm whitespace-nowrap">{labels.holders[language]}</div>
          <div className="text-white font-bold text-sm md:text-base mt-0.5 md:mt-1">
            {marketStats.totalHolders}
          </div>
        </div>
      </div>
    );
  };

  // NFT卡片组件
  const NFTCard = ({ nft }) => {
    const rarityStyle = NFT_RARITY_COLORS[nft.type];
    const nftSettings = NFT_SETTINGS[nft.type];
    // 使用 NFT ID 来确定使用哪个图片，这样同一个 NFT 总是显示相同的图片
    const imageIndex = (nft.id - 1) % 4;  // 使用 NFT ID 模 4 来选择图片
    const imageUrl = NFT_IMAGES[nft.type][imageIndex];
    const { active, account, library } = useWeb3React();
    const [notification, setNotification] = useState({ show: false, type: '', message: '' });

    // 显示通知
    const showNotification = (type, message) => {
      setNotification({ show: true, type, message });
      setTimeout(() => {
        setNotification({ show: false, type: '', message: '' });
      }, 3000);
    };

    // 处理购买
    const handleBuy = async () => {
      if (!active) {
        showNotification('error', '请先连接钱包');
        return;
      }

      try {
        showNotification('info', '正在处理您的购买请求...');

        const signer = library.getSigner();
        const contract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer);
        const price = ethers.utils.parseEther(nft.price.toString());
        
        // 发送购买交易
        const tx = await contract.buyNFT(nft.id, { value: price });
        
        showNotification('info', '等待交易确认...');
        // 等待交易确认
        await tx.wait();
        
        showNotification('success', '购买成功！');
      } catch (error) {
        console.error('购买失败:', error);
        if (error.code === 4001) {
          showNotification('error', '交易已取消');
        } else {
          showNotification('error', `购买失败: ${error.message}`);
        }
      }
    };

    return (
      <div className={`bg-[#1A2438] rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${rarityStyle.border} relative`}>
        {notification.show && (
          <div className="fixed inset-0 flex items-center justify-center z-50">
            <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setNotification({ show: false, type: '', message: '' })}></div>
            <div className={`relative rounded-2xl shadow-2xl p-6 max-w-md w-full mx-4 backdrop-blur-xl animate-fade-in
              ${notification.type === 'success'
                ? 'bg-green-500/10 border-2 border-green-500/20'
                : notification.type === 'error'
                ? 'bg-red-500/10 border-2 border-red-500/20'
                : 'bg-blue-500/10 border-2 border-blue-500/20'
              }`}>
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-full flex items-center justify-center
                  ${notification.type === 'success'
                    ? 'bg-green-500/20 text-green-400'
                    : notification.type === 'error'
                    ? 'bg-red-500/20 text-red-400'
                    : 'bg-blue-500/20 text-blue-400'
                  }`}>
                  {notification.type === 'success' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                  ) : notification.type === 'error' ? (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                    </svg>
                  ) : (
                    <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                    </svg>
                  )}
                </div>
                <div>
                  <h3 className={`text-xl font-bold mb-1 ${
                    notification.type === 'success' ? 'text-green-400' : 
                    notification.type === 'error' ? 'text-red-400' : 
                    'text-blue-400'
                  }`}>
                    {notification.type === 'success' ? '成功' : notification.type === 'error' ? '错误' : '提示'}
                  </h3>
                  <p className="text-gray-300">{notification.message}</p>
                </div>
              </div>
              <button
                onClick={() => setNotification({ show: false, type: '', message: '' })}
                className={`mt-6 w-full py-3 rounded-lg font-semibold transition-all
                  ${notification.type === 'success'
                    ? 'bg-green-500/20 hover:bg-green-500/30 text-green-400'
                    : notification.type === 'error'
                    ? 'bg-red-500/20 hover:bg-red-500/30 text-red-400'
                    : 'bg-blue-500/20 hover:bg-blue-500/30 text-blue-400'
                  }`}
              >
                确定
              </button>
            </div>
          </div>
        )}
        {/* NFT Image Section */}
        <div className="relative">
          <img 
            src={imageUrl}
            alt={`NFT ${nft.type}`}
            className="w-full aspect-square object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/nft-placeholder.svg';
            }}
          />
          {/* Rarity Badge */}
          <div className={`absolute top-2 left-2 px-3 py-1 rounded-lg ${rarityStyle.bg} bg-opacity-90`}>
            <span className={`${rarityStyle.text} text-sm font-medium`}>{nft.type}</span>
          </div>
          {/* Power Badge */}
          <div className="absolute bottom-2 right-2 px-3 py-1 rounded-lg bg-black/70">
            <span className="text-white text-sm font-medium">{nft.power} POW</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="p-4 bg-[#1E293B]">
          <div className="grid grid-cols-2 gap-x-3 gap-y-2 mb-4">
            <div className="text-left">
              <div className="text-gray-400 text-xs mb-0.5">{t('dailyReward')}</div>
              <div className="text-white text-sm font-medium">{nft.dailyReward} ZONE</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs mb-0.5">{t('maxReward')}</div>
              <div className="text-white text-sm font-medium">{nft.maxReward}</div>
            </div>
            <div className="text-left">
              <div className="text-gray-400 text-xs mb-0.5">{t('roi')}</div>
              <div className="text-white text-sm font-medium">{nftSettings.roi}%</div>
            </div>
            <div className="text-right">
              <div className="text-gray-400 text-xs mb-0.5">{t('price')}</div>
              <div className="text-white text-sm font-medium">{nft.price} BNB</div>
            </div>
          </div>

          {/* Buy Button */}
          <button 
            onClick={handleBuy}
            className="w-full py-2 px-4 bg-[#00DC82] hover:bg-opacity-90 text-black text-sm font-medium rounded-lg transition-colors"
          >
            {t('buyNow')}
          </button>
        </div>
      </div>
    );
  };

  // NFT详情弹窗
  const NFTDetailModal = ({ nft, onClose }) => {
    if (!nft) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1A2438] rounded-2xl max-w-2xl w-full mx-4 overflow-hidden">
          <div className="relative">
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>

            {/* NFT图片 */}
            <div className="aspect-square bg-gray-800 relative">
              <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/20 rounded-lg">
                <span className="text-green-500 font-medium">{nft.type}</span>
              </div>
            </div>

            {/* NFT信息 */}
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-2xl font-bold text-white">#{nft.id}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{t('owner')}:</span>
                  <span className="text-white">{nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('power')}</div>
                  <div className="text-xl font-bold text-white">{nft.power}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('dailyReward')}</div>
                  <div className="text-xl font-bold text-white">{nft.dailyReward} ZONE</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('maxReward')}</div>
                  <div className="text-xl font-bold text-white">{nft.maxReward} ZONE</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('currentPrice')}</div>
                  <div className="text-xl font-bold text-white">{nft.price} BNB</div>
                </div>
              </div>

              {/* 操作按钮 */}
              {selectedTab === 'market' ? (
                <button
                  onClick={() => {
                    handleBuy(nft.id);
                    onClose();
                  }}
                  className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                >
                  {t('buyNow')}
                </button>
              ) : (
                <div className="space-y-3">
                  {!nft.listed ? (
                    <>
                      <button
                        onClick={() => {
                          handleList(nft.id);
                          onClose();
                        }}
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        {t('sellNow')}
                      </button>
                      <button
                        onClick={() => {
                          handleStake(nft.id);
                          onClose();
                        }}
                        className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        {t('stakeNow')}
                      </button>
                    </>
                  ) : (
                    <button
                      onClick={() => {
                        handleDelist(nft.id);
                        onClose();
                      }}
                      className="w-full bg-red-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-red-600 transition-colors"
                    >
                      {t('delist')}
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  // 上架NFT弹窗
  const ListingModal = ({ nft, onClose }) => {
    if (!nft) return null;

    const handleSubmit = (e) => {
      e.preventDefault();
      if (listingPrice && listingPrice > 0) {
        handleList(nft.id, listingPrice);
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1A2438] rounded-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">{t('listNFT')}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-gray-400 mb-2">{t('setPrice')}</label>
                <div className="relative">
                  <input
                    type="number"
                    value={listingPrice}
                    onChange={(e) => setListingPrice(e.target.value)}
                    placeholder="0.0"
                    step="0.01"
                    min="0"
                    className="w-full bg-black/20 text-white px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500/50"
                  />
                  <div className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">BNB</div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!listingPrice || listingPrice <= 0}
                className={`w-full py-3 px-4 rounded-lg font-bold transition-colors ${
                  listingPrice && listingPrice > 0
                    ? 'bg-green-500 hover:bg-green-600 text-white'
                    : 'bg-gray-700 text-gray-400 cursor-not-allowed'
                }`}
              >
                {t('confirm')}
              </button>
            </form>
          </div>
        </div>
      </div>
    );
  };

  // 质押NFT弹窗
  const StakeModal = ({ nft, onClose }) => {
    if (!nft) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1A2438] rounded-2xl max-w-md w-full mx-4 overflow-hidden">
          <div className="p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-white">{t('stakeNFT')}</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('power')}</div>
                <div className="text-xl font-bold text-white">{nft.power} H/s</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('dailyReward')}</div>
                <div className="text-xl font-bold text-white">{nft.dailyReward} ZONE</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('maxReward')}</div>
                <div className="text-xl font-bold text-white">{nft.maxReward} ZONE</div>
              </div>

              <button
                onClick={() => {
                  handleStakeConfirm(nft.id);
                  onClose();
                }}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                {t('confirm')}
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* 主要内容区域 - 调整移动端顶部间距 */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 md:pt-32">
        {/* 页面标题 */}
        <div className="text-center mb-8 md:mb-12 mt-8 md:mt-0">
          <h1 className="text-3xl md:text-5xl font-bold text-white mb-4">
            {t('nftMarketplace')}
          </h1>
          <p className="text-lg md:text-xl text-gray-400 hidden md:block">
            {t('nftMarketDescription')}
          </p>
        </div>

        {/* 市场统计 */}
        <MarketStats />

        {/* 搜索和筛选区域 */}
        <div className="mb-6 md:mb-8">
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder={t('searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-4 py-2 bg-[#1A2438] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
              />
            </div>
            <select 
              className="px-4 py-2 bg-[#1A2438] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500 w-full md:w-auto"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">{t('sortDefault')}</option>
              <option value="price_asc">{t('sortPriceAsc')}</option>
              <option value="price_desc">{t('sortPriceDesc')}</option>
              <option value="power_desc">{t('sortPowerDesc')}</option>
              <option value="reward_desc">{t('sortRewardDesc')}</option>
            </select>
          </div>
          <div className="flex gap-2 overflow-x-auto md:overflow-visible pb-2 md:pb-0">
            {['全部', 'N', 'R', 'SR', 'SSR'].map((type) => (
              <button
                key={type}
                onClick={() => setFilterType(type === '全部' ? 'all' : type)}
                className={`px-4 py-1 rounded-full text-sm flex-shrink-0 ${
                  (type === '全部' && filterType === 'all') || type === filterType
                    ? 'bg-green-500 text-white'
                    : 'bg-[#1A2438] text-gray-400 hover:text-white'
                }`}
              >
                {type}
              </button>
            ))}
          </div>
        </div>

        {/* 标签页 */}
        <div className="border-b border-gray-700 mb-6 md:mb-8">
          <div className="flex space-x-4 md:space-x-8">
            <button
              className={`px-3 md:px-4 py-3 md:py-4 font-medium ${
                selectedTab === 'market'
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setSelectedTab('market')}
            >
              {t('allListings')}
            </button>
            <button
              className={`px-3 md:px-4 py-3 md:py-4 font-medium ${
                selectedTab === 'myNFT'
                  ? 'text-green-500 border-b-2 border-green-500'
                  : 'text-gray-400 hover:text-gray-300'
              }`}
              onClick={() => setSelectedTab('myNFT')}
            >
              {t('myListings')}
            </button>
            <button
              onClick={() => setShowUserHistoryModal(true)}
              className={`px-3 md:px-4 py-3 md:py-4 font-medium text-gray-400 hover:text-gray-300`}
            >
              {t('marketHistory')}
            </button>
          </div>
        </div>

        {/* NFT列表 - 移动端两列，PC端四列 */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
          {selectedTab === 'market' && getFilteredAndSortedItems(marketItems).map(item => (
            <NFTCard key={item.id} nft={item} />
          ))}
          {selectedTab === 'myNFT' && getFilteredAndSortedItems(myNFTs).map(item => (
            <NFTCard key={item.id} nft={item} />
          ))}
        </div>
      </div>
      {/* NFT详情弹窗 */}
      <NFTDetailModal
        nft={selectedNFT}
        onClose={() => setSelectedNFT(null)}
      />
      {/* 上架NFT弹窗 */}
      <ListingModal
        nft={selectedListingNFT}
        onClose={() => {
          setSelectedListingNFT(null);
          setShowListingModal(false);
        }}
      />
      {/* 质押NFT弹窗 */}
      <StakeModal
        nft={selectedStakeNFT}
        onClose={() => {
          setSelectedStakeNFT(null);
          setShowStakeModal(false);
        }}
      />
      {/* NFT交易历史弹窗 */}
      {showNFTHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A2438] p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">{t('marketHistory')}</h2>
            <div className="space-y-4">
              {selectedNFTHistory.length > 0 ? (
                selectedNFTHistory.map((trade, index) => (
                  <div key={index} className="border border-gray-700 p-4 rounded bg-black/20">
                    <p className="text-gray-400">{t('seller')}:{' '}<span className="text-white">{trade.seller}</span></p>
                    <p className="text-gray-400">{t('buyer')}:{' '}<span className="text-white">{trade.buyer}</span></p>
                    <p className="text-gray-400">{t('price')}:{' '}<span className="text-white">
                      {ethers.BigNumber.isBigNumber(trade.price) 
                        ? ethers.utils.formatEther(trade.price) 
                        : trade.price} BNB
                    </span></p>
                    <p className="text-gray-400">{t('time')}:{' '}<span className="text-white">{trade.time.toLocaleString()}</span></p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">{t('noHistory')}</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowNFTHistoryModal(false);
                setSelectedNFTHistory([]);
              }}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
      {/* 用户交易历史弹窗 */}
      {showUserHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A2438] p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">{t('userHistory')}</h2>
            <div className="space-y-4">
              {userHistory.trades.length > 0 ? (
                userHistory.trades.map((trade, index) => (
                  <div key={index} className="border border-gray-700 p-4 rounded bg-black/20">
                    <p className="text-gray-400">{t('tokenId')}:{' '}<span className="text-white">#{userHistory.tokenIds[index]}</span></p>
                    <p className="text-gray-400">{t('seller')}:{' '}<span className="text-white">{trade.seller}</span></p>
                    <p className="text-gray-400">{t('buyer')}:{' '}<span className="text-white">{trade.buyer}</span></p>
                    <p className="text-gray-400">{t('price')}:{' '}<span className="text-white">
                      {ethers.BigNumber.isBigNumber(trade.price) 
                        ? ethers.utils.formatEther(trade.price) 
                        : trade.price} BNB
                    </span></p>
                    <p className="text-gray-400">{t('time')}:{' '}<span className="text-white">{trade.time.toLocaleString()}</span></p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">{t('noHistory')}</p>
              )}
            </div>
            <button
              onClick={() => setShowUserHistoryModal(false)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              {t('close')}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMarket;
