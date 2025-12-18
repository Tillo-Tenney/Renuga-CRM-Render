# Nginx Configuration Files for Renuga CRM

This directory contains Nginx configuration templates for deploying Renuga CRM.

## Files

- **renuga-crm.conf**: Basic HTTP configuration (for development/testing)
- **renuga-crm-ssl.conf**: HTTPS configuration with SSL (for production)

## Installation

### For HTTP Only (Development/Testing)

```bash
# Copy configuration
sudo cp nginx/renuga-crm.conf /etc/nginx/sites-available/renuga-crm

# Edit configuration
sudo nano /etc/nginx/sites-available/renuga-crm
# Replace YOUR_DOMAIN_OR_IP with your EC2 IP or domain

# Enable site
sudo ln -s /etc/nginx/sites-available/renuga-crm /etc/nginx/sites-enabled/

# Remove default site
sudo rm -f /etc/nginx/sites-enabled/default

# Test configuration
sudo nginx -t

# Restart Nginx
sudo systemctl restart nginx
```

### For HTTPS (Production)

```bash
# First, set up HTTP configuration as above

# Install Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com

# Certbot will automatically update your Nginx configuration
# Or manually use the SSL configuration:
sudo cp nginx/renuga-crm-ssl.conf /etc/nginx/sites-available/renuga-crm

# Edit and replace YOUR_DOMAIN with your actual domain
sudo nano /etc/nginx/sites-available/renuga-crm

# Test and restart
sudo nginx -t
sudo systemctl restart nginx

# Test auto-renewal
sudo certbot renew --dry-run
```

## Configuration Details

### HTTP Configuration
- Serves frontend static files from `/var/www/renuga-crm/dist`
- Proxies API requests to backend on port 3001
- Includes security headers
- Enables gzip compression
- Caches static assets (images, CSS, JS, fonts)

### HTTPS Configuration
- Same as HTTP but with SSL/TLS
- Redirects all HTTP to HTTPS
- Includes additional security headers (HSTS)
- Uses Let's Encrypt SSL certificates
- HTTP/2 support enabled

## Testing

```bash
# Test Nginx configuration
sudo nginx -t

# Check if Nginx is running
sudo systemctl status nginx

# View error logs
sudo tail -f /var/log/nginx/error.log

# View access logs
sudo tail -f /var/log/nginx/access.log

# Test frontend
curl http://localhost

# Test backend API
curl http://localhost/api/health

# Test from outside (replace with your IP/domain)
curl http://YOUR_EC2_IP
```

## Troubleshooting

### Permission Denied
```bash
# Ensure www-data can read files
sudo chown -R www-data:www-data /var/www/renuga-crm/dist
sudo chmod -R 755 /var/www/renuga-crm/dist
```

### 502 Bad Gateway
```bash
# Check if backend is running
pm2 status
# or
sudo systemctl status renuga-crm-api

# Check backend logs
pm2 logs renuga-crm-api
```

### SSL Certificate Issues
```bash
# Renew certificate
sudo certbot renew

# Check certificate status
sudo certbot certificates
```

## Security Recommendations

1. Always use HTTPS in production
2. Keep Nginx updated: `sudo apt update && sudo apt upgrade nginx`
3. Configure rate limiting if needed
4. Use strong SSL/TLS settings
5. Enable fail2ban to protect against brute force attacks
6. Regular security audits

## Performance Tuning

For high-traffic sites, consider:
- Increasing worker processes in `/etc/nginx/nginx.conf`
- Adjusting buffer sizes
- Enabling caching with proxy_cache
- Using HTTP/2 and HTTP/3
- CDN for static assets

## Additional Resources

- [Nginx Documentation](https://nginx.org/en/docs/)
- [Let's Encrypt Documentation](https://letsencrypt.org/docs/)
- [SSL Configuration Generator](https://ssl-config.mozilla.org/)
