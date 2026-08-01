@echo off
chcp 65001 >nul
title TechManage Launcher

echo.
echo  ==========================================
echo      TechManage ^— Dev Launcher
echo  ==========================================
echo.

SET ROOT=%~dp0
SET BACKEND=%ROOT%express-app
SET FRONTEND=%ROOT%frontend

:: ── Check node_modules ──────────────────────────────────
echo  [1/3] Checking dependencies...

IF NOT EXIST "%BACKEND%\node_modules" (
    echo       Installing backend dependencies...
    cd /d "%BACKEND%"
    npm install --silent
    echo       Backend dependencies installed
) ELSE (
    echo       Backend node_modules OK
)

IF NOT EXIST "%FRONTEND%\node_modules" (
    echo       Installing frontend dependencies...
    cd /d "%FRONTEND%"
    npm install --silent
    echo       Frontend dependencies installed
) ELSE (
    echo       Frontend node_modules OK
)

:: ── Prisma generate ─────────────────────────────────────
echo.
echo  [2/3] Generating Prisma client...
cd /d "%BACKEND%"
call npx prisma generate >nul 2>&1
echo       Prisma client ready

:: ── Start services ──────────────────────────────────────
echo.
echo  [3/3] Starting services...

:: Backend — เปิด terminal ใหม่
start "TechManage Backend :3000" cmd /k "cd /d "%BACKEND%" && echo Backend starting on port 3000... && npx nodemon src/index.js"

:: รอ 3 วินาทีก่อนเปิด frontend
timeout /t 3 /nobreak >nul

:: Frontend — เปิด terminal ใหม่
start "TechManage Frontend :3002" cmd /k "cd /d "%FRONTEND%" && echo Frontend starting on port 3002... && npm run dev"

:: ── Summary ─────────────────────────────────────────────
echo.
echo  ==========================================
echo   Services started in separate windows!
echo  ==========================================
echo.
echo   Backend   :  http://localhost:3000
echo   Frontend  :  http://localhost:3002
echo.
echo   Demo Login:
echo     Admin   admin@demo.com  / demo1234
echo     Tech    tech@demo.com   / demo1234
echo.
echo   Close the terminal windows to stop.
echo  ==========================================
echo.
pause
