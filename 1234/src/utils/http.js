import { ALLOWED_LANGUAGE_CODES, SPECIALIZED_LANGUAGE_CODES } from '../config/constants.js';

/**
 * WORD BRIDGE — Strict Input Validation & Scope Enforcement
 */



export function escapeHtml(str) {
  return String(str ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

export function normalizeLanguageCode(input) {
  if (!input) return null;
  const map = {
    zh: 'zh', chinese: 'zh', 'tieng-trung': 'zh',
    en: 'en', english: 'en', 'tieng-anh': 'en',
    ru: 'ru', russian: 'ru', 'tieng-nga': 'ru',
  };
  return map[String(input).trim().toLowerCase()] || null;
}

export function assertOfficialLanguage(code) {
  const normalized = normalizeLanguageCode(code);
  if (!normalized || !ALLOWED_LANGUAGE_CODES.includes(normalized)) {
    throw new Error('Ngôn ngữ không thuộc phạm vi chính thức của WORD BRIDGE (chỉ hỗ trợ Tiếng Trung [zh], Tiếng Anh [en] và Tiếng Nga [ru]).');
  }
  return normalized;
}

export function assertSpecializedLanguage(code) {
  const normalized = assertOfficialLanguage(code);
  if (!SPECIALIZED_LANGUAGE_CODES.includes(normalized)) {
    throw new Error('Ngoại ngữ chuyên ngành chỉ áp dụng cho Tiếng Trung (zh) và Tiếng Anh (en). Không hỗ trợ chuyên ngành Tiếng Nga.');
  }
  return normalized;
}

export function validateEmail(email) {
  if (typeof email !== 'string') return false;
  const trimmed = email.trim().toLowerCase();
  return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(trimmed) && trimmed.length <= 254;
}

export function isAcademicSchoolEmail(email) {
  if (!validateEmail(email)) return false;
  const domain = email.trim().toLowerCase().split('@')[1];
  const consumerDomains = new Set([
    'gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'icloud.com',
    'proton.me', 'protonmail.com', 'live.com', 'msn.com', 'zoho.com',
  ]);
  if (consumerDomains.has(domain)) return false;
  return (
    domain.endsWith('.edu') ||
    domain.endsWith('.edu.vn') ||
    domain.includes('.edu.') ||
    domain.endsWith('.ac.uk') ||
    domain.endsWith('.ac.jp') ||
    domain.endsWith('.ac.vn') ||
    domain.includes('.ac.') ||
    domain.endsWith('.university') ||
    domain.includes('student.') ||
    domain.includes('sv.')
  );
}

/**
 * Section 52: 8 Mandatory Registration Fields
 * 1. Họ và tên, 2. Ngày sinh, 3. Số điện thoại, 4. Email,
 * 5. Mật khẩu, 6. Xác nhận mật khẩu, 7. Trường học, 8. Nơi làm việc/tổ chức công tác
 */
export function validateRegistrationPayload(payload) {
  const errors = [];
  const fullName = String(payload?.fullName ?? '').trim();
  const dateOfBirth = String(payload?.dateOfBirth ?? '').trim();
  const phoneNumber = String(payload?.phoneNumber ?? '').trim();
  const email = String(payload?.email ?? '').trim().toLowerCase();
  const password = String(payload?.password ?? '');
  const confirmPassword = String(payload?.confirmPassword ?? '');
  const schoolName = String(payload?.schoolName ?? '').trim();
  const workplaceName = String(payload?.workplaceName ?? '').trim();

  if (fullName.length < 2 || fullName.length > 120) errors.push('Họ và tên phải từ 2 đến 120 ký tự.');
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dateOfBirth)) errors.push('Ngày sinh phải đúng định dạng YYYY-MM-DD.');
  if (!/^[0-9+\-\s()]{8,20}$/.test(phoneNumber)) errors.push('Số điện thoại không hợp lệ (8–20 ký tự số).');
  if (!validateEmail(email)) errors.push('Địa chỉ email không hợp lệ.');
  if (password.length < 10) errors.push('Mật khẩu phải có tối thiểu 10 ký tự.');
  if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
    errors.push('Mật khẩu phải gồm chữ hoa, chữ thường và chữ số.');
  }
  if (password !== confirmPassword) errors.push('Xác nhận mật khẩu không khớp.');
  if (schoolName.length < 2) errors.push('Trường học là trường bắt buộc (độc lập với nơi làm việc).');
  if (workplaceName.length < 2) errors.push('Nơi làm việc/tổ chức công tác là trường bắt buộc (độc lập với trường học).');

  return {
    valid: errors.length === 0,
    errors,
    data: { fullName, dateOfBirth, phoneNumber, email, password, schoolName, workplaceName },
  };
}

/**
 * WORD BRIDGE — HTTP Response, Security Headers & Cookie Utilities
 */

export const SECURITY_HEADERS = Object.freeze({
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'DENY',
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  'Permissions-Policy': 'camera=(self), microphone=(self), geolocation=()',
  'Content-Security-Policy': "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; media-src 'self' blob:; connect-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'self'",
});

export function htmlResponse(html, status = 200, extraHeaders = {}) {
  return new Response(html, {
    status,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function jsonResponse(data, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'Cache-Control': 'no-store',
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function errorResponse(code, message, status = 400, details = undefined) {
  return jsonResponse({
    ok: false,
    error: { code, message, ...(details ? { details } : {}) },
  }, status);
}

export function redirectResponse(location, status = 302, extraHeaders = {}) {
  return new Response(null, {
    status,
    headers: {
      Location: location,
      ...SECURITY_HEADERS,
      ...extraHeaders,
    },
  });
}

export function parseCookies(request) {
  const header = request.headers.get('Cookie') || '';
  const cookies = {};
  for (const part of header.split(';')) {
    const idx = part.indexOf('=');
    if (idx > 0) {
      const k = part.slice(0, idx).trim();
      const v = part.slice(idx + 1).trim();
      cookies[k] = decodeURIComponent(v);
    }
  }
  return cookies;
}

export function buildSessionCookie(token, maxAgeSeconds = 60 * 60 * 24 * 7, isSecure = true) {
  const parts = [
    `wb_session=${encodeURIComponent(token)}`,
    'Path=/',
    'HttpOnly',
    'SameSite=Lax',
    `Max-Age=${maxAgeSeconds}`,
  ];
  if (isSecure) parts.push('Secure');
  return parts.join('; ');
}

export function clearSessionCookie(isSecure = true) {
  return buildSessionCookie('', 0, isSecure);
}
