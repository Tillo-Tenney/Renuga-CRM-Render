#!/bin/bash

###############################################################################
# Renuga CRM - Manual Deployment Helper Script
# This script provides helper functions for manual deployment steps
###############################################################################

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

# Get public IP
get_ip() {
    PUBLIC_IP=$(curl -s http://169.254.169.254/latest/meta-data/public-ipv4 2>/dev/null || \
                curl -s http://checkip.amazonaws.com 2>/dev/null || \
                curl -s https://api.ipify.org 2>/dev/null || \
                hostname -I | awk '{print $1}')
    echo "$PUBLIC_IP"
}

# Generate JWT secret
generate_jwt_secret() {
    openssl rand -hex 32
}

# Generate database password
generate_db_password() {
    openssl rand -base64 16 | tr -d "=+/" | cut -c1-20
}

# Show menu
show_menu() {
    print_header "Renuga CRM - Manual Deployment Helper"
    echo "1. Get Server Public IP"
    echo "2. Generate JWT Secret"
    echo "3. Generate Database Password"
    echo "4. Show Backend .env Template"
    echo "5. Show Frontend .env Template"
    echo "6. Create Backend .env File"
    echo "7. Create Frontend .env File"
    echo "8. Install System Dependencies"
    echo "9. Setup PostgreSQL Database"
    echo "10. Build Backend"
    echo "11. Build Frontend"
    echo "12. Setup PM2"
    echo "13. Setup Nginx"
    echo "14. Show Service Status"
    echo "15. View Logs"
    echo "0. Exit"
    echo ""
    read -p "Select an option: " choice
    echo ""
}

# Option 1: Get IP
option_get_ip() {
    print_header "Server Public IP"
    IP=$(get_ip)
    print_success "Your server IP: $IP"
    echo "Use this in FRONTEND_URL and VITE_API_URL"
}

# Option 2: Generate JWT
option_generate_jwt() {
    print_header "Generate JWT Secret"
    JWT=$(generate_jwt_secret)
    print_success "Generated JWT Secret:"
    echo "$JWT"
    echo ""
    print_info "Use this in your backend .env file"
}

# Option 3: Generate DB Password
option_generate_db_password() {
    print_header "Generate Database Password"
    PASS=$(generate_db_password)
    print_success "Generated Password:"
    echo "$PASS"
    echo ""
    print_info "Use this when creating PostgreSQL user"
}

# Option 4: Show backend .env template
option_show_backend_env() {
    print_header "Backend .env Template"
    IP=$(get_ip)
    JWT=$(generate_jwt_secret)
    echo "PORT=3001"
    echo "NODE_ENV=production"
    echo ""
    echo "# Database Configuration"
    echo "DATABASE_URL=postgresql://renuga_user:YOUR_PASSWORD@localhost:5432/renuga_crm"
    echo ""
    echo "# JWT Configuration"
    echo "JWT_SECRET=$JWT"
    echo "JWT_EXPIRES_IN=7d"
    echo ""
    echo "# CORS Configuration"
    echo "FRONTEND_URL=http://$IP"
    echo ""
    print_info "Replace YOUR_PASSWORD with your actual database password"
}

# Option 5: Show frontend .env template
option_show_frontend_env() {
    print_header "Frontend .env Template"
    IP=$(get_ip)
    echo "VITE_API_URL=http://$IP"
    echo ""
    print_info "For HTTPS, use https:// instead of http://"
}

# Option 6: Create backend .env
option_create_backend_env() {
    print_header "Create Backend .env File"
    
    if [ ! -d "server" ]; then
        print_error "server directory not found. Run from repository root."
        return
    fi
    
    IP=$(get_ip)
    JWT=$(generate_jwt_secret)
    
    read -p "Database password: " DB_PASS
    
    cat > server/.env << EOF
PORT=3001
NODE_ENV=production

# Database Configuration
DATABASE_URL=postgresql://renuga_user:${DB_PASS}@localhost:5432/renuga_crm

# JWT Configuration
JWT_SECRET=${JWT}
JWT_EXPIRES_IN=7d

# CORS Configuration
FRONTEND_URL=http://${IP}
EOF
    
    chmod 600 server/.env
    print_success "Backend .env created at server/.env"
}

# Option 7: Create frontend .env
option_create_frontend_env() {
    print_header "Create Frontend .env File"
    
    IP=$(get_ip)
    
    cat > .env.local << EOF
# API Configuration
VITE_API_URL=http://${IP}
EOF
    
    chmod 600 .env.local
    print_success "Frontend .env.local created"
}

# Option 8: Install dependencies
option_install_deps() {
    print_header "Installing System Dependencies"
    
    if [ "$EUID" -ne 0 ]; then
        print_error "This option requires root. Use: sudo $0"
        return
    fi
    
    print_info "Updating package lists..."
    apt update -qq
    
    print_info "Installing Node.js 20.x..."
    curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
    apt install -y nodejs
    
    print_info "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    
    print_info "Installing Nginx..."
    apt install -y nginx
    
    print_info "Installing PM2..."
    npm install -g pm2
    
    print_info "Installing other tools..."
    apt install -y build-essential git curl
    
    print_success "All dependencies installed"
}

