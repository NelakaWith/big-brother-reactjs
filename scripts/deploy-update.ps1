# PowerShell Deployment Update Script for Big Brother Dashboard
# Use this on Windows to update your local development environment

Write-Host "🔄 Updating Big Brother Dashboard (Local Dev)..." -ForegroundColor Blue

# Configuration
$ProjectDir = "D:\Projects\Samples\big-brother\big-brother-reactjs"

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

# Check if we're in the right directory
if (-not (Test-Path "../ecosystem.config.js")) {
    if (Test-Path $ProjectDir) {
        Set-Location $ProjectDir
        Write-Status "Changed to project directory: $ProjectDir"
    } else {
        Write-Error "Project directory not found."
        exit 1
    }
}

# Pull latest changes
Write-Status "Pulling latest changes from develop branch..."
git fetch origin
git pull origin develop

# Check if package.json changed
$packageChanged = git diff --name-only HEAD~1 HEAD | Select-String "package.json"

if ($packageChanged) {
    Write-Status "Package.json changed, updating dependencies..."

    # Update backend dependencies
    Write-Status "Updating backend dependencies..."
    Set-Location backend
    npm install
    npm rebuild better-sqlite3

    # Update frontend dependencies
    Write-Status "Updating frontend dependencies..."
    Set-Location ../frontend
    npm install

    Set-Location ..
} else {
    Write-Status "No package.json changes detected, skipping dependency installation"
}

# Build frontend for development
Write-Status "Building frontend..."
Set-Location frontend
npm run build
Set-Location ..

# For local development, you would typically restart your dev servers
Write-Status "For local development, restart your servers:"
Write-Host "  Backend: cd backend && npm start" -ForegroundColor Yellow
Write-Host "  Frontend: cd frontend && npm run dev" -ForegroundColor Yellow

Write-Success "✅ Local update completed!"
Write-Status "You can now restart your development servers"