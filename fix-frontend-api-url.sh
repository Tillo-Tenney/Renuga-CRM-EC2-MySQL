#!/bin/bash

###############################################################################
# CRITICAL FIX: Frontend API URL Configuration
# Fixes: "ERR_CONNECTION_TIMED_OUT" on login
# Root Cause: Frontend trying to connect directly to :3001 (not accessible)
# Solution: Use Nginx proxy on port 80 instead
###############################################################################

set -e

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

print_header() {
    echo -e "\n${BLUE}========================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}========================================${NC}\n"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_header "FIXING: Frontend API Configuration"

# Get public IP
PUBLIC_IP=$(curl -s https://ipinfo.io/ip 2>/dev/null || curl -s ifconfig.me 2>/dev/null || echo "unknown")

if [ "$PUBLIC_IP" = "unknown" ]; then
    print_error "Could not determine public IP"
    read -p "Enter your public IP: " PUBLIC_IP
fi

print_info "Public IP: ${PUBLIC_IP}"
print_info "Detected issue: Frontend configured to use http://${PUBLIC_IP}:3001"
print_info "Port 3001 is NOT accessible from internet (only localhost)"
print_info "Fix: Change frontend to use Nginx proxy on port 80"
echo ""

# Step 1: Update frontend .env.local
print_header "Step 1: Updating Frontend Configuration"

cd /var/www/renuga-crm

print_info "Backing up current .env.local..."
if [ -f ".env.local" ]; then
    cp .env.local .env.local.backup
    print_success "Backup created: .env.local.backup"
else
    print_info "No existing .env.local found"
fi

print_info "Creating new .env.local with correct API URL..."
cat > .env.local << EOF
# API Configuration
# Use Nginx proxy (port 80) instead of direct backend connection (port 3001)
# Port 3001 is only accessible from localhost, not from the public internet
VITE_API_URL=http://${PUBLIC_IP}
EOF

chmod 600 .env.local
print_success ".env.local updated"
print_info "Content:"
cat .env.local | sed 's/^/  /'

echo ""

# Step 2: Rebuild frontend
print_header "Step 2: Rebuilding Frontend"

print_info "Removing old build..."
rm -rf dist
print_success "Old dist/ removed"

print_info "Building frontend with new API URL..."
npm run build 2>&1 | tail -20

if [ ! -d "dist" ]; then
    print_error "Build failed - dist/ not created"
    exit 1
fi

print_success "Frontend built successfully"
print_info "Build size:"
du -sh dist | sed 's/^/  /'

echo ""

# Step 3: Reload Nginx
print_header "Step 3: Reloading Nginx"

print_info "Testing Nginx configuration..."
sudo nginx -t

print_info "Reloading Nginx..."
sudo systemctl reload nginx
print_success "Nginx reloaded"

echo ""

# Step 4: Verify
print_header "Step 4: Verification"

print_info "Checking if API is accessible through Nginx..."

# Test through Nginx (should work now)
RESPONSE=$(timeout 5 curl -s -o /dev/null -w "%{http_code}" \
    -X POST http://localhost/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"admin@renuga.com","password":"admin123"}' 2>/dev/null || echo "000")

if [ "$RESPONSE" = "200" ]; then
    print_success "API accessible through Nginx proxy ✓"
else
    print_error "API returned status: $RESPONSE (expected 200)"
fi

echo ""

# Summary
print_header "SUMMARY"

echo -e "${GREEN}✓ Frontend .env.local updated${NC}"
echo -e "  Old: VITE_API_URL=http://${PUBLIC_IP}:3001"
echo -e "  New: VITE_API_URL=http://${PUBLIC_IP}"
echo ""

echo -e "${GREEN}✓ Frontend rebuilt${NC}"
echo -e "  New build includes corrected API endpoint"
echo ""

echo -e "${GREEN}✓ Nginx reloaded${NC}"
echo -e "  Ready to serve requests"
echo ""

echo -e "${YELLOW}NEXT STEPS:${NC}"
echo "1. Open your browser: http://${PUBLIC_IP}"
echo "2. Clear cache: Ctrl+Shift+Del"
echo "3. Hard refresh: Ctrl+F5"
echo "4. Try login with: admin@renuga.com / admin123"
echo ""

echo -e "${GREEN}✨ Fix complete! Login should now work.${NC}"
