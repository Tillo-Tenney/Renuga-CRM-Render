# Quick Start Guide - AWS EC2 Deployment

This is a condensed guide for quickly deploying Renuga CRM on AWS EC2 Ubuntu.

## Prerequisites

- AWS EC2 instance (Ubuntu 22.04 or 24.04)
- SSH access to the instance
- Security group allowing ports 22, 80, 443

## One-Line Setup (Automated)

The fastest way to deploy:

```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@<EC2_PUBLIC_IP>

# Clone and run automated setup
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render
chmod +x ec2-setup.sh
sudo ./ec2-setup.sh
```

The script will:
- ✓ Install all dependencies (Node.js, PostgreSQL, Nginx, PM2)
- ✓ Setup and configure database
- ✓ Build frontend and backend
- ✓ Configure Nginx reverse proxy
- ✓ Start all services

**Time**: ~10-15 minutes

## Manual Setup (Step-by-Step)

For more control, use the interactive helper:

```bash
# Clone repository
git clone https://github.com/Tillo-Tenney/Renuga-CRM-Render.git
cd Renuga-CRM-Render

# Run interactive helper
chmod +x ec2-manual-helper.sh
./ec2-manual-helper.sh
```

Follow the menu to:
1. Install dependencies (requires sudo)
2. Setup database (requires sudo)
3. Generate and configure environment files
4. Build application
5. Setup PM2 and Nginx

## After Deployment

1. **Access Application**: http://YOUR_EC2_IP

2. **Login**: 
   - Email: admin@renuga.com
   - Password: admin123
   - ⚠️ Change this immediately!

3. **Check Status**:
   ```bash
   pm2 status
   sudo systemctl status nginx
   ```

4. **View Logs**:
   ```bash
   pm2 logs renuga-crm-api
   ```

## Setting Up SSL/HTTPS (Production)

```bash
# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Get SSL certificate (replace with your domain)
sudo certbot --nginx -d yourdomain.com

# Update environment files
# Backend: server/.env - change FRONTEND_URL to https://
# Frontend: .env.local - change VITE_API_URL to https://

# Rebuild and restart
npm run build
cd server && npm run build
pm2 restart renuga-crm-api
```

## Common Commands

```bash
# Restart backend
pm2 restart renuga-crm-api

# View logs
pm2 logs renuga-crm-api

# Update application
cd /var/www/renuga-crm
git pull origin main
cd server && npm install && npm run build && cd ..
npm install && npm run build
pm2 restart renuga-crm-api

# Backup database
/usr/local/bin/backup-renuga-db.sh

# Check services
pm2 status
sudo systemctl status nginx
sudo systemctl status postgresql
```

## Troubleshooting

### Backend not starting?
```bash
pm2 logs renuga-crm-api --lines 100
# Check database connection in server/.env
```

### Frontend not loading?
```bash
sudo nginx -t
sudo systemctl restart nginx
# Check if dist/ folder exists
```

### Database connection error?
```bash
# Test connection
psql -U renuga_user -h localhost renuga_crm
# Check DATABASE_URL in server/.env
```

## Need Help?

- **Full Guide**: See [AWS_EC2_DEPLOYMENT.md](./AWS_EC2_DEPLOYMENT.md)
- **General Info**: See [README.md](./README.md)
- **API Details**: See [server/README.md](./server/README.md)

## EC2 Instance Recommendations

| Environment | Instance Type | Storage | Monthly Cost* |
|-------------|--------------|---------|---------------|
| Development | t2.micro     | 20 GB   | ~$10          |
| Testing     | t3.small     | 30 GB   | ~$20          |
| Production  | t3.medium    | 50 GB   | ~$40          |

*Approximate costs (may vary by region)

## Security Checklist

- [ ] Change default admin password
- [ ] Use strong database password
- [ ] Enable HTTPS/SSL for production
- [ ] Configure security groups properly
- [ ] Enable firewall (UFW)
- [ ] Set up regular backups
- [ ] Keep system updated

---

**Deploy Time**: 10-15 minutes with automated setup ⚡
**Questions?** Check the full documentation or create an issue.
