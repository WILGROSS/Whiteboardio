const ws = new WebSocket(`ws://${location.host}`);

const status = document.createElement('p');
status.id = 'status';
document.body.insertBefore(status, document.querySelector('#toolbar'));

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
  }
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let drawing = false;
let lastX = 0;
let lastY = 0;
let currentColor = '#1a1a1a';
let erasing = false;

// Toolbar
const swatches = document.querySelectorAll('.swatch');
const eraserBtn = document.getElementById('eraser');

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
  const lineWidth = erasing ? 20 : 3;
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
