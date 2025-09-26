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
POSTGRES_VERSION="" # Will be detected dynamically
USE_DATABASE="false"

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

# Database configuration function
configure_database() {
    echo
    log "Database Configuration"
    echo "Choose database option:"
    echo "1) In-memory storage (default, no database required)"
    echo "2) Local PostgreSQL (install on this server)"
    echo "3) Remote PostgreSQL (connect to external database)"
    echo
    
    while true; do
        read -p "Enter choice (1, 2, or 3) [1]: " db_choice
        case ${db_choice:-1} in
            1)
                DATABASE_TYPE="memory"
                USE_DATABASE="false"
                break
                ;;
            2)
                DATABASE_TYPE="local"
                USE_DATABASE="true"
                break
                ;;
            3)
                DATABASE_TYPE="remote"
                USE_DATABASE="true"
                break
                ;;
            *)
                error "Invalid choice. Please enter 1, 2, or 3."
                ;;
        esac
    done
    
    if [ "$DATABASE_TYPE" = "local" ]; then
        configure_local_postgres
    elif [ "$DATABASE_TYPE" = "remote" ]; then
        configure_remote_postgres
    else
        log "Using in-memory storage (no database setup required)"
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
    warn "A secure database password has been generated and will be saved to the configuration file."
    info "You can view it later in /opt/together/.env if needed."
    echo
    read -p "Press Enter to continue or Ctrl+C to abort..."
}

configure_remote_postgres() {
    log "Configuring remote PostgreSQL connection..."
    
    # Install PostgreSQL client for connection testing
    log "Installing PostgreSQL client..."
    sudo apt-get install -y postgresql-client
    
    echo
    info "Remote PostgreSQL Setup Options:"
    echo "1) Connect to existing database (database already created)"
    echo "2) Create database during installation (requires superuser access)"
    echo
    
    while true; do
        read -p "Choose setup option (1 or 2) [2]: " remote_option
        case ${remote_option:-2} in
            1)
                configure_existing_remote_db
                break
                ;;
            2)
                configure_new_remote_db
                break
                ;;
            *)
                error "Invalid choice. Please enter 1 or 2."
                ;;
        esac
    done
}

