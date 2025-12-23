# Complete EC2 Update & Deployment Package

## 📋 Overview

You now have a complete deployment system for your Renuga CRM EC2 instance. This package includes:

1. **Comprehensive Deployment Guide** (`EC2_UPDATE_DEPLOYMENT_GUIDE.md`)
   - Step-by-step deployment process
   - Zero-downtime deployment strategies
   - Rollback procedures
   - Troubleshooting guides

2. **Automated Deployment Script** (`deploy.sh`)
   - One-command deployment
   - Automatic backups
   - Health checks
   - Error handling & rollback

3. **PM2 Configuration** (`ecosystem.config.cjs`)
   - Optimized process management
   - Logging configuration
   - Auto-restart settings

4. **Quick Reference** (`EC2_QUICK_REFERENCE.md`)
   - Copy-paste commands
   - Common troubleshooting
   - Quick status checks

---

## 🚀 Quick Start (5 minutes)

### On Your Local Machine

Commit these new files and push to GitHub:

```bash
git add EC2_UPDATE_DEPLOYMENT_GUIDE.md deploy.sh ecosystem.config.cjs EC2_QUICK_REFERENCE.md
git commit -m "docs: Add comprehensive EC2 deployment documentation and automation"
git push origin main
```

### On Your EC2 Instance

Pull the changes and set up the deployment script:

```bash
cd /var/www/renuga-crm
git pull origin main
chmod +x deploy.sh

# Test the deployment script
./deploy.sh --help
```

### Deploy Your First Update

```bash
cd /var/www/renuga-crm
./deploy.sh
```

---

## 📚 Documentation Files

### 1. EC2_UPDATE_DEPLOYMENT_GUIDE.md
**Complete deployment manual with:**
- 14 detailed deployment steps
- Blue-green deployment strategy
- 3 rollback methods
- 7 troubleshooting scenarios
- Environment variable management
- Monitoring & logs guide
- Reference commands

**When to use:** 
- First-time deployment
- Understanding the process
- Troubleshooting issues
- Learning best practices

### 2. deploy.sh
**Automated deployment script with:**
- One-command deployment
- Automatic backup creation
- Backup cleanup (keeps last 5)
- Build verification
- Health checks
- Automatic rollback on failure
- Comprehensive logging

**Features:**
```bash
./deploy.sh              # Normal deployment
./deploy.sh --skip-backup    # Fast deployment (no backup)
./deploy.sh --rollback   # Rollback to previous
./deploy.sh --force-rollback # Rollback without confirmation
./deploy.sh --logs       # View deployment logs
./deploy.sh --help       # Show help
```

### 3. ecosystem.config.cjs
**PM2 configuration with:**
- Optimized process settings
- Logging configuration
- Auto-restart settings
- Memory limits
- Graceful shutdown
- Deployment configuration

**Key settings:**
- `instances: 1` - Single process (change to 'max' for clustering)
- `max_memory_restart: '1G'` - Auto-restart if exceeds 1GB
- `kill_timeout: 5000` - Wait 5s before force kill
- `restart_delay: 4000` - Wait 4s between restarts

### 4. EC2_QUICK_REFERENCE.md
**Quick command reference with:**
- One-line deployment commands
- Common service commands
- Troubleshooting quick fixes
- File locations
- Health check commands
- Status check script

---

## 🔄 Deployment Workflow

### Standard Deployment

```
┌─────────────────────────┐
│ 1. Pull from GitHub     │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 2. Create Backup        │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 3. Install Dependencies │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 4. Build Frontend       │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 5. Build Backend        │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 6. Run Migrations       │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 7. Restart Services     │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 8. Reload Nginx         │
└────────────┬────────────┘
             │
┌────────────▼────────────┐
│ 9. Health Checks        │
└────────────┬────────────┘
             │
        ✓ Success ✗ Rollback
```

### Zero-Downtime Deployment

