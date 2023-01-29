import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux';
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Loading from './Loading';

import { setAccount } from '../store/reducers/provider';

import {
  loadProvider,
  loadNetwork,
  loadAccount,
  loadTokens,
  loadAMM
  } from '../store/interactions'

// ABIs: Import your contract ABIs here
// moved to interactions.js

// Config: Import your network config here
// moved to interactions.js

function App() {
  
  const dispatch = useDispatch() // hook to useDispatch function

  const loadBlockchainData = async () => { // see interactions
    // Initiate provider
    const provider = await loadProvider(dispatch)


    // Fetch current networks chainId (e.g. hard 31337)
    const chainId = await loadNetwork(provider, dispatch)

    // Reload page when network changes
    window.ethereum.on('chainChanged', () => {
      window.location.reload()
    })


    // Fetch accounts from MetaMask when changed - see interactions
    window.ethereum.on('accountsChanged', async () => {
      console.log("account changed")
      await loadAccount(dispatch)
    })
    
    // Initiate contract
    await loadTokens(provider, chainId, dispatch)
    await loadAMM(provider, chainId, dispatch)
  }

  useEffect(() => {
    loadBlockchainData()    
  }, []);

  return(
    <Container>
      <Navigation />

      <h1 className='my-4 text-center'>React Hardhat Template</h1>

      
      <>
        <p className='text-center'><strong>Your ETH Balance:</strong> 0 ETH</p>
        <p className='text-center'>Edit App.js to add your code here.</p>
      </>
      
    </Container>
  )
}

export default App;
