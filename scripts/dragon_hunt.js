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

// Game Data
let score = parseInt(localStorage.getItem('dragon_score')) || 0;
let timer = parseInt(localStorage.getItem('dragon_timer')) || 0;

// Display Score & Timer
scoreSpan.textContent = score;
timerSpan.textContent = formatTime(timer);

// Image Info & Manipulation Setup
let imageNaturalWidth = 1;
let imageNaturalHeight = 1;
let zoomLevel = 1;
let offsetX = 0, offsetY = 0;
let isPanning = false, startX = 0, startY = 0;
let velocityX = 0, velocityY = 0;
let momentumId = null;
let percentageHotspots = []; // Initialized when image loads

window.addEventListener("load", () => {
  updateHotspotPositions();
  console.log("Page loaded");
});

// Calculate image size only after image is loaded
image.addEventListener('load', () => {
  imageNaturalWidth = image.naturalWidth;
  imageNaturalHeight = image.naturalHeight;

  percentageHotspots = hotspots.map(([x, y, r]) => [
    x / imageNaturalWidth,
    y / imageNaturalHeight,
    r / imageNaturalWidth
  ]);

  updateHotspotPositions();

  console.log("Image loaded");
});
// If we missed the image load event, fire it manually
if (image.complete && image.naturalWidth) {
  image.dispatchEvent(new Event('load'));
}

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
  image.style.transform = `scale(${zoomLevel}) translate(${offsetX}px, ${offsetY}px)`;
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
  const storageKey = `dragon_found_${i}`;
  const marker = document.createElement('div');

  marker.dataset.index = i;
  marker.className = 'marker';
  marker.style.width  = `${r*2}px`;
  marker.style.height = `${r*2}px`;
  marker.style.left   = `${x-r}px`;
  marker.style.top    = `${y-r}px`;
  container.appendChild(marker);

  if (localStorage.getItem(storageKey)) {
    marker.style.border    = '3px solid lime';
    marker.style.boxShadow = '0 0 10px lime';
    return;
  }

  marker.addEventListener('click', (e) => {
    e.preventDefault();
    if (!localStorage.getItem(storageKey)) {
      localStorage.setItem(storageKey, 'true');
      score++;
      scoreSpan.textContent = score;
      localStorage.setItem('dragon_score', score);
      marker.style.border    = '3px solid lime';
      marker.style.boxShadow = '0 0 10px lime';

      // if (score === hotspots.length) {
      if (score === 1) {
        clearInterval(interval);
        complete.innerHTML = `You found all ${hotspots.length} dragons in ${formatTime(timer)}!</br>🎉`;
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
  hotspots.forEach((_, j) => localStorage.removeItem(`dragon_found_${j}`));
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
  const imageRect     = image.getBoundingClientRect();
  const containerRect = container.getBoundingClientRect();

  // Position of the image relative to the container
  const offsetX = imageRect.left - containerRect.left;
  const offsetY = imageRect.top - containerRect.top;

  const renderedWidth = imageRect.width;
  const renderedHeight = imageRect.height;

  document.querySelectorAll('.marker').forEach((marker) => {
    const i = parseInt(marker.dataset.index);
    const data = percentageHotspots[i];
    console.log("before ret");
    if (!data) return;
    console.log("after ret");

    const [px, py, pr] = data;
    const x = px * renderedWidth;
    const y = py * renderedHeight;
    const r = pr * renderedWidth;

    // Apply marker position relative to image inside container
    marker.style.width = `${r * 2}px`;
    marker.style.height = `${r * 2}px`;
    marker.style.left = `${offsetX + x - r}px`;
    marker.style.top = `${offsetY + y - r}px`;
  });
}


// Update Hotspots on window resize
let resizeTimeout;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(updateHotspotPositions, 10);
});
