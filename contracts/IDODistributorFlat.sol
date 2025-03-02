// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

// OpenZeppelin Contracts v4.4.1 (utils/Context.sol)
abstract contract Context {
    function _msgSender() internal view virtual returns (address) {
        return msg.sender;
    }

    function _msgData() internal view virtual returns (bytes calldata) {
        return msg.data;
    }
}

// OpenZeppelin Contracts (last updated v4.7.0) (security/Pausable.sol)
abstract contract Pausable is Context {
    event Paused(address account);
    event Unpaused(address account);

    bool private _paused;

    constructor() {
        _paused = false;
    }

    modifier whenNotPaused() {
        _requireNotPaused();
        _;
    }

    modifier whenPaused() {
        _requirePaused();
        _;
    }

    function paused() public view virtual returns (bool) {
        return _paused;
    }

    function _requireNotPaused() internal view virtual {
        require(!paused(), "Pausable: paused");
    }

    function _requirePaused() internal view virtual {
        require(paused(), "Pausable: not paused");
    }

    function _pause() internal virtual whenNotPaused {
        _paused = true;
        emit Paused(_msgSender());
    }

    function _unpause() internal virtual whenPaused {
        _paused = false;
        emit Unpaused(_msgSender());
    }
}

// OpenZeppelin Contracts (last updated v4.7.0) (security/ReentrancyGuard.sol)
abstract contract ReentrancyGuard {
    uint256 private constant _NOT_ENTERED = 1;
    uint256 private constant _ENTERED = 2;

    uint256 private _status;

    constructor() {
        _status = _NOT_ENTERED;
    }

    modifier nonReentrant() {
        _nonReentrantBefore();
        _;
        _nonReentrantAfter();
    }

    function _nonReentrantBefore() private {
        require(_status != _ENTERED, "ReentrancyGuard: reentrant call");
        _status = _ENTERED;
    }

    function _nonReentrantAfter() private {
        _status = _NOT_ENTERED;
    }
}

// OpenZeppelin Contracts (last updated v4.7.0) (access/Ownable.sol)
abstract contract Ownable is Context {
    address private _owner;

    event OwnershipTransferred(address indexed previousOwner, address indexed newOwner);

    constructor() {
        _transferOwnership(_msgSender());
    }

    modifier onlyOwner() {
        _checkOwner();
        _;
    }

    function owner() public view virtual returns (address) {
        return _owner;
    }

    function _checkOwner() internal view virtual {
        require(owner() == _msgSender(), "Ownable: caller is not the owner");
    }

    function renounceOwnership() public virtual onlyOwner {
        _transferOwnership(address(0));
    }

    function transferOwnership(address newOwner) public virtual onlyOwner {
        require(newOwner != address(0), "Ownable: new owner is the zero address");
        _transferOwnership(newOwner);
    }

    function _transferOwnership(address newOwner) internal virtual {
        address oldOwner = _owner;
        _owner = newOwner;
        emit OwnershipTransferred(oldOwner, newOwner);
    }
}

// OpenZeppelin Contracts (last updated v4.7.0) (token/ERC20/IERC20.sol)
interface IERC20 {
    function transfer(address to, uint256 amount) external returns (bool);
}

interface IReferralRegistry {
    function bindReferrer(address user, address referrer) external;
    function getUserReferrer(address user) external view returns (address);
    function hasReferrer(address user) external view returns (bool);
    function getReferrerUsers(address referrer) external view returns (address[] memory);
}

