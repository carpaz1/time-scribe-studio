
@echo off
echo ===============================================
echo Timeline Video Editor - Installation Script
echo ===============================================
echo.

echo Checking if Node.js is installed...
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ERROR: Node.js is not installed!
    echo Please install Node.js from https://nodejs.org/
    echo After installing Node.js, run this script again.
    pause
    exit /b 1
)

echo Node.js found!
echo.

echo Installing frontend dependencies...
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install frontend dependencies!
    pause
    exit /b 1
)

echo.
echo Installing backend dependencies...
cd server
call npm install
if %errorlevel% neq 0 (
    echo ERROR: Failed to install backend dependencies!
    pause
    exit /b 1
)

cd ..

echo.
echo ===============================================
echo Installation completed successfully!
echo ===============================================
echo.
echo To start the application, run: start.bat
echo.
pause
