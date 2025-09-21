// YouTube Fullscreen Sync
// Goal: Skip YouTube's "semi fullscreen / full-window" hop and go straight to browser fullscreen.
// - Captures clicks/keyboard on the fullscreen toggle and runs our requestFullscreen ASAP.
// - Optional pre-smooth animation (experimental).

(function () {
  const S = {
    enableFsSync: true,
    enableSmoothPreAnim: false,
    preAnimDurationMs: 160
  };

  // Load settings, then init
  chrome.storage.sync.get(['enableFsSync', 'enableSmoothPreAnim', 'preAnimDurationMs'], (res) => {
    if (typeof res.enableFsSync === 'boolean') S.enableFsSync = res.enableFsSync;
    if (typeof res.enableSmoothPreAnim === 'boolean') S.enableSmoothPreAnim = res.enableSmoothPreAnim;
    if (Number.isFinite(res.preAnimDurationMs)) S.preAnimDurationMs = res.preAnimDurationMs;
    init();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync') return;
    if ('enableFsSync' in changes) S.enableFsSync = !!changes.enableFsSync.newValue;
    if ('enableSmoothPreAnim' in changes) S.enableSmoothPreAnim = !!changes.enableSmoothPreAnim.newValue;
    if ('preAnimDurationMs' in changes) {
      const v = Number(changes.preAnimDurationMs.newValue);
      if (Number.isFinite(v)) S.preAnimDurationMs = v;
    }
  });

  function findFlexy() { return document.querySelector('ytd-watch-flexy'); }
  function findPlayerContainer() {
    // Try the element YT typically requests fullscreen on:
    return document.querySelector('#player-container #movie_player') ||
           document.querySelector('.html5-video-player') ||
           document.querySelector('#movie_player') ||
           findFlexy();
  }
  function isDocFullscreen() { return !!document.fullscreenElement; }
  function isFlexyFullscreen() {
    const flexy = findFlexy();
    return flexy?.hasAttribute('fullscreen');
  }

  // Core: enter fullscreen ASAP, skipping the "full-window" intermediate step.
  async function enterFullscreenFast() {
    const target = findPlayerContainer() || document.documentElement;

    if (S.enableSmoothPreAnim) {
      try {
        document.documentElement.style.setProperty('--ytfs-preanim-duration', `${S.preAnimDurationMs}ms`);
        const pre = target;
        pre.classList.add('ytfs-preanim', 'ytfs-preanim-start');
        // Next frame: remove start class so it animates to full
        requestAnimationFrame(() => {
          pre.classList.remove('ytfs-preanim-start');
        });
      } catch {}
    }

    // Request browser fullscreen ASAP (this is what eliminates the "semi" step).
    try {
      if (target.requestFullscreen) {
        await target.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      } else if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen({ navigationUI: 'hide' }).catch(() => {});
      }
    } catch {}

    // Clean up pre-anim container style shortly after we enter FS
    if (S.enableSmoothPreAnim) {
      setTimeout(() => {
        const pre = findPlayerContainer();
        pre?.classList.remove('ytfs-preanim', 'ytfs-preanim-start');
      }, Math.max(0, S.preAnimDurationMs + 50));
    }
  }

  async function exitFullscreenFast() {
    try {
      if (document.fullscreenElement && document.exitFullscreen) {
        await document.exitFullscreen().catch(() => {});
      }
    } catch {}
  }

  // We intercept both click on the native fullscreen button and keydown 'f'.
  // We run in capture phase, stop propagation, perform our own FS request, then
  // re-dispatch a synthetic click/keydown to let YT update its UI state (icons/classes)
  // without requesting fullscreen again (a redundant request will just be ignored by the browser).
  function onFullscreenClickCapture(e) {
    if (!S.enableFsSync) return;
    const btn = e.target.closest('.ytp-fullscreen-button');
    if (!btn) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    if (!isDocFullscreen()) {
      enterFullscreenFast().then(() => {
        // Let YT update its UI state
        setTimeout(() => safeNativeClick(btn), 0);
      });
    } else {
      exitFullscreenFast().then(() => {
        setTimeout(() => safeNativeClick(btn), 0);
      });
    }
  }

  function onKeydownCapture(e) {
    if (!S.enableFsSync) return;
    if (e.key !== 'f' && e.key !== 'F') return;

    // Only act on watch page with a player present
    if (!findPlayerContainer()) return;

    e.preventDefault();
    e.stopImmediatePropagation();
    e.stopPropagation();

    if (!isDocFullscreen()) {
      enterFullscreenFast().then(() => {
        // Re-dispatch for YT's UI
        setTimeout(() => dispatchSyntheticKey('f'), 0);
      });
    } else {
      exitFullscreenFast().then(() => {
        setTimeout(() => dispatchSyntheticKey('f'), 0);
      });
    }
  }

  function safeNativeClick(el) {
    try { el.click(); } catch {}
  }

  function dispatchSyntheticKey(key) {
    try {
      const ev = new KeyboardEvent('keydown', { key, code: key === 'f' ? 'KeyF' : '', bubbles: true });
      document.dispatchEvent(ev);
    } catch {}
  }

  // Keep YT state in sync if something else toggles fullscreen (menu, shortcut, etc.)
  function onFsChange() {
    // No-op; we rely on YT’s UI reflecting document.fullscreenElement automatically.
    // If needed, we could force a minor UI refresh here.
  }

  function attach() {
    // Capture handlers to beat YouTube's own handlers in the event order
    document.addEventListener('click', onFullscreenClickCapture, true);
    document.addEventListener('keydown', onKeydownCapture, true);
    document.addEventListener('fullscreenchange', onFsChange, { passive: true });

    // Resilience: re-attach after SPA changes
    window.addEventListener('yt-navigate-finish', noopEnsure, { passive: true });
    window.addEventListener('yt-page-data-updated', noopEnsure, { passive: true });
  }

  function detach() {
    document.removeEventListener('click', onFullscreenClickCapture, true);
    document.removeEventListener('keydown', onKeydownCapture, true);
    document.removeEventListener('fullscreenchange', onFsChange, { passive: true });
    window.removeEventListener('yt-navigate-finish', noopEnsure, { passive: true });
    window.removeEventListener('yt-page-data-updated', noopEnsure, { passive: true });
  }

  function noopEnsure() {
    // placeholder to keep capture listeners active across SPA
  }

  function init() {
    if (window.__yt_fssync_init) return;
    window.__yt_fssync_init = true;
    attach();
  }
})();
