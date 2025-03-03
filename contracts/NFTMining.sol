// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "./interfaces/IZoneNFT.sol";
import "./interfaces/IReferralRegistry.sol";

contract NFTMining is ReentrancyGuard, AccessControl, Pausable {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // 合约依赖
    IERC20 public zoneToken;    // ZONE代币
    IZoneNFT public nft;        // NFT合约
    IReferralRegistry public referralRegistry;  // 推荐系统

    // 用户等级配置
    struct LevelConfig {
        uint256 minPower;      // 最低算力要求
        uint256 maxPower;      // 最高算力限制
        uint256 bonusRate;     // 收益加成比例（基数1000）
        uint256 teamRequired;  // 团队人数要求
        uint256 teamBonusRate; // 团队加成比例（基数1000）
    }
    
    // 等级配置
    mapping(uint256 => LevelConfig) public levelConfigs;
    uint256 public constant MAX_LEVEL = 5;
    uint256 public currentMaxLevel = 5;  // 当前最高等级

    // 挖矿等级配置
    struct MiningLevelConfig {
        uint256 minPower;      // 最低算力要求
        uint256 maxPower;      // 最高算力限制
        uint256 bonusRate;     // 奖励倍数（基数1000）
        uint256 teamBonus;     // 团队奖励比例
    }
    mapping(uint256 => MiningLevelConfig) public miningLevels;

    // 质押信息
    struct StakeInfo {
        uint256[] stakedTokenIds;  // 质押的NFT ID列表
        uint256 totalPower;        // 总算力
        uint256 directPower;       // 直推算力
        uint256 lastClaimTime;     // 上次领取时间
        uint256 level;             // 当前等级
        uint256 teamPower;         // 团队总算力
    }

    // 用户质押信息
    mapping(address => StakeInfo) public stakeInfo;
    
    // 全局信息
    uint256 public totalStakedPower;    // 总质押算力
    uint256 public totalMiners;         // 总矿工数量
    uint256 public directBonusRate = 10; // 直推奖励 10%

    // 产出统计
    uint256 public todayOutput;      // 今日产出
    uint256 public totalOutput;      // 总产出
    uint256 public lastOutputReset;  // 上次重置时间
    uint256 public minersCount;      // 总矿工数

    // NFT属性
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
    mapping(uint256 => NFTAttributes) public nftAttributes;

    // 市场统计
    uint256 public totalVolume;         // 总交易量
    uint256 public dailyVolume;         // 日交易量
    uint256 public lastVolumeReset;     // 上次重置时间
    uint256 public floorPrice;          // 市场地板价

    // 用户算力
    mapping(address => uint256) public userPower;

    // 合约配置
    address public feeReceiver;         // 手续费接收地址
    uint256 public marketFeeRate;       // 市场手续费率

    // 事件
    event NFTStaked(address indexed user, uint256 indexed tokenId, uint256 power);
    event NFTUnstaked(address indexed user, uint256 indexed tokenId);
    event NFTBurned(address indexed user, uint256 indexed tokenId);
    event RewardClaimed(address indexed user, uint256 amount);
    event TeamBonusClaimed(address indexed user, uint256 amount);
    event LevelConfigUpdated(uint256 level, uint256 minPower, uint256 maxPower, uint256 bonusRate, uint256 teamRequired, uint256 teamBonusRate);
    event UserLevelUpdated(address indexed user, uint256 newLevel);
    event MiningLevelUpdated(uint256 level, uint256 minPower, uint256 maxPower, uint256 bonusRate, uint256 teamBonus);
    event NFTAttributesUpdated(uint256 indexed tokenId, uint256 power, uint256 dailyReward, uint256 maxReward);
    event MarketStatsUpdated(uint256 totalVolume, uint256 dailyVolume, uint256 floorPrice);
    event FeeReceiverUpdated(address newReceiver);
    event MarketFeeRateUpdated(uint256 newRate);
    event DailyOutputReset(uint256 oldOutput, uint256 newOutput);
    event OutputUpdated(uint256 todayOutput, uint256 totalOutput);
    event TotalMinersUpdated(uint256 totalMiners);
    event ReferrerSet(address indexed user, address referrer);

    constructor(
        address _zoneToken,
        address _nft,
        address _referralRegistry,
        address _feeReceiver
    ) {
        require(_zoneToken != address(0), "Invalid token address");
        require(_nft != address(0), "Invalid NFT address");
        require(_referralRegistry != address(0), "Invalid registry address");
        require(_feeReceiver != address(0), "Invalid fee receiver");
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        
        zoneToken = IERC20(_zoneToken);
        nft = IZoneNFT(_nft);
        referralRegistry = IReferralRegistry(_referralRegistry);
        feeReceiver = _feeReceiver;
        
        // 初始化等级配置
        levelConfigs[1] = LevelConfig({
            minPower: 0,
            maxPower: 10000,
            bonusRate: 100,        // 10% 加成
            teamRequired: 5,       // 需要5人
            teamBonusRate: 50      // 5% * √人数
        });
        
        levelConfigs[2] = LevelConfig({
            minPower: 10001,
            maxPower: 30000,
            bonusRate: 150,        // 15% 加成
            teamRequired: 8,       // 需要8人
            teamBonusRate: 80      // 8% * √人数
        });
        
        levelConfigs[3] = LevelConfig({
            minPower: 30001,
            maxPower: 100000,
            bonusRate: 200,        // 20% 加成
            teamRequired: 12,      // 需要12人
            teamBonusRate: 120     // 12% * √人数
        });
        
        levelConfigs[4] = LevelConfig({
            minPower: 100001,
            maxPower: 500000,
            bonusRate: 300,        // 30% 加成
            teamRequired: 18,      // 需要18人
            teamBonusRate: 180     // 18% * √人数
        });
        
        levelConfigs[5] = LevelConfig({
            minPower: 500001,
            maxPower: type(uint256).max,
            bonusRate: 500,        // 50% 加成
            teamRequired: 25,      // 需要25人
            teamBonusRate: 250     // 25% * √人数
        });
    }

    // 辅助函数：计算平方根
    function sqrt(uint256 x) internal pure returns (uint256) {
        if (x == 0) return 0;
        
        uint256 z = (x + 1) / 2;
        uint256 y = x;
        
        while (z < y) {
            y = z;
            z = (x / z + z) / 2;
        }
        
        return y;
    }

    // 计算团队加成
    function _calculateTeamBonus(address user) internal view returns (uint256) {
        StakeInfo storage info = stakeInfo[user];
        uint256 level = info.level;
        uint256 teamCount = referralRegistry.getDirectReferrals(user);
        
        // 检查是否满足团队人数要求
        if (teamCount < levelConfigs[level].teamRequired) {
            return 0;
        }

        // 计算团队加成：teamBonusRate * √团队人数
        uint256 sqrtTeamCount = sqrt(teamCount);
        return (levelConfigs[level].teamBonusRate * sqrtTeamCount) / 10;
    }

    // 计算基础奖励
    function _calculateBaseReward(address user) internal view returns (uint256) {
        StakeInfo storage info = stakeInfo[user];
        if (info.stakedTokenIds.length == 0 || info.lastClaimTime == 0) {
            return 0;
        }

        uint256 timePassed = block.timestamp - info.lastClaimTime;
        uint256 dailyReward = 0;

        // 计算每个NFT的奖励
        for (uint i = 0; i < info.stakedTokenIds.length; i++) {
            uint256 tokenId = info.stakedTokenIds[i];
            (, , uint256 nftDailyReward, , , , ) = nft.getNFTAttributes(tokenId);
            dailyReward += nftDailyReward;
        }

        return (dailyReward * timePassed) / 1 days;
    }

    // 计算用户等级
    function _calculateLevel(uint256 power) internal view returns (uint256) {
        for (uint256 i = currentMaxLevel; i > 0; i--) {
            if (power >= levelConfigs[i].minPower) {
                return i;
            }
        }
        return 0;
    }

    // 质押NFT
    function stakeNFT(uint256 tokenId) external nonReentrant whenNotPaused {
        require(nft.ownerOf(tokenId) == msg.sender, "Not token owner");
        
        // 获取NFT属性
        (uint256 _owner, uint256 power, uint256 _dailyReward, uint256 maxReward, uint256 minedAmount, bool isStaked, ) = nft.getNFTAttributes(tokenId);
        require(!isStaked, "Already staked");
        require(minedAmount < maxReward, "Max reward reached");

        // 更新NFT状态
        nft.updateStakeStatus(tokenId, true);

        // 更新质押信息
        StakeInfo storage info = stakeInfo[msg.sender];
        info.stakedTokenIds.push(tokenId);
        info.totalPower += power;
        if (info.lastClaimTime == 0) {
            info.lastClaimTime = block.timestamp;
            totalMiners++;
            minersCount++;
        }

        // 更新全局信息
        totalStakedPower += power;

        // 更新用户等级
        _updateUserLevel(msg.sender);

        emit NFTStaked(msg.sender, tokenId, power);
    }

    // 解除质押
    function unstakeNFT(uint256 tokenId) external nonReentrant {
        StakeInfo storage info = stakeInfo[msg.sender];
        require(_hasStakedToken(info.stakedTokenIds, tokenId), "Token not staked");

        // 先领取奖励
        _claimReward(msg.sender);

        // 获取NFT属性
        (, uint256 power, , , , , ) = nft.getNFTAttributes(tokenId);

        // 更新NFT状态
        nft.updateStakeStatus(tokenId, false);

        // 更新质押信息
        _removeTokenId(info.stakedTokenIds, tokenId);
        info.totalPower -= power;
        
        // 更新全局信息
        totalStakedPower -= power;
        if (info.stakedTokenIds.length == 0) {
            totalMiners--;
            minersCount--;
        }

        // 更新用户等级
        _updateUserLevel(msg.sender);

        emit NFTUnstaked(msg.sender, tokenId);
    }

    // 内部函数：计算并发放奖励
    function _claimReward(address user) internal {
        StakeInfo storage info = stakeInfo[user];
        require(info.stakedTokenIds.length > 0, "No staked NFTs");
        
        uint256 timePassed = block.timestamp - info.lastClaimTime;
        require(timePassed > 0, "Too soon to claim");
        
        // 计算基础收益
        uint256 baseReward = _calculateBaseReward(user);

        // 应用等级加成
        uint256 levelBonus = (baseReward * levelConfigs[info.level].bonusRate) / 1000;
        
        // 计算团队加成
        uint256 teamBonus = _calculateTeamBonus(user);
        
        // 计算总收益
        uint256 totalReward = baseReward + levelBonus + teamBonus;

        // 计算并发放推荐奖励
        address referrer = referralRegistry.getUserReferrer(user);
        if (referrer != address(0)) {
            uint256 referralBonus = (totalReward * directBonusRate) / 100;
            if (referralBonus > 0) {
                require(zoneToken.transfer(referrer, referralBonus), "Referral reward transfer failed");
                emit TeamBonusClaimed(referrer, referralBonus);
            }
        }

        // 更新挖矿统计
        _updateOutput(totalReward);
        
        // 更新NFT已挖数量
        for (uint256 i = 0; i < info.stakedTokenIds.length; i++) {
            uint256 tokenId = info.stakedTokenIds[i];
            nft.updateMinedAmount(tokenId, totalReward);
        }
        
        // 更新最后领取时间
        info.lastClaimTime = block.timestamp;
        
        // 转移奖励
        require(zoneToken.transfer(user, totalReward), "Reward transfer failed");
        
        emit RewardClaimed(user, totalReward);
    }

    // 查询用户质押信息
    function getUserStakeInfo(address user) external view returns (
        uint256 totalPower,
        uint256 directPower,
        uint256 teamPower,
        uint256 level,
        uint256 lastClaimTime,
        uint256[] memory tokenIds
    ) {
        StakeInfo storage info = stakeInfo[user];
        return (
            info.totalPower,
            info.directPower,
            info.teamPower,
            info.level,
            info.lastClaimTime,
            info.stakedTokenIds
        );
    }

    // 查询等级配置
    function getLevelConfig(uint256 level) external view returns (
        uint256 minPower,
        uint256 maxPower,
        uint256 bonusRate,
        uint256 teamRequired,
        uint256 teamBonusRate
    ) {
        LevelConfig memory config = levelConfigs[level];
        return (
            config.minPower,
            config.maxPower,
            config.bonusRate,
            config.teamRequired,
            config.teamBonusRate
        );
    }

    // 查询可领取的奖励
    function getClaimableReward(address user) external view returns (uint256 reward, uint256 totalTeamBonus) {
        StakeInfo storage info = stakeInfo[user];
        if (info.stakedTokenIds.length == 0 || info.lastClaimTime == 0) {
            return (0, 0);
        }

        uint256 timePassed = block.timestamp - info.lastClaimTime;
        if (timePassed == 0) {
            return (0, 0);
        }

        uint256 totalReward = 0;

        // 计算每个NFT的奖励
        for (uint256 i = 0; i < info.stakedTokenIds.length; i++) {
            uint256 tokenId = info.stakedTokenIds[i];
            (,uint256 power, uint256 dailyReward, uint256 maxReward, uint256 minedAmount,,) = nft.getNFTAttributes(tokenId);
            
            // 计算基础奖励
            uint256 nftReward = (power * timePassed * dailyReward) / 1 days;
            
            // 检查是否超过最大奖励
            uint256 remainingReward = maxReward - minedAmount;
            if (nftReward > remainingReward) {
                nftReward = remainingReward;
            }
            
            totalReward += nftReward;
        }

        // 应用等级加成
        uint256 levelBonus = (totalReward * levelConfigs[info.level].bonusRate) / 1000;
        totalReward += levelBonus;

        // 计算团队加成
        totalTeamBonus = _calculateTeamBonus(user);
        totalReward += totalTeamBonus;

        return (totalReward, totalTeamBonus);
    }

    // 内部函数：检查是否质押了指定NFT
    function _hasStakedToken(uint256[] storage tokenIds, uint256 tokenId) internal view returns (bool) {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] == tokenId) return true;
        }
        return false;
    }

    // 内部函数：从数组中移除TokenId
    function _removeTokenId(uint256[] storage tokenIds, uint256 tokenId) internal {
        for (uint256 i = 0; i < tokenIds.length; i++) {
            if (tokenIds[i] == tokenId) {
                tokenIds[i] = tokenIds[tokenIds.length - 1];
                tokenIds.pop();
                break;
            }
        }
    }

    // 设置等级配置（仅管理员）
    function setLevelConfig(
        uint256 level,
        uint256 minPower,
        uint256 maxPower,
        uint256 bonusRate,
        uint256 teamRequired,
        uint256 teamBonusRate
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(level > 0, "Invalid level");
        require(minPower < maxPower, "Invalid power range");
        require(bonusRate <= 1000, "Invalid bonus rate");
        require(teamBonusRate <= 1000, "Invalid team bonus rate");

        levelConfigs[level] = LevelConfig({
            minPower: minPower,
            maxPower: maxPower,
            bonusRate: bonusRate,
            teamRequired: teamRequired,
            teamBonusRate: teamBonusRate
        });

        if (level > currentMaxLevel) {
            currentMaxLevel = level;
        }

        emit LevelConfigUpdated(level, minPower, maxPower, bonusRate, teamRequired, teamBonusRate);
    }

    // 批量领取奖励
    function claimReward() external nonReentrant whenNotPaused {
        _claimReward(msg.sender);
    }

    // 暂停/恢复合约
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // 设置手续费接收地址（仅管理员）
    function setFeeReceiver(address _feeReceiver) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_feeReceiver != address(0), "Invalid fee receiver");
        feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    // 设置市场手续费率（仅管理员）
    function setMarketFeeRate(uint256 _marketFeeRate) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(_marketFeeRate <= 1000, "Fee rate too high"); // 最高10%
        marketFeeRate = _marketFeeRate;
        emit MarketFeeRateUpdated(_marketFeeRate);
    }

    // 更新NFT属性（仅管理员）
    function updateNFTAttributes(
        uint256 tokenId,
        uint256 power,
        uint256 dailyReward,
        uint256 maxReward,
        string memory rarity
    ) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(power > 0, "Invalid power");
        require(dailyReward > 0, "Invalid daily reward");
        require(maxReward > 0, "Invalid max reward");
        require(bytes(rarity).length > 0, "Invalid rarity");

        nftAttributes[tokenId] = NFTAttributes({
            power: power,
            dailyReward: dailyReward,
            maxReward: maxReward,
            minedAmount: 0,
            isStaked: false,
            stakeTime: 0,
            rarity: rarity,
            isBurned: false
        });

        emit NFTAttributesUpdated(tokenId, power, dailyReward, maxReward);
    }

    // 更新市场统计
    function _updateMarketStats(uint256 price) internal {
        totalVolume += price;
        dailyVolume += price;

        // 每24小时重置日交易量
        if (block.timestamp >= lastVolumeReset + 1 days) {
            dailyVolume = price;
            lastVolumeReset = block.timestamp;
        }

        // 更新地板价
        if (floorPrice == 0 || price < floorPrice) {
            floorPrice = price;
        }

        emit MarketStatsUpdated(totalVolume, dailyVolume, floorPrice);
    }

    // 更新产出统计
    function _updateOutput(uint256 reward) internal {
        totalOutput += reward;
        todayOutput += reward;

        // 每24小时重置日产出
        if (block.timestamp >= lastOutputReset + 1 days) {
            uint256 oldOutput = todayOutput;
            todayOutput = reward;
            lastOutputReset = block.timestamp;
            emit DailyOutputReset(oldOutput, reward);
        }

        emit OutputUpdated(todayOutput, totalOutput);
    }

    // 查询产出统计
    function getOutputStats() external view returns (
        uint256 _todayOutput,
        uint256 _totalOutput,
        uint256 _totalMiners
    ) {
        return (todayOutput, totalOutput, totalMiners);
    }

    // 重置今日产出
    function resetDailyOutput() external onlyRole(DEFAULT_ADMIN_ROLE) {
        uint256 oldOutput = todayOutput;
        todayOutput = 0;
        emit DailyOutputReset(oldOutput, todayOutput);
    }

    // 设置推荐人
    function setReferrer(address referrer) external {
        require(referrer != address(0), "Invalid referrer");
        require(referrer != msg.sender, "Cannot refer yourself");
        
        // 使用 ReferralRegistry 设置推荐关系
        referralRegistry.bindReferrer(msg.sender, referrer);
        
        emit ReferrerSet(msg.sender, referrer);
    }

    // 查询用户团队信息
    function getUserTeamInfo(address user) external view returns (
        uint256 teamPower,
        uint256 directPower,
        uint256 directCount,
        uint256 teamCount
    ) {
        StakeInfo storage info = stakeInfo[user];
        directCount = referralRegistry.getDirectReferrals(user);
        address[] memory teamMembers = referralRegistry.getReferrerUsers(user);
        
        return (
            info.teamPower,
            info.directPower,
            directCount,
            teamMembers.length
        );
    }

    // 查询用户直推列表
    function getUserDirectReferrals(address user) external view returns (address[] memory) {
        return referralRegistry.getReferrerUsers(user);
    }

    // 查询用户团队成员
    function getUserTeamMembers(address user) external view returns (address[] memory) {
        return referralRegistry.getReferrerUsers(user);
    }

    // 更新用户等级
    function _updateUserLevel(address user) internal {
        StakeInfo storage info = stakeInfo[user];
        uint256 newLevel = _calculateLevel(info.totalPower);
        
        // 更新等级
        if (newLevel != info.level) {
            info.level = newLevel;
            emit UserLevelUpdated(user, newLevel);
        }
    }
}
