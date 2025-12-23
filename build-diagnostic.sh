#!/bin/bash

###############################################################################
# Frontend Build Diagnostic Script
# This script helps debug why the frontend build is hanging
###############################################################################

set -e

# Colors
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

print_info() {
    echo -e "${BLUE}ℹ $1${NC}"
}

print_success() {
    echo -e "${GREEN}✓ $1${NC}"
}

print_error() {
    echo -e "${RED}✗ $1${NC}"
}

print_section() {
    echo -e "\n${YELLOW}>>> $1${NC}"
}

# Start diagnostic
print_header "Frontend Build Diagnostic"

# 1. Check environment
print_section "1. System Environment"
print_info "Node.js version:"
node --version
print_info "npm version:"
npm --version
print_info "Current directory:"
pwd
print_info "Disk space:"
df -h . | tail -1
print_info "Available memory:"
free -h | grep Mem

# 2. Check .env.local
print_section "2. Frontend Environment"
if [ -f ".env.local" ]; then
    print_success ".env.local exists"
    cat .env.local
else
    print_error ".env.local not found"
fi

# 3. Check node_modules
print_section "3. Node Modules Status"
if [ -d "node_modules" ]; then
    print_success "node_modules directory exists"
    print_info "Size: $(du -sh node_modules | cut -f1)"
    print_info "Checking critical packages..."
    
    npm ls vite 2>&1 | head -5 || print_error "Vite not found"
    npm ls typescript 2>&1 | head -5 || print_error "TypeScript not found"
    npm ls react 2>&1 | head -5 || print_error "React not found"
else
    print_error "node_modules directory not found"
fi

# 4. Check vite.config.ts
print_section "4. Vite Configuration"
if [ -f "vite.config.ts" ]; then
    print_success "vite.config.ts exists"
    print_info "File size: $(wc -c < vite.config.ts) bytes"
else
    print_error "vite.config.ts not found"
fi

# 5. Check package.json
print_section "5. Package Configuration"
if [ -f "package.json" ]; then
    print_success "package.json exists"
    print_info "Build script:"
    grep -A 1 '"build"' package.json || print_error "Build script not found"
else
    print_error "package.json not found"
fi

# 6. Check source files
print_section "6. Source Files"
print_info "Total src files: $(find src -type f | wc -l)"
print_info "TypeScript files: $(find src -name "*.ts*" | wc -l)"
print_info "Components:"
ls -la src/components | head -10

# 7. Check dist directory
print_section "7. Build Output Status"
if [ -d "dist" ]; then
    print_success "dist directory exists"
    print_info "Size: $(du -sh dist | cut -f1)"
    print_info "Files: $(find dist -type f | wc -l)"
    if [ -f "dist/index.html" ]; then
        print_success "dist/index.html exists"
    else
        print_error "dist/index.html NOT FOUND"
    fi
else
    print_info "dist directory does NOT exist (normal before build)"
fi

# 8. Try a test build
print_section "8. Attempting Build Test"
print_warning "This will run npm run build with verbose output"
print_info "Logs will be saved to: /tmp/build-diagnostic-$(date +%s).log"

BUILD_LOG="/tmp/build-diagnostic-$(date +%s).log"

print_info "Starting build..."
print_info "Command: npm run build"
print_info ""

# Run build with timeout and logging
if timeout 120 bash -c 'npm run build 2>&1 | tee -a '"${BUILD_LOG}"''; then
    print_success "Build completed successfully!"
    print_info "dist/ contents:"
    ls -lah dist/ | head -15
else
    EXIT_CODE=$?
    print_error "Build failed or timed out (exit code: $EXIT_CODE)"
    print_info ""
    print_info "Build log (last 100 lines):"
    tail -100 "${BUILD_LOG}"
    print_info ""
    print_error "Full log saved to: ${BUILD_LOG}"
fi

print_info ""
print_info "Build log available for analysis at: ${BUILD_LOG}"

# 9. Recommendations
print_section "9. Troubleshooting Recommendations"

print_info "If build is hanging, try:"
print_info "  1. Kill any hung processes: pkill -9 node"
print_info "  2. Clear cache: rm -rf node_modules/.vite"
print_info "  3. Rebuild lock: rm package-lock.json && npm install"
print_info "  4. Check disk space: df -h"
print_info "  5. Check memory: free -h"
print_info "  6. Increase timeout in ec2-setup.sh: timeout 1200 npm run build"
print_info "  7. Try simpler build: npm run build:dev"

print_info ""
print_info "If dependencies failed:"
print_info "  1. Clear npm cache: npm cache clean --force"
print_info "  2. Delete lock file: rm package-lock.json"
print_info "  3. Reinstall: npm install --legacy-peer-deps"
print_info "  4. Verify Vite: npm ls vite"

print_info ""
print_success "Diagnostic complete"
print_info "Log files:"
echo "  - This diagnostic: ${BUILD_LOG}"
echo "  - Future builds: /tmp/frontend-build-[timestamp].log"
