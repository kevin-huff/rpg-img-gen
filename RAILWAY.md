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
DB_PATH=/app/data/rpg.sqlite
UPLOAD_DIR=/app/data/uploads
CORS_ORIGIN=https://your-app-name.railway.app
SESSION_SECRET=your-long-random-secret-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
```

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
- `nixpacks.toml` - Build environment config

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

### Build Issues
If you encounter Nixpacks build errors:

1. **Remove nixpacks.toml** (let Railway auto-detect)
2. **Use Dockerfile instead**: Railway will automatically detect and use the Dockerfile
3. **Check logs** in Railway Dashboard for specific errors

### Common Issues:
- **Nixpacks errors**: Railway's Node.js auto-detection usually works better
- **Build timeouts**: Increase build timeout in Railway settings
- **Memory issues**: Upgrade Railway plan if needed

### Alternative Deployment:
If Nixpacks fails, Railway will automatically fall back to the included Dockerfile.

---

Your magical RPG generator is now ready for the cloud! ✨🚂
