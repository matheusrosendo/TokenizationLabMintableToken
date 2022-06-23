//SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "./MintedCrowdsale.sol";
import "./KycContract.sol";

/*
 * Openzeppelin version 
 */
contract MyMintableTokenSale is MintedCrowdsale {
    KycContract kyc;
    address public owner;
    constructor(
        uint256 rate,    // rate in TKNbits
        address payable wallet,
        IERC20 token,
        KycContract _kyc
    )
        MintedCrowdsale(rate, wallet, token)        
    {
        kyc = _kyc;
        owner = msg.sender;
    }
}