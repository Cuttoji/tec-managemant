const express = require('express');
const router = express.Router();
const { register, login } = require('../controllers/authController');
const { loginRateLimiter } = require('../middleware/rateLimiter');
const { validate } = require('../middleware/validate');
const { loginSchema, registerSchema } = require('../schemas');

router.post('/register', validate(registerSchema), register);
router.post('/login',    loginRateLimiter, validate(loginSchema), login);

module.exports = router;
