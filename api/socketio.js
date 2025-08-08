// Socket.IO implementation for Vercel
// api/socketio.js

import { Server } from 'socket.io';

// In-memory storage (in production, use Redis or similar)
const activeGames = new Map();
const playerSessions = new Map();
const lobbies = new Map();
const connectedPlayers = new Map();
const activeTrades = new Map();
const tradingHistory = [];

let io;

export default function handler(req, res) {
    if (!res.socket.server.io) {
        console.log('Initializing Socket.IO server...');
        
        io = new Server(res.socket.server, {
            path: '/api/socketio',
            addTrailingSlash: false,
            cors: {
                origin: "*",
                methods: ["GET", "POST"],
                credentials: true
            }
        });
        
        res.socket.server.io = io;
        
        io.on('connection', (socket) => {
            const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            
            playerSessions.set(playerId, {
                socket,
                playerId,
                currentGame: null,
                currentLobby: null
            });
            
            console.log(`Player ${playerId} connected`);
            
            socket.emit('connection_established', {
                playerId,
                timestamp: Date.now()
            });
            
            // Handle all multiplayer events
            socket.on('create_lobby', (config) => {
                const lobby = createLobby(playerId, config);
                const session = playerSessions.get(playerId);
                if (session) {
                    session.currentLobby = lobby.id;
                    socket.emit('lobby_created', { lobby });
                }
            });
            
            socket.on('join_lobby', ({ lobbyId, playerName }) => {
                const result = joinLobby(lobbyId, playerId, playerName);
                if (result.success) {
                    const session = playerSessions.get(playerId);
                    if (session) {
                        session.currentLobby = lobbyId;
                        socket.emit('lobby_joined', { lobby: result.lobby });
                        socket.to(`lobby_${lobbyId}`).emit('player_joined', {
                            player: result.lobby.players.get(playerId)
                        });
                        socket.join(`lobby_${lobbyId}`);
                    }
                } else {
                    socket.emit('error', { error: result.error });
                }
            });
            
            socket.on('leave_lobby', () => {
                const session = playerSessions.get(playerId);
                if (session?.currentLobby) {
                    const lobbyId = session.currentLobby;
                    leaveLobby(lobbyId, playerId);
                    session.currentLobby = null;
                    socket.leave(`lobby_${lobbyId}`);
                    socket.to(`lobby_${lobbyId}`).emit('player_left', { playerId });
                }
            });
            
            socket.on('ready_toggle', () => {
                const session = playerSessions.get(playerId);
                if (session?.currentLobby) {
                    const lobby = lobbies.get(session.currentLobby);
                    if (lobby?.players.has(playerId)) {
                        const player = lobby.players.get(playerId);
                        player.isReady = !player.isReady;
                        io.to(`lobby_${session.currentLobby}`).emit('player_ready_changed', {
                            playerId,
                            isReady: player.isReady
                        });
                    }
                }
            });
            
            socket.on('start_game', () => {
                const session = playerSessions.get(playerId);
                if (session?.currentLobby) {
                    const result = startGame(session.currentLobby, playerId);
                    if (result.success) {
                        session.currentGame = result.gameId;
                        socket.join(`game_${result.gameId}`);
                        io.to(`lobby_${session.currentLobby}`).emit('game_starting', {
                            gameId: result.gameId,
                            gameState: result.game
                        });
                    } else {
                        socket.emit('error', { error: result.error });
                    }
                }
            });
            
            socket.on('game_update', (data) => {
                const session = playerSessions.get(playerId);
                if (session?.currentGame) {
                    const game = activeGames.get(session.currentGame);
                    if (game) {
                        game.updatePlayer(playerId, data.playerData);
                        socket.to(`game_${session.currentGame}`).emit('player_update', {
                            playerId,
                            playerData: data.playerData
                        });
                    }
                }
            });
            
            socket.on('resource_collected', (data) => {
                const session = playerSessions.get(playerId);
                if (session?.currentGame) {
                    io.to(`game_${session.currentGame}`).emit('resource_collected', {
                        playerId,
                        resource: data.resource,
                        position: data.position,
                        timestamp: Date.now()
                    });
                }
            });
            
            socket.on('chat_message', (data) => {
                const session = playerSessions.get(playerId);
                const message = {
                    playerId,
                    playerName: data.playerName,
                    message: data.message,
                    timestamp: Date.now()
                };
                
                if (session?.currentGame) {
                    io.to(`game_${session.currentGame}`).emit('chat_message', message);
                } else if (session?.currentLobby) {
                    io.to(`lobby_${session.currentLobby}`).emit('chat_message', message);
                }
            });
            
            socket.on('get_public_lobbies', () => {
                socket.emit('public_lobbies', {
                    lobbies: getPublicLobbies()
                });
            });
            
            socket.on('disconnect', () => {
                handlePlayerDisconnect(playerId);
            });
        });
    }
    
    res.end();
}

