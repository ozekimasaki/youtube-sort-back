# AGENTS.md

Guidance for coding agents working in this repository.

## Overview

This repo is a **Manifest V3 Chrome extension** that restores sort-by-Upload-Date / sort-by-Views controls on YouTube search results pages. It is written in plain (vanilla) JavaScript with **no build step, no bundler, and no dependencies to install**. The browser loads the source files directly.

## Project structure & entry points

- `manifest.json` — Manifest V3 definition. Registers the single content script on `https://www.youtube.com/*` at `document_idle`, and wires the extension name/description to `chrome.i18n` (`__MSG_extensionName__`, `__MSG_extensionDescription__`) and the icons. `default_locale` is `en`.
- `content.js` — The entire extension logic. It is an IIFE content script that:
  - detects search results pages (`/results` with a `search_query`);
  - injects a Shadow-DOM overlay with two buttons in the bottom-right;
  - on click, sets the `sp` URL parameter (`CAI=` = upload date, `CAM=` = view count) and navigates;
  - keeps the active-button state and overlay presence in sync with YouTube's SPA navigation via `yt-navigate-finish`, `popstate`, `visibilitychange`, a debounced `MutationObserver`, and URL polling.
- `_locales/<locale>/messages.json` — i18n message catalogs. Locales present: `ar, de, en, es, fr, hi, id, it, ja, ko, pt_BR, ru, zh_CN`. Keys: `extensionName`, `extensionDescription`, `sortUploadDate`, `sortViewCount`.
- `icons/` — `16.png`, `32.png`, `48.png`, `128.png`.
- `docs/index.html` — Privacy policy page (Japanese).
- `package.json` — Only defines packaging scripts (see below). `private: true`, no dependencies.
- `youtube_sort_back.zip` — Prebuilt distributable archive (a generated artifact).

## Setup

No installation is required. There are no npm dependencies (`package.json` has no `dependencies`/`devDependencies`). Just clone and load the folder as an unpacked extension.

## Build / test / lint / typecheck

There is **no** test, lint, typecheck, or build/bundle tooling in this repository. Do not invent commands for these — none exist. The only scripts defined are packaging helpers, and they are **Windows/PowerShell only** (they shell out to `powershell`), so they will not run as-is on Linux/macOS:

- `npm run zip` — bundles `manifest.json`, `content.js`, `icons/`, `_locales/`, `LICENSE`, and `README.md` into `youtube_sort_back.zip`.
- `npm run zip:clean` — removes `youtube_sort_back.zip`.

To verify changes, load the extension unpacked (`chrome://extensions/` → Developer mode → Load unpacked → select the repo root) and test on a YouTube search results page.

## Coding conventions

- Vanilla ES modules-free JavaScript (an IIFE with `"use strict"`); no TypeScript, no frameworks.
- Two-space indentation, double-quoted strings, semicolons, arrow functions, and `const`/`let` (no `var`) — match the existing style in `content.js`.
- JSDoc comments are used on functions; comments in `content.js` are written in Japanese. Keep new comments consistent with the surrounding style.
- Keep the extension permission-light: no new permissions, no network requests, no data collection or persistence. Preserve Shadow DOM style isolation.
- User-facing strings must go through `chrome.i18n` (`t(key, fallback)` helper in `content.js`) and be added to **every** locale in `_locales/`, not just `en`. Keep `manifest.json` names using the `__MSG_*__` placeholders.

## Notes / gotchas

- The sort values (`sp=CAI=`, `sp=CAM=`) depend on YouTube's URL scheme and may break if YouTube changes it.
- YouTube is a single-page app; when changing overlay/injection logic, account for SPA navigation (`yt-navigate-finish`), back/forward (`popstate`), tab focus (`visibilitychange`), and dynamic DOM mutations — the existing code already handles these and uses retries plus a debounce.
- `normalizeSp` decodes multiply-encoded `sp` values before matching; keep this in mind when comparing sort modes.
- Scope changes to what the task requires; `youtube_sort_back.zip` is a generated artifact and should only change when repackaging.
