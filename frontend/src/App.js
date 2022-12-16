import './App.css';
import {useState, useEffect} from "react";
import idl from "./idl.json"
import{ Connection, PublicKey, clusterApiUrl} from "@solana/web3.js"
import{ Program, AnchorProvider, web3, utils, BN} from "@project-serum/anchor"
import { Buffer } from "buffer"
import { publicKey } from '@project-serum/anchor/dist/cjs/utils';
window.Buffer = Buffer;

const programID = new PublicKey(idl.metadata.address);
const network = clusterApiUrl("devnet");
const opts = {
  preflightCommitment: "processed"
}
const { SystemProgram } = web3;

const App = () => {
  const [walletAddress, setWalletAddress] = useState(null);
  const [campaigns,setCampaigns] = useState([])

  const getProvider = () => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = new AnchorProvider(connection, window.solana, opts.preflightCommitment)
    return provider;
  }

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

  const getCampaigns = async() => {
    const connection = new Connection(network, opts.preflightCommitment)
    const provider = getProvider()
    const program = new Program(idl, programID, provider)
    Promise.all(
			(await connection.getProgramAccounts(programID)).map(
				async (campaign) => ({
					...(await program.account.campaign.fetch(campaign.pubkey)),
					pubkey: campaign.pubkey,
				})
			)
		).then((campaigns) => setCampaigns(campaigns));
  }

  const createCampaign = async() => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)
      const [campaign] = await PublicKey.findProgramAddressSync(
				[
					utils.bytes.utf8.encode("CAMPAIGN_DEMO"),
					provider.wallet.publicKey.toBuffer(),
				],
				program.programId
			);
      await program.rpc.create('campaign name', 'campaign description',{
        accounts: {
          campaign,
          user : provider.wallet.publicKey,
          systemProgram: SystemProgram.programId,
        }
      })
      console.log("Created a new campaign w/ address",campaign.toString())
    } catch (err) {
      console.log(err)
    }
  }

  const donate = async (publicKey) => {
    try {
      const provider = getProvider()
      const program = new Program(idl, programID, provider)

      await program.rpc.donate(new BN(0.2 * web3.LAMPORTS_PER_SOL),{
        accounts:{
          campaign: publicKey,
          user:provider.wallet.publicKey,
          systemProgram: SystemProgram.programId
        }
      })
      console.log("Donated some money to : ", publicKey.toString())
      getCampaigns()
    } catch (error) {
      console.error("Error donatiing:" , error)
    }
  }

  

  const renderNotConnectedContainer = () => {
    return <button onClick={connectWallet}>Connect to Wallet</button>
  }

  const renderConnectedContainer = () => {
    return <>
      <button onClick={createCampaign}>Create a campaign</button>
      <button onClick={getCampaigns}>Get a list of campaigns</button>
      <br />
      {campaigns.map(campaign => (<>
        <p>Campaign ID: {campaign.pubkey.toString()}</p>
					<p>
						Balance:{" "}
						{(
							campaign.amountDonated / web3.LAMPORTS_PER_SOL
						).toString()}
					</p>
					<p>{campaign.name}</p>
					<p>{campaign.description}</p>
          <button onClick={() => donate(campaign.pubkey)}>Click to donate!</button>
      </>))}
    </>
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
    {walletAddress && renderConnectedContainer()}
  </div>
  
}

export default App;
