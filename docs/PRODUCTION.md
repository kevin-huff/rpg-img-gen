# Production Deployment Guide

## Security Configuration

### 1. Environment Variables

Create a secure `.env` file for production:

```bash
# Server Configuration
PORT=3000
NODE_ENV=production

# Database
DB_PATH=./db/rpg.sqlite

# File Upload
UPLOAD_DIR=./uploads

# Authentication (CHANGE THESE!)
SESSION_SECRET=your-super-long-random-secret-key-here-at-least-32-characters
ADMIN_USERNAME=your-admin-username
ADMIN_PASSWORD=your-very-secure-password

# CORS (your domain)
CORS_ORIGIN=https://yourdomain.com
```

### 2. Security Checklist

- [ ] Change `SESSION_SECRET` to a strong random string
- [ ] Change `ADMIN_USERNAME` and `ADMIN_PASSWORD`
- [ ] Set `NODE_ENV=production`
- [ ] Configure HTTPS/SSL
- [ ] Set up proper CORS origin
- [ ] Enable firewall for necessary ports only
- [ ] Regular security updates

### 3. SSL/HTTPS Setup

For production, you'll need HTTPS. Options:

1. **Reverse Proxy (Recommended)**:
   ```nginx
   server {
       listen 443 ssl;
       server_name yourdomain.com;
       
       ssl_certificate /path/to/cert.pem;
       ssl_certificate_key /path/to/key.pem;
       
       location / {
           proxy_pass http://localhost:3000;
           proxy_http_version 1.1;
           proxy_set_header Upgrade $http_upgrade;
           proxy_set_header Connection 'upgrade';
           proxy_set_header Host $host;
           proxy_set_header X-Real-IP $remote_addr;
           proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
           proxy_set_header X-Forwarded-Proto $scheme;
           proxy_cache_bypass $http_upgrade;
       }
   }
   ```

2. **Let's Encrypt Certificate**:
   ```bash
   sudo apt install certbot python3-certbot-nginx
   sudo certbot --nginx -d yourdomain.com
   ```

## Deployment Options

### Option 1: Traditional VPS/Server

1. **Install Node.js**:
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Clone and Setup**:
   ```bash
   git clone your-repo
   cd rpg-img-gen
   npm install
   cd frontend && npm install && npm run build && cd ..
   ```

3. **Process Manager (PM2)**:
   ```bash
   npm install -g pm2
   pm2 start server.js --name rpg-img-gen
   pm2 startup
   pm2 save
   ```

### Option 2: Docker Deployment

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm ci --only=production

# Copy frontend package files
COPY frontend/package*.json ./frontend/
RUN cd frontend && npm ci --only=production

# Copy source code
COPY . .

# Build frontend
RUN cd frontend && npm run build

# Create uploads directory
RUN mkdir -p uploads

# Expose port
EXPOSE 3000

# Start application
CMD ["npm", "start"]
```

Create `docker-compose.yml`:
```yaml
version: '3.8'
services:
  rpg-img-gen:
    build: .
    ports:
      - "3000:3000"
    volumes:
      - ./uploads:/app/uploads
      - ./db:/app/db
    environment:
      - NODE_ENV=production
      - SESSION_SECRET=your-secret-here
      - ADMIN_USERNAME=admin
      - ADMIN_PASSWORD=your-password
    restart: unless-stopped
```

### Option 3: Cloud Platforms

#### Railway
1. Connect GitHub repository
2. Set environment variables in dashboard
3. Deploy automatically

#### Heroku
```bash
heroku create your-app-name
heroku config:set NODE_ENV=production
heroku config:set SESSION_SECRET=your-secret
heroku config:set ADMIN_USERNAME=admin
heroku config:set ADMIN_PASSWORD=your-password
git push heroku main
```

#### DigitalOcean App Platform
1. Connect repository
2. Configure environment variables
3. Deploy

## Security Features Implemented

### Authentication
- ✅ Session-based authentication
- ✅ Password hashing with bcrypt
- ✅ Rate limiting on login attempts
- ✅ Secure session cookies
- ✅ CSRF protection via session tokens

### API Security
- ✅ All API endpoints protected (except auth)
- ✅ Input validation with Joi
- ✅ Helmet.js security headers
- ✅ CORS configuration
- ✅ File upload restrictions

### Production Hardening
- ✅ Environment-based configuration
- ✅ Error handling without information leakage
- ✅ Secure session configuration
- ✅ Rate limiting
- ✅ Input sanitization

## Monitoring and Maintenance

### Health Checks
- Health endpoint: `GET /api/health`
- Monitor session store
- Database connection status
- File upload directory permissions

### Backup Strategy
```bash
# Backup database
cp db/rpg.sqlite backups/rpg-$(date +%Y%m%d).sqlite

# Backup uploads
tar -czf backups/uploads-$(date +%Y%m%d).tar.gz uploads/
```

### Log Monitoring
```bash
# PM2 logs
pm2 logs rpg-img-gen

# Or with Docker
docker logs container-name
```

## OBS Integration in Production

Update OBS Browser Source URL to your production domain:
- URL: `https://yourdomain.com/overlay`
- Width: 1920, Height: 1080

The overlay works without authentication for seamless OBS integration.

## Troubleshooting

### Common Issues
1. **Session not persisting**: Check session secret and cookie settings
2. **CORS errors**: Verify CORS_ORIGIN matches your domain
3. **File uploads failing**: Check upload directory permissions
4. **Database locked**: Ensure single instance or use connection pooling

### Debug Mode
Set `DEBUG=*` for detailed logging in development.

Remember to test all functionality after deployment!
