// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MetadataFacet is AccessControl {
    using Strings for uint256;

    // NFT基础URI
    string public baseURI;
    
    // NFT元数据URI（如果不使用baseURI）
    mapping(uint256 => string) private _tokenURIs;

    // 稀有度对应的图片URI
    mapping(uint8 => string) public rarityImages;

    // 事件
    event BaseURIChanged(string newBaseURI);
    event TokenURISet(uint256 indexed tokenId, string uri);
    event RarityImageSet(uint8 rarity, string imageURI);

    // 构造函数
    constructor() {
        _setupRole(DEFAULT_ADMIN_ROLE, msg.sender);
    }

    // 设置基础URI
    function setBaseURI(string memory _baseURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        baseURI = _baseURI;
        emit BaseURIChanged(_baseURI);
    }

    // 设置特定NFT的URI
    function setTokenURI(uint256 tokenId, string memory _tokenURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        _tokenURIs[tokenId] = _tokenURI;
        emit TokenURISet(tokenId, _tokenURI);
    }

    // 设置稀有度对应的图片
    function setRarityImage(uint8 rarity, string memory imageURI) external onlyRole(DEFAULT_ADMIN_ROLE) {
        rarityImages[rarity] = imageURI;
        emit RarityImageSet(rarity, imageURI);
    }

    // 批量设置稀有度图片
    function batchSetRarityImages(uint8[] memory rarities, string[] memory imageURIs) external onlyRole(DEFAULT_ADMIN_ROLE) {
        require(rarities.length == imageURIs.length, "Length mismatch");
        for(uint256 i = 0; i < rarities.length; i++) {
            rarityImages[rarities[i]] = imageURIs[i];
            emit RarityImageSet(rarities[i], imageURIs[i]);
        }
    }

    // 获取NFT的URI
    function tokenURI(uint256 tokenId) public view returns (string memory) {
        if(bytes(_tokenURIs[tokenId]).length > 0) {
            return _tokenURIs[tokenId];
        }
        
        if(bytes(baseURI).length > 0) {
            return string(abi.encodePacked(baseURI, tokenId.toString()));
        }

        return "";
    }

    // 获取稀有度对应的图片URI
    function getRarityImage(uint8 rarity) public view returns (string memory) {
        return rarityImages[rarity];
    }
}
