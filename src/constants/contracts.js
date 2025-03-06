import { ethers } from 'ethers';

export const ZONE_NFT_ADDRESS = "0x73b9A33D78AD18804C898946b315CF515D798666"; // 新部署的合约地址
export const ZONE_TOKEN_ADDRESS = "0xfc57f8625688D85A332437FF1aacE8731d952955"; // 正确的 ZONE 代币地址
export const MARKETPLACE_CONTRACT = "0xe2F4a532164c4917279f46ED70C66B15da4Fb887";  // 新部署的市场合约地址
export const NFT_MINING_ADDRESS = "0x4a2107DeBf85f6D9B39f4356Ca669c79342f942b";  // 新部署的挖矿合约地址
export const REFERRAL_REGISTRY_ADDRESS = "0x32Ef65Add373412446400F3A6Ed460f61E599360";
export const IDO_DISTRIBUTOR_ADDRESS = "0xBcFFfC6D090daF69E46D30cfaf49e39d4ce77ef1";
export const STAKING_ADDRESS = "0x...";  // TODO: 需要替换为实际的质押合约地址

export const ZONE_NFT_ABI = [
  // ERC721 基本功能
  "function balanceOf(address owner) view returns (uint256)",
  "function ownerOf(uint256 tokenId) view returns (address)",
  "function approve(address to, uint256 tokenId)",
  "function getApproved(uint256 tokenId) view returns (address)",
  "function setApprovalForAll(address operator, bool approved)",
  "function isApprovedForAll(address owner, address operator) view returns (bool)",
  "function transferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId)",
  "function safeTransferFrom(address from, address to, uint256 tokenId, bytes data)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function totalSupply() view returns (uint256)",

  // NFT 特定功能
  "function openBox() external returns (uint256)",
  "function boxPrice() view returns (uint256)",
  "function paused() view returns (bool)",
  "function tokenURI(uint256 tokenId) view returns (string)",
  "function getNFTImageURI(uint256 tokenId) view returns (string)",
  "function getNFTImage(uint256 tokenId) view returns (string)",
  "function getNFTAttributes(uint256 tokenId) view returns (uint8 rarity, uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, uint256 stakeTime)",
  "function updateStakeStatus(uint256 tokenId, bool isStaked)",
  
  // 权限相关
  "function STAKING_ROLE() view returns (bytes32)",
  "function hasRole(bytes32 role, address account) view returns (bool)",
  
  // 事件
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId)",
  "event ApprovalForAll(address indexed owner, address indexed operator, bool approved)",
  "event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity)"
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
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_nft",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "_feeReceiver",
        "type": "address"
      }
    ],
    "stateMutability": "nonpayable",
    "type": "constructor"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newReceiver",
        "type": "address"
      }
    ],
    "name": "FeeReceiverUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newFee",
        "type": "uint256"
      }
    ],
    "name": "MarketFeeUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "newMinPrice",
        "type": "uint256"
      }
    ],
    "name": "MinPriceUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "address",
        "name": "newNFT",
        "type": "address"
      }
    ],
    "name": "NFTContractUpdated",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "NFTListed",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "indexed": false,
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "NFTSold",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "seller",
        "type": "address"
      }
    ],
    "name": "NFTUnlisted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "previousAdminRole",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "newAdminRole",
        "type": "bytes32"
      }
    ],
    "name": "RoleAdminChanged",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleGranted",
    "type": "event"
  },
  {
    "anonymous": false,
    "inputs": [
      {
        "indexed": true,
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "account",
        "type": "address"
      },
      {
        "indexed": true,
        "internalType": "address",
        "name": "sender",
        "type": "address"
      }
    ],
    "name": "RoleRevoked",
    "type": "event"
  },
  {
    "inputs": [],
    "name": "ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "DEFAULT_ADMIN_ROLE",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "FEE_DENOMINATOR",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "activeListings",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "tokenIds",
        "type": "uint256[]"
      }
    ],
    "name": "batchBuyNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256[]",
        "name": "tokenIds",
        "type": "uint256[]"
      }
    ],
    "name": "batchUnlistNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "buyNFT",
    "outputs": [],
    "stateMutability": "payable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "dailyVolume",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "emergencyWithdraw",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "feeReceiver",
    "outputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "floorPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getActiveListings",
    "outputs": [
      {
        "internalType": "uint256[]",
        "name": "tokenIds",
        "type": "uint256[]"
      },
      {
        "internalType": "uint256[]",
        "name": "prices",
        "type": "uint256[]"
      },
      {
        "internalType": "address[]",
        "name": "sellers",
        "type": "address[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "getActiveListingsCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      }
    ],
    "name": "getRoleAdmin",
    "outputs": [
      {
        "internalType": "bytes32",
        "name": "",
        "type": "bytes32"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "user",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "offset",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "limit",
        "type": "uint256"
      }
    ],
    "name": "getTradeHistory",
    "outputs": [
      {
        "components": [
          {
            "internalType": "uint256",
            "name": "tokenId",
            "type": "uint256"
          },
          {
            "internalType": "address",
            "name": "seller",
            "type": "address"
          },
          {
            "internalType": "address",
            "name": "buyer",
            "type": "address"
          },
          {
            "internalType": "uint256",
            "name": "price",
            "type": "uint256"
          },
          {
            "internalType": "uint256",
            "name": "timestamp",
            "type": "uint256"
          }
        ],
        "internalType": "struct NFTMarketplace.TradeHistory[]",
        "name": "",
        "type": "tuple[]"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "grantRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "hasRole",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "lastVolumeReset",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      }
    ],
    "name": "listNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "listings",
    "outputs": [
      {
        "internalType": "bool",
        "name": "isActive",
        "type": "bool"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "marketFeeRate",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "minPrice",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "nft",
    "outputs": [
      {
        "internalType": "contract IZoneNFT",
        "name": "",
        "type": "address"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "renounceRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes32",
        "name": "role",
        "type": "bytes32"
      },
      {
        "internalType": "address",
        "name": "account",
        "type": "address"
      }
    ],
    "name": "revokeRole",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "newReceiver",
        "type": "address"
      }
    ],
    "name": "setFeeReceiver",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newFee",
        "type": "uint256"
      }
    ],
    "name": "setMarketFee",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "newMinPrice",
        "type": "uint256"
      }
    ],
    "name": "setMinPrice",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "_nft",
        "type": "address"
      }
    ],
    "name": "setNFTContract",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "bytes4",
        "name": "interfaceId",
        "type": "bytes4"
      }
    ],
    "name": "supportsInterface",
    "outputs": [
      {
        "internalType": "bool",
        "name": "",
        "type": "bool"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [],
    "name": "totalVolume",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "name": "tradeHistory",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      },
      {
        "internalType": "address",
        "name": "seller",
        "type": "address"
      },
      {
        "internalType": "address",
        "name": "buyer",
        "type": "address"
      },
      {
        "internalType": "uint256",
        "name": "price",
        "type": "uint256"
      },
      {
        "internalType": "uint256",
        "name": "timestamp",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "address",
        "name": "",
        "type": "address"
      }
    ],
    "name": "userTradeCount",
    "outputs": [
      {
        "internalType": "uint256",
        "name": "",
        "type": "uint256"
      }
    ],
    "stateMutability": "view",
    "type": "function"
  },
  {
    "inputs": [
      {
        "internalType": "uint256",
        "name": "tokenId",
        "type": "uint256"
      }
    ],
    "name": "unlistNFT",
    "outputs": [],
    "stateMutability": "nonpayable",
    "type": "function"
  }
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

