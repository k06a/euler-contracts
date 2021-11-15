// SPDX-License-Identifier: UNLICENSED

pragma solidity ^0.8.0;

import "../BaseLogic.sol";


contract JunkETokenUpgrade is BaseLogic {
    constructor() BaseLogic(MODULEID__ETOKEN, bytes32(0)) {}

    function name() external pure returns (string memory) {
        return "JUNK_UPGRADE_NAME";
    }
}
