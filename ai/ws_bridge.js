#!/usr/bin/env node
// Termux WebSocket bridge for Ollama agents
import WebSocket, { WebSocketServer } from 'ws';
import fs from 'fs';

const PORT = 11434;
const server = new WebSocketServer({ port: PORT });

const tokenLogFile = './token_log.json';
if (!fs.existsSync(tokenLogFile)) fs.writeFileSync(tokenLogFile, JSON.stringify([]));

let clients = [];

server.on('connection', (ws) => {
  clients.push(ws);
  ws.on('message', async (msg) => {
    try {
      const data = JSON.parse(msg);

      // --- Neuro logging ---
      const tokens = data.tokens || [];
      if (tokens.length > 0) {
        const log = JSON.parse(fs.readFileSync(tokenLogFile));
        log.push(...tokens);
        fs.writeFileSync(tokenLogFile, JSON.stringify(log, null, 2));
      }

      // --- Core agent processing ---
      // Only core + loop + 2244 + code + coin respond
      if (!data.from || data.from === 'neuro') return;

      // Here you would call your local Ollama agents
      // Example: pseudo-response
      const response = {
        id: data.id || Date.now(),
        text: `✅ [Agent Response] Received: ${data.text?.slice(0, 50)}...`,
        tokens: data.text?.split(/\s+/) || [],
      };

      ws.send(JSON.stringify(response));
    } catch (err) {
      console.error('Error processing message', err);
    }
  });

  ws.on('close', () => {
    clients = clients.filter(c => c !== ws);
  });
});

console.log(`🚀 WebSocket server running on ws://localhost:${PORT}`);
