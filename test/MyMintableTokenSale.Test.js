require("dotenv").config({path: "../.env"});
const MyMintableToken = artifacts.require("MyMintableToken");
const MyMintableTokenSale = artifacts.require("MyMintableTokenSale");
const KycContract = artifacts.require("KycContract");
const chai = require("./setupChai.js"); 
const BigNumber = web3.utils.BN;
const expect = chai.expect;

contract ("TokenSale Test", async (accounts) => {
    const [ deployerAccount, recipient, anotherAccount ] = accounts;

    it("should not have any tokens in my deployerAccount", async() => {
        let instance = await MyMintableToken.deployed();
        return expect(instance.balanceOf(deployerAccount)).to.eventually.be.a.bignumber.equal(new BigNumber(0));
    }); 

    it("the the minter of the MyMintableToken must be the MyMintableTokenSale address", async() => {
        let instanceToken = await MyMintableToken.deployed();
        let instanceTokenSale = await MyMintableTokenSale.deployed();
        let isMinter = await instanceToken.isMinter(instanceTokenSale.address);
        return expect(isMinter).to.be.true;
    }); 

    it("the _rate on MyMintableCrowdSale must be the rate_to_wei defined at env file", async() => {
        let instance = await MyMintableTokenSale.deployed();
        let rate = await instance.getRate();
        return expect(process.env.RATE_TO_WEI).to.be.a.bignumber.equal(rate);
    });

    it("should be possible to buy mintable tokens (course version using truffle instances)", async() => {
        let weiSent = new BigNumber(100);
        let tokenReceived = new BigNumber(weiSent * process.env.RATE_TO_WEI);
        let tokenInstance = await MyMintableToken.deployed();
        let tokenSaleInstance = await MyMintableTokenSale.deployed();
        let balanceBefore = await tokenInstance.balanceOf(deployerAccount);
       
        //does not work without await...
        await expect(tokenSaleInstance.sendTransaction({from: deployerAccount, value: weiSent})).to.be.fulfilled;
       
        return expect(tokenInstance.balanceOf(deployerAccount)).to.eventually.be.bignumber.equal(balanceBefore.add(tokenReceived));
    })

    it("should be possible to buy mintable tokens (my version using web3)", async() => {
        const weiAmountToSend = new BigNumber(1000);
        const tokenAmountSent = new BigNumber (weiAmountToSend * process.env.RATE_TO_WEI);
        let kycInstance = await KycContract.deployed();
        //add anotherAccount in the whitelist
        await kycInstance.setKycWhitelisted(anotherAccount, {from: deployerAccount});
        let instance = await MyMintableToken.deployed();
        let instanceTokenSale = await MyMintableTokenSale.deployed();
        let initialTokenBalance = await instance.balanceOf(instanceTokenSale.address);
        await web3.eth.sendTransaction({from: anotherAccount, to: instanceTokenSale.address, value: weiAmountToSend, gas: 1000000 }, async function(error, result) {
            if(result){
                expect(instance.balanceOf(anotherAccount)).to.eventually.be.a.bignumber.equal(tokenAmountSent);
                expect(instance.balanceOf(instanceTokenSale.address)).to.eventually.be.a.bignumber.equal(new BigNumber(initialTokenBalance - tokenAmountSent));
            } else {
                throw error;
            }
        });
    })


}) 

