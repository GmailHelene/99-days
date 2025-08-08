// Fortsettelse av main-complete.js

// ==================== UTVIDET WORLD ====================
class EnhancedWorld {
    constructor() {
        this.resources = [];
        this.buildings = [];
        this.currentDay = 1;
        this.timeOfDay = 8; // Start kl 08:00
        this.gameTime = 0;
        this.weather = new WeatherSystem();
        this.generateResources();
    }

    generateResources() {
        const resourceTypes = [
            { 
                type: 'tree', 
                icon: '🌲', 
                color: '#228B22', 
                size: 35,
                harvestable: true,
                yields: { wood: 4, berries: 1 },
                rarity: 0.3
            },
            { 
                type: 'stone', 
                icon: '🪨', 
                color: '#696969', 
                size: 28,
                harvestable: true,
                yields: { stone: 3 },
                rarity: 0.25
            },
            { 
                type: 'berries', 
                icon: '🫐', 
                color: '#4B0082', 
                size: 22,
                harvestable: true,
                yields: { berries: 3 },
                rarity: 0.2
            },
            { 
                type: 'water', 
                icon: '💧', 
                color: '#4682B4', 
                size: 40,
                harvestable: true,
                yields: { water: 6 },
                rarity: 0.15
            },
            { 
                type: 'mushrooms', 
                icon: '🍄', 
                color: '#8B4513', 
                size: 25,
                harvestable: true,
                yields: { mushrooms: 2 },
                rarity: 0.1
            },
            { 
                type: 'rare_crystals', 
                icon: '💎', 
                color: '#9C27B0', 
                size: 20,
                harvestable: true,
                yields: { crystals: 1 },
                rarity: 0.05
            }
        ];

        // Generer flere ressurser i en større verden
        for (let i = 0; i < 200; i++) {
            const resourceType = this.selectWeightedResource(resourceTypes);
            this.resources.push({
                id: `res_${i}`,
                ...resourceType,
                x: 100 + Math.random() * (GAME_CONFIG.WORLD_WIDTH - 200),
                y: 100 + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 200),
                harvested: false,
                respawnTime: Utils.randomFloat(45000, 120000), // 45-120 sekunder
                harvestCount: 0,
                maxHarvests: Utils.randomInt(3, 8)
            });
        }
    }

    selectWeightedResource(resourceTypes) {
        const totalWeight = resourceTypes.reduce((sum, type) => sum + type.rarity, 0);
        let random = Math.random() * totalWeight;
        
        for (const type of resourceTypes) {
            random -= type.rarity;
            if (random <= 0) {
                return type;
            }
        }
        return resourceTypes[0]; // Fallback
    }

    update(deltaTime, player) {
        this.gameTime += deltaTime;
        this.timeOfDay = 8 + (this.gameTime / 1000) * (16 / (GAME_CONFIG.DAY_DURATION / 1000));
        
        if (this.timeOfDay >= 24) {
            this.currentDay++;
            this.timeOfDay = 8;
            this.gameTime = 0;
        }

        // Oppdater vær
        this.weather.update(deltaTime);

        // Få væreffekter
        const weatherEffects = this.weather.getWeatherEffects();
        
        // Påvirk spilleren basert på vær
        if (player) {
            const seconds = deltaTime / 1000;
            player.warmth = Math.max(0, player.warmth - (0.25 * weatherEffects.warmthModifier * seconds));
            player.thirst = Math.max(0, player.thirst - (0.4 * weatherEffects.thirstModifier * seconds));
            player.energy = Math.max(0, player.energy - (0.2 * weatherEffects.energyModifier * seconds));
        }

        // Respawn ressurser
        this.resources.forEach(resource => {
            if (resource.harvested && Date.now() - resource.harvestedAt > resource.respawnTime) {
                if (resource.harvestCount < resource.maxHarvests) {
                    resource.harvested = false;
                    delete resource.harvestedAt;
                } else {
                    // Flytt utslitt ressurs til ny lokasjon
                    resource.x = 100 + Math.random() * (GAME_CONFIG.WORLD_WIDTH - 200);
                    resource.y = 100 + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 200);
                    resource.harvested = false;
                    resource.harvestCount = 0;
                    delete resource.harvestedAt;
                }
            }
        });

        // Oppdater bygninger
        this.buildings.forEach(building => {
            if (building.type === 'water_collector' && this.weather.currentWeather === 'rain') {
                building.waterStored = Math.min(building.maxWater, building.waterStored + deltaTime / 10000);
            }
        });
    }

    getTimeString() {
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getDayNightAlpha() {
        if (this.timeOfDay < 6 || this.timeOfDay > 20) {
            return 0.7; // Natt
        } else if (this.timeOfDay < 8 || this.timeOfDay > 18) {
            return 0.3; // Skumring/daggry
        }
        return 0; // Dag
    }

    getResourcesNear(x, y, distance) {
        return this.resources.filter(resource => {
            if (resource.harvested) return false;
            return Utils.distance(resource.x, resource.y, x, y) <= distance;
        });
    }

    getBuildingsNear(x, y, distance) {
        return this.buildings.filter(building => {
            return Utils.distance(building.x, building.y, x, y) <= distance;
        });
    }

    harvestResource(resource, player) {
        if (resource.harvested || !resource.harvestable) return null;

        resource.harvested = true;
        resource.harvestedAt = Date.now();
        resource.harvestCount++;

        const multiplier = player.getHarvestMultiplier();
        const yields = {};

        // Beregn yield med multiplier
        for (const [itemType, baseAmount] of Object.entries(resource.yields)) {
            yields[itemType] = Math.ceil(baseAmount * multiplier);
            player.inventory.addItem(itemType, yields[itemType]);
        }

        // Gi erfaring
        player.addExperience(10);

        return yields;
    }

    placeBuilding(type, x, y, player) {
        if (!player.inventory.hasItem(type)) return false;

        const building = {
            id: `building_${Date.now()}`,
            type,
            x,
            y,
            built: Date.now()
        };

        // Spesielle egenskaper for forskjellige bygninger
        switch (type) {
            case 'shelter':
                building.warmthRadius = 80;
                building.warmthBonus = 0.5;
                break;
            case 'fire':
                building.warmthRadius = 60;
                building.warmthBonus = 0.8;
                building.fuel = 100;
                building.maxFuel = 100;
                break;
            case 'water_collector':
                building.waterStored = 0;
                building.maxWater = 50;
                break;
        }

        this.buildings.push(building);
        player.inventory.removeItem(type, 1);
        return true;
    }

    render(ctx) {
        // Bakgrunn gradient basert på tid på døgnet
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.WORLD_HEIGHT);
        const nightAlpha = this.getDayNightAlpha();
        
        if (nightAlpha > 0.5) {
            // Natt
            gradient.addColorStop(0, '#1a1a2e');
            gradient.addColorStop(0.7, '#16213e');
            gradient.addColorStop(1, '#0f3460');
        } else if (nightAlpha > 0) {
            // Skumring
            gradient.addColorStop(0, '#ff6b6b');
            gradient.addColorStop(0.7, '#4ecdc4');
            gradient.addColorStop(1, '#45b7d1');
        } else {
            // Dag
            gradient.addColorStop(0, '#87CEEB');
            gradient.addColorStop(0.7, '#90EE90');
            gradient.addColorStop(1, '#228B22');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        // Natt overlay
        if (nightAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 50, ${nightAlpha})`;
            ctx.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        }

        // Bakgrunnselementer (gress, busker, etc.)
        ctx.fillStyle = 'rgba(34, 139, 34, 0.4)';
        for (let i = 0; i < 50; i++) {
            const x = (i * 120) % GAME_CONFIG.WORLD_WIDTH;
            const y = (Math.floor(i / 25) * 150) % GAME_CONFIG.WORLD_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, Utils.randomFloat(30, 50), 0, Math.PI * 2);
            ctx.fill();
        }

        // Bygninger (render først så de er bak ressurser)
        this.buildings.forEach(building => {
            ctx.save();

            // Varme radius for shelter og ild
            if ((building.type === 'shelter' || building.type === 'fire') && building.warmthRadius) {
                ctx.fillStyle = 'rgba(255, 200, 100, 0.1)';
                ctx.beginPath();
                ctx.arc(building.x, building.y, building.warmthRadius, 0, Math.PI * 2);
                ctx.fill();
            }

            // Bygning ikon
            const icons = {
                shelter: '🏠',
                fire: '🔥',
                water_collector: '🪣'
            };

            ctx.font = '32px Arial';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(icons[building.type] || '❓', building.x, building.y);

            // Fuel bar for ild
            if (building.type === 'fire' && building.fuel !== undefined) {
                const barWidth = 40;
                const barHeight = 6;
                ctx.fillStyle = '#333';
                ctx.fillRect(building.x - barWidth/2, building.y + 25, barWidth, barHeight);
                ctx.fillStyle = '#ff4444';
                ctx.fillRect(building.x - barWidth/2, building.y + 25, barWidth * (building.fuel/building.maxFuel), barHeight);
            }

            ctx.restore();
        });

        // Ressurser
        this.resources.forEach(resource => {
            if (resource.harvested) return;

            ctx.save();

            // Pulserende effekt for sjeldne ressurser
            if (resource.type === 'rare_crystals') {
                const pulse = Math.sin(Date.now() * 0.005) * 0.2 + 1;
                ctx.scale(pulse, pulse);
            }

            // Bakgrunn for ressurs
            ctx.fillStyle = resource.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(resource.x, resource.y, resource.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            // Ikon
            ctx.font = `${resource.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(resource.icon, resource.x, resource.y);

            ctx.restore();
        });
    }

    serialize() {
        return {
            currentDay: this.currentDay,
            timeOfDay: this.timeOfDay,
            gameTime: this.gameTime,
            weather: this.weather.serialize(),
            buildings: this.buildings,
            // Ikke lagre resources siden de regenereres
        };
    }

    deserialize(data) {
        this.currentDay = data.currentDay || 1;
        this.timeOfDay = data.timeOfDay || 8;
        this.gameTime = data.gameTime || 0;
        if (data.weather) {
            this.weather.deserialize(data.weather);
        }
        this.buildings = data.buildings || [];
    }
}

