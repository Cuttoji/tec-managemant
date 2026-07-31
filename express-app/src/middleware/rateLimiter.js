const rateLimit = require('express-rate-limit');

// Rate limiter for import endpoints: 5 requests per minute per IP
const importRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many import requests, please try again later.' },
});

module.exports = { importRateLimiter };
