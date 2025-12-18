# AWS EC2 Deployment Checklist

Use this checklist to ensure a successful deployment of Renuga CRM on AWS EC2 Ubuntu.

## Pre-Deployment Checklist

### AWS Setup
- [ ] AWS account created and configured
- [ ] EC2 instance launched (Ubuntu 22.04 or 24.04 LTS)
- [ ] Instance type selected (minimum t2.micro, recommended t3.small)
- [ ] Storage configured (minimum 20GB, recommended 30GB)
- [ ] SSH key pair created and downloaded
- [ ] Security group configured:
  - [ ] Port 22 (SSH) - Restricted to your IP
  - [ ] Port 80 (HTTP) - Open to 0.0.0.0/0
  - [ ] Port 443 (HTTPS) - Open to 0.0.0.0/0
- [ ] Elastic IP assigned (optional, recommended for production)

### Local Setup
- [ ] SSH key file permissions set (`chmod 400 your-key.pem`)
- [ ] Can connect to EC2 instance via SSH
- [ ] Git installed locally (for pushing updates)

## Deployment Checklist

### Option A: Automated Setup
- [ ] Connected to EC2 instance via SSH
- [ ] Repository cloned on EC2 instance
- [ ] Script made executable (`chmod +x ec2-setup.sh`)
- [ ] Script run with sudo (`sudo ./ec2-setup.sh`)
- [ ] Script completed without errors
- [ ] Database credentials saved from output
- [ ] Public IP noted from output

### Option B: Manual Setup
- [ ] Connected to EC2 instance via SSH
- [ ] Repository cloned on EC2 instance
- [ ] System dependencies installed
  - [ ] Node.js 20.x
  - [ ] PostgreSQL
  - [ ] Nginx
  - [ ] PM2
- [ ] Database created and configured
  - [ ] Database user created
  - [ ] Database password set (strong password)
  - [ ] Database initialized
- [ ] Backend configured
  - [ ] `.env` file created in `server/`
  - [ ] DATABASE_URL configured
  - [ ] JWT_SECRET generated and set
  - [ ] FRONTEND_URL configured
  - [ ] Dependencies installed
  - [ ] Built successfully
  - [ ] Migrations run
  - [ ] Database seeded
- [ ] Frontend configured
  - [ ] `.env.local` file created
  - [ ] VITE_API_URL configured
  - [ ] Dependencies installed
  - [ ] Built successfully
- [ ] PM2 configured
  - [ ] Backend started with PM2
  - [ ] PM2 startup configured
  - [ ] PM2 configuration saved
- [ ] Nginx configured
  - [ ] Configuration file created
  - [ ] Site enabled
  - [ ] Configuration tested
  - [ ] Nginx restarted

## Post-Deployment Checklist

