/**
 * WORD BRIDGE — Audio, Pronunciation & Read-Aloud Service (Section 31–38)
 * - Audio stored in R2 (`word`), metadata stored in D1 (`wb_audio_assets`)
 * - Honest ASR status: NEVER fabricates pronunciation scores when ASR provider is unconfigured
 */

import { generateId } from '../../utils/crypto.js';
import { assertOfficialLanguage } from '../../utils/validation.js';

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
