import { generateId } from '../../utils/crypto.js';

/**
 * WORD BRIDGE — Four-Skill Practice Service (Section 39–42)
 * Never fabricates AI accuracy scores for open-ended essays or speaking when unconfigured.
 */



export class PracticeService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
  }

  async listExercises({ skill = '', language = '' } = {}) {
    const clauses = [];
    const params = [];
    if (skill) {
      clauses.push('skill = ?');
      params.push(skill);
    }
    if (language) {
      clauses.push('language_code = ?');
      params.push(language);
    }
    const whereSql = clauses.length ? `WHERE ${clauses.join(' AND ')}` : '';
    const res = await this.db
      .prepare(`SELECT * FROM wb_practice_exercises ${whereSql} ORDER BY created_at DESC`)
      .bind(...params)
      .all();
    const exercises = res.results || [];
    const hydrated = [];
    for (const exercise of exercises) {
      const questionIds = JSON.parse(exercise.question_ids_json || '[]');
      const questions = [];
      for (const questionId of questionIds) {
        const question = await this.db.prepare(`SELECT id, language_code, skill, question_type, level_ref, topic, prompt_text, options_json, rubric_json, explanation_vi, audio_asset_id, max_score, auto_gradable FROM wb_question_bank WHERE id = ? AND review_status = 'published'`).bind(questionId).first();
        if (question) {
          questions.push({
            ...question,
            options: JSON.parse(question.options_json || '[]'),
            rubric: question.rubric_json ? JSON.parse(question.rubric_json) : null,
          });
        }
      }
      hydrated.push({ ...exercise, questions });
    }
    return hydrated;
  }

  async submitPractice(accountId, exerciseId, answers = {}) {
    const exercise = await this.db
      .prepare('SELECT * FROM wb_practice_exercises WHERE id = ?')
      .bind(exerciseId)
      .first();
    if (!exercise) return { ok: false, status: 404, error: 'Không tìm thấy bài luyện tập.' };

    const questionIds = JSON.parse(exercise.question_ids_json || '[]');
    if (!questionIds.length) return { ok:false, status:409, error:'Bài tập chưa có câu hỏi.' };
    let autoScore = 0;
    let maxScore = 0;
    let hasManualItems = false;
    const itemFeedback = [];

    for (const qId of questionIds) {
      const q = await this.db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first();
      if (!q || q.review_status !== 'published') return { ok:false, status:409, error:'Bài tập chưa sẵn sàng.' };
      if (!String(answers?.[qId] ?? '').trim()) return { ok:false, status:422, error:'Vui lòng trả lời từng câu hỏi.' };
      maxScore += q.max_score;
      const userAns = answers[qId];

      if (q.auto_gradable === 1 && q.correct_answer_json) {
        const expected = JSON.parse(q.correct_answer_json);
        const isCorrect = Array.isArray(expected)
          ? Array.isArray(userAns) && JSON.stringify([...expected].sort()) === JSON.stringify([...userAns].sort())
          : String(userAns ?? '').trim().toLowerCase() === String(expected).trim().toLowerCase();
        if (isCorrect) autoScore += q.max_score;
        itemFeedback.push({
          questionId: qId,
          graded: true, prompt:q.prompt_text, given:userAns, expected,
          correct: isCorrect,
          earned: isCorrect ? q.max_score : 0,
          maxScore: q.max_score,
          explanationVi: q.explanation_vi,
        });
      } else {
        hasManualItems = true;
        itemFeedback.push({
          questionId: qId,
          graded: false,
          noteVi: 'Câu hỏi tự luận/nói cần đánh giá chuyên sâu theo rubric; hệ thống không tự tạo điểm giả.',
          rubric: q.rubric_json ? JSON.parse(q.rubric_json) : null,
        });
      }
    }

    const gradingStatus = hasManualItems
      ? (itemFeedback.some((f) => f.graded) ? 'partially_graded' : 'pending_manual_review')
      : 'auto_graded';

    const resultId = generateId('pr');
    const saved=await this.db
      .prepare(`
        INSERT INTO wb_practice_results (
          id, account_id, exercise_id, language_code, skill,
          answers_json, score, max_score, grading_status, feedback_json
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `)
      .bind(
        resultId, accountId, exercise.id, exercise.language_code, exercise.skill,
        JSON.stringify(answers), hasManualItems && !itemFeedback.some((f) => f.graded) ? null : autoScore,
        maxScore, gradingStatus, JSON.stringify(itemFeedback)
      )
      .run();

    if(saved?.success===false) return {ok:false,status:503,error:'Không thể lưu kết quả.'};
    return { ok: true, resultId, score: itemFeedback.some(f => f.graded) ? autoScore : null, maxScore, gradingStatus, feedback: itemFeedback };
  }
}

/**
 * WORD BRIDGE — Examination Center Service (Section 43–45)
 * STRICT RULE: WORD BRIDGE does NOT issue any certificates of any kind.
 * No certificate templates, APIs, or modules exist.
 */



