# AWS EC2 Ubuntu Deployment Guide - Renuga CRM

## Overview

This guide provides step-by-step instructions for deploying the Renuga CRM fullstack application on AWS EC2 instances running Ubuntu OS. The application consists of:
- **Frontend**: React static site served by Nginx
- **Backend**: Node.js Express API (managed by PM2)
- **Database**: PostgreSQL
- **Reverse Proxy**: Nginx

## Prerequisites

- AWS account with EC2 access
- SSH key pair for EC2 instance access
- Domain name (optional, for production use)
- Basic knowledge of Linux command line

## Recommended EC2 Instance Specifications

### Development/Testing
- **Instance Type**: t2.micro or t3.micro
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **Storage**: 20 GB gp3
- **Memory**: 1 GB RAM minimum

### Production
- **Instance Type**: t3.small or larger
- **OS**: Ubuntu 22.04 LTS or Ubuntu 24.04 LTS
- **Storage**: 30 GB gp3 or larger
- **Memory**: 2 GB RAM minimum

## Security Group Configuration

Configure the following inbound rules:

| Type  | Protocol | Port Range | Source      | Description           |
|-------|----------|------------|-------------|-----------------------|
| SSH   | TCP      | 22         | Your IP     | SSH access            |
| HTTP  | TCP      | 80         | 0.0.0.0/0   | Web traffic           |
| HTTPS | TCP      | 443        | 0.0.0.0/0   | Secure web traffic    |

## Step-by-Step Deployment

### Step 1: Launch EC2 Instance

1. Log in to AWS Console
2. Navigate to EC2 Dashboard
3. Click "Launch Instance"
4. Configure:
   - **Name**: renuga-crm-server
   - **AMI**: Ubuntu Server 22.04 LTS or 24.04 LTS
   - **Instance Type**: t3.small (or as per requirements)
   - **Key Pair**: Select or create new key pair
   - **Security Group**: Configure as per table above
   - **Storage**: 30 GB gp3
5. Click "Launch Instance"
6. Wait for instance to be in "Running" state
7. Note the Public IPv4 address

### Step 2: Connect to EC2 Instance

```bash
# Replace with your key file and EC2 public IP
chmod 400 your-key.pem
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>
```

### Step 3: Automated Setup (Recommended)

#### Option A: Using Setup Script

```bash
# Clone the repository
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render

# Make setup script executable
chmod +x ec2-setup.sh

# Run automated setup
sudo ./ec2-setup.sh
```

The script will:
- Install Node.js, PostgreSQL, Nginx, and PM2
- Set up the database
- Configure environment variables
- Build and deploy both frontend and backend
- Set up systemd services
- Configure Nginx reverse proxy

#### Option B: Manual Setup

If you prefer manual control, follow the manual setup steps below.

### Step 4: Manual Setup (Alternative)

#### 4.1 Update System and Install Dependencies

```bash
# Update package lists
sudo apt update && sudo apt upgrade -y

# Install Node.js 20.x
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs

# Verify installation
node --version  # Should show v20.x
npm --version

# Install PostgreSQL
sudo apt install -y postgresql postgresql-contrib

# Install Nginx
sudo apt install -y nginx

# Install PM2 globally
sudo npm install -g pm2

# Install Git (if not already installed)
sudo apt install -y git

# Install build essentials
sudo apt install -y build-essential
```

#### 4.2 Configure PostgreSQL

```bash
# Switch to postgres user
sudo -u postgres psql

# In PostgreSQL shell:
CREATE DATABASE renuga_crm;
CREATE USER renuga_user WITH ENCRYPTED PASSWORD 'your_secure_password_here';
GRANT ALL PRIVILEGES ON DATABASE renuga_crm TO renuga_user;
\q

# Configure PostgreSQL to allow local connections
sudo nano /etc/postgresql/*/main/pg_hba.conf
# Change peer to md5 for local connections if needed

# Restart PostgreSQL
sudo systemctl restart postgresql
sudo systemctl enable postgresql
```

#### 4.3 Clone and Setup Application

```bash
# Create application directory
sudo mkdir -p /var/www/renuga-crm
sudo chown -R $USER:$USER /var/www/renuga-crm
cd /var/www/renuga-crm

# Clone repository
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git .

# Or pull specific branch if needed
# git clone -b <branch-name> https://github.com/Tillo-Tenney/Renuga-CRM-Render.git .
```

#### 4.4 Configure Backend

```bash
# Navigate to server directory
cd /var/www/renuga-crm/server

# Install dependencies
npm install

# Create environment file
cp .env.example .env

# Edit environment variables
nano .env
```

Update `.env` with your configuration:
```bash
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://renuga_user:your_secure_password_here@localhost:5432/renuga_crm

# JWT Configuration
JWT_SECRET=generate_a_random_secure_string_here_at_least_32_chars
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://<YOUR_EC2_IP>
```

Generate a secure JWT secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

```bash
# Build backend
npm run build

# Run database migrations
npm run db:migrate

# Seed initial data
npm run db:seed
```

