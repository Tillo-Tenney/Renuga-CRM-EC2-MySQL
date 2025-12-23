# Quick Testing Guide - Page-Level Access Control

**After deploying the changes, follow these steps to verify everything works.**

---

## 🎯 Test Scenario 1: Admin User (Baseline)

### Steps:
1. **Login as Admin**
   - Email: `admin@example.com`
   - Password: (your admin password)

2. **Verify:**
   - [ ] Can see all 5 pages in sidebar: Dashboard, Leads, Orders, Call Logs, Master Data
   - [ ] Can access all pages by clicking them
   - [ ] Can access all API endpoints

3. **Expected Result:**
   - ✅ No restrictions for admin

---

## 🎯 Test Scenario 2: Create Non-Admin User with Limited Access

### Steps:
1. **Go to Master Data → User Management**

2. **Click "Add User"**

3. **Fill form:**
   ```
   Name: Test User 1
   Email: testuser1@example.com
   Password: TestPassword123
   Role: User (not Admin)
   ```

4. **Assign Permissions:**
   - ✅ Check: **Leads**
   - ✅ Check: **Orders**
   - ❌ Uncheck: Dashboard, Call Logs, Master Data

5. **Click "Save User"**

6. **Expected Result:**
   - ✅ User created successfully
   - ✅ pageAccess stored: `["Leads", "Orders"]`

---

## 🎯 Test Scenario 3: Non-Admin User - Limited Sidebar

### Steps:
1. **Logout** (Click account menu → Logout)

2. **Login as Test User 1**
   - Email: `testuser1@example.com`
   - Password: `TestPassword123`

3. **Check Sidebar:**
   - ❌ **Should NOT see:** Dashboard, Call Logs, Master Data
   - ✅ **Should see:** Leads, Orders

4. **Try to access restricted page:**
   - Click on "Dashboard" (if visible) - should be blocked
   - Or manually go to URL: `http://localhost/dashboard`
   - **Expected:** Route protection kicks in, page doesn't load

5. **Expected Result:**
   - ✅ Sidebar filtered correctly
   - ✅ Can only see Leads & Orders
   - ✅ Dashboard/Call Logs hidden

---

## 🎯 Test Scenario 4: Non-Admin User - API Authorization

### Steps:
1. **Open Browser DevTools** (F12)

2. **Go to Console tab**

3. **Get the JWT token:**
   ```javascript
   // Paste this in console:
   const token = localStorage.getItem('token');
   console.log(token);
   // Copy the output
   ```

4. **Test authorized API (should work):**
   ```bash
   curl -H "Authorization: Bearer <PASTE_TOKEN>" http://localhost:3001/api/leads
   # Should return 200 OK + lead data
   ```

5. **Test unauthorized API (should get 403):**
   ```bash
   curl -H "Authorization: Bearer <PASTE_TOKEN>" http://localhost:3001/api/call-logs
   # Should return 403 Forbidden
   # Error: "Access denied to this resource"
   ```

