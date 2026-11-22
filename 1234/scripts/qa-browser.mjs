#!/usr/bin/env node
/**
 * WORD BRIDGE V4 — Real Headless Chromium Browser QA Runner
 * Renders all key routes directly from src/index.js + SQLite D1 shim,
 * inlines real public/styles/design-system.css, public/scripts/i18n.js, public/scripts/app.js & SVG logo,
 * and verifies DOM, JS execution (WB_AUTH, WB_I18N, live VI/EN switch), zero console errors,
 * and responsive layout (360/390/768/1024/1440/1920px) in real headless Chromium via Selenium.
 */
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';
import worker from '../src/index.js';
import { createTestEnv } from '../tests/helpers/sqlite-d1-shim.js';

const execFileAsync = promisify(execFile);
const ROOT = process.cwd();
const STAGE_DIR = '/tmp/wb-qa-stage';
const SCREENSHOT_DIR = path.join(ROOT, '.qa-screenshots');
fs.rmSync(STAGE_DIR, { recursive: true, force: true });
fs.mkdirSync(STAGE_DIR, { recursive: true });
fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });

const cssText = fs.readFileSync(path.join(ROOT, 'public/styles/design-system.css'), 'utf8');
const i18nJs = fs.readFileSync(path.join(ROOT, 'public/scripts/i18n.js'), 'utf8');
const appJs = fs.readFileSync(path.join(ROOT, 'public/scripts/app.js'), 'utf8');
const logoSvgB64 = fs.readFileSync(path.join(ROOT, 'public/branding/logo-wordbridge.svg')).toString('base64');

const env = await createTestEnv({
  STATIC_ASSETS_LOADER: async (assetPath) => {
    const clean = assetPath.replace(/^\/+/, '');
    const full = path.join(ROOT, clean);
    if (!fs.existsSync(full)) return null;
    return { body: fs.readFileSync(full) };
  },
});

const routes = [
  '/', '/learning', '/learning/path', '/learning/skills',
  '/dictionary', '/practice', '/specialized', '/examinations',
  '/learner-meet', '/reader', '/search',
];

const manifest = [];
try {
  for (const route of routes) {
    const res = await worker.fetch(new Request(`https://wordbridge.io.vn${route}`), env, {});
    if (res.status !== 200) {
      throw new Error(`Expected 200 for ${route}, got ${res.status}`);
    }
    let html = await res.text();
    html = html
      .replace('<link rel="stylesheet" href="/styles/design-system.css" />', `<style>${cssText}</style>`)
      .replace('<script src="/scripts/i18n.js" defer></script>', `<script>${i18nJs}</script>`)
      .replace('<script src="/scripts/app.js" defer></script>', `<script>${appJs}</script>`)
      .replaceAll('/branding/logo-wordbridge.svg', `data:image/svg+xml;base64,${logoSvgB64}`);
    const slug = route === '/' ? 'home' : route.slice(1).replaceAll('/', '_');
    const outHtml = path.join(STAGE_DIR, `${slug}.html`);
    fs.writeFileSync(outHtml, html, 'utf8');
    manifest.push({ route, slug, htmlPath: outHtml });
  }

  const manifestPath = path.join(STAGE_DIR, 'manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));

  const { stdout, stderr } = await execFileAsync('python3', [
    path.join(ROOT, 'scripts/qa_selenium.py'),
    manifestPath,
    SCREENSHOT_DIR,
  ], { encoding: 'utf8', timeout: 60000 });
  if (stdout) console.log(stdout.trim());
  if (stderr) console.error(stderr.trim());
} finally {
  env.DB.close();
  fs.rmSync(STAGE_DIR, { recursive: true, force: true });
}
