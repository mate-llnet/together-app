# Deployment Troubleshooting Guide

## Common Deployment Issues and Solutions

This document addresses the specific deployment problems encountered during the AppreciateMate installation and provides solutions for common infrastructure failures.

## PM2 Service Issues

### Problem: PM2 fails to start or keeps restarting
**Symptoms:**
- `pm2 status` shows app as `errored` or `stopped`
- App constantly restarts
- "Error: Cannot find module" messages

**Solutions:**

1. **Missing TypeScript Dependencies**
```bash
# Install TypeScript runtime globally
sudo npm install -g ts-node tsconfig-paths typescript

# Or install locally in project
cd /opt/appreciatemate
sudo -u appreciatemate npm install ts-node tsconfig-paths --save-dev
```

2. **Fix PM2 Configuration**
```bash
# Kill all PM2 processes and start fresh
sudo -u appreciatemate pm2 kill
sudo -u appreciatemate pm2 flush

# Start with explicit environment
cd /opt/appreciatemate
sudo -u appreciatemate NODE_ENV=production pm2 start ecosystem.config.cjs
```

3. **Memory Issues**
```bash
# Update ecosystem.config.cjs with higher memory limits
# Add this to the app configuration:
NODE_OPTIONS: '--max-old-space-size=4096'
max_memory_restart: '2G'
```

### Problem: PM2 cannot find the application script
**Symptoms:**
- "Error: Script not found"
- PM2 looking for wrong file paths

**Solutions:**

1. **Verify Ecosystem Configuration**
```javascript
// ecosystem.config.cjs should point to the correct entry point
module.exports = {
  apps: [{
    name: 'appreciatemate',
    script: 'server/index.ts', // Make sure this file exists
    interpreter: 'node',
    interpreter_args: '--require ts-node/register --require tsconfig-paths/register',
    cwd: '/opt/appreciatemate',
    // ... other settings
  }]
};
```

2. **Check File Permissions**
```bash
sudo chown -R appreciatemate:appreciatemate /opt/appreciatemate
sudo chmod +x /opt/appreciatemate
```

## Nginx Configuration Issues

### Problem: Nginx fails to start or serve content
**Symptoms:**
- `nginx -t` shows configuration errors
- 502 Bad Gateway errors
- Nginx not responding on port 80

**Solutions:**

1. **Fix Configuration Syntax**
```bash
# Test configuration
sudo nginx -t

# Common fixes
sudo rm -f /etc/nginx/sites-enabled/default
sudo rm -f /etc/nginx/sites-enabled/000-default

# Recreate symlink
sudo ln -sf /etc/nginx/sites-available/appreciatemate /etc/nginx/sites-enabled/appreciatemate
```

2. **Port Conflicts**
```bash
# Check what's using port 80
sudo netstat -tlnp | grep :80

# Kill conflicting processes if needed
sudo systemctl stop apache2  # if Apache is running
sudo fuser -k 80/tcp  # force kill processes on port 80
```

3. **Minimal Working Configuration**
```nginx
# /etc/nginx/sites-available/appreciatemate
server {
    listen 80 default_server;
    server_name _;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /api/health {
        proxy_pass http://127.0.0.1:5000/api/health;
        access_log off;
    }
}
```

### Problem: 502 Bad Gateway errors
**Symptoms:**
- Nginx starts but shows 502 errors
- Backend connection refused

**Solutions:**

1. **Verify Application is Running**
```bash
# Check if app is responding
curl http://localhost:5000/api/health

# Check PM2 status
sudo -u appreciatemate pm2 status
sudo -u appreciatemate pm2 logs
```

2. **Test Direct Access**
```bash
# If app works on port 5000 but not through Nginx
curl http://localhost:5000  # Should work
curl http://localhost:80   # May show 502

# Check Nginx proxy configuration
```

## Database Connection Issues

### Problem: Database connection failures
**Symptoms:**
- "Connection refused" errors
- "Database does not exist" errors
- Application starts but database operations fail

**Solutions:**

1. **Verify Database Service**
```bash
# Check PostgreSQL status
sudo systemctl status postgresql

# Test connection manually
psql -h localhost -U appreciatemate_user -d appreciatemate_db
```

2. **Fix Connection String**
```bash
# Check .env file
cat /opt/appreciatemate/.env

# Ensure DATABASE_URL format is correct:
DATABASE_URL=postgresql://username:password@host:port/database
```

