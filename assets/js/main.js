/* ============================================
   MOTT SPACES — main.js
   Performance rules:
   - Zero allocations inside rAF loops
   - No O(n²) loops anywhere
   - Single rAF drives all animations
   - tabVisible guard on all work
   ============================================ */

// ── Global visibility guard ──────────────────
let tabVisible = true;
document.addEventListener('visibilitychange', () => { tabVisible = !document.hidden; });

// ── 1. CUSTOM CURSOR ─────────────────────────
const cursorDot  = document.querySelector('.cursor-dot');
const cursorRing = document.querySelector('.cursor-ring');
let mouseX = 0, mouseY = 0, ringX = 0, ringY = 0;

document.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY; });
if (cursorDot) {
  document.querySelectorAll('a, button, .project-card, .journal-card').forEach(el => {
    el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
    el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
  });
}

// ── 2. NAV SCROLL ────────────────────────────
const nav = document.querySelector('nav');
window.addEventListener('scroll', () => {
  if (nav) nav.classList.toggle('scrolled', window.scrollY > 60);
}, { passive: true });

// ── 3. HERO CANVAS — Particles forming MCM furniture ──
const heroCanvas = document.getElementById('hero-canvas');
let heroCtx, heroW, heroH;
let heroReady = false;

// Pre-allocated state — nothing created inside the loop
const PALETTE = ['#C4622D', '#D4A843', '#7A8C6E', '#5C3D2E', '#8A8A8A'];
const PARTICLE_COUNT = 160;

// Particle pool — plain objects, not classes
const px   = new Float32Array(PARTICLE_COUNT); // x
const py   = new Float32Array(PARTICLE_COUNT); // y
const pvx  = new Float32Array(PARTICLE_COUNT); // vx
const pvy  = new Float32Array(PARTICLE_COUNT); // vy
const pr   = new Float32Array(PARTICLE_COUNT); // radius
const pa   = new Float32Array(PARTICLE_COUNT); // alpha
const ptx  = new Float32Array(PARTICLE_COUNT); // target x
const pty  = new Float32Array(PARTICLE_COUNT); // target y
const plife= new Float32Array(PARTICLE_COUNT); // life
const pmaxl= new Float32Array(PARTICLE_COUNT); // max life
const pcol = new Uint8Array(PARTICLE_COUNT);   // color index
const phasTarget = new Uint8Array(PARTICLE_COUNT); // 0 or 1

function initParticle(i, w, h) {
  px[i]   = Math.random() * w;
  py[i]   = Math.random() * h;
  pvx[i]  = (Math.random() - 0.5) * 0.35;
  pvy[i]  = (Math.random() - 0.5) * 0.35;
  pr[i]   = Math.random() * 1.6 + 0.4;
  pa[i]   = Math.random() * 0.4 + 0.1;
  plife[i]= 0;
  pmaxl[i]= Math.random() * 400 + 200;
  pcol[i] = Math.floor(Math.random() * PALETTE.length);
  phasTarget[i] = 0;
  ptx[i] = 0; pty[i] = 0;
}

// Formation state
const WANDER_DUR   = 420;
const FORM_DUR     = 90;
const HOLD_DUR     = 150;
const DISSOLVE_DUR = 70;
let formState  = 'wander';
let formTimer  = WANDER_DUR;
let shapeIndex = 0;

// Chair target points — built once per formation, stored as flat arrays
let targetX = new Float32Array(PARTICLE_COUNT);
let targetY = new Float32Array(PARTICLE_COUNT);
let targetCount = 0;

// ── Shape builders ────────────────────────────
// All return {xs: Float32Array, ys: Float32Array, n: count}
function buildPoints(fn, cx, cy, sc) {
  const ax = [], ay = [];
  const add = (x, y) => { ax.push(cx + x * sc); ay.push(cy + y * sc); };
  fn(add);
  const n = Math.min(ax.length, PARTICLE_COUNT);
  const xs = new Float32Array(n), ys = new Float32Array(n);
  for (let i = 0; i < n; i++) { xs[i] = ax[i]; ys[i] = ay[i]; }
  return { xs, ys, n };
}

