```
██████╗ ██╗ ██████╗     ██████╗ ██████╗  ██████╗ ████████╗██╗  ██╗███████╗██████╗
██╔══██╗██║██╔════╝     ██╔══██╗██╔══██╗██╔═══██╗╚══██╔══╝██║  ██║██╔════╝██╔══██╗
██████╔╝██║██║  ███╗    ██████╔╝██████╔╝██║   ██║   ██║   ███████║█████╗  ██████╔╝
██╔══██╗██║██║   ██║    ██╔══██╗██╔══██╗██║   ██║   ██║   ██╔══██║██╔══╝  ██╔══██╗
██████╔╝██║╚██████╔╝    ██████╔╝██║  ██║╚██████╔╝   ██║   ██║  ██║███████╗██║  ██║
╚═════╝ ╚═╝ ╚═════╝     ╚═════╝ ╚═╝  ╚═╝ ╚═════╝    ╚═╝   ╚═╝  ╚═╝╚══════╝╚═╝  ╚═╝

         👁️‍🗨️  VPS Monitoring Dashboard - Always Watching Your Applications  👁️‍🗨️
```

# 🔍 Big Brother - VPS Monitoring Dashboard

A comprehensive, ready-to-run Node.js + Next.js monitoring dashboard for VPS servers hosting multiple applications. Automatically detects and monitors all PM2-managed applications with real-time status updates, resource monitoring, and live log streaming.

