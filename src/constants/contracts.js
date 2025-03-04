export const ZONE_NFT_ADDRESS = "0x73b9A33D78AD18804C898946b315CF515D798666"; // 新部署的合约地址
export const ZONE_TOKEN_ADDRESS = "0xfc57f8625688D85A332437FF1aacE8731d952955"; // 正确的 ZONE 代币地址
export const NFT_MARKETPLACE_ADDRESS = "0xa0A286938BeDa5b2061F680b6A47577750c908Ab";  // 新部署的市场合约地址
export const NFT_MINING_ADDRESS = "0x71fcB50d20052511b545A9f42E2F857aaCB5b76a";
export const REFERRAL_REGISTRY_ADDRESS = "0x32Ef65Add373412446400F3A6Ed460f61E599360";
export const IDO_DISTRIBUTOR_ADDRESS = "0xBcFFfC6D090daF69E46D30cfaf49e39d4ce77ef1";
export const STAKING_ADDRESS = "0x...";  // TODO: 需要替换为实际的质押合约地址

export const ZONE_NFT_ABI = [
  "function openBox() external returns (uint256)",
  "function boxPrice() view returns (uint256)",
  "function getNFTAttributes(uint256) view returns (uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime)",
  "function paused() view returns (bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getNFTImageURI(uint256 tokenId) view returns (string)",
  "function getNFTImage(uint256 tokenId) view returns (string)",
  "event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity)",
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId) external",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId) external",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data) external",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function totalSupply() view returns (uint256)"
];

export const ZONE_TOKEN_ABI = [
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

export const NFT_MARKETPLACE_ABI = [
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function unlistNFT(uint256 tokenId) external",
  "function buyNFT(uint256 tokenId) external payable",
  "function batchListNFTs(uint256[] tokenIds, uint256[] prices) external",
  "function batchUnlistNFTs(uint256[] tokenIds) external",
  "function minPrice() view returns (uint256)",
  "function marketFeeRate() view returns (uint256)",
  "function totalVolume() view returns (uint256)",
  "function dailyVolume() view returns (uint256)",
  "function floorPrice() view returns (uint256)",
  "function paused() view returns (bool)",
  "function getNFTMarketInfo(uint256 tokenId) view returns (bool isActive, uint256 price, address seller)",
  "event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price)",
  "event NFTUnlisted(uint256 indexed tokenId, address indexed seller)",
  "event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price)",
  "event BatchNFTsListed(uint256[] tokenIds, uint256[] prices)",
  "event BatchNFTsUnlisted(uint256[] tokenIds)",
  "event MarketFeeUpdated(uint256 newFee)",
  "event FeeReceiverUpdated(address newReceiver)",
  "event MinPriceUpdated(uint256 newMinPrice)",
  "event Paused(address account)",
  "event Unpaused(address account)"
];

export const STAKING_ABI = [
  "function stake(uint256 tokenId) external",
  "function unstake(uint256 tokenId) external",
  "function getStakingInfo(uint256 tokenId) view returns (bool isStaked, uint256 stakeTime, uint256 rewards)",
  "function claimRewards(uint256 tokenId) external returns (uint256)",
  "function getClaimableRewards(uint256 tokenId) view returns (uint256)",
  "event Staked(address indexed user, uint256 indexed tokenId)",
  "event Unstaked(address indexed user, uint256 indexed tokenId)",
  "event RewardsClaimed(address indexed user, uint256 indexed tokenId, uint256 amount)"
];

export const NFT_RARITY = ['N', 'R', 'SR', 'SSR'];

export const NFT_RARITY_COLORS = {
  'N': {
    text: 'text-white',
    bg: 'bg-slate-700',
    border: 'border-slate-600',
    gradient: 'from-slate-800 to-slate-700'
  },
  'R': {
    text: 'text-white',
    bg: 'bg-blue-700',
    border: 'border-blue-600',
    gradient: 'from-blue-800 to-blue-700'
  },
  'SR': {
    text: 'text-white',
    bg: 'bg-purple-700',
    border: 'border-purple-600',
    gradient: 'from-purple-800 to-purple-700'
  },
  'SSR': {
    text: 'text-white',
    bg: 'bg-amber-700',
    border: 'border-amber-600',
    gradient: 'from-amber-800 to-amber-700'
  }
};

// NFT 图片配置
export const NFT_IMAGES = {
  'N': [
    '/images/nft-images/n-1.png',
    '/images/nft-images/n-2.png',
    '/images/nft-images/n-3.png',
    '/images/nft-images/n-4.png'
  ],
  'R': [
    '/images/nft-images/r-1.png',
    '/images/nft-images/r-2.png',
    '/images/nft-images/r-3.png',
    '/images/nft-images/r-4.png'
  ],
  'SR': [
    '/images/nft-images/sr-1.png',
    '/images/nft-images/sr-2.png',
    '/images/nft-images/sr-3.png',
    '/images/nft-images/sr-4.png'
  ],
  'SSR': [
    '/images/nft-images/ssr-1.png',
    '/images/nft-images/ssr-2.png',
    '/images/nft-images/ssr-3.png',
    '/images/nft-images/ssr-4.png'
  ]
};

// 根据 NFT ID 和稀有度获取图片
export const getNFTImage = (rarity, tokenId) => {
  const images = NFT_IMAGES[rarity];
  const index = (tokenId - 1) % 4;  // 使用 NFT ID 来确定使用哪个图片
  return images[index];
};

export const NFT_SETTINGS = {
  N: { 
    power: 100, 
    price: 100, 
    dailyReward: 2.8, 
    maxReward: 252, 
    roi: 35.7, 
    yearReturn: 152,
    rate: 55,
    name: 'Normal',
    description: 'A common NFT with basic mining power'
  },
  R: { 
    power: 400, 
    price: 100, 
    dailyReward: 10, 
    maxReward: 900, 
    roi: 11.1, 
    yearReturn: 800,
    rate: 15,
    name: 'Rare',
    description: 'A rare NFT with enhanced mining capabilities'
  },
  SR: { 
    power: 1600, 
    price: 100, 
    dailyReward: 40, 
    maxReward: 3600, 
    roi: 2.8, 
    yearReturn: 3500,
    rate: 5,
    name: 'Super Rare',
    description: 'A super rare NFT with powerful mining abilities'
  },
  SSR: { 
    power: 6400, 
    price: 100, 
    dailyReward: 160, 
    maxReward: 14400, 
    roi: 0.7, 
    yearReturn: 14300,
    rate: 1,
    name: 'SSR',
    description: 'The most powerful NFT with exceptional mining power'
  }
};

// NFT 稀有度概率配置
export const NFT_PROBABILITIES = {
  N: 0.55,
  R: 0.15,
  SR: 0.20,
  SSR: 0.10
};
