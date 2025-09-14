#!/bin/bash

# Big Brother Dashboard Deployment Script
# Updated with VPS configuration changes

set -e

echo "🚀 Starting Big Brother Dashboard deployment..."

# Configuration
DEPLOY_DIR="/opt/big-brother"
NGINX_SITE="/etc/nginx/sites-available/big-brother"
DOMAIN="bigbro.nelakawithanage.com"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_error "Please run as root"
    exit 1
fi

# Update system packages
print_status "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 18 (compatible with better-sqlite3 v11.10.0)
print_status "Installing Node.js 18..."
curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
apt-get install -y nodejs

# Install PM2 globally
print_status "Installing PM2..."
npm install -g pm2

# Install nginx if not present
print_status "Installing nginx..."
apt install -y nginx

# Create deployment directory
print_status "Setting up deployment directory..."
mkdir -p $DEPLOY_DIR
cd $DEPLOY_DIR

# Stop existing PM2 processes if running
print_status "Stopping existing PM2 processes..."
pm2 stop all || true

# Clone/update repository
if [ -d ".git" ]; then
    print_status "Updating existing repository..."
    git pull origin main
else
    print_status "Cloning repository..."
    # Replace with your actual repository URL
    git clone https://github.com/NelakaWith/big-brother-reactjs.git .
fi

# Install backend dependencies with compatible better-sqlite3
print_status "Installing backend dependencies..."
cd backend
npm install

# Rebuild better-sqlite3 for current Node.js version
print_status "Rebuilding better-sqlite3 for Node.js compatibility..."
npm rebuild better-sqlite3

# Install frontend dependencies
print_status "Installing frontend dependencies..."
cd ../frontend
npm install

# Build frontend for production
print_status "Building frontend..."
npm run build

# Go back to root
cd $DEPLOY_DIR

# Setup environment variables
print_status "Setting up environment variables..."
if [ ! -f ".env" ]; then
    print_warning "Creating .env file from template..."
    cat > .env << EOF
# Production Environment Variables
JWT_SECRET=$(openssl rand -base64 32)
AUTH_USERNAME=admin
AUTH_PASSWORD=\$2a\$10\$placeholder_hash_change_me
DB_PATH=./database/big-brother.db
FRONTEND_URL=https://$DOMAIN
BACKEND_URL=https://$DOMAIN/api
NODE_ENV=production
EOF
    print_warning "⚠️  Please update the AUTH_PASSWORD in .env file with a proper bcrypt hash!"
fi

# Create database directory
print_status "Setting up database..."
mkdir -p database
mkdir -p logs

# Setup nginx site configuration (not main nginx.conf)
print_status "Configuring nginx site..."
cp nginx/big-brother.conf $NGINX_SITE

# Enable site
ln -sf $NGINX_SITE /etc/nginx/sites-enabled/

print_status "Note: Using existing system nginx.conf - only deploying site-specific configuration"

# Test nginx configuration
print_status "Testing nginx configuration..."
nginx -t

# Start applications with updated port configuration
print_status "Starting applications with PM2..."

# Start with updated ports:
# - faq-chatbot-backend: port 3000 (original)
# - big-brother-backend: port 3001
# - big-brother-frontend: port 3006 (moved from 3000)
# - gloire-road-map-backend: port 3005 (original)

pm2 start ecosystem.config.js --env production

# Save PM2 configuration
pm2 save
pm2 startup

# Reload nginx
print_status "Reloading nginx..."
systemctl reload nginx

print_success "✅ Basic deployment completed!"
print_status "Port configuration:"
print_status "  - Big Brother Backend: 3001"
print_status "  - Big Brother Frontend: 3006 (moved from 3000)"
print_status "  - FAQ Chatbot Backend: 3000 (if present)"
print_status "  - Gloire Road Map Backend: 3005 (if present)"

# SSL Certificate setup
print_status "Setting up SSL certificate..."
if command -v certbot &> /dev/null; then
    print_status "Obtaining SSL certificate for $DOMAIN..."
    certbot --nginx -d $DOMAIN --non-interactive --agree-tos --email admin@$DOMAIN || print_warning "SSL setup failed - please run manually: certbot --nginx -d $DOMAIN"
else
    print_warning "Certbot not found. Installing..."
    apt install -y certbot python3-certbot-nginx
    print_status "Run manually: certbot --nginx -d $DOMAIN"
fi

print_success "🎉 Deployment completed!"
print_status "Your application should be available at: https://$DOMAIN"
print_status ""
print_status "Next steps:"
print_status "1. Update AUTH_PASSWORD in .env with a bcrypt hash"
print_status "2. Run SSL setup if not completed: certbot --nginx -d $DOMAIN"
print_status "3. Check PM2 status: pm2 list"
print_status "4. Check logs: pm2 logs"

# Show final status
print_status "Current PM2 processes:"
pm2 list