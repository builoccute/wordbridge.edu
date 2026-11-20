import { webcrypto as nodeWebCrypto } from 'node:crypto';
const webCrypto = globalThis.crypto || nodeWebCrypto;

/**
 * WORD BRIDGE — Web Crypto Security Utilities (Cloudflare Workers & Node 18 compatible)
 * Uses PBKDF2-SHA256 (100,000 iterations), SHA-256 token hashing, HMAC-SHA256 webhook verification,
 * and constant-time string comparison.
 */

const encoder = new TextEncoder();

export function toHex(buffer) {
  return Array.from(new Uint8Array(buffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function fromHex(hex) {
  const bytes = new Uint8Array(hex.length / 2);
  for (let i = 0; i < bytes.length; i += 1) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function randomTokenHex(byteLength = 32) {
  const bytes = new Uint8Array(byteLength);
  webCrypto.getRandomValues(bytes);
  return toHex(bytes);
}

export function generateId(prefix = 'wb') {
  return `${prefix}_${webCrypto.randomUUID().replace(/-/g, '')}`;
}

export async function sha256Hex(input, pepper = '') {
  const data = encoder.encode(`${input}${pepper}`);
  const digest = await webCrypto.subtle.digest('SHA-256', data);
  return toHex(digest);
}

export async function hmacSha256Hex(secret, message) {
  const key = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );
  const sig = await webCrypto.subtle.sign('HMAC', key, encoder.encode(message));
  return toHex(sig);
}

export function timingSafeEqual(a, b) {
  if (typeof a !== 'string' || typeof b !== 'string' || a.length !== b.length) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < a.length; i += 1) {
    diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  }
  return diff === 0;
}

export async function hashPassword(password) {
  const salt = new Uint8Array(16);
  webCrypto.getRandomValues(salt);
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const iterations = 100000;
  const derived = await webCrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return `pbkdf2_sha256$${iterations}$${toHex(salt)}$${toHex(derived)}`;
}

export async function verifyPassword(password, storedHash) {
  if (!storedHash || typeof storedHash !== 'string') return false;
  const parts = storedHash.split('$');
  if (parts.length !== 4 || parts[0] !== 'pbkdf2_sha256') return false;
  const iterations = Number(parts[1]);
  const salt = fromHex(parts[2]);
  const expectedHex = parts[3];
  const keyMaterial = await webCrypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    { name: 'PBKDF2' },
    false,
    ['deriveBits']
  );
  const derived = await webCrypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  return timingSafeEqual(toHex(derived), expectedHex);
}
