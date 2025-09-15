# Check VPS server status for Big Brother application
# This script connects to the VPS and checks PM2 processes and nginx status

# VPS connection details
$VPS_USER = "root"
$VPS_HOST = "134.209.69.183"
$PROJECT_PATH = "/var/www/big-brother-reactjs"

Write-Host "🔍 Checking Big Brother server status on VPS..." -ForegroundColor Cyan

# Function to run SSH commands
function Invoke-SSHCommand {
    param($Command, $Description)
    Write-Host "`n📋 $Description" -ForegroundColor Yellow
    Write-Host "Command: $Command" -ForegroundColor Gray
    ssh "$VPS_USER@$VPS_HOST" "$Command"
}

# Check PM2 processes
Invoke-SSHCommand "pm2 status" "PM2 Process Status"

# Check if ports are listening
Invoke-SSHCommand "netstat -tlnp | grep -E ':(3001|3006)'" "Check if backend/frontend ports are listening"

# Check PM2 logs for recent errors
Invoke-SSHCommand "pm2 logs --lines 20" "Recent PM2 logs"

# Check nginx status
Invoke-SSHCommand "systemctl status nginx" "Nginx service status"

# Check nginx configuration
Invoke-SSHCommand "nginx -t" "Nginx configuration test"

# Check if backend is responding locally
Invoke-SSHCommand "curl -s -o /dev/null -w '%{http_code}' http://localhost:3001/api/health || echo 'Backend not responding'" "Test backend health endpoint"

Write-Host "`n✅ Server status check completed!" -ForegroundColor Green
Write-Host "If any processes are down, use: ssh $VPS_USER@$VPS_HOST 'cd $PROJECT_PATH && pm2 restart all'" -ForegroundColor Yellow