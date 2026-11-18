/**
 * @file src/server.js
 * @description Máy chủ HTTP cục bộ (Node.js >= 20) phục vụ phát triển và kiểm thử tích hợp.
 * Chuyển đổi trực tiếp Node HTTP Request/Response sang chuẩn Fetch API của Cloudflare Worker.
 */

import * as http from "node:http";
import workerHandler from "./worker.js";
import { EphemeralD1MetricsStore } from "./db/d1-metrics.js";

export function createNodeTestServer(customEnv = {}) {
  const sharedD1 = customEnv.DB || new EphemeralD1MetricsStore(0);
  const env = {
    APP_NAME: "Dịch thuật Word Bridge",
    PUBLIC_DOMAIN: "https://dichthuat.wordbridge.io.vn",
    ZERO_USER_DATA_STORAGE: "true",
    DB: sharedD1,
    R2: customEnv.R2 || { bucketName: "word" },
    ...customEnv
  };

  const server = http.createServer(async (req, res) => {
    try {
      const host = req.headers.host || "localhost:8787";
      const fullUrl = `http://${host}${req.url || "/"}`;

      const chunks = [];
      for await (const chunk of req) {
        chunks.push(chunk);
      }
      const bodyBuffer = Buffer.concat(chunks);

      const headers = new Headers();
      for (const [k, v] of Object.entries(req.headers)) {
        if (Array.isArray(v)) {
          headers.set(k, v.join(", "));
        } else if (typeof v === "string") {
          headers.set(k, v);
        }
      }

      const method = (req.method || "GET").toUpperCase();
      const fetchReq = new Request(fullUrl, {
        method,
        headers,
        body: ["GET", "HEAD"].includes(method) ? undefined : bodyBuffer
      });

      const workerRes = await workerHandler.fetch(fetchReq, env, {});
      res.statusCode = workerRes.status;
      workerRes.headers.forEach((val, key) => {
        res.setHeader(key, val);
      });

      const arrayBuf = await workerRes.arrayBuffer();
      res.end(Buffer.from(arrayBuf));
    } catch (_) {
      res.statusCode = 500;
      res.setHeader("Content-Type", "application/json; charset=utf-8");
      res.end(JSON.stringify({ ok: false, code: "ERR_SERVER_ADAPTER" }));
    }
  });

  return { server, env };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const port = Number(process.env.PORT || 8787);
  const { server } = createNodeTestServer();
  server.listen(port, () => {
    console.log(
      `[Word Bridge Translation] Server đang chạy tại http://localhost:${port} (Zero User Data Storage: ENFORCED)`
    );
  });
}
