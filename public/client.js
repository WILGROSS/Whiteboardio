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
  if (msg.type === 'draw') {
    drawLine(msg.x0, msg.y0, msg.x1, msg.y1, msg.color, msg.lineWidth);
  } else if (msg.type === 'clear') {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  } else if (msg.type === 'userjoined') {
    document.getElementById('user-count').textContent = `👤 ${msg.count}`;
    showToast(`${msg.name} joined`);
    appendMessage(null, `${msg.name} joined`, true);
  } else if (msg.type === 'userleft') {
    document.getElementById('user-count').textContent = `👤 ${msg.count}`;
    const name = msg.name || 'A user';
    showToast(`${name} left`);
    appendMessage(null, `${name} left`, true);
  } else if (msg.type === 'chat') {
    appendMessage(msg.name, msg.text);
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

function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

let drawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#1a1a1a';
let erasing = false;

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
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function drawLine(x0, y0, x1, y1, color, lineWidth = 3) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = lineWidth;
  ctx.lineCap = 'round';
  ctx.stroke();
}

canvas.addEventListener('mousedown', (e) => {
  drawing = true;
  const { x, y } = getPos(e);
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const { x, y } = getPos(e);
  const color = erasing ? '#ffffff' : currentColor;
  const lineWidth = erasing ? Number(thicknessSlider.value) * 4 : Number(thicknessSlider.value);
  drawLine(lastX, lastY, x, y, color, lineWidth);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'draw', x0: lastX, y0: lastY, x1: x, y1: y, color, lineWidth }));
  }
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mouseleave', () => { drawing = false; });

document.getElementById('clear').addEventListener('click', () => {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  if (ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify({ type: 'clear' }));
  }
});

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
