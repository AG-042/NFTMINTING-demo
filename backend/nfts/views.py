from rest_framework import views, status, generics
from rest_framework.response import Response
from rest_framework.parsers import MultiPartParser, FormParser, JSONParser
from django.conf import settings
from django.utils import timezone
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods
from django.db import connection
import uuid
import time
import logging
import json

from .models import NFTMetadata, NFTAttribute, UploadSession, NFTCollection
from .services import filebase_service
from .serializers import (
    ImageUploadSerializer,
    MetadataUploadSerializer, 
    NFTMetadataSerializer,
    NFTCollectionSerializer,
    UploadSessionSerializer,
    CreateNFTSerializer
)

logger = logging.getLogger(__name__)

# Simple test view
def test_api(request):
    return JsonResponse({
        'success': True,
        'message': 'NFT API is working!',
        'timestamp': timezone.now().isoformat(),
        'version': '1.0.0'
    })

# Health check endpoint for deployment
def health_check(request):
    """Health check endpoint for monitoring and deployment verification"""
    try:
        # Check IPFS service configuration
        ipfs_configured = all([
            settings.FILEBASE_ACCESS_KEY,
            settings.FILEBASE_SECRET_KEY,
            settings.FILEBASE_BUCKET_NAME
        ])
        
        return JsonResponse({
            'status': 'healthy',
            'timestamp': timezone.now().isoformat(),
            'services': {
                'ipfs': 'configured' if ipfs_configured else 'not_configured'
            },
            'environment': 'production' if not settings.DEBUG else 'development'
        })
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return JsonResponse({
            'status': 'unhealthy',
            'error': str(e),
            'timestamp': timezone.now().isoformat()
        }, status=500)

# Simple image upload test view  
@csrf_exempt
@require_http_methods(["POST"])
def upload_image_test(request):
    try:
        if 'image' not in request.FILES:
            return JsonResponse({
                'success': False,
                'error': 'No image file provided'
            }, status=400)
        
        image_file = request.FILES['image']
        
        # Mock response for now
        return JsonResponse({
            'success': True,
            'message': 'Image upload endpoint working',
            'filename': image_file.name,
            'size': image_file.size,
            'content_type': image_file.content_type
        })
        
    except Exception as e:
        return JsonResponse({
            'success': False,
            'error': str(e)
        }, status=500)


class UploadImageView(views.APIView):
    """API endpoint for uploading images to IPFS via Filebase"""
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Upload image to IPFS"""
        try:
            # Validate request data
            serializer = ImageUploadSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': 'Invalid image data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            image_file = serializer.validated_data['image']
            
            # Upload image to IPFS
            try:
                upload_result = filebase_service.upload_image(image_file)
                
                logger.info(f"Successfully uploaded image: {upload_result['ipfs_hash']}")
                
                return Response({
                    'success': True,
                    **upload_result
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                logger.error(f"Image upload failed: {str(e)}")
                
                return Response({
                    'success': False,
                    'error': 'Failed to upload image to IPFS',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Unexpected error in image upload: {str(e)}")
            
            return Response({
                'success': False,
                'error': 'Internal server error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CreateNFTView(views.APIView):
    """API endpoint for creating complete NFT (image + metadata) in one request"""
    parser_classes = [MultiPartParser, FormParser]
    
    def post(self, request):
        """Create complete NFT with image and metadata"""
        start_time = time.time()
        session_id = str(uuid.uuid4())
        
        try:
            # Parse attributes if provided
            if 'attributes' in request.data and request.data['attributes']:
                try:
                    attributes = json.loads(request.data['attributes'])
                    request.data._mutable = True
                    request.data['attributes'] = attributes
                    request.data._mutable = False
                except json.JSONDecodeError:
                    return Response({
                        'success': False,
                        'error': 'Invalid attributes JSON'
                    }, status=status.HTTP_400_BAD_REQUEST)
            
            # Validate request data
            serializer = CreateNFTSerializer(data=request.data)
            if not serializer.is_valid():
                return Response({
                    'success': False,
                    'error': 'Invalid request data',
                    'details': serializer.errors
                }, status=status.HTTP_400_BAD_REQUEST)
            
            data = serializer.validated_data
            
            # Create upload session
            upload_session = UploadSession.objects.create(
                session_id=session_id,
                original_filename=data['image'].name,
                file_size=data['image'].size,
                content_type=data['image'].content_type,
                upload_status='uploading'
            )
            
            try:
                # Upload complete NFT (image + metadata)
                upload_result = filebase_service.upload_complete_nft(
                    name=data['name'],
                    description=data['description'],
                    attributes=data.get('attributes', []),
                    image_file=data['image']
                )
                
                # Create NFT metadata record
                nft_metadata = NFTMetadata.objects.create(
                    name=data['name'],
                    description=data['description'],
                    image_ipfs_hash=upload_result['image_ipfs_hash'],
                    image_ipfs_url=upload_result['image_ipfs_url'],
                    metadata_ipfs_hash=upload_result['metadata_ipfs_hash'],
                    metadata_ipfs_url=upload_result['metadata_ipfs_url'],
                    original_filename=upload_result['original_filename'],
                    file_size=upload_result['file_size'],
                    content_type='image/jpeg',
                    owner_address=data['owner_address'],
                    collection_id=data.get('collection_id')
                )
                
                # Create attributes
                for attr in data.get('attributes', []):
                    NFTAttribute.objects.create(
                        nft=nft_metadata,
                        trait_type=attr['trait_type'],
                        value=str(attr['value']),
                        display_type=attr.get('display_type', '')
                    )
                
                # Update upload session
                upload_session.upload_status = 'completed'
                upload_session.nft_metadata = nft_metadata
                upload_session.progress_percentage = 100.0
                upload_session.save()
                
                execution_time = time.time() - start_time
                logger.info(f"NFT creation completed in {execution_time:.2f}s")
                
                return Response({
                    'success': True,
                    'session_id': session_id,
                    'nft_id': nft_metadata.id,
                    'execution_time': execution_time,
                    **upload_result
                }, status=status.HTTP_201_CREATED)
                
            except Exception as e:
                # Update upload session with error
                upload_session.upload_status = 'failed'
                upload_session.error_message = str(e)
                upload_session.save()
                
                logger.error(f"NFT creation failed: {str(e)}")
                
                return Response({
                    'success': False,
                    'session_id': session_id,
                    'error': 'Failed to create NFT',
                    'details': str(e)
                }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
                
        except Exception as e:
            logger.error(f"Unexpected error in NFT creation: {str(e)}")
            
            return Response({
                'success': False,
                'error': 'Internal server error',
                'details': str(e)
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class NFTMetadataListView(generics.ListAPIView):
    """API endpoint for listing NFT metadata"""
    queryset = NFTMetadata.objects.all()
    serializer_class = NFTMetadataSerializer


class NFTMetadataDetailView(generics.RetrieveAPIView):
    """API endpoint for retrieving specific NFT metadata"""
    queryset = NFTMetadata.objects.all()
    serializer_class = NFTMetadataSerializer
    lookup_field = 'id'
