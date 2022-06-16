//SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyCrowdSale.sol";


contract MyTokenSale is MyCrowdSale {
    constructor(
        uint256 rate,    // rate in TKNbits
        address payable wallet,
        IERC20 token
    )  MyCrowdSale(rate, wallet, token) {

    }


}
