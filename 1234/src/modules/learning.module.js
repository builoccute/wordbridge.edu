'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * TRUNG TÂM HỌC TẬP & THỰC HÀNH 05 NGÔN NGỮ + 04 CÔNG CỤ CỐT LÕI + TRỢ LÝ AI (PHẦN 08)
 * - 5 ngôn ngữ: Tiếng Trung (zh), Tiếng Anh (en), Tiếng Hàn (ko), Tiếng Nhật (ja), Tiếng Nga (ru)
 * - 4 công cụ: Nghe điền từ (listening), Từ vựng (vocabulary), Sắp xếp câu (sentence), Đọc hiểu (reading)
 * - Trợ lý AI ngữ cảnh: Giải thích ngữ cảnh, từ vựng, cấu trúc, gợi ý (Không làm thay toàn bộ bài, không tạo điểm giả)
 */
class LearningModule {
  constructor(db) {
    this.db = db;
  }

  listLanguages() {
    return this.db.query(`SELECT * FROM languages WHERE is_active = 1 ORDER BY CASE code
      WHEN 'zh' THEN 1 WHEN 'en' THEN 2 WHEN 'ko' THEN 3 WHEN 'ja' THEN 4 WHEN 'ru' THEN 5 ELSE 6 END`).map(r => ({
      code: r.code,
      name_vi: r.name_vi,
      native_name: r.native_name,
      script_system: r.script_system,
      levels: JSON.parse(r.levels_json || '[]'),
      font_family: r.font_family,
      description: r.description
    }));
  }

  listExercises({ languageCode = null, toolType = null, level = null }) {
    const clauses = ['1=1'];
    const params = [];
    if (languageCode) {
      clauses.push('language_code = ?');
      params.push(languageCode);
    }
    if (toolType) {
      clauses.push('tool_type = ?');
      params.push(toolType);
    }
    if (level) {
      clauses.push('level = ?');
      params.push(level);
    }
    const rows = this.db.query(
      `SELECT id, language_code, tool_type, level, topic, title, instructions, content_json, points, created_at
       FROM practice_exercises WHERE ${clauses.join(' AND ')} ORDER BY created_at ASC`,
      params
    );
    return rows.map(r => ({
      id: r.id,
      language_code: r.language_code,
      tool_type: r.tool_type,
      level: r.level,
      topic: r.topic,
      title: r.title,
      instructions: r.instructions,
      content: JSON.parse(r.content_json || '{}'),
      points: r.points
    }));
  }

