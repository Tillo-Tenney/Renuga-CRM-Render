# GitHub Actions Secrets Configuration

This document provides a template and guide for configuring GitHub Actions secrets required for CI/CD deployment to AWS EC2.

## Required Secrets

### 1. EC2_SSH_PRIVATE_KEY

**Description:** Private SSH key for authenticating GitHub Actions to your EC2 instance.

**How to generate:**
```bash
# Generate new SSH key pair (recommended: ed25519)
ssh-keygen -t ed25519 -C "github-actions-deploy" -f ~/.ssh/github_deploy_key -N ""

# Display private key (copy entire output)
cat ~/.ssh/github_deploy_key
```

**Value format:**
```
-----BEGIN OPENSSH PRIVATE KEY-----
AAAAA...example-key-content-line-1...AAAAA
BBBBB...example-key-content-line-2...BBBBB
CCCCC...example-key-content-line-3...CCCCC
[... many more lines of base64-encoded key data ...]
ZZZZZ...example-key-content-last-line...ZZZZZ
-----END OPENSSH PRIVATE KEY-----
```
**Note**: This is a placeholder format. Your actual key will have multiple lines of base64-encoded data.

**Important:**
- Include the full key including `-----BEGIN` and `-----END` lines
- Do not add quotes or extra whitespace
- Keep this secret secure - anyone with this key can access your EC2 instance
- Rotate this key every 90 days for security

**Adding to EC2:**
```bash
# On EC2 instance, add public key
cat ~/.ssh/github_deploy_key.pub >> ~/.ssh/authorized_keys
chmod 600 ~/.ssh/authorized_keys
chmod 700 ~/.ssh
```

**Testing:**
```bash
# Test SSH connection from local machine
ssh -i ~/.ssh/github_deploy_key ubuntu@<EC2_PUBLIC_IP>

# If successful, the key is configured correctly
```

---

### 2. EC2_HOST

**Description:** Public IP address or domain name of your EC2 instance.

**How to find:**

**Option 1: AWS Console**
1. Go to EC2 Dashboard
2. Select your instance
3. Copy "Public IPv4 address" from instance details

**Option 2: On EC2 instance**
```bash
# SSH to EC2
ssh -i your-key.pem ubuntu@<EC2_IP>

# Get public IP
curl -s ifconfig.me
# or
curl -s http://checkip.amazonaws.com
```

**Option 3: AWS CLI**
```bash
aws ec2 describe-instances \
  --instance-ids i-1234567890abcdef0 \
  --query 'Reservations[0].Instances[0].PublicIpAddress' \
  --output text
```

**Value format:**
```
54.123.45.67
```
or if using domain:
```
crm.example.com
```

**Important:**
- Use Elastic IP for production to prevent IP changes
- If using domain, ensure DNS is properly configured
- Verify IP is accessible from internet

---

### 3. EC2_USER

**Description:** SSH username for connecting to EC2 instance.

**Default values by AMI:**
- Ubuntu: `ubuntu`
- Amazon Linux: `ec2-user`
- RHEL: `ec2-user` or `root`
- Debian: `admin`

**How to verify:**
```bash
# Check current user on EC2
whoami

# Check home directory
echo $HOME
```

**Value format:**
```
ubuntu
```

**Important:**
- Do not use root user for security reasons
- Ensure user has sudo privileges
- User must have access to application directory

---

### 4. VITE_API_URL

**Description:** Full URL of backend API for frontend build configuration.

**Purpose:**
- Frontend needs to know where to send API requests
- This is baked into the frontend build
- Different for staging vs production

**Value format:**

**For HTTP (development/staging):**
```
http://54.123.45.67:3001
```

**For HTTPS (production with domain):**
```
https://api.example.com
```

**For HTTPS (production with IP):**
```
https://54.123.45.67:3001
```

