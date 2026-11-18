/**
 * @file src/ui/assets.js
 * @description Quản lý tài nguyên thương hiệu tĩnh của Word Bridge Translation (Logo chính thức).
 * Phục vụ trực tiếp từ bộ nhớ Worker hoặc thư mục `public/assets/logo.jpg` mà không cần
 * truy cập dữ liệu người dùng trên Cloudflare R2.
 */

import * as fs from "node:fs";
import * as path from "node:path";

let cachedLogoBytes = null;

/**
 * Vector SVG chuẩn hóa theo đúng thiết kế Logo.jpg của Word Bridge:
 * Biểu tượng cây cầu đỏ 3 nhịp bắc qua trang sách mở màu xanh ngọc & xanh cổ vịt,
 * kèm chữ WORD (xanh đậm #094c59) BRIDGE (đỏ #d60f19) và slogan "Where Languages Bring People Together."
 */
export const WORD_BRIDGE_LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 680 180" width="100%" height="100%" role="img" aria-label="WORD BRIDGE - Where Languages Bring People Together">
  <rect width="680" height="180" fill="#ffffff" rx="12"/>
  <g transform="translate(24, 18)">
    <!-- Vòm cầu đỏ -->
    <path d="M 16 88 A 88 76 0 0 1 184 88" fill="none" stroke="#d1101a" stroke-width="11" stroke-linecap="round"/>
    <!-- 3 trụ cầu thẳng đứng -->
    <line x1="65" y1="36" x2="65" y2="88" stroke="#d1101a" stroke-width="9" stroke-linecap="round"/>
    <line x1="100" y1="24" x2="100" y2="96" stroke="#d1101a" stroke-width="9" stroke-linecap="round"/>
    <line x1="135" y1="36" x2="135" y2="88" stroke="#d1101a" stroke-width="9" stroke-linecap="round"/>
    <!-- Trang sách trên (Xanh ngọc #2994a3) -->
    <path d="M 10 96 Q 55 82 100 105 Q 145 82 190 96 L 184 114 Q 145 100 100 122 Q 55 100 16 114 Z" fill="#2994a3"/>
    <!-- Trang sách dưới (Xanh cổ vịt đậm #084c59) -->
    <path d="M 6 122 Q 55 108 100 130 Q 145 108 194 122 L 188 136 Q 145 122 100 142 Q 55 122 12 136 Z" fill="#084c59"/>
  </g>
  <!-- Chữ WORD BRIDGE -->
  <text x="235" y="92" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="56" font-weight="900" letter-spacing="1">
    <tspan fill="#084c59">WORD</tspan>
    <tspan dx="10" fill="#d1101a">BRIDGE</tspan>
  </text>
  <!-- Slogan -->
  <text x="237" y="134" font-family="Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif" font-size="22" font-weight="500" fill="#0d5663">
    Where Languages Bring People Together.
  </text>
</svg>`;

export function getLogoAsset() {
  if (cachedLogoBytes) {
    return { bytes: cachedLogoBytes, contentType: "image/jpeg" };
  }
  try {
    const candidatePaths = [
      path.resolve(process.cwd(), "public/assets/logo.jpg"),
      path.resolve(process.cwd(), "word-bridge-translation/public/assets/logo.jpg")
    ];
    for (const p of candidatePaths) {
      if (fs.existsSync(p)) {
        cachedLogoBytes = new Uint8Array(fs.readFileSync(p));
        return { bytes: cachedLogoBytes, contentType: "image/jpeg" };
      }
    }
  } catch (_) {
    // Trong môi trường Worker thuần không có fs cục bộ, trả về SVG chuẩn thương hiệu
  }
  return {
    bytes: new TextEncoder().encode(WORD_BRIDGE_LOGO_SVG),
    contentType: "image/svg+xml; charset=utf-8"
  };
}
