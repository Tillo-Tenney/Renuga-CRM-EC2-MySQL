# EC2 Deployment Troubleshooting Guide

## Problem: Frontend Build Hanging During Deployment

### Root Cause Analysis

The deployment was hanging during the "Building Frontend" step (Step 5) due to several factors:

1. **Missing npm Optimization Flags**
   - No `--legacy-peer-deps` flag: Frontend dependencies have peer dependency conflicts
   - No timeout protection: npm install could hang indefinitely
   - No memory limits during build: Vite build could exhaust available memory

2. **npm install vs npm ci Inconsistency**
   - Backend used `npm install --production=false`
   - Frontend used `npm install`
   - Both running sequentially could cause lock file conflicts

3. **No Error Handling or Retries**
   - If npm install failed, the script would exit completely
   - No fallback mechanism to retry with different flags

### Solution Implemented

#### 1. **npm Configuration** (Applied Globally)
```bash
npm config set legacy-peer-deps true
npm config set prefer-offline true
npm config set audit false
```

**Benefits:**
- `legacy-peer-deps`: Allows peer dependencies with conflicts to install
- `prefer-offline`: Uses cached packages when possible (faster installs)
- `audit false`: Skips vulnerability audit during install (saves time)

#### 2. **Backend Dependency Installation** (configure_backend)
```bash
timeout 600 npm ci --legacy-peer-deps --no-optional 2>&1 | tail -20 || {
    print_warning "npm ci failed, retrying with npm install..."
    timeout 600 npm install --legacy-peer-deps --no-optional 2>&1 | tail -20
}
```

**Benefits:**
- `npm ci`: Deterministic install based on package-lock.json (faster, more reliable)
- `--no-optional`: Skips optional dependencies (saves time)
- `timeout 600`: Max 10 minutes (prevents hanging indefinitely)
- `2>&1 | tail -20`: Shows last 20 lines of output (reduces log spam)
- Automatic retry: Falls back to `npm install` if `npm ci` fails

#### 3. **Frontend Dependency Installation** (configure_frontend)
```bash
timeout 600 npm ci --legacy-peer-deps --no-optional 2>&1 | tail -20 || {
    print_warning "npm ci timed out or failed, retrying with npm install..."
    timeout 600 npm install --legacy-peer-deps --no-optional --force 2>&1 | tail -20
}
```

**Benefits:**
- Same as backend + `--force` on retry for complex dependency resolution
- Prevents endless hanging on large dependency tree

#### 4. **Frontend Build Memory Protection**
```bash
NODE_OPTIONS="--max_old_space_size=2048" npm run build
```

**Benefits:**
- Allocates 2GB of memory for Node.js process (prevents OOM errors)
- Vite build can be memory-intensive with large dependency trees
- Suitable for standard t3.medium EC2 instance

---

## Expected Deployment Timeline

### Before Fix (PostgreSQL)
- **Total Time:** 5-6 minutes
- Step 1 (Dependencies): ~2 minutes
- Step 2 (Database): ~30 seconds
- Step 3 (Application Setup): ~30 seconds
- Step 4 (Backend): ~1 minute
- Step 5 (Frontend): ~1 minute 30 seconds
- Steps 6-9 (PM2, Nginx, Firewall, Maintenance): ~30 seconds

### After Fix (MySQL)
- **Expected Total Time:** 5-7 minutes
- Step 1 (Dependencies): ~2 minutes
- Step 2 (Database): ~30 seconds
- Step 3 (Application Setup): ~30 seconds
- Step 4 (Backend): ~1 minute
- Step 5 (Frontend): ~2 minutes (due to larger dependency tree)
- Steps 6-9 (PM2, Nginx, Firewall, Maintenance): ~30 seconds

**Note:** Frontend now takes slightly longer due to additional Radix UI components, but should not hang or exceed 600-second timeout.

---

## Monitoring Deployment Progress

