import type { AppProps } from 'next/app'
import { createAppKit } from '@reown/appkit/react'
import { EthersAdapter } from '@reown/appkit-adapter-ethers'
import { sepolia, goerli, mainnet } from '@reown/appkit/networks'
import '@/styles/globals.css'

// 1. Get projectId from https://cloud.reown.com
const projectId = process.env.NEXT_PUBLIC_REOWN_PROJECT_ID || 'YOUR_PROJECT_ID'

// 2. Set up the Ethers adapter
const ethersAdapter = new EthersAdapter()

// 3. Configure the metadata
const metadata = {
  name: 'NFT Minting Platform',
  description: 'Mint NFTs on Ethereum with IPFS storage',
  url: typeof window !== 'undefined' ? window.location.origin : 'https://your-domain.com',
  icons: ['https://your-domain.com/icon.png']
}

// 4. Create the AppKit instance
createAppKit({
  adapters: [ethersAdapter],
  projectId,
  networks: [sepolia, goerli, mainnet],
  metadata,
  features: {
    analytics: true,
    email: false,
    socials: false
  },
  themeMode: 'light',
  themeVariables: {
    '--w3m-color-mix': '#3b82f6',
    '--w3m-color-mix-strength': 20,
    '--w3m-font-family': 'Inter, sans-serif',
    '--w3m-border-radius-master': '8px'
  }
})

export default function App({ Component, pageProps }: AppProps) {
  return <Component {...pageProps} />
}