contract IDODistributor is ReentrancyGuard, Pausable, Ownable {
    address public projectWallet;
    uint256 public referralPercentage = 10; // 10% for referrals
    uint256 public constant MAX_REFERRAL_PERCENTAGE = 20; // Maximum 20%

    // IDO时间控制
    uint256 public idoEndTime;        // IDO结束时间
    uint256 public claimStartTime;    // 代币领取开始时间

    // 新增：IDO参数
    uint256 public constant TOTAL_SUPPLY = 100_000_000 * 10**18; // 1亿代币
    uint256 public constant EXCHANGE_RATE = 10000; // 1 BNB = 10000 ZONE
    uint256 public constant MIN_INVESTMENT = 0.1 ether; // 最小投资
    uint256 public constant MAX_INVESTMENT = 2 ether; // 最大投资

    // 新增：募资相关状态
    uint256 public totalRaisedBNB; // 已募集的BNB总量
    mapping(address => uint256) public userInvestments; // 用户投资金额
    mapping(address => bool) public hasClaimedTokens; // 用户是否已领取代币
    mapping(address => uint256) public userTokenAllocation; // 用户可领取的代币数量

    // 添加推荐注册表
    IReferralRegistry public referralRegistry;

    // 用户绑定的推荐人映射
    mapping(address => address) public userReferrers;
    // 推荐人的下级用户列表
    mapping(address => address[]) public referrerUsers;
    // 用户是否已经被绑定推荐人
    mapping(address => bool) public isUserBound;

    // 新增：ZONE代币合约地址
    IERC20 public zoneToken;

    // 新增事件
    event TokensClaimed(address indexed user, uint256 amount);
    event Investment(
        address indexed investor,
        address indexed referrer,
        uint256 amount,
        uint256 projectAmount,
        uint256 referralAmount,
        uint256 newTotalRaised  // 添加新的总募集量
    );
    event ReferrerBound(
        address indexed user,
        address indexed referrer
    );
    event ProjectWalletUpdated(
        address indexed oldWallet,
        address indexed newWallet
    );
    event ReferralPercentageUpdated(
        uint256 oldPercentage,
        uint256 newPercentage
    );
    event IDOTimeUpdated(
        uint256 endTime,
        uint256 claimTime
    );

    constructor(
        address _projectWallet, 
        address _zoneToken,
        address _referralRegistry,
        uint256 _idoEndTime,
        uint256 _claimStartTime
    ) {
        require(_projectWallet != address(0), "Zero address");
        require(_zoneToken != address(0), "Zero address");
        require(_referralRegistry != address(0), "Zero address");
        require(_idoEndTime > block.timestamp, "Invalid end time");
        require(_claimStartTime > _idoEndTime, "Claim time must be after end time");

        projectWallet = _projectWallet;
        zoneToken = IERC20(_zoneToken);
        referralRegistry = IReferralRegistry(_referralRegistry);
        idoEndTime = _idoEndTime;
        claimStartTime = _claimStartTime;
    }

    // 绑定推荐人关系
    function bindReferrer(address referrer) external whenNotPaused {
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(!referralRegistry.hasReferrer(msg.sender), "User already has a referrer");
        require(referrer != projectWallet, "Cannot bind project wallet");

        referralRegistry.bindReferrer(msg.sender, referrer);
    }

    // 获取用户的推荐人
    function getUserReferrer(address user) external view returns (address) {
        return referralRegistry.getUserReferrer(user);
    }

    // 获取推荐人的下级用户列表
    function getReferrerUsers(address referrer) external view returns (address[] memory) {
        return referrerUsers[referrer];
    }

    // 修改invest函数，添加时间控制
    function invest() external payable nonReentrant whenNotPaused {
        require(block.timestamp <= idoEndTime, "IDO ended");
        require(msg.value >= MIN_INVESTMENT, "Below minimum investment");
        require(msg.value <= MAX_INVESTMENT, "Exceeds maximum investment");
        require(userInvestments[msg.sender] + msg.value <= MAX_INVESTMENT, "Would exceed max investment");
        require(msg.sender != projectWallet, "Project wallet cannot invest");

        address referrer = referralRegistry.getUserReferrer(msg.sender);
        uint256 referralAmount = 0;
        uint256 projectAmount = msg.value;

        // 计算用户应获得的代币数量
        uint256 tokenAmount = msg.value * EXCHANGE_RATE * 10**18 / 1 ether;
        userTokenAllocation[msg.sender] += tokenAmount;

        // 更新投资记录
        userInvestments[msg.sender] += msg.value;
        totalRaisedBNB += msg.value;

        // 如果用户有绑定的推荐人，计算并发送推荐奖励
        if (referrer != address(0)) {
            referralAmount = (msg.value * referralPercentage) / 100;
            projectAmount = msg.value - referralAmount;

            (bool referralSuccess,) = referrer.call{value: referralAmount}("");
            require(referralSuccess, "Referral transfer failed");
        }

        // 发送资金给项目方
        (bool projectSuccess,) = projectWallet.call{value: projectAmount}("");
        require(projectSuccess, "Project transfer failed");

        emit Investment(
            msg.sender,
            referrer,
            msg.value,
            projectAmount,
            referralAmount,
            totalRaisedBNB  // 添加当前总募集量到事件中
        );
    }

    // 修改claimTokens函数，添加时间控制
    function claimTokens() external nonReentrant whenNotPaused {
        require(block.timestamp >= claimStartTime, "Claim not started");
        require(userTokenAllocation[msg.sender] > 0, "No tokens to claim");
        require(!hasClaimedTokens[msg.sender], "Tokens already claimed");

        uint256 amount = userTokenAllocation[msg.sender];
        hasClaimedTokens[msg.sender] = true;

        require(zoneToken.transfer(msg.sender, amount), "Token transfer failed");

        emit TokensClaimed(msg.sender, amount);
    }

    // 新增：更新IDO时间设置
    function updateIDOTimes(
        uint256 _idoEndTime,
        uint256 _claimStartTime
    ) external onlyOwner {
        require(_idoEndTime > block.timestamp, "Invalid end time");
        require(_claimStartTime > _idoEndTime, "Claim time must be after end time");

        idoEndTime = _idoEndTime;
        claimStartTime = _claimStartTime;

        emit IDOTimeUpdated(_idoEndTime, _claimStartTime);
    }

    // 新增：查询IDO状态
    function getIDOStatus() external view returns (
        uint256 _idoEndTime,
        uint256 _claimStartTime,
        bool isActive,
        bool isClaimable
    ) {
        return (
            idoEndTime,
            claimStartTime,
            block.timestamp <= idoEndTime,
            block.timestamp >= claimStartTime
        );
    }

    // 允许项目方更改接收钱包地址
    function setProjectWallet(address newWallet) external onlyOwner {
        require(newWallet != address(0), "Invalid wallet address");
        require(newWallet != address(this), "Cannot set contract as wallet");

        address oldWallet = projectWallet;
        projectWallet = newWallet;

        emit ProjectWalletUpdated(oldWallet, newWallet);
    }

    // 允许更改推荐奖励比例
    function setReferralPercentage(uint256 newPercentage) external onlyOwner {
        require(newPercentage <= MAX_REFERRAL_PERCENTAGE, "Percentage exceeds maximum");

        uint256 oldPercentage = referralPercentage;
        referralPercentage = newPercentage;

        emit ReferralPercentageUpdated(oldPercentage, newPercentage);
    }

    // 暂停合约
    function pause() external onlyOwner {
        _pause();
    }

    // 恢复合约
    function unpause() external onlyOwner {
        _unpause();
    }

    // 紧急提现功能
    function emergencyWithdraw() external onlyOwner {
        uint256 balance = address(this).balance;
        require(balance > 0, "No balance to withdraw");

        (bool success,) = owner().call{value: balance}("");
        require(success, "Withdrawal failed");
    }

    // 新增：获取IDO募集信息
    function getIDOInfo() external view returns (
        uint256 _totalRaised,         // 总募集量
        uint256 _participantsCount,   // 参与人数
        uint256 _averageInvestment    // 平均投资额
    ) {
        uint256 participants = 0;
        address[] memory users = referralRegistry.getReferrerUsers(address(0));
        for (uint i = 0; i < users.length; i++) {
            if (userInvestments[users[i]] > 0) {
                participants++;
            }
        }
        
        return (
            totalRaisedBNB,
            participants,
            participants > 0 ? totalRaisedBNB / participants : 0
        );
    }

    receive() external payable {
        revert("Direct deposits not allowed");
    }
}
