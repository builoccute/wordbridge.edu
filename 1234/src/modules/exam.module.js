'use strict';
const crypto = require('crypto');
const { requireAuth, requirePermission } = require('../security/rbac.middleware');

/**
 * HỆ THỐNG KHẢO THÍ WORD BRIDGE – /khao-thi & CHỐNG GIAN LẬN (PHẦN 19 & 20)
 * Quy tắc bắt buộc:
 * - Tên chính thức: HỆ THỐNG KHẢO THÍ WORD BRIDGE (Tuyệt đối không dùng Vipro/VIPRO).
 * - Nằm tại đường dẫn https://wordbridge.io.vn/khao-thi, không tạo subdomain riêng.
 * - Đáp án đúng tuyệt đối KHÔNG gửi xuống trình duyệt khi đang làm bài.
 * - AI chỉ hỗ trợ phân tích/cảnh báo rủi ro, KHÔNG tự động đánh trượt hoặc khóa tài khoản chỉ từ một tín hiệu.
 * - Tách biệt hoàn toàn điểm thi chính thức (/khao-thi) với điểm luyện tập (/hoc-tap).
 */
class ExamModule {
  constructor(db) {
    this.db = db;
  }

  listPublicExams() {
    return this.db.query(`SELECT * FROM exams WHERE status = 'published' ORDER BY starts_at ASC`);
  }

  registerForExam(user, { exam_id, device_checked = false, camera_consented = false }) {
    requireAuth(user);
    const exam = this.db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) throw new Error('Không tìm thấy kỳ thi.');
    if (exam.require_camera && !camera_consented) {
      throw new Error('Kỳ thi này có cấu hình yêu cầu bật Camera giám sát trong giờ thi. Vui lòng đọc thông báo mục đích và xác nhận đồng ý cấp quyền trước khi đăng ký.');
    }

    const existing = this.db.get(`SELECT * FROM exam_registrations WHERE exam_id = ? AND user_id = ?`, [exam_id, user.id]);
    if (existing) return existing;

    const regId = 'ereg_' + crypto.randomBytes(8).toString('hex');
    const candidateCode = 'WB-CAND-' + crypto.randomInt(100000, 999999);
    const nowIso = new Date().toISOString();

