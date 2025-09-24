# Together App - Quick Troubleshooting Guide

## Quick Diagnostics

### Check System Status
```bash
# Application status
sudo -u together pm2 status

# Service status  
sudo systemctl status nginx postgresql

# Application logs
sudo -u together pm2 logs together --lines 50

# System resources
free -h && df -h
```

### Common Issues & Quick Fixes

#### 🚫 Application Won't Start
```bash
# Check and fix
sudo -u together pm2 logs together
cd /opt/together && sudo -u together npm run build
sudo -u together pm2 restart together
```

#### 🔗 Database Connection Failed  
```bash
# Local PostgreSQL
sudo systemctl restart postgresql
sudo -u postgres psql -c "SELECT version();"

# Test app database connection
cd /opt/together && sudo -u together npm run db:push
```

#### 🌐 502 Bad Gateway (Nginx)
```bash
# Check if app is running on port 3000
netstat -tlnp | grep :3000

# Restart services
sudo -u together pm2 restart together
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
sudo -u together pm2 logs together | grep -i "memory\|heap"

# Increase memory limit
sudo -u together nano /opt/together/ecosystem.config.js
# Change: max_memory_restart: '2G'
sudo -u together pm2 restart together
```

#### 🔑 Permission Errors
```bash
# Fix permissions
sudo chown -R together:together /opt/together
sudo chmod 600 /opt/together/.env
```

### Emergency Commands

#### Stop Everything
```bash
sudo -u together pm2 delete together
sudo systemctl stop nginx
sudo systemctl stop postgresql  # if local
```

#### Restart Everything  
```bash
sudo systemctl start postgresql  # if local
sudo systemctl start nginx
cd /opt/together && sudo -u together pm2 start ecosystem.config.js
```

#### View All Logs
```bash
# Application
sudo -u together pm2 logs together

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
echo "=== Together App Health Check ==="

echo -n "App Status: "
if sudo -u together pm2 list | grep -q "together.*online"; then
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
if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200\|404"; then
    echo "✅ Responding"
else
    echo "❌ No Response"
fi

echo -n "Database Connection: "
if cd /opt/together && sudo -u together timeout 10 npm run db:push &>/dev/null; then
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
sudo -u together pm2 monit

# Restart if needed
sudo -u together pm2 restart together
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
sudo -u together pm2 delete together

# Restore database
sudo -u postgres dropdb together_db --if-exists
sudo -u postgres createdb together_db -O together_user
gunzip -c /backup/together/db_YYYYMMDD.sql.gz | sudo -u postgres psql together_db

# Restore application files
sudo rm -rf /opt/together/*
sudo tar -xzf /backup/together/app_YYYYMMDD.tar.gz -C /opt/

# Start application
cd /opt/together && sudo -u together pm2 start ecosystem.config.js
```

#### Reset to Defaults
```bash
# Reset database
cd /opt/together
sudo -u together npm run db:push --force

# Reset admin user (creates default admin@example.com / admin123)
sudo -u together node -e "
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
sudo -u together pm2 status >> diagnostic.txt  
echo "Recent logs:" >> diagnostic.txt
sudo -u together pm2 logs together --lines 100 >> diagnostic.txt
```

Include `diagnostic.txt` when requesting support.