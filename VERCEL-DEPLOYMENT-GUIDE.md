# 🚀 Vercel Deployment - Steg for Steg

## Metode 1: Vercel Dashboard (Anbefalt)

1. **Gå til Vercel.com**
   - Besøk https://vercel.com
   - Klikk "Sign Up" eller "Log In"

2. **Connect GitHub/Git Repository**
   - Klikk "New Project"
   - Connect din GitHub-konto
   - Velg repository eller upload files

3. **Upload Files Direkte**
   - Alternativt: Dra og slipp hele `99days` mappen
   - Vercel vil automatisk detektere konfigurasjonen

## Metode 2: CLI Deployment

```bash
# 1. Login til Vercel
npx vercel login

# 2. Deploy til production
npx vercel --prod

# 3. Følg instruksjonene
```

## 📁 Viktige Filer for Deployment

Sørg for at disse filene er med:

✅ `index-complete.html` - Hovedside  
✅ `game-complete.js` - Hovedspill med multiplayer  
✅ `multiplayer-client.js` - Enhanced multiplayer system  
✅ `api/socketio.js` - Multiplayer server  
✅ `api/lobbies.js` - Lobby management  
✅ `package.json` - Dependencies  
✅ `vercel.json` - Deployment konfigurasjon  

## 🎮 Test Etter Deployment

1. **Åpne deployed URL**
2. **Test single-player først**
3. **Klikk "🌐 Multiplayer"**
4. **Create lobby og test:**
   - Co-op mode
   - Competitive mode
   - Trading system
   - Chat kommandoer (`/trade`, `/stats`, `/leaderboard`)

## 💡 Tips

- **GitHub Integration**: Koble til GitHub for automatisk deployment
- **Domain**: Sett opp custom domain hvis ønsket
- **Analytics**: Aktiver Vercel Analytics for statistikk
- **Environment**: Alt kjører automatisk, ingen environment variables nødvendig

## 🆘 Hvis du får problemer

1. **Check Vercel Dashboard** for deployment logs
2. **Test API endpoints** direkte (should return JSON)
3. **Open browser console** for error messages
4. **Try different browsers** for compatibility testing

Ditt spill er nå **production-ready** med full multiplayer support! 🎉
