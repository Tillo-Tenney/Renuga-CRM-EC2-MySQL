# Frontend Dependency Installation - Before & After

## The Error You Were Getting

```
ℹ Running: npm install --legacy-peer-deps
timeout: failed to run command 'wait': No such file or directory
✗ Frontend dependency installation failed or timed out (exit code: 0)
✗ ERROR: Log file not created at /tmp/frontend-install-1766494363.log
```

## Before (Broken) ❌

```bash
# Run npm install with very verbose output
print_info "Running: npm install --legacy-peer-deps"
(
    echo "=== Frontend npm install started at $(date) ===" > "${INSTALL_LOG}"
    npm install --legacy-peer-deps 2>&1 | tee -a "${INSTALL_LOG}"
    echo "=== Frontend npm install completed at $(date) ===" >> "${INSTALL_LOG}"
) &
local INSTALL_PID=$!

# Wait for install with timeout
if ! timeout 600 wait $INSTALL_PID; then
    EXIT_CODE=$?
    print_error "Frontend dependency installation failed or timed out (exit code: ${EXIT_CODE})"
    print_error ""
    print_error "Last 50 lines of install log:"
    if [ -f "${INSTALL_LOG}" ]; then
        tail -50 "${INSTALL_LOG}"
    else
        print_error "ERROR: Log file not created at ${INSTALL_LOG}"
    fi
    return 1
fi

# Verify npm install exit code
if [ $? -ne 0 ]; then
    print_error "npm install process exited with error"
    tail -50 "${INSTALL_LOG}"
    return 1
fi
```

### Problems With This Approach

1. **Subshell runs in background** - The `()` followed by `&` backgrounds everything
2. **`timeout wait` fails** - `wait` is a bash builtin, not an executable file
3. **Error message** - "failed to run command 'wait': No such file or directory"
4. **Log file never created** - Because tee was in the backgrounded subshell
5. **Exit code unreliable** - `$?` could be from timeout, not npm

---

## After (Fixed) ✅

```bash
# Run npm install with very verbose output
print_info "Running: npm install --legacy-peer-deps"

# Initialize log file
{
    echo "=== Frontend npm install started at $(date) ==="
    echo "Working directory: $(pwd)"
    echo "Node version: $(node --version)"
    echo "npm version: $(npm --version)"
    echo ""
} > "${INSTALL_LOG}"

# Run npm install with tee for real-time logging
timeout 600 npm install --legacy-peer-deps 2>&1 | tee -a "${INSTALL_LOG}"
INSTALL_EXIT=${PIPESTATUS[0]}

# Log completion
{
    echo ""
    echo "=== Frontend npm install completed at $(date) ==="
    echo "Exit code: ${INSTALL_EXIT}"
} >> "${INSTALL_LOG}"

# Check exit code
if [ $INSTALL_EXIT -eq 124 ]; then
    print_error "Frontend dependency installation timed out after 600 seconds"
    print_error "Last 50 lines of install log:"
    tail -50 "${INSTALL_LOG}"
    return 1
fi

if [ $INSTALL_EXIT -ne 0 ]; then
    print_error "Frontend dependency installation failed (exit code: ${INSTALL_EXIT})"
    print_error "Last 50 lines of install log:"
    tail -50 "${INSTALL_LOG}"
    return 1
fi
```

### Why This Works

1. **Direct foreground execution** - No subshells, no backgrounds
2. **`timeout` controls npm directly** - Proper timeout mechanism
3. **No error messages** - `timeout` works as expected
4. **Log file created immediately** - `tee` writes in real-time
5. **Reliable exit code** - `${PIPESTATUS[0]}` gets npm's actual exit code

---

## Key Differences

| Aspect | Before | After |
|--------|--------|-------|
| **Process execution** | `(command) &` background | Direct foreground `timeout command` |
| **Timeout method** | `timeout wait $PID` ❌ | `timeout npm install` ✅ |
| **Logging location** | Inside backgrounded subshell | Direct with tee |
| **Exit code capture** | `$?` after timeout | `${PIPESTATUS[0]}` |
| **Log file timing** | Never created | Created immediately |
| **Real-time output** | No | Yes (visible in console + file) |

---

## What You'll See Now

When you run `sudo bash ec2-setup.sh` on EC2:

```
Step 5: Configuring Frontend
========================================

ℹ Public IP detected: 51.21.182.3
ℹ Creating frontend environment configuration...
✓ Frontend .env.local created
ℹ Environment: VITE_API_URL=http://51.21.182.3:3001
ℹ Installing frontend dependencies (this may take 2-3 minutes)...
ℹ Cleaning old node_modules and lock file...
✓ Cleaned
ℹ Install log: /tmp/frontend-install-1766494363.log
ℹ Running: npm install --legacy-peer-deps

[Output shows real-time npm install progress]

✓ Frontend dependencies installed successfully
ℹ Building frontend for production (this may take 3-5 minutes)...
ℹ Build log: /tmp/frontend-build-1766494380.log

[Output shows real-time build progress]

✓ Frontend built successfully
```

**Key improvements:**
- ✅ Log files are actually created
- ✅ Progress visible in real-time
- ✅ Errors are properly reported
- ✅ No mysterious timeouts or "No such file or directory" errors
