#!/bin/bash

# Together App - Ubuntu Server Installation Script
# This script installs the Together relationship app on a fresh Ubuntu server
# Supports both local and remote PostgreSQL installations

set -e  # Exit on any error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}"
}

error() {
    echo -e "${RED}[ERROR] $1${NC}" >&2
}

warn() {
    echo -e "${YELLOW}[WARNING] $1${NC}"
}

info() {
    echo -e "${BLUE}[INFO] $1${NC}"
}

# Configuration variables
APP_NAME="together"
APP_USER="together"
APP_DIR="/opt/together"
NODE_VERSION="20"
POSTGRES_VERSION="15"

# Check if running as root
if [[ $EUID -eq 0 ]]; then
    error "This script should not be run as root. Please run as a regular user with sudo privileges."
    exit 1
fi

# Check Ubuntu version
if ! grep -q "Ubuntu" /etc/os-release; then
    error "This script is designed for Ubuntu servers only."
    exit 1
fi

UBUNTU_VERSION=$(lsb_release -rs)
log "Detected Ubuntu version: $UBUNTU_VERSION"

# Function to prompt user for input
prompt_user() {
    local prompt="$1"
    local var_name="$2"
    local default="$3"
    
    if [ -n "$default" ]; then
        read -p "$prompt [$default]: " input
        if [ -z "$input" ]; then
            eval "$var_name='$default'"
        else
            eval "$var_name='$input'"
        fi
    else
        read -p "$prompt: " input
        eval "$var_name='$input'"
    fi
}

# Function to generate random password
generate_password() {
    openssl rand -base64 32 | tr -d "=+/" | cut -c1-25
}

banner() {
    echo -e "${BLUE}"
    echo "╔══════════════════════════════════════════════════════════════════╗"
    echo "║                        Together App                              ║"
    echo "║                   Ubuntu Server Installer                       ║"
    echo "║                                                                  ║"
    echo "║  A relationship appreciation app that helps couples track        ║"
    echo "║  and appreciate each other's daily contributions                 ║"
    echo "╚══════════════════════════════════════════════════════════════════╝"
    echo -e "${NC}"
    echo
}

# PostgreSQL configuration function
configure_postgres() {
    echo
    log "PostgreSQL Configuration"
    echo "Choose PostgreSQL installation type:"
    echo "1) Local PostgreSQL (install on this server)"
    echo "2) Remote PostgreSQL (connect to external database)"
    echo
    
    while true; do
        read -p "Enter choice (1 or 2): " postgres_choice
        case $postgres_choice in
            1)
                POSTGRES_TYPE="local"
                break
                ;;
            2)
                POSTGRES_TYPE="remote"
                break
                ;;
            *)
                error "Invalid choice. Please enter 1 or 2."
                ;;
        esac
    done
    
    if [ "$POSTGRES_TYPE" = "local" ]; then
        configure_local_postgres
    else
        configure_remote_postgres
    fi
}

configure_local_postgres() {
    log "Configuring local PostgreSQL installation..."
    
    DB_NAME="together_db"
    DB_USER="together_user"
    DB_PASSWORD=$(generate_password)
    DB_HOST="localhost"
    DB_PORT="5432"
    
    prompt_user "Database name" DB_NAME "$DB_NAME"
    prompt_user "Database username" DB_USER "$DB_USER"
    
    echo
    info "Generated database password: $DB_PASSWORD"
    warn "Please save this password - it will be needed for the application configuration"
    echo
    read -p "Press Enter to continue or Ctrl+C to abort..."
}

configure_remote_postgres() {
    log "Configuring remote PostgreSQL connection..."
    
    prompt_user "Database host" DB_HOST
    prompt_user "Database port" DB_PORT "5432"
    prompt_user "Database name" DB_NAME
    prompt_user "Database username" DB_USER
    prompt_user "Database password" DB_PASSWORD
    
    # Test connection
    info "Testing database connection..."
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        error "Failed to connect to remote database. Please check your credentials."
        exit 1
    fi
    log "Database connection successful!"
}

