// API endpoint for WebSocket upgrade
// api/socket.js

import { handleWebSocket } from './websocket.js';

export default function handler(req, res) {
    if (req.method === 'GET') {
        // For WebSocket upgrade requests
        if (req.headers.upgrade === 'websocket') {
            return handleWebSocketUpgrade(req, res);
        }
        
        // Regular HTTP request - return connection info
        res.status(200).json({
            message: 'Beyond 99 Days Multiplayer API',
            version: '1.0.0',
            endpoints: {
                websocket: '/api/socket',
                lobbies: '/api/lobbies',
                games: '/api/games'
            },
            status: 'active'
        });
    } else {
        res.status(405).json({ error: 'Method not allowed' });
    }
}

function handleWebSocketUpgrade(req, res) {
    // This would be handled by the WebSocket library
    // For Vercel, we'll use Socket.IO instead
    res.status(426).json({
        error: 'WebSocket upgrade not supported directly',
        suggestion: 'Use Socket.IO client instead',
        socketio_endpoint: '/api/socketio'
    });
}
