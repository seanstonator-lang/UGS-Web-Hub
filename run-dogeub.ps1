$ErrorActionPreference = "Stop"
$repoRoot = Split-Path -Parent $MyInvocation.MyCommand.Path
Set-Location $repoRoot

if (-not (Test-Path "dogeub\node_modules")) {
  Write-Host "Installing DogeUB dependencies..."
  npm run dogeub:install
}

if (-not (Test-Path "dogeub\dist")) {
  Write-Host "Building DogeUB..."
  npm run dogeub:build
}

Write-Host "Starting DogeUB on http://127.0.0.1:2345"
npm run dogeub:start
