/**
 * WORD BRIDGE — Public Core Pages (/, /about, /help, /faq, /contact, /policies/*)
 * Section 9 Compliance:
 * Homepage is STRICTLY concise, lightweight, high-whitespace, and navigational —
 * introducing WORD BRIDGE and directing users to dedicated URLs.
 * NEVER dumps full curriculum, dictionary, practice, exams, registration form, or admin onto `/`.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { OFFICIAL_LANGUAGES } from '../config/constants.js';
import { htmlResponse } from '../utils/http.js';

export function renderHomePage({ user }) {
  const langsHtml = Object.values(OFFICIAL_LANGUAGES).map((l) => `
    <article class="wb-card">
      <span class="wb-badge">${l.code.toUpperCase()}</span>
      ${l.hasSpecialized ? '<span class="wb-badge wb-badge-ok" style="margin-left:6px;">Có chuyên ngành</span>' : '<span class="wb-badge wb-badge-warn" style="margin-left:6px;">Chỉ học tổng quát</span>'}
      <h3 style="margin-top:10px;">${l.nameVi} (${l.nativeName})</h3>
      <p class="wb-muted" style="font-size:0.9rem;">${l.framework}</p>
      <p style="font-size:0.88rem;">${l.phoneticSystem}</p>
      <a href="/learning/${l.slug}" class="wb-btn wb-btn-outline wb-btn-sm">Xem chương trình ${l.nameVi}</a>
    </article>
  `).join('');

  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge">Nền tảng học thuật ngoại ngữ Trung – Anh – Nga</span>
      <h1>WORD BRIDGE — Where Languages Bring People Together.</h1>
      <p class="wb-muted" style="max-width:740px;font-size:1.05rem;">
        Nền tảng học tập, tra cứu từ điển, luyện tập bốn kỹ năng, khảo thí tham chiếu và thực hành trực tiếp có cấu trúc rõ ràng dành cho người học Việt Nam và quốc tế.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-top:20px;">
        <a href="/learning" class="wb-btn wb-btn-primary">Khám phá chương trình</a>
        <a href="/dictionary" class="wb-btn wb-btn-outline">Mở từ điển</a>
        ${user ? '<a href="/my-learning" class="wb-btn wb-btn-ghost">Vào lộ trình cá nhân</a>' : '<a href="/register" class="wb-btn wb-btn-accent">Đăng ký tài khoản cá nhân</a>'}
      </div>
    </section>

    <section class="wb-section">
      <div class="wb-section-head">
        <div>
          <h2>Ba hệ thống ngôn ngữ chính thức</h2>
          <p class="wb-muted" style="margin:4px 0 0;">Tập trung chuyên sâu vào Tiếng Trung, Tiếng Anh và Tiếng Nga với khung trình độ chuẩn hóa.</p>
        </div>
        <a href="/learning" class="wb-btn wb-btn-outline wb-btn-sm">Tất cả chương trình →</a>
      </div>
      <div class="wb-grid-3">${langsHtml}</div>
    </section>

    <section class="wb-section">
      <div class="wb-section-head">
        <h2>Các phân hệ chuyên biệt của WORD BRIDGE</h2>
      </div>
      <div class="wb-grid">
        <article class="wb-card">
          <h3>Ngoại ngữ chuyên ngành</h3>
          <p class="wb-muted">Chương trình chuyên sâu cho Logistics, Xuất nhập khẩu, CNTT & Cloud, Cơ khí, Điện – Điện tử, Ô tô, Đồ họa và Y dược (chỉ áp dụng Tiếng Trung & Tiếng Anh).</p>
          <a href="/specialized" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá chuyên ngành</a>
        </article>
        <article class="wb-card">
          <h3>Từ điển & Sổ từ vựng</h3>
          <p class="wb-muted">Tra cứu đa điều kiện theo ký tự, phiên âm, nghĩa Việt, chủ đề, ngành nghề kết hợp flashcard ôn tập ngắt quãng SM-2.</p>
          <a href="/dictionary" class="wb-btn wb-btn-outline wb-btn-sm">Mở từ điển</a>
        </article>
        <article class="wb-card">
          <h3>Luyện tập bốn kỹ năng</h3>
          <p class="wb-muted">Thực hành Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp với bộ điều khiển audio đa tốc độ và tiêu chí chấm minh bạch.</p>
          <a href="/practice" class="wb-btn wb-btn-outline wb-btn-sm">Luyện tập ngay</a>
        </article>
        <article class="wb-card">
          <h3>Trung tâm khảo thí</h3>
          <p class="wb-muted">Đánh giá năng lực tham chiếu HSK, CEFR và TORFL/ТРКИ có lưu nháp tự động và giải thích chi tiết (không cấp chứng chỉ).</p>
          <a href="/examinations" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá khảo thí</a>
        </article>
        <article class="wb-card">
          <h3>Learner Meet</h3>
          <p class="wb-muted">Phòng thực hành giao tiếp trực tiếp qua âm thanh & video (1–1 hoặc nhóm). Không chat văn bản, không chia sẻ màn hình, không ghi hình từ nền tảng.</p>
          <a href="/learner-meet" class="wb-btn wb-btn-outline wb-btn-sm">Khám phá Learner Meet</a>
        </article>
        <article class="wb-card wb-card-warm">
          <h3>15 Hệ thống Trí tuệ Ngôn ngữ</h3>
          <p class="wb-muted">Bộ công cụ phân tích chuyên sâu từ Language DNA, Transfer Lab, Error Genome đến Personal Language Observatory.</p>
          <a href="/intelligence" class="wb-btn wb-btn-primary wb-btn-sm">Xem 15 hệ thống</a>
        </article>
      </div>
    </section>

    <section class="wb-section wb-card wb-card-warm" style="display:flex;justify-content:space-between;align-items:center;gap:20px;flex-wrap:wrap;">
      <div>
        <h2 style="margin:0 0 6px;color:#146466;">Sẵn sàng bắt đầu lộ trình học ngoại ngữ bài bản?</h2>
        <p class="wb-muted" style="margin:0;">Xem trước nội dung công khai hoàn toàn tự do — đăng nhập tài khoản cá nhân để lưu tiến độ, sổ từ vựng và tham gia khảo thí. Sinh viên có email trường cấp được miễn phí 03 tháng PERSONAL PLUS (duy nhất 01 lần).</p>
      </div>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="/register" class="wb-btn wb-btn-primary">Đăng ký ngay</a>
        <a href="/login" class="wb-btn wb-btn-outline">Đăng nhập</a>
      </div>
    </section>
  `;

  return htmlResponse(renderPublicPage({
    title: 'Trang chủ',
    description: 'WORD BRIDGE — Where Languages Bring People Together. Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga.',
    currentPath: '/',
    user,
    contentHtml,
  }));
}

export function renderAboutPage({ user }) {
  const contentHtml = `
    <h1>Giới thiệu WORD BRIDGE</h1>
    <p class="wb-muted"><strong>Where Languages Bring People Together.</strong></p>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Sứ mệnh học thuật</h3>
        <p>WORD BRIDGE được xây dựng như một nền tảng học tập, tra cứu, luyện tập và đánh giá năng lực ngoại ngữ có cấu trúc chặt chẽ cho ba ngôn ngữ: Tiếng Trung (zh), Tiếng Anh (en) và Tiếng Nga (ru).</p>
        <p>Mỗi chương trình đều tuân thủ phân cấp đầy đủ: Ngôn ngữ → Chương trình → Trình độ → Giáo trình → Học phần → Tuần (20 thành phần) → Buổi học → Bài học → Bài tập → Đánh giá → Tiến độ.</p>
      </div>
      <div class="wb-card">
        <h3>Ranh giới sản phẩm minh bạch</h3>
        <ul>
          <li>Chỉ hỗ trợ 3 ngôn ngữ chính thức (Trung, Anh, Nga); chuyên ngành chỉ áp dụng cho Tiếng Trung và Tiếng Anh.</li>
          <li>Không phải mạng xã hội, không nhắn tin tự do, không chat trong Learner Meet.</li>
          <li>Không cấp chứng chỉ dưới mọi hình thức; kết quả khảo thí chỉ mang tính tham chiếu học thuật.</li>
          <li>Chỉ có tài khoản cá nhân (PERSONAL FREE / PERSONAL PLUS); quyền quản trị cấp qua RBAC.</li>
        </ul>
      </div>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Giới thiệu',
    description: 'Thông tin về sứ mệnh, phạm vi ngôn ngữ và triết lý thiết kế học thuật của WORD BRIDGE.',
    currentPath: '/about',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Giới thiệu' }],
    user,
    contentHtml,
  }));
}

export function renderHelpPage({ user }) {
  const contentHtml = `
    <h1>Trung tâm trợ giúp</h1>
    <p class="wb-muted">Hướng dẫn sử dụng các phân hệ học tập, tài khoản cá nhân, quyền lợi sinh viên và gửi yêu cầu hỗ trợ tới CSKH (cskh@wordbridge.vn).</p>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Gửi yêu cầu Chăm sóc khách hàng</h3>
        <form class="wb-form" data-api-endpoint="/api/v1/support/tickets">
          <input type="hidden" name="requestType" value="support" />
          <div class="wb-field"><label>Họ và tên</label><input class="wb-input" name="senderName" required /></div>
          <div class="wb-field"><label>Email nhận phản hồi</label><input class="wb-input" type="email" name="senderEmail" required /></div>
          <div class="wb-field"><label>Tiêu đề hỗ trợ</label><input class="wb-input" name="subject" required /></div>
          <div class="wb-field"><label>Nội dung chi tiết</label><textarea class="wb-textarea" name="messageBody" rows="4" required></textarea></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu tới cskh@wordbridge.vn</button>
        </form>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Các chủ đề trợ giúp nhanh</h3>
        <ul>
          <li><a href="/faq">Câu hỏi thường gặp (FAQ)</a></li>
          <li><a href="/account/student-benefit">Chính sách sinh viên 03 tháng PERSONAL PLUS (chỉ qua email trường cấp)</a></li>
          <li><a href="/account/security">Bảo mật tài khoản, Passkey và quản lý phiên</a></li>
          <li><a href="/contact">Liên hệ hợp tác qua contact@wordbridge.vn</a></li>
        </ul>
      </div>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Trung tâm trợ giúp',
    currentPath: '/help',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Trợ giúp' }],
    user,
    contentHtml,
  }));
}

export function renderFaqPage({ user }) {
  const faqs = [
    ['WORD BRIDGE hỗ trợ những ngôn ngữ nào?', 'Nền tảng hỗ trợ chính thức 3 ngôn ngữ: Tiếng Trung (zh), Tiếng Anh (en) và Tiếng Nga (ru). Chương trình chuyên ngành chỉ áp dụng cho Tiếng Trung và Tiếng Anh.'],
    ['Khách chưa đăng nhập có xem được nội dung không?', 'Có. Bạn có thể xem trang chủ, giới thiệu, cấu trúc chương trình, bài học công khai và từ điển công bố. Để bắt đầu học, lưu tiến độ, lưu từ vựng, nộp bài hoặc chạy phân tích cá nhân, bạn cần đăng nhập.'],
    ['WORD BRIDGE có cấp chứng chỉ không?', 'Không. Trung tâm khảo thí chỉ cung cấp bài kiểm tra đánh giá năng lực tham chiếu HSK, CEFR và TORFL/ТРКИ. WORD BRIDGE không cấp bất kỳ loại chứng chỉ nào.'],
    ['Chính sách sinh viên xác minh bằng cách nào?', 'Duy nhất qua email sinh viên do trường cấp để nhận 03 tháng PERSONAL PLUS miễn phí (chỉ một lần duy nhất). Không chấp nhận ảnh thẻ sinh viên hay giấy tờ thay thế.'],
    ['Learner Meet có chat văn bản hoặc ghi hình không?', 'Không. Learner Meet chỉ hỗ trợ thực hành âm thanh và video; không có chat văn bản, không gửi tệp, không chia sẻ màn hình và nền tảng không ghi âm/ghi hình.'],
  ];
  const contentHtml = `
    <h1>Câu hỏi thường gặp (FAQ)</h1>
    <div style="display:grid;gap:14px;">
      ${faqs.map(([q, a]) => `<article class="wb-card"><h3>${q}</h3><p style="margin:0;">${a}</p></article>`).join('')}
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'FAQ',
    currentPath: '/faq',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'FAQ' }],
    user,
    contentHtml,
  }));
}

export function renderContactPage({ user }) {
  const contentHtml = `
    <h1>Liên hệ & Hợp tác</h1>
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Gửi thông tin tới contact@wordbridge.vn</h3>
        <form class="wb-form" data-api-endpoint="/api/v1/support/tickets">
          <input type="hidden" name="requestType" value="contact_partnership" />
          <div class="wb-field"><label>Họ và tên / Đại diện</label><input class="wb-input" name="senderName" required /></div>
          <div class="wb-field"><label>Email liên hệ</label><input class="wb-input" type="email" name="senderEmail" required /></div>
          <div class="wb-field"><label>Chủ đề hợp tác / Liên hệ</label><input class="wb-input" name="subject" required /></div>
          <div class="wb-field"><label>Nội dung chi tiết</label><textarea class="wb-textarea" name="messageBody" rows="4" required></textarea></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary">Gửi liên hệ</button>
        </form>
      </div>
      <div class="wb-card wb-card-warm">
        <h3>Ba kênh email chính thức của WORD BRIDGE</h3>
        <ul>
          <li><strong>noreply@wordbridge.vn</strong>: Email hệ thống tự động (Reply-To: cskh@wordbridge.vn).</li>
          <li><strong>cskh@wordbridge.vn</strong>: Chăm sóc khách hàng và hỗ trợ người học.</li>
          <li><strong>contact@wordbridge.vn</strong>: Liên hệ chuyên môn và đề xuất hợp tác.</li>
        </ul>
      </div>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Liên hệ',
    currentPath: '/contact',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Liên hệ' }],
    user,
    contentHtml,
  }));
}

export function renderPolicyPage({ user, policySlug }) {
  const policies = {
    terms: { title: 'Điều khoản sử dụng', body: 'Bản dự thảo khung điều khoản sử dụng WORD BRIDGE (Nhóm C — chờ rà soát pháp lý chính thức). Quy định quyền truy cập công khai, tài khoản cá nhân và phạm vi khảo thí không cấp chứng chỉ.' },
    privacy: { title: 'Chính sách quyền riêng tư', body: 'WORD BRIDGE chỉ thu thập dữ liệu cần thiết để cung cấp dịch vụ học tập. Không thu thập sinh trắc học Passkey, không ghi hình Learner Meet và không sử dụng nội dung phiên thực hành để quảng cáo hay huấn luyện AI.' },
    'data-protection': { title: 'Chính sách bảo vệ dữ liệu', body: 'Mật khẩu được băm bằng PBKDF2-SHA256, token lưu dạng băm SHA-256, dữ liệu lưu có kiểm soát trên Cloudflare D1 (`word`) và R2 (`word`) với tách biệt công khai/riêng tư.' },
    'platform-usage': { title: 'Chính sách sử dụng nền tảng', body: 'WORD BRIDGE là môi trường học thuật ngoại ngữ Trung – Anh – Nga. Nghiêm cấm lạm dụng hệ thống, tự ý ghi hình trái phép người học khác hoặc sao chép học liệu có bản quyền.' },
  };
  const p = policies[policySlug] || policies.terms;
  return htmlResponse(renderPublicPage({
    title: p.title,
    currentPath: `/policies/${policySlug}`,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Chính sách' }, { label: p.title }],
    user,
    contentHtml: `<h1>${p.title}</h1><div class="wb-card"><p>${p.body}</p><div class="wb-alert wb-alert-warn">Trạng thái: Bản khung chuẩn bị (Nhóm C) — cần phê duyệt pháp lý chính thức trước khi công bố cuối cùng.</div></div>`,
  }));
}
