#!/usr/bin/env bash
# Build script for Render deployment

set -o errexit  # exit on error

echo "🚀 Starting Render deployment build..."

echo "📦 Installing Python dependencies..."
pip install -r requirements.txt

echo "🗃️ Collecting static files..."
python manage.py collectstatic --no-input

echo "📊 Running database migrations..."
python manage.py migrate

echo "✅ Build completed successfully!"