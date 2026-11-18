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
