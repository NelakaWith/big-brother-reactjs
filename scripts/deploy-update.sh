#!/bin/bash

# Quick deployment update script for Big Brother Dashboard
# Use this for updates after initial deployment

set -e

echo "🔄 Updating Big Brother Dashboard..."

# Configuration
DEPLOY_DIR="/opt/big-brother"

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

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if we're in the right directory
if [ ! -f "ecosystem.config.js" ]; then
    if [ -d "$DEPLOY_DIR" ]; then
        cd $DEPLOY_DIR
        print_status "Changed to deployment directory: $DEPLOY_DIR"
    else
        print_error "Deployment directory not found. Run full deployment first."
        exit 1
    fi
fi

# Pull latest changes
print_status "Pulling latest changes from develop branch..."
git fetch origin
git pull origin develop

# Install/update dependencies if package.json changed
if git diff --name-only HEAD~1 HEAD | grep -q "package.json"; then
    print_status "Package.json changed, updating dependencies..."

    # Update backend dependencies
    cd backend
    npm install
    npm rebuild better-sqlite3

    # Update frontend dependencies
    cd ../frontend
    npm install

    cd ..
else
    print_status "No package.json changes detected, skipping dependency installation"
fi

# Always rebuild frontend for production
print_status "Building frontend..."
cd frontend
npm run build
cd ..

# Restart PM2 processes
print_status "Restarting PM2 processes..."
pm2 restart ecosystem.config.js --env production

# Check status
print_status "Checking PM2 status..."
pm2 list

print_success "✅ Update completed!"
print_status "Application should be running at: https://bigbro.nelakawithanage.com"

# Show recent logs
print_status "Recent logs:"
pm2 logs big-brother-backend --lines 5 --nostream
pm2 logs big-brother-frontend --lines 5 --nostream