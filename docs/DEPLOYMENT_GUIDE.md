# TeamPulse-NTG.1.2 Deployment Guide

## Table of Contents

1. [Overview](#overview)
2. [Prerequisites](#prerequisites)
3. [Development Environment](#development-environment)
4. [Staging Environment](#staging-environment)
5. [Production Environment](#production-environment)
6. [Docker Deployment](#docker-deployment)
7. [Cloud Deployment](#cloud-deployment)
8. [Monitoring & Maintenance](#monitoring--maintenance)
9. [Troubleshooting](#troubleshooting)

## Overview

This guide covers the deployment of TeamPulse-NTG.1.2 across different environments. The application consists of a Node.js backend API and a static frontend that can be deployed using various methods.

### Architecture Overview

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend API   │    │   Database      │
│   (Static Files)│◄──►│   (Node.js)     │◄──►│   (MySQL)       │
│                 │    │                 │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
         │                       │                       │
         │                       │                       │
         ▼                       ▼                       ▼
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Web Server    │    │   Process Mgr   │    │   Backup        │
│   (Nginx/Apache)│    │   (PM2)         │    │   System        │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## Prerequisites

### System Requirements

#### Minimum Requirements
- **CPU**: 2 cores
- **RAM**: 4GB
- **Storage**: 20GB SSD
- **OS**: Ubuntu 20.04 LTS or CentOS 8

#### Recommended Requirements
- **CPU**: 4+ cores
- **RAM**: 8GB+
- **Storage**: 50GB+ SSD
- **OS**: Ubuntu 22.04 LTS

### Software Dependencies

#### Required Software
- **Node.js**: v16.0.0 or higher
- **MySQL**: v8.0.0 or higher
- **Nginx**: v1.18.0 or higher
- **Git**: v2.25.0 or higher

#### Optional Software
- **Redis**: For session storage (optional)
- **PM2**: For process management
- **Docker**: For containerized deployment
- **Certbot**: For SSL certificates

### Network Requirements

#### Ports
- **80**: HTTP (redirected to HTTPS)
- **443**: HTTPS
- **8080**: Application (internal)
- **3306**: MySQL (internal)

#### Firewall Configuration
```bash
# Allow HTTP and HTTPS
sudo ufw allow 80
sudo ufw allow 443

# Allow SSH (if needed)
sudo ufw allow ssh

# Enable firewall
sudo ufw enable
```

## Development Environment

### Local Development Setup

#### 1. Clone Repository
```bash
git clone https://github.com/your-username/TeamPulse-NTG.1.2.git
cd TeamPulse-NTG.1.2
```

#### 2. Install Dependencies
```bash
# Install Node.js dependencies
npm install

# Install global tools (optional)
npm install -g nodemon pm2
```

#### 3. Database Setup
```bash
# Install MySQL (Ubuntu)
sudo apt update
sudo apt install mysql-server

# Start MySQL service
sudo systemctl start mysql
sudo systemctl enable mysql

# Secure MySQL installation
sudo mysql_secure_installation

# Create database and user
sudo mysql -u root -p
```

```sql
CREATE DATABASE teampulse_ntg;
CREATE USER 'teampulse_dev'@'localhost' IDENTIFIED BY 'dev_password';
GRANT ALL PRIVILEGES ON teampulse_ntg.* TO 'teampulse_dev'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import database schema
mysql -u teampulse_dev -p teampulse_ntg < database/init.sql
```

#### 4. Environment Configuration
```bash
# Copy environment template
cp env.example .env

# Edit environment file
nano .env
```

```env
# Development Environment
NODE_ENV=development
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=teampulse_dev
DB_PASSWORD=dev_password
DB_NAME=teampulse_ntg

# JWT Configuration
JWT_SECRET=dev-secret-key-change-in-production

# CORS Configuration
CORS_ORIGIN=http://localhost:3000

# Logging
LOG_LEVEL=debug
```

#### 5. Start Development Server
```bash
# Development mode with auto-reload
npm run dev

# Or using nodemon directly
nodemon app.js
```

#### 6. Access Application
- **Frontend**: http://localhost:8080
- **API**: http://localhost:8080/api
- **Health Check**: http://localhost:8080/api/ping

### Development Tools

#### Code Quality Tools
```bash
# Install ESLint and Prettier
npm install --save-dev eslint prettier

# Run linting
npm run lint

# Format code
npm run format
```

#### Testing Setup
```bash
# Install testing dependencies
npm install --save-dev jest supertest

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Staging Environment

### Staging Server Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server nodejs npm git

# Install PM2 globally
sudo npm install -g pm2
```

#### 2. Application Deployment
```bash
# Create application directory
sudo mkdir -p /var/www/teampulse-staging
sudo chown $USER:$USER /var/www/teampulse-staging

# Clone repository
git clone https://github.com/your-username/TeamPulse-NTG.1.2.git /var/www/teampulse-staging
cd /var/www/teampulse-staging

# Install dependencies
npm install --production
```

#### 3. Database Configuration
```bash
# Create staging database
sudo mysql -u root -p
```

```sql
CREATE DATABASE teampulse_ntg_staging;
CREATE USER 'teampulse_staging'@'localhost' IDENTIFIED BY 'staging_password';
GRANT ALL PRIVILEGES ON teampulse_ntg_staging.* TO 'teampulse_staging'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u teampulse_staging -p teampulse_ntg_staging < database/init.sql
```

#### 4. Environment Configuration
```bash
# Create staging environment file
cp env.example .env.staging
nano .env.staging
```

```env
# Staging Environment
NODE_ENV=staging
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=teampulse_staging
DB_PASSWORD=staging_password
DB_NAME=teampulse_ntg_staging

# JWT Configuration
JWT_SECRET=staging-secret-key

# CORS Configuration
CORS_ORIGIN=https://staging.teampulse.com

# Logging
LOG_LEVEL=info
```

#### 5. PM2 Configuration
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'teampulse-staging',
    script: 'app.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '1G',
    env: {
      NODE_ENV: 'staging',
      PORT: 8080
    },
    env_file: '.env.staging'
  }]
};
```

#### 6. Nginx Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/teampulse-staging
```

```nginx
server {
    listen 80;
    server_name staging.teampulse.com;

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Frontend static files
    location / {
        root /var/www/teampulse-staging;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api/ {
        proxy_pass http://localhost:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }

    # Health check
    location /health {
        proxy_pass http://localhost:8080/api/ping;
        access_log off;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/teampulse-staging /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 7. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### 8. SSL Certificate (Optional)
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d staging.teampulse.com
```

## Production Environment

### Production Server Setup

#### 1. Server Preparation
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install required packages
sudo apt install -y nginx mysql-server nodejs npm git ufw

# Configure firewall
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

#### 2. Database Setup
```bash
# Install MySQL
sudo apt install mysql-server

# Secure MySQL
sudo mysql_secure_installation

# Create production database
sudo mysql -u root -p
```

```sql
CREATE DATABASE teampulse_ntg_prod;
CREATE USER 'teampulse_prod'@'localhost' IDENTIFIED BY 'strong_production_password';
GRANT ALL PRIVILEGES ON teampulse_ntg_prod.* TO 'teampulse_prod'@'localhost';
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Import schema
mysql -u teampulse_prod -p teampulse_ntg_prod < database/init.sql
```

#### 3. Application Deployment
```bash
# Create application directory
sudo mkdir -p /var/www/teampulse
sudo chown $USER:$USER /var/www/teampulse

# Clone repository
git clone https://github.com/your-username/TeamPulse-NTG.1.2.git /var/www/teampulse
cd /var/www/teampulse

# Install dependencies
npm install --production

# Install PM2
sudo npm install -g pm2
```

#### 4. Production Environment Configuration
```bash
# Create production environment file
cp env.example .env.production
nano .env.production
```

```env
# Production Environment
NODE_ENV=production
PORT=8080

# Database Configuration
DB_HOST=localhost
DB_PORT=3306
DB_USER=teampulse_prod
DB_PASSWORD=strong_production_password
DB_NAME=teampulse_ntg_prod

# JWT Configuration
JWT_SECRET=super-secret-production-key-change-this

# CORS Configuration
CORS_ORIGIN=https://teampulse.com

# Security
SESSION_SECRET=another-super-secret-key
COOKIE_SECURE=true
COOKIE_HTTPONLY=true

# Logging
LOG_LEVEL=warn
LOG_FILE=/var/log/teampulse/app.log

# Performance
WORKERS=4
MAX_MEMORY=2G
```

#### 5. PM2 Production Configuration
```bash
# Create PM2 ecosystem file
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'teampulse-prod',
    script: 'app.js',
    instances: 'max',
    exec_mode: 'cluster',
    autorestart: true,
    watch: false,
    max_memory_restart: '2G',
    env: {
      NODE_ENV: 'production',
      PORT: 8080
    },
    env_file: '.env.production',
    log_file: '/var/log/teampulse/combined.log',
    out_file: '/var/log/teampulse/out.log',
    error_file: '/var/log/teampulse/error.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
```

#### 6. Logging Configuration
```bash
# Create log directory
sudo mkdir -p /var/log/teampulse
sudo chown $USER:$USER /var/log/teampulse

# Create logrotate configuration
sudo nano /etc/logrotate.d/teampulse
```

```
/var/log/teampulse/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

#### 7. Nginx Production Configuration
```bash
# Create Nginx configuration
sudo nano /etc/nginx/sites-available/teampulse
```

```nginx
# Rate limiting
limit_req_zone $binary_remote_addr zone=api:10m rate=10r/s;
limit_req_zone $binary_remote_addr zone=login:10m rate=5r/m;

upstream teampulse_backend {
    server 127.0.0.1:8080;
    keepalive 32;
}

server {
    listen 80;
    server_name teampulse.com www.teampulse.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name teampulse.com www.teampulse.com;

    # SSL Configuration
    ssl_certificate /etc/letsencrypt/live/teampulse.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/teampulse.com/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers ECDHE-RSA-AES256-GCM-SHA512:DHE-RSA-AES256-GCM-SHA512:ECDHE-RSA-AES256-GCM-SHA384:DHE-RSA-AES256-GCM-SHA384;
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    add_header Content-Security-Policy "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://cdnjs.cloudflare.com; img-src 'self' data: https:; font-src 'self' https://cdnjs.cloudflare.com; connect-src 'self' https://cdn.jsdelivr.net;" always;
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/json
        application/javascript
        application/xml+rss
        application/atom+xml
        image/svg+xml;

    # Frontend static files
    location / {
        root /var/www/teampulse;
        index index.html;
        try_files $uri $uri/ /index.html;
        
        # Cache static assets
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # API proxy with rate limiting
    location /api/ {
        limit_req zone=api burst=20 nodelay;
        
        proxy_pass http://teampulse_backend;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Authentication endpoints with stricter rate limiting
    location /api/auth/ {
        limit_req zone=login burst=5 nodelay;
        
        proxy_pass http://teampulse_backend;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        proxy_pass http://teampulse_backend/api/ping;
        access_log off;
    }

    # Deny access to sensitive files
    location ~ /\. {
        deny all;
    }
    
    location ~ \.(env|log|sql)$ {
        deny all;
    }
}
```

```bash
# Enable site
sudo ln -s /etc/nginx/sites-available/teampulse /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

#### 8. SSL Certificate
```bash
# Install Certbot
sudo apt install certbot python3-certbot-nginx

# Obtain SSL certificate
sudo certbot --nginx -d teampulse.com -d www.teampulse.com

# Setup auto-renewal
sudo crontab -e
# Add: 0 12 * * * /usr/bin/certbot renew --quiet
```

#### 9. Start Application
```bash
# Start with PM2
pm2 start ecosystem.config.js

# Save PM2 configuration
pm2 save

# Setup PM2 startup script
pm2 startup
```

#### 10. Database Backup Setup
```bash
# Create backup script
nano /var/www/teampulse/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/teampulse"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="teampulse_ntg_prod"
DB_USER="teampulse_prod"

# Create backup directory
mkdir -p $BACKUP_DIR

# Create database backup
mysqldump -u $DB_USER -p $DB_NAME > $BACKUP_DIR/teampulse_$DATE.sql

# Compress backup
gzip $BACKUP_DIR/teampulse_$DATE.sql

# Keep only last 7 days of backups
find $BACKUP_DIR -name "teampulse_*.sql.gz" -mtime +7 -delete

echo "Backup completed: teampulse_$DATE.sql.gz"
```

```bash
# Make script executable
chmod +x /var/www/teampulse/backup.sh

# Setup daily backup cron job
sudo crontab -e
# Add: 0 2 * * * /var/www/teampulse/backup.sh
```

## Docker Deployment

### Docker Setup

#### 1. Create Dockerfile
```dockerfile
# Dockerfile
FROM node:16-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy application code
COPY . .

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S nodejs -u 1001

# Change ownership
RUN chown -R nodejs:nodejs /app
USER nodejs

# Expose port
EXPOSE 8080

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:8080/api/ping || exit 1

# Start application
CMD ["node", "app.js"]
```

#### 2. Create Docker Compose
```yaml
# docker-compose.yml
version: '3.8'

services:
  app:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - DB_PORT=3306
      - DB_USER=teampulse
      - DB_PASSWORD=teampulse_password
      - DB_NAME=teampulse_ntg
      - JWT_SECRET=your-jwt-secret
    depends_on:
      - db
    restart: unless-stopped
    volumes:
      - ./logs:/app/logs

  db:
    image: mysql:8.0
    environment:
      - MYSQL_ROOT_PASSWORD=root_password
      - MYSQL_DATABASE=teampulse_ntg
      - MYSQL_USER=teampulse
      - MYSQL_PASSWORD=teampulse_password
    volumes:
      - mysql_data:/var/lib/mysql
      - ./database/init.sql:/docker-entrypoint-initdb.d/init.sql
    restart: unless-stopped
    ports:
      - "3306:3306"

  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf
      - ./ssl:/etc/nginx/ssl
    depends_on:
      - app
    restart: unless-stopped

volumes:
  mysql_data:
```

#### 3. Deploy with Docker
```bash
# Build and start services
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Cloud Deployment

### AWS Deployment

#### 1. EC2 Instance Setup
```bash
# Launch EC2 instance (Ubuntu 22.04 LTS)
# Instance type: t3.medium or larger
# Security groups: Allow ports 22, 80, 443

# Connect to instance
ssh -i your-key.pem ubuntu@your-instance-ip
```

#### 2. Application Deployment
```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install dependencies
sudo apt install -y nginx mysql-server nodejs npm git

# Clone repository
git clone https://github.com/your-username/TeamPulse-NTG.1.2.git /var/www/teampulse
cd /var/www/teampulse

# Install dependencies
npm install --production
```

#### 3. RDS Database Setup
```bash
# Create RDS MySQL instance
# Engine: MySQL 8.0
# Instance class: db.t3.micro
# Storage: 20GB
# Multi-AZ: No (for development)

# Update environment configuration
nano .env.production
```

```env
DB_HOST=your-rds-endpoint.region.rds.amazonaws.com
DB_PORT=3306
DB_USER=teampulse
DB_PASSWORD=your-rds-password
DB_NAME=teampulse_ntg
```

#### 4. Load Balancer Setup
```bash
# Create Application Load Balancer
# Target group: EC2 instances
# Health check: /api/ping
# SSL certificate: ACM certificate
```

### Google Cloud Platform

#### 1. Compute Engine Setup
```bash
# Create VM instance
gcloud compute instances create teampulse-prod \
  --zone=us-central1-a \
  --machine-type=e2-medium \
  --image-family=ubuntu-2204-lts \
  --image-project=ubuntu-os-cloud \
  --tags=http-server,https-server
```

#### 2. Cloud SQL Setup
```bash
# Create Cloud SQL instance
gcloud sql instances create teampulse-db \
  --database-version=MYSQL_8_0 \
  --tier=db-f1-micro \
  --region=us-central1

# Create database
gcloud sql databases create teampulse_ntg --instance=teampulse-db

# Create user
gcloud sql users create teampulse \
  --instance=teampulse-db \
  --password=your-password
```

### Azure Deployment

#### 1. Virtual Machine Setup
```bash
# Create VM using Azure CLI
az vm create \
  --resource-group teampulse-rg \
  --name teampulse-vm \
  --image Ubuntu2204 \
  --size Standard_B2s \
  --admin-username azureuser \
  --generate-ssh-keys
```

#### 2. Azure Database for MySQL
```bash
# Create MySQL server
az mysql server create \
  --resource-group teampulse-rg \
  --name teampulse-mysql \
  --location eastus \
  --admin-user teampulse \
  --admin-password your-password \
  --sku-name B_Gen5_1
```

## Monitoring & Maintenance

### Application Monitoring

#### 1. PM2 Monitoring
```bash
# View application status
pm2 status

# Monitor logs
pm2 logs

# Monitor resources
pm2 monit

# Restart application
pm2 restart teampulse-prod
```

#### 2. System Monitoring
```bash
# Install monitoring tools
sudo apt install htop iotop nethogs

# Monitor system resources
htop
iotop
nethogs
```

#### 3. Log Monitoring
```bash
# View application logs
tail -f /var/log/teampulse/app.log

# View Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log

# View MySQL logs
sudo tail -f /var/log/mysql/error.log
```

### Performance Optimization

#### 1. Database Optimization
```sql
-- Add indexes for better performance
CREATE INDEX idx_emotions_user_date ON emotions(user_id, created_at);
CREATE INDEX idx_emotions_type_date ON emotions(emotion_type, created_at);

-- Analyze table performance
ANALYZE TABLE emotions;
```

#### 2. Application Optimization
```javascript
// Enable compression
app.use(compression());

// Enable caching
app.use(express.static('public', {
  maxAge: '1y',
  etag: true
}));

// Database connection pooling
const sequelize = new Sequelize(config.database, config.username, config.password, {
  host: config.host,
  dialect: config.dialect,
  pool: {
    max: 10,
    min: 0,
    acquire: 30000,
    idle: 10000
  }
});
```

### Backup & Recovery

#### 1. Automated Backups
```bash
# Create backup script
nano /var/www/teampulse/backup.sh
```

```bash
#!/bin/bash
BACKUP_DIR="/var/backups/teampulse"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="teampulse_ntg_prod"

# Database backup
mysqldump -u teampulse_prod -p $DB_NAME > $BACKUP_DIR/db_$DATE.sql
gzip $BACKUP_DIR/db_$DATE.sql

# Application backup
tar -czf $BACKUP_DIR/app_$DATE.tar.gz /var/www/teampulse

# Upload to cloud storage (optional)
aws s3 cp $BACKUP_DIR/db_$DATE.sql.gz s3://teampulse-backups/
aws s3 cp $BACKUP_DIR/app_$DATE.tar.gz s3://teampulse-backups/

# Cleanup old backups
find $BACKUP_DIR -name "*.sql.gz" -mtime +7 -delete
find $BACKUP_DIR -name "*.tar.gz" -mtime +7 -delete
```

#### 2. Recovery Procedures
```bash
# Database recovery
mysql -u teampulse_prod -p teampulse_ntg_prod < backup_file.sql

# Application recovery
tar -xzf app_backup.tar.gz -C /var/www/
cd /var/www/teampulse
npm install --production
pm2 restart teampulse-prod
```

## Troubleshooting

### Common Issues

#### 1. Application Won't Start
```bash
# Check Node.js version
node --version

# Check dependencies
npm list

# Check environment variables
cat .env.production

# Check logs
pm2 logs teampulse-prod
```

#### 2. Database Connection Issues
```bash
# Test database connection
mysql -u teampulse_prod -p -h localhost teampulse_ntg_prod

# Check MySQL service
sudo systemctl status mysql

# Check MySQL logs
sudo tail -f /var/log/mysql/error.log
```

#### 3. Nginx Issues
```bash
# Test Nginx configuration
sudo nginx -t

# Check Nginx status
sudo systemctl status nginx

# Check Nginx logs
sudo tail -f /var/log/nginx/error.log
```

#### 4. SSL Certificate Issues
```bash
# Check certificate status
sudo certbot certificates

# Renew certificate
sudo certbot renew

# Check certificate expiration
openssl x509 -in /etc/letsencrypt/live/teampulse.com/cert.pem -text -noout
```

### Performance Issues

#### 1. High CPU Usage
```bash
# Identify high CPU processes
top -p $(pgrep -d',' node)

# Check Node.js heap usage
pm2 monit

# Optimize application
# - Reduce database queries
# - Implement caching
# - Optimize algorithms
```

#### 2. High Memory Usage
```bash
# Check memory usage
free -h

# Check Node.js memory
pm2 monit

# Restart application if needed
pm2 restart teampulse-prod
```

#### 3. Slow Database Queries
```sql
-- Enable slow query log
SET GLOBAL slow_query_log = 'ON';
SET GLOBAL long_query_time = 2;

-- Analyze slow queries
SELECT * FROM mysql.slow_log ORDER BY start_time DESC LIMIT 10;
```

### Security Issues

#### 1. Unauthorized Access
```bash
# Check failed login attempts
sudo tail -f /var/log/auth.log | grep "Failed password"

# Check application logs for suspicious activity
tail -f /var/log/teampulse/app.log | grep -i "error\|failed\|unauthorized"
```

#### 2. DDoS Protection
```bash
# Install fail2ban
sudo apt install fail2ban

# Configure fail2ban
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-http-auth]
enabled = true
filter = nginx-http-auth
port = http,https
logpath = /var/log/nginx/error.log

[nginx-limit-req]
enabled = true
filter = nginx-limit-req
port = http,https
logpath = /var/log/nginx/error.log
```

### Maintenance Procedures

#### 1. Regular Updates
```bash
# Update system packages
sudo apt update && sudo apt upgrade -y

# Update Node.js
curl -fsSL https://deb.nodesource.com/setup_16.x | sudo -E bash -
sudo apt-get install -y nodejs

# Update application
cd /var/www/teampulse
git pull origin main
npm install --production
pm2 restart teampulse-prod
```

#### 2. Database Maintenance
```sql
-- Optimize tables
OPTIMIZE TABLE emotions;
OPTIMIZE TABLE users;
OPTIMIZE TABLE sessions;

-- Analyze tables
ANALYZE TABLE emotions;
ANALYZE TABLE users;
ANALYZE TABLE sessions;
```

#### 3. Log Rotation
```bash
# Configure logrotate
sudo nano /etc/logrotate.d/teampulse
```

```
/var/log/teampulse/*.log {
    daily
    missingok
    rotate 52
    compress
    delaycompress
    notifempty
    create 644 $USER $USER
    postrotate
        pm2 reloadLogs
    endscript
}
```

---

*This deployment guide is maintained by the TeamPulse Development Team. For questions or support, please contact the development team.* 