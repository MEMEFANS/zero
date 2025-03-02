// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibMysteryBox } from "../libraries/LibMysteryBox.sol";
import { LibERC721 } from "../libraries/LibERC721.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MarketplaceFacet is ReentrancyGuard {
    using LibERC721 for *;

    // 事件声明
    event NFTListed(uint256 indexed tokenId, address indexed seller, uint256 price);
    event NFTUnlisted(uint256 indexed tokenId, address indexed seller);
    event NFTSold(uint256 indexed tokenId, address indexed seller, address indexed buyer, uint256 price);
    event MarketFeeUpdated(uint256 newFee);
    event FeeReceiverUpdated(address newReceiver);

    // 上架NFT
    function listNFT(uint256 tokenId, uint256 price) external nonReentrant {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        // 检查合约是否暂停
        LibDiamond.DiamondStorage storage dds = LibDiamond.diamondStorage();
        require(!dds.contractPaused, "Contract is paused");

        // 检查NFT所有权
        require(LibERC721.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!ds.nftAttributes[tokenId].isStaked, "NFT is staked");
        require(!ds.marketListings[tokenId].isActive, "Already listed");
        require(price > 0, "Price must be greater than 0");

        // 更新市场列表
        ds.marketListings[tokenId] = LibMysteryBox.MarketListing({
            isActive: true,
            price: price,
            seller: msg.sender
        });

        // 更新地板价
        if (ds.floorPrice == 0 || price < ds.floorPrice) {
            ds.floorPrice = price;
        }

        emit NFTListed(tokenId, msg.sender, price);
    }

    // 下架NFT
    function unlistNFT(uint256 tokenId) external nonReentrant {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        require(ds.marketListings[tokenId].isActive, "Not listed");
        require(ds.marketListings[tokenId].seller == msg.sender, "Not seller");

        // 移除市场列表
        delete ds.marketListings[tokenId];

        emit NFTUnlisted(tokenId, msg.sender);
    }

    // 购买NFT
    function buyNFT(uint256 tokenId) external nonReentrant {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        // 检查合约是否暂停
        LibDiamond.DiamondStorage storage dds = LibDiamond.diamondStorage();
        require(!dds.contractPaused, "Contract is paused");

        require(ds.marketListings[tokenId].isActive, "Not listed");
        uint256 price = ds.marketListings[tokenId].price;
        address seller = ds.marketListings[tokenId].seller;

        // 检查余额
        require(ds.zoneToken.balanceOf(msg.sender) >= price, "Insufficient balance");

        // 计算费用
        uint256 fee = (price * ds.marketFeeRate) / 10000;
        uint256 sellerAmount = price - fee;

        // 转移代币
        require(ds.zoneToken.transferFrom(msg.sender, seller, sellerAmount), "Transfer to seller failed");
        require(ds.zoneToken.transferFrom(msg.sender, ds.feeReceiver, fee), "Transfer fee failed");

        // 转移NFT
        LibERC721._transfer(seller, msg.sender, tokenId);

        // 更新市场数据
        delete ds.marketListings[tokenId];
        ds.totalVolume += price;
        
        // 更新日交易量
        if (block.timestamp - ds.lastVolumeReset >= 1 days) {
            ds.dailyVolume = price;
            ds.lastVolumeReset = block.timestamp;
        } else {
            ds.dailyVolume += price;
        }

        emit NFTSold(tokenId, seller, msg.sender, price);
    }

    // 更新NFT价格
    function updatePrice(uint256 tokenId, uint256 newPrice) external {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        require(ds.marketListings[tokenId].isActive, "Not listed");
        require(ds.marketListings[tokenId].seller == msg.sender, "Not seller");
        require(newPrice > 0, "Price must be greater than 0");

        ds.marketListings[tokenId].price = newPrice;

        // 更新地板价
        if (newPrice < ds.floorPrice) {
            ds.floorPrice = newPrice;
            emit MarketFeeUpdated(ds.floorPrice);
        }

        emit NFTListed(tokenId, msg.sender, newPrice);
    }

    // 查询NFT市场信息
    function getNFTMarketInfo(uint256 tokenId) external view returns (
        bool isActive,
        uint256 price,
        address seller
    ) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        LibMysteryBox.MarketListing storage listing = ds.marketListings[tokenId];
        return (listing.isActive, listing.price, listing.seller);
    }

    // 查询市场统计数据
    function getMarketStats() external view returns (
        uint256 totalVol,
        uint256 dailyVol,
        uint256 floor
    ) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        return (ds.totalVolume, ds.dailyVolume, ds.floorPrice);
    }
}
