import { useState, useEffect } from 'react';
import { ethers } from 'ethers';
import { Wallet, Image as ImageIcon, AlertCircle, Loader2 } from 'lucide-react';
import toast, { Toaster } from 'react-hot-toast';
import WalletConnection from '@/components/WalletConnection';
import ImageUpload from '@/components/ImageUpload';
import MintingForm from '@/components/MintingForm';
import TransactionStatus from '@/components/TransactionStatus';
import { useWallet } from '@/hooks/useWallet';
import { useContract } from '@/hooks/useContract';
import { uploadNFTToIPFS } from '@/utils/ipfsUpload';
import { NFTMetadata, MintingState } from '@/types';

export default function MintPage() {
  const { account, isConnected, connectWallet, disconnectWallet, chainId } = useWallet();
  const { contract, contractAddress, isContractReady } = useContract();
  
  const [mintingState, setMintingState] = useState<MintingState>({
    isUploading: false,
    isMinting: false,
    isComplete: false,
    txHash: '',
    tokenId: '',
    error: '',
  });

  // Enhanced NFT metadata with creator info
  const [nftData, setNftData] = useState<Partial<NFTMetadata>>({
    name: '',
    description: '',
    image: null,
    attributes: [],
    creator: {
      address: account || '',
      name: '',
      bio: '',
      social: {
        twitter: '',
        instagram: '',
        website: ''
      }
    }
  });

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [quantity, setQuantity] = useState<number>(1);

  // Reset state when wallet changes
  useEffect(() => {
    if (!isConnected) {
      setMintingState({
        isUploading: false,
        isMinting: false,
        isComplete: false,
        txHash: '',
        tokenId: '',
        error: '',
      });
      setNftData({
        name: '',
        description: '',
        image: null,
        attributes: [],
        creator: {
          address: account || '',
          name: '',
          bio: '',
          social: {
            twitter: '',
            instagram: '',
            website: ''
          }
        }
      });
      setImageFile(null);
      setImagePreview('');
    }
  }, [isConnected, account]);

  const handleImageSelect = (file: File) => {
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (e) => {
      setImagePreview(e.target?.result as string);
    };
    reader.readAsDataURL(file);
    
    setNftData(prev => ({
      ...prev,
      image: file,
    }));
  };

  const handleMetadataChange = (field: keyof NFTMetadata, value: any) => {
    setNftData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleMint = async () => {
    if (!contract || !isConnected || !imageFile) {
      toast.error('Please connect wallet and select an image');
      return;
    }

    if (!nftData.name || !nftData.description) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      setMintingState(prev => ({ ...prev, isUploading: true, error: '' }));
      
      // Step 1: Upload image and metadata to IPFS
      toast.loading('Uploading to IPFS...', { id: 'upload' });
      
      const uploadResult = await uploadNFTToIPFS(
        imageFile,
        nftData.name!,
        nftData.description!,
        nftData.attributes || []
      );
      
      const metadataURI = uploadResult.metadataUpload.ipfs_url;
      toast.success('Uploaded to IPFS!', { id: 'upload' });

      setMintingState(prev => ({ 
        ...prev, 
        isUploading: false, 
        isMinting: true 
      }));

      // Step 2: Mint NFT
      toast.loading('Minting NFT...', { id: 'mint' });

      // Get mint price and calculate total cost
      const mintPriceWei = await contract.mintPrice();
      const totalCost = mintPriceWei * BigInt(quantity);

      // Create metadata URIs array
      const metadataURIs = Array(quantity).fill(metadataURI);

      // Call mint function with proper parameters
      const tx = await contract.mint(
        account,
        quantity,
        metadataURIs,
        { value: totalCost }
      );

      setMintingState(prev => ({ ...prev, txHash: tx.hash }));
      toast.loading('Confirming transaction...', { id: 'mint' });

      // Wait for transaction confirmation
      const receipt = await tx.wait();
      
      // Extract token ID from events
      const mintEvent = receipt.logs.find((log: any) => {
        try {
          const parsedLog = contract.interface.parseLog(log);
          return parsedLog?.name === 'NFTMinted';
        } catch {
          return false;
        }
      });

      let tokenId = '';
      if (mintEvent) {
        const parsedLog = contract.interface.parseLog(mintEvent);
        tokenId = parsedLog?.args?.tokenId?.toString() || '';
      }

      setMintingState({
        isUploading: false,
        isMinting: false,
        isComplete: true,
        txHash: tx.hash,
        tokenId,
        error: '',
      });

      toast.success('NFT minted successfully!', { id: 'mint' });

    } catch (error: any) {
      console.error('Minting error:', error);
      
      let errorMessage = 'Failed to mint NFT';
      
      if (error.code === 'ACTION_REJECTED') {
        errorMessage = 'Transaction was rejected by user';
      } else if (error.message?.includes('insufficient funds')) {
        errorMessage = 'Insufficient funds for minting';
      } else if (error.message?.includes('exceeds maximum')) {
        errorMessage = 'Minting limit exceeded';
      } else if (error.message?.includes('Backend connection failed')) {
        errorMessage = 'Backend connection failed. Please ensure the Django server is running on port 8000.';
      } else if (error.message?.includes('Failed to upload')) {
        errorMessage = 'Failed to upload to IPFS. Please check your backend configuration.';
      } else if (error.message?.includes('IPFS service not configured')) {
        errorMessage = 'IPFS service not configured. Please check your Filebase credentials.';
      } else if (error.message?.includes('Invalid file type')) {
        errorMessage = 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
      } else if (error.message?.includes('file size')) {
        errorMessage = 'File too large. Please use an image smaller than 10MB.';
      } else if (error.message?.includes('Network error')) {
        errorMessage = 'Network error. Please check your connection and try again.';
      } else if (error.message) {
        errorMessage = error.message;
      }

      setMintingState({
        isUploading: false,
        isMinting: false,
        isComplete: false,
        txHash: '',
        tokenId: '',
        error: errorMessage,
      });

      toast.error(errorMessage, { id: 'mint' });
      toast.dismiss('upload');
    }
  };

  const resetMinting = () => {
    setMintingState({
      isUploading: false,
      isMinting: false,
      isComplete: false,
      txHash: '',
      tokenId: '',
      error: '',
    });
    setNftData({
      name: '',
      description: '',
      image: null,
      attributes: [],
      creator: {
        address: account || '',
        name: '',
        bio: '',
        social: {
          twitter: '',
          instagram: '',
          website: ''
        }
      }
    });
    setImageFile(null);
    setImagePreview('');
    setQuantity(1);
  };

  const isCorrectNetwork = chainId === parseInt(process.env.NEXT_PUBLIC_CHAIN_ID || '11155111');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 responsive-container">
      <Toaster position="top-right" />
      
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 safe-area-padding">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-2 min-w-0">
              <ImageIcon className="h-6 w-6 sm:h-8 sm:w-8 text-blue-600 flex-shrink-0" />
              <h1 className="text-lg sm:text-xl font-bold text-gray-900 truncate">NFT Minting Platform</h1>
            </div>
            
            <div className="flex-shrink-0">
              <WalletConnection
                isConnected={isConnected}
                account={account}
                onConnect={connectWallet}
                onDisconnect={disconnectWallet}
              />
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 safe-area-padding">
        {!isConnected ? (
          <div className="text-center py-8 sm:py-12">
            <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Connect Your Wallet</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 px-4 prevent-overflow">
              Connect your wallet to start minting NFTs on the {process.env.NEXT_PUBLIC_NETWORK_NAME} network
            </p>
            <button
              onClick={connectWallet}
              className="inline-flex items-center px-4 sm:px-6 py-2 sm:py-3 border border-transparent text-sm sm:text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
            >
              <Wallet className="mr-2 h-4 sm:h-5 w-4 sm:w-5" />
              Connect Wallet
            </button>
          </div>
        ) : !isCorrectNetwork ? (
          <div className="text-center py-8 sm:py-12">
            <AlertCircle className="mx-auto h-12 w-12 text-red-400 mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Wrong Network</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 px-4 prevent-overflow">
              Please switch to the {process.env.NEXT_PUBLIC_NETWORK_NAME} network to mint NFTs
            </p>
          </div>
        ) : !isContractReady ? (
          <div className="text-center py-8 sm:py-12">
            <Loader2 className="mx-auto h-12 w-12 text-blue-400 animate-spin mb-4" />
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">Loading Contract</h2>
            <p className="text-sm sm:text-base text-gray-600 mb-6 px-4 prevent-overflow">
              Connecting to the NFT contract...
            </p>
          </div>
        ) : mintingState.isComplete ? (
          <TransactionStatus
            txHash={mintingState.txHash}
            tokenId={mintingState.tokenId}
            contractAddress={contractAddress}
            onReset={resetMinting}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="px-4 sm:px-6 py-4 border-b border-gray-200">
              <h2 className="text-lg sm:text-xl font-semibold text-gray-900">Mint Your NFT</h2>
              <p className="text-sm text-gray-600 mt-1 prevent-overflow">
                Upload an image and add metadata to create your unique NFT
              </p>
            </div>

            <div className="p-4 sm:p-6">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
                {/* Left Column - Image Upload */}
                <div className="w-full">
                  <ImageUpload
                    onImageSelect={handleImageSelect}
                    imagePreview={imagePreview}
                    isUploading={mintingState.isUploading}
                  />
                </div>

                {/* Right Column - Metadata Form */}
                <div className="w-full">
                  <MintingForm
                    nftData={nftData}
                    quantity={quantity}
                    onMetadataChange={handleMetadataChange}
                    onQuantityChange={setQuantity}
                    onMint={handleMint}
                    isLoading={mintingState.isUploading || mintingState.isMinting}
                    hasImage={!!imageFile}
                    contract={contract}
                  />
                </div>
              </div>

              {/* Error Display */}
              {mintingState.error && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-red-50 border border-red-200 rounded-md">
                  <div className="flex">
                    <AlertCircle className="h-5 w-5 text-red-400 flex-shrink-0" />
                    <div className="ml-3 min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-red-800">Minting Failed</h3>
                      <p className="mt-1 text-sm text-red-700 break-words">{mintingState.error}</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Progress Indicator */}
              {(mintingState.isUploading || mintingState.isMinting) && (
                <div className="mt-4 sm:mt-6 p-3 sm:p-4 bg-blue-50 border border-blue-200 rounded-md">
                  <div className="flex items-start">
                    <Loader2 className="h-5 w-5 text-blue-600 animate-spin flex-shrink-0 mt-0.5" />
                    <div className="ml-3 min-w-0 flex-1">
                      <h3 className="text-sm font-medium text-blue-800">
                        {mintingState.isUploading ? 'Uploading to IPFS...' : 'Minting NFT...'}
                      </h3>
                      <p className="mt-1 text-sm text-blue-700">
                        {mintingState.isUploading 
                          ? 'Please wait while we upload your image and metadata to IPFS via our Django backend'
                          : 'Please confirm the transaction in your wallet and wait for blockchain confirmation'
                        }
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
