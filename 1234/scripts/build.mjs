#!/usr/bin/env node
/**
 * WORD BRIDGE V4.2 — Unified Build & Production Preflight Check
 * Validates the single-domain Cloudflare Worker architecture (`src/index.js`),
 * native D1 (`DB`), R2 (`R2`), and Static Assets (`ASSETS`) bindings,
 * bilingual ZH/EN product boundary, zero public admin portal exposure,
 * and syntax integrity across all active modules.
 */
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();

const requiredFiles = [
  'wrangler.toml',
  'package.json',
  'src/index.js',
  'src/api/router.js',
  'src/config/constants.js',
  'src/layouts/site-layout.js',
  'src/utils/crypto.js',
  'src/utils/http.js',
  'src/utils/validation.js',
  'public/styles/design-system.css',
  'public/scripts/app.js',
  'public/scripts/i18n.js',
  'public/branding/logo-wordbridge.svg',
];

for (const rel of requiredFiles) {
  if (!fs.existsSync(path.join(root, rel))) {
    throw new Error(`Missing required deployment file: ${rel}`);
  }
}

const wrangler = fs.readFileSync(path.join(root, 'wrangler.toml'), 'utf8');
if (!/main\s*=\s*"src\/index\.js"/.test(wrangler)) {
  throw new Error('wrangler.toml must declare main = "src/index.js"');
}
if (!/binding\s*=\s*"ASSETS"/.test(wrangler)) {
  throw new Error('wrangler.toml must declare [assets] binding = "ASSETS"');
}
if (!/\[\[d1_databases\]\][\s\S]*?binding\s*=\s*"DB"/m.test(wrangler)) {
  throw new Error('wrangler.toml must declare [[d1_databases]] with binding = "DB"');
}
if (!/\[\[r2_buckets\]\][\s\S]*?binding\s*=\s*"R2"/m.test(wrangler)) {
  throw new Error('wrangler.toml must declare [[r2_buckets]] with binding = "R2"');
}

// Verify zero top-level node: imports in active Worker entrypoint & utils
const cryptoSrc = fs.readFileSync(path.join(root, 'src/utils/crypto.js'), 'utf8');
if (/from\s+['"]node:/.test(cryptoSrc)) {
  throw new Error('src/utils/crypto.js must not import node:* modules (use native globalThis.crypto)');
}

// Verify bilingual boundary in constants.js (zh, en only — no ru)
const constantsSrc = fs.readFileSync(path.join(root, 'src/config/constants.js'), 'utf8');
if (/ALLOWED_LANGUAGE_CODES\s*=\s*Object\.freeze\(\[[^\]]*['"]ru['"]/.test(constantsSrc)) {
  throw new Error('ALLOWED_LANGUAGE_CODES must only contain zh and en (Russian removed)');
}

// Verify zero public /quan-tri link in site-layout.js and help-pages.js
for (const publicFile of ['src/layouts/site-layout.js', 'src/pages/help-pages.js', 'src/services/quantri-client.js']) {
  const txt = fs.readFileSync(path.join(root, publicFile), 'utf8');
  if (/\/quan-tri/.test(txt)) {
    throw new Error(`Public file ${publicFile} must not expose /quan-tri`);
  }
}

// Syntax check all active JS modules under src/, storage/, email/, public/scripts/
function collectJs(dir) {
  const abs = path.join(root, dir);
  if (!fs.existsSync(abs)) return [];
  const results = [];
  for (const entry of fs.readdirSync(abs, { withFileTypes: true })) {
    const full = path.join(abs, entry.name);
    if (entry.isDirectory()) {
      results.push(...collectJs(path.relative(root, full)));
    } else if (entry.name.endsWith('.js')) {
      results.push(full);
    }
  }
  return results;
}

const activeJsFiles = [
  ...collectJs('src'),
  ...collectJs('storage'),
  ...collectJs('email'),
  ...collectJs('public/scripts'),
];

for (const file of activeJsFiles) {
  const res = spawnSync(process.execPath, ['--check', file], { encoding: 'utf8' });
  if (res.status !== 0) {
    throw new Error(`Syntax check failed for ${path.relative(root, file)}:\n${res.stderr}`);
  }
}

console.log(`WORD BRIDGE V4.2 preflight build passed (${activeJsFiles.length} JS modules verified, native D1/R2/ASSETS unified).`);
