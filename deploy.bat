@echo off
REM deploy.bat - Windows deployment script for Beyond 99 Days

echo 🚀 Starting deployment process for Beyond 99 Days...

REM Check if Node.js is installed
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ Node.js is not installed. Please install Node.js first.
    pause
    exit /b 1
)

REM Check if npm is installed
npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo ❌ npm is not installed. Please install npm first.
    pause
    exit /b 1
)

echo ✅ Node.js version:
node --version
echo ✅ npm version:
npm --version

REM Install dependencies
echo 📦 Installing dependencies...
npm install

if %errorlevel% neq 0 (
    echo ❌ Failed to install dependencies
    pause
    exit /b 1
)

echo ✅ Dependencies installed successfully

REM Check if Vercel CLI is installed
vercel --version >nul 2>&1
if %errorlevel% neq 0 (
    echo 🔧 Installing Vercel CLI...
    npm install -g vercel
    
    if %errorlevel% neq 0 (
        echo ❌ Failed to install Vercel CLI
        pause
        exit /b 1
    )
)

echo ✅ Vercel CLI ready

REM Check Vercel authentication
echo 🔐 Checking Vercel authentication...
vercel whoami >nul 2>&1
if %errorlevel% neq 0 (
    echo Please login to Vercel:
    vercel login
)

REM Deploy to Vercel
echo 🚀 Deploying to Vercel...
vercel --prod

if %errorlevel% equ 0 (
    echo.
    echo 🎉 Deployment successful!
    echo ✅ Your game is now live with full multiplayer support!
    echo.
    echo 📋 Features deployed:
    echo    🤝 Co-op Overlevelse - Samarbeid om å overleve sammen
    echo    ⚔️ Konkurransemodus - Se hvem som overlever lengst
    echo    💰 Trading system - Bytte ressurser mellom spillere
    echo    💬 Chat system - Kommunisere med andre spillere
    echo    🏆 Leaderboard - Konkurransemodus ranking
    echo    📊 Player stats - Detaljert spillerstatistikk
    echo.
    echo 🎮 How to test:
    echo    1. Open your deployed URL
    echo    2. Click '🌐 Multiplayer' from main menu
    echo    3. Create or join a lobby
    echo    4. Invite friends to test together!
    echo.
) else (
    echo ❌ Deployment failed. Please check the error messages above.
)

pause