![Dashboard Screenshot](https://via.placeholder.com/800x400/1f2937/ffffff?text=Big+Brother+Dashboard)

## ✨ Features

### 🖥️ **Backend (Node.js + Express)**

- **Automatic PM2 Detection**: Discovers all PM2-managed apps without configuration
- **Real-time Monitoring**: CPU usage, memory consumption, uptime, restart counts
- **Live Log Streaming**: Server-Sent Events (SSE) for real-time PM2 logs
- **Frontend Log Access**: Reads logs from `/var/log/myapps/` directory
- **App Control**: Restart and stop applications directly from dashboard
- **Basic Authentication**: Secure access with username/password
- **Rate Limiting**: Built-in protection against abuse
- **Health Checks**: API endpoint for system health monitoring

### 🎨 **Frontend (Next.js + React)**

- **Responsive Design**: Works on desktop, tablet, and mobile devices
- **Real-time Updates**: Auto-refresh every 5 seconds using SWR
- **Live Log Viewer**: Real-time log streaming with search and filtering
- **Status Indicators**: Color-coded status for quick visual assessment
- **Resource Monitoring**: Memory usage, CPU utilization, uptime tracking
- **App Management**: Start, stop, restart applications from the UI
- **Modern UI**: Built with Tailwind CSS for a clean, professional look
- **Error Handling**: Graceful error handling and user feedback

### ⚡ **Real-time Features**

- **Live Data Polling**: Updates app status every 5 seconds
- **SSE Log Streaming**: Real-time log viewing without page refresh
- **Connection Status**: Visual indicator of backend connectivity
- **Auto-scrolling Logs**: Automatically scroll to latest log entries
- **Search & Filter**: Find specific log entries quickly

## 🚀 Quick Start

### Prerequisites

- Node.js 16+ and npm
- PM2 (will be installed globally)
- Linux/Ubuntu VPS (for production)

### Local Development

#### 🚀 **Quick Start (Windows)**

```bash
# 1. Clone repository
git clone <repository-url>
cd big-brother-reactjs

# 2. One-time setup
setup.bat

# 3. Run development environment
quick-start.bat
# OR for more options
run-dev.bat
```

#### 📋 **Available Windows Scripts**

- **`setup.bat`** - One-time setup (installs dependencies)
- **`quick-start.bat`** - Simple startup (both apps in separate windows)
- **`run-dev.bat`** - Advanced startup with multiple options:
  - PM2 mode (recommended)
  - Backend only
  - Frontend only
  - Separate windows mode
- **`clear-ports.bat`** - Clear occupied ports (3000, 3001) when apps won't start

#### 🚨 **Troubleshooting - Port Issues**

If you get "port already in use" errors:

```bash
# Quick fix - Clear default ports
clear-ports.bat

# Manual commands
netstat -aon | findstr :3000    # Check what's using port 3000
taskkill /f /pid PROCESS_ID     # Kill specific process
pm2 stop all                   # Stop all PM2 processes
```

#### 🛠️ **Manual Setup (Cross-platform)**

```bash
# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install

# Start development servers
cd ../backend
npm run dev

# In another terminal
cd frontend
npm run dev
```

#### 🌐 **Access Dashboard**

- **Frontend**: http://localhost:3000 (development) / http://localhost:3006 (production)
- **Backend API**: http://localhost:3001
- **Authentication**: JWT-based secure login system

> **Note**: In production, the frontend runs on port 3006 to avoid conflicts with other applications that may use port 3000.

### VPS Deployment with GitHub Actions

The dashboard includes automated deployment via GitHub Actions. Set up your VPS deployment in a few steps:

#### 1. **Configure Repository Secrets**

In your GitHub repository, go to Settings → Secrets and Variables → Actions, and add:

```
VPS_HOST             # Your VPS IP address (e.g., 192.168.1.100)
VPS_USERNAME         # SSH username (e.g., ubuntu)
VPS_SSH_KEY          # Your private SSH key content
VPS_PORT             # SSH port (default: 22)
JWT_SECRET           # JWT signing secret (generated by setup script)
ADMIN_USERNAME       # Dashboard admin username
ADMIN_PASSWORD_HASH  # Dashboard admin password hash (generated by setup script)
FRONTEND_URL         # Your domain (e.g., https://yourdomain.com)
BACKEND_URL          # API URL (e.g., https://yourdomain.com/api)
```

#### 2. **Prepare Your VPS**

```bash
# SSH into your VPS
ssh user@your-vps

# Install prerequisites
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs nginx
sudo npm install -g pm2

# Setup deployment directory
sudo mkdir -p /opt/big-brother
sudo chown -R $USER:$USER /opt/big-brother

# Setup PM2 startup
pm2 startup
```

#### 3. **Deploy**

Push to the `main` branch or manually trigger the workflow:

```bash
git push origin main
```

Or use manual deployment:

- Go to Actions tab in GitHub
- Select "Deploy Big Brother Dashboard"
- Click "Run workflow"
- Choose environment (production/staging)

#### 4. **Available Workflows**

- **`deploy.yml`**: Full deployment with testing, building, and VPS deployment
- **`ci-cd.yml`**: Simple CI/CD pipeline for direct Git-based deployment

### Manual VPS Setup (Alternative)

For direct deployment without GitHub Actions, use the deployment scripts:

```bash
# Quick deployment from Windows
cd scripts
.\deploy-to-vps.ps1

# Or SSH to VPS and deploy manually
ssh user@your-vps
wget https://raw.githubusercontent.com/NelakaWith/big-brother-reactjs/develop/scripts/manual-deployment.sh
chmod +x manual-deployment.sh
sudo ./manual-deployment.sh
```

📖 **For detailed deployment instructions and all available scripts, see [scripts/README.md](scripts/README.md)**

## 📁 Project Structure

```
big-brother-reactjs/
├── backend/                 # Express.js API server
│   ├── server.js           # Main server file
│   ├── package.json        # Backend dependencies
│   └── ecosystem.config.js # PM2 configuration
├── frontend/               # Next.js React app
│   ├── pages/             # Next.js pages
│   │   ├── index.js       # Main dashboard page
│   │   └── _app.js        # App wrapper
│   ├── components/        # React components
│   │   ├── Dashboard.js   # Main dashboard component
│   │   ├── AppCard.js     # App status card
│   │   └── LogViewer.js   # Log viewing modal
│   ├── lib/               # Utilities
│   │   └── api.js         # API client and helpers
│   ├── styles/            # CSS styles
│   │   └── globals.css    # Global styles with Tailwind
│   ├── package.json       # Frontend dependencies
│   ├── next.config.js     # Next.js configuration
│   ├── tailwind.config.js # Tailwind CSS config
│   └── postcss.config.js  # PostCSS configuration
├── ecosystem.config.js     # PM2 ecosystem configuration
├── nginx.conf             # Nginx configuration template
├── .github/               # GitHub Actions workflows
│   └── workflows/         # Deployment automation
│       ├── deploy.yml     # Full deployment workflow
│       └── ci-cd.yml      # Simple CI/CD pipeline
├── setup.bat              # Windows setup script
├── run-dev.bat            # Windows development runner (advanced)
├── quick-start.bat        # Windows quick start script
├── clear-ports.bat        # Windows port cleaner utility
└── README.md              # This file
```

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the backend directory using the setup utility:

```bash
# Generate authentication configuration
cd backend
npm run setup

# Or with a custom password
SETUP_PASSWORD=YourSecurePassword123! npm run setup
```

The setup will generate a `.env` file like this:

```bash
# Authentication
NODE_ENV=production
PORT=3001

# JWT Configuration
JWT_SECRET=generated-jwt-secret
JWT_ACCESS_EXPIRY=30m
JWT_REFRESH_EXPIRY=7d

# Admin User Configuration
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=generated-bcrypt-hash

# CORS Configuration
FRONTEND_URL=https://your-domain.com
```

**Security Notes:**

- Never commit `.env` files to version control
- Use strong passwords (8+ chars, mixed case, numbers, symbols)
- Generate unique JWT secrets for each environment
- Regularly rotate secrets and passwords

### PM2 Ecosystem

The `ecosystem.config.js` file configures PM2 applications:

```javascript
module.exports = {
  apps: [
    {
      name: "big-brother-backend",
      script: "./server.js",
      // ... configuration
    },
    {
      name: "big-brother-frontend",
      script: "npm",
      args: "start",
      // ... configuration
    },
  ],
};
```

### Nginx Configuration

The dashboard works with Nginx as a reverse proxy:

- Frontend served from port 3000
- Backend API proxied from port 3001
- SSL termination and security headers
- Rate limiting and GZIP compression

## 📡 API Reference

### Endpoints

| Endpoint                   | Method | Description               | Auth Required |
| -------------------------- | ------ | ------------------------- | ------------- |
| `/api/health`              | GET    | System health check       | No            |
| `/api/auth/login`          | POST   | Login and get JWT tokens  | No            |
| `/api/auth/refresh`        | POST   | Refresh access token      | No            |
| `/api/auth/logout`         | POST   | Logout and revoke token   | No            |
| `/api/auth/me`             | GET    | Get current user info     | Yes           |
| `/api/auth/status`         | GET    | Authentication status     | No            |
| `/api/apps`                | GET    | List all PM2 applications | Yes           |
| `/api/apps/:name`          | GET    | Get specific app details  | Yes           |
| `/api/logs/:name`          | GET    | Live log stream (SSE)     | Yes           |
| `/api/frontend-logs/:name` | GET    | Frontend logs from files  | Yes           |
| `/api/apps/:name/restart`  | POST   | Restart application       | Yes           |
| `/api/apps/:name/stop`     | POST   | Stop application          | Yes           |

### Response Format

#### Authentication Response

```javascript
// POST /api/auth/login
{
  "success": true,
  "message": "Login successful",
  "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "username": "admin",
    "role": "admin",
    "permissions": ["read", "write", "admin"]
  },
  "expiresIn": "30m"
}
```

#### Apps Response

```javascript
// GET /api/apps
{
  "success": true,
  "apps": [
    {
      "name": "my-app",
      "status": "online",
      "memory": 52428800,
      "cpu": 1.2,
      "uptime": 3600000,
      "restart_time": 0,
      "port": 3000,
      // ... more fields
    }
  ],
  "count": 1,
  "timestamp": "2023-12-07T10:30:00.000Z"
}
```

## 🛠️ Management Commands

### Setup & Configuration Commands

```bash
# Setup authentication (generates .env file)
cd backend
npm run setup

# Generate password hash for specific password
SETUP_PASSWORD=YourPassword123! npm run setup

# Check authentication status
curl http://localhost:3001/api/auth/status

# Test login
curl -X POST http://localhost:3001/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"YourPassword123!"}'
```

### PM2 Commands

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart dashboard
pm2 restart big-brother-backend
pm2 restart big-brother-frontend

# Stop dashboard
pm2 stop all

# Start dashboard
pm2 start ecosystem.config.js --env production
```

```bash
# Check status
pm2 status

# View logs
pm2 logs

# Restart dashboard
pm2 restart big-brother-backend
pm2 restart big-brother-frontend

# Stop dashboard
pm2 stop all

# Start dashboard
pm2 start ecosystem.config.js --env production
```

### Deployment Commands

```bash
# GitHub Actions deployment (recommended)
git push origin main              # Auto-deploy on push to main

# Manual GitHub Actions trigger
# Go to GitHub Actions → Deploy Big Brother Dashboard → Run workflow

# Direct PM2 management on VPS
pm2 restart ecosystem.config.js  # Restart applications
pm2 status                       # Check status
pm2 logs                         # View logs
```

### Nginx Commands

```bash
# Test configuration
sudo nginx -t

# Reload configuration
sudo systemctl reload nginx

# Check status
sudo systemctl status nginx

# View logs
sudo tail -f /var/log/nginx/error.log
```

## 🔒 Security Features

### Authentication

- **JWT Authentication**: Secure token-based authentication system
- **Password Security**: Bcrypt hashed passwords with secure JWT tokens
- **Environment-based Configuration**: No hardcoded credentials

### Rate Limiting

- API rate limiting (100 requests per 15 minutes)
- Nginx-level rate limiting
- Per-IP request throttling

### Security Headers

- X-Frame-Options: DENY
- X-Content-Type-Options: nosniff
- X-XSS-Protection: enabled
- Strict-Transport-Security (HTTPS)

### Network Security

- Firewall configuration with UFW
- Nginx reverse proxy (hides direct access to Node.js)
- SSL/TLS encryption with Let's Encrypt

## 📊 Monitoring & Logging

### Application Logs

- PM2 logs: `/var/log/pm2/`
- Application logs: `/var/log/myapps/`
- Nginx logs: `/var/log/nginx/`

### Log Rotation

- Automatic log rotation with logrotate
- Daily rotation, 52-day retention
- Compressed old logs

### System Monitoring

- Real-time resource usage tracking
- Application health monitoring
- Connection status indicators

## 🚨 Troubleshooting

### Common Issues

**Backend Connection Failed**

```bash
# Check if backend is running
pm2 status

# Check backend logs
pm2 logs big-brother-backend

# Restart backend
pm2 restart big-brother-backend
```

**Frontend Not Loading**

```bash
# Check frontend status
pm2 logs big-brother-frontend

# Check if Next.js built successfully
cd frontend && npm run build

# Restart frontend
pm2 restart big-brother-frontend
```

**Nginx Issues**

```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# View Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

**PM2 Issues**

```bash
# Kill and restart PM2
pm2 kill
pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup
```

### Log Analysis

**View Real-time Logs**

```bash
# All PM2 applications
pm2 logs

# Specific application
pm2 logs big-brother-backend

# System logs
sudo journalctl -f -u nginx
```

**Check Resource Usage**

```bash
# System resources
htop

# PM2 monitoring
pm2 monit

# Disk usage
df -h
```

## 🔧 Development

### Local Development Setup

1. **Authentication Setup**

```bash
# Generate authentication configuration first
cd backend
npm run setup
# Enter a secure password when prompted

# This creates .env file with JWT secrets and password hash
```

2. **Environment Variables**

```bash
# .env.local (frontend) - No hardcoded credentials needed
NEXT_PUBLIC_BACKEND_URL=http://localhost:3001
```

3. **Development Commands**

```bash
# Backend development
cd backend
npm run dev

# Frontend development
cd frontend
npm run dev

# Production build test
cd frontend
npm run build && npm start
```

### Adding New Features

1. **Backend API Routes**: Add new routes in `backend/server.js`
2. **Frontend Components**: Create components in `frontend/components/`
3. **API Client**: Update `frontend/lib/api.js` for new endpoints
4. **Styling**: Use Tailwind CSS classes in components

## 📈 Performance Optimization

### Memory Usage

- Backend: ~50-100MB
- Frontend: ~100-200MB
- Total: <300MB (suitable for 1GB VPS)

### Optimization Tips

- Use `npm run build` for production frontend builds
- Enable Nginx GZIP compression
- Configure proper log rotation
- Monitor with `pm2 monit`

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📝 License

This project is licensed under the MIT License - see the LICENSE file for details.

## 🙏 Acknowledgments

- **PM2** - Process manager for Node.js applications
- **Next.js** - React framework for production
- **Tailwind CSS** - Utility-first CSS framework
- **SWR** - Data fetching library for React
- **Express.js** - Web framework for Node.js

## 📞 Support

For issues and questions:

1. Check the troubleshooting section
2. Review the logs for error messages
3. Create an issue in the repository
4. Include system information and error logs

---

**Big Brother Dashboard** - Keep an eye on all your VPS applications! 👁️‍🗨️
