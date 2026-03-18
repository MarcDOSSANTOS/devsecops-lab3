# 📋 Exercise Solutions & Explanations

This document provides detailed solutions and explanations for the practical exercises.

## Exercise 1: SQL Injection Detection & Fix

### Complete Code Example

**Vulnerable Code:**
```javascript
// ❌ VULNERABLE - SQL Injection
app.get('/user/:id', (req, res) => {
  const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
  // Attacker: /user/1; DROP TABLE users; --
  // Executed: SELECT * FROM users WHERE id = 1; DROP TABLE users; --
  db.query(query, (err, result) => res.json(result));
});
```

**Secure Solution:**
```javascript
// ✅ SECURE - Parameterized Query
const { param, validationResult } = require('express-validator');

app.get('/user/:id', 
  param('id').isInt().toInt(),  // Validate and convert to int
  (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }
    
    const id = req.params.id;  // Now safely an integer
    // Using parameterized query - safe from injection
    db.query('SELECT * FROM users WHERE id = ?', [id], 
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });
        if (!result.length) return res.status(404).json({ error: 'Not found' });
        res.json(result[0]);
      }
    );
  }
);
```

### How Semgrep Detects It

Semgrep uses pattern matching to find SQL injection vulnerabilities:

```
Pattern: Template string containing SQL keywords with $ variables
Rule: "Potential SQL Injection"
```

The rule in semgrep looks for:
```regex
`SELECT .* FROM .* WHERE .* = \${.*}`
```

### Why This is Critical

```
Impact Levels:
- CRITICAL: Direct SQL injection in WHERE clause
- Consequence: Database read/write/delete
- Financial Cost: $$$$ (data breach)
- Legal: GDPR fines, lawsuits
```

### Testing Your Fix

```bash
# Test vulnerable endpoint
curl "http://localhost:3000/user/1"          # Works
curl "http://localhost:3000/user/1 OR 1=1"   # Would work on vulnerable version

# Test secure endpoint  
curl "http://localhost:3000/user/1"          # Works
curl "http://localhost:3000/user/invalid"    # Returns 400 Bad Request
curl "http://localhost:3000/user/1%20OR%201=1"  # Safely treated as integer, returns 400
```

---

## Exercise 2: Dependency Vulnerability Tracking

### Complete Scenario Walkthrough

**Timeline:**
```
Dec 2021: lodash 4.17.15 released
May 2021: CVE-2021-23337 discovered (Prototype Pollution)
CVSS Score: 7.4 HIGH

You should update within days of discovery!
```

**CVE Details:**
```yaml
ID: CVE-2021-23337
Component: lodash
Affected: < 4.17.21
Severity: HIGH
Vector: Network/Adjacent/None
Impact: Integrity
Type: Prototype Pollution
```

### Step-by-Step Fix

1. **Identify vulnerable version**
   ```bash
   npm audit
   # Output:
   # lodash        <=4.17.20
   # Prototype Pollution
   # https://nvd.nist.gov/vuln/detail/CVE-2021-23337
   ```

2. **Update package.json**
   ```json
   {
     "dependencies": {
       "lodash": "^4.17.21"  // Minimum secure version
     }
   }
   ```

3. **Install updates**
   ```bash
   npm install
   npm audit --fix
   ```

4. **Verify fix**
   ```bash
   npm audit
   # Output: no vulnerabilities found ✅
   ```

5. **Commit**
   ```bash
   git add package*.json
   git commit -m "security: Update lodash to fix prototype pollution CVE"
   git push origin feature/fix-lodash
   ```

### Understanding the Vulnerability

**Prototype Pollution Explanation:**

```javascript
// The vulnerability:
const defaults = { isAdmin: false };
_.defaultsDeep(defaults, userInput);
// If userInput = { "__proto__": { isAdmin: true } }
// Then ALL objects gain isAdmin = true property!

// Result: User hijacks any object
const user = {};
user.isAdmin  // true! (should be undefined)
```

**The Fix:** Lodash 4.17.21 sanitizes input to prevent prototype chain traversal.

### npm Audit Output Analysis

```bash
npm audit

# Example output:
# up to date, audited 42 packages in 2s
# 
# found 0 vulnerabilities
```

### Automated Prevention

