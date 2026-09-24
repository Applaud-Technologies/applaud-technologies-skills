# applaud-tools

General-purpose developer utilities and tools that aren't tied to a specific stack.

## Installation

```bash
/plugin install applaud-tools@applaud-technologies-skills
```

## Requirements

- Linux host with `xvfb` and `ffmpeg`
- `google-chrome` installed
- Node.js 20+ with a resolvable `playwright` package

## Skills

### browser-demo-recorder

Records browser automation as a video (webm/mp4) with an animated cursor, on a hidden Xvfb display so the real desktop is untouched. Use for client demos, walkthroughs, and feature-verification recordings. See the skill's `SKILL.md` for environment notes and customization.