# Option 9: Setup database
option_setup_database() {
    print_header "Setup PostgreSQL Database"
    
    if [ "$EUID" -ne 0 ]; then
        print_error "This option requires root. Use: sudo $0"
        return
    fi
    
    read -p "Database name [renuga_crm]: " DB_NAME
    DB_NAME=${DB_NAME:-renuga_crm}
    
    read -p "Database user [renuga_user]: " DB_USER
    DB_USER=${DB_USER:-renuga_user}
    
    read -p "Database password: " DB_PASS
    
    print_info "Creating database..."
    sudo -u postgres psql -c "CREATE DATABASE ${DB_NAME};" 2>/dev/null || true
    sudo -u postgres psql -c "CREATE USER ${DB_USER} WITH ENCRYPTED PASSWORD '${DB_PASS}';" 2>/dev/null || true
    sudo -u postgres psql -c "GRANT ALL PRIVILEGES ON DATABASE ${DB_NAME} TO ${DB_USER};"
    sudo -u postgres psql -c "ALTER DATABASE ${DB_NAME} OWNER TO ${DB_USER};"
    
    print_success "Database setup complete"
    echo "Database: ${DB_NAME}"
    echo "User: ${DB_USER}"
}

# Option 10: Build backend
option_build_backend() {
    print_header "Building Backend"
    
    if [ ! -d "server" ]; then
        print_error "server directory not found"
        return
    fi
    
    cd server
    
    print_info "Installing dependencies..."
    npm install
    
    print_info "Building..."
    npm run build
    
    print_info "Running migrations..."
    npm run db:migrate
    
    print_info "Seeding database..."
    npm run db:seed
    
    cd ..
    print_success "Backend built successfully"
}

# Option 11: Build frontend
option_build_frontend() {
    print_header "Building Frontend"
    
    print_info "Installing dependencies..."
    npm install
    
    print_info "Building..."
    npm run build
    
    print_success "Frontend built successfully"
    print_info "Output directory: dist/"
}

# Option 12: Setup PM2
option_setup_pm2() {
    print_header "Setup PM2"
    
    print_info "Creating PM2 configuration..."
    cat > ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'renuga-crm-api',
    cwd: './server',
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
    
    print_info "Starting backend with PM2..."
    pm2 start ecosystem.config.cjs
    pm2 save
    
    print_info "Setting up PM2 startup..."
    pm2 startup
    
    print_success "PM2 configured. Follow the command above if shown."
}

# Option 13: Setup Nginx
option_setup_nginx() {
    print_header "Setup Nginx"
    
    if [ "$EUID" -ne 0 ]; then
        print_error "This option requires root. Use: sudo $0"
        return
    fi
    
    IP=$(get_ip)
    
    print_info "Creating Nginx configuration..."
    cat > /etc/nginx/sites-available/renuga-crm << EOF
server {
    listen 80;
    server_name ${IP};

    location / {
        root $(pwd)/dist;
        index index.html;
        try_files \$uri \$uri/ /index.html;
    }

    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_cache_bypass \$http_upgrade;
    }

    location /health {
        proxy_pass http://localhost:3001/health;
    }
}
EOF
    
    ln -sf /etc/nginx/sites-available/renuga-crm /etc/nginx/sites-enabled/
    rm -f /etc/nginx/sites-enabled/default
    
    print_info "Testing configuration..."
    nginx -t
    
    print_info "Restarting Nginx..."
    systemctl restart nginx
    systemctl enable nginx
    
    print_success "Nginx configured"
}

# Option 14: Show status
option_show_status() {
    print_header "Service Status"
    
    echo -e "${BLUE}PM2 Status:${NC}"
    pm2 status
    
    echo -e "\n${BLUE}Nginx Status:${NC}"
    systemctl status nginx --no-pager
    
    echo -e "\n${BLUE}PostgreSQL Status:${NC}"
    systemctl status postgresql --no-pager
    
    echo -e "\n${BLUE}Application URL:${NC}"
    IP=$(get_ip)
    echo "http://$IP"
}

# Option 15: View logs
option_view_logs() {
    print_header "View Logs"
    echo "1. Backend PM2 logs"
    echo "2. Nginx error logs"
    echo "3. Nginx access logs"
    echo "4. PostgreSQL logs"
    echo "0. Back"
    echo ""
    read -p "Select log to view: " log_choice
    
    case $log_choice in
        1) pm2 logs renuga-crm-api --lines 50 ;;
        2) tail -n 50 /var/log/nginx/error.log ;;
        3) tail -n 50 /var/log/nginx/access.log ;;
        4) journalctl -u postgresql -n 50 ;;
        0) return ;;
        *) print_error "Invalid option" ;;
    esac
}

# Main loop
main() {
    while true; do
        show_menu
        case $choice in
            1) option_get_ip ;;
            2) option_generate_jwt ;;
            3) option_generate_db_password ;;
            4) option_show_backend_env ;;
            5) option_show_frontend_env ;;
            6) option_create_backend_env ;;
            7) option_create_frontend_env ;;
            8) option_install_deps ;;
            9) option_setup_database ;;
            10) option_build_backend ;;
            11) option_build_frontend ;;
            12) option_setup_pm2 ;;
            13) option_setup_nginx ;;
            14) option_show_status ;;
            15) option_view_logs ;;
            0) print_success "Goodbye!"; exit 0 ;;
            *) print_error "Invalid option" ;;
        esac
        
        echo ""
        read -p "Press Enter to continue..."
    done
}

# Run main
main
