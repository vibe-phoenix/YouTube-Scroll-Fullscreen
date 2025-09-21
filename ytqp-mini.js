// YT Quick Mini-Player – optional. Runs only when enabled in settings.
(function () {
  let enabled = false;
  let mo = null;
  let heartbeatId = null;
  const BTN_ID = "ytqp-mini-ctrl-btn";

  const ICON_SVG = `
    <svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false">
      <rect x="3" y="5" width="18" height="8" rx="1.5" fill="currentColor"></rect>
      <rect x="8" y="15" width="9" height="4" rx="1" fill="currentColor"></rect>
    </svg>
  `;

  // --- Utilities ---
  const isFullscreen = () => {
    const flexy = document.querySelector("ytd-watch-flexy");
    if (flexy && flexy.hasAttribute("fullscreen")) return true;
    return !!document.fullscreenElement;
  };
  const onWatchPage = () => !!document.querySelector("ytd-watch-flexy");
  const findPlayer = () => document.querySelector(".html5-video-player");
  const findRightControls = (player) => player?.querySelector(".ytp-right-controls");

  function ensureControlButton() {
    if (!enabled) return false;
    const player = findPlayer();
    const right = findRightControls(player);
    if (!player || !right) return false;

    let btn = document.getElementById(BTN_ID);
    if (!btn) {
      btn = document.createElement("button");
      btn.id = BTN_ID;
      btn.className = "ytp-button";
      btn.title = "Mini player (i)";
      btn.setAttribute("aria-label", "Mini player");
      // Style
      btn.style.display = "inline-flex";
      btn.style.alignItems = "center";
      btn.style.justifyContent = "center";
      btn.style.width = "40px";
      btn.style.height = "40px";
      btn.style.color = "#fff";
      btn.style.transform = "translateY(-15px) scale(1.5)";
      btn.style.transformOrigin = "center";
      btn.innerHTML = ICON_SVG;

      btn.addEventListener("click", triggerMiniPlayer, { passive: true });
    }

    // Insert before settings for visibility
    const settingsBtn = right.querySelector(".ytp-settings-button");
    if (settingsBtn) {
      if (btn.previousElementSibling !== settingsBtn && btn !== settingsBtn.previousElementSibling) {
        right.insertBefore(btn, settingsBtn);
      }
    } else if (!right.contains(btn)) {
      right.appendChild(btn);
    }

    updateVisibility();
    return true;
  }

  function updateVisibility() {
    const btn = document.getElementById(BTN_ID);
    if (!btn) return;
    const shouldShow = enabled && onWatchPage() && !isFullscreen();
    btn.style.display = shouldShow ? "inline-flex" : "none";
  }

  function triggerMiniPlayer() {
    const nativeBtn =
      document.querySelector(".ytp-miniplayer-button") ||
      document.querySelector('button[aria-label="Miniplayer"]');
    if (nativeBtn) {
      nativeBtn.click();
      return;
    }
    const ev = new KeyboardEvent("keydown", {
      key: "i",
      code: "KeyI",
      keyCode: 73,
      which: 73,
      bubbles: true
    });
    document.dispatchEvent(ev);
  }

  function startObservers() {
    if (mo) return;
    mo = new MutationObserver(() => {
      ensureControlButton();
      updateVisibility();
    });
    mo.observe(document.documentElement, {
      subtree: true,
      childList: true,
      attributes: true,
      attributeFilter: ["fullscreen", "class", "style"]
    });

    document.addEventListener("fullscreenchange", updateVisibility);
    window.addEventListener("resize", updateVisibility);

    document.addEventListener("visibilitychange", onVisibleEnsure);
    window.addEventListener("focus", onVisibleEnsure);

    window.addEventListener("yt-navigate-start", ensureControlButton);
    window.addEventListener("yt-navigate-finish", onNavigateFinish);
    window.addEventListener("yt-page-data-updated", ensureControlButton);

    // Heartbeat ensure
    heartbeatId = window.setInterval(ensureControlButton, 1500);
  }

  function stopObservers() {
    if (mo) { try { mo.disconnect(); } catch {} mo = null; }

    document.removeEventListener("fullscreenchange", updateVisibility);
    window.removeEventListener("resize", updateVisibility);

    document.removeEventListener("visibilitychange", onVisibleEnsure);
    window.removeEventListener("focus", onVisibleEnsure);

    window.removeEventListener("yt-navigate-start", ensureControlButton);
    window.removeEventListener("yt-navigate-finish", onNavigateFinish);
    window.removeEventListener("yt-page-data-updated", ensureControlButton);

    if (heartbeatId) { clearInterval(heartbeatId); heartbeatId = null; }
  }

  function onVisibleEnsure() { if (!document.hidden) ensureControlButton(); }
  function onNavigateFinish() { ensureControlButton(); updateVisibility(); }

  function removeButton() {
    const btn = document.getElementById(BTN_ID);
    if (btn && btn.parentNode) btn.parentNode.removeChild(btn);
  }

  function enableFeature() {
    if (enabled) return;
    enabled = true;
    ensureControlButton();
    startObservers();
    updateVisibility();
  }

  function disableFeature() {
    if (!enabled) return;
    enabled = false;
    stopObservers();
    removeButton();
  }

  // Entry: check setting then init/toggle live
  chrome.storage.sync.get(['enableMiniPlayer'], (res) => {
    if (res.enableMiniPlayer) enableFeature();
  });

  chrome.storage.onChanged.addListener((changes, area) => {
    if (area !== 'sync' || !('enableMiniPlayer' in changes)) return;
    const on = !!changes.enableMiniPlayer.newValue;
    if (on) enableFeature();
    else disableFeature();
  });
})();
