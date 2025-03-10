// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

interface IZoneNFT {
    function ownerOf(uint256 tokenId) external view returns (address);
    function getApproved(uint256 tokenId) external view returns (address);
    function isApprovedForAll(address owner, address operator) external view returns (bool);
    function transferFrom(address from, address to, uint256 tokenId) external;
    function getNFTAttributes(uint256 tokenId) external view returns (
        uint8 rarity,
        uint256 power,
        uint256 dailyReward,
        uint256 maxReward,
        uint256 minedAmount,
        bool isStaked,
        uint256 stakeTime
    );
}
