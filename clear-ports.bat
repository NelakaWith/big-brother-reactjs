@echo off
REM Port Cleaner - Clear occupied ports for Big Brother Dashboard

echo 🧹 Port Cleaner - Big Brother Dashboard
echo ========================================

echo.
echo This script will help you clear occupied ports.
echo Default ports used by Big Brother Dashboard:
echo   - Frontend: 3000
echo   - Backend:  3001
echo.

echo Choose an option:
echo.
echo 1. Clear default ports (3000, 3001)
echo 2. Clear specific port
echo 3. Show all processes using ports 3000-3010
echo 4. Kill all Node.js processes
echo 5. Stop PM2 processes
echo 6. Exit
echo.

set /p choice="Enter your choice (1-6): "

if "%choice%"=="1" goto :clear_default_ports
if "%choice%"=="2" goto :clear_specific_port
if "%choice%"=="3" goto :show_processes
if "%choice%"=="4" goto :kill_all_node
if "%choice%"=="5" goto :stop_pm2
if "%choice%"=="6" goto :exit
goto :invalid_choice

:clear_default_ports
echo.
echo Clearing default ports (3000, 3001)...
echo.

echo Checking port 3000...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3000') do (
    echo Killing process %%a using port 3000...
    taskkill /f /pid %%a >nul 2>&1
)

echo Checking port 3001...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr :3001') do (
    echo Killing process %%a using port 3001...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ✅ Default ports cleared!
goto :verify_ports

:clear_specific_port
echo.
set /p port="Enter port number to clear: "

if "%port%"=="" (
    echo ERROR: No port specified.
    goto :end
)

echo.
echo Clearing port %port%...

for /f "tokens=5" %%a in ('netstat -aon ^| findstr :%port%') do (
    echo Killing process %%a using port %port%...
    taskkill /f /pid %%a >nul 2>&1
)

echo.
echo ✅ Port %port% cleared!
goto :end

:show_processes
echo.
echo Processes using ports 3000-3010:
echo ================================

for /l %%i in (3000,1,3010) do (
    echo.
    echo Port %%i:
    netstat -aon | findstr :%%i
)

echo.
goto :end

:kill_all_node
echo.
echo ⚠️  WARNING: This will kill ALL Node.js processes!
set /p confirm="Are you sure? (y/n): "

if /i "%confirm%"=="y" (
    echo.
    echo Killing all Node.js processes...
    taskkill /f /im node.exe >nul 2>&1
    taskkill /f /im npm.cmd >nul 2>&1
    echo ✅ All Node.js processes killed!
) else (
    echo Operation cancelled.
)
goto :end

:stop_pm2
echo.
echo Stopping PM2 processes...

pm2 --version >nul 2>&1
if %ERRORLEVEL% equ 0 (
    echo Stopping all PM2 processes...
    pm2 stop all
    echo.
    echo Deleting PM2 processes...
    pm2 delete all
    echo.
    echo ✅ PM2 processes stopped and deleted!
) else (
    echo PM2 not found or not installed.
)
goto :end

:verify_ports
echo.
echo Verifying ports are free...
echo.

echo Checking port 3000:
netstat -aon | findstr :3000
if %ERRORLEVEL% equ 0 (
    echo ⚠️  Port 3000 still occupied
) else (
    echo ✅ Port 3000 is free
)

echo.
echo Checking port 3001:
netstat -aon | findstr :3001
if %ERRORLEVEL% equ 0 (
    echo ⚠️  Port 3001 still occupied
) else (
    echo ✅ Port 3001 is free
)

goto :end

:invalid_choice
echo.
echo Invalid choice. Please enter a number between 1 and 6.
echo.
pause
goto :start

:exit
echo.
echo Exiting...
exit /b 0

:end
echo.
echo ========================================
echo 📝 Useful Commands:
echo ========================================
echo.
echo Check specific port:
echo   netstat -aon ^| findstr :PORT_NUMBER
echo.
echo Kill specific process:
echo   taskkill /f /pid PROCESS_ID
echo.
echo Kill by process name:
echo   taskkill /f /im node.exe
echo.
echo PM2 commands:
echo   pm2 stop all    - Stop all PM2 processes
echo   pm2 delete all  - Delete all PM2 processes
echo   pm2 status      - Show PM2 status
echo.

pause