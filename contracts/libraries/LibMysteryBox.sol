// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "../interfaces/IReferralRegistry.sol";
import "../interfaces/IEvents.sol";
import "../diamond/libraries/LibDiamond.sol";

library LibMysteryBox {
    bytes32 constant STORAGE_POSITION = keccak256("diamond.standard.mysterybox");

    struct NFTAttributes {
        uint256 power;          // NFT的算力
        uint256 dailyReward;    // 每日收益
        uint256 maxReward;      // 最大收益上限
        uint256 minedAmount;    // 已挖矿数量
        bool isStaked;          // 是否已质押
        uint256 stakeTime;      // 质押时间
        string rarity;          // 稀有度
        bool isBurned;          // 是否已销毁
    }

    struct MarketListing {
        bool isActive;          // 是否在售
        uint256 price;          // 价格
        address seller;         // 卖家
    }

    struct MysteryBoxStorage {
        // NFT相关
        mapping(uint256 => NFTAttributes) nftAttributes;
        mapping(address => uint256[]) stakedNFTs;
        mapping(uint256 => MarketListing) marketListings;
        
        // 市场统计
        uint256 totalVolume;
        uint256 dailyVolume;
        uint256 lastVolumeReset;
        uint256 floorPrice;     // 市场地板价
        
        // 用户算力
        mapping(address => uint256) userPower;
        
        // 合约配置
        IERC20 zoneToken;
        IReferralRegistry referralRegistry;
        address feeReceiver;
        uint256 marketFeeRate;
        
        // 开盒配置
        uint256 boxPrice;           // 盒子价格（100 ZONE）
        uint256 boxOpenCount;       // 开盒总次数
        mapping(address => uint256) userBoxOpenCount;  // 用户开盒次数
        mapping(string => uint256) rarityProbability;  // 稀有度概率
    }

    function getStorage() internal pure returns (MysteryBoxStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    function initialize(
        address _zoneToken,
        address _referralRegistry,
        address _feeReceiver
    ) internal {
        MysteryBoxStorage storage ds = getStorage();

        ds.zoneToken = IERC20(_zoneToken);
        ds.referralRegistry = IReferralRegistry(_referralRegistry);
        ds.feeReceiver = _feeReceiver;
        
        // 设置开盒价格为 100 ZONE
        ds.boxPrice = 100 * 10**18;
        
        // 设置市场费率为 2.5%
        ds.marketFeeRate = 250;

        // 设置稀有度概率
        ds.rarityProbability["N"] = 7900;   // 79%
        ds.rarityProbability["R"] = 1500;   // 15%
        ds.rarityProbability["SR"] = 500;   // 5%
        ds.rarityProbability["SSR"] = 100;  // 1%
    }

    // Events
    event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity);
    event NFTStaked(uint256 indexed tokenId, address indexed owner);
    event NFTUnstaked(uint256 indexed tokenId, address indexed owner);
    event RewardClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event NoReferrerWarning(address indexed user);
}
