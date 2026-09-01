const rateLimit = require('express-rate-limit');

// ── Import rate limiter: 5 requests per minute per IP ────────────────────────
const importRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many import requests, please try again later.' },
});

// ── Login rate limiter: 10 attempts per 15 min per IP ────────────────────────
const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Please try again after 15 minutes.' },
  skipSuccessfulRequests: true,   // only count failed/slow attempts
});

// ── General API limiter: 300 requests per minute per IP ──────────────────────
const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Rate limit exceeded. Slow down.' },
});

module.exports = { importRateLimiter, loginRateLimiter, apiRateLimiter };