function shapeTulip(add) {
  for (let a = 0; a < Math.PI*2; a += 0.3)  add(Math.cos(a)*48, Math.sin(a)*9);
  for (let i = 0; i <= 12; i++) add(0, -8 + (-100) * (i/12));
  for (let a = 0; a < Math.PI*2; a += 0.22) add(Math.cos(a)*62, -122 + Math.sin(a)*24);
  for (let i = 0; i <= 14; i++) {
    const t = i/14;
    add((-60)*(1-t)**3+(-72)*3*t*(1-t)**2+(-52)*3*t**2*(1-t),
        (-116)*(1-t)**3+(-155)*3*t*(1-t)**2+(-228)*3*t**2*(1-t)+(-240)*t**3);
    add((60)*(1-t)**3+(72)*3*t*(1-t)**2+(52)*3*t**2*(1-t),
        (-116)*(1-t)**3+(-155)*3*t*(1-t)**2+(-228)*3*t**2*(1-t)+(-240)*t**3);
  }
}

function shapeLadder(add) {
  for (let x = -55; x <= 55; x += 8) { add(x,-110); add(x,-130); }
  for (let y = -130; y <= -110; y += 4) { add(-55,y); add(55,y); }
  [[-50,-110,-62,0],[-30,-110,-22,0],[30,-110,22,0],[50,-110,62,0]].forEach(([x1,y1,x2,y2]) => {
    for (let i=0;i<=10;i++) { const t=i/10; add(x1+(x2-x1)*t, y1+(y2-y1)*t); }
  });
  for (let y=-130;y>=-260;y-=8) { add(-42,y); add(42,y); }
  [-150,-175,-200,-225].forEach(y => { for (let x=-42;x<=42;x+=8) add(x,y); });
}

function shapeTable(add) {
  for (let a=0;a<Math.PI*2;a+=0.15) add(Math.cos(a)*90, -120+Math.sin(a)*14);
  for (let a=0;a<Math.PI*2;a+=0.22) add(Math.cos(a)*70, -120+Math.sin(a)*10);
  for (let i=0;i<=10;i++) add(0, -120+i*12);
  [0,2.09,4.19].forEach(angle => {
    for (let i=0;i<=10;i++) { const t=i/10; add(Math.cos(angle)*72*t, Math.sin(angle)*18*t); }
  });
}

function shapeOttoman(add) {
  for (let x=-70;x<=70;x+=6)  { add(x,-90); add(x,-160); }
  for (let y=-160;y<=-90;y+=6) { add(-70,y); add(70,y); }
  [-35,0,35].forEach(x => [-115,-135].forEach(y => {
    for (let a=0;a<Math.PI*2;a+=0.6) add(x+Math.cos(a)*6, y+Math.sin(a)*4);
  }));
  [[-60,-90,-72,-50],[-40,-90,-30,-50],[40,-90,30,-50],[60,-90,72,-50]].forEach(([x1,y1,x2,y2]) => {
    for (let i=0;i<=6;i++) { const t=i/6; add(x1+(x2-x1)*t, y1+(y2-y1)*t); }
  });
}

function shapeSofa(add) {
  for (let x=-110;x<=110;x+=7) { add(x,-90); add(x,-130); add(x,-190); }
  for (let y=-190;y<=-90;y+=7) { add(-110,y); add(110,y); }
  for (let y=-90;y>=-175;y-=10) { add(-118,y); add(118,y); }
}

const SHAPES = [shapeTulip, shapeLadder, shapeTable, shapeOttoman, shapeSofa];

function assignTargets() {
  if (!heroW) return;
  const sc = Math.min(heroW, heroH) / 280;
  const cx = heroW * 0.65, cy = heroH * 0.72;
  const { xs, ys, n } = buildPoints(SHAPES[shapeIndex % SHAPES.length], cx, cy, sc);
  targetCount = n;
  // Fisher-Yates shuffle indices then assign
  const idx = new Uint16Array(n);
  for (let i=0;i<n;i++) idx[i]=i;
  for (let i=n-1;i>0;i--) { const j=Math.floor(Math.random()*(i+1)); const tmp=idx[i]; idx[i]=idx[j]; idx[j]=tmp; }
  for (let i=0;i<PARTICLE_COUNT;i++) {
    if (i < n) {
      ptx[i] = xs[idx[i]]; pty[i] = ys[idx[i]]; phasTarget[i] = 1;
      pcol[i] = Math.floor(Math.random() * PALETTE.length);
      pr[i]   = Math.random() * 1.4 + 0.6;
      pa[i]   = Math.random() * 0.5 + 0.4;
    } else {
      phasTarget[i] = 0;
    }
  }
}