```
Old Version (v1) → Prepare New (v2) → Test → Switch → Success
    Running          Isolated          ✓     Instant   Live
```

---

## 🛡️ Backup Strategy

### Automatic Backups

The `deploy.sh` script automatically:
- Creates a timestamped backup before each deployment
- Keeps the last 5 backups
- Stores them in `/var/www/renuga-crm.backup.YYYYMMDD_HHMMSS/`

### Manual Backup

```bash
# Create backup
cp -r /var/www/renuga-crm /var/www/renuga-crm.backup.$(date +%Y%m%d_%H%M%S)

# List all backups
ls -la /var/www/renuga-crm.backup.*
```

### Restore from Backup

```bash
# Using deploy script
./deploy.sh --rollback

# Manual restore
BACKUP=/var/www/renuga-crm.backup.20240101_120000
pm2 stop ecosystem.config.cjs
rm -rf /var/www/renuga-crm
cp -r $BACKUP /var/www/renuga-crm
pm2 restart ecosystem.config.cjs
sudo systemctl reload nginx
```

---

## 📊 Architecture

```
┌─────────────────────────────────────┐
│     Browser / Client                 │
└────────────┬────────────────────────┘
             │ HTTPS (Port 80/443)
┌────────────▼────────────────────────┐
│        Nginx Reverse Proxy           │
│  - Serves static frontend (/dist)    │
│  - Routes /api to backend            │
│  - SSL/TLS termination              │
│  - Compression & caching            │
└────────────┬────────────────────────┘
             │ HTTP (localhost:3001)
┌────────────▼────────────────────────┐
│   Node.js API (PM2 Managed)          │
│  - Express server                    │
│  - Business logic                    │
│  - Database queries                  │
└────────────┬────────────────────────┘
             │
┌────────────▼────────────────────────┐
│      PostgreSQL Database             │
│  - Data persistence                 │
│  - Migrations                       │
│  - Seeds                            │
└─────────────────────────────────────┘
```

---

## ✅ Checklist for First Deployment

### Before Deployment
- [ ] All changes committed to git
- [ ] Local tests passing
- [ ] Branch is `main`
- [ ] No uncommitted changes
- [ ] SSH key set up for GitHub

### During Deployment
- [ ] SSH into EC2 instance
- [ ] Navigate to `/var/www/renuga-crm`
- [ ] Run `chmod +x deploy.sh`
- [ ] Run `./deploy.sh`
- [ ] Watch logs with `pm2 logs`

### After Deployment
- [ ] Frontend loads: `curl http://localhost/`
- [ ] API responds: `curl http://localhost:3001/`
- [ ] No errors in logs: `pm2 logs --lines 50`
- [ ] Services running: `pm2 list`
- [ ] Nginx healthy: `sudo systemctl status nginx`

### Rollback (if needed)
- [ ] Run `./deploy.sh --rollback`
- [ ] Verify services: `pm2 logs`
- [ ] Test app: `curl http://localhost/`

---

## 🔧 Customization Guide

### Change Repository Path

Edit variables in `deploy.sh`:

```bash
APP_DIR="/path/to/your/app"
BACKUP_DIR="/path/to/backups"
LOG_DIR="/path/to/logs"
MAIN_BRANCH="main"  # or "develop", "staging", etc.
```

### Change PM2 Settings

Edit `ecosystem.config.cjs`:

```javascript
instances: 1,              // Change to 'max' for clustering
max_memory_restart: '1G',  // Change memory limit
max_restarts: 10,          // Change restart limit
restart_delay: 4000,       // Change restart delay
```

### Change Log Locations

Edit `ecosystem.config.cjs`:

```javascript
error_file: '/custom/path/error.log',
out_file: '/custom/path/out.log',
log_file: '/custom/path/combined.log',
```

---

## 📈 Monitoring

### Real-time Monitoring

```bash
# Watch all logs
pm2 logs

# Watch specific service
pm2 logs renuga-crm-api

# Monitor system resources
pm2 monit

# View service details
pm2 show renuga-crm-api
```

