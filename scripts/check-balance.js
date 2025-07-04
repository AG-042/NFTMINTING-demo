const hre = require("hardhat");

async function main() {
  console.log("🔍 Checking wallet information...\n");

  // Get the deployer account
  const [deployer] = await hre.ethers.getSigners();
  
  console.log("📱 Wallet Address:", deployer.address);
  
  // Check balance
  const balance = await deployer.provider.getBalance(deployer.address);
  const balanceEth = hre.ethers.formatEther(balance);
  
  console.log("💰 Current Balance:", balanceEth, "ETH");
  
  // Check if we have enough for deployment (estimated ~0.01 ETH)
  const minRequired = hre.ethers.parseEther("0.01");
  
  if (balance >= minRequired) {
    console.log("✅ You have enough ETH for deployment!");
  } else {
    console.log("❌ You need more Sepolia ETH for deployment");
    console.log("🚰 Get free Sepolia ETH from these faucets:");
    console.log("   • https://sepoliafaucet.com/");
    console.log("   • https://www.infura.io/faucet/sepolia");
    console.log("   • https://faucet.quicknode.com/ethereum/sepolia");
    console.log("\n💡 Send Sepolia ETH to:", deployer.address);
  }
  
  // Show network info
  const network = await deployer.provider.getNetwork();
  console.log("\n🌐 Network:", network.name, "(Chain ID:", network.chainId.toString() + ")");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
