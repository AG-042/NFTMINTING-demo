# 🔧 Render Environment Variables Update Guide

## URGENT: Update Backend CORS Configuration

The backend deployment needs the environment variables updated in the Render dashboard to allow requests from Cloudflare Pages.

### Step 1: Login to Render Dashboard

1. Go to https://dashboard.render.com/
2. Navigate to your backend service: **nft-minting-backend-bq0t**

### Step 2: Update Environment Variables

Go to **Environment** tab and update/add these variables:

```bash
# Update CORS_ALLOWED_ORIGINS to include Cloudflare Pages
CORS_ALLOWED_ORIGINS=http://localhost:3000,http://127.0.0.1:3000,https://nft-minting-backend-bq0t.onrender.com,https://nftminting-demo.pages.dev

# Ensure ALLOWED_HOSTS is correct (no https:// prefix)
ALLOWED_HOSTS=localhost,127.0.0.1,nft-minting-backend-bq0t.onrender.com,nftminting-demo.pages.dev

# Verify these are still set correctly
FILEBASE_ACCESS_KEY=AEE78619B863E01AF900
FILEBASE_SECRET_KEY=PBfVrbkRTOLUgEVyuAef95hvsMwJHUrzoUHZJ6sa
FILEBASE_BUCKET_NAME=nft-minting
```

### Step 3: Deploy Changes

1. Click **Save Changes** - This will trigger a new deployment
2. Wait for deployment to complete (~2-3 minutes)
3. Check deployment logs for any errors

### Step 4: Test the Fix

After the deployment completes, test the API:

```bash
# Test CORS preflight
curl -v -X OPTIONS https://nft-minting-backend-bq0t.onrender.com/api/create-nft/ \
  -H "Origin: https://nftminting-demo.pages.dev" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: Content-Type"

# Test health endpoint
curl https://nft-minting-backend-bq0t.onrender.com/api/health/
```

### Expected Results

After the update, the CORS preflight request should return headers like:
```
Access-Control-Allow-Origin: https://nftminting-demo.pages.dev
Access-Control-Allow-Methods: GET, POST, OPTIONS
Access-Control-Allow-Headers: Content-Type
```

## Alternative: Automatic Deployment

The git push has already triggered an automatic deployment with the updated settings. The deployment should complete in ~2-3 minutes and the CORS issue should be resolved.

## Verification

Once deployed, your NFT minting platform at https://nftminting-demo.pages.dev/ should be able to:

1. ✅ Connect to wallets
2. ✅ Upload images to IPFS via backend
3. ✅ Mint NFTs on Sepolia testnet
4. ✅ Display transaction status

## 🚨 If Issues Persist

If you still get CORS errors after deployment:

1. **Check Render Logs**: Go to Render dashboard → Logs tab
2. **Verify Environment Variables**: Ensure CORS_ALLOWED_ORIGINS includes the exact Cloudflare Pages URL
3. **Clear Browser Cache**: Hard refresh the frontend (Ctrl+Shift+R)
4. **Check Network Tab**: Look for preflight OPTIONS requests in browser dev tools

The fix should resolve the "Network error" issue you're experiencing!
