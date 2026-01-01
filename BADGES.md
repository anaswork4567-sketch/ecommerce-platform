# CI/CD Pipeline Status Badges

Add these badges to your README.md to display pipeline status:

## Individual Workflow Badges

### CI/CD Pipeline
```markdown
[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/ci-cd.yml)
```

### Quick Deploy
```markdown
[![Deploy Workflow](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/deploy.yml/badge.svg)](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/deploy.yml)
```

## Combined Status Badge

```markdown
[![CI Status](https://img.shields.io/github/actions/workflow/status/YOUR_USERNAME/ecommerce-platform/ci-cd.yml?branch=main&label=CI%2FCD&logo=github)](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/ci-cd.yml)
```

## Add to Your README.md

```markdown
# 🛍️ Ecommerce Platform

[![CI/CD Pipeline](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/ci-cd.yml/badge.svg?branch=main)](https://github.com/YOUR_USERNAME/ecommerce-platform/actions/workflows/ci-cd.yml)

Your project description here...
```

---

## Status Meanings

| Badge Status | Meaning |
|---|---|
| 🟢 Green | All checks passed |
| 🔴 Red | Pipeline failed |
| 🟡 Yellow | Pipeline running |
| ⚪ Gray | No runs yet |

---

Replace `YOUR_USERNAME` with your actual GitHub username before adding badges to your README.
