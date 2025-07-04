// Main IPFS Upload Interface - Now using Django Backend
import { uploadNFTViaBackend, testBackendConnection } from './backendUpload';
import { NFTAttribute } from '@/types';

// Interface for the upload response
export interface UploadResult {
  imageUpload: {
    ipfs_hash: string;
    ipfs_url: string;
  };
  metadataUpload: {
    ipfs_hash: string;
    ipfs_url: string;
  };
}

/**
 * Main upload function that uses Django backend for IPFS integration
 */
export async function uploadNFTToIPFS(
  imageFile: File,
  name: string,
  description: string,
  attributes: NFTAttribute[] = []
): Promise<UploadResult> {
  try {
    console.log('🚀 Starting NFT upload via Django backend...');
    
    // Validate inputs
    if (!imageFile) {
      throw new Error('No image file provided');
    }

    if (!name || !description) {
      throw new Error('Name and description are required');
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
    if (!allowedTypes.includes(imageFile.type)) {
      throw new Error('Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.');
    }

    // Validate file size (10MB max)
    if (imageFile.size > 10 * 1024 * 1024) {
      throw new Error('File size too large. Maximum size is 10MB.');
    }

    // Test backend connection first
    const connectionTest = await testBackendConnection();
    if (!connectionTest.success) {
      throw new Error(`Backend connection failed: ${connectionTest.error}`);
    }

    console.log('✅ Backend connection successful');

    // For now, use a default owner address - in real app this would come from wallet
    const defaultOwnerAddress = '0x0000000000000000000000000000000000000000';

    // Upload via backend - NO FALLBACKS
    const result = await uploadNFTViaBackend(
      imageFile,
      name,
      description,
      attributes,
      defaultOwnerAddress
    );

    if (!result.success) {
      throw new Error(result.error || 'Backend upload failed');
    }

    // Validate that we got real IPFS hashes - NO FALLBACKS
    if (!result.image_ipfs_hash || !result.image_ipfs_url) {
      throw new Error('Backend failed to return image IPFS data');
    }

    if (!result.metadata_ipfs_hash || !result.metadata_ipfs_url) {
      throw new Error('Backend failed to return metadata IPFS data');
    }

    console.log('✅ NFT upload completed successfully via backend');

    return {
      imageUpload: {
        ipfs_hash: result.image_ipfs_hash,
        ipfs_url: result.image_ipfs_url
      },
      metadataUpload: {
        ipfs_hash: result.metadata_ipfs_hash,
        ipfs_url: result.metadata_ipfs_url
      }
    };

  } catch (error: any) {
    console.error('❌ NFT upload failed:', error);
    
    // Provide user-friendly error messages
    let userMessage = error.message;
    
    if (error.message.includes('credentials not configured')) {
      userMessage = 'IPFS service not configured. Please check your Filebase credentials.';
    } else if (error.message.includes('network') || error.message.includes('fetch')) {
      userMessage = 'Network error. Please check your connection and try again.';
    } else if (error.message.includes('file type')) {
      userMessage = 'Invalid file type. Please upload a JPEG, PNG, GIF, or WebP image.';
    } else if (error.message.includes('file size')) {
      userMessage = 'File too large. Please use an image smaller than 10MB.';
    }
    
    throw new Error(userMessage);
  }
}

/**
 * Get IPFS gateway URL for viewing content
 */
export function getIPFSGatewayUrl(ipfsHash: string): string {
  // Use standard public IPFS gateways since we're not storing Filebase credentials in frontend
  return `https://ipfs.filebase.io/ipfs/${ipfsHash}`;
}

/**
 * Test connection to backend API
 */
export async function testIPFSConnection(): Promise<boolean> {
  try {
    const result = await testBackendConnection();
    return result.success;
  } catch (error) {
    console.error('IPFS connection test failed:', error);
    return false;
  }
}

/**
 * Validate IPFS hash format
 */
export function validateIPFSHash(hash: string): boolean {
  // IPFS v0 hash (Qm...) or v1 hash (baf...)
  const ipfsHashRegex = /^(Qm[1-9A-HJ-NP-Za-km-z]{44}|baf[a-z0-9]{56})$/;
  return ipfsHashRegex.test(hash);
}