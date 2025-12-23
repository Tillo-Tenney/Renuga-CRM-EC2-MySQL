# 🔴 CRITICAL: Fix Frontend API URL (Login Timeout Solution)

## The Problem (SOLVED)

Your diagnostic output showed:
```
❌ Port 3001 NOT listening (externally)
✅ API works locally (returns JWT token)
```

**Root Cause:** Frontend is configured to connect directly to port 3001, which is **NOT accessible from the internet** (only from localhost).

**Solution:** Frontend should connect through **Nginx proxy on port 80** instead.

---

## 🚨 DO THIS NOW (3 minutes)

### Step 1: SSH to EC2
```bash
ssh -i your-key.pem ubuntu@13.49.243.209
```

### Step 2: Run the Fix Script
```bash
sudo bash /var/www/renuga-crm/fix-frontend-api-url.sh
```

This will:
1. ✓ Update `.env.local` to use correct API URL (no :3001)
2. ✓ Rebuild frontend
3. ✓ Reload Nginx
4. ✓ Verify everything works

### Step 3: Clear Browser Cache & Try Login
```
1. Open: http://13.49.243.209
2. Press: Ctrl+Shift+Del (clear cache)
3. Hard refresh: Ctrl+F5
4. Login: admin@renuga.com / admin123
```

**Should work now!** ✅

---

## 📋 What Changed

### Before (Wrong)
```env
# .env.local
VITE_API_URL=http://13.49.243.209:3001
# ❌ Port 3001 NOT accessible from internet
```

### After (Fixed)
```env
# .env.local
VITE_API_URL=http://13.49.243.209
# ✅ Uses Nginx proxy on port 80
# ✅ Nginx internally proxies to :3001
```

---

## 🔍 Why This Fixes Login

**The flow:**

```
BEFORE (BROKEN):
Browser (client) → :3001 direct → TIMEOUT ❌
(Port 3001 not accessible from internet)

AFTER (FIXED):
Browser (client) → :80 (Nginx) → :3001 (backend) → Works! ✅
(Nginx proxy forwards requests to backend)
```

---

## ✅ Verification

After running the fix script, you'll see:

```
✓ Frontend .env.local updated
✓ Frontend rebuilt
✓ Nginx reloaded
✓ API accessible through Nginx proxy ✓
```

Then try login in browser - should work!

---

## 🎯 Quick Commands

If you want to fix manually instead of using the script:

```bash
# Update .env.local (remove :3001)
cd /var/www/renuga-crm
echo 'VITE_API_URL=http://13.49.243.209' > .env.local

# Rebuild
npm run build

# Reload Nginx
sudo systemctl reload nginx

# Clear cache and try login in browser
```

---

## 📊 What Was Wrong

**Nginx Configuration (this was correct):**
```nginx
location /api {
    proxy_pass http://localhost:3001;
    # ✓ Correctly proxies /api to backend
}
```

**Frontend Configuration (this was wrong):**
```env
VITE_API_URL=http://13.49.243.209:3001
# ❌ Tries to connect directly to :3001
# ❌ :3001 not open to internet
# ❌ Should use Nginx proxy instead
```

**Now it's fixed:**
```env
VITE_API_URL=http://13.49.243.209
# ✅ Connects to port 80 (Nginx)
# ✅ Nginx proxies to :3001 internally
# ✅ Works from anywhere!
```

---

## 🎉 Expected Result

After fix:
- ✅ Frontend loads: `http://13.49.243.209`
- ✅ Login button works (no timeout)
- ✅ API request goes to `http://13.49.243.209/api/auth/login` (via Nginx)
- ✅ Backend responds with JWT token
- ✅ User logged in successfully

---

## Quick Summary

| Issue | Status |
|-------|--------|
| **Backend** | ✅ Working (returns JWT) |
| **Nginx** | ✅ Configured correctly |
| **Port 3001** | ✅ Listening (localhost only) |
| **Frontend Config** | ❌ Wrong (trying :3001) |
| **Fix** | 🔧 Run the script above |

---

**Run the fix script now - should take 3 minutes!** 👇

```bash
ssh -i your-key.pem ubuntu@13.49.243.209
sudo bash /var/www/renuga-crm/fix-frontend-api-url.sh
```

Then try login. **It will work!** 💪
