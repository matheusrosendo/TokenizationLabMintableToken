require("dotenv").config({path: "../.env"});
const Token = artifacts.require("MyMintableToken");
const MyMintableTokenSale = artifacts.require("MyMintableTokenSale");

const chai = require("./setupChai.js"); 
const BigNumber = web3.utils.BN;
const expect = chai.expect;

contract ("Token Test", async (accounts) => {
    const [ initialHolder, recipient, anotherAccount ] = accounts;
    
    //call before each test unit, it can redeploy de contract
    beforeEach( async() => {
        this.MyMintableToken = await Token.new();
    })
   
    it("Initial total supply must be 0", async() => {
        let instance = await this.MyMintableToken;
        console.log("mymintableaddress "+this.MyMintableToken.address);
        return await expect(instance.totalSupply()).to.eventually.be.a.bignumber.equal(new BigNumber(0));
    });


})

