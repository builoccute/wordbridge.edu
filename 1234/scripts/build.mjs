#!/usr/bin/env node
/** V4 preflight. The actual build/bundle is controlled by Wrangler's entrypoint. */
import fs from 'node:fs';
import path from 'node:path';
const root=process.cwd();
for (const rel of ['wrangler.toml','src/index.js','public/styles/design-system.css','public/scripts/app.js','public/branding/logo-wordbridge.svg']) {
 if (!fs.existsSync(path.join(root,rel))) throw new Error(`Missing deployment file: ${rel}`);
}
const wrangler=fs.readFileSync('wrangler.toml','utf8');
if (!/main = "src\/index\.js"/.test(wrangler) || !/binding = "ASSETS"/.test(wrangler)) throw new Error('Invalid V4 entrypoint or Assets binding');
if (/^\s*\[\[d1_databases\]\]|^\s*\[\[r2_buckets\]\]/m.test(wrangler)) throw new Error('V4 Miền 1 must not deploy direct D1 or R2 bindings');
console.log('V4 static preflight passed; deploy still requires real control-plane and Worker contract tests.');
