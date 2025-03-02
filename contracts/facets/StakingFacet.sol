// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibMysteryBox } from "../libraries/LibMysteryBox.sol";
import { LibERC721 } from "../libraries/LibERC721.sol";
import "../interfaces/IEvents.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract StakingFacet is ReentrancyGuard, AccessControl {
    using LibERC721 for *;

    // 事件声明
    event NFTStaked(uint256 indexed tokenId, address indexed owner);
    event RewardClaimed(uint256 indexed tokenId, address indexed owner, uint256 amount);
    event ReferralRewardPaid(address indexed upline, address indexed user, uint256 amount);

    // NFT等级
    enum NFTRarity { N, R, SR, SSR }

    // 挖矿等级
    struct MiningLevel {
        uint256 minPower;      // 最小算力
        uint256 maxPower;      // 最大算力
        uint256 referralRate;  // 推荐奖励比例 (基点：1000 = 100%)
        uint256 teamRate;      // 团队奖励比例 (基点：1000 = 100%)
    }

    // NFT属性
    struct NFTInfo {
        NFTRarity rarity;      // 稀有度
        uint256 power;         // 算力
        uint256 dailyReward;   // 每日产出
        uint256 maxReward;     // 最大产出
        uint256 minedAmount;   // 已挖矿数量
        bool isStaked;         // 是否质押
        uint256 stakeTime;     // 质押时间
    }

    // 用户挖矿信息
    struct UserMiningInfo {
        uint256 level;         // 等级
        uint256 totalPower;    // 总算力
        uint256 teamPower;     // 团队算力（包含直推和间推的总算力）
        uint256 directPower;   // 直推算力
        uint256 indirectPower; // 间推算力
        uint256 lastUpdateTime;// 上次更新时间
        address[] directReferrals; // 直推用户列表
        address[] teamMembers;     // 团队成员列表（包含直推和间推）
    }

    // 存储
    struct StakingStorage {
        mapping(uint256 => NFTInfo) nftInfo;                // NFT信息
        mapping(address => uint256[]) stakedNFTs;           // 用户质押的NFT
        mapping(address => UserMiningInfo) userMiningInfo;  // 用户挖矿信息
        mapping(uint256 => MiningLevel) miningLevels;       // 挖矿等级配置
        uint256 totalMiners;                               // 总矿工数
        uint256 todayOutput;                               // 今日产出
        uint256 totalOutput;                               // 总产出
        uint256 maxTeamDepth;                             // 最大团队深度
    }

    bytes32 constant STORAGE_POSITION = keccak256("diamond.storage.staking");

    function getStorage() internal pure returns (StakingStorage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // 初始化挖矿等级配置
    function initializeMiningLevels() external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractOwner(ds);
        StakingStorage storage stakeDs = getStorage();

        // 设置挖矿等级配置
        stakeDs.miningLevels[1] = MiningLevel(0, 50000, 50, 50);         // LV1: 5%推荐, 5%团队
        stakeDs.miningLevels[2] = MiningLevel(50001, 100000, 80, 80);    // LV2: 8%推荐, 8%团队
        stakeDs.miningLevels[3] = MiningLevel(100001, 200000, 100, 100); // LV3: 10%推荐, 10%团队
        stakeDs.miningLevels[4] = MiningLevel(200001, 500000, 150, 150); // LV4: 15%推荐, 15%团队
        stakeDs.miningLevels[5] = MiningLevel(500001, type(uint256).max, 200, 200); // LV5: 20%推荐, 20%团队
    }

    // 更新用户团队信息
    function _updateTeamInfo(address user, uint256 powerChange, bool isAdd) internal {
        StakingStorage storage ds = getStorage();
        LibMysteryBox.MysteryBoxStorage storage mds = LibMysteryBox.getStorage();

        // 如果用户有推荐人，更新推荐人的团队信息
        if (mds.referralRegistry.hasReferrer(user)) {
            address upline = mds.referralRegistry.getUserReferrer(user);
            uint256 depth = 1;
            
            while (upline != address(0) && depth <= ds.maxTeamDepth) {
                UserMiningInfo storage uplineInfo = ds.userMiningInfo[upline];
                
                // 更新直推算力
                if (depth == 1) {
                    uplineInfo.directPower = isAdd ? 
                        uplineInfo.directPower + powerChange : 
                        uplineInfo.directPower - powerChange;
                } else {
                    // 更新间推算力
                    uplineInfo.indirectPower = isAdd ? 
                        uplineInfo.indirectPower + powerChange : 
                        uplineInfo.indirectPower - powerChange;
                }
                
                // 更新总团队算力
                uplineInfo.teamPower = uplineInfo.directPower + uplineInfo.indirectPower;
                
                // 更新用户等级
                _updateMiningLevel(upline);
                
                // 获取上级的推荐人
                upline = mds.referralRegistry.getUserReferrer(upline);
                depth++;
            }
        }
    }

    // 质押NFT时更新团队信息
    function stakeNFT(uint256 tokenId) external nonReentrant {
        LibDiamond.DiamondStorage storage dds = LibDiamond.diamondStorage();
        require(!dds.contractPaused, "Contract is paused");

        StakingStorage storage ds = getStorage();
        require(LibERC721.ownerOf(tokenId) == msg.sender, "Not token owner");
        require(!ds.nftInfo[tokenId].isStaked, "Already staked");

        NFTInfo storage nft = ds.nftInfo[tokenId];
        require(nft.power > 0, "NFT not initialized");

        // 更新质押状态
        nft.isStaked = true;
        nft.stakeTime = block.timestamp;
        ds.stakedNFTs[msg.sender].push(tokenId);

        // 更新用户挖矿信息
        UserMiningInfo storage userInfo = ds.userMiningInfo[msg.sender];
        userInfo.totalPower += nft.power;
        userInfo.lastUpdateTime = block.timestamp;

        // 更新团队信息
        _updateTeamInfo(msg.sender, nft.power, true);

        // 更新总矿工数
        if (ds.stakedNFTs[msg.sender].length == 1) {
            ds.totalMiners++;
        }

        emit NFTStaked(tokenId, msg.sender);
    }

    // 内部函数：领取奖励
    function _claimReward(uint256 tokenId) internal {
        StakingStorage storage ds = getStorage();
        NFTInfo storage nft = ds.nftInfo[tokenId];
        
        // 计算基础奖励
        uint256 timePassed = block.timestamp - nft.stakeTime;
        uint256 reward = (timePassed * nft.dailyReward) / 1 days;

        // 检查最大奖励限制
        uint256 totalMined = nft.minedAmount + reward;
        if (totalMined > nft.maxReward) {
            reward = nft.maxReward - nft.minedAmount;
            totalMined = nft.maxReward;
        }

        require(reward > 0, "No reward to claim");

        // 更新挖矿数据
        nft.minedAmount = totalMined;
        nft.stakeTime = block.timestamp;

        // 更新产出统计
        ds.todayOutput += reward;
        ds.totalOutput += reward;

        // 转移奖励
        LibMysteryBox.MysteryBoxStorage storage mds = LibMysteryBox.getStorage();
        require(mds.zoneToken.transfer(msg.sender, reward), "Reward transfer failed");

        // 处理推荐奖励
        _handleReferralReward(msg.sender, reward);

        // 如果达到最大奖励，销毁NFT
        if (totalMined >= nft.maxReward) {
            nft.isStaked = false;
            _removeFromStakedNFTs(msg.sender, tokenId);
            LibERC721._burn(tokenId);
            
            // 更新用户挖矿信息
            UserMiningInfo storage userInfo = ds.userMiningInfo[msg.sender];
            userInfo.totalPower -= nft.power;
            userInfo.lastUpdateTime = block.timestamp;

            // 更新团队信息
            _updateTeamInfo(msg.sender, nft.power, false);

            // 更新总矿工数
            if (ds.stakedNFTs[msg.sender].length == 0) {
                ds.totalMiners--;
            }
        }

        emit RewardClaimed(tokenId, msg.sender, reward);
    }

    // 领取奖励
    function claimReward(uint256 tokenId) external nonReentrant {
        require(_isTokenStakedByUser(msg.sender, tokenId), "Not staked by user");
        _claimReward(tokenId);
    }

    // 处理推荐和团队奖励
    function _handleReferralReward(address user, uint256 reward) internal {
        LibMysteryBox.MysteryBoxStorage storage mds = LibMysteryBox.getStorage();
        StakingStorage storage ds = getStorage();
        
        if (address(mds.referralRegistry) != address(0) && 
            mds.referralRegistry.hasReferrer(user)) {
            
            address upline = mds.referralRegistry.getUserReferrer(user);
            uint256 depth = 1;
            
            while (upline != address(0) && depth <= ds.maxTeamDepth) {
                UserMiningInfo storage uplineInfo = ds.userMiningInfo[upline];
                MiningLevel storage level = ds.miningLevels[uplineInfo.level];
                
                uint256 rewardAmount;
                if (depth == 1) {
                    // 直推奖励
                    rewardAmount = (reward * level.referralRate) / 1000;
                } else {
                    // 团队奖励（间推）
                    rewardAmount = (reward * level.teamRate) / 1000;
                }
                
                if (rewardAmount > 0) {
                    require(mds.zoneToken.transfer(upline, rewardAmount), 
                        depth == 1 ? "Referral reward failed" : "Team reward failed");
                    
                    emit ReferralRewardPaid(upline, user, rewardAmount);
                }
                
                upline = mds.referralRegistry.getUserReferrer(upline);
                depth++;
            }
        }
    }

    // 获取用户团队信息
    function getUserTeamInfo(address user) external view returns (
        uint256 teamPower,
        uint256 directPower,
        uint256 indirectPower,
        uint256 directCount,
        uint256 teamCount
    ) {
        UserMiningInfo storage userInfo = getStorage().userMiningInfo[user];
        return (
            userInfo.teamPower,
            userInfo.directPower,
            userInfo.indirectPower,
            userInfo.directReferrals.length,
            userInfo.teamMembers.length
        );
    }

    // 获取用户挖矿信息
    function getUserMiningInfo(address user) external view returns (
        uint256 level,
        uint256 totalPower,
        uint256 teamPower
    ) {
        UserMiningInfo storage userInfo = getStorage().userMiningInfo[user];
        return (userInfo.level, userInfo.totalPower, userInfo.teamPower);
    }

    // 获取总矿工数
    function getTotalMiners() external view returns (uint256) {
        return getStorage().totalMiners;
    }

    // 获取今日产出
    function getTodayOutput() external view returns (uint256) {
        return getStorage().todayOutput;
    }

    // 获取总产出
    function getTotalOutput() external view returns (uint256) {
        return getStorage().totalOutput;
    }

    // 获取NFT信息
    function getNFTInfo(uint256 tokenId) external view returns (
        NFTRarity rarity,
        uint256 power,
        uint256 dailyReward,
        uint256 maxReward,
        uint256 minedAmount,
        bool isStaked,
        uint256 stakeTime
    ) {
        StakingStorage storage ds = getStorage();
        NFTInfo storage nft = ds.nftInfo[tokenId];
        return (
            nft.rarity,
            nft.power,
            nft.dailyReward,
            nft.maxReward,
            nft.minedAmount,
            nft.isStaked,
            nft.stakeTime
        );
    }

    // 获取用户质押的NFT
    function getStakedNFTs(address user) external view returns (uint256[] memory) {
        return getStorage().stakedNFTs[user];
    }

    // 辅助函数
    function _isTokenStakedByUser(address user, uint256 tokenId) internal view returns (bool) {
        uint256[] storage userStakedNFTs = getStorage().stakedNFTs[user];
        for (uint256 i = 0; i < userStakedNFTs.length; i++) {
            if (userStakedNFTs[i] == tokenId) return true;
        }
        return false;
    }

    function _removeFromStakedNFTs(address user, uint256 tokenId) internal {
        uint256[] storage userStakedNFTs = getStorage().stakedNFTs[user];
        for (uint256 i = 0; i < userStakedNFTs.length; i++) {
            if (userStakedNFTs[i] == tokenId) {
                if (i != userStakedNFTs.length - 1) {
                    userStakedNFTs[i] = userStakedNFTs[userStakedNFTs.length - 1];
                }
                userStakedNFTs.pop();
                break;
            }
        }
    }

    // 更新用户挖矿等级
    function _updateMiningLevel(address user) internal {
        StakingStorage storage stakeDs = getStorage();
        UserMiningInfo storage userInfo = stakeDs.userMiningInfo[user];
        uint256 totalPower = userInfo.totalPower;

        // 遍历等级配置匹配对应等级
        for (uint256 i = 5; i >= 1; i--) {
            if (totalPower >= stakeDs.miningLevels[i].minPower) {
                userInfo.level = i;
                break;
            }
        }
    }
}
