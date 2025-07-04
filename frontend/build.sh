#!/bin/bash

# Cloudflare Pages Build Script for NFT Minting Frontend
# This script builds the Next.js application for static deployment

set -e

echo "🚀 Starting Cloudflare Pages build process..."

# Install dependencies
echo "📦 Installing dependencies..."
npm ci --frozen-lockfile

# Set production environment
export NODE_ENV=production

# Copy production config
echo "⚙️  Setting up production configuration..."
cp next.config.cloudflare.js next.config.js

# Type check
echo "🔍 Running type check..."
npm run type-check

# Build the application
echo "🏗️  Building Next.js application..."
npm run build:cloudflare

# Verify build output
echo "✅ Build completed successfully!"
ls -la out/

echo "📝 Build Summary:"
echo "- Build directory: out/"
echo "- Static files generated for Cloudflare Pages"
echo "- All assets optimized for production"

# Copy redirects file to output directory
if [ -f "_redirects" ]; then
  cp _redirects out/
  echo "- Redirects file copied to output"
fi

echo "🎉 Frontend ready for Cloudflare Pages deployment!"
