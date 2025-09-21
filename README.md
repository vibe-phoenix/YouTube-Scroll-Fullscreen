# YouTube Scroll Fullscreen (Chrome Extension)

This Chrome extension enhances YouTube’s fullscreen experience by enabling **scrolling in fullscreen**, providing a **configurable scroll-to-top button** with customizable behavior, and adding a **Mini-Player toggle** button to the player controls.

[**Installation**](#-install-from-chrome-web-store)

---

## ✨ Features

* **Flexible fullscreen layout:** Forces `display:flex` on key YouTube watch containers in fullscreen.
* **Vertical scrolling in fullscreen:** Lets you scroll through the watch page while the player stays fullscreen.
* **Scroll-to-top button:**

  * A floating button appears after you scroll down.
  * Clicking smoothly scrolls back to the top in your chosen time.
* **Mini-Player button (optional):**

  * Adds a persistent control in the player UI to toggle Mini-Player (like pressing “i”).
  * **Default Off** — can be enabled in the Options page.
* **Fully configurable options page:**

  * Toggle the scroll-to-top button on or off.
  * Set how far (in pixels) you need to scroll before the button appears.
  * Set the scroll-back time (in seconds) for smooth scrolling.
  * Toggle the Mini-Player button on/off.
  * Reset all settings to defaults with one click.
* **Dark, centered Options UI:** Clean layout with a footer link to [VibePhoenix’s channel](https://www.youtube.com/@VibePhoenix).
* **No data collection:** Uses only Chrome’s `storage` API to store your preferences locally or synced with your Google account.

---

## 🚀 Install from Chrome Web Store

[**➡️ Install from the Chrome Web Store**](https://chrome.google.com/webstore/detail/your-extension-id)
*(Replace the above link with your actual Chrome Web Store link once published)*

---

## 📝 Manual Installation (Developer Mode)

If you’re testing or installing manually before it’s on the Chrome Web Store:

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the extension folder.

---

## 🗂 Files

* `manifest.json` — MV3 manifest (host permissions, storage, options).
* `content.js` — Handles fullscreen scrolling and scroll-to-top button logic.
* `styles.css` — CSS tweaks for layout and button styling.
* `ytqp-mini.js` — Mini-Player toggle button (robust SPA handling).
* `options.html`, `options.js` — Dark, centered options page (pixels & seconds, reset).
* `background.js` — Initializes default settings.
* `icon.png` — Extension icon.
* `privacy.html` — Static privacy policy page (no data collected).

---

## ⚙️ How It Works

* When YouTube enters fullscreen, the extension applies its own attribute to `<ytd-app>` so CSS rules enable scrolling.
* The scroll-to-top button appears after your chosen scroll distance; clicking it smoothly scrolls back to the top in your chosen time.
* The Mini-Player button appears inside the player controls (if enabled).
* All settings persist via Chrome’s storage API.

---

## 🔧 Configuration

* Right-click the extension icon → **Options** (or go to Extensions → Details → Extension options).
* Adjust the **scroll distance** (pixels) and **scroll-back time** (seconds).
* Toggle the **scroll-to-top button** on/off.
* Toggle the **Mini-Player button** on/off.
* Reset everything to defaults.

---

## ❌ Removal

* Go to `chrome://extensions`.
* Click **Remove** under **YouTube Scroll Fullscreen**.

---

## 🔒 Privacy

This extension does not collect or transmit any personal data. All settings are stored locally or synced with your Google account via Chrome’s built-in storage.
