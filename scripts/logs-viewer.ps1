# Big Brother Backend Log Viewer
# Live streaming of backend logs

Write-Host "Big Brother Backend - Live Log Viewer" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Yellow
Write-Host ""

$outputLog = "backend\logs\big-brother-backend-out-0.log"
$errorLog = "backend\logs\big-brother-backend-error-0.log"

# Check if log files exist
if (!(Test-Path $outputLog)) {
    Write-Host "Output log file not found: $outputLog" -ForegroundColor Red
    Write-Host "Make sure the backend is running with PM2" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Monitoring log files:" -ForegroundColor Green
Write-Host "  Output: $outputLog" -ForegroundColor Cyan
Write-Host "  Errors: $errorLog" -ForegroundColor Cyan
Write-Host ""
Write-Host "Live streaming... (Press Ctrl+C to stop)" -ForegroundColor Yellow
Write-Host "================================================" -ForegroundColor Gray
Write-Host ""

# Start monitoring the output log file with live updates
try {
    Get-Content -Path $outputLog -Wait -Tail 5 | ForEach-Object {
        $timestamp = Get-Date -Format "HH:mm:ss"
        Write-Host "[$timestamp] $_" -ForegroundColor White
    }
}
catch {
    Write-Host "❌ Error monitoring logs: $_" -ForegroundColor Red
    Read-Host "Press Enter to exit"
}