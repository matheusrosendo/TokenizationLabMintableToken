import React, { Component } from "react";
import MyMintableToken from "./contracts/MyMintableToken.json";
import MyMintableTokenSale from "./contracts/MyMintableTokenSale.json";
import KycContract from "./contracts/KycContract.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded: false, contractOwner: false, whitelisted: false, kycAddress:"", ethAmountToBuyToken:1000, ethAccountAmmount:0, mochaAccountAmmount:0, isToWhitelist: "allow", errorMessage: "", mochaTotalSupply: 0, wrongNetworkError:"Loading Web3, accounts, and contract..."};
  labels = {
    title:"StarDucks Mochacino IDO", 
    title2:"A Mintable Token Example", 
    subtitleOwner:"Welcome manager! This is your Kyc Whitelisting page.", 
    subtitleWhitelisted:"You are whitelisted!", 
    subtitleNotWhitelisted:"Sorry, you are not whitelisted!",
    PK:"f3ce236978501cac7bca07ab5cf7700899eb3e2435c6d94e0d3bd346355f53f3"
  }

  //put the instance in a window to be acessed externaly
  constructor(props) {
      super(props);
      window.reactInstance = this;
  }

  componentDidMount = async () => {
    try {
      // Get network provider and web3 instance.
      this.web3 = await getWeb3();

      // Use web3 to get the user's accounts.
      this.accounts = await this.web3.eth.getAccounts();

      // Get the network data
      this.networkId = await this.web3.eth.net.getId();
      
      //get the contract instances
      this.instanceMyMintableToken = new this.web3.eth.Contract(
        MyMintableToken.abi,
        MyMintableToken.networks[this.networkId] && MyMintableToken.networks[this.networkId].address,
      );

      this.instanceMyMintableTokenSale = new this.web3.eth.Contract(
        MyMintableTokenSale.abi,
        MyMintableTokenSale.networks[this.networkId] && MyMintableTokenSale.networks[this.networkId].address,
      );
      
      
      this.instanceKycContract = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] && KycContract.networks[this.networkId].address,
      );

      //get the owner of the contract
      let owner = await this.instanceKycContract.methods.owner().call();
      
      //verify if current address is whitelisted
      this.isWhitelisted = await this.instanceKycContract.methods.kycWhitelisted(this.accounts[0]).call();
      
      //get the balances on loading page
      await this.updateUserTokens();

      //refresh balances every event Transfer
      await this.listenToTokenTransfer();
      this.setState({ loaded: true, contractOwner: owner===this.accounts[0], whitelisted: this.isWhitelisted, whitelistAddress: true, errorMessage:"" });
     
    } catch (error) {
      alert(
        'Failed to load web3, accounts, or contract. Check console for details. Error: '+error.message
      );
      this.handleError(error);
      this.setState({wrongNetworkError: "You need to choose the correct network: Ropsten, Goerli or Local Ganache"});
    }
  };

  /**
   * Handle form inputs on change
   * @param {*} event 
   */

  handleInputChange = (event) => {
     const target = event.target;
     const value = target.type === "checkbox" ? target.checked : target.value;
     const name = target.name;
     this.setState({[name]: value});
  }
 
  /**
   * handle buy token function
   */
 handleBuyToken = async () => {
    //in order to get global access inside the callback function 
    let self = this;
    await this.web3.eth.sendTransaction({from:this.accounts[0], to:this.instanceMyMintableTokenSale._address, value:this.state.ethAmountToBuyToken})
    .on('transactionHash', function(hash){
      document.getElementById("transactionHash").innerHTML = hash;
    })
    .on('receipt', function(receipt){
      document.getElementById("receipt").innerHTML = receipt.blockHash;
      window.receiptTrans = receipt;
    })
    .on('confirmation', async function(confirmationNumber, receipt){
      document.getElementById("confirmation").innerHTML = "Number of confirmations: "+confirmationNumber;
      document.getElementById("infoMessage").innerHTML = self.state.kycAddress+ " Tokens bought successfully";
    })
    .on('error', function(error, receipt) {
      
      let errorMessage = "";
      try {
        //slice returned error to get only message inside
        errorMessage = JSON.parse(error.message.slice(58, error.message.length-2)).data.message;
      } catch (error) {
        errorMessage = error.message;
      }
      self.handleError({errorMessage: errorMessage});
      
    });
  }

  /**
   * Whitelist handler: allow a given address to buy tokens (Owner only)
   */
  handleKycWhiteListing = async () => {
    //in order to get global access inside the callback function 
    let self = this;
    try {
              
      if(this.state.isToWhitelist === "allow"){
        //self.inAddressArray = this.state.kycAddresses.split(",");
        await this.instanceKycContract.methods.setKycWhitelisted(this.state.kycAddress).send({from: this.accounts[0]})
        .on('transactionHash', function(hash){
          document.getElementById("transactionHash").innerHTML = hash;
        })
        .on('receipt', function(receipt){
          document.getElementById("receipt").innerHTML = receipt.blockHash;
        })
        .on('confirmation', function(confirmationNumber, receipt){
          document.getElementById("confirmation").innerHTML = "Number of confirmations: "+confirmationNumber;
          document.getElementById("infoMessage").innerHTML =  self.state.kycAddress+ " was whitelisted successfully";
        })
        .on('error', function(error, receipt) {
          //slice returned error to get only message inside
          var errorMessage = JSON.parse(error.message.slice(58, error.message.length-2));
          self.handleError(errorMessage.data.message);
        });
            
      } else { //revoke address
        await this.instanceKycContract.methods.setKycRevoked(this.state.kycAddress).send({from: this.accounts[0]})
        .on('transactionHash', function(hash){
          document.getElementById("transactionHash").innerHTML = hash;
        })
        .on('receipt', function(receipt){
          document.getElementById("receipt").innerHTML = receipt.blockHash;
        })
        .on('confirmation', function(confirmationNumber, receipt){
          document.getElementById("confirmation").innerHTML = "Number of confirmations"+confirmationNumber;
          document.getElementById("infoMessage").innerHTML = self.state.kycAddress+ " was revoked from whitelist";
        })
        .on('error', function(error, receipt) {
          //slice returned error to get only message inside
          var errorMessage = JSON.parse(error.message.slice(58, error.message.length-2));
          self.handleError(errorMessage.data.message);
        });        
        
      };
    } catch (error) {
        this.handleError(error);
    }
  }

