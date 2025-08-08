// Beyond 99 Days in the Woods - Utvidet versjon med mer funksjonalitet

// Spillkonfigurasjon
const GAME_CONFIG = {
    WORLD_WIDTH: 2000,
    WORLD_HEIGHT: 2000,
    PLAYER_SPEED: 3,
    DAY_DURATION: 180000, // 3 minutter per dag
    INTERACTION_DISTANCE: 50
};

// Inventory system
class Inventory {
    constructor() {
        this.items = {};
        this.maxSlots = 20;
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
}

// Player klasse
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

        // Oppdater posisjon
        this.x += moveX;
        this.y += moveY;

        // Begrens til verden
        this.x = Math.max(this.width/2, Math.min(this.x, GAME_CONFIG.WORLD_WIDTH - this.width/2));
        this.y = Math.max(this.height/2, Math.min(this.y, GAME_CONFIG.WORLD_HEIGHT - this.height/2));

        // Stats decay
        const seconds = deltaTime / 1000;
        this.hunger = Math.max(0, this.hunger - 0.5 * seconds);
        this.thirst = Math.max(0, this.thirst - 0.7 * seconds);
        this.energy = Math.max(0, this.energy - 0.3 * seconds);
        this.warmth = Math.max(0, this.warmth - 0.4 * seconds);

        // Health effects
        if (this.hunger <= 0) this.health -= 1 * seconds;
        if (this.thirst <= 0) this.health -= 2 * seconds;
        if (this.warmth <= 0) this.health -= 0.5 * seconds;
        
        this.health = Math.max(0, this.health);
    }

    // Konsumer mat/drikke
    consume(itemType) {
        if (!this.inventory.hasItem(itemType)) return false;

        switch(itemType) {
            case 'berries':
                this.hunger = Math.min(100, this.hunger + 20);
                this.health = Math.min(100, this.health + 5);
                break;
            case 'water':
                this.thirst = Math.min(100, this.thirst + 30);
                break;
            case 'mushrooms':
                this.hunger = Math.min(100, this.hunger + 15);
                this.energy = Math.min(100, this.energy + 10);
                break;
        }

        this.inventory.removeItem(itemType, 1);
        return true;
    }

    render(ctx) {
        ctx.save();
        
        // Skygge
        ctx.fillStyle = 'rgba(0,0,0,0.3)';
        ctx.beginPath();
        ctx.ellipse(this.x, this.y + this.height/2, this.width/2, 6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Kropp
        ctx.fillStyle = '#8B4513';
        ctx.fillRect(this.x - this.width/2, this.y - this.height/2, this.width, this.height * 0.7);
        
        // Hode
        ctx.fillStyle = '#D2B48C';
        ctx.fillRect(this.x - this.width/2 + 3, this.y - this.height/2, this.width - 6, this.height * 0.3);
        
        // Øyne
        ctx.fillStyle = '#000';
        ctx.fillRect(this.x - 6, this.y - this.height/2 + 5, 2, 2);
        ctx.fillRect(this.x + 4, this.y - this.height/2 + 5, 2, 2);
        
        // Helsebar over hodet
        const barWidth = this.width;
        const barHeight = 4;
        ctx.fillStyle = '#ff0000';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 10, barWidth, barHeight);
        ctx.fillStyle = '#00ff00';
        ctx.fillRect(this.x - barWidth/2, this.y - this.height/2 - 10, barWidth * (this.health/100), barHeight);
        
        ctx.restore();
    }
}

// Utvidet verden med interaksjon
class EnhancedWorld {
    constructor() {
        this.resources = [];
        this.currentDay = 1;
        this.timeOfDay = 8; // Start kl 08:00
        this.gameTime = 0;
        this.generateResources();
    }

