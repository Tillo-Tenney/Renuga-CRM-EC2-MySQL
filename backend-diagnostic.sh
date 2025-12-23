#!/bin/bash

###############################################################################
# Renuga CRM - Backend Connectivity Diagnostic Script
# Diagnoses why API calls timeout (net::ERR_CONNECTION_TIMED_OUT)
###############################################################################

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

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

print_warning() {
    echo -e "${YELLOW}⚠ $1${NC}"
}

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

# Start diagnosis
print_header "Renuga CRM - Backend Connectivity Diagnostic"

# Check if running as root
if [ "$EUID" -ne 0 ]; then
    print_warning "Some checks require root. Results may be incomplete."
    print_info "Run with: sudo bash backend-diagnostic.sh"
fi

# ============================================================================
# 1. Check PM2 Status
# ============================================================================
print_header "Step 1: Checking PM2 Backend Process"

if ! command -v pm2 &> /dev/null; then
    print_error "PM2 not installed"
else
    print_success "PM2 is installed"
    
    print_info "PM2 process list:"
    pm2 list
    echo ""
    
    # Check if renuga-crm-api is running
    if pm2 list | grep -q "renuga-crm-api"; then
        print_success "renuga-crm-api found in PM2"
        
        # Check status
        if pm2 list | grep "renuga-crm-api" | grep -q "online"; then
            print_success "renuga-crm-api is ONLINE"
        elif pm2 list | grep "renuga-crm-api" | grep -q "stopped"; then
            print_error "renuga-crm-api is STOPPED"
            print_info "Attempting to restart..."
            cd /var/www/renuga-crm
            pm2 start ecosystem.config.cjs
            sleep 2
            pm2 list
        else
            print_warning "renuga-crm-api status unknown"
            pm2 list | grep "renuga-crm-api"
        fi
    else
        print_error "renuga-crm-api NOT found in PM2"
        print_info "Available processes:"
        pm2 list
    fi
fi

# ============================================================================
# 2. Check Port 3001 Listening
# ============================================================================
print_header "Step 2: Checking Port 3001 Listening"

if netstat -tuln | grep -q ":3001 "; then
    print_success "Port 3001 is listening"
    print_info "Process listening on 3001:"
    netstat -tuln | grep ":3001"
    echo ""
elif ss -tuln | grep -q ":3001 "; then
    print_success "Port 3001 is listening (via ss)"
    print_info "Process listening on 3001:"
    ss -tuln | grep ":3001"
    echo ""
else
    print_error "Port 3001 is NOT listening"
    print_error "This is the problem! Backend is not running or not on port 3001"
fi

# ============================================================================
# 3. Check PM2 Logs
# ============================================================================
print_header "Step 3: Checking PM2 Backend Logs"

if [ -f "/var/log/pm2/renuga-crm-api-error.log" ]; then
    print_info "Error log:"
    tail -30 "/var/log/pm2/renuga-crm-api-error.log"
    echo ""
else
    print_warning "Error log not found: /var/log/pm2/renuga-crm-api-error.log"
fi

if [ -f "/var/log/pm2/renuga-crm-api-out.log" ]; then
    print_info "Output log:"
    tail -30 "/var/log/pm2/renuga-crm-api-out.log"
    echo ""
else
    print_warning "Output log not found: /var/log/pm2/renuga-crm-api-out.log"
fi

# ============================================================================
# 4. Check Nginx Configuration
# ============================================================================
print_header "Step 4: Checking Nginx Configuration"

if [ -f "/etc/nginx/sites-enabled/renuga-crm" ]; then
    print_success "Nginx config exists"
    
    print_info "Testing Nginx configuration..."
    if nginx -t 2>&1 | grep -q "successful"; then
        print_success "Nginx configuration is valid"
    else
        print_error "Nginx configuration has errors:"
        nginx -t
    fi
    
    print_info "API location block:"
    grep -A 15 "location /api" /etc/nginx/sites-enabled/renuga-crm || print_warning "Could not find /api location"
    echo ""
else
    print_error "Nginx config not found: /etc/nginx/sites-enabled/renuga-crm"
fi

# ============================================================================
# 5. Test Nginx Connectivity
# ============================================================================
print_header "Step 5: Testing Nginx Backend Proxy"

print_info "Testing localhost:80 -> localhost:3001 proxy..."

# Test through Nginx
print_info "Attempting: curl http://localhost/api/auth/login -v (with timeout)"
timeout 5 curl -v http://localhost/api/auth/login 2>&1 | head -30 || print_warning "Request timed out or failed"
echo ""

# Test direct to backend
print_info "Testing direct localhost:3001..."
timeout 5 curl -v http://localhost:3001/api/auth/login 2>&1 | head -30 || print_warning "Request timed out or failed"
echo ""

