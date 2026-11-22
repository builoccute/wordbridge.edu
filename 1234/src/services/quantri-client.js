/**
 * WORD BRIDGE V4.0 — Zero-Trust Remote SQLite, Storage & Runtime Control Client
 * Hardened against Cloudflare Error 1101:
 * - Fast AbortController timeouts so pages never hang when quantri is offline
 * - Graceful non-throwing fallbacks for read queries so public pages always render 200 OK
 */

import { escapeHtml } from '../utils/http.js';

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

async function fetchWithTimeout(url, init, timeoutMs = 3500) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);
  try {
    return await fetch(url, { ...init, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

export function createQuantriBridge(env, siteKey) {
  const baseUrl = String(env.QUANTRI_API_BASE_URL || 'https://quantri.wordbridge.io.vn').replace(/\/+$/, '');
  const secret = String(env.QUANTRI_INTERNAL_SECRET || '');

  async function signedFetch(pathAndQuery, { method = 'GET', body = null, contentType = null, extraHeaders = {} } = {}) {
    if (!secret) throw new Error('QUANTRI_INTERNAL_SECRET_NOT_SET');
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
    return fetchWithTimeout(`${baseUrl}${pathAndQuery}`, init, 3500);
  }

  // Safe D1-compatible Remote SQLite interface (never throws unhandled Error 1101 on offline Quantri)
  const db = {
    prepare(sql) {
      const makeBound = (params = []) => ({
        bind(...args) {
          return makeBound(args);
        },
        async query(op) {
          const response = await signedFetch('/internal/db/query', {
            method: 'POST', contentType: 'application/json', body: JSON.stringify({ op, sql, params }),
          });
          if (!response.ok) throw new Error('CONTROL_DATABASE_UNAVAILABLE');
          const data = await response.json();
          if (data?.ok !== true) throw new Error('CONTROL_DATABASE_QUERY_FAILED');
          return data;
        },
        async first(colName) {
          const { result } = await this.query('first');
          return colName ? result?.[colName] ?? null : result ?? null;
        },
        async all() {
          const { results } = await this.query('all');
          if (!Array.isArray(results)) throw new Error('CONTROL_DATABASE_INVALID_ROWS');
          return { success:true, results };
        },
        async run() {
          const { meta } = await this.query('run');
          return { success:true, meta:meta || {} };
        },
      });
      return makeBound([]);
    },
  };

  const storage = {
    async put(key, data, opts = {}) {
      const ct = opts?.httpMetadata?.contentType || opts?.contentType || 'application/octet-stream';
      const res = await signedFetch(`/internal/storage/put?key=${encodeURIComponent(key)}`, {
        method: 'PUT',
        contentType: ct,
        body: data,
      });
      const out = await res.json().catch(() => ({ ok: false }));
      return out.ok ? out.object : null;
    },
    async get(key, rangeHeader = null) {
      try {
        const extraHeaders = rangeHeader ? { Range: rangeHeader } : {};
        const res = await signedFetch(`/internal/storage/get?key=${encodeURIComponent(key)}`, { method: 'GET', extraHeaders });
        if (!res.ok && res.status !== 206) return null;
        const buf = await res.arrayBuffer();
        return {
          status: res.status,
          contentType: res.headers.get('content-type') || 'application/octet-stream',
          contentRange: res.headers.get('content-range') || null,
          size: buf.byteLength,
          body: buf,
          arrayBuffer: async () => buf,
        };
      } catch {
        return null;
      }
    },
    async head(key) {
      try {
        const res = await signedFetch(`/internal/storage/head?key=${encodeURIComponent(key)}`, { method: 'GET' });
        if (!res.ok) return null;
        const data = await res.json().catch(() => null);
        return data?.ok ? data.info : null;
      } catch {
        return null;
      }
    },
    async delete(key) {
      try {
        const res = await signedFetch(`/internal/storage/delete?key=${encodeURIComponent(key)}`, { method: 'DELETE' });
        return await res.json().catch(() => ({ deleted: false }));
      } catch {
        return { deleted: false };
      }
    },
    async list(prefix = '') {
      try {
        const res = await signedFetch(`/internal/storage/list?prefix=${encodeURIComponent(prefix)}`, { method: 'GET' });
        if (!res.ok) return [];
        const data = await res.json().catch(() => null);
        return data?.ok ? (data.objects || []) : [];
      } catch {
        return [];
      }
    },
  };

  async function getRuntimeConfig() {
    try {
      const res = await fetchWithTimeout(`${baseUrl}/api/public/runtime/${encodeURIComponent(siteKey)}`, { method: 'GET' }, 2500);
      if (!res.ok) return null;
      const data = await res.json().catch(() => null);
      return data?.ok ? data : null;
    } catch {
      return null;
    }
  }

  return { db, storage, getRuntimeConfig, baseUrl };
}

export function renderMaintenancePage(site, locale='vi') {
  const title = escapeHtml(site?.display_name || 'WORD BRIDGE');
  const msg = escapeHtml(site?.maintenance_message || (locale==='en'?'Please try again in a few minutes.':'Vui lòng quay lại sau ít phút.'));
  return new Response(`<!DOCTYPE html>
<html lang="${locale}"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1.0"/>
<title>${locale==='en'?'System maintenance':'Bảo trì hệ thống'} | ${title}</title>
<link rel="stylesheet" href="/styles/design-system.css"/></head>
<body style="justify-content:center;align-items:center;padding:24px;text-align:center;">
  <main class="wb-card" style="max-width:520px;border-top:5px solid #CB0203;">
    <img src="/branding/logo-wordbridge.svg" alt="WORD BRIDGE" style="height:46px;margin:0 auto 12px;"/>
    <h1 style="color:#035257;margin:8px 0;">${locale==='en'?'System maintenance':'Đang bảo trì hệ thống'}</h1>
    <p>${msg}</p>
    <a href="https://help.wordbridge.io.vn/" class="wb-btn wb-btn-outline">${locale==='en'?'Open help center':'Mở Trung Tâm Trợ Giúp'}</a>
  </main>
</body></html>`, { status: 503, headers: { 'Content-Type': 'text/html; charset=utf-8', 'Retry-After': '300' } });
}
