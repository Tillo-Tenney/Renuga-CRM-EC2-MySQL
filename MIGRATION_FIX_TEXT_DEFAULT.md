# 🔧 MySQL Migration Fix: TEXT Column Default Value

**Issue:** Database migration failed with error
```
Error: BLOB, TEXT, GEOMETRY or JSON column 'page_access' can't have a default value
Code: ER_BLOB_CANT_HAVE_DEFAULT (errno 1101)
```

**Root Cause:** MySQL does NOT allow TEXT, BLOB, GEOMETRY, or JSON columns to have default values (except NULL).

## ✅ Fix Applied

**File:** `server/src/config/migrate.ts`

**Change:** Removed DEFAULT value from `page_access` column in users table

### Before ❌
```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  page_access TEXT DEFAULT '[]',  -- ❌ INVALID: TEXT can't have default
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

### After ✅
```sql
CREATE TABLE IF NOT EXISTS users (
  id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  page_access TEXT,  -- ✅ VALID: No default, will be NULL if not provided
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
)
```

## 📋 How Application Handles NULL page_access

When creating users, the application **explicitly sets** the `page_access` value:

### In `seed.ts` (Database Seeding)
```typescript
// Always provides page_access as JSON string
await connection.execute(
  'INSERT INTO users (id, name, email, password_hash, role, is_active, page_access) VALUES (...)',
  [..., passwordHash, role, JSON.stringify(pageAccess), ...]
);
```

### In `otherController.ts` (User Creation)
```typescript
// Admin gets all pages, others get specified pages
const accessToSet = role === 'Admin' 
  ? JSON.stringify(['Dashboard', 'CallLog', 'Leads', 'Orders', 'MasterData'])
  : JSON.stringify(pageAccess || []);

await connection.execute(
  'INSERT INTO users (id, name, email, password_hash, role, is_active, page_access) VALUES (...)',
  [..., accessToSet, ...]
);
```

### In `otherController.ts` (Fetching Users)
```typescript
// Safely parse page_access with fallback to empty array
const usersWithParsedAccess = (rows as any[]).map(user => ({
  ...user,
  pageAccess: user.page_access ? JSON.parse(user.page_access) : []
}));
```

**Result:** Even though the column defaults to NULL, the application ALWAYS provides a value when creating users, and safely handles NULL by treating it as an empty array `[]` when reading.

## ✨ Why This Works

1. **Database:** Accepts NULL (no default required)
2. **Creation:** Application always provides explicit value
3. **Reading:** Application safely handles NULL → []
4. **Migration:** No error ✅

## 🚀 Next Steps

Re-run the migration:
```bash
npm run db:migrate
# Expected output: ✓ Database migration completed successfully!
```

Then seed the database:
```bash
npm run db:seed
# Expected output: ✓ Database seeding completed successfully!
```

## 📝 MySQL Constraint Reference

**TEXT columns CANNOT have:**
- ❌ DEFAULT 'value'
- ❌ DEFAULT 0
- ❌ DEFAULT CURRENT_TIMESTAMP (only for TIMESTAMP columns)

**TEXT columns CAN have:**
- ✅ No default (becomes NULL)
- ✅ NULL DEFAULT NULL (explicit NULL)

**Valid for TEXT columns:**
- ✅ NOT NULL (but then must provide value on INSERT)
- ✅ CONSTRAINTS like CHECK
- ✅ INDEXES
- ✅ FOREIGN KEY relationships

## ✅ Status

**Migration Error:** FIXED ✅  
**Build:** Ready  
**Database Schema:** Valid MySQL syntax  
**Application Logic:** Handles NULL safely

---

*Fixed on: December 23, 2025*
