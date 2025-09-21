

This Chrome extension enhances YouTube’s fullscreen experience by enabling flexible layouts, allowing scrolling in fullscreen, and providing a configurable scroll-to-top button with customizable behavior.

---

## ✨ Features

* **Flexible fullscreen layout:** Forces `display:flex` on key YouTube watch containers when fullscreen.
* **Vertical scrolling in fullscreen:** Lets you scroll through the watch page while the player stays fullscreen.
* **Scroll-to-top button:** A floating button appears after you scroll down; clicking smoothly scrolls back to the top.
* **Fully configurable options page:**

  * Toggle the scroll-to-top button on or off.
  * Set how far (in pixels) you need to scroll before the button appears.
  * Set the scroll-back time (in seconds) for smooth scrolling.
  * Reset all settings to defaults with one click.
* **Dark themed options UI:** Clean centered panel with “made by vibephoenix” footer linking to [VibePhoenix YouTube channel](https://www.youtube.com/@VibePhoenix).
* **No data collection:** Uses only Chrome’s `storage` API to store your preferences locally or synced with your Google account.

---

## 📦 Installation (Developer Mode)

1. Download or clone this repository.
2. Open Chrome and navigate to `chrome://extensions`.
3. Enable **Developer mode** (top-right).
4. Click **Load unpacked** and select the extension folder.

---

## 🗂 Files

* **`manifest.json`** — MV3 manifest with host/storage permissions and options page.
* **`content.js`** — Injected script that toggles fullscreen scrolling and manages the scroll-to-top button.
* **`styles.css`** — Injected CSS for fullscreen layout tweaks and button styling.
* **`options.html`** — Dark UI for user settings.
* **`options.js`** — Handles saving/loading/resetting user preferences.
* **`background.js`** — Initializes default settings.
* **`icon.png`** — The extension’s icon shown in the toolbar and Extensions page.

---

## ⚙️ How It Works

* When YouTube enters fullscreen, the extension adds a `[scrolling]` attribute to `<ytd-app>` and applies new CSS rules to allow scrolling.
* A scroll-to-top button appears after your chosen scroll distance; clicking it smoothly scrolls back to the top in your chosen time.
* All settings persist via Chrome’s storage API.

---

## 🔧 Configuration

* Right-click the extension icon → **Options** (or open via Extensions → Details → Extension options).
* Adjust the **scroll distance** (pixels) and **scroll-back time** (seconds) as you like.
* Toggle the scroll-to-top button on/off or reset everything to defaults.

---

## ❌ Removal

* Go to `chrome://extensions`.
* Click **Remove** under **YouTube Flex Fullscreen**.

---

## 🔒 Privacy

This extension does not collect or transmit personal data. All settings are stored locally or synced with your Google account via Chrome’s built-in storage.
