/* ============================================
   MOTT SPACES — Lightbox
   Click any .lightbox-trigger to expand
   Works with <img> or <canvas> placeholders
   ============================================ */

(function () {
  // ── Build DOM ──────────────────────────────
  const overlay = document.createElement('div');
  overlay.id = 'lightbox';
  overlay.innerHTML = `
    <div id="lb-backdrop"></div>
    <button id="lb-close" aria-label="Close">
      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
        <path d="M1 1l16 16M17 1L1 17" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
    </button>
    <button id="lb-prev" aria-label="Previous">
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
        <path d="M12 1L2 11l10 10" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <button id="lb-next" aria-label="Next">
      <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
        <path d="M2 1l10 10L2 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>
    <div id="lb-content">
      <div id="lb-img-wrap">
        <img id="lb-img" src="" alt="" />
        <canvas id="lb-canvas"></canvas>
      </div>
      <div id="lb-caption">
        <div id="lb-caption-inner">
          <p id="lb-title"></p>
          <p id="lb-meta"></p>
        </div>
        <span id="lb-counter"></span>
      </div>
    </div>
  `;
  document.body.appendChild(overlay);

  // ── Styles ─────────────────────────────────
  const style = document.createElement('style');
  style.textContent = `
    #lightbox {
      position: fixed; inset: 0; z-index: 9000;
      display: flex; align-items: center; justify-content: center;
      opacity: 0; pointer-events: none;
      transition: opacity 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
    }
    #lightbox.open { opacity: 1; pointer-events: all; }

    #lb-backdrop {
      position: absolute; inset: 0;
      background: rgba(28,24,20,0.92);
      backdrop-filter: blur(8px);
    }

    #lb-content {
      position: relative; z-index: 2;
      display: flex; flex-direction: column;
      max-width: min(90vw, 1100px);
      max-height: 90vh;
      transform: scale(0.94) translateY(12px);
      transition: transform 0.35s cubic-bezier(0.25,0.46,0.45,0.94);
    }
    #lightbox.open #lb-content { transform: scale(1) translateY(0); }

    #lb-img-wrap {
      position: relative;
      overflow: hidden;
      background: #1a1a1a;
      flex-shrink: 0;
    }
    #lb-img {
      display: block;
      max-width: min(90vw, 1100px);
      max-height: 75vh;
      width: auto; height: auto;
      object-fit: contain;
    }
    #lb-canvas {
      display: none;
      max-width: min(90vw, 1100px);
      max-height: 75vh;
    }

    #lb-caption {
      background: rgba(28,24,20,0.95);
      padding: 1rem 1.4rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      border-top: 1px solid rgba(212,168,67,0.2);
      flex-shrink: 0;
    }
    #lb-title {
      font-family: 'Cormorant Garamond', Georgia, serif;
      font-size: 1.1rem;
      font-weight: 300;
      color: #F5F0E8;
      margin: 0 0 0.2rem;
    }
    #lb-meta {
      font-size: 0.65rem;
      letter-spacing: 0.18em;
      text-transform: uppercase;
      color: #D4A843;
      margin: 0;
    }
    #lb-counter {
      font-size: 0.65rem;
      letter-spacing: 0.18em;
      color: rgba(245,240,232,0.35);
      white-space: nowrap;
      flex-shrink: 0;
    }

    #lb-close, #lb-prev, #lb-next {
      position: fixed; z-index: 3;
      background: rgba(44,44,44,0.7);
      border: 1px solid rgba(245,240,232,0.12);
      color: rgba(245,240,232,0.7);
      cursor: none;
      display: flex; align-items: center; justify-content: center;
      transition: background 0.2s, color 0.2s, transform 0.2s;
    }
    #lb-close:hover, #lb-prev:hover, #lb-next:hover {
      background: #C4622D;
      color: #F5F0E8;
    }
    #lb-close {
      top: 1.5rem; right: 1.5rem;
      width: 44px; height: 44px;
      border-radius: 50%;
    }
    #lb-prev, #lb-next {
      top: 50%; transform: translateY(-50%);
      width: 48px; height: 64px;
    }
    #lb-prev { left: 1.2rem; border-radius: 0 4px 4px 0; }
    #lb-next { right: 1.2rem; border-radius: 4px 0 0 4px; }
    #lb-prev:hover { transform: translateY(-50%) translateX(-2px); }
    #lb-next:hover { transform: translateY(-50%) translateX(2px); }
    #lb-prev.hidden, #lb-next.hidden { opacity: 0; pointer-events: none; }

    @media (max-width: 600px) {
      #lb-prev { left: 0.4rem; }
      #lb-next { right: 0.4rem; }
      #lb-caption { flex-direction: column; align-items: flex-start; gap: 0.3rem; }
    }
  `;
  document.head.appendChild(style);

  // ── State ──────────────────────────────────
  let items = [];   // array of { src, canvasId, title, meta }
  let current = 0;

  const lbImg     = document.getElementById('lb-img');
  const lbCanvas  = document.getElementById('lb-canvas');
  const lbTitle   = document.getElementById('lb-title');
  const lbMeta    = document.getElementById('lb-meta');
  const lbCounter = document.getElementById('lb-counter');
  const lbPrev    = document.getElementById('lb-prev');
  const lbNext    = document.getElementById('lb-next');

  // ── Show a specific item ───────────────────
  function show(index) {
    current = (index + items.length) % items.length;
    const item = items[current];

    lbImg.style.display    = 'none';
    lbCanvas.style.display = 'none';

    if (item.src) {
      // Real image
      lbImg.src = item.src;
      lbImg.alt = item.title || '';
      lbImg.style.display = 'block';
    } else if (item.canvasId) {
      // Clone the canvas from the page
      const src = document.getElementById(item.canvasId);
      if (src) {
        lbCanvas.width  = src.width;
        lbCanvas.height = src.height;
        const ctx = lbCanvas.getContext('2d');
        ctx.drawImage(src, 0, 0);
        lbCanvas.style.display = 'block';
      }
    }

    lbTitle.textContent   = item.title || '';
    lbMeta.textContent    = item.meta  || '';
    lbCounter.textContent = items.length > 1 ? `${current + 1} / ${items.length}` : '';

    lbPrev.classList.toggle('hidden', items.length <= 1);
    lbNext.classList.toggle('hidden', items.length <= 1);
  }

  // ── Open / close ──────────────────────────
  function open(index) {
    show(index);
    overlay.classList.add('open');
    document.body.style.overflow = 'hidden';
  }

  function close() {
    overlay.classList.remove('open');
    document.body.style.overflow = '';
  }

  // ── Controls ──────────────────────────────
  document.getElementById('lb-close').addEventListener('click', close);
  document.getElementById('lb-backdrop').addEventListener('click', close);
  lbPrev.addEventListener('click', () => show(current - 1));
  lbNext.addEventListener('click', () => show(current + 1));

  document.addEventListener('keydown', e => {
    if (!overlay.classList.contains('open')) return;
    if (e.key === 'Escape')      close();
    if (e.key === 'ArrowLeft')   show(current - 1);
    if (e.key === 'ArrowRight')  show(current + 1);
  });

  // ── Register triggers ─────────────────────
  // Call this after DOM is ready to wire up all .lightbox-trigger elements
  function register() {
    // Collect all triggers in DOM order to build the gallery array
    const triggers = Array.from(document.querySelectorAll('.lightbox-trigger'));
    items = triggers.map(el => ({
      src:      el.dataset.lbSrc      || (el.tagName === 'IMG' ? el.src : null),
      canvasId: el.dataset.lbCanvas   || null,
      title:    el.dataset.lbTitle    || el.querySelector('.find-item-name, .art-caption h4, h3')?.textContent?.trim() || '',
      meta:     el.dataset.lbMeta     || el.querySelector('.find-item-store, .art-meta')?.textContent?.trim()          || '',
    }));

    triggers.forEach((el, i) => {
      el.style.cursor = 'none';
      el.addEventListener('click', e => {
        // Don't open if user was dragging/scrolling
        e.preventDefault();
        e.stopPropagation();
        open(i);
      });
    });
  }

  // Run after load so canvases are drawn
  if (document.readyState === 'complete') {
    setTimeout(register, 120);
  } else {
    window.addEventListener('load', () => setTimeout(register, 120));
  }

  // Expose for manual re-registration after dynamic content
  window.LightboxRegister = register;
})();
