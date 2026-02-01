# Setup Guide - MongoDB and Redis

## Issue: Connection Refused Error

The error `ECONNREFUSED 127.0.0.1:27017` indicates that MongoDB is not running on your local machine.

## Solution Options

### Option 1: Install MongoDB Locally (Recommended for Development)

#### macOS (using Homebrew)

1. Install MongoDB:
```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
```

2. Start MongoDB service:
```bash
brew services start mongodb-community@7.0
```

3. Verify MongoDB is running:
```bash
mongosh
```

#### Alternative: Use MongoDB Atlas (Cloud - Free Tier)

1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free account
3. Create a new cluster (free tier M0)
4. Get your connection string
5. Update `.env` file:
```env
MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/property-monitor?retryWrites=true&w=majority
```

### Option 2: Use Docker (Easiest)

If you have Docker installed:

1. Run MongoDB container:
```bash
docker run -d -p 27017:27017 --name mongodb mongo:latest
```

2. Run Redis container:
```bash
docker run -d -p 6379:6379 --name redis redis:latest
```

3. Verify containers are running:
```bash
docker ps
```

### Option 3: Install Redis Locally

#### macOS (using Homebrew)

```bash
brew install redis
brew services start redis
```

#### Verify Redis is running:
```bash
redis-cli ping
# Should return: PONG
```

## Quick Start Script

Create a file `start-services.sh`:

```bash
#!/bin/bash

# Check if MongoDB is running
if ! pgrep -x "mongod" > /dev/null; then
    echo "Starting MongoDB..."
    if command -v brew &> /dev/null; then
        brew services start mongodb-community@7.0
    elif command -v docker &> /dev/null; then
        docker start mongodb || docker run -d -p 27017:27017 --name mongodb mongo:latest
    else
        echo "Please install MongoDB manually"
        exit 1
    fi
fi

# Check if Redis is running
if ! pgrep -x "redis-server" > /dev/null; then
    echo "Starting Redis..."
    if command -v brew &> /dev/null; then
        brew services start redis
    elif command -v docker &> /dev/null; then
        docker start redis || docker run -d -p 6379:6379 --name redis redis:latest
    else
        echo "Please install Redis manually"
        exit 1
    fi
fi

echo "Services are running!"
```

Make it executable:
```bash
chmod +x start-services.sh
./start-services.sh
```

## Verify Setup

### Check MongoDB:
```bash
mongosh
# Or
mongo
```

### Check Redis:
```bash
redis-cli ping
```

### Test Connection from Node.js:
```bash
cd backend
node -e "const mongoose = require('mongoose'); mongoose.connect('mongodb://localhost:27017/property-monitor').then(() => console.log('Connected!')).catch(e => console.error(e))"
```

## Troubleshooting

### MongoDB Connection Issues

1. **Check if MongoDB is running:**
   ```bash
   ps aux | grep mongod
   ```

2. **Check MongoDB logs:**
   ```bash
   # macOS with Homebrew
   tail -f /usr/local/var/log/mongodb/mongo.log
   
   # Or check Docker logs
   docker logs mongodb
   ```

3. **Check if port 27017 is in use:**
   ```bash
   lsof -i :27017
   ```

### Redis Connection Issues

1. **Check if Redis is running:**
   ```bash
   ps aux | grep redis-server
   ```

2. **Check Redis logs:**
   ```bash
   # macOS with Homebrew
   tail -f /usr/local/var/log/redis.log
   
   # Or check Docker logs
   docker logs redis
   ```

3. **Check if port 6379 is in use:**
   ```bash
   lsof -i :6379
   ```

## Using MongoDB Atlas (Cloud) - Recommended for Production

1. **Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)**

2. **Create a free cluster** (M0 - Free tier)

3. **Create a database user:**
   - Go to Database Access
   - Add New Database User
   - Choose Password authentication
   - Save username and password

4. **Whitelist your IP:**
   - Go to Network Access
   - Add IP Address
   - For development, you can use `0.0.0.0/0` (allow all IPs - not recommended for production)

5. **Get connection string:**
   - Go to Clusters
   - Click "Connect"
   - Choose "Connect your application"
   - Copy the connection string
   - Replace `<password>` with your database user password

6. **Update `.env` file:**
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/property-monitor?retryWrites=true&w=majority
   ```

## Using Redis Cloud (Alternative)

1. **Sign up at [Redis Cloud](https://redis.com/try-free/)**

2. **Create a free database**

3. **Get connection details**

4. **Update `.env` file:**
   ```env
   REDIS_HOST=your-redis-host.redis.cloud
   REDIS_PORT=12345
   REDIS_PASSWORD=your-redis-password
   ```

## Environment Variables Checklist

Make sure your `.env` file has:

```env
# MongoDB (choose one)
MONGODB_URI=mongodb://localhost:27017/property-monitor
# OR for Atlas:
# MONGODB_URI=mongodb+srv://user:pass@cluster.mongodb.net/property-monitor

# Redis (choose one)
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
# OR for Redis Cloud:
# REDIS_HOST=your-host.redis.cloud
# REDIS_PORT=12345
# REDIS_PASSWORD=your-password

# Other required variables
JWT_SECRET=your-secret-key-change-in-production
ENCRYPTION_KEY=your-32-character-encryption-key-here
```

## Next Steps

After setting up MongoDB and Redis:

1. **Start the backend:**
   ```bash
   cd backend
   npm run dev
   ```

2. **Verify services are connected:**
   - Check console logs for "MongoDB connected successfully"
   - Check console logs for "Redis connected successfully"

3. **Test the API:**
   ```bash
   curl http://localhost:3000/api/health
   ```
