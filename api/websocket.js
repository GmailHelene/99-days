// WebSocket handler for Vercel
// api/websocket.js

const WebSocket = require('ws');

// In-memory storage for active games and players
const activeGames = new Map();
const playerSessions = new Map();
const lobbies = new Map();

class MultiplayerGame {
    constructor(gameId, hostPlayerId) {
        this.gameId = gameId;
        this.hostPlayerId = hostPlayerId;
        this.players = new Map();
        this.gameState = {
            worldType: 'forest',
            currentDay: 1,
            gameTime: 0,
            resources: new Map(),
            buildings: new Map(),
            events: []
        };
        this.maxPlayers = 4;
        this.isActive = true;
        this.lastUpdate = Date.now();
    }

    addPlayer(playerId, playerData) {
        if (this.players.size >= this.maxPlayers) {
            return { success: false, error: 'Game is full' };
        }
        
        this.players.set(playerId, {
            id: playerId,
            name: playerData.name || `Player ${this.players.size + 1}`,
            position: { x: 1500, y: 1500 },
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
        
        return { success: true, player: this.players.get(playerId) };
    }

    removePlayer(playerId) {
        this.players.delete(playerId);
        if (this.players.size === 0) {
            this.isActive = false;
        }
    }

    updatePlayer(playerId, updateData) {
        const player = this.players.get(playerId);
        if (!player) return false;
        
        Object.assign(player, updateData);
        player.lastSeen = Date.now();
        return true;
    }

    getGameState() {
        return {
            gameId: this.gameId,
            players: Array.from(this.players.values()),
            gameState: this.gameState,
            lastUpdate: this.lastUpdate
        };
    }
}

class LobbyManager {
    static createLobby(hostPlayerId, lobbyConfig) {
        const lobbyId = 'lobby_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
        const lobby = {
            id: lobbyId,
            hostPlayerId,
            players: new Map(),
            config: {
                maxPlayers: lobbyConfig.maxPlayers || 4,
                worldType: lobbyConfig.worldType || 'forest',
                gameMode: lobbyConfig.gameMode || 'cooperative',
                isPrivate: lobbyConfig.isPrivate || false
            },
            status: 'waiting', // waiting, starting, in_game
            createdAt: Date.now()
        };
        
        lobby.players.set(hostPlayerId, {
            id: hostPlayerId,
            name: lobbyConfig.playerName || 'Host',
            isHost: true,
            isReady: false
        });
        
        lobbies.set(lobbyId, lobby);
        return lobby;
    }

    static joinLobby(lobbyId, playerId, playerName) {
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

    static leaveLobby(lobbyId, playerId) {
        const lobby = lobbies.get(lobbyId);
        if (!lobby) return false;
        
        lobby.players.delete(playerId);
        
        // If host leaves, assign new host or delete lobby
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

    static startGame(lobbyId, hostPlayerId) {
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
        const game = new MultiplayerGame(gameId, hostPlayerId);
        
        // Add all lobby players to the game
        for (const [playerId, playerData] of lobby.players) {
            game.addPlayer(playerId, playerData);
        }
        
        activeGames.set(gameId, game);
        lobby.status = 'in_game';
        lobby.gameId = gameId;
        
        return { success: true, gameId, game: game.getGameState() };
    }

    static getPublicLobbies() {
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
}

// WebSocket connection handler
function handleWebSocket(ws, req) {
    const playerId = 'player_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    playerSessions.set(playerId, { ws, playerId, currentGame: null, currentLobby: null });
    
    console.log(`Player ${playerId} connected`);
    
    ws.send(JSON.stringify({
        type: 'connection_established',
        playerId,
        timestamp: Date.now()
    }));
    
    ws.on('message', (data) => {
        try {
            const message = JSON.parse(data.toString());
            handleMessage(playerId, message);
        } catch (error) {
            console.error('Error parsing message:', error);
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Invalid message format'
            }));
        }
    });
    
    ws.on('close', () => {
        handlePlayerDisconnect(playerId);
    });
    
    ws.on('error', (error) => {
        console.error('WebSocket error:', error);
        handlePlayerDisconnect(playerId);
    });
}

function handleMessage(playerId, message) {
    const session = playerSessions.get(playerId);
    if (!session) return;
    
    const { ws } = session;
    
    switch (message.type) {
        case 'create_lobby':
            const lobby = LobbyManager.createLobby(playerId, message.config);
            session.currentLobby = lobby.id;
            ws.send(JSON.stringify({
                type: 'lobby_created',
                lobby: lobby
            }));
            break;
            
        case 'join_lobby':
            const joinResult = LobbyManager.joinLobby(message.lobbyId, playerId, message.playerName);
            if (joinResult.success) {
                session.currentLobby = message.lobbyId;
                ws.send(JSON.stringify({
                    type: 'lobby_joined',
                    lobby: joinResult.lobby
                }));
                broadcastToLobby(message.lobbyId, {
                    type: 'player_joined',
                    player: joinResult.lobby.players.get(playerId)
                }, playerId);
            } else {
                ws.send(JSON.stringify({
                    type: 'error',
                    error: joinResult.error
                }));
            }
            break;
            
        case 'leave_lobby':
            if (session.currentLobby) {
                const leftLobby = session.currentLobby;
                LobbyManager.leaveLobby(leftLobby, playerId);
                session.currentLobby = null;
                broadcastToLobby(leftLobby, {
                    type: 'player_left',
                    playerId
                }, playerId);
            }
            break;
            
        case 'ready_toggle':
            if (session.currentLobby) {
                const lobby = lobbies.get(session.currentLobby);
                if (lobby && lobby.players.has(playerId)) {
                    const player = lobby.players.get(playerId);
                    player.isReady = !player.isReady;
                    broadcastToLobby(session.currentLobby, {
                        type: 'player_ready_changed',
                        playerId,
                        isReady: player.isReady
                    });
                }
            }
            break;
            
        case 'start_game':
            if (session.currentLobby) {
                const startResult = LobbyManager.startGame(session.currentLobby, playerId);
                if (startResult.success) {
                    session.currentGame = startResult.gameId;
                    broadcastToLobby(session.currentLobby, {
                        type: 'game_starting',
                        gameId: startResult.gameId,
                        gameState: startResult.game
                    });
                } else {
                    ws.send(JSON.stringify({
                        type: 'error',
                        error: startResult.error
                    }));
                }
            }
            break;
            
        case 'game_update':
            if (session.currentGame) {
                const game = activeGames.get(session.currentGame);
                if (game) {
                    game.updatePlayer(playerId, message.playerData);
                    broadcastToGame(session.currentGame, {
                        type: 'player_update',
                        playerId,
                        playerData: message.playerData
                    }, playerId);
                }
            }
            break;
            
        case 'resource_collected':
            if (session.currentGame) {
                const game = activeGames.get(session.currentGame);
                if (game) {
                    broadcastToGame(session.currentGame, {
                        type: 'resource_collected',
                        playerId,
                        resource: message.resource,
                        position: message.position,
                        timestamp: Date.now()
                    });
                }
            }
            break;
            
        case 'chat_message':
            if (session.currentGame) {
                broadcastToGame(session.currentGame, {
                    type: 'chat_message',
                    playerId,
                    playerName: message.playerName,
                    message: message.message,
                    timestamp: Date.now()
                });
            } else if (session.currentLobby) {
                broadcastToLobby(session.currentLobby, {
                    type: 'chat_message',
                    playerId,
                    playerName: message.playerName,
                    message: message.message,
                    timestamp: Date.now()
                });
            }
            break;
            
        case 'get_public_lobbies':
            ws.send(JSON.stringify({
                type: 'public_lobbies',
                lobbies: LobbyManager.getPublicLobbies()
            }));
            break;
            
        case 'ping':
            ws.send(JSON.stringify({
                type: 'pong',
                timestamp: Date.now()
            }));
            break;
            
        default:
            ws.send(JSON.stringify({
                type: 'error',
                error: 'Unknown message type'
            }));
    }
}

function broadcastToLobby(lobbyId, message, excludePlayerId = null) {
    const lobby = lobbies.get(lobbyId);
    if (!lobby) return;
    
    for (const playerId of lobby.players.keys()) {
        if (playerId !== excludePlayerId) {
            const session = playerSessions.get(playerId);
            if (session && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify(message));
            }
        }
    }
}

function broadcastToGame(gameId, message, excludePlayerId = null) {
    const game = activeGames.get(gameId);
    if (!game) return;
    
    for (const playerId of game.players.keys()) {
        if (playerId !== excludePlayerId) {
            const session = playerSessions.get(playerId);
            if (session && session.ws.readyState === WebSocket.OPEN) {
                session.ws.send(JSON.stringify(message));
            }
        }
    }
}

function handlePlayerDisconnect(playerId) {
    const session = playerSessions.get(playerId);
    if (!session) return;
    
    console.log(`Player ${playerId} disconnected`);
    
    // Leave lobby if in one
    if (session.currentLobby) {
        LobbyManager.leaveLobby(session.currentLobby, playerId);
        broadcastToLobby(session.currentLobby, {
            type: 'player_left',
            playerId
        }, playerId);
    }
    
    // Leave game if in one
    if (session.currentGame) {
        const game = activeGames.get(session.currentGame);
        if (game) {
            game.removePlayer(playerId);
            broadcastToGame(session.currentGame, {
                type: 'player_disconnected',
                playerId
            }, playerId);
            
            if (!game.isActive) {
                activeGames.delete(session.currentGame);
            }
        }
    }
    
    playerSessions.delete(playerId);
}

// Cleanup inactive games and lobbies
setInterval(() => {
    const now = Date.now();
    const INACTIVE_TIMEOUT = 5 * 60 * 1000; // 5 minutes
    
    // Clean up inactive games
    for (const [gameId, game] of activeGames) {
        if (now - game.lastUpdate > INACTIVE_TIMEOUT) {
            activeGames.delete(gameId);
        }
    }
    
    // Clean up empty lobbies
    for (const [lobbyId, lobby] of lobbies) {
        if (lobby.players.size === 0 || now - lobby.createdAt > INACTIVE_TIMEOUT) {
            lobbies.delete(lobbyId);
        }
    }
}, 60000); // Check every minute

module.exports = { handleWebSocket, MultiplayerGame, LobbyManager };
