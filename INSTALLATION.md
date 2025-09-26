# AppreciateMate v1.1.0-Beta - Ubuntu Server Installation Guide

## Overview

This guide provides complete instructions for installing the AppreciateMate relationship app on an Ubuntu server. The installation script supports both development and production environments with optional local or remote PostgreSQL database configurations.

## Table of Contents

1. [System Requirements](#system-requirements)
2. [Prerequisites](#prerequisites)
3. [Quick Installation](#quick-installation)
4. [Detailed Installation Steps](#detailed-installation-steps)
5. [Configuration Options](#configuration-options)
6. [Post-Installation](#post-installation)
7. [Security Considerations](#security-considerations)
8. [Maintenance](#maintenance)
9. [Troubleshooting](#troubleshooting)
10. [Uninstallation](#uninstallation)

## System Requirements

### Minimum Requirements
- **OS**: Ubuntu 18.04 LTS or newer
- **RAM**: 2GB (4GB recommended)
- **Storage**: 10GB available space (20GB recommended)
- **CPU**: 1 core (2+ cores recommended)
- **Network**: Internet connection for package downloads

### Recommended for Production
- **OS**: Ubuntu 22.04 LTS
- **RAM**: 4GB or more
- **Storage**: 50GB+ SSD
- **CPU**: 2+ cores
- **Network**: Stable internet with domain name

## Prerequisites

### 1. Fresh Ubuntu Server
- Freshly installed Ubuntu server (18.04+ or 22.04 LTS recommended)
- Root access or user with sudo privileges
- SSH access configured

### 2. Domain Name (Optional but Recommended)
- A registered domain name pointing to your server's IP address
- Required for SSL certificate setup
- Example: `appreciatemate.yourdomain.com`

### 3. Required Accounts
- **OpenAI Account**: Get API key from [OpenAI Platform](https://platform.openai.com/api-keys)
  - Required for AI-powered features (activity suggestions, insights)
  - Ensure you have sufficient API credits

### 4. Database Preparation (If Using Remote PostgreSQL)
- PostgreSQL database server accessible from your Ubuntu server
- Database credentials (host, port, username, password, database name)
- Network connectivity between servers

## Quick Installation

For a standard installation with all recommended settings:

```bash
# Download the installation script
wget https://raw.githubusercontent.com/your-repo/appreciatemate/main/install-ubuntu.sh

# Make it executable
chmod +x install-ubuntu.sh

# Run the installation
./install-ubuntu.sh
```

The script will guide you through the configuration process with interactive prompts.

## Detailed Installation Steps

### Step 1: Download Installation Script

```bash
# Option 1: Download directly
wget https://raw.githubusercontent.com/your-repo/appreciatemate/main/install-ubuntu.sh

# Option 2: Clone the repository
git clone https://github.com/your-repo/appreciatemate.git
cd appreciatemate
```

### Step 2: Prepare System

Ensure your system is up to date:

```bash
sudo apt update && sudo apt upgrade -y
```

### Step 3: Run Installation Script

```bash
chmod +x install-ubuntu.sh
./install-ubuntu.sh
```

### Step 4: Follow Interactive Setup

The script will prompt you for:

#### Database Configuration
- **Local PostgreSQL**: Install PostgreSQL on the same server
  - Automatic database and user creation
  - Secure local configuration
  - Suitable for small to medium deployments

- **Remote PostgreSQL**: Connect to external database
  - Enter connection details
  - Connection testing before proceeding
  - Suitable for scalable deployments

#### Application Deployment
- **Git Repository**: Clone from version control
  - Enter repository URL and branch
  - Automatic code updates possible

- **Manual Upload**: Upload files separately
  - Transfer files via SCP/RSYNC
  - Full control over deployment

#### Domain and SSL
- Enter your domain name
- Optional SSL certificate with Let's Encrypt
- Automatic HTTPS redirection

### Step 5: Verification

After installation, verify the application is running:

```bash
# Check application status
sudo -u appreciatemate pm2 status

# Check logs
sudo -u appreciatemate pm2 logs appreciatemate

# Test HTTP response
curl -I http://localhost:5000
```

## Configuration Options

### Database Configuration

#### Local PostgreSQL
```bash
# Default settings
Database Name: appreciatemate_db
Database User: appreciatemate_user  
Database Host: localhost
Database Port: 5432
Password: [Auto-generated]
```

#### Remote PostgreSQL
```bash
# Required information
Database Host: your.database.host
Database Port: 5432 (default)
Database Name: your_database_name
Database User: your_database_user
Database Password: your_database_password
```

### Application Configuration

The application is configured via environment variables in `/opt/appreciatemate/.env`:

```bash
# Database Connection
DATABASE_URL=postgresql://user:password@host:port/database
PGHOST=localhost
PGPORT=5432
PGUSER=appreciatemate_user
PGPASSWORD=generated_password
PGDATABASE=appreciatemate_db

# Application Settings
NODE_ENV=production
PORT=3000
SESSION_SECRET=auto_generated_secret

# OpenAI Integration
OPENAI_API_KEY=your_openai_api_key
```

### Web Server Configuration

#### Nginx Configuration
- Reverse proxy setup
- Static file caching
- Security headers
- Gzip compression
- SSL termination (if configured)

Configuration file: `/etc/nginx/sites-available/together`

#### PM2 Process Management
- Automatic restarts
- Log management
- Memory monitoring
- Cluster mode support

Configuration file: `/opt/appreciatemate/ecosystem.config.cjs`

### Firewall Configuration

The installation automatically configures UFW firewall:

```bash
# Allowed ports
Port 22  (SSH)
Port 80  (HTTP) 
Port 443 (HTTPS)
# Note: Port 3000 is not exposed - Nginx handles all traffic

# View current status
sudo ufw status verbose
```

## Post-Installation

### 1. Initial Application Setup

1. **Access the Application**
   ```bash
   # If using domain with SSL
   https://your-domain.com
   
   # If using domain without SSL  
   http://your-domain.com
   
   # If using IP address
   http://your-server-ip:3000
   ```

2. **Default Admin Login**
   ```
   Email: admin@example.com
   Password: admin123
   ```
   
   **⚠️ Important**: Change this password immediately after first login!

3. **Create User Accounts**
   - Create accounts for each partner
   - Set up couple connection
   - Configure activity categories

### 2. System Verification

```bash
# Verify all services are running
sudo systemctl status nginx
sudo systemctl status postgresql  # (if local)
sudo -u appreciatemate pm2 status

# Check application logs
sudo -u appreciatemate pm2 logs appreciatemate --lines 50

# Verify database connection
sudo -u appreciatemate -i
cd /opt/appreciatemate
npm run db:push  # Should show "No schema changes"
```

### 3. SSL Certificate Verification (if configured)

```bash
# Check certificate status
sudo certbot certificates

# Test SSL configuration
openssl s_client -connect your-domain.com:443 -servername your-domain.com
```

### 4. Application Health Check

```bash
# Health check endpoint
curl http://localhost:5000/api/health

# API endpoint test
curl -H "Content-Type: application/json" \
     -H "x-user-id: 1" \
     http://localhost:5000/api/activities
```

## Security Considerations

### 1. System Security

- **Regular Updates**: Keep system packages updated
  ```bash
  sudo apt update && sudo apt upgrade -y
  ```

- **Firewall**: UFW is configured automatically
  ```bash
  sudo ufw status  # Verify firewall rules (port 3000 should NOT be open)
  ```

- **Fail2Ban**: Installed to prevent brute force attacks
  ```bash
  sudo fail2ban-client status
  ```

### 2. Application Security

- **Environment Variables**: Stored securely in `/opt/appreciatemate/.env` (600 permissions)
- **Session Security**: Strong session secret auto-generated
- **Database Security**: Restricted database access with dedicated user
- **SSL/TLS**: Automatic HTTPS with Let's Encrypt (if configured)

### 3. Regular Security Tasks

1. **Change Default Passwords**
   - Admin account password
   - Database passwords (if applicable)

2. **Monitor Logs**
   ```bash
   # Application logs
   sudo -u appreciatemate pm2 logs appreciatemate
   
   # System logs
   sudo journalctl -u nginx -f
   sudo tail -f /var/log/auth.log
   ```

3. **Update SSL Certificates**
   ```bash
   # Check auto-renewal status
   sudo systemctl status certbot.timer
   
   # Test renewal
   sudo certbot renew --dry-run
   ```

## Maintenance

### 1. Application Updates

```bash
# Standard update process
cd /opt/appreciatemate
git pull origin main
npm ci --production
npm run build
sudo -u together pm2 restart together
```

### 2. Database Maintenance

```bash
# Database migrations
cd /opt/appreciatemate
sudo -u together npm run db:push

# Database backup (local PostgreSQL)
sudo -u postgres pg_dump appreciatemate_db > backup_$(date +%Y%m%d).sql

# Database restore (local PostgreSQL)
sudo -u postgres psql appreciatemate_db < backup_20241201.sql
```

### 3. Log Management

```bash
# View logs
sudo -u appreciatemate pm2 logs appreciatemate

# Clear old logs
sudo -u together pm2 flush together

# Log rotation is automatic via logrotate
sudo cat /etc/logrotate.d/together
```

### 4. System Monitoring

```bash
# System resources
htop
df -h
free -h

# Application monitoring  
sudo -u together pm2 monit

# Service status
sudo systemctl status nginx postgresql
```

### 5. Backup Strategy

#### Application Backup
```bash
# Create backup directory
sudo mkdir -p /backup/together

# Backup application files
sudo tar -czf /backup/together/app_$(date +%Y%m%d).tar.gz -C /opt together

# Backup database
sudo -u postgres pg_dump appreciatemate_db | gzip > /backup/together/db_$(date +%Y%m%d).sql.gz

# Backup environment config
sudo cp /opt/appreciatemate/.env /backup/together/.env_$(date +%Y%m%d)
```

#### Automated Backup Script
```bash
#!/bin/bash
# Save as /usr/local/bin/backup-together.sh

BACKUP_DIR="/backup/together"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p "$BACKUP_DIR"

# Database backup
sudo -u postgres pg_dump appreciatemate_db | gzip > "$BACKUP_DIR/db_$DATE.sql.gz"

# Application backup
sudo tar -czf "$BACKUP_DIR/app_$DATE.tar.gz" -C /opt together

# Keep only last 7 backups
find "$BACKUP_DIR" -name "*.tar.gz" -mtime +7 -delete
find "$BACKUP_DIR" -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $DATE"
```

Add to crontab for daily backups:
```bash
sudo crontab -e
# Add line: 0 2 * * * /usr/local/bin/backup-together.sh >> /var/log/backup.log 2>&1
```

## Troubleshooting

### Common Issues

#### 1. Installation Script Fails

**Symptom**: Script exits with error during installation
```bash
[ERROR] Installation failed. Check the logs above for details.
```

**Solutions**:
- Check system requirements are met
- Ensure internet connectivity
- Verify sudo privileges
- Run with debug mode: `bash -x install-ubuntu.sh`

#### 2. Application Won't Start

**Symptom**: PM2 shows app as "errored" or "stopped"
```bash
sudo -u appreciatemate pm2 status
# Shows: together | errored
```

**Solutions**:
```bash
# Check detailed logs
sudo -u appreciatemate pm2 logs appreciatemate --lines 100

# Common fixes:
# Fix 1: Environment variables missing
sudo -u together cat /opt/appreciatemate/.env

# Fix 2: Database connection issue  
sudo -u together npm run db:push

# Fix 3: Dependencies missing
cd /opt/appreciatemate
sudo -u together npm ci --production

# Fix 4: Build issues
sudo -u together npm run build

# Restart after fixes
sudo -u together pm2 restart together
```

#### 3. Database Connection Errors

**Symptom**: Database connection failed
```
[ERROR] Failed to connect to remote database
```

**Solutions**:
```bash
# For local PostgreSQL
sudo systemctl status postgresql
sudo systemctl start postgresql

# Test database connection
sudo -u postgres psql -c "SELECT version();"

# For remote PostgreSQL  
telnet db_host db_port
ping db_host

# Check credentials
PGPASSWORD=your_password psql -h host -p port -U user -d database -c "SELECT 1;"
```

#### 4. Nginx Configuration Issues

**Symptom**: Nginx fails to start or 502 Bad Gateway
```bash
sudo nginx -t
# Shows configuration errors
```

**Solutions**:
```bash
# Check Nginx configuration
sudo nginx -t

# View Nginx logs
sudo tail -f /var/log/nginx/error.log

# Restart services
sudo systemctl restart nginx
sudo -u together pm2 restart together

# Check if app is listening
netstat -tlnp | grep :3000
```

#### 5. SSL Certificate Issues

**Symptom**: HTTPS not working or certificate errors
```bash
curl: (60) SSL certificate problem
```

**Solutions**:
```bash
# Check certificate status
sudo certbot certificates

# Renew certificates
sudo certbot renew

# Manual certificate request
sudo certbot --nginx -d your-domain.com

# Check DNS resolution
nslookup your-domain.com
```

#### 6. Out of Memory Issues

**Symptom**: Application randomly stops or restarts
```bash
# In PM2 logs:
Error: JavaScript heap out of memory
```

**Solutions**:
```bash
# Increase memory limit in ecosystem.config.cjs
sudo -u together nano /opt/appreciatemate/ecosystem.config.cjs
# Change: max_memory_restart: '2G'  # Increase from 1G

# Add swap space
sudo fallocate -l 2G /swapfile
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile
echo '/swapfile none swap sw 0 0' | sudo tee -a /etc/fstab

# Restart application
sudo -u together pm2 restart together
```

#### 7. Permission Issues

**Symptom**: File permission errors
```bash
Error: EACCES: permission denied
```

**Solutions**:
```bash
# Fix application permissions
sudo chown -R together:together /opt/appreciatemate
sudo chmod 600 /opt/appreciatemate/.env

# Fix log permissions
sudo chown -R together:together /var/log/together
```

### Debugging Commands

```bash
# System information
uname -a
lsb_release -a
df -h
free -h

# Network connectivity
ping google.com
curl -I http://localhost:5000
netstat -tlnp | grep :3000

# Service status
sudo systemctl status nginx
sudo systemctl status postgresql
sudo -u appreciatemate pm2 status

# Application logs
sudo -u appreciatemate pm2 logs appreciatemate --lines 100
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# Database connectivity
sudo -u postgres psql -c "SELECT version();"
sudo -u appreciatemate -i
cd /opt/appreciatemate && npm run db:push
```

### Performance Issues

#### High CPU Usage
```bash
# Monitor processes
htop
sudo -u together pm2 monit

# Check for memory leaks
sudo -u appreciatemate pm2 logs appreciatemate | grep -i memory
```

#### Slow Database Queries
```bash
# Enable query logging (PostgreSQL)
sudo nano /etc/postgresql/15/main/postgresql.conf
# Add: log_min_duration_statement = 1000

# Restart PostgreSQL
sudo systemctl restart postgresql

# Check slow queries
sudo tail -f /var/log/postgresql/postgresql-15-main.log
```

### Getting Help

If you encounter issues not covered in this guide:

1. **Check Application Logs**
   ```bash
   sudo -u appreciatemate pm2 logs appreciatemate --lines 200
   ```

2. **Check System Logs**
   ```bash
   sudo journalctl -xe
   sudo tail -f /var/log/syslog
   ```

3. **Gather System Information**
   ```bash
   # Create diagnostic report
   echo "System Info:" > diagnostic.txt
   uname -a >> diagnostic.txt
   echo -e "\nServices:" >> diagnostic.txt
   sudo systemctl status nginx >> diagnostic.txt
   sudo -u appreciatemate pm2 status >> diagnostic.txt
   echo -e "\nRecent logs:" >> diagnostic.txt
   sudo -u appreciatemate pm2 logs appreciatemate --lines 50 >> diagnostic.txt
   ```

4. **Contact Support**
   - Include diagnostic information
   - Describe exact error messages
   - List steps taken before the issue occurred

## Uninstallation

To completely remove the Together app:

```bash
#!/bin/bash
# Uninstall Together App

# Stop application
sudo -u together pm2 delete together
sudo -u together pm2 kill

# Remove Nginx configuration
sudo rm -f /etc/nginx/sites-available/together
sudo rm -f /etc/nginx/sites-enabled/together
sudo systemctl reload nginx

# Remove SSL certificates (optional)
sudo certbot delete --cert-name your-domain.com

# Remove application files
sudo rm -rf /opt/appreciatemate

# Remove user
sudo deluser --remove-home together

# Remove database (local PostgreSQL only)
sudo -u postgres dropdb appreciatemate_db
sudo -u postgres dropuser appreciatemate_user

# Remove logs
sudo rm -rf /var/log/together
sudo rm -f /etc/logrotate.d/together

# Remove firewall rules (optional)
sudo ufw delete allow 3000/tcp

echo "Together app has been completely removed."
```

---

## Additional Resources

- **Application Documentation**: See README.md for app usage
- **API Documentation**: Visit `/api/docs` after installation  
- **OpenAI API**: [OpenAI Platform Documentation](https://platform.openai.com/docs)
- **PM2 Documentation**: [PM2 Process Manager](https://pm2.keymetrics.io/docs/)
- **Nginx Documentation**: [Nginx Configuration](https://nginx.org/en/docs/)
- **Let's Encrypt**: [SSL Certificate Guide](https://letsencrypt.org/getting-started/)

---

**Version**: 1.0.0  
**Last Updated**: September 2025  
**Compatibility**: Ubuntu 18.04+, Node.js 20+, PostgreSQL 12+