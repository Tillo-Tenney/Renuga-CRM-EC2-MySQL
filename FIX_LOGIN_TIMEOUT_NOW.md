# 🚨 URGENT: POST to :3001/api/auth/login Timeout

## Your Exact Error

```
POST http://13.49.243.209:3001/api/auth/login net::ERR_CONNECTION_TIMED_OUT
```

This means:
- Browser on your computer: `http://13.49.243.209` (frontend works ✅)
- Trying to connect to: `http://13.49.243.209:3001` (backend ❌)
- Result: **No response - timeout**

---

## DO THIS NOW (2 minutes)

### Step 1: SSH to EC2

```bash
ssh -i your-key.pem ubuntu@13.49.243.209
```

### Step 2: Run Quick Check

```bash
sudo bash /var/www/renuga-crm/quick-backend-check.sh
```

**This will show you:**
- ✓ Is backend running?
- ✓ Is port 3001 listening?
- ✓ What's in the error logs?
- ✓ Is MySQL running?
- **✓ What to do next**

---

## Most Common Fixes

### Fix #1: Backend Stopped (Most Common)

```bash
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
sleep 5
sudo pm2 status
```

**Then try login again.** Should work ✅

### Fix #2: MySQL Stopped

```bash
sudo systemctl start mysql
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
sleep 5
```

**Then try login again.** Should work ✅

### Fix #3: Both Down

```bash
sudo systemctl start mysql
cd /var/www/renuga-crm
sudo pm2 restart renuga-crm-api
sleep 5
```

**Then try login again.** Should work ✅

---

## Verify It Worked

After applying a fix, check:

```bash
# 1. Backend running?
sudo pm2 list
# Should show: renuga-crm-api ... online ✅

# 2. Port listening?
sudo netstat -tuln | grep 3001
# Should show: LISTEN ✅

# 3. API responding?
curl http://localhost:3001/health
# Should respond with JSON ✅
```

---

## If Still Broken

Check the logs:

```bash
sudo pm2 logs renuga-crm-api --lines 50
```

**Look for:**
- `Error: connect ECONNREFUSED` → MySQL not running
- `Cannot find module` → Dependencies missing
- `EADDRINUSE` → Port already in use
- Other errors → See full documentation

---

## Quick Reference

| Problem | Command |
|---------|---------|
| **Check status** | `sudo pm2 list` |
| **View logs** | `sudo pm2 logs renuga-crm-api --lines 50` |
| **Restart backend** | `sudo pm2 restart renuga-crm-api` |
| **Check port** | `sudo netstat -tuln \| grep 3001` |
| **Check MySQL** | `sudo systemctl status mysql` |
| **Start MySQL** | `sudo systemctl start mysql` |

---

## Expected Timeline

| Step | Time |
|------|------|
| SSH | 30 sec |
| Run quick check | 30 sec |
| Apply fix | 1-5 min |
| Verify | 1 min |
| **Total** | **3-7 min** |

---

## Success = 

✅ Browser shows login page  
✅ Can enter email/password  
✅ **Can click "Sign In"** (doesn't timeout)  
✅ Either logs in OR shows error (but NOT timeout!)  

---

**The quick-backend-check.sh script will identify the exact issue and tell you what to do.**

**Run it now!** 👇

```bash
ssh -i your-key.pem ubuntu@13.49.243.209
sudo bash /var/www/renuga-crm/quick-backend-check.sh
```

Let me know what the output shows and I'll help you fix it!