#### 4.5 Configure Frontend

```bash
# Navigate to frontend root
cd /var/www/renuga-crm

# Create environment file
cp .env.example .env.local

# Edit environment variables
nano .env.local
```

Update `.env.local`:
```bash
VITE_API_URL=http://<YOUR_EC2_IP>/api
```

```bash
# Install dependencies
npm install

# Build frontend
npm run build
```

#### 4.6 Setup PM2 for Backend

```bash
# Create PM2 ecosystem file
cd /var/www/renuga-crm

cat > ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'renuga-crm-api',
    cwd: '/var/www/renuga-crm/server',
    script: 'npm',
    args: 'start',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'production'
    }
  }]
};
EOF

# Start backend with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup systemd
# Follow the command provided by pm2 startup

# Check status
pm2 status
pm2 logs renuga-crm-api
```

#### 4.7 Configure Nginx

```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/renuga-crm
```

Add the following configuration:
```nginx
server {
    listen 80;
    server_name <YOUR_EC2_IP_OR_DOMAIN>;

    # Frontend - Serve static files
    location / {
        root /var/www/renuga-crm/dist;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # Backend API - Reverse proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/renuga-crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test Nginx configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
sudo systemctl enable nginx
```

### Step 5: Verify Deployment

```bash
# Check backend status
pm2 status
pm2 logs renuga-crm-api

# Check Nginx status
sudo systemctl status nginx

# Check PostgreSQL status
sudo systemctl status postgresql

# Test backend health
curl http://localhost:3001/health

# Test frontend
curl http://localhost:80
```

### Step 6: Access Application

1. Open your web browser
2. Navigate to: `http://<YOUR_EC2_PUBLIC_IP>`
3. Login with default credentials:
   - **Email**: admin@renuga.com
   - **Password**: admin123

## SSL/HTTPS Setup (Production)

For production, secure your application with SSL/HTTPS:

### Using Let's Encrypt (Free SSL)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate (replace with your domain)
sudo certbot --nginx -d your-domain.com -d www.your-domain.com

# Test automatic renewal
sudo certbot renew --dry-run

# Certbot will automatically update Nginx configuration
```

Update your environment variables:
```bash
# Backend .env
FRONTEND_URL=https://your-domain.com

# Frontend .env.local
VITE_API_URL=https://your-domain.com/api
```

Rebuild and restart:
```bash
cd /var/www/renuga-crm
npm run build
pm2 restart renuga-crm-api
```

## Maintenance and Updates

### Update Application Code

```bash
# Navigate to application directory
cd /var/www/renuga-crm

# Pull latest changes
git pull origin main

# Update backend
cd server
npm install
npm run build
npm run db:migrate  # If there are new migrations
cd ..

# Update frontend
npm install
npm run build

# Restart backend
pm2 restart renuga-crm-api

# Reload Nginx
sudo systemctl reload nginx
```

### Backup Database

```bash
# Create backup directory
mkdir -p ~/backups

# Backup database
pg_dump -U renuga_user -h localhost renuga_crm > ~/backups/renuga_crm_$(date +%Y%m%d_%H%M%S).sql

# Or automated backup script
cat > ~/backup-db.sh << 'EOF'
#!/bin/bash
BACKUP_DIR="$HOME/backups"
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
PGPASSWORD=your_secure_password_here pg_dump -U renuga_user -h localhost renuga_crm > "$BACKUP_DIR/renuga_crm_$TIMESTAMP.sql"
# Keep only last 7 days of backups
find "$BACKUP_DIR" -name "renuga_crm_*.sql" -mtime +7 -delete
EOF

chmod +x ~/backup-db.sh

# Add to crontab for daily backups at 2 AM
(crontab -l 2>/dev/null; echo "0 2 * * * $HOME/backup-db.sh") | crontab -
```

### Restore Database

```bash
# Stop backend
pm2 stop renuga-crm-api

# Restore from backup
psql -U renuga_user -h localhost renuga_crm < ~/backups/renuga_crm_TIMESTAMP.sql

# Start backend
pm2 start renuga-crm-api
```

### View Logs

```bash
# Backend logs
pm2 logs renuga-crm-api

# Nginx access logs
sudo tail -f /var/log/nginx/access.log

# Nginx error logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u nginx -f
```

### Monitor Resources

```bash
# Check disk usage
df -h

# Check memory usage
free -h

# Check CPU usage
top

# Check PM2 status
pm2 status
pm2 monit
```

## Troubleshooting

### Backend Not Starting

```bash
# Check logs
pm2 logs renuga-crm-api --lines 100

# Common issues:
# 1. Database connection - verify DATABASE_URL in .env
# 2. Port already in use - check with: sudo lsof -i :3001
# 3. Build errors - rebuild: cd server && npm run build

# Restart backend
pm2 restart renuga-crm-api
```

### Frontend Not Loading

```bash
# Check Nginx configuration
sudo nginx -t

