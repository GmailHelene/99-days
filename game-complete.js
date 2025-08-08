// Beyond 99 Days in the Woods - KOMPLETT FORBEDRET VERSJON
// Avansert overlevingsspill med alle funksjoner

// ==================== KONFIGURASJON ====================
const GAME_CONFIG = {
    WORLD_WIDTH: 3000,
    WORLD_HEIGHT: 3000,
    PLAYER_SPEED: 3,
    DAY_DURATION: 240000, // 4 minutter per dag
    INTERACTION_DISTANCE: 60,
    SAVE_KEY: 'beyond99days_save',
    VERSION: '2.1'
};

// ==================== WORLD SELECTION SYSTEM ====================
class WorldSelectionSystem {
    constructor() {
        this.worlds = {
            'forest': {
                name: '🌲 Skog Verden',
                description: 'Den klassiske overlevingsverdenen med tett skog og rike ressurser',
                difficulty: 'Normal',
                features: ['Mange trær', 'Bær og sopp', 'Mild klima'],
                unlocked: true
            },
            'mountain': {
                name: '⛰️ Fjell Verden',
                description: 'Røff fjellverden med mange steiner men knappe matressurser',
                difficulty: 'Vanskelig',
                features: ['Mye stein', 'Kaldere klima', 'Sjeldne ressurser'],
                unlocked: false,
                unlockRequirement: 'Overlev 10 dager i Skog Verden'
            },
            'desert': {
                name: '🏜️ Ørken Verden',
                description: 'Tørr ørkenverd med ekstreme forhold og unike utfordringer',
                difficulty: 'Ekstrem',
                features: ['Lite vann', 'Varmere dager', 'Spesielle planter'],
                unlocked: false,
                unlockRequirement: 'Overlev 25 dager i Fjell Verden'
            },
            'island': {
                name: '🏝️ Øy Verden',
                description: 'Tropisk øy omgitt av hav med helt nye overlevingsutfordringer',
                difficulty: 'Unique',
                features: ['Fiske system', 'Kokosnøtter', 'Regnsesong'],
                unlocked: false,
                unlockRequirement: 'Fullføre Ørken Verden (50 dager)'
            }
        };
        
        this.selectedWorld = 'forest';
        this.loadProgress();
    }

    loadProgress() {
        const saved = localStorage.getItem('worldProgress');
        if (saved) {
            try {
                const progress = JSON.parse(saved);
                for (const [worldId, data] of Object.entries(progress)) {
                    if (this.worlds[worldId]) {
                        this.worlds[worldId].unlocked = data.unlocked || false;
                        this.worlds[worldId].bestDays = data.bestDays || 0;
                    }
                }
            } catch (error) {
                console.warn('Failed to load world progress');
            }
        }
    }

    saveProgress() {
        const progress = {};
        for (const [worldId, world] of Object.entries(this.worlds)) {
            progress[worldId] = {
                unlocked: world.unlocked,
                bestDays: world.bestDays || 0
            };
        }
        localStorage.setItem('worldProgress', JSON.stringify(progress));
    }

    checkUnlocks(currentWorld, daysPlayed) {
        let newUnlocks = [];
        
        // Update current world progress
        if (this.worlds[currentWorld]) {
            this.worlds[currentWorld].bestDays = Math.max(
                this.worlds[currentWorld].bestDays || 0, 
                daysPlayed
            );
        }

        // Check unlock conditions
        if (currentWorld === 'forest' && daysPlayed >= 10 && !this.worlds.mountain.unlocked) {
            this.worlds.mountain.unlocked = true;
            newUnlocks.push('mountain');
        }
        
        if (currentWorld === 'mountain' && daysPlayed >= 25 && !this.worlds.desert.unlocked) {
            this.worlds.desert.unlocked = true;
            newUnlocks.push('desert');
        }
        
        if (currentWorld === 'desert' && daysPlayed >= 50 && !this.worlds.island.unlocked) {
            this.worlds.island.unlocked = true;
            newUnlocks.push('island');
        }

        if (newUnlocks.length > 0) {
            this.saveProgress();
        }

        return newUnlocks;
    }

    getUnlockedWorlds() {
        return Object.entries(this.worlds)
            .filter(([id, world]) => world.unlocked)
            .map(([id, world]) => ({ id, ...world }));
    }

    selectWorld(worldId) {
        if (this.worlds[worldId] && this.worlds[worldId].unlocked) {
            this.selectedWorld = worldId;
            return true;
        }
        return false;
    }

    getSelectedWorld() {
        return this.selectedWorld;
    }

    getWorldConfig(worldId) {
        return this.worlds[worldId];
    }
}

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

// ==================== MATH CHALLENGE SYSTEM ====================
class MathChallengeSystem {
    constructor() {
        this.currentChallenge = null;
        this.challengeActive = false;
        this.correctAnswers = 0;
        this.totalChallenges = 0;
        this.difficulty = 1;
        this.challengeTypes = ['addition', 'subtraction', 'multiplication', 'division'];
    }

    generateChallenge() {
        const type = this.challengeTypes[Math.floor(Math.random() * this.challengeTypes.length)];
        let question, answer, options;

        switch(type) {
            case 'addition':
                const a1 = Utils.randomInt(1, 10 * this.difficulty);
                const b1 = Utils.randomInt(1, 10 * this.difficulty);
                answer = a1 + b1;
                question = `${a1} + ${b1} = ?`;
                break;
            
            case 'subtraction':
                const a2 = Utils.randomInt(10, 20 * this.difficulty);
                const b2 = Utils.randomInt(1, a2);
                answer = a2 - b2;
                question = `${a2} - ${b2} = ?`;
                break;
            
            case 'multiplication':
                const a3 = Utils.randomInt(2, 5 + this.difficulty);
                const b3 = Utils.randomInt(2, 8);
                answer = a3 * b3;
                question = `${a3} × ${b3} = ?`;
                break;
            
            case 'division':
                const b4 = Utils.randomInt(2, 8);
                const answer4 = Utils.randomInt(2, 10);
                const a4 = b4 * answer4;
                answer = answer4;
                question = `${a4} ÷ ${b4} = ?`;
                break;
        }

        // Generate multiple choice options
        options = [answer];
        while(options.length < 4) {
            const wrongAnswer = answer + Utils.randomInt(-5, 5);
            if (wrongAnswer > 0 && !options.includes(wrongAnswer)) {
                options.push(wrongAnswer);
            }
        }
        
        // Shuffle options
        options = options.sort(() => Math.random() - 0.5);

        this.currentChallenge = {
            question,
            answer,
            options,
            type,
            timeLimit: 15000 + (this.difficulty * 5000), // 15-30 seconds
            startTime: Date.now()
        };

        this.challengeActive = true;
        this.totalChallenges++;
        return this.currentChallenge;
    }

    checkAnswer(selectedAnswer) {
        if (!this.currentChallenge) return false;

        const correct = selectedAnswer === this.currentChallenge.answer;
        if (correct) {
            this.correctAnswers++;
            if (this.correctAnswers % 5 === 0) {
                this.difficulty = Math.min(5, this.difficulty + 1);
            }
        }

        this.challengeActive = false;
        this.currentChallenge = null;
        return correct;
    }

    shouldTriggerChallenge() {
        // Trigger challenge randomly during resource collection
        return Math.random() < 0.15; // 15% chance
    }

    getSuccessRate() {
        return this.totalChallenges > 0 ? (this.correctAnswers / this.totalChallenges) * 100 : 0;
    }

    serialize() {
        return {
            correctAnswers: this.correctAnswers,
            totalChallenges: this.totalChallenges,
            difficulty: this.difficulty
        };
    }

    deserialize(data) {
        this.correctAnswers = data.correctAnswers || 0;
        this.totalChallenges = data.totalChallenges || 0;
        this.difficulty = data.difficulty || 1;
    }
}

// ==================== MULTIPLAYER SYSTEM ====================
class MultiplayerSystem {
    constructor() {
        this.isHost = false;
        this.isConnected = false;
        this.players = new Map();
        this.roomCode = null;
        this.connection = null;
        this.enabled = false; // Disabled by default for now
    }

    // Simple peer-to-peer setup (for future implementation)
    createRoom() {
        this.roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();
        this.isHost = true;
        return this.roomCode;
    }

    joinRoom(code) {
        this.roomCode = code;
        this.isHost = false;
        // Future: implement WebRTC or WebSocket connection
    }

    sendPlayerUpdate(player) {
        if (!this.isConnected || !this.enabled) return;
        
        const update = {
            type: 'player_update',
            data: {
                x: player.x,
                y: player.y,
                health: player.health,
                level: player.level
            }
        };
        
        // Future: send update to connected players
    }

