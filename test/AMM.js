const { expect } = require('chai');
const { ethers } = require('hardhat');

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), 'ether')
}

const ether = tokens

describe('AMM', () => {
    // Accounts
    let accounts,
        deployer,
        liquidityProvider,  // LP acct
        investor1,  // Swap token acct owns token 1 (SOB) and is swapping for token 2
        investor2   // Swap token acct owns token 2 (USDC) and swapping for token 1
    
    // Contracts
    let token1,
        token2,
        amm

  beforeEach(async () => {
    // Setup accounts
    accounts = await ethers.getSigners()
    deployer = accounts[0]
    liquidityProvider = accounts[1]
    investor1 = accounts[2] 
    investor2 = accounts[3] 

    // Deploy Token
    const Token = await ethers.getContractFactory('Token')
    token1 = await Token.deploy('Sobek', 'SOB', '1000000') // 1 million tokens
    token2 = await Token.deploy('USD Token', 'USD', '1000000') // 1 million tokens

    // Send tokens to liquidity provider
    let transaction = await token1.connect(deployer).transfer(liquidityProvider.address, tokens(100000)) // NOTE: use 'connect' to connect to a contract
    await transaction.wait()

    transaction = await token2.connect(deployer).transfer(liquidityProvider.address, tokens(100000)) // NOTE: "let" already done in first declaration
    await transaction.wait()


    // Swap Token accounts
    // Send token1 to investor1
    transaction = await token1.connect(deployer).transfer(investor1.address, tokens(100000))
    await transaction.wait()

    // Send token2 to investor2
    transaction = await token2.connect(deployer).transfer(investor2.address, tokens(100000))
    await transaction.wait()


    // Deploy AMM
    const AMM = await ethers.getContractFactory('AMM')
    amm = await AMM.deploy(token1.address, token2.address)
  })

  describe('Deployment', () => {    

    it('has an address', async () => {
      expect(amm.address).to.not.equal(0x0)
    })    

    it('tracks token1 address', async () => {
        expect(await amm.token1()).to.equal(token1.address)
    })

    it('tracks token2 address', async () => {
        expect(await amm.token2()).to.equal(token2.address)
    })

  })


  describe('Swapping Tokens', () => {
    let amount, transaction, result, estimate, balance  // vars to use for swapping tokens

    it('facilitates swaps', async () => {
      // Deployer approves 100k tokens
      amount = tokens(100000)
      transaction = await token1.connect(deployer).approve(amm.address, amount) // first person to add liquidity so sets the price
      await transaction.wait()

      transaction = await token2.connect(deployer).approve(amm.address, amount)
      await transaction.wait()

      // Deployer adds liquidity
      transaction = await amm.connect(deployer).addLiquidity(amount, amount)
      await transaction.wait()

      // Check AMM receives tokens
      expect(await token1.balanceOf(amm.address)).to.equal(amount)
      expect(await token2.balanceOf(amm.address)).to.equal(amount)

      expect(await amm.token1Balance()).to.equal(amount)
      expect(await amm.token2Balance()).to.equal(amount)
     
      // expect(await amm.K()).to.equal(10000000000000000000000000000000000000000000000)
        //  HardhatError: HH17: The input value cannot be normalized to a BigInt: Integer 1e+46 is unsafe. 
      console.log(await amm.K())

      // Check deployer has 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100)) // use tokens helper to calculate shares

      // Check pool has 100 total shares
      expect(await amm.totalShares()).to.equal(tokens(100))


      /////////////////////////////////////////////////////////////////////////////////
      // Liquidity Provider (LP) adds more liquidity
      //

      // LP approves 50k tokens
      amount = tokens(50000)
      transaction = await token1.connect(liquidityProvider).approve(amm.address, amount) // first person to add liquidity so sets the price
      await transaction.wait()

      transaction = await token2.connect(liquidityProvider).approve(amm.address, amount)
      await transaction.wait()

      // Calculate token2 deposit amount
      let token2Deposit = await amm.calculateToken2Deposit(amount)
      await transaction.wait()

      // LP adds liquidity
      transaction= await amm.connect(liquidityProvider).addLiquidity(amount, token2Deposit)
      await transaction.wait()

      // LP should have 50 shares
      expect(await amm.shares(liquidityProvider.address)).to.equal(tokens(50))

      // Deployer should still have 100 shares
      expect(await amm.shares(deployer.address)).to.equal(tokens(100))

      // Pool should have 150 shares
      expect(await amm.totalShares()).to.equal(tokens(150))

      /////////////////////////////////////////////////////////////////////////////////
      // Investor 1 swaps
      //

      // Check Price before swapping -- token2Balance/token1Balance
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)  


      // Approve all tokens for swap
      transaction = await token1.connect(investor1).approve(amm.address, tokens(100000))
      await transaction.wait()

      // Check investor1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

      // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(`Token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}\n`)

      // Investor1 swaps token1
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      result = await transaction.wait()


      // Emit an Event
      // Check for Swap event
      await expect(transaction).to.emit(amm, 'Swap').withArgs(
        investor1.address,
        token1.address,
        tokens(1),
        token2.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
        ) // NOTE: Same as:
        // blockNumber = await ethers.provider.getBlockNumber()
        // block = await ethers.provider.getBlock(blockNumber)
        // block.timestamp

      // Check investor1 balance after swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance after swap: ${ethers.utils.formatEther(balance)}\n`)
      expect(estimate).to.equal(balance)

      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())


      // Check Price after swapping -- token2Balance/token1Balance
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)
      
      
      /////////////////////////////////////////////////////////////////////////////////
      // Investor 1 swaps
      //
      // Swap some more tokens
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

      // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
      estimate = await amm.calculateToken1Swap(tokens(1))
      console.log(`Token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}\n`)

      // Investor1 swaps token1
      transaction = await amm.connect(investor1).swapToken1(tokens(1))
      result = await transaction.wait()

      // Check investor1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)
      
      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check Price after swapping -- token2Balance/token1Balance
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)


      /////////////////////////////////////////////////////////////////////////////////
      // Investor 1 swaps large amount
      // change amounts tokens amount to large numbers e.g. 100, 1000, 10000 etc
      
      // Check investor balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)

      // Estimate amount of tokens investor1 will receive after swapping token1: include slippage
      estimate = await amm.calculateToken1Swap(tokens(100))
      console.log(`Token2 amount investor1 will receive after swap: ${ethers.utils.formatEther(estimate)}\n`)

      // Investor1 swaps token1
      transaction = await amm.connect(investor1).swapToken1(tokens(100))
      result = await transaction.wait()

      // Check investor1 balance before swap
      balance = await token2.balanceOf(investor1.address)
      console.log(`Investor1 Token2 balance before swap: ${ethers.utils.formatEther(balance)}\n`)
      
      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check Price after swapping -- token2Balance/token1Balance
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)

      /////////////////////////////////////////////////////////////////////////////////
      // Investor 1 swaps large amount
      // change amounts tokens amount to large numbers e.g. 100, 1000, 10000 etc
      
      // Investor2 approves all tokens
      transaction = await token2.connect(investor2).approve(amm.address, tokens(100000))
      await transaction.wait()

      // Check investor2 balance before swap
      balance = await token1.balanceOf(investor2.address)
      console.log(`Investor2 Token2 balance before swap: ${ethers.utils.formatEther(balance)}`)

      // Estimate amount of tokens investor 2 will receive after swapping token2: includes slippage
      estimate = await amm.calculateToken2Swap(tokens(1))
      console.log(`Token1 Amount investor2 will receive after swap: ${ethers.utils.formatEther(estimate)}`)

      // Investor2 swaps 1 token
      transaction = await amm.connect(investor2).swapToken2(tokens(1))
      await transaction.wait()

      // Check swap event
      await expect(transaction).to.emit(amm, 'Swap').withArgs(
        investor2.address,
        token2.address,
        tokens(1),
        token1.address,
        estimate,
        await amm.token1Balance(),
        await amm.token2Balance(),
        (await ethers.provider.getBlock(await ethers.provider.getBlockNumber())).timestamp
        )

      // Check investor 2 balance after swap
      balance = await token1.balanceOf(investor2.address)
      console.log(`Investor2 Token1 balance after swap: ${ethers.utils.formatEther(balance)} \n`)
      expect(estimate).to.equal(balance)

      // Check AMM token balances are in sync
      expect(await token1.balanceOf(amm.address)).to.equal(await amm.token1Balance())
      expect(await token2.balanceOf(amm.address)).to.equal(await amm.token2Balance())

      // Check Price after swapping -- token2Balance/token1Balance
      console.log(`Price: ${await amm.token2Balance() / await amm.token1Balance()} \n`)    

    })    

  })
 
})
