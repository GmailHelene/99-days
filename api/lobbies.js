// REST API for lobby management
// api/lobbies.js

let lobbies = new Map();

export default function handler(req, res) {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }
    
    switch (req.method) {
        case 'GET':
            if (req.query.public === 'true') {
                // Get public lobbies
                const publicLobbies = getPublicLobbies();
                res.status(200).json({
                    success: true,
                    lobbies: publicLobbies,
                    count: publicLobbies.length
                });
            } else if (req.query.id) {
                // Get specific lobby
                const lobby = lobbies.get(req.query.id);
                if (lobby) {
                    res.status(200).json({
                        success: true,
                        lobby: serializeLobby(lobby)
                    });
                } else {
                    res.status(404).json({
                        success: false,
                        error: 'Lobby not found'
                    });
                }
            } else {
                res.status(400).json({
                    success: false,
                    error: 'Missing parameters'
                });
            }
            break;
            
        case 'POST':
            // Create new lobby
            try {
                const { playerName, maxPlayers, worldType, gameMode, isPrivate } = req.body;
                
                if (!playerName) {
                    res.status(400).json({
                        success: false,
                        error: 'Player name is required'
                    });
                    return;
                }
                
                const lobbyId = 'lobby_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                const hostPlayerId = 'host_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
                
                const lobby = {
                    id: lobbyId,
                    hostPlayerId,
                    players: new Map(),
                    config: {
                        maxPlayers: maxPlayers || 4,
                        worldType: worldType || 'forest',
                        gameMode: gameMode || 'cooperative',
                        isPrivate: isPrivate || false
                    },
                    status: 'waiting',
                    createdAt: Date.now()
                };
                
                lobby.players.set(hostPlayerId, {
                    id: hostPlayerId,
                    name: playerName,
                    isHost: true,
                    isReady: false,
                    joinedAt: Date.now()
                });
                
                lobbies.set(lobbyId, lobby);
                
                res.status(201).json({
                    success: true,
                    lobby: serializeLobby(lobby),
                    hostPlayerId
                });
                
            } catch (error) {
                res.status(500).json({
                    success: false,
                    error: 'Failed to create lobby'
                });
            }
            break;
            
        case 'DELETE':
            // Delete lobby
            const { lobbyId, playerId } = req.query;
            
            if (!lobbyId || !playerId) {
                res.status(400).json({
                    success: false,
                    error: 'Missing lobbyId or playerId'
                });
                return;
            }
            
            const lobby = lobbies.get(lobbyId);
            if (!lobby) {
                res.status(404).json({
                    success: false,
                    error: 'Lobby not found'
                });
                return;
            }
            
            if (lobby.hostPlayerId !== playerId) {
                res.status(403).json({
                    success: false,
                    error: 'Only host can delete lobby'
                });
                return;
            }
            
            lobbies.delete(lobbyId);
            res.status(200).json({
                success: true,
                message: 'Lobby deleted'
            });
            break;
            
        default:
            res.status(405).json({
                success: false,
                error: 'Method not allowed'
            });
    }
}

function getPublicLobbies() {
    const publicLobbies = [];
    const now = Date.now();
    const MAX_AGE = 30 * 60 * 1000; // 30 minutes
    
    for (const lobby of lobbies.values()) {
        // Clean up old lobbies
        if (now - lobby.createdAt > MAX_AGE) {
            lobbies.delete(lobby.id);
            continue;
        }
        
        if (!lobby.config.isPrivate && lobby.status === 'waiting') {
            publicLobbies.push({
                id: lobby.id,
                hostName: lobby.players.get(lobby.hostPlayerId)?.name || 'Unknown',
                playerCount: lobby.players.size,
                maxPlayers: lobby.config.maxPlayers,
                worldType: lobby.config.worldType,
                gameMode: lobby.config.gameMode,
                createdAt: lobby.createdAt
            });
        }
    }
    
    return publicLobbies.sort((a, b) => b.createdAt - a.createdAt);
}

function serializeLobby(lobby) {
    return {
        id: lobby.id,
        hostPlayerId: lobby.hostPlayerId,
        players: Array.from(lobby.players.values()),
        config: lobby.config,
        status: lobby.status,
        createdAt: lobby.createdAt
    };
}
