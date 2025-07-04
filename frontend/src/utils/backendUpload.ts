// Backend Integration for NFT Minting Demo
// This replaces direct IPFS uploads with Django backend proxy

export interface BackendUploadResult {
  success: boolean;
  image_ipfs_hash?: string;
  image_ipfs_url?: string;
  metadata_ipfs_hash?: string;
  metadata_ipfs_url?: string;
  error?: string;
  details?: string;
}

/**
 * Upload NFT (image + metadata) via Django backend
 */
export async function uploadNFTViaBackend(
  imageFile: File,
  name: string,
  description: string,
  attributes: any[] = [],
  ownerAddress: string
): Promise<BackendUploadResult> {
  try {
    console.log('🚀 Starting NFT upload via Django backend...');
    
    // Validate inputs
    if (!imageFile) {
      throw new Error('No image file provided');
    }
    
    if (!name || !description) {
      throw new Error('Name and description are required');
    }
    
    if (!ownerAddress) {
      throw new Error('Owner address is required');
    }
    
    // Prepare form data
    const formData = new FormData();
    formData.append('image', imageFile);
    formData.append('name', name);
    formData.append('description', description);
    formData.append('owner_address', ownerAddress);
    
    // Add attributes if provided
    if (attributes && attributes.length > 0) {
      formData.append('attributes', JSON.stringify(attributes));
    }
    
    console.log('📤 Uploading to backend...', {
      filename: imageFile.name,
      size: imageFile.size,
      name,
      description,
      attributesCount: attributes.length
    });
    
    // Get backend URL from environment
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    // Upload to Django backend - use create-nft endpoint for complete NFT creation
    const response = await fetch(`${backendUrl}/api/create-nft/`, {
      method: 'POST',
      body: formData,
      // Don't set Content-Type header - let browser set it with boundary for FormData
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ Backend upload failed:', {
        status: response.status,
        statusText: response.statusText,
        error: errorText
      });
      
      throw new Error(`Backend upload failed: ${response.status} ${response.statusText}`);
    }
    
    const result = await response.json();
    
    if (!result.success) {
      console.error('❌ Backend upload error:', result);
      throw new Error(result.error || 'Backend upload failed');
    }
    
    console.log('✅ Backend upload successful:', result);
    
    // Validate that we got real IPFS hashes - NO FALLBACKS
    if (!result.image_ipfs_hash || !result.image_ipfs_url) {
      throw new Error('Backend failed to return image IPFS data');
    }

    if (!result.metadata_ipfs_hash || !result.metadata_ipfs_url) {
      throw new Error('Backend failed to return metadata IPFS data');
    }
    
    // Return real IPFS values from backend - NO FALLBACKS
    return {
      success: true,
      image_ipfs_hash: result.image_ipfs_hash,
      image_ipfs_url: result.image_ipfs_url,
      metadata_ipfs_hash: result.metadata_ipfs_hash,
      metadata_ipfs_url: result.metadata_ipfs_url,
    };
    
  } catch (error) {
    console.error('❌ NFT upload via backend failed:', error);
    
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Test backend connection
 */
export async function testBackendConnection(): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const backendUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    
    const response = await fetch(`${backendUrl}/api/test/`);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const result = await response.json();
    
    return {
      success: true,
      message: result.message || 'Backend connection successful'
    };
    
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to connect to backend'
    };
  }
}

/**
 * Legacy compatibility function - routes to backend
 */
export async function uploadNFTToIPFS(
  imageFile: File,
  name: string,
  description: string,
  attributes: any[] = []
): Promise<any> {
  // For compatibility, we'll need a default owner address
  // In a real app, this would come from the connected wallet
  const defaultOwnerAddress = '0x0000000000000000000000000000000000000000';
  
  const result = await uploadNFTViaBackend(
    imageFile, 
    name, 
    description, 
    attributes, 
    defaultOwnerAddress
  );
  
  if (!result.success) {
    throw new Error(result.error || 'Upload failed');
  }
  
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
}
