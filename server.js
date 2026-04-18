require('dotenv').config();

const express = require('express');
const path = require('path');
const http = require('http');
const { WebSocketServer } = require('ws');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3000;

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocketServer({ server });

let drawHistory = [];

async function loadHistory() {
  const { data, error } = await supabase
    .from('strokes')
    .select('*')
    .order('created_at', { ascending: true });

  if (error) {
    console.error('Failed to load history:', error.message);
    return;
  }

  drawHistory = data.map(row => ({
    type: 'draw',
    x0: row.x0,
    y0: row.y0,
    x1: row.x1,
    y1: row.y1,
    color: row.color,
    lineWidth: row.line_width,
  }));

  console.log(`Loaded ${drawHistory.length} strokes from Supabase`);
}

function broadcastAll(msg) {
  const data = JSON.stringify(msg);
  wss.clients.forEach((client) => {
    if (client.readyState === 1) client.send(data);
  });
}

wss.on('connection', (ws) => {
  ws.username = null;
  console.log('Client connected');

  ws.send(JSON.stringify({ type: 'history', events: drawHistory }));

  ws.on('message', async (data) => {
    const msg = JSON.parse(data.toString());

    if (msg.type === 'setname') {
      ws.username = msg.name;
      broadcastAll({ type: 'userjoined', name: msg.name, count: wss.clients.size });
      return;
    }

    if (msg.type === 'draw') {
      drawHistory.push(msg);
      supabase.from('strokes').insert({
        x0: msg.x0, y0: msg.y0,
        x1: msg.x1, y1: msg.y1,
        color: msg.color,
        line_width: msg.lineWidth,
      }).then(({ error }) => {
        if (error) console.error('Insert error:', error.message);
      });
    } else if (msg.type === 'clear') {
      drawHistory = [];
      supabase.from('strokes').delete().neq('id', 0).then(({ error }) => {
        if (error) console.error('Clear error:', error.message);
      });
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

loadHistory().then(() => {
  server.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
  });
});
