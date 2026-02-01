#!/bin/bash

echo "🔧 Installing MongoDB and Redis for Property Monitor..."

# Install MongoDB
echo ""
echo "📦 Installing MongoDB..."
brew tap mongodb/brew
brew install mongodb-community@7.0

# Install Redis
echo ""
echo "📦 Installing Redis..."
brew install redis

echo ""
echo "✅ Installation complete!"
echo ""
echo "To start services, run:"
echo "  ./start-services.sh"
echo ""
echo "Or manually start them:"
echo "  brew services start mongodb-community@7.0"
echo "  brew services start redis"
