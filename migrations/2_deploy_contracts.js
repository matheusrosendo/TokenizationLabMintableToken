var MyToken = artifacts.require("MyToken");
var MyTokenSale = artifacts.require("MyTokenSale");
require("dotenv").config({path: "../.env"});

module.exports = async function(deployer){
    const maxSupply = process.env.INITIAL_TOKENS;
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(MyToken, maxSupply);
    await deployer.deploy(MyTokenSale, 1, addr[0], MyToken.address);
    console.log("acount 0" + addr[0]);
    let instance = await MyToken.deployed();
    await instance.transfer(MyTokenSale.address, maxSupply);
}
