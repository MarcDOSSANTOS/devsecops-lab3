# 🧪 DevSecOps Practical Exercises

This document contains 4 hands-on exercises to practice DevSecOps concepts.

## Exercise 1: Add & Detect SQL Injection

### Objective
Learn how Semgrep detects SQL injection vulnerabilities.

### Steps

1. **Add vulnerable code**
   ```bash
   # Edit server.js and add this endpoint before the health check
   ```

   ```javascript
   // VULNERABLE - DO NOT USE IN PRODUCTION
   app.get('/user/:id', (req, res) => {
     // SQL Injection vulnerability here
     const query = `SELECT * FROM users WHERE id = ${req.params.id}`;
     // This would be vulnerable to:
     // /user/1; DROP TABLE users; --
     res.json({ query });
   });
   ```

2. **Commit and push**
   ```bash
   git add server.js
   git commit -m "Add vulnerable SQL endpoint for testing"
   git push origin feature/exercise-sql-injection
   ```

3. **Create a Pull Request** on GitHub
4. **Observe** - Semgrep will detect the SQL injection:
   ```
   ❌ Semgrep SAST Analysis
   SQL Injection: Unparameterized query
   Severity: HIGH
   ```

5. **Fix the vulnerability**
   ```javascript
   // SECURE - Use parameterized queries
   app.get('/user/:id', (req, res) => {
     const id = parseInt(req.params.id, 10);
     if (isNaN(id)) {
       return res.status(400).json({ error: 'Invalid ID' });
     }
     // In real app: db.query('SELECT * FROM users WHERE id = ?', [id])
     res.json({ message: 'User not found' });
   });
   ```

6. **Commit the fix**
   ```bash
   git add server.js
   git commit -m "Fix: Remove SQL injection vulnerability"
   git push origin feature/exercise-sql-injection
   ```

7. **Verify** - Pipeline now passes ✅

### Learning Outcomes
- Understand SQL injection risk
- Recognize injection patterns
- Apply parameterized queries
- Use static analysis tools

---

## Exercise 2: Monitor Dependency Vulnerabilities

### Objective
Understand dependency scanning and CVE tracking.

### Steps

1. **Create a test branch**
   ```bash
   git checkout -b feature/exercise-dependency-vuln
   ```

2. **Install a known vulnerable package**
   ```bash
   npm install lodash@4.17.15
   ```

3. **Update package.json** (for documentation)
   ```json
   {
     "dependencies": {
       "lodash": "4.17.15"  // Has CVE-2021-23337
     }
   }
   ```

4. **Commit**
   ```bash
   git add package.json package-lock.json
   git commit -m "Add lodash 4.17.15 for vulnerability testing"
   git push origin feature/exercise-dependency-vuln
   ```

5. **Check GitHub Actions**
   - Look at `sca-npm-audit` job
   - Review npm audit results
   - Find lodash vulnerability:
     ```
     Prototype Pollution
     Severity: MEDIUM/HIGH
     CVE-2021-23337
     ```

6. **Update to secure version**
   ```bash
   npm update lodash
   ```

7. **Verify fixed** in package.json
   ```json
   {
     "lodash": "^4.17.21"  // Now secure
   }
   ```

8. **Commit the fix**
   ```bash
   git add package*.json
   git commit -m "Fix: Update lodash to secure version"
   git push origin feature/exercise-dependency-vuln
   ```

### What You'll Learn
- CVE identification
- Dependency update strategies
- Semantic versioning
- Security impact analysis
- Automated dependency scanning

### Real-World Scenario

```
Timeline:
Day 1: Lodash 4.17.15 released (vulnerable)
Day 100: CVE-2021-23337 discovered
Day 200: Your CI detects it
Action: Update to 4.17.21 (patched)
```

---

## Exercise 3: Detect & Manage Secrets

### Objective
Understand secret management and detection.

### Steps

1. **Create test branch**
   ```bash
   git checkout -b feature/exercise-secret-detection
   ```

