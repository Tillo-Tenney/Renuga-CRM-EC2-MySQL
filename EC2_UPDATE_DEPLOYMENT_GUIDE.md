# EC2 Update & Deployment Guide

## Overview

This guide provides step-by-step instructions for deploying updates to your existing Renuga CRM web server running on Ubuntu EC2 with Nginx + PM2 + Node.js stack.

**Assumptions:**
- Repo path: `/var/www/renuga-crm`
- Branch: `main`
- Service manager: PM2
- Frontend server: Nginx
- Database: PostgreSQL

---

## Table of Contents

1. [Quick Deployment (5-10 minutes)](#quick-deployment)
2. [Detailed Deployment Steps](#detailed-deployment-steps)
3. [Zero-Downtime Deployment](#zero-downtime-deployment)
4. [Rollback Strategy](#rollback-strategy)
5. [Troubleshooting](#troubleshooting)
6. [Automation Scripts](#automation-scripts)
7. [EC2 Setup Script Enhancements](#ec2-setup-script-enhancements)

---

## Quick Deployment

### One-Command Deployment (Fastest)

Copy and paste this command on your EC2 instance:

```bash
cd /var/www/renuga-crm && \
git pull origin main && \
npm install && \
cd server && npm install && npm run build && cd .. && \
npm run build && \
pm2 restart ecosystem.config.cjs && \
pm2 save && \
echo "✓ Deployment complete" || echo "✗ Deployment failed"
```

### Manual Step-by-Step (Recommended for first time)

Follow the sections below for detailed explanations and safety checks.

---

## Detailed Deployment Steps

### Step 1: SSH into EC2 Instance

```bash
ssh -i /path/to/key.pem ubuntu@your-ec2-public-ip
# or
ssh -i /path/to/key.pem ec2-user@your-ec2-instance
```

**For Windows PowerShell:**
```powershell
ssh -i "C:\path\to\key.pem" ubuntu@your-ec2-public-ip
```

---

### Step 2: Navigate to Repository

```bash
cd /var/www/renuga-crm
pwd  # Verify you're in the correct directory
```

**Output should be:** `/var/www/renuga-crm`

---

### Step 3: Pull Latest Changes from GitHub

```bash
# Ensure you're on the main branch
git branch  # Should show * main

# Fetch latest updates
git fetch origin main

# Pull changes
git pull origin main

# Verify the pull
git log --oneline -5  # Shows last 5 commits
```

**Common issues:**
- If you get "Permission denied", you may need to generate and add SSH keys to GitHub
- If git shows uncommitted changes, see [Handling Local Changes](#handling-local-changes)

---

### Step 4: Backup Current Version (Before Update)

```bash
# Create timestamped backup
BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
cp -r /var/www/renuga-crm /var/www/renuga-crm.backup.$BACKUP_DATE
echo "Backup created: /var/www/renuga-crm.backup.$BACKUP_DATE"

# Keep only last 3 backups (optional cleanup)
ls -td /var/www/renuga-crm.backup.* | tail -n +4 | xargs rm -rf
```

---

### Step 5: Install/Update Frontend Dependencies

```bash
# Navigate to root directory
cd /var/www/renuga-crm

# Clear cache (optional but recommended)
rm -rf node_modules package-lock.json

# Install dependencies
npm install

# Verify installation
npm list | head -20
```

**Expected output:**
```
renuga-crm@0.0.0 /var/www/renuga-crm
├── @hookform/resolvers@3.10.0
├── @radix-ui/react-accordion@1.2.11
... (more dependencies)
```

---

### Step 6: Build Frontend

```bash
npm run build

# Check build output
ls -la dist/
```

**Expected:**
- `dist/` folder created with:
  - `index.html`
  - `assets/` folder with JS/CSS bundles
  - `robots.txt`

**If build fails:**
```bash
npm run build:dev  # Try development build for debugging
npm run lint      # Check for linting errors
```

---

### Step 7: Install/Update Backend Dependencies

```bash
cd /var/www/renuga-crm/server

# Clear cache
rm -rf node_modules package-lock.json

# Install dependencies (production + dev for build)
npm install

# Verify installation
npm list | head -20
```

---

### Step 8: Build Backend

```bash
# Compile TypeScript to JavaScript
npm run build

# Verify build output
ls -la dist/
echo "✓ Backend compiled"
```

**Expected:** `dist/` folder with compiled `.js` files

---

### Step 9: Database Migrations (If Needed)

```bash
# Run migrations
npm run db:migrate

# Check for errors
echo $?  # Should return 0 for success
```

**Skip this if you haven't added new migrations**

---

### Step 10: Stop Current Services (Zero-Downtime Approach)

```bash
# Method 1: Graceful restart with PM2
cd /var/www/renuga-crm
pm2 restart ecosystem.config.cjs --wait-ready --listen-timeout 5000

# OR Method 2: Manual stop for more control
pm2 stop ecosystem.config.cjs
sleep 2
```

**Verify services stopped:**
```bash
pm2 list
pm2 logs renuga-crm-api --lines 50
```

---

### Step 11: Start Backend with New Build

```bash
# Verify backend is serving
curl http://localhost:3001/health 2>/dev/null || echo "Health check endpoint not found"

# If PM2 is still running, verify API is responding
sleep 3
curl http://localhost:3001/ 2>/dev/null | head -c 100
```

---

### Step 12: Reload Nginx (Frontend)

```bash
# Test Nginx configuration
sudo nginx -t

# Output should show:
# nginx: the configuration file /etc/nginx/nginx.conf syntax is ok
# nginx: configuration file /etc/nginx/nginx.conf test is successful

# Reload Nginx (zero-downtime)
sudo systemctl reload nginx

# Verify Nginx is running
sudo systemctl status nginx
```

---

### Step 13: Verify Deployment

```bash
# Check PM2 status
pm2 list

# Expected output:
# ┌────┬───────────────────┬──────────┬──────┬─────────┬──────────┐
# │ id │ name              │ mode     │ ↺    │ status  │ cpu   %  │
# ├────┼───────────────────┼──────────┼──────┼─────────┼──────────┤
# │ 0  │ renuga-crm-api    │ fork     │ 0    │ online  │ 0.0      │
# └────┴───────────────────┴──────────┴──────┴─────────┴──────────┘

# Check Nginx status
sudo systemctl status nginx

# Test frontend is serving
curl http://localhost/ | head -c 50
# Should see: <!doctype html><html...

# Test API is responding
curl http://localhost:3001/api/health 2>/dev/null || curl http://localhost/api/health
```

---

### Step 14: Save PM2 Configuration

```bash
# Save current PM2 state for auto-restart on reboot
pm2 save

# Verify PM2 startup is configured
pm2 startup
```

---

## Zero-Downtime Deployment

### Blue-Green Deployment Strategy

For critical updates, use this approach:

**Phase 1: Prepare New Version**

```bash
cd /var/www/renuga-crm

# Create temporary build directory
mkdir -p /var/www/renuga-crm-new
cp -r ./* /var/www/renuga-crm-new/

cd /var/www/renuga-crm-new

# Build in isolation
npm install && npm run build
cd server && npm install && npm run build && cd ..

# Run tests if available
npm run lint || true
```

**Phase 2: Health Check New Version**

```bash
# Start on temporary port
PM2_PORT=3002 pm2 start ecosystem.config.cjs --name "renuga-crm-api-new" --cwd /var/www/renuga-crm-new/server

# Test new backend
curl http://localhost:3002/health

# If successful, stop temp instance
pm2 stop renuga-crm-api-new
pm2 delete renuga-crm-api-new
```

**Phase 3: Switch Traffic**

```bash
# Stop old instance gracefully
pm2 stop renuga-crm-api
sleep 1

# Move new to production
rm -rf /var/www/renuga-crm-old
mv /var/www/renuga-crm /var/www/renuga-crm-old
mv /var/www/renuga-crm-new /var/www/renuga-crm

# Start new instance
pm2 start ecosystem.config.cjs

# Verify
pm2 list
```

---

## Rollback Strategy

### Quick Rollback (Under 2 minutes)

**Option 1: Restore from Backup**

```bash
# List available backups
ls -td /var/www/renuga-crm.backup.* | head -5

# Restore most recent
LATEST_BACKUP=$(ls -td /var/www/renuga-crm.backup.* | head -1)
echo "Restoring from: $LATEST_BACKUP"

# Stop services
pm2 stop ecosystem.config.cjs

# Restore backup
rm -rf /var/www/renuga-crm
cp -r "$LATEST_BACKUP" /var/www/renuga-crm

# Restart services
pm2 restart ecosystem.config.cjs --wait-ready

# Reload Nginx
sudo nginx -t && sudo systemctl reload nginx

echo "✓ Rollback complete"
```

**Option 2: Git Revert**

```bash
cd /var/www/renuga-crm

# View recent commits
git log --oneline -10

# Revert to previous commit
git revert HEAD --no-edit
# OR go back to specific commit
git reset --hard abc1234def5678

# Rebuild and restart
npm install && npm run build
cd server && npm install && npm run build && cd ..
pm2 restart ecosystem.config.cjs
```

**Option 3: Keep Multiple Releases**

```bash
# Create releases directory
mkdir -p /var/www/releases

# Each deployment gets a release directory
RELEASE_ID=$(date +%Y%m%d_%H%M%S)
cp -r /var/www/renuga-crm /var/www/releases/$RELEASE_ID

# Symlink current to production
ln -sfn /var/www/releases/$RELEASE_ID /var/www/renuga-crm-current
ln -sfn /var/www/renuga-crm-current /var/www/renuga-crm

# Cleanup old releases (keep last 5)
cd /var/www/releases
ls -td */ | tail -n +6 | xargs rm -rf
```

---

## Troubleshooting

### Common Issues

#### 1. Permission Denied Errors

```bash
# Fix permissions
sudo chown -R ubuntu:ubuntu /var/www/renuga-crm
sudo chown -R ubuntu:ubuntu /var/log/pm2

# Verify
ls -la /var/www/ | grep renuga-crm
```

#### 2. Port Already in Use

```bash
# Find process using port 3001
sudo lsof -i :3001
# or
sudo netstat -tuln | grep 3001

# Kill process gracefully
pm2 kill
sleep 2
pm2 start ecosystem.config.cjs
```

#### 3. Database Connection Errors

```bash
# Check database status
sudo systemctl status postgresql

# View backend logs
pm2 logs renuga-crm-api --lines 100

# Verify database exists
sudo -u postgres psql -l | grep renuga_crm

# Check .env file
cat /var/www/renuga-crm/server/.env
```

#### 4. Build Failures

```bash
# Clear all caches
cd /var/www/renuga-crm
rm -rf node_modules dist .next/.cache package-lock.json
rm -rf server/node_modules server/dist

# Rebuild with verbose logging
npm install --verbose
npm run build 2>&1 | tee build.log

# Check for TypeScript errors
cd server
npx tsc --noEmit

# View build errors
tail -100 build.log
```

#### 5. Nginx Not Serving Frontend

```bash
# Verify Nginx config
sudo nginx -t

# Check Nginx logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log

# Verify dist folder exists and has content
ls -la /var/www/renuga-crm/dist/

# Check Nginx is listening
sudo netstat -tuln | grep 80
sudo lsof -i :80
```

#### 6. Services Don't Start on Reboot

```bash
# Verify PM2 startup hook
pm2 startup

# Output shows command to run, copy and paste:
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u ubuntu --hp /home/ubuntu

# Then save:
pm2 save

# Verify Nginx auto-start
sudo systemctl enable nginx
sudo systemctl status nginx
```

#### 7. Handling Local Changes

```bash
# If you have uncommitted changes preventing pull:

# Option 1: Stash changes (keep them)
git stash
git pull origin main

# Option 2: Discard changes
git reset --hard origin/main
git pull origin main

# Option 3: Merge with local changes
git pull origin main --no-ff
```

---

## Automation Scripts

### Create a Deployment Script

Create `/var/www/renuga-crm/deploy.sh`:

```bash
#!/bin/bash

###############################################################################
# Renuga CRM - Update Deployment Script
# Usage: ./deploy.sh [--skip-backup] [--rollback]
###############################################################################

set -e  # Exit on error

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuration
APP_DIR="/var/www/renuga-crm"
BACKUP_DIR="/var/www/renuga-crm.backup"
LOG_FILE="/var/log/renuga-crm-deploy.log"

# Functions
log_info() {
    echo -e "${BLUE}ℹ $1${NC}" | tee -a "$LOG_FILE"
}

log_success() {
    echo -e "${GREEN}✓ $1${NC}" | tee -a "$LOG_FILE"
}

log_error() {
    echo -e "${RED}✗ $1${NC}" | tee -a "$LOG_FILE"
}

log_warning() {
    echo -e "${YELLOW}⚠ $1${NC}" | tee -a "$LOG_FILE"
}

check_requirements() {
    log_info "Checking requirements..."
    
    # Check if running from correct directory
    if [ ! -f "$APP_DIR/package.json" ]; then
        log_error "package.json not found in $APP_DIR"
        exit 1
    fi
    
    # Check if git is available
    if ! command -v git &> /dev/null; then
        log_error "git is not installed"
        exit 1
    fi
    
    # Check if npm is available
    if ! command -v npm &> /dev/null; then
        log_error "npm is not installed"
        exit 1
    fi
    
    # Check if pm2 is available
    if ! command -v pm2 &> /dev/null; then
        log_error "pm2 is not installed"
        exit 1
    fi
    
    log_success "All requirements met"
}

create_backup() {
    if [ "$SKIP_BACKUP" == "true" ]; then
        log_warning "Skipping backup (--skip-backup flag set)"
        return
    fi
    
    log_info "Creating backup..."
    BACKUP_DATE=$(date +%Y%m%d_%H%M%S)
    BACKUP_PATH="$BACKUP_DIR.$BACKUP_DATE"
    
    cp -r "$APP_DIR" "$BACKUP_PATH"
    log_success "Backup created: $BACKUP_PATH"
    
    # Keep only last 3 backups
    ls -td "$BACKUP_DIR".* 2>/dev/null | tail -n +4 | xargs rm -rf
}

pull_changes() {
    log_info "Pulling latest changes from GitHub..."
    cd "$APP_DIR"
    
    # Verify on main branch
    CURRENT_BRANCH=$(git rev-parse --abbrev-ref HEAD)
    if [ "$CURRENT_BRANCH" != "main" ]; then
        log_error "Not on main branch. Current: $CURRENT_BRANCH"
        exit 1
    fi
    
    # Fetch and pull
    git fetch origin main
    git pull origin main
    
    LATEST_COMMIT=$(git log -1 --pretty=format:"%h - %s")
    log_success "Changes pulled: $LATEST_COMMIT"
}

build_frontend() {
    log_info "Building frontend..."
    cd "$APP_DIR"
    
    npm install || {
        log_error "Frontend dependency installation failed"
        exit 1
    }
    
    npm run build || {
        log_error "Frontend build failed"
        exit 1
    }
    
    log_success "Frontend built successfully"
}

build_backend() {
    log_info "Building backend..."
    cd "$APP_DIR/server"
    
    npm install || {
        log_error "Backend dependency installation failed"
        exit 1
    }
    
    npm run build || {
        log_error "Backend build failed"
        exit 1
    }
    
    log_success "Backend built successfully"
}

restart_services() {
    log_info "Restarting services..."
    cd "$APP_DIR"
    
    pm2 restart ecosystem.config.cjs --wait-ready --listen-timeout 5000 || {
        log_error "Failed to restart services"
        exit 1
    }
    
    pm2 save
    log_success "Services restarted and saved"
}

reload_nginx() {
    log_info "Reloading Nginx..."
    
    sudo nginx -t || {
        log_error "Nginx configuration test failed"
        exit 1
    }
    
    sudo systemctl reload nginx || {
        log_error "Failed to reload Nginx"
        exit 1
    }
    
    log_success "Nginx reloaded successfully"
}

verify_deployment() {
    log_info "Verifying deployment..."
    
    # Wait for services to start
    sleep 2
    
    # Check PM2 status
    if ! pm2 list | grep -q "online"; then
        log_error "Services not running"
        exit 1
    fi
    
    # Check API health
    if ! curl -s http://localhost:3001/ > /dev/null 2>&1; then
        log_warning "Could not verify API health (may be normal if health endpoint not implemented)"
    fi
    
    # Check Nginx is running
    if ! sudo systemctl is-active --quiet nginx; then
        log_error "Nginx is not running"
        exit 1
    fi
    
    log_success "Deployment verified"
}

rollback() {
    log_warning "Rolling back to previous version..."
    
    # Get latest backup
    LATEST_BACKUP=$(ls -td "$BACKUP_DIR".* 2>/dev/null | head -1)
    
    if [ -z "$LATEST_BACKUP" ]; then
        log_error "No backup found for rollback"
        exit 1
    fi
    
    log_info "Restoring from: $LATEST_BACKUP"
    
    # Stop services
    pm2 stop ecosystem.config.cjs
    
    # Restore
    rm -rf "$APP_DIR"
    cp -r "$LATEST_BACKUP" "$APP_DIR"
    
    # Restart
    pm2 restart ecosystem.config.cjs
    sudo systemctl reload nginx
    
    log_success "Rollback complete"
}

# Parse arguments
SKIP_BACKUP=false
while [[ $# -gt 0 ]]; do
    case $1 in
        --skip-backup)
            SKIP_BACKUP=true
            shift
            ;;
        --rollback)
            rollback
            exit 0
            ;;
        *)
            log_error "Unknown option: $1"
            exit 1
            ;;
    esac
done

# Main execution
{
    log_info "=== Renuga CRM Deployment Started ==="
    log_info "Time: $(date)"
    
    check_requirements
    create_backup
    pull_changes
    build_frontend
    build_backend
    restart_services
    reload_nginx
    verify_deployment
    
    log_success "=== Deployment Complete ==="
    log_info "Time: $(date)"
} 2>&1 | tee -a "$LOG_FILE"
```

### Make Script Executable

```bash
chmod +x /var/www/renuga-crm/deploy.sh
```

### Use the Script

```bash
# Regular deployment
./deploy.sh

# Skip backup (fast)
./deploy.sh --skip-backup

# Rollback to previous
./deploy.sh --rollback
```

---

## EC2 Setup Script Enhancements

### Separate First-Time Setup from Updates

Your existing `ec2-setup.sh` should be split into two scripts:

**1. `ec2-setup.sh` - Initial Setup Only**

Use as-is for first-time deployment. It handles:
- System dependencies
- Database setup
- PM2 configuration
- Nginx configuration

**2. Create New `ec2-update.sh` - Update Deployments**

See the automation script above, or use it directly:

```bash
# Quick update script
#!/bin/bash
set -e

APP_DIR="/var/www/renuga-crm"
cd "$APP_DIR"

echo "Pulling changes..."
git pull origin main

echo "Building frontend..."
npm install && npm run build

echo "Building backend..."
cd server && npm install && npm run build && cd ..

echo "Restarting services..."
pm2 restart ecosystem.config.cjs
pm2 save

echo "Reloading Nginx..."
sudo nginx -t && sudo systemctl reload nginx

echo "✓ Update complete"
```

---

## Environment Variable Management

### Ensure `.env` Files Are Preserved

Update `ec2-setup.sh` to protect `.env` files:

```bash
# Before pulling changes
if [ -f "$APP_DIR/server/.env" ]; then
    cp "$APP_DIR/server/.env" /tmp/server.env.backup
fi

# After pulling changes
if [ -f /tmp/server.env.backup ]; then
    cp /tmp/server.env.backup "$APP_DIR/server/.env"
fi
```

### Check Current Environment

```bash
# View all environment variables
env | grep -E "(DATABASE_URL|JWT_SECRET|NODE_ENV|PORT)"

# View specific .env file
cat /var/www/renuga-crm/server/.env | head -10

# Update an environment variable
nano /var/www/renuga-crm/server/.env
# After editing, restart services
pm2 restart ecosystem.config.cjs
```

---

## Monitoring & Logs

### View Service Logs

```bash
# Real-time logs
pm2 logs renuga-crm-api

# Last 100 lines
pm2 logs renuga-crm-api --lines 100

# Save logs to file
pm2 logs renuga-crm-api > api.log 2>&1

# Nginx logs
sudo tail -50 /var/log/nginx/error.log
sudo tail -50 /var/log/nginx/access.log
```

### Monitor Performance

```bash
# PM2 monitoring
pm2 monit

# Check memory usage
pm2 show renuga-crm-api

# System resources
free -h
df -h
top -b -n 1 | head -20
```

---

## Command Reference

### Quick Commands

```bash
# Navigate to app
cd /var/www/renuga-crm

# Check git status
git status
git log --oneline -5

# Check services
pm2 list
pm2 stop renuga-crm-api
pm2 start renuga-crm-api
pm2 restart renuga-crm-api
pm2 delete renuga-crm-api

# Check Nginx
sudo systemctl status nginx
sudo systemctl restart nginx
sudo nginx -t

# Check database
sudo systemctl status postgresql
sudo -u postgres psql -l

# View logs
pm2 logs
pm2 logs renuga-crm-api --lines 50
tail -f /var/log/nginx/error.log

# Health checks
curl http://localhost:3001
curl http://localhost/

# Backup/Restore
cp -r /var/www/renuga-crm /var/www/renuga-crm.backup.$(date +%Y%m%d_%H%M%S)
rm -rf /var/www/renuga-crm
cp -r /var/www/renuga-crm.backup.20240101_120000 /var/www/renuga-crm
```

---

## Troubleshooting Checklist

Before deployment:
- [ ] Tested changes locally
- [ ] All tests passing
- [ ] Committed all changes to git
- [ ] Created backup (automatic with deploy.sh)
- [ ] Checked git log for what's being deployed

During deployment:
- [ ] Pull succeeds without conflicts
- [ ] Build succeeds without errors
- [ ] Services restart successfully
- [ ] No errors in logs

After deployment:
- [ ] Frontend loads (check http://your-ip/)
- [ ] API responds (check logs with `pm2 logs`)
- [ ] Database queries work (check logs for errors)
- [ ] All features work as expected
- [ ] Performance is acceptable

---

## Support & Additional Resources

- **PM2 Documentation**: https://pm2.io/docs
- **Nginx Documentation**: https://nginx.org/en/docs/
- **Node.js Best Practices**: https://nodejs.org/en/docs/guides/nodejs-docker-webapp/
- **PostgreSQL Documentation**: https://www.postgresql.org/docs/

---

**Last Updated:** December 21, 2025  
**Version:** 1.0  
**Maintainer:** Renuga CRM Team