6. **Expected Result:**
   - ✅ Leads API returns 200 (user has Leads permission)
   - ✅ Call Logs API returns 403 (user doesn't have CallLog permission)
   - ✅ Master Data APIs return 403 (user doesn't have MasterData permission)

---

## 🎯 Test Scenario 5: Update Permissions (Persistence Check)

### Steps:
1. **Logout** (go back to admin)

2. **Login as Admin**

3. **Go to Master Data → User Management**

4. **Find "Test User 1"** and click edit

5. **Change Permissions:**
   - ✅ Check: **Dashboard**
   - ✅ Check: **Call Logs**
   - ❌ Uncheck: **Orders**

6. **Click "Save User"**

7. **Logout**

8. **Login as Test User 1 again**

9. **Check Sidebar:**
   - ✅ **Should now see:** Leads, Dashboard, Call Logs
   - ❌ **Should NOT see:** Orders, Master Data

10. **Expected Result:**
    - ✅ Permissions updated on next login
    - ✅ Sidebar reflects new permissions
    - ✅ API calls to Orders return 403
    - ✅ API calls to Dashboard/Leads/Call Logs return 200

---

## 🎯 Test Scenario 6: Date Rendering (Bug Fix Check)

### Steps:
1. **Login as Test User 1** (limited access user)

2. **Go to Leads page** (if they have Leads permission)

3. **Verify:**
   - [ ] No white blank page
   - [ ] Leads list loads properly
   - [ ] Date columns show correctly (Last Follow Up, Next Follow Up)
   - [ ] No console errors about "Invalid time value"

4. **Open DevTools Console (F12)**
   - [ ] No red error messages
   - [ ] No "RangeError: Invalid time value" errors

5. **Expected Result:**
   - ✅ Page renders correctly
   - ✅ All dates display properly
   - ✅ No console errors

---

## 📋 Complete Test Checklist

### Frontend - Sidebar Filtering
- [ ] Admin sees all 5 pages
- [ ] Non-admin with no permissions sees nothing
- [ ] Non-admin with Leads+Orders sees only those 2
- [ ] Sidebar updates after permission change (next login)

### Frontend - Route Protection
- [ ] Can't access unauthorized page via URL
- [ ] Route blocks with page not loading
- [ ] Admin can access all pages

### Backend - API Authorization
- [ ] Authorized API call returns 200
- [ ] Unauthorized API call returns 403
- [ ] Error message: "Access denied to this resource"
- [ ] Admin gets 200 for all APIs

### Date Rendering
- [ ] No "Invalid time value" errors
- [ ] Dates display correctly in tables
- [ ] No blank white pages
- [ ] Dashboard loads without errors

### Login/Logout
- [ ] Admin login works
- [ ] Non-admin login works
- [ ] Logout clears permissions
- [ ] Next user sees their own permissions

---

## 🐛 If Something Goes Wrong

### Blank White Page After Login

**Symptoms:** Non-admin user sees blank page

**Fix:**
1. Open browser DevTools (F12)
2. Go to Console tab
3. Check for errors
4. If "Invalid time value" error:
   - Clear browser cache
   - Rebuild: `npm run build`
   - Restart service: `pm2 restart renuga-crm-api`

### User Sees All Pages (Sidebar Not Filtering)

**Symptoms:** Non-admin user sees all pages in sidebar

**Fix:**
1. Check user's pageAccess in database
2. Rebuild frontend: `npm run build`
3. Restart service: `pm2 restart renuga-crm-api`
4. User must login again

### API Returns 500 Error Instead of 403

**Symptoms:** API calls fail with 500 error

**Fix:**
1. Check server logs: `pm2 logs renuga-crm-api`
2. Look for errors in middleware
3. Verify `page_access` column exists in database
4. Verify authController returns pageAccess in response

### Some Users Can Access Unauthorized APIs

**Symptoms:** User can call APIs they shouldn't

**Check:**
1. Did you deploy the authorization middleware?
2. Are all route files updated with authorizePageAccess?
3. Did service restart after deployment?
4. Is JWT being sent with authorization header?

---

## 📊 Example Test Results

### ✅ Test Passed - User "Test User 1" with ["Leads", "Orders"]

```
Sidebar Shows:
├── Dashboard ❌ (hidden - no permission)
├── Leads ✅ (shown - has permission)
├── Orders ✅ (shown - has permission)
├── Call Logs ❌ (hidden - no permission)
└── Master Data ❌ (hidden - no permission)

API Tests:
GET /api/leads → 200 OK ✅
GET /api/orders → 200 OK ✅
GET /api/call-logs → 403 Forbidden ✅
POST /api/users → 403 Forbidden ✅
PUT /api/products/:id → 403 Forbidden ✅

Date Rendering:
Leads table shows dates correctly ✅
No console errors ✅
Page loads normally ✅
```

---

## 🎯 Test Completion

- [ ] All scenarios passed
- [ ] No unexpected errors
- [ ] Ready for production deployment

**Next Step:** Deploy to EC2 using `./deploy.sh`
