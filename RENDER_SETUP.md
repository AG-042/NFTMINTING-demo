# 🚀 Manual Render Deployment Guide

## Step-by-Step Manual Deployment Process

### Step 1: Create PostgreSQL Database

1. **Go to Render Dashboard**: [https://dashboard.render.com](https://dashboard.render.com)
2. **Click "New" → "PostgreSQL"**
3. **Configure Database**:
   - **Name**: `nft-minting-db`
   - **Database**: `nft_minting_db`
   - **User**: `nft_user`
   - **Region**: `Oregon` (or closest to you)
   - **PostgreSQL Version**: `15`
   - **Plan**: `Free` (1GB storage, good for development)

4. **After Creation**:
   - Copy the **External Database URL**
   - It will look like: `postgresql://nft_user:password@hostname:5432/nft_minting_db`
   - Save this URL - you'll need it for the web service

### Step 2: Create Web Service (Django Backend)

1. **Click "New" → "Web Service"**
2. **Connect Repository**:
   - Choose "Build and deploy from a Git repository"
   - Connect your GitHub account
   - Select: `AG-042/NFTMINTING-demo`

3. **Configure Service**:
   - **Name**: `nft-minting-backend`
   - **Region**: `Oregon` (same as database)
   - **Branch**: `main`
   - **Root Directory**: `backend`
   - **Runtime**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt && python manage.py collectstatic --noinput`
   - **Start Command**: `gunicorn nft_backend.wsgi:application --bind 0.0.0.0:$PORT`
   - **Plan**: `Free` (512MB RAM, good for development)

### Step 3: Environment Variables

Add these environment variables in the Render web service dashboard:

#### Required Variables:
```bash
# Django Configuration
DJANGO_SECRET_KEY=your-super-secret-key-here-change-this
DEBUG=false
ALLOWED_HOSTS=your-app-name.onrender.com,localhost,127.0.0.1

# Database (Use the External Database URL from Step 1)
DATABASE_URL=postgresql://nft_user:password@hostname:5432/nft_minting_db

# Filebase IPFS Configuration
FILEBASE_ACCESS_KEY=AEE78619B863E01AF900
FILEBASE_SECRET_KEY=PBfVrbkRTOLUgEVyuAef95hvsMwJHUrzoUHZJ6sa
FILEBASE_BUCKET_NAME=nft-minting

# Production Settings
RENDER=true
```

#### Optional Variables:
```bash
# CORS Configuration (add your frontend domain when deployed)
CORS_ALLOWED_ORIGINS=http://localhost:3000,https://your-frontend.onrender.com

# Cache and Performance
DJANGO_SETTINGS_MODULE=nft_backend.settings_production
```

### Step 4: Frontend Deployment (Optional - Static Site)

1. **Click "New" → "Static Site"**
2. **Configure**:
   - **Name**: `nft-minting-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `out`

3. **Frontend Environment Variables**:
```bash
NEXT_PUBLIC_CONTRACT_ADDRESS=0x1355c2F889179B9cAc9eed95d1a53fD897efbDfD
NEXT_PUBLIC_CHAIN_ID=11155111
NEXT_PUBLIC_NETWORK_NAME=sepolia
NEXT_PUBLIC_REOWN_PROJECT_ID=your-reown-project-id
NEXT_PUBLIC_API_BASE_URL=https://your-backend-app.onrender.com
```

## 🔧 Database Configuration Details

### Connection String Format
```
postgresql://[username]:[password]@[hostname]:[port]/[database_name]
```

### Example URLs:
- **External**: `postgresql://nft_user:abc123@dpg-abc123-a.oregon-postgres.render.com:5432/nft_minting_db`
- **Internal**: `postgresql://nft_user:abc123@dpg-abc123-a:5432/nft_minting_db`

Use the **External URL** for your Django application.

## 🚦 Deployment Status Checklist

- [ ] PostgreSQL database created and running
- [ ] Database URL copied and saved
- [ ] Web service created and connected to GitHub
- [ ] Environment variables configured
- [ ] Build command configured
- [ ] Start command configured
- [ ] First deployment triggered

## 🔍 Troubleshooting

### Common Issues:

1. **Build Failures**:
   - Check `requirements.txt` for correct versions
   - Ensure Python version compatibility
   - Review build logs in Render dashboard

2. **Database Connection Errors**:
   - Verify DATABASE_URL format
   - Check if database is in same region as web service
   - Ensure database is not paused

3. **Static Files Not Loading**:
   - Verify `collectstatic` runs in build command
   - Check `STATIC_ROOT` and `STATIC_URL` settings
   - Ensure WhiteNoise is configured

4. **CORS Errors**:
   - Add frontend domain to `CORS_ALLOWED_ORIGINS`
   - Update `ALLOWED_HOSTS` with backend domain

## 📊 Monitoring and Logs

- **Service Logs**: Render Dashboard → Service → Logs
- **Database Metrics**: Render Dashboard → Database → Metrics
- **Health Checks**: Automatic via Render platform

## 🔄 Updates and Redeployment

- **Auto-Deploy**: Enabled by default on `main` branch pushes
- **Manual Deploy**: Render Dashboard → Service → Manual Deploy
- **Rollback**: Available in deployment history

## 💰 Cost Estimation

### Free Tier Limits:
- **PostgreSQL**: 1GB storage, 97 connection hours/month
- **Web Service**: 512MB RAM, sleeps after 15min inactivity
- **Static Site**: 100GB bandwidth/month

### Paid Plans (when ready to scale):
- **PostgreSQL**: Starting at $7/month (256MB RAM, 1GB storage)
- **Web Service**: Starting at $7/month (512MB RAM, always on)