    receiveUpdate(update) {
        // Future: handle received player updates
    }

    disconnect() {
        this.isConnected = false;
        this.players.clear();
        this.roomCode = null;
    }
}

// ==================== MOBILE OPTIMIZATION ====================
class MobileOptimizer {
    constructor() {
        this.isMobile = this.detectMobile();
        this.orientation = 'portrait';
        this.setupMobileOptimizations();
    }

    detectMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) 
            || window.innerWidth <= 768;
    }

    setupMobileOptimizations() {
        if (this.isMobile) {
            // Prevent zoom on input
            document.addEventListener('touchstart', (e) => {
                if (e.touches.length > 1) {
                    e.preventDefault();
                }
            });

            // Handle orientation changes
            window.addEventListener('orientationchange', () => {
                setTimeout(() => {
                    this.handleOrientationChange();
                }, 100);
            });

            // Optimize canvas for mobile
            this.optimizeCanvasForMobile();
        }
    }

    handleOrientationChange() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            canvas.width = window.innerWidth;
            canvas.height = window.innerHeight;
        }
    }

    optimizeCanvasForMobile() {
        const canvas = document.getElementById('gameCanvas');
        if (canvas) {
            // Use devicePixelRatio for crisp graphics on high-DPI screens
            const ctx = canvas.getContext('2d');
            const devicePixelRatio = window.devicePixelRatio || 1;
            
            canvas.width = window.innerWidth * devicePixelRatio;
            canvas.height = window.innerHeight * devicePixelRatio;
            canvas.style.width = window.innerWidth + 'px';
            canvas.style.height = window.innerHeight + 'px';
            
            ctx.scale(devicePixelRatio, devicePixelRatio);
        }
    }

    showMobileTooltip(message, duration = 3000) {
        const tooltip = document.createElement('div');
        tooltip.className = 'mobile-tooltip';
        tooltip.textContent = message;
        tooltip.style.cssText = `
            position: fixed;
            bottom: 100px;
            left: 50%;
            transform: translateX(-50%);
            background: rgba(0,0,0,0.8);
            color: white;
            padding: 10px 20px;
            border-radius: 20px;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
        `;
        
        document.body.appendChild(tooltip);
        
        setTimeout(() => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        }, duration);
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
        
        if (this.notifications.length > this.maxNotifications) {
            this.notifications.shift();
        }

        setTimeout(() => {
            const index = this.notifications.findIndex(n => n.id === notification.id);
            if (index >= 0) {
                this.notifications.splice(index, 1);
            }
        }, duration);
    }

    update() {
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

            const colors = {
                info: '#2196F3',
                success: '#4CAF50',
                warning: '#FF9800',
                error: '#F44336'
            };

            ctx.fillStyle = colors[notification.type] || colors.info;
            ctx.fillRect(20, 20 + notification.y, 300, 35);

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
        
        for (const [material, amount] of Object.entries(recipe.materials)) {
            inventory.removeItem(material, amount);
        }

        inventory.addItem(recipeId, 1);
        return true;
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

// ==================== INVENTORY ====================
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
        this.volume = 0.5;
        this.context = null;
        
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (error) {
            console.warn('Web Audio API not supported');
        }
    }

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

// ==================== PLAYER ====================
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

        moveX += this.velX;
        moveY += this.velY;

        this.isMoving = Math.abs(moveX) > 0.1 || Math.abs(moveY) > 0.1;

        this.x += moveX;
        this.y += moveY;

        this.x = Utils.clamp(this.x, this.width/2, GAME_CONFIG.WORLD_WIDTH - this.width/2);
        this.y = Utils.clamp(this.y, this.height/2, GAME_CONFIG.WORLD_HEIGHT - this.height/2);

        if (this.isMoving) {
            this.animationFrame += deltaTime * 0.01;
        }

        const seconds = deltaTime / 1000;
        this.hunger = Math.max(0, this.hunger - 0.3 * seconds);
        this.thirst = Math.max(0, this.thirst - 0.4 * seconds);
        this.energy = Math.max(0, this.energy - 0.2 * seconds);
        this.warmth = Math.max(0, this.warmth - 0.25 * seconds);

        if (this.hunger <= 0) this.health -= 0.5 * seconds;
        if (this.thirst <= 0) this.health -= 1 * seconds;
        if (this.warmth <= 0) this.health -= 0.3 * seconds;
        if (this.energy <= 10) this.health -= 0.1 * seconds;
        
        this.health = Math.max(0, this.health);

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
            case 'cactus_fruit':
                this.hunger = Math.min(100, this.hunger + 15);
                this.thirst = Math.min(100, this.thirst + 20);
                break;
            case 'coconut':
                this.hunger = Math.min(100, this.hunger + 30);
                this.thirst = Math.min(100, this.thirst + 25);
                break;
            case 'fish':
                this.hunger = Math.min(100, this.hunger + 40);
                this.health = Math.min(100, this.health + 10);
                break;
            case 'herbs':
                this.health = Math.min(100, this.health + 15);
                this.energy = Math.min(100, this.energy + 10);
                break;
        }

        this.inventory.removeItem(itemType, 1);
        return true;
    }

    addExperience(amount) {
        this.experience += amount;
    }

    getHarvestMultiplier() {
        return 1 + (this.level - 1) * 0.1;
    }

    render(ctx) {
        ctx.save();
        
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height/2, this.width/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        const bobOffset = this.isMoving ? Math.sin(this.animationFrame) * 2 : 0;
        
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2 + bobOffset, this.width, this.height * 0.7);
        
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x - this.width/2 + 3, this.y - this.height/2 + bobOffset, this.width - 6, this.height * 0.3);
        
        const shouldBlink = Math.sin(Date.now() * 0.005) > 0.95;
        if (!shouldBlink) {
            ctx.fillStyle = '#000';
            ctx.fillRect(this.x - 6, this.y - this.height/2 + 5 + bobOffset, 2, 2);
            ctx.fillRect(this.x + 4, this.y - this.height/2 + 5 + bobOffset, 2, 2);
        }
        
        const barWidth = this.width;
        const barHeight = 4;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 12, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 12, barWidth * (this.health/100), barHeight);
        
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

// ==================== WORLD ====================
class EnhancedWorld {
    constructor(worldType = 'forest') {
        this.worldType = worldType;
        this.resources = [];
        this.buildings = [];
        this.currentDay = 1;
        this.timeOfDay = 8;
        this.gameTime = 0;
        this.currentWeather = 'clear';
        this.weatherTypes = this.getWeatherTypes();
        this.weatherDuration = 0;
        this.generateResources();
    }

    getWeatherTypes() {
        switch (this.worldType) {
            case 'desert':
                return ['clear', 'sandstorm', 'hot'];
            case 'mountain':
                return ['clear', 'snow', 'storm', 'fog'];
            case 'island':
                return ['clear', 'rain', 'hurricane', 'sunny'];
            default: // forest
                return ['clear', 'rain', 'storm'];
        }
    }

