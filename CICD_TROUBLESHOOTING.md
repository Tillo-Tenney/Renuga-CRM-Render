# CI/CD Troubleshooting Guide

Comprehensive troubleshooting guide for GitHub Actions CI/CD deployment issues.

## Quick Diagnosis

Run through this checklist first:

1. **Check Workflow Status**: Go to Actions tab → Latest run
2. **Identify Failed Stage**: Build Frontend, Build Backend, or Deploy
3. **Review Error Logs**: Click on failed job → Expand failed step
4. **Check EC2 Status**: SSH to EC2 and verify services running
5. **Test Manually**: Try deployment steps manually on EC2

## Common Issues by Stage

### Stage 1: Build Frontend Failed

#### Issue: npm ci failed

**Error Message:**
```
npm ERR! code EUSAGE
npm ERR! The `npm ci` command can only install with an existing package-lock.json
```

**Solution:**
```bash
# Locally, ensure package-lock.json exists and is up to date
npm install --package-lock-only
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

#### Issue: Linting failed

**Error Message:**
```
✖ 23 problems (23 errors, 0 warnings)
```

**Solution:**
```bash
# Run linting locally first
npm run lint

# Fix auto-fixable issues
npm run lint -- --fix

# Review and fix remaining issues manually
# Commit fixes and push
```

#### Issue: Build failed - Missing environment variable

**Error Message:**
```
[vite] Internal server error: VITE_API_URL is not defined
```

**Solution:**
1. Verify `VITE_API_URL` secret is added to GitHub
2. Check secret name matches exactly (case-sensitive)
3. Secret should be: `http://YOUR_EC2_IP:3001`

### Stage 2: Build Backend Failed

#### Issue: TypeScript compilation error

**Error Message:**
```
error TS2304: Cannot find name 'XXX'
```

**Solution:**
```bash
# Test build locally
cd server
npm run build

# Fix TypeScript errors
# Commit fixes and push
```

#### Issue: Missing dependencies

**Error Message:**
```
Cannot find module 'xxx'
```

**Solution:**
```bash
# Verify all dependencies in package.json
cd server
npm install

# Update package-lock.json
git add package-lock.json
git commit -m "Update server dependencies"
git push
```

### Stage 3: Deploy Failed

#### Issue: SSH Connection Failed - Permission Denied

**Error Message:**
```
Permission denied (publickey)
```

**Root Causes & Solutions:**

**1. Private key not properly configured**
```bash
# Verify private key in GitHub Secret includes:
# -----BEGIN OPENSSH PRIVATE KEY-----
# ... key content ...
# -----END OPENSSH PRIVATE KEY-----

# No extra quotes or whitespace
```

**2. Public key not in EC2 authorized_keys**
```bash
# On EC2, check authorized_keys
cat ~/.ssh/authorized_keys

# Add public key if missing
echo "ssh-ed25519 AAAA... github-actions" >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**3. Wrong EC2 user**
```bash
# Verify EC2_USER secret matches actual user
# Ubuntu AMI: ubuntu
# Amazon Linux: ec2-user

# Test locally
ssh -i ~/.ssh/key.pem ubuntu@EC2_IP
```

**4. Key permissions issue on EC2**
```bash
# On EC2, fix permissions
chmod 700 ~/.ssh
chmod 600 ~/.ssh/authorized_keys
chown $USER:$USER ~/.ssh/authorized_keys

# Restart SSH service
sudo systemctl restart sshd
```

#### Issue: SSH Connection Failed - Host Key Verification

**Error Message:**
```
Host key verification failed
```

**Solution:**
Workflow automatically runs `ssh-keyscan`. If still fails:

```bash
# Locally, verify EC2 is accessible
ssh-keyscan -H YOUR_EC2_IP

# Check security group allows SSH from GitHub Actions IPs
# AWS Console → EC2 → Security Groups → Inbound Rules
# Port 22 should be open to 0.0.0.0/0 or specific IPs
```

#### Issue: Deployment Package Upload Failed

**Error Message:**
```
scp: /tmp/deployment.tar.gz: Permission denied
```

**Solution:**
```bash
# On EC2, check /tmp permissions
ls -ld /tmp
# Should be: drwxrwxrwt

# If wrong, fix it
sudo chmod 1777 /tmp

# Also check disk space
df -h
# Ensure sufficient space available
```

#### Issue: Extraction Failed

**Error Message:**
```
tar: Cannot open: Permission denied
```

**Solution:**
```bash
# On EC2, check application directory ownership
ls -la /var/www/

# Fix ownership
sudo chown -R ubuntu:ubuntu /var/www/renuga-crm

