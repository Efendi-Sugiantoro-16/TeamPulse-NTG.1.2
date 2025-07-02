# Database Setup Guide - TeamPulse NTG 1.2

## 🔧 Quick Fix for "Route not found" Error

The "Route not found" error is caused by database connection issues. Follow these steps to fix it:

### 1. Environment Configuration

First, ensure you have a `.env` file in your project root:

```bash
# Copy the example environment file
copy env.example .env
```

### 2. Database Configuration

Edit your `.env` file with your MySQL settings:

```env
# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=teampulse_db

# Server Configuration
PORT=8080

# JWT Configuration
JWT_SECRET=teampulse-secret-key-2024-change-in-production

# Environment
NODE_ENV=development
```

### 3. MySQL Setup

#### Option A: Using XAMPP/WAMP
1. Install XAMPP or WAMP
2. Start MySQL service
3. Create database: `teampulse_db`
4. Set password if needed

#### Option B: Using MySQL Server
1. Install MySQL Server
2. Start MySQL service
3. Create database: `CREATE DATABASE teampulse_db;`

### 4. Database Initialization

Run the database setup script:

```bash
npm run setup-db
```

This will:
- Connect to MySQL
- Create the `teampulse_db` database
- Create all required tables (users, emotions, feedback, snapshots)

### 5. Test Database Connection

Start the server and test the connection:

```bash
npm start
```

Then visit: `http://localhost:8080/api/db-test`

### 6. Troubleshooting

#### Common Issues:

1. **MySQL not running**
   - Start MySQL service
   - Check if MySQL is installed

2. **Wrong credentials**
   - Verify username/password in `.env`
   - Test with MySQL client

3. **Database doesn't exist**
   - Run `npm run setup-db`
   - Or create manually: `CREATE DATABASE teampulse_db;`

4. **Port conflicts**
   - Change port in `.env` if 3306 is busy
   - Check if another MySQL instance is running

#### Error Messages:

- `ECONNREFUSED`: MySQL not running
- `ER_ACCESS_DENIED_ERROR`: Wrong credentials
- `ER_BAD_DB_ERROR`: Database doesn't exist

### 7. Verification

After setup, you should see:

```
✅ Database connection established successfully
✅ Database models synchronized
🚀 TeamPulse server running on port 8080
```

### 8. API Endpoints

Once connected, these endpoints will work:

- `GET /api/ping` - Health check
- `GET /api/db-test` - Database test
- `POST /api/auth/login` - User login
- `POST /api/emotions` - Save emotions
- `GET /api/emotions` - Get emotions

### 9. Hybrid Storage System

The application uses a hybrid storage system:
- **Primary**: MySQL database
- **Fallback**: localStorage (when database unavailable)

This ensures the app works even without database connection.

### 10. Development vs Production

#### Development:
- Uses local MySQL
- Detailed error messages
- Auto-sync database models

#### Production:
- Use production MySQL server
- Set `NODE_ENV=production`
- Secure JWT secret
- Use environment variables

## 🚀 Quick Start Commands

```bash
# 1. Install dependencies
npm install

# 2. Setup environment
copy env.example .env

# 3. Setup database
npm run setup-db

# 4. Start server
npm start

# 5. Test connection
curl http://localhost:8080/api/db-test
```

## 📞 Support

If you still have issues:

1. Check MySQL is running: `mysql -u root -p`
2. Verify `.env` configuration
3. Run database setup: `npm run setup-db`
4. Check server logs for specific errors
5. Test database connection manually

The application will work in offline mode even without database, but full features require MySQL connection. 