// ==================== HOVEDSPILLKLASSE ====================
class CompleteGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // 'menu', 'playing', 'paused', 'inventory', 'crafting'
        this.lastTime = 0;
        this.showInventory = false;
        this.showCrafting = false;
        this.selectedCraftingCategory = 'tools';
        
        // Systemer
        this.notifications = new NotificationSystem();
        this.crafting = new CraftingSystem();
        this.audio = new AudioSystem();
        
        // UI state
        this.uiElements = {
            craftingButton: null,
            saveButton: null,
            loadButton: null
        };
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.gameLoop();
        
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Sjekk om det finnes lagret spill
        this.updateMenuButtons();
    }

    updateMenuButtons() {
        const hasLasSave = SaveSystem.hasSave();
        // Oppdater meny knapper basert på om det finnes lagret spill
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        // Tastatur
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));

        // Mobile kontroller
        this.setupMobileControls();

        // Forhindre context menu på høyreklikk
        this.canvas.addEventListener('contextmenu', (e) => e.preventDefault());

        // Museklikk for crafting og bygging
        this.canvas.addEventListener('click', (e) => this.handleCanvasClick(e));
    }

    handleCanvasClick(e) {
        if (this.gameState !== 'playing' || !this.player || !this.world) return;

        const rect = this.canvas.getBoundingClientRect();
        const clickX = e.clientX - rect.left;
        const clickY = e.clientY - rect.top;

        // Konverter til verden-koordinater
        const centerX = this.canvas.width / 2;
        const centerY = this.canvas.height / 2;
        const worldX = clickX - centerX + this.player.x;
        const worldY = clickY - centerY + this.player.y;

        // Sjekk om vi klikket på en bygning for interaksjon
        const nearbyBuildings = this.world.getBuildingsNear(worldX, worldY, 30);
        if (nearbyBuildings.length > 0) {
            this.interactWithBuilding(nearbyBuildings[0]);
        }
    }

    interactWithBuilding(building) {
        switch (building.type) {
            case 'water_collector':
                if (building.waterStored > 0) {
                    const amount = Math.min(5, building.waterStored);
                    this.player.inventory.addItem('water', amount);
                    building.waterStored -= amount;
                    this.notifications.show(`Hentet ${amount} vann fra vannsamleren`, 'success');
                    this.audio.playCollectSound();
                } else {
                    this.notifications.show('Vannsamleren er tom', 'warning');
                }
                break;
            case 'fire':
                if (this.player.inventory.hasItem('wood')) {
                    this.player.inventory.removeItem('wood', 1);
                    building.fuel = Math.min(building.maxFuel, building.fuel + 20);
                    this.notifications.show('La til ved på bålet', 'success');
                } else {
                    this.notifications.show('Du trenger ved for å mate bålet', 'warning');
                }
                break;
        }
    }

    setupMobileControls() {
        const joystick = document.getElementById('virtualJoystick');
        const knob = document.getElementById('joystickKnob');
        
        if (!joystick || !knob) return;

        let isDragging = false;
        const maxDistance = 50;

        const getCenter = () => {
            const rect = joystick.getBoundingClientRect();
            return {
                x: rect.left + rect.width / 2,
                y: rect.top + rect.height / 2
            };
        };

        const resetKnob = () => {
            knob.style.transform = 'translate(-50%, -50%)';
            if (this.player) {
                this.player.setMovement(0, 0);
            }
        };

        const handleStart = (e) => {
            e.preventDefault();
            isDragging = true;
        };

        const handleMove = (e) => {
            if (!isDragging || !this.player) return;
            e.preventDefault();

            const touch = e.touches ? e.touches[0] : e;
            const center = getCenter();
            const x = touch.clientX - center.x;
            const y = touch.clientY - center.y;
            
            const distance = Math.sqrt(x * x + y * y);
            const angle = Math.atan2(y, x);
            
            const constrainedDistance = Math.min(distance, maxDistance);
            const constrainedX = Math.cos(angle) * constrainedDistance;
            const constrainedY = Math.sin(angle) * constrainedDistance;
            
            knob.style.transform = `translate(${constrainedX - 50}%, ${constrainedY - 50}%)`;
            
            const normalizedX = constrainedX / maxDistance;
            const normalizedY = constrainedY / maxDistance;
            
            this.player.setMovement(normalizedX, normalizedY);
        };

        const handleEnd = (e) => {
            e.preventDefault();
            isDragging = false;
            resetKnob();
        };

        joystick.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
        
        joystick.addEventListener('mousedown', handleStart);
        document.addEventListener('mousemove', handleMove);
        document.addEventListener('mouseup', handleEnd);
    }

    handleKeyDown(e) {
        if (this.gameState === 'playing' && this.player) {
            const key = e.key.toLowerCase();
            
            // Bevegelse
            if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                this.player.inputKeys[key] = true;
                e.preventDefault();
            }
            
            // Funksjonstaster
            if (key === 'escape') {
                if (this.showInventory || this.showCrafting) {
                    this.showInventory = false;
                    this.showCrafting = false;
                } else {
                    this.togglePauseMenu();
                }
            }
            
            if (key === 'e') {
                this.collectNearbyResources();
            }
            
            if (key === 'i') {
                this.toggleInventory();
            }

            if (key === 'c') {
                this.toggleCrafting();
            }

            if (key === 'b') {
                this.attemptBuildMode();
            }

            // Konsumer items
            if (key === '1') this.consumeItem('berries');
            if (key === '2') this.consumeItem('water');
            if (key === '3') this.consumeItem('mushrooms');

            // Crafting shortcuts
            if (this.showCrafting) {
                if (key === 'q') this.selectedCraftingCategory = 'tools';
                if (key === 'w') this.selectedCraftingCategory = 'buildings';
            }
        }
    }

    handleKeyUp(e) {
        if (this.gameState === 'playing' && this.player) {
            const key = e.key.toLowerCase();
            if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                this.player.inputKeys[key] = false;
                e.preventDefault();
            }
        }
    }

    consumeItem(itemType) {
        if (this.player.consume(itemType)) {
            this.audio.playEatSound();
            this.notifications.show(`Spiste ${itemType}`, 'success');
        } else {
            this.notifications.show(`Ingen ${itemType} i inventaret`, 'warning');
            this.audio.playErrorSound();
        }
    }

    collectNearbyResources() {
        if (!this.player || !this.world) return;

        const nearbyResources = this.world.getResourcesNear(
            this.player.x, 
            this.player.y, 
            GAME_CONFIG.INTERACTION_DISTANCE
        );

        if (nearbyResources.length > 0) {
            const resource = nearbyResources[0];
            const yields = this.world.harvestResource(resource, this.player);
            if (yields) {
                this.audio.playCollectSound();
                const itemList = Object.entries(yields).map(([k,v]) => `${v} ${k}`).join(', ');
                this.notifications.show(`Samlet: ${itemList}`, 'success');
            }
        } else {
            this.notifications.show('Ingen ressurser i nærheten', 'warning');
        }
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
        if (this.showInventory) {
            this.showCrafting = false;
        }
    }

    toggleCrafting() {
        this.showCrafting = !this.showCrafting;
        if (this.showCrafting) {
            this.showInventory = false;
        }
    }

    // Fortsetter i neste del...
}