    generateResources() {
        const resourceTypes = [
            { 
                type: 'tree', 
                icon: '🌲', 
                color: '#228B22', 
                size: 30,
                harvestable: true,
                yields: { wood: 3, berries: 1 }
            },
            { 
                type: 'stone', 
                icon: '🪨', 
                color: '#696969', 
                size: 25,
                harvestable: true,
                yields: { stone: 2 }
            },
            { 
                type: 'berries', 
                icon: '🫐', 
                color: '#4B0082', 
                size: 20,
                harvestable: true,
                yields: { berries: 2 }
            },
            { 
                type: 'water', 
                icon: '💧', 
                color: '#4682B4', 
                size: 35,
                harvestable: true,
                yields: { water: 5 }
            },
            { 
                type: 'mushrooms', 
                icon: '🍄', 
                color: '#8B4513', 
                size: 22,
                harvestable: true,
                yields: { mushrooms: 2 }
            }
        ];

        for (let i = 0; i < 100; i++) {
            const resourceType = resourceTypes[Math.floor(Math.random() * resourceTypes.length)];
            this.resources.push({
                id: `res_${i}`,
                ...resourceType,
                x: 100 + Math.random() * (GAME_CONFIG.WORLD_WIDTH - 200),
                y: 100 + Math.random() * (GAME_CONFIG.WORLD_HEIGHT - 200),
                harvested: false,
                respawnTime: 30000 + Math.random() * 60000 // 30-90 sekunder
            });
        }
    }

    update(deltaTime) {
        this.gameTime += deltaTime;
        this.timeOfDay = 8 + (this.gameTime / 1000) * (16 / (GAME_CONFIG.DAY_DURATION / 1000));
        
        if (this.timeOfDay >= 24) {
            this.currentDay++;
            this.timeOfDay = 8;
            this.gameTime = 0;
        }

        // Respawn ressurser
        this.resources.forEach(resource => {
            if (resource.harvested && Date.now() - resource.harvestedAt > resource.respawnTime) {
                resource.harvested = false;
                delete resource.harvestedAt;
            }
        });
    }

    getTimeString() {
        const hours = Math.floor(this.timeOfDay);
        const minutes = Math.floor((this.timeOfDay - hours) * 60);
        return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
    }

    // Finn ressurser nær spilleren
    getResourcesNear(x, y, distance) {
        return this.resources.filter(resource => {
            if (resource.harvested) return false;
            const dx = resource.x - x;
            const dy = resource.y - y;
            return Math.sqrt(dx * dx + dy * dy) <= distance;
        });
    }

    // Høst ressurs
    harvestResource(resource, player) {
        if (resource.harvested || !resource.harvestable) return null;

        resource.harvested = true;
        resource.harvestedAt = Date.now();

        // Legg til items i inventory
        for (const [itemType, amount] of Object.entries(resource.yields)) {
            player.inventory.addItem(itemType, amount);
        }

        return resource.yields;
    }

    render(ctx) {
        // Bakgrunn gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, GAME_CONFIG.WORLD_HEIGHT);
        gradient.addColorStop(0, '#87CEEB'); // Himmelblå
        gradient.addColorStop(0.7, '#90EE90'); // Lysegrønn
        gradient.addColorStop(1, '#228B22'); // Skoggrønn
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, GAME_CONFIG.WORLD_WIDTH, GAME_CONFIG.WORLD_HEIGHT);

        // Tegn noen enkle bakgrunnselementer
        ctx.fillStyle = 'rgba(34, 139, 34, 0.3)';
        for (let i = 0; i < 20; i++) {
            const x = (i * 150) % GAME_CONFIG.WORLD_WIDTH;
            const y = (Math.floor(i / 10) * 200) % GAME_CONFIG.WORLD_HEIGHT;
            ctx.beginPath();
            ctx.arc(x, y, 40 + Math.random() * 20, 0, Math.PI * 2);
            ctx.fill();
        }

        // Ressurser
        this.resources.forEach(resource => {
            if (resource.harvested) return;

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
        });
    }
}

