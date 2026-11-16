/**
 * WORD BRIDGE – UNIFIED CLOUDFLARE WORKER ENTRYPOINT (src/worker.js)
 * Chuẩn ES Module Worker (`export default`) tương thích 100% với Cloudflare Wrangler 4.x (`wrangler@4.162.0`):
 * - Worker Name: "wordbridge-edu" (https://wordbridge.io.vn)
 * - Cloudflare D1 Binding: env.DB (database_name = "word", database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771")
 * - Cloudflare R2 Binding: env.R2 (bucket_name = "word")
 * - Không chứa bất kỳ static import nào của "child_process", "crypto", "fs", "http", "path", "url".
 */

import serverModule from './server.js';
import { fs, path } from './utils/runtime.shim.js';

const EMBEDDED_SVGS = {
  '/assets/hero-globe-illustration.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 620 360" width="620" height="360" role="img" aria-label="Minh họa Địa cầu và Sách ngoại ngữ WORD BRIDGE">
  <defs>
    <linearGradient id="bgWave" x1="0" y1="0" x2="1" y2="1">
      <stop offset="0%" stop-color="#EBF6F6"/>
      <stop offset="100%" stop-color="#D4ECEB"/>
    </linearGradient>
  </defs>
  <rect width="620" height="360" rx="22" fill="url(#bgWave)"/>
  <path d="M0 305 Q180 240 360 285 T620 255 L620 360 L0 360 Z" fill="#146466" opacity="0.14"/>
  <path d="M200 335 Q380 250 620 285 L620 360 L200 360 Z" fill="#C92F1C" opacity="0.88"/>
  <path d="M40 280 C120 155, 290 155, 370 280" fill="none" stroke="#B7E1E0" stroke-width="8"/>
  <line x1="120" y1="198" x2="120" y2="280" stroke="#B7E1E0" stroke-width="5"/>
  <line x1="175" y1="184" x2="175" y2="280" stroke="#B7E1E0" stroke-width="5"/>
  <line x1="230" y1="184" x2="230" y2="280" stroke="#B7E1E0" stroke-width="5"/>
  <line x1="285" y1="198" x2="285" y2="280" stroke="#B7E1E0" stroke-width="5"/>
  <g transform="translate(88, 195)">
    <rect x="0" y="76" width="150" height="30" rx="6" fill="#146466"/>
    <rect x="10" y="81" width="130" height="20" rx="3" fill="#FFFDF7"/>
    <rect x="12" y="46" width="140" height="30" rx="6" fill="#E09F3E"/>
    <rect x="20" y="51" width="124" height="20" rx="3" fill="#FFFDF7"/>
    <rect x="22" y="18" width="130" height="28" rx="6" fill="#C92F1C"/>
    <rect x="30" y="23" width="114" height="18" rx="3" fill="#FFFDF7"/>
  </g>
  <g transform="translate(215, 215)">
    <path d="M0 10 Q48 0 96 14 L96 86 Q48 72 0 82 Z" fill="#FFFDF7" stroke="#D9A05B" stroke-width="3"/>
    <path d="M96 14 Q144 0 192 10 L192 82 Q144 72 96 86 Z" fill="#FFFDF7" stroke="#D9A05B" stroke-width="3"/>
    <text x="125" y="48" font-family="'Be Vietnam Pro', sans-serif" font-size="28" font-weight="800" fill="#146466">A</text>
    <text x="148" y="68" font-family="'Noto Sans SC', sans-serif" font-size="24" font-weight="800" fill="#E07A2E">文</text>
  </g>
  <g transform="translate(430, 156)">
    <circle cx="0" cy="0" r="76" fill="#78C2AD" stroke="#146466" stroke-width="3.5"/>
    <path d="M-50 -28 Q-20 -52 15 -22 Q40 0 22 40 Q-12 56 -40 22 Z" fill="#1F7A6E" opacity="0.88"/>
    <path d="M28 -48 Q56 -28 50 12 Q34 24 22 -12 Z" fill="#1F7A6E" opacity="0.85"/>
    <path d="M-62 -62 A88 88 0 0 0 62 62" fill="none" stroke="#C87D3B" stroke-width="8" stroke-linecap="round"/>
    <rect x="-14" y="84" width="28" height="20" fill="#C87D3B"/>
    <rect x="-44" y="100" width="88" height="14" rx="7" fill="#9C5B23"/>
  </g>
  <g transform="translate(515, 218)">
    <rect x="0" y="20" width="58" height="68" rx="8" fill="#F7F3E8" stroke="#D5CBB8" stroke-width="2"/>
    <path d="M12 56 C20 42, 38 42, 46 56" fill="none" stroke="#C92F1C" stroke-width="3"/>
    <path d="M10 60 Q29 53 48 60 L45 66 Q29 59 13 66 Z" fill="#146466"/>
  </g>
  <g transform="translate(155, 32)">
    <rect x="0" y="0" width="82" height="36" rx="18" fill="#146466"/>
    <text x="41" y="23" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Hello!</text>
  </g>
  <g transform="translate(230, 66)">
    <rect x="0" y="0" width="96" height="36" rx="18" fill="#C92F1C"/>
    <text x="48" y="23" text-anchor="middle" font-family="'Be Vietnam Pro', sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">Xin chào!</text>
  </g>
  <g transform="translate(318, 22)">
    <rect x="0" y="0" width="108" height="36" rx="18" fill="#F6E6C2"/>
    <text x="54" y="23" text-anchor="middle" font-family="'Noto Sans KR', sans-serif" font-size="14" font-weight="700" fill="#182C2D">안녕하세요!</text>
  </g>
  <g transform="translate(262, 114)">
    <rect x="0" y="0" width="106" height="36" rx="18" fill="#1F7A6E"/>
    <text x="53" y="23" text-anchor="middle" font-family="'Noto Sans JP', sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">こんにちは!</text>
  </g>
  <g transform="translate(495, 34)">
    <rect x="0" y="0" width="78" height="36" rx="18" fill="#C92F1C"/>
    <text x="39" y="23" text-anchor="middle" font-family="'Noto Sans SC', sans-serif" font-size="15" font-weight="700" fill="#FFFFFF">你好!</text>
  </g>
  <g transform="translate(532, 134)">
    <rect x="0" y="0" width="82" height="36" rx="18" fill="#146466"/>
    <text x="41" y="23" text-anchor="middle" font-family="'Noto Sans', sans-serif" font-size="14" font-weight="700" fill="#FFFFFF">Привет!</text>
  </g>
</svg>`,
  '/assets/favicon.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64">
  <rect width="64" height="64" rx="14" fill="#146466"/>
  <path d="M10 34 C20 12, 44 12, 54 34" fill="none" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
  <line x1="24" y1="21" x2="24" y2="34" stroke="#C92F1C" stroke-width="3.5" stroke-linecap="round"/>
  <line x1="32" y1="17" x2="32" y2="34" stroke="#C92F1C" stroke-width="4" stroke-linecap="round"/>
  <line x1="40" y1="21" x2="40" y2="34" stroke="#C92F1C" stroke-width="3.5" stroke-linecap="round"/>
  <path d="M8 38 Q20 31 32 39 Q44 31 56 38 L53 46 Q42 39 32 47 Q22 39 11 46 Z" fill="#5AABA9"/>
  <path d="M7 47 Q20 41 32 49 Q44 41 57 47 L55 52 Q43 45 32 53 Q21 45 9 52 Z" fill="#E2E2C4"/>
</svg>`,
  '/assets/logo-vertical.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 260 150" width="260" height="150" role="img" aria-label="WORD BRIDGE Vertical Logo">
  <g transform="translate(80, 10)">
    <path d="M8 38 C24 6, 76 6, 92 38" fill="none" stroke="#C92F1C" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="33" y1="18" x2="33" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="50" y1="13" x2="50" y2="38" stroke="#C92F1C" stroke-width="5" stroke-linecap="round"/>
    <line x1="67" y1="18" x2="67" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z" fill="#5AABA9"/>
    <path d="M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z" fill="#146466"/>
  </g>
  <text x="130" y="105" text-anchor="middle" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="26" font-weight="800">
    <tspan fill="#146466">WORD </tspan><tspan fill="#C92F1C">BRIDGE</tspan>
  </text>
  <text x="130" y="128" text-anchor="middle" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="11" font-weight="600" fill="#2A4849">Where Languages Bring People Together.</text>
</svg>`,
  '/assets/logo-dark.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 78" width="380" height="78" role="img" aria-label="WORD BRIDGE - Where Languages Bring People Together.">
  <g transform="translate(6, 8)">
    <path d="M8 38 C24 6, 76 6, 92 38" fill="none" stroke="#C92F1C" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="33" y1="18" x2="33" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="50" y1="13" x2="50" y2="38" stroke="#C92F1C" stroke-width="5" stroke-linecap="round"/>
    <line x1="67" y1="18" x2="67" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z" fill="#5AABA9"/>
    <path d="M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z" fill="#E2E2C4"/>
  </g>
  <text x="116" y="42" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="30" font-weight="800" fill="#FFFFFF" letter-spacing="0.5">WORD</text>
  <text x="220" y="42" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="30" font-weight="800" fill="#FF5A43" letter-spacing="0.5">BRIDGE</text>
  <text x="116" y="61" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="12.5" font-weight="500" fill="#E2E2C4">Where Languages Bring People Together.</text>
</svg>`,
  '/assets/logo-light.svg': `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 380 78" width="380" height="78" role="img" aria-label="WORD BRIDGE - Where Languages Bring People Together.">
  <g transform="translate(6, 8)">
    <path d="M8 38 C24 6, 76 6, 92 38" fill="none" stroke="#C92F1C" stroke-width="5.5" stroke-linecap="round"/>
    <line x1="33" y1="18" x2="33" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <line x1="50" y1="13" x2="50" y2="38" stroke="#C92F1C" stroke-width="5" stroke-linecap="round"/>
    <line x1="67" y1="18" x2="67" y2="38" stroke="#C92F1C" stroke-width="4.5" stroke-linecap="round"/>
    <path d="M4 42 Q27 33 50 43 Q73 33 96 42 L92 52 Q71 43 50 53 Q29 43 8 52 Z" fill="#5AABA9"/>
    <path d="M2 53 Q26 45 50 55 Q74 45 98 53 L95 59 Q73 50 50 60 Q27 50 5 59 Z" fill="#146466"/>
  </g>
  <text x="116" y="42" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="30" font-weight="800" fill="#146466" letter-spacing="0.5">WORD</text>
  <text x="220" y="42" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="30" font-weight="800" fill="#C92F1C" letter-spacing="0.5">BRIDGE</text>
  <text x="116" y="61" font-family="'Be Vietnam Pro', 'Segoe UI', Arial, sans-serif" font-size="12.5" font-weight="600" fill="#2A4849">Where Languages Bring People Together.</text>
</svg>`
};

