const { ethers } = require('hardhat');
require('dotenv').config();

async function testContract() {
  try {
    // Get contract address from environment
    const contractAddress = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS;
    
    if (!contractAddress) {
      console.error('❌ CONTRACT_ADDRESS not found in environment variables');
      return;
    }

    console.log('🔍 Testing deployed contract at:', contractAddress);

    // Setup provider
    const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_URL);
    
    // Get contract instance
    const NFTMinting = await ethers.getContractFactory('NFTMinting');
    const contract = NFTMinting.attach(contractAddress).connect(provider);

    // Test basic contract calls
    console.log('\n📋 Contract Information:');
    console.log('Name:', await contract.name());
    console.log('Symbol:', await contract.symbol());
    console.log('Total Supply:', (await contract.totalSupply()).toString());
    console.log('Max Supply:', (await contract.MAX_SUPPLY()).toString());
    console.log('Remaining Supply:', (await contract.remainingSupply()).toString());
    console.log('Mint Price:', ethers.formatEther(await contract.mintPrice()), 'ETH');
    console.log('Max Per Wallet:', (await contract.MAX_PER_WALLET()).toString());
    console.log('Max Per Transaction:', (await contract.MAX_PER_TX()).toString());
    console.log('Is Paused:', await contract.paused());

    // Test with a test address
    const testAddress = '0x1234567890123456789012345678901234567890';
    console.log('\n🧪 Testing mint eligibility for test address:', testAddress);
    console.log('Can mint 1 NFT:', await contract.canMint(testAddress, 1));
    console.log('Calculate cost for 1 NFT:', ethers.formatEther(await contract.calculateCost(1)), 'ETH');
    console.log('Minted count for test address:', (await contract.mintedCount(testAddress)).toString());

    console.log('\n✅ Contract is working correctly!');

  } catch (error) {
    console.error('❌ Error testing contract:', error.message);
    
    if (error.message.includes('NETWORK_ERROR')) {
      console.log('💡 This might be a network connectivity issue. Check your RPC URL.');
    } else if (error.message.includes('CONTRACT_NOT_DEPLOYED')) {
      console.log('💡 Contract might not be deployed yet or wrong address.');
    }
  }
}

// Run the test
testContract()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