### Verification
- [ ] Backend health check passes (`curl http://localhost:3001/health`)
- [ ] Frontend accessible locally (`curl http://localhost`)
- [ ] Application accessible from browser (http://EC2_PUBLIC_IP)
- [ ] Can login with default admin credentials
- [ ] Dashboard loads correctly
- [ ] All menu items accessible

### Services Status
- [ ] PM2 shows backend running (`pm2 status`)
- [ ] Nginx running (`sudo systemctl status nginx`)
- [ ] PostgreSQL running (`sudo systemctl status postgresql`)
- [ ] No errors in PM2 logs (`pm2 logs`)
- [ ] No errors in Nginx logs (`sudo tail /var/log/nginx/error.log`)

### Security Configuration
- [ ] Default admin password changed
- [ ] Default user passwords changed or users removed
- [ ] Database password is strong
- [ ] JWT_SECRET is random and secure (32+ characters)
- [ ] `.env` files have restricted permissions (600)
- [ ] UFW firewall enabled
- [ ] fail2ban installed (optional but recommended)

### Production Readiness (If Production)
- [ ] Domain name configured
- [ ] SSL certificate obtained (Let's Encrypt)
- [ ] HTTPS configured in Nginx
- [ ] Backend FRONTEND_URL updated to HTTPS
- [ ] Frontend VITE_API_URL updated to HTTPS
- [ ] Services restarted after HTTPS configuration
- [ ] HTTP to HTTPS redirect working
- [ ] SSL certificate auto-renewal tested
- [ ] Backup script tested (`/usr/local/bin/backup-renuga-db.sh`)
- [ ] Backup cron job verified (`crontab -l`)
- [ ] Monitoring set up (optional)
- [ ] CloudWatch agent installed (optional)

## Maintenance Setup

### Backup Configuration
- [ ] Backup script exists (`/usr/local/bin/backup-renuga-db.sh`)
- [ ] Backup script tested successfully
- [ ] Backup directory created (`/var/backups/renuga-crm`)
- [ ] Daily backup cron job configured (2:00 AM)
- [ ] Backup retention policy set (7 days)
- [ ] Backup restoration tested (optional but recommended)

### Update Configuration
- [ ] Update script exists (`/usr/local/bin/update-renuga-crm.sh`)
- [ ] Update script tested in test environment (if available)
- [ ] Git repository remote configured
- [ ] Can pull updates from repository

### Monitoring
- [ ] PM2 monitoring working (`pm2 monit`)
- [ ] System resource monitoring set up
- [ ] Disk space alerts configured (optional)
- [ ] Application uptime monitoring (optional)
- [ ] Error alerting configured (optional)

## Documentation

### Files Created and Verified
- [ ] AWS_EC2_DEPLOYMENT.md - Complete guide
- [ ] QUICKSTART_EC2.md - Quick start instructions
- [ ] EC2_DEPLOYMENT_README.md - Overview and resources
- [ ] ec2-setup.sh - Automated setup script
- [ ] ec2-manual-helper.sh - Manual setup helper
- [ ] nginx/renuga-crm.conf - HTTP configuration
- [ ] nginx/renuga-crm-ssl.conf - HTTPS configuration
- [ ] systemd/renuga-crm-api.service - Systemd service file

### Credentials Saved
- [ ] EC2 instance IP address
- [ ] SSH key location
- [ ] Database name
- [ ] Database user
- [ ] Database password
- [ ] Application admin credentials
- [ ] All saved in secure location (password manager)

## Testing Checklist

### Functional Testing
- [ ] User login/logout works
- [ ] Dashboard displays correctly
- [ ] Call logs CRUD operations work
- [ ] Leads CRUD operations work
- [ ] Orders CRUD operations work
- [ ] Products CRUD operations work
- [ ] Customers CRUD operations work
- [ ] Tasks CRUD operations work
- [ ] Shift notes work
- [ ] All API endpoints responding

### Performance Testing
- [ ] Page load times acceptable
- [ ] API response times acceptable
- [ ] Database queries performing well
- [ ] Static assets loading quickly
- [ ] No memory leaks observed
- [ ] CPU usage normal under load

### Security Testing
- [ ] HTTPS working (if configured)
- [ ] No SQL injection vulnerabilities
- [ ] XSS protection working
- [ ] CORS configured correctly
- [ ] Authentication required for protected routes
- [ ] Authorization working (role-based access)
- [ ] Sensitive files not accessible (.env files)

## Rollback Plan

### In Case of Issues
- [ ] Previous working configuration documented
- [ ] Database backup taken before deployment
- [ ] Know how to restore from backup
- [ ] Know how to stop PM2 processes
- [ ] Know how to restore Nginx configuration
- [ ] Have rollback plan documented

## Cost Management

### AWS Cost Optimization
- [ ] Instance type appropriate for workload
- [ ] Unnecessary services stopped
- [ ] Elastic IP released if not needed
- [ ] CloudWatch billing alarms set
- [ ] Resource tags configured for cost tracking
- [ ] Consider Reserved Instance for production (savings up to 72%)

## Support and Documentation

### Documentation Access
- [ ] Saved links to all documentation
- [ ] Troubleshooting guide reviewed
- [ ] Know where to find logs
- [ ] Know how to check service status
- [ ] Know how to restart services

### Support Contacts
- [ ] GitHub repository bookmarked
- [ ] AWS support contact information saved
- [ ] Team contact information documented

## Final Verification

### Deployment Success Criteria
- [ ] ✅ Application accessible via public IP/domain
- [ ] ✅ All features working correctly
- [ ] ✅ All services running and stable
- [ ] ✅ Security measures in place
- [ ] ✅ Backups configured and tested
- [ ] ✅ Monitoring in place
- [ ] ✅ Documentation complete
- [ ] ✅ Team trained on maintenance tasks

### Handoff Complete
- [ ] Credentials shared securely with team
- [ ] Documentation shared with team
- [ ] Maintenance procedures explained
- [ ] Emergency contacts established
- [ ] Monitoring access provided

---

## Quick Command Reference

```bash
# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# View logs
pm2 logs renuga-crm-api
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u postgresql -f

# Restart services
pm2 restart renuga-crm-api
sudo systemctl restart nginx
sudo systemctl restart postgresql

# Update application
cd /var/www/renuga-crm
/usr/local/bin/update-renuga-crm.sh

# Backup database
/usr/local/bin/backup-renuga-db.sh

# System health
df -h          # Disk space
free -h        # Memory
top            # CPU
pm2 monit      # App monitoring
```

---

**Deployment Status**: ⬜ Not Started | 🟡 In Progress | ✅ Complete | ❌ Failed

**Completion Date**: _______________

**Deployed By**: _______________

**Notes**: 
_____________________________________________
_____________________________________________
_____________________________________________
