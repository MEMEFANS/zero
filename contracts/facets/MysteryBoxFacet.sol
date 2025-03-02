// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibMysteryBox } from "../libraries/LibMysteryBox.sol";
import { LibERC721 } from "../libraries/LibERC721.sol";
import "../interfaces/IEvents.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract MysteryBoxFacet is ReentrancyGuard {
    using LibERC721 for *;

    // 事件声明
    event BoxOpened(address indexed user, uint256 indexed tokenId, string rarity);
    event BoxPriceUpdated(uint256 newPrice);
    event RarityProbabilityUpdated(string rarity, uint256 probability);

    // NFT图片配置
    struct NFTImageConfig {
        string[] normalImages;    // N级图片URIs
        string[] rareImages;      // R级图片URIs
        string[] superRareImages; // SR级图片URIs
        string[] ssrImages;       // SSR级图片URIs
    }

    NFTImageConfig private imageConfig;

    // 初始化NFT图片配置
    function initializeNFTImages() external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractOwner(ds);

        // 初始化N级图片
        string[] memory normalImages = new string[](4);
        normalImages[0] = "ipfs://bafkreicg2o5srn26flfurg3aks2ozenazepewyug776xxsc3hznrtjvdfq";
        normalImages[1] = "ipfs://bafkreigygfxouqc2wwarzqbjpbuk5px7q6ywkihxopy6svzbw5i6ks6jnq";
        normalImages[2] = "ipfs://bafkreibjwpuw2f7vm42efx5f2yf3nmjqrvf2yn45iepys2do5deecjcwaq";
        normalImages[3] = "ipfs://bafkreidqbaffdedxivwncxb3n4ivzr75jj25od35lz7urgyvih7g3rpfdm";

        // 初始化R级图片
        string[] memory rareImages = new string[](4);
        rareImages[0] = "ipfs://bafkreib75y2zt6dygbqvr675k77qkvamuozrq3ehcjhj63uiwvatfpnwcy";
        rareImages[1] = "ipfs://bafkreifzp2mf37rqhv7jbllgdtno3pafny66neyr4chfun5dipt7pyc5lq";
        rareImages[2] = "ipfs://bafkreib44hbtd5mw6bnljd5idvmyheedw4uldyngqdqyrnr237zbtd5ydy";
        rareImages[3] = "ipfs://bafkreidbzii233sbt53kprnpguupt4r3vkrnkzxkqtojitsinclbbrxmmy";

        // 初始化SR级图片
        string[] memory superRareImages = new string[](4);
        superRareImages[0] = "ipfs://bafkreiejcncdya3dofutwzjbppr7iesbnbqny5hiuivkkmqizolmsul7wa";
        superRareImages[1] = "ipfs://bafkreicg7kb3yq22s3jh4jxp7nd4rovzvmsnpuf4dnn7syctstlaec7aja";
        superRareImages[2] = "ipfs://bafkreifdm6yc2ey6qlejbg3ohhcgtswy4uywcxrvvys37k745t54xqoscu";
        superRareImages[3] = "ipfs://bafkreibrsyio7fwpb773vryfo7byr5mzor5pty6i6cdle3qxvsm7qoq2ba";

        // 初始化SSR级图片
        string[] memory ssrImages = new string[](4);
        ssrImages[0] = "ipfs://bafkreigggfktmbu4foz3dwtcbhfldvqbvv73ogdn3hcphfyvwaswwqjbna";
        ssrImages[1] = "ipfs://bafkreidhdgn3bhyyjyiy6nj7nix72fbnyry2iesz3gjyav6tv7ych63wme";
        ssrImages[2] = "ipfs://bafkreibyitzhuxdf46ynyyyw6jzavd2o54vlndrkn2d2pfwanu3cq3ouke";
        ssrImages[3] = "ipfs://bafkreihtjpm2wxxpf5fcm7fdo73ycrm5thvybi6mpom4ml47gadrzq2yd4";

        // 设置图片配置
        imageConfig = NFTImageConfig({
            normalImages: normalImages,
            rareImages: rareImages,
            superRareImages: superRareImages,
            ssrImages: ssrImages
        });
    }

    // 开启神秘盒子
    function openBox() external nonReentrant returns (uint256) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        // 检查合约是否暂停
        LibDiamond.DiamondStorage storage dds = LibDiamond.diamondStorage();
        require(!dds.contractPaused, "Contract is paused");

        // 检查并转移ZONE代币
        require(ds.zoneToken.balanceOf(msg.sender) >= ds.boxPrice, "Insufficient ZONE balance");
        require(ds.zoneToken.transferFrom(msg.sender, ds.feeReceiver, ds.boxPrice), "Payment failed");

        // 生成NFT
        uint256 tokenId = LibERC721.totalSupply() + 1;
        LibERC721._mint(msg.sender, tokenId);

        // 更新开盒次数
        ds.boxOpenCount++;
        ds.userBoxOpenCount[msg.sender]++;

        // 确定稀有度
        string memory rarity = _determineRarity(msg.sender);

        // 设置NFT属性
        _setNFTAttributes(tokenId, rarity);

        emit BoxOpened(msg.sender, tokenId, rarity);
        
        return tokenId;
    }

    // 确定NFT稀有度
    function _determineRarity(address user) internal view returns (string memory) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();

        // 随机生成稀有度，加入用户地址增加随机性
        uint256 rand = uint256(keccak256(abi.encodePacked(
            block.timestamp,
            block.prevrandao,
            user,
            ds.boxOpenCount
        ))) % 10000;

        uint256 accumulated = 0;
        string[4] memory rarities = ["N", "R", "SR", "SSR"];
        
        for (uint256 i = 0; i < rarities.length; i++) {
            accumulated += ds.rarityProbability[rarities[i]];
            if (rand < accumulated) {
                return rarities[i];
            }
        }

        return "N"; // 默认返回N级别
    }

    // 设置NFT属性
    function _setNFTAttributes(uint256 tokenId, string memory rarity) internal {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        
        uint256 power;
        uint256 dailyReward;
        uint256 maxReward;

        if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("SSR"))) {
            power = 6400;                    // SSR基础算力
            dailyReward = 160 * 10**18;      // 每日160 ZONE
            maxReward = 14400 * 10**18;      // 总收益上限14400 ZONE
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("SR"))) {
            power = 1600;                    // SR基础算力
            dailyReward = 40 * 10**18;       // 每日40 ZONE
            maxReward = 3600 * 10**18;       // 总收益上限3600 ZONE
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("R"))) {
            power = 400;                     // R基础算力
            dailyReward = 10 * 10**18;       // 每日10 ZONE
            maxReward = 900 * 10**18;        // 总收益上限900 ZONE
        } else {
            power = 100;                     // N基础算力
            dailyReward = 28 * 10**17;       // 每日2.8 ZONE
            maxReward = 252 * 10**18;        // 总收益上限252 ZONE
        }

        ds.nftAttributes[tokenId] = LibMysteryBox.NFTAttributes({
            power: power,
            dailyReward: dailyReward,
            maxReward: maxReward,
            minedAmount: 0,
            isStaked: false,
            stakeTime: 0,
            rarity: rarity,
            isBurned: false
        });
    }

    // 设置NFT图片配置（仅管理员）
    function setNFTImageConfig(
        string[] calldata _normalImages,
        string[] calldata _rareImages,
        string[] calldata _superRareImages,
        string[] calldata _ssrImages
    ) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractOwner(ds);
        imageConfig = NFTImageConfig({
            normalImages: _normalImages,
            rareImages: _rareImages,
            superRareImages: _superRareImages,
            ssrImages: _ssrImages
        });
    }

    // 获取NFT图片URI
    function getNFTImageURI(uint256 tokenId) external view returns (string memory) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        string memory rarity = ds.nftAttributes[tokenId].rarity;
        
        string[] storage images;
        if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("SSR"))) {
            images = imageConfig.ssrImages;
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("SR"))) {
            images = imageConfig.superRareImages;
        } else if (keccak256(abi.encodePacked(rarity)) == keccak256(abi.encodePacked("R"))) {
            images = imageConfig.rareImages;
        } else {
            images = imageConfig.normalImages;
        }
        
        require(images.length > 0, "No images configured");
        uint256 index = uint256(keccak256(abi.encodePacked(tokenId))) % images.length;
        return images[index];
    }

    // 查询用户开盒次数
    function getUserBoxOpenCount(address user) external view returns (uint256) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        return ds.userBoxOpenCount[user];
    }

    // 查询总开盒次数
    function getTotalBoxOpenCount() external view returns (uint256) {
        LibMysteryBox.MysteryBoxStorage storage ds = LibMysteryBox.getStorage();
        return ds.boxOpenCount;
    }
}
