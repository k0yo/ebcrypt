# EBCrypt

A Chrome extension that assists with **Wiseman English Builder** by decrypting obfuscated answers and displaying them in the extension popup.

## Features

- **Answer Decryption** — Intercepts course data XML, decrypts obfuscated answers, and displays them in the popup
- **Score Modification** — Automatically sets scores to 100 on submitted exercises (via `commit.do` interception)
- **Popout Window** — Pop out the answers panel into a separate window for easier viewing
- **Copy to Clipboard** — One-click copy of all answers

## Installation

1. Download or clone this repository
2. Open Chrome and navigate to `chrome://extensions`
3. Enable **Developer mode** (toggle in top-right)
4. Click **Load unpacked** and select the `ebcrypt` folder
5. The extension icon should appear in your toolbar

## Usage

1. Navigate to any lesson on [Wiseman English Builder](https://www.wiseman.com.hk/)
2. Click the EBCrypt icon in the toolbar to view decrypted answers
3. Use the popout button (top-right corner) to open answers in a separate window
4. Click **Copy Answers** to copy all answers to your clipboard

## Project Structure

| File | Purpose |
|---|---|
| `background.js` | Service worker — intercepts `course_pc.exml` requests and forwards XML to content scripts |
| `content.js` | Parses course XML, decrypts answers, observes DOM for question matching |
| `decrypt.js` | Custom substitution cipher decryption function |
| `score-modifier.js` | MAIN-world script that overrides `fetch`/`XHR` to set scores to 100 |
| `popup.html` / `popup.js` | Extension popup UI |
| `window.html` / `window.js` | Popout window UI |
| `manifest.json` | Chrome extension manifest (Manifest V3) |

## Development

### Prerequisites

- Chrome or any Chromium-based browser
- Basic knowledge of Chrome extension development

### Making Changes

1. Edit the relevant source files
2. Go to `chrome://extensions`
3. Click the refresh icon on the EBCrypt card
4. Test your changes on Wiseman English Builder

### Building Documentation

```bash
cd docs
pip install -r requirements.txt
make html
```

## License

See [LICENSE](LICENSE) for details.
