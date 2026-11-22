/**
 * WORD BRIDGE V4.0 — Main Specialized Language Platform (wordbridge.io.vn)
 * Zero-D1 / Zero-R2: Routes SQLite & Storage securely to quantri.wordbridge.io.vn
 * Unified Auth Gate, Super App Learner Routes, 410 Legacy Cleanup, 500 Error Boundary
 */

import { EmailService } from './services/email-service.js';
import { AuthService } from './services/auth-service.js';
import { StudentBenefitService } from './services/student-benefit-service.js';
import { JobsService } from './services/jobs-service.js';
import { R2StorageService } from '../storage/r2-adapter.js';
import { DictionaryService } from './modules/dictionary/dictionary-service.js';
import { AudioService } from './modules/audio/audio-service.js';
import { PracticeService } from './modules/practice/practice-service.js';
import { ExaminationService } from './modules/examination/examination-service.js';
import { LearnerMeetService } from './modules/learner-meet/learner-meet-service.js';
import { IntelligenceService } from './modules/intelligence/intelligence-service.js';
import { AdminService } from './modules/administration/admin-service.js';
import { handleApiRequest } from './api/router.js';
import { ECOSYSTEM, SPECIALIZED_VOCAB_DATASETS } from './config/constants.js';
import { parseCookies, htmlResponse, jsonResponse, redirectResponse, SECURITY_HEADERS } from './utils/http.js';
import { timingSafeEqual } from './utils/crypto.js';
import { renderPublicPage } from './layouts/site-layout.js';
import { createQuantriBridge, renderMaintenancePage } from './services/quantri-client.js';
import { renderFeaturesPage } from './pages/features-page.js';

import { renderHomePage, renderAboutPage, renderFaqPage, renderContactPage, renderPolicyPage, renderReaderDiscoveryPage } from './pages/public-pages.js';
import { renderLearningHub, renderLanguageLearningPage, renderProgramDetailPage, renderCourseCurriculumPage, renderModuleDetailPage, renderWeekDetailPage, renderLessonDetailPage, renderLessonResultPage, renderMyLearningPage } from './pages/learning-pages.js';
import { renderGlobalSearchPage, renderLearningPathPage, renderSkillCenterHub, renderSkillCenterPage, renderKnowledgePage, renderMistakesPage } from './pages/learning-system-pages.js';
import { renderDictionaryPage, renderDictionaryEntryPage, renderVocabularyPage } from './pages/dictionary-pages.js';
import { renderPracticePage, renderPracticeHistoryPage, renderPracticeResultPage, renderExaminationsHub, renderExamDetailPage, renderExamAttemptPage, renderExamResultPage, renderExamHistoryPage } from './pages/practice-exam-pages.js';
import { renderSpecializedPage, renderLearnerMeetPage } from './pages/specialized-meet-pages.js';
import { renderIntelligenceHub, renderIntelligenceSystemPage } from './pages/intelligence-pages.js';
import { renderLoginPage, renderRegisterPage, renderVerifyEmailPage, renderPasswordPage, renderAccountPage } from './pages/account-pages.js';

const REMOVED_LEGACY_PATHS = new Set(['/social', '/friends', '/feed', '/organizations', '/account/subscription', '/oauth/callback', '/account/linked-accounts']);

function resolveBackingEnv(env) {
  if (env.DB && env.R2) return { env, runtimeFetcher: null };
  const bridge = createQuantriBridge(env, 'wordbridge');
  return {
    env: { ...env, DB: env.DB || bridge.db, R2: env.R2 || bridge.storage },
    runtimeFetcher: bridge.getRuntimeConfig,
  };
}

function createServices(env) {
  const email = new EmailService(env.DB, env);
  const auth = new AuthService(env.DB, email, env);
  const studentBenefit = new StudentBenefitService(env.DB, email, env);
  const jobs = new JobsService(env.DB, email, studentBenefit);
  const r2 = new R2StorageService(env.R2);
  const dictionary = new DictionaryService(env.DB);
  const audio = new AudioService(env.DB, r2, env);
  const practice = new PracticeService(env.DB, email, env);
  const examination = new ExaminationService(env.DB, email, env);
  const learnerMeet = new LearnerMeetService(env.DB, email, env);
  const intelligence = new IntelligenceService(env.DB, env);
  const admin = new AdminService(env.DB, auth, jobs);
  return { email, auth, studentBenefit, jobs, r2, dictionary, audio, practice, examination, learnerMeet, intelligence, admin };
}

