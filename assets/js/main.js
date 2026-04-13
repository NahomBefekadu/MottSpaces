/* ============================================
   MOTT SPACES — Creative JS
   Effects inspired by #creative-coding channel
   ============================================ */

// ── 1. CUSTOM CURSOR ────────────────────────
const dot  = document.querySelector('.cursor-dot');
const ring = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0;
let ringX  = 0, ringY  = 0;

document.addEventListener('mousemove', e => {
  mouseX = e.clientX; mouseY = e.clientY;
  dot.style.left = mouseX + 'px';
  dot.style.top  = mouseY + 'px';
});

// Ring follows with lerp (smooth lag)
(function animateRing() {
  ringX += (mouseX - ringX) * 0.12;
  ringY += (mouseY - ringY) * 0.12;
  ring.style.left = ringX + 'px';
  ring.style.top  = ringY + 'px';
  requestAnimationFrame(animateRing);
})();

document.querySelectorAll('a, button, .project-card, .journal-card').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// ── 2. NAV SCROLL ───────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  nav.classList.toggle('scrolled', window.scrollY > 60);
});

// ── 3. HERO CANVAS — Organic Particle Field ─
// Inspired by Dan Porter's particle experiments in #creative-coding
const heroCanvas = document.getElementById('hero-canvas');
if (heroCanvas) {
  const ctx = heroCanvas.getContext('2d');
  let W, H, particles = [], animId;

  function resize() {
    W = heroCanvas.width  = window.innerWidth;
    H = heroCanvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);

  const PALETTE = ['#C4622D','#D4A843','#7A8C6E','#5C3D2E','#8A8A8A'];

  class Particle {
    constructor() { this.reset(); }
    reset() {
      this.x  = Math.random() * W;
      this.y  = Math.random() * H;
      this.r  = Math.random() * 1.8 + 0.4;
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
      this.alpha = Math.random() * 0.5 + 0.1;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.noiseOffset = Math.random() * 1000;
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;
    }
    update(t) {
      // Gentle Perlin-like steering using sin/cos waves
      const angle = Math.sin(this.x * 0.003 + t * 0.0003) *
                    Math.cos(this.y * 0.003 + t * 0.0002) * Math.PI * 2;
      this.vx += Math.cos(angle) * 0.012;
      this.vy += Math.sin(angle) * 0.012;
      // dampen
      this.vx *= 0.98; this.vy *= 0.98;
      this.x += this.vx; this.y += this.vy;
      this.life++;
      if (this.life > this.maxLife) this.reset();
    }
    draw() {
      ctx.beginPath();
      ctx.arc(this.x, this.y, this.r, 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = this.alpha * (1 - this.life / this.maxLife);
      ctx.fill();
    }
  }

  // Build particle pool
  for (let i = 0; i < 280; i++) particles.push(new Particle());

  // Faint grid lines (mid-century graph feel)
  function drawGrid(t) {
    ctx.globalAlpha = 0.03;
    ctx.strokeStyle = '#5C3D2E';
    ctx.lineWidth = 1;
    const spacing = 80;
    const offset = (t * 0.02) % spacing;
    for (let x = -spacing + offset; x < W + spacing; x += spacing) {
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
    }
    for (let y = 0; y < H; y += spacing) {
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
    }
  }

  // Connection lines between nearby particles
  function drawConnections() {
    const DIST = 90;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d < DIST) {
          ctx.globalAlpha = (1 - d / DIST) * 0.08;
          ctx.strokeStyle = '#C4622D';
          ctx.lineWidth = 0.5;
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(particles[j].x, particles[j].y);
          ctx.stroke();
        }
      }
    }
  }

  let t = 0;
  function heroLoop() {
    animId = requestAnimationFrame(heroLoop);
    ctx.clearRect(0, 0, W, H);
    // Warm gradient base
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#F5F0E8');
    grad.addColorStop(0.5, '#EDE5D4');
    grad.addColorStop(1, '#E4D9C5');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawGrid(t);
    drawConnections();
    ctx.globalAlpha = 1;
    particles.forEach(p => { p.update(t); p.draw(); });
    ctx.globalAlpha = 1;
    t++;
  }
  heroLoop();

  // Parallax on mouse move
  let heroMX = 0, heroMY = 0;
  window.addEventListener('mousemove', e => {
    heroMX = (e.clientX / W - 0.5) * 30;
    heroMY = (e.clientY / H - 0.5) * 30;
  });
}

