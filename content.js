// Fullscreen scrolling attr + bottom-center "scroll to top" button
// User-config: on/off (button), duration (ms), show-after-threshold (px).
// Optional: Direct Fullscreen Sync — coalesce to a single smooth step (targets <ytd-app> so scrolling still works).
// Fullscreen timing popup (bottom-center frosted pill) when enabled.

(function () {
  const doc = document;
  const w = window;

  // ---- Settings (loaded first) ----
  const settings = {
    showScrollTop: true,
    scrollDuration: 500,
    scrollShowThreshold: 120,
    enableFullscreenSync: false,
    enableFsToast: false
  };

  chrome.storage.sync.get(
    ['showScrollTop', 'scrollDuration', 'scrollShowThreshold', 'enableFullscreenSync', 'enableFsToast'],
    (res) => {
      if (typeof res.showScrollTop === 'boolean') settings.showScrollTop = res.showScrollTop;
      if (Number.isFinite(res.scrollDuration)) settings.scrollDuration = res.scrollDuration;
      if (Number.isFinite(res.scrollShowThreshold)) settings.scrollShowThreshold = res.scrollShowThreshold;
      if (typeof res.enableFullscreenSync === 'boolean') settings.enableFullscreenSync = res.enableFullscreenSync;
      if (typeof res.enableFsToast === 'boolean') settings.enableFsToast = res.enableFsToast;
      init();
    }
  );

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
    if ('enableFullscreenSync' in changes) {
      settings.enableFullscreenSync = !!changes.enableFullscreenSync.newValue;
    }
    if ('enableFsToast' in changes) {
      settings.enableFsToast = !!changes.enableFsToast.newValue;
    }
  });

  // ---- Fullscreen scrolling attr ----
  function getApp() { return doc.querySelector('ytd-app'); }
  function applyScrollingAttr() {
    const app = getApp();
    if (!app) return;
    const isFs = !!doc.fullscreenElement || app.hasAttribute('fullscreen');
    if (isFs) app.setAttribute('scrolling', '');
    else app.removeAttribute('scrolling');
  }

  // ---- Scroll-to-top button ----
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

  // =======================
  // Direct Fullscreen Sync (+ timing popup)
  // =======================
  // IMPORTANT: Target <ytd-app> for browser fullscreen so page remains scrollable.
  function getFullscreenTarget() {
    return (
      doc.querySelector('ytd-app') ||  // prefer app -> preserves scrolling
      doc.documentElement              // fallback
    );
  }
  function isBrowserFullscreen() { return !!doc.fullscreenElement; }

  // Timing state
  let lastFsClickTime = 0;
  let awaitingTiming = false;

  // Styled toast (matches button style; uses CSS .shown)
  function ensureFsToastEl() {
    let el = doc.getElementById('ytfs-fs-toast');
    if (!el) {
      el = doc.createElement('div');
      el.id = 'ytfs-fs-toast';
      el.textContent = '';
      doc.documentElement.appendChild(el);
    }
    return el;
  }
  function showFsToastMs(ms) {
    if (!settings.enableFsToast) return;
    const el = ensureFsToastEl();
    el.textContent = `${ms} ms`;
    el.classList.add('shown');
    clearTimeout(showFsToastMs._t);
    showFsToastMs._t = setTimeout(() => el.classList.remove('shown'), 1200);
  }

  function requestBrowserFullscreenNow() {
    if (isBrowserFullscreen()) return;
    const target = getFullscreenTarget();
    if (!target || !target.requestFullscreen) return;
    try { target.requestFullscreen({ navigationUI: 'hide' }).catch(() => {}); } catch {}
  }
  function exitBrowserFullscreenNow() {
    if (!isBrowserFullscreen()) return;
    if (typeof doc.exitFullscreen === 'function') {
      try { doc.exitFullscreen().catch?.(() => {}); } catch {}
    }
  }

  // Intercept clicks on YouTube's fullscreen button and coalesce to one step.
  // We run our request/exit in a microtask (setTimeout 0) so it happens
  // AFTER YouTube's own handler, ensuring our target (<ytd-app>) is final.
  function installFullscreenClickSync() {
    doc.addEventListener('click', (e) => {
      const t = e.target;
      if (!t) return;
      const btn = t.closest?.('.ytp-fullscreen-button, button.ytp-fullscreen-button, [data-title-no-tooltip="Full screen"], [data-title-no-tooltip="Exit full screen"]');
      if (!btn) return;

      lastFsClickTime = performance.now();
      awaitingTiming = true;

      if (!settings.enableFullscreenSync) return;

      if (!isBrowserFullscreen()) {
        // ENTER: request FS on <ytd-app> after YT runs (prevents player-only FS)
        setTimeout(requestBrowserFullscreenNow, 0);
      } else {
        // EXIT: exit document FS after YT runs (keeps state in sync)
        setTimeout(exitBrowserFullscreenNow, 0);
      }
    }, true); // capture
  }

  // Observe YT internal fullscreen flips; keep browser FS in sync both ways.
  function installFlexyObserver() {
    const flexy = doc.querySelector('ytd-watch-flexy');
    if (!flexy) return;
    const mo = new MutationObserver((mutations) => {
      for (const m of mutations) {
        if (m.type === 'attributes' && m.attributeName === 'fullscreen') {
          if (!settings.enableFullscreenSync) continue;

          const isFlexyFs = flexy.hasAttribute('fullscreen');
          // If YT ended up toggling later, ensure we still end with <ytd-app> as FS element.
          if (isFlexyFs && !isBrowserFullscreen()) {
            setTimeout(requestBrowserFullscreenNow, 0);
          } else if (!isFlexyFs && isBrowserFullscreen()) {
            setTimeout(exitBrowserFullscreenNow, 0);
          }
        }
      }
    });
    mo.observe(flexy, { attributes: true, attributeFilter: ['fullscreen'] });
  }

  // Measure browser FS timing and show the toast (browser ms only)
  function installTimingHooks() {
    doc.addEventListener('fullscreenchange', () => {
      if (!awaitingTiming) return;
      const clickToBrowserMs = Math.round(performance.now() - lastFsClickTime);
      showFsToastMs(clickToBrowserMs);
      awaitingTiming = false;
    }, { passive: true });
  }

  // ---- Init + observers ----
  function init() {
    applyScrollingAttr();
    applyButtonEnabledState();

    // Fullscreen sync + timing
    installFullscreenClickSync();
    installTimingHooks();

    // flexy may mount later; keep probing a bit
    const tryInstall = setInterval(() => {
      installFlexyObserver();
      if (doc.querySelector('ytd-watch-flexy')) clearInterval(tryInstall);
    }, 300);
    setTimeout(() => clearInterval(tryInstall), 6000);
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
    installFlexyObserver();
  }, { passive: true });

  w.addEventListener('yt-page-data-updated', () => {
    applyButtonEnabledState();
    installFlexyObserver();
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
