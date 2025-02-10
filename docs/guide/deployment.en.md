# Deployment Guide

This guide will help you deploy and run the Shenyu project in a production environment.

## System Requirements

### Hardware Requirements
- CPU: 2 cores or more
- Memory: 4GB or more
- Disk Space: 20GB or more

### Software Requirements
- Node.js >= 18.0.0
- npm >= 7.0.0
- Git
- PM2 (for process management)

## Installation Steps

### 1. Install Node.js and npm
```bash
# Install Node.js using nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
nvm install 18
nvm use 18
```

### 2. Install PM2
```bash
npm install -g pm2
```

### 3. Clone the Project
```bash
git clone https://github.com/sales-nail/shenyu.git
cd shenyu
```

### 4. Install Dependencies
```bash
npm run install:all
```

### 5. Build the Project
```bash
npm run build
```

## Configuration

### 1. Environment Variables
Create `.env` file in the backend directory:
```bash
cd packages/backend
cp .env.example .env
```

Edit the `.env` file and set the necessary environment variables:
```
PORT=3002
NODE_ENV=production
API_KEY=your-api-key
```

### 2. Frontend Configuration
Create `.env.production` file in the frontend directory:
```bash
cd ../frontend
```

Add the following content:
```
VITE_API_URL=https://your-api-domain.com
```

## Production Deployment

### 1. Start Backend Service with PM2
Create `ecosystem.config.js`:
```javascript
module.exports = {
  apps: [{
    name: 'shenyu-backend',
    script: 'dist/api-server.js',
    instances: 'max',
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production'
    }
  }]
}
```

Start the service:
```bash
cd packages/backend
pm2 start ecosystem.config.js
```

### 2. Deploy Frontend
Build and deploy frontend files to web server:
```bash
cd ../frontend
npm run build
```

Copy the contents of the `dist` directory to your web server directory.

### 3. Configure Nginx
```nginx
server {
    listen 80;
    server_name your-domain.com;

    # Frontend static files
    location / {
        root /path/to/frontend/dist;
        try_files $uri $uri/ /index.html;
    }

    # API proxy
    location /api {
        proxy_pass http://localhost:3002;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

## Monitoring and Maintenance

### 1. PM2 Monitoring
```bash
# Check service status
pm2 status

# View logs
pm2 logs

# Monitor resource usage
pm2 monit
```

### 2. Log Management
Log files are located at:
- Backend: `packages/backend/logs/`
- PM2: `~/.pm2/logs/`

### 3. Backup Strategy
Regularly backup the following:
- Data directory: `packages/backend/data/`
- Environment configuration files
- Database (if used)

## Troubleshooting

### 1. Common Issues

#### Service Won't Start
- Check if port is in use
- Verify environment variables
- Check log files

#### 502 Error
- Verify backend service is running
- Check Nginx configuration
- Check firewall settings

#### Memory Overflow
- Check PM2 memory limits
- Increase server memory
- Optimize code memory usage

### 2. Performance Optimization
- Enable Nginx caching
- Configure PM2 cluster mode
- Optimize database queries
- Use CDN for static assets

## Security Recommendations

### 1. Server Security
- Enable firewall
- Regular system updates
- Use SSH key authentication
- Disable root remote login

### 2. Application Security
- Enable HTTPS
- Configure CORS
- Implement secure session management
- Implement rate limiting

### 3. Data Security
- Regular backups
- Encrypt sensitive data
- Implement access control
- Monitor for unusual access

## Updates and Upgrades

### 1. Update Steps
```bash
# Pull latest code
git pull

# Install dependencies
npm run install:all

# Build project
npm run build

# Restart services
pm2 restart all
```

### 2. Rollback Strategy
```bash
# Switch to previous stable version
git checkout <previous-tag>

# Rebuild and redeploy
npm run install:all
npm run build
pm2 restart all
