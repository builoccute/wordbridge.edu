'use strict';
const crypto = require('crypto');
const { requireAuth } = require('../security/rbac.middleware');

/**
 * TRUNG TÂM HỌC TẬP, 05 NGÔN NGỮ, 04 CÔNG CỤ CỐT LÕI CHUYÊN SÂU, CÔNG CỤ MỚI & ĐÁNH GIÁ TRÌNH ĐỘ / LỘ TRÌNH (PHẦN III, VI, VII)
 * - 5 ngôn ngữ: Tiếng Trung (zh), Tiếng Anh (en), Tiếng Hàn (ko), Tiếng Nhật (ja), Tiếng Nga (ru)
 * - Tách biệt ngôn ngữ giao diện, ngôn ngữ đang học, ngôn ngữ bài thực hành và ngôn ngữ cộng đồng.
 * - 4 công cụ thực hành cốt lõi:
 *   1. Nghe điền từ (Nghe toàn đoạn, từng câu, tốc độ, lặp câu, ẩn/hiện transcript, điền từ, chép chính tả, sắp xếp từ nghe, chọn nghĩa, lưu câu khó)
 *   2. Từ vựng & Flashcard (Theo chủ đề/trình độ, phát âm, phiên âm, nghĩa Việt, ví dụ, dịch, đồng nghĩa/trái nghĩa, Flashcard 2 chiều, tạo bộ từ, đánh dấu từ khó, ôn tập ngắt quãng SRS, thống kê đã biết/chưa nhớ)
 *   3. Sắp xếp câu (Xáo trộn từ/cụm từ, kéo thả/bấm chọn, kiểm tra cấu trúc, hiển thị lỗi vị trí cụ thể, chấm đúng nhiều cấu trúc câu tương đương, lưu câu sai)
 *   4. Đọc hiểu (Theo chủ đề/cấp độ, trắc nghiệm, điền từ, ý chính, chi tiết, suy luận ngữ cảnh, tra cứu từ ngay trong đoạn, lưu đoạn đọc yêu thích)
 * - Công cụ thực hành mở rộng: Luyện phát âm / nhại âm thanh (Shadowing có xin quyền micro minh bạch), Dịch câu, Ghép từ với nghĩa, Hội thoại tình huống.
 * - Hệ thống Kiểm tra trình độ đầu vào & Lộ trình tự thực hành cá nhân hóa.
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

  enrichExercise(row) {
    const content = JSON.parse(row.content_json || '{}');
    const langCode = row.language_code;

    if (row.tool_type === 'listening') {
      const fullText = content.audio_text || '';
      const sentences = content.sentences || fullText.split(/(?<=[.!?。！？])\s*/).filter(Boolean);
      content.sentences = sentences.length > 0 ? sentences : [fullText];
      content.speed_options = content.speed_options || [0.5, 0.75, 1.0, 1.25, 1.5];
      content.dictation_prompt = content.dictation_prompt || 'Nghe toàn bộ câu và gõ lại chính tả đầy đủ hoặc từ còn khuyết.';
      content.meaning_choices = content.meaning_choices || [
        { text: row.explanation, is_correct: true },
        { text: 'Nội dung không liên quan đến ngữ cảnh giao tiếp trong bài', is_correct: false }
      ];
      content.audio_license = content.audio_license || 'Bản quyền nội dung học tập thuộc WORD BRIDGE – Hỗ trợ Web Speech Synthesis & kiểm tra định dạng âm thanh.';
    } else if (row.tool_type === 'vocabulary') {
      content.cards = (content.cards || []).map(c => ({
        ...c,
        example_translation: c.example_translation || 'Câu ví dụ thực hành trong ngữ cảnh giao tiếp.',
        synonyms: c.synonyms || [],
        antonyms: c.antonyms || []
      }));
    } else if (row.tool_type === 'reading') {
      content.glossary = content.glossary || this.buildContextualGlossary(langCode, content.passage || '');
      content.skill_tags = content.skill_tags || ['Chọn ý chính', 'Tìm thông tin chi tiết', 'Suy luận ngữ cảnh'];
    }

    const isBeginner = /(A1|HSK 1|Cấp 1|N5)/i.test(row.level);

    return {
      id: row.id,
      language_code: row.language_code,
      tool_type: row.tool_type,
      tool_name_vi: this.translateToolName(row.tool_type),
      level: row.level,
      topic: row.topic,
      title: row.title,
      instructions: row.instructions,
      is_beginner: isBeginner,
      content,
      points: row.points,
      created_at: row.created_at
    };
  }

  buildContextualGlossary(langCode, passage) {
    const dictionaries = {
      zh: {
        '星期六': { pinyin: 'xīngqīliù', meaning_vi: 'Thứ Bảy' },
        '外语': { pinyin: 'wàiyǔ', meaning_vi: 'Ngoại ngữ' },
        '俱乐部': { pinyin: 'jùlèbù', meaning_vi: 'Câu lạc bộ' },
        '口语': { pinyin: 'kǒuyǔ', meaning_vi: 'Khẩu ngữ, kỹ năng nói' },
        '互相': { pinyin: 'hùxiāng', meaning_vi: 'Lẫn nhau, tương trợ' }
      },
      en: {
        'memorize': { ipa: '/ˈmeməraɪz/', meaning_vi: 'Ghi nhớ, học thuộc' },
        'struggle': { ipa: '/ˈstrʌɡl/', meaning_vi: 'Gặp khó khăn, xoay xở' },
        'combine': { ipa: '/kəmˈbaɪn/', meaning_vi: 'Kết hợp' },
        'supportive': { ipa: '/səˈpɔːtɪv/', meaning_vi: 'Hỗ trợ, đồng hành tích cực' },
        'retain': { ipa: '/rɪˈteɪn/', meaning_vi: 'Lưu giữ, duy trì lâu dài' }
      },
      ko: {
        '매일': { pron: 'mae-il', meaning_vi: 'Mỗi ngày' },
        '저녁': { pron: 'jeo-nyeok', meaning_vi: 'Buổi tối' },
        '단어': { pron: 'dan-eo', meaning_vi: 'Từ vựng' },
        '복습합니다': { pron: 'bok-seup-ham-ni-da', meaning_vi: 'Ôn tập lại' },
        '주말': { pron: 'ju-mal', meaning_vi: 'Cuối tuần' }
      },
      ja: {
        '毎朝': { pron: 'maiasa', meaning_vi: 'Mỗi buổi sáng' },
        '朝ごはん': { pron: 'asagohan', meaning_vi: 'Bữa ăn sáng' },
        '短い文章': { pron: 'mijikai bunshō', meaning_vi: 'Đoạn văn ngắn' },
        '辞書': { pron: 'jisho', meaning_vi: 'Từ điển' },
        '調べます': { pron: 'shirabemasu', meaning_vi: 'Tra cứu, tìm hiểu' }
      },
      ru: {
        'студенческом': { pron: 'studencheskom', meaning_vi: 'Thuộc về sinh viên' },
        'статьи': { pron: 'statyi', meaning_vi: 'Các bài viết, bài báo' },
        'обсуждают': { pron: 'obsuzhdayut', meaning_vi: 'Thảo luận, bàn bạc' },
        'исправлять': { pron: 'ispravlyat', meaning_vi: 'Sửa chữa, khắc phục' },
        'ошибки': { pron: 'oshibki', meaning_vi: 'Các lỗi sai' }
      }
    };
    const dict = dictionaries[langCode] || {};
    const out = [];
    for (const [term, info] of Object.entries(dict)) {
      if (!passage || passage.includes(term)) {
        out.push({ term, pronunciation: info.pinyin || info.ipa || info.pron || '', meaning_vi: info.meaning_vi });
      }
    }
    return out;
  }

  translateToolName(toolType) {
    const map = {
      listening: 'Nghe điền từ & Luyện nghe',
      vocabulary: 'Từ vựng & Thẻ ghi nhớ',
      sentence: 'Sắp xếp câu & Cấu trúc',
      reading: 'Đọc hiểu ngữ cảnh'
    };
    return map[toolType] || toolType;
  }

  listExercises({ languageCode = null, toolType = null, level = null, topic = null, beginnerOnly = false } = {}) {
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
    if (topic) {
      clauses.push('topic LIKE ?');
      params.push(`%${topic}%`);
    }
    const rows = this.db.query(
      `SELECT id, language_code, tool_type, level, topic, title, instructions, content_json, points, created_at
       FROM practice_exercises WHERE ${clauses.join(' AND ')} ORDER BY created_at ASC`,
      params
    );
    const enriched = rows.map(r => this.enrichExercise(r));
    if (beginnerOnly) {
      return enriched.filter(e => e.is_beginner);
    }
    return enriched;
  }

  getExerciseDetail(exerciseId) {
    const ex = this.db.get(`SELECT * FROM practice_exercises WHERE id = ?`, [exerciseId]);
    if (!ex) throw new Error('Không tìm thấy bài thực hành.');
    const enriched = this.enrichExercise(ex);
    const related = this.db.query(
      `SELECT id, language_code, tool_type, level, topic, title, points
       FROM practice_exercises WHERE language_code = ? AND id != ? LIMIT 4`,
      [ex.language_code, ex.id]
    );
    const linkedResources = this.db.query(
      `SELECT id, title, resource_type, language_code, description
       FROM resources WHERE language_code = ? AND moderation_status = 'approved' LIMIT 3`,
      [ex.language_code]
    );
    return {
      exercise: enriched,
      related_exercises: related,
      linked_resources: linkedResources
    };
  }

  submitPracticeAttempt(user, body) {
    requireAuth(user);
    const { exercise_id, submission, duration_seconds = 15, sub_mode = 'standard' } = body || {};
    const ex = this.db.get(`SELECT * FROM practice_exercises WHERE id = ?`, [exercise_id]);
    if (!ex) {
      throw new Error('Không tìm thấy bài thực hành.');
    }
    const expected = JSON.parse(ex.answer_json || '{}');
    const content = JSON.parse(ex.content_json || '{}');
    let isCorrect = false;
    let earnedScore = 0;
    let specificErrors = [];

    if (ex.tool_type === 'listening') {
      const userBlank = String((submission && (submission.blank || submission.dictation)) || submission || '').trim().toLowerCase();
      const acceptable = (expected.acceptable || expected.blanks || []).map(x => String(x).trim().toLowerCase());
      const fullAudioLower = String(content.audio_text || '').trim().toLowerCase();
      isCorrect = acceptable.includes(userBlank) || (fullAudioLower && userBlank === fullAudioLower);
      earnedScore = isCorrect ? ex.points : 0;
      if (!isCorrect) {
        specificErrors.push(`Từ/Câu nghe bạn nhập ("${userBlank || 'trống'}") chưa khớp với đáp án chuẩn ("${(expected.blanks || [])[0] || ''}").`);
      }
    } else if (ex.tool_type === 'vocabulary') {
      const userChoice = String((submission && submission.selected_option) || submission || '').trim();
      isCorrect = userChoice === String(expected.correct_option || '').trim();
      earnedScore = isCorrect ? ex.points : 0;
      if (!isCorrect) {
        specificErrors.push(`Lựa chọn "${userChoice || 'trống'}" chưa đúng. Đáp án chính xác là "${expected.correct_option}".`);
      }
    } else if (ex.tool_type === 'sentence') {
      const tokens = Array.isArray(submission?.ordered_tokens)
        ? submission.ordered_tokens
        : (Array.isArray(submission) ? submission : String(submission || '').split(/\s*\|\s*|\s*,\s*/).filter(Boolean));
      const cleanUserTokens = tokens.map(t => String(t).trim()).filter(Boolean);
      const joinedUser = cleanUserTokens.join(' ');

      const validOrders = [];
      if (Array.isArray(expected.ordered_tokens)) validOrders.push(expected.ordered_tokens);
      if (Array.isArray(expected.Alt_ordered)) validOrders.push(expected.Alt_ordered);
      if (Array.isArray(expected.alt_ordered)) validOrders.push(expected.alt_ordered);
      if (Array.isArray(expected.acceptable_orders)) {
        for (const ord of expected.acceptable_orders) {
          if (Array.isArray(ord)) validOrders.push(ord);
        }
      }

      isCorrect = validOrders.some(ord => ord.map(x => String(x).trim()).join(' ') === joinedUser);
      earnedScore = isCorrect ? ex.points : 0;

      if (!isCorrect && validOrders.length > 0) {
        const primary = validOrders[0];
        for (let i = 0; i < Math.max(primary.length, cleanUserTokens.length); i++) {
          if (cleanUserTokens[i] !== primary[i]) {
            specificErrors.push(`Vị trí thứ ${i + 1}: bạn đặt "${cleanUserTokens[i] || '(thiếu từ)'}", cấu trúc chuẩn cần "${primary[i] || '(dư từ)'}".`);
          }
        }
      }
    } else if (ex.tool_type === 'reading') {
      const userAnswers = Array.isArray(submission?.answers) ? submission.answers : [submission];
      const expAnswers = expected.answers || [];
      let matches = 0;
      for (let i = 0; i < expAnswers.length; i++) {
        if (String(userAnswers[i] || '').trim() === String(expAnswers[i]).trim()) {
          matches += 1;
        } else {
          specificErrors.push(`Câu đọc hiểu số ${i + 1}: phương án "${userAnswers[i] || 'trống'}" chưa chính xác (Đáp án đúng: "${expAnswers[i]}").`);
        }
      }
      isCorrect = expAnswers.length > 0 && matches === expAnswers.length;
      earnedScore = expAnswers.length > 0 ? Math.round((matches / expAnswers.length) * ex.points) : 0;
    }

    const attemptId = 'att_' + crypto.randomBytes(8).toString('hex');
    const nowIso = new Date().toISOString();
    const feedback = isCorrect
      ? `Chính xác! Bạn đạt ${earnedScore}/${ex.points} điểm. Giải thích: ${ex.explanation}`
      : `Chưa chính xác (${earnedScore}/${ex.points} điểm). ${specificErrors.join(' ')} Giải thích ngữ cảnh: ${ex.explanation}`;

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
        JSON.stringify(Object.assign({ sub_mode }, typeof submission === 'object' ? submission : { value: submission })),
        earnedScore,
        ex.points,
        isCorrect ? 1 : 0,
        Number(duration_seconds || 15),
        feedback,
        nowIso
      ]
    );

    // Tự động lưu vào sổ tay lỗi sai nếu làm chưa đúng để người học ôn lại (PHẦN III.3 & VI.3)
    if (!isCorrect) {
      this.db.run(
        `INSERT INTO saved_learning_items (id, user_id, language_code, item_type, reference_id, content_json, note, created_at)
         VALUES (?, ?, ?, 'wrong_sentence', ?, ?, ?, ?)`,
        [
          'sli_' + crypto.randomBytes(8).toString('hex'),
          user.id,
          ex.language_code,
          ex.id,
          JSON.stringify({ title: ex.title, tool_type: ex.tool_type, specific_errors: specificErrors, explanation: ex.explanation }),
          'Tự động ghi nhận từ lượt làm bài chưa chính xác để ôn tập lại',
          nowIso
        ]
      );
    }

    // Cập nhật tiến độ mục tiêu học tập và lộ trình thực tế của người dùng
    this.db.run(
      `UPDATE learning_goals SET current_sessions = current_sessions + 1, updated_at = ?
       WHERE user_id = ? AND language_code = ?`,
      [nowIso, user.id, ex.language_code]
    );

    const roadmap = this.db.get(
      `SELECT * FROM learning_roadmaps WHERE user_id = ? AND language_code = ? ORDER BY updated_at DESC LIMIT 1`,
      [user.id, ex.language_code]
    );
    if (roadmap) {
      const nextPct = Math.min(100, Number(roadmap.progress_percent || 0) + 10);
      this.db.run(`UPDATE learning_roadmaps SET progress_percent = ?, updated_at = ? WHERE id = ?`, [nextPct, nowIso, roadmap.id]);
    }

    // Kiểm tra và cấp huy hiệu thành tích thực tế dựa trên dữ liệu thật (PHẦN VIII)
    this.evaluateRealAchievements(user.id);

    return {
      attempt_id: attemptId,
      exercise_id: ex.id,
      language_code: ex.language_code,
      tool_type: ex.tool_type,
      is_correct: isCorrect,
      score: earnedScore,
      max_score: ex.points,
      specific_errors: specificErrors,
      correct_answer: expected,
      explanation: ex.explanation,
      feedback,
      created_at: nowIso
    };
  }

  evaluateRealAchievements(userId) {
    const totalRow = this.db.get(`SELECT COUNT(*) AS cnt, COALESCE(SUM(score), 0) AS total_score FROM practice_attempts WHERE user_id = ?`, [userId]);
    const count = totalRow ? totalRow.cnt : 0;
    const nowIso = new Date().toISOString();

    if (count >= 1) {
      this.db.run(
        `INSERT OR IGNORE INTO user_achievements (id, user_id, badge_code, badge_name, description, earned_at)
         VALUES (?, ?, 'first_practice', 'Khởi đầu Thực hành', 'Hoàn thành bài thực hành ngoại ngữ đầu tiên trên WORD BRIDGE.', ?)`,
        ['ach_' + crypto.randomBytes(8).toString('hex'), userId, nowIso]
      );
    }
    if (count >= 5) {
      this.db.run(
        `INSERT OR IGNORE INTO user_achievements (id, user_id, badge_code, badge_name, description, earned_at)
         VALUES (?, ?, 'five_practices', 'Bền bỉ Rèn luyện', 'Hoàn thành từ 05 lượt bài thực hành ngoại ngữ thực tế.', ?)`,
        ['ach_' + crypto.randomBytes(8).toString('hex'), userId, nowIso]
      );
    }
  }

  saveLearningItem(user, { language_code = 'en', item_type = 'difficult_sentence', reference_id = '', content = {}, note = '' }) {
    requireAuth(user);
    const validTypes = ['difficult_sentence', 'wrong_sentence', 'favorite_reading', 'favorite_exercise'];
    const cleanType = validTypes.includes(item_type) ? item_type : 'difficult_sentence';
    const id = 'sli_' + crypto.randomBytes(8).toString('hex');
    const nowIso = new Date().toISOString();
    this.db.run(
      `INSERT INTO saved_learning_items (id, user_id, language_code, item_type, reference_id, content_json, note, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [id, user.id, language_code, cleanType, String(reference_id || id), JSON.stringify(content || {}), String(note || '').trim(), nowIso]
    );
    return this.db.get(`SELECT * FROM saved_learning_items WHERE id = ?`, [id]);
  }

  listSavedLearningItems(user, { language_code = null, item_type = null } = {}) {
    requireAuth(user);
    const clauses = ['user_id = ?'];
    const params = [user.id];
    if (language_code) {
      clauses.push('language_code = ?');
      params.push(language_code);
    }
    if (item_type) {
      clauses.push('item_type = ?');
      params.push(item_type);
    }
    return this.db.query(
      `SELECT * FROM saved_learning_items WHERE ${clauses.join(' AND ')} ORDER BY created_at DESC LIMIT 50`,
      params
    ).map(r => ({
      ...r,
      content: JSON.parse(r.content_json || '{}')
    }));
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

  reviewVocabularyItem(user, { item_id, remembered = true, is_favorite = null }) {
    requireAuth(user);
    const item = this.db.get(`SELECT * FROM vocabulary_items WHERE id = ? AND user_id = ?`, [item_id, user.id]);
    if (!item) throw new Error('Không tìm thấy từ vựng cần cập nhật ôn tập.');
    const currentLevel = Number(item.mastery_level || 0);
    const nextLevel = remembered ? Math.min(5, currentLevel + 1) : Math.max(0, currentLevel - 1);
    const favVal = is_favorite !== null ? (is_favorite ? 1 : 0) : item.is_favorite;
    const nowIso = new Date().toISOString();

    this.db.run(
      `UPDATE vocabulary_items SET mastery_level = ?, is_favorite = ?, last_reviewed_at = ? WHERE id = ?`,
      [nextLevel, favVal, nowIso, item.id]
    );
    const updated = this.db.get(`SELECT * FROM vocabulary_items WHERE id = ?`, [item.id]);
    // Tính khoảng thời gian ôn tập ngắt quãng tiếp theo (SRS: 1, 3, 7, 14, 30 ngày)
    const srsDays = [1, 1, 3, 7, 14, 30][nextLevel] || 1;
    const nextReviewAt = new Date(Date.now() + srsDays * 24 * 3600 * 1000).toISOString();
    return {
      ...updated,
      is_known: nextLevel >= 3,
      srs_interval_days: srsDays,
      next_review_at: nextReviewAt
    };
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
    const allItems = this.db.query(`SELECT * FROM vocabulary_items WHERE user_id = ?`, [user.id]);
    const knownCount = allItems.filter(i => Number(i.mastery_level || 0) >= 3).length;
    const learningCount = allItems.length - knownCount;
    const difficultCount = allItems.filter(i => Boolean(i.is_favorite)).length;

    return {
      sets: sets.map(s => ({
        ...s,
        items: allItems.filter(i => i.set_id === s.id)
      })),
      statistics: {
        total_words: allItems.length,
        known_words: knownCount,
        unmemorized_words: learningCount,
        difficult_marked_words: difficultCount
      }
    };
  }

  /**
   * PHẦN VII: KIỂM TRA TRÌNH ĐỘ ĐẦU VÀO VÀ ĐỀ XUẤT LỘ TRÌNH TỰ THỰC HÀNH CHO 5 NGÔN NGỮ
   * Công bố rõ: Đây là ước lượng năng lực trên nền tảng phục vụ xếp lộ trình tự thực hành,
   * không có giá trị pháp lý thay thế chứng chỉ quốc tế.
   */
  getPlacementQuestions(languageCode = 'en') {
    const exercises = this.listExercises({ languageCode });
    return {
      language_code: languageCode,
      disclaimer: 'Kết quả đánh giá đầu vào là ước lượng năng lực thực hành trên nền tảng WORD BRIDGE (tham chiếu khung CEFR / HSK / TOPIK / JLPT / TRKI) nhằm đề xuất lộ trình tự rèn luyện phù hợp; không thay thế chứng chỉ quốc tế hoặc có giá trị pháp lý.',
      questions: exercises.slice(0, 4).map(ex => ({
        exercise_id: ex.id,
        tool_type: ex.tool_type,
        tool_name_vi: ex.tool_name_vi,
        level: ex.level,
        title: ex.title,
        instructions: ex.instructions,
        content: ex.content,
        points: ex.points
      }))
    };
  }

  submitPlacementAssessment(user, { language_code = 'en', target_goal = 'Giao tiếp và ứng dụng thực tế', submissions = {}, daily_minutes_target = 30 }) {
    requireAuth(user);
    const exercises = this.db.query(`SELECT * FROM practice_exercises WHERE language_code = ? ORDER BY created_at ASC`, [language_code]);
    if (exercises.length === 0) {
      throw new Error('Chưa có bộ câu hỏi đánh giá cho ngôn ngữ này.');
    }

    let totalScore = 0;
    let maxScore = 0;
    const strongSkills = [];
    const weakSkills = [];

    for (const ex of exercises) {
      maxScore += ex.points;
      const ansGiven = submissions[ex.id];
      const expected = JSON.parse(ex.answer_json || '{}');
      let correct = false;

      if (ansGiven !== undefined && ansGiven !== null && ansGiven !== '') {
        if (ex.tool_type === 'listening') {
          const val = String(ansGiven.blank || ansGiven).trim().toLowerCase();
          correct = (expected.acceptable || expected.blanks || []).map(x => String(x).toLowerCase()).includes(val);
        } else if (ex.tool_type === 'vocabulary') {
          correct = String(ansGiven.selected_option || ansGiven).trim() === String(expected.correct_option || '').trim();
        } else if (ex.tool_type === 'sentence') {
          const arr = Array.isArray(ansGiven.ordered_tokens) ? ansGiven.ordered_tokens : (Array.isArray(ansGiven) ? ansGiven : String(ansGiven).split(/\s*\|\s*|\s*,\s*/));
          const joined = arr.map(x => String(x).trim()).join(' ');
          correct = joined === (expected.ordered_tokens || []).join(' ') || joined === (expected.Alt_ordered || []).join(' ');
        } else if (ex.tool_type === 'reading') {
          const firstAns = Array.isArray(ansGiven.answers) ? ansGiven.answers[0] : ansGiven;
          correct = String(firstAns || '').trim() === String((expected.answers || [])[0] || '').trim();
        }
      }

      if (correct) {
        totalScore += ex.points;
        strongSkills.push(this.translateToolName(ex.tool_type));
      } else {
        weakSkills.push(this.translateToolName(ex.tool_type));
      }
    }

    const ratio = maxScore > 0 ? totalScore / maxScore : 0;
    const langRow = this.db.get(`SELECT * FROM languages WHERE code = ?`, [language_code]);
    const levels = langRow ? JSON.parse(langRow.levels_json || '["A1","A2","B1","B2"]') : ['A1', 'A2', 'B1', 'B2'];
    let levelIdx = 0;
    if (ratio >= 0.85) levelIdx = Math.min(levels.length - 1, 3);
    else if (ratio >= 0.6) levelIdx = Math.min(levels.length - 1, 2);
    else if (ratio >= 0.35) levelIdx = Math.min(levels.length - 1, 1);

    const estimatedLevel = levels[levelIdx] || 'A1';
    const targetLevel = levels[Math.min(levels.length - 1, levelIdx + 1)] || estimatedLevel;
    const nowIso = new Date().toISOString();

    const roadmapId = 'rmp_' + crypto.randomBytes(8).toString('hex');
    const recommendedEx = exercises.map(e => ({
      id: e.id,
      title: e.title,
      tool_type: e.tool_type,
      tool_name_vi: this.translateToolName(e.tool_type),
      level: e.level,
      estimated_minutes: 15
    }));

    this.db.run(
      `INSERT INTO learning_roadmaps (
        id, user_id, language_code, current_level, target_level, target_goal,
        daily_minutes_target, weekly_sessions_target, skills_to_improve_json,
        recommended_exercises_json, progress_percent, reassessment_milestone, updated_at, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 5, ?, ?, 0, 'Đánh giá lại sau khi hoàn thành 10 bài thực hành hoặc sau 02 tuần rèn luyện', ?, ?)`,
      [
        roadmapId,
        user.id,
        language_code,
        estimatedLevel,
        targetLevel,
        String(target_goal).trim(),
        Number(daily_minutes_target || 30),
        JSON.stringify(weakSkills.length > 0 ? weakSkills : ['Thực hành nâng cao đồng đều 4 kỹ năng']),
        JSON.stringify(recommendedEx),
        nowIso,
        nowIso
      ]
    );

    const assessmentId = 'plc_' + crypto.randomBytes(8).toString('hex');
    this.db.run(
      `INSERT INTO placement_assessments (
        id, user_id, language_code, target_goal, score, max_score,
        estimated_level, strong_skills_json, weak_skills_json, roadmap_id, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        assessmentId,
        user.id,
        language_code,
        String(target_goal).trim(),
        totalScore,
        maxScore,
        estimatedLevel,
        JSON.stringify(strongSkills),
        JSON.stringify(weakSkills),
        roadmapId,
        nowIso
      ]
    );

    // Cập nhật trình độ hiện tại của người dùng trên hồ sơ
    this.db.run(
      `UPDATE users SET proficiency_level = ?, learning_goals = ?, updated_at = ? WHERE id = ?`,
      [estimatedLevel, String(target_goal).trim(), nowIso, user.id]
    );

    return {
      assessment_id: assessmentId,
      language_code,
      score: totalScore,
      max_score: maxScore,
      estimated_level: estimatedLevel,
      target_level: targetLevel,
      strong_skills: strongSkills,
      weak_skills: weakSkills,
      roadmap: this.getUserRoadmap(user, language_code),
      disclaimer: 'Đây là ước lượng năng lực trên nền tảng WORD BRIDGE để xây dựng lộ trình tự thực hành cá nhân, không phải chứng chỉ pháp lý hoặc chứng chỉ quốc tế.'
    };
  }

  getUserRoadmap(user, languageCode = null) {
    requireAuth(user);
    const row = languageCode
      ? this.db.get(`SELECT * FROM learning_roadmaps WHERE user_id = ? AND language_code = ? ORDER BY updated_at DESC LIMIT 1`, [user.id, languageCode])
      : this.db.get(`SELECT * FROM learning_roadmaps WHERE user_id = ? ORDER BY updated_at DESC LIMIT 1`, [user.id]);
    if (!row) return null;
    return {
      ...row,
      skills_to_improve: JSON.parse(row.skills_to_improve_json || '[]'),
      recommended_exercises: JSON.parse(row.recommended_exercises_json || '[]'),
      disclaimer: 'Lộ trình tự thực hành ước lượng trên nền tảng WORD BRIDGE (Không thay thế chứng chỉ quốc tế).'
    };
  }

  updateUserRoadmap(user, { roadmap_id, target_goal, target_level, daily_minutes_target, weekly_sessions_target }) {
    requireAuth(user);
    const row = this.db.get(`SELECT * FROM learning_roadmaps WHERE id = ? AND user_id = ?`, [roadmap_id, user.id]);
    if (!row) throw new Error('Không tìm thấy lộ trình tự thực hành cần điều chỉnh.');
    const nowIso = new Date().toISOString();
    this.db.run(
      `UPDATE learning_roadmaps
       SET target_goal = ?, target_level = ?, daily_minutes_target = ?, weekly_sessions_target = ?, updated_at = ?
       WHERE id = ?`,
      [
        target_goal ? String(target_goal).trim() : row.target_goal,
        target_level ? String(target_level).trim() : row.target_level,
        daily_minutes_target ? Number(daily_minutes_target) : row.daily_minutes_target,
        weekly_sessions_target ? Number(weekly_sessions_target) : row.weekly_sessions_target,
        nowIso,
        row.id
      ]
    );
    return this.getUserRoadmap(user, row.language_code);
  }

  /**
   * TRỢ LÝ AI TRONG HỌC TẬP
   */
  askAiContextualAssistant(user, { exercise_id = null, language_code = 'en', assist_type = 'context', question = '' }) {
    requireAuth(user);
    const cleanQ = String(question || '').trim();
    if (!cleanQ) {
      throw new Error('Vui lòng nhập câu hỏi hoặc từ/câu cần Trợ lý AI giải thích ngữ cảnh.');
    }

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

    const responseText = `[Trợ lý Ngữ cảnh WORD BRIDGE]: ` +
      `Với câu hỏi "${cleanQ}", hãy chú ý cấu trúc ngữ pháp và sắc thái từ vựng trong ngữ cảnh. ` +
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
