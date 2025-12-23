# EC2 Deployment - Quick Reference

## One-Line Deployment Commands

```bash
# SSH into EC2
ssh -i key.pem ubuntu@your-ip

# Navigate to app
cd /var/www/renuga-crm

# Deploy using automation script
chmod +x deploy.sh && ./deploy.sh

# Or deploy manually (one-liner)
git pull origin main && npm install && npm run build && cd server && npm install && npm run build && cd .. && pm2 restart ecosystem.config.cjs && sudo systemctl reload nginx
```

## Common Commands

### Deployment
```bash
./deploy.sh                    # Normal deployment with backup
./deploy.sh --skip-backup     # Fast deployment
./deploy.sh --rollback        # Rollback to previous
./deploy.sh --logs            # View deployment logs
```

### Services
```bash
pm2 list                       # List all services
pm2 logs renuga-crm-api       # View API logs
pm2 stop renuga-crm-api       # Stop API
pm2 restart renuga-crm-api    # Restart API
pm2 delete renuga-crm-api     # Remove from PM2
pm2 save                      # Save state
pm2 startup                   # Configure auto-start
```

### Nginx
```bash
sudo systemctl status nginx    # Check status
sudo systemctl start nginx     # Start
sudo systemctl restart nginx   # Restart
sudo systemctl reload nginx    # Reload config (no downtime)
sudo nginx -t                  # Test config
sudo tail -50 /var/log/nginx/error.log   # View errors
```

### Git
```bash
cd /var/www/renuga-crm
git status                     # Check status
git log --oneline -5           # Last 5 commits
git pull origin main           # Pull changes
git branch                     # Show current branch
```

### Database
```bash
sudo systemctl status postgresql   # Check PostgreSQL
sudo -u postgres psql -l           # List databases
sudo -u postgres psql renuga_crm   # Connect to DB

# Run migrations
cd /var/www/renuga-crm/server
npm run db:migrate
```

### Backups
```bash
# Create backup
cp -r /var/www/renuga-crm /var/www/renuga-crm.backup.$(date +%Y%m%d_%H%M%S)

# List backups
ls -la /var/www/renuga-crm.backup.*

# Restore backup
BACKUP=/var/www/renuga-crm.backup.20240101_120000
pm2 stop ecosystem.config.cjs
rm -rf /var/www/renuga-crm
cp -r $BACKUP /var/www/renuga-crm
pm2 restart ecosystem.config.cjs
```

### Monitoring
```bash
# View real-time logs
pm2 logs

# Monitor system resources
pm2 monit

# Check memory/CPU
pm2 show renuga-crm-api

# System info
free -h
df -h
top -b -n 1 | head -20
```

### Health Checks
```bash
# API is responding
curl http://localhost:3001/

# Frontend is serving
curl http://localhost/ | head -c 100

# Check both
curl -I http://localhost:3001/
curl -I http://localhost/
```

## Troubleshooting Quick Fixes

### Services won't start
```bash
pm2 kill
sleep 2
pm2 start ecosystem.config.cjs
pm2 logs
```

### Port already in use
```bash
sudo lsof -i :3001
sudo kill -9 <PID>
pm2 start ecosystem.config.cjs
```

### Build fails
```bash
cd /var/www/renuga-crm
rm -rf node_modules package-lock.json
npm install --legacy-peer-deps
npm run build
```

### Permission denied
```bash
sudo chown -R ubuntu:ubuntu /var/www/renuga-crm
sudo chown -R ubuntu:ubuntu /var/log/pm2
```

### Check logs for errors
```bash
pm2 logs renuga-crm-api --lines 100
tail -50 /var/log/nginx/error.log
cat /var/www/renuga-crm/server/.env | grep DATABASE_URL
```

## Environment Variables

View/edit:
```bash
cat /var/www/renuga-crm/server/.env

# Edit
nano /var/www/renuga-crm/server/.env

# After editing, restart
pm2 restart renuga-crm-api
```

## File Locations

```
/var/www/renuga-crm/           # App root
/var/www/renuga-crm/dist/      # Built frontend
/var/www/renuga-crm/server/    # Backend app
/var/www/renuga-crm/server/.env  # Backend config
/var/log/pm2/                  # PM2 logs
/var/log/nginx/                # Nginx logs
/var/log/renuga-crm/           # Deployment logs
/etc/nginx/sites-available/renuga-crm  # Nginx config
```

## Status Check Script

```bash
#!/bin/bash
echo "=== Renuga CRM Status ==="
echo ""
echo "Git Status:"
cd /var/www/renuga-crm && git log -1 --oneline
echo ""
echo "Services:"
pm2 list | grep renuga
echo ""
echo "Nginx:"
sudo systemctl status nginx --no-pager
echo ""
echo "Frontend:"
curl -s -w "%{http_code}" http://localhost/ | tail -c 3
echo ""
echo "API:"
curl -s -w "%{http_code}" http://localhost:3001/ | tail -c 3
echo ""
```

## Full Reset (if needed)

```bash
# ⚠️ WARNING: This will reset everything!
cd /var/www/renuga-crm
pm2 stop all
pm2 delete all
git reset --hard origin/main
git clean -fd
rm -rf node_modules dist server/node_modules server/dist
npm install
npm run build
cd server
npm install
npm run build
cd ..
pm2 start ecosystem.config.cjs
```

## Quick Deployment Steps

1. **SSH in:**
   ```bash
   ssh -i key.pem ubuntu@ip
   ```

2. **Deploy:**
   ```bash
   cd /var/www/renuga-crm && ./deploy.sh
   ```

3. **Watch logs:**
   ```bash
   pm2 logs
   ```

4. **Test:**
   ```bash
   curl http://localhost/
   curl http://localhost:3001/
   ```

## Need Help?

1. Check logs: `pm2 logs renuga-crm-api --lines 100`
2. Check Nginx: `sudo tail -50 /var/log/nginx/error.log`
3. Check services: `pm2 list`
4. Rollback: `./deploy.sh --rollback`
5. View full guide: See `EC2_UPDATE_DEPLOYMENT_GUIDE.md`

---

**Pro Tips:**
- Create an alias: `alias deploy='cd /var/www/renuga-crm && ./deploy.sh'`
- Use tmux/screen for long operations
- Keep backups for at least 3 deployments
- Test build locally before pushing
- Always check logs after deployment
