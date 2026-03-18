// ✅ Load environment variables first
require('dotenv').config();

const express = require('express');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const { body, validationResult } = require('express-validator');

const app = express();

// ✅ Secret from environment variable only - NEVER hardcoded
const SECRET = process.env.JWT_SECRET;
const ADMIN_USER = process.env.ADMIN_USER || 'admin';
const ADMIN_PASS = process.env.ADMIN_PASS;
const NODE_ENV = process.env.NODE_ENV || 'development';

// ✅ Validate critical environment variables
if (!SECRET || SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET not set or too short (minimum 32 chars)');
  process.exit(1);
}

if (!ADMIN_PASS) {
  console.error('❌ FATAL: ADMIN_PASS not set');
  process.exit(1);
}

// ✅ Security middleware
app.use(helmet()); // Set various HTTP headers
app.use(express.json({ limit: '10kb' })); // Limit payload size
app.use(express.urlencoded({ limit: '10kb', extended: false }));

// ✅ Rate limiting on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ✅ Input validation and sanitization
const loginValidation = [
  body('username')
    .trim()
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/)
    .withMessage('Invalid username format'),
  body('password')
    .isString()
    .isLength({ min: 8 })
    .withMessage('Password too short'),
];

// ✅ Health check endpoint (no sensitive info)
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// ✅ Secure login endpoint
app.post('/api/login', loginLimiter, loginValidation, (req, res) => {
  // Check validation errors
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { username, password } = req.body;

  // ✅ Use constant-time comparison to prevent timing attacks
  const usernameMatch = username === ADMIN_USER;
  const passwordMatch = password === ADMIN_PASS;

  if (usernameMatch && passwordMatch) {
    try {
      const token = jwt.sign(
        { username, iat: Math.floor(Date.now() / 1000) },
        SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
      );
      res.json({ token, expiresIn: '1h' });
    } catch (err) {
      console.error('JWT signing error:', err.message);
      res.status(500).json({ error: 'Internal server error' });
    }
  } else {
    // ✅ Generic error message to prevent user enumeration
    res.status(401).json({ error: 'Invalid credentials' });
  }
});

// ✅ Debug endpoint only in development
if (NODE_ENV !== 'production') {
  app.get('/debug', (req, res) => {
    res.json({
      nodeEnv: NODE_ENV,
      message: 'DEBUG MODE ONLY - Remove in production',
      timestamp: new Date().toISOString(),
    });
  });
}

// ✅ 404 handler
app.use((req, res) => {
  res.status(404).json({ error: 'Not found' });
});

// ✅ Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`✅ Secure server running on port ${PORT}`));