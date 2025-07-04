import { useState, useEffect, useMemo } from 'react'
import { Contract, formatEther, parseEther, BrowserProvider, JsonRpcProvider } from 'ethers'
import { useWallet } from './useWallet'
import { NFT_CONTRACT_ABI, NFT_CONTRACT_ADDRESS } from '@/config/contract'

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

export function useContract() {
  const { provider, isConnected, account, chainId, isCorrectNetwork } = useWallet()
  
  const [contractInfo, setContractInfo] = useState<ContractInfo | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Create contract instance
  const [contract, setContract] = useState<Contract | null>(null)

  // Initialize contract when provider/connection changes
  useEffect(() => {
    const initContract = async () => {
      if (!provider || !isConnected || !isCorrectNetwork) {
        setContract(null)
        return
      }

      try {
        const signer = await provider.getSigner()
        const contractInstance = new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, signer)
        setContract(contractInstance)
      } catch (error) {
        console.error('Failed to create contract instance:', error)
        setContract(null)
      }
    }

    initContract()
  }, [provider, isConnected, isCorrectNetwork])

  // Read-only contract for view functions (doesn't require signer)
  const readOnlyContract = useMemo(() => {
    if (!provider) {
      return null
    }

    try {
      return new Contract(NFT_CONTRACT_ADDRESS, NFT_CONTRACT_ABI, provider)
    } catch (error) {
      console.error('Failed to create read-only contract instance:', error)
      return null
    }
  }, [provider])

  // Load contract information
  const loadContractInfo = async () => {
    if (!readOnlyContract) return

    setIsLoading(true)
    setError(null)

    try {
      const [
        name,
        symbol,
        totalSupply,
        maxSupply,
        remainingSupply,
        mintPrice,
        isPaused
      ] = await Promise.all([
        readOnlyContract.name(),
        readOnlyContract.symbol(),
        readOnlyContract.totalSupply(),
        readOnlyContract.MAX_SUPPLY(),
        readOnlyContract.remainingSupply(),
        readOnlyContract.mintPrice(),
        readOnlyContract.paused()
      ])

      setContractInfo({
        name,
        symbol,
        totalSupply: Number(totalSupply),
        maxSupply: Number(maxSupply),
        remainingSupply: Number(remainingSupply),
        mintPrice: formatEther(mintPrice),
        maxPerWallet: 5, // MAX_PER_WALLET constant from contract
        maxPerTx: 3, // MAX_PER_TX constant from contract
        isPaused
      })
    } catch (error: any) {
      console.error('Failed to load contract info:', error)
      setError(error.message || 'Failed to load contract information')
    } finally {
      setIsLoading(false)
    }
  }

  // Load contract info when contract is available
  useEffect(() => {
    if (readOnlyContract) {
      loadContractInfo()
    }
  }, [readOnlyContract, chainId])

  // Check if user can mint specific quantity
  const canMint = async (quantity: number): Promise<boolean> => {
    if (!readOnlyContract || !account) return false

    try {
      return await readOnlyContract.canMint(account, quantity)
    } catch (error) {
      console.error('Failed to check mint eligibility:', error)
      return false
    }
  }

  // Calculate minting cost
  const calculateCost = async (quantity: number): Promise<string> => {
    if (!readOnlyContract) return '0'

    try {
      const cost = await readOnlyContract.calculateCost(quantity)
      return formatEther(cost)
    } catch (error) {
      console.error('Failed to calculate cost:', error)
      return '0'
    }
  }

  // Get user's minted count
  const getUserMintedCount = async (): Promise<number> => {
    if (!readOnlyContract || !account) return 0

    try {
      const count = await readOnlyContract.mintedCount(account)
      return Number(count)
    } catch (error) {
      console.error('Failed to get user minted count:', error)
      return 0
    }
  }

  // Mint function
  const mint = async (quantity: number, metadataURIs: string[]) => {
    if (!contract || !account) {
      throw new Error('Contract not available or wallet not connected')
    }

    try {
      const cost = await contract.calculateCost(quantity)
      const tx = await contract.mint(account, quantity, metadataURIs, {
        value: cost
      })
      
      return tx
    } catch (error: any) {
      console.error('Minting failed:', error)
      throw error
    }
  }

  // Get token URI
  const getTokenURI = async (tokenId: number): Promise<string> => {
    if (!readOnlyContract) return ''

    try {
      return await readOnlyContract.tokenURI(tokenId)
    } catch (error) {
      console.error('Failed to get token URI:', error)
      return ''
    }
  }

  // Get token owner
  const getTokenOwner = async (tokenId: number): Promise<string> => {
    if (!readOnlyContract) return ''

    try {
      return await readOnlyContract.ownerOf(tokenId)
    } catch (error) {
      console.error('Failed to get token owner:', error)
      return ''
    }
  }

  return {
    contract,
    readOnlyContract,
    contractAddress: NFT_CONTRACT_ADDRESS,
    contractInfo,
    isLoading,
    error,
    isContractReady: !!contract && !!contractInfo,
    
    // Methods
    loadContractInfo,
    canMint,
    calculateCost,
    getUserMintedCount,
    mint,
    getTokenURI,
    getTokenOwner
  }
}