Our GitHub Actions pipeline prevents this:

```yaml
sca-npm-audit:
  steps:
    - run: npm audit --audit-level=moderate
      # Fails if moderate+ vulnerabilities found
```

---

## Exercise 3: Secret Detection & Management

### Complete Secret Scenarios

**Leaked Secret Types:**

1. **AWS Credentials**
   ```
   AKIAIOSFODNN7EXAMPLE
   wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLETEST
   ```

2. **Stripe Keys**
   ```
   sk_test_EXAMPLE_ONLY_FOR_DOCUMENTATION_123456
   pk_test_EXAMPLE_ONLY_FOR_DOCUMENTATION_123456
   ```

3. **GitHub Tokens**
   ```
   ghp_16C7e42F292c6912E7710c838347Ae178B4a
   ```

4. **API Keys**
   ```
   AIzaSyDaProqLAcGzobyINVQZZxY6vNzY-5DYwM
   ```

### Gitleaks Detection Pattern

Gitleaks uses regex patterns to detect secrets:

```regex
# Stripe
pattern: sk_live_[0-9a-zA-Z]{20,}

# AWS
pattern: AKIA[0-9A-Z]{16}

# GitHub
pattern: ghp_[0-9a-zA-Z]{36}
```

### Proper Secret Management

**Wrong Approach:**
```javascript
// ❌ Never do this
const stripeKey = "sk_test_EXAMPLE_ONLY_FOR_DOCUMENTATION_123456";
const apiKey = "AIzaSyDaProqLAcGzobyINVQZZxY6vNzY-5EXAMPLE";
```

**Right Approach:**
```javascript
// ✅ Always use environment variables
const stripeKey = process.env.STRIPE_KEY;
const apiKey = process.env.GOOGLE_API_KEY;

// ✅ Validate they exist
if (!stripeKey) {
  throw new Error('STRIPE_KEY environment variable not set');
}
```

### GitHub Secrets Configuration

**Step 1: Setup**
```
Settings → Secrets and variables → Actions → New repository secret
```

**Step 2: Add Secrets**
```
Name: STRIPE_KEY
Value: sk_test_EXAMPLE_ONLY_FOR_DOCUMENTATION_123456

Name: GOOGLE_API_KEY
Value: AIzaSyDaProqLAcGzobyINVQZZxY6vNzY-5DYwM
```

**Step 3: Use in Workflow**
```yaml
- name: Deploy
  env:
    STRIPE_KEY: ${{ secrets.STRIPE_KEY }}
    GOOGLE_API_KEY: ${{ secrets.GOOGLE_API_KEY }}
  run: npm run deploy
```

### Secret Rotation Plan

```
Current Secret (90 days old)
├─ Action: Create new secret
├─ Action: Deploy with new secret
├─ Action: Monitor for failures
├─ Action: After 7 days, deactivate old secret
└─ Action: Audit logs for old secret usage
```

### Incident Response

If a secret is leaked:

1. **Immediate (5 min)**
   ```bash
   # Force push new version without the secret
   git reset --soft HEAD~1
   # Remove secret file
   rm .env
   git add .
   git commit -m "Remove accidentally committed secrets"
   git push --force-with-lease
   ```

2. **Hour 1**
   - Rotate the compromised secret
   - Check if used maliciously (logs, charges)
   - Notify users if needed

3. **Day 1**
   - Git history is irreversible - contact GitHub support
   - Document incident
   - Update team on findings

---

## Exercise 4: Container Hardening

### Image Size Comparison

**Insecure Image:**
```
FROM node:22 (920 MB)
  ├─ Full Debian OS (600 MB unused)
  ├─ Unnecessary tools (200 MB)
  ├─ Development dependencies (120 MB)
  └─ Application (1 MB) ← Only this is needed!
```

**Secure Image:**
```
FROM node:22-alpine (150 MB)
  ├─ Minimal Alpine OS (80 MB)
  ├─ Node runtime (30 MB)
  ├─ Production dependencies only (40 MB)
  └─ Application (1 MB)

Savings: 770 MB (84% smaller!)
```

### Security Differences

**Insecure - Running as Root**
```dockerfile
FROM node:22
RUN npm install
USER root  # This is the default!
CMD ["node", "server.js"]

# If container is compromised:
# Attacker has: Full filesystem access, can install tools, etc.
```

