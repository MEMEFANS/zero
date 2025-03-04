import React, { useState, useEffect, useContext } from 'react';
import { useWeb3React } from '@web3-react/core';
import { ethers } from 'ethers';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { injected } from '../utils/connectors';
import { 
  ZONE_NFT_ADDRESS, 
  ZONE_NFT_ABI, 
  NFT_RARITY,
  NFT_RARITY_COLORS,
  NFT_SETTINGS,
  NFT_IMAGES,
  NFT_MINING_ADDRESS,
  NFT_MARKETPLACE_ADDRESS,
  NFT_MARKETPLACE_ABI,
  STAKING_ADDRESS,
  STAKING_ABI
} from '../constants/contracts';
import { LanguageContext } from '../App';

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
  const [holderCount, setHolderCount] = useState(0);
  const [listingInProgress, setListingInProgress] = useState(false);

  // 合约相关状态变量
  const [nftContract, setNFTContract] = useState(null);
  const [nftMarketContract, setNFTMarketContract] = useState(null);
  const [stakingContract, setStakingContract] = useState(null);
  const [stakingContractAddress] = useState(STAKING_ADDRESS);  
  const [isInitialized, setIsInitialized] = useState(false);

  // 过滤和排序函数
  const getFilteredAndSortedItems = (items) => {
    try {
      if (!Array.isArray(items)) return [];
      
      return items
        .filter(item => {
          // 确保 item 是有效的对象
          if (!item || typeof item !== 'object') return false;
          // 确保必要的属性存在
          if (!item.tokenId || !item.rarity) return false;
          return true;
        })
        .map(item => ({
          ...item,
          // 确保所有必要的属性都有默认值
          tokenId: item.tokenId.toString(),
          rarity: item.rarity || 'Common',
          power: item.power?.toString() || '0',
          price: item.price?.toString() || '0'
        }))
        .sort((a, b) => {
          // 按稀有度和 power 排序
          const rarityOrder = {
            'Legendary': 4,
            'Epic': 3,
            'Rare': 2,
            'Common': 1
          };
          
          const rarityDiff = (rarityOrder[b.rarity] || 0) - (rarityOrder[a.rarity] || 0);
          if (rarityDiff !== 0) return rarityDiff;
          
          // 相同稀有度按 power 排序
          const powerA = parseInt(a.power) || 0;
          const powerB = parseInt(b.power) || 0;
          return powerB - powerA;
        });
    } catch (error) {
      console.error('Error in getFilteredAndSortedItems:', error);
      return [];
    }
  };

  const connectWallet = async () => {
    try {
      await activate(injected);
    } catch (error) {
      console.error('Error connecting wallet:', error);
    }
  };

  // 转换 IPFS 链接为 HTTP 链接
  const convertIPFStoHTTP = (ipfsUrl) => {
    if (!ipfsUrl) return '';
    // 如果已经是 HTTP 链接，直接返回
    if (ipfsUrl.startsWith('http')) return ipfsUrl;
    // 将 ipfs:// 转换为 IPFS 网关链接
    const ipfsGateway = 'https://ipfs.io/ipfs/';
    const cid = ipfsUrl.replace('ipfs://', '');
    return ipfsGateway + cid;
  };

  useEffect(() => {
    console.log('Effect triggered:', { active, account, library });
    if (active && account && library) {
      console.log('Loading market data...');
      console.log('NFT Contract:', ZONE_NFT_ADDRESS);
      console.log('Market Contract:', NFT_MARKETPLACE_ADDRESS);
      loadMarketData();
    }
  }, [active, account, library]);

  // 初始化合约
  useEffect(() => {
    const initializeContracts = async () => {
      if (!library || !active) {
        console.log('Web3 not ready yet');
        return;
      }

      try {
        console.log('Initializing contracts...');
        const signer = library.getSigner();
        
        // 初始化 NFT 合约
        const nftContractInstance = new ethers.Contract(
          ZONE_NFT_ADDRESS,
          ZONE_NFT_ABI,
          signer
        );
        setNFTContract(nftContractInstance);

        // 初始化 NFT 市场合约
        const marketContractInstance = new ethers.Contract(
          NFT_MARKETPLACE_ADDRESS,
          NFT_MARKETPLACE_ABI,
          signer
        );
        setNFTMarketContract(marketContractInstance);

        // 初始化质押合约
        const stakingContractInstance = new ethers.Contract(
          stakingContractAddress,
          STAKING_ABI,
          signer
        );
        setStakingContract(stakingContractInstance);

        setIsInitialized(true);
        console.log('Contracts initialized successfully');
      } catch (error) {
        console.error('初始化合约失败:', error);
        toast.error('初始化合约失败，请刷新页面重试');
      }
    };

    initializeContracts();
  }, [library, active]);

  // 加载市场数据
  useEffect(() => {
    const loadData = async () => {
      if (!isInitialized || !nftContract || !nftMarketContract) {
        console.log('Waiting for contracts to initialize...');
        return;
      }

      try {
        console.log('Starting to load market data...');
        await loadMarketData();
      } catch (error) {
        console.error('加载市场数据失败:', error);
        toast.error('加载市场数据失败，请刷新页面重试');
      }
    };

    loadData();
  }, [isInitialized, nftContract, nftMarketContract]);

  const loadMarketData = async () => {
    try {
      setIsLoading(true);
      console.log('Starting to load market data...');

      // 获取我的 NFT
      const balance = await nftContract.balanceOf(account);
      console.log('My NFT balance:', balance.toString());

      // 获取所有tokenId
      const tokenPromises = [];
      for (let i = 0; i < balance; i++) {
        tokenPromises.push(nftContract.tokenOfOwnerByIndex(account, i));
      }
      const myTokenIds = await Promise.all(tokenPromises);
      console.log('My token IDs:', myTokenIds.map(id => id.toString()));

      // 获取每个NFT的数据
      const myNFTsPromises = myTokenIds.map(async (tokenId) => {
        try {
          console.log('Getting data for my NFT:', tokenId.toString());
          const attributes = await nftContract.getNFTAttributes(tokenId);
          console.log('Got attributes for my NFT:', tokenId.toString(), 'Raw attributes:', attributes);
          console.log('Attributes array:', Object.values(attributes));
          console.log('Attributes object:', {
            rarity: attributes[0]?.toString(),
            power: attributes[1]?.toString(),
            dailyReward: attributes[2]?.toString(),
            maxReward: attributes[3]?.toString(),
            minedAmount: attributes[4]?.toString(),
            isStaked: attributes[5],
            stakeTime: attributes[6]?.toString()
          });
          
          const marketInfo = await nftMarketContract.getNFTMarketInfo(tokenId);
          console.log('Got market info for my NFT:', tokenId.toString(), marketInfo);
          
          // 确保 rarity 是正确的格式
          let rarity = attributes[0];
          if (typeof rarity !== 'string') {
            rarity = ['N', 'R', 'SR', 'SSR'][Number(rarity)] || 'N';
          }
          console.log('Rarity for my NFT:', tokenId.toString(), rarity);
          
          // 获取 NFT 图片
          const imageURI = await nftContract.getNFTImageURI(tokenId);
          console.log('Got image URI for my NFT:', tokenId.toString(), imageURI);
          // 将 IPFS 链接转换为 HTTP 链接
          const httpImageURI = imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
          
          const nftData = {
            id: tokenId.toString(),
            tokenId: tokenId.toString(),
            rarity: rarity,
            power: attributes[1]?.toString() || '0',
            dailyReward: attributes[2] ? ethers.utils.formatEther(attributes[2]) : '0',
            maxReward: attributes[3] ? ethers.utils.formatEther(attributes[3]) : '0',
            minedAmount: attributes[4] ? ethers.utils.formatEther(attributes[4]) : '0',
            isStaked: attributes[5] || false,
            stakeTime: attributes[6]?.toString() || '0',
            image: httpImageURI,
            listed: marketInfo.isActive,
            price: marketInfo.isActive ? ethers.utils.formatEther(marketInfo.price) : '0'
          };
          console.log('Final NFT data:', nftData);
          return nftData;
        } catch (error) {
          console.error('Error getting NFT data for token', tokenId.toString(), ':', error);
          return null;
        }
      });

      const myNFTsData = (await Promise.all(myNFTsPromises)).filter(nft => nft !== null);
      console.log('My NFTs data:', myNFTsData);
      setMyNFTs(myNFTsData);

      // 获取市场上的 NFT
      const totalSupply = await nftContract.totalSupply();
      console.log('Total NFT supply:', totalSupply.toString());

      const marketItemsPromises = [];
      for (let tokenId = 1; tokenId <= totalSupply; tokenId++) {
        try {
          console.log('Checking market info for token:', tokenId);
          const marketInfo = await nftMarketContract.getNFTMarketInfo(tokenId);
          console.log('Market info for token:', tokenId, marketInfo);
          
          if (marketInfo.isActive) {
            marketItemsPromises.push(
              (async () => {
                try {
                  console.log('Getting attributes for listed NFT:', tokenId);
                  const attributes = await nftContract.getNFTAttributes(tokenId);
                  console.log('Got attributes for listed NFT:', tokenId, 'Raw attributes:', attributes);
                  console.log('Attributes array:', Object.values(attributes));
                  
                  console.log('Getting image URI for listed NFT:', tokenId);
                  const imageURI = await nftContract.getNFTImageURI(tokenId);
                  console.log('Got image URI for listed NFT:', tokenId, imageURI);
                  const httpImageURI = imageURI.replace('ipfs://', 'https://ipfs.io/ipfs/');
                  
                  let rarity = attributes[0];
                  if (typeof rarity !== 'string') {
                    rarity = ['N', 'R', 'SR', 'SSR'][Number(rarity)] || 'N';
                  }
                  console.log('Rarity for listed NFT:', tokenId, rarity);
                  
                  const nftData = {
                    id: tokenId.toString(),
                    tokenId: tokenId.toString(),
                    seller: marketInfo.seller,
                    price: ethers.utils.formatEther(marketInfo.price),
                    rarity: rarity,
                    power: attributes[1]?.toString() || '0',
                    dailyReward: attributes[2] ? ethers.utils.formatEther(attributes[2]) : '0',
                    maxReward: attributes[3] ? ethers.utils.formatEther(attributes[3]) : '0',
                    minedAmount: attributes[4] ? ethers.utils.formatEther(attributes[4]) : '0',
                    image: httpImageURI,
                    listed: true
                  };
                  console.log('Final market item data:', nftData);
                  return nftData;
                } catch (error) {
                  console.error('Error getting NFT data for token', tokenId, ':', error);
                  return null;
                }
              })()
            );
          }
        } catch (error) {
          console.error('Error checking market info for token', tokenId, ':', error);
        }
      }

      const marketItemsData = (await Promise.all(marketItemsPromises)).filter(item => item !== null);
      console.log('Final market items data:', marketItemsData);
      setMarketItems(marketItemsData);

      // 获取市场统计数据
      const [totalVol, dailyVol, floor] = await Promise.all([
        nftMarketContract.totalVolume(),
        nftMarketContract.dailyVolume(),
        nftMarketContract.floorPrice()
      ]);

      setMarketStats({
        totalVolume: ethers.utils.formatEther(totalVol),
        dailyVolume: ethers.utils.formatEther(dailyVol),
        floorPrice: ethers.utils.formatEther(floor),
        totalListings: marketItemsData.length,
        totalHolders: await nftContract.balanceOf(account)
      });

      setIsLoading(false);
    } catch (error) {
      console.error('Error loading market data:', error);
      setIsLoading(false);
      toast.error('加载市场数据失败: ' + error.message);
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
    const cachedCount = localStorage.getItem('holderCount');
    const timestamp = localStorage.getItem('holderCountTimestamp');
    const now = Date.now();
    
    // 如果缓存存在且不超过5分钟
    if (cachedCount && timestamp && now - timestamp < 5 * 60 * 1000) {
      setHolderCount(parseInt(cachedCount));
    }
  }, []);

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

  const handleOpenListingModal = (nft) => {
    if (!nft || !nft.tokenId) {
      toast.error('无效的 NFT');
      return;
    }
    console.log('Opening listing modal for NFT:', nft);
    setSelectedListingNFT(nft);
    setShowListingModal(true);
  };

  const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

  const retry = async (fn, retries = 3, delayMs = 1000) => {
    try {
      return await fn();
    } catch (error) {
      if (retries <= 1) throw error;
      await delay(delayMs);
      return retry(fn, retries - 1, delayMs * 2);
    }
  };

  const handleListConfirm = async (price) => {
    try {
      if (!selectedListingNFT || !selectedListingNFT.tokenId) {
        toast.error('未选择有效的 NFT');
        return;
      }

      if (!price || isNaN(price) || parseFloat(price) < 0.01) {
        toast.error('价格必须大于等于 0.01 BNB');
        return;
      }

      const signer = library.getSigner();
      
      // 创建合约实例
      const marketContract = new ethers.Contract(
        NFT_MARKETPLACE_ADDRESS, 
        NFT_MARKETPLACE_ABI, 
        signer
      );

      const nftContract = new ethers.Contract(
        ZONE_NFT_ADDRESS, 
        ZONE_NFT_ABI, 
        signer
      );

      console.log('Market Contract Address:', NFT_MARKETPLACE_ADDRESS);
      console.log('NFT Contract Address:', ZONE_NFT_ADDRESS);
      console.log('Token ID:', selectedListingNFT.tokenId);
      console.log('Price:', price);

      // 检查合约是否暂停
      const isPaused = await marketContract.paused();
      console.log('Market Paused:', isPaused);
      if (isPaused) {
        toast.error('市场合约已暂停，请稍后再试');
        return;
      }

      const tokenId = selectedListingNFT.tokenId;
      const priceInWei = ethers.utils.parseEther(price.toString());
      console.log('Price in Wei:', priceInWei.toString());

      try {
        // 检查是否已授权
        const isApproved = await nftContract.isApprovedForAll(account, NFT_MARKETPLACE_ADDRESS);
        console.log('Is Approved:', isApproved);
        
        if (!isApproved) {
          console.log('Approving NFT...');
          const approveTx = await nftContract.setApprovalForAll(NFT_MARKETPLACE_ADDRESS, true);
          console.log('Approval transaction sent:', approveTx.hash);
          await approveTx.wait();
          console.log('Approval confirmed');
        }

        // 检查是否是 NFT 所有者
        const owner = await nftContract.ownerOf(tokenId);
        console.log('NFT Owner:', owner);
        console.log('Current Account:', account);
        if (owner.toLowerCase() !== account.toLowerCase()) {
          toast.error('您不是该 NFT 的所有者');
          return;
        }

        // 检查 NFT 是否已在市场上
        const [isActive] = await marketContract.getNFTMarketInfo(tokenId);
        console.log('Is NFT Active in Market:', isActive);
        if (isActive) {
          toast.error('该 NFT 已在市场上');
          return;
        }

        // 检查最低价格
        const minPrice = await marketContract.minPrice();
        console.log('Min Price:', ethers.utils.formatEther(minPrice), 'BNB');
        if (priceInWei.lt(minPrice)) {
          toast.error(`价格太低，最低价格为 ${ethers.utils.formatEther(minPrice)} BNB`);
          return;
        }

        // 检查 NFT 状态
        const nftAttributes = await nftContract.getNFTAttributes(tokenId);
        console.log('NFT Attributes:', {
          rarity: nftAttributes[0],
          power: nftAttributes[1].toString(),
          dailyReward: nftAttributes[2].toString(),
          maxReward: nftAttributes[3].toString(),
          minedAmount: nftAttributes[4].toString(),
          isStaked: nftAttributes[5],
          stakeTime: nftAttributes[6].toString()
        });
        
        const isStaked = nftAttributes[5];
        if (isStaked) {
          toast.error('该 NFT 已被质押，无法上架');
          return;
        }

        // 调用上架
        console.log('Listing NFT...');
        try {
          const estimatedGas = await marketContract.estimateGas.listNFT(tokenId, priceInWei);
          console.log('Estimated gas:', estimatedGas.toString());
          
          const tx = await marketContract.listNFT(tokenId, priceInWei, {
            gasLimit: estimatedGas.mul(120).div(100) // 增加 20% 的 gas 限制
          });
          
          console.log('Transaction sent:', tx.hash);
          setListingInProgress(true);
          
          const receipt = await tx.wait();
          console.log('Transaction confirmed:', receipt);
          
          // 检查事件
          const listEvent = receipt.events?.find(e => e.event === 'NFTListed');
          if (listEvent) {
            console.log('NFTListed event:', listEvent.args);
            toast.success('NFT 上架成功！');
            setShowListingModal(false);
            loadMarketData();
          } else {
            console.error('No NFTListed event found in receipt');
            toast.error('上架交易已确认，但未找到上架事件');
          }
        } catch (error) {
          console.error('List NFT error:', error);
          if (error.code === 'ACTION_REJECTED') {
            toast.error('您取消了交易');
          } else if (error.code === -32603) {
            toast.error('交易执行失败，请检查 Gas 费用');
          } else {
            toast.error(`上架失败: ${error.message || '未知错误'}`);
          }
        } finally {
          setListingInProgress(false);
        }
      } catch (error) {
        console.error('Inner Error:', error);
        if (error.message.includes('user rejected')) {
          toast.error('您取消了操作');
        } else if (error.message.includes('Not token owner')) {
          toast.error('您不是该 NFT 的所有者');
        } else if (error.message.includes('NFT is staked')) {
          toast.error('该 NFT 已被质押，无法上架');
        } else if (error.message.includes('Already listed')) {
          toast.error('该 NFT 已在市场上');
        } else if (error.message.includes('Price too low')) {
          toast.error('价格太低，最低价格为 0.01 BNB');
        } else if (error.message.includes('paused')) {
          toast.error('市场合约已暂停，请稍后再试');
        } else {
          console.error('Transaction Error:', error);
          console.error('Error Code:', error.code);
          console.error('Error Data:', error.data);
          toast.error('操作失败，请查看控制台了解详细信息');
        }
      }
    } catch (error) {
      console.error('Outer Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Data:', error.data);
      toast.error('操作失败，请查看控制台了解详细信息');
    }
  };

  const handleDelist = async (nftId) => {
    try {
      const signer = library.getSigner();
      const marketContract = new ethers.Contract(
        NFT_MARKETPLACE_ADDRESS,
        NFT_MARKETPLACE_ABI,
        signer
      );

      // 检查是否是上架者
      const [isActive, , seller] = await marketContract.getNFTMarketInfo(nftId);
      if (!isActive) {
        toast.error('该 NFT 未在市场上');
        return;
      }
      if (seller.toLowerCase() !== account.toLowerCase()) {
        toast.error('您不是该 NFT 的上架者');
        return;
      }

      console.log('Delisting NFT...');
      const tx = await marketContract.unlistNFT(nftId, {
        gasLimit: 300000
      });
      console.log('Transaction sent:', tx.hash);
      
      const receipt = await tx.wait();
      console.log('Transaction confirmed:', receipt);

      // 重新加载数据
      loadMarketData();
      toast.success('NFT 下架成功！');
    } catch (error) {
      console.error('Error:', error);
      if (error.message.includes('user rejected')) {
        toast.error('您取消了操作');
      } else if (error.message.includes('Not listed')) {
        toast.error('该 NFT 未在市场上');
      } else if (error.message.includes('Not seller')) {
        toast.error('您不是该 NFT 的上架者');
      } else {
        toast.error('下架失败: ' + error.message);
      }
    }
  };

  const handleStake = async (nft) => {
    try {
      const stakingContract = new ethers.Contract(NFT_MINING_ADDRESS, STAKING_ABI, library.getSigner());
      const nftContract = new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, library.getSigner());

      // 检查是否已授权
      const isApproved = await nftContract.isApprovedForAll(account, NFT_MINING_ADDRESS);
      if (!isApproved) {
        // 请求授权
        const tx = await nftContract.setApprovalForAll(NFT_MINING_ADDRESS, true);
        await tx.wait();
      }

      // 质押 NFT
      const tx = await stakingContract.stake(nft.id);
      await tx.wait();

      // 重新加载数据
      loadMarketData();
    } catch (error) {
      console.error('Error staking NFT:', error);
    }
  };

  // 处理 NFT 上架
  const handleListNFT = async (nft) => {
    try {
      setIsLoading(true);
      const price = window.prompt('请输入上架价格（BNB）：');
      if (!price) {
        setIsLoading(false);
        return;
      }

      const priceInWei = ethers.utils.parseEther(price);
      const tx = await nftMarketContract.listNFT(nft.tokenId, priceInWei);
      await tx.wait();

      // 更新市场数据
      await loadMarketData();
      toast.success('NFT 上架成功！');
    } catch (error) {
      console.error('上架 NFT 失败:', error);
      toast.error('上架 NFT 失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 处理 NFT 质押
  const handleStakeNFT = async (nft) => {
    try {
      setIsLoading(true);
      // 首先需要批准质押合约操作 NFT
      const isApproved = await nftContract.isApprovedForAll(account, stakingContractAddress);
      if (!isApproved) {
        const approveTx = await nftContract.setApprovalForAll(stakingContractAddress, true);
        await approveTx.wait();
      }

      // 执行质押
      const tx = await stakingContract.stake(nft.tokenId);
      await tx.wait();

      // 更新数据
      await loadMarketData();
      toast.success('NFT 质押成功！');
    } catch (error) {
      console.error('质押 NFT 失败:', error);
      toast.error('质押 NFT 失败，请重试');
    } finally {
      setIsLoading(false);
    }
  };

  // 市场统计组件
  const MarketStats = () => {
    return (
      <div className="grid grid-cols-4 gap-4 mb-8 text-center text-white">
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm">总交易额</div>
          <div className="text-xl font-bold">
            {typeof marketStats.totalVolume === 'object' && marketStats.totalVolume._isBigNumber
              ? ethers.utils.formatEther(marketStats.totalVolume)
              : marketStats.totalVolume} BNB
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm">24h交易额</div>
          <div className="text-xl font-bold">
            {typeof marketStats.dailyVolume === 'object' && marketStats.dailyVolume._isBigNumber
              ? ethers.utils.formatEther(marketStats.dailyVolume)
              : marketStats.dailyVolume} BNB
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm">地板价</div>
          <div className="text-xl font-bold">
            {typeof marketStats.floorPrice === 'object' && marketStats.floorPrice._isBigNumber
              ? ethers.utils.formatEther(marketStats.floorPrice)
              : marketStats.floorPrice} BNB
          </div>
        </div>
        <div className="bg-gray-800 p-4 rounded-lg">
          <div className="text-sm">持有人数</div>
          <div className="text-xl font-bold">
            {typeof marketStats.totalHolders === 'object' && marketStats.totalHolders._isBigNumber
              ? marketStats.totalHolders.toString()
              : marketStats.totalHolders}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">NFT 交易市场</h1>

      {!active ? (
        <div className="text-center">
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <MarketStats />

          <div className="mb-6">
            <input
              type="text"
              placeholder="搜索 NFT..."
              className="w-full p-2 bg-gray-800 text-white rounded-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <select
              className="w-full p-2 bg-gray-800 text-white rounded-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">排序方式</option>
              <option value="priceAsc">价格从低到高</option>
              <option value="priceDesc">价格从高到低</option>
              <option value="powerAsc">算力从低到高</option>
              <option value="powerDesc">算力从高到低</option>
            </select>
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setFilterType('all')}
            >
              全部
            </button>
            {NFT_RARITY.map((rarity) => (
              <button
                key={rarity}
                className={`px-4 py-2 rounded-lg ${filterType === rarity ? 'bg-green-600' : 'bg-gray-800'} text-white`}
                onClick={() => setFilterType(rarity)}
              >
                {rarity}
              </button>
            ))}
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'market' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('market')}
            >
              市场列表
            </button>
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'my-nfts' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('my-nfts')}
            >
              我的 NFT
            </button>
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'history' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('history')}
            >
              交易历史
            </button>
          </div>

          {isLoading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <div className="mt-4">加载中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedTab === 'market' && marketItems.map((item) => (
                <div key={item.tokenId} className="bg-gray-800 rounded-lg overflow-hidden">
                  <img src={item.image} alt={`NFT #${item.tokenId}`} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold">#{item.tokenId}</span>
                        <span className={`px-2 py-1 rounded ${NFT_RARITY_COLORS[item.rarity].bg}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="mb-2">算力: {parseFloat(item.power).toFixed(4)}</div>
                      <div className="mb-2">每日收益: {parseFloat(item.dailyReward).toFixed(4)} BNB</div>
                      <div className="mb-2">已挖矿量: {parseFloat(item.minedAmount).toFixed(4)} BNB</div>
                      <div className="mb-4">价格: {item.price} BNB</div>
                      <button
                        onClick={() => handleBuyNFT(item)}
                        className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
                      >
                        购买
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              {selectedTab === 'my-nfts' && myNFTs.map((item) => (
                <div key={item.tokenId} className="bg-gray-800 rounded-lg overflow-hidden">
                  <img src={item.image} alt={`NFT #${item.tokenId}`} className="w-full h-48 object-cover" />
                  <div className="p-4">
                    <div className="text-white">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-lg font-bold">#{item.tokenId}</span>
                        <span className={`px-2 py-1 rounded ${NFT_RARITY_COLORS[item.rarity].bg}`}>
                          {item.rarity}
                        </span>
                      </div>
                      <div className="mb-2">算力: {parseFloat(item.power).toFixed(4)}</div>
                      <div className="mb-2">每日收益: {parseFloat(item.dailyReward).toFixed(4)} BNB</div>
                      {item.listed ? (
                        <div className="mb-4">已上架价格: {item.price} BNB</div>
                      ) : (
                        <button
                          onClick={() => handleListNFT(item)}
                          className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors mb-2"
                        >
                          上架出售
                        </button>
                      )}
                      {false && !item.isStaked && (
                        <button
                          onClick={() => handleStakeNFT(item)}
                          className="w-full bg-purple-600 text-white px-4 py-2 rounded-lg hover:bg-purple-700 transition-colors"
                        >
                          质押挖矿
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );

  // NFT卡片组件
  const NFTCard = ({ nft, isMyNFT }) => {
    if (!nft || !nft.tokenId) return null;

    return (
      <div className="bg-[#1E2328] rounded-xl overflow-hidden">
        <div className="relative aspect-square">
          <img 
            src={nft.image}
            alt={`NFT #${nft.tokenId}`}
            className="w-full h-full object-cover"
            onError={(e) => {
              console.error('Image load error for NFT:', nft);
              e.target.onerror = null;
              // 如果图片加载失败，显示一个基于 rarity 的颜色块
              e.target.style.backgroundColor = {
                'N': '#6c757d',
                'R': '#0dcaf0',
                'SR': '#6f42c1',
                'SSR': '#ffc107'
              }[nft.rarity] || '#6c757d';
            }}
          />
          <div className="absolute top-2 right-2 px-2 py-1 bg-black/50 rounded text-sm font-medium text-white">
            {nft.rarity}
          </div>
        </div>
        <div className="p-4">
          <div className="flex justify-between items-center mb-2">
            <div className="text-gray-200">#{nft.tokenId}</div>
            <div className="text-gray-200">Power: {parseFloat(nft.power).toFixed(4)} H/s</div>
          </div>
          {!isMyNFT && nft.price && (
            <div className="flex justify-between items-center mb-4">
              <div className="text-gray-400 text-sm">Price</div>
              <div className="text-[#F3BA2F]">{nft.price} BNB</div>
            </div>
          )}
          <button
            onClick={() => isMyNFT ? handleOpenListingModal(nft) : handleBuyNFT(nft)}
            className="w-full bg-[#282C34] text-gray-200 font-medium py-2 rounded-lg hover:bg-[#2C3137] transition-colors"
          >
            {isMyNFT ? '上架' : '购买'}
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
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
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-2xl font-bold text-white">#{nft.id}</h3>
                <div className="flex items-center gap-2">
                  <span className="text-gray-400">{t('owner')}:</span>
                  <span className="text-white">{nft.owner?.slice(0, 6)}...{nft.owner?.slice(-4)}</span>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('power')}</div>
                  <div className="text-xl font-bold text-white">{parseFloat(nft.power).toFixed(4)} H/s</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('dailyReward')}</div>
                  <div className="text-xl font-bold text-white">{parseFloat(nft.dailyReward).toFixed(4)} ZONE</div>
                </div>
                <div className="bg-black/20 p-4 rounded-lg">
                  <div className="text-gray-400 mb-1">{t('maxReward')}</div>
                  <div className="text-xl font-bold text-white">{parseFloat(nft.maxReward).toFixed(4)} ZONE</div>
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
                          handleOpenListingModal(nft);
                          onClose();
                        }}
                        className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
                      >
                        {t('sellNow')}
                      </button>
                      <button
                        onClick={() => {
                          handleStake(nft);
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
  const ListingModal = ({ onClose }) => {
    const [listingPrice, setListingPrice] = useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      if (!selectedListingNFT || !selectedListingNFT.tokenId) {
        toast.error('未选择有效的 NFT');
        return;
      }
      if (listingPrice && parseFloat(listingPrice) > 0) {
        handleListConfirm(listingPrice);
      }
    };

    if (!selectedListingNFT) return null;

    return (
      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center">
        <div className="bg-[#1E2328] w-[280px] rounded-xl">
          <div className="flex justify-between items-center h-12 px-4">
            <div className="text-sm font-medium text-gray-200">上架 NFT #{selectedListingNFT.tokenId}</div>
            <button onClick={onClose} className="text-gray-400 hover:text-gray-200 text-lg">×</button>
          </div>
          <div className="px-4 pb-4">
            <form onSubmit={handleSubmit}>
              <div className="relative">
                <input
                  type="number"
                  value={listingPrice}
                  onChange={(e) => {
                    const value = e.target.value;
                    if (value === '' || parseFloat(value) >= 0) {
                      setListingPrice(value);
                    }
                  }}
                  placeholder="0.0"
                  step="0.000000000000000001"
                  min="0"
                  className="w-full h-10 bg-[#282C34] text-sm text-gray-200 px-3 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#F3BA2F] [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                />
                <div className="absolute right-0 top-0 bottom-0 flex items-center pr-3 text-[#F3BA2F] text-xs font-medium">
                  BNB
                </div>
              </div>
              <button
                type="submit"
                disabled={!listingPrice || parseFloat(listingPrice) <= 0}
                className={`w-full h-10 mt-3 rounded-lg text-sm font-medium transition-colors ${
                  listingPrice && parseFloat(listingPrice) > 0
                    ? 'bg-gradient-to-r from-[#F3BA2F] to-[#F0B90B] hover:from-[#F5C332] hover:to-[#F2BC0E] text-black'
                    : 'bg-[#282C34] text-gray-500 cursor-not-allowed'
                }`}
              >
                确认上架
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
              <h3 className="text-2xl font-bold text-white">质押 NFT</h3>
              <button onClick={onClose} className="text-gray-400 hover:text-white">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-4">
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('power')}</div>
                <div className="text-xl font-bold text-white">{parseFloat(nft.power).toFixed(4)} H/s</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('dailyReward')}</div>
                <div className="text-xl font-bold text-white">{parseFloat(nft.dailyReward).toFixed(4)} ZONE</div>
              </div>
              <div className="bg-black/20 p-4 rounded-lg">
                <div className="text-gray-400 mb-1">{t('maxReward')}</div>
                <div className="text-xl font-bold text-white">{parseFloat(nft.maxReward).toFixed(4)} ZONE</div>
              </div>

              <button
                onClick={() => {
                  handleStake(nft);
                  onClose();
                }}
                className="w-full bg-green-500 text-white font-bold py-3 px-4 rounded-lg hover:bg-green-600 transition-colors"
              >
                确认质押
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // NFT 图片映射
  const NFT_IMAGES = {
    'Common': '/images/nft/common.png',
    'Rare': '/images/nft/rare.png',
    'Epic': '/images/nft/epic.png',
    'Legendary': '/images/nft/legendary.png'
  };

  // 获取 NFT 图片
  const getNFTImage = (rarity) => {
    return NFT_IMAGES[rarity] || NFT_IMAGES['Common'];
  };

  // 购买 NFT
  const handleBuyNFT = async (nft) => {
    try {
      if (!nft || !nft.tokenId || !nft.price) {
        toast.error('无效的 NFT 信息');
        return;
      }

      const marketContract = new ethers.Contract(NFT_MARKETPLACE_ADDRESS, NFT_MARKETPLACE_ABI, library.getSigner());

      // 购买 NFT
      console.log('Buying NFT:', {
        tokenId: nft.tokenId,
        price: nft.price
      });

      const tx = await marketContract.buyNFT(nft.tokenId, {
        value: ethers.utils.parseEther(nft.price.toString()),
        gasLimit: ethers.BigNumber.from(500000) // 使用固定的 gas limit
      });

      await tx.wait();

      // 重新加载数据
      loadMarketData();
      toast.success('NFT 购买成功！');
    } catch (error) {
      console.error('Error buying NFT:', error);
      if (error.message.includes('user rejected transaction')) {
        toast.error('您取消了交易');
      } else {
        toast.error('购买失败，请重试: ' + error.message);
      }
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-4xl font-bold mb-8 text-center text-white">NFT 交易市场</h1>

      {!active ? (
        <div className="text-center">
          <button
            onClick={connectWallet}
            className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            连接钱包
          </button>
        </div>
      ) : (
        <>
          <MarketStats />

          <div className="mb-6">
            <input
              type="text"
              placeholder="搜索 NFT..."
              className="w-full p-2 bg-gray-800 text-white rounded-lg"
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="mb-6">
            <select
              className="w-full p-2 bg-gray-800 text-white rounded-lg"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="default">排序方式</option>
              <option value="priceAsc">价格从低到高</option>
              <option value="priceDesc">价格从高到低</option>
              <option value="powerAsc">算力从低到高</option>
              <option value="powerDesc">算力从高到低</option>
            </select>
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              className={`px-4 py-2 rounded-lg ${filterType === 'all' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setFilterType('all')}
            >
              全部
            </button>
            {NFT_RARITY.map((rarity) => (
              <button
                key={rarity}
                className={`px-4 py-2 rounded-lg ${filterType === rarity ? 'bg-green-600' : 'bg-gray-800'} text-white`}
                onClick={() => setFilterType(rarity)}
              >
                {rarity}
              </button>
            ))}
          </div>

          <div className="flex space-x-4 mb-8">
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'market' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('market')}
            >
              市场列表
            </button>
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'my-nfts' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('my-nfts')}
            >
              我的 NFT
            </button>
            <button
              className={`px-6 py-2 rounded-lg ${selectedTab === 'history' ? 'bg-green-600' : 'bg-gray-800'} text-white`}
              onClick={() => setSelectedTab('history')}
            >
              交易历史
            </button>
          </div>

          {isLoading ? (
            <div className="text-center text-white">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500 mx-auto"></div>
              <div className="mt-4">加载中...</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {selectedTab === 'market' && marketItems.map((item) => (
                <NFTCard key={item.tokenId} nft={item} isMyNFT={false} />
              ))}
              {selectedTab === 'my-nfts' && myNFTs.map((item) => (
                <NFTCard key={item.tokenId} nft={item} isMyNFT={true} />
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default NFTMarket;
