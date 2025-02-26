// SPDX-License-Identifier: MIT
pragma solidity 0.8.17;

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

contract IDODistributor is ReentrancyGuard, Pausable, Ownable {
    address public projectWallet;
    uint256 public referralPercentage = 10; // 10% for referrals
    uint256 public constant MAX_REFERRAL_PERCENTAGE = 20; // Maximum 20%

    // 用户绑定的推荐人映射
    mapping(address => address) public userReferrers;
    // 推荐人的下级用户列表
    mapping(address => address[]) public referrerUsers;
    // 用户是否已经被绑定推荐人
    mapping(address => bool) public isUserBound;

    event Investment(
        address indexed investor,
        address indexed referrer,
        uint256 amount,
        uint256 projectAmount,
        uint256 referralAmount
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

    constructor(address _projectWallet) {
        require(_projectWallet != address(0), "Invalid project wallet");
        projectWallet = _projectWallet;
    }

    // 绑定推荐人关系
    function bindReferrer(address referrer) external whenNotPaused {
        require(referrer != address(0), "Invalid referrer address");
        require(referrer != msg.sender, "Cannot refer yourself");
        require(!isUserBound[msg.sender], "User already has a referrer");
        require(referrer != projectWallet, "Cannot bind project wallet");
        
        userReferrers[msg.sender] = referrer;
        referrerUsers[referrer].push(msg.sender);
        isUserBound[msg.sender] = true;
        
        emit ReferrerBound(msg.sender, referrer);
    }

    // 获取用户的推荐人
    function getUserReferrer(address user) external view returns (address) {
        return userReferrers[user];
    }

    // 获取推荐人的下级用户列表
    function getReferrerUsers(address referrer) external view returns (address[] memory) {
        return referrerUsers[referrer];
    }

    // 接收投资并分配资金
    function invest() external payable nonReentrant whenNotPaused {
        require(msg.value > 0, "Investment amount must be greater than 0");
        require(msg.sender != projectWallet, "Project wallet cannot invest");
        
        address referrer = userReferrers[msg.sender];
        uint256 referralAmount = 0;
        uint256 projectAmount = msg.value;

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
            referralAmount
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

    receive() external payable {
        revert("Direct deposits not allowed");
    }
}
