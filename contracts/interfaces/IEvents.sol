// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IEvents {
    // NFT相关事件
    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);
    event NFTImagesUpdated();  // 添加NFT图片更新事件
    
    // 神秘盒子相关事件
    event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity);
    event BoxPriceUpdated(uint256 newPrice);
    event RarityProbabilityUpdated(string rarity, uint256 probability);
    
    // 质押相关事件
    event NFTStaked(uint256 indexed tokenId, address indexed owner);
    event NFTUnstaked(uint256 indexed tokenId, address indexed owner);
    event RewardClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event PowerUpdated(address indexed user, uint256 power);
    
    // 市场相关事件
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event MarketFeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);
    
    // LP挖矿相关事件
    event LPStaked(address indexed user, uint256 amount);
    event LPUnstaked(address indexed user, uint256 amount);
    event LPRewardClaimed(address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    
    // 系统管理事件
    event ContractPaused(address indexed admin);
    event ContractUnpaused(address indexed admin);
    event ContractPauseToggled(bool isPaused);  // 添加合约暂停事件
}
