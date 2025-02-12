import React, { useState, useEffect } from 'react';
import { useWeb3React } from '@web3-react/core';
import { injected } from '../utils/connectors';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { 
  MYSTERY_BOX_ADDRESS, 
  MYSTERY_BOX_ABI, 
  NFT_RARITY,
  NFT_RARITY_COLORS 
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

  useEffect(() => {
    if (active) {
      loadMarketData();
      loadUserHistory();
    }
  }, [active, account]);

  const handleBuy = async (nftId) => {
    try {
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      const listing = await contract.getMarketListing(nftId);
      
      const tx = await contract.buyNFT(nftId, {
        value: listing.price
      });
      await tx.wait();
      
      alert('购买成功！');
      loadMarketData();
    } catch (error) {
      console.error('Error buying NFT:', error);
      alert('购买失败: ' + error.message);
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
      
      alert('上架成功！');
      loadMarketData();
    } catch (error) {
      console.error('Error listing NFT:', error);
      alert('上架失败: ' + error.message);
    }
  };

  const handleDelist = async (nftId) => {
    try {
      const contract = new ethers.Contract(MYSTERY_BOX_ADDRESS, MYSTERY_BOX_ABI, library.getSigner());
      const tx = await contract.unlistNFT(nftId);
      await tx.wait();
      
      alert('下架成功！');
      loadMarketData();
    } catch (error) {
      console.error('Error delisting NFT:', error);
      alert('下架失败: ' + error.message);
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
      
      alert('质押成功！');
      loadMarketData();
      setShowStakeModal(false);
    } catch (error) {
      console.error('Error staking NFT:', error);
      alert('质押失败：' + error.message);
    }
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
                  <span className="text-gray-400">拥有者:</span>
                  <span className="text-white">{nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">基础算力</div>
                  <div className="text-xl font-bold text-white">{nft.power}</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">每日收益</div>
                  <div className="text-xl font-bold text-white">{nft.dailyReward} ZONE</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">最大收益</div>
                  <div className="text-xl font-bold text-white">{nft.maxReward} ZONE</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">当前价格</div>
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
                  购买
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
                        上架出售
                      </button>
                      <button
                        onClick={() => {
                          handleStake(nft.id);
                          onClose();
                        }}
                        className="w-full bg-gray-700 text-white font-bold py-3 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                      >
                        去质押挖矿
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
                      取消出售
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
            <h3 className="text-xl font-bold text-white">上架 NFT #{nft.id}</h3>
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
              <label className="block text-gray-400 mb-2">设置价格 (BNB)</label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={listingPrice}
                onChange={(e) => setListingPrice(e.target.value)}
                className="w-full px-4 py-2 bg-black/20 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                placeholder="输入价格..."
                required
              />
            </div>

            <button
              type="submit"
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              确认上架
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
            <h3 className="text-xl font-bold text-white">质押 NFT #{nft.id}</h3>
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
              <div className="text-gray-400 mb-1">基础算力</div>
              <div className="text-xl font-bold text-white">{nft.power}</div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-gray-400 mb-1">预计每日收益</div>
              <div className="text-xl font-bold text-white">{nft.dailyReward} ZONE</div>
            </div>
            <div className="bg-black/20 p-4 rounded-lg">
              <div className="text-gray-400 mb-1">最大收益</div>
              <div className="text-xl font-bold text-white">{nft.maxReward} ZONE</div>
            </div>
          </div>

          <div className="space-y-4">
            <p className="text-gray-400 text-sm">
              质押后NFT将被锁定，直到您手动解除质押。在此期间，您将持续获得ZONE代币奖励。
            </p>
            <button
              onClick={handleStakeConfirm}
              className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
            >
              确认质押
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[#0B1120]">
      {/* 主要内容 */}
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题和搜索栏 */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-6">NFT 交易市场</h1>
          <div className="flex flex-col gap-4">
            <div className="flex gap-4">
              <div className="flex-1">
                <input
                  type="text"
                  placeholder="搜索 NFT..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full px-4 py-2 bg-[#1A2438] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                />
              </div>
              <select 
                className="px-4 py-2 bg-[#1A2438] border border-gray-700 rounded-lg text-white focus:outline-none focus:border-green-500"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
              >
                <option value="default">排序方式</option>
                <option value="price_asc">价格: 从低到高</option>
                <option value="price_desc">价格: 从高到低</option>
                <option value="power_desc">算力: 从高到低</option>
                <option value="reward_desc">收益: 从高到低</option>
              </select>
            </div>
            <div className="flex gap-2">
              {['全部', 'N', 'R', 'SR', 'SSR'].map((type) => (
                <button
                  key={type}
                  onClick={() => setFilterType(type === '全部' ? 'all' : type)}
                  className={`px-4 py-1 rounded-full text-sm ${
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
        </div>

        {!active ? (
          <div className="text-center py-20">
            <h2 className="text-2xl font-bold text-white mb-4">连接钱包开始交易</h2>
            <p className="text-gray-400 mb-8">连接钱包以浏览和交易 NFT</p>
            <button
              onClick={connectWallet}
              className="bg-green-500 text-white font-bold py-3 px-8 rounded-lg hover:bg-green-600 transition-colors"
            >
              连接钱包
            </button>
          </div>
        ) : (
          <div>
            {/* 市场统计 */}
            <div className="grid grid-cols-4 gap-6 mb-8">
              <div className="bg-[#1A2438] p-6 rounded-xl border border-gray-700">
                <div className="text-gray-400 mb-2">总交易额</div>
                <div className="text-2xl font-bold text-white">123.45 BNB</div>
              </div>
              <div className="bg-[#1A2438] p-6 rounded-xl border border-gray-700">
                <div className="text-gray-400 mb-2">地板价</div>
                <div className="text-2xl font-bold text-white">0.5 BNB</div>
              </div>
              <div className="bg-[#1A2438] p-6 rounded-xl border border-gray-700">
                <div className="text-gray-400 mb-2">总持有者</div>
                <div className="text-2xl font-bold text-white">1,234</div>
              </div>
              <div className="bg-[#1A2438] p-6 rounded-xl border border-gray-700">
                <div className="text-gray-400 mb-2">挂单数量</div>
                <div className="text-2xl font-bold text-white">{marketItems.length}</div>
              </div>
            </div>

            {/* 标签页 */}
            <div className="border-b border-gray-700 mb-8">
              <div className="flex space-x-8">
                <button
                  className={`px-4 py-4 font-medium ${
                    selectedTab === 'market'
                      ? 'text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setSelectedTab('market')}
                >
                  市场列表
                </button>
                <button
                  className={`px-4 py-4 font-medium ${
                    selectedTab === 'myNFT'
                      ? 'text-green-500 border-b-2 border-green-500'
                      : 'text-gray-400 hover:text-gray-300'
                  }`}
                  onClick={() => setSelectedTab('myNFT')}
                >
                  我的NFT
                </button>
                <button
                  onClick={() => setShowUserHistoryModal(true)}
                  className={`px-4 py-4 font-medium text-gray-400 hover:text-gray-300`}
                >
                  交易历史
                </button>
              </div>
            </div>

            {isLoading ? (
              <div className="flex justify-center items-center py-20">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-green-500 border-t-transparent"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {selectedTab === 'market' && getFilteredAndSortedItems(marketItems).map(item => (
                  <div key={item.id} className="bg-[#1A2438] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-colors">
                    {/* NFT 图片 */}
                    <div 
                      className="aspect-square bg-gray-800 relative cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedNFT(item)}
                    >
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 rounded-lg">
                        <span className="text-green-500 text-sm font-medium">{item.type}</span>
                      </div>
                    </div>
                    {/* NFT 信息 */}
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">#{item.id}</span>
                        <span className="text-gray-400 text-sm">{item.power} 算力</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">日收益</span>
                          <span className="text-white">{item.dailyReward} ZONE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">最大收益</span>
                          <span className="text-white">{item.maxReward} ZONE</span>
                        </div>
                        <div className="pt-2 border-t border-gray-700">
                          <div className="flex justify-between items-center">
                            <span className="text-gray-400">价格</span>
                            <span className="text-xl font-bold text-white">{item.price} BNB</span>
                          </div>
                        </div>
                      </div>
                      <button
                        onClick={() => handleBuy(item.id)}
                        className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        购买
                      </button>
                      <button
                        onClick={() => loadNFTHistory(item.id)}
                        className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors mt-2"
                      >
                        查看交易历史
                      </button>
                    </div>
                  </div>
                ))}

                {selectedTab === 'myNFT' && getFilteredAndSortedItems(myNFTs).map(nft => (
                  <div key={nft.id} className="bg-[#1A2438] rounded-xl overflow-hidden border border-gray-700 hover:border-green-500 transition-colors">
                    {/* NFT 图片 */}
                    <div 
                      className="aspect-square bg-gray-800 relative cursor-pointer hover:opacity-90 transition-opacity"
                      onClick={() => setSelectedNFT(nft)}
                    >
                      <div className="absolute top-2 right-2 px-2 py-1 bg-green-500/20 rounded-lg">
                        <span className="text-green-500 text-sm font-medium">{nft.type}</span>
                      </div>
                    </div>
                    {/* NFT 信息 */}
                    <div className="p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-white font-medium">#{nft.id}</span>
                        <span className="text-gray-400 text-sm">{nft.power} 算力</span>
                      </div>
                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">日收益</span>
                          <span className="text-white">{nft.dailyReward} ZONE</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-400">最大收益</span>
                          <span className="text-white">{nft.maxReward} ZONE</span>
                        </div>
                        {nft.listed && (
                          <div className="pt-2 border-t border-gray-700">
                            <div className="flex justify-between items-center">
                              <span className="text-gray-400">当前价格</span>
                              <span className="text-xl font-bold text-white">{nft.price} BNB</span>
                            </div>
                          </div>
                        )}
                      </div>
                      <div className="space-y-2">
                        {!nft.listed ? (
                          <>
                            <button
                              onClick={() => handleList(nft.id)}
                              className="w-full bg-green-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-green-600 transition-colors"
                            >
                              上架出售
                            </button>
                            <button
                              onClick={() => handleStake(nft.id)}
                              className="w-full bg-gray-700 text-white font-bold py-2 px-4 rounded-lg hover:bg-gray-600 transition-colors"
                            >
                              去质押挖矿
                            </button>
                          </>
                        ) : (
                          <button
                            onClick={() => handleDelist(nft.id)}
                            className="w-full bg-red-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-red-600 transition-colors"
                          >
                            取消出售
                          </button>
                        )}
                        <button
                          onClick={() => loadNFTHistory(nft.id)}
                          className="w-full bg-blue-500 text-white font-bold py-2 px-4 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          查看交易历史
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
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
            <h2 className="text-2xl font-bold mb-4 text-white">NFT交易历史</h2>
            <div className="space-y-4">
              {selectedNFTHistory.length > 0 ? (
                selectedNFTHistory.map((trade, index) => (
                  <div key={index} className="border border-gray-700 p-4 rounded bg-black/20">
                    <p className="text-gray-400">卖家: <span className="text-white">{trade.seller}</span></p>
                    <p className="text-gray-400">买家: <span className="text-white">{trade.buyer}</span></p>
                    <p className="text-gray-400">价格: <span className="text-white">
                      {ethers.BigNumber.isBigNumber(trade.price) 
                        ? ethers.utils.formatEther(trade.price) 
                        : trade.price} BNB
                    </span></p>
                    <p className="text-gray-400">时间: <span className="text-white">{trade.time.toLocaleString()}</span></p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">暂无交易记录</p>
              )}
            </div>
            <button
              onClick={() => {
                setShowNFTHistoryModal(false);
                setSelectedNFTHistory([]);
              }}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
      {/* 用户交易历史弹窗 */}
      {showUserHistoryModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-[#1A2438] p-6 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h2 className="text-2xl font-bold mb-4 text-white">我的交易历史</h2>
            <div className="space-y-4">
              {userHistory.trades.length > 0 ? (
                userHistory.trades.map((trade, index) => (
                  <div key={index} className="border border-gray-700 p-4 rounded bg-black/20">
                    <p className="text-gray-400">NFT ID: <span className="text-white">#{userHistory.tokenIds[index]}</span></p>
                    <p className="text-gray-400">卖家: <span className="text-white">{trade.seller}</span></p>
                    <p className="text-gray-400">买家: <span className="text-white">{trade.buyer}</span></p>
                    <p className="text-gray-400">价格: <span className="text-white">
                      {ethers.BigNumber.isBigNumber(trade.price) 
                        ? ethers.utils.formatEther(trade.price) 
                        : trade.price} BNB
                    </span></p>
                    <p className="text-gray-400">时间: <span className="text-white">{trade.time.toLocaleString()}</span></p>
                  </div>
                ))
              ) : (
                <p className="text-gray-400">暂无交易记录</p>
              )}
            </div>
            <button
              onClick={() => setShowUserHistoryModal(false)}
              className="mt-4 bg-gray-600 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              关闭
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default NFTMarket;
