// Initialize defaults on install/update without overwriting existing user prefs.
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = {
    showScrollTop: true,       // scroll-to-top button visible by default
    scrollDuration: 500,       // ms (UI shows seconds)
    scrollShowThreshold: 120,  // px
    enableMiniPlayer: false    // Mini-Player button OFF by default
  };
  const curr = await chrome.storage.sync.get(Object.keys(defaults));
  const toWrite = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (curr[k] === undefined) toWrite[k] = v;
  }
  if (Object.keys(toWrite).length) await chrome.storage.sync.set(toWrite);
});
