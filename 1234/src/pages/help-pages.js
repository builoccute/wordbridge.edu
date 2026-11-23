/**
 * WORD BRIDGE V4.1 — Real Integrated Help Center (/help)
 * Zero subdomain dependency. Includes structured guides, FAQ,
 * real support ticket submission (saved to D1 `wb_support_requests`),
 * and real ticket tracking with admin replies (`wb_support_replies`).
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

const HELP_GUIDES = [
  {
    id: 'getting-started',
    title: '1. Hướng dẫn sử dụng WORD BRIDGE',
    summary: 'Toàn bộ nền tảng vận hành trên một tên miền duy nhất wordbridge.io.vn cho 3 ngôn ngữ: Tiếng Trung, Tiếng Anh và Tiếng Nga.',
    steps: [
      'Đăng ký tài khoản cá nhân tại /register và xác minh email qua liên kết một lần.',
      'Chọn ngôn ngữ học tập tại /learning (Tiếng Trung, Tiếng Anh hoặc Tiếng Nga) và xem lộ trình tại /learning/path.',
      'Lưu từ vựng mới vào Sổ từ vựng (/vocabulary/notebook) và ôn tập ngắt quãng SM-2 tại /vocabulary/flashcards.',
    ],
  },
  {
    id: 'account',
    title: '2. Hướng dẫn tài khoản & bảo mật',
    summary: 'Quản lý đăng nhập bằng Email/Mật khẩu, đặt lại mật khẩu, hồ sơ cá nhân và khóa bảo mật Passkey.',
    steps: [
      'Đăng nhập tại /login, quên mật khẩu tại /forgot-password và đặt lại mật khẩu tại /reset-password.',
      'Cập nhật thông tin cá nhân, đổi mật khẩu và quản lý phiên đăng nhập tại /profile hoặc /account.',
      'Kiểm tra và thu hồi các phiên đăng nhập cũ tại /account/sessions để bảo vệ tài khoản.',
    ],
  },
  {
    id: 'learning',
    title: '3. Hướng dẫn học tập & lộ trình',
    summary: 'Cấu trúc giáo trình chuẩn hóa theo Tuần học, Buổi học và Bài học có kiểm tra mức độ hiểu bài.',
    steps: [
      'Truy cập /learning để chọn chương trình nền tảng hoặc chuyên ngành (Tiếng Trung & Tiếng Anh).',
      'Ghi chú trực tiếp ngay trong từng bài học và nộp bài kiểm tra kiến thức cuối bài để hệ thống ghi nhận tiến độ thật.',
      'Theo dõi lịch sử học tập và các lỗi cần ôn lại tại /my-learning, /my-knowledge và /my-mistakes.',
    ],
  },
  {
    id: 'practice',
    title: '4. Hướng dẫn luyện tập 6 kỹ năng',
    summary: 'Cổng Luyện Tập (/practice) hỗ trợ Nghe, Nói, Đọc, Viết, Từ vựng và Ngữ pháp.',
    steps: [
      'Chọn kỹ năng muốn luyện tập tại /practice (listening, speaking, reading, writing, vocabulary, grammar).',
      'Nộp bài để hệ thống chấm tự động (trắc nghiệm/điền từ) hoặc lưu rubric đánh giá cho bài tự luận/nói.',
      'Xem biểu đồ tiến bộ và phân tích điểm yếu tại /practice/history.',
    ],
  },
  {
    id: 'tools',
    title: '5. Hướng dẫn sử dụng công cụ',
    summary: 'Từ điển đa ngữ, Ngoại ngữ chuyên ngành (12 bộ dữ liệu), Thư viện đọc (/reader), Learner Meet và 15 hệ thống Trí tuệ Ngôn ngữ.',
    steps: [
      'Tra cứu Từ điển (/dictionary) và 12.104+ thuật ngữ chuyên ngành (/specialized), lưu 1 chạm vào Flashcards.',
      'Đọc tài liệu mẫu và chuyên ngành trực tiếp tại /reader, lưu tiến độ đọc và ghi chú cá nhân.',
      'Tham gia phòng giao tiếp tập trung tại /learner-meet (không chat văn bản, không ghi hình) và phân tích năng lực tại /intelligence.',
    ],
  },
];

const HELP_FAQS = [
  ['WORD BRIDGE hỗ trợ những ngôn ngữ nào?', 'WORD BRIDGE hỗ trợ chính thức Tiếng Trung, Tiếng Anh (nền tảng & chuyên ngành) và Tiếng Nga (tổng quát).'],
  ['Tại sao tôi không thấy nút đăng nhập Google hay Facebook?', 'WORD BRIDGE sử dụng hệ thống tài khoản nội bộ tập trung bằng Email/Mật khẩu và Passkey WebAuthn để đảm bảo bảo mật và thống nhất dữ liệu.'],
  ['Dữ liệu luyện tập và sổ từ vựng của tôi được lưu ở đâu?', 'Toàn bộ tiến độ học tập, bài luyện tập, sổ từ vựng SM-2, ghi chú đọc tài liệu và yêu cầu hỗ trợ được lưu trực tiếp trong cơ sở dữ liệu Cloudflare D1 của wordbridge.io.vn.'],
  ['Tôi có thể theo dõi tiến độ xử lý yêu cầu hỗ trợ không?', 'Có. Sau khi đăng nhập và gửi yêu cầu hỗ trợ tại trang /help này, bạn có thể theo dõi trạng thái (open / in_progress / resolved / closed) và phản hồi của đội ngũ hỗ trợ ngay bên dưới.'],
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
        <div class="wb-field"><label>Tiêu đề yêu cầu *</label><input class="wb-input" name="subject" placeholder="Ví dụ: Hỗ trợ xác minh tài khoản hoặc lỗi phát audio" required /></div>
        <div class="wb-field"><label>Nội dung chi tiết (tối thiểu 10 ký tự) *</label><textarea class="wb-input" name="messageBody" rows="4" required placeholder="Mô tả rõ vấn đề bạn gặp phải..."></textarea></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi yêu cầu hỗ trợ</button>
      </form>`
    : `
      <div class="wb-alert wb-alert-info">
        Vui lòng <a href="${escapeHtml(signInUrl('/help', 'help.ticket'))}">đăng nhập tài khoản WORD BRIDGE</a> để gửi yêu cầu hỗ trợ và theo dõi trạng thái xử lý trực tuyến.
      </div>`;

  const trackingHtml = user
    ? `
      <section class="wb-card" id="my-tickets">
        <h2 style="margin-top:0;color:var(--wb-teal);">Theo dõi yêu cầu hỗ trợ của bạn (${userTickets.length})</h2>
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
                  <strong>Phản hồi từ đội ngũ hỗ trợ:</strong>
                  ${t.replies.map((r) => `
                    <div style="margin-top:6px;padding:8px 10px;background:var(--wb-surface-alt, #f6f9f9);border-radius:6px;">
                      <div style="font-size:0.82rem;font-weight:700;color:var(--wb-teal);">${escapeHtml(r.author_name)} · ${escapeHtml(r.created_at)}</div>
                      <div>${escapeHtml(r.reply_body)}</div>
                    </div>`).join('')}
                </div>` : ''}
            </article>`).join('')}
      </section>`
    : '';

  const contentHtml = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-aqua">TRUNG TÂM TRỢ GIÚP NỘI BỘ</span>
      <h1>Trung Tâm Trợ Giúp WORD BRIDGE</h1>
      <p>Hướng dẫn sử dụng đầy đủ các phân hệ học tập, tài khoản, luyện tập, thư viện đọc và hệ thống tiếp nhận — theo dõi yêu cầu hỗ trợ trực tiếp tại wordbridge.io.vn/help.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="#guides" class="wb-btn wb-btn-primary">Xem hướng dẫn</a>
        <a href="#support-form" class="wb-btn wb-btn-outline">Gửi yêu cầu hỗ trợ</a>
        ${user ? '<a href="#my-tickets" class="wb-btn wb-btn-ghost">Yêu cầu của tôi</a>' : ''}
      </div>
    </section>

    <section id="guides" style="margin-top:20px;">
      <h2 style="color:var(--wb-teal);">Hướng dẫn sử dụng theo phân hệ</h2>
      <div class="wb-grid-2">
        ${HELP_GUIDES.map((g) => `
          <article class="wb-card" id="${escapeHtml(g.id)}">
            <h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(g.title)}</h3>
            <p class="wb-muted">${escapeHtml(g.summary)}</p>
            <ol style="padding-left:20px;margin:0;">
              ${g.steps.map((s) => `<li style="margin-bottom:6px;">${escapeHtml(s)}</li>`).join('')}
            </ol>
          </article>`).join('')}
      </div>
    </section>

    <section id="faq" style="margin-top:20px;">
      <h2 style="color:var(--wb-teal);">Câu hỏi thường gặp (FAQ)</h2>
      <div class="wb-grid-2">
        ${HELP_FAQS.map(([q, a]) => `
          <article class="wb-card">
            <h3 style="margin-top:0;color:var(--wb-teal);">${escapeHtml(q)}</h3>
            <p style="margin-bottom:0;">${escapeHtml(a)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="wb-card" id="support-form" style="margin-top:20px;">
      <h2 style="margin-top:0;color:var(--wb-teal);">Gửi yêu cầu hỗ trợ trực tiếp</h2>
      <p class="wb-muted">Yêu cầu của bạn được lưu trực tiếp vào cơ sở dữ liệu hỗ trợ WORD BRIDGE và chuyển tới đội ngũ nhân sự hỗ trợ tại /quan-tri.</p>
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
