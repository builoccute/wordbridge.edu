/**
 * WORD BRIDGE — 15 Language Intelligence Systems Pages (Section 8.8 & Part XI)
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { INTELLIGENCE_SYSTEMS } from '../config/constants.js';
import { SYSTEM_SPEC_MAP } from '../modules/intelligence/intelligence-service.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

export function renderIntelligenceHub({ user }) {
  const cards = INTELLIGENCE_SYSTEMS.map((sys) => `
    <article class="wb-card">
      <span class="wb-badge">${escapeHtml(sys.code)} · ${sys.languages.join('/').toUpperCase()}</span>
      <h3 style="margin-top:8px;"><a href="/intelligence/${escapeHtml(sys.slug)}">${escapeHtml(sys.nameVi)}</a></h3>
      <p class="wb-muted" style="font-size:0.9rem;">${escapeHtml(sys.descriptionVi)}</p>
      <a href="/intelligence/${escapeHtml(sys.slug)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở hệ thống</a>
    </article>
  `).join('');

  const contentHtml = `
    <h1>15 Hệ thống Trí tuệ Ngôn ngữ WORD BRIDGE</h1>
    <p class="wb-muted">Mỗi hệ thống có trang riêng, URL riêng, API xử lý D1 riêng, giải thích phương pháp, mức độ tin cậy và giới hạn kỹ thuật minh bạch.</p>
    <div class="wb-grid-3">${cards}</div>
  `;
  return htmlResponse(renderPublicPage({
    title: '15 Hệ thống Trí tuệ Ngôn ngữ',
    currentPath: '/intelligence',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: '15 Hệ thống Trí tuệ Ngôn ngữ' }],
    user,
    contentHtml,
  }));
}

export async function renderIntelligenceSystemPage({ services, user, systemSlug }) {
  const spec = SYSTEM_SPEC_MAP.get(systemSlug);
  if (!spec) {
    return htmlResponse(renderPublicPage({
      title: 'Không tìm thấy hệ thống trí tuệ',
      currentPath: `/intelligence/${systemSlug}`,
      user,
      contentHtml: '<div class="wb-alert wb-alert-error">Hệ thống trí tuệ ngôn ngữ không tồn tại.</div>',
    }), 404);
  }

  const history = user ? await services.intelligence.listHistory(user.accountId, systemSlug, 10) : [];
  const langOptions = spec.languages.map((code) => {
    const label = code === 'zh' ? 'Tiếng Trung (zh)' : code === 'en' ? 'Tiếng Anh (en)' : 'Tiếng Nga (ru)';
    return `<option value="${code}">${label}</option>`;
  }).join('');

  const runnerHtml = user
    ? `
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/intelligence/${escapeHtml(spec.slug)}/run" data-render-json="intel-result-box">
        <h3>Chạy phân tích ${escapeHtml(spec.nameVi)}</h3>
        <div class="wb-field">
          <label>Ngôn ngữ phân tích</label>
          <select class="wb-select" name="languageCode">${langOptions}</select>
        </div>
        <div class="wb-field">
          <label>Văn bản / Ngữ liệu đầu vào (tùy chọn tùy hệ thống)</label>
          <textarea class="wb-textarea" name="inputText" rows="4" placeholder="Nhập câu, đoạn văn hoặc ngữ cảnh cần phân tích..."></textarea>
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Chạy phân tích & Lưu lịch sử D1</button>
      </form>
      <pre id="intel-result-box" class="wb-card" style="font-size:0.82rem;overflow:auto;margin-top:16px;">Kết quả phân tích JSON sẽ hiển thị tại đây sau khi chạy.</pre>
    `
    : `<div class="wb-alert wb-alert-info">Khách chưa đăng nhập được xem mô tả phương pháp và cấu trúc hệ thống. Vui lòng <a href="/login">đăng nhập</a> để chạy phân tích cá nhân và lưu lịch sử.</div>`;

  const contentHtml = `
    <span class="wb-badge">${escapeHtml(spec.code)} · Phạm vi: ${spec.languages.join(', ').toUpperCase()}</span>
    <h1>${escapeHtml(spec.nameVi)}</h1>
    <p class="wb-muted">${escapeHtml(spec.descriptionVi)}</p>
    <div class="wb-card wb-card-warm" style="margin-bottom:18px;">
      <strong>Minh bạch phương pháp & Giới hạn kỹ thuật:</strong>
      <p style="margin:6px 0 0;font-size:0.9rem;">Hệ thống sử dụng dữ liệu học tập thực tế từ Cloudflare D1 kết hợp các quy tắc ngôn ngữ học xác định (deterministic/rule-based). Không giả lập thuật toán AI khi chưa tích hợp nhà cung cấp AI đã phê duyệt.</p>
    </div>
    ${runnerHtml}
    ${history.length ? `<h2 style="margin-top:24px;">Lịch sử phân tích gần đây</h2><div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Thời gian</th><th>Ngôn ngữ</th><th>Độ tin cậy</th><th>Trạng thái</th></tr></thead><tbody>${history.map((h) => `<tr><td>${escapeHtml(h.created_at)}</td><td>${escapeHtml(h.language_code.toUpperCase())}</td><td>${escapeHtml(h.confidence_level)}</td><td>${escapeHtml(h.status)}</td></tr>`).join('')}</tbody></table></div>` : ''}
  `;

  return htmlResponse(renderPublicPage({
    title: spec.nameVi,
    currentPath: `/intelligence/${spec.slug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: '15 Hệ thống Trí tuệ', href: '/intelligence' }, { label: spec.nameVi }],
    user,
    contentHtml,
  }));
}
