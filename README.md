# Bring Back YouTube Search Sort (Upload Date / Views)

A Chrome extension (Manifest V3) that brings back sorting on YouTube search results with floating buttons for **Upload Date** and **Views**.

YouTube検索結果ページで使いにくくなった並び替えを、「最新順」「視聴回数順」のフローティングボタンで復活させるChrome拡張機能です。

![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green)
![Manifest V3](https://img.shields.io/badge/Manifest-V3-orange)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- Adds floating sort buttons ("Upload Date" / "Views") to the bottom-right of YouTube search results
- Works with YouTube's SPA (single-page-app) navigation, back/forward, and tab focus changes via retries and a `MutationObserver`
- Highlights the currently active sort mode based on the URL
- Style isolation using Shadow DOM to avoid clashing with YouTube's own styles
- Internationalized UI (13 locales) via `chrome.i18n`
- Minimal footprint: no extra permissions, no network requests, no data collection

## Requirements

- A Chromium-based browser with Manifest V3 support (Chrome, Edge, Brave, etc.)
- No build step or dependencies are required to run the extension — it is plain JavaScript loaded directly by the browser

## Installation

### Chrome / Edge / Brave (Load unpacked)

1. Download or clone this repository
2. Open `chrome://extensions/` (or `edge://extensions/`, `brave://extensions/`)
3. Enable **Developer mode** (toggle in the top-right)
4. Click **Load unpacked**
5. Select the repository root folder (the folder containing `manifest.json`)
6. Visit any YouTube search results page

Alternatively, you can build a distributable archive and load its extracted contents (see [Development](#development)).

### Firefox

> Note: Firefox support is not provided out of the box and requires minor manifest changes.

## Usage

1. Go to YouTube and search for something (a `/results?search_query=...` page)
2. Look for the floating buttons in the bottom-right corner
3. Click **最新順 / Upload date** or **視聴回数順 / View count**

The active mode is highlighted, and switching tabs or navigating within YouTube keeps the buttons in sync.

## How It Works

The extension is a single content script (`content.js`) injected on `https://www.youtube.com/*`. When it detects a search results page, it appends a Shadow-DOM overlay with two buttons. Clicking a button sets the `sp` query parameter on the current URL and navigates:

- **Upload date**: `sp=CAI=`
- **View count**: `sp=CAM=`

To stay in sync with YouTube's dynamic navigation, it listens for `yt-navigate-finish`, `popstate`, and `visibilitychange` events, re-runs with short retries, and observes DOM changes with a `MutationObserver`. It also polls the URL to update which button is marked active.

## Permissions & Privacy

The extension only declares `content_scripts` in [`manifest.json`](manifest.json) and requests no additional permissions:

- No `storage`, `tabs`, or host permissions beyond `www.youtube.com`
- **No data collection** and **no external network requests** — all logic runs locally

A privacy policy page is included at [`docs/index.html`](docs/index.html).

## Development

This project is plain JavaScript with no build tooling. Edit the source files directly and reload the unpacked extension in your browser to see changes.

### Project layout

```
.
├── manifest.json          # Manifest V3 definition (content script registration, i18n names, icons)
├── content.js             # The entire extension logic (content script)
├── _locales/<locale>/     # i18n message catalogs (ar, de, en, es, fr, hi, id, it, ja, ko, pt_BR, ru, zh_CN)
│   └── messages.json
├── icons/                 # Extension icons (16, 32, 48, 128 px)
├── docs/index.html        # Privacy policy page
├── LICENSE                # MIT license
└── package.json           # npm scripts for packaging
```

### Commands

The `package.json` scripts are **Windows/PowerShell only** (they invoke `powershell`):

- `npm run zip` — package `manifest.json`, `content.js`, `icons/`, `_locales/`, `LICENSE`, and `README.md` into `youtube_sort_back.zip`
- `npm run zip:clean` — remove `youtube_sort_back.zip`

There are no lint, test, typecheck, or build steps configured in this repository.

## License

MIT License - see [LICENSE](LICENSE) file for details.
