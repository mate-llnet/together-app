#!/bin/bash

# AppreciateMate v1.1.0-Beta - Ubuntu Server Upgrade Script
# This script safely upgrades the AppreciateMate application on Ubuntu servers
# Includes backward compatibility for "together" v1.0.x installations
# Usage: ./upgrade-ubuntu.sh [--force] [--skip-backup]

set -euo pipefail

# Configuration (defaults for new AppreciateMate installation)
APP_DIR="/opt/appreciatemate"
APP_USER="appreciatemate"
SERVICE_NAME="appreciatemate"
BACKUP_DIR="/opt/appreciatemate-backups"
LOG_FILE="/var/log/appreciatemate-upgrade.log"

# Legacy compatibility - detect old "together" installation
LEGACY_APP_DIR="/opt/together"
LEGACY_APP_USER="together"
LEGACY_SERVICE_NAME="together"
LEGACY_BACKUP_DIR="/opt/together-backups"
LEGACY_LOG_FILE="/var/log/together-upgrade.log"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Parse command line arguments
FORCE_UPDATE=false
SKIP_BACKUP=false

while [[ $# -gt 0 ]]; do
    case $1 in
        --force)
            FORCE_UPDATE=true
            shift
            ;;
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [--force] [--skip-backup]"
            echo "  --force      Force update even if no changes detected"
            echo "  --skip-backup Skip database and file backup"
            exit 0
            ;;
        *)
            echo "Unknown option $1"
            exit 1
            ;;
    esac
done

