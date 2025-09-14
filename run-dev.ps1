# Big Brother Dashboard - PowerShell Development Runner
# =======================================================

Write-Host "🚀 Big Brother Dashboard - Development Runner" -ForegroundColor Cyan
Write-Host "============================================" -ForegroundColor Cyan
Write-Host ""

# Check if dependencies are installed
if (!(Test-Path "backend\node_modules")) {
    Write-Host "Backend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location backend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install backend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location ..
}

if (!(Test-Path "frontend\node_modules")) {
    Write-Host "Frontend dependencies not found. Installing..." -ForegroundColor Yellow
    Set-Location frontend
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "ERROR: Failed to install frontend dependencies" -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
    Set-Location ..
}

Write-Host ""
Write-Host "Choose your preferred development setup:" -ForegroundColor Green
Write-Host "1. Start with PM2 (Backend in PM2 + logs, Frontend in separate window)" -ForegroundColor White
Write-Host "2. Start both in separate CMD windows (Visible logs for both)" -ForegroundColor White
Write-Host "3. Start in current window (You'll see frontend logs here)" -ForegroundColor White
Write-Host "4. Quick start - separate windows with detailed logging" -ForegroundColor White
Write-Host "5. Exit" -ForegroundColor White
Write-Host ""

$choice = Read-Host "Enter your choice (1-5)"

switch ($choice) {
    "1" {
        Write-Host "Starting with PM2..." -ForegroundColor Yellow

        # Stop any existing PM2 processes
        pm2 stop all 2>$null
        pm2 delete all 2>$null

        # Start backend with PM2
        Write-Host "Starting backend with PM2..." -ForegroundColor Green
        pm2 start ecosystem.config.js --only big-brother-backend --env development

        if ($LASTEXITCODE -ne 0) {
            Write-Host "ERROR: Failed to start backend with PM2" -ForegroundColor Red
            Read-Host "Press Enter to exit"
            exit 1
        }

        # Wait a moment for backend to start
        Start-Sleep -Seconds 3

        # Start PM2 logs in a separate window with real-time streaming
        Write-Host "Starting PM2 logs in separate window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-File", "$PWD\logs-viewer.ps1" -WindowStyle Normal

        # Start frontend in separate window
        Write-Host "Starting frontend in separate window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; npm run dev" -WindowStyle Normal

        Write-Host ""
        Write-Host "✅ Started successfully!" -ForegroundColor Green
        Write-Host "Backend (PM2): http://localhost:3001" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "PM2 logs window opened separately" -ForegroundColor Cyan
        Write-Host ""
        Write-Host "To stop:"
        Write-Host "  pm2 stop all" -ForegroundColor Yellow
        Write-Host "  pm2 delete all" -ForegroundColor Yellow
    }

    "2" {
        Write-Host "Starting both in separate CMD windows..." -ForegroundColor Yellow

        # Stop any existing PM2 processes
        pm2 stop all 2>$null
        pm2 delete all 2>$null

        Write-Host "Starting backend in separate window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Starting backend...'; npm run dev" -WindowStyle Normal

        # Wait a moment for backend to start
        Start-Sleep -Seconds 3

        Write-Host "Starting frontend in separate window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Starting frontend...'; npm run dev" -WindowStyle Normal

        Write-Host ""
        Write-Host "✅ Started successfully!" -ForegroundColor Green
        Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Both running in separate windows with visible logs" -ForegroundColor Cyan
    }

    "3" {
        Write-Host "Starting in current window..." -ForegroundColor Yellow

        # Stop any existing PM2 processes
        pm2 stop all 2>$null
        pm2 delete all 2>$null

        Write-Host "Starting backend in separate window..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Starting backend...'; npm run dev" -WindowStyle Normal

        # Wait a moment for backend to start
        Start-Sleep -Seconds 5

        Write-Host "Starting frontend in current window..." -ForegroundColor Green
        Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host ""
        Set-Location frontend
        npm run dev
    }

    "4" {
        Write-Host "Quick start - separate windows with detailed logging..." -ForegroundColor Yellow

        # Stop any existing PM2 processes
        pm2 stop all 2>$null
        pm2 delete all 2>$null

        Write-Host "Starting backend with detailed logging..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\backend'; Write-Host 'Big Brother Backend Starting...' -ForegroundColor Green; Write-Host 'Port: 3001' -ForegroundColor Cyan; Write-Host 'Environment: Development' -ForegroundColor Cyan; Write-Host '=========================' -ForegroundColor Yellow; npm run dev" -WindowStyle Normal

        # Wait a moment for backend to start
        Start-Sleep -Seconds 3

        Write-Host "Starting frontend with detailed logging..." -ForegroundColor Green
        Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PWD\frontend'; Write-Host 'Big Brother Frontend Starting...' -ForegroundColor Green; Write-Host 'Port: 3000' -ForegroundColor Cyan; Write-Host 'Framework: Next.js' -ForegroundColor Cyan; Write-Host '=========================' -ForegroundColor Yellow; npm run dev" -WindowStyle Normal

        Write-Host ""
        Write-Host "✅ Quick start completed!" -ForegroundColor Green
        Write-Host "Backend: http://localhost:3001" -ForegroundColor Cyan
        Write-Host "Frontend: http://localhost:3000" -ForegroundColor Cyan
        Write-Host "Both running in separate windows with enhanced logging" -ForegroundColor Cyan
    }

    "5" {
        Write-Host "Exiting..." -ForegroundColor Yellow
        exit 0
    }

    default {
        Write-Host "Invalid choice. Please run the script again." -ForegroundColor Red
        Read-Host "Press Enter to exit"
        exit 1
    }
}

Write-Host ""
Write-Host "🎯 Development environment ready!" -ForegroundColor Green
Write-Host ""
Write-Host "Useful commands:" -ForegroundColor Yellow
Write-Host "  pm2 status      - Check PM2 processes" -ForegroundColor Cyan
Write-Host "  pm2 logs        - View all PM2 logs" -ForegroundColor Cyan
Write-Host "  pm2 stop all    - Stop all processes" -ForegroundColor Cyan
Write-Host "  pm2 delete all  - Remove all processes" -ForegroundColor Cyan
Write-Host ""

Read-Host "Press Enter to continue"