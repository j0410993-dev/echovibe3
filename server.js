const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

const MAX_USERS = 15;
let activeSessions = new Map(); // Track socket.id -> username
let userDatabase = new Map();   // Persistent during runtime: username -> password

// --- STATIC ROUTING FOR WEB & PWA ---

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Serve PWA configuration files to the browser
app.get('/manifest.json', (req, res) => {
    res.sendFile(path.join(__dirname, 'manifest.json'));
});

app.get('/sw.js', (req, res) => {
    res.sendFile(path.join(__dirname, 'sw.js'));
});


// --- AUTHENTICATION & SOCKET REAL-TIME ENGINE ---

io.on('connection', (socket) => {

    // Account Registration Handler
    socket.on('register', (data) => {
        const username = data.username.trim();
        const password = data.password.trim();

        if (!username || !password) {
            return socket.emit('auth-error', 'Name and password cannot be blank.');
        }
        if (userDatabase.has(username)) {
            return socket.emit('auth-error', 'This name is already taken.');
        }

        userDatabase.set(username, password);
        socket.emit('auth-success', { message: 'Account created! Logging you in...', username });
    });

    // Account Login Handler
    socket.on('login', (data) => {
        const username = data.username.trim();
        const password = data.password.trim();

        if (activeSessions.size >= MAX_USERS) {
            return socket.emit('auth-error', 'EchoVibe is full right now (15/15 users online).');
        }
        if (!userDatabase.has(username) || userDatabase.get(username) !== password) {
            return socket.emit('auth-error', 'Invalid username or password.');
        }
        
        // Prevent simultaneous duplicate active connections
        if (Array.from(activeSessions.values()).includes(username)) {
            return socket.emit('auth-error', 'This account is already logged in elsewhere.');
        }

        // Establish the active authenticated chat session
        activeSessions.set(socket.id, username);
        socket.emit('auth-success', { message: 'Successfully authenticated!', username });
        
        // Update user count and announce arrival globally
        io.emit('user-count', activeSessions.size);
        socket.broadcast.emit('system-message', `${username} joined the vibe.`);
    });

    // Chat Message Processing Pipeline
    socket.on('chat-message', (msgContent) => {
        const username = activeSessions.get(socket.id);
        if (!username) return; // Ignore unauthenticated data packets

        socket.broadcast.emit('chat-message', { user: username, msg: msgContent });
    });

    // Handle Client Disconnection
    socket.on('disconnect', () => {
        const username = activeSessions.get(socket.id);
        if (username) {
            activeSessions.delete(socket.id);
            io.emit('user-count', activeSessions.size);
            io.emit('system-message', `${username} left the room.`);
        }
    });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`EchoVibe running live on port ${PORT}`));
