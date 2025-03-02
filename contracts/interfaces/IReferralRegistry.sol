// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IReferralRegistry {
    // 绑定推荐人
    function bindReferrer(address user, address referrer) external;

    // 获取用户的推荐人
    function getUserReferrer(address user) external view returns (address);

    // 获取推荐人的下级用户列表
    function getReferrerUsers(address referrer) external view returns (address[] memory);

    // 获取用户的直推人数
    function getDirectReferrals(address user) external view returns (uint256);

    // 检查用户是否已经有推荐人
    function hasReferrer(address user) external view returns (bool);

    // 系统管理事件
    event AdminRoleGranted(address indexed account, address indexed admin);
    event AdminRoleRevoked(address indexed account, address indexed admin);
    
    // 推荐系统事件
    event ReferrerBound(address indexed user, address indexed referrer);
}
