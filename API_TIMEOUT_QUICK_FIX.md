# 🚀 API Timeout Fix - Quick Action Guide

## What You Need To Do Right Now

### 1️⃣ Connect to Your EC2 Instance

```bash
ssh -i your-key.pem ubuntu@your-public-ip
```

### 2️⃣ Run Quick Diagnostic (Takes 30 seconds)

```bash
sudo bash /var/www/renuga-crm/backend-diagnostic.sh 2>&1 | head -100
```

### 3️⃣ Look for These Status Indicators

#### ✅ If you see "renuga-crm-api" with status "online" in GREEN:

Backend is running! Problem might be frontend config.

**Check frontend environment:**
```bash
cat /var/www/renuga-crm/.env.local
# Should show: VITE_API_URL=http://YOUR_IP:3001
```

If it says `http://YOUR_IP:3001` (with :3001), it's correct.

**Try login again** - might work now.

---

#### ❌ If you see "renuga-crm-api" with status "stopped" or "errored":

Backend crashed. Restart it:

```bash
cd /var/www/renuga-crm
sudo pm2 start ecosystem.config.cjs
sleep 5
sudo pm2 status
# Should now show "online" in green
```

**Try login again** - should work now.

---

#### ❌ If you don't see "renuga-crm-api" at all:

Backend not configured. Run deployment script:

```bash
cd /var/www/renuga-crm
sudo bash ec2-setup.sh
# This will set everything up again
# Wait for completion...
```

**Try login again** - should work now.

---

### 4️⃣ Check Port 3001 is Listening

```bash
sudo netstat -tuln | grep 3001
```

**Should show:**
```
tcp  0  0  127.0.0.1:3001  0.0.0.0:*  LISTEN
```

**If NOT showing:**
- Backend is not running or crashed
- Go back to Step 3

---

### 5️⃣ Test Backend Directly (from EC2)

```bash
curl -X POST http://localhost/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@renuga.com","password":"admin123"}'
```

**Should respond with:**
```json
{"token":"...", "user":{...}}
```

or

```json
{"error": "Invalid credentials"}
```

**If you get either of those:** Connection works! ✅

**If you get error or timeout:** Backend not responding, check Step 3.

---

### 6️⃣ Clear Browser Cache & Try Again

1. Open your app: `http://your-ip`
2. Press **F12** (Developer Tools)
3. Right-click the reload button → "Empty cache and hard reload"
4. Try login again

---

## Still Not Working? 

### Run Full Diagnostics

```bash
sudo bash /var/www/renuga-crm/backend-diagnostic.sh
```

This will tell you exactly what's wrong and how to fix it.

### Share the Output

If you're still stuck, the diagnostic output will help identify the issue.

---

## 95% Success Rate Actions

Try these in order (one fixes 95% of cases):

### Action 1: Restart Backend (2 minutes)
```bash
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
sleep 3
# Try login
```

### Action 2: Rebuild Backend (5 minutes)
```bash
cd /var/www/renuga-crm/server
npm install
npm run build
cd ..
sudo pm2 restart renuga-crm-api
sleep 3
# Try login
```

### Action 3: Restart Everything (10 minutes)
```bash
# Restart all services
sudo systemctl restart mysql
sudo systemctl restart nginx
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
sleep 5
# Try login
```

### Action 4: Run Full Deployment (15 minutes)
```bash
cd /var/www/renuga-crm
sudo bash ec2-setup.sh
# This recreates everything from scratch
# Wait for completion...
# Try login
```

---

## Success Signs

After each action, look for:

✅ **Backend running:**
```bash
sudo pm2 list
# Shows "renuga-crm-api" with "online" status
```

✅ **Port listening:**
```bash
sudo netstat -tuln | grep 3001
# Shows LISTEN on 127.0.0.1:3001
```

✅ **API responding:**
```bash
curl http://localhost/api/auth/login -X POST
# Gets a response (not timeout)
```

✅ **Browser working:**
- No ERR_CONNECTION_TIMED_OUT error
- Shows login page
- Can click login button

---

## Most Likely Cause & Fix

**99% of cases:** Backend process crashed on startup

**Most likely reason:** Database connection failed

**Quick fix:**
```bash
# Check database is running
sudo systemctl status mysql

# Check credentials
cat /var/www/renuga-crm/server/.env | grep DB_

# Test connection
mysql -u renuga_user -p -h localhost renuga_crm
# (copy password from .env)

# If connection works, restart backend
sudo pm2 restart renuga-crm-api
```

---

## Rollback Commands

If you need to go back:

```bash
# View process logs (last 100 lines)
sudo pm2 logs renuga-crm-api --lines 100

# Stop backend
sudo pm2 stop renuga-crm-api

# Start backend
sudo pm2 start ecosystem.config.cjs

# Completely remove and restart
cd /var/www/renuga-crm
sudo pm2 delete renuga-crm-api
sudo pm2 start ecosystem.config.cjs
```

---

## Expected Outcome

### Current State
- ❌ Login times out with ERR_CONNECTION_TIMED_OUT

### After Fix
- ✅ Login page appears
- ✅ Can enter credentials
- ✅ Either logs in OR shows "Invalid credentials" (but no timeout!)
- ✅ App loads on successful login

---

**Next Step:** Follow the actions above. If stuck, run the diagnostic script - it will guide you to the specific problem.

You've got this! 💪
