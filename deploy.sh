#!/bin/bash

# Big Brother Dashboard Deployment Script
# This script helps deploy the dashboard to a VPS

set -e

echo "🔍 Big Brother Dashboard Deployment Script"
echo "=========================================="

# Configuration
PROJECT_NAME="big-brother"
DEPLOY_DIR="/opt/big-brother"
SERVICE_USER="www-data"
NODE_VERSION="18"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Helper functions
log_info() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

log_warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        log_warn "Running as root. Consider using a non-root user for better security."
    fi
}

# Install system dependencies
install_dependencies() {
    log_info "Installing system dependencies..."

    # Update package list
    sudo apt update

    # Install Node.js and npm
    if ! command -v node &> /dev/null; then
        log_info "Installing Node.js..."
        curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
        sudo apt-get install -y nodejs
    else
        log_info "Node.js already installed: $(node --version)"
    fi

    # Install PM2 globally
    if ! command -v pm2 &> /dev/null; then
        log_info "Installing PM2..."
        sudo npm install -g pm2
        sudo pm2 startup
    else
        log_info "PM2 already installed: $(pm2 --version)"
    fi

    # Install Nginx
    if ! command -v nginx &> /dev/null; then
        log_info "Installing Nginx..."
        sudo apt-get install -y nginx
    else
        log_info "Nginx already installed: $(nginx -v 2>&1)"
    fi

    # Create log directories
    sudo mkdir -p /var/log/myapps
    sudo mkdir -p /var/log/pm2
    sudo chown -R $SERVICE_USER:$SERVICE_USER /var/log/myapps
    sudo chown -R $USER:$USER /var/log/pm2
}

# Setup project directory
setup_project() {
    log_info "Setting up project directory..."

    # Create deployment directory
    sudo mkdir -p $DEPLOY_DIR
    sudo chown -R $USER:$USER $DEPLOY_DIR

    # Copy project files
    if [ -d "./backend" ] && [ -d "./frontend" ]; then
        log_info "Copying project files..."
        cp -r ./backend $DEPLOY_DIR/
        cp -r ./frontend $DEPLOY_DIR/
        cp ./ecosystem.config.js $DEPLOY_DIR/
        cp ./nginx.conf $DEPLOY_DIR/

        # Copy this script
        cp "$0" $DEPLOY_DIR/deploy.sh
        chmod +x $DEPLOY_DIR/deploy.sh
    else
        log_error "Project files not found. Make sure you're running this from the project root."
        exit 1
    fi
}

# Install project dependencies
install_project_deps() {
    log_info "Installing project dependencies..."

    # Backend dependencies
    cd $DEPLOY_DIR/backend
    npm install --production

    # Frontend dependencies and build
    cd $DEPLOY_DIR/frontend
    npm install
    npm run build

    cd $DEPLOY_DIR
}

# Configure environment
configure_environment() {
    log_info "Configuring environment..."

    # Create environment file
    if [ ! -f "$DEPLOY_DIR/.env" ]; then
        cat > $DEPLOY_DIR/.env << EOF
# Big Brother Dashboard Environment Configuration
NODE_ENV=production
AUTH_USERNAME=admin
AUTH_PASSWORD=$(openssl rand -base64 32)
FRONTEND_URL=https://$(hostname -f)
BACKEND_URL=https://$(hostname -f)/api
EOF
        log_info "Environment file created at $DEPLOY_DIR/.env"
        log_warn "Please update the AUTH_PASSWORD in $DEPLOY_DIR/.env"
    else
        log_info "Environment file already exists"
    fi
}

# Setup PM2
setup_pm2() {
    log_info "Setting up PM2..."

    cd $DEPLOY_DIR

    # Start applications with PM2
    pm2 start ecosystem.config.js --env production

    # Save PM2 configuration
    pm2 save

    # Setup PM2 startup
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u $USER --hp $HOME

    log_info "PM2 setup complete"
}

# Configure Nginx
configure_nginx() {
    log_info "Configuring Nginx..."

    # Backup existing nginx config
    sudo cp /etc/nginx/sites-available/default /etc/nginx/sites-available/default.backup.$(date +%s)

    # Create new nginx config
    sudo cp $DEPLOY_DIR/nginx.conf /etc/nginx/sites-available/big-brother

    # Enable the site
    sudo ln -sf /etc/nginx/sites-available/big-brother /etc/nginx/sites-enabled/

    # Test nginx configuration
    if sudo nginx -t; then
        log_info "Nginx configuration is valid"
        sudo systemctl reload nginx
    else
        log_error "Nginx configuration is invalid"
        exit 1
    fi
}

