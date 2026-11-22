import { generateId } from '../../utils/security.mjs';

/**
 * WORD BRIDGE — Examination & Diagnostic Assessment Grading Engine
 *
 * Enforces Section IV (14.1) & Section VIII (24):
 * - Evaluates question bank responses across Chinese (HSK ref), English (CEFR ref),
 *   and Russian (TORFL/ТРКИ 5-subtest ref).
 * - Computes skill breakdown, total score, percentage, pass/fail threshold, and
 *   diagnostic study recommendations.
 * - STRICTLY NO CERTIFICATES: Zero certificate generation, zero certificate IDs,
 *   zero certificate verification endpoints.
 */



export function gradeExamSubmission({ accountId, exam, questions, submittedAnswers = {}, durationSeconds = 1200 }) {
  let totalScore = 0;
  let maxScore = 0;
  const skillBuckets = {};
  const detailedReview = [];

  for (const q of questions) {
    const pts = Number(q.points || 25);
    maxScore += pts;
    const skill = q.skill_type || 'GENERAL';
    if (!skillBuckets[skill]) {
      skillBuckets[skill] = { earned: 0, max: 0 };
    }
    skillBuckets[skill].max += pts;

    const answerKey = typeof q.answer_key_json === 'string' ? JSON.parse(q.answer_key_json) : q.answer_key_json;
    const userChoice = submittedAnswers[q.id] || '';
    const isCorrect = String(userChoice).trim() === String(answerKey.correct).trim();

    if (isCorrect) {
      totalScore += pts;
      skillBuckets[skill].earned += pts;
    }

    detailedReview.push({
      questionId: q.id,
      skillType: skill,
      userChoice,
      isCorrect,
      pointsEarned: isCorrect ? pts : 0,
      maxPoints: pts,
      explanation: answerKey.explanation || '',
    });
  }

  const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 10000) / 100 : 0;
  const passingThreshold = Number(exam.passing_score_percent || 65);
  const passed = percentage >= passingThreshold ? 1 : 0;

  return {
    id: generateId('exres'),
    account_id: accountId,
    exam_id: exam.id,
    language_code: exam.language_code,
    started_at: new Date(Date.now() - durationSeconds * 1000).toISOString(),
    submitted_at: new Date().toISOString(),
    duration_seconds: durationSeconds,
    total_score: totalScore,
    max_score: maxScore,
    percentage,
    passed,
    skill_breakdown: skillBuckets,
    detailed_review: detailedReview,
    certificate_issued: false, // Hard invariant: WORD BRIDGE NEVER issues certificates
    diagnostic_summary_vi: passed
      ? `Đạt ngưỡng năng lực mục tiêu (${percentage}% >= ${passingThreshold}%). Lưu ý: Kết quả chỉ phục vụ chẩn đoán năng lực cá nhân và điều chỉnh lộ trình học tập trên WORD BRIDGE (Nền tảng không cấp chứng chỉ).`
      : `Chưa đạt ngưỡng mục tiêu (${percentage}% < ${passingThreshold}%). Hệ thống Learning Recovery và Language Error Genome đã cập nhật danh sách chủ điểm cần ôn tập bổ sung.`,
  };
}

/**
 * WORD BRIDGE — Spaced Repetition (SM-2 Enhanced) & Personal Vocabulary Service
 * Calculates next review interval, ease factor, and repetition count for flashcards
 * and personal vocabulary decks.
 */

export function calculateNextSpacedRepetition({ quality, repetitions = 0, easeFactor = 2.5, intervalDays = 1 }) {
  const q = Math.min(5, Math.max(0, Number(quality ?? 4)));
  let nextReps = Number(repetitions || 0);
  let nextInterval = Number(intervalDays || 1);
  let nextEase = Number(easeFactor || 2.5);

  if (q < 3) {
    nextReps = 0;
    nextInterval = 1;
  } else {
    if (nextReps === 0) {
      nextInterval = 1;
    } else if (nextReps === 1) {
      nextInterval = 3;
    } else {
      nextInterval = Math.round(nextInterval * nextEase);
    }
    nextReps += 1;
  }

  nextEase = nextEase + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (nextEase < 1.3) nextEase = 1.3;
  nextEase = Math.round(nextEase * 100) / 100;

  const nextReviewDate = new Date(Date.now() + nextInterval * 86400 * 1000).toISOString();
  return {
    repetitions: nextReps,
    easeFactor: nextEase,
    intervalDays: nextInterval,
    nextReviewAt: nextReviewDate,
  };
}
