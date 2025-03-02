// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/IERC721Receiver.sol";

library LibNFT {
    bytes32 constant STORAGE_POSITION = keccak256("diamond.standard.nft.storage");

    event Transfer(address indexed from, address indexed to, uint256 indexed tokenId);
    event Approval(address indexed owner, address indexed approved, uint256 indexed tokenId);
    event ApprovalForAll(address indexed owner, address indexed operator, bool approved);

    struct NFTStorage {
        string name;
        string symbol;
        uint256 totalSupply;
        // Token data
        mapping(uint256 => address) owners;
        mapping(uint256 => address) tokenApprovals;
        mapping(address => mapping(address => bool)) operatorApprovals;
        mapping(address => uint256) balances;
    }

    function getStorage() internal pure returns (NFTStorage storage ns) {
        bytes32 position = STORAGE_POSITION;
        assembly {
            ns.slot := position
        }
    }

    function initializeStorage(string memory _name, string memory _symbol) internal {
        NFTStorage storage ns = getStorage();
        ns.name = _name;
        ns.symbol = _symbol;
    }

    function exists(uint256 tokenId) internal view returns (bool) {
        return getStorage().owners[tokenId] != address(0);
    }

    function ownerOf(uint256 tokenId) internal view returns (address) {
        NFTStorage storage ns = getStorage();
        address owner = ns.owners[tokenId];
        require(owner != address(0), "ERC721: invalid token ID");
        return owner;
    }

    function isApprovedOrOwner(address spender, uint256 tokenId) internal view returns (bool) {
        NFTStorage storage ns = getStorage();
        address owner = ownerOf(tokenId);
        return (spender == owner || 
                ns.tokenApprovals[tokenId] == spender || 
                ns.operatorApprovals[owner][spender]);
    }

    function _beforeTokenTransfer(address from, address to, uint256 tokenId) private view {
        if (from == address(0)) {
            require(!exists(tokenId), "ERC721: token already minted");
        } else {
            require(ownerOf(tokenId) == from, "ERC721: transfer from incorrect owner");
        }
        
        if (to == address(0)) {
            require(exists(tokenId), "ERC721: token doesn't exist");
        }
    }

    function transferToken(address from, address to, uint256 tokenId) internal {
        _beforeTokenTransfer(from, to, tokenId);
        
        NFTStorage storage ns = getStorage();

        // Clear approvals
        delete ns.tokenApprovals[tokenId];

        // Update balances
        if (from != address(0)) {
            ns.balances[from] -= 1;
        }
        if (to != address(0)) {
            ns.balances[to] += 1;
        }

        // Update owner
        ns.owners[tokenId] = to;

        emit Transfer(from, to, tokenId);
    }

    function mint(address to, uint256 tokenId) internal {
        require(to != address(0), "ERC721: mint to the zero address");
        transferToken(address(0), to, tokenId);
    }

    function burn(uint256 tokenId) internal {
        address owner = ownerOf(tokenId);
        transferToken(owner, address(0), tokenId);
    }

    function checkOnERC721Received(
        address from,
        address to,
        uint256 tokenId,
        bytes memory data
    ) internal returns (bool) {
        if (to.code.length == 0) {
            return true;
        }

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
    }
}