function releaseTargets() {
  for (let i=0;i<PARTICLE_COUNT;i++) { phasTarget[i]=0; plife[i]=0; }
}

// ── Single unified rAF loop ───────────────────
let frameT = 0;

function masterLoop() {
  requestAnimationFrame(masterLoop);
  if (!tabVisible) return;

  // ── Cursor ring lerp ──
  if (cursorDot && cursorRing) {
    ringX += (mouseX - ringX) * 0.12;
    ringY += (mouseY - ringY) * 0.12;
    cursorDot.style.left  = mouseX + 'px';
    cursorDot.style.top   = mouseY + 'px';
    cursorRing.style.left = ringX  + 'px';
    cursorRing.style.top  = ringY  + 'px';
  }

  // ── Hero canvas ──
  if (heroReady && heroCtx) {
    heroCtx.globalAlpha = 1;
    heroCtx.fillStyle = '#EDE5D4';
    heroCtx.fillRect(0, 0, heroW, heroH);

    drawHeroGrid();

    // State machine
    formTimer--;
    let progress = 0;
    if (formState === 'wander' && formTimer <= 0) {
      formState = 'forming'; formTimer = FORM_DUR;
      shapeIndex++; assignTargets();
    } else if (formState === 'forming') {
      progress = 1 - formTimer / FORM_DUR;
      if (formTimer <= 0) { formState = 'hold'; formTimer = HOLD_DUR; }
    } else if (formState === 'hold') {
      progress = 1;
      if (formTimer <= 0) { formState = 'dissolving'; formTimer = DISSOLVE_DUR; releaseTargets(); }
    } else if (formState === 'dissolving') {
      progress = formTimer / DISSOLVE_DUR;
      if (formTimer <= 0) { formState = 'wander'; formTimer = WANDER_DUR; }
    }

    updateParticles(progress);
    drawParticles(progress);
    if (formState === 'hold') drawGhostDots();
  }

  // ── About/cloth canvas ──
  if (typeof updateCloth === 'function') {
    if (typeof window._applyClothTear === 'function') window._applyClothTear();
    updateCloth();
    drawAboutCanvas();
  }

  frameT++;
}

// ── Hero helpers ─────────────────────────────
function drawHeroGrid() {
  heroCtx.globalAlpha = 0.03;
  heroCtx.strokeStyle = '#5C3D2E';
  heroCtx.lineWidth = 1;
  const sp = 80, off = (frameT * 0.02) % sp;
  for (let x = -sp + off; x < heroW + sp; x += sp) {
    heroCtx.beginPath(); heroCtx.moveTo(x, 0); heroCtx.lineTo(x, heroH); heroCtx.stroke();
  }
  for (let y = 0; y < heroH; y += sp) {
    heroCtx.beginPath(); heroCtx.moveTo(0, y); heroCtx.lineTo(heroW, y); heroCtx.stroke();
  }
}

function updateParticles(progress) {
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (formState === 'wander' || formState === 'dissolving') {
      const angle = Math.sin(px[i]*0.003 + frameT*0.0003) * Math.cos(py[i]*0.003 + frameT*0.0002) * Math.PI * 2;
      pvx[i] += Math.cos(angle) * 0.012;
      pvy[i] += Math.sin(angle) * 0.012;
      pvx[i] *= 0.98; pvy[i] *= 0.98;
      px[i] += pvx[i]; py[i] += pvy[i];
      plife[i]++;
      if (plife[i] > pmaxl[i]) initParticle(i, heroW, heroH);
    } else if (phasTarget[i]) {
      const spd = formState === 'forming' ? 0.045 + progress * 0.04 : 0.08;
      px[i] += (ptx[i] - px[i]) * spd;
      py[i] += (pty[i] - py[i]) * spd;
      pvx[i] = 0; pvy[i] = 0;
    } else {
      const angle = Math.sin(px[i]*0.003 + frameT*0.0003) * Math.cos(py[i]*0.003 + frameT*0.0002) * Math.PI * 2;
      pvx[i] += Math.cos(angle) * 0.012; pvy[i] += Math.sin(angle) * 0.012;
      pvx[i] *= 0.98; pvy[i] *= 0.98;
      px[i] += pvx[i]; py[i] += pvy[i];
    }
  }
}

