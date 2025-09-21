// Fullscreen scrolling attr + bottom-center "scroll to top" button
// User-config: on/off, duration (ms), and show-after-threshold (px). Works in fullscreen too.

(function () {
  const doc = document;
  const w = window;

  // ---- Settings (loaded first) ----
  const settings = {
    showScrollTop: true,
    scrollDuration: 500,
    scrollShowThreshold: 120
  };

  chrome.storage.sync.get(['showScrollTop', 'scrollDuration', 'scrollShowThreshold'], (res) => {
    if (typeof res.showScrollTop === 'boolean') settings.showScrollTop = res.showScrollTop;
    if (Number.isFinite(res.scrollDuration)) settings.scrollDuration = res.scrollDuration;
    if (Number.isFinite(res.scrollShowThreshold)) settings.scrollShowThreshold = res.scrollShowThreshold;
    init();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if ('showScrollTop' in changes) {
      settings.showScrollTop = !!changes.showScrollTop.newValue;
      applyButtonEnabledState();
    }
    if ('scrollDuration' in changes) {
      const v = Number(changes.scrollDuration.newValue);
      if (Number.isFinite(v)) settings.scrollDuration = v;
    }
    if ('scrollShowThreshold' in changes) {
      const v = Number(changes.scrollShowThreshold.newValue);
      if (Number.isFinite(v)) {
        settings.scrollShowThreshold = v;
        updateButtonVisibility();
      }
    }
  });

  // ---- Fullscreen scrolling attr ----
  function getApp() { return doc.querySelector('ytd-app'); }
  function applyScrollingAttr() {
    const app = getApp();
    if (!app) return;
    const isFullscreen = !!doc.fullscreenElement || app.hasAttribute('fullscreen');
    if (isFullscreen) app.setAttribute('scrolling', '');
    else app.removeAttribute('scrolling');
  }

  // ---- Button creation / toggle ----
  function ensureScrollTopButton() {
    let btn = doc.getElementById('ytfs-scroll-top-btn');
    if (btn) return btn;

    btn = doc.createElement('button');
    btn.id = 'ytfs-scroll-top-btn';
    btn.type = 'button';
    btn.setAttribute('aria-label', 'Scroll to top');
    btn.setAttribute('title', 'Scroll to top');
    btn.innerHTML = `
      <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
        <path d="M7.41 15.59 12 11l4.59 4.59L18 14.17 12 8l-6 6z"></path>
      </svg>
    `;

    // Shield events so YT overlay doesn't swallow them in fullscreen
    btn.addEventListener('pointerdown', (e) => { e.stopPropagation(); }, true);
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      e.preventDefault();
      smoothScrollToTop(settings.scrollDuration).then(() => requestAnimationFrame(updateButtonVisibility));
    }, true);

    doc.documentElement.appendChild(btn);
    return btn;
  }

  function removeScrollTopButton() {
    const btn = doc.getElementById('ytfs-scroll-top-btn');
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }

  function applyButtonEnabledState() {
    if (settings.showScrollTop) {
      ensureScrollTopButton();
      reparentButtonForFullscreen();
      attachScrollListeners();
      updateButtonVisibility();
    } else {
      removeScrollTopButton();
    }
  }

  // ---- Reparent for fullscreen ----
  function reparentButtonForFullscreen() {
    const btn = doc.getElementById('ytfs-scroll-top-btn');
    if (!btn) return;
    const fs = doc.fullscreenElement;
    if (fs) {
      if (!fs.contains(btn)) { try { fs.appendChild(btn); } catch {} }
    } else {
      if (btn.parentElement !== doc.documentElement) {
        try { doc.documentElement.appendChild(btn); } catch {}
      }
    }
  }

  // ---- Scroll roots & helpers ----
  function getScrollRoots() {
    return [
      doc.scrollingElement,
      doc.documentElement,
      doc.body,
      getApp(),
      doc.fullscreenElement,
      doc.querySelector('ytd-watch-flexy'),
      doc.querySelector('#columns'),
      doc.querySelector('#contents'),
    ].filter(Boolean);
  }

  function getCurrentScrollTop() {
    const roots = getScrollRoots();
    let maxTop = 0;
    for (const el of roots) {
      try {
        const top =
          (el === doc.scrollingElement || el === doc.documentElement || el === doc.body)
            ? (doc.scrollingElement || doc.documentElement).scrollTop
            : el.scrollTop;
        if (typeof top === 'number' && top > maxTop) maxTop = top;
      } catch {}
    }
    return maxTop;
  }

  // ---- Smooth scroll to top (duration ms) ----
  function smoothScrollToTop(duration) {
    return new Promise((resolve) => {
      const roots = getScrollRoots();
      let target = null, startTop = 0;
      for (const el of roots) {
        try {
          const top =
            (el === doc.scrollingElement || el === doc.documentElement || el === doc.body)
              ? (doc.scrollingElement || doc.documentElement).scrollTop
              : el.scrollTop;
          if (top > startTop) { startTop = top; target = el; }
        } catch {}
      }
      if (!target || startTop <= 0 || duration <= 0) { resolve(); return; }

      const startTime = performance.now();
      (function animate(now) {
        const t = Math.min(1, (now - startTime) / duration);
        const ease = 1 - Math.pow(1 - t, 3);
        const newTop = startTop * (1 - ease);
        try {
          if (typeof target.scrollTo === 'function') target.scrollTo(0, newTop);
          else target.scrollTop = newTop;
        } catch {}
        if (t < 1) requestAnimationFrame(animate); else resolve();
      })(startTime);
    });
  }

  // ---- Visibility (uses .shown class in CSS) ----
  function updateButtonVisibility() {
    const btn = doc.getElementById('ytfs-scroll-top-btn');
    if (!btn) return;
    if (!settings.showScrollTop) { btn.classList.remove('shown'); return; }
    const top = getCurrentScrollTop();
    if (top > settings.scrollShowThreshold) btn.classList.add('shown');
    else btn.classList.remove('shown');
  }

  // ---- Listen on real scrollers ----
  const attached = new WeakSet();
  function attachScrollListeners() {
    if (!settings.showScrollTop) return;

    if (!attached.has(w)) {
      w.addEventListener('scroll', updateButtonVisibility, { passive: true });
      w.addEventListener('resize', updateButtonVisibility, { passive: true });
      attached.add(w);
    }
    for (const el of getScrollRoots()) {
      if (!attached.has(el)) {
        try {
          el.addEventListener('scroll', updateButtonVisibility, { passive: true });
          el.addEventListener('resize', updateButtonVisibility, { passive: true });
          attached.add(el);
        } catch {}
      }
    }
  }

  // ---- Init + observers ----
  function init() {
    applyScrollingAttr();
    applyButtonEnabledState();
  }

  doc.addEventListener('fullscreenchange', () => {
    applyScrollingAttr();
    reparentButtonForFullscreen();
    attachScrollListeners();
    updateButtonVisibility();
  }, { passive: true });

  w.addEventListener('yt-navigate-finish', () => {
    applyScrollingAttr();
    applyButtonEnabledState();
  }, { passive: true });

  w.addEventListener('yt-page-data-updated', () => {
    applyButtonEnabledState();
  }, { passive: true });

  const appObserverInterval = setInterval(() => {
    const app = getApp();
    if (app) {
      new MutationObserver(() => {
        applyScrollingAttr();
        attachScrollListeners();
        updateButtonVisibility();
      }).observe(app, { attributes: true, attributeFilter: ['fullscreen'] });
      clearInterval(appObserverInterval);
    }
  }, 250);

  if (doc.readyState === 'loading') {
    doc.addEventListener('DOMContentLoaded', init, { once: true, passive: true });
  } else {
    init();
  }

  w.addEventListener('resize', applyScrollingAttr, { passive: true });
  w.addEventListener('scroll', applyScrollingAttr, { passive: true });
})();
