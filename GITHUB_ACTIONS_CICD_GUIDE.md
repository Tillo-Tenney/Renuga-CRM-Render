# GitHub Actions CI/CD Setup Guide for AWS EC2 Deployment

## Overview

This guide provides step-by-step instructions for setting up continuous integration and continuous deployment (CI/CD) using GitHub Actions to automatically deploy the Renuga CRM application to AWS EC2 Ubuntu instances.

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Architecture Overview](#architecture-overview)
3. [Initial EC2 Setup](#initial-ec2-setup)
4. [GitHub Repository Configuration](#github-repository-configuration)
5. [GitHub Actions Workflow](#github-actions-workflow)
6. [Deployment Process](#deployment-process)
7. [Troubleshooting](#troubleshooting)
8. [Best Practices](#best-practices)

## Prerequisites

### AWS Requirements
- AWS account with EC2 access
- EC2 instance running Ubuntu 22.04 LTS or 24.04 LTS
- Instance type: minimum t2.micro (t3.small recommended for production)
- Security group configured with ports 22 (SSH), 80 (HTTP), and 443 (HTTPS) open
- SSH key pair for EC2 access

### Local Requirements
- Git installed
- GitHub account with repository access
- Basic knowledge of Linux, Git, and CI/CD concepts

### Application Requirements
- Node.js 20.x or higher
- PostgreSQL database
- Nginx web server
- PM2 process manager

## Architecture Overview

The CI/CD pipeline consists of four main stages:

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐     ┌──────────────┐
│   Build     │────▶│    Test      │────▶│   Package   │────▶│    Deploy    │
│  Frontend   │     │   (Lint)     │     │  Artifacts  │     │    to EC2    │
│  Backend    │     │              │     │             │     │              │
└─────────────┘     └──────────────┘     └─────────────┘     └──────────────┘
```

### Workflow Components

1. **Build Frontend**: Compiles React application with Vite
2. **Build Backend**: Compiles TypeScript backend to JavaScript
3. **Test**: Runs linting and tests (if configured)
4. **Deploy**: Deploys to EC2 via SSH with zero-downtime
5. **Verify**: Checks service health after deployment
6. **Rollback**: Manual rollback capability using backups

## Initial EC2 Setup

### Step 1: Launch and Configure EC2 Instance

1. **Launch EC2 Instance**
   ```bash
   # From AWS Console:
   - Name: renuga-crm-production
   - AMI: Ubuntu Server 22.04 LTS
   - Instance Type: t3.small
   - Storage: 30 GB gp3
   - Security Group: Allow SSH(22), HTTP(80), HTTPS(443)
   ```

2. **Connect to Instance**
   ```bash
   chmod 400 your-key.pem
   ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
   ```

### Step 2: Automated Application Setup

Run the provided setup script to install all dependencies:

```bash
# Clone repository
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render

# Run automated setup
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

**What the script does:**
- Installs Node.js 20.x, PostgreSQL, Nginx, PM2
- Creates database and user
- Configures environment variables
- Builds and deploys application
- Sets up systemd services
- Configures Nginx reverse proxy
- Creates backup scripts

### Step 3: Manual Setup (Alternative)

If you prefer manual setup or need to troubleshoot:

#### 3.1 Install System Dependencies

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install build tools
sudo apt install -y build-essential git curl

# Install PM2 globally
sudo npm install -g pm2
```

#### 3.2 Configure PostgreSQL

```bash
# Switch to postgres user
sudo -i -u postgres

# Create database and user
createdb renuga_crm
psql -c "CREATE USER renuga_user WITH ENCRYPTED PASSWORD 'your_secure_password';"
psql -c "GRANT ALL PRIVILEGES ON DATABASE renuga_crm TO renuga_user;"
psql -d renuga_crm -c "GRANT ALL ON SCHEMA public TO renuga_user;"

# Exit postgres user
exit
```

#### 3.3 Setup Application Directory

```bash
# Create application directory
sudo mkdir -p /var/www/renuga-crm
sudo chown -R $USER:$USER /var/www/renuga-crm

# Clone repository
cd /var/www/renuga-crm
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git .
```

#### 3.4 Configure Backend Environment

```bash
# Create backend .env file
cat > /var/www/renuga-crm/server/.env << EOF
PORT=3001
NODE_ENV=production
DATABASE_URL=postgresql://renuga_user:your_secure_password@localhost:5432/renuga_crm
JWT_SECRET=$(openssl rand -base64 32)
JWT_EXPIRES_IN=7d
FRONTEND_URL=http://$(curl -s ifconfig.me)
EOF
```

#### 3.5 Build and Deploy Application

```bash
cd /var/www/renuga-crm

# Install and build frontend
npm ci
npm run build

# Install and build backend
cd server
npm ci
npm run build

# Run database migrations and seed
npm run db:migrate
npm run db:seed
cd ..
```

#### 3.6 Setup PM2 Process Manager

```bash
cd /var/www/renuga-crm/server

# Start backend with PM2
pm2 start dist/index.js --name renuga-crm-api

# Save PM2 configuration
pm2 save

# Setup PM2 to start on system boot
pm2 startup systemd
# Run the command that PM2 outputs
```

#### 3.7 Configure Nginx

```bash
# Copy Nginx configuration
sudo cp /var/www/renuga-crm/nginx/renuga-crm.conf /etc/nginx/sites-available/renuga-crm

# Enable site
sudo ln -s /etc/nginx/sites-available/renuga-crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Reload Nginx
sudo systemctl reload nginx
```

### Step 4: Verify Installation

```bash
# Check PM2 status
pm2 status

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Test API health endpoint
curl http://localhost:3001/health

# Access application
# Open browser: http://<EC2_PUBLIC_IP>
```

## GitHub Repository Configuration

### Step 1: Generate SSH Key for Deployment

On your **local machine** or **EC2 instance**:

```bash
# Generate SSH key pair for deployment
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""

# This creates:
# - ~/.ssh/github_deploy_key (private key - for GitHub Secrets)
# - ~/.ssh/github_deploy_key.pub (public key - for EC2)
```

### Step 2: Add Public Key to EC2 Instance

On your **EC2 instance**:

```bash
# Add the public key to authorized_keys
cat >> ~/.ssh/authorized_keys << EOF
# GitHub Actions Deploy Key
ssh-ed25519 AAAAC3... github-actions-deploy
EOF

# Set proper permissions
chmod 600 ~/.ssh/authorized_keys
```

Or from your **local machine**:

```bash
# Copy public key to EC2
ssh-copy-id -i ~/.ssh/github_deploy_key.pub ubuntu@<EC2_PUBLIC_IP>
```

### Step 3: Configure GitHub Secrets

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click `Settings` → `Secrets and variables` → `Actions`
   - Click `New repository secret`

2. **Add Required Secrets**

   Create the following secrets:

   | Secret Name | Description | Example Value |
   |-------------|-------------|---------------|
   | `EC2_SSH_PRIVATE_KEY` | Private SSH key for deployment | Contents of `~/.ssh/github_deploy_key` |
   | `EC2_HOST` | EC2 instance public IP or domain | `54.123.45.67` or `crm.example.com` |
   | `EC2_USER` | SSH username on EC2 | `ubuntu` |
   | `VITE_API_URL` | Backend API URL for frontend build | `http://54.123.45.67:3001` |

3. **How to Add Each Secret**

   **EC2_SSH_PRIVATE_KEY:**
   ```bash
   # On local machine, display private key
   cat ~/.ssh/github_deploy_key
   
   # Copy entire output including:
   # -----BEGIN OPENSSH PRIVATE KEY-----
   # ... key content ...
   # -----END OPENSSH PRIVATE KEY-----
   
   # Paste into GitHub Secret value field
   ```

   **EC2_HOST:**
   ```bash
   # Get EC2 public IP
   # From AWS Console: EC2 → Instances → Your Instance → Public IPv4
   # Or on EC2 instance:
   curl -s ifconfig.me
   ```

   **EC2_USER:**
   ```
   ubuntu
   # (default user for Ubuntu AMI)
   ```

   **VITE_API_URL:**
   ```
   http://<EC2_PUBLIC_IP>:3001
   # Or with domain:
   https://api.example.com
   ```

### Step 4: Configure GitHub Environments (Optional but Recommended)

For better control over deployments, set up environments:

1. **Navigate to Environments**
   - Go to `Settings` → `Environments`
   - Click `New environment`

2. **Create Staging Environment**
   - Name: `staging`
   - Add protection rules (optional):
     - Required reviewers
     - Wait timer
     - Deployment branches: `main`

3. **Create Production Environment**
   - Name: `production`
   - Add protection rules:
     - Required reviewers: Select team members
     - Wait timer: 5 minutes (optional)
     - Deployment branches: `production`

4. **Add Environment-Specific Secrets**
   - In each environment, add environment-specific secrets
   - These override repository secrets when deploying to that environment

## GitHub Actions Workflow

### Workflow Overview

The workflow file is located at `.github/workflows/deploy-ec2.yml` and defines the CI/CD pipeline.

### Workflow Triggers

The workflow runs on:

1. **Push to main or production branches**
   ```yaml
   on:
     push:
       branches:
         - main
         - production
   ```

2. **Pull Requests**
   ```yaml
   on:
     pull_request:
       branches:
         - main
         - production
   ```
   Note: PRs only run build and test jobs, not deployment

3. **Manual Trigger**
   ```yaml
   on:
     workflow_dispatch:
       inputs:
         environment:
           description: 'Deployment environment'
           required: true
           default: 'staging'
   ```

### Workflow Jobs

#### Job 1: Build Frontend

```yaml
build-frontend:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js
    - Install dependencies (npm ci)
    - Lint code
    - Build production bundle
    - Upload artifacts
```

**What happens:**
- Checks out repository code
- Sets up Node.js environment
- Installs dependencies using `npm ci` (faster, more reliable)
- Runs ESLint for code quality
- Builds optimized production bundle with Vite
- Uploads `dist/` folder as artifact for deployment

#### Job 2: Build Backend

```yaml
build-backend:
  runs-on: ubuntu-latest
  steps:
    - Checkout code
    - Setup Node.js
    - Install dependencies (npm ci)
    - Build TypeScript to JavaScript
    - Upload artifacts
```

**What happens:**
- Checks out repository code
- Sets up Node.js environment
- Installs backend dependencies
- Compiles TypeScript to JavaScript
- Uploads `server/dist/` folder as artifact

#### Job 3: Deploy to EC2

```yaml
deploy:
  needs: [build-frontend, build-backend]
  runs-on: ubuntu-latest
  if: github.event_name == 'push' || github.event_name == 'workflow_dispatch'
  steps:
    - Download artifacts
    - Configure SSH
    - Create deployment package
    - Upload to EC2
    - Deploy on EC2
    - Verify deployment
```

**What happens:**
1. **Download Artifacts**: Gets built frontend and backend
2. **Configure SSH**: Sets up SSH key for EC2 connection
3. **Create Package**: Creates compressed tarball of all deployment files
4. **Upload**: Transfers package to EC2 via SCP
5. **Deploy**: Executes deployment script on EC2:
   - Creates backup of current deployment
   - Extracts new files
   - Installs production dependencies
   - Runs database migrations
   - Updates Nginx configuration
   - Restarts backend service (PM2 or systemd)
   - Cleans up old backups (keeps last 5)
6. **Verify**: Checks service health and API endpoint

#### Job 4: Rollback (Manual Only)

```yaml
rollback:
  if: github.event_name == 'workflow_dispatch' && github.event.inputs.environment == 'rollback'
  steps:
    - Configure SSH
    - Connect to EC2
    - Restore latest backup
    - Restart services
```

**How to trigger:**
- Go to `Actions` tab in GitHub
- Select `Deploy to AWS EC2` workflow
- Click `Run workflow`
- Select environment: `rollback`

## Deployment Process

### Automatic Deployment Flow

1. **Developer pushes code to main branch**
   ```bash
   git add .
   git commit -m "Add new feature"
   git push origin main
   ```

2. **GitHub Actions triggers automatically**
   - Workflow starts within seconds
   - View progress in `Actions` tab

3. **Build phase (parallel)**
   - Frontend builds: ~2-3 minutes
   - Backend builds: ~1-2 minutes

4. **Deploy phase**
   - Creates deployment package: ~10 seconds
   - Uploads to EC2: ~5-30 seconds (depends on package size)
   - Deploys on EC2: ~1-2 minutes
   - Verifies deployment: ~10 seconds

5. **Total deployment time: ~5-7 minutes**

### Manual Deployment

Trigger deployment manually for more control:

1. **Navigate to Actions Tab**
   - Click `Actions` in GitHub repository
   - Select `Deploy to AWS EC2` workflow

2. **Run Workflow**
   - Click `Run workflow` button
   - Select branch: `main` or `production`
   - Choose environment: `staging` or `production`
   - Click `Run workflow`

3. **Monitor Progress**
   - Click on the running workflow
   - View real-time logs for each job
   - See deployment status

### Branch-Based Deployment Strategy

**Recommended setup:**

```
main branch → staging environment → staging EC2
production branch → production environment → production EC2
```

**Workflow:**

1. **Development**
   ```bash
   git checkout -b feature/new-feature
   # Make changes
   git commit -m "Add new feature"
   git push origin feature/new-feature
   ```

2. **Create Pull Request**
   - PR to `main` branch
   - CI runs build and test jobs
   - Team reviews code
   - Merge to `main`

3. **Automatic Staging Deployment**
   - Merge triggers deployment to staging
   - Test on staging environment
   - Verify functionality

4. **Promote to Production**
   ```bash
   git checkout production
   git merge main
   git push origin production
   ```
   - Triggers production deployment
   - Requires approval (if configured)
   - Deploys to production EC2

## Troubleshooting

### Common Issues and Solutions

#### 1. SSH Connection Failed

**Error:**
```
Permission denied (publickey)
```

**Solutions:**
```bash
# On EC2, check authorized_keys
cat ~/.ssh/authorized_keys

# Verify key permissions
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh

# Test SSH connection from local machine
ssh -i ~/.ssh/github_deploy_key ubuntu@<EC2_IP>

# Check GitHub Secret contains full private key
# including BEGIN and END lines
```

#### 2. Build Failed

**Error:**
```
npm ERR! Cannot read property 'xxx' of undefined
```

**Solutions:**
```bash
# Clear npm cache locally
npm cache clean --force
rm -rf node_modules package-lock.json
npm install

# Update package-lock.json
npm install --package-lock-only

# Commit updated package-lock.json
git add package-lock.json
git commit -m "Update package-lock.json"
git push
```

#### 3. Deployment Script Failed

**Error:**
```
tar: Cannot open: Permission denied
```

**Solutions:**
```bash
# On EC2, check directory ownership
ls -la /var/www/
sudo chown -R ubuntu:ubuntu /var/www/renuga-crm

# Check disk space
df -h

# Clean up old backups if needed
sudo rm -rf /var/backups/renuga-crm/backup_*
```

#### 4. PM2 Process Not Starting

**Error:**
```
[PM2][ERROR] Process renuga-crm-api not found
```

**Solutions:**
```bash
# On EC2, check PM2 status
pm2 status

# Start process manually
cd /var/www/renuga-crm/server
pm2 start dist/index.js --name renuga-crm-api

# Save PM2 configuration
pm2 save

# Check logs
pm2 logs renuga-crm-api --lines 100
```

#### 5. Nginx 502 Bad Gateway

**Error:**
```
502 Bad Gateway
```

**Solutions:**
```bash
# On EC2, check backend is running
pm2 status
curl http://localhost:3001/health

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log

# Restart services
pm2 restart renuga-crm-api
sudo systemctl restart nginx

# Verify Nginx configuration
sudo nginx -t
```

#### 6. Database Migration Failed

**Error:**
```
ECONNREFUSED: Connection refused
```

**Solutions:**
```bash
# On EC2, check PostgreSQL status
sudo systemctl status postgresql

# Test database connection
psql -U renuga_user -h localhost -d renuga_crm

# Check environment variables
cat /var/www/renuga-crm/server/.env

# Restart PostgreSQL if needed
sudo systemctl restart postgresql
```

### Debugging Workflow

1. **View Workflow Logs**
   - Go to `Actions` tab
   - Click on failed workflow run
   - Click on failed job
   - Expand failed step to see error details

2. **Enable Debug Logging**
   
   Add secrets to repository:
   - `ACTIONS_RUNNER_DEBUG`: `true`
   - `ACTIONS_STEP_DEBUG`: `true`
   
   Re-run workflow to get detailed logs

3. **Test SSH Connection**
   ```bash
   # From local machine
   ssh -i ~/.ssh/github_deploy_key ubuntu@<EC2_IP>
   
   # Test deployment commands manually
   cd /var/www/renuga-crm
   git pull
   npm run build
   pm2 restart renuga-crm-api
   ```

4. **Check EC2 Instance**
   ```bash
   # Connect to EC2
   ssh -i your-key.pem ubuntu@<EC2_IP>
   
   # Check service status
   pm2 status
   sudo systemctl status nginx
   sudo systemctl status postgresql
   
   # Check logs
   pm2 logs renuga-crm-api --lines 50
   sudo tail -f /var/log/nginx/error.log
   
   # Check disk space
   df -h
   
   # Check memory
   free -h
   ```

## Best Practices

### Security

1. **Use Strong SSH Keys**
   ```bash
   # Generate ed25519 key (recommended)
   ssh-keygen -t ed25519 -C "deploy" -f ~/.ssh/deploy_key
   
   # Or RSA 4096-bit
   ssh-keygen -t rsa -b 4096 -C "deploy" -f ~/.ssh/deploy_key
   ```

2. **Rotate Secrets Regularly**
   - Change SSH keys every 90 days
   - Update GitHub Secrets when keys change
   - Monitor secret usage in audit logs

3. **Use Environment-Specific Secrets**
   - Different secrets for staging and production
   - Never share production secrets
   - Use GitHub Environments for protection

4. **Secure EC2 Instance**
   ```bash
   # Enable UFW firewall
   sudo ufw allow 22
   sudo ufw allow 80
   sudo ufw allow 443
   sudo ufw enable
   
   # Install fail2ban
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   
   # Disable password authentication
   sudo sed -i 's/PasswordAuthentication yes/PasswordAuthentication no/' /etc/ssh/sshd_config
   sudo systemctl restart sshd
   ```

5. **Use HTTPS/SSL**
   ```bash
   # Install Certbot
   sudo apt install -y certbot python3-certbot-nginx
   
   # Obtain certificate
   sudo certbot --nginx -d yourdomain.com
   
   # Auto-renewal
   sudo certbot renew --dry-run
   ```

### Performance

1. **Optimize Build Times**
   - Use `npm ci` instead of `npm install`
   - Cache dependencies in workflow
   - Use smaller Docker images (if using containers)
   - Parallel job execution

2. **Minimize Downtime**
   - Use PM2 cluster mode for zero-downtime
   - Health checks before switching traffic
   - Gradual rollout (blue-green deployment)

3. **Database Migration Strategy**
   ```bash
   # Run migrations before code deployment
   # Ensure migrations are backward compatible
   # Test migrations on staging first
   ```

### Reliability

1. **Automated Backups**
   ```bash
   # On EC2, set up daily backups with cron
   crontab -e
   # Add:
   0 2 * * * /usr/local/bin/backup-renuga-db.sh
   
   # Keep backups for 30 days
   # Store backups offsite (S3, etc.)
   ```

2. **Health Checks**
   ```javascript
   // Add health check endpoint in backend
   app.get('/health', (req, res) => {
     res.json({
       status: 'healthy',
       timestamp: new Date().toISOString(),
       uptime: process.uptime()
     });
   });
   ```

3. **Monitoring and Alerts**
   ```bash
   # Set up CloudWatch monitoring
   # Configure SNS notifications
   # Monitor key metrics:
   # - CPU usage
   # - Memory usage
   # - Disk space
   # - Request rate
   # - Error rate
   ```

4. **Rollback Strategy**
   - Always keep backups of last 5 deployments
   - Test rollback procedure regularly
   - Document rollback process
   - Have manual rollback option ready

### Maintenance

1. **Regular Updates**
   ```bash
   # Schedule regular update windows
   # Update system packages monthly
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js LTS versions
   # Update dependencies regularly
   npm audit fix
   ```

2. **Log Management**
   ```bash
   # Rotate logs to prevent disk filling
   # Configure logrotate
   sudo nano /etc/logrotate.d/renuga-crm
   
   # Clean old PM2 logs
   pm2 flush
   ```

3. **Database Maintenance**
   ```bash
   # Regular vacuum and analyze
   psql -U renuga_user -d renuga_crm -c "VACUUM ANALYZE;"
   
   # Monitor database size
   psql -U renuga_user -d renuga_crm -c "SELECT pg_size_pretty(pg_database_size('renuga_crm'));"
   ```

4. **Documentation**
   - Keep deployment documentation updated
   - Document all configuration changes
   - Maintain runbook for common issues
   - Update team on changes

### Testing

1. **Pre-Deployment Testing**
   ```bash
   # Always test on staging first
   # Run automated tests
   # Manual QA testing
   # Performance testing
   ```

2. **Post-Deployment Verification**
   ```bash
   # Automated health checks
   # Manual smoke testing
   # Monitor error logs
   # Check key functionality
   ```

3. **CI/CD Pipeline Testing**
   - Test workflow on feature branches
   - Use pull requests to trigger builds
   - Review build logs regularly
   - Fix flaky tests immediately

## Advanced Configurations

### Multi-Environment Setup

For organizations with multiple environments:

```yaml
# .github/workflows/deploy-ec2.yml
environments:
  development:
    EC2_HOST: dev.example.com
  staging:
    EC2_HOST: staging.example.com
  production:
    EC2_HOST: production.example.com
```

### Blue-Green Deployment

For zero-downtime deployments:

1. **Setup two identical environments**
   - Blue: Current production
   - Green: New deployment

2. **Deploy to Green**
   - Test thoroughly
   - Switch traffic to Green
   - Keep Blue as backup

3. **Update Nginx**
   ```nginx
   upstream backend {
     server blue.internal:3001;
     server green.internal:3001 backup;
   }
   ```

### Load Balancer Integration

For high availability:

```yaml
# Add load balancer health checks
- name: Register with Load Balancer
  run: |
    aws elb register-instances-with-load-balancer \
      --load-balancer-name my-lb \
      --instances ${{ secrets.EC2_INSTANCE_ID }}
```

## Conclusion

This comprehensive guide covers:
- ✅ Complete EC2 setup from scratch
- ✅ GitHub Actions CI/CD configuration
- ✅ Automated deployment process
- ✅ Security best practices
- ✅ Troubleshooting common issues
- ✅ Performance optimization
- ✅ Maintenance procedures

### Next Steps

1. Set up EC2 instance following this guide
2. Configure GitHub Secrets
3. Test workflow with a sample deployment
4. Monitor first production deployment
5. Document any custom configurations
6. Train team on deployment process

### Additional Resources

- [AWS EC2 Documentation](https://docs.aws.amazon.com/ec2/)
- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Nginx Documentation](https://nginx.org/en/docs/)
- [PM2 Documentation](https://pm2.keymetrics.io/docs/)
- [PostgreSQL Documentation](https://www.postgresql.org/docs/)

### Support

For issues or questions:
1. Check this documentation
2. Review GitHub Actions logs
3. Check EC2 service status
4. Create GitHub issue with details
5. Contact DevOps team

---

**Last Updated**: December 2024  
**Version**: 1.0.0  
**Maintained By**: Renuga CRM DevOps Team
