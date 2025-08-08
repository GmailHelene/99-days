// Beyond 99 Days in the Woods - KOMPLETT VERSJON
// Utvidet overlevingsspill med avanserte funksjoner

// ==================== KONFIGURASJON ====================
const GAME_CONFIG = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    PLAYER_SPEED: 3,
    DAY_DURATION: 240000, // 4 minutter per dag
    INTERACTION_DISTANCE: 60,
    SAVE_KEY: 'beyond99days_save',
    VERSION: '2.0'
};

// ==================== UTILITIES ====================
class Utils {
    static distance(x1, y1, x2, y2) {
        const dx = x2 - x1;
        const dy = y2 - y1;
        return Math.sqrt(dx * dx + dy * dy);
    }

    static clamp(value, min, max) {
        return Math.max(min, Math.min(max, value));
    }

    static lerp(a, b, t) {
        return a + (b - a) * t;
    }

    static randomFloat(min, max) {
        return Math.random() * (max - min) + min;
    }

    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
}

// ==================== NOTIFICATION SYSTEM ====================
class NotificationSystem {
    constructor() {
        this.notifications = [];
        this.maxNotifications = 5;
    }

    show(message, type = 'info', duration = 3000) {
        const notification = {
            id: Date.now(),
            message,
            type,
            duration,
            startTime: Date.now(),
            y: 0
        };

        this.notifications.push(notification);
        
        // Fjern gamle notifikasjoner
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }

        // Auto-remove
        setTimeout(() => {
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index >= 0) {
                this.notifications.splice(index, 1);
            }
        }, duration);
    }

    update() {
        // Oppdater posisjoner
        this.notifications.forEach((notification, index) => {
            notification.y = Utils.lerp(notification.y, index * 40, 0.1);
        });
    }

    render(ctx) {
        this.notifications.forEach(notification => {
            const elapsed = Date.now() - notification.startTime;
            const alpha = Math.max(0, 1 - elapsed / notification.duration);
            
            if (alpha <= 0) return;

            ctx.save();
            ctx.globalAlpha = alpha;

            // Bakgrunn
            const colors = {
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#F44336'
            };

            ctx.fillStyle = colors[notification.type] || colors.info;
            ctx.fillRect(20, 20 + notification.y, 300, 35);

            // Tekst
            ctx.fillStyle = '#fff';
            ctx.font = '14px Arial';
            ctx.fillText(notification.message, 30, 40 + notification.y);

            ctx.restore();
        });
    }
}

// ==================== CRAFTING SYSTEM ====================
class CraftingSystem {
    constructor() {
        this.recipes = {
            'axe': {
                name: 'Øks',
                materials: { wood: 3, stone: 2 },
                description: 'Bedre for å høste tre',
                category: 'tools'
            },
            'pickaxe': {
                name: 'Hakke',
                materials: { wood: 2, stone: 3 },
                description: 'Bedre for å høste stein',
                category: 'tools'
            },
            'shelter': {
                name: 'Ly',
                materials: { wood: 10, stone: 5 },
                description: 'Beskytter mot kulde',
                category: 'buildings'
            },
            'fire': {
                name: 'Bål',
                materials: { wood: 5 },
                description: 'Gir varme og lys',
                category: 'buildings'
            },
            'water_collector': {
                name: 'Vannsamler',
                materials: { wood: 4, stone: 2 },
                description: 'Samler regnvann automatisk',
                category: 'buildings'
            }
        };
    }

    canCraft(recipeId, inventory) {
        const recipe = this.recipes[recipeId];
        if (!recipe) return false;

        for (const [material, amount] of Object.entries(recipe.materials)) {
            if (!inventory.hasItem(material, amount)) {
                return false;
            }
        }
        return true;
    }

    craft(recipeId, inventory) {
        if (!this.canCraft(recipeId, inventory)) return false;

        const recipe = this.recipes[recipeId];
        
        // Fjern materialer
        for (const [material, amount] of Object.entries(recipe.materials)) {
            inventory.removeItem(material, amount);
        }

        // Legg til det lagde objektet
        inventory.addItem(recipeId, 1);
        return true;
    }

    getAvailableRecipes(inventory) {
        return Object.keys(this.recipes).filter(id => this.canCraft(id, inventory));
    }
}

