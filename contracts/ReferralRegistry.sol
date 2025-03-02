// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "./interfaces/IReferralRegistry.sol";

contract ReferralRegistry is IReferralRegistry, AccessControl {
    bytes32 public constant ADMIN_ROLE = keccak256("ADMIN_ROLE");
    bytes32 public constant AUTHORIZED_CONTRACT_ROLE = keccak256("AUTHORIZED_CONTRACT_ROLE");

    // 用户的推荐人映射
    mapping(address => address) private userReferrer;
    // 推荐人的下级用户列表
    mapping(address => address[]) private referrerUsers;
    // 用户的直推人数
    mapping(address => uint256) private directReferralCount;

    constructor() {
        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(ADMIN_ROLE, msg.sender);
        
        emit AdminRoleGranted(msg.sender, msg.sender);
    }

    // 修饰器：只允许授权的合约调用
    modifier onlyAuthorized() {
        require(
            hasRole(AUTHORIZED_CONTRACT_ROLE, msg.sender) || 
            hasRole(ADMIN_ROLE, msg.sender),
            "Not authorized"
        );
        _;
    }

    // 绑定推荐人
    function bindReferrer(address user, address referrer) external override onlyAuthorized {
        require(user != address(0) && referrer != address(0), "Invalid address");
        require(user != referrer, "Cannot refer self");
        require(userReferrer[user] == address(0), "Already has referrer");
        
        // 检查是否形成循环推荐
        address currentReferrer = referrer;
        while (currentReferrer != address(0)) {
            require(currentReferrer != user, "Circular referral");
            currentReferrer = userReferrer[currentReferrer];
        }

        userReferrer[user] = referrer;
        referrerUsers[referrer].push(user);
        directReferralCount[referrer]++;

        emit ReferrerBound(user, referrer);
    }

    // 查询用户的推荐人
    function getUserReferrer(address user) external view override returns (address) {
        return userReferrer[user];
    }

    // 查询用户是否有推荐人
    function hasReferrer(address user) external view override returns (bool) {
        return userReferrer[user] != address(0);
    }

    // 查询推荐人的下级用户列表
    function getReferrerUsers(address referrer) external view override returns (address[] memory) {
        return referrerUsers[referrer];
    }

    // 查询用户的直推人数
    function getDirectReferrals(address user) external view override returns (uint256) {
        return directReferralCount[user];
    }

    // 授权合约
    function grantAuthorizedRole(address account) external onlyRole(ADMIN_ROLE) {
        grantRole(AUTHORIZED_CONTRACT_ROLE, account);
        emit AdminRoleGranted(account, msg.sender);
    }

    // 撤销授权
    function revokeAuthorizedRole(address account) external onlyRole(ADMIN_ROLE) {
        revokeRole(AUTHORIZED_CONTRACT_ROLE, account);
        emit AdminRoleRevoked(account, msg.sender);
    }
}
