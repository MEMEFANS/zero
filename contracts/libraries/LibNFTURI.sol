// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/utils/Base64.sol";
import "./LibMysteryBox.sol";
import "./LibStrings.sol";

library LibNFTURI {
    using Base64 for bytes;
    using LibStrings for uint256;

    function generateTokenURI(
        uint256 tokenId,
        LibMysteryBox.NFTAttributes memory nft,
        string memory imageURI
    ) internal pure returns (string memory) {
        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                '{"name": "Mystery Box #',
                                tokenId.toString(),
                                '", "description": "A mysterious NFT with unique properties", ',
                                '"attributes": [',
                                _generateAttributes(nft),
                                '], "image": "',
                                imageURI,
                                '"}'
                            )
                        )
                    )
                )
            )
        );
    }

    function _generateAttributes(LibMysteryBox.NFTAttributes memory nft) private pure returns (string memory) {
        return string(
            abi.encodePacked(
                '{"trait_type": "Rarity", "value": "', nft.rarity, '"}, ',
                '{"trait_type": "Power", "value": ', nft.power.toString(), '}, ',
                '{"trait_type": "Daily Reward", "value": ', nft.dailyReward.toString(), '}, ',
                '{"trait_type": "Max Reward", "value": ', nft.maxReward.toString(), '}, ',
                '{"trait_type": "Mined Amount", "value": ', nft.minedAmount.toString(), '}, ',
                '{"trait_type": "Is Staked", "value": ', nft.isStaked ? "true" : "false", '}'
            )
        );
    }
}
