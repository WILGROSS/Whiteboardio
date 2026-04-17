const express = require('express');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

wss.on('connection', (ws) => {
  console.log('Client connected');

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());
    const isClear = msg.type === 'clear';
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && (isClear || client !== ws)) {
        client.send(data.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
