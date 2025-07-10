// Variables

const hotspots = [
  [1359,  342, 143], // Dragon 1
  [ 854, 1282,  28], // Dragon 2
  [ 320, 1180,  14], // Dragon 3
  [ 309,  902,  13], // Dragon 4
  [ 463,  748,  11], // Dragon 5
  [ 630,  917,  13], // Dragon 6
  [ 574,  664,  11], // Dragon 7
  [ 597,  551,   9], // Dragon 8
  [ 554,  491,   9], // Dragon 9
  [ 570,  337,  11], // Dragon 10
  [ 651,  509,  10], // Dragon 11
  [ 693,  747,  11], // Dragon 12
  [ 807,  791,  11], // Dragon 13
  [ 807,  711,  13], // Dragon 14
  [ 751,  563,   8], // Dragon 15
  [ 771,  474,  11], // Dragon 16
  [ 845,  588,  11], // Dragon 17
  [ 912,  921,  13], // Dragon 18
  [ 999,  765,  14], // Dragon 19
  [ 986,  546,  10], // Dragon 20
  [ 955,  501,   7], // Dragon 21
  [1147,  921,  11], // Dragon 22
  [1169,  799,  11], // Dragon 23
  [1180,  703,  11], // Dragon 24
  [1209,  761,   9], // Dragon 25
  [1136,  414,   7], // Dragon 26
  [1265,  472,   5], // Dragon 27
  [1418,  937,  11], // Dragon 28
  [1313,  633,   5], // Dragon 29
  [1455,  641,   8], // Dragon 30
  [1458,  869,   9], // Dragon 31
  [1505, 1034,  11], // Dragon 32
  [1628,  888,  11], // Dragon 33
  [1585,  550,  10], // Dragon 34
  [1617,  498,  12], // Dragon 35
  [1652,  702,   8], // Dragon 36
  [1795,  722,   9], // Dragon 37
  [1878,  682,  11], // Dragon 38
  [2017,  937,  11], // Dragon 39
  [2028,  752,   9], // Dragon 40
  [1974,  560,  10], // Dragon 41
  [1323,  541,   9], // Dragon 42
];

// Give relevant parts of the DOM convenient names
const scoreSpan = document.getElementById('score');
const timerSpan = document.getElementById('timer');
const image = document.getElementById('mainImage');
const complete = document.getElementById('complete');
const game = document.getElementById('game');
const container = document.getElementById('game-container');
const frame = document.getElementById('game-frame');
const imageNaturalWidth = image.naturalWidth;
const imageNaturalHeight = image.naturalHeight;

// Game Data
let score = parseInt(localStorage.getItem('dragon_score')) || 0;
let timer = parseInt(localStorage.getItem('dragon_timer')) || 0;

// Display Score & Timer
scoreSpan.textContent = score;
timerSpan.textContent = formatTime(timer);

// Image Info & Manipulation Setup
let zoomLevel = 1;
let offsetX = 0, offsetY = 0;
let isPanning = false, startX = 0, startY = 0;
let velocityX = 0, velocityY = 0;
let momentumId = null;

const percentageHotspots = hotspots.map(([x, y, r]) => [
  x / imageNaturalWidth,
  y / imageNaturalHeight,
  r / imageNaturalWidth
]);

image.addEventListener('load', () => {
  updateHotspotPositions();
  console.log("Image loaded");
});

window.addEventListener("load", (event) => {
  updateHotspotPositions();
  console.log("Page loaded");
});

// Functions

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
  updateHotspotPositions();
}

// Timer
let interval = setInterval(() => {
  timer++;
  timerSpan.textContent = formatTime(timer);
  localStorage.setItem('dragon_timer', timer);
}, 1000);

// Handle dragon-finding (clicking)
hotspots.forEach(([x, y, r], i) => {
  const foundKey = `dragon_found_${i}`;
  if (localStorage.getItem(foundKey)) return;

  const marker = document.createElement('div');
  marker.className = 'marker';
  marker.style.width  = `${r*2}px`;
  marker.style.height = `${r*2}px`;
  marker.style.width  = `${r*2}px`;
  marker.style.left   = `${x-r}px`;
  marker.style.top    = `${y-r}px`;
  marker.style.borderColor = '3px solid lime';
  marker.style.boxShadow   = '0 0 10px lime';
  game.appendChild(marker);

  marker.addEventListener('click', (e) => {
    e.preventDefault();
    if (!localStorage.getItem(foundKey)) {
      localStorage.setItem(foundKey, 'true');
      score++;
      scoreSpan.textContent = score;
      localStorage.setItem('dragon_score', score);
      marker.style.borderColor = '3px solid lime';
      marker.style.boxShadow   = '0 0 10px lime';

      if (score === hotspots.length) {
        clearInterval(interval);
        complete.style.display = 'block';
        image.classList.add('faded');
        document.querySelectorAll('.marker').forEach(m => m.classList.add('hidden-marker'));
        localStorage.removeItem('dragon_score');
        localStorage.removeItem('dragon_timer');
        hotspots.forEach((_, j) => localStorage.removeItem(`dragon_found_${j}`));
      }
    }
  });
});

// Reset
function resetGame() {
  localStorage.removeItem('dragon_score');
  localStorage.removeItem('dragon_timer');
  location.reload();
}

// Image Manipulation

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

// Manage relative hotspot positions
function updateHotspotPositions() {
  const renderedWidth = image.clientWidth;
  const renderedHeight = image.clientHeight;

  document.querySelectorAll('.marker').forEach((marker, i) => {
    const [px, py, pr] = percentageHotspots[i];
    const x = px * renderedWidth;
    const y = py * renderedHeight;
    const r = pr * renderedWidth;

    marker.style.width  = `${r*2}px`;
    marker.style.height = `${r*2}px`;
    marker.style.left   = `${x-r}px`;
    marker.style.top    = `${y-r}px`;
  });
}

// Update Hotspots on window resize
window.addEventListener('resize', updateHotspotPositions);
