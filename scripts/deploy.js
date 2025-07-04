const { ethers } = require("hardhat");

async function main() {
  console.log("🔍 Pre-deployment checks...\n");

  // Get the deployer account
  const [deployer] = await ethers.getSigners();
  const balance = await ethers.provider.getBalance(deployer.address);
  
  console.log("📱 Deploying from address:", deployer.address);
  console.log("💰 Account balance:", ethers.formatEther(balance), "ETH");
  
  // Check if we have enough for deployment
  const minRequired = ethers.parseEther("0.01");
  if (balance < minRequired) {
    console.log("❌ Insufficient balance for deployment!");
    console.log("🚰 Get free Sepolia ETH from: https://sepoliafaucet.com/");
    console.log("💡 Send Sepolia ETH to:", deployer.address);
    return;
  }
  
  console.log("✅ Sufficient balance for deployment!");
  console.log("\n🚀 Deploying NFTMinting contract...");

  // Get the contract factory
  const NFTMinting = await ethers.getContractFactory("NFTMinting");

  // Contract constructor parameters
  const name = "NFT Minting Demo";
  const symbol = "NMD";
  const baseTokenURI = "https://ipfs.filebase.io/ipfs/"; // Updated for Filebase
  const initialOwner = deployer.address;

  console.log("📋 Contract Parameters:");
  console.log("   Name:", name);
  console.log("   Symbol:", symbol);
  console.log("   Base URI:", baseTokenURI);
  console.log("   Owner:", initialOwner);

  // Deploy the contract
  console.log("\n⏳ Deploying contract...");
  const nftContract = await NFTMinting.deploy(
    name,
    symbol,
    baseTokenURI,
    initialOwner
  );

  // Wait for deployment
  await nftContract.waitForDeployment();
  const contractAddress = await nftContract.getAddress();

  console.log("✅ NFTMinting deployed to:", contractAddress);
  console.log("Contract name:", name);
  console.log("Contract symbol:", symbol);
  console.log("Base URI:", baseTokenURI);
  console.log("Owner:", initialOwner);

  // Verify deployment
  console.log("\n🔍 Verifying deployment...");
  const deployedName = await nftContract.name();
  const deployedSymbol = await nftContract.symbol();
  const deployedOwner = await nftContract.owner();
  const maxSupply = await nftContract.MAX_SUPPLY();
  const mintPrice = await nftContract.mintPrice();

  console.log("✅ Contract Details:");
  console.log("   Name:", deployedName);
  console.log("   Symbol:", deployedSymbol);
  console.log("   Owner:", deployedOwner);
  console.log("   Max Supply:", maxSupply.toString());
  console.log("   Mint Price:", ethers.formatEther(mintPrice), "ETH");

  // Save deployment info
  const network = await ethers.provider.getNetwork();
  const deploymentInfo = {
    contractAddress: contractAddress,
    contractName: name,
    contractSymbol: symbol,
    deployer: deployer.address,
    network: network.name,
    chainId: network.chainId.toString(),
    blockNumber: await ethers.provider.getBlockNumber(),
    timestamp: new Date().toISOString(),
    maxSupply: maxSupply.toString(),
    mintPrice: ethers.formatEther(mintPrice),
    baseURI: baseTokenURI
  };

  console.log("\n🎉 Deployment completed successfully!");
  console.log("📋 Save this contract address:", contractAddress);
  
  // If on testnet, provide instructions
  if (network.name === "sepolia") {
    console.log("\n📝 Next steps for Sepolia testnet:");
    console.log("1. Verify contract on Etherscan:");
    console.log(`   npx hardhat verify --network sepolia ${contractAddress} "${name}" "${symbol}" "${baseTokenURI}" "${initialOwner}"`);
    console.log("2. Add contract address to your frontend environment variables");
    console.log("3. Update your Django backend with the contract address");
  }

  return nftContract;
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
