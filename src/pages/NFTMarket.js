import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { LanguageContext } from '../App';
import { 
  MYSTERY_BOX_ADDRESS, 
  MYSTERY_BOX_ABI, 
  NFT_RARITY,
  NFT_RARITY_COLORS,
  NFT_SETTINGS
} from '../constants/contracts';

// 临时的合约地址，等待实际部署后替换
const STAKING_ADDRESS = "0x0000000000000000000000000000000000000000";
const MYSTERY_BOX_ADDRESS_TEMP = "0x0000000000000000000000000000000000000000";

// 临时的合约 ABI，等待实际部署后替换
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      
      // 检查NFT授权
      const isApproved = await contract.isApprovedForAll(account, MYSTERY_BOX_ADDRESS);
      if (!isApproved) {
        const approveTx = await contract.setApprovalForAll(MYSTERY_BOX_ADDRESS, true);
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
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
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS_TEMP, MYSTERY_BOX_ABI, library.getSigner());
      
      // 检查NFT授权
      const isApproved = await contract.isApprovedForAll(account, STAKING_ADDRESS);
      if (!isApproved) {
        const approveTx = await contract.setApprovalForAll(STAKING_ADDRESS, true);
        await approveTx.wait();
      }

      const stakingContract = new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, library.getSigner());
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
      <div className="grid grid-cols-5 gap-4 p-4 bg-[#1A2438] rounded-xl mb-6">
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{labels.totalVolume[language]}</div>
          <div className="text-white font-bold">{marketStats.totalVolume} BNB</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{labels.dailyVolume[language]}</div>
          <div className="text-white font-bold">{marketStats.dailyVolume} BNB</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{labels.floorPrice[language]}</div>
          <div className="text-white font-bold">{marketStats.floorPrice} BNB</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{labels.listedNFTs[language]}</div>
          <div className="text-white font-bold">{marketStats.totalListings}</div>
        </div>
        <div className="text-center">
          <div className="text-gray-400 text-sm mb-1">{labels.holders[language]}</div>
          <div className="text-white font-bold">{marketStats.totalHolders}</div>
        </div>
      </div>
    );
  };

  // NFT卡片组件
  const NFTCard = ({ nft }) => {
    const rarityStyle = NFT_RARITY_COLORS[nft.type];
    const nftSettings = NFT_SETTINGS[nft.type];
    const imageUrl = `/images/${nft.type.toLowerCase()}.svg`;

    return (
      <div className={`bg-[#1A2438] rounded-xl overflow-hidden hover:shadow-lg transition-shadow ${rarityStyle.border}`}>
        <div className="relative aspect-square">
          <img 
            src={imageUrl}
            alt={`NFT #${nft.id}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/images/nft-placeholder.svg';
            }}
          />
          <div className={`absolute top-2 left-2 px-2 py-1 rounded-lg ${rarityStyle.bg}`}>
            <span className={`${rarityStyle.text} font-medium`}>{nftSettings.name}</span>
          </div>
          <div className={`absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-black/50`}>
            <span className="text-white font-medium">{nft.power} POW</span>
          </div>
        </div>
        
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <span className="text-lg font-bold text-white">#{nft.id}</span>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">{t('dailyReward')}:</span>
              <span className="text-white">{nft.dailyReward} ZONE</span>
            </div>
          </div>
          
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">ROI:</span>
              <span className="text-white">{nftSettings.roi}%</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm text-gray-400">{t('maxReward')}:</span>
              <span className="text-white">{nft.maxReward}</span>
            </div>
          </div>
          
          {nft.price && (
            <div className="flex justify-between items-center pt-4 border-t border-gray-700">
              <span className="text-sm text-gray-400">{t('price')}</span>
              <span className="text-lg font-bold text-white">{nft.price} BNB</span>
            </div>
          )}

          <div className="mt-4 space-y-2">
            {selectedTab === 'market' ? (
              <button
                onClick={() => handleBuy(nft.id)}
                className="w-full bg-green-500 hover:bg-green-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
              >
                {t('buyNow')}
              </button>
            ) : (
              <>
                {!nft.listed ? (
                  <button
                    onClick={() => handleList(nft.id)}
                    className="w-full bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {t('listForSale')}
                  </button>
                ) : (
                  <button
                    onClick={() => handleDelist(nft.id)}
                    className="w-full bg-red-500 hover:bg-red-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                  >
                    {t('cancelListing')}
                  </button>
                )}
              </>
            )}
            <button
              onClick={() => loadNFTHistory(nft.id)}
              className="w-full bg-gray-700 hover:bg-gray-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
            >
              {t('viewHistory')}
            </button>
          </div>
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
        setListingPrice('');
        onClose();
      }
    };

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1A2438] rounded-xl max-w-md w-full mx-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">{t('listNFT')} #{nft.id}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form onSubmit={handleSubmit}>
            <div className="mb-6">
              <label className="block text-gray-400 mb-2">{t('listingPrice')}</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder={t('pricePlaceholder')}
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              {t('confirm')}
            </button>
          </form>
        </div>
      </div>
    );
  };

  // 质押NFT弹窗
  const StakeModal = ({ nft, onClose }) => {
    if (!nft) return null;

    return (
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1A2438] rounded-xl max-w-md w-full mx-4 p-6">
          <div className="flex justify-between items-center mb-6">
            <h3 className="text-xl font-bold text-white">{t('stakeNFT')} #{nft.id}</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4 mb-6">
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
          </div>

          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              {t('stakeWarning')}
            </p>
            <button
              onClick={handleStakeConfirm}
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              {t('confirm')}
            </button>
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
