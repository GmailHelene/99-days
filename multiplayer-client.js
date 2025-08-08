// Multiplayer Client System
// multiplayer-client.js

class MultiplayerClient {
    constructor(game) {
        this.game = game;
        this.socket = null;
        this.isConnected = false;
        this.isMultiplayer = false;
        this.playerId = null;
        this.currentLobby = null;
        this.currentGameId = null;
        this.otherPlayers = new Map();
        this.chatMessages = [];
        this.maxChatMessages = 50;
        
        // Enhanced multiplayer features
        this.tradingOffers = new Map();
        this.playerStats = new Map();
        this.competitiveMode = false;
        this.coopMode = false;
        this.leaderboard = [];
        this.tradingHistory = [];
        
        // Auto-detect server URL
        this.serverUrl = window.location.origin;
        
        console.log('MultiplayerClient initialized with enhanced features:', this.serverUrl);
    }

    async connect() {
        try {
            // Load Socket.IO from CDN if not already loaded
            if (typeof io === 'undefined') {
                await this.loadSocketIO();
            }
            
            this.socket = io(this.serverUrl, {
                path: '/api/socketio',
                transports: ['websocket', 'polling'],
                upgrade: true,
                rememberUpgrade: true,
                timeout: 20000,
                forceNew: true
            });
            
            this.setupEventListeners();
            
            return new Promise((resolve, reject) => {
                const timeout = setTimeout(() => {
                    reject(new Error('Connection timeout'));
                }, 10000);
                
                this.socket.on('connection_established', (data) => {
                    clearTimeout(timeout);
                    this.playerId = data.playerId;
                    this.isConnected = true;
                    console.log('Connected to multiplayer server:', data);
                    resolve(data);
                });
                
                this.socket.on('connect_error', (error) => {
                    clearTimeout(timeout);
                    console.error('Connection failed:', error);
                    reject(error);
                });
            });
            
        } catch (error) {
            console.error('Failed to connect to multiplayer server:', error);
            throw error;
        }
    }

