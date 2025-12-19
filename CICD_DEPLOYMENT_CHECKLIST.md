# CI/CD Deployment Checklist

Use this checklist to ensure successful deployment setup and ongoing operations.

## Initial Setup Checklist

### AWS EC2 Setup
- [ ] EC2 instance launched (Ubuntu 22.04/24.04 LTS)
- [ ] Security group configured (ports 22, 80, 443)
- [ ] Elastic IP assigned (recommended for production)
- [ ] SSH key pair created and downloaded
- [ ] Successfully connected to EC2 via SSH

### Application Installation on EC2
- [ ] Node.js 20.x installed
- [ ] PostgreSQL installed and running
- [ ] Nginx installed and running
- [ ] PM2 installed globally
- [ ] Application directory created (`/var/www/renuga-crm`)
- [ ] Repository cloned to application directory
- [ ] Database created and configured
- [ ] Database migrations completed
- [ ] Database seeded with initial data
- [ ] Backend `.env` file configured
- [ ] Backend built and running on port 3001
- [ ] Frontend built and deployed
- [ ] Nginx configured as reverse proxy
- [ ] PM2 configured to start on boot
- [ ] Application accessible via browser

### GitHub Repository Configuration
- [ ] Deploy SSH key generated
- [ ] Public key added to EC2 `authorized_keys`
- [ ] Private key tested from local machine
- [ ] GitHub Secret: `EC2_SSH_PRIVATE_KEY` added
- [ ] GitHub Secret: `EC2_HOST` added
- [ ] GitHub Secret: `EC2_USER` added
- [ ] GitHub Secret: `VITE_API_URL` added
- [ ] Workflow file present: `.github/workflows/deploy-ec2.yml`
- [ ] Actions enabled in repository settings

### GitHub Environments (Optional but Recommended)
- [ ] Staging environment created
- [ ] Production environment created
- [ ] Protection rules configured for production
- [ ] Required reviewers assigned
- [ ] Environment-specific secrets configured

## Pre-Deployment Checklist

Before each deployment:

### Code Review
- [ ] Code reviewed and approved
- [ ] All tests passing locally
- [ ] Linting issues resolved
- [ ] No sensitive data in code
- [ ] Dependencies updated and secure
- [ ] Database migration scripts tested

### Environment Verification
- [ ] EC2 instance running and accessible
- [ ] Disk space sufficient (>10% free)
- [ ] Memory usage acceptable (<80%)
- [ ] Database backup completed
- [ ] Previous backups verified
- [ ] GitHub Secrets are current

### Communication
- [ ] Team notified of deployment window
- [ ] Stakeholders informed (for production)
- [ ] Rollback plan documented
- [ ] On-call engineer identified

## Deployment Process Checklist

### Automated Deployment
- [ ] Push to appropriate branch (main/production)
- [ ] Workflow triggered automatically
- [ ] Build jobs completed successfully
- [ ] Artifacts uploaded successfully
- [ ] Deploy job started
- [ ] Backup created on EC2
- [ ] New code deployed
- [ ] Dependencies installed
- [ ] Database migrations run
- [ ] Services restarted
- [ ] Health checks passed
- [ ] Deployment verification completed

### Manual Verification (Post-Deployment)
- [ ] Application loads in browser
- [ ] Login functionality works
- [ ] Key features tested
- [ ] API endpoints responding
- [ ] Database queries working
- [ ] No error logs appearing
- [ ] Performance acceptable
- [ ] Mobile responsive (if applicable)

## Post-Deployment Checklist

### Immediate (0-15 minutes after deployment)
- [ ] Application accessible
- [ ] No critical errors in logs
- [ ] PM2 process running
- [ ] Nginx serving requests
- [ ] Database connections working
- [ ] Memory usage normal
- [ ] CPU usage normal

### Short-term (15-60 minutes after deployment)
- [ ] Monitor error rates
- [ ] Check user feedback
- [ ] Review application logs
- [ ] Monitor system resources
- [ ] Verify automated backups working
- [ ] Document any issues

### Long-term (24 hours after deployment)
- [ ] Analyze performance metrics
- [ ] Review error logs for patterns
- [ ] Gather user feedback
- [ ] Update documentation if needed
- [ ] Plan improvements for next deployment

## Rollback Checklist

If deployment fails or issues arise:

