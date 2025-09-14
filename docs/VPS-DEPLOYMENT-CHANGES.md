# 🔄 VPS Deployment Changes Summary

This document summarizes all the changes made during VPS deployment to ensure local code stays synchronized.

## 📝 Changes Made on VPS

### 1. **Port Configuration Changes**

**Problem**: Port conflicts with existing applications
**Solution**: Updated Big Brother app ports

```
Original Configuration:
- faq-chatbot-backend: ❌ not running
- big-brother-backend: 3001
- big-brother-frontend: 3000
- gloire-road-map-backend: ❌ not running

Updated Configuration:
- faq-chatbot-backend: 3000 (restored to original)
- big-brother-backend: 3001 (unchanged)
- big-brother-frontend: 3006 (moved from 3000)
- gloire-road-map-backend: 3005 (restored to original)
```

### 2. **Package Dependencies**

**Problem**: better-sqlite3 v12.2.0 incompatible with Node.js 18
**Solution**: Downgraded to v11.10.0

```json
// backend/package.json
"better-sqlite3": "^11.10.0"  // was ^12.2.0
```

### 3. **Environment Configuration**

**Created**: Production environment file `/opt/big-brother/.env`

```bash
JWT_SECRET=your-super-secret-jwt-key-here
AUTH_USERNAME=admin
AUTH_PASSWORD=<bcrypt-hashed-password>
DB_PATH=./database/big-brother.db
FRONTEND_URL=https://bigbro.nelakawithanage.com
BACKEND_URL=https://bigbro.nelakawithanage.com/api
NODE_ENV=production
```

### 4. **Nginx Configuration**

**Updated**: `/etc/nginx/sites-available/big-brother`

```nginx
# Frontend proxy updated
location / {
    proxy_pass http://localhost:3006;  # was 3000
}

# Backend proxy unchanged
location /api/ {
    proxy_pass http://localhost:3001;  # unchanged
}
```

### 5. **PM2 Configuration**

**Updated**: `ecosystem.config.js` production environment

```javascript
env_production: {
    NODE_ENV: "production",
    PORT: 3006,  // was 3000
    NEXT_PUBLIC_BACKEND_URL: "https://bigbro.nelakawithanage.com/api",
}
```

## 🔄 Local Code Updates Applied

✅ **ecosystem.config.js**: Updated frontend port to 3006 in production
✅ **backend/package.json**: Downgraded better-sqlite3 to ^11.10.0
✅ **README.md**: Updated port documentation
✅ **.env.production**: Created production environment template
✅ **nginx/big-brother.conf**: Added nginx configuration template
✅ **deploy-updated.sh**: Updated deployment script with port changes

## 🚀 Deployment Status

### **Applications Running on VPS:**

1. **Big Brother Backend** (Port 3001) - ✅ Online
2. **Big Brother Frontend** (Port 3006) - ✅ Online
3. **FAQ Chatbot Backend** (Port 3000) - ✅ Online
4. **Gloire Road Map Backend** (Port 3005) - ✅ Online

### **External Access:**

- **Big Brother**: https://bigbro.nelakawithanage.com
- **FAQ Chatbot**: your-domain.com:8082 → localhost:3000
- **Gloire Road Map**: your-domain.com:8081 → localhost:3005

### **PM2 Management:**

```bash
pm2 list                    # View all processes
pm2 logs big-brother-backend # View backend logs
pm2 restart all             # Restart all apps
pm2 save                    # Save configuration
```

## 🔮 Next Steps

1. **Install Dependencies**: Run `npm install` in backend folder for updated better-sqlite3
2. **Test Locally**: Verify applications work with new port configuration
3. **SSL Setup**: Complete SSL certificate setup on VPS
4. **Monitor**: Use Big Brother dashboard to monitor all applications
5. **Documentation**: Update any additional documentation with new ports

## ⚠️ Important Notes

- **Port 3000**: Now used by faq-chatbot-backend (restored original)
- **Port 3006**: New port for Big Brother frontend in production
- **Development**: Frontend still uses port 3000 locally
- **Production**: Frontend uses port 3006 to avoid conflicts
- **Compatibility**: better-sqlite3 v11.10.0 is compatible with Node.js 18

This ensures all applications can run simultaneously without port conflicts while maintaining the Big Brother monitoring dashboard functionality.
