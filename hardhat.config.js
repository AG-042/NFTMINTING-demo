require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    // Testnet configurations
    sepolia: {
      url: process.env.SEPOLIA_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 11155111,
      gasPrice: "auto",
    },
    goerli: {
      url: process.env.GOERLI_URL || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
      chainId: 5,
      gasPrice: "auto",
    },
    // Local development
    localhost: {
      url: "http://127.0.0.1:8545",
      chainId: 31337,
    },
    hardhat: {
      chainId: 31337,
    },
    
    // Mainnet configurations (uncomment when ready for production)
    // mainnet: {
    //   url: process.env.MAINNET_URL || "",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 1,
    //   gasPrice: "auto",
    //   gas: 2100000,
    //   gasMultiplier: 1.2,
    // },
    
    // Layer 2 networks (uncomment as needed)
    // polygon: {
    //   url: process.env.POLYGON_URL || "https://polygon-rpc.com/",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 137,
    //   gasPrice: "auto",
    // },
    // polygonMumbai: {
    //   url: process.env.POLYGON_MUMBAI_URL || "https://rpc-mumbai.maticvigil.com/",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 80001,
    //   gasPrice: "auto",
    // },
    // optimism: {
    //   url: process.env.OPTIMISM_URL || "https://mainnet.optimism.io",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 10,
    //   gasPrice: "auto",
    // },
    // arbitrumOne: {
    //   url: process.env.ARBITRUM_URL || "https://arb1.arbitrum.io/rpc",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 42161,
    //   gasPrice: "auto",
    // },
    // base: {
    //   url: process.env.BASE_URL || "https://mainnet.base.org",
    //   accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : [],
    //   chainId: 8453,
    //   gasPrice: "auto",
    // },
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY || "",
  },
  gasReporter: {
    enabled: process.env.REPORT_GAS !== undefined,
    currency: "USD",
  },
};