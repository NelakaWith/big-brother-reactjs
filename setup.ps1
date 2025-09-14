# Big Brother Dashboard - Windows PowerShell Setup Script
# Requires PowerShell 5.0 or higher

[CmdletBinding()]
param(
    [switch]$Force,
    [switch]$SkipPause,
    [string]$NodeVersion = "latest"
)

# Script configuration
$ErrorActionPreference = "Stop"
$ProgressPreference = "SilentlyContinue"

# Colors for console output
$Colors = @{
    Success = "Green"
    Warning = "Yellow"
    Error   = "Red"
    Info    = "Cyan"
    Header  = "Magenta"
}

function Write-ColorOutput {
    param(
        [string]$Message,
        [string]$Color = "White",
        [switch]$NoNewline
    )

    if ($NoNewline) {
        Write-Host $Message -ForegroundColor $Color -NoNewline
    } else {
        Write-Host $Message -ForegroundColor $Color
    }
}

function Write-Header {
    param([string]$Title)

    Write-ColorOutput "`n🔍 $Title" -Color $Colors.Header
    Write-ColorOutput ("=" * 50) -Color $Colors.Header
}

function Write-Success {
    param([string]$Message)
    Write-ColorOutput "✓ $Message" -Color $Colors.Success
}

function Write-Warning {
    param([string]$Message)
    Write-ColorOutput "⚠ $Message" -Color $Colors.Warning
}

function Write-Error {
    param([string]$Message)
    Write-ColorOutput "✗ $Message" -Color $Colors.Error
}

function Write-Info {
    param([string]$Message)
    Write-ColorOutput "ℹ $Message" -Color $Colors.Info
}

function Test-Command {
    param([string]$Command)

    try {
        $null = Get-Command $Command -ErrorAction Stop
        return $true
    }
    catch {
        return $false
    }
}

function Get-VersionString {
    param([string]$Command)

    try {
        $version = & $Command --version 2>$null
        return $version
    }
    catch {
        return "Unknown"
    }
}

function Install-NodeDependencies {
    param(
        [string]$Path,
        [string]$Name
    )

    Write-Info "Installing $Name dependencies..."

    if (!(Test-Path $Path)) {
        Write-Error "Directory $Path not found!"
        throw "Missing directory: $Path"
    }

    Push-Location $Path

    try {
        # Clean install if Force is specified
        if ($Force -and (Test-Path "node_modules")) {
            Write-Warning "Force flag specified, removing existing node_modules..."
            Remove-Item "node_modules" -Recurse -Force
        }

        # Check if package.json exists
        if (!(Test-Path "package.json")) {
            Write-Error "package.json not found in $Path"
            throw "Missing package.json in $Path"
        }

        # Install dependencies
        Write-Info "Running npm install in $Path..."
        $result = npm install --no-audit --no-fund 2>&1

        if ($LASTEXITCODE -ne 0) {
            Write-Error "Failed to install $Name dependencies"
            Write-Host $result -ForegroundColor Red
            throw "npm install failed for $Name"
        }

        Write-Success "$Name dependencies installed successfully"
    }
    finally {
        Pop-Location
    }
}

function Test-NetworkConnection {
    try {
        $null = Test-NetConnection -ComputerName "registry.npmjs.org" -Port 443 -InformationLevel Quiet -WarningAction SilentlyContinue
        return $true
    }
    catch {
        return $false
    }
}