# Logging function
log() {
    echo -e "${GREEN}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

warn() {
    echo -e "${YELLOW}[$(date +'%Y-%m-%d %H:%M:%S')] WARNING: $1${NC}" | tee -a "$LOG_FILE"
}

error() {
    echo -e "${RED}[$(date +'%Y-%m-%d %H:%M:%S')] ERROR: $1${NC}" | tee -a "$LOG_FILE"
}

info() {
    echo -e "${BLUE}[$(date +'%Y-%m-%d %H:%M:%S')] $1${NC}" | tee -a "$LOG_FILE"
}

# Detect legacy "together" installation and migrate to AppreciateMate
detect_and_migrate_legacy() {
    log "Checking for legacy \"together\" installation..."
    
    # Check if legacy installation exists
    if [[ -d "$LEGACY_APP_DIR" ]]; then
        log "Legacy \"together\" installation detected at $LEGACY_APP_DIR"
        
        # Check if new AppreciateMate directory already exists
        if [[ -d "$APP_DIR" ]]; then
            warn "Both legacy ($LEGACY_APP_DIR) and new ($APP_DIR) directories exist"
            warn "Using new AppreciateMate directory for upgrade"
            return 0
        fi
        
        log "Migrating from legacy \"together\" to AppreciateMate..."
        
        # Stop legacy PM2 process
        if sudo -u "$LEGACY_APP_USER" pm2 list 2>/dev/null | grep -q "$LEGACY_SERVICE_NAME"; then
            log "Stopping legacy PM2 process..."
            sudo -u "$LEGACY_APP_USER" pm2 stop "$LEGACY_SERVICE_NAME" || true
            sudo -u "$LEGACY_APP_USER" pm2 delete "$LEGACY_SERVICE_NAME" || true
        fi
        
        # Create new user if needed
        if ! id "$APP_USER" &>/dev/null; then
            log "Creating AppreciateMate user..."
            sudo useradd -r -s /bin/bash -d "$APP_DIR" "$APP_USER"
        fi
        
        # Move directory and update ownership
        log "Moving application directory..."
        sudo mv "$LEGACY_APP_DIR" "$APP_DIR"
        sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
        
        # Create log directory
        sudo mkdir -p "$(dirname "$LOG_FILE")"
        sudo chown "$APP_USER:$APP_USER" "$(dirname "$LOG_FILE")"
        
        # Move backup directory if it exists
        if [[ -d "$LEGACY_BACKUP_DIR" ]]; then
            log "Moving backup directory..."
            sudo mv "$LEGACY_BACKUP_DIR" "$BACKUP_DIR"
            sudo chown -R "$APP_USER:$APP_USER" "$BACKUP_DIR"
        fi
        
        log "Legacy migration completed successfully"
        return 0
    elif [[ -d "$APP_DIR" ]]; then
        log "AppreciateMate installation found at $APP_DIR"
        return 0
    else
        error "No installation found at $APP_DIR or $LEGACY_APP_DIR"
        error "Please run the installation script first"
        exit 1
    fi
}

# Clean up Neon dependencies and install postgres driver
update_database_driver() {
    log "Updating database driver from Neon to postgres-js..."
    
    # Remove Neon packages if they exist
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        if npm list @neondatabase/serverless >/dev/null 2>&1; then
            log 'Removing Neon serverless packages...'
            npm uninstall @neondatabase/serverless ws bufferutil 2>/dev/null || true
        fi
        
        # Ensure postgres driver is installed
        if ! npm list postgres >/dev/null 2>&1; then
            log 'Installing postgres-js driver...'
            npm install postgres
        fi
        
        # Clean up unused packages
        npm prune
    "
    
    log "Database driver update completed"
}

# Check if running as root
check_root() {
    if [[ $EUID -eq 0 ]]; then
        error "This script should not be run as root"
        exit 1
    fi
}

# Check if user can sudo
check_sudo() {
    if ! sudo -n true 2>/dev/null; then
        error "This script requires sudo privileges"
        exit 1
    fi
}

# Check if app directory exists
check_app_directory() {
    if [[ ! -d "$APP_DIR" ]]; then
        error "Application directory $APP_DIR does not exist"
        exit 1
    fi
}

# Check if git repository
check_git_repo() {
    if [[ ! -d "$APP_DIR/.git" ]]; then
        error "Application directory is not a git repository"
        exit 1
    fi
}

# Get current git commit
get_current_commit() {
    sudo -u "$APP_USER" bash -c "cd $APP_DIR && git rev-parse HEAD"
}

# Check for updates
check_for_updates() {
    log "Fetching latest changes from remote..."
    
    # All git operations as app user
    local git_info=$(sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        git fetch origin
        echo \"current:\$(git rev-parse HEAD)\"
        echo \"remote:\$(git rev-parse origin/main)\"
    ")
    
    local current_commit=$(echo "$git_info" | grep "current:" | cut -d: -f2)
    local remote_commit=$(echo "$git_info" | grep "remote:" | cut -d: -f2)
    
    if [[ "$current_commit" == "$remote_commit" ]]; then
        if [[ "$FORCE_UPDATE" == false ]]; then
            info "No updates available. Use --force to upgrade anyway."
            exit 0
        else
            warn "No updates available but forcing upgrade..."
        fi
    else
        info "Updates available:"
        info "Current: $current_commit"
        info "Remote:  $remote_commit"
    fi
}

# Create backup
create_backup() {
    if [[ "$SKIP_BACKUP" == true ]]; then
        warn "Skipping backup as requested"
        return
    fi
    
    local backup_timestamp=$(date +%Y%m%d_%H%M%S)
    local backup_path="$BACKUP_DIR/$backup_timestamp"
    
    log "Creating backup at $backup_path..."
    
    # Create backup directory
    sudo mkdir -p "$backup_path"
    
    # Backup application files (excluding node_modules and .git)
    sudo rsync -av --exclude='node_modules' --exclude='.git' --exclude='dist' --exclude='logs' \
        "$APP_DIR/" "$backup_path/app/"
    
    # Backup database
    if command -v pg_dump >/dev/null 2>&1; then
        log "Backing up database..."
        sudo -u postgres pg_dump -h localhost -U together together > "$backup_path/database.sql" 2>/dev/null || \
            warn "Database backup failed - continuing anyway"
    fi
    
    # Backup PM2 configuration
    if sudo -u "$APP_USER" pm2 jlist >/dev/null 2>&1; then
        sudo -u "$APP_USER" pm2 save > /dev/null 2>&1 || warn "PM2 config backup failed"
    fi
    
    # Set proper permissions
    sudo chown -R "$USER:$USER" "$backup_path"
    
    log "Backup completed at $backup_path"
    
    # Keep only last 5 backups
    if [[ -d "$BACKUP_DIR" ]]; then
        sudo find "$BACKUP_DIR" -maxdepth 1 -type d -name "*_*" | sort | head -n -5 | sudo xargs rm -rf
    fi
}

# Stop application
stop_application() {
    log "Stopping Together application..."
    
    # Stop PM2 process
    if sudo -u "$APP_USER" pm2 list | grep -q "$SERVICE_NAME"; then
        sudo -u "$APP_USER" pm2 stop "$SERVICE_NAME" || warn "Failed to stop PM2 process"
        sudo -u "$APP_USER" pm2 delete "$SERVICE_NAME" || warn "Failed to delete PM2 process"
    fi
    
    # Additional cleanup - kill any remaining node processes
    pkill -f "node.*together" || true
    sleep 2
}

# Pull latest changes
pull_changes() {
    log "Pulling latest changes..."
    
    # Handle potential ecosystem.config.cjs conflicts
    if [[ -f "$APP_DIR/ecosystem.config.cjs" ]] && ! sudo -u "$APP_USER" bash -c "cd $APP_DIR && git ls-files --error-unmatch ecosystem.config.cjs" >/dev/null 2>&1; then
        warn "Moving local ecosystem.config.cjs to avoid conflicts..."
        sudo -u "$APP_USER" mv "$APP_DIR/ecosystem.config.cjs" "$APP_DIR/ecosystem.local.cjs"
    fi
    
    # All git operations as app user
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        
        # Stash any local changes
        if ! git diff --quiet; then
            echo 'Local changes detected, stashing them...'
            git stash push -m 'Auto-stash before upgrade $(date)'
        fi
        
        # Pull latest changes
        git pull origin main
    "
    
    log "Successfully pulled latest changes"
}

# Install dependencies
install_dependencies() {
    log "Installing/updating dependencies..."
    
    # Check if package.json or package-lock.json changed
    if sudo -u "$APP_USER" bash -c "cd $APP_DIR && git diff --name-only HEAD~1 HEAD" | grep -E "package.*\.json"; then
        log "Package files changed, running npm install..."
        sudo -u "$APP_USER" bash -c "cd $APP_DIR && npm install"
    else
        log "No package changes detected, skipping npm install"
    fi
}

# Build application
build_application() {
    log "Building application..."
    
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        
        # Clean previous build
        rm -rf dist/
        
        # Build frontend and backend
        npm run build
    "
    
    log "Build completed successfully"
}

# Run database migrations
run_migrations() {
    log "Running database migrations..."
    cd "$APP_DIR"
    
    # Check if schema changed
    if sudo -u "$APP_USER" git diff --name-only HEAD~1 HEAD | grep -E "shared/schema\.ts|drizzle.*"; then
        log "Database schema changes detected, pushing to database..."
        sudo -u "$APP_USER" npm run db:push --force || {
            error "Database migration failed"
            return 1
        }
    else
        log "No database schema changes detected"
    fi
}

# Update PM2 configuration
update_pm2_config() {
    log "Updating PM2 configuration..."
    
    # Use ecosystem.config.cjs from repository if available, otherwise use local
    local pm2_config="ecosystem.config.cjs"
    if [[ -f "$APP_DIR/ecosystem.local.cjs" ]] && [[ ! -f "$APP_DIR/ecosystem.config.cjs" ]]; then
        pm2_config="ecosystem.local.cjs"
        log "Using local PM2 configuration: $pm2_config"
    else
        log "Using repository PM2 configuration: $pm2_config"
    fi
    
    # Create logs directory
    sudo -u "$APP_USER" mkdir -p "$APP_DIR/logs"
    
    # Store config name for start function
    echo "$pm2_config" > /tmp/pm2_config_name
}

# Start application
start_application() {
    log "Starting Together application..."
    
    # Get PM2 config name
    local pm2_config=$(cat /tmp/pm2_config_name 2>/dev/null || echo "ecosystem.config.cjs")
    
    sudo -u "$APP_USER" bash -c "
        cd $APP_DIR
        
        # Start with PM2
        pm2 start $pm2_config
        
        # Save PM2 configuration
        pm2 save
    "
    
    log "Application started successfully"
}

# Verify deployment
verify_deployment() {
    log "Verifying deployment..."
    
    # Wait for application to start
    sleep 10
    
    # Check if process is running
    if ! sudo -u "$APP_USER" pm2 list | grep -q "online.*$SERVICE_NAME"; then
        error "Application is not running!"
        return 1
    fi
    
    # Check if port is listening
    if ! nc -z localhost 5000; then
        error "Application is not listening on port 5000!"
        return 1
    fi
    
    # Test HTTP response
    if ! curl -f -s http://localhost:5000/api/health >/dev/null; then
        warn "Health check endpoint not responding (this might be normal)"
    fi
    
    log "Deployment verification completed successfully"
}

# Cleanup function
cleanup() {
    log "Performing cleanup..."
    
    # Remove old log files (keep last 7 days)
    find /var/log -name "together-upgrade*.log" -mtime +7 -delete 2>/dev/null || true
    
    # Clean npm cache
    sudo -u "$APP_USER" npm cache clean --force 2>/dev/null || true
    
    log "Cleanup completed"
}

# Rollback function
rollback() {
    error "Upgrade failed! Starting rollback procedure..."
    
    # Find latest backup
    local latest_backup=$(find "$BACKUP_DIR" -maxdepth 1 -type d -name "*_*" | sort | tail -1)
    
    if [[ -z "$latest_backup" ]]; then
        error "No backup found for rollback!"
        return 1
    fi
    
    warn "Rolling back to $latest_backup..."
    
    # Stop current application
    stop_application
    
    # Restore application files
    sudo rsync -av --delete "$latest_backup/app/" "$APP_DIR/"
    sudo chown -R "$APP_USER:$APP_USER" "$APP_DIR"
    
    # Restore database if backup exists
    if [[ -f "$latest_backup/database.sql" ]]; then
        warn "Restoring database..."
        sudo -u postgres psql -h localhost -U together -d together < "$latest_backup/database.sql" || \
            error "Database rollback failed"
    fi
    
    # Reinstall dependencies
    cd "$APP_DIR"
    sudo -u "$APP_USER" npm install
    
    # Start application
    start_application
    
    error "Rollback completed. Please check application status."
}

# Main upgrade function
main() {
    log "Starting AppreciateMate application upgrade..."
    log "Command: $0 $*"
    
    # Pre-flight checks
    check_root
    check_sudo
    
    # Detect and migrate legacy installation if needed
    detect_and_migrate_legacy
    
    check_app_directory
    check_git_repo
    
    # Update database driver from Neon to postgres-js
    update_database_driver
    
    # Store original commit for rollback
    local original_commit=$(get_current_commit)
    
    # Check for updates
    check_for_updates
    
    # Create backup
    create_backup
    
    # Set trap for rollback on failure
    trap 'rollback' ERR
    
    # Perform upgrade
    stop_application
    pull_changes
    install_dependencies
    build_application
    run_migrations
    update_pm2_config
    start_application
    verify_deployment
    cleanup
    
    # Clear trap
    trap - ERR
    
    log "✅ AppreciateMate application upgrade completed successfully!"
    log "Previous version: $original_commit"
    log "Current version:  $(get_current_commit)"
    
    # Show status
    info "Application status:"
    sudo -u "$APP_USER" pm2 list
    
    info "To view logs: sudo -u $APP_USER pm2 logs $SERVICE_NAME"
    info "To monitor: sudo -u $APP_USER pm2 monit"
}

# Create log file if it doesn't exist
sudo mkdir -p "$(dirname "$LOG_FILE")"
sudo touch "$LOG_FILE"
sudo chmod 664 "$LOG_FILE"

# Run main function
main "$@"