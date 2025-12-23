# EC2 Deployment - Visual Summary & Cheat Sheet

## 🎯 One-Command Deployment

```bash
# SSH into EC2
ssh -i key.pem ubuntu@your-ec2-ip

# Navigate and deploy
cd /var/www/renuga-crm && ./deploy.sh
```

That's it! The script handles:
- ✓ Git pull
- ✓ Backup creation
- ✓ Frontend build
- ✓ Backend build
- ✓ Database migrations
- ✓ Service restart
- ✓ Nginx reload
- ✓ Health checks

---

## 📊 Deployment Decision Tree

```
Want to deploy?
│
├─ YES
│  │
│  ├─ Fast deployment (skip backup)?
│  │  ├─ YES → ./deploy.sh --skip-backup
│  │  └─ NO  → ./deploy.sh
│  │
│  └─ Something broke? → ./deploy.sh --rollback
│
├─ View logs? → ./deploy.sh --logs
│
└─ Need help? → cat EC2_QUICK_REFERENCE.md
```

---

## 🔄 Deployment Flow (What Happens Behind the Scenes)

```
START
  │
  ├─→ Check Permissions
  │
  ├─→ Check Requirements (git, npm, pm2)
  │
  ├─→ Create Backup
  │   └─→ Keep last 5 backups only
  │
  ├─→ Git Pull
  │   └─→ Fetch latest from main branch
  │
  ├─→ Frontend Build
  │   ├─→ npm install
  │   ├─→ npm run build
  │   └─→ Verify dist/index.html exists
  │
  ├─→ Backend Build
  │   ├─→ cd server
  │   ├─→ npm install
  │   ├─→ npm run build
  │   └─→ Verify dist/index.js exists
  │
  ├─→ Database Migrations (if any)
  │
  ├─→ Restart Services
  │   └─→ pm2 restart with zero-downtime
  │
  ├─→ Reload Nginx
  │   └─→ Zero-downtime Nginx reload
  │
  ├─→ Verify Deployment
  │   ├─→ Check PM2 status
  │   ├─→ Check Nginx status
  │   ├─→ Health checks
  │   └─→ Frontend loads
  │
  └─→ SUCCESS! ✓
      └─→ View logs: pm2 logs renuga-crm-api
```

---

## 🛠️ Service Architecture

```
┌──────────────────────────────────────────────────────┐
│                    Your EC2 Instance                  │
├──────────────────────────────────────────────────────┤
│                                                       │
│  ┌──────────────────────────────────────────────┐   │
│  │              Nginx (Web Server)              │   │
│  │  - Listens on :80 (port 80)                  │   │
│  │  - Serves /dist (frontend)                   │   │
│  │  - Routes /api to localhost:3001             │   │
│  │  - Handles HTTPS (if configured)             │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │          PM2 (Process Manager)               │   │
│  │  ┌─────────────────────────────────────┐    │   │
│  │  │  renuga-crm-api                     │    │   │
│  │  │  - Node.js Express server           │    │   │
│  │  │  - Listens on :3001 (localhost)     │    │   │
│  │  │  - Auto-restarts on crash           │    │   │
│  │  │  - Logs to /var/log/pm2/            │    │   │
│  │  │  - Max 1GB memory                   │    │   │
│  │  └─────────────────────────────────────┘    │   │
│  └──────────────┬───────────────────────────────┘   │
│                 │                                    │
│  ┌──────────────▼───────────────────────────────┐   │
│  │        PostgreSQL (Database)                 │   │
│  │  - Database: renuga_crm                      │   │
│  │  - User: renuga_user                         │   │
│  │  - Runs on localhost (internal only)         │   │
│  └──────────────────────────────────────────────┘   │
│                                                       │
└──────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
/var/www/renuga-crm/
├── deploy.sh                              ← USE THIS TO DEPLOY
├── ecosystem.config.cjs                   ← PM2 config
├── package.json                           ← Frontend deps
├── tsconfig.json
├── vite.config.ts
├── dist/                                  ← BUILT FRONTEND (generated)
│   ├── index.html
│   └── assets/
├── src/                                   ← Frontend source
├── server/                                ← BACKEND
│   ├── package.json                       ← Backend deps
│   ├── dist/                              ← BUILT BACKEND (generated)
│   │   └── index.js
│   ├── src/                               ← Backend source
│   └── .env                               ← Backend config
├── public/
└── nginx/                                 ← Nginx configs
    └── renuga-crm.conf
```

