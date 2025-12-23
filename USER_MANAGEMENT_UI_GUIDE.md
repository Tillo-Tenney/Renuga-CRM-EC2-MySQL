# User Management UI Guide - Visual Reference

## 📱 User Table Layout

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ User Management                                                                 │
├─────────────────────────────────────────────────────────────────────────────────┤
│ ID    │ Name          │ Email              │ Role      │ Status │ Permissions  │ Actions
├───────┼───────────────┼────────────────────┼───────────┼────────┼──────────────┼──────────
│ USR-1 │ Admin User    │ admin@company.com  │ Admin     │ Active │ All Access   │ ✏️ 👤 📋
│ USR-2 │ Rajesh Kumar  │ rajesh@company.com │ Front Desk│ Active │ 📊 📞 📋    │ ✏️ 👤 📋
│ USR-3 │ Sarah Patel   │ sarah@company.com  │ Sales     │ Active │ 📋 📊 📑    │ ✏️ 👤 📋
│ USR-4 │ Priya Sharma  │ priya@company.com  │ Ops       │ Inactive│ 📑 📊       │ ✏️ 👤 📋
└─────────────────────────────────────────────────────────────────────────────────┘

Legend:
  ✏️  = Edit user (name, email, role, permissions)
  👤  = Change password
  📋  = View remark history
  📊  = Dashboard access
  📞  = Call Log access
  📑  = Leads access
  📦  = Orders access
  ⚙️  = Master Data access
```

---

## 🔧 Edit User Dialog

```
┌─ Edit User ─────────────────────────────────────────────────┐
│                                                              │
│ Update user details                                          │
│                                                              │
│ Name *                                                       │
│ [John Doe                                                  ] │
│                                                              │
│ Email *                                                      │
│ [john@example.com                                          ] │
│                                                              │
│ Role *                                                       │
│ [▼ Sales                                                   ] │
│                                                              │
│ Status                                                       │
│ [▼ Active                                                  ] │
│                                                              │
│ ┌─ Page Access Permissions ──────────────────────────────┐ │
│ │ Select pages this user can access:                    │ │
│ │                                                        │ │
│ │ ☑  Dashboard                                          │ │
│ │ ☑  Call Logs                                          │ │
│ │ ☑  Leads                                              │ │
│ │ ☐  Orders                                             │ │
│ │ ☐  Master Data                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Remark * (Mandatory)                                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Updated sales team member with dashboard access     │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancel]                                        [Update User]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 👑 Admin User Dialog

```
┌─ Edit User ─────────────────────────────────────────────────┐
│                                                              │
│ Update user details                                          │
│                                                              │
│ Name *                                                       │
│ [Admin User                                                ] │
│                                                              │
│ Email *                                                      │
│ [admin@example.com                                         ] │
│                                                              │
│ Role *                                                       │
│ [▼ Admin                                                   ] │
│                                                              │
│ Status                                                       │
│ [▼ Active                                                  ] │
│                                                              │
│ ┌─ Admin Access Info ────────────────────────────────────┐ │
│ │ ℹ  Admin users have access to all pages automatically  │ │
│ └────────────────────────────────────────────────────────┘ │
│ (No checkboxes shown - automatic full access)               │
│                                                              │
│ Remark * (Mandatory)                                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │ Admin user for system management                    │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancel]                                        [Update User]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🔐 Change Password Dialog

```
┌─ Change Password ───────────────────────────────────────────┐
│                                                              │
│ Enter a new password for the user                            │
│                                                              │
│ New Password *                                               │
│ [••••••••••                                                ] │
│                                                              │
│ Confirm Password *                                           │
│ [••••••••••                                                ] │
│                                                              │
│ Minimum 6 characters required                                │
│                                                              │
│                                       [Cancel] [Change Password]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## ➕ Add User Dialog (New User)

```
┌─ Add New User ──────────────────────────────────────────────┐
│                                                              │
│ Create a new user account                                    │
│                                                              │
│ Name *                                                       │
│ [                                                          ] │
│                                                              │
│ Email *                                                      │
│ [                                                          ] │
│                                                              │
│ Role *                                                       │
│ [▼ Front Desk                                              ] │
│                                                              │
│ ┌─ Page Access Permissions ──────────────────────────────┐ │
│ │ Select pages this user can access:                    │ │
│ │                                                        │ │
│ │ ☐  Dashboard                                          │ │
│ │ ☐  Call Logs                                          │ │
│ │ ☐  Leads                                              │ │
│ │ ☐  Orders                                             │ │
│ │ ☐  Master Data                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ ┌─ Default Password ─────────────────────────────────────┐ │
│ │ Default password will be set to: password123          │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│ Remark * (Mandatory)                                         │
│ ┌────────────────────────────────────────────────────────┐ │
│ │                                                        │ │
│ └────────────────────────────────────────────────────────┘ │
│                                                              │
│  [Cancel]                                          [Add User]
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## 🎯 Page Access Permission Badges

### User with Selective Access
```
┌─────────────────────────────────────────┐
│ Permissions                             │
├─────────────────────────────────────────┤
│ [Dashboard]  [Call Logs]  [Leads]      │
└─────────────────────────────────────────┘
```

### Admin User (Auto-Grant)
```
┌─────────────────────────────────────────┐
│ Permissions                             │
├─────────────────────────────────────────┤
│ [All Access]                            │
└─────────────────────────────────────────┘
```

### Different Role Badges (for reference)
```
Admin User:
  [All Access]

Front Desk:
  [Dashboard]  [Call Logs]  [Leads]

Sales:
  [Leads]  [Orders]  [Master Data]

Operations:
  [Orders]  [Master Data]
```

---

## 🔄 User Status Flow

```
Create New User
  │
  ├─ Default Status: Active ✅
  ├─ Default Password: password123
  └─ Page Access: As selected

