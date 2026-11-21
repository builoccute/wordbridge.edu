/**
 * WORD BRIDGE — Learner Meet Service (Section 46–48)
 * ABSOLUTE BOUNDARIES:
 * - Audio & video language practice ONLY (1-on-1 or group 2–8 participants)
 * - ZERO text chat, ZERO DM, ZERO group messaging, ZERO file sharing, ZERO comments,
 *   ZERO public livestream, ZERO screen sharing, ZERO recording/download APIs.
 * - Stores ONLY minimal operational metadata (join/leave timestamps, session status).
 * - Transparently discloses that WORD BRIDGE cannot prevent external hardware/software recording.
 */

import { generateId, randomTokenHex } from '../../utils/crypto.js';
import { assertOfficialLanguage } from '../../utils/validation.js';

export const LEARNER_MEET_DISCLAIMER_VI =
  'Phòng thực hành giao tiếp trực tiếp tập trung vào âm thanh và hình ảnh.';

export class LearnerMeetService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.provider = env.LEARNER_MEET_PROVIDER || 'unconfigured';
  }

  getProviderStatus() {
    if (this.provider === 'unconfigured' || !this.env.LIVEKIT_WS_URL || !this.env.LIVEKIT_API_KEY) {
      return {
        ready: false,
        status: 'BLOCKED_UNCONFIGURED',
        provider: this.provider,
        noteVi: 'Hạ tầng WebRTC SFU (ví dụ LiveKit) chưa được cấu hình credential và chưa được phê duyệt chi phí. Chức năng quản lý phiên & kiểm tra thiết bị đã sẵn sàng; kết nối luồng media trực tiếp đang ở trạng thái BLOCKED.',
      };
    }
    return { ready: true, status: 'CONFIGURED', provider: this.provider };
  }

  async createSession(hostAccountId, { languageCode, mode = 'one_to_one', topicVi, maxParticipants = 2 }) {
    const lang = assertOfficialLanguage(languageCode);
    const validMode = mode === 'group' ? 'group' : 'one_to_one';
    const cap = validMode === 'one_to_one' ? 2 : Math.max(2, Math.min(8, Number(maxParticipants) || 4));
    const topic = String(topicVi || '').trim();
    if (topic.length < 3) {
      return { ok: false, status: 400, error: 'Chủ đề thực hành phải có tối thiểu 3 ký tự.' };
    }

    const id = generateId('lm');
    const sessionCode = `WB-${randomTokenHex(3).toUpperCase()}`;
    const roomId = `room_${randomTokenHex(6)}`;

    await this.db
      .prepare(`
        INSERT INTO wb_learner_meet_sessions (
          id, session_code, room_id, host_account_id, language_code, mode,
          topic_vi, max_participants, status, webrtc_provider,
          recording_disabled, chat_disabled, screen_share_disabled
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, 1, 1, 1)
      `)
      .bind(id, sessionCode, roomId, hostAccountId, lang, validMode, topic, cap, this.provider)
      .run();

    await this.db
      .prepare('INSERT INTO wb_learner_meet_participants (id, session_id, account_id, connection_state) VALUES (?, ?, ?, ?)')
      .bind(generateId('lmp'), id, hostAccountId, 'joined')
      .run();

    return {
      ok: true,
      session: {
        id,
        sessionCode,
        roomId,
        languageCode: lang,
        mode: validMode,
        topicVi: topic,
        maxParticipants: cap,
        capabilities: {
          audio: true,
          video: true,
          chat: false,
          fileTransfer: false,
          screenShare: false,
          recording: false,
        },
        providerStatus: this.getProviderStatus(),
        disclaimerVi: LEARNER_MEET_DISCLAIMER_VI,
      },
    };
  }

  async joinSession(accountId, sessionCode) {
    const session = await this.db
      .prepare("SELECT * FROM wb_learner_meet_sessions WHERE session_code = ? AND status IN ('scheduled', 'active')")
      .bind(String(sessionCode || '').trim().toUpperCase())
      .first();
    if (!session) return { ok: false, status: 404, error: 'Phiên Learner Meet không tồn tại hoặc đã kết thúc.' };

    const activeCount = await this.db
      .prepare('SELECT COUNT(*) AS cnt FROM wb_learner_meet_participants WHERE session_id = ? AND left_at IS NULL')
      .bind(session.id)
      .first();

    if ((activeCount?.cnt || 0) >= session.max_participants) {
      return { ok: false, status: 409, error: 'Phiên thực hành đã đủ số lượng người tham gia tối đa.' };
    }

    await this.db
      .prepare('INSERT INTO wb_learner_meet_participants (id, session_id, account_id, connection_state) VALUES (?, ?, ?, ?)')
      .bind(generateId('lmp'), session.id, accountId, 'joined')
      .run();

    return {
      ok: true,
      roomId: session.room_id,
      session,
      providerStatus: this.getProviderStatus(),
      disclaimerVi: LEARNER_MEET_DISCLAIMER_VI,
    };
  }

  async endSession(accountId, sessionId) {
    const session = await this.db
      .prepare('SELECT * FROM wb_learner_meet_sessions WHERE id = ? AND host_account_id = ?')
      .bind(sessionId, accountId)
      .first();
    if (!session) return { ok: false, status: 404, error: 'Không tìm thấy phiên hoặc bạn không phải chủ phiên.' };

    await this.db
      .prepare("UPDATE wb_learner_meet_sessions SET status = 'ended', ended_at = datetime('now') WHERE id = ?")
      .bind(sessionId)
      .run();
    await this.db
      .prepare("UPDATE wb_learner_meet_participants SET left_at = datetime('now'), connection_state = 'left' WHERE session_id = ? AND left_at IS NULL")
      .bind(sessionId)
      .run();
    return { ok: true };
  }
}