# System update and basic packages
install_system_packages() {
    log "Updating system packages..."
    sudo apt-get update -y
    sudo apt-get upgrade -y
    
    log "Installing essential packages..."
    sudo apt-get install -y \
        curl \
        wget \
        git \
        unzip \
        software-properties-common \
        apt-transport-https \
        ca-certificates \
        gnupg \
        lsb-release \
        build-essential \
        openssl \
        ufw \
        fail2ban \
        logrotate \
        htop \
        nano \
        vim
}

# Install Node.js
install_nodejs() {
    log "Installing Node.js $NODE_VERSION..."
    
    # Remove any existing Node.js installations
    sudo apt-get remove -y nodejs npm
    
    # Install Node.js using NodeSource repository
    curl -fsSL https://deb.nodesource.com/setup_${NODE_VERSION}.x | sudo -E bash -
    sudo apt-get install -y nodejs
    
    # Verify installation
    NODE_INSTALLED_VERSION=$(node --version)
    NPM_INSTALLED_VERSION=$(npm --version)
    
    log "Node.js installed: $NODE_INSTALLED_VERSION"
    log "npm installed: $NPM_INSTALLED_VERSION"
    
    # Install PM2 globally
    log "Installing PM2 process manager..."
    sudo npm install -g pm2
    pm2 startup | sudo bash || true
}

# Install PostgreSQL locally
install_local_postgres() {
    log "Installing PostgreSQL $POSTGRES_VERSION locally..."
    
    # Install PostgreSQL
    sudo apt-get install -y postgresql-$POSTGRES_VERSION postgresql-client-$POSTGRES_VERSION postgresql-contrib-$POSTGRES_VERSION
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database user and database
    log "Creating database user and database..."
    sudo -u postgres createuser "$DB_USER"
    sudo -u postgres createdb "$DB_NAME" -O "$DB_USER"
    sudo -u postgres psql -c "ALTER USER $DB_USER WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    
    # Configure PostgreSQL for local connections
    POSTGRES_CONFIG="/etc/postgresql/$POSTGRES_VERSION/main"
    sudo cp "$POSTGRES_CONFIG/pg_hba.conf" "$POSTGRES_CONFIG/pg_hba.conf.backup"
    
    # Allow local connections
    echo "local   $DB_NAME    $DB_USER                                md5" | sudo tee -a "$POSTGRES_CONFIG/pg_hba.conf"
    
    # Restart PostgreSQL
    sudo systemctl restart postgresql
    
    log "PostgreSQL installation completed successfully!"
}

# Create application user
create_app_user() {
    log "Creating application user: $APP_USER"
    
    if ! id "$APP_USER" &>/dev/null; then
        sudo adduser --system --group --home "$APP_DIR" --shell /bin/bash "$APP_USER"
        sudo mkdir -p "$APP_DIR"
        sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    else
        info "User $APP_USER already exists"
    fi
}

# Download and setup application
setup_application() {
    log "Setting up Together application..."
    
    # Get application source
    echo "How would you like to deploy the application?"
    echo "1) Download from Git repository"
    echo "2) Upload application files manually"
    
    while true; do
        read -p "Enter choice (1 or 2): " deploy_choice
        case $deploy_choice in
            1)
                setup_from_git
                break
                ;;
            2)
                setup_manual_upload
                break
                ;;
            *)
                error "Invalid choice. Please enter 1 or 2."
                ;;
        esac
    done
    
    # Install application dependencies
    log "Installing application dependencies..."
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm ci --production"
    
    # Build application
    log "Building application..."
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run build"
}

setup_from_git() {
    prompt_user "Git repository URL" REPO_URL
    prompt_user "Git branch" GIT_BRANCH "main"
    
    # Clone repository
    log "Cloning repository from $REPO_URL..."
    sudo -u "$APP_USER" git clone --branch "$GIT_BRANCH" "$REPO_URL" "$APP_DIR"
}

setup_manual_upload() {
    info "Please upload your application files to $APP_DIR"
    info "You can use scp, rsync, or any other method to transfer files"
    info "Make sure the files are owned by the $APP_USER user"
    echo
    info "Example using scp:"
    info "scp -r ./together-app/* user@server:$APP_DIR/"
    info "sudo chown -R $APP_USER:$APP_USER $APP_DIR"
    echo
    read -p "Press Enter when you have uploaded the application files..."
    
    # Verify files exist
    if [ ! -f "$APP_DIR/package.json" ]; then
        error "package.json not found in $APP_DIR. Please ensure application files are uploaded correctly."
        exit 1
    fi
}

