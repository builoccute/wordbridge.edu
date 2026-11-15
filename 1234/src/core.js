export const APP = 'WORD BRIDGE';
export const ORIGIN = 'https://wordbridge.io.vn';
export const LANGUAGES = ['zh','en','ko','ja','ru'];
export const SKILLS = ['listening','vocabulary','sentence','reading'];
export const uid = () => crypto.randomUUID();
const encoder = new TextEncoder();
export const json = (data, status = 200, headers = {}) => new Response(JSON.stringify(data), {
  status, headers: { 'content-type': 'application/json; charset=utf-8', 'cache-control': 'no-store', ...headers }
});
export const fail = (message, status = 400, details = {}) => json({ error: message, ...details }, status);
export async function readJson(req, maxBytes = 1_000_000) {
  const len = Number(req.headers.get('content-length') || 0);
  if (len > maxBytes) throw new Error('Dữ liệu gửi lên vượt giới hạn cho phép.');
  const raw = await req.text();
  if (encoder.encode(raw).length > maxBytes) throw new Error('Dữ liệu gửi lên vượt giới hạn cho phép.');
  try { const x = JSON.parse(raw || '{}'); return x && typeof x === 'object' && !Array.isArray(x) ? x : {}; }
  catch { throw new Error('Dữ liệu JSON không hợp lệ.'); }
}
export const clean = (value, max = 2000) => String(value ?? '')
  .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, '').trim().slice(0, max);