3. **Run Database Migrations**
```bash
cd /opt/appreciatemate
sudo -u appreciatemate npm run db:push
# or
sudo -u appreciatemate npm run db:migrate
```

## Build and Dependency Issues

### Problem: npm install or build failures
**Symptoms:**
- "Module not found" errors
- Build process hangs or fails
- Missing dependencies

**Solutions:**

1. **Clean Installation**
```bash
cd /opt/appreciatemate
sudo -u appreciatemate rm -rf node_modules package-lock.json
sudo -u appreciatemate npm cache clean --force
sudo -u appreciatemate npm install
```

2. **Memory Issues During Build**
```bash
# Build with increased memory
sudo -u appreciatemate NODE_OPTIONS='--max-old-space-size=4096' npm run build

# Or install with legacy peer deps
sudo -u appreciatemate npm install --legacy-peer-deps
```

3. **Architecture Migration Issues**
```bash
# If you encounter UI component errors related to the couples-to-groups migration
# Check that all components are using group context:
grep -r "usePartner\|partner\." client/src/  # Should show minimal results
grep -r "useGroupContext" client/src/  # Should show usage in main components
```

## Firewall and Network Issues

### Problem: Cannot access application externally
**Symptoms:**
- App works locally but not from external IPs
- Connection timeouts

**Solutions:**

1. **Check Firewall Rules**
```bash
sudo ufw status verbose

# Ensure required ports are open
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp
sudo ufw allow 22/tcp  # SSH access
```

2. **Test Internal vs External Access**
```bash
# Test locally
curl http://localhost
curl http://localhost:5000

# Test with external IP
curl http://YOUR_SERVER_IP
```

## Performance and Monitoring

### Problem: Application running slowly or crashing
**Solutions:**

1. **Monitor Resource Usage**
```bash
# Check system resources
htop
df -h  # Disk space
free -h  # Memory usage

# Check PM2 metrics
sudo -u appreciatemate pm2 monit
```

2. **Log Analysis**
```bash
# Application logs
sudo -u appreciatemate pm2 logs appreciatemate

# System logs
sudo journalctl -u nginx -f
sudo journalctl -xe

# Check for out of memory errors
sudo dmesg | grep -i "killed process"
```

## Quick Diagnostic Commands

Run these commands to gather diagnostic information:

```bash
#!/bin/bash
echo "=== AppreciateMate Diagnostic Report ==="
echo "Date: $(date)"
echo

echo "=== System Info ==="
uname -a
cat /etc/os-release | grep PRETTY_NAME

echo "=== Service Status ==="
sudo systemctl status nginx --no-pager
sudo systemctl status postgresql --no-pager

echo "=== PM2 Status ==="
sudo -u appreciatemate pm2 status

echo "=== Port Usage ==="
sudo netstat -tlnp | grep -E ':80|:5000|:5432'

echo "=== Disk Space ==="
df -h

echo "=== Memory Usage ==="
free -h

echo "=== Application Health ==="
curl -s http://localhost:5000/api/health || echo "Health check failed"

echo "=== Recent Logs (last 10 lines) ==="
sudo -u appreciatemate pm2 logs appreciatemate --lines 10
```

## Architecture Migration Specific Issues

The application has been migrated from a couples-only system to flexible relationship groups. If you encounter issues related to this migration:

1. **Check Component Updates**
   - Verify all pages use `useGroupContext` instead of partner-specific hooks
   - Ensure group selectors are present on relevant pages
   - Check that navigation routes include `/app` prefix

2. **Database Schema Issues**
   - The app now uses `relationship_groups` and `relationship_memberships` tables
   - Legacy `couples` table is kept for backward compatibility
   - Ensure migrations have run properly

3. **UI Component Errors**
   - Components should show group members instead of just partners
   - Group selection should be required before showing content
   - Appreciation and analytics should work with multiple group members

For detailed information about the migration, see `ARCHITECTURE_MIGRATION_FIXES.md`.

## Getting Help

If you continue to experience issues:

1. Check the detailed migration fixes: `cat /opt/appreciatemate/ARCHITECTURE_MIGRATION_FIXES.md`
2. Review application logs: `sudo -u appreciatemate pm2 logs`
3. Test individual components by accessing the application directly on port 5000
4. Verify that the group system is working by creating a test group and adding members

The most common issues are related to:
- PM2 configuration and TypeScript runtime
- Nginx proxy configuration
- Database connection and migration
- Missing dependencies after the architecture migration

This troubleshooting guide should resolve the majority of deployment issues encountered.