---

## 🚨 Emergency Commands

### 🔴 Everything is Down - Full Reset

```bash
cd /var/www/renuga-crm

# Kill everything
pm2 kill
sleep 2

# Clean slate
git reset --hard origin/main
rm -rf node_modules dist server/node_modules server/dist

# Rebuild
npm install
npm run build
cd server && npm install && npm run build && cd ..

# Restart
pm2 start ecosystem.config.cjs
sudo systemctl restart nginx

# Check
pm2 logs
```

### 🟡 Service Crash - Quick Restart

```bash
pm2 restart renuga-crm-api
# or
pm2 stop renuga-crm-api && sleep 2 && pm2 start renuga-crm-api
```

### 🟡 Frontend Looks Wrong - Clear Cache

```bash
cd /var/www/renuga-crm
rm -rf dist
npm run build
sudo systemctl reload nginx
```

### 🟡 Port Conflicts - Kill the Blocker

```bash
# Find what's using port 3001
sudo lsof -i :3001

# Kill it
sudo kill -9 <PID>

# Restart service
pm2 start ecosystem.config.cjs
```

---

## 📋 Deployment Checklist

### Pre-Deployment
```
☐ Changes are committed to git
☐ Testing is complete (local tests pass)
☐ You're on the main branch
☐ No uncommitted changes (git status clean)
☐ SSH access to EC2 is working
☐ Backup space available (~2x app size)
```

### Deployment
```
☐ SSH into EC2 instance
☐ Navigate to: cd /var/www/renuga-crm
☐ Run: ./deploy.sh
☐ Watch logs: pm2 logs
☐ Wait for deployment to complete
```

### Post-Deployment
```
☐ Frontend loads: curl http://localhost/ → HTTP 200
☐ API responds: curl http://localhost:3001/ → response
☐ No errors: pm2 logs shows no critical errors
☐ Services running: pm2 list shows "online"
☐ Nginx healthy: sudo systemctl status nginx shows "active"
☐ Database works: Try querying data in the app
☐ All features work: Test key features manually
```

### Rollback (if needed)
```
☐ Run: ./deploy.sh --rollback
☐ Confirm the rollback
☐ Verify: pm2 logs, curl http://localhost/
☐ Services restart: pm2 list shows "online"
☐ Test features again
```

---

## 🔐 Important Files

| File | Location | Permission | Contains |
|------|----------|-----------|----------|
| `.env` | `/var/www/renuga-crm/server/` | 600 (read-only) | Database URL, JWT secret, API keys |
| `ecosystem.config.cjs` | `/var/www/renuga-crm/` | 644 | PM2 configuration |
| `deploy.sh` | `/var/www/renuga-crm/` | 755 (executable) | Deployment automation |
| Nginx config | `/etc/nginx/sites-available/` | 644 | Web server routes |

---

## 🔍 Monitoring Dashboard

Create a simple monitoring script:

