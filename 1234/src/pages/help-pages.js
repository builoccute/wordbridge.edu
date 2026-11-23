/**
 * WORD BRIDGE V4.2 — Integrated Help Center (/help)
 * Matches UI Reference #21 (efb5b4a1).
 * Zero admin paths exposed; strictly bilingual Chinese & English scope;
 * real support ticket submission & status tracking backed by D1.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

const HELP_GUIDES = [
  {
    id: 'getting-started',
    title: '1. Hướng dẫn sử dụng WORD BRIDGE',
    summary: 'Tìm hiểu tổng quan về nền tảng học tập Tiếng Trung và Tiếng Anh, các tính năng chính và cách bắt đầu hiệu quả.',
    steps: [
      'Đăng ký tài khoản cá nhân tại /register và xác minh email qua liên kết một lần.',
      'Chọn ngôn ngữ học tập tại /learning (Tiếng Trung hoặc Tiếng Anh) và xem lộ trình tại /learning/path.',
      'Lưu từ vựng mới vào Sổ từ vựng (/vocabulary/notebook) và ôn tập ngắt quãng SM-2 tại /vocabulary/flashcards.',
    ],
  },
  {
    id: 'account',
    title: '2. Hướng dẫn tài khoản và bảo mật',
    summary: 'Cách đăng ký, đăng nhập bằng Email/Mật khẩu, xác minh email, đổi mật khẩu, khôi phục tài khoản và quản lý Passkey.',
    steps: [
      'Đăng nhập tại /login, quên mật khẩu tại /forgot-password và đặt lại mật khẩu tại /reset-password.',
      'Cập nhật thông tin cá nhân, đổi mật khẩu và quản lý phiên đăng nhập tại /profile hoặc /account.',
      'Kiểm tra và thu hồi các phiên đăng nhập cũ tại /account/sessions để bảo vệ tài khoản.',
    ],
  },
  {
    id: 'learning',
    title: '3. Hướng dẫn học tập & lộ trình',
    summary: 'Cách tìm và tham gia bài học, giáo trình theo tuần, chuyên ngành và kiểm tra mức độ hiểu bài.',
    steps: [
      'Truy cập /learning để chọn chương trình nền tảng hoặc chuyên ngành cho Tiếng Trung và Tiếng Anh.',
      'Ghi chú trực tiếp trong từng bài học và hoàn thành phần kiểm tra kiến thức để lưu tiến độ học tập.',
      'Theo dõi lịch sử học tập và các điểm cần ôn lại tại /my-learning, /my-knowledge và /my-mistakes.',
    ],
  },
  {
    id: 'practice',
    title: '4. Hướng dẫn luyện tập & kỹ năng',
    summary: 'Sử dụng Trung tâm Kỹ năng (7 hệ thống) và Cổng Luyện Tập cho Nghe, Nói, Đọc, Viết, Phát âm, Từ vựng và Ngữ pháp.',
    steps: [
      'Chọn kỹ năng muốn luyện tập tại /learning/skills hoặc /practice.',
      'Hoàn thành bài tập và nộp bài để hệ thống ghi nhận kết quả và gợi ý nội dung cần củng cố.',
      'Xem lịch sử luyện tập và tiến độ tại /practice/history.',
    ],
  },
  {
    id: 'tools',
    title: '5. Hướng dẫn sử dụng công cụ',
    summary: 'Từ điển Trung – Anh, Ngoại ngữ chuyên ngành (12 bộ dữ liệu), Thư viện đọc (/reader) và Trí tuệ Ngôn ngữ.',
    steps: [
      'Tra cứu Từ điển (/dictionary) và thuật ngữ chuyên ngành (/specialized), lưu nhanh vào Flashcards.',
      'Đọc tài liệu mẫu và chuyên ngành trực tiếp tại /reader, lưu tiến độ đọc và ghi chú cá nhân.',
      'Khám phá các công cụ phân tích năng lực học tập tại /intelligence.',
    ],
  },
];

const HELP_FAQS = [
  ['WORD BRIDGE hỗ trợ những ngôn ngữ nào?', 'WORD BRIDGE hiện hỗ trợ chính thức hai ngôn ngữ: Tiếng Trung (中文) và Tiếng Anh (English), bao gồm cả chương trình nền tảng và chuyên ngành.'],
  ['Tại sao tôi không thấy nút đăng nhập bằng mạng xã hội?', 'WORD BRIDGE sử dụng tài khoản cá nhân bằng Email/Mật khẩu và khóa bảo mật Passkey WebAuthn để đảm bảo tính bảo mật và ổn định cho người học.'],
  ['Dữ liệu học tập của tôi có được bảo mật không?', 'Có. Toàn bộ dữ liệu cá nhân, sổ từ vựng, tiến độ học tập và ghi chú đọc hiểu đều được bảo vệ theo chính sách quyền riêng tư của WORD BRIDGE.'],
  ['Tôi có thể theo dõi tiến độ xử lý yêu cầu hỗ trợ ở đâu?', 'Bạn có thể gửi yêu cầu trực tiếp tại Trung Tâm Trợ Giúp này và theo dõi trạng thái xử lý cùng phản hồi từ bộ phận Hỗ trợ WORD BRIDGE ngay trong tài khoản của mình.'],
];

const STATUS_LABELS = {
  open: 'Đã tiếp nhận',
  in_progress: 'Đang xử lý',
  resolved: 'Đã giải quyết',
  closed: 'Đã đóng',
};

export async function renderHelpCenterPage({ services, user, runtime = null }) {
  const userTickets = user ? await services.admin.listUserSupportTickets(user.accountId) : [];

  const ticketFormHtml = user
    ? `
      <form class="wb-form" data-api-endpoint="/api/v1/support/tickets" data-reload-on-success="true">
        <input type="hidden" name="requestType" value="support" />
        <div class="wb-grid-2">
          <div class="wb-field"><label>Họ và tên *</label><input class="wb-input" name="senderName" value="${escapeHtml(user.fullName || '')}" required /></div>
          <div class="wb-field"><label>Email liên hệ *</label><input class="wb-input" type="email" name="senderEmail" value="${escapeHtml(user.email || '')}" required /></div>
        </div>
        <div class="wb-field"><label>Tiêu đề yêu cầu *</label><input class="wb-input" name="subject" placeholder="Ví dụ: Hỗ trợ xác minh tài khoản hoặc câu hỏi về bài học" required /></div>
        <div class="wb-field"><label>Nội dung chi tiết (tối thiểu 10 ký tự) *</label><textarea class="wb-input" name="messageBody" rows="4" required placeholder="Mô tả rõ vấn đề bạn cần hỗ trợ..."></textarea></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu hỗ trợ</button>
      </form>`
    : `
      <div class="wb-alert wb-alert-info">
        Vui lòng <a href="${escapeHtml(signInUrl('/help', 'help.ticket'))}">đăng nhập tài khoản WORD BRIDGE</a> để gửi yêu cầu hỗ trợ và theo dõi thông tin xử lý trong tài khoản của bạn.
      </div>`;

  const trackingHtml = user
    ? `
      <section class="wb-card" id="my-tickets">
        <div class="wb-section-title-wrap" style="margin-bottom:14px;">
          <span class="wb-section-bar" aria-hidden="true"></span>
          <h2 style="margin:0;color:var(--wb-teal);">Theo dõi yêu cầu hỗ trợ của bạn (${userTickets.length})</h2>
        </div>
        ${userTickets.length === 0
          ? '<p class="wb-muted">Bạn chưa gửi yêu cầu hỗ trợ nào.</p>'
          : userTickets.map((t) => `
            <article class="wb-card" style="margin:12px 0;border-left:4px solid var(--wb-teal);">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
                <strong>#${escapeHtml(t.id)} — ${escapeHtml(t.subject)}</strong>
                <span class="wb-badge">${escapeHtml(STATUS_LABELS[t.status] || t.status)}</span>
              </div>
              <p style="margin:8px 0;">${escapeHtml(t.message_body)}</p>
              <div class="wb-muted" style="font-size:0.82rem;">Gửi lúc: ${escapeHtml(t.created_at)}</div>
              ${t.replies && t.replies.length > 0 ? `
                <div style="margin-top:10px;padding-top:10px;border-top:1px solid var(--wb-border);">
                  <strong>Phản hồi từ bộ phận Hỗ trợ WORD BRIDGE:</strong>
                  ${t.replies.map((r) => `
                    <div style="margin-top:6px;padding:8px 10px;background:#f4fbfb;border-radius:8px;">
                      <div style="font-size:0.82rem;font-weight:700;color:var(--wb-teal);">${escapeHtml(r.author_name)} · ${escapeHtml(r.created_at)}</div>
                      <div>${escapeHtml(r.reply_body)}</div>
                    </div>`).join('')}
                </div>` : ''}
            </article>`).join('')}
      </section>`
    : '';

  const contentHtml = `
    <section class="wb-banner-hero">
      <div class="wb-banner-hero-inner">
        <span class="wb-hero-pill">HƯỚNG DẪN & HỖ TRỢ</span>
        <h1>Trung Tâm Trợ Giúp WORD BRIDGE</h1>
        <p>Hướng dẫn sử dụng, giải đáp thắc mắc và hỗ trợ kỹ thuật giúp bạn học tập, luyện tập Tiếng Trung và Tiếng Anh trên WORD BRIDGE một cách hiệu quả, an toàn và thuận tiện.</p>
        <div class="wb-hero-ctas">
          <a href="#guides" class="wb-btn wb-hero-btn-white">Xem hướng dẫn →</a>
          <a href="#support-form" class="wb-btn wb-hero-btn-glass">Gửi yêu cầu hỗ trợ</a>
          ${user ? '<a href="#my-tickets" class="wb-btn wb-hero-btn-glass">Yêu cầu của tôi</a>' : ''}
        </div>
      </div>
    </section>

    <section id="guides" class="wb-section-block">
      <div class="wb-section-title-wrap" style="margin-bottom:16px;">
        <span class="wb-section-bar" aria-hidden="true"></span>
        <h2>Hướng dẫn sử dụng theo phân hệ</h2>
      </div>
      <div class="wb-grid-2">
        ${HELP_GUIDES.map((g) => `
          <article class="wb-card wb-guide-card" id="${escapeHtml(g.id)}">
            <h3>${escapeHtml(g.title)}</h3>
            <p class="wb-muted">${escapeHtml(g.summary)}</p>
            <ol class="wb-guide-steps">
              ${g.steps.map((s) => `<li>${escapeHtml(s)}</li>`).join('')}
            </ol>
          </article>`).join('')}
      </div>
    </section>

    <section id="faq" class="wb-section-block">
      <div class="wb-section-title-wrap" style="margin-bottom:16px;">
        <span class="wb-section-bar" aria-hidden="true"></span>
        <h2>Câu hỏi thường gặp (FAQ)</h2>
      </div>
      <div class="wb-grid-2">
        ${HELP_FAQS.map(([q, a]) => `
          <article class="wb-card">
            <h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(q)}</h3>
            <p style="margin-bottom:0;">${escapeHtml(a)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="wb-card" id="support-form" style="margin-top:24px;">
      <div class="wb-section-title-wrap" style="margin-bottom:10px;">
        <span class="wb-section-bar" aria-hidden="true"></span>
        <h2 style="margin:0;color:var(--wb-teal);">Gửi yêu cầu hỗ trợ trực tiếp</h2>
      </div>
      <p class="wb-muted">Yêu cầu của bạn sẽ được tiếp nhận bởi bộ phận Hỗ trợ WORD BRIDGE. Bạn có thể theo dõi thông tin xử lý trong tài khoản của mình.</p>
      ${ticketFormHtml}
    </section>

    ${trackingHtml}
  `;

  return htmlResponse(renderPublicPage({
    title: 'Trung Tâm Trợ Giúp',
    currentPath: '/help',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Trung Tâm Trợ Giúp' }],
    user,
    runtime,
    contentHtml,
  }));
}
