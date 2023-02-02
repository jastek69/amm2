import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { Container } from 'react-bootstrap'
import { ethers } from 'ethers'

// Components
import Navigation from './Navigation';
import Tabs from './Tabs'
import Swap from './Swap'
import Deposit from './Deposit'
import Withdraw from './Withdraw'
import Charts from './Charts'


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
      <HashRouter>
        
        <Navigation />

        <hr />

        <Tabs />

        <Routes>
          <Route exact path="/" element={<Swap />} />
          <Route path="/deposit" element={<Deposit />} />
          <Route path="/withdraw" element={<Withdraw />} />
          <Route path="/charts" element={<Charts />} />
        </Routes>




      </HashRouter>


      

      
      
    </Container>
  )
}

export default App;