```bash
#!/bin/bash
# Save as: /usr/local/bin/crm-status

clear
echo "╔════════════════════════════════════════════════════════════╗"
echo "║         Renuga CRM - Status Dashboard                      ║"
echo "╚════════════════════════════════════════════════════════════╝"
echo ""

echo "📊 Git Status:"
cd /var/www/renuga-crm
echo "   Branch: $(git rev-parse --abbrev-ref HEAD)"
echo "   Latest: $(git log -1 --pretty=format:"%h - %s")"
echo ""

echo "🔧 Services:"
pm2 list | tail -4
echo ""

echo "🌐 Web Server:"
sudo systemctl status nginx --no-pager | grep Active
echo ""

echo "💻 Ports:"
echo "   API Port 3001: $(lsof -i :3001 >/dev/null && echo '✓ Open' || echo '✗ Closed')"
echo "   Web Port 80: $(lsof -i :80 >/dev/null && echo '✓ Open' || echo '✗ Closed')"
echo ""

echo "📈 System Resources:"
FREE=$(free -h | grep Mem | awk '{print $3 "/" $2}')
DISK=$(df -h /var/www | tail -1 | awk '{print $3 "/" $2}')
echo "   Memory: $FREE"
echo "   Disk: $DISK"
echo ""

echo "🏥 Health Check:"
curl -s -w "   Frontend: HTTP %{http_code}\n" http://localhost/ > /dev/null
curl -s -w "   API: HTTP %{http_code}\n" http://localhost:3001/ > /dev/null
echo ""

echo "📝 Recent Logs (last 5 errors):"
pm2 logs renuga-crm-api --lines 50 | grep -i error | tail -5
```

Make it executable and use:
```bash
chmod +x /usr/local/bin/crm-status
crm-status
```

---

## 🎓 Common Scenarios

### Scenario 1: Small CSS/JS Change
```bash
# 1. Make change on your computer
# 2. Commit and push to GitHub
git add .
git commit -m "feat: update button color"
git push origin main

# 3. On EC2
cd /var/www/renuga-crm && ./deploy.sh

# Done! (15-30 seconds, automatic backup)
```

### Scenario 2: Database Schema Change
```bash
# 1. Create migration file
# 2. Commit and push

# 3. On EC2
./deploy.sh
# deploy.sh automatically runs migrations!

# Done!
```

### Scenario 3: Environment Variable Change
```bash
# 1. Update .env file (NOT in git)
nano /var/www/renuga-crm/server/.env

# 2. Restart service
pm2 restart renuga-crm-api

# 3. Done!
```

### Scenario 4: Something Broke!
```bash
# Quick fix
./deploy.sh --rollback

# Or manual fix + redeploy
git reset --hard origin/main  # undo all local changes
./deploy.sh

# Or specific commit
git reset --hard <commit-hash>
./deploy.sh
```

---

## ⚡ Performance Tips

1. **Reduce Deployment Time**
   ```bash
   ./deploy.sh --skip-backup    # 5-10 seconds faster
   ```

2. **Monitor Memory Usage**
   ```bash
   pm2 show renuga-crm-api      # Check current memory
   pm2 logs renuga-crm-api      # Check for memory leaks
   ```

3. **Clear Old Logs**
   ```bash
   pm2 flush renuga-crm-api     # Clear logs
   ```

4. **Check Disk Space**
   ```bash
   df -h /var/www/
   # If < 10% free, cleanup:
   rm -rf /var/www/renuga-crm.backup.*  # Keep only latest
   ```

---

## 🆘 When to Call for Help

1. **Consistent Service Crashes**
   - Check logs: `pm2 logs --lines 200`
   - Check memory: `pm2 show renuga-crm-api`

2. **Database Connection Errors**
   - Check PostgreSQL: `sudo systemctl status postgresql`
   - Check .env: `cat /var/www/renuga-crm/server/.env`

3. **Build Fails Repeatedly**
   - Check Node version: `node --version` (should be 16+)
   - Try: `npm install --legacy-peer-deps`

4. **Nginx Can't Find Frontend**
   - Check dist folder: `ls -la /var/www/renuga-crm/dist/`
   - Check Nginx config: `sudo nginx -t`

5. **Git Pull Fails**
   - Check credentials: `git config user.email`
   - Check SSH keys: `ssh -T git@github.com`

---

## 📞 Quick Reference Links

- **Full Guide:** See `EC2_UPDATE_DEPLOYMENT_GUIDE.md`
- **Commands:** See `EC2_QUICK_REFERENCE.md`
- **Complete Package Info:** See `EC2_DEPLOYMENT_COMPLETE_PACKAGE.md`

---

**Last Updated:** December 21, 2025  
**Quick Commands Version:** 1.0