# Check if files exist
ls -la /var/www/renuga-crm/dist

# Rebuild frontend
cd /var/www/renuga-crm
npm run build

# Restart Nginx
sudo systemctl restart nginx
```

### Database Connection Issues

```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U renuga_user -h localhost renuga_crm

# Check pg_hba.conf for authentication
sudo nano /etc/postgresql/*/main/pg_hba.conf

# Restart PostgreSQL
sudo systemctl restart postgresql
```

### CORS Errors

Update FRONTEND_URL in backend `.env`:
```bash
cd /var/www/renuga-crm/server
nano .env
# Update FRONTEND_URL to match your domain/IP
```

Restart backend:
```bash
pm2 restart renuga-crm-api
```

### High Memory Usage

```bash
# Reduce PM2 instances
pm2 scale renuga-crm-api 1

# Set memory limit
pm2 restart renuga-crm-api --max-memory-restart 512M

# Check memory
pm2 monit
```

## Security Best Practices

1. **Change Default Passwords**
   ```bash
   # Login to application and change default user passwords
   # Use strong passwords with mix of characters
   ```

2. **Secure PostgreSQL**
   ```bash
   # Use strong database password
   # Limit database connections to localhost only
   sudo nano /etc/postgresql/*/main/postgresql.conf
   # Set: listen_addresses = 'localhost'
   ```

3. **Firewall Configuration**
   ```bash
   # Enable UFW firewall
   sudo ufw allow OpenSSH
   sudo ufw allow 'Nginx Full'
   sudo ufw enable
   sudo ufw status
   ```

4. **Keep System Updated**
   ```bash
   # Regular updates
   sudo apt update && sudo apt upgrade -y
   
   # Update Node.js packages
   cd /var/www/renuga-crm/server && npm audit fix
   cd /var/www/renuga-crm && npm audit fix
   ```

5. **Enable Fail2Ban** (Protect against brute force)
   ```bash
   sudo apt install -y fail2ban
   sudo systemctl enable fail2ban
   sudo systemctl start fail2ban
   ```

6. **Secure Environment Files**
   ```bash
   chmod 600 /var/www/renuga-crm/server/.env
   chmod 600 /var/www/renuga-crm/.env.local
   ```

## Performance Optimization

### PM2 Cluster Mode

For better performance on multi-core systems:
```bash
# Update ecosystem.config.js
nano ecosystem.config.js
```

Change `instances: 1` to `instances: 'max'` for utilizing all CPU cores.

```bash
pm2 reload ecosystem.config.js
```

### Nginx Caching

Add caching to Nginx configuration:
```nginx
location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 1y;
    add_header Cache-Control "public, immutable";
}
```

### Database Connection Pooling

Already configured in the application, but you can optimize pool size in backend code if needed.

## Monitoring and Alerts

### Setup PM2 Monitoring

```bash
# PM2 Plus (optional, requires signup)
pm2 link <secret> <public>

# Or use basic monitoring
pm2 install pm2-logrotate
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

### Setup CloudWatch (Optional)

Install CloudWatch agent for AWS monitoring:
```bash
wget https://s3.amazonaws.com/amazoncloudwatch-agent/ubuntu/amd64/latest/amazon-cloudwatch-agent.deb
sudo dpkg -i -E ./amazon-cloudwatch-agent.deb
```

Follow AWS CloudWatch documentation for configuration.

## Scaling Considerations

### Vertical Scaling
- Upgrade EC2 instance type for more CPU/RAM
- Increase EBS volume size for more storage

### Horizontal Scaling
- Use Application Load Balancer
- Deploy multiple EC2 instances
- Use RDS for managed PostgreSQL
- Use S3 + CloudFront for static assets

## Cost Optimization

1. **Use Reserved Instances** for production (up to 72% savings)
2. **Enable Auto-Scaling** to handle traffic spikes
3. **Use Spot Instances** for development/testing
4. **Set up CloudWatch Billing Alarms**

## Support and Resources

- **Application Documentation**: See README.md
- **Server API Documentation**: See server/README.md
- **AWS EC2 Documentation**: https://docs.aws.amazon.com/ec2/
- **Ubuntu Documentation**: https://help.ubuntu.com/
- **Nginx Documentation**: https://nginx.org/en/docs/
- **PM2 Documentation**: https://pm2.keymetrics.io/docs/

## Quick Reference Commands

```bash
# Application Status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View Logs
pm2 logs renuga-crm-api
sudo tail -f /var/log/nginx/error.log

# Restart Services
pm2 restart renuga-crm-api
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Update Application
cd /var/www/renuga-crm && git pull
cd server && npm install && npm run build && cd ..
npm install && npm run build
pm2 restart renuga-crm-api

# Backup Database
pg_dump -U renuga_user renuga_crm > backup.sql

# System Health
df -h          # Disk space
free -h        # Memory
top            # CPU usage
pm2 monit      # App monitoring
```

---

**Congratulations!** Your Renuga CRM is now deployed on AWS EC2 Ubuntu! 🎉