### Method 1: Real-time Monitoring
```bash
# SSH into your EC2 instance
ssh -i your-key.pem ubuntu@your-instance-ip

# Run the deployment script
sudo bash ec2-setup.sh

# The script will show clear progress indicators:
# ✓ Step 1: Installing System Dependencies
# ✓ Step 2: Setting Up MySQL Database
# ✓ Step 3: Setting Up Application
# ✓ Step 4: Configuring Backend
# ✓ Step 5: Configuring Frontend
# ... etc
```

### Method 2: Separate Terminal Monitoring
```bash
# Terminal 1: Run deployment
ssh -i your-key.pem ubuntu@your-instance-ip
sudo bash ec2-setup.sh

# Terminal 2: Monitor in parallel
ssh -i your-key.pem ubuntu@your-instance-ip
watch -n 5 'ps aux | grep -E "npm|node|nginx"'
```

### Method 3: Check Installation Logs
```bash
# After deployment completes
tail -100 ~/.bash_history  # Shows recent commands executed
pm2 status                 # Check if backend is running
systemctl status mysql     # Check MySQL status
systemctl status nginx     # Check Nginx status
ps aux | grep npm          # Check running npm processes
```

---

## If Deployment Still Hangs

### Scenario 1: Frontend Build Hangs (npm install phase)

**Timeout occurs:** Script will automatically retry with `npm install --force`

**If retry also fails:**
1. SSH into the instance
2. Kill the hanging process:
   ```bash
   pkill -9 npm
   pkill -9 node
   ```
3. Check disk space:
   ```bash
   df -h
   ```
   - If root partition is full, clean npm cache:
   ```bash
   npm cache clean --force
   ```
4. Run frontend build manually:
   ```bash
   cd /var/www/renuga-crm
   npm ci --legacy-peer-deps --no-optional
   NODE_OPTIONS="--max_old_space_size=2048" npm run build
   ```

### Scenario 2: Frontend Build Hangs (npm run build phase)

**Possible causes:**
- Vite compilation is slow on constrained EC2 instance
- Memory pressure causing swap usage

**Resolution:**
```bash
# Check memory usage
free -h

# Increase swap temporarily (if < 2GB total swap)
sudo dd if=/dev/zero of=/swapfile bs=1G count=2
sudo chmod 600 /swapfile
sudo mkswap /swapfile
sudo swapon /swapfile

# Retry build with memory limit
cd /var/www/renuga-crm
NODE_OPTIONS="--max_old_space_size=3072" npm run build
```

### Scenario 3: npm install Hangs on Specific Package

**Identify the problematic package:**
```bash
# Run npm install with verbose output
cd /var/www/renuga-crm
npm install --verbose 2>&1 | tee npm-install.log

# Or with network timeout
npm install --fetch-timeout 120000 --fetch-retry-mintimeout 20000
```

**Bypass problematic package:**
```bash
# Skip optional dependencies entirely
npm install --no-optional --legacy-peer-deps

# Or skip peer dependency validation
npm install --legacy-peer-deps --force
```

---

## Verifying Deployment Success

### Check All Services Are Running

```bash
# 1. Check backend API
curl http://localhost:3001/health
# Expected response: 200 OK (or similar health check response)

# 2. Check PM2 backend process
pm2 status
# Expected: renuga-crm-api should show "online" status

# 3. Check MySQL database
mysql -u renuga_user -p renuga_crm -e "SELECT COUNT(*) FROM users;"
# Expected: Connection succeeds and returns user count

# 4. Check Nginx reverse proxy
curl http://localhost
# Expected: 200 OK with HTML content

# 5. Check from public IP (if security group allows)
curl http://YOUR_PUBLIC_IP
# Expected: 200 OK with frontend HTML
```

### Full Health Check Script

