// SPDX-License-Identifier: MIT
pragma solidity 0.8.20;

import { LibDiamond } from "../libraries/LibDiamond.sol";
import { LibMysteryBox } from "../libraries/LibMysteryBox.sol";
import { IEvents } from "../interfaces/IEvents.sol";
import { IERC20 } from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import { IReferralRegistry } from "../interfaces/IReferralRegistry.sol";

contract AdminFacet is IEvents {
    modifier onlyOwner() {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractOwner(ds);
        _;
    }

    // 紧急暂停/恢复合约功能
    function toggleContractPause() external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        bool newState = !LibDiamond.isContractPaused(ds);
        LibDiamond.setContractPaused(ds, newState);
        emit ContractPauseToggled(newState);
    }

    // 初始化合约
    function initialize(
        address _zoneToken,
        address _referralRegistry,
        address _feeReceiver,
        uint256 _marketFeeRate,
        uint256 _boxPrice
    ) external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.zoneToken = IERC20(_zoneToken);
        mbs.referralRegistry = IReferralRegistry(_referralRegistry);
        mbs.feeReceiver = _feeReceiver;
        mbs.marketFeeRate = _marketFeeRate;
        mbs.boxPrice = _boxPrice;
    }

    // 设置稀有度概率
    function setRarityProbability(string memory rarity, uint256 probability) external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.rarityProbability[rarity] = probability;
    }

    // 设置NFT属性
    function setNFTAttributes(
        uint256 tokenId,
        uint256 power,
        uint256 dailyReward,
        uint256 maxReward,
        string memory rarity
    ) external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.nftAttributes[tokenId] = LibMysteryBox.NFTAttributes({
            power: power,
            dailyReward: dailyReward,
            maxReward: maxReward,
            minedAmount: 0,
            isStaked: false,
            stakeTime: 0,
            rarity: rarity,
            isBurned: false
        });
    }

    // 设置市场费率
    function setMarketFeeRate(uint256 _marketFeeRate) external onlyOwner {
        require(_marketFeeRate <= 10000, "Fee rate must be <= 10000");
        
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.marketFeeRate = _marketFeeRate;
        emit MarketFeeUpdated(_marketFeeRate);
    }

    // 设置费用接收地址
    function setFeeReceiver(address _feeReceiver) external onlyOwner {
        require(_feeReceiver != address(0), "Invalid address");
        
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.feeReceiver = _feeReceiver;
        emit FeeReceiverUpdated(_feeReceiver);
    }

    // 设置盲盒价格
    function setBoxPrice(uint256 _boxPrice) external onlyOwner {
        require(_boxPrice > 0, "Price must be > 0");
        
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        mbs.boxPrice = _boxPrice;
        emit BoxPriceUpdated(_boxPrice);
    }

    // 查询合约配置
    function getContractConfig() external view returns (
        address zoneToken,
        address referralRegistry,
        address feeReceiver,
        uint256 marketFeeRate,
        uint256 boxPrice,
        bool isPaused
    ) {
        LibMysteryBox.MysteryBoxStorage storage mbs = LibMysteryBox.getStorage();
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        
        return (
            address(mbs.zoneToken),
            address(mbs.referralRegistry),
            mbs.feeReceiver,
            mbs.marketFeeRate,
            mbs.boxPrice,
            LibDiamond.isContractPaused(ds)
        );
    }

    // 紧急提款
    function emergencyWithdraw(address token) external onlyOwner {
        LibDiamond.DiamondStorage storage ds = LibDiamond.diamondStorage();
        LibDiamond.enforceIsContractNotPaused(ds);
        
        if (token == address(0)) {
            payable(msg.sender).transfer(address(this).balance);
        } else {
            IERC20(token).transfer(msg.sender, IERC20(token).balanceOf(address(this)));
        }
    }
}
