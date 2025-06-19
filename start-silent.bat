
@echo off
echo Starting Timeline Video Editor...

cd server
start /min cmd /c npm start

timeout /t 3 /nobreak >nul

cd ..
start /min cmd /c npm run dev

echo Application started! Check http://localhost:5173
timeout /t 3 /nobreak >nul
