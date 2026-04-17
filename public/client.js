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

function drawLine(x0, y0, x1, y1, color) {
  ctx.beginPath();
  ctx.moveTo(x0, y0);
  ctx.lineTo(x1, y1);
  ctx.strokeStyle = color;
  ctx.lineWidth = erasing ? 20 : 3;
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
  drawLine(lastX, lastY, x, y, erasing ? '#ffffff' : currentColor);
  lastX = x;
  lastY = y;
});

canvas.addEventListener('mouseup', () => { drawing = false; });
canvas.addEventListener('mouseleave', () => { drawing = false; });
