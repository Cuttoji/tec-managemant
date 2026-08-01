@echo off
chcp 65001 >nul
title TechManage — First Run Setup

echo.
echo  ==========================================
echo      TechManage ^— First Run Setup
echo  ==========================================
echo.

SET ROOT=%~dp0
SET BACKEND=%ROOT%express-app
SET FRONTEND=%ROOT%frontend

:: ── Install dependencies ─────────────────────────────────
echo  [1/4] Installing dependencies...

IF NOT EXIST "%BACKEND%\node_modules" (
    echo       Installing backend...
    cd /d "%BACKEND%"
    npm install
)

IF NOT EXIST "%FRONTEND%\node_modules" (
    echo       Installing frontend...
    cd /d "%FRONTEND%"
    npm install
)
echo       Done

:: ── Prisma migrate ───────────────────────────────────────
echo.
echo  [2/4] Running database migrations...
cd /d "%BACKEND%"
call npx prisma migrate deploy
echo       Migrations applied

:: ── Seed demo data ───────────────────────────────────────
echo.
echo  [3/4] Seeding demo data...
cd /d "%BACKEND%"
node scripts/seedDemo.js

:: ── Start services ───────────────────────────────────────
echo.
echo  [4/4] Starting services...

start "TechManage Backend :3000" cmd /k "cd /d "%BACKEND%" && npx nodemon src/index.js"
timeout /t 3 /nobreak >nul
start "TechManage Frontend :3002" cmd /k "cd /d "%FRONTEND%" && npm run dev"

echo.
echo  ==========================================
echo   Setup complete! Services running.
echo  ==========================================
echo.
echo   http://localhost:3002
echo.
echo   Admin    admin@demo.com  / demo1234
echo   Tech 1   tech@demo.com   / demo1234
echo   Tech 2   tech2@demo.com  / demo1234
echo  ==========================================
echo.
pause
