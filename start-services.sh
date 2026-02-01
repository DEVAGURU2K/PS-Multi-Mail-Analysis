#!/bin/bash

echo "🚀 Starting Property Monitor Services..."

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "📦 Using Docker to start services..."
    
    # Check if docker-compose.yml exists
    if [ -f "docker-compose.yml" ]; then
        echo "Starting MongoDB and Redis with Docker Compose..."
        docker-compose up -d
        
        echo "⏳ Waiting for services to be ready..."
        sleep 5
        
        # Check MongoDB
        if docker exec property-monitor-mongodb mongosh --eval "db.adminCommand('ping')" &> /dev/null; then
            echo "✅ MongoDB is running"
        else
            echo "❌ MongoDB failed to start"
        fi
        
        # Check Redis
        if docker exec property-monitor-redis redis-cli ping | grep -q PONG; then
            echo "✅ Redis is running"
        else
            echo "❌ Redis failed to start"
        fi
        
        echo ""
        echo "📊 Service Status:"
        docker-compose ps
        
    else
        echo "❌ docker-compose.yml not found"
        exit 1
    fi
    
# Check if Homebrew is installed (macOS)
elif command -v brew &> /dev/null; then
    echo "🍺 Using Homebrew to start services..."
    
    # Start MongoDB
    if brew services list | grep -q "mongodb-community.*started"; then
        echo "✅ MongoDB is already running"
    else
        echo "Starting MongoDB..."
        brew services start mongodb-community@7.0 || brew services start mongodb-community
        sleep 3
    fi
    
    # Start Redis
    if brew services list | grep -q "redis.*started"; then
        echo "✅ Redis is already running"
    else
        echo "Starting Redis..."
        brew services start redis
        sleep 2
    fi
    
    echo ""
    echo "📊 Service Status:"
    brew services list | grep -E "(mongodb|redis)"
    
else
    echo "❌ Neither Docker nor Homebrew found"
    echo ""
    echo "Please install one of the following:"
    echo "1. Docker: https://www.docker.com/get-started"
    echo "2. Homebrew: https://brew.sh (macOS)"
    echo ""
    echo "Or manually start MongoDB and Redis"
    exit 1
fi

echo ""
echo "✨ Services are ready!"
echo ""
echo "MongoDB: mongodb://localhost:27017/property-monitor"
echo "Redis: redis://localhost:6379"
echo ""
echo "You can now start the backend server:"
echo "  cd backend && npm run dev"