// Hovedspillklasse
class Game {
    constructor() {
        this.canvas = document.getElementById('gameCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.gameState = 'menu'; // 'menu', 'playing', 'paused'
        this.lastTime = 0;
        this.showInventory = false;
        
        this.resizeCanvas();
        this.setupEventListeners();
        this.gameLoop();
        
        window.addEventListener('resize', () => this.resizeCanvas());
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
            
            // Normaliser til -1 til 1
            const normalizedX = constrainedX / maxDistance;
            const normalizedY = constrainedY / maxDistance;
            
            this.player.setMovement(normalizedX, normalizedY);
        };

        const handleEnd = (e) => {
            e.preventDefault();
            isDragging = false;
            resetKnob();
        };

        // Touch events
        joystick.addEventListener('touchstart', handleStart);
        document.addEventListener('touchmove', handleMove);
        document.addEventListener('touchend', handleEnd);
        
        // Mouse events for testing
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
                this.togglePauseMenu();
            }
            
            if (key === 'e') {
                this.collectNearbyResources();
            }
            
            if (key === 'i') {
                this.toggleInventory();
            }

            // Konsumer items
            if (key === '1') this.player.consume('berries');
            if (key === '2') this.player.consume('water');
            if (key === '3') this.player.consume('mushrooms');
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
                console.log('Samlet:', yields);
                this.showNotification(`Samlet: ${Object.entries(yields).map(([k,v]) => `${v} ${k}`).join(', ')}`);
            }
        } else {
            this.showNotification('Ingen ressurser i nærheten');
        }
    }

    toggleInventory() {
        this.showInventory = !this.showInventory;
    }

    showNotification(message) {
        console.log('Notification:', message);
        // Kan implementere toast-notifikasjoner senere
    }

    startNewGame() {
        this.gameState = 'playing';
        this.world = new EnhancedWorld();
        this.player = new Player(GAME_CONFIG.WORLD_WIDTH / 2, GAME_CONFIG.WORLD_HEIGHT / 2);
        
        // Skjul meny og vis spill-UI
        document.getElementById('gameMenu').classList.add('hidden');
        document.getElementById('gameUI').style.display = 'block';
        
        // Vis mobile kontroller på mobil
        if (window.innerWidth <= 768) {
            const mobileControls = document.getElementById('mobileControls');
            if (mobileControls) {
                mobileControls.style.display = 'flex';
            }
        }
        
        console.log('Nytt spill startet!');
        this.showNotification('Bruk WASD for å bevege deg, E for å samle ressurser, I for inventar!');
    }

    togglePauseMenu() {
        if (this.gameState === 'playing') {
            this.gameState = 'paused';
            document.getElementById('gameMenu').classList.remove('hidden');
            document.getElementById('gameMenu').innerHTML = `
                <h1>Pause</h1>
                <button class="menu-button" onclick="window.game.resumeGame()">Fortsett</button>
                <button class="menu-button" onclick="window.game.exitToMainMenu()">Hovedmeny</button>
            `;
        }
    }

    resumeGame() {
        this.gameState = 'playing';
        document.getElementById('gameMenu').classList.add('hidden');
    }

    exitToMainMenu() {
        this.gameState = 'menu';
        this.player = null;
        this.world = null;
        
        document.getElementById('gameUI').style.display = 'none';
        document.getElementById('gameMenu').classList.remove('hidden');
        document.getElementById('gameMenu').innerHTML = `
            <h1>Beyond 99 Days</h1>
            <button class="menu-button" onclick="window.game.startNewGame()">Start Nytt Spill</button>
            <button class="menu-button" onclick="showInstructions()">Hvordan Spille</button>
            <button class="menu-button" onclick="showSettings()">Innstillinger</button>
        `;
    }

    updateUI() {
        if (this.gameState !== 'playing' || !this.player || !this.world) return;

        // Oppdater stats
        document.getElementById('dayCounter').textContent = this.world.currentDay;
        document.getElementById('timeDisplay').textContent = this.world.getTimeString();
        
        // Oppdater ressursbarer
        document.getElementById('healthBar').style.width = `${this.player.health}%`;
        document.getElementById('hungerBar').style.width = `${this.player.hunger}%`;
        document.getElementById('thirstBar').style.width = `${this.player.thirst}%`;
        document.getElementById('energyBar').style.width = `${this.player.energy}%`;
        document.getElementById('warmthBar').style.width = `${this.player.warmth}%`;
    }

    gameLoop(timestamp = 0) {
        const deltaTime = timestamp - this.lastTime;
        this.lastTime = timestamp;

        if (this.gameState === 'playing') {
            this.update(deltaTime);
            this.render();
            this.updateUI();
        }

        requestAnimationFrame((t) => this.gameLoop(t));
    }

    update(deltaTime) {
        if (this.world) {
            this.world.update(deltaTime);
        }
        
        if (this.player) {
            this.player.update(deltaTime);
            
            // Sjekk game over
            if (this.player.health <= 0) {
                alert('Du døde! Spillet er over.');
                this.exitToMainMenu();
            }
            
            // Sjekk seier
            if (this.world && this.world.currentDay > 99) {
                alert('Gratulerer! Du overlevde 99 dager!');
                this.exitToMainMenu();
            }
        }
    }

    render() {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        if (this.gameState === 'playing' && this.player && this.world) {
            // Kamerafølging
            this.ctx.save();
            const centerX = this.canvas.width / 2;
            const centerY = this.canvas.height / 2;
            this.ctx.translate(centerX - this.player.x, centerY - this.player.y);
            
            // Render verden og spilleren
            this.world.render(this.ctx);
            this.player.render(this.ctx);
            
            // Vis interaksjonssirkel
            const nearbyResources = this.world.getResourcesNear(
                this.player.x, 
                this.player.y, 
                GAME_CONFIG.INTERACTION_DISTANCE
            );
            
            if (nearbyResources.length > 0) {
                this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.5)';
                this.ctx.lineWidth = 2;
                this.ctx.beginPath();
                this.ctx.arc(this.player.x, this.player.y, GAME_CONFIG.INTERACTION_DISTANCE, 0, Math.PI * 2);
                this.ctx.stroke();
            }
            
            this.ctx.restore();
            
            // Render inventory hvis åpen
            if (this.showInventory) {
                this.renderInventory();
            }
        }
    }

    renderInventory() {
        if (!this.player) return;

        const items = this.player.inventory.getAllItems();
        
        // Bakgrunn
        this.ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.ctx.fillRect(50, 50, 300, 200);
        
        // Tittel
        this.ctx.fillStyle = '#fff';
        this.ctx.font = '20px Arial';
        this.ctx.fillText('Inventar', 60, 80);
        
        // Items
        let y = 100;
        for (const [itemType, amount] of Object.entries(items)) {
            this.ctx.font = '16px Arial';
            this.ctx.fillText(`${itemType}: ${amount}`, 60, y);
            y += 25;
        }
        
        // Instruksjoner
        this.ctx.font = '12px Arial';
        this.ctx.fillStyle = '#ccc';
        this.ctx.fillText('Trykk I for å lukke', 60, 230);
        this.ctx.fillText('1: Spis bær, 2: Drikk vann, 3: Spis sopp', 60, 245);
    }
}

