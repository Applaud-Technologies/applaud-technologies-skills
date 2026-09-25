#!/usr/bin/env node
/**
 * Record a browser demo with cursor visualization
 * Usage: DISPLAY=:99 node record-browser-demo.mjs
 *
 * Playwright is resolved from the current working directory (walking up to
 * any parent node_modules), or from PLAYWRIGHT_PATH if set.
 */

import { createRequire } from 'module';
import fs from 'fs';
import os from 'os';
import path from 'path';

// Playwright is CommonJS; a bare ESM import resolves from this script's own
// location (the plugin cache), where it is never installed.
function loadPlaywright() {
  const require = createRequire(path.join(process.cwd(), 'noop.js'));
  for (const id of [process.env.PLAYWRIGHT_PATH, 'playwright'].filter(Boolean)) {
    try { return require(id); } catch {}
  }
  throw new Error(
    'playwright not found. Run from a directory with node_modules/playwright above it, ' +
    'or set PLAYWRIGHT_PATH=/abs/path/to/node_modules/playwright'
  );
}

const { chromium } = loadPlaywright();

const WIDTH = 1920;
const HEIGHT = 1080;

// Hide system cursor + inject our custom cursor
const CURSOR_STYLE = `
  /* Hide the real cursor everywhere */
  *, *::before, *::after {
    cursor: none !important;
  }
  
  /* Our custom cursor */
  #playwright-cursor {
    position: fixed;
    width: 24px;
    height: 24px;
    background: radial-gradient(circle, rgba(255,80,80,0.9) 0%, rgba(255,0,0,0.7) 70%);
    border: 3px solid #fff;
    border-radius: 50%;
    pointer-events: none;
    z-index: 2147483647;
    transform: translate(-50%, -50%);
    box-shadow: 0 0 15px rgba(255, 0, 0, 0.6), 0 2px 5px rgba(0,0,0,0.3);
    left: -100px;
    top: -100px;
  }
`;

const CURSOR_INIT = `
  if (!document.getElementById('playwright-cursor')) {
    // Inject style to hide system cursor
    const style = document.createElement('style');
    style.textContent = \`
      *, *::before, *::after { cursor: none !important; }
    \`;
    document.head.appendChild(style);
    
    // Create our cursor - SVG pointer arrow
    const cursor = document.createElement('div');
    cursor.id = 'playwright-cursor';
    cursor.innerHTML = \`
      <svg width="28" height="28" viewBox="0 0 28 28" fill="none" xmlns="http://www.w3.org/2000/svg">
        <g filter="url(#shadow)">
          <path d="M4 2L4 24L9.5 18.5L14 26L17 24.5L12.5 17L20 17L4 2Z" fill="white" stroke="black" stroke-width="1.5"/>
        </g>
        <defs>
          <filter id="shadow" x="0" y="0" width="28" height="32" filterUnits="userSpaceOnUse">
            <feDropShadow dx="1" dy="2" stdDeviation="1.5" flood-opacity="0.4"/>
          </filter>
        </defs>
      </svg>
    \`;
    cursor.style.cssText = \`
      position: fixed;
      pointer-events: none;
      z-index: 2147483647;
      left: -100px;
      top: -100px;
      transform: translate(-2px, -2px);
      filter: drop-shadow(1px 2px 2px rgba(0,0,0,0.3));
    \`;
    document.body.appendChild(cursor);
  }
  
  window.__moveCursor = (x, y, duration = 300) => {
    return new Promise(resolve => {
      const cursor = document.getElementById('playwright-cursor');
      if (!cursor) { resolve(); return; }
      cursor.style.transition = \`left \${duration}ms ease-out, top \${duration}ms ease-out\`;
      cursor.style.left = x + 'px';
      cursor.style.top = y + 'px';
      setTimeout(resolve, duration);
    });
  };
  
  window.__clickEffect = () => {
    const cursor = document.getElementById('playwright-cursor');
    if (!cursor) return;
    cursor.style.transition = 'transform 0.08s ease-out';
    cursor.style.transform = 'translate(-2px, -2px) scale(0.85)';
    setTimeout(() => {
      cursor.style.transform = 'translate(-2px, -2px) scale(1)';
    }, 120);
  };
`;

