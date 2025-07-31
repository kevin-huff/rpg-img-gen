# Railway Deployment Guide

## 🚂 Railway Deployment Steps

### 1. Prepare Your Repository
- Push your code to GitHub
- Ensure all files are committed

### 2. Railway Project Setup
1. Go to [Railway.app](https://railway.app)
2. Sign in with GitHub
3. Click "New Project" → "Deploy from GitHub repo"
4. Select your `rpg-img-gen` repository

### 3. Environment Variables
Set these in Railway Dashboard → Variables:

```bash
NODE_ENV=production
CORS_ORIGIN=https://your-app-name.railway.app
SESSION_SECRET=your-long-random-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

**Important Notes:**
- **Don't set** `DB_PATH` or `UPLOAD_DIR` - Railway auto-configures these
- Replace `your-app-name` with your actual Railway subdomain
- Use a strong, random `SESSION_SECRET` (at least 32 characters)
- Choose a secure `ADMIN_PASSWORD`

### 4. Persistent Storage
Railway will automatically create persistent volumes for:
- `/app/data/` - Database and uploads
- The app detects Railway and adjusts paths

### 5. Custom Domain (Optional)
1. Railway Dashboard → Settings → Domains
2. Add your custom domain
3. Update `CORS_ORIGIN` environment variable

### 6. Build Configuration
Railway uses the included:
- `railway.json` - Build and deploy config
- Frontend automatically detects production environment
- API calls use relative URLs in production

**Note:** The frontend automatically switches between:
- Development: `http://localhost:3000/api` 
- Production: `/api` (relative to your Railway domain)

## 🔧 What's Configured for Railway

### ✅ Automatic Build Process
- Installs both backend and frontend dependencies
- Builds React frontend for production
- Serves built assets from backend

### ✅ Health Checks
- `/health` endpoint for Railway monitoring
- Auto-restart on failures

### ✅ CORS Configuration
- Automatically allows Railway domains
- Supports custom domains

### ✅ File Persistence
- Database and uploads stored in persistent volume
- Survives deployments and restarts

### ✅ Environment Detection
- Automatically detects Railway environment
- Adjusts security settings for production

## 🎯 Access Your Deployed App

After deployment:
- **Main App**: `https://your-app-name.railway.app`
- **OBS Overlay**: `https://your-app-name.railway.app/overlay`
- **API**: `https://your-app-name.railway.app/api`

## 🔐 First Time Setup

1. Visit your deployed app
2. Login with your `ADMIN_USERNAME` and `ADMIN_PASSWORD`
3. Start creating scenes, characters, and templates!

## 🎥 OBS Studio Setup

1. Add Browser Source
2. URL: `https://your-app-name.railway.app/overlay`
3. Width: 1920, Height: 1080
4. ✅ Shutdown source when not visible
5. ✅ Refresh browser when scene becomes active

## 🚨 Security Notes

- Change `SESSION_SECRET` to a long random string
- Use a strong `ADMIN_PASSWORD`
- Railway provides HTTPS automatically
- Database is secured in persistent volume

## 📊 Monitoring

- Railway provides automatic monitoring
- Check logs in Railway Dashboard
- Health endpoint: `/health`

## 🔄 Updates

To update your app:
1. Push changes to GitHub
2. Railway auto-deploys from main branch
3. Zero-downtime deployments

## 🚨 Troubleshooting

### Login Issues
If login doesn't work on Railway:

1. **Check Environment Variables:**
   - Ensure `NODE_ENV=production`
   - Verify `SESSION_SECRET` is set and long (32+ characters)
   - Confirm `ADMIN_USERNAME` and `ADMIN_PASSWORD` are set

2. **Check CORS Configuration:**
   - Set `CORS_ORIGIN` to your exact Railway URL
   - Example: `CORS_ORIGIN=https://rpg-generator-production.up.railway.app`

3. **Session Store Issues:**
   - App now uses SQLite sessions in production (fixed memory leak)
   - Sessions persist across deployments

### Build Issues
If you encounter npm/build errors:

1. **Package Lock Issues:**
   - Ensure `package-lock.json` is committed to your repository
   - Run `npm install` locally to update lock file before pushing
   - Railway uses `npm install` (not `npm ci`) to handle lock file updates

2. **Missing Dependencies:**
   - If you see "Missing from lock file" errors, run `npm install` locally
   - Commit the updated `package-lock.json`
   - Push changes to trigger new Railway build

3. **Nixpacks Issues:**
   - **Remove nixpacks.toml** (let Railway auto-detect)
   - **Use Dockerfile instead**: Railway will automatically detect and use the Dockerfile
   - **Check logs** in Railway Dashboard for specific errors

### Common Issues:
- **Login fails**: Check environment variables and CORS settings
- **"getBaseUrl is not defined" error**: Fixed with proper utility functions
- **"Network Error" or localhost calls**: Frontend now auto-detects environment
- **"Missing from lock file" error**: Run `npm install` locally and commit package-lock.json
- **npm ci fails**: Railway now uses `npm install` for better lock file handling
- **Memory warnings**: Fixed with SQLite session store
- **Port issues**: Server now binds to `0.0.0.0` for Railway
- **SIGTERM errors**: Added graceful shutdown handling
- **Nixpacks errors**: Railway's Node.js auto-detection usually works better
- **Build timeouts**: Increase build timeout in Railway settings

### Alternative Deployment:
If Nixpacks fails, Railway will automatically fall back to the included Dockerfile.

---

Your magical RPG generator is now ready for the cloud! ✨🚂
