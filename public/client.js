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
