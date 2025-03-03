// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

interface IReferralRegistry {
    // 事件
    event ReferrerBound(address indexed user, address indexed referrer);
    event AdminRoleGranted(address indexed account, address indexed sender);
    event AdminRoleRevoked(address indexed account, address indexed sender);

    // 核心功能
    function bindReferrer(address user, address referrer) external;
    function getUserReferrer(address user) external view returns (address);
    function hasReferrer(address user) external view returns (bool);
    function getReferrerUsers(address referrer) external view returns (address[] memory);
    function getDirectReferrals(address user) external view returns (uint256);

    // 管理功能
    function grantAuthorizedRole(address account) external;
    function revokeAuthorizedRole(address account) external;
}
