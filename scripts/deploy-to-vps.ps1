# PowerShell script to deploy to VPS droplet
# This script connects to your VPS and runs the deployment

Write-Host "🚀 Deploying to VPS Droplet..." -ForegroundColor Blue

# Configuration
$VpsIp = "134.209.69.183"
$VpsUser = "root"
$ProjectPath = "/opt/big-brother"

function Write-Status {
    param($Message)
    Write-Host "[INFO] $Message" -ForegroundColor Blue
}

function Write-Success {
    param($Message)
    Write-Host "[SUCCESS] $Message" -ForegroundColor Green
}

function Write-Error {
    param($Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

# Check if ssh is available
if (-not (Get-Command ssh -ErrorAction SilentlyContinue)) {
    Write-Error "SSH client not found. Please install OpenSSH or use WSL."
    exit 1
}

Write-Status "Connecting to VPS: $VpsUser@$VpsIp"

# First, push local changes to repository
Write-Status "Pushing local changes to repository..."
try {
    git add .
    git commit -m "Deployment update $(Get-Date -Format 'yyyy-MM-dd HH:mm')" -ErrorAction SilentlyContinue
    git push origin develop
    Write-Success "Local changes pushed to repository"
} catch {
    Write-Status "No new changes to push or push failed"
}

# SSH to VPS and run deployment script
$sshCommand = @"
cd $ProjectPath &&
sudo ./scripts/deploy-update.sh
"@

Write-Status "Running deployment on VPS..."
Write-Host "Executing: ssh $VpsUser@$VpsIp '$sshCommand'" -ForegroundColor Yellow

# Execute SSH command
ssh $VpsUser@$VpsIp $sshCommand

if ($LASTEXITCODE -eq 0) {
    Write-Success "✅ Deployment to VPS completed successfully!"
    Write-Status "Your application should be running at: https://bigbro.nelakawithanage.com"
} else {
    Write-Error "❌ Deployment failed with exit code: $LASTEXITCODE"
    Write-Status "Please check the VPS manually: ssh $VpsUser@$VpsIp"
}

Write-Status "To check status manually:"
Write-Host "  ssh $VpsUser@$VpsIp" -ForegroundColor Yellow
Write-Host "  cd $ProjectPath && pm2 list" -ForegroundColor Yellow