**Secure - Non-Root User**
```dockerfile
FROM node:22-alpine
RUN npm ci --only=production
RUN addgroup -g 1001 -S nodejs && \
    adduser -S nodejs -u 1001
USER nodejs

# If container is compromised:
# Attacker has: Limited permissions, cannot install packages, cannot access /root, etc.
```

### Trivy Scan Results Comparison

**Insecure Image Output:**
```
devsecops-insecure:latest (debian 11.5)
===========================================
Total: 142 vulnerabilities (10 CRITICAL, 32 HIGH, ...)

CRITICAL:
  CVE-2022-12345: exp10 buffer overflow
  CVE-2022-23456: openssl privilege escalation
  ... 8 more critical vulnerabilities

HIGH:
  CVE-2021-11111: XML external entity
  CVE-2021-22222: integer overflow
  ... 31 more  high vulnerabilities
```

**Secure Image Output:**
```
devsecops-secure:latest (alpine 3.17)
======================================
Total: 12 vulnerabilities (0 CRITICAL, 0 HIGH, 8 MEDIUM, 4 LOW)

MEDIUM:
  CVE-2022-77777: Low-priority fix
  
LOW:
  CVE-2020-88888: Information disclosure
  ... 3 more low vulnerabilities

Improvement: 91.5% fewer vulnerabilities
```

### Multi-Stage Build Explanation

**Without Multi-Stage:**
```dockerfile
# Final image includes build tools (npm, git, etc.)
# Size: 400 MB
FROM node:22
RUN npm install --no-save webpack webpack-cli  # Build tool
RUN npm run build
RUN npm install --production  # Only production deps
# Result: webpack, webpack-cli still in final image!
```

**With Multi-Stage:**
```dockerfile
# Stage 1: Builder
FROM node:22-alpine as builder
RUN npm install  # All deps including dev
RUN npm run build
# Size: 500 MB (kept separate)

# Stage 2: Runtime
FROM node:22-alpine
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
# Only production code in final image!
# Size: 120 MB
```

### Health Check Verification

**Without Health Check:**
```bash
# Container runs but may have crashed
docker run <image>
# No way to verify container is actually working
```

**With Health Check:**
```dockerfile
HEALTHCHECK --interval=30s --timeout=3s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', ...)"

# Docker automatically restarts if health check fails
# Kubernetes uses this for pod management
```

### Real-World Exploit Scenario

**Insecure Container Compromise:**
```
Attacker: Finds RCE in npm dependency
  ↓
Executes code as root
  ↓
Creates reverse shell
  ↓
Installs cryptocurrency miner
  ↓
Scans network for other containers
  ↓
Moves laterally to database container
  ↓
Exfiltrates customer data
```

**Secure Container:**
```
Attacker: Finds RCE in npm dependency
  ↓
Executes code as nodejs user (limited permissions)
  ↓
Cannot write to filesystem (read-only root)
  ↓
Cannot install tools (no package manager)
  ↓
No reverse shell possible (limited capabilities)
  ↓
Docker container automatically restarts (health check)
  ↓
Incident detected in logs
```

---

## Bonus Resources

### Tools for Each Exercise

#### Exercise 1: SQL Injection
- Semgrep: https://semgrep.dev/
- OWASP: https://cheatsheetseries.owasp.org/
- PortSwigger: https://portswigger.net/web-security

#### Exercise 2: Dependency Vulnerabilities
- npm audit: `npm help audit`
- Snyk: https://snyk.io/
- NIST NVD: https://nvd.nist.gov/

#### Exercise 3: Secret Management
- Gitleaks: https://github.com/gitleaks/gitleaks
- TruffleHog: https://github.com/trufflesecurity/truffleHog
- GitHub Secrets: https://docs.github.com/en/actions

#### Exercise 4: Container Security
- Trivy: https://aquasecurity.github.io/trivy/
- Docker Bench: https://github.com/docker/docker-bench-security
- NIST: https://csrc.nist.gov/publications/detail/sp/800-190/final

---

**Created:** 2025  
**Last Updated:** 2025-12-18  
**Status:** Complete with all solutions
