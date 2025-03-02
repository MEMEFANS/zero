// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";
import "../interfaces/IEvents.sol";

interface IUniswapV2Pair {
    function getReserves() external view returns (uint112 reserve0, uint112 reserve1, uint32 blockTimestampLast);
    function token0() external view returns (address);
    function token1() external view returns (address);
    function totalSupply() external view returns (uint256);
}

interface IReferralRegistry {
    function hasReferrer(address user) external view returns (bool);
    function getUserReferrer(address user) external view returns (address);
    function bindReferrer(address user, address referrer) external;
}

contract LPMining is AccessControl, ReentrancyGuard {
    // 事件声明
    event AdminRoleGranted(address indexed account, address indexed sender);
    event LPStaked(address indexed user, uint256 amount);
    event LPUnstaked(address indexed user, uint256 amount);
    event LPRewardClaimed(address indexed user, uint256 amount);
    event ReferralRewardPaid(address indexed referrer, address indexed user, uint256 amount);
    event RewardRateUpdated(uint256 newRate);
    event ContractPaused(address indexed sender);
    event ContractUnpaused(address indexed sender);

    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    
    // LP代币地址（ZONE-BNB LP或ZONE-USDT LP）
    IERC20 public lpToken;
    // ZONE代币地址
    IERC20 public zoneToken;
    IUniswapV2Pair public lpPair;

    // 添加推荐注册接口
    IReferralRegistry public referralRegistry;
    // 推荐奖励比例（10%）
    uint256 public constant REFERRAL_REWARD_RATE = 10;
    
    // 质押信息结构
    struct StakeInfo {
        uint256 amount;      // 质押数量
        uint256 stakeTime;   // 质押时间
        uint256 lastRewardTime;  // 上次领取奖励时间
    }
    
    // 用户质押信息
    mapping(address => StakeInfo) public stakeInfo;
    
    // 挖矿配置
    uint256 public rewardPerDay = 1000 * 10**18;  // 每天每个LP可以获得的ZONE数量
    uint256 public totalStaked;  // 总质押量
    bool public paused;  // 暂停状态

    constructor(
        address _lpToken,
        address _zoneToken,
        address _referralRegistry
    ) {
        require(_lpToken != address(0), "Invalid LP token");
        require(_zoneToken != address(0), "Invalid ZONE token");
        
        lpToken = IERC20(_lpToken);
        zoneToken = IERC20(_zoneToken);
        lpPair = IUniswapV2Pair(_lpToken);
        referralRegistry = IReferralRegistry(_referralRegistry);
        
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        emit AdminRoleGranted(msg.sender, msg.sender);
    }

    // 质押LP代币
    function stake(uint256 amount) external nonReentrant {
        require(!paused, "Mining is paused");
        require(amount > 0, "Amount must be greater than 0");
        require(lpToken.balanceOf(msg.sender) >= amount, "Insufficient LP balance");

        StakeInfo storage userStake = stakeInfo[msg.sender];
        
        // 如果已经有质押，先结算之前的收益
        if (userStake.amount > 0) {
            _harvestReward(msg.sender);
        }

        // 转移LP代币
        require(lpToken.transferFrom(msg.sender, address(this), amount), "LP transfer failed");

        // 更新质押信息
        userStake.amount += amount;
        userStake.stakeTime = block.timestamp;
        userStake.lastRewardTime = block.timestamp;
        totalStaked += amount;

        emit LPStaked(msg.sender, amount);
    }

    // 解除质押
    function unstake(uint256 amount) external nonReentrant {
        StakeInfo storage userStake = stakeInfo[msg.sender];
        require(userStake.amount >= amount, "Insufficient staked amount");

        // 先结算收益
        _harvestReward(msg.sender);

        // 更新质押信息
        userStake.amount -= amount;
        totalStaked -= amount;

        // 转移LP代币
        require(lpToken.transfer(msg.sender, amount), "LP transfer failed");

        emit LPUnstaked(msg.sender, amount);
    }

    // 领取收益
    function harvest() external nonReentrant {
        _harvestReward(msg.sender);
    }

    // 内部函数：计算并发放收益
    function _harvestReward(address user) internal {
        StakeInfo storage userStake = stakeInfo[user];
        require(userStake.amount > 0, "No stake found");

        uint256 reward = calculateReward(user);
        if (reward > 0) {
            userStake.lastRewardTime = block.timestamp;

            // 发放奖励
            require(zoneToken.transfer(user, reward), "Reward transfer failed");

            // 处理推荐奖励
            if (address(referralRegistry) != address(0) && referralRegistry.hasReferrer(user)) {
                address referrer = referralRegistry.getUserReferrer(user);
                uint256 referralReward = (reward * REFERRAL_REWARD_RATE) / 100;
                require(zoneToken.transfer(referrer, referralReward), "Referral reward failed");
                
                emit ReferralRewardPaid(referrer, user, referralReward);
            }

            emit LPRewardClaimed(user, reward);
        }
    }

    // 计算待领取的收益
    function calculateReward(address user) public view returns (uint256) {
        StakeInfo storage userStake = stakeInfo[user];
        if (userStake.amount == 0) return 0;

        uint256 timeElapsed = block.timestamp - userStake.lastRewardTime;
        uint256 reward = (userStake.amount * rewardPerDay * timeElapsed) / (1 days * totalStaked);
        
        return reward;
    }

    // 更新每日收益率
    function setRewardPerDay(uint256 newRate) external onlyRole(ADMIN_ROLE) {
        rewardPerDay = newRate;
        emit RewardRateUpdated(newRate);
    }

    // 暂停挖矿
    function pause() external onlyRole(ADMIN_ROLE) {
        require(!paused, "Already paused");
        paused = true;
        emit ContractPaused(msg.sender);
    }

    // 恢复挖矿
    function unpause() external onlyRole(ADMIN_ROLE) {
        require(paused, "Not paused");
        paused = false;
        emit ContractUnpaused(msg.sender);
    }

    // 紧急提取
    function emergencyWithdraw() external nonReentrant {
        StakeInfo storage userStake = stakeInfo[msg.sender];
        require(userStake.amount > 0, "No stake found");

        uint256 amount = userStake.amount;
        userStake.amount = 0;
        totalStaked -= amount;

        require(lpToken.transfer(msg.sender, amount), "LP transfer failed");
        
        emit LPUnstaked(msg.sender, amount);
    }

    // 查询用户质押信息
    function getUserStakeInfo(address user) external view returns (
        uint256 amount,
        uint256 stakeTime,
        uint256 pendingReward
    ) {
        StakeInfo storage userStake = stakeInfo[user];
        return (
            userStake.amount,
            userStake.stakeTime,
            calculateReward(user)
        );
    }
}
