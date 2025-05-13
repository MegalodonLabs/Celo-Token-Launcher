const hre = require("hardhat");

async function main() {
  console.log("Deploying TokenFactory...");

  const [deployer] = await hre.ethers.getSigners();
  const TokenFactory = await hre.ethers.getContractFactory("TokenFactory");

  const tokenFactory = await TokenFactory.deploy(deployer.address); 

  await tokenFactory.waitForDeployment();

  console.log("TokenFactory deployed to:", await tokenFactory.getAddress());
  console.log("Fee receiver is:", deployer.address);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
