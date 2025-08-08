#!/bin/bash
# deploy.sh - Comprehensive deployment script for Beyond 99 Days

echo "🚀 Starting deployment process for Beyond 99 Days..."

# Check if Node.js and npm are installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js first."
    exit 1
fi

if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

echo "✅ Node.js version: $(node --version)"
echo "✅ npm version: $(npm --version)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install dependencies"
    exit 1
fi

echo "✅ Dependencies installed successfully"

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo "🔧 Installing Vercel CLI..."
    npm install -g vercel
    
    if [ $? -ne 0 ]; then
        echo "❌ Failed to install Vercel CLI"
        exit 1
    fi
fi

echo "✅ Vercel CLI ready"

# Login to Vercel (if needed)
echo "🔐 Checking Vercel authentication..."
if ! vercel whoami &> /dev/null; then
    echo "Please login to Vercel:"
    vercel login
fi

# Deploy to Vercel
echo "🚀 Deploying to Vercel..."
vercel --prod

if [ $? -eq 0 ]; then
    echo ""
    echo "🎉 Deployment successful!"
    echo "✅ Your game is now live with full multiplayer support!"
    echo ""
    echo "📋 Features deployed:"
    echo "   🤝 Co-op Overlevelse - Samarbeid om å overleve sammen"
    echo "   ⚔️ Konkurransemodus - Se hvem som overlever lengst"
    echo "   💰 Trading system - Bytte ressurser mellom spillere"
    echo "   💬 Chat system - Kommunisere med andre spillere"
    echo "   🏆 Leaderboard - Konkurransemodus ranking"
    echo "   📊 Player stats - Detaljert spillerstatistikk"
    echo ""
    echo "🎮 How to test:"
    echo "   1. Open your deployed URL"
    echo "   2. Click '🌐 Multiplayer' from main menu"
    echo "   3. Create or join a lobby"
    echo "   4. Invite friends to test together!"
    echo ""
else
    echo "❌ Deployment failed. Please check the error messages above."
    exit 1
fi
