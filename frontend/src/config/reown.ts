import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, goerli, mainnet, polygon, optimism, arbitrum, base } from '@reown/appkit/networks'
import type { AppKitNetwork } from '@reown/appkit/networks'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'demo-project-id'

// Validate project ID
if (!projectId || projectId === 'your_reown_project_id_here' || projectId === 'demo-project-id') {
  console.warn('⚠️ Reown Project ID not configured. Some wallet features may be limited.')
}

// 2. Set up the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 3. Configure the metadata
const metadata = {
  name: 'NFT Minting Platform',
  description: 'Mint NFTs on Ethereum with IPFS storage',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com',
  icons: ['https://your-domain.com/icon.png']
}

// 4. Configure supported networks
const networks: [AppKitNetwork, ...AppKitNetwork[]] = [
  sepolia,
  goerli,
  mainnet,
  polygon,
  optimism,
  arbitrum,
  base
]

// 5. Create the AppKit instance
export const appKit = createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks,
  metadata,
  features: {
    analytics: true, // Optional - defaults to your Cloud configuration
    email: false, // Optional - defaults to true
    socials: false // Optional - defaults to true
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#00D4AA',
    '--w3m-color-mix-strength': 15,
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-border-radius-master': '8px'
  }
})

// 6. Export network configurations for easy reference
export const SUPPORTED_NETWORKS = {
  sepolia: {
    chainId: 11155111,
    name: 'Sepolia',
    rpcUrl: process.env.NEXT_PUBLIC_SEPOLIA_RPC || 'https://eth-sepolia.g.alchemy.com/v2/demo',
    explorerUrl: 'https://sepolia.etherscan.io'
  },
  goerli: {
    chainId: 5,
    name: 'Goerli',
    rpcUrl: process.env.NEXT_PUBLIC_GOERLI_RPC || 'https://eth-goerli.g.alchemy.com/v2/demo',
    explorerUrl: 'https://goerli.etherscan.io'
  },
  mainnet: {
    chainId: 1,
    name: 'Ethereum',
    rpcUrl: process.env.NEXT_PUBLIC_MAINNET_RPC || 'https://eth-mainnet.g.alchemy.com/v2/demo',
    explorerUrl: 'https://etherscan.io'
  }
}

export const TARGET_NETWORK = SUPPORTED_NETWORKS.sepolia // Default to Sepolia for development