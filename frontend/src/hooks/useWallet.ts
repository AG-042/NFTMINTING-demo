import { useState, useEffect, useCallback } from 'react'
import { useAppKitAccount, useAppKitNetwork, useAppKitProvider } from '@reown/appkit/react'
import { BrowserProvider } from 'ethers'
import { appKit, TARGET_NETWORK } from '@/config/reown'

export interface WalletState {
  account: string | null
  isConnected: boolean
  chainId: string | number | null
  provider: BrowserProvider | null
  isConnecting: boolean
  error: string | null
}

export function useWallet() {
  const { address, isConnected } = useAppKitAccount()
  const { chainId } = useAppKitNetwork()
  const { walletProvider } = useAppKitProvider('eip155')
  
  const [state, setState] = useState<WalletState>({
    account: null,
    isConnected: false,
    chainId: null,
    provider: null,
    isConnecting: false,
    error: null
  })

  // Update state when wallet connection changes
  useEffect(() => {
    setState(prev => ({
      ...prev,
      account: address || null,
      isConnected: isConnected || false,
      chainId: chainId || null,
      provider: walletProvider && typeof walletProvider === 'object' && 'request' in walletProvider 
        ? new BrowserProvider(walletProvider as any) 
        : null,
      error: null
    }))
  }, [address, isConnected, chainId, walletProvider])

  const connectWallet = useCallback(async () => {
    try {
      setState(prev => ({ ...prev, isConnecting: true, error: null }))
      await appKit.open()
    } catch (error: any) {
      console.error('Failed to connect wallet:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to connect wallet',
        isConnecting: false
      }))
    } finally {
      setState(prev => ({ ...prev, isConnecting: false }))
    }
  }, [])

  const disconnectWallet = useCallback(async () => {
    try {
      await appKit.disconnect()
      setState({
        account: null,
        isConnected: false,
        chainId: null,
        provider: null,
        isConnecting: false,
        error: null
      })
    } catch (error: any) {
      console.error('Failed to disconnect wallet:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to disconnect wallet'
      }))
    }
  }, [])

  const switchNetwork = useCallback(async (targetChainId: number) => {
    try {
      if (!state.provider) {
        throw new Error('No wallet connected')
      }

      // Find the network object that matches the target chain ID
      const { sepolia, goerli, mainnet } = await import('@reown/appkit/networks')
      const networkMap = {
        11155111: sepolia,
        5: goerli, 
        1: mainnet
      }
      
      const targetNetwork = networkMap[targetChainId as keyof typeof networkMap]
      if (!targetNetwork) {
        throw new Error(`Unsupported network: ${targetChainId}`)
      }

      // Use Reown's network switching with proper network object
      await appKit.switchNetwork(targetNetwork)
    } catch (error: any) {
      console.error('Failed to switch network:', error)
      setState(prev => ({
        ...prev,
        error: error.message || 'Failed to switch network'
      }))
      throw error
    }
  }, [state.provider])

  const isCorrectNetwork = useCallback(() => {
    return state.chainId === TARGET_NETWORK.chainId
  }, [state.chainId])

  const getNetworkName = useCallback(() => {
    switch (state.chainId) {
      case 1:
        return 'Ethereum Mainnet'
      case 5:
        return 'Goerli Testnet'
      case 11155111:
        return 'Sepolia Testnet'
      case 137:
        return 'Polygon'
      case 10:
        return 'Optimism'
      case 42161:
        return 'Arbitrum One'
      case 8453:
        return 'Base'
      default:
        return 'Unknown Network'
    }
  }, [state.chainId])

  const getExplorerUrl = useCallback(() => {
    switch (state.chainId) {
      case 1:
        return 'https://etherscan.io'
      case 5:
        return 'https://goerli.etherscan.io'
      case 11155111:
        return 'https://sepolia.etherscan.io'
      case 137:
        return 'https://polygonscan.com'
      case 10:
        return 'https://optimistic.etherscan.io'
      case 42161:
        return 'https://arbiscan.io'
      case 8453:
        return 'https://basescan.org'
      default:
        return 'https://etherscan.io'
    }
  }, [state.chainId])

  return {
    ...state,
    connectWallet,
    disconnectWallet,
    switchNetwork,
    isCorrectNetwork: isCorrectNetwork(),
    networkName: getNetworkName(),
    explorerUrl: getExplorerUrl(),
    targetNetwork: TARGET_NETWORK
  }
}