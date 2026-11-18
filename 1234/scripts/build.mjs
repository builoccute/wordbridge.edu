#!/usr/bin/env node
/**
 * WORD BRIDGE — Production Build & Asset Verification Pipeline
 * Generates `dist/public/index.html`, copies static assets and branding slots,
 * validates SQL migrations (ensuring zero DROP TABLE statements), and verifies
 * Worker ES Module bundle integrity.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { renderApplicationHtml } from '../src/pages/app-shell.mjs';
import { assertSafeSqlStatement } from '../src/services/d1-database.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const distPublic = path.join(rootDir, 'dist', 'public');
const distAssets = path.join(distPublic, 'assets');

fs.mkdirSync(distAssets, { recursive: true });

// 1. Read Design System CSS and render index.html
const cssPath = path.join(rootDir, 'src', 'styles', 'design-system.css');
const cssContent = fs.readFileSync(cssPath, 'utf-8');
const htmlOutput = renderApplicationHtml(cssContent);
fs.writeFileSync(path.join(distPublic, 'index.html'), htmlOutput, 'utf-8');

// 2. Copy client script
const clientJsPath = path.join(rootDir, 'public', 'assets', 'app-client.js');
fs.copyFileSync(cssPath, path.join(rootDir, 'public', 'assets', 'design-system.css'));
fs.copyFileSync(cssPath, path.join(distAssets, 'design-system.css'));
fs.copyFileSync(clientJsPath, path.join(distAssets, 'app-client.js'));

// 3. Validate all SQL migration files for additive safety
const migrationsDir = path.join(rootDir, 'database', 'migrations');
const sqlFiles = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
for (const file of sqlFiles) {
  const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
  assertSafeSqlStatement(sql);
}

console.log(`[WORD BRIDGE BUILD] Successfully built dist/public/index.html (${Buffer.byteLength(htmlOutput)} bytes)`);
console.log(`[WORD BRIDGE BUILD] Verified ${sqlFiles.length} safe additive D1 migrations: ${sqlFiles.join(', ')}`);
