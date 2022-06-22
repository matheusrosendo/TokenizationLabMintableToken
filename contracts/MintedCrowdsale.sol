// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./MyCrowdsale.sol";
import "./ERC20Mintable.sol";

/**
* Copied from https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v2.5.0/contracts/crowdsale/emission/MintedCrowdsale.sol
 * @title MintedCrowdsale
 * @dev Extension of Crowdsale contract whose tokens are minted in each purchase.
 * Token ownership should be transferred to MintedCrowdsale for minting.
 */
abstract contract MintedCrowdsale is MyCrowdSale {
    /**
     * @dev Overrides delivery by minting tokens upon purchase.
     * @param beneficiary Token purchaser
     * @param tokenAmount Number of tokens to be minted
     */
    function _deliverTokens(address beneficiary, uint256 tokenAmount) internal override {
        // Potentially dangerous assumption about the type of the token.
        require(
            ERC20Mintable(address(token())).mint(beneficiary, tokenAmount),
                "MintedCrowdsale: minting failed"
        );
    }
}