    this.db.run(
      `INSERT INTO exam_registrations (id, exam_id, user_id, candidate_code, device_checked, camera_consented, status, registered_at)
       VALUES (?, ?, ?, ?, ?, ?, 'registered', ?)`,
      [regId, exam_id, user.id, candidateCode, device_checked ? 1 : 0, camera_consented ? 1 : 0, nowIso]
    );
    return this.db.get(`SELECT * FROM exam_registrations WHERE id = ?`, [regId]);
  }

  enterExamRoom(user, { exam_id }) {
    requireAuth(user);
    const exam = this.db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) throw new Error('Không tìm thấy kỳ thi.');
    let reg = this.db.get(`SELECT * FROM exam_registrations WHERE exam_id = ? AND user_id = ?`, [exam_id, user.id]);
    if (!reg) {
      reg = this.registerForExam(user, { exam_id, device_checked: true, camera_consented: !exam.require_camera });
    }

    let session = this.db.get(`SELECT * FROM exam_sessions WHERE registration_id = ?`, [reg.id]);
    const allQuestions = this.db.query(`SELECT * FROM exam_questions WHERE exam_id = ? ORDER BY id ASC`, [exam_id]);

    if (!session) {
      const qIds = allQuestions.map(q => q.id);
      if (exam.shuffle_questions) {
        qIds.sort(() => Math.random() - 0.5);
      }
      const now = new Date();
      const deadline = new Date(now.getTime() + exam.duration_minutes * 60 * 1000);
      const sesId = 'eses_' + crypto.randomBytes(8).toString('hex');
      const paperCode = 'PAPER-' + crypto.randomBytes(2).toString('hex').toUpperCase();

      this.db.run(
        `INSERT INTO exam_sessions (
          id, registration_id, exam_id, user_id, paper_version_code,
          question_order_json, answers_json, flagged_questions_json,
          server_started_at, server_deadline_at, extra_seconds_granted,
          submitted_at, auto_saved_at, score, risk_level, session_status, proctor_note
        ) VALUES (?, ?, ?, ?, ?, ?, '{}', '[]', ?, ?, 0, NULL, ?, NULL, 'Thấp', 'active', '')`,
        [sesId, reg.id, exam.id, user.id, paperCode, JSON.stringify(qIds), now.toISOString(), deadline.toISOString(), now.toISOString()]
      );
      this.db.run(`UPDATE exam_registrations SET status = 'in_exam' WHERE id = ?`, [reg.id]);
      session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ?`, [sesId]);
    }

    // Bảo vệ nội dung đề: Tuyệt đối KHÔNG trả về correct_answer_json hoặc explanation khi phiên thi chưa nộp!
    const orderIds = JSON.parse(session.question_order_json || '[]');
    const qMap = new Map(allQuestions.map(q => [q.id, q]));
    const safeQuestions = orderIds
      .map(id => qMap.get(id))
      .filter(Boolean)
      .map(q => ({
        id: q.id,
        question_type: q.question_type,
        topic: q.topic,
        level: q.level,
        prompt: q.prompt,
        options: JSON.parse(q.options_json || '[]'),
        points: q.points
      }));

    const nowMs = Date.now();
    const deadlineMs = new Date(session.server_deadline_at).getTime() + (session.extra_seconds_granted || 0) * 1000;

    return {
      system_name: 'HỆ THỐNG KHẢO THÍ WORD BRIDGE',
      exam: {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        duration_minutes: exam.duration_minutes,
        require_camera: Boolean(exam.require_camera),
        require_mic: Boolean(exam.require_mic)
      },
      candidate_code: reg.candidate_code,
      session: {
        id: session.id,
        paper_version_code: session.paper_version_code,
        server_now: new Date(nowMs).toISOString(),
        server_deadline_at: new Date(deadlineMs).toISOString(),
        remaining_seconds: Math.max(0, Math.floor((deadlineMs - nowMs) / 1000)),
        answers: JSON.parse(session.answers_json || '{}'),
        flagged_questions: JSON.parse(session.flagged_questions_json || '[]'),
        session_status: session.session_status,
        risk_level: session.risk_level
      },
      questions: safeQuestions,
      technical_disclosure: 'Hệ thống chỉ ghi nhận hành vi trong phạm vi trình duyệt và phiên thi đang mở; không theo dõi ngoài giờ thi và không hiển thị cảnh báo giả về phần cứng ngoài quyền kiểm tra của trình duyệt.'
    };
  }

  autoSaveExamAnswers(user, { session_id, answers = {}, flagged_questions = [] }) {
    requireAuth(user);
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?`, [session_id, user.id]);
    if (!session) throw new Error('Không tìm thấy phiên làm bài thi.');
    if (session.session_status !== 'active') {
      throw new Error(`Không thể chỉnh sửa bài làm vì phiên thi đang ở trạng thái '${session.session_status}'.`);
    }
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE exam_sessions SET answers_json = ?, flagged_questions_json = ?, auto_saved_at = ? WHERE id = ?`,
      [JSON.stringify(answers), JSON.stringify(flagged_questions), nowIso, session_id]
    );
    return { saved: true, auto_saved_at: nowIso };
  }

  recordIntegrityEvent(user, { session_id, event_type, description = '', evidence = {} }) {
    requireAuth(user);
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?`, [session_id, user.id]);
    if (!session) throw new Error('Không tìm thấy phiên thi.');
    if (session.session_status !== 'active') {
      // Không theo dõi người dùng ngoài phiên thi đang hoạt động (PHẦN 20.2)
      return { ignored: true, reason: 'Phiên thi đã kết thúc; hệ thống không theo dõi ngoài giờ thi.' };
    }

    const allowedEvents = [
      'tab_switch',
      'blur',
      'visibility_hidden',
      'window_switch',
      'minimize',
      'fullscreen_exit',
      'copy_paste',
      'network_drop',
      'duplicate_session',
      'device_change'
    ];
    const cleanType = allowedEvents.includes(event_type) ? event_type : 'tab_switch';

    const eventId = 'eie_' + crypto.randomBytes(8).toString('hex');
    const eventCode = 'INT-' + Date.now().toString().slice(-6) + '-' + crypto.randomInt(10, 99);
    const nowIso = new Date().toISOString();

    const prevCount = this.db.get(`SELECT COUNT(*) AS cnt FROM exam_integrity_events WHERE session_id = ?`, [session_id]).cnt;
    let riskLevel = 'Thấp';
    if (prevCount + 1 >= 6) riskLevel = 'Nghiêm trọng';
    else if (prevCount + 1 >= 4) riskLevel = 'Cao';
    else if (prevCount + 1 >= 2) riskLevel = 'Trung bình';

    this.db.run(
      `INSERT INTO exam_integrity_events (
        id, event_code, session_id, user_id, event_type, risk_level,
        description, evidence_json, resolution_status, handled_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'recorded', NULL, ?)`,
      [
        eventId,
        eventCode,
        session_id,
        user.id,
        cleanType,
        riskLevel,
        description || `Ghi nhận sự kiện ${cleanType} trong phiên thi`,
        JSON.stringify(evidence || {}),
        nowIso
      ]
    );

    // PHẦN 20.7: AI/Hệ thống chỉ cập nhật mức cảnh báo rủi ro để Giám thị xem xét,
    // tuyệt đối KHÔNG tự động đánh trượt hoặc khóa tài khoản thí sinh!
    this.db.run(`UPDATE exam_sessions SET risk_level = ? WHERE id = ?`, [riskLevel, session_id]);

    return {
      event_code: eventCode,
      session_id,
      event_type: cleanType,
      risk_level: riskLevel,
      auto_disqualified: false,
      policy_note: 'Cảnh báo đã được ghi vào Hồ sơ bằng chứng để Hội đồng khảo thí xem xét; hệ thống không tự động đánh trượt thí sinh.'
    };
  }

  submitExamSession(user, { session_id, answers = null }) {
    requireAuth(user);
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?`, [session_id, user.id]);
    if (!session) throw new Error('Không tìm thấy phiên thi.');
    if (session.session_status === 'submitted' || session.session_status === 'graded') {
      return {
        already_submitted: true,
        session_id: session.id,
        score: session.score,
        session_status: session.session_status
      };
    }
    if (session.session_status === 'locked') {
      throw new Error('Phiên thi đang tạm khóa bởi giám thị; vui lòng chờ giám thị xác minh mở khóa.');
    }

    const finalAnswers = answers !== null ? answers : JSON.parse(session.answers_json || '{}');
    const questions = this.db.query(`SELECT * FROM exam_questions WHERE exam_id = ?`, [session.exam_id]);
    let totalEarned = 0;

    for (const q of questions) {
      const correctObj = JSON.parse(q.correct_answer_json || '{}');
      const given = finalAnswers[q.id];
      if (given === undefined || given === null) continue;

      if (q.question_type === 'single_choice' || q.question_type === 'true_false' || q.question_type === 'fill_blank') {
        if (String(given).trim().toLowerCase() === String(correctObj.answer || '').trim().toLowerCase()) {
          totalEarned += q.points;
        }
      } else if (q.question_type === 'multiple_choice') {
        const gArr = Array.isArray(given) ? [...given].sort() : [];
        const cArr = Array.isArray(correctObj.answers) ? [...correctObj.answers].sort() : [];
        if (JSON.stringify(gArr) === JSON.stringify(cArr)) {
          totalEarned += q.points;
        }
      } else if (q.question_type === 'ordering') {
        const gArr = Array.isArray(given) ? given : [];
        const cArr = Array.isArray(correctObj.answer) ? correctObj.answer : [];
        if (JSON.stringify(gArr) === JSON.stringify(cArr)) {
          totalEarned += q.points;
        }
      }
    }

    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE exam_sessions
       SET answers_json = ?, submitted_at = ?, auto_saved_at = ?, score = ?, session_status = 'graded'
       WHERE id = ?`,
      [JSON.stringify(finalAnswers), nowIso, nowIso, totalEarned, session.id]
    );
    this.db.run(`UPDATE exam_registrations SET status = 'graded' WHERE id = ?`, [session.registration_id]);

    return {
      session_id: session.id,
      exam_id: session.exam_id,
      score: totalEarned,
      submitted_at: nowIso,
      session_status: 'graded',
      locked_after_submit: true
    };
  }

  proctorAction(proctorUser, { session_id, action, extra_seconds = 0, reason = '' }) {
    requirePermission(proctorUser, 'proctor.manage');
    if (!String(reason || '').trim()) {
      throw new Error('Giám thị bắt buộc phải ghi rõ lý do khi tạm khóa, mở khóa hoặc cộng bù thời gian.');
    }
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ?`, [session_id]);
    if (!session) throw new Error('Không tìm thấy phiên thi.');

    if (action === 'lock') {
      this.db.run(`UPDATE exam_sessions SET session_status = 'locked', proctor_note = ? WHERE id = ?`, [reason, session_id]);
    } else if (action === 'unlock') {
      this.db.run(`UPDATE exam_sessions SET session_status = 'active', proctor_note = ? WHERE id = ?`, [reason, session_id]);
    } else if (action === 'add_time') {
      this.db.run(
        `UPDATE exam_sessions SET extra_seconds_granted = extra_seconds_granted + ?, proctor_note = ? WHERE id = ?`,
        [Number(extra_seconds || 0), reason, session_id]
      );
    }
    return this.db.get(`SELECT * FROM exam_sessions WHERE id = ?`, [session_id]);
  }

  submitAppeal(user, { session_id, reason, explanation_text }) {
    requireAuth(user);
    if (!reason || !explanation_text) {
      throw new Error('Vui lòng nhập đầy đủ lý do phúc khảo và nội dung giải trình.');
    }
    const id = 'app_' + crypto.randomBytes(8).toString('hex');
    const nowIso = new Date().toISOString();
    this.db.run(
      `INSERT INTO exam_appeals (id, session_id, user_id, reason, explanation_text, status, resolution_note, handled_by, created_at, resolved_at)
       VALUES (?, ?, ?, ?, ?, 'pending', '', NULL, ?, NULL)`,
      [id, session_id, user.id, String(reason).trim(), String(explanation_text).trim(), nowIso]
    );
    return this.db.get(`SELECT * FROM exam_appeals WHERE id = ?`, [id]);
  }
}

module.exports = { ExamModule };