function inferContentType(path) {
  if (path.endsWith('.json')) return 'application/json; charset=utf-8';
  if (path.endsWith('.css')) return 'text/css; charset=utf-8';
  if (path.endsWith('.js') || path.endsWith('.mjs')) return 'application/javascript; charset=utf-8';
  if (path.endsWith('.svg')) return 'image/svg+xml';
  if (path.endsWith('.png')) return 'image/png';
  if (path.endsWith('.jpg') || path.endsWith('.jpeg')) return 'image/jpeg';
  return 'application/octet-stream';
}

async function loadStaticAsset(normalizedPath, request, url, rawEnv) {
  if (rawEnv.ASSETS) {
    const assetUrl = new URL(normalizedPath, url.origin);
    const assetRes = await rawEnv.ASSETS.fetch(new Request(assetUrl.toString(), request));
    if (assetRes && assetRes.status !== 404) return assetRes;
  }
  if (rawEnv.STATIC_ASSETS_LOADER) {
    const asset = await rawEnv.STATIC_ASSETS_LOADER(`/public${normalizedPath}`);
    if (asset) {
      return new Response(asset.body, {
        status: 200,
        headers: {
          'Content-Type': asset.contentType || inferContentType(normalizedPath),
          'Cache-Control': 'public, max-age=3600',
          ...SECURITY_HEADERS,
        },
      });
    }
  }
  return null;
}

const KNOWN_VOCAB_SLUGS = new Set(SPECIALIZED_VOCAB_DATASETS.map((d) => d.slug));
async function loadVocabJson(domainSlug, request, url, rawEnv) {
  const safeSlug = String(domainSlug || '').replace(/[^a-z0-9-]/gi, '').toLowerCase();
  if (!safeSlug || !KNOWN_VOCAB_SLUGS.has(safeSlug)) return null;
  try {
    const assetRes = await loadStaticAsset(`/data/vocab/${safeSlug}.json`, request, url, rawEnv);
    if (!assetRes || assetRes.status !== 200) return null;
    return await assetRes.json();
  } catch {
    return null;
  }
}

function render500Page(path) {
  return htmlResponse(renderPublicPage({
    title: '500 — Hệ thống tạm thời không thể xử lý yêu cầu',
    currentPath: path,
    contentHtml: `<section class="wb-alert wb-alert-error" role="alert"><h1>Hệ thống tạm thời không thể xử lý yêu cầu</h1><p>Không có dữ liệu nào được xác nhận đã lưu. Hãy thử lại hoặc liên hệ hỗ trợ.</p><a href="/" class="wb-btn wb-btn-outline">Về trang chủ</a></section>`,
  }), 500);
}

