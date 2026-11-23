/**
 * WORD BRIDGE — Cloudflare R2 Object Storage Adapter
 * Bucket: `word` (TUYỆT ĐỐI KHÔNG TẠO BUCKET THAY THẾ)
 * Enforces allowed key prefixes, content-type, size limits, public/private split,
 * and strictly blocks any Learner Meet audio/video recordings or prohibited scopes.
 */

export const ALLOWED_R2_PREFIXES = Object.freeze([
  'branding/',
  'learning/chinese/',
  'learning/english/',
  'learning/russian/',
  'specialized/chinese/',
  'specialized/english/',
  'dictionary/',
  'audio/',
  'video/',
  'exercises/',
  'reader/',
  'user-content/',
  'system-assets/',
  'backups/',
]);

export const FORBIDDEN_R2_PATTERNS = [
  /^specialized\/russian\//i,
  /^learning\/(japanese|korean)\//i,
  /^specialized\/(japanese|korean)\//i,
  /^examinations\//i,
  /learner-meet.*record/i,
  /recordings?\//i,
  /\.\./,
];

export const ALLOWED_CONTENT_TYPES = new Set([
  'image/svg+xml',
  'image/jpeg',
  'image/png',
  'image/webp',
  'audio/mpeg',
  'audio/mp4',
  'audio/ogg',
  'audio/wav',
  'audio/webm',
  'video/mp4',
  'video/webm',
  'application/pdf',
  'application/json',
  'text/plain',
  'text/markdown',
  'text/vtt',
]);

export const MAX_UPLOAD_BYTES_DEFAULT = 25 * 1024 * 1024; // 25 MB per file guardrail

export function validateObjectKey(key) {
  if (typeof key !== 'string' || !key.trim()) {
    return { valid: false, error: 'Object key không hợp lệ.' };
  }
  const normalized = key.trim().replace(/^\/+/, '');
  for (const pattern of FORBIDDEN_R2_PATTERNS) {
    if (pattern.test(normalized)) {
      return {
        valid: false,
        error: `Object key bị từ chối theo chính sách phạm vi/quyền riêng tư WORD BRIDGE: ${normalized}`,
      };
    }
  }
  const hasAllowedPrefix = ALLOWED_R2_PREFIXES.some((prefix) => normalized.startsWith(prefix));
  if (!hasAllowedPrefix) {
    return {
      valid: false,
      error: `Object key phải bắt đầu bằng một trong các tiền tố chuẩn: ${ALLOWED_R2_PREFIXES.join(', ')}`,
    };
  }
  return { valid: true, key: normalized };
}

export class R2StorageService {
  constructor(r2Bucket) {
    this.bucket = r2Bucket;
  }

  isAvailable() {
    return Boolean(this.bucket);
  }

  ensureAvailable() {
    if (!this.bucket) {
      throw new Error('R2 bucket `word` chưa được gắn binding trong môi trường hiện tại.');
    }
  }

  async uploadObject({ key, body, contentType, visibility = 'private', uploadedBy = 'system', maxBytes = MAX_UPLOAD_BYTES_DEFAULT }) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new Error(`Content-Type không được phép: ${contentType}`);
    }
    const byteLength = body instanceof ArrayBuffer
      ? body.byteLength
      : body instanceof Uint8Array
        ? body.byteLength
        : typeof body === 'string'
          ? new TextEncoder().encode(body).byteLength
          : 0;

    if (byteLength <= 0 || byteLength > maxBytes) {
      throw new Error(`Dung lượng tệp (${byteLength} bytes) vượt quá giới hạn cho phép (${maxBytes} bytes).`);
    }

    await this.bucket.put(keyCheck.key, body, {
      httpMetadata: { contentType },
      customMetadata: {
        visibility,
        uploadedBy,
        uploadedAt: new Date().toISOString(),
        platform: 'WORD_BRIDGE',
      },
    });

    return {
      key: keyCheck.key,
      contentType,
      size: byteLength,
      visibility,
    };
  }

  async getObject(key, { allowPrivate = false } = {}) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    const obj = await this.bucket.get(keyCheck.key);
    if (!obj) return null;
    const visibility = obj.customMetadata?.visibility || 'private';
    if (visibility === 'private' && !allowPrivate) {
      throw new Error('Không có quyền truy cập đối tượng riêng tư trong R2.');
    }
    return obj;
  }

  async deleteObject(key) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(key);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    if (typeof this.bucket.delete === 'function') {
      await this.bucket.delete(keyCheck.key);
    }
    return { deleted: true, key: keyCheck.key };
  }

  async listPrefix(prefix = '', limit = 100) {
    this.ensureAvailable();
    if (!prefix) {
      return this.bucket.list({ limit });
    }
    const keyCheck = validateObjectKey(prefix.endsWith('/') ? prefix : `${prefix}/`);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    return this.bucket.list({ prefix: keyCheck.key, limit });
  }
}
