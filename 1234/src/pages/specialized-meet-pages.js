/**
 * WORD BRIDGE — Specialized Languages (12 Real Industry Corpora — 12,104 Individual Words)
 * & Learner Meet Entry Page (redirecting to portal.wordbridge.io.vn/meet).
 * Strictly NO PDF/XLSX/EXE files served — 100% structured word-by-word data.
 */
import { renderPublicPage } from '../layouts/site-layout.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

export const SPECIALIZED_VOCAB_DOMAINS = [
  { slug: 'ke-toan-doanh-nghiep', nameVi: 'Kế toán Doanh nghiệp', count: 1000, topicsCount: 10, sample: 'account, balance sheet, general ledger, depreciation' },
  { slug: 'quan-tri-mang-may-tinh', nameVi: 'Quản trị Mạng Máy tính', count: 1000, topicsCount: 10, sample: 'application layer, firewall, subnet mask, routing protocol' },
  { slug: 'cong-nghe-o-to', nameVi: 'Công nghệ Ô tô', count: 1000, topicsCount: 7, sample: 'internal combustion engine, turbocharger, ABS, crankshaft' },
  { slug: 'ky-thuat-may-lanh-dhkk', nameVi: 'Kỹ thuật Máy lạnh & ĐHKK', count: 1000, topicsCount: 8, sample: 'refrigeration cycle, compressor, evaporator, condenser' },
  { slug: 'sua-chua-lap-rap-may-tinh', nameVi: 'Sửa chữa & Lắp ráp Máy tính', count: 1012, topicsCount: 21, sample: 'motherboard, BIOS, thermal paste, power supply unit' },
  { slug: 'thiet-ke-do-hoa', nameVi: 'Thiết kế Đồ họa', count: 1017, topicsCount: 15, sample: 'graphic design, typography, kerning, vector graphics' },
  { slug: 'dien-cong-nghiep', nameVi: 'Điện Công nghiệp', count: 1012, topicsCount: 17, sample: 'transformer, circuit breaker, three-phase motor, switchgear' },
  { slug: 'dien-tu-cong-nghiep', nameVi: 'Điện tử Công nghiệp', count: 1015, topicsCount: 19, sample: 'semiconductor, transistor, microcontroller, oscilloscope' },
  { slug: 'co-dien-tu', nameVi: 'Cơ Điện tử', count: 1023, topicsCount: 17, sample: 'mechatronics, actuator, servo motor, PLC automation' },
  { slug: 'cat-got-kim-loai', nameVi: 'Cắt gọt Kim loại', count: 1005, topicsCount: 17, sample: 'metal cutting, lathe, milling machine, CNC spindle' },
  { slug: 'nguoi-sua-chua-may-cong-cu', nameVi: 'Nguội Sửa chữa Máy công cụ', count: 1013, topicsCount: 17, sample: 'bench work, vernier caliper, tolerance, surface scraping' },
  { slug: 'bao-tri-thiet-bi-co-dien', nameVi: 'Bảo trì Thiết bị Cơ điện', count: 1007, topicsCount: 12, sample: 'preventive maintenance, vibration analysis, bearing alignment' },
];

