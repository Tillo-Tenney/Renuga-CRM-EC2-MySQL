# PostgreSQL to MySQL Migration - Quick Start Guide

## ⚡ Super Quick Setup (5 minutes)

### Step 1: Install Dependencies
```powershell
cd server
npm install
```

### Step 2: Create MySQL Database
```sql
-- Connect to MySQL as root
mysql -u root -p

-- Run these commands:
CREATE DATABASE renuga_crm;
CREATE USER 'renuga_user'@'localhost' IDENTIFIED BY 'your_password';
GRANT ALL PRIVILEGES ON renuga_crm.* TO 'renuga_user'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

### Step 3: Set Environment Variables
Create `.env` in the `server/` directory:
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=your_password
DB_NAME=renuga_crm

JWT_SECRET=your-jwt-secret-key-here
FRONTEND_URL=http://localhost:5173
PORT=3001
```

### Step 4: Run Migration & Seed
```powershell
# From server directory
npm run db:migrate
npm run db:seed
```

### Step 5: Start Backend
```powershell
npm run dev
```

**Result:** Backend running on http://localhost:3001 ✅

---

## 📋 What Changed

| Aspect | Before (PostgreSQL) | After (MySQL) |
|--------|-------------------|---------------|
| **Driver** | `pg` package | `mysql2/promise` |
| **Pool** | `new Pool()` | `mysql.createPool()` |
| **Query** | `pool.query(sql, [params])` | `connection.execute(sql, [params])` |
| **Placeholders** | `$1, $2, $3` | `?, ?, ?` |
| **Results** | `{ rows }` | `[rows]` |
| **Auto-increment** | `SERIAL` | `INT AUTO_INCREMENT` |
| **Timestamps** | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP` | `TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP` |
| **Returning Clause** | `RETURNING *` | Explicit SELECT |
| **Transactions** | `client.query('BEGIN')` | `connection.beginTransaction()` |
| **Commit** | `client.query('COMMIT')` | `connection.commit()` |
| **Rollback** | `client.query('ROLLBACK')` | `connection.rollback()` |

---

## 🧪 Quick Verification Tests

### Test 1: Check Database Connection
```powershell
npm run test:db-connection
```
Should output:
```
✓ Connected to MySQL
✓ Database: renuga_crm
✓ User: renuga_user@localhost
```

### Test 2: Check Seeded Data
```powershell
mysql -u renuga_user -p renuga_crm -e "SELECT COUNT(*) as total_users FROM users;"
```
Should return:
```
+--------------+
| total_users  |
+--------------+
| 4            |
+--------------+
```

### Test 3: Test Login Endpoint
```powershell
$body = @{
    email = "admin@renuga.com"
    password = "admin123"
} | ConvertTo-Json

curl -X POST http://localhost:3001/api/auth/login `
  -H "Content-Type: application/json" `
  -Body $body
```

Should return:
```json
{
  "status": "success",
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "U004",
    "name": "Admin",
    "email": "admin@renuga.com",
    "role": "Admin",
    "pageAccess": ["Dashboard", "CallLog", "Leads", "Orders", "MasterData"]
  }
}
```

---

## 🔍 Database Connection Details

### Default Credentials
- **Host:** `localhost`
- **Port:** `3306`
- **Database:** `renuga_crm`
- **User:** `renuga_user`
- **Password:** (set in Step 3)

### Connection Pool Settings
```javascript
{
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '3306'),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'renuga_crm',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
}
```

---

## 📊 Database Schema

### 10 Tables Created
1. **users** - User accounts and authentication
2. **products** - Inventory management
3. **customers** - Customer information
4. **call_logs** - Call history
5. **leads** - Sales leads
6. **orders** - Order management
7. **order_products** - Order line items
8. **tasks** - Task management
9. **shift_notes** - Daily shift notes
10. **remark_logs** - General remarks/notes

