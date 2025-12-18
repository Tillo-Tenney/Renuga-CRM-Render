# AWS EC2 Deployment Resources

This directory structure contains all the resources needed to deploy Renuga CRM on AWS EC2 Ubuntu instances.

## 📁 File Structure

```
.
├── AWS_EC2_DEPLOYMENT.md      # Complete deployment guide
├── QUICKSTART_EC2.md          # Quick start guide (10 minutes)
├── ec2-setup.sh               # Automated setup script
├── ec2-manual-helper.sh       # Interactive manual setup helper
├── nginx/                     # Nginx configurations
│   ├── README.md              # Nginx setup documentation
│   ├── renuga-crm.conf        # HTTP configuration
│   └── renuga-crm-ssl.conf    # HTTPS configuration
└── systemd/                   # Systemd service files
    ├── README.md              # Systemd setup documentation
    └── renuga-crm-api.service # Backend service file
```

## 🚀 Quick Deployment Options

### Option 1: Automated Setup (Recommended)
**Time**: 10-15 minutes | **Difficulty**: Easy

```bash
# Clone repository on EC2
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render

# Run automated setup
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

**What it does**:
- ✅ Installs Node.js, PostgreSQL, Nginx, PM2
- ✅ Creates and configures database
- ✅ Builds frontend and backend
- ✅ Sets up PM2 process manager
- ✅ Configures Nginx reverse proxy
- ✅ Creates maintenance scripts

### Option 2: Manual Setup with Helper
**Time**: 20-30 minutes | **Difficulty**: Medium

```bash
# Clone repository on EC2
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render

# Run interactive helper
chmod +x ec2-manual-helper.sh
./ec2-manual-helper.sh
```

**Features**:
- Interactive menu-driven setup
- Step-by-step control
- Built-in utilities (IP lookup, secret generation)
- Service status checking

### Option 3: Fully Manual
**Time**: 30-45 minutes | **Difficulty**: Advanced

Follow the complete guide in [AWS_EC2_DEPLOYMENT.md](../AWS_EC2_DEPLOYMENT.md)

## 📋 Prerequisites

### EC2 Instance Requirements
- **OS**: Ubuntu 22.04 LTS or 24.04 LTS
- **Instance Type**: Minimum t2.micro (t3.small recommended)
- **Storage**: 20 GB minimum (30 GB recommended)
- **Memory**: 1 GB minimum (2 GB recommended)

### Security Group Configuration
| Port | Protocol | Source    | Purpose          |
|------|----------|-----------|------------------|
| 22   | TCP      | Your IP   | SSH access       |
| 80   | TCP      | 0.0.0.0/0 | HTTP traffic     |
| 443  | TCP      | 0.0.0.0/0 | HTTPS traffic    |

### Access Requirements
- SSH key pair for EC2 access
- Basic Linux command line knowledge
- (Optional) Domain name for SSL setup

## 🔧 What Gets Installed

### System Dependencies
- **Node.js 20.x**: JavaScript runtime
- **PostgreSQL**: Database server
- **Nginx**: Web server and reverse proxy
- **PM2**: Process manager for Node.js
- **Build tools**: gcc, make, git, curl

### Application Components
- **Backend API**: Express.js server on port 3001
- **Frontend**: React SPA served by Nginx
- **Database**: PostgreSQL with initialized schema
- **Services**: Configured to start on boot

## 📚 Documentation

### Quick References
- [QUICKSTART_EC2.md](../QUICKSTART_EC2.md) - Get started in 10 minutes
- [AWS_EC2_DEPLOYMENT.md](../AWS_EC2_DEPLOYMENT.md) - Complete deployment guide

### Configuration Details
- [nginx/README.md](../nginx/README.md) - Nginx setup and configuration
- [systemd/README.md](../systemd/README.md) - Systemd service management

### Application Documentation
- [README.md](../README.md) - Main application documentation
- [server/README.md](../server/README.md) - Backend API documentation
- [DEPLOYMENT.md](../DEPLOYMENT.md) - Render platform deployment

## 🔐 Default Credentials

After deployment, the application creates default users:

| Role       | Email               | Password    |
|------------|---------------------|-------------|
| Admin      | admin@renuga.com    | admin123    |
| Front Desk | priya@renuga.com    | password123 |
| Sales      | ravi@renuga.com     | password123 |
| Operations | muthu@renuga.com    | password123 |

⚠️ **IMPORTANT**: Change these passwords immediately after first login!

## 🛠️ Common Tasks

### Check Application Status
```bash
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

