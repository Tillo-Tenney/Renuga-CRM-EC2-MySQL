# Testing the npm Install Fix

## Quick Verification Steps

### 1. Review the Changes

```bash
# See what was changed
git log --oneline -5

# Should show:
# 22e50b8 Add summary document for npm install logging fix
# 6b98be5 Add visual before/after comparison for npm install fix
# 2f1abd1 Fix npm install logging - remove broken wait/timeout/subshell pattern
```

### 2. Verify Code in ec2-setup.sh

Check that the npm install section has the correct pattern:

```bash
# Search for the fixed code
grep -A 20 "# Run npm install with tee for real-time logging" ec2-setup.sh

# Should show:
# timeout 600 npm install --legacy-peer-deps 2>&1 | tee -a "${INSTALL_LOG}"
# INSTALL_EXIT=${PIPESTATUS[0]}
```

## Testing on EC2

### Before Running Deployment

Ensure you have a fresh EC2 instance (or clean up previous attempts):

```bash
# Stop any running processes
sudo pkill -9 npm
sudo pkill -9 node

# Clean old logs
rm -f /tmp/frontend-install-*.log
rm -f /tmp/frontend-build-*.log

# Verify clean slate
ls -lah /tmp/frontend-*.log 2>/dev/null || echo "No old logs found (good!)"
```

### Run Deployment

```bash
# Start deployment with full output visible
sudo bash ec2-setup.sh 2>&1 | tee deployment.log

# Or if you're already in the deployment:
# It will proceed to Step 5: Configuring Frontend
```

### Monitor Log Creation (In Another Terminal)

```bash
# Watch for log files being created
watch -n 1 'ls -lah /tmp/frontend-*.log 2>/dev/null || echo "Waiting for logs..."'

# Or with tail
tail -f /tmp/frontend-install-*.log &
tail -f /tmp/frontend-build-*.log &
```

## Expected Output During Step 5

```
Step 5: Configuring Frontend
========================================

ℹ Public IP detected: 51.21.182.3
✓ Frontend .env.local created
ℹ Creating frontend environment configuration...
ℹ Installing frontend dependencies (this may take 2-3 minutes)...
ℹ Cleaning old node_modules and lock file...
✓ Cleaned
ℹ Install log: /tmp/frontend-install-1704888123.log
ℹ Running: npm install --legacy-peer-deps

npm notice created a lockfile as package-lock.json, you must commit this
npm notice
npm notice > renuga-crm@0.0.1 postinstall
npm notice > npm list 2>&1 | grep -c 'deduped'
npm notice
added XXX packages in Xs

✓ Frontend dependencies installed successfully
ℹ Verifying Vite installation...
✓ Building frontend for production (this may take 3-5 minutes)...
ℹ Vite is compiling TypeScript and bundling assets...
ℹ Build log: /tmp/frontend-build-1704888156.log

[Vite build output...]

✓ Frontend built successfully
ℹ dist/ takes up XXX MB
```

## Success Indicators

✅ **Log file created at startup:**
```bash
ls -lah /tmp/frontend-install-*.log
# -rw-r--r-- 1 root root  5123 Dec 23 14:23 /tmp/frontend-install-1704888123.log
```

✅ **Log file contains output immediately:**
```bash
cat /tmp/frontend-install-*.log | head -20
# === Frontend npm install started at Thu Dec 23 14:22:38 UTC 2024 ===
# Working directory: /var/www/renuga-crm
# Node version: v20.10.0
# npm version: 10.8.2
```

✅ **Real-time output visible:**
```bash
tail -f /tmp/frontend-install-*.log
# Should show npm progress as it installs
```

✅ **Build completes successfully:**
```bash
tail -10 /tmp/frontend-build-*.log
# === Frontend build completed at Thu Dec 23 14:25:38 UTC 2024 ===
# Exit code: 0
```

## Troubleshooting

### If you still see the "wait" error:

This shouldn't happen with the new code, but if you do:
1. Verify you're using the updated `ec2-setup.sh`
2. Run `git pull origin main` to ensure you have latest
3. Check that line 302 has: `timeout 600 npm install --legacy-peer-deps 2>&1 | tee -a "${INSTALL_LOG}"`

### If log files still aren't created:

1. Check filesystem permissions:
```bash
ls -lad /tmp
# Should be: drwxrwxrwt ... /tmp
```

2. Check disk space:
```bash
df -h /tmp
# Should have at least 1GB free
```

3. Run script directly (not via ssh for initial test):
```bash
# On EC2 instance directly
bash ec2-setup.sh
```

### If npm install times out (>600 seconds):

1. Check instance resources:
```bash
free -h
df -h
top -b -n 1 | head -20
```

2. The timeout is set to 600 seconds (10 minutes) in the script
3. If consistently timing out, your instance may be too small
4. Try with a larger instance (t3.medium or t3.large)

## Log File Contents Example

The log files will contain structured output:

```
========================================
Frontend Install Log
========================================
Started: Thu Dec 23 14:22:38 UTC 2024
Node: v20.10.0
npm: 10.8.2
Working directory: /var/www/renuga-crm
========================================

npm notice created a lockfile as package-lock.json
npm notice >
npm notice > renuga-crm@0.0.1 postinstall
npm notice > npm list 2>&1 | grep -c 'deduped'
npm notice >
added 487 packages in 45s

========================================
Frontend npm install completed at Thu Dec 23 14:23:23 UTC 2024
Exit code: 0
========================================
```

## Rollback (If Needed)

If you need to go back to previous version:

```bash
# See commit history
git log --oneline | head -10

# Revert to before this fix
git revert 2f1abd1 --no-edit

# Or checkout the specific file from older commit
git checkout HEAD~3 -- ec2-setup.sh
```

## Verification Checklist

- [ ] Latest code pulled from main branch
- [ ] `ec2-setup.sh` has the new logging pattern (lines 277-309)
- [ ] No old `/tmp/frontend-*.log` files from previous attempts
- [ ] EC2 instance has at least 4GB RAM
- [ ] EC2 instance has at least 10GB free disk space
- [ ] Running with `sudo bash ec2-setup.sh`
- [ ] Monitoring `/tmp/frontend-*.log` files during deployment
- [ ] Deployment completes Step 5 successfully
- [ ] Both install and build log files exist with content
- [ ] Application is accessible at the public IP

## Next Steps After Successful Deployment

Once deployment succeeds:

1. Test the application:
```bash
curl -s http://<PUBLIC_IP> | head -20
```

2. Check backend health:
```bash
curl -s http://<PUBLIC_IP>:3001/health
```

3. View backend logs:
```bash
pm2 logs renuga-crm-api
```

4. Access the web interface:
```
Open browser: http://<PUBLIC_IP>
Login: admin@renuga.com / admin123
```

5. Backup the database:
```bash
/usr/local/bin/backup-renuga-db.sh
```
