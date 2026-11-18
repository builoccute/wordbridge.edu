/**
 * WORD BRIDGE — Learner Meet Service (1-1 & Group Live Audio/Video Practice)
 *
 * Enforces Section IV (14.3, 14.4) and Section VIII (25):
 * - Allows: 1-1 practice, group practice, create session, join session, participant
 *   management, live audio, live video, mic toggle, camera toggle, connection state
 *   handling, leave session, end session.
 * - Strictly PROHIBITS:
 *   - NO text chat, NO messaging, NO file transfer, NO comments, NO chat attachments.
 *   - NO audio recording, NO video recording, NO Record button, NO recording archive,
 *     NO screen sharing, NO session content storage, NO AI training or ad targeting.
 * - Stores minimal operational metadata ONLY (join timestamp, leave timestamp, connection state).
 * - Explicitly displays the mandatory privacy notice that the platform does not actively
 *   record or store session content, without falsely claiming it can prevent external
 *   hardware/third-party device recording by users.
 */

import { generateId, sanitizeText } from '../../utils/security.mjs';

export const LEARNER_MEET_PRIVACY_DISCLOSURE_VI =
  'THÔNG BÁO QUYỀN RIÊNG TƯ LEARNER MEET: Hệ thống WORD BRIDGE không chủ động ghi âm, ghi hình, không có tính năng chat văn bản, không chia sẻ màn hình và tuyệt đối không lưu trữ nội dung âm thanh/hình ảnh của phiên thực hành hay sử dụng cho huấn luyện AI/quảng cáo. Hệ thống chỉ ghi nhận metadata vận hành tối thiểu (thời điểm tham gia, rời phiên và trạng thái kết nối kỹ thuật). Lưu ý: Nền tảng không thể ngăn chặn việc người tham gia khác tự ý ghi lại bằng thiết bị phần cứng hoặc phần mềm bên ngoài của họ; vui lòng chỉ chia sẻ thông tin phù hợp khi thực hành.';

export const LEARNER_MEET_POLICY_ENFORCEMENT = Object.freeze({
  supportsOneOnOne: true,
  supportsGroup: true,
  supportsLiveAudio: true,
  supportsLiveVideo: true,
  supportsMicToggle: true,
  supportsCameraToggle: true,
  chatAllowed: false,
  fileSharingAllowed: false,
  recordingAllowed: false,
  screenSharingAllowed: false,
  aiTrainingAllowed: false,
  storesSessionMediaContent: false,
});

export function assertProhibitedLearnerMeetAction(actionType) {
  const forbidden = new Set([
    'SEND_CHAT_MESSAGE',
    'UPLOAD_CHAT_FILE',
    'START_RECORDING',
    'STOP_RECORDING',
    'DOWNLOAD_RECORDING',
    'START_SCREEN_SHARE',
  ]);
  if (forbidden.has(String(actionType || '').toUpperCase())) {
    return {
      allowed: false,
      status: 403,
      errorVi:
        'Hành động bị từ chối theo quy định kiến trúc sản phẩm (PHẦN IV Mục 14.3 & 14.4): Learner Meet chỉ hỗ trợ âm thanh và video trực tiếp; tuyệt đối không có chat văn bản, gửi tệp, chia sẻ màn hình hoặc ghi âm/ghi hình.',
    };
  }
  return { allowed: true };
}

export function createLearnerMeetSessionRecord({ hostAccountId, languageCode = 'en', mode = 'ONE_ON_ONE', topicTitle = '', levelCode = 'B1', maxParticipants = 2 }) {
  if (!['zh', 'en', 'ru'].includes(languageCode)) {
    throw new Error('Ngôn ngữ thực hành Learner Meet chỉ hỗ trợ Tiếng Trung (zh), Tiếng Anh (en) hoặc Tiếng Nga (ru).');
  }
  const normalizedMode = mode === 'GROUP' ? 'GROUP' : 'ONE_ON_ONE';
  const cap = normalizedMode === 'ONE_ON_ONE' ? 2 : Math.min(12, Math.max(3, Number(maxParticipants || 6)));
  const now = new Date().toISOString();

  return {
    id: generateId('meet'),
    room_code: `WB-${languageCode.toUpperCase()}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
    host_account_id: hostAccountId,
    language_code: languageCode,
    mode: normalizedMode,
    topic_title: sanitizeText(topicTitle || 'Phiên thực hành phản xạ hội thoại', 140),
    level_code: sanitizeText(levelCode, 30),
    max_participants: cap,
    status: 'LIVE',
    chat_disabled: 1,
    recording_disabled: 1,
    screenshare_disabled: 1,
    privacy_disclosure_vi: LEARNER_MEET_PRIVACY_DISCLOSURE_VI,
    started_at: now,
    ended_at: null,
    created_at: now,
  };
}