# ============================================================================
# 6. Check Firewall
# ============================================================================
print_header "Step 6: Checking Firewall Rules"

if command -v ufw &> /dev/null; then
    print_info "UFW Status:"
    ufw status || print_warning "Could not get UFW status"
    echo ""
else
    print_warning "UFW not installed"
fi

# ============================================================================
# 7. Check Backend Application Files
# ============================================================================
print_header "Step 7: Checking Backend Application Files"

APP_DIR="/var/www/renuga-crm"
BACKEND_DIR="${APP_DIR}/server"

if [ -d "$BACKEND_DIR" ]; then
    print_success "Backend directory exists: $BACKEND_DIR"
    
    if [ -f "$BACKEND_DIR/.env" ]; then
        print_success ".env file exists"
        print_info "Database config:"
        grep "DB_" "$BACKEND_DIR/.env" | sed 's/DB_PASSWORD=.*/DB_PASSWORD=***/' || print_warning "Could not read DB config"
    else
        print_error ".env file NOT found"
    fi
    
    if [ -f "$BACKEND_DIR/package.json" ]; then
        print_success "package.json exists"
    else
        print_error "package.json NOT found"
    fi
    
    if [ -f "$BACKEND_DIR/dist/index.js" ]; then
        print_success "Built index.js exists"
    else
        print_warning "Built index.js NOT found - backend may not be built"
    fi
    
    if [ -d "$BACKEND_DIR/node_modules" ]; then
        print_success "node_modules exists"
    else
        print_error "node_modules NOT found - dependencies may not be installed"
    fi
else
    print_error "Backend directory NOT found: $BACKEND_DIR"
fi

# ============================================================================
# 8. Check Database Connectivity
# ============================================================================
print_header "Step 8: Checking Database Connectivity"

if command -v mysql &> /dev/null; then
    print_info "Testing MySQL connection..."
    
    # Read credentials from env
    if [ -f "$BACKEND_DIR/.env" ]; then
        source "$BACKEND_DIR/.env" 2>/dev/null || true
    fi
    
    if [ -n "$DB_USER" ] && [ -n "$DB_PASSWORD" ]; then
        if mysql -u "$DB_USER" -p"$DB_PASSWORD" -h "$DB_HOST" -e "SELECT 1;" 2>/dev/null; then
            print_success "MySQL database connection OK"
        else
            print_error "MySQL database connection FAILED"
            print_error "Check that database is running and credentials are correct"
        fi
    else
        print_warning "DB_USER or DB_PASSWORD not found in .env"
    fi
else
    print_warning "mysql client not installed"
fi

# ============================================================================
# 9. Recommendations
# ============================================================================
print_header "Diagnostic Complete - Recommendations"

# Determine the problem
if ! pm2 list | grep -q "renuga-crm-api.*online"; then
    print_error "PROBLEM: Backend process is not running"
    echo ""
    print_info "SOLUTION: Restart the backend"
    echo "  1. sudo pm2 start ecosystem.config.cjs"
    echo "  2. Wait 5 seconds for startup"
    echo "  3. Check logs: sudo pm2 logs renuga-crm-api"
    echo "  4. Try login again"
elif ! ss -tuln | grep -q ":3001 " && ! netstat -tuln | grep -q ":3001 "; then
    print_error "PROBLEM: Port 3001 is not listening"
    echo ""
    print_info "SOLUTION: Check backend logs"
    echo "  1. sudo pm2 logs renuga-crm-api"
    echo "  2. Look for startup errors"
    echo "  3. If database connection fails, verify:"
    echo "     mysql -u renuga_user -p -h localhost renuga_crm"
    echo "  4. Restart: sudo pm2 restart renuga-crm-api"
else
    print_success "PROBLEM NOT FOUND IN STANDARD CHECKS"
    echo ""
    print_info "Backend appears to be running. Problem might be:"
    echo "  • Client-side API URL configuration (VITE_API_URL)"
    echo "  • Network/firewall between client and backend"
    echo "  • Backend authentication middleware failing"
    echo ""
    print_info "Next steps:"
    echo "  1. Check browser console for full error message"
    echo "  2. Check Nginx logs: tail -f /var/log/nginx/error.log"
    echo "  3. Check backend logs: sudo pm2 logs renuga-crm-api"
    echo "  4. Verify frontend API URL: grep VITE_API_URL /var/www/renuga-crm/.env.local"
fi

echo ""
print_info "Full logs can be viewed with:"
echo "  Backend errors: sudo tail -f /var/log/pm2/renuga-crm-api-error.log"
echo "  Backend output: sudo tail -f /var/log/pm2/renuga-crm-api-out.log"
echo "  Nginx errors:   sudo tail -f /var/log/nginx/error.log"
echo "  Nginx access:   sudo tail -f /var/log/nginx/access.log"
echo ""
