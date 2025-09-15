# Deployment Scripts

This folder contains all deployment and development scripts for the Big Brother Dashboard project.

## 📜 Script Overview

### Production Deployment (VPS/Droplet)

| Script                 | Platform  | Purpose                            | Usage                           |
| ---------------------- | --------- | ---------------------------------- | ------------------------------- |
| `manual-deployment.sh` | Linux VPS | Initial full deployment setup      | Run once on new VPS             |
| `deploy-update.sh`     | Linux VPS | Quick updates (git pull + rebuild) | Run on VPS for updates          |
| `deploy-to-vps.ps1`    | Windows   | Deploy to VPS from Windows         | Run on Windows to deploy to VPS |

### Local Development

| Script              | Platform | Purpose                      | Usage                            |
| ------------------- | -------- | ---------------------------- | -------------------------------- |
| `deploy-update.ps1` | Windows  | Update local dev environment | Run on Windows for local updates |

## 🚀 Usage Instructions

### Initial VPS Setup

```bash
# On your VPS (first time only)
wget https://raw.githubusercontent.com/NelakaWith/big-brother-reactjs/develop/scripts/manual-deployment.sh
chmod +x manual-deployment.sh
sudo ./manual-deployment.sh
```

### VPS Updates (Option 1: From Windows)

```powershell
# From Windows - deploys to VPS remotely
cd scripts
.\deploy-to-vps.ps1
```

### VPS Updates (Option 2: Direct SSH)

```bash
# SSH to VPS and run directly
ssh root@134.209.69.183
cd /opt/big-brother/scripts
sudo ./deploy-update.sh
```

### Local Development Updates

```powershell
# From Windows - updates local development
cd scripts
.\deploy-update.ps1
```

## 🔧 Configuration

- **VPS IP**: 134.209.69.183
- **VPS User**: root
- **VPS Project Path**: /opt/big-brother
- **Domain**: https://bigbro.nelakawithanage.com
- **Ports**:
  - Backend: 3001
  - Frontend: 3006 (production), 3000 (development)

## 📁 File Structure After Deployment

```
/opt/big-brother/
├── backend/
│   ├── .env                 # Environment variables
│   ├── server.js
│   └── ...
├── frontend/
│   ├── .next/              # Built frontend
│   └── ...
├── scripts/
│   ├── deploy-update.sh    # Update script
│   └── manual-deployment.sh
├── ecosystem.config.js     # PM2 configuration
└── ...
```

## ⚠️ Important Notes

1. **Environment Variables**: Ensure `.env` file is in `/opt/big-brother/backend/.env` on VPS
2. **SSH Access**: Scripts require SSH access to VPS with key-based authentication
3. **Permissions**: Run deployment scripts with `sudo` on VPS
4. **Branch**: Scripts deploy from `develop` branch by default
5. **SSL**: Manual SSL setup may be required: `certbot --nginx -d bigbro.nelakawithanage.com`

## 🔍 Troubleshooting

- **Check PM2 Status**: `pm2 list`
- **View Logs**: `pm2 logs big-brother-backend` or `pm2 logs big-brother-frontend`
- **Restart Services**: `pm2 restart ecosystem.config.js --env production`
- **Check Nginx**: `nginx -t && systemctl status nginx`
- **Test API**: `curl -v https://bigbro.nelakawithanage.com/api/health`
