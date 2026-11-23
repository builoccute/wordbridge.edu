/**
 * WORD BRIDGE V4.2 — Unified Error Pages System (400–504 & Cloudflare 1101 Worker Exception)
 * Designed according to UI Reference Images #03 (1101), #12 (404), #20 (Error Pages System).
 * Strict Rule: Code 1101 is ALWAYS handled as Cloudflare Worker Runtime Exception — NEVER as invalid login session.
 * Never exposes stack traces, secrets, tokens, or internal admin paths.
 */

import { renderPublicPage } from '../layouts/site-layout.js';
import { escapeHtml } from '../utils/validation.js';
import { htmlResponse } from '../utils/http.js';

export const ERROR_CATALOG = Object.freeze({
  400: {
    code: '400',
    httpStatus: 400,
    title: 'Yêu cầu không hợp lệ',
    description: 'Dữ liệu hoặc tham số gửi lên chưa đúng định dạng. Vui lòng kiểm tra lại thông tin và thử lại.',
    primaryAction: { label: 'Về Trang chủ', href: '/' },
    secondaryAction: { label: 'Trung Tâm Trợ Giúp', href: '/help' },
    icon: 'browser-warn',
  },
  401: {
    code: '401',
    httpStatus: 401,
    title: 'Vui lòng đăng nhập',
    description: 'Phiên làm việc đã hết hạn hoặc trang này yêu cầu bạn đăng nhập tài khoản WORD BRIDGE để tiếp tục.',
    primaryAction: { label: 'Đăng nhập', href: '/login' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'browser-user',
  },
  403: {
    code: '403',
    httpStatus: 403,
    title: 'Không đủ quyền truy cập',
    description: 'Tài khoản hiện tại không có quyền truy cập nội dung này. Vui lòng kiểm tra lại tài khoản hoặc quay về trang chủ.',
    primaryAction: { label: 'Về Trang chủ', href: '/' },
    secondaryAction: { label: 'Đăng nhập tài khoản khác', href: '/login' },
    icon: 'browser-lock',
  },
  404: {
    code: '404',
    httpStatus: 404,
    title: 'Không tìm thấy trang',
    description: 'Trang bạn đang truy cập không tồn tại, đã được di chuyển hoặc tạm thời không khả dụng.',
    primaryAction: { label: 'Về Trang chủ', href: '/' },
    secondaryAction: { label: 'Khám phá Học tập', href: '/learning' },
    icon: 'browser-x',
  },
  408: {
    code: '408',
    httpStatus: 408,
    title: 'Hết thời gian chờ',
    description: 'Yêu cầu mất quá nhiều thời gian để hoàn tất. Vui lòng kiểm tra kết nối mạng và thử lại.',
    primaryAction: { label: 'Thử lại', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'clock',
  },
  409: {
    code: '409',
    httpStatus: 409,
    title: 'Xung đột dữ liệu',
    description: 'Thông tin bạn gửi lên đang xung đột với trạng thái dữ liệu hiện tại. Vui lòng tải lại trang và thực hiện lại.',
    primaryAction: { label: 'Tải lại trang', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'browser-warn',
  },
  410: {
    code: '410',
    httpStatus: 410,
    title: 'Nội dung không còn khả dụng',
    description: 'Mục này đã được điều chỉnh khỏi phạm vi sản phẩm hiện tại của WORD BRIDGE. Mời bạn tiếp tục tại Hệ thống Học tập Trung – Anh hoặc Cổng Luyện Tập.',
    primaryAction: { label: 'Khám phá Học tập', href: '/learning' },
    secondaryAction: { label: 'Vào Cổng Luyện Tập', href: '/practice' },
    icon: 'browser-x',
  },
  413: {
    code: '413',
    httpStatus: 413,
    title: 'Tệp quá lớn',
    description: 'Dung lượng tệp hoặc dữ liệu tải lên vượt quá giới hạn cho phép. Vui lòng chọn tệp nhỏ hơn và thử lại.',
    primaryAction: { label: 'Quay lại', href: '/' },
    secondaryAction: { label: 'Trung Tâm Trợ Giúp', href: '/help' },
    icon: 'browser-warn',
  },
  415: {
    code: '415',
    httpStatus: 415,
    title: 'Định dạng không hỗ trợ',
    description: 'Định dạng tệp hoặc kiểu dữ liệu gửi lên chưa được hệ thống hỗ trợ. Vui lòng sử dụng định dạng hợp lệ.',
    primaryAction: { label: 'Về Trang chủ', href: '/' },
    secondaryAction: { label: 'Trung Tâm Trợ Giúp', href: '/help' },
    icon: 'browser-warn',
  },
  422: {
    code: '422',
    httpStatus: 422,
    title: 'Dữ liệu chưa hợp lệ',
    description: 'Một số trường thông tin chưa đáp ứng yêu cầu kiểm tra. Vui lòng xem lại dữ liệu nhập và thử lại.',
    primaryAction: { label: 'Về Trang chủ', href: '/' },
    secondaryAction: { label: 'Trung Tâm Trợ Giúp', href: '/help' },
    icon: 'browser-warn',
  },
  429: {
    code: '429',
    httpStatus: 429,
    title: 'Quá nhiều yêu cầu',
    description: 'Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng chờ một lát rồi thử lại.',
    primaryAction: { label: 'Thử lại sau', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'speed',
  },
  500: {
    code: '500',
    httpStatus: 500,
    title: 'Lỗi hệ thống',
    description: 'Đã xảy ra sự cố trong quá trình xử lý yêu cầu. Không có dữ liệu nào bị ghi sai lệch. Vui lòng thử lại sau ít phút.',
    primaryAction: { label: 'Thử lại', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'server-alert',
  },
  502: {
    code: '502',
    httpStatus: 502,
    title: 'Lỗi kết nối trung gian',
    description: 'Hệ thống gặp gián đoạn khi kết nối dịch vụ trung gian. Vui lòng tải lại trang sau vài giây.',
    primaryAction: { label: 'Thử lại', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'server-alert',
  },
  503: {
    code: '503',
    httpStatus: 503,
    title: 'Dịch vụ tạm thời chưa khả dụng',
    description: 'WORD BRIDGE đang bảo trì hoặc cập nhật dịch vụ để mang đến trải nghiệm tốt hơn. Vui lòng quay lại sau ít phút.',
    primaryAction: { label: 'Quay lại sau', href: '/' },
    secondaryAction: { label: 'Trung Tâm Trợ Giúp', href: '/help' },
    icon: 'browser-gear',
  },
  504: {
    code: '504',
    httpStatus: 504,
    title: 'Hết thời gian phản hồi',
    description: 'Máy chủ phản hồi chậm hơn dự kiến. Vui lòng thử lại sau giây lát.',
    primaryAction: { label: 'Thử lại', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'clock',
  },
  1101: {
    code: '1101',
    httpStatus: 500,
    title: 'Sự cố thực thi hệ thống (Worker Exception)',
    description: 'Cloudflare Worker gặp ngoại lệ trong quá trình xử lý yêu cầu (mã 1101). Sự cố đã được ghi nhận nội bộ để đội ngũ kỹ thuật kiểm tra; vui lòng thử tải lại trang hoặc quay về trang chủ.',
    primaryAction: { label: 'Tải lại trang', href: '' },
    secondaryAction: { label: 'Về Trang chủ', href: '/' },
    icon: 'worker-alert',
  },
});

function renderErrorIcon(kind) {
  switch (kind) {
    case 'browser-lock':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><rect x="4" y="6" width="76" height="54" rx="10" stroke="#146466" stroke-width="3.5"/><line x1="4" y1="20" x2="80" y2="20" stroke="#146466" stroke-width="3"/><circle cx="15" cy="13" r="2.2" fill="#146466"/><circle cx="24" cy="13" r="2.2" fill="#146466"/><circle cx="33" cy="13" r="2.2" fill="#146466"/><rect x="31" y="34" width="22" height="16" rx="4" stroke="#146466" stroke-width="3"/><path d="M36 34v-4a6 6 0 1 1 12 0v4" stroke="#146466" stroke-width="3"/><circle cx="42" cy="42" r="2" fill="#C92F1C"/></svg>`;
    case 'browser-user':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><rect x="4" y="6" width="76" height="54" rx="10" stroke="#146466" stroke-width="3.5"/><line x1="4" y1="20" x2="80" y2="20" stroke="#146466" stroke-width="3"/><circle cx="42" cy="34" r="7" stroke="#146466" stroke-width="3"/><path d="M29 52c2.5-6 8-9 13-9s10.5 3 13 9" stroke="#146466" stroke-width="3" stroke-linecap="round"/></svg>`;
    case 'browser-gear':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><rect x="4" y="6" width="76" height="54" rx="10" stroke="#146466" stroke-width="3.5"/><line x1="4" y1="20" x2="80" y2="20" stroke="#146466" stroke-width="3"/><circle cx="42" cy="40" r="8" stroke="#146466" stroke-width="3"/><path d="M42 27v4M42 49v4M29 40h4M51 40h4M33 31l3 3M48 46l3 3M51 31l-3 3M36 46l-3 3" stroke="#146466" stroke-width="2.8" stroke-linecap="round"/></svg>`;
    case 'speed':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><path d="M14 50a28 28 0 1 1 56 0" stroke="#146466" stroke-width="3.5" stroke-linecap="round"/><path d="M42 46l15-16" stroke="#C92F1C" stroke-width="3.8" stroke-linecap="round"/><circle cx="42" cy="46" r="4.5" fill="#146466"/></svg>`;
    case 'server-alert':
    case 'worker-alert':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><rect x="8" y="8" width="52" height="14" rx="4" stroke="#146466" stroke-width="3"/><rect x="8" y="27" width="52" height="14" rx="4" stroke="#146466" stroke-width="3"/><rect x="8" y="46" width="40" height="14" rx="4" stroke="#146466" stroke-width="3"/><circle cx="17" cy="15" r="2" fill="#146466"/><circle cx="17" cy="34" r="2" fill="#146466"/><circle cx="17" cy="53" r="2" fill="#146466"/><path d="M62 28l16 28H46l16-28Z" fill="#FFF5F3" stroke="#C92F1C" stroke-width="3.2" stroke-linejoin="round"/><path d="M62 39v7" stroke="#C92F1C" stroke-width="3" stroke-linecap="round"/><circle cx="62" cy="51" r="1.8" fill="#C92F1C"/></svg>`;
    case 'clock':
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><circle cx="42" cy="34" r="24" stroke="#146466" stroke-width="3.5"/><path d="M42 20v15l10 6" stroke="#C92F1C" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/></svg>`;
    default:
      return `<svg class="wb-error-svg" viewBox="0 0 84 68" fill="none" aria-hidden="true"><rect x="4" y="6" width="76" height="54" rx="10" stroke="#146466" stroke-width="3.5"/><line x1="4" y1="20" x2="80" y2="20" stroke="#146466" stroke-width="3"/><circle cx="60" cy="44" r="12" fill="#FFF5F3" stroke="#C92F1C" stroke-width="3.2"/><path d="M55 39l10 10M65 39l-10 10" stroke="#C92F1C" stroke-width="3" stroke-linecap="round"/></svg>`;
  }
}

export function renderErrorPage({
  code = 404,
  currentPath = '/',
  user = null,
  runtime = null,
  requestId = '',
  customMessage = '',
}) {
  const entry = ERROR_CATALOG[code] || ERROR_CATALOG[500];
  const primaryHref = entry.primaryAction.href || currentPath || '/';
  const desc = customMessage || entry.description;
  const refBadge = requestId
    ? `<p class="wb-error-ref">Mã tham chiếu yêu cầu: <code>${escapeHtml(requestId)}</code></p>`
    : '';

  const contentHtml = `
    <section class="wb-error-stage" role="alert" aria-live="polite">
      <div class="wb-error-visual">
        ${renderErrorIcon(entry.icon)}
        <div class="wb-error-code-display">${escapeHtml(entry.code)}</div>
        <div class="wb-error-underline" aria-hidden="true"></div>
      </div>
      <h1 class="wb-error-heading">${escapeHtml(entry.title)}</h1>
      <p class="wb-error-copy">${escapeHtml(desc)}</p>
      ${refBadge}
      <div class="wb-error-actions">
        <a href="${escapeHtml(primaryHref)}" class="wb-btn wb-btn-primary">${escapeHtml(entry.primaryAction.label)}</a>
        <a href="${escapeHtml(entry.secondaryAction.href)}" class="wb-btn wb-btn-outline">${escapeHtml(entry.secondaryAction.label)}</a>
      </div>
    </section>
  `;

  return htmlResponse(
    renderPublicPage({
      title: `${entry.code} — ${entry.title}`,
      description: entry.description,
      currentPath,
      user,
      runtime,
      contentHtml,
    }),
    entry.httpStatus
  );
}
