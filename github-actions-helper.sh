#!/usr/bin/env bash

###############################################################################
# GitHub Actions Deployment Helper Script
# This script helps set up GitHub Actions secrets and verify deployment readiness
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

# Main menu
show_menu() {
    clear
    echo -e "${BLUE}╔════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${BLUE}║     GitHub Actions CI/CD Deployment Helper                ║${NC}"
    echo -e "${BLUE}║     Renuga CRM - AWS EC2 Deployment                       ║${NC}"
    echo -e "${BLUE}╚════════════════════════════════════════════════════════════╝${NC}"
    echo ""
    echo "1. Generate SSH Deploy Key"
    echo "2. Display Public Key (for EC2)"
    echo "3. Display Private Key (for GitHub Secret)"
    echo "4. Get EC2 Public IP"
    echo "5. Test SSH Connection to EC2"
    echo "6. Verify GitHub Secrets Configuration"
    echo "7. Test API Health Endpoint"
    echo "8. Generate JWT Secret"
    echo "9. Show All Required Secrets Summary"
    echo "10. Verify EC2 Services Status"
    echo "0. Exit"
    echo ""
    echo -n "Select option: "
}

# Generate SSH Deploy Key
generate_ssh_key() {
    print_header "Generate SSH Deploy Key"
    
    KEY_PATH="$HOME/.ssh/github_deploy_key"
    
    if [ -f "$KEY_PATH" ]; then
        print_warning "Deploy key already exists at $KEY_PATH"
        echo -n "Overwrite? (y/N): "
        read -r response
        if [[ ! "$response" =~ ^[Yy]$ ]]; then
            print_info "Keeping existing key"
            return
        fi
    fi
    
    print_info "Generating ed25519 SSH key..."
    ssh-keygen -t ed25519 -C "github-actions-deploy" -f "$KEY_PATH" -N ""
    
    print_success "SSH key pair generated successfully!"
    print_info "Private key: $KEY_PATH"
    print_info "Public key: ${KEY_PATH}.pub"
    
    echo ""
    echo "Next steps:"
    echo "1. Add public key to EC2 (Option 2)"
    echo "2. Add private key to GitHub Secrets (Option 3)"
}

# Display Public Key
display_public_key() {
    print_header "Display Public Key (for EC2)"
    
    KEY_PATH="$HOME/.ssh/github_deploy_key.pub"
    
    if [ ! -f "$KEY_PATH" ]; then
        print_error "Public key not found at $KEY_PATH"
        print_info "Generate key first (Option 1)"
        return
    fi
    
    print_info "Public key content:"
    echo ""
    cat "$KEY_PATH"
    echo ""
    
    print_info "To add this key to EC2:"
    echo "1. SSH to your EC2 instance"
    echo "2. Run: echo \"<paste-public-key-here>\" >> ~/.ssh/authorized_keys"
    echo "3. Run: chmod 600 ~/.ssh/authorized_keys"
    echo ""
    echo "Or copy the key above and use ssh-copy-id:"
    echo "   ssh-copy-id -i ${KEY_PATH} ubuntu@YOUR_EC2_IP"
    
    echo ""
    echo -n "Copy public key to clipboard? (requires xclip or pbcopy) (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v xclip &> /dev/null; then
            cat "$KEY_PATH" | xclip -selection clipboard
            print_success "Public key copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            cat "$KEY_PATH" | pbcopy
            print_success "Public key copied to clipboard!"
        else
            print_warning "xclip or pbcopy not found. Please copy manually."
        fi
    fi
}

# Display Private Key
display_private_key() {
    print_header "Display Private Key (for GitHub Secret)"
    
    KEY_PATH="$HOME/.ssh/github_deploy_key"
    
    if [ ! -f "$KEY_PATH" ]; then
        print_error "Private key not found at $KEY_PATH"
        print_info "Generate key first (Option 1)"
        return
    fi
    
    print_info "Private key content (EC2_SSH_PRIVATE_KEY):"
    echo ""
    cat "$KEY_PATH"
    echo ""
    
    print_warning "IMPORTANT: Keep this key secure!"
    print_info "To add to GitHub:"
    echo "1. Go to: Repository → Settings → Secrets and variables → Actions"
    echo "2. Click: New repository secret"
    echo "3. Name: EC2_SSH_PRIVATE_KEY"
    echo "4. Value: Copy the ENTIRE output above (including BEGIN/END lines)"
    
    echo ""
    echo -n "Copy private key to clipboard? (requires xclip or pbcopy) (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v xclip &> /dev/null; then
            cat "$KEY_PATH" | xclip -selection clipboard
            print_success "Private key copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            cat "$KEY_PATH" | pbcopy
            print_success "Private key copied to clipboard!"
        else
            print_warning "xclip or pbcopy not found. Please copy manually."
        fi
    fi
}