2. **Add fake credentials** (for testing only!)
   ```bash
   echo 'STRIPE_KEY=sk_test_EXAMPLE_ONLY_FOR_TESTING_123456789ABC' >> .env.test
   ```

3. **Commit (this will be caught!)**
   ```bash
   git add .env.test
   git commit -m "Add test credentials"
   git push origin feature/exercise-secret-detection
   ```

4. **Observe Gitleaks detection**
   ```
   ❌ Gitleaks Alert
   SECRET DETECTED
   Pattern: Stripe Secret Key
   Severity: CRITICAL
   File: .env.test
   ```

5. **Understand the detection**
   - Gitleaks uses regex patterns
   - Matches known secret formats
   - Scans Git history
   - Cannot be overwritten

6. **Correct approach - Use GitHub Secrets**
   ```bash
   # Remove the file
   rm .env.test
   git commit -m "Remove credentials, use GitHub Secrets"
   git push
   ```

7. **Add to GitHub Secrets instead**
   - Go to Settings → Secrets and variables → Actions
   - New secret: `STRIPE_KEY`
   - Value: `sk_live_...`
   - Use in workflow: `${{ secrets.STRIPE_KEY }}`

### Key Learnings
- Secrets should NEVER be in code
- Use environment variables
- GitHub Secrets for CI/CD
- Gitleaks catches leaks
- Secret rotation policies
- Incident response for exposed keys

### Secret Management Best Practices

```
❌ WRONG:
const key = "sk_live_abc123";

✅ RIGHT:
const key = process.env.STRIPE_KEY || 
  (() => { throw new Error('STRIPE_KEY not set') })();
```

---

## Exercise 4: Container Hardening & Scanning

### Objective
Learn Docker security best practices.

### Steps

1. **Current Dockerfile already hardened**, but let's test

2. **Create a test (insecure) Dockerfile**
   ```bash
   cat > Dockerfile.insecure << 'EOF'
   FROM node:22  # NOT alpine - bigger attack surface
   WORKDIR /app
   RUN npm install
   COPY . .
   USER root  # Running as root - security risk!
   EXPOSE 3000
   CMD ["node", "server.js"]
   EOF
   ```

3. **Build insecure image**
   ```bash
   docker build -f Dockerfile.insecure -t devsecops-insecure .
   ```

4. **Scan with Trivy**
   ```bash
   # Install Trivy if needed
   curl -sfL https://raw.githubusercontent.com/aquasecurity/trivy/main/contrib/install.sh | sh -s -- -b /usr/local/bin
   
   # Scan insecure image
   trivy image devsecops-insecure
   ```

5. **Observe vulnerabilities**
   ```
   OS Vulns: 150+
   App Vulns: 25+
   HIGH/CRITICAL: 8+
   ```

6. **Scan secure image**
   ```bash
   docker build -t devsecops-secure .
   trivy image devsecops-secure
   ```

7. **Compare results**
   ```
   INSECURE:  142 vulnerabilities (10 CRITICAL)
   SECURE:    12 vulnerabilities (0 CRITICAL)
   
   Improvement: 91% fewer vulnerabilities!
   ```

### Hardening Techniques Applied

| Technique | Impact | Status |
|-----------|--------|--------|
| Alpine Linux | -130 vulns | ✅ Applied |
| Non-root user | Risk reduced | ✅ Applied |
| Multi-stage build | Smaller, safer | ✅ Applied |
| Min dependencies | Fewer vectors | ✅ Applied |
| Health checks | Monitoring | ✅ Applied |

### Security Analysis

```dockerfile
# BEFORE (Insecure)
FROM node:22                 # Full OS image (900 MB)
WORKDIR /app
RUN npm install             # All deps + dev
COPY . .
USER root                   # Root execution!
HEALTHCHECK [missing]       # No monitoring

# AFTER (Secure)
FROM node:22-alpine         # Minimal OS (150 MB)
RUN npm ci --only=prod      # Production only
RUN addgroup -g 1001 ...    # Create user
USER nodejs                 # Non-root
HEALTHCHECK [configured]    # Monitoring enabled
```

### Real-World Impact