**Important:**
- Must include protocol (http:// or https://)
- Must include port if not using 80/443
- Should match actual backend URL
- Different for each environment

**How to verify:**
```bash
# Test API endpoint
curl http://YOUR_EC2_IP:3001/health

# Should return:
# {"status":"healthy","timestamp":"..."}
```

---

## Environment-Specific Secrets

For organizations with multiple environments (staging, production):

### Staging Environment Secrets

| Secret Name | Example Value | Notes |
|-------------|--------------|-------|
| `EC2_SSH_PRIVATE_KEY` | [Staging SSH key] | Separate key for staging |
| `EC2_HOST` | `staging.example.com` | Staging server |
| `EC2_USER` | `ubuntu` | Same user typically |
| `VITE_API_URL` | `http://staging.example.com:3001` | Staging API |

### Production Environment Secrets

| Secret Name | Example Value | Notes |
|-------------|--------------|-------|
| `EC2_SSH_PRIVATE_KEY` | [Production SSH key] | Separate key for production |
| `EC2_HOST` | `production.example.com` | Production server |
| `EC2_USER` | `ubuntu` | Same user typically |
| `VITE_API_URL` | `https://api.example.com` | Production API with SSL |

---

## Adding Secrets to GitHub

### Step-by-Step Process

1. **Navigate to Repository Settings**
   - Go to your GitHub repository
   - Click on `Settings` tab (requires admin access)

2. **Access Secrets Configuration**
   - In left sidebar, expand `Secrets and variables`
   - Click on `Actions`

3. **Add Repository Secret**
   - Click `New repository secret` button
   - Enter secret name (exactly as shown above)
   - Paste secret value
   - Click `Add secret`

4. **Verify Secret Added**
   - Secret should appear in list
   - Value will be hidden (shows as `***`)
   - Note the creation date

### Adding Environment-Specific Secrets

1. **Navigate to Environments**
   - Go to `Settings` → `Environments`
   - Click on environment name (or create new)

2. **Add Environment Secret**
   - Scroll to `Environment secrets`
   - Click `Add secret`
   - Enter name and value
   - Click `Add secret`

3. **Secrets Hierarchy**
   - Environment secrets override repository secrets
   - Use for environment-specific values

---

## Secret Security Best Practices

### General Security

1. **Access Control**
   - Limit repository admin access
   - Only authorized personnel can view/edit secrets
   - Use GitHub Teams for access management

2. **Secret Rotation**
   ```bash
   # Rotate SSH keys every 90 days
   # 1. Generate new key
   ssh-keygen -t ed25519 -C "deploy-$(date +%Y%m)" -f ~/.ssh/deploy_new
   
   # 2. Add new public key to EC2
   cat ~/.ssh/deploy_new.pub >> ~/.ssh/authorized_keys
   
   # 3. Update GitHub Secret with new private key
   cat ~/.ssh/deploy_new
   
   # 4. Test deployment
   # 5. Remove old key from authorized_keys
   ```

3. **Audit Logging**
   - Review secret access in audit logs
   - Monitor for unauthorized access
   - Set up alerts for secret changes

4. **Principle of Least Privilege**
   - Each secret should have minimal permissions
   - Use separate keys for different environments
   - Don't share secrets across projects

### SSH Key Security

1. **Key Generation**
   - Use ed25519 (modern, secure)
   - Use RSA 4096-bit minimum (if ed25519 not supported)
   - Always set a passphrase for local keys
   - Use unique keys per environment

2. **Key Storage**
   - Never commit keys to repository
   - Store securely on local machine
   - Use password manager for backups
   - Delete from local machine after adding to GitHub

3. **Key Monitoring**
   ```bash
   # On EC2, review authorized keys regularly
   cat ~/.ssh/authorized_keys
   
   # Check for unknown keys
   # Each line should be documented
   
   # Review SSH login attempts
   sudo cat /var/log/auth.log | grep "Accepted publickey"
   ```

### EC2 Security

1. **IP Restrictions**
   ```bash
   # Restrict SSH access in security group
   # Only allow from:
   # - GitHub Actions IPs (if static)
   # - Your organization IPs
   # - Bastion host
   ```

2. **Firewall Configuration**
   ```bash
   # On EC2, configure UFW
   sudo ufw allow from <GITHUB_IP> to any port 22
   sudo ufw enable
   ```

3. **Fail2ban Protection**
   ```bash
   # Install and configure fail2ban
   sudo apt install -y fail2ban
   
   # Configure SSH protection
   sudo nano /etc/fail2ban/jail.local
   # [sshd]
   # enabled = true
   # maxretry = 3
   
   sudo systemctl restart fail2ban
   ```

---

## Testing Secrets Configuration

### Test SSH Connection

```bash
# From local machine, test SSH with deploy key
ssh -i ~/.ssh/github_deploy_key ubuntu@<EC2_HOST>

# Should connect without password
# If fails, check:
# - Key permissions (600 for private, 644 for public)
# - authorized_keys on EC2
# - Security group allows SSH from your IP
```

### Test API URL

```bash
# Test API endpoint
curl http://<EC2_HOST>:3001/health

# Expected response:
{
  "status": "healthy",
  "timestamp": "2024-12-19T12:00:00.000Z"
}

# If fails, check:
# - Backend is running (pm2 status)
# - Port 3001 is open
# - Firewall allows traffic
```

### Test Deployment

```bash
# Trigger workflow manually
# Go to Actions → Deploy to AWS EC2 → Run workflow

# Monitor workflow execution
# Check each step completes successfully

# If fails, review:
# - Workflow logs for specific error
# - Secret values are correct
# - EC2 instance is accessible
# - Services are running on EC2
```

---

## Troubleshooting

### Issue: "Permission denied (publickey)"

**Cause:** SSH key not accepted by EC2

**Solutions:**
1. Verify private key in GitHub Secret is complete (including BEGIN/END lines)
2. Verify public key is in `~/.ssh/authorized_keys` on EC2
3. Check permissions on EC2:
   ```bash
   chmod 700 ~/.ssh
   chmod 600 ~/.ssh/authorized_keys
   ```
4. Check SELinux/AppArmor not blocking SSH

### Issue: "Host key verification failed"

**Cause:** EC2 host key not recognized

**Solutions:**
1. Workflow automatically runs `ssh-keyscan`
2. If still fails, verify EC2_HOST is correct
3. Check EC2 instance is running
4. Verify security group allows SSH

### Issue: "curl: (7) Failed to connect"

**Cause:** API URL not accessible

**Solutions:**
1. Verify backend is running: `pm2 status`
2. Check port 3001 is listening: `netstat -tlnp | grep 3001`
3. Verify firewall allows traffic: `sudo ufw status`
4. Check Nginx configuration if using reverse proxy

### Issue: "Invalid or unexpected token"

**Cause:** Malformed secret value

**Solutions:**
1. Check for extra quotes or whitespace
2. Ensure newlines are preserved (for SSH key)
3. Re-copy secret value from source
4. Test secret value locally before adding to GitHub

---

## Secret Management Checklist

- [ ] All required secrets added to GitHub
- [ ] SSH key tested from local machine
- [ ] EC2_HOST resolves and is accessible
- [ ] API URL returns valid health check
- [ ] Environment-specific secrets configured (if applicable)
- [ ] Secrets documented internally
- [ ] Access controls reviewed
- [ ] Rotation schedule established
- [ ] Backup plan for secrets documented
- [ ] Team trained on secret management

---

## Additional Configuration

### Optional Secrets

These secrets are optional but recommended for enhanced functionality:

#### SLACK_WEBHOOK_URL
For deployment notifications to Slack
```
https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXX
```

#### DATADOG_API_KEY
For monitoring and metrics
```
1234567890abcdef1234567890abcdef
```

#### SENTRY_DSN
For error tracking
```
https://abc123@sentry.io/123456
```

#### AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY
For S3 backups or CloudWatch integration
```
AKIAIOSFODNN7EXAMPLE
wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY
```

---

## Maintenance Schedule

### Weekly
- [ ] Review secret access logs
- [ ] Verify all deployments successful

### Monthly
- [ ] Test secret rotation procedure
- [ ] Review and update secret documentation

### Quarterly
- [ ] Rotate all SSH keys
- [ ] Audit secret access controls
- [ ] Review secret usage patterns

### Annually
- [ ] Complete security audit
- [ ] Review and update all secrets
- [ ] Update secret management procedures

---

## Resources

- [GitHub Actions Secrets Documentation](https://docs.github.com/en/actions/security-guides/encrypted-secrets)
- [AWS EC2 Key Pairs Documentation](https://docs.aws.amazon.com/AWSEC2/latest/UserGuide/ec2-key-pairs.html)
- [SSH Key Best Practices](https://infosec.mozilla.org/guidelines/openssh)

---

**Last Updated:** December 2024  
**Version:** 1.0.0  
**Maintained By:** DevOps Team
