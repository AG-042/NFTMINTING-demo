import { Fragment } from 'react'
import { Menu, Transition } from '@headlessui/react'
import { ChevronDownIcon, WalletIcon, ExternalLinkIcon, CopyIcon, LogOutIcon, AlertTriangleIcon } from 'lucide-react'
import { useAppKitAccount } from '@reown/appkit/react'
import { appKit } from '@/config/reown'
import { useWallet } from '@/hooks/useWallet'
import clsx from 'clsx'

interface WalletConnectionProps {
  isConnected: boolean
  account: string | null
  onConnect: () => void
  onDisconnect: () => void
}

export default function WalletConnection({
  isConnected,
  account,
  onConnect,
  onDisconnect
}: WalletConnectionProps) {
  const { isCorrectNetwork, networkName, explorerUrl, switchNetwork, targetNetwork } = useWallet()

  const formatAddress = (address: string) => {
    return `${address.slice(0, 6)}...${address.slice(-4)}`
  }

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const openExplorer = () => {
    if (account) {
      window.open(`${explorerUrl}/address/${account}`, '_blank')
    }
  }

  const handleSwitchNetwork = async () => {
    try {
      await switchNetwork(targetNetwork.chainId)
    } catch (error) {
      console.error('Failed to switch network:', error)
    }
  }

  if (!isConnected) {
    return (
      <button
        onClick={onConnect}
        className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
      >
        <WalletIcon className="mr-2 h-4 w-4" />
        Connect Wallet
      </button>
    )
  }

  return (
    <div className="flex items-center space-x-2 sm:space-x-3">
      {/* Network Status */}
      {!isCorrectNetwork && (
        <div className="flex items-center space-x-2">
          <div className="flex items-center px-2 sm:px-3 py-1 text-xs font-medium text-red-700 bg-red-100 rounded-full">
            <AlertTriangleIcon className="mr-1 h-3 w-3 flex-shrink-0" />
            <span className="hidden sm:inline">Wrong Network</span>
            <span className="sm:hidden">Wrong Net</span>
          </div>
          <button
            onClick={handleSwitchNetwork}
            className="px-2 sm:px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-full transition-colors duration-200"
          >
            <span className="hidden sm:inline">Switch to {targetNetwork.name}</span>
            <span className="sm:hidden">Switch</span>
          </button>
        </div>
      )}

      {/* Current Network Display */}
      <div className="hidden md:flex items-center px-3 py-1 text-xs font-medium text-gray-700 bg-gray-100 rounded-full">
        <div className={clsx(
          "w-2 h-2 rounded-full mr-2 flex-shrink-0",
          isCorrectNetwork ? "bg-green-400" : "bg-red-400"
        )} />
        <span className="truncate max-w-20">{networkName}</span>
      </div>

      {/* Wallet Menu */}
      <Menu as="div" className="relative">
        <Menu.Button className="inline-flex items-center px-3 sm:px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200">
          <WalletIcon className="mr-1 sm:mr-2 h-4 w-4" />
          <span className="hidden sm:inline truncate max-w-24 lg:max-w-none">{formatAddress(account!)}</span>
          <span className="sm:hidden">Connected</span>
          <ChevronDownIcon className="ml-1 sm:ml-2 h-4 w-4" />
        </Menu.Button>

        <Transition
          as={Fragment}
          enter="transition ease-out duration-100"
          enterFrom="transform opacity-0 scale-95"
          enterTo="transform opacity-100 scale-100"
          leave="transition ease-in duration-75"
          leaveFrom="transform opacity-100 scale-100"
          leaveTo="transform opacity-0 scale-95"
        >
          <Menu.Items className="absolute right-0 z-10 mt-2 w-64 sm:w-56 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none">
            <div className="py-1">
              {/* Account Info */}
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-sm font-medium text-gray-900">Connected Account</p>
                <p className="text-xs text-gray-500 font-mono break-all">{account}</p>
              </div>

              {/* Copy Address */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => copyToClipboard(account!)}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'group flex w-full items-center px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <CopyIcon className="mr-3 h-4 w-4" />
                    Copy Address
                  </button>
                )}
              </Menu.Item>

              {/* View on Explorer */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={openExplorer}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'group flex w-full items-center px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <ExternalLinkIcon className="mr-3 h-4 w-4" />
                    View on Explorer
                  </button>
                )}
              </Menu.Item>

              {/* Account Settings */}
              <Menu.Item>
                {({ active }) => (
                  <button
                    onClick={() => appKit.open({ view: 'Account' })}
                    className={clsx(
                      active ? 'bg-gray-100' : '',
                      'group flex w-full items-center px-4 py-2 text-sm text-gray-700'
                    )}
                  >
                    <WalletIcon className="mr-3 h-4 w-4" />
                    Wallet Settings
                  </button>
                )}
              </Menu.Item>

              <div className="border-t border-gray-100">
                {/* Disconnect */}
                <Menu.Item>
                  {({ active }) => (
                    <button
                      onClick={onDisconnect}
                      className={clsx(
                        active ? 'bg-red-50 text-red-900' : 'text-red-700',
                        'group flex w-full items-center px-4 py-2 text-sm'
                      )}
                    >
                      <LogOutIcon className="mr-3 h-4 w-4" />
                      Disconnect
                    </button>
                  )}
                </Menu.Item>
              </div>
            </div>
          </Menu.Items>
        </Transition>
      </Menu>
    </div>
  )
}