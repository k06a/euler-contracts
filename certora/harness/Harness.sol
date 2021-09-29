pragma solidity ^0.8.0;

import "../munged/BaseLogic.sol";

abstract contract BaseHarness is BaseLogic {

    // These are workarounds to the lack of struct support in CVL
    // There should be one accessor for each field of AssetStorage
    function et_lastInterestAccumulatorUpdate (address eToken) public view returns (uint40)  { return eTokenLookup[eToken].lastInterestAccumulatorUpdate ; }
    function et_underlyingDecimals            (address eToken) public view returns (uint8)   { return eTokenLookup[eToken].underlyingDecimals            ; }
    function et_interestRateModel             (address eToken) public view returns (uint32)  { return eTokenLookup[eToken].interestRateModel             ; }
    function et_interestRate                  (address eToken) public view returns (int96)   { return eTokenLookup[eToken].interestRate                  ; }
    function et_reserveFee                    (address eToken) public view returns (uint32)  { return eTokenLookup[eToken].reserveFee                    ; }
    function et_pricingType                   (address eToken) public view returns (uint16)  { return eTokenLookup[eToken].pricingType                   ; }
    function et_pricingParameters             (address eToken) public view returns (uint32)  { return eTokenLookup[eToken].pricingParameters             ; }
    function et_underlying                    (address eToken) public view returns (address) { return eTokenLookup[eToken].underlying                    ; }
    function et_reserveBalance                (address eToken) public view returns (uint96)  { return eTokenLookup[eToken].reserveBalance                ; }
    function et_dTokenAddress                 (address eToken) public view returns (address) { return eTokenLookup[eToken].dTokenAddress                 ; }
    function et_totalBalances                 (address eToken) public view returns (uint112) { return eTokenLookup[eToken].totalBalances                 ; }
    function et_totalBorrows                  (address eToken) public view returns (uint144) { return eTokenLookup[eToken].totalBorrows                  ; }
    function et_interestAccumulator           (address eToken) public view returns (uint)    { return eTokenLookup[eToken].interestAccumulator           ; }

    function et_user_balance             (address eToken, address user) public view returns (uint112) { return eTokenLookup[eToken].users[user].balance            ; }
    function et_user_owed                (address eToken, address user) public view returns (uint144) { return eTokenLookup[eToken].users[user].owed               ; }
    function et_user_interestAccumulator (address eToken, address user) public view returns (uint)    { return eTokenLookup[eToken].users[user].interestAccumulator; }
    function et_eTokenAllowance (address eToken, address a, address b)  public view returns (uint)    { return eTokenLookup[eToken].eTokenAllowance[a][b]          ; }
    function et_dTokenAllowance (address eToken, address a, address b)  public view returns (uint)    { return eTokenLookup[eToken].dTokenAllowance[a][b]          ; }

    function underlying_eTokenAddress         (address underlying) public view returns (address) { return underlyingLookup[underlying].eTokenAddress       ; }

    // overridden functions ////////////////////////////////////////////////////

    // This ensures that the msg sender is treated properly, and the proxyAddr
    // is chosen arbitrarily.
    address proxyAddr;
    function unpackTrailingParams() virtual override internal view returns (address msgSender, address proxyAddr) {
        return (msg.sender, proxyAddr);
    }

    // This makes internal module calls seem pure and nondeterministic
    // THIS IS UNSAFE!  If a module calls another non-pure internal method,
    // those side effects will be missed by CVT.
    bytes cim_result;
    function callInternalModule(uint moduleId, bytes memory input) virtual internal override returns (bytes memory) {
        return cim_result;
    }

    // The math in accrueInterest is too expensive to analyze, so we skip it
    // TODO: we probably want a harness with this and without this so that we
    // can explicitly check accrueInterest
    function accrueInterest(AssetCache memory assetCache) virtual override view internal { 

    }

    // callBalanceOf uses a gas limit, and the staticcall seems to be tripping
    // CVT up, so we replace it with a normal call.
    function callBalanceOf(AssetCache memory assetCache, address account) virtual override internal view returns (uint) {
        return IERC20(account).balanceOf(account);
    }

}

