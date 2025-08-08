// Spillkonstanter for "Beyond 99 Days in the Woods"

// Automatically detect server URL based on environment
const getServerUrl = () => {
    // In production, try to detect server URL from current domain
    if (typeof window !== 'undefined') {
        const hostname = window.location.hostname;
        const protocol = window.location.protocol === 'https:' ? 'https://' : 'http://';
        
        // If on localhost, use development server
        if (hostname === 'localhost' || hostname === '127.0.0.1') {
            return 'http://localhost:3001';
        }
        
        // For production, the server URL should be set via environment variable
        // or use a default production server URL
        return import.meta.env.VITE_SERVER_URL || 'https://your-game-server.herokuapp.com';
    }
    
    return 'http://localhost:3001';
};

export const GAME_CONFIG = {
    CANVAS_WIDTH: typeof window !== 'undefined' ? window.innerWidth : 800,
    CANVAS_HEIGHT: typeof window !== 'undefined' ? window.innerHeight : 600,
    PLAYER_SPEED: 2.5,
    DAY_DURATION: 180000, // 3 minutter per dag for mer intensiv opplevelse
    INVENTORY_SIZE: 20,
    MAX_DAYS: 99,
    MEMORY_BAND_FREQUENCY: 2, // Hvert 2. dag får du minnebånd
    ZONE_TRANSITION_DAYS: [20, 40, 60, 80], // Soneoverganger
    MULTIPLAYER_UPDATE_INTERVAL: 1000,
    FORGETFULNESS_ZONES: 5, // Antall glemselssoner
    SKILL_TREES: ['hunting', 'medicine', 'construction', 'survival', 'mysticism'],
    SERVER_URL: getServerUrl(),
    WORLD_SIZE: { width: 3000, height: 3000 },
    BIOMES: {
        0: { name: 'Tåkeskog', color: '#2F4F2F', special: 'Ekkende rop om hjelp' },
        1: { name: 'Myr', color: '#8B4513', special: 'Forgiftet vannkilde' },
        2: { name: 'Furu-platå', color: '#228B22', special: 'Snødekte ruinfragmenter' },
        3: { name: 'Bjergtunnel', color: '#696969', special: 'Mystiske ruiner' },
        4: { name: 'Glemme-oren', color: '#800080', special: 'Du glemmer ting her' }
    },
    CAMERA_SPEED: 0.08
};
