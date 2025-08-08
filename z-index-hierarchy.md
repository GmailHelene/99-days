# Z-Index Hierarki for Beyond 99 Days

## ✅ Løst Z-Index Hierarki (lavest til høyest):

1. **gameUI Container**: z-index: 500
2. **statsPanel**: z-index: 600 (Hovedstatus panel - skal være bakgrunn)
3. **mobileControls**: z-index: 700 (Touch kontroller)
4. **craftingPanel**: z-index: 7000 (Crafting meny)
5. **inventoryPanel**: z-index: 8000 (Inventory meny)
6. **mobileHelpOverlay**: z-index: 9999 (Mobile instruksjoner)
7. **mathChallengeBackdrop**: z-index: 9999 (Math challenge bakgrunn)
8. **mathChallengeModal**: z-index: 10000 (Math challenge modal - øverst!)

## Problem var:
- Math challenge modal hadde kun z-index: 6000
- Dette var lavere enn inventory (8000) og andre UI elementer
- Ingen backdrop som blokkerte interaksjon med elementene bak

## Løsning:
- Økt math challenge modal til z-index: 10000
- Lagt til backdrop overlay med z-index: 9999
- Redusert statsPanel til z-index: 600
- Alle andre elementer har riktige verdier

Math challenge modal skal nå vises øverst på alle enheter!
