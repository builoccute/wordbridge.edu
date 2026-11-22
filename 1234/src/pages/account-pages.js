/**
 * WORD BRIDGE V4 — Account, Registration (8 Mandatory Fields), Email Verification,
 * Passkey & Student Benefit Pages
 * - Legacy subscription marketing removed from active V4 Account UI
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { ECOSYSTEM, signInUrl } from '../config/constants.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse, redirectResponse, buildSessionCookie } from '../utils/http.js';

export function renderLoginPage({ user }) {
  if (user) return redirectResponse('/my-learning');
  const contentHtml = `
    <h1>Đăng nhập WORD BRIDGE</h1>
    <div class="wb-grid-2">
      <form class="wb-form wb-card" data-api-endpoint="/api/v1/auth/login" data-redirect-to="/my-learning">
        <div class="wb-field"><label>Email</label><input class="wb-input" type="email" name="email" required /></div>
        <div class="wb-field"><label>Mật khẩu</label><input class="wb-input" type="password" name="password" required /></div>
        <div data-form-status></div>
        <button type="submit" class="wb-btn wb-btn-primary">Đăng nhập</button>
        <p style="font-size:0.88rem;"><a href="/forgot-password">Quên mật khẩu?</a> · <a href="${escapeHtml(ECOSYSTEM.portal)}/register">Chưa có tài khoản? Đăng ký ngay</a></p>
      </form>
      <div class="wb-card wb-card-warm">
        <h3>Đăng nhập bảo mật bằng Passkey</h3>
        <p class="wb-muted" style="font-size:0.9rem;">WORD BRIDGE chỉ sử dụng tài khoản nội bộ (Email/Mật khẩu) và khóa bảo mật Passkey WebAuthn/FIDO2. Hệ thống không lưu dữ liệu sinh trắc học trên máy chủ.</p>
        <a href="/account/passkeys" class="wb-btn wb-btn-outline wb-btn-sm">Quản lý Passkey</a>
      </div>
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
    <h1>Đăng ký tài khoản cá nhân WORD BRIDGE</h1>
    <p class="wb-muted">WORD BRIDGE chỉ hỗ trợ tài khoản cá nhân. Trường học và Nơi làm việc/tổ chức công tác là hai trường độc lập và đều bắt buộc. Xác minh tài khoản qua liên kết email một lần (không dùng OTP).</p>
    <form class="wb-form wb-card" data-api-endpoint="/api/v1/auth/register">
      <div class="wb-field"><label>1. Họ và tên *</label><input class="wb-input" name="fullName" required /></div>
      <div class="wb-field"><label>2. Ngày sinh *</label><input class="wb-input" type="date" name="dateOfBirth" required /></div>
      <div class="wb-field"><label>3. Số điện thoại *</label><input class="wb-input" name="phoneNumber" required /></div>
      <div class="wb-field"><label>4. Email *</label><input class="wb-input" type="email" name="email" required /></div>
      <div class="wb-field"><label>5. Mật khẩu (tối thiểu 10 ký tự gồm hoa, thường, số) *</label><input class="wb-input" type="password" name="password" required /></div>
      <div class="wb-field"><label>6. Xác nhận mật khẩu *</label><input class="wb-input" type="password" name="confirmPassword" required /></div>
      <div class="wb-field"><label>7. Trường học *</label><input class="wb-input" name="schoolName" required /></div>
      <div class="wb-field"><label>8. Nơi làm việc / tổ chức công tác *</label><input class="wb-input" name="workplaceName" required /></div>
      <div data-form-status></div>
      <button type="submit" class="wb-btn wb-btn-primary">Tạo tài khoản & Gửi liên kết xác minh email</button>
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
      contentHtml: '<h1>Xác minh địa chỉ email</h1><div class="wb-alert wb-alert-info">Vui lòng mở liên kết xác minh một lần đã được gửi tới hộp thư của bạn (không sử dụng mã OTP).</div>',
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

export function renderPasswordPage({ mode = 'forgot', user }) {
  const isReset = mode === 'reset';
  const contentHtml = isReset
    ? `<h1>Đặt lại mật khẩu</h1><div class="wb-card"><p>Nhập mật khẩu mới an toàn (tối thiểu 10 ký tự, có chữ hoa, chữ thường và số).</p></div>`
    : `<h1>Quên mật khẩu</h1><form class="wb-form wb-card" data-api-endpoint="/api/v1/auth/forgot-password"><div class="wb-field"><label>Email tài khoản</label><input class="wb-input" type="email" name="email" required /></div><div data-form-status></div><button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết khôi phục mật khẩu</button></form>`;
  return htmlResponse(renderPublicPage({
    title: isReset ? 'Đặt lại mật khẩu' : 'Quên mật khẩu',
    currentPath: isReset ? '/reset-password' : '/forgot-password',
    user,
    contentHtml,
  }));
}


export async function renderAccountPage({ db, user, subPath = '' }) {
  const currentPath = subPath ? `/account/${subPath}` : '/account';
  if (!user) return redirectResponse(signInUrl(currentPath, 'account.view'));
  const nav = `
    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:20px;">
      <a href="/account" class="wb-btn wb-btn-outline wb-btn-sm">Tổng quan</a>
      <a href="/account/profile" class="wb-btn wb-btn-outline wb-btn-sm">Hồ sơ</a>
      <a href="/account/security" class="wb-btn wb-btn-outline wb-btn-sm">Bảo mật</a>
      <a href="/account/sessions" class="wb-btn wb-btn-outline wb-btn-sm">Phiên đăng nhập</a>
      <a href="/account/passkeys" class="wb-btn wb-btn-outline wb-btn-sm">Passkey</a>
      <a href="/account/privacy" class="wb-btn wb-btn-outline wb-btn-sm">Quyền riêng tư</a>
      <a href="/account/student-benefit" class="wb-btn wb-btn-primary wb-btn-sm">Quyền lợi sinh viên</a>
    </div>`;

  let body = '';
  let title = 'Tài khoản cá nhân';

  if (subPath === 'student-benefit') {
    title = 'Quyền lợi sinh viên (03 tháng)';
    const existing = await db.prepare('SELECT * FROM wb_student_benefits WHERE account_id = ?').bind(user.accountId).first();
    body = `
      <div class="wb-card">
        <h3>Chính sách sinh viên chính thức</h3>
        <p>Quyền lợi hỗ trợ học tập dành cho sinh viên có thời hạn <strong>03 tháng</strong>, chỉ áp dụng <strong>một lần duy nhất</strong>. Điều kiện xác minh duy nhất: <strong>Email sinh viên do trường cấp</strong>. Không nhận ảnh thẻ sinh viên, giấy xác nhận hay hồ sơ thay thế.</p>
        ${existing
          ? `<div class="wb-alert wb-alert-info">Trạng thái hiện tại: <strong>${escapeHtml(existing.status)}</strong> · Email trường: ${escapeHtml(existing.school_email)} · Hết hạn: ${escapeHtml(existing.expires_at || 'Chờ xác minh')}</div>`
          : `<form class="wb-form" data-api-endpoint="/api/v1/student-benefit/request">
              <input type="hidden" name="verificationMethod" value="school_email_only" />
              <div class="wb-field"><label>Email sinh viên do trường cấp (*.edu.vn, *.edu, *.ac.*)</label><input class="wb-input" type="email" name="schoolEmail" required /></div>
              <div data-form-status></div>
              <button type="submit" class="wb-btn wb-btn-primary">Gửi liên kết xác minh email sinh viên</button>
            </form>`}
      </div>`;
  } else if (subPath === 'sessions') {
    title = 'Quản lý phiên đăng nhập';
    const sessions = (await db.prepare('SELECT id, ip_address, user_agent, created_at, expires_at, revoked_at FROM wb_sessions WHERE account_id = ? ORDER BY created_at DESC LIMIT 15').bind(user.accountId).all()).results || [];
    body = `<div class="wb-table-wrap"><table class="wb-table"><thead><tr><th>Mã phiên</th><th>Thiết bị</th><th>IP</th><th>Trạng thái</th></tr></thead><tbody>${sessions.map((s) => `<tr><td>${escapeHtml(s.id)}</td><td>${escapeHtml(s.user_agent || '')}</td><td>${escapeHtml(s.ip_address || '')}</td><td>${s.revoked_at ? 'Đã thu hồi' : 'Đang hoạt động'}</td></tr>`).join('')}</tbody></table></div>`;
  } else if (subPath === 'passkeys') {
    title = 'Passkey (WebAuthn / FIDO2)';
    const keys = (await db.prepare('SELECT id, display_name, created_at, revoked_at FROM wb_passkeys WHERE account_id = ? ORDER BY created_at DESC').bind(user.accountId).all()).results || [];
    body = `<div class="wb-card"><p>WORD BRIDGE không thu thập hay lưu vân tay, khuôn mặt, PIN thiết bị hay khóa bí mật (private key). Chỉ lưu định danh WebAuthn và khóa công khai COSE.</p><p>Số Passkey hiện có: <strong>${keys.length}</strong></p></div>`;
  } else {
    body = `
      <div class="wb-card">
        <h3>Thông tin hồ sơ cá nhân</h3>
        <ul>
          <li><strong>Họ và tên:</strong> ${escapeHtml(user.fullName)}</li>
          <li><strong>Email:</strong> ${escapeHtml(user.email)}</li>
          <li><strong>Ngày sinh:</strong> ${escapeHtml(user.dateOfBirth)}</li>
          <li><strong>Số điện thoại:</strong> ${escapeHtml(user.phoneNumber)}</li>
          <li><strong>Trường học:</strong> ${escapeHtml(user.schoolName)}</li>
          <li><strong>Nơi làm việc / tổ chức công tác:</strong> ${escapeHtml(user.workplaceName)}</li>
        </ul>
      </div>`;
  }

  return htmlResponse(renderPublicPage({
    title,
    currentPath,
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: 'Tài khoản', href: '/account' }, ...(subPath ? [{ label: title }] : [])],
    user,
    contentHtml: `<h1>${escapeHtml(title)}</h1>${nav}${body}`,
  }));
}
