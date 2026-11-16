import { crypto } from '../config/runtime.js';
import { requireAuth, requirePermission } from '../security/rbac.middleware.js';

/**
 * HỆ THỐNG KHẢO THÍ WORD BRIDGE (PHẦN XII & XXI.12)
 * - Tách biệt hoàn toàn điểm luyện tập tại Trung tâm học tập và kết quả khảo thí chính thức.
 * - Tuyệt đối không gửi đáp án đúng (correct_answer_json) hoặc dữ liệu nhạy cảm xuống Frontend trước thời điểm được phép.
 * - Hỗ trợ đầy đủ cho Thí sinh (Danh sách kỳ thi, điều kiện, hướng dẫn, kiểm tra thiết bị, đồng hồ đếm ngược, bảng điều hướng câu hỏi, tự động lưu, nộp bài chống nộp trùng, xem kết quả, lịch sử thi, phúc khảo)
 * - Hỗ trợ đầy đủ cho Hệ thống Quản trị Khảo thí (Ngân hàng câu hỏi, phân loại ngôn ngữ/trình độ/kỹ năng, tạo đề, trộn câu hỏi, trộn đáp án, quản lý thời gian, quản lý lượt thi, chấm điểm, nhật ký sự kiện phòng thi, quản lý khiếu nại).
 * - Không tự tạo chứng chỉ chính thức hoặc công bố tính công nhận pháp lý khi chưa có căn cứ.
 */
class ExamModule {
  constructor(db) {
    this.db = db;
  }

  listPublicExams({ language_code = null, level = null } = {}) {
    const clauses = ["status = 'published'"];
    const params = [];
    if (language_code) {
      clauses.push('language_code = ?');
      params.push(language_code);
    }
    if (level) {
      clauses.push('level = ?');
      params.push(level);
    }
    const rows = this.db.query(`SELECT * FROM exams WHERE ${clauses.join(' AND ')} ORDER BY starts_at ASC`, params);
    return rows.map(ex => ({
      ...ex,
      require_camera: Boolean(ex.require_camera),
      require_mic: Boolean(ex.require_mic),
      shuffle_questions: Boolean(ex.shuffle_questions),
      shuffle_options: Boolean(ex.shuffle_options),
      participation_conditions: 'Tài khoản thành viên đang hoạt động, đã kiểm tra thiết bị trình duyệt trước khi vào phòng thi.',
      pre_exam_instructions: 'Đảm bảo kết nối mạng ổn định, làm bài trung thực và không chuyển tab hoặc thoát toàn màn hình trong thời gian tính giờ.',
      recognition_disclaimer: 'Kết quả đánh giá năng lực trên Hệ thống Khảo Thí WORD BRIDGE phục vụ kiểm tra trình độ nội bộ trên nền tảng; không thay thế chứng chỉ quốc tế hoặc văn bằng pháp lý.'
    }));
  }

