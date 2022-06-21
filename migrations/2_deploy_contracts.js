var MyMintableToken = artifacts.require("MyMintableToken");
var MyMintableTokenSale = artifacts.require("MyMintableTokenSale");
var KycContract = artifacts.require("KycContract");
require("dotenv").config({path: "../.env"});

module.exports = async function(deployer){
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(KycContract);
    let kycInstance = await KycContract.deployed();
    //add the deployer address to the whitelist
    await kycInstance.setKycWhitelisted(addr[0], {from: addr[0]});
    await deployer.deploy(MyMintableToken);
    await deployer.deploy(MyMintableTokenSale, 1, addr[0], MyMintableToken.address, KycContract.address);
    let instance = await MyMintableToken.deployed();
    await instance.addMinter(MyMintableTokenSale.address, {from: addr[0]});
    
}
