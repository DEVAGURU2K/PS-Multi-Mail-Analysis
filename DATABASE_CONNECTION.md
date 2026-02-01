# Database Connection Details

## MongoDB Connection

### Current Configuration

**Connection String:** `mongodb://localhost:27017/property-monitor`

**Location:** Set in `.env` file as `MONGODB_URI`

### Connection Details Breakdown

```
mongodb://localhost:27017/property-monitor
│        │          │    │
│        │          │    └─ Database Name: property-monitor
│        │          └────── Port: 27017 (default MongoDB port)
│        └────────────────── Host: localhost (127.0.0.1)
└────────────────────────── Protocol: mongodb://
```

### Environment Variables

**File:** `backend/.env` (should be in backend root, not in src/)

```env
# MongoDB Configuration
MONGODB_URI=mongodb://localhost:27017/property-monitor
MONGODB_TEST_URI=mongodb://localhost:27017/property-monitor-test
```

### Connection Options

The connection is configured in `backend/src/server.ts`:

```typescript
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/property-monitor', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
```

### Verify Connection

**Check if MongoDB is running:**
```bash
mongosh --eval "db.adminCommand('ping')"
# Should return: { ok: 1 }
```

**Connect to the database:**
```bash
mongosh property-monitor
```

**List databases:**
```bash
mongosh --eval "show dbs"
```

**List collections in property-monitor:**
```bash
mongosh property-monitor --eval "show collections"
```

## Alternative Connection Options

### 1. MongoDB Atlas (Cloud - Free Tier)

**Connection String Format:**
```
mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/property-monitor?retryWrites=true&w=majority
```

**Steps:**
1. Sign up at [MongoDB Atlas](https://www.mongodb.com/cloud/atlas/register)
2. Create a free cluster (M0)
3. Create database user
4. Whitelist your IP (or use `0.0.0.0/0` for development)
5. Get connection string
6. Update `.env`:
   ```env
   MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/property-monitor?retryWrites=true&w=majority
   ```

### 2. MongoDB with Authentication

If you've set up authentication:

```env
MONGODB_URI=mongodb://username:password@localhost:27017/property-monitor?authSource=admin
```

### 3. MongoDB Replica Set

```env
MONGODB_URI=mongodb://host1:27017,host2:27017,host3:27017/property-monitor?replicaSet=myReplicaSet
```

### 4. MongoDB with SSL/TLS

```env
MONGODB_URI=mongodb://localhost:27017/property-monitor?ssl=true&sslCAFile=/path/to/ca.pem
```

## Redis Connection

### Current Configuration

**Host:** `localhost`
**Port:** `6379`
**Password:** (none)

**Environment Variables:**
```env
REDIS_HOST=localhost
REDIS_PORT=6379
REDIS_PASSWORD=
```

### Verify Redis Connection

**Test connection:**
```bash
redis-cli ping
# Should return: PONG
```

**Connect to Redis CLI:**
```bash
redis-cli
```

**Check Redis info:**
```bash
redis-cli info
```

## Connection Status Check

### From Backend Health Endpoint

Once the backend is running, check connection status:

```bash
curl http://localhost:3000/api/health
```

Response:
```json
{
  "status": "ok",
  "timestamp": "2026-01-28T...",
  "uptime": 123.45,
  "database": "connected",
  "redis": "connected"
}
```

### From Code

The connection status is checked in:
- `backend/src/routes/health.ts` - Health check endpoint
- `backend/src/server.ts` - Connection initialization

## Troubleshooting

### MongoDB Connection Issues

**Error: `ECONNREFUSED 127.0.0.1:27017`**
- MongoDB is not running
- Solution: `brew services start mongodb-community@7.0`

**Error: `Authentication failed`**
- Wrong credentials
- Solution: Check username/password in connection string

**Error: `Server selection timed out`**
- MongoDB server is down
- Solution: Check MongoDB service status

**Check MongoDB logs:**
```bash
tail -f /opt/homebrew/var/log/mongodb/mongo.log
```

### Redis Connection Issues

**Error: `ECONNREFUSED 127.0.0.1:6379`**
- Redis is not running
- Solution: `brew services start redis`

**Check Redis logs:**
```bash
tail -f /opt/homebrew/var/log/redis.log
```

## Database Collections

The application creates the following collections:

1. **users** - User accounts and authentication
2. **emailaccounts** - Email account configurations
3. **processedemails** - Processed email records
4. **propertylistings** - Property listing data
5. **dailyreports** - Daily summary reports

## Database Management

### Backup Database

```bash
mongodump --db=property-monitor --out=./backup
```

### Restore Database

```bash
mongorestore --db=property-monitor ./backup/property-monitor
```

### Export Collection

```bash
mongoexport --db=property-monitor --collection=propertylistings --out=propertylistings.json
```

### Import Collection

```bash
mongoimport --db=property-monitor --collection=propertylistings --file=propertylistings.json
```

## Connection Pool Settings

Current settings use Mongoose defaults. To customize:

```typescript
mongoose.connect(process.env.MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
  maxPoolSize: 10,        // Maximum number of connections
  minPoolSize: 2,         // Minimum number of connections
  serverSelectionTimeoutMS: 5000,
  socketTimeoutMS: 45000,
})
```

## Security Best Practices

1. **Never commit `.env` file** - Already in `.gitignore`
2. **Use strong passwords** for production
3. **Enable authentication** in production MongoDB
4. **Use SSL/TLS** for remote connections
5. **Restrict IP access** in MongoDB Atlas
6. **Use environment-specific configs** (dev/staging/prod)

## Quick Reference

| Service | Host | Port | Database/DB | Status Check |
|---------|------|------|-------------|--------------|
| MongoDB | localhost | 27017 | property-monitor | `mongosh --eval "db.adminCommand('ping')"` |
| Redis | localhost | 6379 | (N/A) | `redis-cli ping` |

## Environment File Location

**Important:** The `.env` file should be in:
```
backend/.env          ✅ Correct location
```

**NOT in:**
```
backend/src/.env      ❌ Wrong location
```

If your `.env` is in the wrong location, move it:
```bash
mv backend/src/.env backend/.env
```
