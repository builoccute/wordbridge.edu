/**
 * WORD BRIDGE — Examination Center Service (Section 43–45)
 * STRICT RULE: WORD BRIDGE does NOT issue any certificates of any kind.
 * No certificate templates, APIs, or modules exist.
 */

import { generateId } from '../../utils/crypto.js';

export class ExaminationService {
  constructor(db, emailService, env = {}) {
    this.db = db;
    this.emailService = emailService;
    this.env = env;
    this.baseUrl = env.APP_BASE_URL || 'https://www.wordbridge.vn';
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
