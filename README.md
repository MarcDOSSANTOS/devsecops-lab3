# 🔒 DevSecOps Lab - Secure Application with CI/CD Pipeline

[![DevSecOps Pipeline](https://github.com/your-username/devsecops-lab3/workflows/DevSecOps%20Pipeline/badge.svg)](https://github.com/your-username/devsecops-lab3/actions)

A comprehensive DevSecOps laboratory demonstrating security hardening, vulnerability detection, and automated security testing in a CI/CD pipeline.

## 📋 Table of Contents

- [Overview](#overview)
- [Security Features](#security-features)
- [Setup & Installation](#setup--installation)
- [Usage](#usage)
- [Pipeline Architecture](#pipeline-architecture)
- [Vulnerability Fixes](#vulnerability-fixes)
- [Security Tools](#security-tools)
- [Testing](#testing)
- [Contributing](#contributing)

## 🎯 Overview

This project transforms a vulnerable Node.js application into a secure, hardened system with:
- **SAST** (Semgrep, CodeQL) for code analysis
- **SCA** (npm audit) for dependency scanning
- **Secret Scanning** (Gitleaks) for credential detection
- **Container Scanning** (Trivy) for Docker image vulnerabilities
- **Automated CI/CD Pipeline** with GitHub Actions

### Historical Context

**Before:** Hardcoded secrets, outdated dependencies, no input validation, exposed debug endpoints
**After:** Secure code, secrets management, validated inputs, security headers, rate limiting

## 🛡️ Security Features

### Application Security

✅ **Environment-based Configuration**
- All sensitive data via `.env` file
- No hardcoded secrets
- Safe defaults for production

✅ **Input Validation**
- Express-validator for request validation
- Sanitized inputs
- Regex patterns for username validation

✅ **Authentication & Authorization**
- JWT tokens with expiration (1 hour)
- Secure password handling
- Rate limiting on login (5 attempts/15min)

✅ **HTTP Security Headers**
- Helmet.js for security headers
- Content Security Policy (CSP)
- CSRF protection
- XSS protection

✅ **Operational Security**
- Non-root Docker user
- Health checks
- Proper error handling
- No sensitive info in logs

### Dependency Security

✅ **Updated Packages**
- Express: 4.21.0
- jsonwebtoken: 9.1.2
- helmet: 7.1.0
- express-validator: 7.0.0
- express-rate-limit: 7.1.5

✅ **Node Version**
- Minimum Node.js 20.0.0
- Running on Alpine Linux (minimal attack surface)

### Container Security

✅ **Hardened Dockerfile**
- Multi-stage build
- Alpine Linux base image
- Non-root user
- Health checks
- No unnecessary files

## 📦 Setup & Installation

### Prerequisites

- Node.js 20+
- Docker 20+
- Git
- GitHub account

### Local Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/devsecops-lab3.git
   cd devsecops-lab3
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Setup environment variables**
   ```bash
   # Copy example
   cp .env.example .env
   
   # Generate secure JWT_SECRET
   # On macOS/Linux:
   openssl rand -base64 32
   
   # On Windows (PowerShell):
   [Convert]::ToBase64String((1..32 | ForEach-Object { [byte](Get-Random -Maximum 256) }))
   
   # Edit .env with your values
   nano .env  # or use your editor
   ```

4. **Start the application**
   ```bash
   # Development
   npm run dev
   
   # Production
   NODE_ENV=production npm start
   ```

### Docker Setup

1. **Build the image**
   ```bash
   docker build -t devsecops-app:latest .
   ```

2. **Run the container**
   ```bash
   docker run -p 3000:3000 \
     -e JWT_SECRET="$(openssl rand -base64 32)" \
     -e ADMIN_USER="admin" \
     -e ADMIN_PASS="YourSecurePassword123!" \
     -e NODE_ENV="production" \
     devsecops-app:latest
   ```

3. **Docker Compose (optional)**
   ```bash
   docker-compose up -d
   ```

## 🚀 Usage

### Health Check
```bash
curl http://localhost:3000/health
# Response: {"status":"OK","timestamp":"2025-12-18T10:00:00Z"}
```

### Login
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "admin",
    "password": "YourSecurePassword123!"
  }'
# Response: {"token":"eyJhbGc...","expiresIn":"1h"}
```

### Invalid Credentials
```bash
curl -X POST http://localhost:3000/api/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "wrong"}'
# Response: {"error":"Invalid credentials"} [HTTP 401]
```

### Rate Limiting Test
```bash
# Make 6 requests quickly - 6th will be rate limited
for i in {1..6}; do
  curl -X POST http://localhost:3000/api/login \
    -H "Content-Type: application/json" \
    -d '{"username": "admin", "password": "wrong"}'
done
```

## 🔄 Pipeline Architecture

### Workflow Stages

```
┌─────────────────────────────────────────────────────┐
│         Push to GitHub / Pull Request               │
└────────────────┬────────────────────────────────────┘
                 │
    ┌────────────┼────────────┐
    │            │            │
    ▼            ▼            ▼
  SAST         SCA         SECRET
  Jobs        Jobs        SCANNING
    │            │            │
┌─  Semgrep  npm audit   Gitleaks
└─  CodeQL   Dependency
           Check

    │            │            │
    └────────────┼────────────┘
                 │
                 ▼
         BUILD & TEST JOBS
                 │
                 ▼
        CONTAINER SCANNING
         (Trivy, Snyk)
                 │
                 ▼
         SECURITY GATE
         (Check results)
                 │
                 ▼
      GENERATE REPORT & ARTIFACTS
```

### Jobs Description

| Job | Tool | Purpose | Report |
|-----|------|---------|--------|
| **sast-semgrep** | Semgrep | Static code analysis, bug patterns | semgrep-results.json |
| **sast-codeql** | CodeQL | GitHub's SAST engine | GitHub Security tab |
| **sca-npm-audit** | npm audit | Dependency vulnerabilities | npm-audit-results.json |
| **secret-scanning** | Gitleaks | Hardcoded secrets detection | GitHub Security tab |
| **dependency-check** | OWASP DC | Comprehensive dependency analysis | reports/ |
| **container-scan** | Trivy | Docker image vulnerabilities | trivy-results.sarif |
| **build** | Node.js | Application build | Build logs |
| **security-gate** | Custom | Enforce security policies | Console output |

## 🔍 Vulnerability Fixes

### 1. Hardcoded Secrets ❌→✅

**Before:**
```javascript
const DB_CONNECTION = "mongodb://admin:SuperSecret123!@prod-db.company.com:27017/myapp";
const STRIPE_SECRET_KEY = process.env.STRIPE_SECRET_KEY; // Never hardcode!
```

**After:**
```javascript
const SECRET = process.env.JWT_SECRET;
if (!SECRET || SECRET.length < 32) {
  console.error('❌ FATAL: JWT_SECRET not configured');
  process.exit(1);
}
```

### 2. Weak Dependency Versions ❌→✅

**Before:**
```json
{
  "express": "4.17.1",
  "jsonwebtoken": "8.5.1"
}
```

**After:**
```json
{
  "express": "^4.21.0",
  "jsonwebtoken": "^9.1.2",
  "helmet": "^7.1.0",
  "express-rate-limit": "^7.1.5"
}
```

### 3. No Input Validation ❌→✅

**Before:**
```javascript
app.post('/api/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'admin') {
    // No validation - SQL injection possible
  }
});
```

**After:**
```javascript
const loginValidation = [
  body('username')
    .trim()
    .isString()
    .isLength({ min: 1, max: 50 })
    .matches(/^[a-zA-Z0-9_-]+$/),
  body('password')
    .isString()
    .isLength({ min: 8 })
];

app.post('/api/login', loginLimiter, loginValidation, ...);
```

### 4. Exposed Debug Endpoint ❌→✅

**Before:**
```javascript
app.get('/debug', (req, res) => {
  res.json({
    dbConnection: DB_CONNECTION,
    stripeKey: STRIPE_SECRET_KEY,
    env: process.env
  });
});
```

**After:**
```javascript
if (NODE_ENV !== 'production') {
  app.get('/debug', (req, res) => {
    res.json({
      nodeEnv: NODE_ENV,
      message: 'DEBUG MODE ONLY - Remove in production'
    });
  });
}
```

### 5. Old Node Image ❌→✅

**Before:**
```dockerfile
FROM node:14
WORKDIR /app
RUN npm install
COPY src/ ./
```

**After:**
```dockerfile
FROM node:22-alpine as builder
# Multi-stage build
RUN npm ci --only=production
RUN addgroup -g 1001 -S nodejs
USER nodejs
HEALTHCHECK --interval=30s ...
```

### 6. No Rate Limiting ❌→✅

**Before:**
```javascript
// Anyone can try unlimited login attempts
app.post('/api/login', (req, res) => { ... });
```

**After:**
```javascript
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Too many login attempts'
});
app.post('/api/login', loginLimiter, ...);
```

## 🛠️ Security Tools

### SAST (Static Analysis)

**Semgrep**
- Scans for code patterns and bugs
- Checks OWASP Top 10
- Custom rules available
- Results: `semgrep-results.json`

**CodeQL**
- GitHub's industry-leading SAST tool
- Semantic analysis
- Results in GitHub Security tab

### SCA (Dependency Analysis)

**npm audit**
- Built-in NPM vulnerability database
- Severity levels: critical, high, medium, low
- Results: `npm-audit-results.json`

**OWASP Dependency-Check**
- Cross-language dependency scanning
- CVE database
- Results: `reports/`

### Secret Scanning

**Gitleaks**
- Detects hardcoded credentials
- Checks entire Git history
- Rules for AWS keys, API tokens, etc.

### Container Scanning

**Trivy**
- Scans Docker images
- Detects OS and application vulnerabilities
- SARIF format output
- Results in GitHub Security tab

## ✅ Testing

### Local Testing

```bash
# Run linting
npm run lint

# Run unit tests
npm test

# Security audit
npm audit

# Dependency check (if installed)
npm run dependency-check
```

### Docker Testing

```bash
# Build and run
docker build -t test-app .
docker run -e JWT_SECRET="test-secret" test-app

# Health check
docker run -e JWT_SECRET="test-secret" test-app \
  healthcheck --interval=10s test-app
```

### Pipeline Testing

1. Push to a feature branch
2. Create a Pull Request
3. Watch the automated pipeline run
4. All checks must pass before merge

## 📖 GitHub Secrets Setup

Add these to your GitHub repository:

1. Go to: **Settings** → **Secrets and variables** → **Actions**
2. Create `New repository secret`:

```
JWT_SECRET      = <output of: openssl rand -base64 32>
ADMIN_USER      = admin
ADMIN_PASS      = YourSecurePassword123!
GITLEAKS_LICENSE = <optional - for extended scanning>
```

## 📚 Resources

### Documentation
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [GitHub Actions Security](https://docs.github.com/en/actions/security-guides)
- [Semgrep Rules](https://semgrep.dev/explore)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)

### Tools
- [Semgrep Playground](https://semgrep.dev/playground)
- [Snyk](https://snyk.io/)
- [GitHub Security Lab](https://securitylab.github.com/)
- [Trivy](https://github.com/aquasecurity/trivy)

### Learning
- [OWASP Juice Shop](https://owasp.org/www-project-juice-shop/)
- [TryHackMe DevSecOps](https://tryhackme.com/)
- [HackTheBox](https://www.hackthebox.com/)

## 🧪 Practical Exercises

### Exercise 1: Add & Detect SQL Injection

1. Intentionally add vulnerable code:
   ```javascript
   app.get('/user/:id', (req, res) => {
     const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
   });
   ```

2. Push to a branch
3. Semgrep will detect it
4. Fix it with parameterized queries

### Exercise 2: Monitor Dependency Vulnerabilities

```bash
# Intentionally install vulnerable package
npm install lodash@4.17.15

# Run audit
npm audit

# Check the report
cat npm-audit-results.json

# Update
npm update lodash
```

### Exercise 3: Secret Management Simulation

1. Commit a fake secret (test key)
2. Gitleaks will block it
3. Review the detection
4. Remove and add to GitHub Secrets instead

### Exercise 4: Container Hardening

1. Modify Dockerfile to use `node:22` (instead of alpine)
2. Run Trivy scan
3. Compare vulnerability counts
4. Note improvements from Alpine

## 📊 Security Metrics

Track these metrics over time:

```
├── Vulnerabilities by Severity
│   ├── Critical: 0
│   ├── High: 0
│   ├── Medium: 0
│   └── Low: 0
│
├── Dependency Health
│   ├── Up-to-date: 100%
│   ├── Vulnerable: 0
│   └── Latest: ✅
│
├── Pipeline Status
│   ├── SAST Pass Rate: 100%
│   ├── SCA Pass Rate: 100%
│   ├── Build Success: 100%
│   └── Security Gate: ✅
│
└── Code Quality
    ├── No hardcoded secrets: ✅
    ├── Input validation: ✅
    ├── Security headers: ✅
    └── Error handling: ✅
```

## 🔐 Security Checklist

Before deploying to production:

- [x] All secrets in GitHub Secrets (not in code)
- [x] Dependencies updated and audited
- [x] Security headers enabled (Helmet)
- [x] Input validation on all endpoints
- [x] Rate limiting configured
- [x] Docker image from Alpine
- [x] Non-root user in container
- [x] Security pipeline passing
- [x] No debug endpoints in production
- [x] Logging without sensitive data
- [x] HTTPS enforced in production
- [x] CORS configured properly

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/my-improvement`
3. Commit changes: `git commit -am 'Add security improvement'`
4. Push to branch: `git push origin feature/my-improvement`
5. Submit a Pull Request

All PRs must pass the security pipeline.

## 📝 License

MIT License - See LICENSE file for details

## 📧 Support

For questions or issues:
1. Check existing GitHub Issues
2. Create a new Issue with details
3. Include pipeline logs if relevant

---

**Last Updated:** March 2025
**Security Status:** ✅ All tests passing
**Node Version:** 22.x with Alpine Linux