# Verify user can write
touch /var/www/renuga-crm/test.txt
rm /var/www/renuga-crm/test.txt
```

#### Issue: npm ci Failed on EC2

**Error Message:**
```
npm ERR! code EINTEGRITY
```

**Solution:**
```bash
# On EC2, clear npm cache
npm cache clean --force

# Remove node_modules
cd /var/www/renuga-crm/server
rm -rf node_modules

# Manually install
npm ci --production

# If still fails, check internet connectivity
curl -I https://registry.npmjs.org
```

#### Issue: Database Migration Failed

**Error Message:**
```
ECONNREFUSED: Connection refused
```

**Solutions:**

**1. PostgreSQL not running**
```bash
# On EC2, check PostgreSQL
sudo systemctl status postgresql

# Start if stopped
sudo systemctl start postgresql

# Enable auto-start
sudo systemctl enable postgresql
```

**2. Wrong database credentials**
```bash
# On EC2, check .env file
cat /var/www/renuga-crm/server/.env

# Verify DATABASE_URL format:
# postgresql://user:password@localhost:5432/database

# Test connection
psql -U renuga_user -h localhost -d renuga_crm
```

**3. Database doesn't exist**
```bash
# On EC2, create database
sudo -i -u postgres
createdb renuga_crm
psql -c "CREATE USER renuga_user WITH ENCRYPTED PASSWORD 'password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE renuga_crm TO renuga_user;"
exit
```

#### Issue: PM2 Restart Failed

**Error Message:**
```
[PM2][ERROR] Process renuga-crm-api not found
```

**Solution:**
```bash
# On EC2, check PM2 status
pm2 status

# If process not found, start it
cd /var/www/renuga-crm/server
pm2 start dist/index.js --name renuga-crm-api

# Save PM2 configuration
pm2 save

# Setup PM2 startup
pm2 startup systemd
# Run the command that PM2 outputs
```

#### Issue: Nginx Reload Failed

**Error Message:**
```
nginx: configuration file /etc/nginx/nginx.conf test failed
```

**Solution:**
```bash
# On EC2, test Nginx configuration
sudo nginx -t

# Check error details
# Common issues:
# - Syntax error in config file
# - Wrong file paths
# - Duplicate server blocks

# Fix configuration
sudo nano /etc/nginx/sites-available/renuga-crm

# Test again
sudo nginx -t

# If OK, reload
sudo systemctl reload nginx
```

### Stage 4: Verification Failed

#### Issue: Health Check Failed

**Error Message:**
```
curl: (7) Failed to connect to localhost port 3001
```

**Solutions:**

**1. Backend not running**
```bash
# On EC2, check PM2
pm2 status
pm2 logs renuga-crm-api --lines 50

# Check for errors in logs
# Common issues:
# - Port already in use
# - Environment variables missing
# - Database connection failed
```

**2. Port not listening**
```bash
# On EC2, check what's listening
sudo netstat -tlnp | grep 3001

# If nothing, backend failed to start
# Check logs
pm2 logs renuga-crm-api --lines 100
```

**3. Firewall blocking**
```bash
# On EC2, check firewall
sudo ufw status

# If blocking, allow port
sudo ufw allow 3001

# Or disable for testing
sudo ufw disable
```

#### Issue: Frontend Not Loading

**Error Message:**
```
502 Bad Gateway
```

**Solutions:**

**1. Backend not responding**
```bash
# On EC2, test backend directly
curl http://localhost:3001/health

# If fails, restart backend
pm2 restart renuga-crm-api
```

**2. Nginx configuration wrong**
```bash
# On EC2, check Nginx config
sudo cat /etc/nginx/sites-available/renuga-crm

# Verify proxy_pass points to correct port
# Should have: proxy_pass http://localhost:3001;

# Test configuration
sudo nginx -t

# Reload if OK
sudo systemctl reload nginx
```

**3. Frontend files not deployed**
```bash
# On EC2, check dist directory
ls -la /var/www/renuga-crm/dist/

# Should contain:
# - index.html
# - assets/
# - Various .js and .css files

# If missing, rebuild locally and redeploy
```

## Debugging Strategies

### 1. Enable Debug Logging

Add these secrets to get detailed logs:

```
ACTIONS_RUNNER_DEBUG: true
ACTIONS_STEP_DEBUG: true
```

Re-run workflow to see verbose output.

### 2. SSH to EC2 and Test Manually

```bash
# Connect to EC2
ssh -i ~/.ssh/key.pem ubuntu@EC2_IP

# Navigate to app directory
cd /var/www/renuga-crm

# Test deployment steps manually
tar -xzf /tmp/deployment.tar.gz
cd server
npm ci --production
npm run db:migrate
pm2 restart renuga-crm-api
```

### 3. Check Service Logs

```bash
# PM2 logs
pm2 logs renuga-crm-api --lines 100

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u renuga-crm-api -n 50

