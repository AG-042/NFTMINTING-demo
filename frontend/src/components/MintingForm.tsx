import { useState, useEffect } from 'react'
import { Plus, Minus, Loader2, Info } from 'lucide-react'
import { NFTMetadata, NFTAttribute } from '@/types'
import { useContract } from '@/hooks/useContract'

interface MintingFormProps {
  nftData: Partial<NFTMetadata>
  quantity: number
  onMetadataChange: (field: keyof NFTMetadata, value: any) => void
  onQuantityChange: (quantity: number) => void
  onMint: () => void
  isLoading: boolean
  hasImage: boolean
  contract: any
}

export default function MintingForm({
  nftData,
  quantity,
  onMetadataChange,
  onQuantityChange,
  onMint,
  isLoading,
  hasImage,
  contract
}: MintingFormProps) {
  const { contractInfo, calculateCost, canMint, getUserMintedCount } = useContract()
  const [mintCost, setMintCost] = useState<string>('0')
  const [userMintedCount, setUserMintedCount] = useState<number>(0)
  const [canMintCheck, setCanMintCheck] = useState<boolean>(false)

  // Update cost when quantity changes
  useEffect(() => {
    if (contractInfo && quantity > 0) {
      calculateCost(quantity).then(setMintCost)
      canMint(quantity).then(setCanMintCheck)
    }
  }, [quantity, contractInfo, calculateCost, canMint])

  // Get user's minted count
  useEffect(() => {
    getUserMintedCount().then(setUserMintedCount)
  }, [getUserMintedCount])

  const handleAttributeChange = (index: number, field: 'trait_type' | 'value', value: string) => {
    const updatedAttributes = [...(nftData.attributes || [])]
    updatedAttributes[index] = {
      ...updatedAttributes[index],
      [field]: value
    }
    onMetadataChange('attributes', updatedAttributes)
  }

  const addAttribute = () => {
    const newAttribute: NFTAttribute = {
      trait_type: '',
      value: ''
    }
    onMetadataChange('attributes', [...(nftData.attributes || []), newAttribute])
  }

  const removeAttribute = (index: number) => {
    const updatedAttributes = (nftData.attributes || []).filter((_, i) => i !== index)
    onMetadataChange('attributes', updatedAttributes)
  }

  const canSubmit = hasImage && 
                   nftData.name && 
                   nftData.description && 
                   !isLoading && 
                   canMintCheck &&
                   contractInfo

  const maxQuantity = contractInfo ? Math.min(
    contractInfo.maxPerTx,
    contractInfo.maxPerWallet - userMintedCount,
    contractInfo.remainingSupply
  ) : 1

  return (
    <div className="space-y-6">
      {/* NFT Name */}
      <div>
        <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
          NFT Name *
        </label>
        <input
          type="text"
          id="name"
          value={nftData.name || ''}
          onChange={(e) => onMetadataChange('name', e.target.value)}
          placeholder="Enter NFT name"
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          maxLength={100}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(nftData.name?.length || 0)}/100 characters
        </p>
      </div>

      {/* NFT Description */}
      <div>
        <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
          Description *
        </label>
        <textarea
          id="description"
          value={nftData.description || ''}
          onChange={(e) => onMetadataChange('description', e.target.value)}
          placeholder="Describe your NFT..."
          rows={4}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
          maxLength={1000}
          disabled={isLoading}
        />
        <p className="text-xs text-gray-500 mt-1">
          {(nftData.description?.length || 0)}/1000 characters
        </p>
      </div>

      {/* Attributes */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <label className="block text-sm font-medium text-gray-700">
            Attributes (Optional)
          </label>
          <button
            type="button"
            onClick={addAttribute}
            disabled={isLoading}
            className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-700 bg-blue-100 hover:bg-blue-200 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-3 w-3 mr-1" />
            Add Trait
          </button>
        </div>

        {(nftData.attributes || []).length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-4 border-2 border-dashed border-gray-200 rounded-md">
            No attributes added yet. Click "Add Trait" to add properties to your NFT.
          </p>
        ) : (
          <div className="space-y-3">
            {(nftData.attributes || []).map((attribute, index) => (
              <div key={index} className="flex gap-3 items-center">
                <input
                  type="text"
                  placeholder="Trait type (e.g., Color)"
                  value={attribute.trait_type}
                  onChange={(e) => handleAttributeChange(index, 'trait_type', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <input
                  type="text"
                  placeholder="Value (e.g., Blue)"
                  value={attribute.value.toString()}
                  onChange={(e) => handleAttributeChange(index, 'value', e.target.value)}
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => removeAttribute(index)}
                  disabled={isLoading}
                  className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Minus className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quantity */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quantity
        </label>
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => onQuantityChange(Math.max(1, quantity - 1))}
            disabled={quantity <= 1 || isLoading}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Minus className="h-4 w-4" />
          </button>
          <span className="text-lg font-medium min-w-[3rem] text-center">{quantity}</span>
          <button
            type="button"
            onClick={() => onQuantityChange(Math.min(maxQuantity, quantity + 1))}
            disabled={quantity >= maxQuantity || isLoading}
            className="p-2 border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">
          Maximum: {maxQuantity} NFTs ({userMintedCount}/{contractInfo?.maxPerWallet || 0} minted)
        </p>
      </div>

      {/* Contract Info */}
      {contractInfo && (
        <div className="bg-gray-50 rounded-lg p-4 space-y-2">
          <h4 className="text-sm font-medium text-gray-900 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Minting Information
          </h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-600">Price per NFT:</span>
              <span className="ml-2 font-medium">{contractInfo.mintPrice} ETH</span>
            </div>
            <div>
              <span className="text-gray-600">Total Cost:</span>
              <span className="ml-2 font-medium">{mintCost} ETH</span>
            </div>
            <div>
              <span className="text-gray-600">Remaining Supply:</span>
              <span className="ml-2 font-medium">{contractInfo.remainingSupply}</span>
            </div>
            <div>
              <span className="text-gray-600">Your Minted:</span>
              <span className="ml-2 font-medium">{userMintedCount}/{contractInfo.maxPerWallet}</span>
            </div>
          </div>
        </div>
      )}

      {/* Mint Button */}
      <button
        type="button"
        onClick={onMint}
        disabled={!canSubmit}
        className="w-full flex items-center justify-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
      >
        {isLoading ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing...
          </>
        ) : (
          `Mint ${quantity} NFT${quantity > 1 ? 's' : ''} for ${mintCost} ETH`
        )}
      </button>

      {/* Validation Messages */}
      {!hasImage && (
        <p className="text-sm text-red-600">Please upload an image</p>
      )}
      {!nftData.name && hasImage && (
        <p className="text-sm text-red-600">Please enter an NFT name</p>
      )}
      {!nftData.description && hasImage && nftData.name && (
        <p className="text-sm text-red-600">Please enter a description</p>
      )}
      {!canMintCheck && hasImage && nftData.name && nftData.description && (
        <p className="text-sm text-red-600">
          Cannot mint: Check wallet limits and contract status
        </p>
      )}
    </div>
  )
}