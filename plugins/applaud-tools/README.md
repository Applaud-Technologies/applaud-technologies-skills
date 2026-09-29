# applaud-tools

General-purpose developer utilities and tools that aren't tied to a specific stack.

## Installation

Add the marketplace first, if you haven't already, then install the plugin:

```bash
/plugin marketplace add applaud-technologies/applaud-technologies-skills
/plugin install applaud-tools@applaud-technologies-skills
```

This plugin is standalone. It doesn't need `applaud-core`.

## Requirements

**Linux only.** The recorder draws to an Xvfb virtual display, so it won't run on macOS or natively on Windows.

- `xvfb` and `ffmpeg`: `sudo apt install xvfb ffmpeg`
- `google-chrome` (Playwright's bundled Chromium isn't used)
- Node.js 20+ with Playwright installed in the project you run the recorder from. Otherwise, set `PLAYWRIGHT_PATH=/abs/path/to/node_modules/playwright`. See the skill's `SKILL.md` for why.

## Skills

### browser-demo-recorder

Records browser automation as a video (webm/mp4) with an animated cursor, on a hidden Xvfb display so the real desktop is untouched. Use for client demos, walkthroughs, and feature-verification recordings. See the skill's `SKILL.md` for environment notes and customization.
