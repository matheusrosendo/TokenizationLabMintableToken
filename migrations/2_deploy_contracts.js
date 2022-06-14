var MyToken = artifacts.require("MyToken");
var MyTokenSale = artifacts.require("MyTokenSale")

module.exports = async function(deployer){
    const maxSupply = 1000000000;
    let addr = await web3.eth.getAccounts();
    await deployer.deploy(MyToken, maxSupply);
    await deployer.deploy(MyTokenSale, 1, addr[0], MyToken.address);
    let instance = await MyToken.deployed();
    await instance.transfer(MyTokenSale.address, maxSupply);
}