// ==================== SAVE SYSTEM ====================
class SaveSystem {
    static save(gameData) {
        try {
            const saveData = {
                version: GAME_CONFIG.VERSION,
                timestamp: Date.now(),
                ...gameData
            };
            localStorage.setItem(GAME_CONFIG.SAVE_KEY, JSON.stringify(saveData));
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    }

    static load() {
        try {
            const saved = localStorage.getItem(GAME_CONFIG.SAVE_KEY);
            if (!saved) return null;
            
            const saveData = JSON.parse(saved);
            
            // Sjekk versjon kompatibilitet
            if (saveData.version !== GAME_CONFIG.VERSION) {
                console.warn('Save file version mismatch');
                return null;
            }
            
            return saveData;
        } catch (error) {
            console.error('Failed to load game:', error);
            return null;
        }
    }

    static hasSave() {
        return localStorage.getItem(GAME_CONFIG.SAVE_KEY) !== null;
    }

    static deleteSave() {
        localStorage.removeItem(GAME_CONFIG.SAVE_KEY);
    }
}

// ==================== UTVIDET INVENTORY ====================
class Inventory {
    constructor() {
        this.items = {};
        this.maxSlots = 30;
        this.tools = new Set(['axe', 'pickaxe']);
        this.buildings = new Set(['shelter', 'fire', 'water_collector']);
    }

    addItem(type, amount = 1) {
        if (this.items[type]) {
            this.items[type] += amount;
        } else {
            this.items[type] = amount;
        }
        return true;
    }

    removeItem(type, amount = 1) {
        if (this.items[type] && this.items[type] >= amount) {
            this.items[type] -= amount;
            if (this.items[type] <= 0) {
                delete this.items[type];
            }
            return true;
        }
        return false;
    }

    hasItem(type, amount = 1) {
        return this.items[type] && this.items[type] >= amount;
    }

    getItemCount(type) {
        return this.items[type] || 0;
    }

    getAllItems() {
        return this.items;
    }

    getItemsByCategory(category) {
        const result = {};
        for (const [item, amount] of Object.entries(this.items)) {
            if (category === 'tools' && this.tools.has(item)) {
                result[item] = amount;
            } else if (category === 'buildings' && this.buildings.has(item)) {
                result[item] = amount;
            } else if (category === 'resources' && !this.tools.has(item) && !this.buildings.has(item)) {
                result[item] = amount;
            }
        }
        return result;
    }

    getTotalItems() {
        return Object.values(this.items).reduce((sum, amount) => sum + amount, 0);
    }

    isEmpty() {
        return Object.keys(this.items).length === 0;
    }

    serialize() {
        return { items: this.items };
    }

    deserialize(data) {
        this.items = data.items || {};
    }
}

// ==================== AUDIO SYSTEM ====================
class AudioSystem {
    constructor() {
        this.enabled = true;
        this.volume = 0.7;
        this.sounds = {};
        this.context = null;
        
        // Prøv å initialisere Web Audio API
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported');
        }
    }

    // Generer simple lyder programmatisk
    playTone(frequency, duration, type = 'sine') {
        if (!this.enabled || !this.context) return;

        const oscillator = this.context.createOscillator();
        const gainNode = this.context.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(this.context.destination);

        oscillator.frequency.value = frequency;
        oscillator.type = type;

        gainNode.gain.setValueAtTime(this.volume * 0.1, this.context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);

        oscillator.start(this.context.currentTime);
        oscillator.stop(this.context.currentTime + duration);
    }

    playCollectSound() {
        this.playTone(600, 0.1);
        setTimeout(() => this.playTone(800, 0.1), 50);
    }

    playEatSound() {
        this.playTone(400, 0.2, 'square');
    }

    playErrorSound() {
        this.playTone(200, 0.3, 'sawtooth');
    }

    playCraftSound() {
        this.playTone(500, 0.1);
        setTimeout(() => this.playTone(700, 0.1), 100);
        setTimeout(() => this.playTone(900, 0.15), 200);
    }

    toggle() {
        this.enabled = !this.enabled;
    }
}