export const validEmail = v => typeof v === 'string' && v.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
export const iso = ms => new Date(ms).toISOString();
export const safeJson = (v, fallback = {}) => { try { return JSON.parse(v ?? ''); } catch { return fallback; } };
export const now = () => new Date().toISOString();
export async function sha256(value) {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(String(value)));
  return [...new Uint8Array(digest)].map(b => b.toString(16).padStart(2,'0')).join('');
}
export function randomToken(bytes = 32) {
  const b = crypto.getRandomValues(new Uint8Array(bytes));
  return btoa(String.fromCharCode(...b)).replaceAll('+','-').replaceAll('/','_').replaceAll('=','');
}
export function constantTimeEqual(a, b) {
  a = String(a ?? ''); b = String(b ?? '');
  let diff = a.length ^ b.length;
  const n = Math.max(a.length, b.length);
  for (let i = 0; i < n; i++) diff |= (a.charCodeAt(i) || 0) ^ (b.charCodeAt(i) || 0);
  return diff === 0;
}
export function passwordPolicy(password) {
  const p = String(password || '');
  return {
    valid: p.length >= 15 && /[A-Z]/.test(p) && (p.match(/[^A-Za-z0-9]/g) || []).length >= 3,
    length: p.length >= 15, uppercase: /[A-Z]/.test(p), special: (p.match(/[^A-Za-z0-9]/g) || []).length >= 3
  };
}
export async function hashPassword(password, salt = randomToken(16)) {
  const key = await crypto.subtle.importKey('raw', encoder.encode(password), 'PBKDF2', false, ['deriveBits']);
  const bits = await crypto.subtle.deriveBits({ name: 'PBKDF2', salt: encoder.encode(salt), iterations: 310000, hash: 'SHA-256' }, key, 256);
  const hash = [...new Uint8Array(bits)].map(b => b.toString(16).padStart(2,'0')).join('');
  return `pbkdf2$310000$${salt}$${hash}`;
}
export async function verifyPassword(password, stored) {
  const [scheme, iter, salt] = String(stored || '').split('$');
  if (scheme !== 'pbkdf2' || Number(iter) !== 310000 || !salt) return false;
  return constantTimeEqual(await hashPassword(password, salt), stored);
}
export function cookie(name, value, maxAge) {
  return `${name}=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${maxAge}`;
}
export function getCookie(req, name) {
  return (req.headers.get('Cookie') || '').split(';').map(x => x.trim()).find(x => x.startsWith(`${name}=`))?.slice(name.length + 1) || '';
}
export function escapeHtml(v) {
  return String(v ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}
export function sanitizeHtml(input) {
  let source = String(input ?? '').slice(0, 200000);
  source = source.replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math|video|audio|textarea|select|option)\b[^>]*>[\s\S]*?<\/\1\s*>/gi, '')
    .replace(/<(script|style|iframe|object|embed|form|input|button|svg|math|video|audio|textarea|select|option)\b[^>]*\/?>/gi, '');
  const allowed = new Set(['p','br','h1','h2','h3','h4','strong','b','em','i','u','s','ul','ol','li','blockquote','a','img','table','thead','tbody','tr','th','td','hr','span','div','pre','code','sup','sub']);
  const styleProps = new Set(['color','background-color','font-size','font-family','font-weight','font-style','text-decoration','text-align','line-height','margin-left','width','max-width','height']);
  const safeStyle = raw => raw.split(';').map(part => {
    const i = part.indexOf(':'); if (i < 1) return '';
    const prop = part.slice(0,i).trim().toLowerCase();
    const value = part.slice(i+1).trim();
    if (!styleProps.has(prop) || !value || /url\s*\(|expression\s*\(|[<>]|\\|!important/i.test(value)) return '';
    const valid = prop === 'text-align' ? /^(left|center|right|justify)$/i.test(value)
      : prop === 'font-weight' ? /^(normal|bold|[1-9]00)$/i.test(value)
      : prop === 'font-style' ? /^(normal|italic)$/i.test(value)
      : prop === 'text-decoration' ? /^(none|underline|line-through)$/i.test(value)
      : prop === 'font-family' ? /^[a-z0-9 ,"'-]{1,100}$/i.test(value)
      : ['color','background-color'].includes(prop) ? /^(#[0-9a-f]{3,8}|rgba?\([0-9.,% ]+\)|hsla?\([0-9.,% ]+\))$/i.test(value)
      : prop === 'line-height' ? /^(1|[0-3](\.\d{1,2})?|[1-9](\.\d{1,2})?(px|em|rem|%)?)$/i.test(value)
      : /^(0|[0-9]{1,3}(\.[0-9]{1,2})?(px|em|rem|%))$/i.test(value);
    return valid ? `${prop}:${value}` : '';
  }).filter(Boolean).join(';');
  source = source.replace(/<\/?([a-z0-9-]+)\b([^>]*)>/gi, (all, rawTag, rawAttrs) => {
    const tag = rawTag.toLowerCase();
    if (!allowed.has(tag)) return '';
    if (/^<\//.test(all)) return `</${tag}>`;
    const attrs = [];
    for (const m of rawAttrs.matchAll(/([a-zA-Z][a-zA-Z0-9-]*)\s*=\s*("([^"]*)"|'([^']*)'|([^\s>]+))/g)) {
      const key = m[1].toLowerCase(), value = m[3] ?? m[4] ?? m[5] ?? '';
      if (key === 'style') {
        const v = safeStyle(value); if (v) attrs.push(`style="${escapeHtml(v)}"`);
      } else if (['a','img'].includes(tag) && ['href','src'].includes(key)) {
        if (/^(https:\/\/|mailto:|\/|#)/i.test(value) && !/^\/\//.test(value)) attrs.push(`${key}="${escapeHtml(value)}"`);
      } else if ((tag === 'a' && ['title','target','rel'].includes(key)) || (tag === 'img' && ['alt','title','width','height'].includes(key)) || (['td','th'].includes(tag) && ['colspan','rowspan'].includes(key)) || ['span','div'].includes(tag) && key === 'class') {
        if (key === 'target' && !['_blank','_self'].includes(value)) continue;
        if (key === 'rel' && !/^(noopener noreferrer|nofollow|noopener|noreferrer)$/i.test(value)) continue;
        if (key === 'class' && !/^[a-z0-9 _-]{1,80}$/i.test(value)) continue;
        if (['width','height','colspan','rowspan'].includes(key) && !/^\d{1,4}$/.test(value)) continue;
        attrs.push(`${key}="${escapeHtml(value.slice(0,300))}"`);
      }
    }
    if (tag === 'a' && attrs.some(x => x.startsWith('target="_blank"')) && !attrs.some(x=>x.startsWith('rel='))) attrs.push('rel="noopener noreferrer"');
    return ['br','hr','img'].includes(tag) ? `<${tag}${attrs.length?' '+attrs.join(' '):''}>` : `<${tag}${attrs.length?' '+attrs.join(' '):''}>`;
  });
  return source;
}
export async function audit(env, actor, action, targetType = '', targetId = '', details = {}, req = null) {
  const ip = req?.headers.get('CF-Connecting-IP') || '';
  await env.DB.prepare('INSERT INTO audit_logs(id,actor_id,action,target_type,target_id,ip_hash,details_json) VALUES(?,?,?,?,?,?,?)')
    .bind(uid(), actor?.id || null, clean(action,100), clean(targetType,50), clean(targetId,100), ip ? await sha256(ip) : null, JSON.stringify(details).slice(0,8000)).run();
}
export async function addNotification(env, userId, category, title, body, href = null) {
  await env.DB.prepare('INSERT INTO notifications(id,user_id,category,title,body,href) VALUES(?,?,?,?,?,?)')
    .bind(uid(), userId, clean(category,40), clean(title,160), clean(body,1000), href ? clean(href,500) : null).run();
}
export async function rateLimit(env, key, limit = 10, windowSeconds = 60) {
  const bucket = await sha256(key); const t = Math.floor(Date.now()/1000); const start = t - (t % windowSeconds);
  const row = await env.DB.prepare('SELECT window_start,hits FROM rate_limits WHERE bucket_key=?').bind(bucket).first();
  if (!row || row.window_start !== start) {
    await env.DB.prepare('INSERT INTO rate_limits(bucket_key,window_start,hits) VALUES(?,?,1) ON CONFLICT(bucket_key) DO UPDATE SET window_start=excluded.window_start,hits=1,updated_at=CURRENT_TIMESTAMP').bind(bucket,start).run();
    return { ok: true, remaining: limit - 1 };
  }
  if (row.hits >= limit) return { ok: false, retryAfter: Math.max(1, windowSeconds - (t - start)) };
  await env.DB.prepare('UPDATE rate_limits SET hits=hits+1,updated_at=CURRENT_TIMESTAMP WHERE bucket_key=?').bind(bucket).run();
  return { ok: true, remaining: limit - row.hits - 1 };
}
export function isMutating(req) { return !['GET','HEAD','OPTIONS'].includes(req.method); }
export async function ensureSameOrigin(req, env) {
  const origin = req.headers.get('Origin');
  if (!origin) return true;
  const expected = env.APP_ORIGIN || new URL(req.url).origin;
  return origin === expected;
}
export function maskEmail(email) {
  const [a,b=''] = String(email).split('@');
  return `${a.slice(0,2)}${'*'.repeat(Math.max(2,a.length-2))}@${b}`;
}
