# 🔒 DevSecOps Lab 3

Application Express sécurisée avec pipeline DevSecOps (SAST, SCA, Secrets, Container Scan).

---

## 🚀 Quick Start

```bash
# Installation
cd src && npm install

# Variables d'environnement
cp ../../env.example .env

# Lancer
npm start  # http://localhost:3000
curl http://localhost:3000/health
```

**Docker :**
```bash
docker build -t app:latest .
docker run -p 3000:3000 -e JWT_SECRET="secret-min-32-chars" app:latest
```

---

## 🔍 Outils DevSecOps

| Outil | Objectif | Commande |
|-------|----------|----------|
| **Semgrep** | Détecte vulnérabilités code (SAST) | `semgrep -c p/security-audit .` |
| **npm audit** | Scanne dépendances (SCA) | `npm audit` |
| **Gitleaks** | Détecte secrets git | `gitleaks detect --verbose` |
| **Trivy** | Scanne image Docker | `trivy image app:latest` |
| **GitHub Actions** | Pipeline automatisé | Voir `.github/workflows/security.yml` |

---

## ⚠️ Vulnérabilités Intentionnelles

| Type | Location | Fix |
|------|----------|-----|
| `eval()` RCE | `src/server.js:59` | Remplacer par `Function()` sécurisée |
| Secrets | `env.example` | Utiliser GitHub Secrets |

---

## ✅ Corrections Appliquées

- Dockerfile (Node 22-Alpine, non-root user)
- package-lock.json (reproductibilité npm ci)
- Helmet (security headers)
- Rate limiting (auth)
- Dotenv (secrets dans variables d'env)
- npm audit clean (0 vulnérabilités)

---

## 💡 Recommandations

**Immédiate :**
- Fixer eval() → `new Function()`
- Implémenter ORM (Sequelize)
- GitHub Secrets pour credentials

**1 mois :**
- DAST (OWASP ZAP)
- Container registry scanning
- Auto-updates dépendances

**3 mois :**
- RASP
- Policy-as-Code (OPA)
- Incident Response automation

---

## 📊 Résultats

| Métrique | Avant | Après |
|----------|-------|-------|
| Vulnérabilités | 7 | 2* |
| npm audit | 7 high | ✓ clean |
| Secrets exposés | 2 | 0** |

*Intentionnelles pour exercices  
**Stockés dans GitHub Secrets

---

## 📖 Voir Aussi

- [RAPPORT_DEVSECOPS.md](RAPPORT_DEVSECOPS.md) - Analyse complète
- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [Semgrep Registry](https://semgrep.dev/r)

---

**Status :** ✅ Production-ready | **Next Review :** 2026-04-01
