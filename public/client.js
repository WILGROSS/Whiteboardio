const protocol = location.protocol === 'https:' ? 'wss' : 'ws';
const ws = new WebSocket(`${protocol}://${location.host}`);

const status = document.getElementById('status');

ws.addEventListener('open', () => {
  status.textContent = 'Connected';
  status.style.color = 'green';
});

ws.addEventListener('close', () => {
  status.textContent = 'Disconnected';
  status.style.color = 'red';
});

ws.addEventListener('message', (event) => {
  const msg = JSON.parse(event.data);
  if (msg.type === 'history') {
    drawHistory = msg.events;
    redraw();
  } else if (msg.type === 'draw') {
    drawHistory.push(msg);
    applyTransform();
    renderLine(msg.x0, msg.y0, msg.x1, msg.y1, msg.color, msg.lineWidth);
  } else if (msg.type === 'clear') {
    drawHistory = [];
    redraw();
  } else if (msg.type === 'userjoined') {
    document.getElementById('user-count').innerHTML = `<span class="material-symbols-outlined">group</span> ${msg.count}`;
    showToast(`${msg.name} joined`);
    appendMessage(null, `${msg.name} joined`, true);
  } else if (msg.type === 'userleft') {
    document.getElementById('user-count').innerHTML = `<span class="material-symbols-outlined">group</span> ${msg.count}`;
    const name = msg.name || 'A user';
    showToast(`${name} left`);
    appendMessage(null, `${name} left`, true);
    removeCursor(name);
  } else if (msg.type === 'cursor') {
    const cursor = getOrCreateCursor(msg.name);
    cursor.x = msg.x;
    cursor.y = msg.y;
    updateCursorEl(cursor);
  } else if (msg.type === 'chat') {
    appendMessage(msg.name, msg.text);
    if (!chatPanel.classList.contains('open')) {
      chatTab.classList.add('unread');
    }
  }
});

// Toast
const toast = document.getElementById('toast');
let toastTimer = null;

function showToast(message) {
  toast.textContent = message;
  toast.classList.add('visible');
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => toast.classList.remove('visible'), 3000);
}

// Canvas
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Transform state (pan + zoom)
const transform = { x: 0, y: 0, scale: 1 };
let drawHistory = [];

function applyTransform() {
  ctx.setTransform(transform.scale, 0, 0, transform.scale, transform.x, transform.y);
}

function screenToWorld(sx, sy) {
  return {
    x: (sx - transform.x) / transform.scale,
    y: (sy - transform.y) / transform.scale,
  };
}

function worldToScreen(wx, wy) {
  return {
    x: wx * transform.scale + transform.x,
    y: wy * transform.scale + transform.y,
  };
}

// Remote cursors
const remoteCursors = {};

function nameToColor(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return `hsl(${Math.abs(hash) % 360}, 70%, 50%)`;
}

function updateCursorEl(cursor) {
  const { x, y } = worldToScreen(cursor.x, cursor.y);
  cursor.el.style.transform = `translate(${x}px, ${y}px)`;
}

function updateAllCursors() {
  Object.values(remoteCursors).forEach(updateCursorEl);
}

function getOrCreateCursor(name) {
  if (remoteCursors[name]) return remoteCursors[name];
  const color = nameToColor(name);
  const el = document.createElement('div');
  el.className = 'cursor-wrapper';
  el.innerHTML = `<div class="cursor-dot" style="background:${color}"></div><span class="cursor-label" style="color:${color}">${name}</span>`;
  document.getElementById('cursors').appendChild(el);
  remoteCursors[name] = { x: 0, y: 0, color, el };
  return remoteCursors[name];
}

function removeCursor(name) {
  if (remoteCursors[name]) {
    remoteCursors[name].el.remove();
    delete remoteCursors[name];
  }
}

function redraw() {
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  applyTransform();
  drawHistory.forEach(ev => renderLine(ev.x0, ev.y0, ev.x1, ev.y1, ev.color, ev.lineWidth));
  updateAllCursors();
}

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  redraw();
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let drawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#1a1a1a';
let erasing = false;
let spaceDown = false;
let panning = false;
let panStart = { x: 0, y: 0 };
let panOrigin = { x: 0, y: 0 };

// Toolbar
const swatches = document.querySelectorAll('.swatch');
const eraserBtn = document.getElementById('eraser');
const thicknessSlider = document.getElementById('thickness');

swatches[0].classList.add('active');

swatches.forEach((swatch) => {
  swatch.addEventListener('click', () => {
    swatches.forEach((s) => s.classList.remove('active'));
    eraserBtn.classList.remove('active');
    swatch.classList.add('active');
    currentColor = swatch.dataset.color;
    erasing = false;
  });
});

eraserBtn.addEventListener('click', () => {
  swatches.forEach((s) => s.classList.remove('active'));
  eraserBtn.classList.add('active');
  erasing = true;
});

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
}

function resolveColor(color) {
  const li = lightColors.indexOf(color);
  if (li !== -1) return darkMode ? darkColors[li] : lightColors[li];
  const di = darkColors.indexOf(color);
  if (di !== -1) return darkMode ? darkColors[di] : lightColors[di];
  return color;
}

function renderLine(x0, y0, x1, y1, color, lineWidth) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = resolveColor(color);
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

// Space key → pan mode
window.addEventListener('keydown', (e) => {
  if (e.code === 'Space' && !e.target.matches('input, textarea')) {
    e.preventDefault();
    spaceDown = true;
    if (!panning) canvas.style.cursor = 'grab';
  }
});

