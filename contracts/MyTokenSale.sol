//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyCrowdSale.sol";
import "./KycContract.sol";


contract MyTokenSale is MyCrowdSale {
    KycContract kyc;
    address public owner;

    constructor(
        uint256 rate,    // rate in TKNbits
        address payable wallet,
        IERC20 token,
        KycContract _kyc
    )  MyCrowdSale(rate, wallet, token) {
        kyc = _kyc;
        owner = msg.sender;
    }

    function _preValidatePurchase(address _beneficiary, uint256 _weiAmount) internal view override {
        super._preValidatePurchase(_beneficiary, _weiAmount);
       
        require(kyc.kycWhitelisted(msg.sender), "Not in the whitelist!");

    }



}