Edit User
  │
  ├─ Change Status: Active/Inactive
  ├─ Change Permissions: Update page access
  ├─ Change Password: Via separate dialog
  └─ All changes immediate

Change Password
  │
  ├─ Validate: Min 6 chars, match
  ├─ Hash: Bcrypt 10 rounds
  └─ Store: In database

Deactivate User
  │
  ├─ Set Status: Inactive
  ├─ Cannot login: System rejects
  └─ Can reactivate: Set Status: Active
```

---

## 📊 Role & Permission Mapping

### Default Permission Sets by Role

#### Admin Role
```
Role: Admin
├─ Dashboard     ✅ Always
├─ Call Logs     ✅ Always
├─ Leads         ✅ Always
├─ Orders        ✅ Always
└─ Master Data   ✅ Always
(Cannot be changed - auto-granted)
```

#### Front Desk Role (Typical)
```
Role: Front Desk
├─ Dashboard     ✅ Selectable
├─ Call Logs     ✅ Selectable
├─ Leads         ✅ Selectable
├─ Orders        ☐ Selectable
└─ Master Data   ☐ Selectable
(Admin selects which ones)
```

#### Sales Role (Typical)
```
Role: Sales
├─ Dashboard     ☐ Selectable
├─ Call Logs     ☐ Selectable
├─ Leads         ✅ Selectable
├─ Orders        ✅ Selectable
└─ Master Data   ☐ Selectable
(Admin selects which ones)
```

#### Operations Role (Typical)
```
Role: Operations
├─ Dashboard     ☐ Selectable
├─ Call Logs     ☐ Selectable
├─ Leads         ☐ Selectable
├─ Orders        ✅ Selectable
└─ Master Data   ✅ Selectable
(Admin selects which ones)
```

---

## 🎬 Interaction Flow

### Create User Flow
```
User clicks [Add User]
         ↓
Add New User dialog opens
         ↓
Fill fields:
  - Name
  - Email
  - Role (determines page options)
  - Select page access (if not Admin)
  - Remark
         ↓
Click [Add User]
         ↓
Frontend validates
         ↓
Calls usersApi.create()
         ↓
Backend creates user
  - Hashes password
  - Auto-grants if Admin
  - Stores page_access
         ↓
Toast: "User added successfully! Default password: password123"
         ↓
Dialog closes
User appears in table
```

### Edit User Flow
```
User clicks [Edit] on row
         ↓
Edit User dialog opens
Form pre-filled with:
  - Current name
  - Current email
  - Current role
  - Current status
  - Current page access
         ↓
Modify any field
         ↓
Click [Update User]
         ↓
Frontend validates
         ↓
Calls usersApi.update()
         ↓
Backend updates user
  - Updates name, email, role
  - Updates status
  - Updates page_access
  - Password only if provided
         ↓
Toast: "User updated successfully!"
         ↓
Dialog closes
Table refreshes
```

### Password Change Flow
```
User clicks [User] button on row
         ↓
Change Password dialog opens
         ↓
Enter new password (min 6 chars)
         ↓
Confirm password (must match)
         ↓
Click [Change Password]
         ↓
Frontend validates both fields
         ↓
Calls usersApi.update(id, { password })
         ↓
Backend:
  - Receives new password
  - Hashes with bcrypt
  - Updates password_hash in DB
         ↓
Toast: "Password changed successfully!"
         ↓
Dialog closes
Password form cleared
```

---

## ✅ Validation Feedback

### Error Messages
```
Name and email are required
├─ Cause: Clicked Add/Update with empty fields
└─ Solution: Fill both name and email

Remark is mandatory
├─ Cause: Remark field empty
└─ Solution: Add a remark

User with this email already exists
├─ Cause: Email already in database
└─ Solution: Use unique email

Please enter password in both fields
├─ Cause: Password field empty
└─ Solution: Fill new and confirm password

Passwords do not match
├─ Cause: Confirmation doesn't match new password
└─ Solution: Type same password in both fields

Password must be at least 6 characters
├─ Cause: Password too short
└─ Solution: Use 6+ characters
```

### Success Messages
```
User added successfully! Default password: password123
├─ When: New user created
└─ Action: Toast shows, dialog closes

User updated successfully!
├─ When: User edited
└─ Action: Toast shows, dialog closes

Password changed successfully!
├─ When: Password changed
└─ Action: Toast shows, dialog closes
```

---

## 🎨 Visual Elements Summary

| Element | Where | Purpose |
|---------|-------|---------|
| Edit Button (✏️) | User row | Edit user details & permissions |
| Password Button (👤) | User row | Open password change dialog |
| History Button (📋) | User row | View remark history |
| Permission Badges | User row | Show accessible pages |
| Role Badge | User row | Show user role (Admin/other) |
| Status Badge | User row | Show Active/Inactive |
| Checkbox | Edit/Add dialog | Select page access |
| Info Message | Edit dialog | "Admin users have access to all..." |
| Input Fields | Dialogs | Enter name, email, password |
| Dropdown | Dialogs | Select role or status |
| Toast Notification | Top of page | Success/error messages |

---

## 🎯 Quick Action Reference

```
TASK                          ACTION
──────────────────────────────────────────────────────
Add new user                  Click [Add User] button
Edit existing user            Click [Edit] button
Change password              Click [User/Password] button
View remark history          Click [History] button
See user permissions         Look at badges in table
Check if Admin               Role badge shows "Admin"
Make user inactive           Edit → Status → Inactive
Give user new permissions    Edit → Check/uncheck boxes
Default password info        Shown in Add User dialog
Confirm password change      Toast notification appears
```

---

**Created:** December 21, 2025  
**Version:** 1.0 - Complete UI Guide
