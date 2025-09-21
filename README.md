# YouTube Flex Fullscreen (Chrome Extension)

This extension makes YouTube's fullscreen watch page use a flexible layout, allows scrolling in fullscreen,
and adjusts positioning when scrolling is enabled—similar to the custom CSS you shared.

## Install (Developer Mode)
1. Download and unzip this folder.
2. Open Chrome → `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the unzipped folder.

## What it does
- Forces `display:flex` on key watch containers in fullscreen.
- Allows vertical scrolling in fullscreen.
- Adds a `[scrolling]` attribute to `<ytd-app>` when in fullscreen so CSS can apply absolute positioning and horizontal scroll.

## Files
- `manifest.json` — MV3 manifest.
- `styles.css` — CSS injected on youtube.com pages.
- `content.js` — Watches for fullscreen/SPA navigation and toggles the `[scrolling]` attribute.

## Remove
Just remove the extension from `chrome://extensions`.
