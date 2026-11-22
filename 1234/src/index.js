/**
 * WORD BRIDGE V4.0 — Main Specialized Language Platform (wordbridge.io.vn)
 * Zero-D1 / Zero-R2: Routes SQLite & Storage securely to quantri.wordbridge.io.vn
 * Fixes Cloudflare Workers static assets via env.ASSETS ([assets] in wrangler.toml).
 */

import { EmailService } from './services/email-service.js';
import { AuthService } from './services/auth-service.js';
import { StudentBenefitService } from './services/student-benefit-service.js';
import { JobsService, AdminService } from './modules/administration/admin-service.js';
import { R2StorageService, AudioService } from './modules/audio/media-service.js';
import { DictionaryService } from './modules/dictionary/dictionary-service.js';
import { PracticeService, ExaminationService } from './modules/practice/assessment-service.js';
import { LearnerMeetService } from './modules/learner-meet/learner-meet-service.js';
import { IntelligenceService } from './modules/intelligence/intelligence-service.js';
import { handleApiRequest } from './api/router.js';
import { parseCookies, htmlResponse, jsonResponse, redirectResponse, SECURITY_HEADERS, escapeHtml } from './utils/http.js';
import { renderPublicPage } from './layouts/site-layout.js';
import { createQuantriBridge, renderMaintenancePage } from './services/quantri-client.js';
import {
  renderFeaturesPage,
  renderHomePage,
  renderAboutPage,
  renderReaderEntryPage,
  renderHelpPage,
  renderFaqPage,
  renderContactPage,
  renderPolicyPage,
  loadDomainDataset,
  renderSpecializedPage,
  renderLearnerMeetPage,
} from './pages/public-pages.js';

import { renderLearningHub, renderLanguageLearningPage, renderProgramDetailPage, renderCourseCurriculumPage, renderModuleDetailPage, renderWeekDetailPage, renderLessonDetailPage, renderLessonResultPage, renderMyLearningPage } from './pages/learning-pages.js';
import { renderDictionaryPage, renderDictionaryEntryPage, renderVocabularyPage } from './pages/dictionary-pages.js';
import { renderPracticePage, renderPracticeHistoryPage, renderPracticeResultPage, renderExaminationsHub, renderExamDetailPage, renderExamAttemptPage, renderExamResultPage, renderExamHistoryPage } from './pages/practice-exam-pages.js';
import { renderIntelligenceHub, renderIntelligenceSystemPage } from './pages/intelligence-pages.js';
import { renderLoginPage, renderRegisterPage, renderVerifyEmailPage, renderPasswordPage, renderOAuthCallbackPage, renderAccountPage } from './pages/account-pages.js';
import { renderGlobalSearchPage, renderLearningPathPage, renderSkillCenterHub, renderSkillCenterPage, renderKnowledgePage, renderMistakesPage } from './pages/learning-system-pages.js';

function escapePath(value) { return escapeHtml(value); }

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

