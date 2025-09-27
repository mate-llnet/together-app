# AppreciateMate v1.1.0-Beta - Quick Troubleshooting Guide

## Quick Diagnostics

### Check System Status
```bash
# Application status
sudo -u appreciatemate pm2 status

# Service status  
sudo systemctl status nginx postgresql

# Application logs
sudo -u appreciatemate pm2 logs appreciatemate --lines 50

# System resources
free -h && df -h
```

### Common Issues & Quick Fixes

#### 🚫 Application Won't Start
```bash
# Check and fix
sudo -u appreciatemate pm2 logs appreciatemate
cd /opt/appreciatemate && sudo -u appreciatemate npm run build
sudo -u appreciatemate pm2 restart appreciatemate
```

#### 🔗 Database Connection Failed  
```bash
# Local PostgreSQL
sudo systemctl restart postgresql
sudo -u postgres psql -c "SELECT version();"

# Test app database connection
cd /opt/appreciatemate && sudo -u appreciatemate npm run db:push
```

#### 🌐 502 Bad Gateway (Nginx)
```bash
# Check if app is running on port 5000
netstat -tlnp | grep :5000

# Restart services
sudo -u appreciatemate pm2 restart appreciatemate
sudo systemctl restart nginx
```

#### 🔒 SSL Certificate Issues
```bash
# Renew certificates
sudo certbot renew --force-renewal
sudo systemctl restart nginx
```

#### 💾 Out of Memory
```bash
# Check memory usage
free -h
sudo -u appreciatemate pm2 logs appreciatemate | grep -i "memory\|heap"

# Increase memory limit
sudo -u appreciatemate nano /opt/appreciatemate/ecosystem.config.cjs
# Change: max_memory_restart: '2G'
sudo -u appreciatemate pm2 restart appreciatemate
```

#### 🔑 Permission Errors
```bash
# Fix permissions
sudo chown -R appreciatemate:appreciatemate /opt/appreciatemate
sudo chmod 600 /opt/appreciatemate/.env
```

### Emergency Commands

#### Stop Everything
```bash
sudo -u appreciatemate pm2 delete appreciatemate
sudo systemctl stop nginx
sudo systemctl stop postgresql  # if local
```

#### Restart Everything  
```bash
sudo systemctl start postgresql  # if local
sudo systemctl start nginx
cd /opt/appreciatemate && sudo -u appreciatemate pm2 start ecosystem.config.cjs
```

#### View All Logs
```bash
# Application
sudo -u appreciatemate pm2 logs appreciatemate

# Nginx
sudo tail -f /var/log/nginx/error.log

# PostgreSQL  
sudo tail -f /var/log/postgresql/postgresql-*-main.log

# System
sudo journalctl -f
```

### Quick Health Check
```bash
#!/bin/bash
echo "=== AppreciateMate Health Check ==="

echo -n "App Status: "
if sudo -u appreciatemate pm2 list | grep -q "appreciatemate.*online"; then
    echo "✅ Running"
else
    echo "❌ Not Running"
fi

echo -n "Nginx Status: "
if systemctl is-active --quiet nginx; then
    echo "✅ Active"  
else
    echo "❌ Inactive"
fi

echo -n "PostgreSQL Status: "
if systemctl is-active --quiet postgresql; then
    echo "✅ Active"
else
    echo "❌ Inactive"  
fi

echo -n "HTTP Response: "
if curl -s -o /dev/null -w "%{http_code}" http://localhost:5000 | grep -q "200\|404"; then
    echo "✅ Responding"
else
    echo "❌ No Response"
fi

echo -n "Database Connection: "
if cd /opt/appreciatemate && sudo -u appreciatemate timeout 10 npm run db:push &>/dev/null; then
    echo "✅ Connected"
else
    echo "❌ Connection Failed"  
fi

echo "======================="
```

### Performance Quick Fixes

#### High CPU
```bash
# Check processes
htop
sudo -u appreciatemate pm2 monit

# Restart if needed
sudo -u appreciatemate pm2 restart appreciatemate
```

#### Slow Response
```bash
# Check database queries
sudo tail -f /var/log/postgresql/postgresql-*-main.log | grep "duration:"

# Enable query logging temporarily
sudo -u postgres psql -c "ALTER SYSTEM SET log_min_duration_statement = 1000;"
sudo systemctl restart postgresql
```

### Recovery Procedures

#### From Backup
```bash
# Stop application
sudo -u appreciatemate pm2 delete appreciatemate

# Restore database
sudo -u postgres dropdb appreciatemate_db --if-exists
sudo -u postgres createdb appreciatemate_db -O appreciatemate_user
gunzip -c /backup/appreciatemate/db_YYYYMMDD.sql.gz | sudo -u postgres psql appreciatemate_db

# Restore application files
# ⚠️  DANGER: This will permanently delete all application files!
# Only run this if you have verified backups and are absolutely sure!
# Uncomment the line below only after double-checking your backup path:
# sudo rm -rf /opt/appreciatemate/*
sudo tar -xzf /backup/appreciatemate/app_YYYYMMDD.tar.gz -C /opt/

# Start application
cd /opt/appreciatemate && sudo -u appreciatemate pm2 start ecosystem.config.cjs
```

#### Reset to Defaults
```bash
# Reset database
cd /opt/appreciatemate
sudo -u appreciatemate npm run db:push --force

# Reset admin user (creates default admin@example.com / admin123)
sudo -u appreciatemate node -e "
const { seedAdminUser } = require('./server/services/seed-admin.ts');
seedAdminUser().then(() => console.log('Admin reset complete'));
"
```

### Contact Information

If issues persist, gather this information:

```bash
# System info
uname -a > diagnostic.txt
echo "Services:" >> diagnostic.txt  
sudo systemctl status nginx postgresql >> diagnostic.txt
echo "Application:" >> diagnostic.txt
sudo -u appreciatemate pm2 status >> diagnostic.txt  
echo "Recent logs:" >> diagnostic.txt
sudo -u appreciatemate pm2 logs appreciatemate --lines 100 >> diagnostic.txt
```

Include `diagnostic.txt` when requesting support.