// Global functions for menu buttons
window.startNewGame = function() {
    if (window.game) {
        window.game.startNewGame();
    }
};

window.showInstructions = function() {
    alert(`Hvordan spille Beyond 99 Days:

Bevegelse:
- PC: WASD eller piltaster
- Mobil: Virtual joystick

Handlinger:
- E: Saml ressurser i nærheten
- I: Åpne/lukk inventar
- 1: Spis bær (gjenoppretter sult og helse)
- 2: Drikk vann (gjenoppretter tørst)
- 3: Spis sopp (gjenoppretter sult og energi)
- ESC: Pause

Mål:
Overlev i 99 dager ved å samle ressurser og holde deg i live!
Følg med på helse, sult, tørst, energi og varme.`);
};

window.showSettings = function() {
    alert('Innstillinger kommer snart!');
};

window.collectResources = function() {
    if (window.game) {
        window.game.collectNearbyResources();
    }
};

// Initialize game when page loads
document.addEventListener('DOMContentLoaded', () => {
    console.log('Starting Beyond 99 Days enhanced game...');
    try {
        window.game = new Game();
        console.log('Game initialized successfully');
    } catch (error) {
        console.error('Error initializing game:', error);
    }
});

window.collectResources = function() {
    if (window.game) {
        window.game.collectNearbyResources();
    }
};

