---
name: browser-demo-recorder
description: Record browser automation demos as video files with an animated cursor, on a hidden virtual display so the user's desktop is unaffected. Use when creating demo videos, client walkthroughs, feature-verification recordings, screen recordings of a web app, or "record a demo of...", "make a screen recording", "capture this flow as a video".
allowed-tools: Bash, Read, Write, Edit
---

# Browser Demo Recorder

Record browser automation with a realistic animated cursor for client demos and verification videos. Runs Playwright + Chrome on a background Xvfb display and captures it with ffmpeg — nothing appears on the real desktop.

## Requirements

- `xvfb` — virtual display (`sudo apt install xvfb`)
- `ffmpeg` — video encoding (usually pre-installed)
- `google-chrome` — launched via Playwright's `channel: 'chrome'`
- A resolvable `playwright` package (see Environment Notes)

## Quick Start

```bash
./scripts/record-demo.sh output.webm
```

Or customize `scripts/record-browser-demo.mjs` for a specific workflow, then run the wrapper.

## How It Works

1. **Virtual display** — Xvfb creates display `:99` (1920x1080)
2. **Recording** — ffmpeg captures the virtual display to VP9 webm
3. **Browser** — Playwright launches Chrome on the virtual display
4. **Cursor** — an SVG pointer injected via JS, animated to follow actions
5. **System cursor hidden** — CSS `cursor: none` hides the real cursor

## Environment Notes

These reflect real-world gotchas — follow them to avoid silent failures:

- **Use `channel: 'chrome'`, not bundled Chromium.** On many Linux hosts Playwright's bundled Chromium is incompatible; a system `google-chrome` via `channel: 'chrome'` is reliable.
- **Playwright is CommonJS.** If your `.mjs` lives outside the tree that contains `node_modules/playwright`, a bare `import { chromium } from 'playwright'` fails (ESM resolves from the script's own location). Two fixes: keep the script under a directory whose parent has `node_modules/playwright`, or import by absolute path with a default import:
  ```javascript
  import pw from '/abs/path/to/node_modules/playwright/index.js';
  const { chromium } = pw;
  ```
- **Verify before delivering.** Extract a few frames (`ffmpeg -ss <t> -i out.webm -frames:v 1 f.png`) and check them — a bright average luma (`signalstats` YAVG) confirms it isn't a black frame.
- **Scroll long forms into view.** Call `el.scrollIntoViewIfNeeded()` before reading `boundingBox()` so the animated cursor tracks off-screen fields correctly.

## Customizing the Demo Script

Edit `scripts/record-browser-demo.mjs` to change the automation flow.

### Key Functions

```javascript
await moveCursorAndClick(page, 'button.submit');       // move cursor + click
await moveCursorAndClick(page, page.locator('text=Login'));
await moveCursor(page, 500, 300, 400);                 // x, y, duration_ms
await element.type('Hello world', { delay: 100 });     // typing with visible delay
```

### Cursor Injection

Re-inject after every navigation (`page.goto`, form submit, etc.):

```javascript
await page.evaluate(CURSOR_INIT);
await page.mouse.move(0, 0);  // hide the system cursor
```

## Output Formats

Default output is VP9 webm. Convert as needed:

```bash
# MP4 (H.264) — best for email attachments / broad compatibility
ffmpeg -i demo.webm -c:v libx264 -crf 22 -pix_fmt yuv420p -movflags +faststart demo.mp4
# GIF (for docs/PRs)
ffmpeg -i demo.webm -vf "fps=15,scale=800:-1" demo.gif
```

## Troubleshooting

- **Two cursors visible** — system cursor showing through. Ensure `cursor: none` CSS is injected and `page.mouse.move(0, 0)` runs after navigation.
- **Black video** — Xvfb not running or wrong display. Check `ps aux | grep Xvfb` and that ffmpeg targets the same `:99`.
- **Cursor not moving** — `CURSOR_INIT` must be re-injected after each navigation.
- **`ERR_MODULE_NOT_FOUND` / named export not found** — see Environment Notes (Playwright is CommonJS).