    generateResources() {
        let resourceTypes = [];
        
        switch (this.worldType) {
            case 'forest':
                resourceTypes = [
                    { type: 'tree', icon: '🌲', color: '#228B22', size: 35, harvestable: true, yields: { wood: 4, berries: 1 } },
                    { type: 'stone', icon: '🪨', color: '#696969', size: 28, harvestable: true, yields: { stone: 3 } },
                    { type: 'berries', icon: '🫐', color: '#4B0082', size: 22, harvestable: true, yields: { berries: 3 } },
                    { type: 'water', icon: '💧', color: '#4682B4', size: 40, harvestable: true, yields: { water: 6 } },
                    { type: 'mushrooms', icon: '🍄', color: '#8B4513', size: 25, harvestable: true, yields: { mushrooms: 2 } }
                ];
                break;
                
            case 'mountain':
                resourceTypes = [
                    { type: 'pine_tree', icon: '🌲', color: '#0F4C0F', size: 30, harvestable: true, yields: { wood: 2 } },
                    { type: 'iron_ore', icon: '⛏️', color: '#8B7355', size: 32, harvestable: true, yields: { iron: 2, stone: 1 } },
                    { type: 'stone', icon: '🪨', color: '#696969', size: 28, harvestable: true, yields: { stone: 5 } },
                    { type: 'mountain_water', icon: '💧', color: '#B0E0E6', size: 35, harvestable: true, yields: { water: 4 } },
                    { type: 'herbs', icon: '🌿', color: '#90EE90', size: 20, harvestable: true, yields: { herbs: 1 } }
                ];
                break;
                
            case 'desert':
                resourceTypes = [
                    { type: 'cactus', icon: '🌵', color: '#228B22', size: 30, harvestable: true, yields: { water: 2, cactus_fruit: 1 } },
                    { type: 'sand_stone', icon: '🪨', color: '#F4A460', size: 25, harvestable: true, yields: { stone: 2 } },
                    { type: 'oasis', icon: '🏝️', color: '#4682B4', size: 50, harvestable: true, yields: { water: 8 } },
                    { type: 'desert_plant', icon: '🪴', color: '#8FBC8F', size: 18, harvestable: true, yields: { fiber: 2 } },
                    { type: 'bones', icon: '🦴', color: '#F5F5DC', size: 22, harvestable: true, yields: { bone: 1 } }
                ];
                break;
                
            case 'island':
                resourceTypes = [
                    { type: 'palm_tree', icon: '�', color: '#228B22', size: 40, harvestable: true, yields: { wood: 3, coconut: 2 } },
                    { type: 'coral', icon: '🪸', color: '#FF7F50', size: 25, harvestable: true, yields: { coral: 1 } },
                    { type: 'seaweed', icon: '🌊', color: '#2E8B57', size: 20, harvestable: true, yields: { seaweed: 3 } },
                    { type: 'fresh_water', icon: '💧', color: '#00BFFF', size: 35, harvestable: true, yields: { water: 5 } },
                    { type: 'fish', icon: '🐟', color: '#4169E1', size: 28, harvestable: true, yields: { fish: 2 } }
                ];
                break;
        }

        const resourceCount = this.worldType === 'desert' ? 120 : 150; // Desert has fewer resources
        
        for (let i = 0; i < resourceCount; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            this.resources.push({
                id: `res_${i}`,
                ...resourceType,
                x: 100 + Math.random() * (GAME_CONFIG.WORLD_WIDTH - 200),
                y: 100 + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 200),
                harvested: false,
                respawnTime: Utils.randomFloat(45000, 120000)
            });
        }
    }

    update(deltaTime, player) {
        this.gameTime += deltaTime;
        this.timeOfDay = 8 + (this.gameTime / 1000) * (16 / (GAME_CONFIG.DAY_DURATION / 1000));
        
        if (this.timeOfDay >= 24) {
            this.currentDay++;
            this.timeOfDay = 8;
            this.gameTime = 0;
        }

        // World-specific weather system
        this.weatherDuration += deltaTime;
        if (this.weatherDuration > 120000) { // 2 minutter
            this.currentWeather = this.weatherTypes[Math.floor(Math.random() * this.weatherTypes.length)];
            this.weatherDuration = 0;
        }

        // World-specific weather effects
        if (player) {
            const seconds = deltaTime / 1000;
            this.applyWeatherEffects(player, seconds);
        }

        // Respawn ressurser
        this.resources.forEach(resource => {
            if (resource.harvested && Date.now() - resource.harvestedAt > resource.respawnTime) {
                resource.harvested = false;
                delete resource.harvestedAt;
            }
        });
    }

    applyWeatherEffects(player, seconds) {
        switch (this.worldType) {
            case 'forest':
                if (this.currentWeather === 'rain') {
                    player.warmth = Math.max(0, player.warmth - (0.5 * seconds));
                    player.thirst = Math.max(0, player.thirst - (0.2 * seconds));
                } else if (this.currentWeather === 'storm') {
                    player.warmth = Math.max(0, player.warmth - (1.0 * seconds));
                    player.energy = Math.max(0, player.energy - (0.3 * seconds));
                }
                break;
                
            case 'desert':
                if (this.currentWeather === 'hot' || this.currentWeather === 'clear') {
                    player.thirst = Math.max(0, player.thirst - (0.8 * seconds));
                    player.energy = Math.max(0, player.energy - (0.4 * seconds));
                } else if (this.currentWeather === 'sandstorm') {
                    player.health = Math.max(0, player.health - (0.2 * seconds));
                    player.energy = Math.max(0, player.energy - (0.6 * seconds));
                }
                break;
                
            case 'mountain':
                if (this.currentWeather === 'snow' || this.currentWeather === 'storm') {
                    player.warmth = Math.max(0, player.warmth - (1.2 * seconds));
                    player.energy = Math.max(0, player.energy - (0.5 * seconds));
                } else if (this.currentWeather === 'fog') {
                    player.energy = Math.max(0, player.energy - (0.3 * seconds));
                }
                break;
                
            case 'island':
                if (this.currentWeather === 'hurricane') {
                    player.warmth = Math.max(0, player.warmth - (0.8 * seconds));
                    player.energy = Math.max(0, player.energy - (0.7 * seconds));
                } else if (this.currentWeather === 'rain') {
                    player.thirst = Math.max(0, player.thirst - (0.3 * seconds));
                }
                break;
        }
    }

    getTimeString() {
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    getDayNightAlpha() {
        if (this.timeOfDay < 6 || this.timeOfDay > 20) {
            return 0.7;
        } else if (this.timeOfDay < 8 || this.timeOfDay > 18) {
            return 0.3;
        }
        return 0;
    }

    getResourcesNear(x, y, distance) {
        return this.resources.filter(resource => {
            if (resource.harvested) return false;
            return Utils.distance(resource.x, resource.y, x, y) <= distance;
        });
    }

    harvestResource(resource, player) {
        if (resource.harvested || !resource.harvestable) return null;

        resource.harvested = true;
        resource.harvestedAt = Date.now();

        const multiplier = player.getHarvestMultiplier();
        const yields = {};

        for (const [itemType, baseAmount] of Object.entries(resource.yields)) {
            yields[itemType] = Math.ceil(baseAmount * multiplier);
            player.inventory.addItem(itemType, yields[itemType]);
        }

        player.addExperience(10);
        return yields;
    }

    render(ctx) {
        // World-specific background
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.WORLD_HEIGHT);
        const nightAlpha = this.getDayNightAlpha();
        
        switch (this.worldType) {
            case 'desert':
                gradient.addColorStop(0, '#FFD700');
                gradient.addColorStop(0.7, '#F4A460');
                gradient.addColorStop(1, '#DEB887');
                break;
            case 'mountain':
                gradient.addColorStop(0, '#708090');
                gradient.addColorStop(0.7, '#2F4F4F');
                gradient.addColorStop(1, '#696969');
                break;
            case 'island':
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#20B2AA');
                gradient.addColorStop(1, '#008B8B');
                break;
            default: // forest
                gradient.addColorStop(0, '#87CEEB');
                gradient.addColorStop(0.7, '#90EE90');
                gradient.addColorStop(1, '#228B22');
        }
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        if (nightAlpha > 0) {
            ctx.fillStyle = `rgba(0, 0, 50, ${nightAlpha})`;
            ctx.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);
        }

        // Bakgrunnselementer
        ctx.fillStyle = this.getBackgroundElementColor();
        for (let i = 0; i < 50; i++) {
            const x = (i * 120) % GAME_CONFIG.WORLD_WIDTH;
            const y = (Math.floor(i / 25) * 150) % GAME_CONFIG.WORLD_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, Utils.randomFloat(30, 50), 0, Math.PI * 2);
            ctx.fill();
        }

        // Ressurser
        this.resources.forEach(resource => {
            if (resource.harvested) return;

            ctx.save();

            ctx.fillStyle = resource.color;
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(resource.x, resource.y, resource.size/2, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
            
            ctx.font = `${resource.size}px Arial`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText(resource.icon, resource.x, resource.y);

            ctx.restore();
        });

        // World-specific weather effects
        this.renderWeatherEffects(ctx);
    }

    getBackgroundElementColor() {
        switch (this.worldType) {
            case 'desert': return 'rgba(255, 215, 0, 0.2)';
            case 'mountain': return 'rgba(128, 128, 128, 0.3)';
            case 'island': return 'rgba(32, 178, 170, 0.2)';
            default: return 'rgba(34, 139, 34, 0.4)';
        }
    }

    renderWeatherEffects(ctx) {
        switch (this.currentWeather) {
            case 'rain':
                ctx.strokeStyle = 'rgba(173, 216, 230, 0.6)';
                ctx.lineWidth = 1;
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
                    const y = (Date.now() * 0.1 + i * 50) % GAME_CONFIG.WORLD_HEIGHT;
                    ctx.beginPath();
                    ctx.moveTo(x, y);
                    ctx.lineTo(x, y + 10);
                    ctx.stroke();
                }
                break;
                
            case 'snow':
                ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
                for (let i = 0; i < 100; i++) {
                    const x = Math.random() * GAME_CONFIG.WORLD_WIDTH;
                    const y = (Date.now() * 0.05 + i * 80) % GAME_CONFIG.WORLD_HEIGHT;
                    ctx.beginPath();
                    ctx.arc(x, y, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
                
            case 'sandstorm':
                ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
                for (let i = 0; i < 200; i++) {
                    const x = (Math.random() * GAME_CONFIG.WORLD_WIDTH + Date.now() * 0.1) % GAME_CONFIG.WORLD_WIDTH;
                    const y = Math.random() * GAME_CONFIG.WORLD_HEIGHT;
                    ctx.beginPath();
                    ctx.arc(x, y, 1, 0, Math.PI * 2);
                    ctx.fill();
                }
                break;
        }
    }

    serialize() {
        return {
            worldType: this.worldType,
            currentDay: this.currentDay,
            timeOfDay: this.timeOfDay,
            gameTime: this.gameTime,
            currentWeather: this.currentWeather,
            weatherDuration: this.weatherDuration,
            buildings: this.buildings
        };
    }

    deserialize(data) {
        this.worldType = data.worldType || 'forest';
        this.currentDay = data.currentDay || 1;
        this.timeOfDay = data.timeOfDay || 8;
        this.gameTime = data.gameTime || 0;
        this.currentWeather = data.currentWeather || 'clear';
        this.weatherDuration = data.weatherDuration || 0;
        this.buildings = data.buildings || [];
        
        // Regenerate resources for new world type
        if (this.worldType !== 'forest') {
            this.resources = [];
            this.weatherTypes = this.getWeatherTypes();
            this.generateResources();
        }
    }
}

