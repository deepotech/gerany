$server = Start-Process -FilePath "node" -ArgumentList @("./node_modules/next/dist/bin/next", "start", "-p", "3010", "-H", "127.0.0.1") -PassThru -RedirectStandardOutput "./next-stdout.log" -RedirectStandardError "./next-stderr.log"
Start-Sleep -Seconds 6
try {
    npx tsx scripts/phase13b-probe-http.ts
    $code = $LASTEXITCODE
} finally {
    Stop-Process -Id $server.Id -Force
}
if ($code -ne 0) {
    exit $code
}
