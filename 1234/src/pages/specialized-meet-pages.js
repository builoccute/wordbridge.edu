/**
 * WORD BRIDGE — Specialized Foreign Languages (ONLY Chinese & English; NO Russian!)
 * & Learner Meet Pages (Audio/Video ONLY — NO chat, NO screen share, NO recording)
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { SPECIALIZED_DOMAINS, OFFICIAL_LANGUAGES } from '../config/constants.js';
import { LEARNER_MEET_DISCLAIMER_VI } from '../modules/learner-meet/learner-meet-service.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse } from '../utils/http.js';

export async function renderSpecializedPage({ db, user, subSlug = '' }) {
  // Strictly block any Specialized Russian route (Section 8.6 & 22)
  if (subSlug === 'russian' || subSlug === 'ru') {
    return htmlResponse(renderPublicPage({
      title: 'Không hỗ trợ Tiếng Nga chuyên ngành',
      currentPath: '/specialized/russian',
      breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Ngoại ngữ chuyên ngành', href: '/specialized' }],
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">Theo phạm vi chính thức của WORD BRIDGE, Ngoại ngữ chuyên ngành chỉ áp dụng cho <strong>Tiếng Trung (zh)</strong> và <strong>Tiếng Anh (en)</strong>. Không mở chương trình Tiếng Nga chuyên ngành.</div>',
    }), 404);
  }

  let heading = 'Ngoại ngữ chuyên ngành (Tiếng Trung & Tiếng Anh)';
  let terms = [];
  if (subSlug === 'chinese') {
    heading = 'Tiếng Trung chuyên ngành';
    terms = (await db.prepare("SELECT * FROM wb_dictionary_entries WHERE language_code = 'zh' AND specialized_domain IS NOT NULL LIMIT 30").all()).results || [];
  } else if (subSlug === 'english') {
    heading = 'Tiếng Anh chuyên ngành';
    terms = (await db.prepare("SELECT * FROM wb_dictionary_entries WHERE language_code = 'en' AND specialized_domain IS NOT NULL LIMIT 30").all()).results || [];
  } else if (subSlug) {
    const dom = SPECIALIZED_DOMAINS.find((d) => d.slug === subSlug);
    if (!dom) {
      return htmlResponse(renderPublicPage({ title: 'Không tìm thấy chuyên ngành', currentPath: `/specialized/${subSlug}`, user, contentHtml: '<div class="wb-alert wb-alert-error">Nhóm chuyên ngành không tồn tại.</div>' }), 404);
    }
    heading = `Ngoại ngữ chuyên ngành: ${dom.nameVi}`;
    terms = (await db.prepare('SELECT * FROM wb_dictionary_entries WHERE specialized_domain = ? LIMIT 30').bind(subSlug).all()).results || [];
  } else {
    terms = (await db.prepare('SELECT * FROM wb_dictionary_entries WHERE specialized_domain IS NOT NULL LIMIT 18').all()).results || [];
  }

  const contentHtml = `
    <h1>${escapeHtml(heading)}</h1>
    <p class="wb-muted">Phạm vi chính thức: chỉ áp dụng <strong>Tiếng Trung</strong> và <strong>Tiếng Anh</strong>. Không mở chuyên ngành Tiếng Nga.</p>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin:14px 0 22px;">
      <a href="/specialized" class="wb-btn wb-btn-outline wb-btn-sm">Tổng quan</a>
      <a href="/specialized/chinese" class="wb-btn wb-btn-primary wb-btn-sm">Tiếng Trung chuyên ngành</a>
      <a href="/specialized/english" class="wb-btn wb-btn-primary wb-btn-sm">Tiếng Anh chuyên ngành</a>
      ${SPECIALIZED_DOMAINS.map((d) => `<a href="/specialized/${d.slug}" class="wb-btn wb-btn-ghost wb-btn-sm">${escapeHtml(d.nameVi)}</a>`).join('')}
    </div>
    <h2>Thuật ngữ chuyên môn trong ngữ cảnh công việc</h2>
    <div class="wb-grid-3">
      ${terms.map((t) => `
        <article class="wb-card">
          <span class="wb-badge">${escapeHtml(t.language_code.toUpperCase())} · ${escapeHtml(t.specialized_domain || '')}</span>
          <h3 style="margin-top:8px;"><a href="/dictionary/${escapeHtml(OFFICIAL_LANGUAGES[t.language_code].slug)}/${escapeHtml(t.slug)}">${escapeHtml(t.headword)}</a></h3>
          <div><span class="wb-phonetic">${escapeHtml(t.phonetic)}</span></div>
          <p style="margin:6px 0;"><strong>${escapeHtml(t.meaning_vi)}</strong></p>
          <p class="wb-muted" style="font-size:0.86rem;">${escapeHtml(t.target_definition)}</p>
        </article>`).join('') || '<div class="wb-alert wb-alert-info">Chuyên ngành này đang bổ sung thêm bộ thuật ngữ & tình huống nghiệp vụ.</div>'}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: heading,
    currentPath: subSlug ? `/specialized/${subSlug}` : '/specialized',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Ngoại ngữ chuyên ngành', href: '/specialized' }, ...(subSlug ? [{ label: heading }] : [])],
    user,
    contentHtml,
  }));
}

export async function renderLearnerMeetPage({ db, services, user, subPath = '', param = '' }) {
  const providerStatus = services.learnerMeet.getProviderStatus();

  if (['create', 'history', 'room', 'join'].includes(subPath) && !user) {
    return redirectResponse('/login');
  }

  let body = '';
  let title = 'Learner Meet — Thực hành Âm thanh & Video';

  if (subPath === 'create') {
    title = 'Tạo phiên Learner Meet';
    body = `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/learner-meet/sessions" data-render-json="lm-create-out">
        <div class="wb-field">
          <label>Ngôn ngữ thực hành</label>
          <select class="wb-select" name="languageCode">
            <option value="zh">Tiếng Trung (zh)</option>
            <option value="en">Tiếng Anh (en)</option>
            <option value="ru">Tiếng Nga (ru)</option>
          </select>
        </div>
        <div class="wb-field">
          <label>Hình thức</label>
          <select class="wb-select" name="mode">
            <option value="one_to_one">Thực hành 1–1 (2 người)</option>
            <option value="group">Thực hành nhóm (tối đa 8 người)</option>
          </select>
        </div>
        <div class="wb-field"><label>Chủ đề thực hành</label><input class="wb-input" name="topicVi" required placeholder="Ví dụ: Luyện hội thoại đặt lịch họp bằng tiếng Anh" /></div>
        <div class="wb-field"><label>Số người tối đa (2–8)</label><input class="wb-input" type="number" name="maxParticipants" min="2" max="8" value="2" /></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Tạo phiên thực hành</button>
      </form>
      <pre id="lm-create-out" style="font-size:0.82rem;overflow:auto;"></pre>`;
  } else if (subPath === 'sessions' || subPath === 'history') {
    title = subPath === 'history' ? 'Lịch sử tham gia Learner Meet' : 'Danh sách phiên Learner Meet';
    const sessions = (await db.prepare('SELECT * FROM wb_learner_meet_sessions ORDER BY created_at DESC LIMIT 20').all()).results || [];
    body = sessions.length
      ? `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã phiên</th><th>Ngôn ngữ</th><th>Chủ đề</th><th>Trạng thái</th><th>Phòng</th></tr></thead><tbody>${sessions.map((s) => `<tr><td><strong>${escapeHtml(s.session_code)}</strong></td><td>${escapeHtml(s.language_code.toUpperCase())}</td><td>${escapeHtml(s.topic_vi)}</td><td>${escapeHtml(s.status)}</td><td><a href="/learner-meet/room/${escapeHtml(s.room_id)}">Mở phòng</a></td></tr>`).join('')}</tbody></table></div>`
      : '<div class="wb-alert wb-alert-info">Hiện chưa có phiên Learner Meet nào đang mở.</div>';
  } else if (subPath === 'room') {
    title = `Phòng thực hành ${param}`;
    body = `
      <div class="wb-card">
        <h3>Phòng thực hành: ${escapeHtml(param)}</h3>
        <p><strong>Trạng thái WebRTC Provider:</strong> <span class="wb-badge wb-badge-warn">${escapeHtml(providerStatus.status)}</span></p>
        <p class="wb-muted">${escapeHtml(providerStatus.noteVi)}</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin:14px 0;">
          <button type="button" class="wb-btn wb-btn-outline wb-btn-sm" data-wb-device-check>Kiểm tra Micro & Camera</button>
          <a href="/learner-meet/sessions" class="wb-btn wb-btn-ghost wb-btn-sm">Rời phòng</a>
        </div>
        <div id="wb-device-status" class="wb-muted" style="font-size:0.9rem;"></div>
      </div>`;
  } else {
    body = `
      <div class="wb-grid-2">
        <div class="wb-card">
          <h3>Thực hành giao tiếp trực tiếp 1–1 & Nhóm</h3>
          <p>Hỗ trợ bật/tắt micro, bật/tắt camera, kiểm tra thiết bị và kết nối theo chủ đề cho Tiếng Trung, Tiếng Anh và Tiếng Nga.</p>
          <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:14px;">
            <a href="/learner-meet/sessions" class="wb-btn wb-btn-outline wb-btn-sm">Danh sách phiên</a>
            <a href="/learner-meet/create" class="wb-btn wb-btn-primary wb-btn-sm">Tạo phiên mới</a>
            <a href="/learner-meet/history" class="wb-btn wb-btn-ghost wb-btn-sm">Lịch sử tham gia</a>
          </div>
        </div>
        <div class="wb-card wb-card-warm">
          <h3>Các giới hạn tuyệt đối của Learner Meet</h3>
          <ul>
            <li>Không có chat văn bản, không nhắn tin cá nhân/nhóm, không gửi tệp, không bình luận.</li>
            <li>Không livestream công khai, không chia sẻ màn hình.</li>
            <li>Không có nút ghi âm/ghi hình, không lưu bản ghi, không Recording API.</li>
            <li>Chỉ lưu metadata vận hành tối thiểu (thời gian tham gia/rời, trạng thái phiên).</li>
          </ul>
        </div>
      </div>`;
  }

  const contentHtml = `
    <h1>${escapeHtml(title)}</h1>
    <div class="wb-alert wb-alert-warn">${escapeHtml(LEARNER_MEET_DISCLAIMER_VI)}</div>
    ${body}
  `;

  return htmlResponse(renderPublicPage({
    title,
    currentPath: subPath ? `/learner-meet/${subPath}${param ? `/${param}` : ''}` : '/learner-meet',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Learner Meet', href: '/learner-meet' }],
    user,
    contentHtml,
  }));
}