// ==================== HOVEDSPILLKLASSE ====================
class CompleteGame {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu';
        this.lastTime = 0;
        this.showInventory = false;
        this.showCrafting = false;
        this.showMathChallenge = false;
        this.selectedCraftingCategory = 'tools';
        
        this.notifications = new NotificationSystem();
        this.crafting = new CraftingSystem();
        this.audio = new AudioSystem();
        this.mathChallenges = new MathChallengeSystem();
        this.multiplayer = new MultiplayerSystem();
        this.mobileOptimizer = new MobileOptimizer();
        this.worldSelection = new WorldSelectionSystem();
        
        // Initialize multiplayer client
        this.multiplayerClient = null;
        this.isMultiplayerMode = false;
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.setupPWA();
        
        // Fjern loading screen når spillet er klart
        this.hideLoadingScreen();
        
        this.gameLoop();
        
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    setupPWA() {
        // Only register service worker if we're not on file:// protocol (local testing)
        if ('serviceWorker' in navigator && window.location.protocol !== 'file:') {
            navigator.serviceWorker.register('./sw.js')
                .then((registration) => {
                    console.log('Service Worker registered:', registration);
                })
                .catch((error) => {
                    console.log('Service Worker registration failed:', error);
                });
        } else if (window.location.protocol === 'file:') {
            console.log('PWA features disabled for local file testing. Deploy to server for full PWA functionality.');
        }

        // Handle PWA install prompt (only works on HTTPS/deployed sites)
        if (window.location.protocol !== 'file:') {
            window.addEventListener('beforeinstallprompt', (e) => {
                e.preventDefault();
                this.deferredPrompt = e;
                this.showInstallButton();
            });
        }
    }

    showInstallButton() {
        // Add install button to main menu
        const installBtn = document.createElement('button');
        installBtn.className = 'menu-button';
        installBtn.innerHTML = '📱 Installer App';
        installBtn.onclick = () => this.installPWA();
        
        const menu = document.getElementById('gameMenu');
        if (menu) {
            menu.appendChild(installBtn);
        }
    }

    installPWA() {
        if (this.deferredPrompt) {
            this.deferredPrompt.prompt();
            this.deferredPrompt.userChoice.then((choiceResult) => {
                if (choiceResult.outcome === 'accepted') {
                    console.log('User accepted the install prompt');
                }
                this.deferredPrompt = null;
            });
        }
    }

    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loadingScreen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    setupEventListeners() {
        document.addEventListener('keydown', (e) => this.handleKeyDown(e));
        document.addEventListener('keyup', (e) => this.handleKeyUp(e));
        this.setupMobileControls();
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
            
            if (['w', 's', 'a', 'd', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) {
                this.player.inputKeys[key] = true;
                e.preventDefault();
            }
            
            if (key === 'escape') {
                if (this.showInventory || this.showCrafting) {
                    this.showInventory = false;
                    this.showCrafting = false;
                } else {
                    this.togglePauseMenu();
                }
            }
            
            if (key === 'e') this.collectNearbyResources();
            if (key === 'i') this.toggleInventory();
            if (key === 'c') this.toggleCrafting();
            if (key === '1') this.consumeItem('berries');
            if (key === '2') this.consumeItem('water');
            if (key === '3') this.consumeItem('mushrooms');
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
            // Check if we should trigger a math challenge
            if (this.mathChallenges.shouldTriggerChallenge()) {
                this.showMathChallengeModal();
                return;
            }

            const resource = nearbyResources[0];
            const yields = this.world.harvestResource(resource, this.player);
            if (yields) {
                this.audio.playCollectSound();
                const itemList = Object.entries(yields).map(([k,v]) => `${v} ${k}`).join(', ');
                this.notifications.show(`Samlet: ${itemList}`, 'success');
                
                // Bonus for good math performance
                if (this.mathChallenges.getSuccessRate() > 80) {
                    this.player.addExperience(5);
                    this.notifications.show(`Matte-bonus: +5 EXP!`, 'success');
                }
            }
        } else {
            this.notifications.show('Ingen ressurser i nærheten', 'warning');
        }
    }

