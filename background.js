// Set defaults on install/update, without overwriting user prefs.
chrome.runtime.onInstalled.addListener(async () => {
  const defaults = { showScrollTop: true, scrollDuration: 500, scrollShowThreshold: 120 };
  const curr = await chrome.storage.sync.get(Object.keys(defaults));
  const toWrite = {};
  for (const [k, v] of Object.entries(defaults)) {
    if (curr[k] === undefined) toWrite[k] = v;
  }
  if (Object.keys(toWrite).length) await chrome.storage.sync.set(toWrite);
});
