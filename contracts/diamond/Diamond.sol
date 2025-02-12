// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./interfaces/IDiamondCut.sol";
import "./interfaces/IDiamondLoupe.sol";
import "./libraries/LibDiamond.sol";
import "@openzeppelin/contracts/security/Pausable.sol";
import "@openzeppelin/contracts/access/AccessControl.sol";

contract Diamond is Pausable, AccessControl {    
    bytes32 public constant UPGRADER_ROLE = keccak256("UPGRADER_ROLE");
    uint256 public constant UPGRADE_TIMELOCK = 2 days;
    mapping(bytes32 => uint256) public upgradeSchedule;

    event UpgradeScheduled(bytes32 indexed proposalId, uint256 scheduledTime);
    event UpgradeCancelled(bytes32 indexed proposalId);
    
    constructor(address _contractOwner, address _diamondCutFacet) payable {        
        LibDiamond.setContractOwner(_contractOwner);
        _setupRole(DEFAULT_ADMIN_ROLE, _contractOwner);
        _setupRole(UPGRADER_ROLE, _contractOwner);

        // Add the diamondCut external function from the diamondCutFacet
        IDiamondCut.FacetCut[] memory cut = new IDiamondCut.FacetCut[](1);
        bytes4[] memory functionSelectors = new bytes4[](1);
        functionSelectors[0] = IDiamondCut.diamondCut.selector;
        cut[0] = IDiamondCut.FacetCut({
            facetAddress: _diamondCutFacet,
            action: IDiamondCut.FacetCutAction.Add,
            functionSelectors: functionSelectors
        });
        LibDiamond.diamondCut(cut, address(0), "");
    }

    // 暂停所有操作
    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    // 恢复操作
    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }

    // 计划升级
    function scheduleUpgrade(
        IDiamondCut.FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external onlyRole(UPGRADER_ROLE) returns (bytes32) {
        bytes32 proposalId = keccak256(abi.encode(_diamondCut, _init, _calldata));
        require(upgradeSchedule[proposalId] == 0, "Upgrade already scheduled");
        
        upgradeSchedule[proposalId] = block.timestamp + UPGRADE_TIMELOCK;
        emit UpgradeScheduled(proposalId, upgradeSchedule[proposalId]);
        
        return proposalId;
    }

    // 取消计划的升级
    function cancelUpgrade(bytes32 proposalId) external onlyRole(UPGRADER_ROLE) {
        require(upgradeSchedule[proposalId] != 0, "No such upgrade scheduled");
        delete upgradeSchedule[proposalId];
        emit UpgradeCancelled(proposalId);
    }

    // 执行升级
    function executeUpgrade(
        IDiamondCut.FacetCut[] calldata _diamondCut,
        address _init,
        bytes calldata _calldata
    ) external onlyRole(UPGRADER_ROLE) {
        bytes32 proposalId = keccak256(abi.encode(_diamondCut, _init, _calldata));
        require(upgradeSchedule[proposalId] != 0, "Upgrade not scheduled");
        require(block.timestamp >= upgradeSchedule[proposalId], "Timelock not expired");
        
        delete upgradeSchedule[proposalId];
        LibDiamond.diamondCut(_diamondCut, _init, _calldata);
    }

    // Find facet for function that is called and execute the
    // function if a facet is found and return any value.
    fallback() external payable whenNotPaused {
        LibDiamond.DiamondStorage storage ds;
        bytes32 position = LibDiamond.DIAMOND_STORAGE_POSITION;
        assembly {
            ds.slot := position
        }
        address facet = ds.selectorToFacetAndPosition[msg.sig].facetAddress;
        require(facet != address(0), "Diamond: Function does not exist");
        assembly {
            calldatacopy(0, 0, calldatasize())
            let result := delegatecall(gas(), facet, 0, calldatasize(), 0, 0)
            returndatacopy(0, 0, returndatasize())
            switch result
                case 0 {
                    revert(0, returndatasize())
                }
                default {
                    return(0, returndatasize())
                }
        }
    }

    receive() external payable {}
}