    showMathChallengeModal() {
        const challenge = this.mathChallenges.generateChallenge();
        this.showMathChallenge = true;
        
        // Create backdrop overlay
        const backdrop = document.createElement('div');
        backdrop.id = 'mathChallengeBackdrop';
        backdrop.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            bottom: 0;
            background: rgba(0, 0, 0, 0.95);
            z-index: 14000;
        `;
        document.body.appendChild(backdrop);
        
        // Create math challenge UI
        const modal = document.createElement('div');
        modal.id = 'mathChallengeModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid #4a90e2;
            border-radius: 20px;
            padding: 30px;
            z-index: 15000;
            text-align: center;
            color: white;
            min-width: 300px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `; 'mathChallengeModal';
        modal.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 26, 46, 0.95);
            backdrop-filter: blur(20px);
            border: 2px solid #4a90e2;
            border-radius: 20px;
            padding: 30px;
            z-index: 10000;
            text-align: center;
            color: white;
            min-width: 300px;
            box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
        `;

        modal.innerHTML = `
            <h2 style="color: #4a90e2; margin-bottom: 20px;">🧮 Matte-utfordring!</h2>
            <p style="font-size: 24px; margin: 20px 0; font-weight: bold;">${challenge.question}</p>
            <div style="margin: 20px 0;">
                ${challenge.options.map((option, index) => 
                    `<button onclick="window.game.answerMathChallenge(${option})" 
                     style="display: block; width: 100%; margin: 10px 0; padding: 15px; 
                            background: linear-gradient(135deg, #4a90e2, #357abd); 
                            color: white; border: none; border-radius: 10px; 
                            font-size: 18px; cursor: pointer;">
                     ${option}
                     </button>`
                ).join('')}
            </div>
            <p style="font-size: 12px; color: #ccc;">
                Riktig svar gir bonus ressurser! 🎁<br>
                Suksessrate: ${this.mathChallenges.getSuccessRate().toFixed(1)}%
            </p>
        `;

        document.body.appendChild(modal);

        // Auto-close after time limit
        setTimeout(() => {
            if (document.getElementById('mathChallengeModal')) {
                this.answerMathChallenge(null); // Wrong answer
            }
        }, challenge.timeLimit);
    }

    answerMathChallenge(selectedAnswer) {
        const modal = document.getElementById('mathChallengeModal');
        const backdrop = document.getElementById('mathChallengeBackdrop');
        if (modal) {
            modal.remove();
        }
        if (backdrop) {
            backdrop.remove();
        }

        this.showMathChallenge = false;

        if (!this.mathChallenges.currentChallenge) return;

        const correct = this.mathChallenges.checkAnswer(selectedAnswer);
        
        if (correct) {
            this.notifications.show('🎉 Riktig! Bonus ressurser!', 'success');
            this.audio.playCraftSound();
            
            // Give bonus resources
            this.player.inventory.addItem('wood', 2);
            this.player.inventory.addItem('stone', 1);
            this.player.addExperience(15);
            
            // Now collect the actual resource
            this.collectResourceAfterMath();
        } else {
            this.notifications.show('❌ Feil svar. Prøv igjen neste gang!', 'error');
            this.audio.playErrorSound();
            
            // Still collect resource but no bonus
            this.collectResourceAfterMath();
        }
    }

    collectResourceAfterMath() {
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
        }
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
        const panel = document.getElementById('inventoryPanel');
        if (panel) {
            panel.style.display = this.showInventory ? 'block' : 'none';
        }
        if (this.showInventory) {
            this.showCrafting = false;
            const craftingPanel = document.getElementById('craftingPanel');
            if (craftingPanel) {
                craftingPanel.style.display = 'none';
            }
            this.updateInventoryDisplay();
        }
    }

    toggleCrafting() {
        this.showCrafting = !this.showCrafting;
        const panel = document.getElementById('craftingPanel');
        if (panel) {
            panel.style.display = this.showCrafting ? 'block' : 'none';
        }
        if (this.showCrafting) {
            this.showInventory = false;
            const inventoryPanel = document.getElementById('inventoryPanel');
            if (inventoryPanel) {
                inventoryPanel.style.display = 'none';
            }
            this.updateCraftingDisplay();
        }
    }

    updateInventoryDisplay() {
        if (!this.player) return;
        
        const grid = document.getElementById('inventoryGrid');
        if (!grid) return;
        
        const items = this.player.inventory.getAllItems();
        grid.innerHTML = '';
        
        // Add existing items
        for (const [itemType, amount] of Object.entries(items)) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.onclick = () => this.useInventoryItem(itemType);
            
            const icon = this.getItemIcon(itemType);
            slot.innerHTML = `
                <div class="inventory-item-icon">${icon}</div>
                <div class="inventory-item-count">${amount}</div>
            `;
            grid.appendChild(slot);
        }
        
        // Add empty slots
        const totalSlots = this.player.inventory.maxSlots;
        const usedSlots = Object.keys(items).length;
        for (let i = usedSlots; i < totalSlots; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.style.opacity = '0.3';
            grid.appendChild(slot);
        }
    }

    updateCraftingDisplay() {
        if (!this.player) return;
        
        const container = document.getElementById('craftingRecipes');
        if (!container) return;
        
        container.innerHTML = '';
        
        for (const [recipeId, recipe] of Object.entries(this.crafting.recipes)) {
            const canCraft = this.crafting.canCraft(recipeId, this.player.inventory);
            
            const recipeDiv = document.createElement('div');
            recipeDiv.className = 'craft-recipe';
            recipeDiv.style.opacity = canCraft ? '1' : '0.5';
            
            let materialsText = '';
            for (const [material, amount] of Object.entries(recipe.materials)) {
                const hasAmount = this.player.inventory.getItemCount(material);
                const icon = this.getItemIcon(material);
                materialsText += `<div style="margin: 2px 0;">${icon} ${material}: ${hasAmount}/${amount}</div>`;
            }
            
            recipeDiv.innerHTML = `
                <h4 style="color: ${canCraft ? '#4CAF50' : '#999'};">${recipe.name}</h4>
                <p style="font-size: 12px; color: #ccc; margin: 5px 0;">${recipe.description}</p>
                <div style="font-size: 11px;">${materialsText}</div>
                ${canCraft ? '<button class="menu-button" style="width: 100%; margin-top: 10px; padding: 8px;" onclick="window.game.craftItem(\'' + recipeId + '\')">Craft</button>' : ''}
            `;
            
            container.appendChild(recipeDiv);
        }
    }

    getItemIcon(itemType) {
        const icons = {
            // Basic resources
            'wood': '🪵',
            'stone': '🪨',
            'berries': '🫐',
            'water': '💧',
            'mushrooms': '🍄',
            
            // Mountain resources
            'iron': '⚙️',
            'herbs': '🌿',
            
            // Desert resources
            'cactus_fruit': '🍎',
            'fiber': '🧵',
            'bone': '🦴',
            
            // Island resources
            'coconut': '🥥',
            'coral': '🪸',
            'seaweed': '🌊',
            'fish': '🐟',
            
            // Tools
            'axe': '🪓',
            'pickaxe': '⛏️',
            
            // Buildings
            'shelter': '🏠',
            'fire': '🔥',
            'water_collector': '🪣'
        };
        return icons[itemType] || '📦';
    }

    useInventoryItem(itemType) {
        // Consumable items
        if (['berries', 'water', 'mushrooms', 'cactus_fruit', 'coconut', 'fish', 'herbs'].includes(itemType)) {
            this.consumeItem(itemType);
        } else {
            this.notifications.show(`${itemType} kan ikke brukes direkte`, 'info');
        }
    }

    craftItem(recipeId) {
        if (this.crafting.craft(recipeId, this.player.inventory)) {
            this.audio.playCraftSound();
            this.notifications.show(`Laget ${this.crafting.recipes[recipeId].name}!`, 'success');
            this.updateCraftingDisplay();
            this.player.addExperience(20);
        } else {
            this.notifications.show('Ikke nok materialer', 'error');
            this.audio.playErrorSound();
        }
    }

    startNewGame() {
        this.gameState = 'playing';
        const selectedWorld = this.worldSelection.getSelectedWorld();
        this.world = new EnhancedWorld(selectedWorld);
        this.player = new Player(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2);
        this.gameStartTime = Date.now();
        
        document.getElementById('gameMenu').classList.add('hidden');
        document.getElementById('gameUI').style.display = 'block';
        
        // Show permanent time display
        const permanentTimeDisplay = document.getElementById('permanentTimeDisplay');
        if (permanentTimeDisplay) {
            permanentTimeDisplay.style.display = 'block';
        }
        
        // Always show mobile controls now
        const mobileControls = document.getElementById('mobileControls');
        if (mobileControls) {
            mobileControls.style.display = 'flex';
        }

        // Show mobile keyboard on mobile devices
        if (this.mobileOptimizer.isMobile) {
            const mobileKeyboard = document.getElementById('mobileKeyboard');
            if (mobileKeyboard) {
                mobileKeyboard.style.display = 'flex';
            }
            
            // Show mobile help on first time
            if (!localStorage.getItem('mobileHelpShown')) {
                setTimeout(() => {
                    this.showMobileHelp();
                }, 2000);
                localStorage.setItem('mobileHelpShown', 'true');
            }
            
            this.mobileOptimizer.showMobileTooltip('🎮 Velkommen! Bruk joystick for å bevege deg!', 5000);
        }
        
        const worldConfig = this.worldSelection.getWorldConfig(selectedWorld);
        this.notifications.show(`Velkommen til ${worldConfig.name}! Overlev så lenge som mulig!`, 'info', 6000);
        
        // Show math challenge info
        setTimeout(() => {
            this.notifications.show('🧮 Løs matteoppgaver under ressurssamling for bonuser!', 'info', 4000);
        }, 3000);
    }

    showWorldSelection() {
        const unlockedWorlds = this.worldSelection.getUnlockedWorlds();
        
        let worldHTML = '<h1>🌍 Velg Verden</h1><div style="text-align: left; max-height: 400px; overflow-y: auto;">';
        
        for (const world of unlockedWorlds) {
            const isSelected = world.id === this.worldSelection.getSelectedWorld();
            const bestDays = world.bestDays || 0;
            
            worldHTML += `
                <div style="
                    background: ${isSelected ? 'linear-gradient(135deg, #4a90e2, #357abd)' : 'rgba(255,255,255,0.1)'};
                    border: 2px solid ${isSelected ? '#4a90e2' : '#555'};
                    border-radius: 15px;
                    padding: 15px;
                    margin: 10px 0;
                    cursor: pointer;
                    transition: all 0.3s ease;
                " onclick="window.game.selectWorld('${world.id}')">
                    <h3 style="margin: 0 0 10px 0; color: ${isSelected ? '#fff' : '#4a90e2'};">${world.name}</h3>
                    <p style="margin: 5px 0; color: #ccc; font-size: 14px;">${world.description}</p>
                    <div style="display: flex; justify-content: space-between; margin: 10px 0; font-size: 12px;">
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 10px;">
                            Vanskelighet: ${world.difficulty}
                        </span>
                        <span style="background: rgba(255,255,255,0.2); padding: 4px 8px; border-radius: 10px;">
                            Best: ${bestDays} dager
                        </span>
                    </div>
                    <div style="margin: 10px 0;">
                        ${world.features.map(feature => `<span style="background: rgba(74,144,226,0.3); padding: 2px 6px; border-radius: 8px; margin: 2px; display: inline-block; font-size: 11px;">${feature}</span>`).join('')}
                    </div>
                </div>
            `;
        }
        
        // Show locked worlds
        for (const [worldId, world] of Object.entries(this.worldSelection.worlds)) {
            if (!world.unlocked) {
                worldHTML += `
                    <div style="
                        background: rgba(100,100,100,0.3);
                        border: 2px solid #666;
                        border-radius: 15px;
                        padding: 15px;
                        margin: 10px 0;
                        opacity: 0.6;
                    ">
                        <h3 style="margin: 0 0 10px 0; color: #999;">🔒 ${world.name}</h3>
                        <p style="margin: 5px 0; color: #888; font-size: 14px;">${world.description}</p>
                        <div style="margin: 10px 0; font-size: 12px; color: #999;">
                            <strong>Låst:</strong> ${world.unlockRequirement}
                        </div>
                    </div>
                `;
            }
        }
        
        worldHTML += '</div>';
        worldHTML += '<button class="menu-button" onclick="window.game.startNewGame()" style="margin: 10px 0;">🎮 Start Spill</button>';
        worldHTML += '<button class="menu-button" onclick="window.game.exitToMainMenu()">↩️ Tilbake</button>';
        
        document.getElementById('gameMenu').innerHTML = worldHTML;
    }

    selectWorld(worldId) {
        if (this.worldSelection.selectWorld(worldId)) {
            this.showWorldSelection(); // Refresh display
        }
    }

    saveGame() {
        if (!this.player || !this.world) {
            this.notifications.show('Ingen spill å lagre', 'error');
            return;
        }

        const gameData = {
            player: this.player.serialize(),
            world: this.world.serialize(),
            mathChallenges: this.mathChallenges.serialize(),
            selectedWorld: this.worldSelection.getSelectedWorld(),
            gameState: {
                currentDay: this.world.currentDay,
                totalPlayTime: Date.now() - (this.gameStartTime || Date.now())
            }
        };

        if (SaveSystem.save(gameData)) {
            this.notifications.show('Spill lagret!', 'success');
            this.audio.playCraftSound();
            
            // Show mobile success feedback
            if (this.mobileOptimizer.isMobile) {
                this.mobileOptimizer.showMobileTooltip('✅ Spill lagret!');
            }
        } else {
            this.notifications.show('Kunne ikke lagre spill', 'error');
            this.audio.playErrorSound();
        }
    }

    loadGame() {
        const saveData = SaveSystem.load();
        if (!saveData) {
            this.notifications.show('Ingen lagret spill funnet', 'error');
            return false;
        }

        try {
            // Set world selection first
            if (saveData.selectedWorld) {
                this.worldSelection.selectWorld(saveData.selectedWorld);
            }
            
            this.world = new EnhancedWorld(saveData.selectedWorld || 'forest');
            this.player = new Player(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2);

            this.player.deserialize(saveData.player);
            this.world.deserialize(saveData.world);
            
            if (saveData.mathChallenges) {
                this.mathChallenges.deserialize(saveData.mathChallenges);
            }

            this.gameState = 'playing';
            this.gameStartTime = Date.now() - (saveData.gameState?.totalPlayTime || 0);

            document.getElementById('gameMenu').classList.add('hidden');
            document.getElementById('gameUI').style.display = 'block';

            // Show permanent time display
            const permanentTimeDisplay = document.getElementById('permanentTimeDisplay');
            if (permanentTimeDisplay) {
                permanentTimeDisplay.style.display = 'block';
            }

            // Show mobile controls and keyboard
            if (this.mobileOptimizer.isMobile) {
                const mobileControls = document.getElementById('mobileControls');
                const mobileKeyboard = document.getElementById('mobileKeyboard');
                if (mobileControls) mobileControls.style.display = 'flex';
                if (mobileKeyboard) mobileKeyboard.style.display = 'flex';
                
                this.mobileOptimizer.showMobileTooltip('📱 Bruk touch-kontroller for å spille!', 4000);
            }

            const worldConfig = this.worldSelection.getWorldConfig(this.world.worldType);
            this.notifications.show(`Spill lastet inn! Velkommen tilbake til ${worldConfig.name}`, 'success');
            return true;
        } catch (error) {
            this.notifications.show('Feil ved lasting av spill', 'error');
            return false;
        }
    }

    togglePauseMenu() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('gameMenu').classList.remove('hidden');
            
            // Show mobile guide button only on mobile
            const mobileGuideButton = window.innerWidth <= 768 ? 
                '<button class="menu-button" onclick="window.game.showMobileGuide()">📱 Vis Mobil Guide</button>' : '';
            
            document.getElementById('gameMenu').innerHTML = `
                <h1>⏸️ Pause</h1>
                <button class="menu-button" onclick="window.game.resumeGame()">▶️ Fortsett</button>
                <button class="menu-button" onclick="window.game.saveGame()">💾 Lagre Spill</button>
                ${mobileGuideButton}
                <button class="menu-button" onclick="window.game.showSettings()">⚙️ Innstillinger</button>
                <button class="menu-button" onclick="window.game.exitToMainMenu()">🏠 Hovedmeny</button>
            `;
        }
    }

    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('gameMenu').classList.add('hidden');
    }

    showSettings() {
        document.getElementById('gameMenu').innerHTML = `
            <h1>⚙️ Innstillinger</h1>
            <div style="text-align: left; margin: 20px;">
                <p>🔊 Lyd: <button onclick="window.game.toggleAudio()">${this.audio.enabled ? 'PÅ' : 'AV'}</button></p>
                <p>🎮 Kontroller: ${window.innerWidth <= 768 ? 'Touch' : 'Tastatur'}</p>
                <p>💾 Lagret spill: ${SaveSystem.hasSave() ? 'Ja' : 'Nei'}</p>
                <p>📊 Versjon: ${GAME_CONFIG.VERSION}</p>
            </div>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">↩️ Tilbake</button>
            <button class="menu-button" onclick="window.game.resetProgress()" style="background: #f44336;">🗑️ Slett Alt</button>
        `;
    }

    toggleAudio() {
        this.audio.toggle();
        this.showSettings();
        this.notifications.show(`Lyd ${this.audio.enabled ? 'på' : 'av'}`, 'info');
    }

    resetProgress() {
        if (confirm('Er du sikker på at du vil slette all spillfremdrift?')) {
            SaveSystem.deleteSave();
            this.notifications.show('All fremdrift slettet', 'warning');
            this.exitToMainMenu();
        }
    }

    exitToMainMenu() {
        this.gameState = 'menu';
        
        // Disconnect from multiplayer if connected
        if (this.multiplayerClient) {
            this.multiplayerClient.disconnect();
            this.multiplayerClient = null;
            this.isMultiplayerMode = false;
        }
        
        // Check for world unlocks before leaving
        if (this.world && this.player) {
            const newUnlocks = this.worldSelection.checkUnlocks(this.world.worldType, this.world.currentDay);
            if (newUnlocks.length > 0) {
                newUnlocks.forEach(worldId => {
                    const worldConfig = this.worldSelection.getWorldConfig(worldId);
                    this.notifications.show(`🎉 Ny verden låst opp: ${worldConfig.name}!`, 'success', 5000);
                });
            }
        }
        
        this.player = null;
        this.world = null;
        this.showInventory = false;
        this.showCrafting = false;
        
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('gameMenu').classList.remove('hidden');
        
        const hasSave = SaveSystem.hasSave();
        document.getElementById('gameMenu').innerHTML = `
            <h1>🌲 Beyond 99 Days</h1>
            <p style="color: #666; font-size: 14px;">Multiverdeners overlevingsspill v${GAME_CONFIG.VERSION}</p>
            <button class="menu-button" onclick="window.game.showWorldSelection()">� Velg Verden & Start</button>
            ${hasSave ? '<button class="menu-button" onclick="window.game.loadGame()">📂 Last Inn Spill</button>' : ''}
            <button class="menu-button" onclick="window.game.showMultiplayerMenu()">🌐 Multiplayer</button>
            <button class="menu-button" onclick="window.game.showInstructions()">📖 Hvordan Spille</button>
            <button class="menu-button" onclick="window.game.showAchievements()">🏆 Prestasjoner & Verdener</button>
            <button class="menu-button" onclick="window.game.showSettings()">⚙️ Innstillinger</button>
        `;
    }

    async showMultiplayerMenu() {
        try {
            if (!this.multiplayerClient) {
                // Load the multiplayer client
                const script = document.createElement('script');
                script.src = './multiplayer-client.js';
                document.head.appendChild(script);
                
                await new Promise((resolve, reject) => {
                    script.onload = resolve;
                    script.onerror = reject;
                });
                
                this.multiplayerClient = new MultiplayerClient(this);
            }
            
            if (!this.multiplayerClient.isConnected) {
                this.showConnectingDialog();
                await this.multiplayerClient.connect();
            }
            
            this.multiplayerClient.showMultiplayerMenu();
            
        } catch (error) {
            console.error('Failed to initialize multiplayer:', error);
            this.notifications.show('Could not connect to multiplayer server', 'error');
            this.showOfflineMultiplayerMenu();
        }
    }

    showConnectingDialog() {
        document.getElementById('gameMenu').innerHTML = `
            <h1>🌐 Connecting...</h1>
            <div style="text-align: center; margin: 40px 0;">
                <div class="loading-spinner" style="width: 40px; height: 40px; margin: 0 auto 20px;"></div>
                <p>Connecting to multiplayer server...</p>
            </div>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">⬅️ Cancel</button>
        `;
    }

    showOfflineMultiplayerMenu() {
        document.getElementById('gameMenu').innerHTML = `
            <h1>🌐 Multiplayer (Offline)</h1>
            <div style="background: rgba(255,87,34,0.2); padding: 20px; border-radius: 10px; margin: 20px 0;">
                <h3 style="color: #FF5722;">⚠️ Server not available</h3>
                <p style="font-size: 14px; margin: 10px 0;">
                    Multiplayer server is currently unavailable. This could be because:
                </p>
                <ul style="text-align: left; font-size: 12px; color: #ccc;">
                    <li>You're running the game locally</li>
                    <li>The server is not deployed yet</li>
                    <li>Network connection issues</li>
                </ul>
            </div>
            <div style="background: rgba(74,144,226,0.2); padding: 15px; border-radius: 10px; margin: 20px 0;">
                <h4 style="color: #4a90e2;">🚀 To enable multiplayer:</h4>
                <p style="font-size: 12px; text-align: left;">
                    1. Deploy to Vercel: <code>vercel --prod</code><br>
                    2. Or run locally: <code>npm run dev</code><br>
                    3. Make sure the server is running
                </p>
            </div>
            <button class="menu-button" onclick="window.game.showMultiplayerMenu()">🔄 Try Again</button>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">⬅️ Back to Main Menu</button>
        `;
    }

    showInstructions() {
        document.getElementById('gameMenu').innerHTML = `
            <h1>📖 Hvordan Spille</h1>
            <div style="text-align: left; font-size: 14px; max-height: 400px; overflow-y: auto;">
                <h3>🎯 Mål:</h3>
                <p>Overlev i 99 dager i villmarken ved å samle ressurser og holde deg i live.</p>
                