// Multiplayer game logic functions
function createLobby(hostPlayerId, config) {
    const lobbyId = 'lobby_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    const lobby = {
        id: lobbyId,
        hostPlayerId,
        players: new Map(),
        config: {
            maxPlayers: config.maxPlayers || 4,
            worldType: config.worldType || 'forest',
            gameMode: config.gameMode || 'cooperative',
            isPrivate: config.isPrivate || false
        },
        status: 'waiting',
        createdAt: Date.now()
    };
    
    lobby.players.set(hostPlayerId, {
        id: hostPlayerId,
        name: config.playerName || 'Host',
        isHost: true,
        isReady: false
    });
    
    lobbies.set(lobbyId, lobby);
    return lobby;
}

function joinLobby(lobbyId, playerId, playerName) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return { success: false, error: 'Lobby not found' };
    if (lobby.players.size >= lobby.config.maxPlayers) {
        return { success: false, error: 'Lobby is full' };
    }
    if (lobby.status !== 'waiting') {
        return { success: false, error: 'Game already started' };
    }
    
    lobby.players.set(playerId, {
        id: playerId,
        name: playerName || `Player ${lobby.players.size + 1}`,
        isHost: false,
        isReady: false
    });
    
    return { success: true, lobby };
}

function leaveLobby(lobbyId, playerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return false;
    
    lobby.players.delete(playerId);
    
    if (lobby.players.size === 0) {
        lobbies.delete(lobbyId);
    } else {
        const remainingPlayers = Array.from(lobby.players.values());
        if (!remainingPlayers.find(p => p.isHost)) {
            remainingPlayers[0].isHost = true;
            lobby.hostPlayerId = remainingPlayers[0].id;
        }
    }
    
    return true;
}

function startGame(lobbyId, hostPlayerId) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby || lobby.hostPlayerId !== hostPlayerId) {
        return { success: false, error: 'Not authorized or lobby not found' };
    }
    
    const allReady = Array.from(lobby.players.values()).every(p => p.isReady);
    if (!allReady) {
        return { success: false, error: 'Not all players are ready' };
    }
    
    lobby.status = 'starting';
    const gameId = 'game_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    
    const game = {
        gameId,
        hostPlayerId,
        players: new Map(),
        gameState: {
            worldType: lobby.config.worldType,
            currentDay: 1,
            gameTime: 0,
            resources: new Map(),
            buildings: new Map(),
            events: []
        },
        maxPlayers: lobby.config.maxPlayers,
        isActive: true,
        lastUpdate: Date.now()
    };
    
    // Add all lobby players to the game
    for (const [playerId, playerData] of lobby.players) {
        game.players.set(playerId, {
            id: playerId,
            name: playerData.name,
            position: { 
                x: 1500 + (Math.random() - 0.5) * 200, 
                y: 1500 + (Math.random() - 0.5) * 200 
            },
            health: 100,
            hunger: 100,
            thirst: 100,
            energy: 100,
            warmth: 100,
            level: 1,
            inventory: new Map(),
            isActive: true,
            lastSeen: Date.now()
        });
    }
    
    activeGames.set(gameId, game);
    lobby.status = 'in_game';
    lobby.gameId = gameId;
    
    return { success: true, gameId, game: getGameState(game) };
}

function getGameState(game) {
    return {
        gameId: game.gameId,
        players: Array.from(game.players.values()),
        gameState: game.gameState,
        lastUpdate: game.lastUpdate
    };
}

function getPublicLobbies() {
    const publicLobbies = [];
    for (const lobby of lobbies.values()) {
        if (!lobby.config.isPrivate && lobby.status === 'waiting') {
            publicLobbies.push({
                id: lobby.id,
                hostName: lobby.players.get(lobby.hostPlayerId)?.name || 'Unknown',
                playerCount: lobby.players.size,
                maxPlayers: lobby.config.maxPlayers,
                worldType: lobby.config.worldType,
                gameMode: lobby.config.gameMode
            });
        }
    }
    return publicLobbies;
}

function handlePlayerDisconnect(playerId) {
    const session = playerSessions.get(playerId);
    if (!session) return;
    
    console.log(`Player ${playerId} disconnected`);
    
    // Leave lobby if in one
    if (session.currentLobby) {
        leaveLobby(session.currentLobby, playerId);
        io.to(`lobby_${session.currentLobby}`).emit('player_left', { playerId });
    }
    
    // Leave game if in one
    if (session.currentGame) {
        const game = activeGames.get(session.currentGame);
        if (game) {
            game.players.delete(playerId);
            io.to(`game_${session.currentGame}`).emit('player_disconnected', { playerId });
            
            if (game.players.size === 0) {
                activeGames.delete(session.currentGame);
            }
        }
    }
    
    playerSessions.delete(playerId);
}
