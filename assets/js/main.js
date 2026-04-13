/* ============================================
   MOTT SPACES — Creative JS
   Particle and canvas effects
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

// ── 3. HERO CANVAS — Particles that form a chair ───────────────────────
const heroCanvas = document.getElementById('hero-canvas');
if (heroCanvas) {
  const ctx = heroCanvas.getContext('2d');
  let W, H;
  let chairTargets = []; // hoisted — must exist before resize() runs
  let shapeIndex   = 0;  // hoisted — used by buildChairTargets

  function resize() {
    W = heroCanvas.width  = window.innerWidth;
    H = heroCanvas.height = window.innerHeight;
    buildChairTargets();
  }
  resize();
  window.addEventListener('resize', resize);

  const PALETTE = ['#C4622D','#D4A843','#7A8C6E','#5C3D2E','#8A8A8A'];

  // ── MCM Furniture silhouette library ──
  // Each function returns [{x,y}] points centered on (cx,cy) at given scale

  // 1. Tulip / shell chair (original)
  function shapeTulipChair(cx, cy, sc) {
    const p = [], add = (x,y) => p.push({x:cx+x*sc, y:cy+y*sc});
    for (let a=0;a<Math.PI*2;a+=0.3)  add(Math.cos(a)*48, Math.sin(a)*9);          // base disc
    for (let i=0;i<=12;i++) { const t=i/12; add(0, -8+(-100)*t); }                  // column
    for (let a=0;a<Math.PI*2;a+=0.22) add(Math.cos(a)*62, -122+Math.sin(a)*24);    // seat
    for (let i=0;i<=14;i++) { const t=i/14;                                          // back left
      add((-60)*(1-t)**3+(-72)*3*t*(1-t)**2+(-52)*3*t**2*(1-t),
          (-116)*(1-t)**3+(-155)*3*t*(1-t)**2+(-228)*3*t**2*(1-t)+(-240)*t**3); }
    for (let i=0;i<=14;i++) { const t=i/14;                                          // back right
      add((60)*(1-t)**3+(72)*3*t*(1-t)**2+(52)*3*t**2*(1-t),
          (-116)*(1-t)**3+(-155)*3*t*(1-t)**2+(-228)*3*t**2*(1-t)+(-240)*t**3); }
    return p;
  }

  // 2. Ladder-back chair (from image: bottom row 4th)
  // Tapered legs, seat, rungs up the back
  function shapeLadderChair(cx, cy, sc) {
    const p = [], add = (x,y) => p.push({x:cx+x*sc, y:cy+y*sc});
    // Seat (flat rectangle)
    for (let x=-55;x<=55;x+=8)  { add(x, -110); add(x, -130); }
    for (let y=-130;y<=-110;y+=4) { add(-55,y); add(55,y); }
    // 4 tapered legs (splayed outward — signature MCM)
    const legs = [[-50,-110,-62,0],[-30,-110,-22,0],[30,-110,22,0],[50,-110,62,0]];
    legs.forEach(([x1,y1,x2,y2]) => {
      for (let i=0;i<=10;i++) { const t=i/10; add(x1+(x2-x1)*t, y1+(y2-y1)*t); }
    });
    // Ladder back — 2 uprights + 4 rungs
    for (let y=-130;y>=-260;y-=8) { add(-42,y); add(42,y); }  // uprights
    [-150,-175,-200,-225].forEach(y => {
      for (let x=-42;x<=42;x+=7) add(x,y);                    // rungs
    });
    return p;
  }

  // 3. Round pedestal table (top row 3rd — tripod splay legs)
  function shapePedestalTable(cx, cy, sc) {
    const p = [], add = (x,y) => p.push({x:cx+x*sc, y:cy+y*sc});
    // Tabletop — big ellipse
    for (let a=0;a<Math.PI*2;a+=0.15) add(Math.cos(a)*90, -120+Math.sin(a)*14);
    // Inner ring
    for (let a=0;a<Math.PI*2;a+=0.22) add(Math.cos(a)*70, -120+Math.sin(a)*10);
    // Central column
    for (let i=0;i<=10;i++) add(0, -120 + i*12);
    // 3 splayed legs (tripod)
    [0, 2.09, 4.19].forEach(angle => {
      const ex = Math.cos(angle)*72, ey = Math.sin(angle)*18;
      for (let i=0;i<=10;i++) {
        const t=i/10; add(ex*t, ey*t);
      }
    });
    return p;
  }

  // 4. Tufted ottoman (middle row 4th — fat square, 4 tiny splayed legs)
  function shapeOttoman(cx, cy, sc) {
    const p = [], add = (x,y) => p.push({x:cx+x*sc, y:cy+y*sc});
    // Body — rounded square
    for (let x=-70;x<=70;x+=6)  { add(x,-90); add(x,-160); }
    for (let y=-160;y<=-90;y+=6) { add(-70,y); add(70,y);  }
    // Button tufts (3x2 grid)
    [-35,0,35].forEach(x => [-115,-135].forEach(y => {
      for (let a=0;a<Math.PI*2;a+=0.5) add(x+Math.cos(a)*6, y+Math.sin(a)*4);
    }));
    // 4 short splayed legs
    [[-60,-90,-72,-50],[-40,-90,-30,-50],[40,-90,30,-50],[60,-90,72,-50]].forEach(([x1,y1,x2,y2]) => {
      for (let i=0;i<=6;i++) { const t=i/6; add(x1+(x2-x1)*t, y1+(y2-y1)*t); }
    });
    return p;
  }

  // 5. Low MCM sofa (bottom row last — wide, boxy, tapered legs)
  function shapeSofa(cx, cy, sc) {
    const p = [], add = (x,y) => p.push({x:cx+x*sc, y:cy+y*sc});
    // Seat base
    for (let x=-110;x<=110;x+=6) { add(x,-90); add(x,-130); }
    for (let y=-130;y<=-90;y+=5) { add(-110,y); add(110,y); }
    // Back cushion
    for (let x=-105;x<=105;x+=6) { add(x,-130); add(x,-190); }
    for (let y=-190;y<=-130;y+=6) { add(-105,y); add(105,y); }
    // Arm left
    for (let x=-110;x>=-125;x-=4) for (let y=-90;y>=-175;y+=8) add(x,y);
    // Arm right
    for (let x=110;x<=125;x+=4) for (let y=-90;y>=-175;y+=8) add(x,y);
    // 6 tapered legs
    [-90,-30,30,-90,-30,30].forEach((x,i) => {
      const flip = i < 3 ? -1 : 1;
      const bx = x, ex = x + flip*8;
      for (let j=0;j<=6;j++) { const t=j/6; add(bx+(ex-bx)*t, -90+(-90)*(-t)); }
    });
    return p;
  }

  // Shape roster — cycles in order
  const SHAPES = [
    shapeTulipChair,
    shapeLadderChair,
    shapePedestalTable,
    shapeOttoman,
    shapeSofa,
  ];
  // shapeIndex declared above at top of heroCanvas block

  function buildChairTargets() {
    if (typeof SHAPES === 'undefined' || !SHAPES.length) return; // guard: called before SHAPES is ready
    const scale = Math.min(W, H) / 280;
    const cx = W * 0.65;
    const cy = H * 0.72;
    const fn = SHAPES[shapeIndex % SHAPES.length];
    chairTargets = fn(cx, cy, scale);
  }

  // ── Formation state machine ──
  // States: 'wander' -> 'forming' -> 'hold' -> 'dissolving' -> 'wander'
  const WANDER_DUR   = 480;  // frames between formations (~8s at 60fps)
  const FORM_DUR     = 80;   // frames to lerp into position
  const HOLD_DUR     = 140;  // frames to hold the shape
  const DISSOLVE_DUR = 60;   // frames to release
  let formState = 'wander';
  let formTimer = WANDER_DUR; // start with a wait

  // ── Particle class ──
  class Particle {
    constructor(i) {
      this.i = i;
      this.wander();
      // Scatter randomly at boot
      this.x  = Math.random() * (W || 1200);
      this.y  = Math.random() * (H || 800);
    }

    wander() {
      this.tx  = null; this.ty = null;  // no target
      this.r   = Math.random() * 1.8 + 0.4;
      this.baseAlpha = Math.random() * 0.45 + 0.1;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.life = 0;
      this.maxLife = Math.random() * 400 + 200;
      if (!this.x) { this.x = Math.random() * (W||1200); this.y = Math.random() * (H||800); }
      this.vx = (Math.random() - 0.5) * 0.35;
      this.vy = (Math.random() - 0.5) * 0.35;
    }

    setTarget(tx, ty) {
      this.tx = tx; this.ty = ty;
      this.color = PALETTE[Math.floor(Math.random() * PALETTE.length)];
      this.r = Math.random() * 1.4 + 0.6;
      this.baseAlpha = Math.random() * 0.5 + 0.4;
    }

    update(t, state, progress) {
      if (state === 'wander' || state === 'dissolving') {
        // Flow-field steering
        const angle = Math.sin(this.x * 0.003 + t * 0.0003) *
                      Math.cos(this.y * 0.003 + t * 0.0002) * Math.PI * 2;
        this.vx += Math.cos(angle) * 0.012;
        this.vy += Math.sin(angle) * 0.012;
        this.vx *= 0.98; this.vy *= 0.98;
        this.x += this.vx; this.y += this.vy;
        this.life++;
        if (this.life > this.maxLife) this.wander();
      } else if ((state === 'forming' || state === 'hold') && this.tx !== null) {
        // Lerp toward target
        const speed = state === 'forming' ? 0.045 + progress * 0.04 : 0.08;
        this.x += (this.tx - this.x) * speed;
        this.y += (this.ty - this.y) * speed;
        this.vx = 0; this.vy = 0;
      } else {
        // No target — keep wandering
        const angle = Math.sin(this.x * 0.003 + t * 0.0003) *
                      Math.cos(this.y * 0.003 + t * 0.0002) * Math.PI * 2;
        this.vx += Math.cos(angle) * 0.012;
        this.vy += Math.sin(angle) * 0.012;
        this.vx *= 0.98; this.vy *= 0.98;
        this.x += this.vx; this.y += this.vy;
      }
    }

    draw(state, progress) {
      let alpha = this.baseAlpha;
      let r = this.r;

      if (state === 'forming') {
        alpha = this.baseAlpha * (0.4 + progress * 0.6);
        r = this.r * (0.6 + progress * 0.5);
      } else if (state === 'hold') {
        // Gentle pulse
        r = this.r * (1 + Math.sin(Date.now() * 0.003 + this.i * 0.4) * 0.12);
      } else if (state === 'dissolving') {
        alpha = this.baseAlpha * (1 - progress);
        r = this.r * (1 + progress * 0.5);
      }

      ctx.beginPath();
      ctx.arc(this.x, this.y, Math.max(0.1, r), 0, Math.PI * 2);
      ctx.fillStyle = this.color;
      ctx.globalAlpha = Math.max(0, Math.min(1, alpha));
      ctx.fill();
    }
  }

  // Build pool — extra particles for chair density
  const particles = [];
  for (let i = 0; i < 320; i++) particles.push(new Particle(i));
  buildChairTargets(); // safe to call now — SHAPES is defined

  // Assign targets from chairTargets array to a subset of particles
  function assignTargets() {
    buildChairTargets();
    const tgts = [...chairTargets];
    // Shuffle targets
    for (let i = tgts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [tgts[i], tgts[j]] = [tgts[j], tgts[i]];
    }
    particles.forEach((p, i) => {
      if (i < tgts.length) {
        p.setTarget(tgts[i].x, tgts[i].y);
      } else {
        p.tx = null; p.ty = null;
      }
    });
  }

  function releaseTargets() {
    particles.forEach(p => { p.tx = null; p.ty = null; p.wander(); });
  }

  // ── Faint grid ──
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

  // ── Connection lines ──
  function drawConnections(state) {
    const DIST = state === 'hold' ? 28 : 90;
    const alpha = state === 'hold' ? 0.18 : 0.07;
    for (let i = 0; i < particles.length; i++) {
      for (let j = i + 1; j < particles.length; j++) {
        const dx = particles[i].x - particles[j].x;
        const dy = particles[i].y - particles[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if (d < DIST) {
          ctx.globalAlpha = (1 - d / DIST) * alpha;
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

  // ── Ghost outline — draws current chairTargets as faint dots ──
  function drawGhostChair(alpha) {
    if (alpha <= 0 || !chairTargets.length) return;
    ctx.save();
    ctx.globalAlpha = alpha * 0.18;
    ctx.fillStyle = '#C4622D';
    chairTargets.forEach(pt => {
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, 1.5, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.restore();
  }

  let t = 0;
  let ghostAlpha = 0;

  function heroLoop() {
    requestAnimationFrame(heroLoop);
    ctx.clearRect(0, 0, W, H);

    // Background gradient
    const grad = ctx.createLinearGradient(0, 0, W, H);
    grad.addColorStop(0, '#F5F0E8');
    grad.addColorStop(0.5, '#EDE5D4');
    grad.addColorStop(1, '#E4D9C5');
    ctx.globalAlpha = 1;
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, W, H);

    drawGrid(t);

    // ── State machine tick ──
    formTimer--;
    let progress = 0;

    if (formState === 'wander' && formTimer <= 0) {
      formState = 'forming';
      formTimer = FORM_DUR;
      shapeIndex++; // advance to next shape in roster
      assignTargets();
    } else if (formState === 'forming') {
      progress = 1 - formTimer / FORM_DUR;
      if (formTimer <= 0) { formState = 'hold'; formTimer = HOLD_DUR; }
    } else if (formState === 'hold') {
      progress = 1;
      ghostAlpha = Math.min(1, ghostAlpha + 0.04);
      if (formTimer <= 0) { formState = 'dissolving'; formTimer = DISSOLVE_DUR; ghostAlpha = 0; releaseTargets(); }
    } else if (formState === 'dissolving') {
      progress = formTimer / DISSOLVE_DUR;
      ghostAlpha = Math.max(0, ghostAlpha - 0.05);
      if (formTimer <= 0) { formState = 'wander'; formTimer = WANDER_DUR; }
    }

    // Draw connections (tighter during hold)
    drawConnections(formState);

    ctx.globalAlpha = 1;
    particles.forEach(p => {
      p.update(t, formState, progress);
      p.draw(formState, progress);
    });

    // Ghost outline fades in during hold
    drawGhostChair(ghostAlpha);

    ctx.globalAlpha = 1;
    t++;
  }
  heroLoop();

  window.addEventListener('mousemove', e => {
    // Gentle mouse repulsion during wander
    if (formState !== 'wander') return;
    particles.forEach(p => {
      const dx = p.x - e.clientX, dy = p.y - e.clientY;
      const d = Math.sqrt(dx*dx + dy*dy);
      if (d < 80) {
        p.vx += (dx / d) * 0.8;
        p.vy += (dy / d) * 0.8;
      }
    });
  });
}

// ── 4. ABOUT CANVAS — Tearable Easel with MCM Chair ─────────────────────────
// Cloth physics: verlet integration, tearable canvas
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
  // Each quad samples its colour from the cloth painting image
  function drawCloth(ctx, W) {
    const imgReady = clothImg.complete && clothImg.naturalWidth > 0;

    // Keep sampler in sync with canvas size
    if (imgReady && (clothSampler.width !== W || clothSampler.height !== aboutCanvas.height)) {
      const H = aboutCanvas.height;
      clothSampler.width  = W;
      clothSampler.height = H;
      const sc = clothSampler.getContext('2d');
      // Cover-fit painting onto sampler
      const iw = clothImg.naturalWidth, ih = clothImg.naturalHeight;
      const scale = Math.max(W/iw, H/ih);
      const dw = iw*scale, dh = ih*scale;
      sc.drawImage(clothImg, (W-dw)/2, (H-dh)/2, dw, dh);
    }

    for (let r = 0; r < ROWS-1; r++) {
      for (let c = 0; c < COLS-1; c++) {
        const tl = points[r*COLS+c],     tr = points[r*COLS+c+1];
        const bl = points[(r+1)*COLS+c], br = points[(r+1)*COLS+c+1];
        const h1 = constraints.find(cn=>cn.a===r*COLS+c    &&cn.b===r*COLS+c+1    &&cn.active);
        const h2 = constraints.find(cn=>cn.a===(r+1)*COLS+c&&cn.b===(r+1)*COLS+c+1&&cn.active);
        const v1 = constraints.find(cn=>cn.a===r*COLS+c    &&cn.b===(r+1)*COLS+c  &&cn.active);
        const v2 = constraints.find(cn=>cn.a===r*COLS+c+1  &&cn.b===(r+1)*COLS+c+1&&cn.active);

        if (h1&&h2&&v1&&v2) {
          ctx.save();
          // Clip to quad shape
          ctx.beginPath();
          ctx.moveTo(tl.x,tl.y); ctx.lineTo(tr.x,tr.y);
          ctx.lineTo(br.x,br.y); ctx.lineTo(bl.x,bl.y);
          ctx.closePath();
          ctx.clip();

          if (imgReady) {
            // Draw the full painting — clipped to this quad
            // Use a transform to map original pixel UVs to deformed positions
            // UV coords: each quad knows where it started (rest position)
            const origX = c * (W/(COLS-1));
            const origY = 14 + r * (aboutCanvas.height*0.97/(ROWS-1));
            const qw = W/(COLS-1);
            const qh = aboutCanvas.height*0.97/(ROWS-1);

            // Build transform: map unit square → deformed quad via affine approx
            const ax = tr.x-tl.x, ay = tr.y-tl.y; // right
            const bx = bl.x-tl.x, by = bl.y-tl.y; // down
            ctx.transform(ax/qw, ay/qw, bx/qh, by/qh, tl.x, tl.y);

            // Draw full sampler shifted so this quad's original position maps to (0,0)
            ctx.drawImage(clothSampler, -origX, -origY);
          } else {
            // Fallback flat colour
            ctx.fillStyle = (r+c)%2===0 ? 'rgba(245,240,232,0.96)' : 'rgba(238,231,218,0.96)';
            ctx.fill();
          }
          ctx.restore();
        }
      }
    }

    // Subtle seam lines
    ctx.strokeStyle = 'rgba(0,0,0,0.08)';
    ctx.lineWidth = 0.5;
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

  // Bottom layer: revealed when cloth tears away
  const revealImg = new Image();
  revealImg.src = 'assets/images/chair-placeholder.jpg';

  // Top layer: the cloth IS this painting — tears through it
  const clothImg = new Image();
  clothImg.src = 'assets/images/cloth-painting.jpg';

  // Off-screen canvas to sample cloth image pixels per quad
  const clothSampler = document.createElement('canvas');

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
// Color field palette canvas utilities
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