# Get EC2 Public IP
get_ec2_ip() {
    print_header "Get EC2 Public IP"
    
    print_info "Attempting to detect public IP..."
    
    IP=$(curl -s ifconfig.me 2>/dev/null || curl -s http://checkip.amazonaws.com 2>/dev/null || echo "")
    
    if [ -n "$IP" ]; then
        print_success "Your public IP: $IP"
        print_info "Use this for GitHub Secret: EC2_HOST"
        
        echo ""
        echo -n "Copy IP to clipboard? (requires xclip or pbcopy) (y/N): "
        read -r response
        if [[ "$response" =~ ^[Yy]$ ]]; then
            if command -v xclip &> /dev/null; then
                echo -n "$IP" | xclip -selection clipboard
                print_success "IP copied to clipboard!"
            elif command -v pbcopy &> /dev/null; then
                echo -n "$IP" | pbcopy
                print_success "IP copied to clipboard!"
            else
                print_warning "xclip or pbcopy not found. Please copy manually."
            fi
        fi
    else
        print_error "Could not detect public IP"
        print_info "If running on EC2, try: curl http://169.254.169.254/latest/meta-data/public-ipv4"
    fi
}

# Test SSH Connection
test_ssh_connection() {
    print_header "Test SSH Connection to EC2"
    
    echo -n "Enter EC2 Host (IP or domain): "
    read -r EC2_HOST
    
    echo -n "Enter EC2 User [ubuntu]: "
    read -r EC2_USER
    EC2_USER=${EC2_USER:-ubuntu}
    
    KEY_PATH="$HOME/.ssh/github_deploy_key"
    
    if [ ! -f "$KEY_PATH" ]; then
        print_error "Private key not found at $KEY_PATH"
        print_info "Generate key first (Option 1)"
        return
    fi
    
    print_info "Testing SSH connection..."
    print_info "Command: ssh -i $KEY_PATH -o ConnectTimeout=10 $EC2_USER@$EC2_HOST 'echo Connection successful!'"
    
    if ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" 'echo "Connection successful!"' 2>/dev/null; then
        print_success "SSH connection successful!"
        print_success "GitHub Actions will be able to connect to your EC2 instance"
    else
        print_error "SSH connection failed!"
        echo ""
        print_info "Troubleshooting steps:"
        echo "1. Verify public key is in ~/.ssh/authorized_keys on EC2"
        echo "2. Check EC2 security group allows SSH from your IP"
        echo "3. Verify EC2 instance is running"
        echo "4. Test manually: ssh -i $KEY_PATH $EC2_USER@$EC2_HOST"
    fi
}

# Verify GitHub Secrets Configuration
verify_github_secrets() {
    print_header "Verify GitHub Secrets Configuration"
    
    print_info "This will help you verify all required secrets are ready"
    echo ""
    
    # Check SSH Key
    KEY_PATH="$HOME/.ssh/github_deploy_key"
    if [ -f "$KEY_PATH" ]; then
        print_success "EC2_SSH_PRIVATE_KEY: Key file exists locally"
    else
        print_error "EC2_SSH_PRIVATE_KEY: Key file not found"
        print_info "Generate key using Option 1"
    fi
    
    # Check EC2 Host
    echo ""
    echo -n "Have you configured EC2_HOST in GitHub Secrets? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_success "EC2_HOST: Configured"
    else
        print_warning "EC2_HOST: Not configured - Use Option 4 to get your IP"
    fi
    
    # Check EC2 User
    echo -n "Have you configured EC2_USER in GitHub Secrets? (usually 'ubuntu') (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_success "EC2_USER: Configured"
    else
        print_warning "EC2_USER: Not configured - Set to 'ubuntu' for Ubuntu AMI"
    fi
    
    # Check VITE_API_URL
    echo -n "Have you configured VITE_API_URL in GitHub Secrets? (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        print_success "VITE_API_URL: Configured"
    else
        print_warning "VITE_API_URL: Not configured"
        print_info "Format: http://YOUR_EC2_IP:3001"
    fi
    
    echo ""
    print_info "All secrets should be added at:"
    echo "GitHub Repository → Settings → Secrets and variables → Actions"
}

# Test API Health Endpoint
test_api_health() {
    print_header "Test API Health Endpoint"
    
    echo -n "Enter API URL (e.g., http://YOUR_IP:3001): "
    read -r API_URL
    
    HEALTH_URL="${API_URL}/health"
    
    print_info "Testing: $HEALTH_URL"
    
    HTTP_CODE=$(curl -s -o /tmp/health_response.txt -w "%{http_code}" "$HEALTH_URL" 2>/dev/null)
    
    if [ "$HTTP_CODE" = "200" ]; then
        print_success "API health check passed! (HTTP $HTTP_CODE)"
        print_info "Response:"
        cat /tmp/health_response.txt
        echo ""
    else
        print_error "API health check failed! (HTTP $HTTP_CODE)"
        print_info "Response:"
        cat /tmp/health_response.txt 2>/dev/null || echo "No response"
        echo ""
        print_info "Troubleshooting:"
        echo "1. Verify backend is running (pm2 status)"
        echo "2. Check port 3001 is listening (netstat -tlnp | grep 3001)"
        echo "3. Verify firewall allows traffic"
    fi
    
    rm -f /tmp/health_response.txt
}

# Generate JWT Secret
generate_jwt_secret() {
    print_header "Generate JWT Secret"
    
    JWT_SECRET=$(openssl rand -base64 32)
    
    print_info "Generated JWT Secret:"
    echo ""
    echo "$JWT_SECRET"
    echo ""
    
    print_info "Add this to your server/.env file:"
    echo "JWT_SECRET=$JWT_SECRET"
    
    echo ""
    echo -n "Copy JWT secret to clipboard? (requires xclip or pbcopy) (y/N): "
    read -r response
    if [[ "$response" =~ ^[Yy]$ ]]; then
        if command -v xclip &> /dev/null; then
            echo -n "$JWT_SECRET" | xclip -selection clipboard
            print_success "JWT secret copied to clipboard!"
        elif command -v pbcopy &> /dev/null; then
            echo -n "$JWT_SECRET" | pbcopy
            print_success "JWT secret copied to clipboard!"
        else
            print_warning "xclip or pbcopy not found. Please copy manually."
        fi
    fi
}

# Show All Required Secrets Summary
show_secrets_summary() {
    print_header "GitHub Secrets Configuration Summary"
    
    echo "Required GitHub Secrets:"
    echo ""
    
    echo "1. EC2_SSH_PRIVATE_KEY"
    echo "   Description: Private SSH key for GitHub Actions"
    echo "   How to get: Use Option 1 to generate, Option 3 to display"
    echo "   Format: Full private key including BEGIN/END lines"
    echo ""
    
    echo "2. EC2_HOST"
    echo "   Description: EC2 public IP or domain"
    echo "   How to get: Use Option 4 or check AWS Console"
    echo "   Example: 54.123.45.67 or crm.example.com"
    echo ""
    
    echo "3. EC2_USER"
    echo "   Description: SSH username"
    echo "   Value: ubuntu (for Ubuntu AMI)"
    echo "   Example: ubuntu"
    echo ""
    
    echo "4. VITE_API_URL"
    echo "   Description: Backend API URL for frontend"
    echo "   Format: http://YOUR_EC2_IP:3001"
    echo "   Example: http://54.123.45.67:3001"
    echo ""
    
    print_info "To add secrets:"
    echo "GitHub Repository → Settings → Secrets and variables → Actions → New repository secret"
}

# Verify EC2 Services Status
verify_ec2_services() {
    print_header "Verify EC2 Services Status"
    
    echo -n "Enter EC2 Host: "
    read -r EC2_HOST
    
    echo -n "Enter EC2 User [ubuntu]: "
    read -r EC2_USER
    EC2_USER=${EC2_USER:-ubuntu}
    
    KEY_PATH="$HOME/.ssh/github_deploy_key"
    
    if [ ! -f "$KEY_PATH" ]; then
        echo -n "Enter path to SSH key: "
        read -r KEY_PATH
    fi
    
    print_info "Checking services on EC2..."
    
    ssh -i "$KEY_PATH" -o ConnectTimeout=10 -o StrictHostKeyChecking=no "$EC2_USER@$EC2_HOST" << 'ENDSSH'
echo "=== PM2 Status ==="
pm2 status 2>/dev/null || echo "PM2 not found or not running"

echo -e "\n=== Nginx Status ==="
sudo systemctl is-active nginx 2>/dev/null || echo "Nginx not running"

echo -e "\n=== PostgreSQL Status ==="
sudo systemctl is-active postgresql 2>/dev/null || echo "PostgreSQL not running"

echo -e "\n=== Disk Space ==="
df -h / | tail -1 | awk '{print "Used: " $3 " / " $2 " (" $5 ")"}'

echo -e "\n=== Memory Usage ==="
free -h | grep Mem | awk '{print "Used: " $3 " / " $2}'

echo -e "\n=== Application Directory ==="
ls -la /var/www/renuga-crm 2>/dev/null || echo "Application directory not found"
ENDSSH
}

# Main loop
while true; do
    show_menu
    read -r choice
    
    case $choice in
        1) generate_ssh_key ;;
        2) display_public_key ;;
        3) display_private_key ;;
        4) get_ec2_ip ;;
        5) test_ssh_connection ;;
        6) verify_github_secrets ;;
        7) test_api_health ;;
        8) generate_jwt_secret ;;
        9) show_secrets_summary ;;
        10) verify_ec2_services ;;
        0) 
            print_info "Exiting..."
            exit 0
            ;;
        *)
            print_error "Invalid option"
            ;;
    esac
    
    echo ""
    echo -n "Press Enter to continue..."
    read -r
done