export const NFT_MINING_ABI = [
  // 基本功能
  "function stakeNFT(uint256 tokenId) external",
  "function unstakeNFT(uint256 tokenId) external",
  "function claimReward() external",
  
  // 管理员功能
  "function pause() external",
  "function unpause() external",
  "function setFeeReceiver(address feeReceiver) external",
  "function setLevelConfig(uint256 level, uint256 minPower, uint256 maxPower, uint256 bonusRate, uint256 teamRequired, uint256 teamBonusRate) external",
  "function setMarketFeeRate(uint256 marketFeeRate) external",
  "function setReferrer(address referrer) external",
  
  // 查询函数
  "function nft() external view returns (address)",
  "function zoneToken() external view returns (address)",
  "function referralRegistry() external view returns (address)",
  "function ADMIN_ROLE() external view returns (bytes32)",
  "function currentMaxLevel() external view returns (uint256)",
  "function dailyVolume() external view returns (uint256)",
  "function getClaimableReward(address user) external view returns (uint256 reward, uint256 totalTeamBonus)",
  "function getUserStakeInfo(address user) external view returns (uint256 totalPower, uint256 directPower, uint256 teamPower, uint256 level, uint256 lastClaimTime, uint256[] memory tokenIds)",
  
  // 权限相关
  "function hasRole(bytes32 role, address account) external view returns (bool)",
  "function grantRole(bytes32 role, address account) external",
  "function revokeRole(bytes32 role, address account) external",
  
  // 等级系统查询
  "function levelConfigs(uint256 level) external view returns (uint256 minPower, uint256 maxPower, uint256 bonusRate, uint256 teamRequired, uint256 teamBonusRate)",
  "function getUserLevel(address user) external view returns (uint256)",
  
  // 全局统计查询
  "function totalStakedPower() external view returns (uint256)",
  "function totalMiners() external view returns (uint256)",
  "function directBonusRate() external view returns (uint256)",
  
  // 产出统计查询
  "function todayOutput() external view returns (uint256)",
  "function totalOutput() external view returns (uint256)",
  "function minersCount() external view returns (uint256)",
  "function lastOutputReset() external view returns (uint256)",
  
  // 事件
  "event NFTStaked(address indexed user, uint256 indexed tokenId, uint256 power)",
  "event NFTUnstaked(address indexed user, uint256 indexed tokenId)",
  "event RewardClaimed(address indexed user, uint256 amount)",
  "event ReferrerSet(address indexed user, address referrer)",
  "event TeamBonusClaimed(address indexed user, uint256 amount)",
  "event UserLevelUpdated(address indexed user, uint256 newLevel)",
  "event DailyOutputReset(uint256 oldOutput, uint256 newOutput)",
  "event OutputUpdated(uint256 todayOutput, uint256 totalOutput)",
  "event TotalMinersUpdated(uint256 totalMiners)"
];