// ── 4. ABOUT CANVAS — Bauhaus / MCM Geometric ─
// Inspired by html-in-canvas & geometric experiments
const aboutCanvas = document.getElementById('about-canvas');
if (aboutCanvas) {
  const ctx2 = aboutCanvas.getContext('2d');
  aboutCanvas.width  = aboutCanvas.offsetWidth  || 500;
  aboutCanvas.height = aboutCanvas.offsetHeight || 625;
  const AW = aboutCanvas.width, AH = aboutCanvas.height;

  // Responsive resize
  const resizeObs = new ResizeObserver(() => {
    aboutCanvas.width  = aboutCanvas.offsetWidth;
    aboutCanvas.height = aboutCanvas.offsetHeight;
  });
  resizeObs.observe(aboutCanvas);

  // MCM geometric shapes — think Eames, Saarinen posters
  const shapes = [
    { type: 'circle',   x: 0.5,  y: 0.38, r: 0.28,  color: '#C4622D', alpha: 0.15, speed: 0.0004 },
    { type: 'circle',   x: 0.78, y: 0.65, r: 0.18,  color: '#D4A843', alpha: 0.2,  speed: 0.0006 },
    { type: 'rect',     x: 0.15, y: 0.55, w: 0.35, h: 0.55, color: '#7A8C6E', alpha: 0.1, speed: 0.0003 },
    { type: 'triangle', x: 0.6,  y: 0.75, r: 0.22,  color: '#5C3D2E', alpha: 0.12, speed: 0.0005 },
    { type: 'circle',   x: 0.25, y: 0.2,  r: 0.12,  color: '#D4A843', alpha: 0.25, speed: 0.0007 },
  ];

  let t2 = 0;
  function aboutLoop() {
    requestAnimationFrame(aboutLoop);
    const W = aboutCanvas.width, H = aboutCanvas.height;
    ctx2.clearRect(0, 0, W, H);
    // Base
    ctx2.fillStyle = '#2C2C2C'; ctx2.fillRect(0, 0, W, H);

    shapes.forEach((s, i) => {
      const pulse = Math.sin(t2 * s.speed * 1000 + i) * 0.05;
      ctx2.globalAlpha = s.alpha + pulse * 0.05;
      ctx2.fillStyle = s.color;

      if (s.type === 'circle') {
        const cx = s.x * W + Math.sin(t2 * s.speed * 800 + i * 1.3) * 18;
        const cy = s.y * H + Math.cos(t2 * s.speed * 600 + i * 0.9) * 14;
        ctx2.beginPath();
        ctx2.arc(cx, cy, s.r * W * (1 + pulse), 0, Math.PI * 2);
        ctx2.fill();
      } else if (s.type === 'rect') {
        const rx = s.x * W;
        const ry = s.y * H + Math.sin(t2 * s.speed * 700) * 20;
        ctx2.save();
        ctx2.translate(rx, ry);
        ctx2.rotate(Math.sin(t2 * s.speed * 500) * 0.08);
        ctx2.fillRect(-s.w * W / 2, -s.h * H / 2, s.w * W, s.h * H);
        ctx2.restore();
      } else if (s.type === 'triangle') {
        const tx = s.x * W;
        const ty = s.y * H + Math.cos(t2 * s.speed * 600) * 15;
        const tr = s.r * W;
        ctx2.save();
        ctx2.translate(tx, ty);
        ctx2.rotate(t2 * s.speed * 0.3);
        ctx2.beginPath();
        ctx2.moveTo(0, -tr);
        ctx2.lineTo(tr * 0.866, tr * 0.5);
        ctx2.lineTo(-tr * 0.866, tr * 0.5);
        ctx2.closePath();
        ctx2.fill();
        ctx2.restore();
      }
    });

    // Fine grid overlay
    ctx2.globalAlpha = 0.04;
    ctx2.strokeStyle = '#F5F0E8';
    ctx2.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx2.beginPath(); ctx2.moveTo(x, 0); ctx2.lineTo(x, H); ctx2.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx2.beginPath(); ctx2.moveTo(0, y); ctx2.lineTo(W, y); ctx2.stroke();
    }
    ctx2.globalAlpha = 1;
    t2++;
  }
  aboutLoop();
}

