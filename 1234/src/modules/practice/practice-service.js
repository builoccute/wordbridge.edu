/**
 * WORD BRIDGE — Four-Skill Practice Service (Section 39–42)
 * Never fabricates AI accuracy scores for open-ended essays or speaking when unconfigured.
 */

import { generateId } from '../../utils/crypto.js';

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
    return res.results || [];
  }

  async submitPractice(accountId, exerciseId, answers = {}) {
    const exercise = await this.db
      .prepare('SELECT * FROM wb_practice_exercises WHERE id = ?')
      .bind(exerciseId)
      .first();
    if (!exercise) return { ok: false, status: 404, error: 'Không tìm thấy bài luyện tập.' };

    const questionIds = JSON.parse(exercise.question_ids_json || '[]');
    let autoScore = 0;
    let maxScore = 0;
    let hasManualItems = false;
    const itemFeedback = [];

    for (const qId of questionIds) {
      const q = await this.db.prepare('SELECT * FROM wb_question_bank WHERE id = ?').bind(qId).first();
      if (!q) continue;
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
          graded: true,
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
    await this.db
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

    return { ok: true, resultId, score: autoScore, maxScore, gradingStatus, feedback: itemFeedback };
  }
}
