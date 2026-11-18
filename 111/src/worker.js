/**
 * @file src/worker.js
 * @description Điểm vào chính thức (ES Module Entrypoint) cho Cloudflare Workers
 * Dự án: Dịch thuật Word Bridge (https://dichthuat.wordbridge.io.vn)
 * Tương thích: Wrangler 4.x (`compatibility_flags = ["nodejs_compat"]`)
 */

import { dispatchRequest } from "./api/router.js";
import { NO_STORE_HEADERS, sanitizedLog } from "./security/privacy-shield.js";

const workerHandler = {
  async fetch(request, env = {}, ctx = {}) {
    try {
      return await dispatchRequest(request, env, ctx);
    } catch (err) {
      sanitizedLog("ERROR", "UNHANDLED_WORKER_EXCEPTION", {
        errorCode: err?.code || "ERR_INTERNAL"
      });
      return new Response(
        JSON.stringify({
          ok: false,
          code: "ERR_INTERNAL_SERVER",
          message: "Hệ thống gặp sự cố kỹ thuật tạm thời. Không có dữ liệu người dùng nào bị lưu lại."
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json; charset=utf-8",
            ...NO_STORE_HEADERS
          }
        }
      );
    }
  }
};

export default workerHandler;