# Main setup function
function Start-Setup {
    try {
        Write-Header "Big Brother Dashboard - Windows Setup"

        # Check network connectivity
        Write-Info "Checking network connectivity..."
        if (!(Test-NetworkConnection)) {
            Write-Warning "Network connectivity to npm registry seems limited. Installation may be slower."
        } else {
            Write-Success "Network connectivity verified"
        }

        # Check PowerShell version
        $psVersion = $PSVersionTable.PSVersion
        Write-Info "PowerShell version: $($psVersion.ToString())"

        if ($psVersion.Major -lt 5) {
            Write-Warning "PowerShell 5.0 or higher is recommended for best experience"
        }

        # Check if Node.js is installed
        Write-Info "Checking Node.js installation..."
        if (!(Test-Command "node")) {
            Write-Error "Node.js is not installed or not in PATH"
            Write-Info "Please install Node.js from: https://nodejs.org/"
            Write-Info "Recommended version: Node.js 18 LTS or higher"

            if (!$SkipPause) {
                Read-Host "Press Enter to continue after installing Node.js"
            }
            throw "Node.js not found"
        }

        $nodeVersion = Get-VersionString "node"
        Write-Success "Node.js found: $nodeVersion"

        # Verify Node.js version
        $nodeVersionNumber = [version]($nodeVersion -replace 'v', '' -split '\.' | Select-Object -First 3 | Join-String -Separator '.')
        if ($nodeVersionNumber -lt [version]"16.0.0") {
            Write-Warning "Node.js version $nodeVersion detected. Version 16+ is recommended."
        }

        # Check if npm is installed
        Write-Info "Checking npm installation..."
        if (!(Test-Command "npm")) {
            Write-Error "npm is not installed or not in PATH"
            throw "npm not found"
        }

        $npmVersion = Get-VersionString "npm"
        Write-Success "npm found: $npmVersion"

        # Check and install PM2
        Write-Info "Checking PM2 installation..."
        if (!(Test-Command "pm2")) {
            Write-Warning "PM2 not found. Installing PM2 globally..."

            try {
                $result = npm install -g pm2 2>&1
                if ($LASTEXITCODE -ne 0) {
                    Write-Error "Failed to install PM2 globally"
                    Write-Host $result -ForegroundColor Red
                    throw "PM2 installation failed"
                }
                Write-Success "PM2 installed successfully"
            }
            catch {
                Write-Error "PM2 installation failed: $($_.Exception.Message)"
                Write-Warning "You may need to run this script as Administrator"
                throw
            }
        } else {
            $pm2Version = Get-VersionString "pm2"
            Write-Success "PM2 found: $pm2Version"
        }

        # Install backend dependencies
        Write-Header "Installing Dependencies"
        Install-NodeDependencies -Path "backend" -Name "Backend"

        # Install frontend dependencies
        Install-NodeDependencies -Path "frontend" -Name "Frontend"

        # Setup completion
        Write-Header "Setup Complete!"
        Write-Success "Big Brother Dashboard setup completed successfully!"

        Write-Info "`nTo start the development environment:"
        Write-Host "`n1. Start backend:" -ForegroundColor White
        Write-Host "   cd backend" -ForegroundColor Gray
        Write-Host "   npm run dev" -ForegroundColor Gray

        Write-Host "`n2. Start frontend (in new terminal):" -ForegroundColor White
        Write-Host "   cd frontend" -ForegroundColor Gray
        Write-Host "   npm run dev" -ForegroundColor Gray

        Write-Host "`n3. Or use PM2 to start both:" -ForegroundColor White
        Write-Host "   pm2 start ecosystem.config.js --env development" -ForegroundColor Gray

        Write-Host "`n4. Or use the quick start script:" -ForegroundColor White
        Write-Host "   .\run-dev.ps1" -ForegroundColor Gray

        Write-Info "`nApplication URLs:"
        Write-Host "   Frontend: " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:3000 (dev) / localhost:3006 (prod)" -ForegroundColor Cyan
        Write-Host "   Backend:  " -NoNewline -ForegroundColor White
        Write-Host "http://localhost:3001" -ForegroundColor Cyan

        Write-Warning "`n⚠️  Port Configuration:"
        Write-Host "   Development: Frontend uses port 3000" -ForegroundColor Gray
        Write-Host "   Production:  Frontend uses port 3006 (to avoid conflicts)" -ForegroundColor Gray

        Write-Info "`nDefault credentials:"
        Write-Host "   ⚠️  SECURITY NOTICE: No default credentials provided" -ForegroundColor Red
        Write-Host "   📋 SETUP REQUIRED: Run backend setup to create admin account" -ForegroundColor Yellow
        Write-Host "   📁 Instructions: See SECURITY.md for setup guidelines" -ForegroundColor Cyan

        Write-Info "`nUseful commands:"
        Write-Host "   .\setup.ps1 -Force     # Force reinstall all dependencies" -ForegroundColor Gray
        Write-Host "   .\run-dev.ps1          # Start development servers" -ForegroundColor Gray
        Write-Host "   .\clear-ports.bat      # Clear stuck ports" -ForegroundColor Gray

        Write-Info "`n🔐 Security Setup Required:"
        Write-Host "   Before first login, create admin credentials:" -ForegroundColor Yellow
        Write-Host "   1. cd backend" -ForegroundColor Cyan
        Write-Host "   2. npm run setup" -ForegroundColor Cyan
        Write-Host "   3. Follow prompts to create secure admin account" -ForegroundColor Cyan
        Write-Host "   4. Use your custom credentials to login" -ForegroundColor Cyan

    }
    catch {
        Write-Error "Setup failed: $($_.Exception.Message)"

        Write-Info "`nTroubleshooting tips:"
        Write-Host "1. Run as Administrator if permission errors occur" -ForegroundColor Gray
        Write-Host "2. Check your internet connection" -ForegroundColor Gray
        Write-Host "3. Clear npm cache: npm cache clean --force" -ForegroundColor Gray
        Write-Host "4. Use -Force flag to reinstall dependencies" -ForegroundColor Gray

        if (!$SkipPause) {
            Read-Host "`nPress Enter to exit"
        }
        exit 1
    }
}

# Help function
function Show-Help {
    Write-Host @"

Big Brother Dashboard - PowerShell Setup Script

USAGE:
    .\setup.ps1 [OPTIONS]

OPTIONS:
    -Force          Force reinstall all dependencies (removes node_modules)
    -SkipPause      Skip pause prompts (for automated scripts)
    -NodeVersion    Specify Node.js version preference (default: latest)
    -Help           Show this help message

EXAMPLES:
    .\setup.ps1                    # Normal setup
    .\setup.ps1 -Force             # Force clean install
    .\setup.ps1 -SkipPause         # Automated setup
    .\setup.ps1 -Force -SkipPause  # Automated clean install

REQUIREMENTS:
    - PowerShell 5.0 or higher
    - Node.js 16+ (will be checked)
    - npm (comes with Node.js)
    - Internet connection

"@ -ForegroundColor White
}

# Script entry point
if ($args -contains "-Help" -or $args -contains "--help" -or $args -contains "/?") {
    Show-Help
    exit 0
}

# Run the main setup
Start-Setup

# Pause if not skipped
if (!$SkipPause) {
    Write-Host "`nPress Enter to exit..." -ForegroundColor DarkGray
    Read-Host
}