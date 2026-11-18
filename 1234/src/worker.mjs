/**
 * WORD BRIDGE — Cloudflare Worker Entrypoint (ES Module Format)
 * Website: https://www.wordbridge.vn/
 * Bindings:
 * - DB: Cloudflare D1 `word` (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
 * - STORAGE: Cloudflare R2 `word`
 */

import { createWordBridgeRuntime } from './api/router.mjs';
import { renderApplicationHtml } from './pages/app-shell.mjs';
import { buildSecurityHeaders } from './utils/security.mjs';

let sharedRuntime = null;

export function getOrCreateRuntime(env = {}) {
  if (!sharedRuntime) {
    sharedRuntime = createWordBridgeRuntime(env);
  }
  return sharedRuntime;
}

export default {
  async fetch(request, env = {}, ctx = {}) {
    const runtime = getOrCreateRuntime(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return runtime.handleApiRequest(request);
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function' && url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    const html = renderApplicationHtml();
    return new Response(html, {
      status: 200,
      headers: {
        ...buildSecurityHeaders(env.APP_URL || 'https://www.wordbridge.vn'),
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};
