@echo off
setlocal
cd /d "%~dp0"

if not exist "dogeub\node_modules" (
  echo Installing DogeUB dependencies...
  call npm run dogeub:install
  if errorlevel 1 goto :fail
)

if not exist "dogeub\dist" (
  echo Building DogeUB...
  call npm run dogeub:build
  if errorlevel 1 goto :fail
)

echo Starting DogeUB on http://127.0.0.1:2345
call npm run dogeub:start
goto :eof

:fail
echo DogeUB setup failed.
pause
