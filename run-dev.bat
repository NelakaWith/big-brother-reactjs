@echo off
REM Big Brother Dashboard - Local Development Runner
REM This script starts the dashboard in development mode

setlocal enabledelayedexpansion

echo.
echo 🔍 Big Brother Dashboard - Development Runner
echo ============================================
echo.

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ERROR: backend\package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

if not exist "frontend\package.json" (
    echo ERROR: frontend\package.json not found!
    echo Please run this script from the project root directory.
    pause
    exit /b 1
)

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

REM Check if dependencies are installed
if not exist "backend\node_modules" (
    echo Backend dependencies not found. Installing...
    cd backend
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install backend dependencies
        pause
        exit /b 1
    )
    cd ..
)

if not exist "frontend\node_modules" (
    echo Frontend dependencies not found. Installing...
    cd frontend
    npm install
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install frontend dependencies
        pause
        exit /b 1
    )
    cd ..
)

echo Choose how to run the development environment:
echo.
echo 1. Start with PM2 (Recommended - Both apps in background)
echo 2. Start Backend only (Manual frontend start)
echo 3. Start Frontend only (Manual backend start)
echo 4. Start both in separate windows (CMD windows)
echo 5. Exit
echo.

set /p choice="Enter your choice (1-5): "

if "%choice%"=="1" goto :start_pm2
if "%choice%"=="2" goto :start_backend_only
if "%choice%"=="3" goto :start_frontend_only
if "%choice%"=="4" goto :start_separate_windows
if "%choice%"=="5" goto :exit
goto :invalid_choice

:start_pm2
echo.
echo Starting with PM2...
echo.

REM Check if PM2 is installed
pm2 --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo PM2 not found. Installing PM2 globally...
    npm install -g pm2
    if %ERRORLEVEL% neq 0 (
        echo ERROR: Failed to install PM2
        pause
        exit /b 1
    )
)

REM Stop any existing PM2 processes
echo Stopping any existing PM2 processes...
pm2 stop big-brother-backend >nul 2>&1
pm2 stop big-brother-frontend >nul 2>&1

REM Start backend with PM2
echo Starting backend with PM2...
pm2 start ecosystem.config.js --only big-brother-backend --env development

if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to start backend with PM2
    pause
    exit /b 1
)

REM Wait a moment for backend to start
timeout /t 3 /nobreak >nul

REM Start frontend manually (since PM2 has issues with npm on Windows)
echo Starting frontend in development mode...
echo.
echo Opening new window for frontend...

start "Big Brother Frontend" cmd /k "cd /d "%~dp0frontend" && echo Starting frontend... && npm run dev"

echo.
echo ==========================================
echo 🎉 Development environment started!
echo ==========================================
echo.
echo Backend: Running in PM2 (http://localhost:3001)
echo Frontend: Running in separate window (http://localhost:3000)
echo.
echo PM2 Commands:
echo   pm2 status           - Check status
echo   pm2 logs             - View logs
echo   pm2 stop all         - Stop all processes
echo   pm2 restart all      - Restart all processes
echo.
echo Default credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Press Ctrl+C in the frontend window to stop the frontend
echo Use 'pm2 stop all' to stop the backend
echo.
goto :end

:start_backend_only
echo.
echo Starting backend only...
echo.

REM Check if PM2 is available
pm2 --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Starting backend with PM2...
    pm2 stop big-brother-backend >nul 2>&1
    pm2 start ecosystem.config.js --only big-brother-backend --env development

    echo.
    echo Backend started with PM2!
    echo Backend API: http://localhost:3001
    echo.
    echo To start frontend manually:
    echo   cd frontend
    echo   npm run dev
    echo.
    pm2 status
) else (
    echo Starting backend manually...
    start "Big Brother Backend" cmd /k "cd /d "%~dp0backend" && echo Starting backend... && npm run dev"

    echo.
    echo Backend started in separate window!
    echo Backend API: http://localhost:3001
    echo.
    echo To start frontend manually:
    echo   cd frontend
    echo   npm run dev
)
goto :end

:start_frontend_only
echo.
echo Starting frontend only...
echo.
start "Big Brother Frontend" cmd /k "cd /d "%~dp0frontend" && echo Starting frontend... && npm run dev"

echo.
echo Frontend started in separate window!
echo Frontend: http://localhost:3000
echo.
echo Make sure the backend is running at http://localhost:3001
echo.
goto :end

:start_separate_windows
echo.
echo Starting both applications in separate windows...
echo.

start "Big Brother Backend" cmd /k "cd /d "%~dp0backend" && echo Starting backend... && npm run dev"

REM Wait a moment before starting frontend
timeout /t 2 /nobreak >nul

start "Big Brother Frontend" cmd /k "cd /d "%~dp0frontend" && echo Starting frontend... && npm run dev"

echo.
echo ==========================================
echo 🎉 Both applications started!
echo ==========================================
echo.
echo Backend: Running in separate window (http://localhost:3001)
echo Frontend: Running in separate window (http://localhost:3000)
echo.
echo Default credentials:
echo   Username: admin
echo   Password: admin123
echo.
echo Close the command windows to stop the applications
echo.
goto :end

:invalid_choice
echo.
echo Invalid choice. Please enter a number between 1 and 5.
echo.
pause
goto :start

:exit
echo.
echo Exiting...
exit /b 0

:end
echo Press any key to continue or close this window...
pause >nul