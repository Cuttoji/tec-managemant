# ============================================================
#  start.ps1 — รัน Backend + Frontend พร้อมกัน
#  ใช้งาน:  .\start.ps1          (dev mode)
#           .\start.ps1 -Prod    (production mode)
#           .\start.ps1 -Seed    (seed demo data ก่อนรัน)
#           .\start.ps1 -Stop    (หยุดทุก process)
# ============================================================

param(
    [switch]$Prod,
    [switch]$Seed,
    [switch]$Stop
)

$ROOT     = $PSScriptRoot
$BACKEND  = Join-Path $ROOT "express-app"
$FRONTEND = Join-Path $ROOT "frontend"

$BACKEND_PORT  = 3000
$FRONTEND_PORT = 3002

# ── Colors ────────────────────────────────────────────────
function Write-Header($msg) {
    Write-Host ""
    Write-Host "  $msg" -ForegroundColor Cyan
    Write-Host ("  " + "─" * ($msg.Length)) -ForegroundColor DarkGray
}
function Write-Ok($msg)   { Write-Host "  ✓ $msg" -ForegroundColor Green }
function Write-Info($msg) { Write-Host "  ℹ $msg" -ForegroundColor Yellow }
function Write-Err($msg)  { Write-Host "  ✗ $msg" -ForegroundColor Red }

# ── Stop mode ─────────────────────────────────────────────
if ($Stop) {
    Write-Header "Stopping all services"
    Get-Process -Name "node" -ErrorAction SilentlyContinue | Stop-Process -Force
    Write-Ok "All Node processes stopped"
    exit 0
}

# ── Banner ─────────────────────────────────────────────────
Clear-Host
Write-Host ""
Write-Host "  ██████████████████████████████████████" -ForegroundColor Blue
Write-Host "      TechManage — Dev Launcher" -ForegroundColor White
Write-Host "  ██████████████████████████████████████" -ForegroundColor Blue
Write-Host ""

# ── Check node_modules ────────────────────────────────────
Write-Header "Checking dependencies"

if (-not (Test-Path "$BACKEND\node_modules")) {
    Write-Info "Installing backend dependencies..."
    Push-Location $BACKEND
    npm install --silent
    Pop-Location
    Write-Ok "Backend dependencies installed"
} else {
    Write-Ok "Backend node_modules OK"
}

if (-not (Test-Path "$FRONTEND\node_modules")) {
    Write-Info "Installing frontend dependencies..."
    Push-Location $FRONTEND
    npm install --silent
    Pop-Location
    Write-Ok "Frontend dependencies installed"
} else {
    Write-Ok "Frontend node_modules OK"
}

# ── Prisma generate ───────────────────────────────────────
Write-Header "Prisma"
Push-Location $BACKEND
$prismaOut = npx prisma generate 2>&1
if ($LASTEXITCODE -eq 0) { Write-Ok "Prisma client ready" }
else { Write-Err "Prisma generate failed"; Write-Host $prismaOut }
Pop-Location

# ── Seed demo data ────────────────────────────────────────
if ($Seed) {
    Write-Header "Seeding demo data"
    Push-Location $BACKEND
    node scripts/seedDemo.js
    Pop-Location
}

# ── Start Backend ─────────────────────────────────────────
Write-Header "Starting Backend (port $BACKEND_PORT)"
$backendCmd = if ($Prod) { "node src/index.js" } else { "npx nodemon src/index.js" }

$backendJob = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$BACKEND'; $backendCmd" `
    -PassThru `
    -WindowStyle Normal

Write-Ok "Backend started (PID $($backendJob.Id))"

# รอให้ backend พร้อมก่อน
Write-Info "Waiting for backend to be ready..."
$ready = $false
for ($i = 0; $i -lt 15; $i++) {
    Start-Sleep -Seconds 1
    try {
        $r = Invoke-WebRequest -Uri "http://localhost:$BACKEND_PORT/health" -TimeoutSec 2 -ErrorAction Stop
        if ($r.StatusCode -eq 200) { $ready = $true; break }
    } catch {}
    Write-Host "  . " -NoNewline
}
Write-Host ""

if ($ready) { Write-Ok "Backend is responding at http://localhost:$BACKEND_PORT" }
else        { Write-Info "Backend not responding yet (may still be starting)" }

# ── Start Frontend ────────────────────────────────────────
Write-Header "Starting Frontend (port $FRONTEND_PORT)"
$frontendCmd = if ($Prod) { "npm start" } else { "npm run dev" }

$frontendJob = Start-Process -FilePath "powershell.exe" `
    -ArgumentList "-NoExit", "-Command", "cd '$FRONTEND'; $frontendCmd" `
    -PassThru `
    -WindowStyle Normal

Write-Ok "Frontend started (PID $($frontendJob.Id))"

# ── Summary ───────────────────────────────────────────────
Write-Host ""
Write-Host "  ┌─────────────────────────────────────────┐" -ForegroundColor Green
Write-Host "  │          🚀 Services Running             │" -ForegroundColor Green
Write-Host "  ├─────────────────────────────────────────┤" -ForegroundColor Green
Write-Host "  │  Backend   http://localhost:$BACKEND_PORT          │" -ForegroundColor Green
Write-Host "  │  Frontend  http://localhost:$FRONTEND_PORT          │" -ForegroundColor Green
Write-Host "  ├─────────────────────────────────────────┤" -ForegroundColor Green
Write-Host "  │  Demo Login:                            │" -ForegroundColor Green
Write-Host "  │    Admin  admin@demo.com / demo1234     │" -ForegroundColor Green
Write-Host "  │    Tech   tech@demo.com  / demo1234     │" -ForegroundColor Green
Write-Host "  ├─────────────────────────────────────────┤" -ForegroundColor Green
Write-Host "  │  Stop:  .\start.ps1 -Stop               │" -ForegroundColor Green
Write-Host "  └─────────────────────────────────────────┘" -ForegroundColor Green
Write-Host ""
Write-Info "2 terminal windows opened. Close them to stop services."
Write-Host ""
