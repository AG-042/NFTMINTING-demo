"""
Production settings for NFT Minting Backend on Render
"""

import os
import dj_database_url
from decouple import config
from .settings import *

# Production settings
DEBUG = False

# Security settings for production
SECRET_KEY = config('DJANGO_SECRET_KEY', default='your-secret-key-change-in-production')

# Allowed hosts - include your Render app URL
ALLOWED_HOSTS = config(
    'ALLOWED_HOSTS',
    default='*.onrender.com,localhost,127.0.0.1',
    cast=lambda v: [s.strip() for s in v.split(',')]
)

# Database configuration for Render PostgreSQL
if 'DATABASE_URL' in os.environ:
    DATABASES = {
        'default': dj_database_url.parse(os.environ.get('DATABASE_URL'))
    }

# Security settings
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True
X_FRAME_OPTIONS = 'DENY'
SECURE_HSTS_SECONDS = 31536000 if not DEBUG else 0
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True

# CORS settings for production
CORS_ALLOWED_ORIGINS = [
    "https://nft-minting-frontend.onrender.com",
    "http://localhost:3000",
    "http://127.0.0.1:3000",
]

# Add your frontend domain when deployed
CORS_ALLOW_CREDENTIALS = True

# Static files configuration for Render
STATIC_URL = '/static/'
STATIC_ROOT = os.path.join(BASE_DIR, 'staticfiles')
STATICFILES_STORAGE = 'whitenoise.storage.CompressedManifestStaticFilesStorage'

# Media files
MEDIA_URL = '/media/'
MEDIA_ROOT = os.path.join(BASE_DIR, 'media')

# Logging configuration for production
LOGGING = {
    'version': 1,
    'disable_existing_loggers': False,
    'formatters': {
        'verbose': {
            'format': '{levelname} {asctime} {module} {process:d} {thread:d} {message}',
            'style': '{',
        },
    },
    'handlers': {
        'console': {
            'level': 'INFO',
            'class': 'logging.StreamHandler',
            'formatter': 'verbose',
        },
    },
    'root': {
        'handlers': ['console'],
        'level': 'INFO',
    },
    'loggers': {
        'django': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
        'nfts': {
            'handlers': ['console'],
            'level': 'INFO',
            'propagate': False,
        },
    },
}

# Cache configuration (optional - for better performance)
CACHES = {
    'default': {
        'BACKEND': 'django.core.cache.backends.db.DatabaseCache',
        'LOCATION': 'cache_table',
    }
}

# Email configuration (if needed for notifications)
EMAIL_BACKEND = 'django.core.mail.backends.console.EmailBackend'

# Session configuration
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SESSION_COOKIE_HTTPONLY = True
CSRF_COOKIE_HTTPONLY = True

# Filebase IPFS Configuration (same as development)
FILEBASE_ACCESS_KEY = config('FILEBASE_ACCESS_KEY', default='')
FILEBASE_SECRET_KEY = config('FILEBASE_SECRET_KEY', default='')
FILEBASE_BUCKET_NAME = config('FILEBASE_BUCKET_NAME', default='nft-minting-bucket')