    async loadSocketIO() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.socket.io/4.7.5/socket.io.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }

    setupEventListeners() {
        if (!this.socket) return;
        
        this.socket.on('connect', () => {
            this.isConnected = true;
            console.log('Socket connected');
        });
        
        this.socket.on('disconnect', () => {
            this.isConnected = false;
            this.isMultiplayer = false;
            console.log('Socket disconnected');
            this.game.notifications.show('Disconnected from multiplayer server', 'error');
        });
        
        // Lobby events
        this.socket.on('lobby_created', (data) => {
            this.currentLobby = data.lobby;
            this.showLobbyInterface();
        });
        
        this.socket.on('lobby_joined', (data) => {
            this.currentLobby = data.lobby;
            this.showLobbyInterface();
        });
        
        this.socket.on('player_joined', (data) => {
            if (this.currentLobby) {
                this.currentLobby.players.push(data.player);
                this.updateLobbyInterface();
                this.game.notifications.show(`${data.player.name} joined the lobby`, 'info');
            }
        });
        
        this.socket.on('player_left', (data) => {
            if (this.currentLobby) {
                this.currentLobby.players = this.currentLobby.players.filter(p => p.id !== data.playerId);
                this.updateLobbyInterface();
            }
        });
        
        this.socket.on('player_ready_changed', (data) => {
            if (this.currentLobby) {
                const player = this.currentLobby.players.find(p => p.id === data.playerId);
                if (player) {
                    player.isReady = data.isReady;
                    this.updateLobbyInterface();
                }
            }
        });
        
        this.socket.on('game_starting', (data) => {
            this.currentGameId = data.gameId;
            this.isMultiplayer = true;
            this.hideLobbyInterface();
            this.game.notifications.show('Multiplayer game starting!', 'success');
            
            // Initialize other players
            if (data.gameState && data.gameState.players) {
                data.gameState.players.forEach(player => {
                    if (player.id !== this.playerId) {
                        this.otherPlayers.set(player.id, player);
                    }
                });
            }
        });
        
        // Game events
        this.socket.on('player_update', (data) => {
            if (data.playerId !== this.playerId) {
                this.otherPlayers.set(data.playerId, {
                    ...this.otherPlayers.get(data.playerId),
                    ...data.playerData
                });
            }
        });
        
        this.socket.on('player_disconnected', (data) => {
            this.otherPlayers.delete(data.playerId);
            this.game.notifications.show('A player disconnected', 'warning');
        });
        
        this.socket.on('resource_collected', (data) => {
            if (data.playerId !== this.playerId) {
                // Show particle effect for other player's resource collection
                this.showResourceParticle(data.position, data.resource);
            }
        });
        
        this.socket.on('chat_message', (data) => {
            this.addChatMessage(data);
        });
        
        this.socket.on('public_lobbies', (data) => {
            this.showPublicLobbies(data.lobbies);
        });
        
        this.socket.on('error', (data) => {
            console.error('Multiplayer error:', data);
            this.game.notifications.show(data.error || 'Multiplayer error occurred', 'error');
        });
    }

    createLobby(config) {
        if (!this.isConnected) {
            this.game.notifications.show('Not connected to multiplayer server', 'error');
            return;
        }
        
        this.socket.emit('create_lobby', {
            playerName: config.playerName || 'Host',
            maxPlayers: config.maxPlayers || 4,
            worldType: config.worldType || 'forest',
            gameMode: config.gameMode || 'cooperative',
            isPrivate: config.isPrivate || false
        });
    }

    joinLobby(lobbyId, playerName) {
        if (!this.isConnected) {
            this.game.notifications.show('Not connected to multiplayer server', 'error');
            return;
        }
        
        this.socket.emit('join_lobby', {
            lobbyId,
            playerName: playerName || 'Player'
        });
    }

    leaveLobby() {
        if (this.socket && this.currentLobby) {
            this.socket.emit('leave_lobby');
            this.currentLobby = null;
            this.hideLobbyInterface();
        }
    }

    toggleReady() {
        if (this.socket && this.currentLobby) {
            this.socket.emit('ready_toggle');
        }
    }

    startGame() {
        if (this.socket && this.currentLobby) {
            this.socket.emit('start_game');
        }
    }

    sendPlayerUpdate(playerData) {
        if (this.socket && this.isMultiplayer) {
            this.socket.emit('game_update', {
                playerData: {
                    position: playerData.position,
                    health: playerData.health,
                    hunger: playerData.hunger,
                    thirst: playerData.thirst,
                    energy: playerData.energy,
                    warmth: playerData.warmth,
                    level: playerData.level
                }
            });
        }
    }

    sendResourceCollected(resource, position) {
        if (this.socket && this.isMultiplayer) {
            this.socket.emit('resource_collected', {
                resource,
                position
            });
        }
    }

    sendChatMessage(message, playerName) {
        if (this.socket && (this.currentLobby || this.isMultiplayer)) {
            this.socket.emit('chat_message', {
                message,
                playerName
            });
        }
    }

    getPublicLobbies() {
        if (this.socket) {
            this.socket.emit('get_public_lobbies');
        }
    }

    showResourceParticle(position, resource) {
        // Create visual effect for other player's resource collection
        const particle = document.createElement('div');
        particle.style.position = 'absolute';
        particle.style.left = position.x + 'px';
        particle.style.top = position.y + 'px';
        particle.style.fontSize = '24px';
        particle.style.pointerEvents = 'none';
        particle.style.zIndex = '1000';
        particle.textContent = this.getResourceIcon(resource);
        particle.classList.add('particle');
        
        document.body.appendChild(particle);
        
        setTimeout(() => {
            if (particle.parentNode) {
                particle.parentNode.removeChild(particle);
            }
        }, 2000);
    }

    getResourceIcon(resource) {
        const icons = {
            wood: '🌲',
            stone: '🪨',
            berries: '🫐',
            water: '💧',
            mushrooms: '🍄'
        };
        return icons[resource] || '📦';
    }

    addChatMessage(messageData) {
        this.chatMessages.push(messageData);
        if (this.chatMessages.length > this.maxChatMessages) {
            this.chatMessages = this.chatMessages.slice(-this.maxChatMessages);
        }
        this.updateChatInterface();
    }

    renderOtherPlayers(ctx) {
        if (!this.isMultiplayer) return;
        
        for (const [playerId, player] of this.otherPlayers) {
            if (player.position) {
                // Draw other player
                ctx.save();
                
                // Player body
                ctx.fillStyle = '#4a90e2';
                ctx.beginPath();
                ctx.arc(player.position.x, player.position.y, 15, 0, Math.PI * 2);
                ctx.fill();
                
                // Player name
                ctx.fillStyle = 'white';
                ctx.font = '12px Arial';
                ctx.textAlign = 'center';
                ctx.fillText(player.name || 'Player', player.position.x, player.position.y - 25);
                
                // Health bar
                const barWidth = 30;
                const barHeight = 4;
                const healthPercent = (player.health || 100) / 100;
                
                ctx.fillStyle = 'rgba(0,0,0,0.5)';
                ctx.fillRect(player.position.x - barWidth/2, player.position.y - 35, barWidth, barHeight);
                
                ctx.fillStyle = healthPercent > 0.5 ? '#4CAF50' : healthPercent > 0.25 ? '#FF9800' : '#F44336';
                ctx.fillRect(player.position.x - barWidth/2, player.position.y - 35, barWidth * healthPercent, barHeight);
                
                ctx.restore();
            }
        }
    }

    showMultiplayerMenu() {
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        menu.innerHTML = `
            <h1>🌐 Multiplayer</h1>
            <div style="margin-bottom: 20px;">
                <input type="text" id="playerNameInput" placeholder="Enter your name" 
                       style="width: 100%; padding: 10px; margin-bottom: 10px; border-radius: 5px; border: 1px solid #ccc;">
            </div>
            <button class="menu-button" onclick="window.game.multiplayer.showCreateLobby()">🎮 Create Lobby</button>
            <button class="menu-button" onclick="window.game.multiplayer.showJoinLobby()">🔍 Join Lobby</button>
            <button class="menu-button" onclick="window.game.multiplayer.getPublicLobbies()">📋 Browse Lobbies</button>
            <button class="menu-button" onclick="window.game.showMainMenu()">⬅️ Back to Main Menu</button>
        `;
    }

    showCreateLobby() {
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        menu.innerHTML = `
            <h1>🎮 Create Lobby</h1>
            <div style="text-align: left; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px;">
                    Player Name:
                    <input type="text" id="hostNameInput" placeholder="Your name" style="width: 100%; padding: 8px; margin-top: 5px;">
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    Max Players:
                    <select id="maxPlayersSelect" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="2">2 Players</option>
                        <option value="3">3 Players</option>
                        <option value="4" selected>4 Players</option>
                    </select>
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    World Type:
                    <select id="worldTypeSelect" style="width: 100%; padding: 8px; margin-top: 5px;">
                        <option value="forest">🌲 Forest</option>
                        <option value="mountain">⛰️ Mountain</option>
                        <option value="desert">🏜️ Desert</option>
                        <option value="island">🏝️ Island</option>
                    </select>
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    <input type="checkbox" id="privateCheckbox"> Private Lobby
                </label>
            </div>
            <button class="menu-button" onclick="window.game.multiplayer.doCreateLobby()">✅ Create Lobby</button>
            <button class="menu-button" onclick="window.game.multiplayer.showMultiplayerMenu()">⬅️ Back</button>
        `;
    }

    doCreateLobby() {
        const playerName = document.getElementById('hostNameInput').value.trim();
        const maxPlayers = parseInt(document.getElementById('maxPlayersSelect').value);
        const worldType = document.getElementById('worldTypeSelect').value;
        const isPrivate = document.getElementById('privateCheckbox').checked;
        
        if (!playerName) {
            this.game.notifications.show('Please enter your name', 'error');
            return;
        }
        
        this.createLobby({
            playerName,
            maxPlayers,
            worldType,
            isPrivate
        });
    }

    showJoinLobby() {
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        menu.innerHTML = `
            <h1>🔍 Join Lobby</h1>
            <div style="text-align: left; margin-bottom: 20px;">
                <label style="display: block; margin-bottom: 10px;">
                    Player Name:
                    <input type="text" id="joinNameInput" placeholder="Your name" style="width: 100%; padding: 8px; margin-top: 5px;">
                </label>
                <label style="display: block; margin-bottom: 10px;">
                    Lobby ID:
                    <input type="text" id="lobbyIdInput" placeholder="Enter lobby ID" style="width: 100%; padding: 8px; margin-top: 5px;">
                </label>
            </div>
            <button class="menu-button" onclick="window.game.multiplayer.doJoinLobby()">✅ Join Lobby</button>
            <button class="menu-button" onclick="window.game.multiplayer.showMultiplayerMenu()">⬅️ Back</button>
        `;
    }

    doJoinLobby() {
        const playerName = document.getElementById('joinNameInput').value.trim();
        const lobbyId = document.getElementById('lobbyIdInput').value.trim();
        
        if (!playerName || !lobbyId) {
            this.game.notifications.show('Please enter both name and lobby ID', 'error');
            return;
        }
        
        this.joinLobby(lobbyId, playerName);
    }

    showPublicLobbies(lobbies) {
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        let lobbiesHTML = '';
        if (lobbies.length === 0) {
            lobbiesHTML = '<p style="text-align: center; color: #ccc;">No public lobbies available</p>';
        } else {
            lobbiesHTML = lobbies.map(lobby => `
                <div style="background: rgba(255,255,255,0.1); padding: 15px; margin: 10px 0; border-radius: 10px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong>${lobby.hostName}'s Lobby</strong><br>
                            <small>${lobby.worldType} | ${lobby.playerCount}/${lobby.maxPlayers} players</small>
                        </div>
                        <button class="menu-button" style="width: auto; margin: 0; padding: 8px 15px;" 
                                onclick="window.game.multiplayer.quickJoinLobby('${lobby.id}')">Join</button>
                    </div>
                </div>
            `).join('');
        }
        
        menu.innerHTML = `
            <h1>📋 Public Lobbies</h1>
            <div style="max-height: 300px; overflow-y: auto; margin-bottom: 20px;">
                ${lobbiesHTML}
            </div>
            <button class="menu-button" onclick="window.game.multiplayer.getPublicLobbies()">🔄 Refresh</button>
            <button class="menu-button" onclick="window.game.multiplayer.showMultiplayerMenu()">⬅️ Back</button>
        `;
    }

    quickJoinLobby(lobbyId) {
        const playerName = prompt('Enter your name:');
        if (playerName) {
            this.joinLobby(lobbyId, playerName);
        }
    }

    showLobbyInterface() {
        if (!this.currentLobby) return;
        
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        this.updateLobbyInterface();
    }

    updateLobbyInterface() {
        if (!this.currentLobby) return;
        
        const menu = document.getElementById('gameMenu');
        if (!menu) return;
        
        const isHost = this.currentLobby.hostPlayerId === this.playerId;
        const myPlayer = this.currentLobby.players.find(p => p.id === this.playerId);
        const allReady = this.currentLobby.players.every(p => p.isReady);
        
        const playersHTML = this.currentLobby.players.map(player => `
            <div style="display: flex; justify-content: space-between; align-items: center; padding: 8px; margin: 5px 0; background: rgba(255,255,255,0.1); border-radius: 5px;">
                <span>${player.name} ${player.isHost ? '👑' : ''}</span>
                <span>${player.isReady ? '✅ Ready' : '⏳ Not Ready'}</span>
            </div>
        `).join('');
        
        menu.innerHTML = `
            <h1>🎮 Lobby</h1>
            <div style="margin-bottom: 15px;">
                <p><strong>Lobby ID:</strong> ${this.currentLobby.id}</p>
                <p><strong>World:</strong> ${this.currentLobby.config.worldType}</p>
                <p><strong>Players:</strong> ${this.currentLobby.players.length}/${this.currentLobby.config.maxPlayers}</p>
            </div>
            <div style="max-height: 200px; overflow-y: auto; margin-bottom: 15px;">
                ${playersHTML}
            </div>
            <div style="margin-bottom: 15px;">
                <button class="menu-button" onclick="window.game.multiplayer.toggleReady()">
                    ${myPlayer?.isReady ? '❌ Not Ready' : '✅ Ready Up'}
                </button>
                ${isHost ? `
                    <button class="menu-button" onclick="window.game.multiplayer.startGame()" 
                            ${!allReady ? 'style="opacity: 0.5;" disabled' : ''}>
                        🚀 Start Game
                    </button>
                ` : ''}
            </div>
            <button class="menu-button" onclick="window.game.multiplayer.leaveLobby()">🚪 Leave Lobby</button>
        `;
    }

    hideLobbyInterface() {
        // This will be handled by the main game when starting
    }

    updateChatInterface() {
        // Implementation for chat interface updates
        // This would show recent chat messages in a UI panel
    }

    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
            this.isConnected = false;
            this.isMultiplayer = false;
            this.currentLobby = null;
            this.currentGameId = null;
            this.otherPlayers.clear();
        }
    }

    // Enhanced Trading System
    initiateTradeOffer(targetPlayerId, offerItems, requestItems) {
        if (!this.isConnected || !this.socket) return;
        
        const tradeOffer = {
            id: `trade_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            fromPlayerId: this.playerId,
            toPlayerId: targetPlayerId,
            offerItems: offerItems,
            requestItems: requestItems,
            timestamp: Date.now(),
            status: 'pending'
        };
        
        this.socket.emit('trade_offer', tradeOffer);
        this.tradingOffers.set(tradeOffer.id, tradeOffer);
        
        this.game.notifications.show(`📤 Handelsforespørsel sendt!`, 'info', 3000);
    }

    acceptTradeOffer(tradeId) {
        if (!this.isConnected || !this.socket) return;
        
        this.socket.emit('trade_accept', { tradeId });
        this.game.notifications.show(`✅ Handel akseptert!`, 'success', 3000);
    }

    rejectTradeOffer(tradeId) {
        if (!this.isConnected || !this.socket) return;
        
        this.socket.emit('trade_reject', { tradeId });
        this.tradingOffers.delete(tradeId);
        this.game.notifications.show(`❌ Handel avvist`, 'info', 2000);
    }

    showTradingInterface() {
        const tradingPanel = document.createElement('div');
        tradingPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(20px);
            border: 2px solid #f39c12;
            border-radius: 20px;
            padding: 30px;
            z-index: 15000;
            max-width: 90vw;
            max-height: 80vh;
            overflow-y: auto;
            color: white;
        `;

        tradingPanel.innerHTML = `
            <h2 style="color: #f39c12; text-align: center; margin-bottom: 20px;">💰 Trading System</h2>
            
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 20px;">
                <div>
                    <h3>🎒 Dine Items</h3>
                    <div id="playerItems" style="max-height: 200px; overflow-y: auto;">
                        ${this.renderPlayerItems()}
                    </div>
                </div>
                <div>
                    <h3>👥 Andre Spillere</h3>
                    <div id="otherPlayers" style="max-height: 200px; overflow-y: auto;">
                        ${this.renderOtherPlayersForTrading()}
                    </div>
                </div>
            </div>
            
            <div id="activeOffers" style="margin: 20px 0;">
                <h3>📋 Aktive Handelstilbud</h3>
                ${this.renderActiveTradeOffers()}
            </div>
            
            <div style="text-align: center;">
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #e74c3c; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Lukk
                </button>
            </div>
        `;

        document.body.appendChild(tradingPanel);
    }

    renderPlayerItems() {
        if (!this.game.player || !this.game.player.inventory) return '<p>Ingen items</p>';
        
        let html = '<div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(60px, 1fr)); gap: 8px;">';
        
        for (const [itemType, quantity] of Object.entries(this.game.player.inventory)) {
            if (quantity > 0) {
                html += `
                    <div onclick="this.classList.toggle('selected')" 
                         data-item="${itemType}" 
                         data-quantity="${quantity}"
                         style="background: rgba(255,255,255,0.1); border: 2px solid transparent; border-radius: 8px; padding: 8px; text-align: center; cursor: pointer; transition: all 0.2s;">
                        <div style="font-size: 24px;">${this.getItemIcon(itemType)}</div>
                        <div style="font-size: 12px;">${quantity}</div>
                    </div>
                `;
            }
        }
        
        html += '</div>';
        return html;
    }

    renderOtherPlayersForTrading() {
        let html = '';
        this.otherPlayers.forEach((player, playerId) => {
            html += `
                <div onclick="this.selectPlayer('${playerId}')" 
                     style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin: 8px 0; cursor: pointer; transition: all 0.2s;">
                    <div style="font-weight: bold;">👤 ${player.name}</div>
                    <div style="font-size: 12px; color: #ccc;">Level ${player.level} • ${player.status}</div>
                </div>
            `;
        });
        return html || '<p>Ingen andre spillere</p>';
    }

    renderActiveTradeOffers() {
        let html = '';
        this.tradingOffers.forEach((offer, tradeId) => {
            if (offer.status === 'pending') {
                const isIncoming = offer.toPlayerId === this.playerId;
                html += `
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 10px; margin: 10px 0;">
                        <div style="font-weight: bold; color: ${isIncoming ? '#27ae60' : '#f39c12'};">
                            ${isIncoming ? '📥 Innkommende' : '📤 Utgående'} Handel
                        </div>
                        <div style="margin: 8px 0;">
                            <strong>Tilbyr:</strong> ${this.formatTradeItems(offer.offerItems)}
                        </div>
                        <div style="margin: 8px 0;">
                            <strong>Ønsker:</strong> ${this.formatTradeItems(offer.requestItems)}
                        </div>
                        ${isIncoming ? `
                            <div style="margin-top: 10px;">
                                <button onclick="window.game.multiplayerClient.acceptTradeOffer('${tradeId}')" 
                                        style="background: #27ae60; color: white; border: none; padding: 8px 16px; border-radius: 5px; margin-right: 8px; cursor: pointer;">
                                    ✅ Aksepter
                                </button>
                                <button onclick="window.game.multiplayerClient.rejectTradeOffer('${tradeId}')" 
                                        style="background: #e74c3c; color: white; border: none; padding: 8px 16px; border-radius: 5px; cursor: pointer;">
                                    ❌ Avvis
                                </button>
                            </div>
                        ` : ''}
                    </div>
                `;
            }
        });
        
        return html || '<p>Ingen aktive handelstilbud</p>';
    }

    formatTradeItems(items) {
        return items.map(item => `${this.getItemIcon(item.type)} ${item.quantity}`).join(', ');
    }

    getItemIcon(itemType) {
        const icons = {
            wood: '🪵',
            stone: '🪨',
            berries: '🫐',
            water: '💧',
            mushrooms: '🍄',
            meat: '🥩',
            fish: '🐟',
            tools: '🔨',
            weapons: '⚔️'
        };
        return icons[itemType] || '📦';
    }

    // Competitive Mode Features
    updatePlayerStats(stats) {
        this.playerStats.set(stats.playerId, stats);
        if (this.competitiveMode) {
            this.updateLeaderboard();
        }
    }

    updateLeaderboard() {
        this.leaderboard = Array.from(this.playerStats.values())
            .sort((a, b) => b.score - a.score)
            .slice(0, 10);
    }

    showLeaderboard() {
        const leaderboardPanel = document.createElement('div');
        leaderboardPanel.style.cssText = `
            position: fixed;
            top: 50%;
            left: 50%;
            transform: translate(-50%, -50%);
            background: rgba(26, 26, 46, 0.98);
            backdrop-filter: blur(20px);
            border: 2px solid #e74c3c;
            border-radius: 20px;
            padding: 30px;
            z-index: 15000;
            max-width: 400px;
            color: white;
        `;

        let leaderboardHTML = `
            <h2 style="color: #e74c3c; text-align: center; margin-bottom: 20px;">🏆 Leaderboard</h2>
        `;

        this.leaderboard.forEach((player, index) => {
            const medal = index === 0 ? '🥇' : index === 1 ? '🥈' : index === 2 ? '🥉' : `${index + 1}.`;
            leaderboardHTML += `
                <div style="background: rgba(255,255,255,0.1); padding: 12px; border-radius: 8px; margin: 8px 0; display: flex; justify-content: space-between; align-items: center;">
                    <div>
                        <span style="font-weight: bold; margin-right: 10px;">${medal}</span>
                        <span>${player.name}</span>
                    </div>
                    <div style="text-align: right;">
                        <div style="font-weight: bold; color: #f39c12;">⭐ ${player.score}</div>
                        <div style="font-size: 12px; color: #ccc;">Dag ${player.day}</div>
                    </div>
                </div>
            `;
        });

        leaderboardPanel.innerHTML = leaderboardHTML + `
            <div style="text-align: center; margin-top: 20px;">
                <button onclick="this.parentElement.parentElement.remove()" 
                        style="background: #e74c3c; color: white; border: none; padding: 12px 24px; border-radius: 8px; cursor: pointer; font-size: 16px;">
                    Lukk
                </button>
            </div>
        `;

        document.body.appendChild(leaderboardPanel);
    }

    // Co-op Mode Features
    shareResources(targetPlayerId, resources) {
        if (!this.isConnected || !this.socket || !this.coopMode) return;
        
        this.socket.emit('share_resources', {
            targetPlayerId,
            resources,
            fromPlayerId: this.playerId
        });
        
        this.game.notifications.show(`🤝 Ressurser delt med ${targetPlayerId}`, 'success', 3000);
    }

    // Enhanced Chat with Commands
    sendChatMessage(message) {
        if (!this.isConnected || !this.socket) return;
        
        // Check for special commands
        if (message.startsWith('/')) {
            this.handleChatCommand(message);
            return;
        }
        
        const chatMessage = {
            id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            playerId: this.playerId,
            playerName: this.game.player?.name || 'Player',
            message: message.trim(),
            timestamp: Date.now(),
            type: 'chat'
        };
        
        this.socket.emit('chat_message', chatMessage);
        this.addChatMessage(chatMessage);
    }

    handleChatCommand(command) {
        const [cmd, ...args] = command.slice(1).split(' ');
        
        switch (cmd.toLowerCase()) {
            case 'trade':
                if (args.length > 0) {
                    this.showTradingInterface();
                }
                break;
            case 'stats':
                this.showPlayerStats();
                break;
            case 'leaderboard':
                this.showLeaderboard();
                break;
            case 'help':
                this.showChatHelp();
                break;
            default:
                this.addChatMessage({
                    type: 'system',
                    message: `Ukjent kommando: /${cmd}. Skriv /help for hjelp.`,
                    timestamp: Date.now()
                });
        }
    }

    showChatHelp() {
        const helpMessage = {
            type: 'system',
            message: `
📋 Chat Kommandoer:
/trade - Åpne handelsvindu
/stats - Vis spillerstatistikk
/leaderboard - Vis topplisten
/help - Vis denne hjelpen
            `,
            timestamp: Date.now()
        };
        this.addChatMessage(helpMessage);
    }
}

// Export for use in main game
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MultiplayerClient;
} else {
    window.MultiplayerClient = MultiplayerClient;
}
