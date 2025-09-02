// Serveur WebSocket pour GoalCraftAI
const WebSocket = require('ws');
const { MongoClient } = require('mongodb');
require('dotenv').config();

const PORT = process.env.PORT || 3002;
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/goalcraft';

// Connexion MongoDB
let db;
MongoClient.connect(MONGODB_URI)
  .then(client => {
    console.log('✅ Connected to MongoDB');
    db = client.db();
  })
  .catch(err => {
    console.error('❌ MongoDB connection error:', err);
    process.exit(1);
  });

// Créer le serveur WebSocket
const wss = new WebSocket.Server({ 
  port: PORT,
  perMessageDeflate: {
    zlibDeflateOptions: {
      chunkSize: 1024,
      memLevel: 7,
      level: 3
    },
    zlibInflateOptions: {
      chunkSize: 10 * 1024
    },
    clientNoContextTakeover: true,
    serverNoContextTakeover: true,
    serverMaxWindowBits: 10,
    concurrencyLimit: 10,
    threshold: 1024
  }
});

// Map pour stocker les connexions par conversation
const connections = new Map();

wss.on('connection', (ws, req) => {
  console.log('🔌 New WebSocket connection');
  
  let conversationId = null;
  
  ws.on('message', async (message) => {
    try {
      const data = JSON.parse(message);
      console.log('📨 Received:', data.type);
      
      switch (data.type) {
        case 'join':
          conversationId = data.conversationId;
          if (!connections.has(conversationId)) {
            connections.set(conversationId, new Set());
          }
          connections.get(conversationId).add(ws);
          
          ws.send(JSON.stringify({
            type: 'joined',
            conversationId
          }));
          break;
          
        case 'objective_update':
          // Broadcast to all clients in the same conversation
          if (conversationId && connections.has(conversationId)) {
            const message = JSON.stringify({
              type: 'objective_update',
              data: data.data
            });
            
            connections.get(conversationId).forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
          }
          break;
          
        case 'skill_tree_update':
          // Broadcast skill tree updates
          if (conversationId && connections.has(conversationId)) {
            const message = JSON.stringify({
              type: 'skill_tree_update',
              data: data.data
            });
            
            connections.get(conversationId).forEach(client => {
              if (client.readyState === WebSocket.OPEN) {
                client.send(message);
              }
            });
          }
          break;
          
        case 'ping':
          ws.send(JSON.stringify({ type: 'pong' }));
          break;
          
        default:
          console.log('Unknown message type:', data.type);
      }
    } catch (error) {
      console.error('❌ Message processing error:', error);
      ws.send(JSON.stringify({
        type: 'error',
        message: 'Invalid message format'
      }));
    }
  });
  
  ws.on('close', () => {
    console.log('🔌 WebSocket connection closed');
    // Remove from connections
    if (conversationId && connections.has(conversationId)) {
      connections.get(conversationId).delete(ws);
      if (connections.get(conversationId).size === 0) {
        connections.delete(conversationId);
      }
    }
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Send initial connection success
  ws.send(JSON.stringify({
    type: 'connected',
    message: 'WebSocket connection established'
  }));
});

// Health check endpoint via HTTP
const http = require('http');
const healthServer = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ 
      status: 'healthy',
      connections: connections.size,
      uptime: process.uptime()
    }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

healthServer.listen(PORT + 1, () => {
  console.log(`📊 Health check server running on port ${PORT + 1}`);
});

console.log(`🚀 WebSocket server running on port ${PORT}`);

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM received, closing connections...');
  wss.clients.forEach(client => {
    client.close();
  });
  wss.close(() => {
    console.log('WebSocket server closed');
    process.exit(0);
  });
});