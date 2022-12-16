import './App.css';
import {useState, useEffect} from "react";

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const checkIfWalletIsConnected = async() => {
    try {
      const {solana} = window;
      if(solana) {
        if(solana.isPhantom){
          console.log("Phantom wallet found!")
          const response = await solana.connect({
            onlyIfTrusted : true
          })
          console.log("Connected to public key : ", response.publicKey.toString())
          setWalletAddress(response.publicKey.toString())
        }
      }else{
        alert("Solana object not found! Get a phantom wallet");
      }
    } catch (err) {
      console.log(err)
    }
  }

  const connectWallet = async () => {
    const {solana} = window;
    if(solana){
      const response = await solana.connect()
      console.log('Connected with public key:', response.publicKey.toString())
    }
  };

  const renderNotConnectedContainer = () => {
    return <button onClick={connectWallet}>Connect to Wallet</button>
  }
  
  useEffect(() => {
    const onLoad = async() => {
      await checkIfWalletIsConnected()
    }
    window.addEventListener('load',onLoad)
    return () => window.removeEventListener('load', onLoad)
  }, [])

  return <div className='App'>
    {!walletAddress && renderNotConnectedContainer()}
  </div>
  
}

export default App;
