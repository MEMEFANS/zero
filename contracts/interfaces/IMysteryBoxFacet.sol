// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

interface IMysteryBoxFacet {
    function getNFTImageURI(uint256 tokenId) external view returns (string memory);
}
