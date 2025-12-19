#!/bin/bash

###############################################################################
# Renuga CRM - AWS EC2 Ubuntu Automated Setup Script
# This script automates the deployment of Renuga CRM on Ubuntu EC2 instances
###############################################################################

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Configuration variables
APP_DIR="/var/www/renuga-crm"
DB_NAME="renuga_crm"
DB_USER="renuga_user"
NODE_VERSION="20"

# Functions
print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

check_root() {
    if [ "$EUID" -ne 0 ]; then
        print_error "This script must be run as root or with sudo"
        exit 1
    fi
}

get_public_ip() {
    # Try multiple methods to get public IP
    PUBLIC_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null)

    # If empty, try ifconfig.me
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP=$(curl -s ifconfig.me 2>/dev/null)
    fi

    # If everything fails, set a safe placeholder
    if [ -z "$PUBLIC_IP" ]; then
        PUBLIC_IP="_"
    fi
    
    echo "$PUBLIC_IP"
}

# Main installation steps

install_dependencies() {
    print_header "Step 1: Installing System Dependencies"
    
    print_info "Updating package lists..."
    apt update -qq
    print_success "Package lists updated"
    
    print_info "Upgrading existing packages..."
    apt upgrade -y -qq
    print_success "System packages upgraded"
    
    print_info "Installing Node.js ${NODE_VERSION}.x..."
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | bash -
    apt install -y nodejs
    print_success "Node.js $(node --version) installed"
    print_success "npm $(npm --version) installed"
    
    print_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    print_success "PostgreSQL installed"
    
    print_info "Installing Nginx..."
    apt install -y nginx
    print_success "Nginx installed"
    
    print_info "Installing build essentials..."
    apt install -y build-essential git curl
    print_success "Build tools installed"
    
    print_info "Installing PM2 globally..."
    npm install -g pm2
    print_success "PM2 installed"
}

setup_database() {
    print_header "Step 2: Setting Up PostgreSQL Database"
    
    # Generate a random password for database
    DB_PASSWORD=$(openssl rand -base64 16 | tr -d "=+/" | cut -c1-20)
    
    print_info "Creating database and user..."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASSWORD}';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"
    
    print_success "Database '${DB_NAME}' created"
    print_success "User '${DB_USER}' created"
    
    # Save database credentials
    echo "$DB_PASSWORD" > /tmp/db_password.txt
    chmod 600 /tmp/db_password.txt
    
    print_info "Ensuring PostgreSQL is enabled and started..."
    systemctl enable postgresql
    systemctl start postgresql
    print_success "PostgreSQL service configured"
}

