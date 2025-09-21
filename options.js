const $ = (s) => document.querySelector(s);
const show = $('#showBtn');
const dur = $('#duration');
const thr = $('#threshold');
const miniPlayerChk = $('#enableMiniPlayer');
const saved = $('#saved');
const resetBtn = $('#resetBtn');
const footerLink = $('#footerLink');

// Defaults (keep in sync with background.js)
const defaults = {
  showScrollTop: true,
  scrollDuration: 500,     // ms (display as seconds)
  scrollShowThreshold: 120, // px
  enableMiniPlayer: false
};

function flashSaved() {
  saved.classList.add('show');
  setTimeout(() => saved.classList.remove('show'), 900);
}

async function restore() {
  const stored = await chrome.storage.sync.get(Object.keys(defaults));
  const showScrollTop = stored.showScrollTop ?? defaults.showScrollTop;
  const scrollDuration = stored.scrollDuration ?? defaults.scrollDuration;
  const scrollShowThreshold = stored.scrollShowThreshold ?? defaults.scrollShowThreshold;
  const enableMiniPlayer = stored.enableMiniPlayer ?? defaults.enableMiniPlayer;

  show.checked = !!showScrollTop;
  dur.value = (scrollDuration / 1000).toFixed(2).replace(/\.?0+$/, ''); // seconds
  thr.value = scrollShowThreshold; // pixels
  miniPlayerChk.checked = !!enableMiniPlayer;
}

async function persist() {
  // seconds -> ms
  let sec = parseFloat(dur.value);
  if (!Number.isFinite(sec)) sec = defaults.scrollDuration / 1000;
  sec = Math.min(5, Math.max(0.1, sec));
  dur.value = sec;

  // pixels
  let px = parseInt(thr.value, 10);
  if (!Number.isFinite(px)) px = defaults.scrollShowThreshold;
  px = Math.min(5000, Math.max(0, px));
  thr.value = px;

  const ms = Math.round(sec * 1000);

  await chrome.storage.sync.set({
    showScrollTop: show.checked,
    scrollDuration: ms,
    scrollShowThreshold: px,
    enableMiniPlayer: miniPlayerChk.checked
  });
  flashSaved();
}

async function resetDefaults() {
  await chrome.storage.sync.set(defaults);
  await restore();
  flashSaved();
}

document.addEventListener('DOMContentLoaded', restore);
show.addEventListener('change', persist);
dur.addEventListener('change', persist);
thr.addEventListener('change', persist);
miniPlayerChk.addEventListener('change', persist);
resetBtn.addEventListener('click', resetDefaults);

// Footer link
footerLink.addEventListener('click', () => {
  chrome.tabs.create({ url: 'https://www.youtube.com/@VibePhoenix' });
});