export default {
  async fetch(request, rawEnv, ctx) {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;

    try {
      // 1. Cloudflare Workers Static Assets (CSS/JS/Logo/Specialized Vocab Datasets)
      if (
        path.startsWith('/styles/') ||
        path.startsWith('/scripts/') ||
        path.startsWith('/branding/') ||
        path.startsWith('/data/vocab/') ||
        path.startsWith('/public/')
      ) {
        const normalizedPath = path.startsWith('/public/') ? path.slice('/public'.length) : path;
        const assetRes = await loadStaticAsset(normalizedPath, request, url, rawEnv);
        if (assetRes) return assetRes;
      }

      // 2. Removed Legacy Routes -> 410 Gone
      if (
        REMOVED_LEGACY_PATHS.has(path) ||
        path.startsWith('/social/') ||
        path.startsWith('/friends/') ||
        path.startsWith('/organizations/')
      ) {
        return htmlResponse(renderPublicPage({
          title: '410 — Chức năng không tồn tại',
          currentPath: path,
          contentHtml: `<section class="wb-alert wb-alert-warn"><h1>Chức năng không tồn tại</h1><p>Đường dẫn này đã được loại bỏ khỏi phạm vi sản phẩm WORD BRIDGE V4. Vui lòng xem các chương trình học hiện hành.</p><a href="/learning" class="wb-btn wb-btn-primary">Khám phá chương trình học</a></section>`,
        }), 410);
      }

      // 3. Path-safe Redirect /quan-tri* & /admin* to Central Control Plane (quantri.wordbridge.io.vn)
      if (path === '/quan-tri' || path.startsWith('/quan-tri/') || path === '/admin' || path.startsWith('/admin/')) {
        const controlOrigin = rawEnv.QUANTRI_API_BASE_URL || ECOSYSTEM.control;
        if (path === '/admin' || path === '/quan-tri') {
          const target = url.search ? `${controlOrigin}${url.search}` : controlOrigin;
          return redirectResponse(target, 302);
        }
        const target = `${controlOrigin}${path}${url.search}`;
        return redirectResponse(target, 302);
      }

      // 4. Help Center Ownership Handoff
      if (path === '/help') {
        const helpTarget = rawEnv.HELP_BASE_URL || `${ECOSYSTEM.help}/`;
        return redirectResponse(helpTarget, 302);
      }

      const { env, runtimeFetcher } = resolveBackingEnv(rawEnv);
      const runtime = runtimeFetcher ? await runtimeFetcher() : null;

      // 5. Zero-Code Maintenance Mode from quantri.wordbridge.io.vn
      if (runtime?.site?.maintenance_mode && !path.startsWith('/api/v1/health')) {
        return renderMaintenancePage(runtime.site);
      }

      const services = createServices(env);
      const cookies = parseCookies(request);
      const user = await services.auth.authenticateSession(cookies.wb_session);

      // 6. V4.0 Lesson Notes API (Login + CSRF Required)
      if (path === '/api/v1/lessons/notes') {
        if (!user) return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Cần đăng nhập để lưu ghi chú bài học.' } }, 401);
        await env.DB.prepare(`
          CREATE TABLE IF NOT EXISTS wb_lesson_notes (
            id TEXT PRIMARY KEY,
            account_id TEXT NOT NULL,
            lesson_slug TEXT NOT NULL,
            note_content TEXT NOT NULL DEFAULT '',
            updated_at TEXT NOT NULL DEFAULT (datetime('now')),
            UNIQUE(account_id, lesson_slug)
          )
        `).run();
        if (request.method === 'POST') {
          const b = await request.json().catch(() => ({}));
          const csrfToken = request.headers.get('X-CSRF-Token') || b._csrf || '';
          if (!user.csrfToken || !csrfToken || !timingSafeEqual(String(csrfToken), String(user.csrfToken))) {
            return jsonResponse({ ok: false, error: { code: 'CSRF_INVALID', message: 'Thiếu hoặc sai mã bảo vệ CSRF.' } }, 403);
          }
          const lessonSlug = String(b.lessonSlug || '').trim();
          const noteContent = String(b.noteContent || '').trim();
          await env.DB.prepare(
            `INSERT INTO wb_lesson_notes (id, account_id, lesson_slug, note_content, updated_at)
             VALUES (?, ?, ?, ?, datetime('now'))
             ON CONFLICT(account_id, lesson_slug) DO UPDATE SET note_content=excluded.note_content, updated_at=datetime('now')`
          ).bind(`ln_${Date.now()}`, user.accountId, lessonSlug, noteContent).run();
          return jsonResponse({ ok: true, message: 'Đã lưu ghi chú bài học.' });
        }
        const rows = (await env.DB.prepare('SELECT lesson_slug, note_content, updated_at FROM wb_lesson_notes WHERE account_id = ?').bind(user.accountId).all()).results || [];
        return jsonResponse({ ok: true, notes: rows });
      }

      if (path === '/api/v1/vocabulary/export' && request.method === 'GET') {
        if (!user) return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Cần đăng nhập để xuất sổ từ vựng.' } }, 401);
        const rows = (await env.DB.prepare(
          `SELECT e.headword, e.phonetic, e.language_code, e.meaning_vi, n.mastery_status, n.interval_days
           FROM wb_vocabulary_notebook n JOIN wb_dictionary_entries e ON e.id = n.entry_id WHERE n.account_id = ?`
        ).bind(user.accountId).all()).results || [];
        const csv = ['headword,phonetic,language,meaning_vi,status,interval_days', ...rows.map((r) => `"${String(r.headword || '').replace(/"/g, '""')}","${String(r.phonetic || '').replace(/"/g, '""')}","${r.language_code}","${String(r.meaning_vi || '').replace(/"/g, '""')}","${r.mastery_status}",${r.interval_days}`)].join('\n');
        return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="wordbridge-vocabulary.csv"', ...SECURITY_HEADERS } });
      }

      if (path.startsWith('/api/v1/')) {
        return handleApiRequest(request, url, {
          services,
          user,
          env,
          ctx,
          loadVocabJson: (domainSlug) => loadVocabJson(domainSlug, request, url, rawEnv),
        });
      }

      // 7. Public, Discovery & Super App Learning Pages
      if (path === '/') return renderHomePage({ user, runtime });
      if (path === '/features') return renderFeaturesPage({ user, runtime });
      if (path === '/about') return renderAboutPage({ user });
      if (path === '/faq') return renderFaqPage({ user });
      if (path === '/contact') return renderContactPage({ user });
      if (path === '/reader') return renderReaderDiscoveryPage({ user });
      if (path === '/search') return renderGlobalSearchPage({ db: env.DB, user, url });
      if (path.startsWith('/policies/')) return renderPolicyPage({ user, policySlug: path.slice('/policies/'.length) });

      if (path === '/learning') return renderLearningHub({ db: env.DB, user });
      if (path === '/learning/path') return renderLearningPathPage({ db: env.DB, user });
      if (path === '/learning/skills') return renderSkillCenterHub({ user });
      if (path.startsWith('/skills/')) return renderSkillCenterPage({ db: env.DB, user, skill: path.slice('/skills/'.length) });
      if (path === '/my-knowledge') return renderKnowledgePage({ db: env.DB, user });
      if (path === '/my-mistakes') return renderMistakesPage({ db: env.DB, user });
      if (path.startsWith('/learning/')) return renderLanguageLearningPage({ db: env.DB, user, languageSlug: path.slice('/learning/'.length) });

      const progLevelMatch = path.match(/^\/programs\/([^/]+)\/levels\/([^/]+)$/);
      if (progLevelMatch) return renderProgramDetailPage({ db: env.DB, user, programSlug: progLevelMatch[1] });
      const progMatch = path.match(/^\/programs\/([^/]+)$/);
      if (progMatch) return renderProgramDetailPage({ db: env.DB, user, programSlug: progMatch[1] });
      const courseCurMatch = path.match(/^\/courses\/([^/]+)\/curriculum$/);
      if (courseCurMatch) return renderCourseCurriculumPage({ db: env.DB, user, courseSlug: courseCurMatch[1], showCurriculumOnly: true });
      const courseMatch = path.match(/^\/courses\/([^/]+)$/);
      if (courseMatch) return renderCourseCurriculumPage({ db: env.DB, user, courseSlug: courseMatch[1], showCurriculumOnly: false });
      const modMatch = path.match(/^\/modules\/([^/]+)$/);
      if (modMatch) return renderModuleDetailPage({ db: env.DB, user, moduleSlug: modMatch[1] });
      const weekMatch = path.match(/^\/weeks\/([^/]+)$/);
      if (weekMatch) return renderWeekDetailPage({ db: env.DB, user, weekSlug: weekMatch[1] });
      const lessonResMatch = path.match(/^\/lessons\/([^/]+)\/result$/);
      if (lessonResMatch) return renderLessonResultPage({ db: env.DB, user, lessonSlug: lessonResMatch[1] });
      const lessonMatch = path.match(/^\/lessons\/([^/]+)$/);
      if (lessonMatch) return renderLessonDetailPage({ db: env.DB, user, lessonSlug: lessonMatch[1] });
      if (path === '/my-learning') return renderMyLearningPage({ db: env.DB, user, subPath: '' });
      if (path === '/my-learning/history') return renderMyLearningPage({ db: env.DB, user, subPath: 'history' });
      if (path === '/my-learning/vocabulary') return renderMyLearningPage({ db: env.DB, user, subPath: 'vocabulary' });

      if (path === '/dictionary') return renderDictionaryPage({ services, user, url });
      const dictEntryMatch = path.match(/^\/dictionary\/([^/]+)\/([^/]+)$/);
      if (dictEntryMatch) return renderDictionaryEntryPage({ services, user, languageSlug: dictEntryMatch[1], entrySlug: dictEntryMatch[2] });
      const dictLangMatch = path.match(/^\/dictionary\/([^/]+)$/);
      if (dictLangMatch) return renderDictionaryPage({ services, user, url, languageSlug: dictLangMatch[1] });
      if (path === '/vocabulary/notebook') return renderVocabularyPage({ db: env.DB, user, mode: 'notebook', url });
      if (path === '/vocabulary/sets') return renderVocabularyPage({ db: env.DB, user, mode: 'sets', url });
      if (path === '/vocabulary/flashcards') return renderVocabularyPage({ db: env.DB, user, mode: 'flashcards', url });
      if (path === '/vocabulary/review') return renderVocabularyPage({ db: env.DB, user, mode: 'review', url });

      if (path === '/practice') return renderPracticePage({ services, db: env.DB, user });
      if (path === '/practice/history') return renderPracticeHistoryPage({ db: env.DB, user });
      const prResMatch = path.match(/^\/practice\/results\/([^/]+)$/);
      if (prResMatch) return renderPracticeResultPage({ db: env.DB, user, resultId: prResMatch[1] });
      const practiceSkillMatch = path.match(/^\/practice\/(listening|speaking|reading|writing|vocabulary|grammar)$/);
      if (practiceSkillMatch) return renderPracticePage({ services, db: env.DB, user, skill: practiceSkillMatch[1] });

      if (path === '/examinations') return renderExaminationsHub({ db: env.DB, user });
      if (path === '/examinations/history') return renderExamHistoryPage({ db: env.DB, user });
      if (['/examinations/chinese', '/examinations/english', '/examinations/russian'].includes(path)) {
        return renderExaminationsHub({ db: env.DB, user, languageSlug: path.split('/')[2] });
      }
      const examInstrMatch = path.match(/^\/examinations\/([^/]+)\/instructions$/);
      if (examInstrMatch) return renderExamDetailPage({ db: env.DB, user, examSlug: examInstrMatch[1], isInstructions: true });
      const examSlugMatch = path.match(/^\/examinations\/([^/]+)$/);
      if (examSlugMatch) return renderExamDetailPage({ db: env.DB, user, examSlug: examSlugMatch[1], isInstructions: false });
      const exAttemptMatch = path.match(/^\/examination-attempts\/([^/]+)$/);
      if (exAttemptMatch) return renderExamAttemptPage({ db: env.DB, user, attemptId: exAttemptMatch[1] });
      const exResultMatch = path.match(/^\/examination-results\/([^/]+)$/);
      if (exResultMatch) return renderExamResultPage({ db: env.DB, user, resultId: exResultMatch[1] });

      if (path === '/specialized') return renderSpecializedPage({ db: env.DB, user });
      if (path.startsWith('/specialized/')) return renderSpecializedPage({ db: env.DB, user, subSlug: path.slice('/specialized/'.length) });

      if (path === '/learner-meet') return renderLearnerMeetPage({ db: env.DB, services, user });
      if (path === '/learner-meet/sessions') return renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'sessions' });
      if (path === '/learner-meet/create') return renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'create' });
      if (path === '/learner-meet/history') return renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'history' });
      const lmJoinMatch = path.match(/^\/learner-meet\/join\/([^/]+)$/);
      if (lmJoinMatch) return renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'room', param: lmJoinMatch[1] });
      const lmRoomMatch = path.match(/^\/learner-meet\/room\/([^/]+)$/);
      if (lmRoomMatch) return renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'room', param: lmRoomMatch[1] });

      if (path === '/intelligence') return renderIntelligenceHub({ user });
      const intelPageMatch = path.match(/^\/intelligence\/([a-z0-9-]+)$/);
      if (intelPageMatch) return renderIntelligenceSystemPage({ services, user, systemSlug: intelPageMatch[1] });

      if (path === '/login') return renderLoginPage({ user });
      if (path === '/register') return renderRegisterPage({ user });
      if (path === '/verify-email') return renderVerifyEmailPage({ services, url, request });
      if (path === '/forgot-password') return renderPasswordPage({ mode: 'forgot', user });
      if (path === '/reset-password') return renderPasswordPage({ mode: 'reset', user });
      if (path === '/account') return renderAccountPage({ db: env.DB, user, subPath: '' });
      if (path.startsWith('/account/')) return renderAccountPage({ db: env.DB, user, subPath: path.slice('/account/'.length) });

      return htmlResponse(renderPublicPage({
        title: '404 — Không tìm thấy trang',
        currentPath: path,
        user,
        runtime,
        contentHtml: `<h1>404 — Không tìm thấy trang</h1><p class="wb-muted">Đường dẫn <code>${path}</code> không tồn tại trên WORD BRIDGE.</p><a href="/" class="wb-btn wb-btn-primary">Quay về trang chủ</a>`,
      }), 404);
    } catch {
      return render500Page(path);
    }
  },
};
