
@echo off
echo ===============================================
echo Timeline Video Editor - Starting Application
echo ===============================================
echo.

echo Starting backend server...
cd server
start "Timeline Editor Server" cmd /c "npm start & pause"

echo Waiting for server to start...
timeout /t 3 /nobreak >nul

cd ..

echo Starting frontend application...
start "Timeline Editor Frontend" cmd /c "npm run dev & pause"

echo.
echo ===============================================
echo Application started successfully!
echo ===============================================
echo.
echo Frontend: http://localhost:5173
echo Backend:  http://localhost:4000
echo.
echo Both applications are running in separate windows.
echo Close those windows to stop the application.
echo.
pause
