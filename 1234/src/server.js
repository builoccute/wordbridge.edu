import http from 'node:http';
import fs from 'node:fs';
import { path } from './config/runtime.js';
import { EMBEDDED_INDEX_HTML } from './config/embedded-data.js';
import { BRAND } from './config/constants.js';
import { PORT } from './config/env.js';
import {
  checkRateLimit,
  applySecurityHeaders
} from './security/defense.middleware.js';
import {
  dispatchApiRequest,
  extractAuthContextFromHeaders,
  renderMaintenanceHtml,
  services
} from './app.dispatcher.js';

const { adminMod } = services;

function sendJson(res, statusCode, payload, extraHeaders = {}) {
  applySecurityHeaders(res);
  for (const [k, v] of Object.entries(extraHeaders)) {
    res.setHeader(k, v);
  }
  res.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  res.end(JSON.stringify(payload));
}

function readJsonBody(req) {
  return new Promise((resolve, reject) => {
    let raw = '';
    req.on('data', chunk => {
      raw += chunk;
      if (raw.length > 16 * 1024 * 1024) {
        reject(new Error('Dữ liệu gửi lên vượt quá giới hạn cho phép.'));
      }
    });
    req.on('end', () => {
      if (!raw) return resolve({ raw: '', json: {} });
      try {
        resolve({ raw, json: JSON.parse(raw) });
      } catch (_) {
        reject(new Error('Định dạng JSON đầu vào không hợp lệ.'));
      }
    });
    req.on('error', reject);
  });
}

async function handleRequest(req, res) {
  try {
    const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    const pathname = parsedUrl.pathname;
    const ip = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1';

    if (pathname === '/su-kien' || pathname.startsWith('/su-kien/') || pathname === '/api/events' || pathname.startsWith('/api/events/')) {
      return sendJson(res, 404, {
        ok: false,
        error: 'Mục Sự kiện đã được loại bỏ hoàn toàn khỏi kiến trúc WORD BRIDGE. Các thử thách và lịch sinh hoạt nội bộ được tổ chức trong không gian Nhóm hoặc Tổ chức.'
      });
    }

    const rateCheck = checkRateLimit(ip, pathname);
    if (!rateCheck.allowed) {
      res.setHeader('Retry-After', String(rateCheck.retryAfterSeconds));
      return sendJson(res, 429, {
        ok: false,
        error: `Quá giới hạn tần suất truy cập (${rateCheck.bucket}). Vui lòng thử lại sau ${rateCheck.retryAfterSeconds} giây.`
      });
    }

    const cwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '/';
    const frontendRoot = path.resolve(cwd, 'src/frontend');
    if (pathname.startsWith('/assets/') || pathname.startsWith('/css/') || pathname.startsWith('/js/')) {
      const rel = pathname.slice(1);
      if (rel.includes('..')) {
        return sendJson(res, 400, { ok: false, error: 'Đường dẫn không hợp lệ.' });
      }
      const filePath = path.join(frontendRoot, rel);
      if (fs && fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
        const ext = path.extname(filePath).toLowerCase();
        const mimeMap = {
          '.svg': 'image/svg+xml; charset=utf-8',
          '.css': 'text/css; charset=utf-8',
          '.js': 'application/javascript; charset=utf-8',
          '.html': 'text/html; charset=utf-8',
          '.json': 'application/json; charset=utf-8'
        };
        applySecurityHeaders(res);
        res.writeHead(200, { 'Content-Type': mimeMap[ext] || 'application/octet-stream' });
        return res.end(fs.readFileSync(filePath));
      }
      return sendJson(res, 404, { ok: false, error: 'Không tìm thấy tài nguyên tĩnh.' });
    }

    const authInfo = extractAuthContextFromHeaders(req.headers, pathname);
    const currentUser = authInfo.authCtx ? authInfo.authCtx.user : null;

    const maint = adminMod.getMaintenanceState();
    const isTechAdmin = currentUser && ['super_admin', 'system_admin'].includes(currentUser.role);
    const isMaintBypassRoute =
      pathname.startsWith('/quan-tri') ||
      pathname.startsWith('/dang-nhap') ||
      pathname.startsWith('/api/auth') ||
      pathname.startsWith('/api/admin') ||
      pathname === '/api/system/bootstrap';

    if (!isTechAdmin && !isMaintBypassRoute) {
      if (maint.mode === 'maintenance_all' || maint.mode === 'suspended' || maint.mode === 'emergency') {
        if (pathname.startsWith('/api/')) {
          return sendJson(res, 503, {
            ok: false,
            maintenance: true,
            title: maint.title,
            reason: maint.reason,
            scheduled_end: maint.scheduled_end,
            notice: maint.notice_content
          });
        }
        applySecurityHeaders(res);
        res.writeHead(503, { 'Content-Type': 'text/html; charset=utf-8' });
        return res.end(renderMaintenanceHtml(maint));
      }
      if (maint.mode === 'maintenance_module' && Array.isArray(maint.affected_modules)) {
        for (const modPrefix of maint.affected_modules) {
          if (pathname.startsWith(modPrefix)) {
            return sendJson(res, 503, {
              ok: false,
              maintenance: true,
              affected_module: modPrefix,
              title: maint.title,
              reason: maint.reason,
              scheduled_end: maint.scheduled_end
            });
          }
        }
      }
    }

    if (pathname.startsWith('/api/')) {
      let bodyData = { raw: '', json: {} };
      if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(req.method)) {
        bodyData = await readJsonBody(req);
      }
      const query = Object.fromEntries(parsedUrl.searchParams.entries());
      const result = await dispatchApiRequest({
        method: req.method,
        pathname,
        query,
        body: bodyData.json || {},
        authInfo,
        ip,
        userAgent: req.headers['user-agent'] || ''
      });
      const extraHeaders = {};
      if (result.cookies && result.cookies.length > 0) {
        extraHeaders['Set-Cookie'] = result.cookies;
      }
      return sendJson(res, result.statusCode, result.payload, extraHeaders);
    }

    const indexHtmlPath = path.join(frontendRoot, 'index.html');
    if (fs && fs.existsSync(indexHtmlPath)) {
      applySecurityHeaders(res);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
      return res.end(fs.readFileSync(indexHtmlPath));
    }

    applySecurityHeaders(res);
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    return res.end(EMBEDDED_INDEX_HTML);
  } catch (err) {
    const statusCode = err.statusCode || 400;
    return sendJson(res, statusCode, {
      ok: false,
      error: err.message || 'Lỗi xử lý yêu cầu hệ thống.'
    });
  }
}

export function createAppServer() {
  return http.createServer(handleRequest);
}

export { services };

export {
  handleRequest,
  dispatchApiRequest,
  extractAuthContextFromHeaders
};

export default {
  createAppServer,
  handleRequest,
  dispatchApiRequest,
  extractAuthContextFromHeaders,
  services
};

const isMainEntry = typeof process !== 'undefined' && Array.isArray(process.argv) && process.argv[1] && process.argv[1].endsWith('server.js');
if (isMainEntry) {
  const srv = createAppServer();
  srv.listen(PORT, () => {
    console.log(`[WORD BRIDGE] Server running at http://localhost:${PORT} (Canonical: ${BRAND.CANONICAL_ORIGIN})`);
  });
}
