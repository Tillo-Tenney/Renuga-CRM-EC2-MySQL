# API Connection Timeout - Fix & Troubleshooting Guide

## 🔴 Problem

When trying to login, you get:
```
Failed to load resource: net::ERR_CONNECTION_TIMED_OUT :3001/api/auth/login:1
```

**What this means:**
- Browser can load the frontend
- But it CANNOT reach the backend API at `:3001`
- The request times out (no response)

## 🎯 Root Causes (In Order of Likelihood)

### #1: Backend Process Not Running ⚠️ MOST COMMON

The PM2 process crashed or failed to start.

**Quick Check:**
```bash
# SSH into EC2
sudo pm2 list
```

**Look for:**
- ✅ Status should be `online` in green
- ❌ If it says `stopped` or `errored` - this is the problem

### #2: Port 3001 Not Listening

Backend running but not on the right port.

```bash
sudo netstat -tuln | grep 3001
# or
sudo ss -tuln | grep 3001
```

**Expected output:** `LISTEN  127.0.0.1:3001`

### #3: Database Connection Failed

Backend can't connect to MySQL, so it exits.

**Check logs:**
```bash
sudo pm2 logs renuga-crm-api --lines 50
```

### #4: Firewall Blocking

UFW enabled and blocking local connections.

```bash
sudo ufw status
```

---

## 🔧 Step-by-Step Fix

### Step 1: SSH into EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-ec2-public-ip
```

### Step 2: Check Backend Status

```bash
sudo pm2 list
```

**If you see the process:**
- ✅ `online` (green) - Go to Step 4
- ❌ `stopped` - Restart with: `sudo pm2 start ecosystem.config.cjs`
- ❌ `errored` - Check logs with: `sudo pm2 logs renuga-crm-api --lines 100`

**If you don't see `renuga-crm-api`:**
```bash
# Check if ecosystem file exists
ls -la /var/www/renuga-crm/ecosystem.config.cjs

# If not, run deployment again
cd /var/www/renuga-crm
sudo bash ec2-setup.sh
```

### Step 3: Check Backend Logs

```bash
sudo pm2 logs renuga-crm-api --lines 100
```

**Look for these errors:**

#### Error: "ECONNREFUSED" or "connect ECONNREFUSED"
**Cause:** Cannot connect to MySQL database  
**Fix:** 
```bash
# Check MySQL is running
sudo systemctl status mysql

# Check MySQL credentials in .env
sudo cat /var/www/renuga-crm/server/.env | grep DB_

# Test connection
mysql -u renuga_user -p -h localhost renuga_crm
# (enter password from deployment)
```

#### Error: "EADDRINUSE"
**Cause:** Port 3001 already in use  
**Fix:**
```bash
# Kill process on port 3001
sudo lsof -i :3001
sudo kill -9 <PID>

# Or change port to 3002
sudo nano /var/www/renuga-crm/server/.env
# Change: PORT=3002
# Then restart and update Nginx

# If you change port, also update Nginx:
sudo nano /etc/nginx/sites-available/renuga-crm
# Change: proxy_pass http://localhost:3001; to 3002
sudo systemctl reload nginx
```

#### Error: "Cannot find module" or "Build not found"
**Cause:** Backend not built or dependencies missing  
**Fix:**
```bash
cd /var/www/renuga-crm/server
npm install
npm run build
cd ..
sudo pm2 restart renuga-crm-api
```

### Step 4: Verify Port 3001 is Listening

```bash
sudo netstat -tuln | grep 3001
```

**Expected:** `tcp  0  0  127.0.0.1:3001  0.0.0.0:*  LISTEN`

**If NOT listening:**
```bash
# Check logs
sudo pm2 logs renuga-crm-api --lines 100

# Manually start backend to see errors
cd /var/www/renuga-crm/server
npm start
# (Press Ctrl+C to stop)

# Then restart with PM2
cd ..
sudo pm2 restart renuga-crm-api
```

### Step 5: Check Nginx Configuration

```bash
# Test Nginx config
sudo nginx -t

# Check if /api location is configured
grep -A 10 "location /api" /etc/nginx/sites-available/renuga-crm
```

**Should show:**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    proxy_http_version 1.1;
    # ... more headers
}
```

**If incorrect:** Edit and fix:
```bash
sudo nano /etc/nginx/sites-available/renuga-crm
# Verify proxy_pass points to http://localhost:3001
sudo nginx -t
sudo systemctl reload nginx
```

### Step 6: Test API Endpoint Directly

```bash
# From EC2 (local)
curl http://localhost:3001/api/auth/login -X POST

# Should respond (even if auth fails, at least it connects)
```

**If connection refused:**
- Backend not running or listening
- Go back to Step 3 and check logs

### Step 7: Test Through Nginx

```bash
# From EC2 (through Nginx proxy)
curl http://localhost/api/auth/login -X POST

# Should proxy to backend
```

**If still fails:**
- Check Nginx is running: `sudo systemctl status nginx`
- Reload: `sudo systemctl reload nginx`

### Step 8: Test From Browser

Open your browser and check:

**Browser Console:**
```
Press F12 → Network tab
Try logging in again
Look for the failed request
```

**Check:**
1. Request goes to: `http://your-public-ip/api/auth/login`
2. Response should NOT be "ERR_CONNECTION_TIMED_OUT"