### 9 Indexes Created
- `idx_call_logs_mobile` - Performance on call_logs.mobile
- `idx_call_logs_status` - Performance on call_logs.status
- `idx_leads_mobile` - Performance on leads.mobile
- `idx_leads_status` - Performance on leads.status
- `idx_orders_mobile` - Performance on orders.mobile
- `idx_orders_status` - Performance on orders.status
- `idx_tasks_due_date` - Performance on tasks.due_date
- `idx_tasks_status` - Performance on tasks.status
- `idx_remark_logs_entity` - Performance on remark_logs.entity_type

---

## 🔐 Security Features Preserved

✅ **Password Hashing:** Bcrypt with 10 salt rounds  
✅ **JWT Authentication:** 7-day token expiration  
✅ **Parameterized Queries:** Full SQL injection protection  
✅ **Role-Based Access:** Admin, Sales, Operations, Front Desk  
✅ **Page Access Control:** Users limited to assigned pages  

---

## 🚀 Common Commands

```powershell
# Development
npm run dev              # Start backend with auto-reload

# Database
npm run db:migrate       # Create tables and indexes
npm run db:seed          # Populate initial data
npm run db:reset         # Drop all tables (use carefully!)

# Build
npm run build            # Compile TypeScript to JavaScript

# Testing
npm run test:db-connection   # Verify database connectivity

# Clean up
npm run clean            # Remove build artifacts
```

---

## 🛠️ Troubleshooting

### Error: "Cannot find module 'mysql2'"
**Solution:** Run `npm install` in server directory

### Error: "Access denied for user 'renuga_user'"
**Solution:** Check `.env` file has correct DB_PASSWORD

### Error: "Unknown database 'renuga_crm'"
**Solution:** Run MySQL commands from Step 2 to create database

### Error: "Connection refused"
**Solution:** Ensure MySQL is running: `mysql -u root -p` should connect

### Error: "Too many connections"
**Solution:** Connection pool limit reached - restart backend server

### Error: "Duplicate entry for key 'PRIMARY'"
**Solution:** Database already seeded - drop and recreate: `npm run db:reset && npm run db:migrate && npm run db:seed`

---

## 📁 Key Files Modified

| File | Changes |
|------|---------|
| `server/package.json` | Replaced `pg` with `mysql2` |
| `server/src/config/database.ts` | Completely refactored for MySQL |
| `server/src/config/migrate.ts` | Updated schema syntax for MySQL |
| `server/src/config/seed.ts` | Adapted for MySQL result format |
| `server/src/controllers/authController.ts` | Updated query syntax |
| `server/src/controllers/callLogController.ts` | Updated query syntax |
| `server/src/controllers/leadController.ts` | Updated query syntax |
| `server/src/controllers/orderController.ts` | Updated transactions for MySQL |
| `server/src/controllers/productController.ts` | Updated query syntax |
| `server/src/controllers/otherController.ts` | Updated all CRUD operations |

---

## 🎯 Next Steps

1. **Verify Migration**
   - [ ] All database tests pass
   - [ ] API endpoints responding correctly
   - [ ] Frontend can login and access data

2. **Deploy to EC2**
   - [ ] Follow `EC2_DEPLOYMENT_COMPLETE_PACKAGE.md`
   - [ ] Install MySQL on EC2
   - [ ] Update `.env` with EC2 credentials
   - [ ] Test on production environment

3. **Verify Production**
   - [ ] Full regression testing
   - [ ] Check all features working
   - [ ] Monitor performance
   - [ ] Review logs for errors

---

## 📞 Support

For detailed information, see:
- `MYSQL_MIGRATION_COMPLETE.md` - Full migration documentation
- `MYSQL_MIGRATION_TESTING_CHECKLIST.md` - Comprehensive test checklist
- `EC2_DEPLOYMENT_COMPLETE_PACKAGE.md` - Production deployment guide

---

**Status:** ✅ Migration Complete - Ready for Testing & Deployment
