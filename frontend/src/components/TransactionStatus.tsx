import { CheckCircle, ExternalLink, ArrowLeft, Copy } from 'lucide-react'
import { useWallet } from '@/hooks/useWallet'

interface TransactionStatusProps {
  txHash: string
  tokenId: string
  contractAddress: string
  onReset: () => void
}

export default function TransactionStatus({
  txHash,
  tokenId,
  contractAddress,
  onReset
}: TransactionStatusProps) {
  const { explorerUrl } = useWallet()

  const copyToClipboard = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text)
      // You could add a toast notification here
    } catch (error) {
      console.error('Failed to copy to clipboard:', error)
    }
  }

  const openTransaction = () => {
    window.open(`${explorerUrl}/tx/${txHash}`, '_blank')
  }

  const openContract = () => {
    window.open(`${explorerUrl}/address/${contractAddress}`, '_blank')
  }

  const openNFT = () => {
    window.open(`${explorerUrl}/token/${contractAddress}?a=${tokenId}`, '_blank')
  }

  return (
    <div className="bg-white rounded-lg shadow-lg overflow-hidden">
      <div className="px-6 py-8 text-center">
        <CheckCircle className="mx-auto h-16 w-16 text-green-500 mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">
          NFT Minted Successfully!
        </h2>
        <p className="text-gray-600 mb-6">
          Your NFT has been successfully minted and is now available on the blockchain.
        </p>

        {/* Transaction Details */}
        <div className="bg-gray-50 rounded-lg p-6 mb-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Transaction Details</h3>
          
          <div className="space-y-4">
            {/* Token ID */}
            {tokenId && (
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Token ID:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono text-gray-900">#{tokenId}</span>
                  <button
                    onClick={() => copyToClipboard(tokenId)}
                    className="p-1 text-gray-400 hover:text-gray-600"
                    title="Copy Token ID"
                  >
                    <Copy className="h-4 w-4" />
                  </button>
                </div>
              </div>
            )}

            {/* Transaction Hash */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Transaction:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">
                  {txHash.slice(0, 10)}...{txHash.slice(-8)}
                </span>
                <button
                  onClick={() => copyToClipboard(txHash)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy Transaction Hash"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={openTransaction}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="View on Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Contract Address */}
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-700">Contract:</span>
              <div className="flex items-center space-x-2">
                <span className="text-sm font-mono text-gray-900">
                  {contractAddress.slice(0, 10)}...{contractAddress.slice(-8)}
                </span>
                <button
                  onClick={() => copyToClipboard(contractAddress)}
                  className="p-1 text-gray-400 hover:text-gray-600"
                  title="Copy Contract Address"
                >
                  <Copy className="h-4 w-4" />
                </button>
                <button
                  onClick={openContract}
                  className="p-1 text-blue-600 hover:text-blue-800"
                  title="View Contract on Explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <button
            onClick={openNFT}
            className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ExternalLink className="mr-2 h-5 w-5" />
            View NFT on Explorer
          </button>
          
          <button
            onClick={onReset}
            className="inline-flex items-center px-6 py-3 border border-gray-300 text-base font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Mint Another NFT
          </button>
        </div>

        {/* Additional Information */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h4 className="text-sm font-medium text-blue-900 mb-2">What's Next?</h4>
          <ul className="text-sm text-blue-800 space-y-1">
            <li>• Your NFT is now live on the blockchain</li>
            <li>• It may take a few minutes to appear in wallets and marketplaces</li>
            <li>• You can view, transfer, or list it for sale on NFT marketplaces</li>
            <li>• The metadata is permanently stored on IPFS</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