function drawParticles(progress) {
  // Batch draw by color — 5 fillStyle sets instead of 160
  for (let ci = 0; ci < PALETTE.length; ci++) {
    heroCtx.fillStyle = PALETTE[ci];
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      if (pcol[i] !== ci) continue;
      let alpha = pa[i], r = pr[i];
      if (formState === 'forming') {
        alpha *= (0.4 + progress * 0.6); r *= (0.6 + progress * 0.5);
      } else if (formState === 'hold') {
        r *= (1 + Math.sin(frameT * 0.05 + i * 0.4) * 0.1);
      } else if (formState === 'dissolving') {
        alpha *= progress; r *= (1 + (1-progress) * 0.4);
      }
      heroCtx.globalAlpha = Math.max(0, Math.min(1, alpha));
      heroCtx.beginPath();
      heroCtx.arc(px[i], py[i], Math.max(0.1, r), 0, Math.PI * 2);
      heroCtx.fill();
    }
  }
}

function drawGhostDots() {
  if (!targetCount) return;
  heroCtx.globalAlpha = 0.14;
  heroCtx.fillStyle = '#C4622D';
  for (let i = 0; i < PARTICLE_COUNT; i++) {
    if (!phasTarget[i]) continue;
    heroCtx.beginPath();
    heroCtx.arc(ptx[i], pty[i], 1.5, 0, Math.PI * 2);
    heroCtx.fill();
  }
}

// ── Hero canvas init ──────────────────────────
if (heroCanvas) {
  heroCtx = heroCanvas.getContext('2d');
  function resizeHero() {
    heroW = heroCanvas.width  = window.innerWidth;
    heroH = heroCanvas.height = window.innerHeight;
  }
  resizeHero();
  window.addEventListener('resize', resizeHero, { passive: true });
  for (let i = 0; i < PARTICLE_COUNT; i++) initParticle(i, heroW, heroH);
  heroReady = true;

  window.addEventListener('mousemove', e => {
    if (formState !== 'wander') return;
    for (let i = 0; i < PARTICLE_COUNT; i++) {
      const dx = px[i] - e.clientX, dy = py[i] - e.clientY;
      const d2 = dx*dx + dy*dy;
      if (d2 < 6400) { // 80²
        const d = Math.sqrt(d2);
        pvx[i] += (dx/d) * 0.8; pvy[i] += (dy/d) * 0.8;
      }
    }
  }, { passive: true });
}

// ── 4. ABOUT CANVAS — Tearable cloth ─────────
// Cloth physics: verlet integration, tearable canvas
const aboutCanvas = document.getElementById('about-canvas');
let aboutCtx2;

// Cloth config
const CLOTH_COLS = 22, CLOTH_ROWS = 20;
const GRAVITY    = 0.42;
const STIFFNESS  = 3;
const TEAR_DIST  = 55;

let clothPoints = [], clothConstraints = [];
let clothConstraintMap = new Map(); // O(1) lookup by key
let clothMouse = { x:0, y:0, down:false, px:0, py:0 };

// Pre-compute integer keys — no template literals in hot path
function clothKey(a, b) { return a * 100000 + b; }

function initCloth() {
  if (!aboutCanvas) return;
  const W = aboutCanvas.width, H = aboutCanvas.height;
  const spacingX = W / (CLOTH_COLS - 1);
  const spacingY = (H * 0.97) / (CLOTH_ROWS - 1);
  const startY   = 14;
  clothPoints = []; clothConstraints = []; clothConstraintMap = new Map();
  for (let r = 0; r < CLOTH_ROWS; r++) {
    for (let c = 0; c < CLOTH_COLS; c++) {
      const x = c * spacingX, y = startY + r * spacingY;
      clothPoints.push({ x, y, px: x, py: y, pinned: r === 0 });
    }
  }
  for (let r = 0; r < CLOTH_ROWS; r++) {
    for (let c = 0; c < CLOTH_COLS; c++) {
      const i = r * CLOTH_COLS + c;
      if (c < CLOTH_COLS-1) {
        const cn = { a:i, b:i+1, len:spacingX, active:true };
        clothConstraints.push(cn);
        clothConstraintMap.set(clothKey(i, i+1), cn);
      }
      if (r < CLOTH_ROWS-1) {
        const cn = { a:i, b:i+CLOTH_COLS, len:spacingY, active:true };
        clothConstraints.push(cn);
        clothConstraintMap.set(clothKey(i, i+CLOTH_COLS), cn);
      }
    }
  }
}

