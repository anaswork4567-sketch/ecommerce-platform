# 🚀 CI/CD Pipeline Documentation

## Overview

This repository includes automated CI/CD pipelines using GitHub Actions that handle:
- ✅ Code linting and building
- ✅ Docker image building
- ✅ Service health checks
- ✅ Integration testing
- ✅ Automated deployment to Minikube

---

## 📋 Workflows

### 1. **CI/CD Pipeline** (`.github/workflows/ci-cd.yml`)

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches

**Jobs:**
1. **Frontend Lint** - ESLint checks on React code
2. **Build Frontend** - Docker image for React app
3. **Build Services** - Docker images for all 4 microservices
4. **Health Checks** - PostgreSQL, RabbitMQ, MongoDB connectivity
5. **Docker Compose Test** - Integration test with full stack
6. **Deploy** - Deploy to Minikube (only on main branch)
7. **Notify** - Summary of pipeline status

**Duration:** ~15-20 minutes

---

### 2. **Quick Deploy** (`.github/workflows/deploy.yml`)

**Triggers:**
- Manual trigger via GitHub UI (workflow_dispatch)

**Options:**
- Select environment: `staging` or `production`

**Duration:** ~5-10 minutes

---

## 🔧 Setup Instructions

### Step 1: Push to GitHub

```bash
cd /path/to/ecommerce-platform
git init
git add .
git commit -m "Initial commit with CI/CD pipelines"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/ecommerce-platform.git
git push -u origin main
```

### Step 2: Enable GitHub Actions

1. Go to your repository on GitHub
2. Click **Settings** → **Actions** → **General**
3. Enable **Actions** for this repository

### Step 3: Configure Secrets (Optional)

For Docker Registry authentication:

1. Go to **Settings** → **Secrets and variables** → **Actions**
2. Click **New repository secret**
3. Add secrets:
   - `DOCKER_USERNAME`: Your Docker Hub username
   - `DOCKER_PASSWORD`: Your Docker Hub password
   - `DOCKER_REGISTRY`: Docker registry URL (default: docker.io)

---

## 📊 Pipeline Status

View pipeline status:
1. Go to **Actions** tab in your GitHub repository
2. Select a workflow to see:
   - Build status (✅ Passed / ❌ Failed)
   - Job details and logs
   - Deployment status

---

## 🎯 What Each Job Does

### Frontend Lint
```yaml
- Installs Node.js dependencies
- Runs ESLint checks
- Builds React app
```

### Build Frontend
```yaml
- Creates Docker image for frontend
- Uses GitHub Actions cache for faster builds
- Pushes to container registry
```

### Build Services
```yaml
- Creates Docker images for:
  - product-service
  - user-service
  - order-service
  - payment-service
- Runs in parallel using matrix strategy
```

### Health Checks
```yaml
- Starts PostgreSQL container
- Starts RabbitMQ container
- Starts MongoDB container
- Verifies connectivity to each service
```

### Docker Compose Test
```yaml
- Starts all services with docker-compose
- Waits for services to initialize
- Tests Kong gateway endpoints
- Tests RabbitMQ management API
- Verifies database connectivity
```

### Deploy to Minikube
```yaml
- Applies all Kubernetes manifests
- Waits for deployments to roll out
- Verifies pod status
- Checks service endpoints
```

---

## 🚨 Troubleshooting

### Pipeline Fails on Frontend Lint

**Cause:** ESLint errors or build issues

**Solution:**
```bash
cd frontend
npm install
npm run build
# Fix errors and commit
```

### Pipeline Fails on Health Checks

**Cause:** Docker service not available

**Solution:** Update runner to support Docker or use self-hosted runner

### Pipeline Fails on Minikube Deployment

**Cause:** Minikube timeout or resource limits

**Solution:** Check Kubernetes manifests for resource requests/limits

---

## 📈 Performance Optimization

### Speed Up Builds

1. **Cache Docker layers:**
```yaml
cache-from: type=gha
cache-to: type=gha,mode=max
```

2. **Parallel job execution:**
```yaml
strategy:
  matrix:
    service: [product-service, user-service, order-service, payment-service]
```

3. **Skip deployment on PR:**
```yaml
if: github.ref == 'refs/heads/main' && github.event_name == 'push'
```

---

## 🔐 Security Best Practices

1. **Use GitHub Secrets:**
   - Never hardcode credentials
   - Use `${{ secrets.SECRET_NAME }}`

2. **Limit deployment triggers:**
   - Only deploy from main branch
   - Require PR reviews before merge

3. **Regular updates:**
   - Keep actions updated
   - Review dependencies regularly

---

## 📝 Customization

### Add Email Notifications

Add to CI/CD workflow:
```yaml
- name: Send notification
  if: failure()
  uses: dawidd6/action-send-mail@v3
  with:
    server_address: smtp.gmail.com
    server_port: 465
    username: ${{ secrets.EMAIL_USERNAME }}
    password: ${{ secrets.EMAIL_PASSWORD }}
    subject: CI/CD Pipeline Failed
    to: your-email@example.com
```

### Add Slack Notifications

```yaml
- name: Slack Notification
  if: always()
  uses: slackapi/slack-github-action@v1
  with:
    payload: |
      {
        "text": "CI/CD Pipeline Status: ${{ job.status }}"
      }
```

---

## 🎓 Learning Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Docker Build Action](https://github.com/docker/build-push-action)
- [Kubernetes Setup in GitHub Actions](https://github.com/medyagh/setup-minikube)

---

## 📞 Support

For issues or questions:
1. Check the **Actions** logs for detailed error messages
2. Review the workflow YAML files
3. Test locally with Docker Compose first

---

## ✅ Checklist

- [ ] Repository pushed to GitHub
- [ ] GitHub Actions enabled in settings
- [ ] First pipeline run successful
- [ ] Deployment to Minikube verified
- [ ] Monitor pipeline status regularly

---

**Your CI/CD pipeline is now automated! 🎉**
