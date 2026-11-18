/**
 * WORD BRIDGE — Cloudflare R2 Object Storage Service
 * Bucket Name: `word` (Default Storage Class)
 * Dashboard: https://dash.cloudflare.com/6028ea7100116ba19b3c6b9590c45768/r2
 *
 * Enforces:
 * - 11 canonical object key prefixes
 * - Strict separation of PUBLIC vs AUTHENTICATED vs PRIVATE objects
 * - Strict MIME type and file size validation (blocks executable/malicious uploads)
 * - Absolute prohibition on storing Learner Meet audio/video recordings
 * - Orphaned object detection & backup manifest generation
 */

import { sha256Hex } from '../utils/security.mjs';

export const R2_BUCKET_METADATA = Object.freeze({
  bucketName: 'word',
  storageClass: 'Standard (Default Storage Class)',
  dashboardUrl: 'https://dash.cloudflare.com/6028ea7100116ba19b3c6b9590c45768/r2',
});

export const ALLOWED_R2_PREFIXES = Object.freeze([
  'branding/',
  'learning/chinese/',
  'learning/english/',
  'learning/russian/',
  'specialized/chinese/',
  'specialized/english/',
  'dictionary/',
  'exercises/',
  'examinations/',
  'user-content/',
  'system-assets/',
]);

export const BLOCKED_R2_PATTERNS = Object.freeze([
  /learner-meet/i,
  /meeting-recording/i,
  /screen-recording/i,
  /specialized\/russian\//i, // Russian specialized is prohibited by product spec
]);

export const ALLOWED_MIME_TYPES = Object.freeze({
  'image/svg+xml': { maxBytes: 2 * 1024 * 1024, resourceType: 'IMAGE' },
  'image/webp': { maxBytes: 5 * 1024 * 1024, resourceType: 'IMAGE' },
  'image/jpeg': { maxBytes: 5 * 1024 * 1024, resourceType: 'IMAGE' },
  'image/png': { maxBytes: 5 * 1024 * 1024, resourceType: 'IMAGE' },
  'audio/mpeg': { maxBytes: 25 * 1024 * 1024, resourceType: 'AUDIO' },
  'audio/wav': { maxBytes: 25 * 1024 * 1024, resourceType: 'AUDIO' },
  'audio/ogg': { maxBytes: 25 * 1024 * 1024, resourceType: 'AUDIO' },
  'video/mp4': { maxBytes: 100 * 1024 * 1024, resourceType: 'VIDEO' },
  'application/pdf': { maxBytes: 30 * 1024 * 1024, resourceType: 'PDF' },
  'application/json': { maxBytes: 5 * 1024 * 1024, resourceType: 'INTERACTIVE' },
  'text/plain': { maxBytes: 2 * 1024 * 1024, resourceType: 'TEXT' },
  'text/markdown': { maxBytes: 2 * 1024 * 1024, resourceType: 'DOCUMENT' },
});

export function validateR2ObjectKey(objectKey) {
  const key = String(objectKey || '').trim().replace(/^\/+/, '');
  if (!key || key.includes('..') || key.includes('\\')) {
    return { valid: false, reason: 'Object key chứa ký tự đường dẫn không hợp lệ (Path Traversal bị chặn).' };
  }
  for (const blocked of BLOCKED_R2_PATTERNS) {
    if (blocked.test(key)) {
      return {
        valid: false,
        reason:
          'Vi phạm chính sách sản phẩm: Không lưu bản ghi Learner Meet và không lưu ngoại ngữ chuyên ngành tiếng Nga trên R2.',
      };
    }
  }
  const matchesPrefix = ALLOWED_R2_PREFIXES.some((prefix) => key.startsWith(prefix));
  if (!matchesPrefix) {
    return {
      valid: false,
      reason: `Object key phải bắt đầu bằng một trong 11 tiền tố chuẩn: ${ALLOWED_R2_PREFIXES.join(', ')}`,
    };
  }
  return { valid: true, normalizedKey: key };
}