const workerHandler = {
  async fetch(request, env = {}, ctx = {}) {
    const url = new URL(request.url);
    const pathname = url.pathname;

    // 1. Bỏ hoàn toàn trang Sự kiện (/su-kien)
    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/') || pathname.startsWith('/api/events')) {
      return Response.json({
        ok: false,
        error: 'Mục Sự kiện đã được loại bỏ hoàn toàn khỏi kiến trúc WORD BRIDGE.'
      }, { status: 404 });
    }

    // 2. Phục vụ trực tiếp các file ảnh SVG thương hiệu
    if (EMBEDDED_SVGS[pathname]) {
      return new Response(EMBEDDED_SVGS[pathname], {
        status: 200,
        headers: {
          'Content-Type': 'image/svg+xml; charset=utf-8',
          'Cache-Control': 'public, max-age=86400'
        }
      });
    }

    // 3. Xử lý toàn bộ hệ thống API nghiệp vụ thông qua bộ điều phối thống nhất (dispatchApiRequest)
    if (pathname.startsWith('/api/') && serverModule && typeof serverModule.dispatchApiRequest === 'function') {
      try {
        const headersObj = {};
        if (request.headers && typeof request.headers.forEach === 'function') {
          request.headers.forEach((v, k) => { headersObj[k.toLowerCase()] = v; });
        }
        const authInfo = serverModule.extractAuthContextFromHeaders(headersObj, pathname);
        let body = {};
        if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(request.method)) {
          body = await request.json().catch(() => ({}));
        }
        const query = Object.fromEntries(url.searchParams.entries());
        const out = await serverModule.dispatchApiRequest({
          method: request.method,
          pathname,
          query,
          body,
          authInfo,
          ip: headersObj['cf-connecting-ip'] || headersObj['x-forwarded-for'] || '127.0.0.1',
          userAgent: headersObj['user-agent'] || '',
          workerEnv: env
        });
        if (env && env.DB && serverModule.services && serverModule.services.db) {
          const syncPromise = serverModule.services.db.flushToCloudflareD1(env.DB).catch(() => {});
          if (ctx && typeof ctx.waitUntil === 'function') {
            ctx.waitUntil(syncPromise);
          } else {
            await syncPromise;
          }
        }
        const respHeaders = new Headers({
          'Content-Type': 'application/json; charset=utf-8',
          'X-Content-Type-Options': 'nosniff',
          'X-Frame-Options': 'SAMEORIGIN'
        });
        if (out.cookies && out.cookies.length > 0) {
          for (const ck of out.cookies) {
            respHeaders.append('Set-Cookie', ck);
          }
        }
        return new Response(JSON.stringify(out.payload), {
          status: out.statusCode,
          headers: respHeaders
        });
      } catch (err) {
        return Response.json(
          { ok: false, error: err.message || 'Lỗi xử lý yêu cầu trên Worker.' },
          { status: err.statusCode || 400 }
        );
      }
    }

    // 4. Phục vụ tài nguyên tĩnh qua binding ASSETS của Cloudflare Workers
    if (env && env.ASSETS && typeof env.ASSETS.fetch === 'function') {
      const assetRes = await env.ASSETS.fetch(request);
      if (assetRes.status !== 404) return assetRes;
    }

    if (fs && path) {
      const cwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '/workspace';
      const indexHtmlPath = path.resolve(cwd, 'src/frontend/index.html');
      if (fs.existsSync(indexHtmlPath)) {
        return new Response(fs.readFileSync(indexHtmlPath, 'utf8'), {
          status: 200,
          headers: { 'Content-Type': 'text/html; charset=utf-8' }
        });
      }
    }

    return new Response('<!DOCTYPE html><html lang="vi"><head><meta charset="UTF-8"/><title>WORD BRIDGE</title></head><body><div id="wbAppRoot"></div></body></html>', {
      status: 200,
      headers: { 'Content-Type': 'text/html; charset=utf-8' }
    });
  }
};

export default workerHandler;
export { workerHandler };
