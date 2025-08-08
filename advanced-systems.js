// Avanserte spillsystemer
import { GAME_CONFIG } from './game-config.js';

// Forbedret verden med mer kompleksitet
class EnhancedWorld {
    constructor() {
        this.resources = [];
        this.structures = [];
        this.animals = [];
        this.treasures = [];
        this.dungeons = [];
        this.biomes = new Map();
        
        // Time and day system
        this.currentDay = 1;
        this.timeOfDay = 0; // 0-24 hours
        this.gameTime = 0; // Total elapsed time in seconds
        this.dayLength = 300; // 5 minutes per day
        
        this.generateWorld();
    }
    
    generateWorld() {
        this.generateBiomes();
        this.generateResources();
        this.generateAnimals();
        this.generateTreasures();
        this.generateDungeons();
    }
    
    generateBiomes() {
        const biomeTypes = [
            { name: 'Skog', color: '#228B22', resourceBonus: 'tree' },
            { name: 'Fjell', color: '#696969', resourceBonus: 'stone' },
            { name: 'Eng', color: '#9ACD32', resourceBonus: 'berries' },
            { name: 'Elv', color: '#4682B4', resourceBonus: 'water' },
            { name: 'Myr', color: '#8FBC8F', resourceBonus: 'rare_herbs' },
            { name: 'Grotte', color: '#2F4F4F', resourceBonus: 'crystal' }
        ];
        
        for (let x = 0; x < GAME_CONFIG.WORLD_SIZE.width; x += 200) {
            for (let y = 0; y < GAME_CONFIG.WORLD_SIZE.height; y += 200) {
                const biome = biomeTypes[Math.floor(Math.random() * biomeTypes.length)];
                this.biomes.set(`${x}-${y}`, biome);
            }
        }
    }
    
    generateResources() {
        const resourceTypes = [
            { type: 'tree', icon: '🌲', rarity: 0.3, minDistance: 30 },
            { type: 'ancient_tree', icon: '🌳', rarity: 0.02, minDistance: 100 },
            { type: 'stone', icon: '🪨', rarity: 0.25, minDistance: 25 },
            { type: 'iron_ore', icon: '⛏️', rarity: 0.08, minDistance: 60 },
            { type: 'gold_ore', icon: '🏆', rarity: 0.01, minDistance: 150 },
            { type: 'berries', icon: '🫐', rarity: 0.15, minDistance: 20 },
            { type: 'mushrooms', icon: '🍄', rarity: 0.05, minDistance: 40 },
            { type: 'water_spring', icon: '💧', rarity: 0.08, minDistance: 80 },
            { type: 'rare_herbs', icon: '🌿', rarity: 0.03, minDistance: 70 },
            { type: 'crystal_node', icon: '💎', rarity: 0.005, minDistance: 200 }
        ];
        
        for (let i = 0; i < 500; i++) {
            const resourceType = this.getRandomResourceType(resourceTypes);
            let attempts = 0;
            let validPosition = false;
            let x, y;
            
            // Sikre minimum avstand mellom ressurser
            while (!validPosition && attempts < 20) {
                x = Math.random() * GAME_CONFIG.WORLD_SIZE.width;
                y = Math.random() * GAME_CONFIG.WORLD_SIZE.height;
                
                const tooClose = this.resources.some(resource => {
                    const distance = Math.sqrt((x - resource.x) ** 2 + (y - resource.y) ** 2);
                    return distance < resourceType.minDistance;
                });
                
                if (!tooClose) validPosition = true;
                attempts++;
            }
            
            if (validPosition) {
                this.resources.push({
                    id: `res_${i}`,
                    ...resourceType,
                    x, y,
                    depleted: false,
                    lastHarvested: 0,
                    quality: 50 + Math.random() * 50,
                    respawnTime: this.getRespawnTime(resourceType.type)
                });
            }
        }
    }
    
    getRespawnTime(resourceType) {
        switch(resourceType) {
            case 'crystal_node': return 300000; // 5 minutter
            case 'gold_ore': return 180000; // 3 minutter