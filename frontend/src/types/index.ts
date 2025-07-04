// NFT Metadata types
export interface NFTAttribute {
  trait_type: string
  value: string | number
  display_type?: 'number' | 'boost_number' | 'boost_percentage' | 'date'
}

export interface CreatorInfo {
  address: string
  name: string
  bio: string
  social: {
    twitter: string
    instagram: string
    website: string
  }
}

export interface NFTMetadata {
  name: string
  description: string
  image: File | string | null
  attributes: NFTAttribute[]
  creator?: CreatorInfo
  external_url?: string
  animation_url?: string
  background_color?: string
}

// Minting state management
export interface MintingState {
  isUploading: boolean
  isMinting: boolean
  isComplete: boolean
  txHash: string
  tokenId: string
  error: string
}

// IPFS Upload response
export interface IPFSUploadResponse {
  ipfsHash: string
  url: string
}

// Transaction types
export interface TransactionReceipt {
  transactionHash: string
  blockNumber: number
  blockHash: string
  gasUsed: string
  status: number
}

// Wallet connection types
export interface WalletConnectionState {
  isConnected: boolean
  account: string | null
  chainId: number | null
  isConnecting: boolean
  error: string | null
}

// Contract interaction types
export interface ContractState {
  isLoading: boolean
  error: string | null
  contract: any | null
  contractInfo: ContractInfo | null
}

export interface ContractInfo {
  name: string
  symbol: string
  totalSupply: number
  maxSupply: number
  remainingSupply: number
  mintPrice: string
  maxPerWallet: number
  maxPerTx: number
  isPaused: boolean
}

// Form data types
export interface MintingFormData {
  name: string
  description: string
  attributes: NFTAttribute[]
  quantity: number
  image: File | null
}

// API Response types
export interface APIResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

// Django API types
export interface MetadataUploadRequest {
  name: string
  description: string
  attributes: NFTAttribute[]
  image_data: string // base64 encoded image
}

export interface MetadataUploadResponse {
  ipfs_hash: string
  metadata_url: string
  image_url: string
}

// Component prop types
export interface BaseComponentProps {
  className?: string
  children?: React.ReactNode
}

export interface ButtonProps extends BaseComponentProps {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost'
  size?: 'sm' | 'md' | 'lg'
  disabled?: boolean
  loading?: boolean
  onClick?: () => void
  type?: 'button' | 'submit' | 'reset'
}

export interface InputProps extends BaseComponentProps {
  type?: string
  placeholder?: string
  value?: string
  onChange?: (value: string) => void
  disabled?: boolean
  error?: string
  label?: string
  required?: boolean
}

// Error types
export interface AppError {
  code: string
  message: string
  details?: any
}

// Network types
export interface NetworkConfig {
  chainId: number
  name: string
  rpcUrl: string
  explorerUrl: string
  contractAddress?: string
}