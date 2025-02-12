export const MYSTERY_BOX_ADDRESS = "YOUR_MYSTERY_BOX_CONTRACT_ADDRESS";
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
  'N': 'text-gray-400',
  'R': 'text-blue-400',
  'SR': 'text-purple-400',
  'SSR': 'text-yellow-400'
};