export const NFT_MINING_ABI_V2 = [
  // 查询功能
  "function balanceOf(address owner) view returns (uint256)",
  "function tokenOfOwnerByIndex(address owner, uint256 index) view returns (uint256)",
  "function getNFTInfo(uint256 tokenId) view returns (uint256 power, uint256 level, bool staked)",
  "function getUserMiningInfo(address user) view returns (uint256 totalPower, uint256 level)",
  "function getRewardsInfo(address user) view returns (uint256 available, uint256 claimed)",
  "function getDirectReferrals(address user) view returns (address[])",
  "function getTeamMembers(address user) view returns (address[])",
  "function getRewardsHistory(address user, uint256 startTime, uint256 interval) view returns (uint256[] timestamps, uint256[] directRewards, uint256[] teamRewards)",
  
  // 操作功能
  "function mint() external",
  "function stake(uint256 tokenId) external",
  "function unstake(uint256 tokenId) external",
  "function claim() external returns (uint256)",
  
  // 事件
  "event NFTMinted(address indexed owner, uint256 indexed tokenId, uint256 power, uint256 level)",
  "event NFTStaked(address indexed owner, uint256 indexed tokenId)",
  "event NFTUnstaked(address indexed owner, uint256 indexed tokenId)",
  "event RewardsClaimed(address indexed user, uint256 amount)"
];

export const REFERRAL_REGISTRY_ABI = [
  // 基本功能
  "function bindReferrer(address _user, address _referrer) external",
  "function getUserReferrer(address _user) external view returns (address)",
  "function hasReferrer(address _user) external view returns (bool)",
  "function getReferralCount(address _user) external view returns (uint256)",
  "function getDirectReferrals(address _user) external view returns (address[])",
  "function getTeamMembers(address _user) external view returns (address[])",
  "function getDirectRewards(address _user) external view returns (uint256)",
  "function getTeamRewards(address _user) external view returns (uint256)",
  // 事件
  "event ReferralBound(address indexed user, address indexed referrer)",
  "event AdminRoleGranted(address indexed admin, address indexed account)"
];

export const NFT_RARITY = ['N', 'R', 'SR', 'SSR'];
// NFT 稀有度颜色配置
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

// 创建合约实例
export const getContracts = (signer) => {
  if (!signer) return null;

  return {
    nft: new ethers.Contract(ZONE_NFT_ADDRESS, ZONE_NFT_ABI, signer),
    token: new ethers.Contract(ZONE_TOKEN_ADDRESS, ZONE_TOKEN_ABI, signer),
    marketplace: new ethers.Contract(MARKETPLACE_CONTRACT, NFT_MARKETPLACE_ABI, signer),
    mining: new ethers.Contract(NFT_MINING_ADDRESS, NFT_MINING_ABI, signer),
    referral: new ethers.Contract(REFERRAL_REGISTRY_ADDRESS, REFERRAL_REGISTRY_ABI, signer),
    staking: new ethers.Contract(STAKING_ADDRESS, STAKING_ABI, signer)
  };
};