export class ExaminationService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = env.APP_BASE_URL || 'https://wordbridge.io.vn';
  }

  async startAttempt(accountId, examSlug) {
    const exam = await this.db
      .prepare("SELECT * FROM wb_examinations WHERE slug = ? AND review_status = 'published'")
      .bind(examSlug)
      .first();
    if (!exam) return { ok: false, status: 404, error: 'Không tìm thấy đề khảo thí.' };

    const attemptId = generateId('exa');
    await this.db
      .prepare(`
        INSERT INTO wb_examination_attempts (id, account_id, examination_id, status, draft_answers_json)
        VALUES (?, ?, ?, 'in_progress', '{}')
      `)
      .bind(attemptId, accountId, exam.id)
      .run();

    return { ok: true, attemptId, examination: exam };
  }

  async saveDraft(accountId, attemptId, draftAnswers) {
    const attempt = await this.db
      .prepare("SELECT id FROM wb_examination_attempts WHERE id = ? AND account_id = ? AND status = 'in_progress'")
      .bind(attemptId, accountId)
      .first();
    if (!attempt) return { ok: false, status: 404, error: 'Không tìm thấy lượt làm bài đang mở.' };

    await this.db
      .prepare("UPDATE wb_examination_attempts SET draft_answers_json = ?, last_saved_at = datetime('now') WHERE id = ?")
      .bind(JSON.stringify(draftAnswers || {}), attemptId)
      .run();

    return { ok: true, savedAt: new Date().toISOString() };
  }

  async submitAttempt(accountId, attemptId, answers = {}) {
    const attempt = await this.db
      .prepare('SELECT * FROM wb_examination_attempts WHERE id = ? AND account_id = ?')
      .bind(attemptId, accountId)
      .first();
    if (!attempt) return { ok: false, status: 404, error: 'Không tìm thấy lượt làm bài.' };
    if (attempt.status !== 'in_progress') {
      return { ok: false, status: 409, error: 'Bài thi này đã được nộp trước đó.' };
    }

    const exam = await this.db
      .prepare('SELECT * FROM wb_examinations WHERE id = ?')
      .bind(attempt.examination_id)
      .first();

    const questionIds = JSON.parse(exam.question_ids_json || '[]');
    let score = 0;
    let maxScore = 0;
    let needsManual = false;
    const breakdown = [];

    for (const qId of questionIds) {
      const q = await this.db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first();
      if (!q) continue;
      maxScore += q.max_score;
      const ans = answers[qId];
      if (q.auto_gradable === 1 && q.correct_answer_json) {
        const expected = JSON.parse(q.correct_answer_json);
        const correct = String(ans ?? '').trim().toLowerCase() === String(expected).trim().toLowerCase();
        if (correct) score += q.max_score;
        breakdown.push({ questionId: qId, correct, earned: correct ? q.max_score : 0, maxScore: q.max_score, explanationVi: q.explanation_vi });
      } else {
        needsManual = true;
        breakdown.push({ questionId: qId, graded: false, noteVi: 'Đang chờ chấm theo rubric.' });
      }
    }

    const scorePercent = maxScore > 0 ? Number(((score / maxScore) * 100).toFixed(2)) : 0;
    const finalStatus = needsManual ? 'pending_manual_review' : 'graded';

    await this.db
      .prepare(`
        UPDATE wb_examination_attempts
        SET status = ?, submitted_answers_json = ?, score = ?, max_score = ?,
            score_percent = ?, result_breakdown_json = ?, submitted_at = datetime('now')
        WHERE id = ?
      `)
      .bind(finalStatus, JSON.stringify(answers), score, maxScore, scorePercent, JSON.stringify(breakdown), attemptId)
      .run();

    const account = await this.db.prepare('SELECT email FROM wb_accounts WHERE id = ?').bind(accountId).first();
    if (account) {
      await this.emailService.sendEventEmail({
        eventType: 'ExamSubmitted',
        templateKey: 'examination_notice',
        recipientEmail: account.email,
        accountId,
        idempotencyKey: `exam_submitted:${attemptId}`,
        variables: { examTitle: exam.title_vi, submittedAt: new Date().toISOString(), ctaUrl: `${this.baseUrl}/examination-results/${attemptId}` },
      });
      if (finalStatus === 'graded') {
        await this.emailService.sendEventEmail({
          eventType: 'ExamGraded',
          templateKey: 'examination_result_notice',
          recipientEmail: account.email,
          accountId,
          idempotencyKey: `exam_graded:${attemptId}`,
          variables: { examTitle: exam.title_vi, score, maxScore, ctaUrl: `${this.baseUrl}/examination-results/${attemptId}` },
        });
      }
    }

    return {
      ok: true,
      resultId: attemptId,
      status: finalStatus,
      score,
      maxScore,
      scorePercent,
      breakdown,
      certificateIssued: false,
      disclaimerVi: exam.disclaimer_vi,
    };
  }
}
