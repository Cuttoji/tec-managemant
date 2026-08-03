const express = require('express');
const path    = require('path');
const app = express();
const port = process.env.PORT || 3000;

const healthRouter = require('./routes/health');
const importRouter = require('./routes/import');
const assetsRouter = require('./routes/assets');
const authRouter = require('./routes/auth');
const usersRouter = require('./routes/users');
const locationsRouter = require('./routes/locations');
const maintenanceRouter = require('./routes/maintenance');

app.use(express.json());
// Serve uploaded map images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));
app.use('/health', healthRouter);
// Limit import body size to 1MB to prevent huge uploads; text parser handles XML and CSV
app.use('/import', express.text({ type: ['application/xml', 'text/xml', 'text/*'], limit: '1mb' }));
app.use('/import', importRouter);
app.use('/assets', express.json());
app.use('/assets', assetsRouter);
app.use('/auth', express.json());
app.use('/auth', authRouter);
app.use('/users', express.json());
app.use('/users', usersRouter);
app.use('/locations', express.json());
app.use('/locations', locationsRouter);
app.use('/maintenance', express.json());
app.use('/maintenance', maintenanceRouter);

app.get('/', (req, res) => res.json({ status: 'ok', message: 'Welcome to Express app' }));

if (require.main === module) {
  app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
  });
}

module.exports = app;
