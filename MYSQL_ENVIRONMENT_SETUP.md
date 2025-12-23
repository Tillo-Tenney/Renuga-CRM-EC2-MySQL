# MySQL Environment Configuration Guide

## Environment Variables Setup

### For Development (.env file)

Create a `.env` file in the `server/` directory with the following content:

```env
# MySQL Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=your_secure_password_here
DB_NAME=renuga_crm

# Application Configuration
PORT=3001
NODE_ENV=development

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=http://localhost:5173

# Logging (optional)
LOG_LEVEL=debug
```

---

## Step-by-Step MySQL Setup

### 1. Install MySQL Server

#### Windows (using Chocolatey)
```powershell
choco install mysql
```

#### Windows (Manual Installation)
- Download from: https://dev.mysql.com/downloads/mysql/
- Run installer
- Configure MySQL Server as service
- Set root password

#### macOS
```bash
brew install mysql
brew services start mysql
```

#### Linux (Ubuntu/Debian)
```bash
sudo apt-get update
sudo apt-get install mysql-server
```

---

### 2. Start MySQL Service

#### Windows
```powershell
# Start MySQL service
net start MySQL80

# Or using MySQL Workbench GUI
```

#### macOS
```bash
brew services start mysql
# or
mysql.server start
```

#### Linux
```bash
sudo systemctl start mysql
```

---

### 3. Secure MySQL Installation

```bash
# Run security script
mysql_secure_installation

# Follow prompts:
# - Set root password
# - Remove anonymous users (Y)
# - Disable root login remotely (Y)
# - Remove test database (Y)
# - Reload privilege tables (Y)
```

---

### 4. Create Database and User

```powershell
# Connect to MySQL as root
mysql -u root -p

# You'll be prompted for root password
```

Once connected, run these SQL commands:

```sql
-- Create database
CREATE DATABASE renuga_crm;

-- Create user
CREATE USER 'renuga_user'@'localhost' IDENTIFIED BY 'your_secure_password_here';

-- Grant all privileges on renuga_crm to renuga_user
GRANT ALL PRIVILEGES ON renuga_crm.* TO 'renuga_user'@'localhost';

-- Flush privileges to apply changes
FLUSH PRIVILEGES;

-- Verify user created
SELECT user, host FROM mysql.user WHERE user='renuga_user';

-- Exit MySQL
EXIT;
```

---

### 5. Verify Connection

Test connection with new user:

```powershell
mysql -u renuga_user -p renuga_crm

# Enter password when prompted
# You should see: mysql>
```

Once connected:

```sql
SHOW DATABASES;  -- Should show renuga_crm

SHOW TABLES;     -- Should be empty initially

EXIT;            -- Exit MySQL
```

---

## Configure Node.js Application

### 1. Copy Environment Template

```powershell
cd server
cp .env.example .env
```

### 2. Edit .env File

Open `.env` and update with your MySQL credentials:

```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=your_secure_password_here
DB_NAME=renuga_crm
JWT_SECRET=my-secret-jwt-key-12345
FRONTEND_URL=http://localhost:5173
```

### 3. Install Dependencies

```powershell
cd server
npm install
```

---

## Database Initialization

### 1. Run Migrations

```powershell
cd server
npm run db:migrate
```

Output should show:
```
✓ Connecting to database...
✓ Creating tables...
✓ Creating indexes...
✓ Migration complete!
```

### 2. Run Seeding

```powershell
npm run db:seed
```

Output should show:
```
✓ Seeding users...
✓ Seeding products...
✓ Seeding customers...
✓ Seeding call logs...
✓ Seeding leads...
✓ Database seeding complete!
```

---

## Verify Database Contents

After seeding, verify data was inserted correctly:

```powershell
mysql -u renuga_user -p renuga_crm

# Check data
SELECT COUNT(*) as total_users FROM users;
SELECT COUNT(*) as total_products FROM products;
SELECT COUNT(*) as total_leads FROM leads;
SELECT COUNT(*) as total_orders FROM orders;

# Show sample user
SELECT id, name, email, role FROM users;

# Exit
EXIT;
```

Expected output:
```
| total_users | 4  |
| total_products | 8 |
| total_leads | 3 |
| total_orders | 0 |
```

---

## Start Backend Server

```powershell
cd server
npm run dev
```

Expected output:
```
[Vite] v5.0.0 dev server running at:

  Local:    http://localhost:3001
  press h + enter to show help

✓ Database connected successfully
✓ Server running on port 3001
```

---

## Production Environment Setup

### 1. Create Production .env

```env
# MySQL Database Configuration
DB_HOST=your-rds-endpoint.aws.com
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=very_strong_password_here
DB_NAME=renuga_crm

# Application Configuration
PORT=3001
NODE_ENV=production

# JWT Configuration
JWT_SECRET=production-super-secret-key-change-this
JWT_EXPIRES_IN=7d

# Frontend Configuration
FRONTEND_URL=https://your-domain.com

# Logging
LOG_LEVEL=info
```

### 2. AWS RDS Setup (if using)

```bash
# Create RDS instance via AWS Console with:
# - MySQL 8.0.35
# - db.t3.micro (or higher)
# - Multi-AZ enabled (recommended)
# - Backup retention: 7 days
# - Publicly accessible: false
# - Security group: Allow port 3306 from EC2 security group
```

### 3. Security Group Configuration

For AWS RDS:
- Inbound: MySQL (3306) from EC2 security group
- Outbound: Allow to EC2

For EC2:
- Outbound: Allow port 3306 to RDS security group

