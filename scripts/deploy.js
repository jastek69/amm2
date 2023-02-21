// We require the Hardhat Runtime Environment explicitly here. This is optional
// but useful for running the script in a standalone fashion through `node <script>`.
//
// You can also run a script with `npx hardhat run <script>`. If you do that, Hardhat
// will compile your contracts, add the Hardhat Runtime Environment's members to the
// global scope, and execute the script.
const hre = require("hardhat");

async function main() {
  const Token = await hre.ethers.getContractFactory('Token')
  
  // Deploy Sobek Token (token 1)
  let sobek = await Token.deploy('Sobek', 'SOB', '1000000') // 1 million tokens
  await sobek.deployed()  
  console.log(`Sobek Token deployed to: ${sobek.address}\n`)

  // Deploy Token 2
  const usd = await Token.deploy('USD Token', 'USD', '1000000') // 1 million tokens
  await usd.deployed()  
  console.log(`USD Token deployed to: ${usd.address}\n`)

  // Deploy AMM2
  const AMM2 = await hre.ethers.getContractFactory('AMM2')
  const amm2 = await AMM2.deploy(sobek.address, usd.address)

  console.log(`AMM2 contract deployed to: ${amm2.address}\n`)

}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