# Setup SSL (Let's Encrypt)
setup_ssl() {
    log_info "Setting up SSL with Let's Encrypt..."

    if ! command -v certbot &> /dev/null; then
        log_info "Installing Certbot..."
        sudo apt-get install -y certbot python3-certbot-nginx
    fi

    read -p "Enter your domain name (e.g., yourdomain.com): " DOMAIN
    read -p "Enter your email for Let's Encrypt: " EMAIL

    if [ ! -z "$DOMAIN" ] && [ ! -z "$EMAIL" ]; then
        sudo certbot --nginx -d $DOMAIN --email $EMAIL --agree-tos --non-interactive
        log_info "SSL certificate installed for $DOMAIN"
    else
        log_warn "Domain or email not provided. Skipping SSL setup."
    fi
}

# Setup firewall
setup_firewall() {
    log_info "Configuring firewall..."

    # Enable UFW
    sudo ufw --force enable

    # Allow SSH, HTTP, and HTTPS
    sudo ufw allow ssh
    sudo ufw allow 'Nginx Full'

    # Allow specific ports for development (optional)
    read -p "Allow direct access to ports 3000 and 3001 for development? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        sudo ufw allow 3000
        sudo ufw allow 3001
    fi

    sudo ufw status
}

# Setup monitoring
setup_monitoring() {
    log_info "Setting up system monitoring..."

    # Install htop and other monitoring tools
    sudo apt-get install -y htop iotop nethogs

    # Setup logrotate for application logs
    sudo tee /etc/logrotate.d/big-brother > /dev/null << EOF
/var/log/myapps/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $SERVICE_USER $SERVICE_USER
}

/var/log/pm2/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
}
EOF

    log_info "Log rotation configured"
}

# Main deployment function
deploy() {
    log_info "Starting Big Brother Dashboard deployment..."

    check_root
    install_dependencies
    setup_project
    install_project_deps
    configure_environment
    setup_pm2
    configure_nginx
    setup_monitoring

    log_info "Deployment complete!"

    echo ""
    echo "=========================================="
    echo "🎉 Big Brother Dashboard is now running!"
    echo "=========================================="
    echo ""
    echo "Frontend: http://$(hostname -f)"
    echo "Backend API: http://$(hostname -f)/api"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: Check $DEPLOY_DIR/.env"
    echo ""
    echo "Useful commands:"
    echo "  pm2 status                    - Check application status"
    echo "  pm2 logs                      - View application logs"
    echo "  pm2 restart all               - Restart all applications"
    echo "  sudo systemctl status nginx   - Check Nginx status"
    echo "  sudo tail -f /var/log/nginx/error.log - View Nginx logs"
    echo ""

    read -p "Setup SSL certificate with Let's Encrypt? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_ssl
    fi

    read -p "Configure firewall? (y/n): " -n 1 -r
    echo
    if [[ $REPLY =~ ^[Yy]$ ]]; then
        setup_firewall
    fi

    log_info "Setup complete! Your dashboard should now be accessible."
}

# Script execution
case "${1:-deploy}" in
    "deploy")
        deploy
        ;;
    "update")
        log_info "Updating Big Brother Dashboard..."
        cd $DEPLOY_DIR
        pm2 stop all
        install_project_deps
        pm2 start ecosystem.config.js --env production
        log_info "Update complete!"
        ;;
    "logs")
        pm2 logs
        ;;
    "status")
        pm2 status
        ;;
    "restart")
        pm2 restart all
        ;;
    "stop")
        pm2 stop all
        ;;
    "help")
        echo "Usage: $0 [command]"
        echo ""
        echo "Commands:"
        echo "  deploy   - Full deployment (default)"
        echo "  update   - Update existing installation"
        echo "  logs     - View PM2 logs"
        echo "  status   - Show PM2 status"
        echo "  restart  - Restart all applications"
        echo "  stop     - Stop all applications"
        echo "  help     - Show this help"
        ;;
    *)
        log_error "Unknown command: $1"
        echo "Use '$0 help' for usage information."
        exit 1
        ;;
esac