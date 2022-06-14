const Token = artifacts.require("MyToken");

var chai = require("chai");
const BN = web3.utils.BN;
const chaiBN = require("chai-bn")(BN);
chai.use(chaiBN);

var chaiAsPromissed = require("chai-as-promised");
chai.use(chaiAsPromissed);

const expect = chai.expect;

contract ("Token Test", async (accounts) => {
    it("all tokens should be in my account", async() => {
        let instance = await Token.deployed();
        let totalSupply = await instance.totalSupply();
        //essa seria a primeira forma de fazer
        //let balance = await instance.balanceOf(accounts[0]);
        //assert.equal(balance.valueOf(), initialSupply.valueOf(), "Balance was not the same")
        
        //essa a segunda, sem usar o chai as promisse
        expect(await instance.balanceOf(accounts[0])).to.be.a.bignumber.equal(totalSupply);

        //essa a terceira usando o chai as promisse
        expect(instance.balanceOf(accounts[0])).to.eventually.be.a.bignumber.equal(totalSupply);

    })
})

