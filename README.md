# Beyond 99 Days - Survival Math Game 🏕️🧮

Et komplett overlevingsspill med integrerte matematikk-utfordringer. Bygget som en Progressive Web App (PWA) for optimal mobilopplevelse.

## 🎮 Funksjoner

### Spill Features
- **Overlevingsspill**: Overlev 99 dager i villmarken
- **Matematikk-utfordringer**: Løs matteoppgaver for bonuser
- **Crafting System**: Lag verktøy og bygninger  
- **Level System**: Få erfaring og level up
- **Vær System**: Dynamisk vær som påvirker spilleren
- **Save/Load**: Automatisk lagring med localStorage

### PWA Features
- **Offline Play**: Fungerer uten internett
- **Installer som App**: Kan installeres på mobil/desktop
- **Mobile Optimalisert**: Touch-kontroller og responsiv design
- **Cross-Platform**: Fungerer på PC, mobil og tablet

### Mobilfunksjoner
- **Virtual Joystick**: Touch-basert bevegelse
- **Touch-knapper**: Pause, samle, inventar, crafting
- **Mobile keyboard**: Hurtigtaster for konsum og lagring
- **Responsiv UI**: Tilpasser seg forskjellige skjermstørrelser

## 🚀 Deployment til Vercel

### Forutsetninger
1. **Vercel konto**: Opprett på [vercel.com](https://vercel.com)
2. **Git repository**: Push koden til GitHub/GitLab
3. **Vercel CLI** (valgfritt): `npm i -g vercel`

### Deployment-steg

#### Metode 1: Via Vercel Dashboard
1. Gå til [vercel.com/dashboard](https://vercel.com/dashboard)
2. Klikk "New Project"
3. Import ditt GitHub repository
4. Vercel oppdager automatisk konfigurasjonen
5. Klikk "Deploy"

#### Metode 2: Via Vercel CLI
```bash
# Installer Vercel CLI
npm i -g vercel

# I prosjektmappen
vercel

# Følg instruksjonene for å koble til konto
# Velg innstillinger (bruk standardverdier)
```

### Konfigurasjon
Prosjektet er allerede konfigurert med:
- **vercel.json**: Deployment-konfigurasjon
- **manifest.json**: PWA manifest
- **sw.js**: Service worker for offline-funksjonalitet

### Viktige filer
- `index-complete.html` - Hovedfilen (routing root)
- `game-complete.js` - Spilllogikk
- `manifest.json` - PWA konfigurasjon
- `sw.js` - Service Worker
- `vercel.json` - Vercel deployment settings

## 📱 PWA Installasjon

### Desktop
1. Besøk nettsiden i Chrome/Edge
2. Klikk på install-ikonet i adresselinjen
3. Eller klikk "Installer App" i spillet

### Mobil
1. Åpne nettsiden i Safari (iOS) eller Chrome (Android)
2. **iOS**: Klikk "Del" → "Legg til på hjemskjerm"
3. **Android**: Klikk "Legg til på hjemskjerm" når prompted

## 🎯 Spillinstruksjoner

### PC Kontroller
- **WASD/Piltaster**: Bevegelse
- **E**: Saml ressurser
- **I**: Inventar
- **C**: Crafting
- **ESC**: Pause
- **1/2/3**: Spis/drikk items

### Mobil Kontroller
- **Virtual Joystick**: Bevegelse
- **📦**: Saml ressurser
- **🎒**: Inventar
- **🔨**: Crafting
- **⏸️**: Pause
- **1/2/3**: Spis/drikk (mobile keyboard)

### Matematikk-utfordringer
- Dukker opp tilfeldig under ressurssamling (15% sjanse)
- 4 valgmuligheter per oppgave
- 15-30 sekunder tidsbegrensning
- Riktige svar gir bonus ressurser og erfaring
- Vanskelighetsgrad øker basert på prestasjoner

## 🔧 Teknisk informasjon

### Teknologier
- **Vanilla JavaScript**: Ingen eksterne avhengigheter
- **Canvas API**: 2D-grafikk og animasjoner
- **Web Audio API**: Lydeffekter
- **LocalStorage**: Persistent lagring
- **Service Workers**: PWA-funksjonalitet
- **CSS3**: Moderne styling og animasjoner

### Ytelse
- Optimalisert for mobile enheter
- 60 FPS målfrekvens
- Minimal minnebruk
- Rask lasting med caching

## 📊 Spillstatistikk

Spillet tracker:
- Overlevde dager
- Spillerlevel og erfaring
- Matematikk-prestasjoner (riktige/totale svar)
- Ressurser samlet
- Bygninger oppført

## 🐛 Kjente problemer og løsninger

### iOS Safari
- Service Worker kan ha forsinkelser
- PWA installer krever manuell prosess

### Android Chrome
- PWA installer bør fungere automatisk
- Fullskjerm-modus kan kreve justiring

### Desktop
- Touch-kontroller vises på alle enheter for konsistens
- Kan skjules via innstillinger

## 🔄 Oppdateringer

Ved nye versjoner:
1. Service Worker oppdaterer automatisk cache
2. Brukere får melding om tilgjengelige oppdateringer
3. Gamle versjoner fungerer fortsatt offline

## 🤝 Bidrag

For å utvikle videre:
1. Fork repository
2. Opprett feature branch
3. Test grundig på både desktop og mobil
4. Submit pull request

## 📄 Lisens

Dette prosjektet er åpen kildekode og tilgjengelig under MIT-lisensen.