setup_application() {
    print_header "Step 3: Setting Up Application"
    
    # Get current directory (where script is run from)
    SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
    
    print_info "Application directory: ${APP_DIR}"
    
    # If we're already in the repo, use it; otherwise clone
    if [ -f "$SCRIPT_DIR/package.json" ] && [ -d "$SCRIPT_DIR/server" ]; then
        print_info "Using existing repository at $SCRIPT_DIR"
        if [ "$SCRIPT_DIR" != "$APP_DIR" ]; then
            mkdir -p "$APP_DIR"
            cp -r "$SCRIPT_DIR"/* "$APP_DIR"/
            cp -r "$SCRIPT_DIR"/.git* "$APP_DIR"/ 2>/dev/null || true
        fi
    else
        print_error "Repository not found. Please run this script from the repository root."
        exit 1
    fi
    
    cd "$APP_DIR"
    print_success "Application files ready"
}

configure_backend() {
    print_header "Step 4: Configuring Backend"
    
    cd "$APP_DIR/server"
    
    # Read database password
    DB_PASSWORD=$(cat /tmp/db_password.txt)
    
    # Generate JWT secret
    JWT_SECRET=$(openssl rand -hex 32)
    
    # Get public IP
    PUBLIC_IP=$(get_public_ip)
    
    print_info "Creating backend environment configuration..."
    cat > .env << EOF
# Server Configuration
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@localhost:5432/${DB_NAME}

# JWT Configuration
JWT_SECRET=${JWT_SECRET}
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://${PUBLIC_IP}
EOF
    
    chmod 600 .env
    print_success "Backend .env created"
    
    print_info "Installing backend dependencies..."
    npm install --production=false
    print_success "Backend dependencies installed"
    
    print_info "Building backend..."
    npm run build
    print_success "Backend built successfully"
    
    print_info "Running database migrations..."
    npm run db:migrate
    print_success "Database migrations completed"
    
    print_info "Seeding initial data..."
    npm run db:seed
    print_success "Database seeded with initial data"
}

configure_frontend() {
    print_header "Step 5: Configuring Frontend"
    
    cd "$APP_DIR"
    
    # Get public IP
    PUBLIC_IP=$(get_public_ip)
    
    print_info "Creating frontend environment configuration..."
    cat > .env.local << EOF
# API Configuration
VITE_API_URL=http://${PUBLIC_IP}
EOF
    
    chmod 600 .env.local
    print_success "Frontend .env.local created"
    
    print_info "Installing frontend dependencies..."
    npm install
    print_success "Frontend dependencies installed"
    
    print_info "Building frontend..."
    npm run build
    print_success "Frontend built successfully"
}

setup_pm2() {
    print_header "Step 6: Setting Up PM2 Process Manager"
    
    cd "$APP_DIR"
    
    print_info "Creating PM2 ecosystem configuration..."
    cat > ecosystem.config.cjs << 'EOF'
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
    },
    error_file: '/var/log/pm2/renuga-crm-api-error.log',
    out_file: '/var/log/pm2/renuga-crm-api-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
EOF
    
    print_success "PM2 ecosystem file created"
    
    # Create log directory
    mkdir -p /var/log/pm2
    
    print_info "Starting backend with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    print_success "Backend started with PM2"
    
    print_info "Configuring PM2 to start on boot..."
    env PATH=$PATH:/usr/bin pm2 startup systemd -u root --hp /root
    print_success "PM2 startup configured"
}

setup_nginx() {
    print_header "Step 7: Configuring Nginx Reverse Proxy"
    
    PUBLIC_IP=$(get_public_ip)
    
    print_info "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/renuga-crm << EOF
server {
    listen 80;
    server_name ${PUBLIC_IP};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Frontend - Serve static files
    location / {
        root /var/www/renuga-crm/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    # Backend API - Reverse proxy
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        
        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Health check endpoint
    location /health {
        proxy_pass http://localhost:3001/health;
        proxy_http_version 1.1;
        proxy_set_header Host \$host;
        access_log off;
    }

    # Static assets caching
    location ~* \.(jpg|jpeg|png|gif|ico|css|js|svg|woff|woff2|ttf|eot)$ {
        root /var/www/renuga-crm/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
    
    print_success "Nginx configuration created"
    
    print_info "Enabling site configuration..."
    ln -sf /etc/nginx/sites-available/renuga-crm /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    print_success "Site enabled"
    
    print_info "Testing Nginx configuration..."
    nginx -t
    print_success "Nginx configuration is valid"
    
    print_info "Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    print_success "Nginx restarted and enabled"
}

setup_firewall() {
    print_header "Step 8: Configuring Firewall (UFW)"
    
    print_info "Installing and configuring UFW..."
    apt install -y ufw
    
    # Allow SSH, HTTP, and HTTPS
    ufw allow OpenSSH
    ufw allow 'Nginx Full'
    
    print_warning "Enabling firewall..."
    echo "y" | ufw enable
    
    print_success "Firewall configured and enabled"
    print_info "Firewall status:"
    ufw status
}

create_maintenance_scripts() {
    print_header "Step 9: Creating Maintenance Scripts"
    
    print_info "Creating database backup script..."
    DB_PASSWORD=$(cat /tmp/db_password.txt)
    cat > /usr/local/bin/backup-renuga-db.sh << EOF
#!/bin/bash
BACKUP_DIR="/var/backups/renuga-crm"
mkdir -p "\$BACKUP_DIR"
TIMESTAMP=\$(date +%Y%m%d_%H%M%S)
PGPASSWORD="${DB_PASSWORD}" pg_dump -U ${DB_USER} -h localhost ${DB_NAME} > "\$BACKUP_DIR/renuga_crm_\$TIMESTAMP.sql"
# Keep only last 7 days of backups
find "\$BACKUP_DIR" -name "renuga_crm_*.sql" -mtime +7 -delete
echo "Database backup completed: renuga_crm_\$TIMESTAMP.sql"
EOF
    
    chmod +x /usr/local/bin/backup-renuga-db.sh
    print_success "Backup script created at /usr/local/bin/backup-renuga-db.sh"
    
    print_info "Creating update script..."
    cat > /usr/local/bin/update-renuga-crm.sh << 'EOF'
#!/bin/bash
cd /var/www/renuga-crm

echo "Pulling latest changes..."
git pull origin main

echo "Updating backend..."
cd server
npm install
npm run build
npm run db:migrate
cd ..

echo "Updating frontend..."
npm install
npm run build

echo "Restarting backend..."
pm2 restart renuga-crm-api

echo "Reloading Nginx..."
systemctl reload nginx

echo "Update completed successfully!"
pm2 status
EOF
    
    chmod +x /usr/local/bin/update-renuga-crm.sh
    print_success "Update script created at /usr/local/bin/update-renuga-crm.sh"
    
    print_info "Setting up daily database backup cron job..."
    (crontab -l 2>/dev/null | grep -v backup-renuga-db; echo "0 2 * * * /usr/local/bin/backup-renuga-db.sh >> /var/log/renuga-backup.log 2>&1") | crontab -
    print_success "Daily backup scheduled at 2:00 AM"
}

verify_installation() {
    print_header "Step 10: Verifying Installation"
    
    print_info "Checking PostgreSQL..."
    if systemctl is-active --quiet postgresql; then
        print_success "PostgreSQL is running"
    else
        print_error "PostgreSQL is not running"
    fi
    
    print_info "Checking Nginx..."
    if systemctl is-active --quiet nginx; then
        print_success "Nginx is running"
    else
        print_error "Nginx is not running"
    fi
    
    print_info "Checking PM2 backend..."
    if pm2 list | grep -q "renuga-crm-api"; then
        print_success "Backend is running"
    else
        print_error "Backend is not running"
    fi
    
    print_info "Testing backend health endpoint..."
    sleep 3  # Give backend time to start
    if curl -sf http://localhost:3001/health > /dev/null; then
        print_success "Backend health check passed"
    else
        print_warning "Backend health check failed (may need a moment to start)"
    fi
    
    print_info "Testing frontend..."
    if curl -sf http://localhost > /dev/null; then
        print_success "Frontend is accessible"
    else
        print_warning "Frontend may not be accessible yet"
    fi
}

print_completion_info() {
    print_header "Installation Complete!"
    
    PUBLIC_IP=$(get_public_ip)
    DB_PASSWORD=$(cat /tmp/db_password.txt)
    
    echo -e "${GREEN}╔════════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║           Renuga CRM Deployment Completed Successfully!            ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo -e "${BLUE}📍 Application URL:${NC}"
    echo -e "   http://${PUBLIC_IP}"
    echo ""
    echo -e "${BLUE}🔐 Default Login Credentials:${NC}"
    echo -e "   Email:    ${GREEN}admin@renuga.com${NC}"
    echo -e "   Password: ${GREEN}admin123${NC}"
    echo -e "   ${RED}⚠ IMPORTANT: Change this password immediately after first login!${NC}"
    echo ""
    echo -e "${BLUE}🗄️  Database Credentials:${NC}"
    echo -e "   Database: ${DB_NAME}"
    echo -e "   User:     ${DB_USER}"
    echo -e "   Password: ${DB_PASSWORD}"
    echo -e "   ${YELLOW}(Saved in /root/renuga-db-credentials.txt)${NC}"
    echo ""
    echo -e "${BLUE}🛠️  Useful Commands:${NC}"
    echo -e "   View backend logs:    ${GREEN}pm2 logs renuga-crm-api${NC}"
    echo -e "   View backend status:  ${GREEN}pm2 status${NC}"
    echo -e "   Restart backend:      ${GREEN}pm2 restart renuga-crm-api${NC}"
    echo -e "   Backup database:      ${GREEN}/usr/local/bin/backup-renuga-db.sh${NC}"
    echo -e "   Update application:   ${GREEN}/usr/local/bin/update-renuga-crm.sh${NC}"
    echo -e "   View nginx logs:      ${GREEN}tail -f /var/log/nginx/error.log${NC}"
    echo ""
    echo -e "${BLUE}📚 Documentation:${NC}"
    echo -e "   Full guide: /var/www/renuga-crm/AWS_EC2_DEPLOYMENT.md"
    echo ""
    echo -e "${BLUE}🔒 Security Reminders:${NC}"
    echo -e "   • Change default admin password"
    echo -e "   • Update security group rules as needed"
    echo -e "   • Consider setting up SSL/HTTPS for production"
    echo -e "   • Regular backups are scheduled daily at 2:00 AM"
    echo ""
    
    # Save credentials to file
    cat > /root/renuga-db-credentials.txt << EOF
Renuga CRM Database Credentials
================================
Database: ${DB_NAME}
User: ${DB_USER}
Password: ${DB_PASSWORD}

Application URL: http://${PUBLIC_IP}

Default Login:
Email: admin@renuga.com
Password: admin123

Generated on: $(date)
EOF
    chmod 600 /root/renuga-db-credentials.txt
    
    # Clean up temporary password file
    rm -f /tmp/db_password.txt
    
    echo -e "${YELLOW}Installation logs available in this terminal output.${NC}"
    echo -e "${GREEN}Enjoy using Renuga CRM! 🎉${NC}\n"
}

# Main execution
main() {
    print_header "Renuga CRM - AWS EC2 Ubuntu Automated Setup"
    print_info "Starting deployment process..."
    
    check_root
    install_dependencies
    setup_database
    setup_application
    configure_backend
    configure_frontend
    setup_pm2
    setup_nginx
    setup_firewall
    create_maintenance_scripts
    verify_installation
    print_completion_info
}

# Run main function
main "$@"
