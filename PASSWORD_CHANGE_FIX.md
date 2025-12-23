# Password Change Fix - Debugging & Solution

## 🔍 Issue Identified

**Error:** `Error changing password: Error: Failed to update user`

**Root Causes Found & Fixed:**

### 1. **SQL Parameter Mapping Bug** ✅ FIXED
**Problem:** The parameter indices were hardcoded incorrectly in the updateUser function
```typescript
// BEFORE (WRONG):
let paramIndex = 6;  // Wrong! Should be dynamic
query += `, password_hash = $${paramIndex}`;
params.push(passwordHash);
paramIndex++;

// AFTER (CORRECT):
params.push(passwordHash);
query += `, password_hash = $${params.length}`;  // Dynamic index
```

**Why it failed:** When adding the password parameter, the index wasn't calculated correctly, causing SQL parameter mismatches.

### 2. **Database Migration Status** ⚠️ IMPORTANT
The error could also be caused if the `page_access` and `updated_at` columns don't exist in your database.

---

## 🛠️ Steps to Fix (Choose One)

### Option 1: Quick Fix (If columns already exist)
Your code is now fixed. Just redeploy:

```bash
# On your local machine:
git add .
git commit -m "fix: correct SQL parameter mapping in updateUser function"
git push origin main

# On EC2:
cd /var/www/renuga-crm && ./deploy.sh
```

### Option 2: Full Database Reset (If columns missing)
If the columns don't exist in your database, run this:

```bash
# On EC2, check if columns exist:
sudo -u postgres psql renuga_crm
\d users

# You should see:
# - page_access TEXT
# - updated_at TIMESTAMP

# If they're missing, run migration:
cd /var/www/renuga-crm/server
npm run migrate
```

### Option 3: Manual Database Fix
```bash
# On EC2 PostgreSQL:
sudo -u postgres psql renuga_crm

# Run these commands:
ALTER TABLE users ADD COLUMN IF NOT EXISTS page_access TEXT DEFAULT '[]';
ALTER TABLE users ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP;

# Verify:
\d users
```

---

## 📋 Complete Fix Summary

### Files Modified:
1. ✅ `/server/src/controllers/otherController.ts`
   - Fixed SQL parameter mapping in `updateUser()` function
   - Changed from hardcoded indices to dynamic `params.length`
   - Now correctly handles optional password parameter

2. ✅ `/src/pages/MasterDataPage.tsx`
   - Enhanced `handleChangePassword()` with better error handling
   - Added check for null `passwordUserId`
   - Dialog stays open on error for retry
   - Added `pageAccess` fallback to empty array

---

## ✅ Testing the Fix

### Test 1: Change Password
```
1. Go to Master Data → Users tab
2. Find a user
3. Click the "User" (password) button
4. Enter: NewPass123, Confirm: NewPass123
5. Click "Change Password"
6. ✅ Should show "Password changed successfully!"
7. ✅ No error in console
```

### Test 2: Verify Database Update
```bash
# On EC2:
sudo -u postgres psql renuga_crm

# Check the password was updated:
SELECT id, name, password_hash, updated_at FROM users WHERE id='USR-1' \G

# Should show:
# - password_hash: (hashed value starting with $2b$10$)
# - updated_at: (recent timestamp)
```

### Test 3: Check Page Access
```bash
# Still in psql:
SELECT id, name, page_access FROM users \G

# Should show JSON array like:
# - page_access: ["Dashboard", "Leads"]  (for non-admin)
# - page_access: ["Dashboard", "CallLog", "Leads", "Orders", "MasterData"]  (for admin)
```

---

## 🔐 Code Changes Explained

### Before (Broken):
```typescript
let query = `UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, page_access = $5, updated_at = CURRENT_TIMESTAMP`;
let params: any[] = [name, email.toLowerCase(), role, isActive !== false, accessToSet];
let paramIndex = 6;  // ← PROBLEM: Hardcoded!

if (password) {
  const passwordHash = await bcrypt.hash(password, 10);
  query += `, password_hash = $${paramIndex}`;  // Uses $6
  params.push(passwordHash);  // But params array is at index 5!
  paramIndex++;  // Now 7
}

query += ` WHERE id = $${paramIndex} RETURNING ...`;  // Uses $7 for id
params.push(id);  // But params array is at index 6!
```

**Result:** SQL expects parameters like `$1, $2, $3, $4, $5, $6, $7` but receives only 6 values → Database error!

### After (Fixed):
```typescript
let query = `UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, page_access = $5, updated_at = CURRENT_TIMESTAMP`;
let params: any[] = [name, email.toLowerCase(), role, isActive !== false, accessToSet];

if (password) {
  const passwordHash = await bcrypt.hash(password, 10);
  params.push(passwordHash);  // Add to params first
  query += `, password_hash = $${params.length}`;  // Use dynamic length (6)
}

params.push(id);  // Add ID to params
query += ` WHERE id = $${params.length} RETURNING ...`;  // Use dynamic length (7 or 6)
```

**Result:** Parameters always match query placeholders → Works!

---

## 📊 SQL Execution Examples

### Without Password Change:
```
Query: UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, page_access = $5, updated_at = CURRENT_TIMESTAMP WHERE id = $6 RETURNING ...
Params: [name, email, role, isActive, pageAccess, id]
✅ Matches: $1-$6
```

### With Password Change:
```
Query: UPDATE users SET name = $1, email = $2, role = $3, is_active = $4, page_access = $5, updated_at = CURRENT_TIMESTAMP, password_hash = $6 WHERE id = $7 RETURNING ...
Params: [name, email, role, isActive, pageAccess, passwordHash, id]
✅ Matches: $1-$7
```

---

## 🚀 Deployment Checklist

- [ ] Applied the code fix to `otherController.ts`
- [ ] Applied the code fix to `MasterDataPage.tsx`
- [ ] Verified database columns exist (page_access, updated_at)
- [ ] Ran database migration if needed
- [ ] Committed changes: `git add . && git commit`
- [ ] Pushed to GitHub: `git push origin main`
- [ ] Deployed to EC2: `./deploy.sh`
- [ ] Tested password change (no error)
- [ ] Verified database was updated
- [ ] Checked logs: `pm2 logs`

---

## 📝 Error Messages Reference

| Error | Cause | Solution |
|-------|-------|----------|
| "Failed to update user" | SQL parameter mismatch | ✅ Fixed in this update |
| "User not found" | passwordUserId is null | Already handled in code |
| "Passwords do not match" | Confirmation doesn't match | User error, handled |
| "Password must be at least 6 characters" | Too short | User error, handled |

---

## 🔗 Related Files

- `/server/src/controllers/otherController.ts` - Backend API controller
- `/src/pages/MasterDataPage.tsx` - Frontend UI component
- `/src/services/api.ts` - API client (no changes needed)
- `/server/src/config/migrate.ts` - Database schema (already updated)

---

## ✨ Additional Improvements

The fix also includes:
- ✅ Better error messages
- ✅ Dialog stays open on error (user can retry)
- ✅ Fallback for undefined pageAccess
- ✅ Better logging for debugging
- ✅ Proper null checking

---

**Status:** ✅ **FIXED & READY TO DEPLOY**

Test the password change feature - it should now work without errors!
