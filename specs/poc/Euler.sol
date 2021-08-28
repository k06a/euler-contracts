pragma solidity ^0.8.0;

import "./BasePOC.sol";
import "./EToken.sol";
import "./DToken.sol";


contract Euler is BasePOC {
    constructor() BaseModule(0) {}

    function getUpgradeAdmin() external view returns (address) {
        return upgradeAdmin;
    }

    function getModuleLookup(uint moduleId) public view returns(address) {
        return moduleLookup[moduleId];
    }

    function getInterestRateModel(address proxy) public view returns (uint) {
        return eTokenLookup[proxy].interestRateModel;
    }

    function et_proxyUnderlying(address proxyAddr) public view returns (address) {
        return eTokenLookup[proxyAddr].underlying;
    }

    function dt_proxyUnderlying(address proxyAddr) public view returns (address) {
        return eTokenLookup[dTokenLookup[proxyAddr]].underlying;
    }

    function testInternal() external returns (address) {
        (bool s, bytes memory d) = et.delegatecall(abi.encodeWithSelector(EToken.testInternalModule.selector));
        require(s, string(d));
        return abi.decode(d, (address));
    }


    // function mint(uint subAccountId, uint amount) external {
    //     (bool s, bytes memory d) = et.delegatecall(abi.encodeWithSelector(EToken.mint.selector, subAccountId, amount));
    //     require(s, string(d));
    // }

    // function et_balanceOf(address account) external returns (uint) {
    //     (bool s, bytes memory d) = address(et).delegatecall(abi.encodeWithSelector(EToken.balanceOf.selector, account));
    //     require(s, string(d));
    //     return abi.decode(d, (uint));
    // }

    // function dt_balanceOf(address account) external returns (uint) {
    //     (bool s, bytes memory d) = address(dt).delegatecall(abi.encodeWithSelector(DToken.balanceOf.selector, account));
    //     require(s, string(d));
    //     return abi.decode(d, (uint));
    // }

    function et_underlying() public returns (address) {
        (bool s, bytes memory d) = et.delegatecall(abi.encodeWithSelector(EToken.getUnderlying.selector));
        require(s, string(d));
        return abi.decode(d, (address));
    }

    function dt_underlying() public returns (address) {
        (bool s, bytes memory d) = dt.delegatecall(abi.encodeWithSelector(DToken.getUnderlying.selector));
        require(s, string(d));
        return abi.decode(d, (address));
    }

    function et_balanceOfUnderlying(address account) public returns (uint) {
        (bool s, bytes memory d) = et.delegatecall(abi.encodeWithSelector(EToken.test_balanceOfUnderlying.selector, account));
        require(s, string(d));
        return abi.decode(d, (uint));
    }

    function dt_balanceOfUnderlying(address account) public returns (uint) {
        (bool s, bytes memory d) = dt.delegatecall(abi.encodeWithSelector(DToken.test_balanceOfUnderlying.selector, account));
        require(s, string(d));
        return abi.decode(d, (uint));
    }

    function et_callerUnderlying() public returns (address) {
        (bool s, bytes memory d) = et.delegatecall(abi.encodeWithSelector(EToken.test_callerUnderlying.selector));
        require(s, string(d));
        return abi.decode(d, (address));     
    }

    function dt_callerUnderlying() public returns (address) {
        (bool s, bytes memory d) = dt.delegatecall(abi.encodeWithSelector(DToken.test_callerUnderlying.selector));
        require(s, string(d));
        return abi.decode(d, (address));     
    }
}