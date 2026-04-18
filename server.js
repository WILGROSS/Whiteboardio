const express = require('express');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

function broadcastAll(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

wss.on('connection', (ws) => {
  ws.username = null;
  console.log('Client connected');

  ws.on('message', (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'setname') {
      ws.username = msg.name;
      broadcastAll({ type: 'userjoined', name: msg.name, count: wss.clients.size });
      return;
    }

    const broadcastToAll = msg.type === 'clear' || msg.type === 'chat';
    wss.clients.forEach((client) => {
      if (client.readyState === 1 && (broadcastToAll || client !== ws)) {
        client.send(data.toString());
      }
    });
  });

  ws.on('close', () => {
    console.log('Client disconnected');
    broadcastAll({ type: 'userleft', name: ws.username, count: wss.clients.size });
  });
});

server.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