                <h3>🎮 PC Kontroller:</h3>
                <p><strong>WASD/Piltaster</strong> - Bevegelse</p>
                <p><strong>E</strong> - Saml ressurser i nærheten</p>
                <p><strong>I</strong> - Åpne/lukk inventar</p>
                <p><strong>C</strong> - Åpne/lukk crafting</p>
                <p><strong>ESC</strong> - Pause</p>
                <p><strong>1/2/3</strong> - Spis/drikk items</p>
                
                <h3>📱 Mobil/Touch Kontroller:</h3>
                <p><strong>🕹️ Virtual Joystick</strong> - Bevegelse (dra joystick)</p>
                <p><strong>📦 knapp</strong> - Saml ressurser</p>
                <p><strong>🎒 knapp</strong> - Inventar</p>
                <p><strong>🔨 knapp</strong> - Crafting</p>
                <p><strong>⏸️ knapp</strong> - Pause</p>
                <p><strong>1/2/3/💾 knapper</strong> - Hurtighandlinger</p>
                
                <h3>🌍 Slik samler du ressurser:</h3>
                <p>1. Gå nær en ressurs (🌲 tre, 🪨 stein, 🫐 bær, 💧 vann, 🍄 sopp)</p>
                <p>2. Du vil se en gul sirkel rundt spilleren</p>
                <p>3. Trykk <strong>E</strong> (PC) eller <strong>📦</strong> (mobil)</p>
                <p>4. Ressursene legges automatisk i inventaret ditt</p>
                
