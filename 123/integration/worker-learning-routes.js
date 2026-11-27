/**
 * WORD BRIDGE — Production Cloudflare Worker Learning Routes Adapter
 * Drop-in ESM module for existing Worker `wordbridge-edu` (`src/index.js`).
 *
 * SAFETY GUARANTEES:
 * - Does NOT replace existing auth, Passkeys, RBAC, or legacy routes.
 * - Requires the caller's existing auth middleware to pass `authUser` ({ id, email, name, role }).
 * - Every D1 query strictly scopes reads/writes by `WHERE user_id = ?` using `authUser.id`
 *   (NEVER trusts `user_id` from request body or query string).
 * - Never fabricates progress, scores, or audio URLs.
 */

import { normalizeSaveVocabPayload } from "./dictionary-and-specialty-fix.js";

function json(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store"
    }
  });
}

/**
 * Mount inside your existing `fetch(request, env, ctx)` handler:
 *   if (url.pathname.startsWith("/api/wb/")) {
 *     const authUser = await getAuthenticatedUser(request, env); // your existing auth/Passkey check
 *     return handleWordBridgeLearningApi(request, env, authUser);
 *   }
 */
export async function handleWordBridgeLearningApi(request, env, authUser) {
  const url = new URL(request.url);
  const path = url.pathname;
  const method = request.method.toUpperCase();
  const db = env.DB || env.WORD_DB || env.word;

  if (!db) {
    return json({ error: "D1 binding not configured (expected env.DB / env.word)." }, 500);
  }

  // 1. Auth probe endpoint
  if (path === "/api/wb/me" && method === "GET") {
    if (!authUser || !authUser.id) {
      return json({ authenticated: false, user: null }, 401);
    }
    return json({
      authenticated: true,
      user: { id: String(authUser.id), name: authUser.name || "", email: authUser.email || "" }
    });
  }

  // All state-mutating & personal-data endpoints require authenticated user
  if (!authUser || !authUser.id) {
    return json({ error: "Authentication required" }, 401);
  }
  const userId = String(authUser.id);

  // 2. Hydrate full learner state for authenticated user
  if (path === "/api/wb/state" && method === "GET") {
    const [coursesRes, srsRes, mistakesRes, sessionsRes, draftsRes, vocabRes] = await Promise.all([
      db.prepare("SELECT * FROM wb_user_course_progress WHERE user_id = ?").bind(userId).all(),
      db.prepare("SELECT * FROM wb_user_flashcard_srs WHERE user_id = ?").bind(userId).all(),
      db.prepare("SELECT * FROM wb_user_mistakes WHERE user_id = ? ORDER BY last_seen_at DESC LIMIT 200").bind(userId).all(),
      db.prepare("SELECT * FROM wb_user_practice_sessions WHERE user_id = ? ORDER BY created_at DESC LIMIT 300").bind(userId).all(),
      db.prepare("SELECT * FROM wb_user_writing_submissions WHERE user_id = ?").bind(userId).all(),
      db.prepare("SELECT * FROM wb_user_vocab_bookmarks WHERE user_id = ? ORDER BY saved_at DESC").bind(userId).all()
    ]);

    const courseProgress = {};
    for (const row of coursesRes.results || []) {
      courseProgress[row.course_id] = {
        completedLessons: JSON.parse(row.completed_lessons_json || "[]"),
        completedActivities: JSON.parse(row.completed_activities_json || "[]"),
        lastLessonId: row.current_lesson_id || null,
        startedAt: row.started_at,
        lastAccessedAt: row.last_accessed_at
      };
    }

    const flashcardSrs = {};
    for (const row of srsRes.results || []) {
      flashcardSrs[row.flashcard_id] = {
        state: row.known_state,
        ease: row.ease_factor,
        interval: row.interval_days,
        reps: row.repetitions,
        lapses: row.lapses,
        nextReviewAt: row.next_review_at,
        lastReviewedAt: row.last_reviewed_at
      };
    }

    const writingDrafts = {};
    for (const row of draftsRes.results || []) {
      writingDrafts[row.writing_id] = {
        outline: row.outline_text || "",
        draft: row.draft_text || "",
        submittedAt: row.submitted_at || null,
        updatedAt: row.updated_at
      };
    }

    const myVocab = (vocabRes.results || []).map((r) => ({
      entryId: r.entry_id,
      term: r.term,
      zh: r.zh,
      pinyin: r.pinyin,
      ipa: r.ipa,
      vi: r.vi,
      domain: r.domain_id,
      domainName: r.domain_name,
      setName: r.set_name,
      savedAt: r.saved_at
    }));

    return json({
      courseProgress,
      flashcardSrs,
      mistakes: (mistakesRes.results || []).map((m) => ({
        id: m.id,
        skill: m.skill,
        sourceId: m.source_id,
        language: m.language,
        promptExcerpt: m.prompt_excerpt,
        userAnswer: m.user_answer,
        expectedAnswer: m.expected_answer,
        explanationVi: m.explanation_vi,
        occurrenceCount: m.occurrence_count,
        resolved: Boolean(m.resolved),
        firstSeenAt: m.first_seen_at,
        lastSeenAt: m.last_seen_at
      })),
      sessions: (sessionsRes.results || []).map((s) => ({
        id: s.id,
        skill: s.skill,
        sourceId: s.source_id,
        title: s.title || s.source_id,
        language: s.language,
        domainId: s.domain_id,
        score: s.score,
        maxScore: s.max_score,
        completedAt: s.created_at
      })),
      writingDrafts,
      myVocab
    });
  }

  // 3. Upsert course progress
  if (path === "/api/wb/courses/progress" && method === "POST") {
    const body = await request.json();
    const cid = String(body.courseId || "").trim();
    const p = body.progress || {};
    if (!cid) return json({ error: "Missing courseId" }, 400);
    await db.prepare(`
      INSERT INTO wb_user_course_progress (id, user_id, course_id, current_lesson_id, completed_lessons_json, completed_activities_json, last_accessed_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, course_id) DO UPDATE SET
        current_lesson_id = excluded.current_lesson_id,
        completed_lessons_json = excluded.completed_lessons_json,
        completed_activities_json = excluded.completed_activities_json,
        last_accessed_at = datetime('now')
    `).bind(
      userId + "::" + cid,
      userId,
      cid,
      p.lastLessonId || null,
      JSON.stringify(p.completedLessons || []),
      JSON.stringify(p.completedActivities || [])
    ).run();
    return json({ ok: true });
  }

  // 4. Upsert Flashcard SRS state
  if (path === "/api/wb/flashcards/srs" && method === "POST") {
    const body = await request.json();
    const fid = String(body.flashcardId || "").trim();
    if (!fid) return json({ error: "Missing flashcardId" }, 400);
    await db.prepare(`
      INSERT INTO wb_user_flashcard_srs (user_id, flashcard_id, known_state, ease_factor, interval_days, repetitions, lapses, next_review_at, last_reviewed_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, flashcard_id) DO UPDATE SET
        known_state = excluded.known_state,
        ease_factor = excluded.ease_factor,
        interval_days = excluded.interval_days,
        repetitions = excluded.repetitions,
        lapses = excluded.lapses,
        next_review_at = excluded.next_review_at,
        last_reviewed_at = datetime('now')
    `).bind(
      userId,
      fid,
      body.state || "LEARNING",
      Number(body.ease || 2.5),
      Number(body.interval || 0),
      Number(body.reps || 0),
      Number(body.lapses || 0),
      body.nextReviewAt || null
    ).run();
    return json({ ok: true });
  }

  // 5. Log practice session
  if (path === "/api/wb/sessions" && method === "POST") {
    const body = await request.json();
    const id = String(body.id || ("SES-" + Date.now()));
    await db.prepare(`
      INSERT OR IGNORE INTO wb_user_practice_sessions (id, user_id, skill, source_id, title, language, domain_id, score, max_score)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      String(body.skill || "course"),
      String(body.sourceId || ""),
      String(body.title || ""),
      String(body.language || "en"),
      Number(body.domainId || 1),
      body.score !== undefined ? body.score : null,
      body.maxScore !== undefined ? body.maxScore : null
    ).run();
    return json({ ok: true });
  }

  // 6. Log or resolve mistake
  if (path === "/api/wb/mistakes" && method === "POST") {
    const body = await request.json();
    const id = "MST-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
    await db.prepare(`
      INSERT INTO wb_user_mistakes (id, user_id, skill, source_id, language, prompt_excerpt, user_answer, expected_answer, explanation_vi)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      String(body.skill || "exercises"),
      String(body.sourceId || ""),
      String(body.language || "en"),
      String(body.promptExcerpt || ""),
      String(body.userAnswer || ""),
      String(body.expectedAnswer || ""),
      String(body.explanationVi || "")
    ).run();
    return json({ ok: true, id });
  }

  if (path === "/api/wb/mistakes/resolve" && method === "POST") {
    const body = await request.json();
    await db.prepare("UPDATE wb_user_mistakes SET resolved = 1 WHERE id = ? AND user_id = ?")
      .bind(String(body.id || ""), userId).run();
    return json({ ok: true });
  }

  // 7. Save writing draft/submission
  if (path === "/api/wb/writing/drafts" && method === "POST") {
    const body = await request.json();
    const wid = String(body.writingId || "").trim();
    if (!wid) return json({ error: "Missing writingId" }, 400);
    const draft = String(body.draft || "");
    const wc = draft.trim() ? draft.trim().split(/\s+/).length : 0;
    await db.prepare(`
      INSERT INTO wb_user_writing_submissions (user_id, writing_id, outline_text, draft_text, word_count, submitted_at, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, writing_id) DO UPDATE SET
        outline_text = excluded.outline_text,
        draft_text = excluded.draft_text,
        word_count = excluded.word_count,
        submitted_at = COALESCE(excluded.submitted_at, wb_user_writing_submissions.submitted_at),
        updated_at = datetime('now')
    `).bind(userId, wid, String(body.outline || ""), draft, wc, body.submittedAt || null).run();
    return json({ ok: true });
  }

  // 8. Save vocabulary or specialty term (Normalized entryId/domain/term)
  if (path === "/api/wb/vocab/save" && method === "POST") {
    const body = await request.json();
    const norm = normalizeSaveVocabPayload(body);
    if (!norm.valid) {
      return json({ error: norm.error }, 400);
    }
    await db.prepare(`
      INSERT INTO wb_user_vocab_bookmarks (user_id, entry_id, term, zh, pinyin, ipa, vi, domain_id, domain_name, set_name, saved_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(user_id, entry_id) DO UPDATE SET
        set_name = excluded.set_name,
        saved_at = datetime('now')
    `).bind(
      userId, norm.entryId, norm.term, norm.zh, norm.pinyin, norm.ipa, norm.vi,
      norm.domainId, norm.domainName, norm.setName
    ).run();
    return json({ ok: true, entryId: norm.entryId });
  }

  return json({ error: "Not found" }, 404);
}
