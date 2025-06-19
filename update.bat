
@echo off
echo ===============================================
echo Timeline Video Editor - Update Script
echo ===============================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Updating frontend dependencies to latest versions...
call npm update --latest
if %errorlevel% neq 0 (
    echo ERROR: Failed to update frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Clearing npm cache...
call npm cache clean --force

echo.
echo Updating backend dependencies...
cd server
call npm update --latest
if %errorlevel% neq 0 (
    echo ERROR: Failed to update backend dependencies!
    pause
    exit /b 1
)

echo.
echo Clearing server npm cache...
call npm cache clean --force

cd ..

echo.
echo ===============================================
echo Update completed successfully!
echo ===============================================
echo.
echo All dependencies have been updated to latest versions.
echo To start the application, run: start.bat
echo.
pause