```
Scenario: Container escape vulnerability found
  
INSECURE: Root access → Full system compromise
SECURE:   nodejs user → Limited to app permissions
          Alpine → Fewer tools for attacker
          Minimal → Less attack surface
```

---

## Bonus: Create Your Own Exercise

### Template

```markdown
## Exercise 5: [Your Topic]

### Objective
What should people learn?

### Vulnerability
Describe the security issue.

### Steps
1. Identify the problem
2. Detect with tools
3. Understand the impact
4. Apply the fix
5. Verify

### Learning Outcomes
- Outcome 1
- Outcome 2
```

### Suggested Topics
- XSS (Cross-Site Scripting)
- CSRF (Cross-Site Request Forgery)
- Path Traversal
- Timing Attacks
- Man-in-the-Middle (MITM)
- Privilege Escalation

---

## Exercise Submission & Scoring

### GitHub Workflow

1. Create a feature branch
2. Configure the exercise
3. Commit changes
4. Push to GitHub
5. Create Pull Request
6. Pipeline runs automatically
7. Review results
8. Document findings
9. Submit for review

### Success Criteria

✅ Pipeline completed  
✅ Security tools detected the issue  
✅ Vulnerability understood  
✅ Fix applied  
✅ Documentation written  
✅ Tests passing  

### Expected Outcomes

After completing all 4 exercises, you should be able to:

- [ ] Identify security vulnerabilities in code
- [ ] Understand OWASP risks
- [ ] Use security scanning tools
- [ ] Fix common vulnerabilities
- [ ] Implement security controls
- [ ] Review security reports
- [ ] Explain findings to non-technical stakeholders
- [ ] Make security trade-offs
- [ ] Recommend security improvements
- [ ] Setup secure CI/CD pipelines

---

## Resources for Each Exercise

### Exercise 1: SQL Injection
- [OWASP SQL Injection](https://owasp.org/www-community/attacks/SQL_Injection)
- [Parameterized Queries](https://cheatsheetseries.owasp.org/cheatsheets/Query_Parameterization_Cheat_Sheet.html)
- [Semgrep SQL Rules](https://semgrep.dev/explore?utm_source=github&utm_content=open_source&utm_campaign=rules&utm_term=sql)

### Exercise 2: Dependency Vulnerabilities
- [npm audit Documentation](https://docs.npmjs.com/cli/v8/commands/npm-audit)
- [CVE Details](https://www.cvedetails.com/)
- [Snyk Vulnerability Database](https://snyk.io/vulnerability-scanner/)

### Exercise 3: Secret Management
- [Gitleaks Documentation](https://github.com/gitleaks/gitleaks)
- [GitHub Secrets](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [OWASP Secrets Management](https://cheatsheetseries.owasp.org/cheatsheets/Secrets_Management_Cheat_Sheet.html)

### Exercise 4: Container Security
- [Docker Security Best Practices](https://cheatsheetseries.owasp.org/cheatsheets/Docker_Security_Cheat_Sheet.html)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [Container Security by Aqua](https://www.aquasec.com/cloud-native-security/)

---

## Tips & Tricks

### Docker Quick Commands

```bash
# Build without cache (fresh)
docker build --no-cache -t myapp .

# Inspect image layers
docker history myapp

# Check image size
docker images myapp

# Run as non-root
docker run --user 1001 myapp

# Limit resources
docker run -m 512m --cpus 1 myapp
```

### Git Commands for Exercises

```bash
# Create feature branch
git checkout -b feature/exercise-name

# View changes before commit
git diff

# Undo last commit (local only)
git reset --soft HEAD~1

# View commit history
git log --oneline

# Delete branch when done
git branch -d feature/exercise-name
```

### GitHub Actions Debugging

1. Check logs: **Actions** → **Workflow run** → **Job logs**
2. Enable debug: Set secret `ACTIONS_STEP_DEBUG` to `true`
3. Download artifacts: **Artifacts** section
4. View security alerts: **Security** → **Code scanning**

---

**Happy learning! 🚀**

Remember: Security is a journey, not a destination.