function updateCloth() {
  if (!aboutCanvas) return;
  const H = aboutCanvas.height;
  for (let i = 0; i < clothPoints.length; i++) {
    const p = clothPoints[i];
    if (p.pinned) continue;
    const vx = (p.x - p.px) * 0.98, vy = (p.y - p.py) * 0.98;
    p.px = p.x; p.py = p.y;
    p.x += vx; p.y += vy + GRAVITY;
    if (p.y > H) { p.y = H; p.py = p.y + vy * 0.3; }
  }
  for (let iter = 0; iter < STIFFNESS; iter++) {
    for (let i = 0; i < clothConstraints.length; i++) {
      const cn = clothConstraints[i];
      if (!cn.active) continue;
      const a = clothPoints[cn.a], b = clothPoints[cn.b];
      const dx = b.x-a.x, dy = b.y-a.y;
      const dist = Math.sqrt(dx*dx+dy*dy) || 0.001;
      if (dist > TEAR_DIST) { cn.active = false; continue; }
      const diff = (dist - cn.len) / dist * 0.5;
      const ox = dx*diff, oy = dy*diff;
      if (!a.pinned) { a.x += ox; a.y += oy; }
      if (!b.pinned) { b.x -= ox; b.y -= oy; }
    }
  }
}

// Images
// Resolve image paths relative to the JS file location, works from any subpage
const _jsBase = document.querySelector('script[src*="main.js"]')?.src
  ? new URL(document.querySelector('script[src*="main.js"]').src).href.replace(/\/[^\/]+$/, '/')
  : document.location.origin + '/';
const _imgBase = _jsBase.replace('/assets/js/', '/assets/images/');
const revealImg = new Image(); revealImg.src = _imgBase + 'chair-placeholder.jpg';
const clothImg  = new Image(); clothImg.src  = _imgBase + 'cloth-painting.jpg';
const clothSampler = document.createElement('canvas');
let clothSamplerReady = false;

function ensureClothSampler(W, H) {
  if (clothSamplerReady && clothSampler.width === W && clothSampler.height === H) return;
  if (!clothImg.complete || !clothImg.naturalWidth) return;
  clothSampler.width = W; clothSampler.height = H;
  const sc = clothSampler.getContext('2d');
  const iw = clothImg.naturalWidth, ih = clothImg.naturalHeight;
  const scale = Math.max(W/iw, H/ih);
  sc.drawImage(clothImg, (W-iw*scale)/2, (H-ih*scale)/2, iw*scale, ih*scale);
  clothSamplerReady = true;
}

let clothHintTimer = 200;