### Immediate Actions
- [ ] Stop current deployment (if in progress)
- [ ] Notify team of issue
- [ ] Document error symptoms
- [ ] Check rollback backup exists
- [ ] Initiate rollback procedure

### Rollback Execution
- [ ] Trigger rollback workflow (manual dispatch)
  OR
- [ ] SSH to EC2
- [ ] Navigate to backup directory
- [ ] Identify latest working backup
- [ ] Extract backup files
- [ ] Restart services
- [ ] Verify rollback successful

### Post-Rollback
- [ ] Application functioning normally
- [ ] Users notified (if affected)
- [ ] Root cause analysis started
- [ ] Fix planned and documented
- [ ] Rollback documented in logs

## Security Checklist

### Ongoing Security
- [ ] SSH keys rotated (every 90 days)
- [ ] GitHub Secrets reviewed
- [ ] EC2 security group rules reviewed
- [ ] UFW firewall enabled and configured
- [ ] Fail2ban installed and active
- [ ] SSL/HTTPS certificate valid
- [ ] Database passwords strong
- [ ] Application secrets rotated
- [ ] Dependency vulnerabilities scanned
- [ ] Access logs reviewed

### Compliance
- [ ] Backups encrypted
- [ ] Data retention policy followed
- [ ] Access audit logs maintained
- [ ] Security patches applied
- [ ] Compliance requirements met

## Maintenance Checklist

### Weekly
- [ ] Review deployment logs
- [ ] Check disk space
- [ ] Monitor error rates
- [ ] Review security alerts
- [ ] Verify backup integrity

### Monthly
- [ ] Update system packages
- [ ] Review and update dependencies
- [ ] Analyze performance trends
- [ ] Review and optimize database
- [ ] Update documentation
- [ ] Test rollback procedure
- [ ] Review access controls

### Quarterly
- [ ] Major dependency updates
- [ ] Security audit
- [ ] Disaster recovery test
- [ ] Capacity planning review
- [ ] Cost optimization review
- [ ] Team training update

### Annually
- [ ] Infrastructure review
- [ ] Architecture review
- [ ] Security penetration test
- [ ] Compliance audit
- [ ] Documentation overhaul

## Troubleshooting Checklist

When issues occur:

### Diagnosis
- [ ] Check workflow logs in GitHub Actions
- [ ] SSH to EC2 instance
- [ ] Check PM2 process status
- [ ] Review application logs
- [ ] Check Nginx error logs
- [ ] Verify database connection
- [ ] Check disk space
- [ ] Check memory usage
- [ ] Review recent changes

### Common Commands
```bash
# Service status
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql

# Logs
pm2 logs renuga-crm-api --lines 50
sudo tail -f /var/log/nginx/error.log
sudo journalctl -u renuga-crm-api -n 50

# Resources
df -h
free -h
top

# Network
curl http://localhost:3001/health
netstat -tlnp | grep :3001
```

### Resolution
- [ ] Issue identified
- [ ] Fix applied
- [ ] Services restarted
- [ ] Verification completed
- [ ] Documentation updated
- [ ] Team notified

## Emergency Contacts

Update with your team information:

| Role | Name | Contact | Availability |
|------|------|---------|--------------|
| DevOps Lead | [Name] | [Email/Phone] | [Hours] |
| Backend Lead | [Name] | [Email/Phone] | [Hours] |
| Frontend Lead | [Name] | [Email/Phone] | [Hours] |
| On-Call Engineer | [Name] | [Email/Phone] | 24/7 |

## Documentation Links

Quick access to key documentation:

- [ ] [GitHub Actions CI/CD Guide](./GITHUB_ACTIONS_CICD_GUIDE.md)
- [ ] [CI/CD Quick Start](./CICD_QUICKSTART.md)
- [ ] [AWS EC2 Deployment Guide](./AWS_EC2_DEPLOYMENT.md)
- [ ] [EC2 Quick Start](./QUICKSTART_EC2.md)
- [ ] [Main README](./README.md)

## Notes

Use this space to document deployment-specific notes:

```
Date: _______________
Deployment: _________
Notes:




Issues encountered:




Lessons learned:




Action items:




```

---

**Remember:**
- ✅ Always test on staging first
- ✅ Keep backups of last 5 deployments
- ✅ Monitor for at least 24 hours after deployment
- ✅ Document all issues and resolutions
- ✅ Communicate with team throughout process

**Last Updated:** December 2024
