import NFT_ABI from './abi.json'

// Contract configuration
export const NFT_CONTRACT_ADDRESS = process.env.NEXT_PUBLIC_CONTRACT_ADDRESS || ''

// NFT Contract ABI - Complete ABI from compiled contract
export const NFT_CONTRACT_ABI = NFT_ABI

// Validate contract configuration
if (!NFT_CONTRACT_ADDRESS) {
  console.warn('Contract address not configured. Please set NEXT_PUBLIC_CONTRACT_ADDRESS in your environment variables.')
}

// Network-specific contract addresses (for multi-network deployment)
export const CONTRACT_ADDRESSES = {
  1: '', // Mainnet
  5: '', // Goerli
  11155111: NFT_CONTRACT_ADDRESS, // Sepolia
  137: '', // Polygon
  10: '', // Optimism
  42161: '', // Arbitrum
  8453: '' // Base
} as const

// Get contract address for specific chain
export function getContractAddress(chainId: number): string {
  return CONTRACT_ADDRESSES[chainId as keyof typeof CONTRACT_ADDRESSES] || NFT_CONTRACT_ADDRESS
}