// ==================== UTVIDET PLAYER ====================
class Player {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.width = 24;
        this.height = 36;
        this.speed = GAME_CONFIG.PLAYER_SPEED;
        this.health = 100;
        this.hunger = 100;
        this.thirst = 100;
        this.energy = 100;
        this.warmth = 100;
        this.direction = 'down';
        this.inputKeys = {};
        this.velX = 0;
        this.velY = 0;
        this.inventory = new Inventory();
        this.tools = new Set();
        this.experience = 0;
        this.level = 1;
        this.animationFrame = 0;
        this.isMoving = false;
    }

    setMovement(vx, vy) {
        this.velX = vx * this.speed;
        this.velY = vy * this.speed;
    }

    update(deltaTime) {
        // Bevegelse fra input
        let moveX = 0;
        let moveY = 0;

        if (this.inputKeys['w'] || this.inputKeys['arrowup']) {
            moveY -= this.speed;
            this.direction = 'up';
        }
        if (this.inputKeys['s'] || this.inputKeys['arrowdown']) {
            moveY += this.speed;
            this.direction = 'down';
        }
        if (this.inputKeys['a'] || this.inputKeys['arrowleft']) {
            moveX -= this.speed;
            this.direction = 'left';
        }
        if (this.inputKeys['d'] || this.inputKeys['arrowright']) {
            moveX += this.speed;
            this.direction = 'right';
        }

        // Virtual joystick movement
        moveX += this.velX;
        moveY += this.velY;

        // Sjekk om spilleren beveger seg
        this.isMoving = Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1;

        // Oppdater posisjon
        this.x += moveX;
        this.y += moveY;

        // Begrens til verden
        this.x = Utils.clamp(this.x, this.width/2, GAME_CONFIG.WORLD_WIDTH - this.width/2);
        this.y = Utils.clamp(this.y, this.height/2, GAME_CONFIG.WORLD_HEIGHT - this.height/2);

        // Animasjon
        if (this.isMoving) {
            this.animationFrame += deltaTime * 0.01;
        }

        // Stats decay (med reduserte rates for bedre gameplay)
        const seconds = deltaTime / 1000;
        this.hunger = Math.max(0, this.hunger - 0.3 * seconds);
        this.thirst = Math.max(0, this.thirst - 0.4 * seconds);
        this.energy = Math.max(0, this.energy - 0.2 * seconds);
        this.warmth = Math.max(0, this.warmth - 0.25 * seconds);

        // Health effects
        if (this.hunger <= 0) this.health -= 0.5 * seconds;
        if (this.thirst <= 0) this.health -= 1 * seconds;
        if (this.warmth <= 0) this.health -= 0.3 * seconds;
        if (this.energy <= 10) this.health -= 0.1 * seconds;
        
        this.health = Math.max(0, this.health);

        // Level up check
        const requiredExp = this.level * 100;
        if (this.experience >= requiredExp) {
            this.level++;
            this.experience -= requiredExp;
            return { levelUp: true, newLevel: this.level };
        }

        return null;
    }

    consume(itemType) {
        if (!this.inventory.hasItem(itemType)) return false;

        switch(itemType) {
            case 'berries':
                this.hunger = Math.min(100, this.hunger + 25);
                this.health = Math.min(100, this.health + 5);
                break;
            case 'water':
                this.thirst = Math.min(100, this.thirst + 35);
                break;
            case 'mushrooms':
                this.hunger = Math.min(100, this.hunger + 20);
                this.energy = Math.min(100, this.energy + 15);
                break;
        }

        this.inventory.removeItem(itemType, 1);
        return true;
    }

    addExperience(amount) {
        this.experience += amount;
    }

    getHarvestMultiplier() {
        return 1 + (this.level - 1) * 0.1; // 10% per level
    }

    render(ctx) {
        ctx.save();
        
        // Skygge
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height/2, this.width/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Enkel animasjon
        const bobOffset = this.isMoving ? Math.sin(this.animationFrame) * 2 : 0;
        
        // Kropp
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2 + bobOffset, this.width, this.height * 0.7);
        
        // Hode
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x - this.width/2 + 3, this.y - this.height/2 + bobOffset, this.width - 6, this.height * 0.3);
        
        // Øyne (blinker av og til)
        const shouldBlink = Math.sin(Date.now() * 0.005) > 0.95;
        if (!shouldBlink) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 6, this.y - this.height/2 + 5 + bobOffset, 2, 2);
            ctx.fillRect(this.x + 4, this.y - this.height/2 + 5 + bobOffset, 2, 2);
        }
        
        // Helsebar over hodet
        const barWidth = this.width;
        const barHeight = 4;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 12, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 12, barWidth * (this.health/100), barHeight);
        
        // Level indikator
        ctx.fillStyle = '#FFD700';
        ctx.font = '12px Arial';
        ctx.textAlign = 'center';
        ctx.fillText(`Lvl ${this.level}`, this.x, this.y - this.height/2 - 20);
        
        ctx.restore();
    }

    serialize() {
        return {
            x: this.x,
            y: this.y,
            health: this.health,
            hunger: this.hunger,
            thirst: this.thirst,
            energy: this.energy,
            warmth: this.warmth,
            experience: this.experience,
            level: this.level,
            inventory: this.inventory.serialize()
        };
    }

    deserialize(data) {
        this.x = data.x || this.x;
        this.y = data.y || this.y;
        this.health = data.health || 100;
        this.hunger = data.hunger || 100;
        this.thirst = data.thirst || 100;
        this.energy = data.energy || 100;
        this.warmth = data.warmth || 100;
        this.experience = data.experience || 0;
        this.level = data.level || 1;
        if (data.inventory) {
            this.inventory.deserialize(data.inventory);
        }
    }
}

