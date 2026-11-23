/**
 * WORD BRIDGE V4.2 — Account, Login (#16), Register (#01), Email Verification,
 * Password Reset, Profile, Passkey WebAuthn & Student Benefit Pages
 * Zero OAuth Google/Facebook; 8 mandatory independent registration fields (School & Workplace required).
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse, buildSessionCookie } from '../utils/http.js';

export function renderLoginPage({ user, url = null }) {
  const nextRaw = url?.searchParams?.get('next') || '/my-learning';
  const safeNext = nextRaw.startsWith('/') && !nextRaw.startsWith('//') ? nextRaw : '/my-learning';
  if (user) return redirectResponse(safeNext);

  const benefits = [
    ['Học tập linh hoạt', 'Theo năng lực và mục tiêu cá nhân'],
    ['Luyện tập chuyên sâu', 'Nghe · Nói · Đọc · Viết đồng bộ'],
    ['Từ điển & Flashcards', 'Lưu từ vựng và ôn tập SM-2'],
    ['Thư viện phong phú', 'Tài liệu, bài đọc và nội dung chuyên ngành'],
    ['An toàn & Bảo mật', 'Bảo vệ tài khoản bằng mật khẩu & Passkey'],
    ['Sử dụng mọi thiết bị', 'Trải nghiệm mượt mà trên máy tính và di động'],
  ];

  const contentHtml = `
    <div class="wb-section-title-wrap" style="margin-bottom:20px;">
      <span class="wb-section-bar" aria-hidden="true"></span>
      <div>
        <h1 style="margin:0;color:var(--wb-text);">Đăng nhập WORD BRIDGE</h1>
        <span class="wb-accent-line" aria-hidden="true"></span>
      </div>
    </div>

    <div class="wb-auth-grid">
      <form class="wb-form wb-card wb-auth-card" data-api-endpoint="/api/v1/auth/login" data-redirect-to="${escapeHtml(safeNext)}">
        <div class="wb-field">
          <label for="login-email">Email</label>
          <input id="login-email" class="wb-input" type="email" name="email" placeholder="Nhập email của bạn" autocomplete="email" required />
        </div>
        <div class="wb-field">
          <label for="login-password">Mật khẩu</label>
          <input id="login-password" class="wb-input" type="password" name="password" placeholder="Nhập mật khẩu" autocomplete="current-password" required />
        </div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary wb-btn-block">Đăng nhập</button>
        <p class="wb-auth-links">
          <a href="/forgot-password">Quên mật khẩu?</a>
          <span aria-hidden="true">·</span>
          <span>Chưa có tài khoản? <a href="/register" class="wb-link-accent">Đăng ký ngay</a></span>
        </p>
      </form>

      <aside class="wb-card wb-auth-benefits">
        <div class="wb-section-title-wrap" style="margin-bottom:12px;">
          <span class="wb-section-bar" aria-hidden="true"></span>
          <div>
            <h2 style="margin:0;font-size:1.2rem;color:var(--wb-text);">Vì sao chọn WORD BRIDGE?</h2>
            <p class="wb-muted" style="margin:4px 0 0;font-size:0.9rem;">Nền tảng học ngôn ngữ Trung – Anh thống nhất và an toàn.</p>
          </div>
        </div>
        <div class="wb-benefits-grid">
          ${benefits.map(([t, d]) => `
            <div class="wb-benefit-tile">
              <strong>${escapeHtml(t)}</strong>
              <span>${escapeHtml(d)}</span>
            </div>`).join('')}
        </div>
        <div style="margin-top:16px;padding-top:12px;border-top:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;">
          <span class="wb-muted" style="font-size:0.84rem;">Hỗ trợ khóa bảo mật Passkey WebAuthn/FIDO2</span>
          <a href="/account/passkeys" class="wb-btn wb-btn-outline wb-btn-sm">Quản lý Passkey</a>
        </div>
      </aside>
    </div>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Đăng nhập',
    currentPath: '/login',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Đăng nhập' }],
    user,
    contentHtml,
  }));
}

export function renderRegisterPage({ user }) {
  if (user) return redirectResponse('/my-learning');
  const contentHtml = `
    <div class="wb-section-title-wrap" style="margin-bottom:8px;">
      <span class="wb-section-bar" aria-hidden="true"></span>
      <h1 style="margin:0;color:var(--wb-text);">Đăng ký tài khoản cá nhân WORD BRIDGE</h1>
    </div>
    <p class="wb-muted" style="margin-top:0;margin-bottom:20px;">Tạo tài khoản WORD BRIDGE để học tập, luyện tập Tiếng Trung và Tiếng Anh. Vui lòng cung cấp đầy đủ thông tin cá nhân, trường học và nơi làm việc để hoàn tất đăng ký.</p>

    <form class="wb-form wb-card wb-register-card" data-api-endpoint="/api/v1/auth/register">
      <div class="wb-grid-2">
        <div class="wb-field"><label for="reg-fullname">1. Họ và tên <span class="wb-req">*</span></label><input id="reg-fullname" class="wb-input" name="fullName" placeholder="Nhập họ và tên" required /></div>
        <div class="wb-field"><label for="reg-dob">2. Ngày sinh <span class="wb-req">*</span></label><input id="reg-dob" class="wb-input" type="date" name="dateOfBirth" required /></div>
        <div class="wb-field"><label for="reg-phone">3. Số điện thoại <span class="wb-req">*</span></label><input id="reg-phone" class="wb-input" name="phoneNumber" placeholder="Nhập số điện thoại" required /></div>
        <div class="wb-field"><label for="reg-email">4. Email <span class="wb-req">*</span></label><input id="reg-email" class="wb-input" type="email" name="email" placeholder="Nhập email" required /></div>
        <div class="wb-field"><label for="reg-password">5. Mật khẩu (tối thiểu 10 ký tự gồm hoa, thường, số) <span class="wb-req">*</span></label><input id="reg-password" class="wb-input" type="password" name="password" placeholder="Nhập mật khẩu" required /></div>
        <div class="wb-field"><label for="reg-confirm">6. Xác nhận mật khẩu <span class="wb-req">*</span></label><input id="reg-confirm" class="wb-input" type="password" name="confirmPassword" placeholder="Nhập lại mật khẩu" required /></div>
        <div class="wb-field"><label for="reg-school">7. Trường học <span class="wb-req">*</span></label><input id="reg-school" class="wb-input" name="schoolName" placeholder="Nhập tên trường học" required /></div>
        <div class="wb-field"><label for="reg-workplace">8. Nơi làm việc / tổ chức công tác <span class="wb-req">*</span></label><input id="reg-workplace" class="wb-input" name="workplaceName" placeholder="Nhập tên cơ quan, tổ chức nơi làm việc" required /></div>
      </div>
      <div data-form-status></div>
      <button type="submit" class="wb-btn wb-btn-primary wb-btn-block">Tạo tài khoản & Gửi liên kết xác minh email →</button>
    </form>
  `;
  return htmlResponse(renderPublicPage({
    title: 'Đăng ký tài khoản',
    currentPath: '/register',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Đăng ký' }],
    user,
    contentHtml,
  }));
}

export async function renderVerifyEmailPage({ services, url, request }) {
  const token = url.searchParams.get('token');
  if (!token) {
    return htmlResponse(renderPublicPage({
      title: 'Xác minh email',
      currentPath: '/verify-email',
      contentHtml: '<h1>Xác minh địa chỉ email</h1><div class="wb-alert wb-alert-info">Vui lòng mở liên kết xác minh một lần đã được gửi tới hộp thư của bạn.</div>',
    }));
  }
  const res = await services.auth.verifyEmailToken(token, {
    ipAddress: request.headers.get('CF-Connecting-IP') || '127.0.0.1',
    userAgent: request.headers.get('User-Agent') || 'Browser',
  });
  if (!res.ok) {
    return htmlResponse(renderPublicPage({
      title: 'Xác minh email thất bại',
      currentPath: '/verify-email',
      contentHtml: `<h1>Xác minh email thất bại</h1><div class="wb-alert wb-alert-error">${escapeHtml(res.error)}</div><a href="${escapeHtml(signInUrl('/my-learning', 'verify.retry'))}" class="wb-btn wb-btn-outline">Về trang đăng nhập</a>`,
    }), 400);
  }
  return redirectResponse('/my-learning', 302, {
    'Set-Cookie': buildSessionCookie(res.session.rawSessionToken, 60 * 60 * 24 * 7, url.protocol === 'https:'),
  });
}

export function renderPasswordPage({ mode = 'forgot', user, url = null }) {
  const isReset = mode === 'reset';
  const token = url?.searchParams?.get('token') || '';
  const contentHtml = isReset
    ? `<h1>Đặt lại mật khẩu</h1>
       <form class="wb-form wb-card" style="max-width:560px;" data-api-endpoint="/api/v1/auth/reset-password" data-redirect-to="/login">
         <p class="wb-muted">Nhập mật khẩu mới an toàn (tối thiểu 10 ký tự, gồm chữ hoa, chữ thường và chữ số).</p>
         <div class="wb-field"><label>Mã xác nhận khôi phục *</label><input class="wb-input" name="token" value="${escapeHtml(token)}" required /></div>
         <div class="wb-field"><label>Mật khẩu mới *</label><input class="wb-input" type="password" name="newPassword" required /></div>
         <div class="wb-field"><label>Xác nhận mật khẩu mới *</label><input class="wb-input" type="password" name="confirmPassword" required /></div>
         <div data-form-status></div>
         <button type="submit" class="wb-btn wb-btn-primary">Cập nhật mật khẩu mới</button>
       </form>`
    : `<h1>Quên mật khẩu</h1>
       <form class="wb-form wb-card" style="max-width:560px;" data-api-endpoint="/api/v1/auth/forgot-password">
         <div class="wb-field"><label>Email tài khoản</label><input class="wb-input" type="email" name="email" required /></div>
         <div data-form-status></div>
         <button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết khôi phục mật khẩu</button>
       </form>`;
  return htmlResponse(renderPublicPage({
    title: isReset ? 'Đặt lại mật khẩu' : 'Quên mật khẩu',
    currentPath: isReset ? '/reset-password' : '/forgot-password',
    user,
    contentHtml,
  }));
}

export async function renderAccountPage({ db, user, subPath = '' }) {
  if (!user) return redirectResponse(signInUrl(`/account/${subPath}`, 'account.access'));
  const account = await db.prepare('SELECT * FROM wb_accounts WHERE id = ?').bind(user.accountId).first();
  const sessions = (await db.prepare('SELECT id, ip_address, user_agent, created_at, expires_at FROM wb_sessions WHERE account_id = ? AND revoked_at IS NULL ORDER BY created_at DESC').bind(user.accountId).all()).results || [];
  const passkeys = (await db.prepare('SELECT id, credential_id, display_name, created_at, revoked_at FROM wb_passkeys WHERE account_id = ? ORDER BY created_at DESC').bind(user.accountId).all()).results || [];
  const tickets = (await db.prepare('SELECT id, subject, status, created_at FROM wb_support_requests WHERE account_id = ? ORDER BY created_at DESC LIMIT 10').bind(user.accountId).all()).results || [];

  let sectionHtml = `
    <div class="wb-grid-2">
      <div class="wb-card">
        <h3>Thông tin cá nhân</h3>
        <form class="wb-form" data-api-endpoint="/api/v1/auth/profile" data-api-method="PATCH" data-reload-on-success="true">
          <div class="wb-field"><label>Email tài khoản</label><input class="wb-input" value="${escapeHtml(account?.email || user.email)}" disabled /></div>
          <div class="wb-field"><label>Họ và tên *</label><input class="wb-input" name="fullName" value="${escapeHtml(account?.full_name || user.fullName || '')}" required /></div>
          <div class="wb-field"><label>Số điện thoại *</label><input class="wb-input" name="phoneNumber" value="${escapeHtml(account?.phone_number || '')}" required /></div>
          <div class="wb-field"><label>Trường học *</label><input class="wb-input" name="schoolName" value="${escapeHtml(account?.school_name || '')}" required /></div>
          <div class="wb-field"><label>Nơi làm việc / tổ chức công tác *</label><input class="wb-input" name="workplaceName" value="${escapeHtml(account?.workplace_name || '')}" required /></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-primary">Lưu thay đổi hồ sơ</button>
        </form>
      </div>
      <div class="wb-card">
        <h3>Đổi mật khẩu tài khoản</h3>
        <form class="wb-form" data-api-endpoint="/api/v1/auth/change-password">
          <div class="wb-field"><label>Mật khẩu hiện tại *</label><input class="wb-input" type="password" name="currentPassword" required /></div>
          <div class="wb-field"><label>Mật khẩu mới (tối thiểu 10 ký tự gồm hoa, thường, số) *</label><input class="wb-input" type="password" name="newPassword" required /></div>
          <div class="wb-field"><label>Xác nhận mật khẩu mới *</label><input class="wb-input" type="password" name="confirmPassword" required /></div>
          <div data-form-status></div>
          <button type="submit" class="wb-btn wb-btn-outline">Cập nhật mật khẩu</button>
        </form>
        <hr style="margin:18px 0;border:none;border-top:1px solid var(--wb-border);" />
        <p class="wb-muted" style="font-size:0.86rem;">Tài khoản cá nhân WORD BRIDGE · Yêu cầu hỗ trợ: <a href="/help#my-tickets">${tickets.length} phiếu</a></p>
      </div>
    </div>`;

  if (subPath === 'passkeys') {
    sectionHtml = `<div class="wb-card"><h3>Passkey WebAuthn / FIDO2</h3>
      <p class="wb-muted">Khóa công khai và challenge được xác thực tại Cloudflare Workers. Dữ liệu sinh trắc học không lưu trên máy chủ.</p>
      <p>Số Passkey đã đăng ký: <strong>${passkeys.length}</strong></p>
      <table class="wb-table"><thead><tr><th>Thiết bị</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>
        ${passkeys.map((p) => `<tr><td>${escapeHtml(p.display_name)}</td><td>${p.revoked_at ? 'Đã thu hồi' : 'Đang hoạt động'}</td><td>${escapeHtml(p.created_at)}</td></tr>`).join('') || '<tr><td colspan="3">Chưa có Passkey nào.</td></tr>'}
      </tbody></table></div>`;
  } else if (subPath === 'student-benefit') {
    sectionHtml = `<div class="wb-card"><h3>Ưu đãi sinh viên bằng email trường học (.edu / .edu.vn)</h3>
      <p class="wb-muted">Xác minh quyền lợi học tập dành riêng cho sinh viên bằng email trường học hợp lệ.</p>
      <form class="wb-form" data-api-endpoint="/api/v1/account/student-benefit/request">
        <div class="wb-field"><label>Email trường học *</label><input class="wb-input" type="email" name="schoolEmail" placeholder="student@university.edu.vn" required /></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết xác minh email trường học</button>
      </form></div>`;
  } else if (subPath === 'sessions') {
    sectionHtml = `<div class="wb-card"><h3>Phiên đăng nhập đang hoạt động (${sessions.length})</h3>
      <table class="wb-table"><thead><tr><th>IP</th><th>Trình duyệt</th><th>Tạo lúc</th><th>Hết hạn</th></tr></thead><tbody>
        ${sessions.map((s) => `<tr><td>${escapeHtml(s.ip_address)}</td><td>${escapeHtml(s.user_agent)}</td><td>${escapeHtml(s.created_at)}</td><td>${escapeHtml(s.expires_at)}</td></tr>`).join('')}
      </tbody></table></div>`;
  }

  const contentHtml = `
    <h1>Quản lý tài khoản & Bảo mật</h1>
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:16px;">
      <a href="/account" class="wb-btn wb-btn-outline wb-btn-sm">Hồ sơ & Đổi mật khẩu</a>
      <a href="/account/passkeys" class="wb-btn wb-btn-outline wb-btn-sm">Passkey</a>
      <a href="/account/sessions" class="wb-btn wb-btn-outline wb-btn-sm">Phiên đăng nhập</a>
      <a href="/account/student-benefit" class="wb-btn wb-btn-outline wb-btn-sm">Ưu đãi sinh viên</a>
      <a href="/help#my-tickets" class="wb-btn wb-btn-outline wb-btn-sm">Yêu cầu hỗ trợ (${tickets.length})</a>
    </div>
    ${sectionHtml}`;

  return htmlResponse(renderPublicPage({
    title: 'Tài khoản',
    currentPath: subPath === 'profile-root' ? '/profile' : `/account/${subPath}`,
    user,
    contentHtml,
  }));
}