configure_existing_remote_db() {
    log "Connecting to existing remote database..."
    
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

configure_new_remote_db() {
    log "Creating new database on remote PostgreSQL server..."
    
    prompt_user "Database host" DB_HOST
    prompt_user "Database port" DB_PORT "5432"
    prompt_user "Superuser username (e.g., postgres)" DB_SUPERUSER "postgres"
    prompt_user "Superuser password" DB_SUPERUSER_PASSWORD
    
    # Test superuser connection
    info "Testing superuser connection..."
    if ! PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -c "SELECT 1;" &>/dev/null; then
        error "Failed to connect with superuser credentials. Please check your credentials."
        exit 1
    fi
    
    # Generate database and user details
    DB_NAME="together_db"
    DB_USER="together_user"
    DB_PASSWORD=$(generate_password)
    
    prompt_user "Database name" DB_NAME "$DB_NAME"
    prompt_user "Application database username" DB_USER "$DB_USER"
    
    info "Generated secure password for application database user"
    
    # Create database and user (idempotent)
    log "Setting up database and user..."
    
    # Escape single quotes in password for SQL
    DB_PASSWORD_ESCAPED=${DB_PASSWORD//\'/\'\'\'}
    
    # Check if user already exists
    USER_EXISTS=$(PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" 2>/dev/null || echo "")
    
    if [ "$USER_EXISTS" = "1" ]; then
        log "User $DB_USER already exists, updating password..."
        PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -c "ALTER USER \"$DB_USER\" WITH ENCRYPTED PASSWORD '$DB_PASSWORD_ESCAPED';" &>/dev/null || true
    else
        log "Creating user $DB_USER..."
        if ! PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -c "CREATE USER \"$DB_USER\" WITH ENCRYPTED PASSWORD '$DB_PASSWORD_ESCAPED';" 2>/dev/null; then
            error "Failed to create user $DB_USER"
            return 1
        fi
    fi
    
    # Check if database already exists
    DB_EXISTS=$(PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" 2>/dev/null || echo "")
    
    if [ "$DB_EXISTS" = "1" ]; then
        log "Database $DB_NAME already exists, updating owner..."
        PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -c "ALTER DATABASE \"$DB_NAME\" OWNER TO \"$DB_USER\";" &>/dev/null || true
    else
        log "Creating database $DB_NAME..."
        if ! PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "postgres" -c "CREATE DATABASE \"$DB_NAME\" OWNER \"$DB_USER\";" 2>/dev/null; then
            error "Failed to create database $DB_NAME"
            return 1
        fi
    fi
    
    # Grant permissions (always run these to ensure proper setup)
    log "Setting up database permissions..."
    PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "GRANT ALL PRIVILEGES ON DATABASE \"$DB_NAME\" TO \"$DB_USER\";" &>/dev/null || true
    PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "GRANT ALL ON SCHEMA public TO \"$DB_USER\";" &>/dev/null || true
    PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON TABLES TO \"$DB_USER\";" &>/dev/null || true
    PGPASSWORD="$DB_SUPERUSER_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_SUPERUSER" -d "$DB_NAME" -c "ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT ALL ON SEQUENCES TO \"$DB_USER\";" &>/dev/null || true
    
    # Test new user connection
    info "Testing application user connection..."
    if ! PGPASSWORD="$DB_PASSWORD" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -c "SELECT 1;" &>/dev/null; then
        error "Failed to connect with new application user. Please check the setup."
        exit 1
    fi
    
    log "Database and user created successfully!"
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
    log "Installing PostgreSQL (latest available version)..."
    
    # Install PostgreSQL meta packages - this automatically installs the default version
    sudo apt-get install -y postgresql postgresql-client postgresql-contrib
    
    # Detect the actual installed version for configuration paths
    POSTGRES_VERSION=$(psql --version 2>/dev/null | grep -o '[0-9]\+' | head -1)
    
    if [ -z "$POSTGRES_VERSION" ]; then
        # Fallback: detect from apt packages
        POSTGRES_VERSION=$(apt-cache show postgresql | awk '/Depends: postgresql-/{match($0,/postgresql-([0-9]+)/,a); print a[1]; exit}' 2>/dev/null)
    fi
    
    if [ -z "$POSTGRES_VERSION" ]; then
        # Last resort: check installed packages
        POSTGRES_VERSION=$(dpkg -l | grep '^ii.*postgresql-[0-9]' | head -1 | grep -o 'postgresql-[0-9]\+' | grep -o '[0-9]\+' || echo "16")
    fi
    
    log "Detected PostgreSQL version: $POSTGRES_VERSION"
    
    # Start and enable PostgreSQL
    sudo systemctl start postgresql
    sudo systemctl enable postgresql
    
    # Create database user and database (idempotent)
    log "Setting up database user and database..."
    
    # Check if user already exists
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_roles WHERE rolname='$DB_USER';" | grep -q 1; then
        log "User $DB_USER already exists, updating password..."
        sudo -u postgres psql -c "ALTER USER \"$DB_USER\" WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    else
        log "Creating user $DB_USER..."
        sudo -u postgres createuser --no-superuser --no-createdb --no-createrole "$DB_USER"
        sudo -u postgres psql -c "ALTER USER \"$DB_USER\" WITH ENCRYPTED PASSWORD '$DB_PASSWORD';"
    fi
    
    # Check if database already exists
    if sudo -u postgres psql -tAc "SELECT 1 FROM pg_database WHERE datname='$DB_NAME';" | grep -q 1; then
        log "Database $DB_NAME already exists, updating owner..."
        sudo -u postgres psql -c "ALTER DATABASE \"$DB_NAME\" OWNER TO \"$DB_USER\";"
    else
        log "Creating database $DB_NAME..."
        sudo -u postgres createdb "$DB_NAME" -O "$DB_USER"
    fi
    
    # Configure PostgreSQL for local connections
    POSTGRES_CONFIG="/etc/postgresql/$POSTGRES_VERSION/main"
    
    # Verify config directory exists, try common alternatives if not
    if [ ! -d "$POSTGRES_CONFIG" ]; then
        # Try to find the actual config directory
        POSTGRES_CONFIG=$(find /etc/postgresql -name "main" -type d | head -1 2>/dev/null)
        if [ -z "$POSTGRES_CONFIG" ]; then
            error "Could not locate PostgreSQL configuration directory"
            info "Please check your PostgreSQL installation and configure manually"
            return 1
        fi
        log "Using PostgreSQL config directory: $POSTGRES_CONFIG"
    fi
    
    sudo cp "$POSTGRES_CONFIG/pg_hba.conf" "$POSTGRES_CONFIG/pg_hba.conf.backup"
    
    # Allow local connections (Unix socket and TCP) - check if already exists
    if ! sudo grep -q "local.*$DB_NAME.*$DB_USER" "$POSTGRES_CONFIG/pg_hba.conf"; then
        echo "local   $DB_NAME    $DB_USER                                md5" | sudo tee -a "$POSTGRES_CONFIG/pg_hba.conf"
    fi
    if ! sudo grep -q "host.*$DB_NAME.*$DB_USER.*127.0.0.1" "$POSTGRES_CONFIG/pg_hba.conf"; then
        echo "host    $DB_NAME    $DB_USER    127.0.0.1/32                md5" | sudo tee -a "$POSTGRES_CONFIG/pg_hba.conf"
    fi
    
    # Reload PostgreSQL configuration
    sudo systemctl reload postgresql
    
    log "PostgreSQL installation completed successfully!"
}

# Create application user
create_app_user() {
    log "Setting up application user: $APP_USER"
    
    if ! id "$APP_USER" &>/dev/null; then
        log "Creating user $APP_USER..."
        sudo adduser --system --group --home "$APP_DIR" --shell /bin/bash "$APP_USER"
    else
        log "User $APP_USER already exists, continuing..."
    fi
    
    # Ensure directory exists and has correct permissions (idempotent)
    sudo mkdir -p "$APP_DIR"
    sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
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
    
    # Install application dependencies (including dev dependencies for build)
    log "Installing application dependencies..."
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm ci"
    
    # Build application
    log "Building application..."
    if sudo -u "$APP_USER" bash -c "cd $APP_DIR && [ -f package.json ] && npm run build"; then
        log "Build completed successfully"
        # Optional: Remove dev dependencies after build for production
        # sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm prune --production"
    else
        warn "Build step failed or not available, application will run in development mode"
    fi
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
# Application Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=${SESSION_SECRET}

# OpenAI Configuration
OPENAI_API_KEY=${OPENAI_API_KEY}
EOF

    # Add database configuration only if using database
    if [ "$USE_DATABASE" = "true" ]; then
        cat >> /tmp/together.env << EOF

# Database Configuration
DATABASE_URL=postgresql://${DB_USER}:${DB_PASSWORD}@${DB_HOST}:${DB_PORT}/${DB_NAME}
PGHOST=${DB_HOST}
PGPORT=${DB_PORT}
PGUSER=${DB_USER}
PGPASSWORD=${DB_PASSWORD}
PGDATABASE=${DB_NAME}
EOF
    fi
    
    # Move environment file and set permissions
    sudo mv /tmp/together.env "$APP_DIR/.env"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR/.env"
    sudo chmod 600 "$APP_DIR/.env"
    
    log "Environment configuration completed"
}

# Setup database
setup_database() {
    if [ "$USE_DATABASE" = "true" ]; then
        log "Setting up application database..."
        
        # Run database migrations
        if sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm run db:push"; then
            log "Database setup completed"
        else
            warn "Database migration failed or not available. Application will use in-memory storage."
        fi
    else
        log "Skipping database setup (using in-memory storage)"
    fi
}

# Configure PM2
configure_pm2() {
    log "Configuring PM2 process manager..."
    
    # Create PM2 ecosystem file  
    # NOTE: This runs the development server for simplicity
    # For production, consider creating a proper build process
    cat > /tmp/ecosystem.config.cjs << 'EOF'
module.exports = {
  apps: [{
    name: 'together',
    script: 'npm',
    args: 'run dev',
    cwd: '/opt/together',
    env: {
      NODE_ENV: 'development',
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
    sudo mv /tmp/ecosystem.config.cjs "$APP_DIR/"
    sudo chown "$APP_USER:$APP_USER" "$APP_DIR/ecosystem.config.cjs"
    
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
    
    # Note: Not allowing 3000/tcp as Nginx handles all public traffic
    
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
    gzip_proxied expired no-cache no-store private auth;
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
        proxy_pass http://127.0.0.1:3000/api/health;
        access_log off;
    }

    # API health check (alternative path)
    location /api/health {
        proxy_pass http://127.0.0.1:3000/api/health;
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
        error "Nginx configuration test failed. Checking for syntax errors..."
        sudo nginx -t 2>&1 | head -10
        
        # Try to fix common issues and retry
        warn "Attempting to fix common Nginx configuration issues..."
        
        # Remove any conflicting default sites
        sudo rm -f /etc/nginx/sites-enabled/default
        
        # Ensure proper file permissions
        sudo chown root:root "/etc/nginx/sites-available/together"
        sudo chmod 644 "/etc/nginx/sites-available/together"
        
        # Test again
        if sudo nginx -t; then
            sudo systemctl restart nginx
            sudo systemctl enable nginx
            log "Nginx configured successfully after fixes"
        else
            error "Nginx configuration still failing. Please check manually:"
            sudo nginx -t
            warn "Continuing installation - you can fix Nginx configuration later"
        fi
    fi
}

# Start application
start_application() {
    log "Starting Together application..."
    
    # Setup PM2 startup for system service
    sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u "$APP_USER" --hp "$APP_DIR" || true
    
    # Start application with PM2 as app user (stop existing first if running)
    if sudo -u "$APP_USER" pm2 list | grep -q "together"; then
        log "Stopping existing Together application..."
        sudo -u "$APP_USER" pm2 delete together &>/dev/null || true
    fi
    
    log "Starting Together application with PM2..."
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && pm2 start ecosystem.config.cjs"
    
    # Save PM2 process list for startup
    sudo -u "$APP_USER" pm2 save
    
    # Wait for application to start
    sleep 10
    
    # Check if application is running
    if sudo -u "$APP_USER" pm2 list | grep -q "together.*online"; then
        log "Application started successfully!"
        
        # Test health endpoint
        if curl -f -s http://localhost:3000/api/health > /dev/null; then
            log "Health check passed!"
        else
            warn "Health check failed, but application appears to be starting"
            info "You can test manually with: curl http://localhost:3000/api/health"
        fi
    else
        error "Application failed to start. Check logs with: sudo -u $APP_USER pm2 logs together"
        warn "You can also try: sudo -u $APP_USER pm2 restart together"
        # Don't exit - let user debug
    fi
}

# SSL certificate setup
setup_ssl() {
    if [ -n "$DOMAIN_NAME" ] && [ "$DOMAIN_NAME" != "localhost" ]; then
        echo
        info "Would you like to set up SSL certificate with Let's Encrypt? (recommended for production)"
        read -p "Setup SSL? (y/N): " setup_ssl_choice
        
        if [[ $setup_ssl_choice =~ ^[Yy]$ ]]; then
            log "Setting up SSL certificate..."
            
            # Install Certbot and nginx plugin
            sudo apt-get install -y snapd
            sudo snap install core; sudo snap refresh core 2>/dev/null || true
            sudo snap install --classic certbot
            sudo ln -sf /snap/bin/certbot /usr/bin/certbot
            
            # Also install via apt as fallback
            sudo apt-get install -y certbot python3-certbot-nginx
            
            # Obtain certificate
            if sudo certbot --nginx -d "$DOMAIN_NAME" --non-interactive --agree-tos --email "admin@${DOMAIN_NAME}" --redirect; then
                log "SSL certificate configured successfully!"
                info "Certificate will auto-renew via systemd timer"
                
                # Enable auto-renewal
                sudo systemctl enable certbot.timer
                sudo systemctl start certbot.timer
            else
                error "SSL certificate setup failed. Check DNS and domain configuration."
                info "You can run 'sudo certbot --nginx -d $DOMAIN_NAME' manually later"
            fi
        fi
    else
        info "Skipping SSL setup (no domain name configured)"
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
    configure_database
    
    # System setup
    install_system_packages
    install_nodejs
    
    if [ "$DATABASE_TYPE" = "local" ]; then
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