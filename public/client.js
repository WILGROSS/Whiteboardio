const ws = new WebSocket(`ws://${location.host}`);

const status = document.createElement('p');
status.id = 'status';
document.body.insertBefore(status, document.querySelector('canvas'));

ws.addEventListener('open', () => {
  status.textContent = 'Connected';
  status.style.color = 'green';
});

ws.addEventListener('close', () => {
  status.textContent = 'Disconnected';
  status.style.color = 'red';
});

const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

canvas.width = 800;
canvas.height = 500;

let drawing = false;
let lastX = 0;
let lastY = 0;

function getPos(e) {
  const rect = canvas.getBoundingClientRect();
  return {
    x: e.clientX - rect.left,
    y: e.clientY - rect.top,
  };
}

function drawLine(x0, y0, x1, y1, color) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = 3;
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
  drawLine(lastX, lastY, x, y, '#333');
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mouseleave', () => { drawing = false; });
