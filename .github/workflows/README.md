# GitHub Actions Workflows

This directory contains GitHub Actions workflow files for CI/CD automation.

## Available Workflows

### 1. Deploy to AWS EC2 (`deploy-ec2.yml`)

Automated CI/CD pipeline for deploying the Renuga CRM application to AWS EC2 instances.

#### Workflow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     Trigger Events                              │
│  • Push to main/production                                      │
│  • Pull Request to main/production                              │
│  • Manual Dispatch                                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Stage 1: Build (Parallel)                      │
├─────────────────────────────┬───────────────────────────────────┤
│   Build Frontend            │      Build Backend                │
│   • Checkout code           │      • Checkout code              │
│   • Setup Node.js 20.x      │      • Setup Node.js 20.x         │
│   • Install dependencies    │      • Install dependencies       │
│   • Run linting            │      • Compile TypeScript         │
│   • Build with Vite        │      • Upload artifacts           │
│   • Upload artifacts       │                                   │
└─────────────────────────────┴───────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                  Stage 2: Deploy to EC2                         │
│  (Only runs on push to main/production, not on PRs)             │
├─────────────────────────────────────────────────────────────────┤
│  1. Download Build Artifacts                                    │
│     └─ Get frontend (dist/) and backend (server/dist/)          │
│                                                                 │
│  2. Configure SSH                                               │
│     ├─ Setup SSH key from secrets                              │
│     ├─ Add EC2 host to known_hosts                             │
│     └─ Set proper permissions                                  │
│                                                                 │
│  3. Create Deployment Package                                   │
│     ├─ Bundle: dist/, server/dist/, configs                    │
│     └─ Compress to deployment.tar.gz                           │
│                                                                 │
│  4. Upload to EC2                                               │
│     └─ SCP deployment package to /tmp/                         │
│                                                                 │
│  5. Deploy on EC2 (via SSH)                                     │
│     ├─ Create backup of current deployment                     │
│     ├─ Extract deployment package                              │
│     ├─ Install production dependencies                         │
│     ├─ Run database migrations                                 │
│     ├─ Update Nginx configuration                              │
│     ├─ Restart backend service (PM2)                           │
│     ├─ Reload Nginx                                            │
│     └─ Clean up (remove old backups)                           │
│                                                                 │
│  6. Verify Deployment                                           │
│     ├─ Check PM2 process status                                │
│     ├─ Check Nginx status                                      │
│     ├─ Check PostgreSQL status                                 │
│     └─ Test API health endpoint                                │
│                                                                 │
│  7. Cleanup                                                     │
│     └─ Remove SSH key from runner                              │
└─────────────────────────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                     Deployment Complete                          │
│  ✅ Application updated on EC2                                  │
│  ✅ Backup created                                              │
│  ✅ Services restarted                                          │
│  ✅ Health checks passed                                        │
└─────────────────────────────────────────────────────────────────┘
```

#### Manual Rollback Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Trigger: Manual Workflow Dispatch                   │
│              Environment: rollback                              │
└────────────────────┬────────────────────────────────────────────┘
                     │
                     ▼
┌─────────────────────────────────────────────────────────────────┐
│                    Rollback Process                             │
├─────────────────────────────────────────────────────────────────┤
│  1. Configure SSH Connection                                    │
│                                                                 │
│  2. Connect to EC2                                              │
│                                                                 │
│  3. Identify Latest Backup                                      │
│     └─ From /var/backups/renuga-crm/                           │
│                                                                 │
│  4. Extract Backup                                              │
│     └─ Restore to /var/www/renuga-crm                          │
│                                                                 │
│  5. Restart Services                                            │
│     ├─ PM2 restart                                             │
│     └─ Nginx reload                                            │
│                                                                 │
│  6. Verify Rollback                                             │
│     └─ Check services and health                               │
└─────────────────────────────────────────────────────────────────┘
```

#### Workflow Configuration

**Triggers:**
- `push` to `main` or `production` branches → Automatic deployment
- `pull_request` to `main` or `production` → Build and test only
- `workflow_dispatch` → Manual trigger with environment selection

**Environments:**
- `staging` - Deploys from `main` branch
- `production` - Deploys from `production` branch
- `rollback` - Manual rollback to previous version

