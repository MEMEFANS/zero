// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/extensions/IERC721Metadata.sol";
import "@openzeppelin/contracts/interfaces/IERC165.sol";
import "@openzeppelin/contracts/utils/Base64.sol";
import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibMysteryBox } from "../libraries/LibMysteryBox.sol";
import { LibNFT } from "../libraries/LibNFT.sol";
import "../libraries/LibStrings.sol";
import "../interfaces/IMysteryBoxFacet.sol";

contract NFTFacet is IERC721, IERC721Metadata {
    using LibStrings for uint256;
    using Base64 for bytes;

    function initialize(string memory _name, string memory _symbol) external {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractOwner(ds);
        LibNFT.initializeStorage(_name, _symbol);
    }

    function supportsInterface(bytes4 interfaceId) public pure override returns (bool) {
        return
            interfaceId == type(IERC721).interfaceId ||
            interfaceId == type(IERC721Metadata).interfaceId ||
            interfaceId == type(IERC165).interfaceId;
    }

    function name() external view override returns (string memory) {
        return LibNFT.getStorage().name;
    }

    function symbol() external view override returns (string memory) {
        return LibNFT.getStorage().symbol;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(LibNFT.exists(tokenId), "Token does not exist");
        return _generateTokenURI(tokenId);
    }

    function _generateTokenURI(uint256 tokenId) internal view returns (string memory) {
        string memory baseJSON = _generateBaseJSON(tokenId);
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(bytes(baseJSON))
            )
        );
    }

    function _generateBaseJSON(uint256 tokenId) internal view returns (string memory) {
        LibMysteryBox.NFTAttributes memory nft = LibMysteryBox.getStorage().nftAttributes[tokenId];
        string memory imageURI = IMysteryBoxFacet(address(this)).getNFTImageURI(tokenId);
        
        return string(
            abi.encodePacked(
                '{"name":"Mystery Box #', tokenId.toString(),
                '","description":"A mysterious NFT","image":"', imageURI,
                '","attributes":', _generateAttributesPart1(nft),
                _generateAttributesPart2(nft), ']}'
            )
        );
    }

    function _generateAttributesPart1(LibMysteryBox.NFTAttributes memory nft) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                '[{"trait_type":"Rarity","value":"', nft.rarity,
                '"},{"trait_type":"Power","value":', nft.power.toString(),
                '},{"trait_type":"Daily Reward","value":', nft.dailyReward.toString(), '}'
            )
        );
    }

    function _generateAttributesPart2(LibMysteryBox.NFTAttributes memory nft) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                ',{"trait_type":"Max Reward","value":', nft.maxReward.toString(),
                '},{"trait_type":"Mined Amount","value":', nft.minedAmount.toString(),
                '},{"trait_type":"Is Staked","value":', nft.isStaked ? "true" : "false", '}'
            )
        );
    }

    function balanceOf(address owner) public view override returns (uint256) {
        require(owner != address(0), "ERC721: balance query for the zero address");
        return LibNFT.getStorage().balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        return LibNFT.ownerOf(tokenId);
    }

    function approve(address to, uint256 tokenId) public override {
        address owner = LibNFT.ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(
            msg.sender == owner || LibNFT.getStorage().operatorApprovals[owner][msg.sender],
            "ERC721: approve caller is not owner nor approved for all"
        );
        LibNFT.getStorage().tokenApprovals[tokenId] = to;
        emit LibNFT.Approval(owner, to, tokenId);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(LibNFT.exists(tokenId), "ERC721: approved query for nonexistent token");
        return LibNFT.getStorage().tokenApprovals[tokenId];
    }

    function setApprovalForAll(address operator, bool approved) public override {
        require(operator != msg.sender, "ERC721: approve to caller");
        LibNFT.getStorage().operatorApprovals[msg.sender][operator] = approved;
        emit LibNFT.ApprovalForAll(msg.sender, operator, approved);
    }

    function isApprovedForAll(address owner, address operator) public view override returns (bool) {
        return LibNFT.getStorage().operatorApprovals[owner][operator];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(LibNFT.isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        LibNFT.transferToken(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) public override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(LibNFT.isApprovedOrOwner(msg.sender, tokenId), "ERC721: transfer caller is not owner nor approved");
        LibNFT.transferToken(from, to, tokenId);
        require(LibNFT.checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }
}