export default {
  async fetch(request, rawEnv, ctx) {
    const response = await dispatch(request, rawEnv, ctx);
    const target = response.headers.get('location');
    if (!target?.startsWith('https://portal.wordbridge.io.vn/login?')) return response;
    const login = new URL(target);
    const current = new URL(request.url);
    login.searchParams.set('next','https://wordbridge.io.vn' + current.pathname + current.search);
    login.searchParams.set('locale', (current.searchParams.get('locale') || parseCookies(request).wb_ui_locale) === 'en' ? 'en' : 'vi');
    return redirectResponse(login.href, response.status);
  }
};
async function dispatch(request, rawEnv, ctx) {
    // Unexpected runtime failures must surface as 500; do not fake a successful page.
    try {
    const url = new URL(request.url);
    const path = url.pathname.length > 1 && url.pathname.endsWith('/') ? url.pathname.slice(0, -1) : url.pathname;
    const requestCookies = parseCookies(request);

    // Preserve the published per-domain asset URLs after consolidating the catalog.
    const vocabPath = path.match(/^\/(?:public\/)?data\/vocab\/([a-z0-9-]+)\.json$/);
    if (vocabPath && ['GET','HEAD'].includes(request.method)) {
      const dataset = await loadDomainDataset(rawEnv,url.origin,vocabPath[1]);
      if (dataset) return new Response(request.method === 'HEAD' ? null : JSON.stringify(dataset), {
        headers: { ...SECURITY_HEADERS, 'Content-Type':'application/json', 'Cache-Control':'public, max-age=3600' },
      });
    }

    // 1. Cloudflare Workers Static Assets (Fixes 404 CSS/JS/Logo permanently!)
    if (path.startsWith('/styles/') || path.startsWith('/scripts/') || path.startsWith('/branding/') || path.startsWith('/data/') || path.startsWith('/public/')) {
      const normalizedPath = path.startsWith('/public/') ? path.slice('/public'.length) : path;
      if (rawEnv.ASSETS) {
        const assetUrl = new URL(normalizedPath, url.origin);
        const assetRes = await rawEnv.ASSETS.fetch(new Request(assetUrl.toString(), request));
        if (assetRes.status !== 404) return assetRes;
      }
      if (rawEnv.STATIC_ASSETS_LOADER) {
        const asset = await rawEnv.STATIC_ASSETS_LOADER(`/public${normalizedPath}`);
        if (asset) {
          return new Response(asset.body, {
            status: 200,
            headers: { 'Content-Type': asset.contentType, 'Cache-Control': 'public, max-age=3600', ...SECURITY_HEADERS },
          });
        }
      }
    }

    if (/^\/(organizations|social|friends|feed)(\/|$)/.test(path) || path === '/account/subscription') {
      return htmlResponse(renderPublicPage({ title: 'Không tìm thấy chức năng', currentPath: path, contentHtml: '<h1>Chức năng không tồn tại</h1><p>Vui lòng xem các chương trình học hiện hành.</p><a href="/learning">Khám phá học tập</a>' }), 410);
    }

    // 2. Redirect /quan-tri & /admin to Central Management Portal
    if (path === '/quan-tri' || path.startsWith('/quan-tri/') || path === '/admin' || path.startsWith('/admin/')) {
      const targetBase = rawEnv.QUANTRI_WEB_BASE_URL || rawEnv.QUANTRI_API_BASE_URL || 'https://quantri.wordbridge.io.vn';
      if (path === '/admin' || path === '/quan-tri') return redirectResponse(targetBase, 302);
      const suffix = path.startsWith('/admin/') ? path : path.slice('/quan-tri'.length);
      const target = new URL(targetBase);
      target.pathname = suffix;
      target.search = url.search;
      return redirectResponse(target.toString(), 302);
    }

    const { env, runtimeFetcher } = resolveBackingEnv(rawEnv);
    const runtime = runtimeFetcher ? await runtimeFetcher() : null;

    // 3. Zero-Code Maintenance Mode from quantri.wordbridge.io.vn
    if (runtime?.site?.maintenance_mode && !path.startsWith('/api/v1/health')) {
      return await renderMaintenancePage(runtime.site,(url.searchParams.get('locale') || requestCookies.wb_ui_locale) === 'en' ? 'en' : 'vi');
    }

    const services = createServices(env);
    const cookies = requestCookies;
    const user = await services.auth.authenticateSession(cookies.wb_session);

    // 4. V4.0 User App Feature Endpoints (Login Required — Public View / Login-to-Use)
    if (path === '/api/v1/lessons/notes') {
      if (!user) return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Cần đăng nhập để lưu ghi chú bài học.' } }, 401);
      if (request.method === 'POST') {
        if (!user.csrfToken || request.headers.get('X-CSRF-Token') !== user.csrfToken) return jsonResponse({ ok:false, error:{code:'CSRF_INVALID'} },403);
        const b = await request.json().catch(() => ({}));
        const lessonSlug = String(b.lessonSlug || '').trim();
        const noteContent = String(b.noteContent || '').trim();
        const saved = await env.DB.prepare(
          `INSERT INTO wb_lesson_notes (id, account_id, lesson_slug, note_content, updated_at)
           VALUES (?, ?, ?, ?, datetime('now'))
           ON CONFLICT(account_id, lesson_slug) DO UPDATE SET note_content=excluded.note_content, updated_at=datetime('now')`
        ).bind(`ln_${Date.now()}`, user.accountId, lessonSlug, noteContent).run();
        if (saved?.success === false) return jsonResponse({ ok: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Không thể lưu ghi chú vào kho dữ liệu.' } }, 503);
        return jsonResponse({ ok: true, message: 'Đã lưu ghi chú bài học.' });
      }
      const result = await env.DB.prepare('SELECT lesson_slug, note_content, updated_at FROM wb_lesson_notes WHERE account_id = ?').bind(user.accountId).all();
      if (result?.success === false) return jsonResponse({ ok: false, error: { code: 'STORAGE_UNAVAILABLE', message: 'Không thể tải ghi chú lúc này.' } }, 503);
      return jsonResponse({ ok: true, notes: result?.results || [] });
    }

    if (path === '/api/v1/vocabulary/export' && request.method === 'GET') {
      if (!user) return jsonResponse({ ok: false, error: { code: 'UNAUTHORIZED', message: 'Cần đăng nhập để xuất sổ từ vựng.' } }, 401);
      const rows = (await env.DB.prepare(
        `SELECT e.headword, e.phonetic, e.language_code, e.meaning_vi, n.mastery_status, n.interval_days
         FROM wb_vocabulary_notebook n JOIN wb_dictionary_entries e ON e.id = n.entry_id WHERE n.account_id = ?`
      ).bind(user.accountId).all()).results || [];
      const csv = ['headword,phonetic,language,meaning_vi,status,interval_days', ...rows.map((r) => `"${r.headword}","${r.phonetic}","${r.language_code}","${r.meaning_vi}","${r.mastery_status}",${r.interval_days}`)].join('\n');
      return new Response(csv, { status: 200, headers: { 'Content-Type': 'text/csv; charset=utf-8', 'Content-Disposition': 'attachment; filename="wordbridge-vocabulary.csv"', ...SECURITY_HEADERS } });
    }

    if (path.startsWith('/api/v1/')) {
      return await handleApiRequest(request, url, { services, user, env, ctx });
    }

    // 5. Public & Learning Pages
    if (path === '/') return await renderHomePage({ user, runtime });
    if (path === '/features') return await renderFeaturesPage({ user, runtime });
    if (path === '/about') return await renderAboutPage({ user });
    if (path === '/reader') return await renderReaderEntryPage({ user });
    if (path === '/help') return redirectResponse(rawEnv.HELP_BASE_URL || 'https://help.wordbridge.io.vn/', 302);
    if (path === '/faq') return await renderFaqPage({ user });
    if (path === '/contact') return await renderContactPage({ user });
    if (path.startsWith('/policies/')) return await renderPolicyPage({ user, policySlug: path.slice('/policies/'.length) });

    if (path === '/learning/path') return await renderLearningPathPage({ db: env.DB, user });
    if (path === '/learning/skills') return await renderSkillCenterHub({ user });
    const skillCenterMatch = path.match(/^\/skills\/(vocabulary|grammar|listening|speaking|pronunciation|reading|writing)$/);
    if (skillCenterMatch) return await renderSkillCenterPage({ db: env.DB, user, skill: skillCenterMatch[1] });
    if (path === '/learning') return await renderLearningHub({ db: env.DB, user });
    if (path.startsWith('/learning/')) return await renderLanguageLearningPage({ db: env.DB, user, languageSlug: path.slice('/learning/'.length) });
    const progLevelMatch = path.match(/^\/programs\/([^/]+)\/levels\/([^/]+)$/);
    if (progLevelMatch) return await renderProgramDetailPage({ db: env.DB, user, programSlug: progLevelMatch[1] });
    const progMatch = path.match(/^\/programs\/([^/]+)$/);
    if (progMatch) return await renderProgramDetailPage({ db: env.DB, user, programSlug: progMatch[1] });
    const courseCurMatch = path.match(/^\/courses\/([^/]+)\/curriculum$/);
    if (courseCurMatch) return await renderCourseCurriculumPage({ db: env.DB, user, courseSlug: courseCurMatch[1], showCurriculumOnly: true });
    const courseMatch = path.match(/^\/courses\/([^/]+)$/);
    if (courseMatch) return await renderCourseCurriculumPage({ db: env.DB, user, courseSlug: courseMatch[1], showCurriculumOnly: false });
    const modMatch = path.match(/^\/modules\/([^/]+)$/);
    if (modMatch) return await renderModuleDetailPage({ db: env.DB, user, moduleSlug: modMatch[1] });
    const weekMatch = path.match(/^\/weeks\/([^/]+)$/);
    if (weekMatch) return await renderWeekDetailPage({ db: env.DB, user, weekSlug: weekMatch[1] });
    const lessonResMatch = path.match(/^\/lessons\/([^/]+)\/result$/);
    if (lessonResMatch) return await renderLessonResultPage({ db: env.DB, user, lessonSlug: lessonResMatch[1] });
    const lessonMatch = path.match(/^\/lessons\/([^/]+)$/);
    if (lessonMatch) return await renderLessonDetailPage({ db: env.DB, user, lessonSlug: lessonMatch[1] });
    if (path === '/my-learning') return await renderMyLearningPage({ db: env.DB, user, subPath: '' });
    if (path === '/my-learning/history') return await renderMyLearningPage({ db: env.DB, user, subPath: 'history' });
    if (path === '/my-learning/vocabulary') return await renderMyLearningPage({ db: env.DB, user, subPath: 'vocabulary' });

    if (path === '/search') return await renderGlobalSearchPage({ db: env.DB, user, url });
    if (path === '/my-knowledge') return await renderKnowledgePage({ db: env.DB, user });
    if (path === '/my-mistakes') return await renderMistakesPage({ db: env.DB, user });

    if (path === '/dictionary') return await renderDictionaryPage({ services, user, url });
    const dictEntryMatch = path.match(/^\/dictionary\/([^/]+)\/([^/]+)$/);
    if (dictEntryMatch) return await renderDictionaryEntryPage({ services, user, languageSlug: dictEntryMatch[1], entrySlug: dictEntryMatch[2] });
    const dictLangMatch = path.match(/^\/dictionary\/([^/]+)$/);
    if (dictLangMatch) return await renderDictionaryPage({ services, user, url, languageSlug: dictLangMatch[1] });
    if (path === '/vocabulary/notebook') return await renderVocabularyPage({ db: env.DB, user, mode: 'notebook', url });
    if (path === '/vocabulary/sets') return await renderVocabularyPage({ db: env.DB, user, mode: 'sets', url });
    if (path === '/vocabulary/flashcards') return await renderVocabularyPage({ db: env.DB, user, mode: 'flashcards', url });
    if (path === '/vocabulary/review') return await renderVocabularyPage({ db: env.DB, user, mode: 'review', url });

    if (path === '/practice') return await renderPracticePage({ services, user });
    if (path === '/practice/review') return redirectResponse('/vocabulary/review', 302);
    if (path === '/practice/mistakes') return redirectResponse('/my-mistakes', 302);
    if (path === '/practice/history') return await renderPracticeHistoryPage({ db: env.DB, user });
    const prResMatch = path.match(/^\/practice\/results\/([^/]+)$/);
    if (prResMatch) return await renderPracticeResultPage({ db: env.DB, user, resultId: prResMatch[1] });
    const practiceSkillMatch = path.match(/^\/practice\/(listening|speaking|reading|writing|vocabulary|grammar)$/);
    if (practiceSkillMatch) return await renderPracticePage({ services, user, skill: practiceSkillMatch[1], url });

    if (path === '/examinations') return await renderExaminationsHub({ db: env.DB, user });
    if (path === '/examinations/history') return await renderExamHistoryPage({ db: env.DB, user });
    if (['/examinations/chinese', '/examinations/english', '/examinations/russian'].includes(path)) {
      return await renderExaminationsHub({ db: env.DB, user, languageSlug: path.split('/')[2] });
    }
    const examInstrMatch = path.match(/^\/examinations\/([^/]+)\/instructions$/);
    if (examInstrMatch) return await renderExamDetailPage({ db: env.DB, user, examSlug: examInstrMatch[1], isInstructions: true });
    const examSlugMatch = path.match(/^\/examinations\/([^/]+)$/);
    if (examSlugMatch) return await renderExamDetailPage({ db: env.DB, user, examSlug: examSlugMatch[1], isInstructions: false });
    const exAttemptMatch = path.match(/^\/examination-attempts\/([^/]+)$/);
    if (exAttemptMatch) return await renderExamAttemptPage({ db: env.DB, user, attemptId: exAttemptMatch[1] });
    const exResultMatch = path.match(/^\/examination-results\/([^/]+)$/);
    if (exResultMatch) return await renderExamResultPage({ db: env.DB, user, resultId: exResultMatch[1] });

    if (path === '/specialized') return await renderSpecializedPage({ db: env.DB, user });
    if (path.startsWith('/specialized/')) return await renderSpecializedPage({ db: env.DB, user, subSlug: path.slice('/specialized/'.length) });

    if (path === '/learner-meet') return await renderLearnerMeetPage({ db: env.DB, services, user });
    if (path === '/learner-meet/sessions') return await renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'sessions' });
    if (path === '/learner-meet/create') return await renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'create' });
    if (path === '/learner-meet/history') return await renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'history' });
    const lmJoinMatch = path.match(/^\/learner-meet\/join\/([^/]+)$/);
    if (lmJoinMatch) return await renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'room', param: lmJoinMatch[1] });
    const lmRoomMatch = path.match(/^\/learner-meet\/room\/([^/]+)$/);
    if (lmRoomMatch) return await renderLearnerMeetPage({ db: env.DB, services, user, subPath: 'room', param: lmRoomMatch[1] });

    if (path === '/intelligence') return await renderIntelligenceHub({ user });
    const intelPageMatch = path.match(/^\/intelligence\/([a-z0-9-]+)$/);
    if (intelPageMatch) return await renderIntelligenceSystemPage({ services, user, systemSlug: intelPageMatch[1] });

    if (path === '/login') return await renderLoginPage({ user });
    if (path === '/register') return await renderRegisterPage({ user });
    if (path === '/verify-email') return await renderVerifyEmailPage({ services, url, request });
    if (path === '/forgot-password') return await renderPasswordPage({ mode: 'forgot', user });
    if (path === '/reset-password') return await renderPasswordPage({ mode: 'reset', user });
    if (path === '/oauth/callback') return await renderOAuthCallbackPage({ url, user });
    if (path === '/account') return await renderAccountPage({ db: env.DB, user, subPath: '' });
    if (path.startsWith('/account/')) return await renderAccountPage({ db: env.DB, user, subPath: path.slice('/account/'.length) });

    return htmlResponse(renderPublicPage({
      title: '404 — Không tìm thấy trang',
      currentPath: path,
      user,
      runtime,
      contentHtml: `<h1>404 — Không tìm thấy trang</h1><p class="wb-muted">Đường dẫn <code>${escapePath(path)}</code> không tồn tại trên WORD BRIDGE.</p><form action="/dictionary" method="GET" role="search"><label for="wb-recovery-search">Tìm trong từ điển</label> <input id="wb-recovery-search" name="q" class="wb-input" placeholder="Nhập từ cần tìm" /> <button class="wb-btn wb-btn-primary">Tìm kiếm</button></form><p><a href="/learning">Khám phá chương trình học</a></p>`,
    }), 404);
    } catch (err) {
      console.error('WB_REQUEST_FAILED', err);
      if (new URL(request.url).pathname.startsWith('/api/')) return jsonResponse({ok:false,error:{code:'SERVICE_UNAVAILABLE',message:'Không thể xử lý yêu cầu.'}},503);
      return htmlResponse(renderPublicPage({
        title: 'WORD BRIDGE',
        currentPath: '/',
        contentHtml: '<section role="alert"><h1>Hệ thống tạm thời không thể xử lý yêu cầu</h1><p>Không có dữ liệu nào được xác nhận đã lưu. Hãy thử lại hoặc liên hệ hỗ trợ.</p><a href="/" class="wb-btn wb-btn-primary">Về trang chủ</a></section>',
      }), 500);
    }
}