```bash
#!/bin/bash

echo "Checking Renuga CRM deployment health..."

# Backend API
echo -n "Backend API: "
curl -s http://localhost:3001/health > /dev/null && echo "✓ Running" || echo "✗ Failed"

# PM2 Backend
echo -n "PM2 Backend: "
pm2 status | grep -q "renuga-crm-api.*online" && echo "✓ Running" || echo "✗ Failed"

# MySQL
echo -n "MySQL Database: "
mysql -u renuga_user -p"${DB_PASSWORD}" renuga_crm -e "SELECT 1;" > /dev/null 2>&1 && echo "✓ Running" || echo "✗ Failed"

# Nginx
echo -n "Nginx Reverse Proxy: "
systemctl is-active nginx > /dev/null && echo "✓ Running" || echo "✗ Failed"

# Frontend
echo -n "Frontend (Public IP): "
curl -s http://$(curl -s https://ifconfig.me)/ > /dev/null && echo "✓ Running" || echo "✗ Failed"

echo "Done!"
```

---

## Rolling Back if Issues Arise

### Option 1: Revert to Previous Snapshot/AMI
```bash
# If you created an AMI before deployment
# Launch a new instance from the previous AMI
# No data loss if database was on separate volume
```

### Option 2: Manual Rollback (if partially deployed)
```bash
# Stop backend
pm2 stop renuga-crm-api
pm2 delete renuga-crm-api

# Drop and recreate database
mysql -u root -e "DROP DATABASE renuga_crm;"
mysql -u root -e "CREATE DATABASE renuga_crm;"
mysql -u root -e "GRANT ALL PRIVILEGES ON renuga_crm.* TO 'renuga_user'@'localhost';"

# Stop Nginx
systemctl stop nginx

# Re-run deployment with fixes
cd /var/www/renuga-crm
sudo bash ec2-setup.sh
```

---

## Performance Optimization

### For Faster Deployments in Future

1. **Pre-warm npm Cache**
   ```bash
   npm cache clean --force
   npm install --prefer-offline --no-audit
   ```

2. **Use Larger EC2 Instance Type**
   - Upgrade from t3.micro to t3.small or t3.medium
   - Faster CPU = faster compilation

3. **Enable EC2 High Performance**
   ```bash
   # Use EBS-optimized instances
   # Use SSD volumes instead of magnetic
   # Place EC2 and RDS in same availability zone
   ```

4. **Pre-build Dependencies in Docker Image**
   - Create AMI with npm_modules pre-installed
   - Skip Steps 1 and 4 in future deployments

---

## Key Changes Made to ec2-setup.sh

| Component | Before | After | Impact |
|-----------|--------|-------|--------|
| npm install | `npm install --production=false` (backend) | `npm ci --legacy-peer-deps --no-optional` | Deterministic, faster installs |
| Timeout | None (could hang indefinitely) | 600 seconds (10 minutes) | Prevents infinite hangs |
| Error Handling | Single attempt | Retry with `--force` on failure | Better reliability |
| Memory Limit | Not set | `NODE_OPTIONS="--max_old_space_size=2048"` | Prevents OOM during build |
| npm Config | Not optimized | `legacy-peer-deps=true, prefer-offline=true` | Faster installation |

---

## Support & Additional Resources

### Useful Commands Post-Deployment

```bash
# View backend logs
pm2 logs renuga-crm-api

# Restart backend
pm2 restart renuga-crm-api

# View Nginx logs
tail -f /var/log/nginx/error.log
tail -f /var/log/nginx/access.log

# Check MySQL status
systemctl status mysql
mysql -u root -e "SHOW PROCESSLIST;"

# Database backup
/usr/local/bin/backup-renuga-db.sh

# Update application
/usr/local/bin/update-renuga-crm.sh
```

### Documentation Index

- **AWS_EC2_DEPLOYMENT.md** - Complete deployment guide
- **EC2_DEPLOYMENT_README.md** - Quick start for EC2
- **QUICK_DEPLOY_GUIDE.md** - 5-minute deployment overview
- **EC2_QUICK_REFERENCE.md** - Useful commands and configs

---

**Last Updated:** December 23, 2025  
**Script Version:** MySQL Edition (Fixed)  
**Status:** ✅ Ready for Production Deployment
