// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC721/IERC721.sol";
import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";
import "@openzeppelin/contracts/utils/Counters.sol";
import "../diamond/libraries/LibDiamond.sol";

contract NFTFacet is IERC721, IERC721Receiver {
    using Counters for Counters.Counter;

    struct NFTInfo {
        uint256 power;
        uint256 bonus;
        string nftType;
        bool isStaked;
    }

    struct NFTStorage {
        // Token name
        string name;
        // Token symbol
        string symbol;
        // Mapping from token ID to owner address
        mapping(uint256 => address) owners;
        // Mapping owner address to token count
        mapping(address => uint256) balances;
        // Mapping from token ID to approved address
        mapping(uint256 => address) tokenApprovals;
        // Mapping from owner to operator approvals
        mapping(address => mapping(address => bool)) operatorApprovals;
        // Mapping from tokenId to NFT info
        mapping(uint256 => NFTInfo) nftInfo;
        // Token ID counter
        Counters.Counter tokenIds;
        // Base URI
        string baseURI;
    }

    bytes32 constant STORAGE_POSITION = keccak256("diamond.standard.nft.storage");

    function nftStorage() internal pure returns (NFTStorage storage ns) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ns.slot := position
        }
    }

    function initialize(string memory name_, string memory symbol_) external {
        LibDiamond.enforceIsContractOwner();
        NFTStorage storage ns = nftStorage();
        ns.name = name_;
        ns.symbol = symbol_;
    }

    function mint(address to, string memory nftType, uint256 power, uint256 bonus) external {
        LibDiamond.enforceIsContractOwner();
        NFTStorage storage ns = nftStorage();
        ns.tokenIds.increment();
        uint256 tokenId = ns.tokenIds.current();
        
        ns.owners[tokenId] = to;
        ns.balances[to] += 1;
        ns.nftInfo[tokenId] = NFTInfo({
            power: power,
            bonus: bonus,
            nftType: nftType,
            isStaked: false
        });

        emit Transfer(address(0), to, tokenId);
    }

    function getNFTInfo(uint256 tokenId) external view returns (NFTInfo memory) {
        return nftStorage().nftInfo[tokenId];
    }

    function stake(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        NFTStorage storage ns = nftStorage();
        require(!ns.nftInfo[tokenId].isStaked, "Already staked");
        ns.nftInfo[tokenId].isStaked = true;
    }

    function unstake(uint256 tokenId) external {
        require(ownerOf(tokenId) == msg.sender, "Not token owner");
        NFTStorage storage ns = nftStorage();
        require(ns.nftInfo[tokenId].isStaked, "Not staked");
        ns.nftInfo[tokenId].isStaked = false;
    }

    // ERC721 Metadata
    function name() external view override returns (string memory) {
        return nftStorage().name;
    }

    function symbol() external view override returns (string memory) {
        return nftStorage().symbol;
    }

    function tokenURI(uint256 tokenId) external view override returns (string memory) {
        require(_exists(tokenId), "ERC721: URI query for nonexistent token");
        NFTStorage storage ns = nftStorage();
        string memory baseURI = ns.baseURI;
        return bytes(baseURI).length > 0 ? string(abi.encodePacked(baseURI, tokenId.toString())) : "";
    }

    // ERC721 Core
    function approve(address to, uint256 tokenId) external override {
        address owner = ownerOf(tokenId);
        require(to != owner, "ERC721: approval to current owner");
        require(
            msg.sender == owner || isApprovedForAll(owner, msg.sender),
            "ERC721: approve caller is not token owner or approved for all"
        );
        NFTStorage storage ns = nftStorage();
        ns.tokenApprovals[tokenId] = to;
        emit Approval(owner, to, tokenId);
    }

    function setApprovalForAll(address operator, bool approved) external override {
        require(operator != msg.sender, "ERC721: approve to caller");
        NFTStorage storage ns = nftStorage();
        ns.operatorApprovals[msg.sender][operator] = approved;
        emit ApprovalForAll(msg.sender, operator, approved);
    }

    function getApproved(uint256 tokenId) public view override returns (address) {
        require(_exists(tokenId), "ERC721: approved query for nonexistent token");
        return nftStorage().tokenApprovals[tokenId];
    }

    function transferFrom(address from, address to, uint256 tokenId) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _transfer(from, to, tokenId);
    }

    function safeTransferFrom(address from, address to, uint256 tokenId) external override {
        safeTransferFrom(from, to, tokenId, "");
    }

    function safeTransferFrom(address from, address to, uint256 tokenId, bytes memory data) public override {
        require(_isApprovedOrOwner(msg.sender, tokenId), "ERC721: caller is not token owner or approved");
        _safeTransfer(from, to, tokenId, data);
    }

    // Standard ERC721 functions implementation
    function balanceOf(address owner) external view override returns (uint256) {
        require(owner != address(0), "ERC721: address zero is not a valid owner");
        return nftStorage().balances[owner];
    }

    function ownerOf(uint256 tokenId) public view override returns (address) {
        address owner = nftStorage().owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    // Internal functions
    function _exists(uint256 tokenId) internal view returns (bool) {
        return nftStorage().owners[tokenId] != address(0);
    }

    function _isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        address owner = ownerOf(tokenId);
        return (spender == owner || isApprovedForAll(owner, spender) || getApproved(tokenId) == spender);
    }

    function _safeTransfer(address from, address to, uint256 tokenId, bytes memory data) internal {
        _transfer(from, to, tokenId);
        require(_checkOnERC721Received(from, to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _transfer(address from, address to, uint256 tokenId) internal {
        require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        require(to != address(0), "ERC721: transfer to the zero address");

        NFTStorage storage ns = nftStorage();

        // Clear approvals
        delete ns.tokenApprovals[tokenId];

        // Update balances
        ns.balances[from] -= 1;
        ns.balances[to] += 1;

        // Update owner
        ns.owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function _safeMint(address to, uint256 tokenId) internal {
        _safeMint(to, tokenId, "");
    }

    function _safeMint(address to, uint256 tokenId, bytes memory data) internal {
        _mint(to, tokenId);
        require(_checkOnERC721Received(address(0), to, tokenId, data), "ERC721: transfer to non ERC721Receiver implementer");
    }

    function _mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        require(!_exists(tokenId), "ERC721: token already minted");

        NFTStorage storage ns = nftStorage();

        // Update balances
        ns.balances[to] += 1;

        // Update owner
        ns.owners[tokenId] = to;

        emit Transfer(address(0), to, tokenId);
    }

    function _burn(uint256 tokenId) internal {
        address owner = ownerOf(tokenId);

        NFTStorage storage ns = nftStorage();

        // Clear approvals
        delete ns.tokenApprovals[tokenId];

        // Update balances
        ns.balances[owner] -= 1;

        // Delete owner
        delete ns.owners[tokenId];

        emit Transfer(owner, address(0), tokenId);
    }

    function _checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) private returns (bool) {
        if (to.code.length > 0) {
            try IERC721Receiver(to).onERC721Received(msg.sender, from, tokenId, data) returns (bytes4 retval) {
                return retval == IERC721Receiver.onERC721Received.selector;
            } catch (bytes memory reason) {
                if (reason.length == 0) {
                    revert("ERC721: transfer to non ERC721Receiver implementer");
                } else {
                    assembly {
                        revert(add(32, reason), mload(reason))
                    }
                }
            }
        } else {
            return true;
        }
    }

    // Admin functions
    function setBaseURI(string memory baseURI_) external {
        LibDiamond.enforceIsContractOwner();
        NFTStorage storage ns = nftStorage();
        ns.baseURI = baseURI_;
    }

    function onERC721Received(
        address,
        address,
        uint256,
        bytes memory
    ) public virtual override returns (bytes4) {
        return this.onERC721Received.selector;
    }
}