### View Logs
```bash
# Backend logs
pm2 logs renuga-crm-api

# Nginx logs
sudo tail -f /var/log/nginx/error.log

# System logs
sudo journalctl -u renuga-crm-api -f
```

### Update Application
```bash
cd /var/www/renuga-crm
git pull origin main

# Update backend
cd server && npm install && npm run build && npm run db:migrate && cd ..

# Update frontend
npm install && npm run build

# Restart services
pm2 restart renuga-crm-api
sudo systemctl reload nginx
```

### Backup Database
```bash
# Manual backup
/usr/local/bin/backup-renuga-db.sh

# Automated daily backups are scheduled at 2:00 AM
```

### Setup SSL/HTTPS
```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain certificate
sudo certbot --nginx -d yourdomain.com

# Test auto-renewal
sudo certbot renew --dry-run
```

## 🐛 Troubleshooting

### Backend Won't Start
```bash
# Check logs
pm2 logs renuga-crm-api --lines 100

# Common fixes:
# 1. Verify database connection
psql -U renuga_user -h localhost renuga_crm

# 2. Check .env file
cat server/.env

# 3. Rebuild
cd server && npm run build
pm2 restart renuga-crm-api
```

### Frontend Not Loading
```bash
# Check Nginx configuration
sudo nginx -t

# Verify files exist
ls -la /var/www/renuga-crm/dist

# Rebuild if needed
npm run build
sudo systemctl restart nginx
```

### Database Connection Failed
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection
psql -U renuga_user -h localhost renuga_crm

# Reset if needed
sudo systemctl restart postgresql
```

## 📊 Monitoring

### Resource Usage
```bash
# Disk space
df -h

# Memory usage
free -h

# CPU usage
top

# PM2 monitoring
pm2 monit
```

### Application Metrics
```bash
# PM2 status
pm2 status

# Detailed info
pm2 info renuga-crm-api

# Process list
pm2 list
```

## 🔒 Security Checklist

- [ ] Change all default passwords
- [ ] Enable HTTPS/SSL for production
- [ ] Configure firewall (UFW)
- [ ] Set strong database password
- [ ] Regular system updates
- [ ] Enable fail2ban
- [ ] Configure security groups properly
- [ ] Set up regular backups
- [ ] Monitor access logs
- [ ] Restrict SSH access

## 💰 Cost Estimation

### AWS EC2 Costs (Monthly, Approximate)

| Configuration    | Instance Type | Storage | Cost* |
|-----------------|---------------|---------|-------|
| Development     | t2.micro      | 20 GB   | ~$10  |
| Small Production| t3.small      | 30 GB   | ~$20  |
| Production      | t3.medium     | 50 GB   | ~$40  |

*Costs may vary by region. Use AWS Pricing Calculator for accurate estimates.

### Cost Optimization
- Use Reserved Instances (up to 72% savings)
- Stop instances when not in use (dev/test)
- Use spot instances for non-critical workloads
- Set up billing alerts

## 🆘 Support

### Documentation
- Complete deployment guide with troubleshooting
- Configuration templates with comments
- Step-by-step instructions
- Security best practices

### Resources
- AWS EC2 Documentation: https://docs.aws.amazon.com/ec2/
- Ubuntu Documentation: https://help.ubuntu.com/
- Nginx Documentation: https://nginx.org/en/docs/
- PM2 Documentation: https://pm2.keymetrics.io/docs/

### Getting Help
1. Check documentation in this repository
2. Review troubleshooting section
3. Check logs for error messages
4. Create GitHub issue with details

## 🎯 Next Steps

After successful deployment:

1. **Access Application**: http://YOUR_EC2_IP
2. **Login**: Use default admin credentials
3. **Change Passwords**: Update all default passwords
4. **Configure Users**: Add/remove users as needed
5. **Setup SSL**: Configure HTTPS for production
6. **Enable Backups**: Verify backup schedule
7. **Monitor**: Set up monitoring and alerts
8. **Scale**: Consider load balancing for high traffic

## 📝 Notes

- All scripts are tested on Ubuntu 22.04 LTS and 24.04 LTS
- Scripts require sudo/root access for system changes
- Database credentials are saved securely in `/root/`
- Automatic backups are scheduled daily at 2:00 AM
- PM2 is configured to start on system boot
- Nginx serves static files and proxies API requests

## 🎉 Success!

Once deployed, you should have:
- ✅ Fully functional CRM application
- ✅ Automatic service restart on failure
- ✅ Daily database backups
- ✅ Nginx reverse proxy
- ✅ Production-ready setup

Access your application at: `http://YOUR_EC2_IP`

---

**Questions or Issues?** Check the full documentation or create an issue on GitHub.
