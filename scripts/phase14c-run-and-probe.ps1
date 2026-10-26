$ErrorActionPreference = "Stop"

Write-Host "Starting Next.js production server on port 3012..."
$serverProcess = Start-Process -FilePath "npx.cmd" -ArgumentList "next", "start", "-p", "3012" -PassThru -NoNewWindow

try {
    Write-Host "Waiting for server to initialize..."
    Start-Sleep -Seconds 6

    # Test server readiness
    $ready = $false
    for ($i = 0; $i -lt 15; $i++) {
        try {
            $response = Invoke-WebRequest -Uri "http://127.0.0.1:3012/de" -UseBasicParsing -TimeoutSec 3
            if ($response.StatusCode -eq 200) {
                $ready = $true
                break
            }
        } catch {
            Start-Sleep -Seconds 2
        }
    }

    if (-not $ready) {
        throw "Server failed to start or respond on port 3012."
    }

    Write-Host "Server is ready! Running probe script..."
    npx.cmd tsx scripts/phase14c-probe-http.ts
    $probeExit = $LASTEXITCODE

    if ($probeExit -ne 0) {
        throw "Probe tests failed with exit code $probeExit"
    }

    Write-Host "All HTTP smoke tests passed successfully!"
} finally {
    Write-Host "Shutting down Next.js server (PID: $($serverProcess.Id))..."
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    # Also kill any node child processes on port 3012 if needed
    Get-Process -Name node -ErrorAction SilentlyContinue | Where-Object { $_.Id -ne $PID } | Stop-Process -Force -ErrorAction SilentlyContinue
    Write-Host "Server stopped."
}