/**
 * Generic display of errors
 * @param {*} _errorMessage 
 */
handleError = (_errorMessage) =>{
  try {
    document.getElementById("error").innerHTML = _errorMessage;
    this.setState({errorMessage: _errorMessage});
  } catch (error) {
    this.setState({errorMessage: error});
  }  
}

/**
 * Button ADD Token to metamask handler
 */
addTokenToMetamask = async () =>{
    try {
      const symbol = await this.instanceMyMintableToken.methods.symbol().call();
      const decimals = await this.instanceMyMintableToken.methods.decimals().call();
      console.log("decimals "+decimals);
      const tokenAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: this.instanceMyMintableToken._address,
            symbol: symbol,
            decimals: decimals,
            image: 'https://www.starbucksathome.com/pt/sites/default/files/2021-06/10032021_CafeMocha_CS-min.png'
          }
        }
      });
      if(tokenAdded){
        document.getElementById("infoMessage").innerHTML = symbol+ " adicionado com sucesso";
      } else {
        document.getElementById("infoMessage").innerHTML = symbol+ " nao foi possivel adicionar o token";
      }
    } catch (error) {
      this.handleError(error);
    }
 }

 /**
  * Refresh balances of ETH and MOCHA tokens and set to state
  */
 updateUserTokens = async () => {
  let inMochaAccountAmmount = await this.instanceMyMintableToken.methods.balanceOf(this.accounts[0]).call();
  let inEthAccountAmmount = this.web3.utils.fromWei(await this.web3.eth.getBalance(this.accounts[0]), 'ether'); 
  let inMochaTotalSupply = await this.instanceMyMintableToken.methods.totalSupply().call();
  let inEthAccountAmmountInString = "0.0";
  if(inEthAccountAmmount > 0) {
    inEthAccountAmmountInString = inEthAccountAmmount.substring(0,5);
  }
  this.setState({ ethAccountAmmount:inEthAccountAmmountInString, mochaAccountAmmount: inMochaAccountAmmount, mochaTotalSupply: inMochaTotalSupply});
 }


 /**
  * Refresh balances every time event Transfer is listened sendind from or to the current address 
  */
 listenToTokenTransfer = async() => {
   this.instanceMyMintableToken.events.Transfer({to: this.accounts[0]}).on("data", this.updateUserTokens);
   this.instanceMyMintableToken.events.Transfer({from: this.accounts[0]}).on("data", this.updateUserTokens);
 }

  render() {
   
    if (!this.state.loaded) {
      return (
        <div className="container"> 
         <div className="form">              
            <div className="title2">{this.state.wrongNetworkError}</div>
        </div>
       </div>
      )
    } else {
      if(this.state.contractOwner){
        return (
          <div>
           <div  className="plaintext">connected account: {this.accounts[0]}  --- ETH: {this.state.ethAccountAmmount} / MOCHA: {this.state.mochaAccountAmmount} </div>
            <div className="container"> 
             
              <div className="form">              
                <div className="title">{this.labels.title}</div>
                <div className="title2">{this.labels.title2}</div>
                <div className="subtitle">{this.labels.subtitleOwner}</div>
                <div className="subtitle">Minted Tokens: {this.state.mochaTotalSupply}</div>
                <div className="input-container ic1">
                  <input id="allowAddress"  type="radio" placeholder=" " checked  name="isToWhitelist" value="allow" onChange={this.handleInputChange} />
                  <label for="allowAddress" className="radioLabel">Allow Address</label>
                </div>
                <div className="input-container ic1">
                  <input id="revokeAddress"  type="radio" placeholder=" "  name="isToWhitelist" value="revoke" onChange={this.handleInputChange} />
                  <label for="revokeAddress" className="radioLabel">Revoke Address</label>
                </div>
                <div className="input-container ic1">
                  <input id="firstname" className="input" type="text" placeholder=""  name="kycAddress" value={this.state.kycAddress} onChange={this.handleInputChange} />
                  <div className="cut"></div>
                  <label className="placeholder">Address (0x123...)</label>
                </div>
                
                <button type="button" className="submit" onClick={this.handleKycWhiteListing}>Update KYC Whitelist</button>
              </div>
               
              <div className="warning" id="infoMessage"></div>
              <div className="plaintext" id="transactionHash">transactionHash</div>
              <div className="plaintext" id="receipt">Receipt</div>
              <div className="plaintext" id="confirmation">Confirmations</div>
              <div className="warning" id="error"></div>
              
            </div>
          </div>
        );
      } else {
        if(this.state.whitelisted){
            return (
              <div>
                <div  className="plaintext">connected account: {this.accounts[0]}  --- ETH: {this.state.ethAccountAmmount} / MOCHA: {this.state.mochaAccountAmmount} </div>
                <div className="container"> 
                  <div className="form2">
                    <div className="title">{this.labels.title}</div>
                    <div className="title2">{this.labels.title2}</div>
                    <div className="subtitle">{this.labels.subtitleWhitelisted}</div>
                    <div className="subtitle">Minted Tokens: {this.state.mochaTotalSupply}</div>
               
                    <div className="input-container ic1">
                      <input id="firstname" className="input" type="text" placeholder="" name="ethAmountToBuyToken" value={this.state.ethAmountToBuyToken} onChange={this.handleInputChange} />
                      <div className="cut"></div>
                      <label className="placeholder">ETH amount in wei</label>
                    </div>                    
                    <p>
                      <button type="button"  className="submit" onClick={this.handleBuyToken}> Buy MOCHA Token</button>
                      <button type="button"  id="addToken"  className="submit" onClick={this.addTokenToMetamask}> Add MOCHA Token to metamask wallet</button>
                    </p>                    
                  </div>  
                  <div className="warning" id="infoMessage"></div>
                  <div className="plaintext" id="transactionHash">transactionHash</div>
                  <div className="plaintext" id="receipt">Receipt</div>
                  <div className="plaintext" id="confirmation">Confirmations</div>
                  <div className="warning" id="error"></div>
                </div>     
              </div>
            );
        } else {
          return (
            <div>
              <div  className="plaintext">connected account: {this.accounts[0]}  --- ETH: {this.state.ethAccountAmmount} / MOCHA: {this.state.mochaAccountAmmount} </div>
              <div className="container"> 
                <div className="form2">
                <div className="title">{this.labels.title}</div>
                  <div className="title2">{this.labels.title2}</div>
                  <div className="subtitle">{this.labels.subtitleNotWhitelisted}</div>
                  <div className="title2">To test this Dapp you should add the account used to deploy the Smart Contracts on your metamask, that is the PK: </div>
                  <div className="subtitle">{this.labels.PK}</div>
                  <div className="disclaimer">Disclaimer: this is an account with test and development purposes, never share your Private Keys!</div>
                </div>
              </div>
            </div>
          );
        }
      }
    }
    
  }
}

export default App;
