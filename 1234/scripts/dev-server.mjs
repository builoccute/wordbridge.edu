#!/usr/bin/env node
/**
 * WORD BRIDGE — Local Development HTTP Server
 * Runs the Cloudflare Worker fetch handler locally on Node.js HTTP server.
 */

import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import worker from '../src/worker.mjs';
import { renderApplicationHtml } from '../src/pages/app-shell.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');
const cssContent = fs.readFileSync(path.join(rootDir, 'src', 'styles', 'design-system.css'), 'utf-8');
const clientJs = fs.readFileSync(path.join(rootDir, 'public', 'assets', 'app-client.js'), 'utf-8');

const port = Number(process.env.PORT || 8787);

const server = http.createServer(async (req, res) => {
  const url = `http://localhost:${port}${req.url || '/'}`;
  if (req.url === '/assets/app-client.js') {
    res.writeHead(200, { 'Content-Type': 'application/javascript; charset=utf-8' });
    res.end(clientJs);
    return;
  }
  if (req.url === '/' || req.url === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(renderApplicationHtml(cssContent));
    return;
  }

  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const bodyBuffer = Buffer.concat(chunks);

  const webReq = new Request(url, {
    method: req.method,
    headers: req.headers,
    body: ['GET', 'HEAD'].includes(req.method) ? undefined : bodyBuffer,
  });

  const webRes = await worker.fetch(webReq, process.env);
  const respHeaders = {};
  webRes.headers.forEach((v, k) => {
    respHeaders[k] = v;
  });
  res.writeHead(webRes.status, respHeaders);
  const text = await webRes.text();
  res.end(text);
});

server.listen(port, () => {
  console.log(`WORD BRIDGE local server listening on http://localhost:${port}`);
});
