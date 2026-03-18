# Contributing to DevSecOps Lab

Thank you for interest in contributing! This document provides guidelines for participation.

## Code of Conduct

- Be respectful and inclusive
- Provide constructive feedback
- Focus on the issue, not the person
- Help others learn and grow

## Getting Started

### Prerequisites
- Node.js 20+
- Docker 20+
- Git
- GitHub account

### Development Setup

```bash
# Clone your fork
git clone https://github.com/your-username/devsecops-lab3.git
cd devsecops-lab3

# Create feature branch
git checkout -b feature/your-feature-name

# Install dependencies
npm install

# Start development
npm run dev
```

## Pull Request Process

### 1. Branch Naming
```
feature/description       # New feature
fix/description          # Bug fix
security/description     # Security improvement
docs/description         # Documentation
test/description         # Tests
refactor/description     # Code refactoring
```

### 2. Commit Messages

Use clear, descriptive messages:

```
feat: Add rate limiting to login endpoint
fix: Remove hardcoded secrets
security: Upgrade express to 4.21.0
docs: Add security guidelines
test: Add input validation tests
```

**Format:** `<type>: <subject>`

Where type is:
- **feat**: New feature
- **fix**: Bug fix
- **security**: Security improvement
- **docs**: Documentation
- **test**: Tests
- **refactor**: Code refactoring
- **perf**: Performance improvement

### 3. Testing

Before submitting:

```bash
# Local tests
npm audit
npm test

# Docker build
docker build -t test-app .

# Security checks
npm run lint
```

### 4. Pull Request Description

```markdown
## Description
Brief description of changes

## Motivation & Context
Why is this change needed?

## Type of Change
- [ ] Bug fix
- [ ] New feature
- [ ] Security improvement
- [ ] Documentation

## Testing
How has this been tested?

## Security Checklist
- [ ] No hardcoded secrets
- [ ] Input validation
- [ ] Error handling
- [ ] Security headers
- [ ] Dependencies up-to-date

## Screenshots (if applicable)
Include before/after

## Related Issues
Closes #(issue number)
```

## Security Guidelines

### When Contributing Code

1. **Never commit secrets**
   - Use `.env.example` for templates
   - Add `.env` to `.gitignore`
   - Use GitHub Secrets for CI/CD

2. **Validate all inputs**
   ```javascript
   const { body, validationResult } = require('express-validator');
   
   app.post('/endpoint', 
     body('input').trim().isString().isLength({ min: 1, max: 100 }),
     (req, res) => {
       const errors = validationResult(req);
       if (!errors.isEmpty()) {
         return res.status(400).json({ errors: errors.array() });
       }
     }
   );
   ```

3. **Keep dependencies updated**
   ```bash
   npm update
   npm audit fix
   ```

4. **Use security headers**
   ```javascript
   const helmet = require('helmet');
   app.use(helmet());
   ```

5. **Log safely**
   ```javascript
   // ❌ Wrong - logs sensitive data
   console.log('User data:', req.body);
   
   // ✅ Right - logs safely
   console.log('Login attempt for user:', req.body.username);
   ```

### Code Review Checklist

Reviewers should verify:

- [ ] Code follows project style
- [ ] Tests present and passing
- [ ] No security issues
- [ ] Dependencies necessary and updated
- [ ] Documentation updated
- [ ] Commit messages clear
- [ ] No hardcoded secrets
- [ ] Input validation present
- [ ] Error handling proper

## Documentation

### When to Update Docs

- New features → Update README.md
- API changes → Update docs/
- Security findings → Update SECURITY_REPORT.md
- Examples --> Update EXERCISES.md

### Documentation Format

```markdown
## Section Title

Brief introduction (1-2 sentences).

### Subsection
Explanation with code examples.

```bash
# Code example
command or code
```

References and related links.
```

## Reporting Vulnerabilities

**Do not open public issues for security vulnerabilities!**

Instead:

1. Email: security@example.com
2. Include:
   - Vulnerability description
   - Affected version
   - Proof of concept (if safe)
   - Suggested fix (optional)

3. We will:
   - Acknowledge within 48 hours
   - Provide update timeline
   - Credit reporter (if desired)

## Project Structure

```
devsecops-lab3/
├── .github/
│   └── workflows/
│       └── security.yml      # CI/CD pipeline
├── src/                      # (if needed)
├── .env.example              # Template only
├── .gitignore                # Git ignore rules
├── Dockerfile                # Container definition
├── docker-compose.yml        # Local development
├── package.json              # Dependencies
├── server.js                 # Main application
├── README.md                 # Main documentation
├── SECURITY_REPORT.md        # Security findings
├── EXERCISES.md              # Learning exercises
└── CONTRIBUTING.md           # This file
```

## Commit Message Examples

```
feat: Add two-factor authentication

Implement TOTP-based 2FA for enhanced security.
Generates backup codes for account recovery.

BREAKING CHANGE: Login endpoint now requires 2FA
Closes #42
```

```
fix: Prevent rate limit bypass

Rate limit was incorrectly using IP instead of username.
Now properly tracks per-user login attempts.

Fixes #31
```

```
security: Update dependencies for critical CVE

- express: 4.20.0 → 4.21.0 (ReDOS fix)
- lodash: 4.17.20 → 4.17.21 (prototype pollution)

Resolves security scan failures
Closes #28
```

## Questions?

- Open a GitHub Issue for questions
- Check existing Issues first
- Be specific and provide context
- Include error messages/logs if relevant

## Recognition

We appreciate all contributions! Contributors will be:
- Listed in commit history
- Credited in release notes
- Added to CONTRIBUTORS.md

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

---

**Thank you for helping secure this project! 🔒**
