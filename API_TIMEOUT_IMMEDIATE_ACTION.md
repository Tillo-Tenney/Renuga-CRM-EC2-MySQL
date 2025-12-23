# 🔴 API Timeout - What To Do RIGHT NOW

## Your Situation

```
✅ Webapp loads in browser
❌ Login button times out
❌ Error: "ERR_CONNECTION_TIMED_OUT :3001/api/auth/login"
❌ Cannot authenticate
```

## The Problem in 1 Sentence

**Backend API process is not running or not responding on port 3001**

---

## Fix It in 3 Steps (5 minutes)

### STEP 1: SSH to EC2
```bash
ssh -i your-key.pem ubuntu@your-public-ip
```

### STEP 2: Restart Backend
```bash
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
```

### STEP 3: Try Login Again
- Go to: `http://your-ip`
- Click Login
- Enter: admin@renuga.com / admin123
- Should work now ✅

---

## If That Doesn't Work

### Run This (30 seconds):
```bash
sudo bash /var/www/renuga-crm/backend-diagnostic.sh
```

This will tell you exactly what's wrong.

---

## What It Checks

✓ Is backend process running?  
✓ Is port 3001 listening?  
✓ Can it connect to database?  
✓ Is Nginx configured correctly?  
✓ Are firewall rules OK?  

---

## Most Likely Problems & Fixes

### Problem #1: Backend Stopped
```bash
# Check
sudo pm2 list

# Fix
sudo pm2 restart renuga-crm-api

# Verify
sudo pm2 status
```

### Problem #2: Database Connection Failed
```bash
# Check
sudo systemctl status mysql

# Verify connection
mysql -u renuga_user -p -h localhost renuga_crm
# (password in .env file)
```

### Problem #3: Port Not Listening
```bash
# Check
sudo netstat -tuln | grep 3001

# If nothing shows, backend isn't running
sudo pm2 logs renuga-crm-api --lines 50
# Check for errors
```

### Problem #4: Backend Crashed
```bash
# Rebuild
cd /var/www/renuga-crm/server
npm install
npm run build

# Restart
cd ..
sudo pm2 restart renuga-crm-api
```

---

## Success Checklist

After each fix, verify:

- [ ] `sudo pm2 list` shows "online" status
- [ ] `sudo netstat -tuln | grep 3001` shows LISTEN
- [ ] Browser no longer shows timeout error
- [ ] Can click login and authenticate (or get specific error)

---

## If Still Stuck

Read this file:
```bash
cat /var/www/renuga-crm/API_TIMEOUT_TROUBLESHOOTING.md
```

It has:
- 8-step debugging guide
- Common issues and solutions
- Reference commands

---

## Key Commands Reference

```bash
# Check status
sudo pm2 status
sudo pm2 list

# View logs
sudo pm2 logs renuga-crm-api --lines 100
sudo tail -f /var/log/pm2/renuga-crm-api-error.log

# Restart
sudo pm2 restart renuga-crm-api
sudo pm2 restart all

# Check port
sudo netstat -tuln | grep 3001
sudo lsof -i :3001

# Check database
mysql -u renuga_user -p -h localhost renuga_crm

# Rebuild
cd /var/www/renuga-crm/server
npm install && npm run build
cd ..
sudo pm2 restart renuga-crm-api

# Full re-deploy
cd /var/www/renuga-crm
sudo bash ec2-setup.sh
```

---

## Expected Results After Fix

### Success ✅
- No more timeout errors
- Login page appears
- Can enter email/password
- Either:
  - **Logs in successfully** → Shows dashboard
  - **Shows error message** → "Invalid email/password" or similar (but no timeout!)

### Still Broken ❌
- Still see "ERR_CONNECTION_TIMED_OUT"
- Request times out
- No response from API

**If still broken:** Run the diagnostic script (see above)

---

## Timeline

| Action | Time |
|--------|------|
| SSH to EC2 | 30 sec |
| Restart backend | 10 sec |
| Try login | 5 sec |
| **Total** | **45 sec** |

**If doesn't work:** Add 5-10 min for diagnostics

---

## Why This Happens

1. EC2 deployment completed
2. Backend started successfully
3. You tried to login
4. Backend process crashed or stopped
5. API became unresponsive
6. Browser gets timeout error

**Solution:** Restart the process

---

## How To Prevent

```bash
# Monitor logs daily
sudo pm2 logs renuga-crm-api

# Check status weekly
sudo pm2 status

# Enable PM2+ monitoring (optional)
sudo pm2 plus

# Check before letting users access
curl http://localhost/api/auth/login -X POST -v
```

---

## Still Have Questions?

**Three documentation files were created for you:**

1. **API_TIMEOUT_QUICK_FIX.md** (← Start here)
   - 3 minute read
   - Step-by-step actions
   
2. **API_TIMEOUT_TROUBLESHOOTING.md**
   - 10 minute read
   - Complete reference guide
   
3. **backend-diagnostic.sh**
   - Automated tool
   - Identifies exact problem

---

## TL;DR

```bash
# Do this:
ssh -i your-key.pem ubuntu@your-ip
sudo pm2 restart renuga-crm-api
# Try login
```

**If works:** Done! 🎉  
**If not:** Run `sudo bash /var/www/renuga-crm/backend-diagnostic.sh` and follow recommendations

---

**You've got this! The problem is minor and easily fixed.** 💪

Most cases resolve in under 5 minutes.
