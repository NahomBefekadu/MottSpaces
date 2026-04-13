/* ============================================
   MOTT SPACES — Auto card canvas renderer
   ============================================
   HOW TO ADD A NEW CARD — HTML only, no JS needed:

   THRIFT FIND:
   ─────────────────────────────────────────────
   <a href="#"
      class="find-item lightbox-trigger reveal"
      data-card="find"
      data-price="$12"
      data-aspect="3/4"
      data-lb-title="Your Item Name"
      data-lb-meta="Store Name · Location">
     <div class="find-item-img">
       <canvas></canvas>
     </div>
     <div class="find-item-body">
       <div class="find-item-top">
         <span class="find-item-name">Your Item Name</span>
         <span class="find-price-tag">$12</span>
       </div>
       <span class="find-item-store">Store Name · Location</span>
       <span class="find-item-retail">Retail: <s>~$200</s></span>
       <p class="find-item-note">Your note about the item.</p>
     </div>
   </a>

   ART PIECE:
   ─────────────────────────────────────────────
   <div class="art-card lightbox-trigger reveal"
        data-card="art"
        data-lb-title="Piece Title"
        data-lb-meta="Medium · Found 2025">
     <span class="art-tag">Medium</span>
     <canvas></canvas>
     <div class="art-caption">
       <h4>Piece Title</h4>
       <span class="art-meta">Medium · Found 2025</span>
       <p class="art-note">Short note about the piece.</p>
     </div>
   </div>

   REAL PHOTO — just swap canvas for img:
   ─────────────────────────────────────────────
   Replace <canvas></canvas> with:
   <img src="../assets/images/your-photo.jpg" alt="description" loading="lazy" />
   The card layout and lightbox still work automatically.

   ============================================ */

(function () {

  // MCM colour palette — rotated per card automatically
  const PALETTES = [
    ['#5C3D2E', '#D4A843', '#F5F0E8'],
    ['#EDE5D4', '#C4622D', '#7A8C6E'],
    ['#2C2C2C', '#D4A843', '#C4622D'],
    ['#7A8C6E', '#F5F0E8', '#5C3D2E'],
    ['#F5F0E8', '#C4622D', '#D4A843'],
    ['#D4A843', '#2C2C2C', '#C4622D'],
    ['#3A2A20', '#C4622D', '#D4A843'],
    ['#EDE5D4', '#5C3D2E', '#C4622D'],
  ];

  let paletteIndex = 0;
  function nextPalette() {
    return PALETTES[paletteIndex++ % PALETTES.length];
  }

  // ── Draw a find/art placeholder canvas ──────
  function drawPlaceholder(canvas, colors) {
    const parent = canvas.parentElement;
    const W = parent.offsetWidth  || 300;
    const H = parent.offsetHeight || 300;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, W, H);

    // Shape 1 — diagonal band
    ctx.fillStyle = colors[1];
    ctx.beginPath();
    ctx.moveTo(0, H * 0.5);
    ctx.lineTo(W, H * 0.22);
    ctx.lineTo(W, H);
    ctx.lineTo(0, H);
    ctx.fill();

    // Shape 2 — circle accent
    ctx.fillStyle = colors[2];
    ctx.globalAlpha = 0.65;
    ctx.beginPath();
    ctx.arc(W * 0.67, H * 0.35, W * 0.13, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    // Grain texture
    for (let i = 0; i < 3500; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.025) + ')';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  }

  // ── Draw featured find canvas ───────────────
  function drawFeatured(canvas, colors) {
    const parent = canvas.parentElement;
    const W = parent.offsetWidth  || 600;
    const H = parent.offsetHeight || 400;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, colors[0]);
    g.addColorStop(1, colors[1]);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    ctx.fillStyle = colors[2];
    ctx.globalAlpha = 0.28;
    ctx.beginPath();
    ctx.arc(W * 0.3, H * 0.6, W * 0.35, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 0.15;
    ctx.beginPath();
    ctx.arc(W * 0.8, H * 0.2, W * 0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.globalAlpha = 1;

    for (let i = 0; i < 5000; i++) {
      ctx.fillStyle = 'rgba(0,0,0,' + (Math.random() * 0.018) + ')';
      ctx.fillRect(Math.random() * W, Math.random() * H, 2, 2);
    }
  }

  // ── Draw art card canvas (painterly) ────────
  function drawArt(canvas, colors) {
    const parent = canvas.parentElement;
    const W = parent.offsetWidth  || 400;
    const H = parent.offsetHeight || 500;
    canvas.width  = W;
    canvas.height = H;
    const ctx = canvas.getContext('2d');

    ctx.fillStyle = colors[0];
    ctx.fillRect(0, 0, W, H);

    // Two organic circles
    [[0.35, 0.42, 0.32], [0.72, 0.62, 0.2]].forEach(([x, y, r], i) => {
      ctx.globalAlpha = 0.38 + i * 0.08;
      ctx.fillStyle = colors[i + 1] || colors[1];
      ctx.beginPath();
      ctx.arc(x * W, y * H, r * W, 0, Math.PI * 2);
      ctx.fill();
    });

    // Painterly brush strokes
    ctx.globalAlpha = 0.07;
    for (let i = 0; i < 60; i++) {
      ctx.strokeStyle = ['#fff', '#000', colors[1]][i % 3];
      ctx.lineWidth   = Math.random() * 10 + 2;
      ctx.lineCap     = 'round';
      ctx.beginPath();
      ctx.moveTo(Math.random() * W, Math.random() * H);
      ctx.quadraticCurveTo(
        Math.random() * W, Math.random() * H,
        Math.random() * W, Math.random() * H
      );
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }

  // ── Wire aspect ratio from data-aspect ──────
  function applyAspect(el) {
    const ar = el.closest('[data-aspect]')?.dataset.aspect;
    if (ar) el.parentElement.style.aspectRatio = ar;
  }

  // ── Auto-init all data-card elements ────────
  function initCards() {
    // Find cards (data-card="find")
    document.querySelectorAll('[data-card="find"] canvas').forEach(canvas => {
      applyAspect(canvas);
      if (canvas.closest('[data-card="featured"]')) {
        drawFeatured(canvas, nextPalette());
      } else {
        drawPlaceholder(canvas, nextPalette());
      }
    });

    // Featured find (data-card="featured")
    document.querySelectorAll('[data-card="featured"] canvas').forEach(canvas => {
      drawFeatured(canvas, nextPalette());
    });

    // Art cards (data-card="art")
    document.querySelectorAll('[data-card="art"] canvas').forEach(canvas => {
      drawArt(canvas, nextPalette());
    });

    // Art spotlight (data-card="art-spotlight")
    document.querySelectorAll('[data-card="art-spotlight"] canvas').forEach(canvas => {
      drawFeatured(canvas, ['#3A2A20', '#1A1A1A', '#C4622D']);
    });

    // Auto-assign lb-canvas IDs if missing
    document.querySelectorAll('[data-lb-canvas]').forEach(el => {
      const id = el.dataset.lbCanvas;
      const canvas = el.querySelector('canvas');
      if (canvas && !canvas.id) canvas.id = id;
    });

    // Re-run lightbox registration if available
    if (typeof window.LightboxRegister === 'function') {
      window.LightboxRegister();
    }
  }

  if (document.readyState === 'complete') {
    initCards();
  } else {
    window.addEventListener('load', initCards);
  }

  window.CardsInit = initCards;

})();