**Required Secrets:**
| Secret Name | Description |
|-------------|-------------|
| `EC2_SSH_PRIVATE_KEY` | Private SSH key for EC2 authentication |
| `EC2_HOST` | EC2 public IP or domain |
| `EC2_USER` | SSH username (usually `ubuntu`) |
| `VITE_API_URL` | Backend API URL for frontend |

**Key Features:**
- ✨ Parallel build execution for faster CI
- 🔄 Zero-downtime deployment
- 💾 Automatic backup before deployment
- 🔙 Easy rollback capability
- ✅ Health check verification
- 🔒 Secure SSH authentication
- 📦 Efficient artifact management

#### Usage Examples

**1. Automatic Deployment**
```bash
# Simply push to main branch
git add .
git commit -m "Add new feature"
git push origin main

# GitHub Actions automatically:
# - Builds application
# - Runs tests
# - Deploys to staging EC2
```

**2. Manual Deployment**
```
1. Go to repository on GitHub
2. Click "Actions" tab
3. Select "Deploy to AWS EC2"
4. Click "Run workflow"
5. Choose branch and environment
6. Click "Run workflow" button
```

**3. Rollback**
```
1. Go to "Actions" tab
2. Select "Deploy to AWS EC2"
3. Click "Run workflow"
4. Select environment: "rollback"
5. Click "Run workflow" button
```

#### Customization

To customize the workflow for your needs:

1. **Change Node.js version:**
   ```yaml
   env:
     NODE_VERSION: '20.x'  # Change to desired version
   ```

2. **Add environment-specific secrets:**
   ```yaml
   environment:
     name: ${{ github.ref == 'refs/heads/production' && 'production' || 'staging' }}
   ```

3. **Modify deployment steps:**
   Edit the deployment script in the `Deploy application on EC2` step

4. **Add notifications:**
   Add steps for Slack, Discord, or email notifications

#### File Location

```
.github/
└── workflows/
    └── deploy-ec2.yml    # Main deployment workflow
```

## Adding New Workflows

To add a new workflow:

1. Create a new `.yml` file in this directory
2. Define workflow triggers and jobs
3. Test with workflow dispatch first
4. Document in this README

### Workflow Best Practices

1. **Use Semantic Names**: Name workflows clearly (e.g., `deploy-ec2.yml`, `test.yml`)
2. **Add Comments**: Document complex steps
3. **Use Secrets**: Never hardcode credentials
4. **Test Locally**: Use `act` to test locally before pushing
5. **Monitor Logs**: Regularly review workflow execution logs
6. **Set Timeouts**: Add timeout-minutes to prevent hung jobs

### Workflow Security

1. **Limit Secret Access**: Only give secrets to jobs that need them
2. **Use Environments**: Protect production with required reviewers
3. **Review Third-Party Actions**: Only use trusted actions
4. **Pin Action Versions**: Use specific versions, not `@main`
5. **Audit Logs**: Regular review GitHub audit logs

## Documentation

For detailed information:

- 📖 [Complete CI/CD Guide](../GITHUB_ACTIONS_CICD_GUIDE.md)
- 🚀 [Quick Start Guide](../CICD_QUICKSTART.md)
- 🔐 [Secrets Configuration](../GITHUB_SECRETS_GUIDE.md)
- ✅ [Deployment Checklist](../CICD_DEPLOYMENT_CHECKLIST.md)
- 🔧 [Troubleshooting Guide](../CICD_TROUBLESHOOTING.md)

## Monitoring

Monitor workflow execution:

1. **GitHub Actions Tab**: View all workflow runs
2. **Email Notifications**: Enable in repository settings
3. **Status Badges**: Add to README for quick status
4. **Logs**: Download logs for detailed analysis

### Status Badge

Add this to your README.md:

```markdown
![Deploy to EC2](https://github.com/Tillo-Tenney/Renuga-CRM-Render/actions/workflows/deploy-ec2.yml/badge.svg)
```

## Support

For issues or questions:

1. Check [Troubleshooting Guide](../CICD_TROUBLESHOOTING.md)
2. Review workflow logs in Actions tab
3. Create GitHub Issue with workflow logs
4. Contact DevOps team

---

**Last Updated:** December 2025  
**Maintained By:** DevOps Team
