@echo off
REM Big Brother Dashboard - Windows Development Setup Script

echo 🔍 Big Brother Dashboard - Windows Setup
echo ==========================================

REM Check if Node.js is installed
node --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: Node.js is not installed. Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
) else (
    echo ✓ Node.js found:
    node --version
)

REM Check if npm is installed
npm --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo ERROR: npm is not installed.
    pause
    exit /b 1
) else (
    echo ✓ npm found:
    npm --version
)

REM Install PM2 globally if not already installed
pm2 --version >nul 2>&1
if %ERRORLEVEL% neq 0 (
    echo Installing PM2 globally...
    npm install -g pm2
) else (
    echo ✓ PM2 found:
    pm2 --version
)

echo.
echo Installing backend dependencies...
cd backend
npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install backend dependencies
    pause
    exit /b 1
)

echo.
echo Installing frontend dependencies...
cd ..\frontend
npm install
if %ERRORLEVEL% neq 0 (
    echo ERROR: Failed to install frontend dependencies
    pause
    exit /b 1
)

cd ..

echo.
echo ==========================================
echo 🎉 Setup complete!
echo ==========================================
echo.
echo To start the development environment:
echo.
echo 1. Start backend:
echo    cd backend
echo    npm run dev
echo.
echo 2. Start frontend (in new terminal):
echo    cd frontend
echo    npm run dev
echo.
echo 3. Or use PM2 to start both:
echo    pm2 start ecosystem.config.js --env development
echo.
echo Frontend will be available at: http://localhost:3000
echo Backend API will be available at: http://localhost:3001
echo.
echo Default credentials:
echo   Username: admin
echo   Password: admin123
echo.

pause