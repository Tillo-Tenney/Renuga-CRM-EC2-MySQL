#!/bin/bash

###############################################################################
# Quick Backend Status Check
# Run this to immediately see what's wrong with the API
###############################################################################

echo "🔍 RENUGA CRM - BACKEND STATUS CHECK"
echo "===================================="
echo ""

# Check PM2 status
echo "1️⃣ PM2 Process Status:"
echo "---"
sudo pm2 list
echo ""

# Check port 3001
echo "2️⃣ Port 3001 Status:"
echo "---"
sudo netstat -tuln 2>/dev/null | grep 3001 || echo "⚠️  Port 3001 NOT listening"
echo ""

# Check logs
echo "3️⃣ Recent Backend Errors (last 20 lines):"
echo "---"
sudo tail -20 /var/log/pm2/renuga-crm-api-error.log 2>/dev/null || echo "⚠️  Error log not found"
echo ""

# Check MySQL
echo "4️⃣ MySQL Status:"
echo "---"
sudo systemctl status mysql --no-pager | head -5
echo ""

# Backend .env check
echo "5️⃣ Backend Configuration:"
echo "---"
if [ -f "/var/www/renuga-crm/server/.env" ]; then
    echo "✅ .env exists"
    echo "   Database: $(grep DB_NAME /var/www/renuga-crm/server/.env | cut -d= -f2)"
    echo "   Host: $(grep DB_HOST /var/www/renuga-crm/server/.env | cut -d= -f2)"
    echo "   Port: $(grep DB_PORT /var/www/renuga-crm/server/.env | cut -d= -f2)"
else
    echo "❌ .env not found"
fi
echo ""

# Test API directly
echo "6️⃣ Direct API Test (localhost):"
echo "---"
timeout 3 curl -s http://localhost:3001/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@renuga.com","password":"admin123"}' \
  -w "\nStatus: %{http_code}\n" || echo "⚠️  Request timed out or failed"
echo ""

echo "===================================="
echo "📋 RECOMMENDATION:"
echo "---"

# Check which service is down
PM2_STATUS=$(sudo pm2 list 2>/dev/null | grep "renuga-crm-api" | grep "online" 2>/dev/null)
MYSQL_STATUS=$(sudo systemctl is-active mysql 2>/dev/null)
PORT_LISTENING=$(sudo netstat -tuln 2>/dev/null | grep ":3001 " 2>/dev/null)

if [ -z "$PM2_STATUS" ]; then
    echo "❌ PROBLEM: Backend process is NOT running"
    echo ""
    echo "FIX: Run these commands:"
    echo "  cd /var/www/renuga-crm"
    echo "  sudo pm2 restart renuga-crm-api"
    echo "  sleep 5"
    echo "  sudo pm2 status"
elif [ "$MYSQL_STATUS" != "active" ]; then
    echo "❌ PROBLEM: MySQL is NOT running"
    echo ""
    echo "FIX: Run these commands:"
    echo "  sudo systemctl start mysql"
    echo "  sudo pm2 restart renuga-crm-api"
    echo "  sleep 5"
    echo "  sudo pm2 status"
elif [ -z "$PORT_LISTENING" ]; then
    echo "❌ PROBLEM: Backend crashed or won't start"
    echo ""
    echo "CHECK LOGS: Run this command:"
    echo "  sudo pm2 logs renuga-crm-api --lines 50"
    echo ""
    echo "FIX: If you see database errors, check .env and restart:"
    echo "  sudo pm2 restart renuga-crm-api"
    echo "  sleep 5"
    echo "  sudo pm2 logs renuga-crm-api --lines 20"
else
    echo "✅ Backend appears to be running"
    echo ""
    echo "NEXT STEPS:"
    echo "  1. Clear browser cache (Ctrl+Shift+Del)"
    echo "  2. Hard refresh: Ctrl+F5"
    echo "  3. Try login again"
fi
echo ""
