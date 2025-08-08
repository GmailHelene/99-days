@echo off
echo 🚀 Beyond 99 Days - Enhanced Multiplayer Deployment

echo 📦 Checking Node.js and npm...
node --version
npm --version

echo.
echo 🔧 Installing dependencies...
npm install

echo.
echo 🌐 Deploying to Vercel...
echo Please follow the login prompts if needed:

npx vercel --prod

echo.
echo 🎉 Deployment process completed!
echo.
echo 📋 Your enhanced multiplayer features are now live:
echo   🤝 Co-op Overlevelse
echo   ⚔️ Konkurransemodus  
echo   💰 Trading System
echo   💬 Enhanced Chat
echo   🏆 Live Leaderboard
echo.
echo 🎮 To test multiplayer:
echo   1. Open your deployed URL
echo   2. Click "🌐 Multiplayer" from main menu
echo   3. Create or join lobbies
echo   4. Test all the new features!
echo.

pause
