import os
import boto3
import json
import hashlib
import tempfile
import uuid
from PIL import Image
from django.conf import settings
from typing import Dict, Any, Optional, Tuple
from botocore.exceptions import ClientError
from botocore.config import Config
from io import BytesIO
import base64
import logging

logger = logging.getLogger(__name__)


class FilebaseService:
    """Service for uploading files to IPFS via Filebase S3-compatible API"""
    
    def __init__(self):
        self.access_key = settings.FILEBASE_ACCESS_KEY
        self.secret_key = settings.FILEBASE_SECRET_KEY
        self.bucket_name = settings.FILEBASE_BUCKET_NAME
        self.endpoint_url = 'https://s3.filebase.com'
        
        if not self.access_key or not self.secret_key:
            raise ValueError("Filebase credentials not configured")
        
        # Initialize S3 client for Filebase
        self.s3_client = boto3.client(
            's3',
            endpoint_url=self.endpoint_url,
            aws_access_key_id=self.access_key,
            aws_secret_access_key=self.secret_key,
            config=Config(
                region_name='us-east-1',  # Filebase uses us-east-1
                s3={'addressing_style': 'path'}
            )
        )
        
        # Ensure bucket exists
        self._ensure_bucket_exists()
    
    def _ensure_bucket_exists(self):
        """Ensure the bucket exists, create if it doesn't"""
        try:
            self.s3_client.head_bucket(Bucket=self.bucket_name)
            logger.info(f"Bucket {self.bucket_name} exists")
        except ClientError as e:
            error_code = e.response['Error']['Code']
            if error_code == '404':
                try:
                    self.s3_client.create_bucket(Bucket=self.bucket_name)
                    logger.info(f"Created Filebase bucket: {self.bucket_name}")
                except Exception as create_error:
                    logger.error(f"Failed to create bucket: {create_error}")
            else:
                logger.error(f"Error checking bucket: {e}")
    
    def _process_image(self, image_data: bytes, max_size: tuple = (2048, 2048)) -> bytes:
        """Process and optimize image for NFT"""
        try:
            # Open image
            image = Image.open(BytesIO(image_data))
            
            # Convert to RGB if necessary
            if image.mode in ('RGBA', 'P'):
                background = Image.new('RGB', image.size, (255, 255, 255))
                if image.mode == 'P':
                    image = image.convert('RGBA')
                if image.mode == 'RGBA':
                    background.paste(image, mask=image.split()[-1])
                image = background
            
            # Resize if too large
            if image.size[0] > max_size[0] or image.size[1] > max_size[1]:
                image.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save optimized image
            output = BytesIO()
            image.save(output, format='JPEG', quality=85, optimize=True)
            return output.getvalue()
            
        except Exception as e:
            logger.error(f"Image processing error: {e}")
            return image_data  # Return original if processing fails
    
    def upload_file_to_filebase(self, file_content: bytes, filename: str, content_type: str) -> str:
        """Upload file to Filebase and return IPFS CID"""
        try:
            # Generate unique key to avoid conflicts
            file_hash = hashlib.sha256(file_content).hexdigest()[:16]
            key = f"{file_hash}_{filename}"
            
            # Upload to Filebase
            response = self.s3_client.put_object(
                Bucket=self.bucket_name,
                Key=key,
                Body=file_content,
                ContentType=content_type,
                Metadata={
                    'original-filename': filename,
                    'upload-type': 'nft-file'
                }
            )
            
            # Wait a moment for Filebase to process the file
            import time
            time.sleep(1)
            
            # Get object info to retrieve IPFS CID
            obj_info = self.s3_client.head_object(
                Bucket=self.bucket_name,
                Key=key
            )
            
            # Filebase stores the IPFS CID in metadata
            ipfs_cid = obj_info.get('Metadata', {}).get('cid', '')
            
            # If CID not in metadata, try response headers
            if not ipfs_cid:
                headers = obj_info.get('ResponseMetadata', {}).get('HTTPHeaders', {})
                ipfs_cid = headers.get('x-amz-meta-cid', '')
            
            # If still no CID, throw error (no fallback to ETag)
            if not ipfs_cid:
                raise Exception(f"Failed to get IPFS CID from Filebase for {filename}")
            
            logger.info(f"Successfully uploaded {filename} to Filebase with CID: {ipfs_cid}")
            return ipfs_cid
            
        except ClientError as e:
            logger.error(f"Failed to upload to Filebase: {e}")
            raise Exception(f"Failed to upload to Filebase: {str(e)}")
    
    def upload_image(self, image_file) -> Dict[str, Any]:
        """Upload and optimize image, return IPFS URLs and metadata"""
        try:
            # Read image data
            image_data = image_file.read()
            
            # Validate image size (max 10MB)
            if len(image_data) > 10 * 1024 * 1024:
                raise ValueError("Image file too large. Maximum size is 10MB.")
            
            # Process image
            processed_image = self._process_image(image_data)
            
            # Upload to Filebase
            ipfs_cid = self.upload_file_to_filebase(
                processed_image,
                image_file.name,
                'image/jpeg'
            )
            
            return {
                'ipfs_hash': ipfs_cid,
                'ipfs_url': f"ipfs://{ipfs_cid}",
                'gateway_url': f"https://ipfs.filebase.io/ipfs/{ipfs_cid}",
                'original_filename': image_file.name,
                'file_size': len(processed_image),
                'content_type': 'image/jpeg'
            }
            
        except Exception as e:
            logger.error(f"Image upload failed: {e}")
            raise Exception(f"Image upload failed: {str(e)}")
    
    def upload_metadata(self, metadata: Dict[str, Any]) -> Dict[str, Any]:
        """Upload NFT metadata JSON to IPFS"""
        try:
            # Convert metadata to JSON
            metadata_json = json.dumps(metadata, indent=2)
            metadata_bytes = metadata_json.encode('utf-8')
            
            # Generate filename
            filename = f"metadata_{uuid.uuid4().hex}.json"
            
            # Upload to Filebase
            ipfs_cid = self.upload_file_to_filebase(
                metadata_bytes,
                filename,
                'application/json'
            )
            
            return {
                'ipfs_hash': ipfs_cid,
                'ipfs_url': f"ipfs://{ipfs_cid}",
                'gateway_url': f"https://ipfs.filebase.io/ipfs/{ipfs_cid}",
                'metadata': metadata
            }
            
        except Exception as e:
            logger.error(f"Metadata upload failed: {e}")
            raise Exception(f"Metadata upload failed: {str(e)}")
    
    def create_nft_metadata(self, name: str, description: str, image_ipfs_url: str, 
                           attributes: Optional[list] = None) -> Dict[str, Any]:
        """Create NFT metadata in OpenSea standard format"""
        metadata = {
            "name": name,
            "description": description,
            "image": image_ipfs_url,
            "attributes": attributes or []
        }
        
        return metadata
    
    def upload_complete_nft(self, name: str, description: str, attributes: list, 
                           image_file) -> Dict[str, Any]:
        """Complete NFT upload process: image + metadata"""
        try:
            # Step 1: Upload image
            image_result = self.upload_image(image_file)
            
            # Step 2: Create metadata
            metadata = self.create_nft_metadata(
                name=name,
                description=description,
                image_ipfs_url=image_result['ipfs_url'],
                attributes=attributes
            )
            
            # Step 3: Upload metadata
            metadata_result = self.upload_metadata(metadata)
            
            return {
                'image_ipfs_hash': image_result['ipfs_hash'],
                'image_ipfs_url': image_result['ipfs_url'],
                'image_gateway_url': image_result['gateway_url'],
                'metadata_ipfs_hash': metadata_result['ipfs_hash'],
                'metadata_ipfs_url': metadata_result['ipfs_url'],
                'metadata_gateway_url': metadata_result['gateway_url'],
                'metadata': metadata,
                'original_filename': image_result['original_filename'],
                'file_size': image_result['file_size']
            }
            
        except Exception as e:
            logger.error(f"Complete NFT upload failed: {e}")
            raise Exception(f"Complete NFT upload failed: {str(e)}")


# Create singleton instance
filebase_service = FilebaseService()
