// options.js (enhanced drop-in)
// - Debounced saves while typing
// - Live reflect storage changes from other tabs
// - Stronger validation/clamping
// - Safe element guards

const $ = (s) => document.querySelector(s);
const show = $('#showBtn');
const dur = $('#duration');          // seconds (UI) -> ms (storage)
const thr = $('#threshold');         // pixels (UI) -> px (storage)
const miniPlayerChk = $('#enableMiniPlayer');
const saved = $('#saved');
const resetBtn = $('#resetBtn');
const footerLink = $('#footerLink');

// Keep in sync with background.js
const defaults = {
  showScrollTop: true,
  scrollDuration: 500,      // ms
  scrollShowThreshold: 120, // px
  enableMiniPlayer: false
};

/* ---------------- Utils ---------------- */
const clamp = (v, min, max) => Math.min(max, Math.max(min, v));
const toSec = (ms) => (ms / 1000);
const toMs = (sec) => Math.round(sec * 1000);

// Simple debounce
function debounce(fn, wait = 300) {
  let t;
  return (...args) => {
    clearTimeout(t);
    t = setTimeout(() => fn.apply(null, args), wait);
  };
}

function flashSaved() {
  if (!saved) return;
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 900);
}

/* -------------- Load/Render -------------- */
async function restore() {
  const stored = await chrome.storage.sync.get(Object.keys(defaults));
  const showScrollTop = stored.showScrollTop ?? defaults.showScrollTop;
  const scrollDuration = stored.scrollDuration ?? defaults.scrollDuration;           // ms
  const scrollShowThreshold = stored.scrollShowThreshold ?? defaults.scrollShowThreshold; // px
  const enableMiniPlayer = stored.enableMiniPlayer ?? defaults.enableMiniPlayer;

  if (show) show.checked = !!showScrollTop;
  if (dur) dur.value = toSec(scrollDuration).toFixed(2).replace(/\.?0+$/, '');       // seconds
  if (thr) thr.value = String(scrollShowThreshold);                                   // px
  if (miniPlayerChk) miniPlayerChk.checked = !!enableMiniPlayer;
}

/* -------------- Persist (with validation) -------------- */
async function persist() {
  // Duration (seconds -> ms)
  let sec = parseFloat(dur?.value ?? '');
  if (!Number.isFinite(sec)) sec = toSec(defaults.scrollDuration);
  sec = clamp(sec, 0.1, 5);
  if (dur) dur.value = String(sec);

  // Threshold (pixels)
  let px = parseInt(thr?.value ?? '', 10);
  if (!Number.isFinite(px)) px = defaults.scrollShowThreshold;
  px = clamp(px, 0, 5000);
  if (thr) thr.value = String(px);

  const ms = toMs(sec);

  await chrome.storage.sync.set({
    showScrollTop: !!(show && show.checked),
    scrollDuration: ms,
    scrollShowThreshold: px,
    enableMiniPlayer: !!(miniPlayerChk && miniPlayerChk.checked)
  });
  flashSaved();
}

// Debounced version for input events
const persistDebounced = debounce(persist, 300);

/* -------------- Reset -------------- */
async function resetDefaults() {
  await chrome.storage.sync.set(defaults);
  await restore();
  flashSaved();
}

/* -------------- Wire up -------------- */
document.addEventListener('DOMContentLoaded', restore);

// Changes that should save immediately (checkboxes, blur/change)
show?.addEventListener('change', persist);
miniPlayerChk?.addEventListener('change', persist);
dur?.addEventListener('change', persist);
thr?.addEventListener('change', persist);

// While typing, debounce saves (nice UX; prevents rapid writes)
dur?.addEventListener('input', persistDebounced);
thr?.addEventListener('input', persistDebounced);

resetBtn?.addEventListener('click', resetDefaults);

// Footer link
footerLink?.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.youtube.com/@VibePhoenix' });
});

// Reflect updates if settings change elsewhere (another options tab)
chrome.storage.onChanged.addListener((changes, area) => {
  if (area !== 'sync') return;

  // Only re-render affected fields to avoid cursor jitter while typing
  if ('showScrollTop' in changes && show) {
    show.checked = !!changes.showScrollTop.newValue;
  }
  if ('scrollDuration' in changes && dur) {
    const val = toSec(changes.scrollDuration.newValue ?? defaults.scrollDuration);
    dur.value = val.toFixed(2).replace(/\.?0+$/, '');
  }
  if ('scrollShowThreshold' in changes && thr) {
    thr.value = String(changes.scrollShowThreshold.newValue ?? defaults.scrollShowThreshold);
  }
  if ('enableMiniPlayer' in changes && miniPlayerChk) {
    miniPlayerChk.checked = !!changes.enableMiniPlayer.newValue;
  }
});