# PostgreSQL logs
sudo tail -f /var/log/postgresql/postgresql-14-main.log
```

### 4. Test Each Component

```bash
# Test database
psql -U renuga_user -h localhost -d renuga_crm -c "SELECT 1;"

# Test backend
curl http://localhost:3001/health

# Test Nginx
curl http://localhost

# Test from outside
curl http://EC2_PUBLIC_IP
```

### 5. Verify Resources

```bash
# Check disk space
df -h

# Check memory
free -h

# Check CPU
top

# Check network
ping google.com
curl -I https://registry.npmjs.org
```

## Prevention Best Practices

### Pre-Deployment Checklist

Before pushing to trigger deployment:

1. **Test Locally**
   ```bash
   # Build frontend
   npm run build
   
   # Build backend
   cd server && npm run build
   
   # Run tests
   npm test
   ```

2. **Verify Secrets**
   - All secrets present in GitHub
   - Values are current and correct
   - No extra whitespace or quotes

3. **Check EC2 Health**
   - Instance running
   - Services active
   - Disk space available
   - Internet connectivity working

4. **Test on Staging First**
   - Deploy to staging environment
   - Verify functionality
   - Then deploy to production

### Monitoring

Set up monitoring to catch issues early:

1. **GitHub Actions**
   - Enable email notifications for failed workflows
   - Set up Slack/Discord webhooks

2. **Application Monitoring**
   - Use PM2 monitoring: `pm2 monitor`
   - Set up application performance monitoring (APM)
   - Configure log aggregation

3. **Server Monitoring**
   - Set up CloudWatch alarms
   - Monitor disk, CPU, memory usage
   - Configure uptime monitoring

### Regular Maintenance

1. **Weekly**
   - Review deployment logs
   - Check for warnings
   - Verify backup integrity

2. **Monthly**
   - Rotate SSH keys
   - Update dependencies
   - Review and optimize performance

3. **Quarterly**
   - Security audit
   - Disaster recovery test
   - Team training refresh

## Getting Help

### Information to Gather

When asking for help, provide:

1. **Workflow Details**
   - Link to failed workflow run
   - Complete error message
   - Which stage failed

2. **Environment Info**
   - EC2 instance type and OS version
   - Node.js version: `node --version`
   - PM2 version: `pm2 --version`
   - Nginx version: `nginx -v`

3. **Logs**
   - Relevant GitHub Actions logs
   - PM2 logs: `pm2 logs`
   - Nginx logs
   - System logs

4. **What You've Tried**
   - Steps already attempted
   - Results of troubleshooting

### Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [Main CI/CD Guide](./GITHUB_ACTIONS_CICD_GUIDE.md)
- [Quick Start Guide](./CICD_QUICKSTART.md)

### Support Channels

1. Create GitHub Issue with:
   - Descriptive title
   - Detailed description
   - Error logs
   - Steps to reproduce

2. Check existing documentation:
   - README.md
   - GITHUB_ACTIONS_CICD_GUIDE.md
   - AWS_EC2_DEPLOYMENT.md

3. Review workflow file:
   - `.github/workflows/deploy-ec2.yml`
   - Look for configuration issues

## Emergency Procedures

### Rollback Deployment

If deployment causes critical issues:

**Option 1: Using Workflow**
```
1. Go to Actions tab
2. Click "Run workflow"
3. Select "rollback" environment
4. Click "Run workflow"
```

**Option 2: Manual Rollback**
```bash
# SSH to EC2
ssh -i key.pem ubuntu@EC2_IP

# Navigate to backups
cd /var/backups/renuga-crm

# Find latest backup
ls -lt backup_*.tar.gz | head -n 1

# Extract backup (replace with actual backup file)
sudo tar -xzf backup_20241219_120000.tar.gz -C /var/www/renuga-crm

# Restart services
pm2 restart renuga-crm-api
sudo systemctl reload nginx
```

### Disable Automatic Deployments

To prevent automatic deployments while troubleshooting:

1. **Rename workflow file temporarily**
   ```bash
   git mv .github/workflows/deploy-ec2.yml .github/workflows/deploy-ec2.yml.disabled
   git commit -m "Temporarily disable CI/CD"
   git push
   ```

2. **Fix issues**

3. **Re-enable workflow**
   ```bash
   git mv .github/workflows/deploy-ec2.yml.disabled .github/workflows/deploy-ec2.yml
   git commit -m "Re-enable CI/CD"
   git push
   ```

### Emergency Contacts

Document your team's emergency contacts:

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| DevOps Lead | [Name] | [Email/Phone] | [Hours] |
| Backend Lead | [Name] | [Email/Phone] | [Hours] |
| On-Call | [Name] | [Phone] | 24/7 |

---

**Last Updated:** December 2024  
**Maintained By:** DevOps Team
