@echo off
REM Quick Start - Big Brother Dashboard
REM This is a simplified version that just starts both apps

echo 🔍 Quick Start - Big Brother Dashboard
echo ======================================

REM Check if we're in the right directory
if not exist "backend\package.json" (
    echo ERROR: Please run from project root directory
    pause
    exit /b 1
)

echo Starting backend...
start "Backend" cmd /k "cd /d backend && npm run dev"

echo Waiting 3 seconds...
timeout /t 3 /nobreak >nul

echo Starting frontend...
start "Frontend" cmd /k "cd /d frontend && npm run dev"

echo.
echo ✅ Both applications starting...
echo.
echo 🌐 Frontend: http://localhost:3000
echo 🔧 Backend:  http://localhost:3001
echo.
echo 🔐 Login: admin / admin123
echo.
echo Close the CMD windows to stop the applications.

pause