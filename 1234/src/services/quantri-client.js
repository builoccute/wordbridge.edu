/**
 * WORD BRIDGE V4.0 — Zero-Trust Remote SQLite, Storage & Runtime Control Client
 * Runs natively on Cloudflare Workers (WebCrypto) AND Node.js 18+ (globalThis.crypto).
 * Replaces Cloudflare D1 & R2 completely (Zero-D1 / Zero-R2) by routing securely
 * to quantri.wordbridge.io.vn/internal/* with HMAC-SHA256 + Timestamp + Nonce.
 */

const enc = new TextEncoder();

function toHex(buf) {
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function randomNonce() {
  const arr = new Uint8Array(16);
  crypto.getRandomValues(arr);
  return toHex(arr);
}

async function sha256Hex(data) {
  const bytes = typeof data === 'string' ? enc.encode(data) : new Uint8Array(data || 0);
  const digest = await crypto.subtle.digest('SHA-256', bytes);
  return toHex(digest);
}

async function hmacSha256Hex(secret, message) {
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(String(secret)),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(String(message)));
  return toHex(sig);
}

export function createQuantriBridge(env, siteKey) {
  const baseUrl = String(env.QUANTRI_API_BASE_URL || 'https://quantri.wordbridge.io.vn').replace(/\/+$/, '');
  const secret = String(env.QUANTRI_INTERNAL_SECRET || '');

  async function signedFetch(pathAndQuery, { method = 'GET', body = null, contentType = null, extraHeaders = {} } = {}) {
    const ts = String(Date.now());
    const nonce = randomNonce();
    let bodyBytes = new Uint8Array(0);
    if (body !== null && body !== undefined) {
      if (typeof body === 'string') bodyBytes = enc.encode(body);
      else if (body instanceof Uint8Array) bodyBytes = body;
      else if (body instanceof ArrayBuffer) bodyBytes = new Uint8Array(body);
      else bodyBytes = enc.encode(JSON.stringify(body));
    }
    const bodyHash = await sha256Hex(bodyBytes);
    const canonical = `${method.toUpperCase()}\n${pathAndQuery}\n${siteKey}\n${ts}\n${nonce}\n${bodyHash}`;
    const signature = await hmacSha256Hex(secret, canonical);

    const headers = {
      'X-WB-Service': siteKey,
      'X-WB-Timestamp': ts,
      'X-WB-Nonce': nonce,
      'X-WB-Signature': signature,
      ...extraHeaders,
    };
    if (contentType) headers['Content-Type'] = contentType;

    const init = { method: method.toUpperCase(), headers };
    if (method.toUpperCase() !== 'GET' && method.toUpperCase() !== 'HEAD' && method.toUpperCase() !== 'DELETE') {
      init.body = bodyBytes;
    }
    return fetch(`${baseUrl}${pathAndQuery}`, init);
  }

  // D1-compatible Remote SQLite interface
  const db = {
    prepare(sql) {
      const makeBound = (params = []) => ({
        bind(...args) {
          return makeBound(args);
        },
        async first(colName) {
          const res = await signedFetch('/internal/db/query', {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ op: 'first', sql, params }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || 'Remote SQLite error');
          if (!data.result) return null;
          return colName ? data.result[colName] : data.result;
        },
        async all() {
          const res = await signedFetch('/internal/db/query', {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ op: 'all', sql, params }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || 'Remote SQLite error');
          return { results: data.results || [], success: true };
        },
        async run() {
          const res = await signedFetch('/internal/db/query', {
            method: 'POST',
            contentType: 'application/json',
            body: JSON.stringify({ op: 'run', sql, params }),
          });
          const data = await res.json();
          if (!data.ok) throw new Error(data.error || 'Remote SQLite error');
          return { success: true, meta: data.meta || {} };
        },
      });
      return makeBound([]);
    },
  };

  // R2-compatible Remote Sovereign Storage interface
  const storage = {
    async put(key, data, opts = {}) {
      const ct = opts?.httpMetadata?.contentType || opts?.contentType || 'application/octet-stream';
      const res = await signedFetch(`/internal/storage/put?key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        contentType: ct,
        body: data,
      });
      const out = await res.json();
      if (!out.ok) throw new Error(out.error || 'Remote storage put failed');
      return out.object;
    },
    async get(key, rangeHeader = null) {
      const extraHeaders = rangeHeader ? { Range: rangeHeader } : {};
      const res = await signedFetch(`/internal/storage/get?key=${encodeURIComponent(key)}`, {
        method: 'GET',
        extraHeaders,
      });
      if (res.status === 404) return null;
      const buf = await res.arrayBuffer();
      return {
        status: res.status,
        contentType: res.headers.get('content-type') || 'application/octet-stream',
        contentRange: res.headers.get('content-range') || null,
        size: buf.byteLength,
        body: buf,
        arrayBuffer: async () => buf,
      };
    },
    async head(key) {
      const res = await signedFetch(`/internal/storage/head?key=${encodeURIComponent(key)}`, { method: 'GET' });
      if (res.status === 404) return null;
      const data = await res.json();
      return data.ok ? data.info : null;
    },
    async delete(key) {
      const res = await signedFetch(`/internal/storage/delete?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
      return res.json();
    },
    async list(prefix = '') {
      const res = await signedFetch(`/internal/storage/list?prefix=${encodeURIComponent(prefix)}`, { method: 'GET' });
      const data = await res.json();
      return data.ok ? (data.objects || []) : [];
    },
  };

  async function getRuntimeConfig() {
    try {
      const res = await fetch(`${baseUrl}/api/public/runtime/${encodeURIComponent(siteKey)}`);
      if (!res.ok) return null;
      const data = await res.json();
      return data.ok ? data : null;
    } catch {
      return null;
    }
  }

  return { db, storage, getRuntimeConfig, baseUrl };
}

export function renderMaintenancePage(site) {
  const title = site?.display_name || 'WORD BRIDGE';
  const msg = site?.maintenance_message || 'Hệ thống đang bảo trì nâng cấp. Vui lòng quay lại sau ít phút.';
  return new Response(`<!DOCTYPE html>
<html lang="vi"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>Bảo trì hệ thống | ${title}</title>
<link rel="stylesheet" href="/styles/design-system.css"/></head>
<body style="justify-content:center;align-items:center;padding:24px;text-align:center;">
  <div class="wb-card" style="max-width:520px;border-top:5px solid #CB0203;">
    <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" style="height:46px;margin:0 auto 12px;"/>
    <h1 style="color:#035257;margin:8px 0;">Đang bảo trì hệ thống</h1>
    <p>${msg}</p>
    <p class="wb-muted">Trạng thái trực tiếp được điều hành từ <code>quantri.wordbridge.io.vn</code>.</p>
    <a href="https://help.wordbridge.io.vn/" class="wb-btn wb-btn-outline">Xem trạng thái tại Help Center</a>
  </div>
</body></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '300' } });
}
