import { generateId } from '../../utils/crypto.js';
import { assertOfficialLanguage } from '../../utils/http.js';

/**
 * WORD BRIDGE — Cloudflare R2 Object Storage Adapter
 * Bucket: `word` (TUYỆT ĐỐI KHÔNG TẠO BUCKET THAY THẾ)
 * Enforces allowed key prefixes, content-type, size limits, public/private split,
 * and strictly blocks any Learner Meet audio/video recordings.
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
  'examinations/',
  'user-content/',
  'system-assets/',
]);

export const FORBIDDEN_R2_PATTERNS = [
  /^specialized\/russian\//i,
  /^learning\/(japanese|korean)\//i,
  /^specialized\/(japanese|korean)\//i,
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

  async listPrefix(prefix, limit = 100) {
    this.ensureAvailable();
    const keyCheck = validateObjectKey(prefix.endsWith('/') ? prefix : `${prefix}/`);
    if (!keyCheck.valid) {
      throw new Error(keyCheck.error);
    }
    return this.bucket.list({ prefix: keyCheck.key, limit });
  }
}

/**
 * WORD BRIDGE — Audio, Pronunciation & Read-Aloud Service (Section 31–38)
 * - Audio stored in R2 (`word`), metadata stored in D1 (`wb_audio_assets`)
 * - Honest ASR status: NEVER fabricates pronunciation scores when ASR provider is unconfigured
 */




export const SUPPORTED_PLAYBACK_SPEEDS = Object.freeze([0.75, 1.0, 1.25, 1.5]);

export class AudioService {
  constructor(db, r2Service, env = {}) {
    this.db = db;
    this.r2Service = r2Service;
    this.env = env;
  }

  getAsrCapabilityStatus() {
    const provider = this.env.ASR_PROVIDER || 'unconfigured';
    if (provider === 'unconfigured' || !this.env.ASR_API_KEY) {
      return {
        supported: false,
        status: 'BLOCKED_UNCONFIGURED',
        messageVi: 'Hệ thống nhận diện giọng nói và chấm điểm phát âm tự động chưa được tích hợp nhà cung cấp ASR. Người học vẫn có thể nghe âm thanh mẫu, điều chỉnh tốc độ (0.75x–1.5x) và tự luyện đọc thành tiếng. Hệ thống tuyệt đối không giả lập điểm phát âm.',
      };
    }
    return { supported: true, status: 'CONFIGURED', provider };
  }

  async listAssets({ language = '', limit = 50 } = {}) {
    if (language) {
      const norm = assertOfficialLanguage(language);
      const res = await this.db
        .prepare('SELECT * FROM wb_audio_assets WHERE language_code = ? ORDER BY created_at DESC LIMIT ?')
        .bind(norm, limit)
        .all();
      return res.results || [];
    }
    const res = await this.db
      .prepare('SELECT * FROM wb_audio_assets ORDER BY created_at DESC LIMIT ?')
      .bind(limit)
      .all();
    return res.results || [];
  }

  async registerAudioAsset({
    languageCode,
    r2ObjectKey,
    contentType,
    fileSizeBytes,
    durationMs,
    voiceLabel,
    accentVariant = '',
    transcriptText = '',
    syncSegments = [],
    copyrightStatus = 'original_word_bridge',
  }) {
    const lang = assertOfficialLanguage(languageCode);
    const id = generateId('aud');
    await this.db
      .prepare(`
        INSERT INTO wb_audio_assets (
          id, language_code, r2_object_key, content_type, file_size_bytes,
          duration_ms, voice_label, accent_variant, transcript_text,
          sync_segments_json, copyright_status, review_status
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'draft')
      `)
      .bind(
        id, lang, r2ObjectKey, contentType, fileSizeBytes,
        durationMs, voiceLabel, accentVariant, transcriptText,
        JSON.stringify(syncSegments), copyrightStatus
      )
      .run();
    return { id, languageCode: lang, r2ObjectKey };
  }
}
