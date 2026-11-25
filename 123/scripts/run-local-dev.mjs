#!/usr/bin/env node
/**
 * WORD BRIDGE — Local Node.js Multi-Page Dev Server (backed by real SQLite3 D1 shim)
 * Usage: npm run dev:local
 */
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import worker from '../src/index.js';
import { SQLiteD1Database, MemoryR2Bucket } from '../tests/helpers/sqlite-d1-shim.js';

const PORT = Number(process.env.PORT || 8787);
const db = new SQLiteD1Database(process.env.WB_LOCAL_DB || path.resolve(process.cwd(), '.local-word-bridge.sqlite3'));
await db.applyAllMigrations();

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.png': 'image/png',
};

const env = {
  DB: db,
  R2: new MemoryR2Bucket(),
  APP_BASE_URL: `http://localhost:${PORT}`,
  ENVIRONMENT: 'local',
  WEBAUTHN_RP_ID: 'localhost',
  EMAIL_PROVIDER: process.env.EMAIL_PROVIDER || 'unconfigured',
  LEARNER_MEET_PROVIDER: process.env.LEARNER_MEET_PROVIDER || 'unconfigured',
  STATIC_ASSETS_LOADER: async (reqPath) => {
    const safePath = path.normalize(reqPath).replace(/^(\.\.[/\\])+/, '');
    const full = path.join(process.cwd(), safePath);
    if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
    const ext = path.extname(full);
    return { body: fs.readFileSync(full), contentType: mimeTypes[ext] || 'application/octet-stream' };
  },
};

const server = http.createServer(async (req, res) => {
  try {
    const chunks = [];
    for await (const ch of req) chunks.push(ch);
    const body = chunks.length ? Buffer.concat(chunks) : undefined;
    const request = new Request(`http://localhost:${PORT}${req.url}`, {
      method: req.method,
      headers: req.headers,
      body: ['GET', 'HEAD'].includes(req.method) ? undefined : body,
    });
    const response = await worker.fetch(request, env, {});
    res.writeHead(response.status, Object.fromEntries(response.headers.entries()));
    const buf = Buffer.from(await response.arrayBuffer());
    res.end(buf);
  } catch (err) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Dịch vụ tạm thời chưa khả dụng.');
  }
});

server.listen(PORT, () => {
  console.log(`WORD BRIDGE local server running at http://localhost:${PORT}`);
});