### 4. SSL/TLS Configuration (Recommended)

```env
# Add to .env for SSL connections
DB_SSL=true
DB_SSL_REJECT_UNAUTHORIZED=false  # For self-signed certs in dev
```

---

## Troubleshooting

### Connection Refused
```
Error: connect ECONNREFUSED 127.0.0.1:3306

Solution:
1. Verify MySQL is running: mysql -u root -p
2. Check .env file for correct host/port
3. Check firewall settings
4. Restart MySQL service
```

### Access Denied
```
Error: Access denied for user 'renuga_user'@'localhost'

Solution:
1. Verify password in .env matches user creation
2. Verify user exists: SHOW GRANTS FOR 'renuga_user'@'localhost';
3. Recreate user with correct password
```

### Database Not Found
```
Error: Unknown database 'renuga_crm'

Solution:
1. Create database: CREATE DATABASE renuga_crm;
2. Verify it exists: SHOW DATABASES;
3. Check .env has correct DB_NAME
```

### Connection Pool Exhausted
```
Error: getConnection(): Connection pool is full

Solution:
1. Increase pool size in database.ts: connectionLimit: 20
2. Check for connection leaks
3. Restart backend server
```

### Port Already in Use
```
Error: listen EADDRINUSE :::3001

Solution:
1. Kill process on port 3001
2. Or change PORT in .env: PORT=3002
```

---

## MySQL Useful Commands

### Connect to Database
```bash
mysql -u renuga_user -p renuga_crm
```

### Show All Databases
```sql
SHOW DATABASES;
```

### Select Database
```sql
USE renuga_crm;
```

### Show All Tables
```sql
SHOW TABLES;
```

### Show Table Structure
```sql
DESCRIBE users;
DESCRIBE products;
DESCRIBE orders;
```

### Show All Indexes
```sql
SHOW INDEX FROM users;
SHOW INDEX FROM call_logs;
```

### View User Privileges
```sql
SHOW GRANTS FOR 'renuga_user'@'localhost';
```

### Reset Password (as root)
```sql
ALTER USER 'renuga_user'@'localhost' IDENTIFIED BY 'new_password';
FLUSH PRIVILEGES;
```

### Backup Database
```bash
mysqldump -u renuga_user -p renuga_crm > backup.sql
```

### Restore Database
```bash
mysql -u renuga_user -p renuga_crm < backup.sql
```

### Check Database Size
```sql
SELECT 
    table_name,
    ROUND(((data_length + index_length) / 1024 / 1024), 2) AS size_mb
FROM 
    information_schema.tables
WHERE 
    table_schema = 'renuga_crm'
ORDER BY 
    size_mb DESC;
```

### View Running Queries
```sql
SHOW PROCESSLIST;
```

### Kill Query/Connection
```sql
KILL QUERY <process_id>;
KILL CONNECTION <process_id>;
```

---

## Environment File Examples

### .env.development
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=dev_password
DB_NAME=renuga_crm_dev

PORT=3001
NODE_ENV=development

JWT_SECRET=dev-secret-key
JWT_EXPIRES_IN=7d

FRONTEND_URL=http://localhost:5173
LOG_LEVEL=debug
```

### .env.staging
```env
DB_HOST=staging-mysql.example.com
DB_PORT=3306
DB_USER=renuga_user
DB_PASSWORD=staging_secure_password
DB_NAME=renuga_crm_staging

PORT=3001
NODE_ENV=staging

JWT_SECRET=staging-secret-key
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://staging.example.com
LOG_LEVEL=info
```

### .env.production
```env
DB_HOST=prod-mysql.rds.amazonaws.com
DB_PORT=3306
DB_USER=renuga_prod
DB_PASSWORD=production_very_secure_password
DB_NAME=renuga_crm_prod

PORT=3001
NODE_ENV=production

JWT_SECRET=production-secret-key-change-this
JWT_EXPIRES_IN=7d

FRONTEND_URL=https://app.example.com
LOG_LEVEL=warn

DB_SSL=true
```

---

## Database Backup Strategy

### Daily Backup Script
```bash
#!/bin/bash
# daily-backup.sh

BACKUP_DIR="/backups/mysql"
DATE=$(date +%Y%m%d_%H%M%S)
DB_USER="renuga_user"
DB_PASS="your_password"
DB_NAME="renuga_crm"

mkdir -p $BACKUP_DIR

mysqldump -u $DB_USER -p$DB_PASS $DB_NAME > $BACKUP_DIR/renuga_crm_$DATE.sql

# Compress
gzip $BACKUP_DIR/renuga_crm_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete

echo "Backup completed: $BACKUP_DIR/renuga_crm_$DATE.sql.gz"
```

### Schedule with Cron
```bash
# Every day at 2 AM
0 2 * * * /path/to/daily-backup.sh
```

### Schedule with Windows Task Scheduler
```
Program: cmd.exe
Arguments: /c mysqldump -u renuga_user -p password renuga_crm > C:\Backups\backup_%date:~-4,4%%date:~-10,2%%date:~-7,2%.sql
Schedule: Daily at 2:00 AM
```

---

## Support & Documentation

- **MySQL Official Docs:** https://dev.mysql.com/doc/
- **mysql2 npm Package:** https://www.npmjs.com/package/mysql2
- **Connection Pooling Guide:** https://github.com/mysqljs/mysql#pooling-connections
- **Troubleshooting Guide:** See MYSQL_MIGRATION_COMPLETE.md

---

**Status:** ✅ Environment Configuration Guide Complete  
**Last Updated:** December 23, 2025
