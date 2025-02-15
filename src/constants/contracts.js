export const MYSTERY_BOX_ADDRESS = "0x1234567890abcdef1234567890abcdef12345678";
export const ZONE_TOKEN_ADDRESS = "YOUR_ZONE_TOKEN_ADDRESS";
export const STAKING_ADDRESS = "YOUR_STAKING_CONTRACT_ADDRESS";

export const MYSTERY_BOX_ABI = [
  "function getMarketListing(uint256 tokenId) external view returns (tuple(address seller, uint256 price, bool isActive))",
  "function getNFTAttributes(uint256 tokenId) external view returns (tuple(uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime))",
  "function getOwnedNFTs(address user) external view returns (uint256[])",
  "function listNFT(uint256 tokenId, uint256 price) external",
  "function unlistNFT(uint256 tokenId) external",
  "function buyNFT(uint256 tokenId) external payable",
  "function stakeNFT(uint256 tokenId) external",
  "function approve(address to, uint256 tokenId) external",
  "function isApprovedForAll(address owner, address operator) external view returns (bool)",
  "function setApprovalForAll(address operator, bool approved) external",
  "function getTradeHistory(uint256 tokenId) external view returns (tuple(address seller, address buyer, uint256 price, uint256 timestamp)[])",
  "function getUserTradeHistory(address user) external view returns (uint256[], tuple(address seller, address buyer, uint256 price, uint256 timestamp)[])"
];

export const ZONE_TOKEN_ABI = [
  "function balanceOf(address account) external view returns (uint256)",
  "function allowance(address owner, address spender) external view returns (uint256)",
  "function approve(address spender, uint256 amount) external returns (bool)"
];

export const STAKING_ABI = [
  "function stake(uint256 tokenId) external"
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
    name: 'SSR',
    description: 'The most powerful NFT with exceptional mining power'
  }
};