### Health Checks

```bash
#!/bin/bash
echo "=== Renuga CRM Health Check ==="

# Frontend
FRONTEND=$(curl -s -w "%{http_code}" -o /dev/null http://localhost/)
echo "Frontend: $FRONTEND"

# API
API=$(curl -s -w "%{http_code}" -o /dev/null http://localhost:3001/)
echo "API: $API"

# Database
DB=$(sudo systemctl is-active postgresql)
echo "Database: $DB"

# Services
pm2 list | grep renuga

# System
echo "Disk Usage:"
df -h | grep root

echo "Memory Usage:"
free -h | grep Mem
```

---

## 🐛 Troubleshooting Guide

### Problem: Services Won't Start

```bash
# 1. Check error log
pm2 logs renuga-crm-api --lines 100

# 2. Verify Node.js is installed
node --version
npm --version

# 3. Kill PM2 and restart
pm2 kill
sleep 2
pm2 start ecosystem.config.cjs

# 4. Check ports
lsof -i :3001
lsof -i :80
```

### Problem: Build Fails

```bash
# 1. Clear caches
rm -rf node_modules dist package-lock.json
rm -rf server/node_modules server/dist

# 2. Install with legacy peer deps flag
npm install --legacy-peer-deps
npm run build

# 3. Check for TypeScript errors
cd server
npx tsc --noEmit
```

### Problem: Git Pull Fails

```bash
# 1. Check git status
git status

# 2. Stash local changes
git stash

# 3. Pull again
git pull origin main

# 4. Apply stashed changes if needed
git stash pop
```

### Problem: Permission Denied

```bash
# Fix ownership
sudo chown -R $(whoami):$(whoami) /var/www/renuga-crm
sudo chown -R $(whoami):$(whoami) /var/log/pm2

# Or if using 'ubuntu' user
sudo chown -R ubuntu:ubuntu /var/www/renuga-crm
```

---

## 🚢 Production Best Practices

### 1. Automated Deployments
- Use GitHub Actions or CI/CD pipeline
- Deploy on merge to main
- Run tests before deployment

### 2. Monitoring
- Set up error tracking (e.g., Sentry)
- Monitor uptime (e.g., Uptime Robot)
- Track performance metrics

### 3. Logging
- Aggregate logs (e.g., ELK Stack)
- Set up alerts for errors
- Archive old logs

### 4. Security
- Use SSH keys (no passwords)
- Enable firewall rules
- Keep dependencies updated
- Use environment variables for secrets

### 5. Backups
- Keep backups off-server
- Test restore procedures
- Document recovery time

### 6. Scaling
- Monitor resource usage
- Plan for growth
- Consider load balancing
- Use read replicas for database

---

## 📞 Support

If you encounter issues:

1. **Check logs:** `pm2 logs renuga-crm-api --lines 100`
2. **Check Nginx:** `sudo tail -50 /var/log/nginx/error.log`
3. **Check services:** `pm2 list`
4. **Try rollback:** `./deploy.sh --rollback`
5. **Read guide:** `EC2_UPDATE_DEPLOYMENT_GUIDE.md`

---

## 📝 Summary

You now have a production-ready deployment system with:

✅ Automated deployment script with error handling  
✅ Automatic backups and cleanup  
✅ Zero-downtime deployment capability  
✅ Automatic rollback on failure  
✅ Comprehensive documentation  
✅ Quick reference guide  
✅ Health checks and monitoring  
✅ Troubleshooting guides  

### Next Steps

1. **Test locally:** Make a small change and test build
2. **Push to GitHub:** Commit and push these files
3. **Pull on EC2:** `cd /var/www/renuga-crm && git pull origin main`
4. **Set up script:** `chmod +x deploy.sh`
5. **Deploy:** `./deploy.sh`

---

**Created:** December 21, 2025  
**Version:** 1.0  
**Status:** Production Ready
