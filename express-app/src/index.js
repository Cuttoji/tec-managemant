const express = require('express');
const path    = require('path');
const helmet  = require('helmet');
const app = express();
const port = process.env.PORT || 3000;

const { apiRateLimiter } = require('./middleware/rateLimiter');

const healthRouter      = require('./routes/health');
const importRouter      = require('./routes/import');
const assetsRouter      = require('./routes/assets');
const authRouter        = require('./routes/auth');
const usersRouter       = require('./routes/users');
const locationsRouter   = require('./routes/locations');
const maintenanceRouter = require('./routes/maintenance');

// ── Security headers ──────────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: false,   // disabled: API-only, no HTML served
  crossOriginEmbedderPolicy: false,
}));

// ── CORS: allow frontend origin ───────────────────────────────────────────────
app.use((req, res, next) => {
  const origin = req.headers.origin;
  const allowed = (process.env.CORS_ORIGINS || 'http://localhost:3002').split(',').map(s => s.trim());
  if (origin && allowed.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(204);
  next();
});

// ── Global rate limit ─────────────────────────────────────────────────────────
app.use(apiRateLimiter);

app.use(express.json({ limit: '500kb' }));
// Serve uploaded map images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/health', healthRouter);
app.use('/import', express.text({ type: ['application/xml', 'text/xml', 'text/*'], limit: '1mb' }));
app.use('/import', importRouter);
app.use('/assets', assetsRouter);
app.use('/auth',   authRouter);
app.use('/users',  usersRouter);
app.use('/locations',  locationsRouter);
app.use('/maintenance', maintenanceRouter);

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Welcome to Express app' }));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
