
@echo off
title Timeline Video Editor - Quick Install
color 0A

echo.
echo  ████████╗██╗███╗   ███╗███████╗██╗     ██╗███╗   ██╗███████╗
echo  ╚══██╔══╝██║████╗ ████║██╔════╝██║     ██║████╗  ██║██╔════╝
echo     ██║   ██║██╔████╔██║█████╗  ██║     ██║██╔██╗ ██║█████╗  
echo     ██║   ██║██║╚██╔╝██║██╔══╝  ██║     ██║██║╚██╗██║██╔══╝  
echo     ██║   ██║██║ ╚═╝ ██║███████╗███████╗██║██║ ╚████║███████╗
echo     ╚═╝   ╚═╝╚═╝     ╚═╝╚══════╝╚══════╝╚═╝╚═╝  ╚═══╝╚══════╝
echo.
echo            VIDEO EDITOR - One-Click Installer
echo.
echo ================================================================
echo.

:menu
echo Choose an option:
echo [1] Install (First time setup)
echo [2] Start Application
echo [3] Start Application (Silent mode)
echo [4] Exit
echo.
set /p choice="Enter your choice (1-4): "

if "%choice%"=="1" goto install
if "%choice%"=="2" goto start
if "%choice%"=="3" goto start_silent
if "%choice%"=="4" goto exit
echo Invalid choice. Please try again.
goto menu

:install
echo.
echo Starting installation...
call install.bat
goto menu

:start
echo.
echo Starting application...
call start.bat
goto menu

:start_silent
echo.
echo Starting application in silent mode...
call start-silent.bat
goto menu

:exit
echo.
echo Thank you for using Timeline Video Editor!
timeout /t 2 /nobreak >nul
exit