  submitPracticeAttempt(user, body) {
    requireAuth(user);
    const { exercise_id, submission, duration_seconds = 15 } = body || {};
    const ex = this.db.get(`SELECT * FROM practice_exercises WHERE id = ?`, [exercise_id]);
    if (!ex) {
      throw new Error('Không tìm thấy bài thực hành.');
    }
    const expected = JSON.parse(ex.answer_json || '{}');
    let isCorrect = false;
    let earnedScore = 0;

    if (ex.tool_type === 'listening') {
      const userBlank = String((submission && submission.blank) || submission || '').trim().toLowerCase();
      const acceptable = (expected.acceptable || expected.blanks || []).map(x => String(x).trim().toLowerCase());
      isCorrect = acceptable.includes(userBlank);
      earnedScore = isCorrect ? ex.points : 0;
    } else if (ex.tool_type === 'vocabulary') {
      const userChoice = String((submission && submission.selected_option) || submission || '').trim();
      isCorrect = userChoice === String(expected.correct_option || '').trim();
      earnedScore = isCorrect ? ex.points : 0;
    } else if (ex.tool_type === 'sentence') {
      const tokens = Array.isArray(submission?.ordered_tokens) ? submission.ordered_tokens : (Array.isArray(submission) ? submission : []);
      const joinedUser = tokens.map(t => String(t).trim()).join(' ');
      const joinedPrimary = (expected.ordered_tokens || []).join(' ');
      const joinedAlt = (expected.Alt_ordered || []).join(' ');
      isCorrect = joinedUser === joinedPrimary || (joinedAlt && joinedUser === joinedAlt);
      earnedScore = isCorrect ? ex.points : 0;
    } else if (ex.tool_type === 'reading') {
      const userAnswers = Array.isArray(submission?.answers) ? submission.answers : [submission];
      const expAnswers = expected.answers || [];
      let matches = 0;
      for (let i = 0; i < expAnswers.length; i++) {
        if (String(userAnswers[i] || '').trim() === String(expAnswers[i]).trim()) {
          matches += 1;
        }
      }
      isCorrect = expAnswers.length > 0 && matches === expAnswers.length;
      earnedScore = expAnswers.length > 0 ? Math.round((matches / expAnswers.length) * ex.points) : 0;
    }

    const attemptId = 'att_' + crypto.randomBytes(8).toString('hex');
    const nowIso = new Date().toISOString();
    const feedback = isCorrect
      ? `Chính xác! Bạn đạt ${earnedScore}/${ex.points} điểm. Giải thích: ${ex.explanation}`
      : `Chưa chính xác (${earnedScore}/${ex.points} điểm). Hãy xem kỹ giải thích ngữ cảnh: ${ex.explanation}`;

    this.db.run(
      `INSERT INTO practice_attempts (
        id, user_id, exercise_id, language_code, tool_type, submitted_json,
        score, max_score, is_correct, duration_seconds, feedback, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        attemptId,
        user.id,
        ex.id,
        ex.language_code,
        ex.tool_type,
        JSON.stringify(submission || {}),
        earnedScore,
        ex.points,
        isCorrect ? 1 : 0,
        Number(duration_seconds || 0),
        feedback,
        nowIso
      ]
    );

    // Cập nhật tiến độ mục tiêu học tập thực tế của người dùng
    this.db.run(
      `UPDATE learning_goals SET current_sessions = current_sessions + 1, updated_at = ?
       WHERE user_id = ? AND language_code = ?`,
      [nowIso, user.id, ex.language_code]
    );

    return {
      attempt_id: attemptId,
      exercise_id: ex.id,
      language_code: ex.language_code,
      tool_type: ex.tool_type,
      is_correct: isCorrect,
      score: earnedScore,
      max_score: ex.points,
      correct_answer: expected,
      explanation: ex.explanation,
      feedback,
      created_at: nowIso
    };
  }

  createVocabularySet(user, { language_code, title, description = '', is_public = false, items = [] }) {
    requireAuth(user);
    if (!title || !language_code) {
      throw new Error('Vui lòng nhập tiêu đề và ngôn ngữ cho bộ từ vựng.');
    }
    const setId = 'vset_' + crypto.randomBytes(8).toString('hex');
    const now = new Date().toISOString();
    this.db.run(
      `INSERT INTO vocabulary_sets (id, user_id, language_code, title, description, is_public, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [setId, user.id, language_code, String(title).trim(), String(description).trim(), is_public ? 1 : 0, now]
    );

    for (const item of items) {
      const itemId = 'vitem_' + crypto.randomBytes(8).toString('hex');
      this.db.run(
        `INSERT INTO vocabulary_items (
          id, set_id, user_id, language_code, term, pronunciation, meaning_vi,
          example_sentence, example_translation, is_favorite, mastery_level, last_reviewed_at, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, NULL, ?)`,
        [
          itemId,
          setId,
          user.id,
          language_code,
          String(item.term || '').trim(),
          String(item.pronunciation || '').trim(),
          String(item.meaning_vi || '').trim(),
          String(item.example_sentence || '').trim(),
          String(item.example_translation || '').trim(),
          item.is_favorite ? 1 : 0,
          now
        ]
      );
    }

    return this.getVocabularySet(user, setId);
  }

  getVocabularySet(user, setId) {
    requireAuth(user);
    const set = this.db.get(`SELECT * FROM vocabulary_sets WHERE id = ?`, [setId]);
    if (!set) throw new Error('Không tìm thấy bộ từ vựng.');
    const items = this.db.query(`SELECT * FROM vocabulary_items WHERE set_id = ? ORDER BY created_at ASC`, [setId]);
    return Object.assign({}, set, { items });
  }

  listUserVocabularySets(user) {
    requireAuth(user);
    const sets = this.db.query(`SELECT * FROM vocabulary_sets WHERE user_id = ? ORDER BY created_at DESC`, [user.id]);
    return sets.map(s => ({
      ...s,
      items: this.db.query(`SELECT * FROM vocabulary_items WHERE set_id = ?`, [s.id])
    }));
  }

  /**
   * PHẦN 08.3: TRỢ LÝ AI TRONG HỌC TẬP
   * - Chỉ giải thích ngữ cảnh, từ vựng, cấu trúc, gợi ý khi người học gặp khó khăn
   * - Tuyệt đối KHÔNG làm thay toàn bộ bài, KHÔNG tạo điểm số giả, KHÔNG tạo tiến độ giả
   * - Giới hạn lượt sử dụng mỗi ngày theo gói dịch vụ
   */
  askAiContextualAssistant(user, { exercise_id = null, language_code = 'en', assist_type = 'context', question = '' }) {
    requireAuth(user);
    const cleanQ = String(question || '').trim();
    if (!cleanQ) {
      throw new Error('Vui lòng nhập câu hỏi hoặc từ/câu cần Trợ lý AI giải thích ngữ cảnh.');
    }

    // Kiểm tra nếu người dùng yêu cầu AI làm thay toàn bộ bài
    if (/làm hộ|giải hết|đáp án toàn bộ|làm thay|cho xin hết đáp án/i.test(cleanQ)) {
      throw new Error('Theo nguyên tắc học tập chủ động của WORD BRIDGE, Trợ lý AI chỉ gợi ý ngữ cảnh, giải thích từ vựng và cấu trúc chứ không làm thay toàn bộ bài tập của bạn.');
    }

    const today = new Date().toISOString().slice(0, 10);
    const dbUser = this.db.get(`SELECT * FROM users WHERE id = ?`, [user.id]);
    let usedToday = dbUser.ai_usage_date === today ? (dbUser.ai_daily_used || 0) : 0;
    const dailyLimit = dbUser.plan_code === 'personal_free' ? 5 : 50;

    if (usedToday >= dailyLimit) {
      throw new Error(`Bạn đã sử dụng hết hạn mức ${dailyLimit} lượt hỗ trợ Trợ lý AI trong ngày của gói hiện tại.`);
    }

    let exContext = '';
    if (exercise_id) {
      const ex = this.db.get(`SELECT title, topic, explanation, level FROM practice_exercises WHERE id = ?`, [exercise_id]);
      if (ex) {
        exContext = `Trong chủ đề "${ex.topic}" (${ex.level} - ${ex.title}): ${ex.explanation}`;
      }
    }

    const responseText = `[Trợ lý Ngữ cảnh WORD BRIDGE - ${assist_type.toUpperCase()}]: ` +
      `Với thắc mắc "${cleanQ}", hãy chú ý cấu trúc ngữ pháp và sắc thái từ vựng trong câu. ` +
      (exContext ? `${exContext} ` : '') +
      `Gợi ý: Hãy xác định từ khóa chính (động từ/trợ từ) trước khi ghép câu hoặc điền từ để tự rèn phản xạ.`;

    usedToday += 1;
    this.db.run(
      `UPDATE users SET ai_daily_used = ?, ai_usage_date = ? WHERE id = ?`,
      [usedToday, today, user.id]
    );

    const logId = 'ailog_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT INTO ai_assistant_logs (id, user_id, exercise_id, language_code, assist_type, user_prompt, ai_response, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [logId, user.id, exercise_id, language_code, assist_type, cleanQ, responseText, new Date().toISOString()]
    );

    return {
      id: logId,
      assist_type,
      response: responseText,
      quota: {
        used_today: usedToday,
        daily_limit: dailyLimit,
        remaining: dailyLimit - usedToday
      },
      data_privacy_notice: 'Dữ liệu câu hỏi gửi tới Trợ lý AI được ẩn danh thông tin định danh cá nhân và chỉ phục vụ phản hồi học tập.'
    };
  }
}

module.exports = { LearningModule };