  registerForExam(user, { exam_id, device_checked = false, camera_consented = false, camera_declined_reason = '' }) {
    requireAuth(user);
    const exam = this.db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) throw new Error('Không tìm thấy kỳ thi.');
    if (exam.require_camera && !camera_consented) {
      throw new Error(
        `Kỳ thi "${exam.title}" có yêu cầu bật Camera giám sát minh bạch trong giờ thi để bảo vệ tính công bằng. ` +
        `Bạn đã từ chối cấp quyền Camera (${camera_declined_reason || 'Chưa đồng ý'}); vui lòng chọn kỳ thi không yêu cầu Camera hoặc cấp quyền khi sẵn sàng.`
      );
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

  enterExamRoom(user, { exam_id, device_checked = true, camera_consented = null }) {
    requireAuth(user);
    const exam = this.db.get(`SELECT * FROM exams WHERE id = ?`, [exam_id]);
    if (!exam) throw new Error('Không tìm thấy kỳ thi.');
    let reg = this.db.get(`SELECT * FROM exam_registrations WHERE exam_id = ? AND user_id = ?`, [exam_id, user.id]);
    if (!reg) {
      reg = this.registerForExam(user, {
        exam_id,
        device_checked: Boolean(device_checked),
        camera_consented: camera_consented !== null ? Boolean(camera_consented) : !exam.require_camera
      });
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
      const paperCode = 'DE-' + crypto.randomBytes(2).toString('hex').toUpperCase();

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

    // Bảo vệ đề thi: Tuyệt đối KHÔNG gửi correct_answer_json hay explanation xuống Frontend!
    const orderIds = JSON.parse(session.question_order_json || '[]');
    const qMap = new Map(allQuestions.map(q => [q.id, q]));
    const safeQuestions = orderIds
      .map((id, idx) => {
        const q = qMap.get(id);
        if (!q) return null;
        let opts = JSON.parse(q.options_json || '[]');
        // Trộn đáp án cho các câu trắc nghiệm nếu kỳ thi bật shuffle_options (nhưng giữ thứ tự ổn định theo session)
        if (exam.shuffle_options && opts.length > 2 && q.question_type !== 'ordering' && q.question_type !== 'true_false') {
          const seedShift = (session.id.charCodeAt(session.id.length - 1) + idx) % opts.length;
          opts = opts.slice(seedShift).concat(opts.slice(0, seedShift));
        }
        return {
          id: q.id,
          question_number: idx + 1,
          question_type: q.question_type,
          question_type_vi: this.translateQuestionType(q.question_type),
          topic: q.topic,
          level: q.level,
          prompt: q.prompt,
          options: opts,
          points: q.points
        };
      })
      .filter(Boolean);

    const nowMs = Date.now();
    const deadlineMs = new Date(session.server_deadline_at).getTime() + (session.extra_seconds_granted || 0) * 1000;

    return {
      system_name: 'HỆ THỐNG KHẢO THÍ WORD BRIDGE',
      exam: {
        id: exam.id,
        code: exam.code,
        title: exam.title,
        language_code: exam.language_code,
        level: exam.level,
        duration_minutes: exam.duration_minutes,
        pass_score: exam.pass_score,
        total_score: exam.total_score,
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
        session_status_vi: this.translateSessionStatus(session.session_status),
        risk_level: session.risk_level
      },
      navigation_palette: safeQuestions.map(q => ({
        question_number: q.question_number,
        question_id: q.id
      })),
      questions: safeQuestions,
      technical_disclosure: 'Hệ thống chỉ ghi nhận sự kiện trong phạm vi trình duyệt và phiên thi đang mở; không theo dõi ngoài giờ thi và không tự tạo chứng chỉ pháp lý.'
    };
  }

  translateQuestionType(type) {
    const map = {
      single_choice: 'Trắc nghiệm một đáp án',
      multiple_choice: 'Trắc nghiệm nhiều đáp án',
      true_false: 'Đúng / Sai',
      fill_blank: 'Điền từ khuyết',
      ordering: 'Sắp xếp cấu trúc',
      matching: 'Ghép nối',
      essay: 'Tự luận ngắn'
    };
    return map[type] || type;
  }

  translateSessionStatus(status) {
    const map = {
      active: 'Đang làm bài',
      locked: 'Đang tạm khóa kiểm tra',
      submitted: 'Đã nộp bài',
      graded: 'Đã chấm điểm'
    };
    return map[status] || status;
  }

  autoSaveExamAnswers(user, { session_id, answers = {}, flagged_questions = [] }) {
    requireAuth(user);
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?`, [session_id, user.id]);
    if (!session) throw new Error('Không tìm thấy phiên làm bài thi.');
    if (session.session_status !== 'active') {
      throw new Error(`Không thể chỉnh sửa bài làm vì phiên thi đang ở trạng thái '${this.translateSessionStatus(session.session_status)}'.`);
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
        description || `Ghi nhận sự kiện phòng thi (${cleanType})`,
        JSON.stringify(evidence || {}),
        nowIso
      ]
    );

    this.db.run(`UPDATE exam_sessions SET risk_level = ? WHERE id = ?`, [riskLevel, session_id]);

    return {
      event_code: eventCode,
      session_id,
      event_type: cleanType,
      risk_level: riskLevel,
      auto_disqualified: false,
      policy_note: 'Sự kiện đã được ghi vào nhật ký phòng thi để Hội đồng khảo thí xem xét; hệ thống không tự động đánh trượt thí sinh.'
    };
  }

  submitExamSession(user, { session_id, answers = null }) {
    requireAuth(user);
    const session = this.db.get(`SELECT * FROM exam_sessions WHERE id = ? AND user_id = ?`, [session_id, user.id]);
    if (!session) throw new Error('Không tìm thấy phiên thi.');
    // Chống nộp trùng
    if (session.session_status === 'submitted' || session.session_status === 'graded') {
      return {
        already_submitted: true,
        session_id: session.id,
        score: session.score,
        session_status: session.session_status,
        session_status_vi: this.translateSessionStatus(session.session_status),
        locked_after_submit: true
      };
    }
    if (session.session_status === 'locked') {
      throw new Error('Phiên thi đang tạm khóa bởi giám thị; vui lòng chờ giám thị xác minh mở khóa.');
    }

    const finalAnswers = answers !== null ? answers : JSON.parse(session.answers_json || '{}');
    const questions = this.db.query(`SELECT * FROM exam_questions WHERE exam_id = ?`, [session.exam_id]);
    const exam = this.db.get(`SELECT * FROM exams WHERE id = ?`, [session.exam_id]);
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
        const gArr = Array.isArray(given) ? given : String(given).split(/\s*\|\s*|\s*,\s*/).filter(Boolean);
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
      exam_title: exam ? exam.title : '',
      score: totalEarned,
      total_score: exam ? exam.total_score : 100,
      passed: exam ? totalEarned >= exam.pass_score : totalEarned >= 60,
      submitted_at: nowIso,
      session_status: 'graded',
      session_status_vi: 'Đã chấm điểm',
      locked_after_submit: true,
      separate_from_learning_center: true,
      disclaimer: 'Kết quả kỳ thi thuộc Hệ thống Khảo Thí độc lập trên nền tảng WORD BRIDGE, không cộng gộp vào điểm luyện tập hàng ngày và không thay thế chứng chỉ pháp lý.'
    };
  }

  listCandidateExamHistory(user) {
    requireAuth(user);
    const sessions = this.db.query(
      `SELECT s.*, e.code AS exam_code, e.title AS exam_title, e.language_code, e.level, e.pass_score, e.total_score, r.candidate_code
       FROM exam_sessions s
       JOIN exams e ON s.exam_id = e.id
       LEFT JOIN exam_registrations r ON s.registration_id = r.id
       WHERE s.user_id = ?
       ORDER BY s.server_started_at DESC`,
      [user.id]
    );
    const appeals = this.db.query(
      `SELECT * FROM exam_appeals WHERE user_id = ? ORDER BY created_at DESC`,
      [user.id]
    );
    return {
      sessions: sessions.map(s => ({
        ...s,
        session_status_vi: this.translateSessionStatus(s.session_status),
        passed: s.score !== null ? s.score >= s.pass_score : null
      })),
      appeals
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

  /**
   * PHẦN XII & XXIII.5: Quản lý đề thi, Ngân hàng câu hỏi & Giải quyết phúc khảo (Yêu cầu quyền exam.manage / question_bank.manage / appeals.manage)
   */
  createExam(adminUser, body) {
    requirePermission(adminUser, 'exam.manage');
    const {
      code,
      title,
      language_code = 'en',
      level = 'B1',
      duration_minutes = 45,
      pass_score = 60,
      total_score = 100,
      require_camera = false,
      require_mic = false,
      shuffle_questions = true,
      shuffle_options = true
    } = body || {};

    if (!title) throw new Error('Vui lòng nhập tên kỳ thi.');
    const id = 'exam_' + crypto.randomBytes(6).toString('hex');
    const examCode = code || ('WB-EXAM-' + language_code.toUpperCase() + '-' + crypto.randomInt(100, 999));
    const nowIso = new Date().toISOString();

    this.db.run(
      `INSERT INTO exams (
        id, code, title, language_code, level, duration_minutes, pass_score, total_score,
        require_camera, require_mic, shuffle_questions, shuffle_options, starts_at, ends_at, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, '2026-01-01T00:00:00.000Z', '2027-12-31T23:59:59.000Z', 'published', ?)`,
      [
        id,
        examCode,
        String(title).trim(),
        language_code,
        level,
        Number(duration_minutes || 45),
        Number(pass_score || 60),
        Number(total_score || 100),
        require_camera ? 1 : 0,
        require_mic ? 1 : 0,
        shuffle_questions ? 1 : 0,
        shuffle_options ? 1 : 0,
        nowIso
      ]
    );
    return this.db.get(`SELECT * FROM exams WHERE id = ?`, [id]);
  }

  createQuestionBankItem(adminUser, body) {
    requirePermission(adminUser, 'question_bank.manage');
    const {
      exam_id,
      language_code = 'en',
      question_type = 'single_choice',
      topic = 'Ngữ pháp & Từ vựng',
      level = 'B1',
      prompt,
      options = [],
      correct_answer,
      explanation = '',
      points = 20
    } = body || {};

    if (!exam_id || !prompt) {
      throw new Error('Vui lòng chọn kỳ thi và nhập nội dung câu hỏi.');
    }
    const id = 'eq_' + crypto.randomBytes(6).toString('hex');
    const nowIso = new Date().toISOString();
    const ansObj = typeof correct_answer === 'object' && correct_answer !== null ? correct_answer : { answer: String(correct_answer || '') };

    this.db.run(
      `INSERT INTO exam_questions (
        id, exam_id, language_code, question_type, topic, level, prompt,
        options_json, correct_answer_json, explanation, points, version, created_by, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)`,
      [
        id,
        exam_id,
        language_code,
        question_type,
        String(topic).trim(),
        level,
        String(prompt).trim(),
        JSON.stringify(Array.isArray(options) ? options : []),
        JSON.stringify(ansObj),
        String(explanation).trim(),
        Number(points || 20),
        adminUser.id,
        nowIso
      ]
    );
    return this.db.get(`SELECT * FROM exam_questions WHERE id = ?`, [id]);
  }

  resolveExamAppeal(adminUser, { appeal_id, status = 'resolved', resolution_note = '' }) {
    requirePermission(adminUser, 'appeals.manage');
    if (!String(resolution_note || '').trim()) {
      throw new Error('Vui lòng nhập nội dung kết luận phúc khảo.');
    }
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE exam_appeals SET status = ?, resolution_note = ?, handled_by = ?, resolved_at = ? WHERE id = ?`,
      [status, String(resolution_note).trim(), adminUser.id, nowIso, appeal_id]
    );
    return this.db.get(`SELECT * FROM exam_appeals WHERE id = ?`, [appeal_id]);
  }
}

export { ExamModule };
export default { ExamModule };
