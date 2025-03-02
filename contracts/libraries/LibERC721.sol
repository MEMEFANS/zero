// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Address.sol";
import "../interfaces/IEvents.sol";
import { LibDiamond } from "../diamond/libraries/LibDiamond.sol";

library LibERC721 {
    using Address for address;

    event NFTMinted(address indexed to, uint256 indexed tokenId);
    event NFTBurned(uint256 indexed tokenId, address indexed owner);
    event NFTTransferred(address indexed from, address indexed to, uint256 indexed tokenId);

    bytes32 constant STORAGE_POSITION = keccak256("diamond.standard.erc721.storage");

    struct ERC721Storage {
        // Token data
        mapping(uint256 => address) owners;
        mapping(uint256 => address) tokenApprovals;
        mapping(address => mapping(address => bool)) operatorApprovals;
        mapping(address => uint256) balances;
        uint256 totalSupply;
    }

    function erc721Storage() internal pure returns (ERC721Storage storage ds) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
    }

    // 查询NFT所有者
    function ownerOf(uint256 tokenId) internal view returns (address) {
        address owner = erc721Storage().owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    // 查询余额
    function balanceOf(address owner) internal view returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return erc721Storage().balances[owner];
    }

    // 查询NFT总供应量
    function totalSupply() internal view returns (uint256) {
        return erc721Storage().totalSupply;
    }

    // 查询NFT是否被授权
    function getApproved(uint256 tokenId) internal view returns (address) {
        _requireMinted(tokenId);
        return erc721Storage().tokenApprovals[tokenId];
    }

    // 查询是否被授权所有NFT
    function isApprovedForAll(address owner, address operator) internal view returns (bool) {
        return erc721Storage().operatorApprovals[owner][operator];
    }

    // 铸造NFT
    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        ERC721Storage storage ds = erc721Storage();

        ds.balances[to] += 1;
        ds.owners[tokenId] = to;
        ds.totalSupply += 1;

        emit NFTMinted(to, tokenId);
    }

    // 销毁NFT
    function _burn(uint256 tokenId) internal {
        address owner = ownerOf(tokenId);
        ERC721Storage storage ds = erc721Storage();

        delete ds.tokenApprovals[tokenId];
        ds.balances[owner] -= 1;
        delete ds.owners[tokenId];
        ds.totalSupply -= 1;

        emit NFTBurned(tokenId, owner);
    }

    // 转移NFT
    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        ERC721Storage storage ds = erc721Storage();

        delete ds.tokenApprovals[tokenId];
        ds.balances[from] -= 1;
        ds.balances[to] += 1;
        ds.owners[tokenId] = to;

        emit NFTTransferred(from, to, tokenId);
    }

    // 检查NFT是否存在
    function _exists(uint256 tokenId) internal view returns (bool) {
        return erc721Storage().owners[tokenId] != address(0);
    }

    // 检查NFT是否已铸造
    function _requireMinted(uint256 tokenId) internal view {
        require(_exists(tokenId), "ERC721: invalid token ID");
    }

    // 检查是否被授权或是NFT所有者
    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }
}
