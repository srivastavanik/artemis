#!/bin/bash

# ARTEMIS Setup Script
# This script sets up the development environment for the ARTEMIS project

echo "🚀 Setting up ARTEMIS development environment..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check Node version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ npm $(npm -v) detected"

# Create .env file from example if it doesn't exist
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please update .env with your actual API keys"
else
    echo "✅ .env file already exists"
fi

# Install backend dependencies
echo "📦 Installing backend dependencies..."
cd backend
npm install
cd ..

# Install frontend dependencies
echo "📦 Installing frontend dependencies..."
cd frontend
npm install
cd ..

# Install root dependencies
echo "📦 Installing root dependencies..."
npm install

# Check if Docker is installed
if command -v docker &> /dev/null; then
    echo "✅ Docker detected"
    
    # Check if docker-compose is installed
    if command -v docker-compose &> /dev/null; then
        echo "✅ docker-compose detected"
        echo "💡 You can run 'npm run docker:up' to start the application with Docker"
    else
        echo "⚠️  docker-compose is not installed. Install it to use Docker setup."
    fi
else
    echo "⚠️  Docker is not installed. Install Docker to use containerized setup."
fi

echo ""
echo "✅ Setup complete!"
echo ""
echo "📖 Next steps:"
echo "1. Update .env file with your API keys"
echo "2. Run 'npm run dev' to start the development servers"
echo "3. Visit http://localhost:5173 for the frontend"
echo "4. API will be available at http://localhost:3001"
echo ""
echo "🚀 Happy coding!"
