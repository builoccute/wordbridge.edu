/**
 * WORD BRIDGE — Registry of Transactional & Event Email Templates
 * Exam templates removed; unified domain links to https://wordbridge.io.vn.
 * - System emails: From WORD BRIDGE <noreply@wordbridge.vn>, Reply-To cskh@wordbridge.vn
 * - Support emails: From WORD BRIDGE <cskh@wordbridge.vn>, Reply-To cskh@wordbridge.vn
 * - Contact/Partnership emails: From WORD BRIDGE <contact@wordbridge.vn>, Reply-To contact@wordbridge.vn
 */

import { renderEmailLayout, escapeEmailHtml } from '../layouts/base-layout.js';

export const EMAIL_CHANNELS = Object.freeze({
  SYSTEM: {
    from: 'WORD BRIDGE <noreply@wordbridge.vn>',
    senderAddress: 'noreply@wordbridge.vn',
    replyTo: 'cskh@wordbridge.vn',
  },
  CSKH: {
    from: 'WORD BRIDGE <cskh@wordbridge.vn>',
    senderAddress: 'cskh@wordbridge.vn',
    replyTo: 'cskh@wordbridge.vn',
  },
  CONTACT: {
    from: 'WORD BRIDGE <contact@wordbridge.vn>',
    senderAddress: 'contact@wordbridge.vn',
    replyTo: 'contact@wordbridge.vn',
  },
});

