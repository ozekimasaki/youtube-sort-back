# Bring Back YouTube Search Sort (Upload Date / Views)

A Chrome extension that brings back sorting on YouTube search results with buttons for Upload Date / Views.

YouTube検索結果ページで消された（使いにくくなった）並び替えを、最新順/視聴回数順ボタンで復活させるChrome拡張機能です。

![Screenshot](https://img.shields.io/badge/Chrome-Extension-green)
![License](https://img.shields.io/badge/License-MIT-blue)

## Features

- Adds floating sort buttons ("Upload Date" / "Views") to YouTube search results
- Works with YouTube's SPA navigation
- Minimal permissions - no data collection
- Shadow DOM for style isolation

## Installation

### Chrome / Edge / Brave

1. Download or clone this repository
2. Open `chrome://extensions/` (or `edge://extensions/`)
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked**
5. Select the `youtube_sort_back` folder
6. Visit any YouTube search results page

### Firefox

> Note: Firefox support requires minor manifest changes.

## Usage

1. Go to YouTube and search for something
2. Look for the floating buttons in the bottom-right corner
3. Click **最新順** (Upload Date) or **視聴回数順** (Views)

## How It Works

The extension adds `sp` parameter to the URL:
- **Upload Date**: `sp=CAI=`
- **Views**: `sp=CAM=`

## Permissions

This extension only uses `content_scripts` and requires no additional permissions:
- No `storage` permission
- No `tabs` permission
- No network requests

## Privacy

- **No data collection**: This extension does not collect any personal information
- **No external requests**: All processing is done locally
- **No local storage**: Nothing is saved to your device

## Disclaimer

- This extension is **not affiliated** with YouTube or Google
- YouTube may change their API at any time, which could break this extension

## License

MIT License - see [LICENSE](LICENSE) file for details.
