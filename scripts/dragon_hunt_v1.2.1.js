const areas = document.querySelectorAll('area[shape="circle"]');
const scoreSpan = document.getElementById('score');
const timerSpan = document.getElementById('timer');
const image = document.getElementById('mainImage');
const complete = document.getElementById('complete');
const game = document.getElementById('game');
const container = document.getElementById('game-container');
const frame = document.getElementById('game-frame');
let score = parseInt(localStorage.getItem('dragon_score')) || 0;
let timer = parseInt(localStorage.getItem('dragon_timer')) || 0;
let zoomLevel = 1;
let offsetX = 0, offsetY = 0;
let isPanning = false, startX = 0, startY = 0;
let velocityX = 0, velocityY = 0;
let momentumId = null;

scoreSpan.textContent = score;
timerSpan.textContent = formatTime(timer);

function formatTime(seconds) {
  const hrs = Math.floor(seconds / 3600);
  const mins = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;
  return [hrs, mins, secs]
    .map(unit => unit < 10 ? '0' + unit : unit)
    .join(':');
}

function zoom(factor) {
  zoomLevel = Math.max(0.5, Math.min(zoomLevel * factor, 5));
  applyTransform();
}

function resetZoom() {
  zoomLevel = 1;
  offsetX = 0;
  offsetY = 0;
  applyTransform();
}

function applyTransform() {
  container.style.transform = `scale(${zoomLevel}) translate(${offsetX}px, ${offsetY}px)`;
}

let interval = setInterval(() => {
  timer++;
  timerSpan.textContent = formatTime(timer);
  localStorage.setItem('dragon_timer', timer);
}, 1000);

areas.forEach(area => {
  if (area.dataset.found === 'true') return;

  area.addEventListener('click', (e) => {
    e.preventDefault();
    if (!area.dataset.found) {
      area.dataset.found = 'true';
      score++;
      scoreSpan.textContent = score;
      localStorage.setItem('dragon_score', score);

      const coords = area.coords.split(',');
      const x = parseInt(coords[0]);
      const y = parseInt(coords[1]);
      const r = parseInt(coords[2]);

      const marker = document.createElement('div');
      marker.className = 'marker';
      marker.style.width = `${r * 2}px`;
      marker.style.height = `${r * 2}px`;
      marker.style.left = `${x - r}px`;
      marker.style.top = `${y - r}px`;
      game.appendChild(marker);

      if (score === areas.length) {
        clearInterval(interval);
        complete.style.display = 'block';
        image.classList.add('faded');
        document.querySelectorAll('.marker').forEach(m => m.classList.add('hidden-marker'));
        localStorage.removeItem('dragon_score');
        localStorage.removeItem('dragon_timer');
      }
    }
  });
});

function resetGame() {
  localStorage.removeItem('dragon_score');
  localStorage.removeItem('dragon_timer');
  location.reload();
}

function startMomentumScroll() {
  cancelAnimationFrame(momentumId);
  momentumId = requestAnimationFrame(function step() {
    if (Math.abs(velocityX) > 0.1 || Math.abs(velocityY) > 0.1) {
      offsetX += velocityX / zoomLevel;
      offsetY += velocityY / zoomLevel;
      velocityX *= 0.95;
      velocityY *= 0.95;
      applyTransform();
      momentumId = requestAnimationFrame(step);
    }
  });
}

frame.addEventListener('mousedown', (e) => {
  isPanning = true;
  frame.style.cursor = 'grabbing';
  startX = e.clientX;
  startY = e.clientY;
  velocityX = 0;
  velocityY = 0;
  cancelAnimationFrame(momentumId);
});

frame.addEventListener('mouseup', (e) => {
  isPanning = false;
  frame.style.cursor = 'grab';
  startMomentumScroll();
});

frame.addEventListener('mouseleave', () => {
  isPanning = false;
  frame.style.cursor = 'grab';
});

frame.addEventListener('mousemove', (e) => {
  if (!isPanning) return;
  const dx = (e.clientX - startX);
  const dy = (e.clientY - startY);
  offsetX += dx / zoomLevel;
  offsetY += dy / zoomLevel;
  velocityX = dx;
  velocityY = dy;
  applyTransform();
  startX = e.clientX;
  startY = e.clientY;
});

frame.addEventListener('touchstart', (e) => {
  if (e.touches.length !== 1) return;
  isPanning = true;
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  cancelAnimationFrame(momentumId);
});

frame.addEventListener('touchend', () => {
  isPanning = false;
  startMomentumScroll();
});

frame.addEventListener('touchmove', (e) => {
  if (!isPanning || e.touches.length !== 1) return;
  const dx = e.touches[0].clientX - startX;
  const dy = e.touches[0].clientY - startY;
  offsetX += dx / zoomLevel;
  offsetY += dy / zoomLevel;
  velocityX = dx;
  velocityY = dy;
  applyTransform();
  startX = e.touches[0].clientX;
  startY = e.touches[0].clientY;
  e.preventDefault();
}, { passive: false });