                <h3>🧮 Matte-utfordringer:</h3>
                <p>• Når du samler ressurser kan det dukke opp matematikkoppgaver</p>
                <p>• Riktig svar gir bonus ressurser og erfaring</p>
                <p>• Feil svar = ingen bonus, men du får fortsatt ressursene</p>
                <p>• Vanskelighetsgrad øker med din suksessrate</p>
                
                <h3>🎒 Inventar & Crafting:</h3>
                <p>• Åpne inventar for å se dine items</p>
                <p>• Trykk på items i inventar for å bruke dem</p>
                <p>• Åpne crafting for å lage verktøy og bygninger</p>
                <p>• Treng nok materialer for å kunne crafte</p>
                
                <h3>📊 Hold øye med:</h3>
                <p>❤️ <strong>Helse</strong> - Må holdes over 0</p>
                <p>🍖 <strong>Sult</strong> - Spis bær og mat</p>
                <p>💧 <strong>Tørst</strong> - Drikk vann</p>
                <p>⚡ <strong>Energi</strong> - Hvil eller spis for å gjenopprette</p>
                <p>🔥 <strong>Varme</strong> - Bygg bål eller ly</p>
                
                <h3>🏠 Bygging:</h3>
                <p>1. Samle nok materialer (tre, stein)</p>
                <p>2. Åpne crafting menyen</p>
                <p>3. Velg hva du vil lage</p>
                <p>4. Bygninger plasseres automatisk nær deg</p>
                
