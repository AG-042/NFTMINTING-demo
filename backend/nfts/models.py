from django.db import models
from django.utils import timezone
import uuid


class NFTCollection(models.Model):
    """Model for NFT Collections"""
    name = models.CharField(max_length=200)
    description = models.TextField(blank=True)
    symbol = models.CharField(max_length=10, blank=True)
    contract_address = models.CharField(max_length=42, blank=True)
    creator = models.CharField(max_length=42)  # Wallet address
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return self.name


class NFTMetadata(models.Model):
    """Model for storing NFT metadata and IPFS information"""
    token_id = models.BigIntegerField(null=True, blank=True)
    name = models.CharField(max_length=200)
    description = models.TextField()
    
    # IPFS URLs
    image_ipfs_hash = models.CharField(max_length=100)
    image_ipfs_url = models.URLField()
    metadata_ipfs_hash = models.CharField(max_length=100)
    metadata_ipfs_url = models.URLField()
    
    # File information
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    content_type = models.CharField(max_length=100)
    
    # Blockchain information
    contract_address = models.CharField(max_length=42, blank=True)
    owner_address = models.CharField(max_length=42)
    minted_at = models.DateTimeField(null=True, blank=True)
    transaction_hash = models.CharField(max_length=66, blank=True)
    
    # Collection
    collection = models.ForeignKey(NFTCollection, on_delete=models.SET_NULL, null=True, blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    class Meta:
        ordering = ['-created_at']
    
    def __str__(self):
        return f"{self.name} (Token #{self.token_id})"


class NFTAttribute(models.Model):
    """Model for NFT attributes/traits"""
    nft = models.ForeignKey(NFTMetadata, related_name='attributes', on_delete=models.CASCADE)
    trait_type = models.CharField(max_length=100)
    value = models.CharField(max_length=200)
    display_type = models.CharField(max_length=50, blank=True)  # For numeric traits
    
    def __str__(self):
        return f"{self.trait_type}: {self.value}"


class UploadSession(models.Model):
    """Model for tracking upload sessions"""
    
    STATUS_CHOICES = [
        ('uploading', 'Uploading'),
        ('processing', 'Processing'),
        ('completed', 'Completed'),
        ('failed', 'Failed'),
    ]
    
    session_id = models.UUIDField(default=uuid.uuid4, unique=True)
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField()
    content_type = models.CharField(max_length=100)
    upload_status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='uploading')
    
    # Progress tracking
    bytes_uploaded = models.BigIntegerField(default=0)
    progress_percentage = models.FloatField(default=0.0)
    
    # Results
    nft_metadata = models.ForeignKey(NFTMetadata, on_delete=models.CASCADE, null=True, blank=True)
    error_message = models.TextField(blank=True)
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"Upload {self.session_id} - {self.upload_status}"