If still timing out:
```bash
# Check security group in AWS
# Ensure port 80 and 443 are open to 0.0.0.0/0

# Check firewall
sudo ufw status
# Should show "Nginx Full" allowed
```

---

## 🚨 Quick Fix Checklist

If you want to quickly get it working:

```bash
# 1. SSH into EC2
ssh -i your-key.pem ubuntu@your-ip

# 2. Check process
sudo pm2 list

# 3. If not online, restart
sudo pm2 restart renuga-crm-api
sudo pm2 status

# 4. Wait 5 seconds
sleep 5

# 5. Check if listening
sudo netstat -tuln | grep 3001

# 6. Try login again in browser
```

If still not working, run diagnostics:

```bash
sudo bash /var/www/renuga-crm/backend-diagnostic.sh
```

This will show you exactly what's wrong.

---

## 📋 Full Diagnostic Script

I've created `backend-diagnostic.sh` that checks everything automatically:

```bash
# Run the diagnostic
sudo bash /var/www/renuga-crm/backend-diagnostic.sh

# It will check:
# ✓ PM2 process status
# ✓ Port 3001 listening
# ✓ PM2 log files
# ✓ Nginx configuration
# ✓ Firewall rules
# ✓ Backend files and dependencies
# ✓ Database connectivity
# ✓ Give you specific recommendations
```

---

## 🔍 Common Issues & Solutions

### "renuga-crm-api NOT found in PM2"

**Solution:**
```bash
cd /var/www/renuga-crm
sudo pm2 start ecosystem.config.cjs
sudo pm2 save
```

### "Backend process is not running / STOPPED"

**Solution:**
```bash
cd /var/www/renuga-crm
sudo pm2 start ecosystem.config.cjs
sudo pm2 logs renuga-crm-api --lines 50
# Wait for it to say "listening on port 3001"
```

### "MySQL database connection FAILED"

**Solutions:**
```bash
# 1. Check MySQL is running
sudo systemctl status mysql

# 2. Verify credentials
sudo cat /var/www/renuga-crm/server/.env | grep DB_

# 3. Test connection manually
mysql -u renuga_user -p -h localhost renuga_crm
# Enter the password from .env

# 4. If password wrong, check credentials file
cat /root/renuga-db-credentials.txt
```

### "Port 3001 is NOT listening"

**Solutions:**
```bash
# 1. Check what's running
sudo lsof -i :3001

# 2. If nothing, check logs
sudo pm2 logs renuga-crm-api --lines 100

# 3. Try manual start
cd /var/www/renuga-crm/server
npm start
# Should show: "Server running on port 3001"

# 4. If fails, rebuild
npm install
npm run build
cd ..
sudo pm2 restart renuga-crm-api
```

### "Nginx configuration has errors"

**Solutions:**
```bash
# 1. Check what's wrong
sudo nginx -t

# 2. View config
sudo cat /etc/nginx/sites-available/renuga-crm

# 3. Make sure it has /api location pointing to :3001
# If missing, run deployment script again:
cd /var/www/renuga-crm
sudo bash ec2-setup.sh

# 4. Reload Nginx
sudo systemctl reload nginx
```

---

## ✅ Verification Steps

Once you think it's fixed:

### 1. Check PM2 Status
```bash
sudo pm2 list

# Should show:
# │ renuga-crm-api │ npm start  │ online │ 0 │ 0s   │
```

### 2. Check Port Listening
```bash
sudo netstat -tuln | grep 3001

# Should show:
# tcp  0  0  127.0.0.1:3001  0.0.0.0:*  LISTEN
```

### 3. Test API Locally
```bash
curl http://localhost/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@renuga.com","password":"admin123"}' \
  -v

# Should respond with either:
# - {"token": "...", "user": {...}}  (success)
# - {"error": "..."}  (auth error, but connection works!)
# NOT: ERR_CONNECTION_TIMED_OUT
```

### 4. Test in Browser
1. Open: `http://your-public-ip`
2. Click Login
3. Enter: admin@renuga.com / admin123
4. Should see either:
   - ✅ Dashboard (success)
   - ⚠️ "Invalid credentials" (connection works, just wrong password)
   - ❌ Still timeout = connection still broken

---

## 🆘 If Nothing Works

Run this and share the output:

```bash
sudo bash /var/www/renuga-crm/backend-diagnostic.sh > /tmp/diagnostics.log 2>&1
cat /tmp/diagnostics.log
```

It will identify the exact issue.

---

## 📞 Reference Commands

```bash
# Check backend status
sudo pm2 status

# View backend logs  
sudo pm2 logs renuga-crm-api --lines 100

# Restart backend
sudo pm2 restart renuga-crm-api

# Check port 3001
sudo lsof -i :3001

# Check Nginx
sudo nginx -t
sudo systemctl reload nginx

# Check MySQL
sudo systemctl status mysql
mysql -u renuga_user -p -h localhost renuga_crm

# Run diagnostics
sudo bash /var/www/renuga-crm/backend-diagnostic.sh

# Check frontend env
cat /var/www/renuga-crm/.env.local
# Should show: VITE_API_URL=http://your-ip:3001
```

---

**Status:** This guide should resolve 95% of timeout issues. If you still have problems, run the diagnostic script above.
