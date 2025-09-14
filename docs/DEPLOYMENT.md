# Deployment Guide

## GitHub Actions Deployment

### Required Secrets

Set these secrets in your GitHub repository (Settings → Secrets and Variables → Actions):

| Secret Name     | Description                   | Example                              |
| --------------- | ----------------------------- | ------------------------------------ |
| `VPS_HOST`      | Your VPS IP address or domain | `192.168.1.100` or `yourdomain.com`  |
| `VPS_USERNAME`  | SSH username                  | `ubuntu`, `root`, or your username   |
| `VPS_SSH_KEY`   | Private SSH key content       | Content of your `~/.ssh/id_rsa` file |
| `VPS_PORT`      | SSH port (optional)           | `22` (default)                       |
| `AUTH_PASSWORD` | Dashboard admin password      | Strong password for admin access     |
| `FRONTEND_URL`  | Frontend URL                  | `https://yourdomain.com`             |
| `BACKEND_URL`   | Backend API URL               | `https://yourdomain.com/api`         |

### SSH Key Setup

1. Generate SSH key pair (if you don't have one):

```bash
ssh-keygen -t rsa -b 4096 -C "your-email@example.com"
```

2. Copy public key to your VPS:

```bash
ssh-copy-id user@your-vps
```

3. Copy private key content to GitHub secret:

```bash
cat ~/.ssh/id_rsa
```

### VPS Preparation

Before first deployment, prepare your VPS:

```bash
# SSH into your VPS
ssh user@your-vps

# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 18
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install PM2 globally
sudo npm install -g pm2

# Install Nginx
sudo apt-get install -y nginx

# Create deployment directory
sudo mkdir -p /opt/big-brother
sudo chown -R $USER:$USER /opt/big-brother

# Setup PM2 startup script
pm2 startup
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

# Configure firewall (optional)
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

### Domain and SSL Setup

1. Point your domain to your VPS IP
2. Install Certbot for SSL:

```bash
sudo apt-get install -y certbot python3-certbot-nginx
sudo certbot --nginx -d yourdomain.com
```

### Manual Deployment (Fallback)

If GitHub Actions isn't suitable, you can deploy manually:

```bash
# On your local machine
tar -czf big-brother.tar.gz --exclude=node_modules --exclude=.git .
scp big-brother.tar.gz user@your-vps:/tmp/

# On your VPS
ssh user@your-vps
cd /tmp
tar -xzf big-brother.tar.gz
cd big-brother-reactjs

# Install dependencies
cd backend && npm ci --production && cd ..
cd frontend && npm ci && npm run build && cd ..

# Deploy
sudo cp -r . /opt/big-brother/
cd /opt/big-brother

# Start with PM2
pm2 start ecosystem.config.js --env production
pm2 save

# Configure Nginx
sudo cp nginx.conf /etc/nginx/sites-available/big-brother
sudo ln -sf /etc/nginx/sites-available/big-brother /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

### Troubleshooting

#### GitHub Actions Issues

1. **SSH connection failed**: Check VPS_HOST, VPS_USERNAME, and VPS_SSH_KEY secrets
2. **Permission denied**: Ensure SSH key has correct permissions and is added to VPS
3. **Deployment fails**: Check VPS logs and ensure all prerequisites are installed

#### VPS Issues

1. **PM2 processes won't start**: Check Node.js version and dependencies
2. **Nginx errors**: Test configuration with `sudo nginx -t`
3. **SSL issues**: Verify domain DNS and Certbot installation

#### Common Commands

```bash
# Check PM2 status
pm2 status

# View PM2 logs
pm2 logs

# Check Nginx status
sudo systemctl status nginx

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Check disk space
df -h

# Check memory usage
free -h

# Restart services
pm2 restart all
sudo systemctl reload nginx
```

### Monitoring Deployment

After deployment, verify:

1. **Application Status**: `pm2 status` should show both apps online
2. **Website Access**: Visit your domain and login with admin credentials
3. **API Health**: Check `https://yourdomain.com/api/health`
4. **SSL Certificate**: Verify HTTPS is working properly

### Updating

To update your deployment:

1. Push changes to main branch (triggers auto-deployment)
2. Or manually trigger GitHub Actions workflow
3. Or use manual update:

```bash
ssh user@your-vps
cd /opt/big-brother
git pull origin main
cd backend && npm ci --production && cd ..
cd frontend && npm ci && npm run build && cd ..
pm2 restart ecosystem.config.js --env production
```