const TEMPLATE_SPECS = [
  { key: 'verify_email', version: '1.0.0', channel: 'SYSTEM', subject: 'Xác minh địa chỉ email tài khoản WORD BRIDGE', title: 'Xác minh địa chỉ email của bạn', ctaLabel: 'Xác minh email ngay', summary: (v) => `Xin chào ${v.fullName || 'bạn'}, vui lòng nhấn liên kết bên dưới để xác minh email cho tài khoản WORD BRIDGE. Liên kết có hiệu lực một lần trong ${v.expiresMinutes || 30} phút.` },
  { key: 'welcome_registered', version: '1.0.0', channel: 'SYSTEM', subject: 'Chào mừng bạn đến với WORD BRIDGE', title: 'Chào mừng đến với WORD BRIDGE', ctaLabel: 'Bắt đầu lộ trình học', summary: (v) => `Xin chào ${v.fullName || 'bạn'}, tài khoản WORD BRIDGE của bạn đã được xác minh thành công. Bạn có thể bắt đầu học tiếng Trung, tiếng Anh hoặc tiếng Nga ngay bây giờ.` },
  { key: 'password_reset', version: '1.0.0', channel: 'SYSTEM', subject: 'Yêu cầu đặt lại mật khẩu WORD BRIDGE', title: 'Khôi phục mật khẩu tài khoản', ctaLabel: 'Đặt lại mật khẩu', summary: (v) => `Chúng tôi nhận được yêu cầu đặt lại mật khẩu cho tài khoản ${v.email || ''}. Liên kết chỉ sử dụng một lần và hết hạn sau ${v.expiresMinutes || 30} phút.` },
  { key: 'new_login_detected', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo đăng nhập mới vào tài khoản WORD BRIDGE', title: 'Phát hiện phiên đăng nhập mới', ctaLabel: 'Kiểm tra phiên đăng nhập', summary: (v) => `Tài khoản của bạn vừa đăng nhập lúc ${v.timestamp || new Date().toISOString()} từ thiết bị ${v.userAgent || 'không xác định'} (IP: ${v.ipAddress || 'ẩn'}).` },
  { key: 'security_alert', version: '1.0.0', channel: 'SYSTEM', subject: 'Cảnh báo hoạt động bảo mật trên tài khoản WORD BRIDGE', title: 'Cảnh báo bảo mật tài khoản', ctaLabel: 'Mở Trung tâm bảo mật', summary: (v) => `Hệ thống ghi nhận hoạt động bảo mật đáng chú ý: ${v.detail || 'Thay đổi cấu hình bảo mật'}. Nếu không phải bạn thực hiện, hãy thu hồi phiên và đổi mật khẩu ngay.` },
  { key: 'password_changed', version: '1.0.0', channel: 'SYSTEM', subject: 'Mật khẩu WORD BRIDGE của bạn đã được thay đổi', title: 'Xác nhận thay đổi mật khẩu', ctaLabel: 'Kiểm tra bảo mật', summary: (v) => `Mật khẩu tài khoản WORD BRIDGE của bạn vừa được cập nhật thành công lúc ${v.timestamp || new Date().toISOString()}.` },
  { key: 'email_changed', version: '1.0.0', channel: 'SYSTEM', subject: 'Xác nhận thay đổi địa chỉ email WORD BRIDGE', title: 'Thay đổi địa chỉ email', ctaLabel: 'Xác nhận email mới', summary: (v) => `Yêu cầu đổi địa chỉ email tài khoản sang ${v.newEmail || ''} đã được tạo. Vui lòng xác nhận để hoàn tất.` },
  { key: 'passkey_added', version: '1.0.0', channel: 'SYSTEM', subject: 'Passkey mới đã được thêm vào tài khoản WORD BRIDGE', title: 'Đã thêm Passkey mới', ctaLabel: 'Quản lý Passkey', summary: (v) => `Passkey "${v.passkeyName || 'Thiết bị cá nhân'}" đã được đăng ký qua chuẩn WebAuthn/FIDO2. WORD BRIDGE không lưu dữ liệu sinh trắc học của thiết bị.` },
  { key: 'passkey_revoked', version: '1.0.0', channel: 'SYSTEM', subject: 'Passkey đã được thu hồi khỏi tài khoản WORD BRIDGE', title: 'Đã thu hồi Passkey', ctaLabel: 'Xem danh sách Passkey', summary: (v) => `Passkey "${v.passkeyName || 'Thiết bị'}" đã bị thu hồi và không còn dùng để đăng nhập được nữa.` },
  { key: 'session_revoked', version: '1.0.0', channel: 'SYSTEM', subject: 'Phiên đăng nhập WORD BRIDGE đã được thu hồi', title: 'Thu hồi phiên đăng nhập', ctaLabel: 'Quản lý phiên đăng nhập', summary: (v) => `Một hoặc nhiều phiên đăng nhập trên tài khoản của bạn đã được đăng xuất từ xa lúc ${v.timestamp || new Date().toISOString()}.` },
  { key: 'account_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo quan trọng về tài khoản WORD BRIDGE', title: 'Thông báo tài khoản', ctaLabel: 'Xem chi tiết tài khoản', summary: (v) => v.message || 'Tài khoản WORD BRIDGE của bạn có thông báo cập nhật mới.' },
  { key: 'student_benefit_activated', version: '1.0.0', channel: 'SYSTEM', subject: 'Quyền lợi sinh viên PERSONAL PLUS (03 tháng) đã kích hoạt', title: 'Kích hoạt quyền lợi sinh viên thành công', ctaLabel: 'Xem gói dịch vụ', summary: (v) => `Email sinh viên ${v.schoolEmail || ''} đã được xác minh. Gói PERSONAL PLUS miễn phí 03 tháng (duy nhất 01 lần) có hiệu lực đến ngày ${v.expiresAt || ''}.` },
  { key: 'student_benefit_expiring', version: '1.0.0', channel: 'SYSTEM', subject: 'Quyền lợi sinh viên PERSONAL PLUS sắp kết thúc', title: 'Nhắc hạn quyền lợi sinh viên', ctaLabel: 'Quản lý gói dịch vụ', summary: (v) => `Quyền lợi sinh viên PERSONAL PLUS của bạn sẽ kết thúc vào ngày ${v.expiresAt || ''}. Nếu không đăng ký gói trả phí, tài khoản sẽ tự động chuyển về PERSONAL FREE.` },
  { key: 'student_benefit_expired', version: '1.0.0', channel: 'SYSTEM', subject: 'Quyền lợi sinh viên PERSONAL PLUS đã kết thúc', title: 'Chuyển đổi về gói PERSONAL FREE', ctaLabel: 'Xem trạng thái gói', summary: (v) => `Thời hạn 03 tháng quyền lợi sinh viên đã kết thúc. Tài khoản của bạn đã được hệ thống tự động cập nhật về gói PERSONAL FREE.` },
  { key: 'course_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo cập nhật khóa học trên WORD BRIDGE', title: 'Thông báo khóa học', ctaLabel: 'Mở khóa học', summary: (v) => `Khóa học ${v.courseTitle || ''} có cập nhật nội dung mới hoặc lịch học mới.` },
  { key: 'study_schedule_reminder', version: '1.0.0', channel: 'SYSTEM', subject: 'Nhắc lịch học hôm nay trên WORD BRIDGE', title: 'Đến giờ học ngoại ngữ', ctaLabel: 'Tiếp tục lộ trình', summary: (v) => `Bạn có mục tiêu học ${v.goalMinutes || 20} phút hôm nay cho chương trình ${v.programTitle || 'WORD BRIDGE'}.` },
  { key: 'vocabulary_review_reminder', version: '1.0.0', channel: 'SYSTEM', subject: 'Nhắc ôn tập từ vựng đến hạn trên WORD BRIDGE', title: 'Từ vựng đến hạn ôn tập ngắt quãng', ctaLabel: 'Ôn tập từ vựng ngay', summary: (v) => `Bạn hiện có ${v.dueCount || 0} mục từ trong Sổ từ vựng cá nhân đã đến chu kỳ ôn tập.` },
  { key: 'practice_result_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Kết quả bài luyện tập trên WORD BRIDGE', title: 'Đã ghi nhận kết quả luyện tập', ctaLabel: 'Xem chi tiết kết quả', summary: (v) => `Bạn đã hoàn thành bài luyện tập "${v.exerciseTitle || ''}" với trạng thái chấm: ${v.gradingStatus || 'đã chấm'}.` },
  { key: 'learner_meet_session_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo phiên thực hành Learner Meet', title: 'Thông tin phiên Learner Meet', ctaLabel: 'Mở danh sách phiên', summary: (v) => `Phiên thực hành "${v.topic || ''}" (Mã: ${v.sessionCode || ''}) đã được tạo. Learner Meet không có chat, không chia sẻ màn hình và không ghi âm/ghi hình từ nền tảng.` },
  { key: 'support_request_confirmation', version: '1.0.0', channel: 'CSKH', subject: 'WORD BRIDGE CSKH đã tiếp nhận yêu cầu hỗ trợ của bạn', title: 'Xác nhận tiếp nhận yêu cầu hỗ trợ', ctaLabel: 'Mở Trung tâm trợ giúp', summary: (v) => `Xin chào ${v.senderName || 'bạn'}, đội ngũ Chăm sóc khách hàng đã nhận yêu cầu mã #${v.ticketId || ''} với tiêu đề "${v.subject || ''}".` },
  { key: 'support_response', version: '1.0.0', channel: 'CSKH', subject: 'Phản hồi từ đội ngũ Chăm sóc khách hàng WORD BRIDGE', title: 'Phản hồi yêu cầu hỗ trợ', ctaLabel: 'Xem trung tâm trợ giúp', summary: (v) => v.replyBody || 'Đội ngũ CSKH WORD BRIDGE đã cập nhật kết quả xử lý cho yêu cầu hỗ trợ của bạn.' },
  { key: 'contact_partnership_confirmation', version: '1.0.0', channel: 'CONTACT', subject: 'WORD BRIDGE đã tiếp nhận thông tin liên hệ và hợp tác', title: 'Xác nhận tiếp nhận liên hệ', ctaLabel: 'Truy cập WORD BRIDGE', summary: (v) => `Xin chào ${v.senderName || 'Quý đối tác'}, bộ phận Liên hệ & Hợp tác (contact@wordbridge.vn) đã nhận được thông điệp "${v.subject || ''}" của bạn.` },
  { key: 'maintenance_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo bảo trì định kỳ hệ thống WORD BRIDGE', title: 'Lịch bảo trì hệ thống', ctaLabel: 'Xem trạng thái hệ thống', summary: (v) => `Hệ thống WORD BRIDGE dự kiến bảo trì trong khung giờ ${v.window || 'theo thông báo quản trị'} để nâng cấp hạ tầng an toàn.` },
  { key: 'system_error_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo sự cố kỹ thuật hệ thống WORD BRIDGE', title: 'Thông báo khắc phục sự cố', ctaLabel: 'Liên hệ hỗ trợ', summary: (v) => `Hệ thống ghi nhận sự cố ảnh hưởng tạm thời: ${v.detail || 'Đang được đội ngũ kỹ thuật xử lý'}.` },
  { key: 'policy_change_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo cập nhật điều khoản và chính sách WORD BRIDGE', title: 'Cập nhật chính sách nền tảng', ctaLabel: 'Xem chính sách', summary: (v) => `WORD BRIDGE cập nhật ${v.policyName || 'Chính sách quyền riêng tư & Điều khoản sử dụng'} có hiệu lực từ ${v.effectiveDate || ''}.` },
  { key: 'account_restricted_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Thông báo tạm giới hạn tài khoản WORD BRIDGE', title: 'Tài khoản bị giới hạn tạm thời', ctaLabel: 'Liên hệ CSKH', summary: (v) => `Tài khoản của bạn tạm thời bị giới hạn do: ${v.reason || 'yêu cầu xác minh bảo mật'}. Vui lòng liên hệ cskh@wordbridge.vn để được hỗ trợ.` },
  { key: 'account_recovered_notice', version: '1.0.0', channel: 'SYSTEM', subject: 'Tài khoản WORD BRIDGE của bạn đã được khôi phục', title: 'Khôi phục tài khoản thành công', ctaLabel: 'Đăng nhập ngay', summary: (v) => `Quy trình khôi phục tài khoản của bạn đã hoàn tất an toàn lúc ${v.timestamp || new Date().toISOString()}.` },
];

export const EMAIL_TEMPLATE_MAP = new Map(TEMPLATE_SPECS.map((t) => [t.key, t]));
export const EMAIL_TEMPLATE_KEYS = TEMPLATE_SPECS.map((t) => t.key);

export function renderEmailTemplate(templateKey, variables = {}, options = {}) {
  const spec = EMAIL_TEMPLATE_MAP.get(templateKey);
  if (!spec) {
    throw new Error(`Email template không tồn tại: ${templateKey}`);
  }
  const channel = EMAIL_CHANNELS[spec.channel];
  const summaryText = spec.summary(variables);
  const extraHtml = variables.extraHtml || '';
  const bodyHtml = `<p style="margin:0 0 14px;">${escapeEmailHtml(summaryText)}</p>${extraHtml}`;
  const rendered = renderEmailLayout({
    title: spec.title,
    preheader: summaryText.slice(0, 110),
    bodyHtml,
    bodyText: summaryText,
    ctaLabel: variables.ctaUrl ? (variables.ctaLabel || spec.ctaLabel) : null,
    ctaUrl: variables.ctaUrl || null,
    senderAddress: channel.senderAddress,
    replyToAddress: channel.replyTo,
    officialSvgUrl: options.officialSvgUrl || null,
  });

  return {
    templateKey: spec.key,
    templateVersion: spec.version,
    from: channel.from,
    senderAddress: channel.senderAddress,
    replyTo: channel.replyTo,
    subject: variables.subjectOverride || spec.subject,
    html: rendered.html,
    text: rendered.text,
  };
}
