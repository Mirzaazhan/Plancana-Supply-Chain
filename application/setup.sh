#!/bin/bash
# setup.sh - Complete setup script for Agricultural Supply Chain

echo "🚀 Setting up Agricultural Supply Chain with Database Integration"
echo "=============================================================="

# Check Node.js
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 16+ first."
    exit 1
fi

# Check PostgreSQL
if ! command -v psql &> /dev/null; then
    echo "❌ PostgreSQL is not installed. Please install PostgreSQL first."
    exit 1
fi

# Install dependencies
echo "📦 Installing Node.js dependencies..."
npm install

# Setup database
echo "🗃️ Setting up database..."
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed

# Check blockchain network
echo "🔗 Checking blockchain network..."
if [ -d "../../../fabric-samples/test-network" ]; then
    echo "✅ Fabric network found"
    echo "💡 To start blockchain: npm run blockchain:start"
    echo "💡 To deploy contract: npm run blockchain:deploy"
else
    echo "⚠️  Fabric network not found at expected location"
    echo "Please ensure fabric-samples is properly installed"
fi

echo ""
echo "✅ Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Start blockchain network: npm run blockchain:start"
echo "2. Deploy smart contract: npm run blockchain:deploy"
echo "3. Start API server: npm start"
echo "4. Open Prisma Studio: npm run db:studio"
echo ""
echo "🔐 Default users created:"
echo "   Admin: admin@agricultural.com / admin123"
echo "   Farmer: ahmad@farm.com / farmer123"
echo "   Processor: mill@processor.com / processor123"