export function validateUploadFile(objectKey, mimeType, sizeBytes, isEmailLogo = false) {
  const keyCheck = validateR2ObjectKey(objectKey);
  if (!keyCheck.valid) return keyCheck;

  if (isEmailLogo && mimeType === 'image/png') {
    return {
      valid: false,
      reason: 'Theo quy định PHẦN XII Mục 46: Tuyệt đối không sử dụng PNG cho logo email. Ưu tiên SVG gốc.',
    };
  }

  const spec = ALLOWED_MIME_TYPES[mimeType];
  if (!spec) {
    return {
      valid: false,
      reason: `Loại tệp (${mimeType}) không nằm trong danh sách cho phép hoặc có nguy cơ chứa mã thực thi độc hại.`,
    };
  }
  if (typeof sizeBytes !== 'number' || sizeBytes <= 0 || sizeBytes > spec.maxBytes) {
    return {
      valid: false,
      reason: `Kích thước tệp (${sizeBytes} bytes) vượt quá giới hạn cho phép (${spec.maxBytes} bytes).`,
    };
  }

  const visibility = keyCheck.normalizedKey.startsWith('branding/') || keyCheck.normalizedKey.startsWith('system-assets/')
    ? 'PUBLIC'
    : keyCheck.normalizedKey.startsWith('user-content/')
    ? 'PRIVATE'
    : 'AUTHENTICATED';

  return {
    valid: true,
    normalizedKey: keyCheck.normalizedKey,
    resourceType: spec.resourceType,
    visibility,
  };
}

export class R2StorageManager {
  constructor(r2BucketBinding = null) {
    this.bucket = r2BucketBinding;
    this.memoryObjects = new Map();
  }

  async putObject({ objectKey, content, mimeType, uploadedBy = null, isEmailLogo = false }) {
    const bytes = typeof content === 'string' ? new TextEncoder().encode(content) : new Uint8Array(content);
    const validation = validateUploadFile(objectKey, mimeType, bytes.byteLength, isEmailLogo);
    if (!validation.valid) {
      throw new Error(validation.reason);
    }

    const checksum = await sha256Hex(bytes);
    const customMetadata = {
      visibility: validation.visibility,
      resourceType: validation.resourceType,
      uploadedBy: String(uploadedBy || 'system'),
      checksumSha256: checksum,
      uploadedAt: new Date().toISOString(),
    };

    if (this.bucket && typeof this.bucket.put === 'function') {
      await this.bucket.put(validation.normalizedKey, bytes, {
        httpMetadata: { contentType: mimeType },
        customMetadata,
      });
    } else {
      this.memoryObjects.set(validation.normalizedKey, {
        key: validation.normalizedKey,
        bytes,
        httpMetadata: { contentType: mimeType },
        customMetadata,
        size: bytes.byteLength,
      });
    }

    return {
      objectKey: validation.normalizedKey,
      mimeType,
      sizeBytes: bytes.byteLength,
      visibility: validation.visibility,
      resourceType: validation.resourceType,
      checksumSha256: checksum,
    };
  }

  async getObject({ objectKey, requesterAccountId = null, isAdmin = false }) {
    const keyCheck = validateR2ObjectKey(objectKey);
    if (!keyCheck.valid) {
      return { status: 400, error: keyCheck.reason };
    }

    let obj = null;
    if (this.bucket && typeof this.bucket.get === 'function') {
      obj = await this.bucket.get(keyCheck.normalizedKey);
    } else {
      obj = this.memoryObjects.get(keyCheck.normalizedKey) || null;
    }

    if (!obj) {
      return { status: 404, error: 'Không tìm thấy đối tượng trên R2 bucket `word`.' };
    }

    const visibility = obj.customMetadata?.visibility || 'AUTHENTICATED';
    const owner = obj.customMetadata?.uploadedBy;

    if (visibility === 'AUTHENTICATED' && !requesterAccountId) {
      return { status: 401, error: 'Yêu cầu đăng nhập để truy cập học liệu này.' };
    }
    if (visibility === 'PRIVATE' && !isAdmin && (!requesterAccountId || requesterAccountId !== owner)) {
      return { status: 403, error: 'Truy cập bị từ chối: Tệp riêng tư thuộc quyền sở hữu của tài khoản khác.' };
    }

    return {
      status: 200,
      object: obj,
      mimeType: obj.httpMetadata?.contentType || 'application/octet-stream',
      metadata: obj.customMetadata || {},
    };
  }

  async findOrphanedObjects(referencedKeysSet) {
    const allKeys = [];
    if (this.bucket && typeof this.bucket.list === 'function') {
      const listed = await this.bucket.list();
      for (const item of listed.objects || []) {
        allKeys.push(item.key);
      }
    } else {
      for (const key of this.memoryObjects.keys()) {
        allKeys.push(key);
      }
    }
    const orphans = allKeys.filter((k) => !referencedKeysSet.has(k));
    return {
      bucket: R2_BUCKET_METADATA.bucketName,
      totalScanned: allKeys.length,
      orphanCount: orphans.length,
      orphanedKeys: orphans,
    };
  }
}
