/**
 * WORD BRIDGE — Application Security, Cryptography, Validation & Rate Limiting
 * Pure Web Crypto API & ES Module implementation (Zero Node.js native dependencies
 * inside the Cloudflare Worker bundle graph).
 */

const encoder = new TextEncoder();

export function bytesToHex(bytes) {
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function hexToBytes(hex) {
  const clean = String(hex || '').replace(/[^0-9a-fA-F]/g, '');
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}

export function generateId(prefix = 'wb') {
  const bytes = new Uint8Array(12);
  crypto.getRandomValues(bytes);
  return `${prefix}_${bytesToHex(bytes)}`;
}

export function generateRandomToken(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  crypto.getRandomValues(bytes);
  return bytesToHex(bytes);
}

export async function sha256Hex(input) {
  const data = encoder.encode(String(input));
  const digest = await crypto.subtle.digest('SHA-256', data);
  return bytesToHex(new Uint8Array(digest));
}

export async function hashPassword(password, providedSaltHex = null) {
  const saltBytes = providedSaltHex
    ? hexToBytes(providedSaltHex)
    : crypto.getRandomValues(new Uint8Array(16));
  const saltHex = bytesToHex(saltBytes);
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(String(password)),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: saltBytes,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );
  const hashHex = bytesToHex(new Uint8Array(derivedBits));
  return { hashHex, saltHex };
}

export async function verifyPassword(password, expectedHashHex, saltHex) {
  if (!password || !expectedHashHex || !saltHex) return false;
  const { hashHex } = await hashPassword(password, saltHex);
  return timingSafeEqualHex(hashHex, expectedHashHex);
}

export function timingSafeEqualHex(a, b) {
  const strA = String(a || '');
  const strB = String(b || '');
  if (strA.length !== strB.length) return false;
  let diff = 0;
  for (let i = 0; i < strA.length; i++) {
    diff |= strA.charCodeAt(i) ^ strB.charCodeAt(i);
  }
  return diff === 0;
}

export function escapeHtml(unsafe) {
  return String(unsafe ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function sanitizeText(value, maxLen = 2000) {
  if (typeof value !== 'string') return '';
  const trimmed = value.trim().slice(0, maxLen);
  return trimmed
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '');
}

export function detectSqlInjectionPattern(input) {
  const str = String(input || '');
  const patterns = [
    /\bUNION\s+ALL\s+SELECT\b/i,
    /\bUNION\s+SELECT\b/i,
    /\bDROP\s+TABLE\b/i,
    /\bDELETE\s+FROM\s+\w+\s+WHERE\s+1\s*=\s*1/i,
    /;\s*--/,
    /'\s*OR\s+'1'\s*=\s*'1/i,
    /'\s*OR\s+1\s*=\s*1/i,
  ];
  return patterns.some((re) => re.test(str));
}

export function validateRegistrationInput(body) {
  const errors = [];
  const fullName = sanitizeText(body?.fullName, 120);
  const dateOfBirth = sanitizeText(body?.dateOfBirth, 20);
  const phoneNumber = sanitizeText(body?.phoneNumber, 30);
  const email = sanitizeText(body?.email, 160).toLowerCase();
  const password = String(body?.password || '');
  const confirmPassword = String(body?.confirmPassword || '');
  const schoolName = sanitizeText(body?.schoolName, 200);
  const workplaceName = sanitizeText(body?.workplaceName, 200);

  if (!fullName || fullName.length < 2) {
    errors.push('Họ và tên là trường bắt buộc (tối thiểu 2 ký tự).');
  }
  if (!dateOfBirth || !/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) {
    errors.push('Ngày sinh bắt buộc theo định dạng YYYY-MM-DD.');
  }
  if (!phoneNumber || !/^\+?[0-9\s\-]{8,16}$/.test(phoneNumber)) {
    errors.push('Số điện thoại không hợp lệ.');
  }
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.push('Địa chỉ email không hợp lệ.');
  }
  if (!password || password.length < 8) {
    errors.push('Mật khẩu bắt buộc tối thiểu 8 ký tự.');
  }
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải bao gồm chữ hoa, chữ thường và chữ số.');
  }
  if (password !== confirmPassword) {
    errors.push('Xác nhận mật khẩu không khớp.');
  }
  if (!schoolName || schoolName.length < 2) {
    errors.push('Trường học là trường bắt buộc riêng biệt.');
  }
  if (!workplaceName || workplaceName.length < 2) {
    errors.push('Nơi làm việc/tổ chức công tác là trường bắt buộc riêng biệt.');
  }

  return {
    valid: errors.length === 0,
    errors,
    cleaned: {
      fullName,
      dateOfBirth,
      phoneNumber,
      email,
      password,
      schoolName,
      workplaceName,
    },
  };
}

// Edge In-Memory Sliding Window Rate Limiter
const rateBuckets = new Map();

export function checkRateLimit(key, limit = 60, windowMs = 60000) {
  const now = Date.now();
  const bucket = rateBuckets.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > bucket.resetAt) {
    bucket.count = 0;
    bucket.resetAt = now + windowMs;
  }
  bucket.count += 1;
  rateBuckets.set(key, bucket);
  return {
    allowed: bucket.count <= limit,
    remaining: Math.max(0, limit - bucket.count),
    resetAt: bucket.resetAt,
  };
}

export function resetRateLimitsForTest() {
  rateBuckets.clear();
}

export function buildSecurityHeaders(origin = 'https://www.wordbridge.vn') {
  return {
    'X-Content-Type-Options': 'nosniff',
    'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=(), display-capture=()',
    'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
    'Content-Security-Policy':
      "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; media-src 'self' https:; connect-src 'self' https: wss:; frame-ancestors 'none'; base-uri 'self'; form-action 'self';",
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-CSRF-Token',
  };
}

export function parseCookies(cookieHeader) {
  const out = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      out[k] = decodeURIComponent(v);
    }
  }
  return out;
}

export function serializeSessionCookie(name, value, maxAgeSeconds = 86400 * 7, isSecure = true) {
  const parts = [
    `${name}=${encodeURIComponent(value)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}