export async function renderSpecializedPage({ user, subSlug = '', runtime = null }) {
  // Strictly block specialized Russian
  if (subSlug === 'russian' || subSlug === 'ru') {
    return htmlResponse(renderPublicPage({
      title: 'Không hỗ trợ chuyên ngành Tiếng Nga',
      currentPath: `/specialized/${subSlug}`,
      user,
      runtime,
      contentHtml: '<div class="wb-alert wb-alert-error">Kho Ngoại ngữ Chuyên ngành hiện chỉ áp dụng cho Tiếng Anh và Tiếng Trung. Mời bạn xem chương trình <a href="/learning/russian">Tiếng Nga</a>.</div>',
    }), 404);
  }

  // Detail view for any of the 12 specialized industries (word-by-word explorer!)
  const matched = SPECIALIZED_VOCAB_DOMAINS.find((d) => d.slug === subSlug);
  if (matched) {
    const contentHtml = `
      <section class="wb-hero">
        <span class="wb-badge wb-badge-aqua">KHO TỪ VỰNG CHUYÊN NGÀNH · ${matched.count.toLocaleString('vi-VN')} TỪ</span>
        <h1>${escapeHtml(matched.nameVi)}</h1>
        <p>Tra cứu từng từ vựng kèm loại từ, phiên âm IPA, nghĩa tiếng Việt sát ngữ cảnh nghề nghiệp và phân theo ${matched.topicsCount} nhóm chủ đề kỹ thuật.</p>
        <div style="display:flex;gap:10px;flex-wrap:wrap;">
          <a href="/specialized" class="wb-btn wb-btn-ghost wb-btn-sm">← Tất cả chuyên ngành</a>
          <a href="/vocabulary/flashcards" class="wb-btn wb-btn-accent wb-btn-sm">Luyện Flashcard</a>
        </div>
      </section>

      <div id="wb-vocab-explorer" data-domain-slug="${escapeHtml(matched.slug)}" class="wb-card">
        <div style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:14px;">
          <input id="wb-vocab-search" class="wb-input" style="flex:1;min-width:220px;" placeholder="Tìm từ tiếng Anh, phiên âm IPA hoặc nghĩa tiếng Việt..." />
          <select id="wb-vocab-topic" class="wb-select" style="max-width:320px;">
            <option value="">Đang tải nhóm chủ đề...</option>
          </select>
        </div>
        <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
          <div id="wb-vocab-stats" class="wb-muted">Đang tải toàn bộ ${matched.count.toLocaleString('vi-VN')} từ vựng...</div>
          <div id="wb-vocab-pager" style="display:flex;gap:8px;align-items:center;flex-wrap:wrap;"></div>
        </div>
        <div class="wb-table-wrap">
          <table class="wb-table">
            <thead>
              <tr>
                <th style="width:64px;">STT</th>
                <th>Thuật ngữ</th>
                <th>Phiên âm IPA</th>
                <th>Nghĩa tiếng Việt</th>
                <th>Nhóm chủ đề</th>
                <th style="width:120px;">Thao tác</th>
              </tr>
            </thead>
            <tbody id="wb-vocab-list">
              <tr><td colspan="6" style="text-align:center;padding:24px;">Đang tải danh sách từng từ vựng...</td></tr>
            </tbody>
          </table>
        </div>
      </div>
      <script src="/scripts/vocab-explorer.js" defer></script>
    `;

    return htmlResponse(renderPublicPage({
      title: `Từ vựng ${matched.nameVi}`,
      currentPath: `/specialized/${matched.slug}`,
      breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Ngoại ngữ Chuyên ngành', href: '/specialized' }, { label: matched.nameVi }],
      user,
      runtime,
      contentHtml,
    }));
  }

  // Overview hub of all 12 Specialized Domains (12,104 total words)
  const totalWords = SPECIALIZED_VOCAB_DOMAINS.reduce((s, d) => s + d.count, 0);
  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">KHO TỪ VỰNG CHUYÊN NGÀNH · ${totalWords.toLocaleString('vi-VN')} TỪ</span>
      <h1>Ngoại Ngữ Chuyên Ngành Ứng Dụng</h1>
      <p>Hệ thống ${totalWords.toLocaleString('vi-VN')} thuật ngữ chuyên ngành được biên soạn theo từng từ riêng biệt, đầy đủ loại từ, phiên âm IPA, nghĩa tiếng Việt sát thực tế công việc và phân loại theo nhóm chủ đề.</p>
    </section>

    <div class="wb-grid-3">
      ${SPECIALIZED_VOCAB_DOMAINS.map((d) => `
        <article class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;border-top:4px solid var(--wb-teal);">
          <div>
            <div style="display:flex;justify-content:space-between;gap:8px;margin-bottom:8px;">
              <span class="wb-badge">${d.count.toLocaleString('vi-VN')} từ</span>
              <span class="wb-badge wb-badge-aqua">${d.topicsCount} chủ đề</span>
            </div>
            <h3 style="margin:0 0 8px;color:var(--wb-teal);">${escapeHtml(d.nameVi)}</h3>
            <p class="wb-muted" style="font-size:0.84rem;margin:0 0 14px;">Ví dụ: ${escapeHtml(d.sample)}...</p>
          </div>
          <a href="/specialized/${escapeHtml(d.slug)}" class="wb-btn wb-btn-primary wb-btn-sm">Mở toàn bộ ${d.count.toLocaleString('vi-VN')} từ →</a>
        </article>`).join('')}
    </div>
  `;

  return htmlResponse(renderPublicPage({
    title: 'Ngoại ngữ Chuyên ngành',
    currentPath: '/specialized',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Ngoại ngữ Chuyên ngành' }],
    user,
    runtime,
    contentHtml,
  }));
}

export async function renderLearnerMeetPage({ user, runtime = null }) {
  return htmlResponse(renderPublicPage({
    title: 'Learner Meet',
    currentPath: '/learner-meet',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Learner Meet' }],
    user,
    runtime,
    contentHtml: `
      <section class="wb-hero">
        <span class="wb-badge wb-badge-aqua">LEARNER MEET</span>
        <h1>Thực Hành Giao Tiếp Trực Tuyến</h1>
        <p>Kết nối trực tiếp cùng cộng đồng người học WORD BRIDGE qua phòng luyện nói âm thanh và hình ảnh ngay trong Cổng Thành Viên.</p>
        <a href="https://portal.wordbridge.io.vn/meet" class="wb-btn wb-hero-btn-white">Mở phòng Learner Meet →</a>
      </section>`,
  }));
}
