#!/usr/bin/env node

/**
 * Screenshot Capture Script for Flow Funding Demos
 *
 * This script captures screenshots of all demo pages using Puppeteer
 */

import puppeteer from 'puppeteer';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, mkdirSync } from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const demos = [
  { path: '/tbff', name: 'tbff' },
  { path: '/tbff-flow', name: 'tbff-flow' },
  { path: '/flow-v2', name: 'flow-v2' },
  { path: '/italism', name: 'italism' },
  { path: '/flowfunding', name: 'flowfunding' },
];

const baseUrl = 'http://localhost:3000';
const screenshotsDir = join(__dirname, '../public/screenshots');

// Ensure screenshots directory exists
if (!existsSync(screenshotsDir)) {
  mkdirSync(screenshotsDir, { recursive: true });
}

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...\n');

  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    for (const demo of demos) {
      const url = `${baseUrl}${demo.path}`;
      console.log(`📸 Capturing ${demo.name}...`);

      const page = await browser.newPage();
      await page.setViewport({ width: 1280, height: 800 });

      try {
        await page.goto(url, {
          waitUntil: 'networkidle2',
          timeout: 30000
        });

        // Wait a bit for animations to settle
        await new Promise(resolve => setTimeout(resolve, 2000));

        const screenshotPath = join(screenshotsDir, `${demo.name}.png`);
        await page.screenshot({
          path: screenshotPath,
          type: 'png'
        });

        console.log(`  ✅ Saved to public/screenshots/${demo.name}.png`);
      } catch (error) {
        console.error(`  ❌ Failed to capture ${demo.name}:`, error.message);
      } finally {
        await page.close();
      }
    }
  } finally {
    await browser.close();
  }

  console.log('\n✨ Screenshot capture complete!');
}

captureScreenshots().catch(console.error);