# Configure environment
configure_environment() {
    log "Configuring application environment..."
    
    # Generate session secret
    SESSION_SECRET=$(generate_password)
    
    # Get OpenAI API key
    echo
    info "The Together app uses OpenAI for AI-powered features."
    prompt_user "OpenAI API Key (get from https://platform.openai.com/api-keys)" OPENAI_API_KEY
    
    # Create environment file
    cat > /tmp/together.env << EOF
# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
PGHOST=${DB_HOST}
PGPORT=${DB_PORT}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASSWORD}
PGDATABASE=${DB_NAME}

# Application Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=${SESSION_SECRET}

# OpenAI Configuration
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF
    
    # Move environment file and set permissions
    sudo mv /tmp/together.env "$APP_DIR/.env"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    sudo chmod 600 "$APP_DIR/.env"
    
    log "Environment configuration completed"
}

# Setup database
setup_database() {
    log "Setting up application database..."
    
    # Run database migrations
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run db:push"
    
    log "Database setup completed"
}

# Configure PM2
configure_pm2() {
    log "Configuring PM2 process manager..."
    
    # Create PM2 ecosystem file
    cat > /tmp/ecosystem.config.js << 'EOF'
module.exports = {
  apps: [{
    name: 'together',
    script: 'npm',
    args: 'start',
    cwd: '/opt/together',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    log_date_format: 'YYYY-MM-DD HH:mm Z',
    error_file: '/var/log/together/error.log',
    out_file: '/var/log/together/access.log',
    log_file: '/var/log/together/combined.log'
  }]
};
EOF
    
    # Move PM2 config and set permissions
    sudo mv /tmp/ecosystem.config.js "$APP_DIR/"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.js"
    
    # Create log directory
    sudo mkdir -p /var/log/together
    sudo chown "$APP_USER:$APP_USER" /var/log/together
    
    # Configure log rotation
    cat > /tmp/together-logrotate << 'EOF'
/var/log/together/*.log {
    daily
    missingok
    rotate 30
    compress
    delaycompress
    notifempty
    create 644 together together
    postrotate
        pm2 reloadLogs
    endscript
}
EOF
    
    sudo mv /tmp/together-logrotate /etc/logrotate.d/together
}

# Setup firewall
configure_firewall() {
    log "Configuring firewall..."
    
    # Reset UFW to defaults
    sudo ufw --force reset
    
    # Default policies
    sudo ufw default deny incoming
    sudo ufw default allow outgoing
    
    # Allow SSH
    sudo ufw allow ssh
    
    # Allow HTTP and HTTPS
    sudo ufw allow 80/tcp
    sudo ufw allow 443/tcp
    
    # Allow application port
    sudo ufw allow 3000/tcp
    
    # Enable firewall
    sudo ufw --force enable
    
    log "Firewall configured successfully"
}

# Setup reverse proxy (Nginx)
setup_nginx() {
    log "Setting up Nginx reverse proxy..."
    
    # Install Nginx
    sudo apt-get install -y nginx
    
    # Remove default site
    sudo rm -f /etc/nginx/sites-enabled/default
    
    # Get domain name
    echo
    prompt_user "Domain name for the application (e.g., together.example.com)" DOMAIN_NAME
    
    # Create Nginx configuration
    cat > /tmp/together-nginx << EOF
server {
    listen 80;
    server_name ${DOMAIN_NAME};

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied expired no-cache no-store private must-revalidate auth;
    gzip_types text/plain text/css text/xml text/javascript application/x-javascript application/xml+rss;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 300s;
        proxy_connect_timeout 75s;
    }

    # Static files caching
    location ~* \.(css|js|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        proxy_pass http://127.0.0.1:3000;
        proxy_set_header Host \$host;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check endpoint
    location /health {
        proxy_pass http://127.0.0.1:3000/health;
        access_log off;
    }
}
EOF
    
    # Install Nginx config
    sudo mv /tmp/together-nginx "/etc/nginx/sites-available/together"
    sudo ln -sf "/etc/nginx/sites-available/together" "/etc/nginx/sites-enabled/together"
    
    # Test Nginx configuration
    if sudo nginx -t; then
        sudo systemctl restart nginx
        sudo systemctl enable nginx
        log "Nginx configured successfully"
    else
        error "Nginx configuration test failed"
        exit 1
    fi
}

# Start application
start_application() {
    log "Starting Together application..."
    
    # Start application with PM2
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.js"
    sudo -u "$APP_USER" pm2 save
    sudo pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR"
    
    # Wait for application to start
    sleep 5
    
    # Check if application is running
    if sudo -u "$APP_USER" pm2 list | grep -q "together.*online"; then
        log "Application started successfully!"
    else
        error "Application failed to start. Check logs with: pm2 logs together"
        exit 1
    fi
}

# SSL certificate setup
setup_ssl() {
    echo
    info "Would you like to set up SSL certificate with Let's Encrypt? (recommended for production)"
    read -p "Setup SSL? (y/N): " setup_ssl_choice
    
    if [[ $setup_ssl_choice =~ ^[Yy]$ ]]; then
        log "Setting up SSL certificate..."
        
        # Install Certbot
        sudo apt-get install -y certbot python3-certbot-nginx
        
        # Obtain certificate
        sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "admin@${DOMAIN_NAME}"
        
        # Setup auto-renewal
        sudo systemctl enable certbot.timer
        
        log "SSL certificate configured successfully!"
        info "Certificate will auto-renew via systemd timer"
    fi
}

# Display final information
show_completion_info() {
    echo
    echo -e "${GREEN}╔══════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║                    Installation Completed!                      ║${NC}"
    echo -e "${GREEN}╚══════════════════════════════════════════════════════════════════╝${NC}"
    echo
    
    info "Application Details:"
    echo "  • Application Directory: $APP_DIR"
    echo "  • Application User: $APP_USER"
    echo "  • Database: $DB_HOST:$DB_PORT/$DB_NAME"
    echo "  • Process Manager: PM2"
    echo "  • Web Server: Nginx"
    
    if [ -n "$DOMAIN_NAME" ]; then
        echo "  • Domain: $DOMAIN_NAME"
        if [[ $setup_ssl_choice =~ ^[Yy]$ ]]; then
            echo "  • URL: https://$DOMAIN_NAME"
        else
            echo "  • URL: http://$DOMAIN_NAME"
        fi
    else
        echo "  • URL: http://$(curl -s ifconfig.me):3000"
    fi
    
    echo
    info "Useful Commands:"
    echo "  • View application logs: sudo -u $APP_USER pm2 logs together"
    echo "  • Restart application: sudo -u $APP_USER pm2 restart together"
    echo "  • Check application status: sudo -u $APP_USER pm2 status"
    echo "  • Update application: cd $APP_DIR && git pull && npm ci && npm run build && pm2 restart together"
    
    echo
    info "Default Admin Account:"
    echo "  • Email: admin@example.com"
    echo "  • Password: admin123"
    echo "  • Please change this password after first login!"
    
    echo
    warn "Important Security Notes:"
    echo "  • Change the default admin password immediately"
    echo "  • Regularly update system packages: sudo apt update && sudo apt upgrade"
    echo "  • Monitor application logs for any security issues"
    echo "  • Consider setting up automated backups for your database"
    
    echo
    log "Together app installation completed successfully!"
    info "You can now access your relationship app and start tracking activities together!"
}

# Main installation flow
main() {
    banner
    
    # Configuration phase
    log "Starting Together app installation..."
    configure_postgres
    
    # System setup
    install_system_packages
    install_nodejs
    
    if [ "$POSTGRES_TYPE" = "local" ]; then
        install_local_postgres
    fi
    
    # Application setup
    create_app_user
    setup_application
    configure_environment
    setup_database
    
    # Service configuration
    configure_pm2
    configure_firewall
    setup_nginx
    
    # Start services
    start_application
    
    # Optional SSL
    setup_ssl
    
    # Completion
    show_completion_info
}

# Trap errors and cleanup
trap 'error "Installation failed. Check the logs above for details."' ERR

# Run main installation
main "$@"