// Helper to move cursor to element and click
async function moveCursorAndClick(page, selector, options = {}) {
  const element = typeof selector === 'string' 
    ? page.locator(selector).first() 
    : selector;
  
  // Get element position
  const box = await element.boundingBox();
  if (!box) {
    console.log('Could not find element bounding box');
    return;
  }
  
  const targetX = box.x + box.width / 2;
  const targetY = box.y + box.height / 2;
  
  // Animate cursor to target
  await page.evaluate(({ x, y }) => window.__moveCursor(x, y, 400), { x: targetX, y: targetY });
  await page.waitForTimeout(100);
  
  // Click effect
  await page.evaluate(() => window.__clickEffect());
  await page.waitForTimeout(50);
  
  // Actually click
  await element.click(options);
  await page.waitForTimeout(200);
}

// Helper to move cursor smoothly
async function moveCursor(page, x, y, duration = 300) {
  await page.evaluate(({ x, y, d }) => window.__moveCursor(x, y, d), { x, y, d: duration });
  await page.waitForTimeout(duration + 50);
}

async function main() {
  console.log('Launching browser...');
  
  // Kiosk only takes effect on the first window, which Playwright only exposes
  // via a persistent context. Dropping --enable-automation removes the
  // "controlled by automated test software" infobar. viewport: null lets the
  // page fill the full kiosk window instead of being clipped under it.
  const profileDir = fs.mkdtempSync(path.join(os.tmpdir(), 'demo-recorder-'));
  const context = await chromium.launchPersistentContext(profileDir, {
    channel: 'chrome',
    headless: false,
    viewport: null,
    ignoreDefaultArgs: ['--enable-automation'],
    args: [
      '--kiosk',
      '--window-position=0,0',
      `--window-size=${WIDTH},${HEIGHT}`,
      '--cursor=none',  // Try to hide cursor at browser level
    ]
  });

  const page = context.pages()[0] ?? await context.newPage();
  
  // Inject cursor-hiding CSS before navigation
  await page.addInitScript(() => {
    const style = document.createElement('style');
    style.textContent = '*, *::before, *::after { cursor: none !important; }';
    if (document.head) document.head.appendChild(style);
    else document.addEventListener('DOMContentLoaded', () => document.head.appendChild(style));
  });
  
  console.log('Navigating to Google...');
  await page.goto('https://www.google.com');
  await page.waitForTimeout(1000);
  
  // Inject cursor
  await page.evaluate(CURSOR_INIT);
  await page.waitForTimeout(300);
  
  // Move real mouse off-screen (to corner) so it doesn't interfere
  await page.mouse.move(0, 0);
  
  // Start our fake cursor from top-left area
  await moveCursor(page, 200, 200, 0);
  await page.waitForTimeout(500);
  
  // Move to search box and click
  console.log('Moving to search box...');
  const searchBox = page.locator('textarea[name="q"], input[name="q"]').first();
  await moveCursorAndClick(page, searchBox);
  await page.waitForTimeout(500);
  
  // Type slowly for demo effect
  console.log('Typing search query...');
  await searchBox.type('C# bootcamps under 10K', { delay: 100 });
  await page.waitForTimeout(800);
  
  // Move to Google Search button and click
  console.log('Clicking search button...');
  const searchButton = page.locator('input[name="btnK"], button[name="btnK"]').first();
  
  // Check if button is visible (might be hidden by autocomplete)
  const buttonVisible = await searchButton.isVisible().catch(() => false);
  
  if (buttonVisible) {
    await moveCursorAndClick(page, searchButton);
  } else {
    // Press Enter instead, but show cursor moving to where button would be
    console.log('Button hidden, pressing Enter...');
    const box = await searchBox.boundingBox();
    if (box) {
      await moveCursor(page, box.x + box.width + 100, box.y + 50);
    }
    await page.keyboard.press('Enter');
  }
  
  await page.waitForTimeout(3000);
  
  // Re-inject cursor on results page
  try {
    await page.evaluate(CURSOR_INIT);
    await page.mouse.move(0, 0);  // Keep real cursor hidden
  } catch (e) {}
  await page.waitForTimeout(300);
  
  // Move cursor around to show results
  console.log('Showing results...');
  await moveCursor(page, 400, 300, 400);
  await page.waitForTimeout(400);
  await moveCursor(page, 600, 450, 400);
  await page.waitForTimeout(400);
  await moveCursor(page, 500, 600, 400);
  await page.waitForTimeout(800);
  
  // Scroll down a bit
  console.log('Scrolling results...');
  await page.mouse.wheel(0, 400);
  await page.waitForTimeout(1500);
  
  console.log('Demo complete! Closing browser...');
  await context.close();
  fs.rmSync(profileDir, { recursive: true, force: true });
}

main().catch(console.error);