// ==================== WEATHER SYSTEM ====================
class WeatherSystem {
    constructor() {
        this.currentWeather = 'clear';
        this.weatherTypes = ['clear', 'rain', 'storm', 'fog'];
        this.weatherDuration = 0;
        this.maxWeatherDuration = 120000; // 2 minutter
        this.rainParticles = [];
    }

    update(deltaTime) {
        this.weatherDuration += deltaTime;

        // Skift vær
        if (this.weatherDuration > this.maxWeatherDuration) {
            this.changeWeather();
            this.weatherDuration = 0;
        }

        // Oppdater regndråper
        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            this.updateRain(deltaTime);
        } else {
            this.rainParticles = [];
        }
    }

    changeWeather() {
        const oldWeather = this.currentWeather;
        this.currentWeather = this.weatherTypes[Utils.randomInt(0, this.weatherTypes.length - 1)];
        
        // Unngå samme vær to ganger på rad
        if (this.currentWeather === oldWeather && this.weatherTypes.length > 1) {
            this.changeWeather();
        }
    }

    updateRain(deltaTime) {
        // Legg til nye regndråper
        const intensity = this.currentWeather === 'storm' ? 5 : 2;
        for (let i = 0; i < intensity; i++) {
            if (Math.random() < 0.3) {
                this.rainParticles.push({
                    x: Utils.randomFloat(-100, GAME_CONFIG.WORLD_WIDTH + 100),
                    y: -10,
                    speed: Utils.randomFloat(200, 400),
                    life: 1.0
                });
            }
        }

        // Oppdater eksisterende dråper
        this.rainParticles = this.rainParticles.filter(drop => {
            drop.y += drop.speed * deltaTime / 1000;
            drop.life -= deltaTime / 1000;
            return drop.y < GAME_CONFIG.WORLD_HEIGHT + 50 && drop.life > 0;
        });
    }

    getWeatherEffects() {
        const effects = {
            warmthModifier: 1.0,
            thirstModifier: 1.0,
            energyModifier: 1.0,
            visibilityModifier: 1.0
        };

        switch (this.currentWeather) {
            case 'rain':
                effects.warmthModifier = 1.5; // Kaldere
                effects.thirstModifier = 0.7; // Mindre tørst
                effects.visibilityModifier = 0.8;
                break;
            case 'storm':
                effects.warmthModifier = 2.0; // Mye kaldere
                effects.thirstModifier = 0.5;
                effects.energyModifier = 1.3; // Mer sliten
                effects.visibilityModifier = 0.6;
                break;
            case 'fog':
                effects.visibilityModifier = 0.5;
                effects.warmthModifier = 1.2;
                break;
        }

        return effects;
    }

    render(ctx, cameraX, cameraY) {
        if (this.currentWeather === 'rain' || this.currentWeather === 'storm') {
            ctx.save();
            ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
            ctx.lineWidth = 1;

            this.rainParticles.forEach(drop => {
                ctx.globalAlpha = drop.life * 0.6;
                ctx.beginPath();
                ctx.moveTo(drop.x - cameraX, drop.y - cameraY);
                ctx.lineTo(drop.x - cameraX, drop.y - cameraY + 10);
                ctx.stroke();
            });

            ctx.restore();
        }

        if (this.currentWeather === 'fog') {
            ctx.save();
            ctx.fillStyle = 'rgba(200, 200, 200, 0.3)';
            ctx.fillRect(-cameraX, -cameraY, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
            ctx.restore();
        }
    }

    serialize() {
        return {
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration
        };
    }

    deserialize(data) {
        this.currentWeather = data.currentWeather || 'clear';
        this.weatherDuration = data.weatherDuration || 0;
    }
}

// Denne filen fortsetter i neste del...