// ── 5. JOURNAL CANVAS THUMBNAILS ────────────
// Inspired by color field experiments from #creative-coding
function makePaletteCanvas(canvasEl, palette, style) {
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  canvasEl.width  = canvasEl.offsetWidth  || 400;
  canvasEl.height = canvasEl.offsetHeight || 267;
  const W = canvasEl.width, H = canvasEl.height;

  if (style === 'stripes') {
    // Horizontal MCM color stripes
    palette.forEach((c, i) => {
      const h = H / palette.length;
      ctx.fillStyle = c;
      ctx.fillRect(0, i * h, W, h + 1);
    });
    // Texture noise
    for (let i = 0; i < 3000; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.04) + ')';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  } else if (style === 'circles') {
    // Concentric circle pattern
    ctx.fillStyle = palette[0]; ctx.fillRect(0, 0, W, H);
    palette.slice(1).forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.globalAlpha = 0.7;
      ctx.beginPath();
      ctx.arc(W * 0.5, H * 0.5, (W * 0.45) * (1 - i * 0.22), 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.globalAlpha = 1;
  } else if (style === 'mesh') {
    // Color mesh gradient (4 corner colors)
    const corners = palette.slice(0, 4);
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const tx = x / W, ty = y / H;
        // Bilinear interpolate
        const c = lerpColor(
          lerpColor(corners[0], corners[1], tx),
          lerpColor(corners[2], corners[3], tx),
          ty
        );
        ctx.fillStyle = c;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
}

function lerpColor(a, b, t) {
  const ah = a.replace('#',''), bh = b.replace('#','');
  const ar = parseInt(ah.slice(0,2),16), ag = parseInt(ah.slice(2,4),16), ab = parseInt(ah.slice(4,6),16);
  const br = parseInt(bh.slice(0,2),16), bg = parseInt(bh.slice(2,4),16), bb = parseInt(bh.slice(4,6),16);
  const r = Math.round(ar + (br-ar)*t);
  const g = Math.round(ag + (bg-ag)*t);
  const b2 = Math.round(ab + (bb-ab)*t);
  return `rgb(${r},${g},${b2})`;
}

// Initialize journal thumbnails after DOM ready
window.addEventListener('load', () => {
  makePaletteCanvas(document.getElementById('jc1'), ['#C4622D','#D4A843','#F5F0E8','#7A8C6E','#5C3D2E'], 'stripes');
  makePaletteCanvas(document.getElementById('jc2'), ['#2C2C2C','#C4622D','#D4A843','#F5F0E8'], 'circles');
  makePaletteCanvas(document.getElementById('jc3'), ['#C4622D','#F5F0E8','#D4A843','#7A8C6E'], 'mesh');
});

// ── 6. REVEAL ON SCROLL ─────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => {
    if (e.isIntersecting) { e.target.classList.add('visible'); }
  });
}, { threshold: 0.12 });
reveals.forEach(el => revealObs.observe(el));

// ── 7. MARQUEE duplicate for seamless loop ──
const track = document.querySelector('.marquee-track');
if (track) {
  track.innerHTML += track.innerHTML;
}
