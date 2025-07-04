from django.urls import path
from . import views

app_name = 'nfts'

urlpatterns = [
    # Test endpoints
    path('test/', views.test_api, name='test'),
    path('upload-image-test/', views.upload_image_test, name='upload-image-test'),
    
    # Main NFT endpoints
    path('create-nft/', views.CreateNFTView.as_view(), name='create-nft'),
    path('upload-image/', views.UploadImageView.as_view(), name='upload-image'),
    path('nfts/', views.NFTMetadataListView.as_view(), name='nft-list'),
    path('nfts/<int:id>/', views.NFTMetadataDetailView.as_view(), name='nft-detail'),
]