function drawAboutCanvas() {
  if (!aboutCanvas || !aboutCtx2) return;
  const W = aboutCanvas.width, H = aboutCanvas.height;
  ensureClothSampler(W, H);

  // Background image
  aboutCtx2.fillStyle = '#2C2C2C';
  aboutCtx2.fillRect(0, 0, W, H);
  if (revealImg.complete && revealImg.naturalWidth) {
    const iw = revealImg.naturalWidth, ih = revealImg.naturalHeight;
    const scale = Math.max(W/iw, H/ih);
    aboutCtx2.globalAlpha = 1;
    aboutCtx2.drawImage(revealImg, (W-iw*scale)/2, (H-ih*scale)/2, iw*scale, ih*scale);
  }

  // Cloth quads — O(1) map lookup per quad, no string allocation
  for (let r = 0; r < CLOTH_ROWS-1; r++) {
    for (let c = 0; c < CLOTH_COLS-1; c++) {
      const i  = r*CLOTH_COLS+c;
      const h1 = clothConstraintMap.get(clothKey(i,        i+1));
      const h2 = clothConstraintMap.get(clothKey(i+CLOTH_COLS, i+CLOTH_COLS+1));
      const v1 = clothConstraintMap.get(clothKey(i,        i+CLOTH_COLS));
      const v2 = clothConstraintMap.get(clothKey(i+1,      i+CLOTH_COLS+1));
      if (!h1?.active || !h2?.active || !v1?.active || !v2?.active) continue;

      const tl = clothPoints[i], tr = clothPoints[i+1];
      const bl = clothPoints[i+CLOTH_COLS], br = clothPoints[i+CLOTH_COLS+1];

      aboutCtx2.save();
      aboutCtx2.beginPath();
      aboutCtx2.moveTo(tl.x,tl.y); aboutCtx2.lineTo(tr.x,tr.y);
      aboutCtx2.lineTo(br.x,br.y); aboutCtx2.lineTo(bl.x,bl.y);
      aboutCtx2.closePath();
      aboutCtx2.clip();

      if (clothSamplerReady) {
        const origX = c * (W/(CLOTH_COLS-1));
        const origY = 14 + r * (H*0.97/(CLOTH_ROWS-1));
        const qw = W/(CLOTH_COLS-1), qh = H*0.97/(CLOTH_ROWS-1);
        const ax=tr.x-tl.x, ay=tr.y-tl.y, bx=bl.x-tl.x, by=bl.y-tl.y;
        aboutCtx2.transform(ax/qw, ay/qw, bx/qh, by/qh, tl.x, tl.y);
        aboutCtx2.drawImage(clothSampler, -origX, -origY);
      } else {
        aboutCtx2.fillStyle = (r+c)%2===0 ? 'rgba(245,240,232,0.96)' : 'rgba(238,231,218,0.96)';
        aboutCtx2.fill();
      }
      aboutCtx2.restore();
    }
  }

  // Easel bar
  aboutCtx2.globalAlpha = 1;
  aboutCtx2.fillStyle = '#5C3D2E';
  aboutCtx2.strokeStyle = '#3A2010';
  aboutCtx2.lineWidth = 1.5;
  aboutCtx2.beginPath();
  aboutCtx2.roundRect(0, 0, W, 18, [0,0,4,4]);
  aboutCtx2.fill(); aboutCtx2.stroke();
  for (let i = 0; i < CLOTH_COLS; i++) {
    const pt = clothPoints[i];
    if (!pt) continue;
    aboutCtx2.fillStyle = '#D4A843';
    aboutCtx2.beginPath();
    aboutCtx2.arc(pt.x, 9, 3.5, 0, Math.PI*2);
    aboutCtx2.fill();
  }

  // Hint
  if (clothHintTimer > 0) {
    clothHintTimer--;
    aboutCtx2.globalAlpha = Math.min(1, clothHintTimer / 80) * 0.45;
    aboutCtx2.fillStyle = '#F5F0E8';
    aboutCtx2.font = `${Math.round(Math.min(W,H)*0.033)}px 'DM Sans', sans-serif`;
    aboutCtx2.textAlign = 'center';
    aboutCtx2.fillText('drag to tear', W/2, H*0.5);
  }
  aboutCtx2.globalAlpha = 1;
}