window.addEventListener('keyup', (e) => {
  if (e.code === 'Space') {
    spaceDown = false;
    if (!panning) canvas.style.cursor = 'crosshair';
  }
});

// Scroll wheel → zoom centered on mouse
canvas.addEventListener('wheel', (e) => {
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  const mouseX = e.clientX - rect.left;
  const mouseY = e.clientY - rect.top;
  const factor = e.deltaY < 0 ? 1.1 : 0.9;
  const newScale = Math.min(Math.max(transform.scale * factor, 0.0125), 20);
  transform.x = mouseX - (mouseX - transform.x) * (newScale / transform.scale);
  transform.y = mouseY - (mouseY - transform.y) * (newScale / transform.scale);
  transform.scale = newScale;
  redraw();
}, { passive: false });

canvas.addEventListener('mousedown', (e) => {
  if (e.button === 1 || (e.button === 0 && spaceDown)) {
    e.preventDefault();
    panning = true;
    panStart = { x: e.clientX, y: e.clientY };
    panOrigin = { x: transform.x, y: transform.y };
    canvas.style.cursor = 'grabbing';
    return;
  }
  if (e.button === 0) {
    drawing = true;
    const { x, y } = getPos(e);
    lastX = x;
    lastY = y;
  }
});

let lastCursorSend = 0;

canvas.addEventListener('mousemove', (e) => {
  if (panning) {
    transform.x = panOrigin.x + (e.clientX - panStart.x);
    transform.y = panOrigin.y + (e.clientY - panStart.y);
    redraw();
    return;
  }

  const now = Date.now();
  if (username && ws.readyState === WebSocket.OPEN && now - lastCursorSend > 50) {
    const pos = getPos(e);
    ws.send(JSON.stringify({ type: 'cursor', x: pos.x, y: pos.y, name: username }));
    lastCursorSend = now;
  }

  if (!drawing) return;
  const { x, y } = getPos(e);
  const color = erasing ? getBgColor() : currentColor;
  const lineWidth = erasing ? Number(thicknessSlider.value) * 4 : Number(thicknessSlider.value);
  applyTransform();
  renderLine(lastX, lastY, x, y, color, lineWidth);
  const drawEvent = { type: 'draw', x0: lastX, y0: lastY, x1: x, y1: y, color, lineWidth };
  drawHistory.push(drawEvent);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(drawEvent));
  }
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', (e) => {
  if (panning) {
    panning = false;
    canvas.style.cursor = spaceDown ? 'grab' : 'crosshair';
    return;
  }
  drawing = false;
});

canvas.addEventListener('mouseleave', () => {
  drawing = false;
  if (panning) {
    panning = false;
    canvas.style.cursor = spaceDown ? 'grab' : 'crosshair';
  }
});

// Dark mode
const lightColors = ['#1a1a1a', '#e74c3c', '#e67e22', '#f1c40f', '#2ecc71', '#3498db', '#9b59b6', '#ffffff'];
const darkColors  = ['#f0f0f0', '#ff6b6b', '#ffa94d', '#ffe066', '#69db7c', '#74c0fc', '#b197fc', '#1a1a1e'];
let darkMode = false;

document.getElementById('darkmode-toggle').addEventListener('click', () => {
  darkMode = !darkMode;
  document.body.classList.toggle('dark', darkMode);
  document.getElementById('darkmode-toggle').innerHTML = `<span class="material-symbols-outlined">${darkMode ? 'light_mode' : 'dark_mode'}</span>`;

  const from = darkMode ? lightColors : darkColors;
  const to   = darkMode ? darkColors  : lightColors;

  swatches.forEach((swatch, i) => {
    swatch.dataset.color = to[i];
    swatch.style.background = to[i];
    if (currentColor === from[i]) currentColor = to[i];
  });

  redraw();
});

function getBgColor() {
  return darkMode ? '#1a1a1e' : '#ffffff';
}

// Join overlay
const overlay = document.getElementById('overlay');
const joinInput = document.getElementById('join-input');
const joinSubmit = document.getElementById('join-submit');

let username = null;

function join() {
  const name = joinInput.value.trim();
  if (!name) return;
  username = name;
  overlay.classList.add('hidden');
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'setname', name: username }));
  }
}

joinSubmit.addEventListener('click', join);
joinInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') join();
});

// Chat
const chatPanel = document.getElementById('chat-panel');
const chatTab = document.getElementById('chat-tab');
const chatMessages = document.getElementById('chat-messages');
const chatInput = document.getElementById('chat-input');
const chatSend = document.getElementById('chat-send');

chatTab.addEventListener('click', () => {
  chatPanel.classList.toggle('open');
  if (chatPanel.classList.contains('open')) {
    chatTab.classList.remove('unread');
  }
});

function appendMessage(name, text, system = false) {
  const el = document.createElement('div');
  el.classList.add('chat-message');
  if (system) {
    el.classList.add('system');
    el.textContent = text;
  } else {
    const author = document.createElement('span');
    author.classList.add('author');
    author.textContent = name + ':';
    el.appendChild(author);
    el.appendChild(document.createTextNode(' ' + text));
  }
  chatMessages.appendChild(el);
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

function sendChatMessage() {
  const text = chatInput.value.trim();
  if (!text || !username) return;
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'chat', name: username, text }));
  }
  chatInput.value = '';
}

chatSend.addEventListener('click', sendChatMessage);
chatInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') sendChatMessage();
});
