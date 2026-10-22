@echo off
setlocal EnableExtensions DisableDelayedExpansion
set "TTAP_DIR=%~dp0app\release\win-unpacked"

if not exist "%TTAP_DIR%\TTAP-Planner.exe" (
    echo TTAP Planner has not been built yet.
    echo Open a terminal in the project folder and run:
    echo.
    echo   npm --prefix app ci
    echo   npm --prefix app run package:win
    echo.
    pause
    exit /b 1
)

start "TTAP Planner" /d "%TTAP_DIR%" "%TTAP_DIR%\TTAP-Planner.exe"
if errorlevel 1 (
    echo TTAP Planner could not be started. Try rebuilding the Windows app.
    pause
    exit /b 1
)
exit /b 0