// About canvas setup
if (aboutCanvas) {
  aboutCtx2 = aboutCanvas.getContext('2d');
  function resizeAbout() {
    aboutCanvas.width  = aboutCanvas.offsetWidth  || 500;
    aboutCanvas.height = aboutCanvas.offsetHeight || 625;
    initCloth();
    clothSamplerReady = false; // force redraw on resize
  }
  resizeAbout();
  new ResizeObserver(resizeAbout).observe(aboutCanvas);

  function getClothPos(e) {
    const rect = aboutCanvas.getBoundingClientRect();
    const src = e.touches ? e.touches[0] : e;
    return { x: src.clientX - rect.left, y: src.clientY - rect.top };
  }
  // Pending tear event — stored by mousemove, consumed by masterLoop once per frame
  let pendingTear = null;

  function applyTear() {
    if (!pendingTear) return;
    const { x, y } = pendingTear;
    pendingTear = null;
    const dx = x - clothMouse.x, dy = y - clothMouse.y;
    const speed = Math.sqrt(dx*dx + dy*dy);
    clothMouse.px = clothMouse.x; clothMouse.py = clothMouse.y;
    clothMouse.x  = x; clothMouse.y = y;
    const tearR2 = (20 + speed * 1.8) ** 2;
    for (let i = 0; i < clothConstraints.length; i++) {
      const cn = clothConstraints[i];
      if (!cn.active) continue;
      const a = clothPoints[cn.a], b = clothPoints[cn.b];
      const mx = (a.x+b.x)*0.5, my = (a.y+b.y)*0.5;
      const ddx = mx-x, ddy = my-y;
      if (ddx*ddx+ddy*ddy < tearR2) cn.active = false;
    }
    for (let i = 0; i < clothPoints.length; i++) {
      const pt = clothPoints[i];
      const ddx = pt.x-x, ddy = pt.y-y;
      if (ddx*ddx+ddy*ddy < 2025) { pt.x+=dx*0.55; pt.y+=dy*0.55; }
    }
  }

  // Expose for masterLoop
  window._applyClothTear = applyTear;

  aboutCanvas.addEventListener('mousemove',  e => {
    const p = getClothPos(e);
    if (clothMouse.down) pendingTear = p; // throttled: masterLoop consumes once/frame
    else { clothMouse.x=p.x; clothMouse.y=p.y; }
  }, { passive:true });
  aboutCanvas.addEventListener('mousedown',  e => { clothMouse.down=true; const p=getClothPos(e); clothMouse.x=p.x; clothMouse.y=p.y; clothMouse.px=p.x; clothMouse.py=p.y; });
  aboutCanvas.addEventListener('mouseup',    () => { clothMouse.down=false; pendingTear=null; });
  aboutCanvas.addEventListener('mouseleave', () => { clothMouse.down=false; pendingTear=null; });
  aboutCanvas.addEventListener('touchmove',  e => { e.preventDefault(); clothMouse.down=true; pendingTear=getClothPos(e); }, { passive:false });
  aboutCanvas.addEventListener('touchstart', e => { const p=getClothPos(e); clothMouse.x=p.x; clothMouse.y=p.y; clothMouse.px=p.x; clothMouse.py=p.y; clothMouse.down=true; });
  aboutCanvas.addEventListener('touchend',   () => { clothMouse.down=false; pendingTear=null; });
}

// ── 5. Color field palette canvas utilities ──
function makePaletteCanvas(canvasEl, palette, style) {
  if (!canvasEl) return;
  const ctx = canvasEl.getContext('2d');
  canvasEl.width  = canvasEl.offsetWidth  || 400;
  canvasEl.height = canvasEl.offsetHeight || 267;
  const W = canvasEl.width, H = canvasEl.height;
  if (style === 'stripes') {
    palette.forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.fillRect(0, i * (H/palette.length), W, H/palette.length + 1);
    });
  } else if (style === 'circles') {
    ctx.fillStyle = palette[0]; ctx.fillRect(0, 0, W, H);
    palette.slice(1).forEach((c, i) => {
      ctx.fillStyle = c; ctx.globalAlpha = 0.7;
      ctx.beginPath(); ctx.arc(W*.5, H*.5, (W*.45)*(1-i*.22), 0, Math.PI*2); ctx.fill();
    });
    ctx.globalAlpha = 1;
  } else if (style === 'mesh') {
    const corners = palette.slice(0, 4);
    for (let y = 0; y < H; y += 4) {
      for (let x = 0; x < W; x += 4) {
        const tx = x/W, ty = y/H;
        const lerp = (a,b,t) => a+(b-a)*t;
        const hexToRgb = h => { const n=parseInt(h.replace('#',''),16); return [(n>>16)&255,(n>>8)&255,n&255]; };
        const [ar,ag,ab] = hexToRgb(corners[0]), [br,bg,bb] = hexToRgb(corners[1]);
        const [cr,cg,cb] = hexToRgb(corners[2]), [dr,dg,db] = hexToRgb(corners[3]);
        ctx.fillStyle = `rgb(${Math.round(lerp(lerp(ar,br,tx),lerp(cr,dr,tx),ty))},${Math.round(lerp(lerp(ag,bg,tx),lerp(cg,dg,tx),ty))},${Math.round(lerp(lerp(ab,bb,tx),lerp(cb,db,tx),ty))})`;
        ctx.fillRect(x, y, 4, 4);
      }
    }
  }
}

// ── 6. REVEAL ON SCROLL ──────────────────────
const reveals = document.querySelectorAll('.reveal');
const revealObs = new IntersectionObserver(entries => {
  entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('visible'); });
}, { threshold: 0.12 });
reveals.forEach(el => revealObs.observe(el));

// ── 7. MARQUEE ───────────────────────────────
const track = document.querySelector('.marquee-track');
if (track) track.innerHTML += track.innerHTML;

// ── Start the single master loop ─────────────
masterLoop();
