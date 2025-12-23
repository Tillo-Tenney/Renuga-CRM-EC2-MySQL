# Frontend npm Install Logging Fix

## Problem

During Step 5 of the EC2 deployment, the frontend dependency installation was failing with:

```
timeout: failed to run command 'wait': No such file or directory
✗ Frontend dependency installation failed or timed out (exit code: 0)
✗ ERROR: Log file not created at /tmp/frontend-install-1766494363.log
```

The log file was **never created**, even though the script claimed to be logging.

## Root Cause

The original code used a problematic pattern with subshells and background processes:

```bash
# ❌ BROKEN CODE
(
    echo "=== Frontend npm install started..." > "${INSTALL_LOG}"
    npm install --legacy-peer-deps 2>&1 | tee -a "${INSTALL_LOG}"
    echo "=== Frontend npm install completed..." >> "${INSTALL_LOG}"
) &
local INSTALL_PID=$!

# Wait for install with timeout
if ! timeout 600 wait $INSTALL_PID; then
    EXIT_CODE=$?
    # ...
fi
```

**Why this failed:**

1. **Subshell runs in background**: The parentheses `()` create a subshell, and `&` runs it in background
2. **`timeout` doesn't understand `wait`**: The `timeout` command tried to run `wait` as an executable, but `wait` is a bash builtin
3. **`wait` doesn't exist in PATH**: Error message: "failed to run command 'wait': No such file or directory"
4. **Log operations in subshell**: Since the subshell was backgrounded, even if logging worked, it would be unreliable
5. **Exit code confusion**: After `timeout` failed, the script checked `$?` which was `0` (success) but the actual process may not have completed

## Solution

Simplified the pattern to run npm install directly with proper logging:

```bash
# ✅ FIXED CODE
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
    # ...
fi

if [ $INSTALL_EXIT -ne 0 ]; then
    print_error "Frontend dependency installation failed (exit code: ${INSTALL_EXIT})"
    # ...
fi
```

**Why this works:**

1. **No background processes**: Runs npm install in foreground, directly under `timeout`
2. **`timeout` works correctly**: Controls the npm process directly
3. **Log file created immediately**: `tee` writes output to file in real-time
4. **Correct exit code**: `${PIPESTATUS[0]}` captures npm's exit code (not tee's)
5. **Reliable error reporting**: If npm fails, exit code is captured and reported

## Key Changes

| Aspect | Before | After |
|--------|--------|-------|
| **Process Model** | Background subshell + wait | Direct foreground process |
| **Timeout Method** | `timeout wait $PID` | `timeout npm install` |
| **Logging** | Inside subshell | Direct with tee |
| **Exit Code** | `$?` after timeout (unreliable) | `${PIPESTATUS[0]}` (reliable) |
| **Log File** | Never created | Created immediately |

## Impact

**Deployment Step 5 will now:**
- ✅ Create `/tmp/frontend-install-[timestamp].log` immediately when npm install starts
- ✅ Write output to log file in real-time (can watch with `tail -f`)
- ✅ Capture correct exit code from npm
- ✅ Report installation errors clearly
- ✅ Show installation progress

**Note:** The same pattern was already applied to the frontend **build** section in the previous fix. This commit brings the **install** section into alignment.

## Testing

To verify the fix works on EC2:

```bash
# Watch for log creation
tail -f /tmp/frontend-install-*.log &

# Run deployment
sudo bash ec2-setup.sh

# Expected behavior:
# 1. Log file created immediately when Step 5 starts
# 2. Output visible in real-time in both console and log file
# 3. If npm install succeeds: Build step begins
# 4. If npm install fails: Error shown in log file
```

## Files Modified

- `ec2-setup.sh` - Lines 277-309 (npm install section)
- Same build section pattern already in place (lines 330-410)

## Related Documentation

- See `FRONTEND_BUILD_HANGING_ROOT_CAUSE.md` for the full history of build issues
- See `build-diagnostic.sh` for troubleshooting frontend build issues
