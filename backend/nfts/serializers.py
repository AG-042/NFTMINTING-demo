from rest_framework import serializers
from .models import NFTMetadata, NFTAttribute, NFTCollection, UploadSession


class NFTAttributeSerializer(serializers.ModelSerializer):
    """Serializer for NFT attributes"""
    
    class Meta:
        model = NFTAttribute
        fields = ['trait_type', 'value', 'display_type']


class NFTMetadataSerializer(serializers.ModelSerializer):
    """Serializer for NFT metadata"""
    attributes = NFTAttributeSerializer(many=True, read_only=True)
    
    class Meta:
        model = NFTMetadata
        fields = [
            'id', 'token_id', 'name', 'description',
            'image_ipfs_hash', 'image_ipfs_url',
            'metadata_ipfs_hash', 'metadata_ipfs_url',
            'original_filename', 'file_size', 'content_type',
            'contract_address', 'owner_address', 'minted_at',
            'transaction_hash', 'collection', 'attributes',
            'created_at', 'updated_at'
        ]


class NFTCollectionSerializer(serializers.ModelSerializer):
    """Serializer for NFT collections"""
    
    class Meta:
        model = NFTCollection
        fields = ['id', 'name', 'description', 'symbol', 'contract_address', 'creator', 'created_at']


class UploadSessionSerializer(serializers.ModelSerializer):
    """Serializer for upload sessions"""
    
    class Meta:
        model = UploadSession
        fields = [
            'session_id', 'original_filename', 'file_size', 'content_type',
            'upload_status', 'bytes_uploaded', 'progress_percentage',
            'error_message', 'created_at', 'updated_at'
        ]


class ImageUploadSerializer(serializers.Serializer):
    """Serializer for image upload validation"""
    image = serializers.ImageField()
    
    def validate_image(self, value):
        """Validate image file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file too large. Maximum size is 10MB.")
        
        # Check content type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid image type. Allowed: JPEG, PNG, GIF, WebP")
        
        return value


class MetadataUploadSerializer(serializers.Serializer):
    """Serializer for metadata upload validation"""
    metadata = serializers.JSONField()
    
    def validate_metadata(self, value):
        """Validate metadata structure"""
        required_fields = ['name', 'description', 'image']
        
        for field in required_fields:
            if field not in value:
                raise serializers.ValidationError(f"Missing required field: {field}")
        
        # Validate attributes if present
        if 'attributes' in value:
            attributes = value['attributes']
            if not isinstance(attributes, list):
                raise serializers.ValidationError("Attributes must be a list")
            
            for attr in attributes:
                if not isinstance(attr, dict):
                    raise serializers.ValidationError("Each attribute must be an object")
                if 'trait_type' not in attr or 'value' not in attr:
                    raise serializers.ValidationError("Each attribute must have trait_type and value")
        
        return value


class CreateNFTSerializer(serializers.Serializer):
    """Serializer for complete NFT creation"""
    name = serializers.CharField(max_length=200)
    description = serializers.CharField()
    image = serializers.ImageField()
    attributes = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        allow_empty=True
    )
    collection_id = serializers.IntegerField(required=False)
    owner_address = serializers.CharField(max_length=42)
    
    def validate_image(self, value):
        """Validate image file"""
        # Check file size (max 10MB)
        if value.size > 10 * 1024 * 1024:
            raise serializers.ValidationError("Image file too large. Maximum size is 10MB.")
        
        # Check content type
        allowed_types = ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
        if value.content_type not in allowed_types:
            raise serializers.ValidationError("Invalid image type. Allowed: JPEG, PNG, GIF, WebP")
        
        return value
    
    def validate_attributes(self, value):
        """Validate attributes structure"""
        if not value:
            return []
        
        for attr in value:
            if not isinstance(attr, dict):
                raise serializers.ValidationError("Each attribute must be an object")
            if 'trait_type' not in attr or 'value' not in attr:
                raise serializers.ValidationError("Each attribute must have trait_type and value")
        
        return value
    
    def validate_owner_address(self, value):
        """Validate Ethereum address format"""
        if not value.startswith('0x') or len(value) != 42:
            raise serializers.ValidationError("Invalid Ethereum address format")
        
        return value.lower()  # Normalize to lowercase
