# Quick Start: GitHub Actions CI/CD for EC2

Get your automated deployment pipeline running in 15 minutes!

## Prerequisites Checklist

- [ ] EC2 instance running Ubuntu (with application already installed)
- [ ] GitHub repository access
- [ ] SSH access to EC2 instance

## Step 1: Generate Deploy Key (2 minutes)

On your **local machine**:

```bash
# Generate SSH key for GitHub Actions
ssh-keygen -t ed25519 -C "github-actions" -f ~/.ssh/github_deploy -N ""

# Display private key (copy this for GitHub Secret)
cat ~/.ssh/github_deploy

# Display public key (copy this for EC2)
cat ~/.ssh/github_deploy.pub
```

## Step 2: Add Key to EC2 (1 minute)

On your **EC2 instance**:

```bash
# Add public key to authorized_keys
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
```

## Step 3: Configure GitHub Secrets (3 minutes)

1. Go to your GitHub repository
2. Click `Settings` → `Secrets and variables` → `Actions`
3. Click `New repository secret` and add:

| Secret Name | Value | How to Get |
|-------------|-------|------------|
| `EC2_SSH_PRIVATE_KEY` | Full private key including BEGIN/END lines | `cat ~/.ssh/github_deploy` |
| `EC2_HOST` | Your EC2 IP address | AWS Console or `curl ifconfig.me` on EC2 |
| `EC2_USER` | `ubuntu` | Default Ubuntu user |
| `VITE_API_URL` | `http://YOUR_EC2_IP:3001` | Your API URL |

**Example for EC2_SSH_PRIVATE_KEY:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
b3BlbnNzaC1rZXktdjEAAAAABG5vbmUAAAAEbm9uZQAAAAAAAAABAAAAMwAAAAtzc2gtZW
... (full key content) ...
-----END OPENSSH PRIVATE KEY-----
```

## Step 4: Verify Workflow File (1 minute)

The workflow file is already in your repository at:
```
.github/workflows/deploy-ec2.yml
```

No changes needed! The workflow will automatically:
- ✅ Build frontend and backend
- ✅ Run linting
- ✅ Deploy to EC2
- ✅ Create backups
- ✅ Restart services
- ✅ Verify deployment

## Step 5: Test Deployment (5 minutes)

### Option A: Automatic Trigger

```bash
# Make a small change
echo "# CI/CD Enabled" >> README.md

# Commit and push to main
git add README.md
git commit -m "Enable CI/CD"
git push origin main
```

### Option B: Manual Trigger

1. Go to `Actions` tab in GitHub
2. Select `Deploy to AWS EC2` workflow
3. Click `Run workflow`
4. Select branch: `main`
5. Click `Run workflow`

## Step 6: Monitor Deployment (3 minutes)

1. Click on the running workflow in Actions tab
2. Watch the progress of each job:
   - **Build Frontend** (~2 min)
   - **Build Backend** (~1 min)
   - **Deploy** (~2 min)

3. Check deployment logs for:
   ```
   ✅ Deployment completed successfully!
   ```

## Step 7: Verify Application (1 minute)

```bash
# Check your application
curl http://YOUR_EC2_IP/health

# Or open in browser
http://YOUR_EC2_IP
```

## 🎉 Success!

You now have automated CI/CD! Every push to `main` will automatically deploy.

## Common Issues

### Issue 1: SSH Permission Denied

**Fix:**
```bash
# On EC2, verify key
cat ~/.ssh/authorized_keys | grep github-actions

# Check permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
```

### Issue 2: Workflow Not Triggering

**Fix:**
- Verify workflow file exists at `.github/workflows/deploy-ec2.yml`
- Check Actions are enabled in repository settings
- Push to `main` or `production` branch

### Issue 3: Deployment Failed

**Fix:**
```bash
# On EC2, check services
pm2 status
sudo systemctl status nginx

# Check logs
pm2 logs renuga-crm-api
```

## Next Steps

- [ ] Set up production environment with protection rules
- [ ] Configure SSL/HTTPS with Let's Encrypt
- [ ] Add automated testing to workflow
- [ ] Set up monitoring and alerts

## Manual Rollback

If something goes wrong:

1. Go to `Actions` tab
2. Click `Run workflow`
3. Select environment: `rollback`
4. Click `Run workflow`

Or SSH to EC2:
```bash
cd /var/backups/renuga-crm
ls -lt backup_*.tar.gz | head -n 1  # Find latest backup
# Follow rollback procedure in main guide
```

## Need Help?

- 📖 Full guide: [GITHUB_ACTIONS_CICD_GUIDE.md](./GITHUB_ACTIONS_CICD_GUIDE.md)
- 🔧 EC2 setup: [AWS_EC2_DEPLOYMENT.md](./AWS_EC2_DEPLOYMENT.md)
- 🐛 Issues: Create GitHub issue

---

**Time to complete:** ~15 minutes  
**Difficulty:** Easy  
**Last updated:** December 2024