                <h3>🌦️ Vær og Dag/Natt:</h3>
                <p>☀️ Dagen varer 4 minutter</p>
                <p>🌧️ Regn og storm gjør deg kaldere</p>
                <p>🏠 Ly og bål gir varme og beskyttelse</p>
            </div>
            <button class="menu-button" onclick="window.game.showMobileInstructions()">📱 Mobile Kontroller Guide</button>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">↩️ Tilbake</button>
        `;
    }

    showMobileInstructions() {
        this.showMobileHelp();
    }

    showMobileHelp() {
        const overlay = document.getElementById('mobileHelpOverlay');
        if (overlay) {
            overlay.style.display = 'flex';
        }
    }

    showMobileGuide() {
        const mobileInstructions = document.getElementById('mobileInstructions');
        if (mobileInstructions) {
            mobileInstructions.style.display = 'block';
            this.resumeGame(); // Resume game so they can see the guide while playing
        }
    }

    hideMobileHelp() {
        const overlay = document.getElementById('mobileHelpOverlay');
        if (overlay) {
            overlay.style.display = 'none';
        }
    }

    showAchievements() {
        const worlds = this.worldSelection.worlds;
        
        let achievementsHTML = '<h1>🏆 Prestasjoner & Verdener</h1>';
        achievementsHTML += '<div style="text-align: left; max-height: 400px; overflow-y: auto;">';
        
        // World Progress Section
        achievementsHTML += '<h3 style="color: #4a90e2; margin: 20px 0 10px 0;">🌍 Verdens Progresjon</h3>';
        
        for (const [worldId, world] of Object.entries(worlds)) {
            const statusIcon = world.unlocked ? '✅' : '🔒';
            const bestDays = world.bestDays || 0;
            const textColor = world.unlocked ? '#4CAF50' : '#888';
            
            achievementsHTML += `
                <div style="
                    background: rgba(255,255,255,0.1);
                    border-radius: 10px;
                    padding: 10px;
                    margin: 8px 0;
                    border-left: 4px solid ${world.unlocked ? '#4CAF50' : '#888'};
                ">
                    <div style="color: ${textColor};">
                        ${statusIcon} <strong>${world.name}</strong>
                        ${world.unlocked ? ` - Best: ${bestDays} dager` : ''}
                    </div>
                    ${!world.unlocked ? `<div style="font-size: 12px; color: #888; margin-top: 5px;">Låses opp: ${world.unlockRequirement}</div>` : ''}
                </div>
            `;
        }
        
        // General Achievements Section
        achievementsHTML += '<h3 style="color: #4a90e2; margin: 20px 0 10px 0;">🎯 Generelle Prestasjoner</h3>';
        
        const generalAchievements = [
            { name: '🎯 Første dag overlevet', desc: 'Overlev din første dag' },
            { name: '🏠 Bygget ditt første ly', desc: 'Craft og bygg et ly' },
            { name: '🔥 Lagde ditt første bål', desc: 'Craft og bygg et bål' },
            { name: '🌟 Nådde level 5', desc: 'Få nok erfaring til å nå level 5' },
            { name: '🗓️ Overlevd 10 dager', desc: 'Overlev i 10 dager i samme verden' },
            { name: '⚒️ Lagde alle verktøy', desc: 'Craft øks og hakke' },
            { name: '🧮 Matte-mester', desc: 'Løs 20 matteoppgaver riktig' },
            { name: '🌍 Verdens-oppdageer', desc: 'Lås opp alle 4 verdener' },
            { name: '🏆 Overlevingsekspert', desc: 'Overlev 99 dager i hvilken som helst verden' }
        ];
        
        generalAchievements.forEach(achievement => {
            achievementsHTML += `
                <div style="
                    background: rgba(255,255,255,0.05);
                    border-radius: 8px;
                    padding: 8px;
                    margin: 5px 0;
                ">
                    <div style="color: #ccc;">${achievement.name}</div>
                    <div style="font-size: 12px; color: #888;">${achievement.desc}</div>
                </div>
            `;
        });
        
        achievementsHTML += '</div>';
        achievementsHTML += '<button class="menu-button" onclick="window.game.exitToMainMenu()">↩️ Tilbake</button>';
        
        document.getElementById('gameMenu').innerHTML = achievementsHTML;
    }

    closeInventory() {
        this.showInventory = false;
        const panel = document.getElementById('inventoryPanel');
        if (panel) panel.style.display = 'none';
    }

    closeSettings() {
        const panel = document.getElementById('settingsPanel');
        if (panel) panel.style.display = 'none';
    }

    updateUI() {
        if (this.gameState !== 'playing' || !this.player || !this.world) return;

        document.getElementById('dayCounter').textContent = this.world.currentDay;
        document.getElementById('timeDisplay').textContent = this.world.getTimeString();
        
        // Update permanent time display
        const permanentDayCounter = document.getElementById('permanentDayCounter');
        const permanentTimeDisplay = document.getElementById('permanentTimeDisplay');
        if (permanentDayCounter) permanentDayCounter.textContent = this.world.currentDay;
        if (permanentTimeDisplay) permanentTimeDisplay.textContent = this.world.getTimeString();
        
        // Update health bar and value
        const healthPercent = Math.max(0, this.player.health);
        document.getElementById('healthBar').style.width = `${healthPercent}%`;
        const healthValue = document.getElementById('healthValue');
        if (healthValue) healthValue.textContent = Math.round(healthPercent);
        
        // Update hunger bar and value
        const hungerPercent = Math.max(0, this.player.hunger);
        document.getElementById('hungerBar').style.width = `${hungerPercent}%`;
        const hungerValue = document.getElementById('hungerValue');
        if (hungerValue) hungerValue.textContent = Math.round(hungerPercent);
        
        // Update thirst bar and value
        const thirstPercent = Math.max(0, this.player.thirst);
        document.getElementById('thirstBar').style.width = `${thirstPercent}%`;
        const thirstValue = document.getElementById('thirstValue');
        if (thirstValue) thirstValue.textContent = Math.round(thirstPercent);
        
        // Update energy bar and value
        const energyPercent = Math.max(0, this.player.energy);
        document.getElementById('energyBar').style.width = `${energyPercent}%`;
        const energyValue = document.getElementById('energyValue');
        if (energyValue) energyValue.textContent = Math.round(energyPercent);
        
        // Update warmth bar and value
        const warmthPercent = Math.max(0, this.player.warmth);
        document.getElementById('warmthBar').style.width = `${warmthPercent}%`;
        const warmthValue = document.getElementById('warmthValue');
        if (warmthValue) warmthValue.textContent = Math.round(warmthPercent);

        // Update level display
        const levelDisplay = document.getElementById('playerLevel');
        if (levelDisplay) {
            levelDisplay.textContent = this.player.level;
        }

        // Update weather display if it exists
        const weatherDisplay = document.getElementById('weatherDisplay');
        if (weatherDisplay) {
            const weatherIcons = { clear: '☀️', rain: '🌧️', storm: '⛈️' };
            weatherDisplay.textContent = `${weatherIcons[this.world.currentWeather] || '❓'}`;
        }
        
        // Update inventory display if open
        if (this.showInventory) {
            this.updateInventoryDisplay();
        }
        
        // Update crafting display if open
        if (this.showCrafting) {
            this.updateCraftingDisplay();
        }
    }

    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.gameState === 'playing') {
            this.update(deltaTime);
            this.render();
            this.updateUI();
        }

        this.notifications.update();
        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (this.world) {
            this.world.update(deltaTime, this.player);
        }
        
        if (this.player) {
            const updateResult = this.player.update(deltaTime);
            
            if (updateResult && updateResult.levelUp) {
                this.notifications.show(`Level Up! Du er nå level ${updateResult.newLevel}!`, 'success', 4000);
                this.audio.playCraftSound();
            }
            
            if (this.player.health <= 0) {
                this.gameOver();
            }
            
            if (this.world && this.world.currentDay > 99) {
                this.victory();
            }
        }
    }

    gameOver() {
        this.gameState = 'menu';
        document.getElementById('gameMenu').classList.remove('hidden');
        document.getElementById('gameMenu').innerHTML = `
            <h1>💀 Game Over</h1>
            <p>Du overlevde ${this.world.currentDay} dager</p>
            <p>Level oppnådd: ${this.player.level}</p>
            <button class="menu-button" onclick="window.game.startNewGame()">🔄 Prøv Igjen</button>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">🏠 Hovedmeny</button>
        `;
        SaveSystem.deleteSave();
    }

    victory() {
        this.gameState = 'menu';
        document.getElementById('gameMenu').classList.remove('hidden');
        document.getElementById('gameMenu').innerHTML = `
            <h1>🎉 Gratulerer!</h1>
            <p>Du overlevde alle 99 dagene!</p>
            <p>Final level: ${this.player.level}</p>
            <p>Du er en sann overlevelsesekspert!</p>
            <button class="menu-button" onclick="window.game.startNewGame()">🔄 Spill Igjen</button>
            <button class="menu-button" onclick="window.game.exitToMainMenu()">🏠 Hovedmeny</button>
        `;
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' && this.player && this.world) {
            this.ctx.save();
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            this.ctx.translate(centerX - this.player.x, centerY - this.player.y);
            
            this.world.render(this.ctx);
            this.player.render(this.ctx);
            
            const nearbyResources = this.world.getResourcesNear(
                this.player.x, 
                this.player.y, 
                GAME_CONFIG.INTERACTION_DISTANCE
            );
            
            if (nearbyResources.length > 0) {
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.8)';
                this.ctx.lineWidth = 3;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, GAME_CONFIG.INTERACTION_DISTANCE, 0, Math.PI * 2);
                this.ctx.stroke();
                
                // Mobile-friendly resource indicator
                if (window.innerWidth <= 768) {
                    this.ctx.fillStyle = 'rgba(74, 144, 226, 0.9)';
                    this.ctx.fillRect(this.player.x - 60, this.player.y - 80, 120, 35);
                    this.ctx.fillStyle = '#fff';
                    this.ctx.font = 'bold 14px Arial';
                    this.ctx.textAlign = 'center';
                    this.ctx.fillText('📦 Trykk for å samle!', this.player.x, this.player.y - 60);
                }
                
                const nearest = nearbyResources[0];
                this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                this.ctx.fillRect(this.player.x - 40, this.player.y - 45, 80, 25);
                this.ctx.fillStyle = '#fff';
                this.ctx.font = '14px Arial';
                this.ctx.textAlign = 'center';
                this.ctx.fillText(`${nearest.icon} ${nearest.type}`, this.player.x, this.player.y - 27);
            }
            
            this.ctx.restore();
        }

        this.notifications.render(this.ctx);
    }
}

// ==================== GLOBALE FUNKSJONER ====================
window.game = null;

window.startNewGame = function() {
    if (window.game) {
        window.game.startNewGame();
    }
};

window.showInstructions = function() {
    if (window.game) {
        window.game.showInstructions();
    }
};

window.showSettings = function() {
    if (window.game) {
        window.game.showSettings();
    }
};

window.showAchievements = function() {
    if (window.game) {
        window.game.showAchievements();
    }
};

window.closeInventory = function() {
    if (window.game) {
        window.game.closeInventory();
    }
};

window.closeSettings = function() {
    if (window.game) {
        window.game.closeSettings();
    }
};

window.answerMathChallenge = function(answer) {
    if (window.game) {
        window.game.answerMathChallenge(answer);
    }
};

// ==================== INITIALISERING ====================
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting Beyond 99 Days Complete Edition...');
    
    // Simuler loading progress
    const loadingBar = document.getElementById('loadingBar');
    let progress = 0;
    
    const loadingInterval = setInterval(() => {
        progress += Math.random() * 15 + 5;
        if (progress > 100) progress = 100;
        
        if (loadingBar) {
            loadingBar.style.width = progress + '%';
        }
        
        if (progress >= 100) {
            clearInterval(loadingInterval);
            // Start spillet etter kort pause
            setTimeout(() => {
                try {
                    window.game = new CompleteGame();
                    console.log('Game initialized successfully');
                } catch (error) {
                    console.error('Error initializing game:', error);
                    alert('Feil ved lasting av spill. Sjekk konsollen for detaljer.');
                    // Fjern loading screen selv om det er en feil
                    const loadingScreen = document.getElementById('loadingScreen');
                    if (loadingScreen) {
                        loadingScreen.style.display = 'none';
                    }
                }
            }, 200);
        }
    }, 100);
});
