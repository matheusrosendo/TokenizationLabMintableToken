//SPDX-License-Identifier: MIT
pragma solidity ^0.8.1;

import "@openzeppelin/contracts/access/Ownable.sol";

contract KycContract is Ownable {
    mapping(address => bool) allowed;

    function setKycWhitelisted(address _addr)  public onlyOwner{
        allowed[_addr] = true;
    }

    function setKycRevoked(address _addr) public onlyOwner{
        allowed[_addr] = false;
    }

    function kycWhitelisted(address _addr) public view returns(bool) {
        return allowed[_addr];
    }
    
    function setMultipleAddressWhitelist(address[] calldata  _addresses) external onlyOwner {
        for(uint i = 0; i < _addresses.length; i++){
            allowed[_addresses[i]] = true;
        }
    }

    function setMultipleAddressRevoke(address[] calldata  _addresses) external onlyOwner {
        for(uint i = 0; i < _addresses.length; i++){
            allowed[_addresses[i]] = false;
        }
    }

}
