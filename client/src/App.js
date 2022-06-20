import React, { Component } from "react";
import MyToken from "./contracts/MyToken.json";
import MyTokenSale from "./contracts/MyTokenSale.json";
import KycContract from "./contracts/KycContract.json";
import getWeb3 from "./getWeb3";

import "./App.css";

class App extends Component {
  state = { loaded: false, contractOwner: false, whitelisted: false, kycAddress:"", ethAmountToBuyToken:1000, ethAccountAmmount:0, cappuAccountAmmount:0, isToWhitelist: "allow", errorMessage: ""};

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
      this.instanceMyToken = new this.web3.eth.Contract(
        MyToken.abi,
        MyToken.networks[this.networkId] && MyToken.networks[this.networkId].address,
      );

      this.instanceMyTokenSale = new this.web3.eth.Contract(
        MyTokenSale.abi,
        MyTokenSale.networks[this.networkId] && MyTokenSale.networks[this.networkId].address,
      );
      
      
      this.instanceKycContract = new this.web3.eth.Contract(
        KycContract.abi,
        KycContract.networks[this.networkId] && KycContract.networks[this.networkId].address,
      );

      //get the owner of the contract
      let owner = await this.instanceKycContract.methods.owner().call();
      
      //verify if current address is whitelisted
      this.isWhitelisted = await this.instanceKycContract.methods.kycWhitelisted(this.accounts[0]).call();
      let inCappuAccountAmmount = await this.instanceMyToken.methods.balanceOf(this.accounts[0]).call();
      let inEthAccountAmmount = await this.web3.eth.getBalance(this.accounts[0]);

      this.setState({ loaded: true, contractOwner: owner===this.accounts[0], whitelisted: this.isWhitelisted, ethAccountAmmount:inEthAccountAmmount, cappuAccountAmmount: inCappuAccountAmmount, whitelistAddress: true, errorMessage:"" });
     
    } catch (error) {
      alert(
        'Failed to load web3, accounts, or contract. Check console for details. Error: '+error.message
      );
      this.handleError(error.message);
    }
  };

  handleInputChange = (event) => {
     const target = event.target;
     const value = target.type === "checkbox" ? target.checked : target.value;
     const name = target.name;
     this.setState({[name]: value});
  }

  handleInputChangeBuyToken = (event) => {
    const target = event.target;
    const value = target.type === "checkbox" ? target.checked : target.value;
    const name = target.name;
    this.setState({[name]: value});
 }
 
 handleBuyToken = async () => {
    //in order to get global access inside the callback function 
    let self = this;
    await this.web3.eth.sendTransaction({from:this.accounts[0], to:this.instanceMyTokenSale._address, value:this.state.ethAmountToBuyToken})
    .on('transactionHash', function(hash){
      document.getElementById("transactionHash").innerHTML = hash;
    })
    .on('receipt', function(receipt){
      document.getElementById("receipt").innerHTML = receipt.blockHash;
      window.receiptTrans = receipt;
    })
    .on('confirmation', async function(confirmationNumber, receipt){
      document.getElementById("confirmation").innerHTML = "Number of confirmations: "+confirmationNumber;
      let inCappuAccountAmmount = await self.instanceMyToken.methods.balanceOf(self.accounts[0]).call();
      let inEthAccountAmmount = await self.web3.eth.getBalance(self.accounts[0]);
      self.setState({ethAccountAmmount:inEthAccountAmmount, cappuAccountAmmount: inCappuAccountAmmount });
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

  handleKycWhiteListing = async () => {
    //in order to get global access inside the callback function 
    let self = this;
    try {
      
      if(this.state.isToWhitelist === "allow"){
      
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
        
      }
    } catch (error) {
        this.handleError(error);
    }
  }

handleError = (_errorMessage) =>{
  document.getElementById("error").innerHTML = _errorMessage;
  this.setState({errorMessage: _errorMessage});
}

 addTokenToMetamask = async () =>{
    try {
      const symbol = await this.instanceMyToken.methods.symbol().call();
      const decimals = await this.instanceMyToken.methods.decimals().call();
      console.log("decimals "+decimals);
      const tokenAdded = await window.ethereum.request({
        method: 'wallet_watchAsset',
        params: {
          type: 'ERC20',
          options: {
            address: this.instanceMyToken._address,
            symbol: symbol,
            decimals: 0.1,
            image: 'https://www.cafefacil.com.br/media/product/383/capsula-nescafe-dolce-gusto-cappuccino-16-capsulas-nestle-020.jpg'
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

  render() {
   
    if (!this.state.loaded) {
      return (
       <div className="container"> 
         <div className="plaintext">Loading Web3, accounts, and contract...</div>
       </div>
      )
    } else {
      if(this.state.contractOwner){
        return (
          <div>
            <div  className="plaintext">connected account: {this.accounts[0]}</div>
            <div className="container"> 
             
              <div className="form">              
                <div className="title">StarDucks Cappucino IDO</div>
                <div className="subtitle">Welcome manager! This is your Kyc Whitelisting page.</div>
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
                <div  className="plaintext">connected account: {this.accounts[0]}  --- ETH: {this.state.ethAccountAmmount} / CAPPU: {this.state.cappuAccountAmmount} </div>
                <div className="container"> 
                  <div className="form2">
                    <div className="title">StarDucks Cappucino IDO</div>
                    <div className="subtitle">You are whitelisted!</div>
               
                    <div className="input-container ic1">
                      <input id="firstname" className="input" type="text" placeholder="" name="ethAmountToBuyToken" value={this.state.ethAmountToBuyToken} onChange={this.handleInputChangeBuyToken} />
                      <div className="cut"></div>
                      <label className="placeholder">ETH amount in wei</label>
                    </div>
                    
                    <p>
                      <button type="button"  className="submit" onClick={this.handleBuyToken}> Buy CAPPU Token</button>
                      <button type="button"  id="addToken"  className="submit" onClick={this.addTokenToMetamask}> Add CAPPU Token to metamask wallet</button>
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
              <div  className="plaintext">connected account: {this.accounts[0]}  --- ETH: {this.state.ethAccountAmmount} / CAPPU: {this.state.cappuAccountAmmount} </div>
              <div className="container"> 
                <div className="form2">
                  <div className="title">StarDucks Cappucino IDO</div>
                  <div className="subtitle">Sorry, you are not whitelisted!</div>
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
