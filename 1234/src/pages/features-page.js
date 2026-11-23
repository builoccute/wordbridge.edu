/**
 * WORD BRIDGE — Hệ sinh thái Công cụ Học tập Chuyên ngành
 * Clean, professional copy with zero awkward numbering or internal jargon.
 */
import { renderPublicPage } from '../layouts/site-layout.js';
import { htmlResponse } from '../utils/http.js';
import { escapeHtml } from '../utils/validation.js';

const FALSE_FRIENDS_SAMPLES = [
  { term: 'Demurrage (EN · Logistics)', common: 'Thường bị nhầm là hư hỏng hàng hóa (Damage)', specialized: 'Phí lưu bãi container quá thời hạn miễn phí tại cảng.' },
  { term: 'Execution (EN · Hợp đồng)', common: 'Nghĩa phổ thông: thi hành / xử lý', specialized: 'Ký kết chính thức và đưa hợp đồng vào hiệu lực pháp lý.' },
  { term: '信用证 xìnyòngzhèng (ZH · Xuất nhập khẩu)', common: 'Dễ hiểu nhầm là "giấy chứng nhận uy tín"', specialized: 'Thư tín dụng ngân hàng (Letter of Credit — L/C).' },
  { term: '公差 gōngchā (ZH · Cơ khí)', common: 'Nghĩa phổ thông: đi công tác', specialized: 'Dung sai kỹ thuật (Tolerance) trên bản vẽ cơ khí.' },
];

const CORE_CAPABILITIES = [
  ['Lộ trình học chuyên ngành 36 tuần', 'Theo dõi tiến độ từng học phần, đánh dấu hoàn thành bài học và lưu ghi chú cá nhân.', '/learning'],
  ['Từ điển & Bẫy nghĩa Chuyên ngành', 'Tra cứu Pinyin, IPA, đối chiếu thuật ngữ 10 lĩnh vực và lưu vào sổ từ cá nhân.', '/dictionary'],
  ['Flashcard tương tác & Ôn tập SM-2', 'Lật thẻ ghi nhớ hai mặt, phân loại bộ từ vựng và tự động lên lịch ôn ngắt quãng.', '/vocabulary/flashcards'],
  ['Âm thanh & Tự luyện phát âm', 'Điều chỉnh tốc độ 0.75x–1.5x, nghe từng câu và tự thu âm giọng đọc đối chiếu.', '/practice/speaking'],
  ['Cổng Luyện Tập 6 kỹ năng', 'Bài tập Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp có chấm đáp án & bộ đếm từ.', '/practice'],
  ['Learner Meet trực tuyến', 'Phòng thực hành hội thoại âm thanh và hình ảnh tập trung, không gây xao nhãng.', '/learner-meet'],
  ['15 Công cụ Phân tích Ngôn ngữ', 'Phân tích cấu trúc câu, sắc thái, văn phong học thuật và lưu lịch sử tra cứu.', '/intelligence'],
  ['Thư viện Đọc tài liệu trực tuyến', 'Đọc giáo trình, hội thoại mẫu và tài liệu chuyên ngành kèm ghi chú từ vựng trực tiếp tại /reader.', '/reader'],
];

export function renderFeaturesPage({ user, runtime }) {
  const html = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">CÔNG CỤ HỌC TẬP CHUYÊN NGÀNH</span>
      <h1>Hệ Sinh Thái Học Ngoại Ngữ Chuyên Ngành Toàn Diện</h1>
      <p>Kết hợp phương pháp ghi nhớ khoa học SM-2 với chiều sâu thuật ngữ nghề nghiệp Trung – Anh (12 nhóm ngành) và hệ thống 7 kỹ năng chuẩn mực.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="/specialized" class="wb-btn wb-btn-accent">Khám phá 10 Chuyên ngành</a>
        <a href="/practice" class="wb-btn wb-btn-ghost">Vào Cổng Luyện Tập</a>
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Cảnh báo "Bẫy nghĩa Chuyên ngành" (False Friends)</h2>
      <div class="wb-grid-2">
        ${FALSE_FRIENDS_SAMPLES.map((f) => `
          <article class="wb-card" style="margin:0;border-left:4px solid var(--wb-red);">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">${escapeHtml(f.term)}</h3>
            <p class="wb-muted" style="margin:0 0 6px;"><strong>Dễ nhầm (đời thường):</strong> ${escapeHtml(f.common)}</p>
            <p style="margin:0;"><strong>Nghĩa chuyên ngành chuẩn:</strong> ${escapeHtml(f.specialized)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Các phân hệ học tập & thực hành</h2>
      <div class="wb-grid-2">
        ${CORE_CAPABILITIES.map(([title, desc, href]) => `
          <article class="wb-card" style="margin:0;">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">${escapeHtml(title)}</h3>
            <p class="wb-muted" style="margin:0 0 12px;">${escapeHtml(desc)}</p>
            <a href="${escapeHtml(href)}" class="wb-btn wb-btn-outline wb-btn-sm">Truy cập</a>
          </article>`).join('')}
      </div>
    </section>
  `;

  return htmlResponse(renderPublicPage({
    title: 'Công cụ Học tập Chuyên ngành',
    currentPath: '/features',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Công cụ học tập' }],
    user,
    runtime,
    contentHtml: html,
  }));
}
