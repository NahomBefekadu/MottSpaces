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

// ── 4. ABOUT CANVAS — Tearable Easel with MCM Chair ─────────────────────────
// Inspired by tearable.website & html-in-canvas from #creative-coding
// Cloth physics: verlet integration on a grid of points
// Drawing: vector line-art of a mid-century tulip/shell chair

const aboutCanvas = document.getElementById('about-canvas');
if (aboutCanvas) {
  const ctx2 = aboutCanvas.getContext('2d');

  // Sizing
  function resizeAbout() {
    aboutCanvas.width  = aboutCanvas.offsetWidth  || 500;
    aboutCanvas.height = aboutCanvas.offsetHeight || 625;
    initCloth();
  }

  // Cloth config
  const COLS = 28, ROWS = 26;
  const GRAVITY = 0.42;
  const STIFFNESS = 3;
  const TEAR_DIST = 55;
  let points = [], constraints = [];
  let mouse = { x:0, y:0, down:false, px:0, py:0 };

  function initCloth() {
    const W = aboutCanvas.width, H = aboutCanvas.height;
    const spacingX = W / (COLS - 1);
    const spacingY = (H * 0.97) / (ROWS - 1);
    const startY   = 14;
    points = []; constraints = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const x = c * spacingX;
        const y = startY + r * spacingY;
        points.push({ x, y, px: x, py: y, pinned: r === 0 });
      }
    }
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        const i = r * COLS + c;
        if (c < COLS-1) constraints.push({ a:i, b:i+1,      len:spacingX, active:true });
        if (r < ROWS-1) constraints.push({ a:i, b:i+COLS,   len:spacingY, active:true });
      }
    }
  }
  initCloth();
  new ResizeObserver(resizeAbout).observe(aboutCanvas);

  // Verlet physics
  function updateCloth() {
    const H = aboutCanvas.height;
    points.forEach(p => {
      if (p.pinned) return;
      const vx = (p.x - p.px) * 0.98;
      const vy = (p.y - p.py) * 0.98;
      p.px = p.x; p.py = p.y;
      p.x += vx; p.y += vy + GRAVITY;
      if (p.y > H) { p.y = H; p.py = p.y + vy * 0.3; }
    });
    for (let iter = 0; iter < STIFFNESS; iter++) {
      constraints.forEach(cn => {
        if (!cn.active) return;
        const a = points[cn.a], b = points[cn.b];
        const dx = b.x-a.x, dy = b.y-a.y;
        const dist = Math.sqrt(dx*dx+dy*dy) || 0.001;
        if (dist > TEAR_DIST) { cn.active = false; return; }
        const diff = (dist - cn.len) / dist * 0.5;
        const ox = dx*diff, oy = dy*diff;
        if (!a.pinned) { a.x += ox; a.y += oy; }
        if (!b.pinned) { b.x -= ox; b.y -= oy; }
      });
    }
  }

  // Mouse/touch
  function getPos(e) {
    const rect = aboutCanvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  function doTear(e) {
    const p = getPos(e);
    const dx = p.x - mouse.x, dy = p.y - mouse.y;
    const speed = Math.sqrt(dx*dx + dy*dy);
    mouse.px = mouse.x; mouse.py = mouse.y;
    mouse.x = p.x; mouse.y = p.y;
    constraints.forEach(cn => {
      if (!cn.active) return;
      const a = points[cn.a], b = points[cn.b];
      const mx = (a.x+b.x)/2, my = (a.y+b.y)/2;
      const d = Math.sqrt((mx-mouse.x)**2+(my-mouse.y)**2);
      if (d < 20 + speed * 1.8) cn.active = false;
    });
    points.forEach(pt => {
      const d = Math.sqrt((pt.x-mouse.x)**2+(pt.y-mouse.y)**2);
      if (d < 45) { pt.x += dx*0.55; pt.y += dy*0.55; }
    });
  }
  aboutCanvas.addEventListener('mousemove',  e => { const p=getPos(e); if(mouse.down) doTear(e); else { mouse.x=p.x; mouse.y=p.y; } });
  aboutCanvas.addEventListener('mousedown',  e => { mouse.down=true; const p=getPos(e); mouse.x=p.x; mouse.y=p.y; mouse.px=p.x; mouse.py=p.y; });
  aboutCanvas.addEventListener('mouseup',    () => { mouse.down=false; });
  aboutCanvas.addEventListener('mouseleave', () => { mouse.down=false; });
  aboutCanvas.addEventListener('touchmove',  e => { e.preventDefault(); mouse.down=true; doTear(e); }, { passive:false });
  aboutCanvas.addEventListener('touchstart', e => { const p=getPos(e); mouse.x=p.x; mouse.y=p.y; mouse.px=p.x; mouse.py=p.y; mouse.down=true; });
  aboutCanvas.addEventListener('touchend',   () => { mouse.down=false; });

  // Vector line-art: mid-century tulip/shell chair
  function drawChair(ctx, W, H) {
    ctx.save();
    const cx = W * 0.5;
    const by = H * 0.9;
    const sc = Math.min(W, H) / 260;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    function pt(x, y) { return [cx + x*sc, by + y*sc]; }

    // Shadow
    const sg = ctx.createRadialGradient(cx, by+5*sc, 2*sc, cx, by+5*sc, 55*sc);
    sg.addColorStop(0, 'rgba(44,44,44,0.2)');
    sg.addColorStop(1, 'rgba(44,44,44,0)');
    ctx.fillStyle = sg;
    ctx.beginPath();
    ctx.ellipse(cx, by+4*sc, 55*sc, 11*sc, 0, 0, Math.PI*2);
    ctx.fill();

    // Base disc
    ctx.strokeStyle = '#5C3D2E';
    ctx.lineWidth = 2*sc;
    ctx.beginPath();
    ctx.ellipse(cx, by, 48*sc, 9*sc, 0, 0, Math.PI*2);
    ctx.stroke();

    // Pedestal
    ctx.strokeStyle = '#5C3D2E';
    ctx.lineWidth = 4*sc;
    ctx.beginPath();
    ctx.moveTo(...pt(0, -5));
    ctx.bezierCurveTo(...pt(-4,-55), ...pt(-6,-95), ...pt(0,-108));
    ctx.stroke();

    // Seat underside spread
    ctx.strokeStyle = '#5C3D2E';
    ctx.lineWidth = 2.2*sc;
    ctx.beginPath();
    ctx.moveTo(...pt(0,-108));
    ctx.bezierCurveTo(...pt(-20,-108), ...pt(-55,-112), ...pt(-60,-118));
    ctx.moveTo(...pt(0,-108));
    ctx.bezierCurveTo(...pt(20,-108),  ...pt(55,-112),  ...pt(60,-118));
    ctx.stroke();

    // Seat bowl outer
    ctx.strokeStyle = '#C4622D';
    ctx.lineWidth = 3*sc;
    ctx.beginPath();
    ctx.ellipse(cx, by-122*sc, 62*sc, 24*sc, -0.08, 0, Math.PI*2);
    ctx.stroke();

    // Seat bowl inner
    ctx.strokeStyle = '#C4622D';
    ctx.lineWidth = 1.5*sc;
    ctx.globalAlpha = 0.4;
    ctx.beginPath();
    ctx.ellipse(cx, by-125*sc, 42*sc, 14*sc, -0.05, 0, Math.PI*2);
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Back shell outline
    ctx.strokeStyle = '#C4622D';
    ctx.lineWidth = 3*sc;
    ctx.beginPath();
    ctx.moveTo(...pt(-60,-116));
    ctx.bezierCurveTo(...pt(-72,-155), ...pt(-52,-228), ...pt(0,-240));
    ctx.bezierCurveTo(...pt(52,-228),  ...pt(72,-155),  ...pt(60,-116));
    ctx.stroke();

    // Back shell inner curve
    ctx.strokeStyle = '#C4622D';
    ctx.lineWidth = 1.4*sc;
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.moveTo(...pt(-38,-120));
    ctx.bezierCurveTo(...pt(-46,-162), ...pt(-30,-220), ...pt(0,-232));
    ctx.bezierCurveTo(...pt(30,-220),  ...pt(46,-162),  ...pt(38,-120));
    ctx.stroke();
    ctx.globalAlpha = 1;

    // Mustard accent dot at pedestal base
    ctx.fillStyle = '#D4A843';
    ctx.beginPath();
    ctx.arc(...pt(0,-108), 5*sc, 0, Math.PI*2);
    ctx.fill();

    ctx.restore();
  }

  // Draw the cloth quads + easel bar
  function drawCloth(ctx, W) {
    // Paper quads
    for (let r = 0; r < ROWS-1; r++) {
      for (let c = 0; c < COLS-1; c++) {
        const tl = points[r*COLS+c],     tr = points[r*COLS+c+1];
        const bl = points[(r+1)*COLS+c], br = points[(r+1)*COLS+c+1];
        const h1 = constraints.find(cn=>cn.a===r*COLS+c    &&cn.b===r*COLS+c+1    &&cn.active);
        const h2 = constraints.find(cn=>cn.a===(r+1)*COLS+c&&cn.b===(r+1)*COLS+c+1&&cn.active);
        const v1 = constraints.find(cn=>cn.a===r*COLS+c    &&cn.b===(r+1)*COLS+c  &&cn.active);
        const v2 = constraints.find(cn=>cn.a===r*COLS+c+1  &&cn.b===(r+1)*COLS+c+1&&cn.active);
        if (h1&&h2&&v1&&v2) {
          ctx.fillStyle = (r+c)%2===0 ? 'rgba(245,240,232,0.96)' : 'rgba(238,231,218,0.96)';
          ctx.beginPath();
          ctx.moveTo(tl.x,tl.y); ctx.lineTo(tr.x,tr.y);
          ctx.lineTo(br.x,br.y); ctx.lineTo(bl.x,bl.y);
          ctx.closePath(); ctx.fill();
        }
      }
    }
    // Cloth seam lines
    ctx.strokeStyle = 'rgba(160,145,128,0.18)';
    ctx.lineWidth = 0.6;
    constraints.forEach(cn => {
      if (!cn.active) return;
      ctx.beginPath();
      ctx.moveTo(points[cn.a].x, points[cn.a].y);
      ctx.lineTo(points[cn.b].x, points[cn.b].y);
      ctx.stroke();
    });
    // Easel top bar
    ctx.save();
    ctx.fillStyle   = '#5C3D2E';
    ctx.strokeStyle = '#3A2010';
    ctx.lineWidth   = 1.5;
    ctx.beginPath();
    ctx.roundRect(0, 0, W, 18, [0,0,4,4]);
    ctx.fill(); ctx.stroke();
    for (let i = 0; i < COLS; i++) {
      ctx.fillStyle = '#D4A843';
      ctx.beginPath();
      ctx.arc(points[i].x, 9, 3.5, 0, Math.PI*2);
      ctx.fill();
    }
    ctx.restore();
  }

  // Fade-out hint
  function drawHint(ctx, W, H, t2) {
    const alpha = Math.max(0, 0.5 - t2 * 0.0025);
    if (alpha <= 0) return;
    ctx.globalAlpha = alpha;
    ctx.fillStyle = '#8A8A8A';
    ctx.font = `${Math.round(Math.min(W,H)*0.033)}px 'DM Sans', sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText('drag to tear', W/2, H*0.5);
    ctx.globalAlpha = 1;
  }

  // Load the reveal image (shown under cloth as it tears)
  const revealImg = new Image();
  revealImg.src = 'assets/images/chair-placeholder.jpg';

  let t2 = 0;
  function aboutLoop() {
    requestAnimationFrame(aboutLoop);
    const W = aboutCanvas.width, H = aboutCanvas.height;
    updateCloth();

    // ── Background: image (or warm fallback) ──
    ctx2.fillStyle = '#2C2C2C';
    ctx2.fillRect(0, 0, W, H);
    if (revealImg.complete && revealImg.naturalWidth > 0) {
      // Cover-fit the image
      const iw = revealImg.naturalWidth, ih = revealImg.naturalHeight;
      const scale = Math.max(W / iw, H / ih);
      const dw = iw * scale, dh = ih * scale;
      const dx = (W - dw) / 2, dy = (H - dh) / 2;
      ctx2.globalAlpha = 1;
      ctx2.drawImage(revealImg, dx, dy, dw, dh);
      // Subtle dark vignette so tears read clearly
      const vig = ctx2.createRadialGradient(W/2,H/2,H*0.2,W/2,H/2,H*0.85);
      vig.addColorStop(0, 'rgba(0,0,0,0)');
      vig.addColorStop(1, 'rgba(0,0,0,0.45)');
      ctx2.fillStyle = vig;
      ctx2.fillRect(0, 0, W, H);
    } else {
      // Fallback: draw vector chair while image loads
      drawChair(ctx2, W, H);
    }

    // ── Cloth on top ──
    drawCloth(ctx2, W);
    drawHint(ctx2, W, H, t2);
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
