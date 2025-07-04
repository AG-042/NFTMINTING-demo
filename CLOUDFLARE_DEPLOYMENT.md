# NFT Minting Platform - Cloudflare Pages Deployment Guide

## 🚀 Quick Deployment Steps

### 1. Connect Repository to Cloudflare Pages

1. Go to [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. Navigate to **Pages** → **Create a project**
3. Connect to your GitHub repository: `nftminting-demo`
4. Select the repository and branch (`main` or `master`)

### 2. Configure Build Settings

Set the following build configuration in Cloudflare Pages:

- **Framework preset**: `Next.js (Static HTML Export)`
- **Build command**: `npm run build:export`
- **Build output directory**: `out`
- **Root directory**: `frontend`
- **Node.js version**: `18.x` or `20.x`

### 3. Environment Variables

Add these environment variables in Cloudflare Pages dashboard:



### 4. Custom Domain (Optional)

1. In Cloudflare Pages, go to **Custom domains**
2. Add your domain (e.g., `nft-minting.yourname.com`)
3. Update DNS settings as instructed

## 🔧 Build Configuration

The frontend is configured with:

- ✅ **Static Export**: Optimized for Cloudflare Pages
- ✅ **Image Optimization**: Disabled for static hosting
- ✅ **Security Headers**: HTTPS, XSS protection, etc.
- ✅ **API Proxying**: Routes `/api/*` to backend
- ✅ **SPA Routing**: All routes serve `index.html`

## 📁 Key Files

- `next.config.cloudflare.js` - Cloudflare-optimized Next.js config
- `_redirects` - Cloudflare Pages routing rules
- `.env.production` - Production environment template
- `build.sh` - Custom build script (if needed)

## 🔗 Deployment URLs

After deployment, you'll get:
- **Production URL**: `https://nft-minting-xxx.pages.dev`
- **Preview URLs**: For each commit/PR
- **Custom Domain**: Your configured domain

## 🛠️ Manual Deployment (Alternative)

If you prefer manual deployment:

```bash
# In the frontend directory
npm install
npm run build:export

# Upload the 'out' folder to Cloudflare Pages
```

## 🔒 Security Features

- All sensitive API keys removed from frontend
- HTTPS enforced
- Security headers configured
- CORS properly configured with backend
- No client-side IPFS credentials

## 📊 Performance Optimizations

- Static site generation
- Image optimization disabled (required for static export)
- Webpack bundle optimization
- Tree shaking enabled
- Minification enabled

## 🌐 Backend Integration

The frontend connects to:
- **Backend API**: `https://nft-minting-backend-bq0t.onrender.com`
- **IPFS Gateway**: `https://ipfs.filebase.io/ipfs/`
- **Blockchain**: Sepolia testnet

## 🚨 Important Notes

1. **Environment Variables**: Must be set in Cloudflare Pages dashboard
2. **API Calls**: All go through the Django backend (no direct IPFS)
3. **Wallet Connection**: Uses Reown (WalletConnect v3)
4. **Responsive Design**: Optimized for all devices
5. **Error Handling**: Comprehensive error messages

## 📈 Monitoring

Monitor your deployment:
- Cloudflare Analytics
- Real User Monitoring (RUM)
- Web Vitals
- Error tracking

## 🔄 Auto-Deployment

Cloudflare Pages will automatically:
- Deploy on every push to main branch
- Create preview deployments for PRs
- Run the build process
- Update the live site

## 🎯 Next Steps

1. Deploy to Cloudflare Pages
2. Test all functionality
3. Configure custom domain
4. Set up monitoring
5. Add any additional analytics

Your NFT minting platform will be live at a globally distributed CDN with excellent performance!
