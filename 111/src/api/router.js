/**
 * @file src/api/router.js
 * @description Bộ định tuyến HTTP/Worker trung tâm của Dịch thuật Word Bridge (Trans).
 * Bao gồm:
 *   - Các API phục vụ giao diện Web (`/api/translate`, `/api/detect`, `/api/document/translate`, `/api/ocr/translate`)
 *   - Cổng Public & Ecosystem Translation API v1 của riêng Word Bridge (`/api/v1/translate`, `/api/v1/detect`,
 *     `/api/v1/languages`, `/api/v1/specs`) tích hợp Microservice NLLB-200 + CTranslate2 INT8 + 20 Chuyên ngành.
 */

import {
  incrementTotalAccesses,
  getTotalAccesses,
  inspectD1Database,
  isEligiblePageVisitRequest
} from "../db/d1-metrics.js";
import { inspectR2Preservation, createGuardedR2 } from "../security/r2-guard.js";
import {
  NO_STORE_HEADERS,
  globalRateLimiter,
  sanitizedLog,
  wipeBuffer
} from "../security/privacy-shield.js";
import { GLOBAL_LANGUAGES, detectLanguage } from "../services/languages.js";
import { SPECIALIZED_DOMAINS } from "../services/domains.js";
import { toFlores200Code } from "../services/nllb-connector.js";
import {
  translateText,
  getProvidersStatus,
  analyzeTextStats,
  applyTextUtilities
} from "../services/translation-engine.js";
import { translateDocumentInMemory } from "../services/document-processor.js";
import { processImageOcrAndTranslate } from "../services/ocr-processor.js";
import { getLogoAsset } from "../ui/assets.js";
import { renderTranslationAppHtml } from "../ui/template.js";

const V1_CORS_HEADERS = Object.freeze({
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-WordBridge-Api-Key"
});

function jsonResponse(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      ...NO_STORE_HEADERS,
      ...extraHeaders
    }
  });
}

function base64ToUint8Array(base64Str) {
  const cleaned = String(base64Str || "").replace(/^data:[^;]+;base64,/, "").trim();
  if (!cleaned) return new Uint8Array(0);
  if (typeof Buffer !== "undefined") {
    return new Uint8Array(Buffer.from(cleaned, "base64"));
  }
  const binary = atob(cleaned);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i) & 0xff;
  }
  return bytes;
}

function verifyOptionalApiToken(request, env) {
  const configuredToken = env?.WORDBRIDGE_API_TOKEN ? String(env.WORDBRIDGE_API_TOKEN).trim() : "";
  if (!configuredToken) return { valid: true };

  const headerKey = request.headers.get("X-WordBridge-Api-Key") || "";
  const authHeader = (request.headers.get("Authorization") || "").replace(/^Bearer\s+/i, "").trim();
  if (headerKey === configuredToken || authHeader === configuredToken) {
    return { valid: true };
  }
  return {
    valid: false,
    message: "Khóa xác thực X-WordBridge-Api-Key hoặc Bearer Token không hợp lệ."
  };
}

export async function dispatchRequest(request, env = {}) {
  const guardedR2 = createGuardedR2(env);
  const url = new URL(request.url, "https://dichthuat.wordbridge.io.vn");
  const method = (request.method || "GET").toUpperCase();
  const pathname = url.pathname;

  // Hỗ trợ CORS preflight cho cổng API v1 của Word Bridge
  if (method === "OPTIONS" && pathname.startsWith("/api/v1/")) {
    return new Response(null, {
      status: 204,
      headers: {
        ...NO_STORE_HEADERS,
        ...V1_CORS_HEADERS
      }
    });
  }

  // Kiểm tra giới hạn tốc độ (Rate Limiting không lưu IP)
  const rateStatus = globalRateLimiter.check(request);
  if (!rateStatus.allowed) {
    return jsonResponse(
      {
        ok: false,
        code: "ERR_RATE_LIMIT_EXCEEDED",
        message: "Bạn đã gửi quá nhiều yêu cầu trong thời gian ngắn. Vui lòng thử lại sau ít giây."
      },
      429,
      { "Retry-After": String(rateStatus.resetInSeconds) }
    );
  }

  // 1. Tài nguyên thương hiệu tĩnh (Logo) -> KHÔNG tăng bộ đếm lượt truy cập
  if (method === "GET" && (pathname === "/assets/logo.jpg" || pathname === "/logo.jpg")) {
    const asset = getLogoAsset();
    return new Response(asset.bytes, {
      status: 200,
      headers: {
        "Content-Type": asset.contentType,
        "Cache-Control": "public, max-age=3600",
        "X-Content-Type-Options": "nosniff"
      }
    });
  }

  if (method === "GET" && pathname === "/favicon.ico") {
    return new Response(null, { status: 204, headers: NO_STORE_HEADERS });
  }

  // 2. Trang chủ chính thức GET / -> Tăng bộ đếm nguyên tử nếu là lượt truy cập trang chính hợp lệ
  if (method === "GET" && pathname === "/") {
    let metrics;
    if (isEligiblePageVisitRequest(request)) {
      metrics = await incrementTotalAccesses(env);
    } else {
      metrics = await getTotalAccesses(env);
    }
    const providerStatus = getProvidersStatus(env);
    const html = renderTranslationAppHtml({
      totalAccesses: metrics.totalAccesses,
      providerStatus
    });

    return new Response(html, {
      status: 200,
      headers: {
        "Content-Type": "text/html; charset=utf-8",
        ...NO_STORE_HEADERS
      }
    });
  }

  // 3. Kiểm tra sức khỏe hệ thống & Bảo toàn hạ tầng Cloudflare (KHÔNG tăng bộ đếm)
  if (method === "GET" && pathname === "/api/health") {
    const d1Inspection = await inspectD1Database(env);
    const r2Inspection = inspectR2Preservation(env);
    const providers = getProvidersStatus(env);

    return jsonResponse({
      ok: true,
      service: "Word Bridge Translation (Trans)",
      domain: "https://dichthuat.wordbridge.io.vn",
      ecosystem: "Word Bridge (wordbridge.io.vn)",
      zeroUserDataStorage: true,
      d1: d1Inspection,
      r2: r2Inspection,
      providers,
      ownApiV1Endpoints: [
        "GET /api/v1/specs",
        "GET /api/v1/languages",
        "POST /api/v1/detect",
        "POST /api/v1/translate"
      ],
      forbiddenFeaturesDisabled: [
        "translation_history",
        "saved_translations",
        "personal_document_vault",
        "upload_download_history",
        "personal_dictionary",
        "user_ip_analytics",
        "auto_save_drafts"
      ]
    });
  }

  // 4. API đọc bộ đếm lượt truy cập (KHÔNG tăng bộ đếm)
  if (method === "GET" && pathname === "/api/metrics") {
    const metrics = await getTotalAccesses(env);
    return jsonResponse({
      ok: true,
      metric: "total_accesses",
      totalAccesses: metrics.totalAccesses,
      databaseName: metrics.databaseName,
      databaseId: metrics.databaseId,
      zeroUserDataVerified: true
    });
  }

  // 5. API ghi nhận lượt truy cập trang chính hợp lệ
  if (method === "POST" && pathname === "/api/metrics/visit") {
    const metrics = await incrementTotalAccesses(env);
    return jsonResponse({
      ok: true,
      metric: "total_accesses",
      totalAccesses: metrics.totalAccesses
    });
  }

  // 6. API danh sách 104 ngôn ngữ toàn cầu
  if (method === "GET" && pathname === "/api/languages") {
    return jsonResponse({
      ok: true,
      totalLanguages: GLOBAL_LANGUAGES.length - 1,
      note: "Word Bridge Trans là hệ thống dịch thuật toàn cầu, không giới hạn trong 05 ngôn ngữ học tập của Word Bridge Learning.",
      languages: GLOBAL_LANGUAGES.map((l) => ({
        ...l,
        flores200Code: l.code === "auto" ? "auto" : toFlores200Code(l.code)
      }))
    });
  }

  // 7. API danh sách 20 chuyên ngành dịch thuật
  if (method === "GET" && pathname === "/api/domains") {
    return jsonResponse({
      ok: true,
      totalDomains: SPECIALIZED_DOMAINS.length,
      domains: SPECIALIZED_DOMAINS.map((d) => ({
        id: d.id,
        order: d.order,
        name: d.name,
        nameEn: d.nameEn,
        styleGuide: d.styleGuide
      }))
    });
  }

  // 8. API kiểm tra trạng thái cấu hình các nhà cung cấp dịch thuật
  if (method === "GET" && pathname === "/api/providers/status") {
    return jsonResponse({
      ok: true,
      ...getProvidersStatus(env)
    });
  }

  // ===========================================================================
  // CỔNG API DỊCH THUẬT ĐỘC LẬP CỦA WORD BRIDGE (PHƯƠNG ÁN 3: /api/v1/*)
  // Hỗ trợ kết nối Microservice NLLB-200 + CTranslate2 INT8 + 20 Chuyên ngành
  // và cho phép toàn bộ hệ sinh thái Word Bridge gọi trực tiếp.
  // ===========================================================================
  if (pathname.startsWith("/api/v1/")) {
    const authCheck = verifyOptionalApiToken(request, env);
    if (!authCheck.valid) {
      return jsonResponse(
        { ok: false, code: "ERR_UNAUTHORIZED_API_KEY", message: authCheck.message },
        401,
        V1_CORS_HEADERS
      );
    }

    if (method === "GET" && pathname === "/api/v1/specs") {
      return jsonResponse(
        {
          ok: true,
          apiName: "Word Bridge Global Translation API v1",
          version: "1.0.0",
          architecture:
            "Option 3: Self-Hosted NLLB-200 Distilled 600M (CTranslate2 INT8) + Cloudflare Workers AI (@cf/meta/m2m100-1.2b) + 20 Specialized Domain Glossaries",
          zeroUserDataStorage: true,
          endpoints: {
            translate: {
              method: "POST",
              path: "/api/v1/translate",
              acceptsBatchArray: true,
              fields: ["text (string | string[])", "source_lang", "target_lang", "domain"]
            },
            detect: {
              method: "POST",
              path: "/api/v1/detect",
              fields: ["text"]
            },
            languages: {
              method: "GET",
              path: "/api/v1/languages"
            }
          },
          selfHostedNmtContainer: {
            directory: "self-hosted-nmt/",
            model: "facebook/nllb-200-distilled-600M (CTranslate2 INT8)",
            flores200Supported: true
          }
        },
        200,
        V1_CORS_HEADERS
      );
    }

    if (method === "GET" && pathname === "/api/v1/languages") {
      return jsonResponse(
        {
          ok: true,
          totalLanguages: GLOBAL_LANGUAGES.length - 1,
          languages: GLOBAL_LANGUAGES.filter((l) => l.code !== "auto").map((l) => ({
            code: l.code,
            flores200Code: toFlores200Code(l.code),
            name: l.name,
            nameEn: l.nameEn,
            nativeName: l.nativeName,
            dir: l.dir
          }))
        },
        200,
        V1_CORS_HEADERS
      );
    }

    if (method === "POST" && pathname === "/api/v1/detect") {
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return jsonResponse(
          { ok: false, code: "ERR_INVALID_JSON", message: "Payload JSON không hợp lệ." },
          400,
          V1_CORS_HEADERS
        );
      }
      const det = detectLanguage(body?.text || "");
      return jsonResponse(
        {
          ok: true,
          language: det.code,
          flores200Code: det.code === "und" ? "und" : toFlores200Code(det.code),
          name: det.name,
          confidence: det.confidence,
          isMultilingual: det.isMultilingual,
          secondaryLanguages: det.secondaryLanguages || [],
          zeroUserDataStorage: true
        },
        200,
        V1_CORS_HEADERS
      );
    }

    if (method === "POST" && pathname === "/api/v1/translate") {
      let body;
      try {
        body = await request.json();
      } catch (_) {
        return jsonResponse(
          { ok: false, code: "ERR_INVALID_JSON", message: "Payload JSON không hợp lệ." },
          400,
          V1_CORS_HEADERS
        );
      }

      const sourceLang = String(body?.source_lang || body?.sourceLang || "auto");
      const targetLang = String(body?.target_lang || body?.targetLang || "en");
      const domain = String(body?.domain || "general");
      const input = body?.text ?? body?.q;

      if (Array.isArray(input)) {
        if (input.length === 0 || input.length > 50) {
          return jsonResponse(
            {
              ok: false,
              code: "ERR_INVALID_BATCH_SIZE",
              message: "Mảng văn bản dịch hàng loạt (batch) phải từ 1 đến 50 phần tử."
            },
            400,
            V1_CORS_HEADERS
          );
        }

        const translations = [];
        for (const itemText of input) {
          const singleRes = await translateText(
            { text: String(itemText || ""), sourceLang, targetLang, domain },
            env
          );
          if (!singleRes.ok) {
            return jsonResponse(singleRes, 400, V1_CORS_HEADERS);
          }
          translations.push({
            translatedText: singleRes.translatedText,
            detectedSourceLanguage: singleRes.sourceLanguage.resolved,
            srcFlores200: singleRes.sourceLanguage.flores200Code,
            tgtFlores200: singleRes.targetLanguage.flores200Code
          });
        }

        return jsonResponse(
          {
            ok: true,
            batchCount: translations.length,
            domain,
            translations,
            zeroUserDataStorage: true
          },
          200,
          V1_CORS_HEADERS
        );
      }

      const singleRes = await translateText(
        { text: typeof input === "string" ? input : "", sourceLang, targetLang, domain },
        env
      );
      if (!singleRes.ok) {
        return jsonResponse(singleRes, 400, V1_CORS_HEADERS);
      }
      return jsonResponse(singleRes, 200, V1_CORS_HEADERS);
    }
  }

  // 9. API nhận diện ngôn ngữ tự động
  if (method === "POST" && pathname === "/api/detect") {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse(
        { ok: false, code: "ERR_INVALID_JSON", message: "Dữ liệu JSON không hợp lệ." },
        400
      );
    }
    const detection = detectLanguage(body?.text || "");
    const stats = analyzeTextStats(body?.text || "");
    return jsonResponse({
      ok: true,
      detection,
      stats,
      zeroUserDataStorage: true
    });
  }

  // 10. API dịch văn bản trực tuyến & chuyên ngành
  if (method === "POST" && pathname === "/api/translate") {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse(
        { ok: false, code: "ERR_INVALID_JSON", message: "Yêu cầu JSON không hợp lệ." },
        400
      );
    }

    const result = await translateText(body, env);
    if (!result.ok) {
      sanitizedLog("WARN", "TRANSLATE_TEXT_REJECTED", { errorCode: result.code });
      return jsonResponse(result, 400);
    }

    sanitizedLog("INFO", "TRANSLATE_TEXT_COMPLETED", {
      provider: result.provider.id,
      sourceLang: result.sourceLanguage.resolved,
      targetLang: result.targetLanguage.code,
      domain: result.domain.id,
      durationMs: result.stats.durationMs
    });

    return jsonResponse(result, 200);
  }

  // 11. API công cụ tiện ích văn bản trong phiên
  if (method === "POST" && pathname === "/api/tools/text") {
    let body;
    try {
      body = await request.json();
    } catch (_) {
      return jsonResponse(
        { ok: false, code: "ERR_INVALID_JSON", message: "Yêu cầu JSON không hợp lệ." },
        400
      );
    }
    const processed = applyTextUtilities(body?.text || "", {
      cleanWhitespace: Boolean(body?.cleanWhitespace),
      caseMode: body?.caseMode || ""
    });
    return jsonResponse({
      ok: true,
      processedText: processed,
      stats: analyzeTextStats(processed),
      zeroUserDataStorage: true
    });
  }

  // 12. API dịch tài liệu trực tuyến trên bộ nhớ tạm (PDF, DOCX, XLSX, PPTX, TXT, CSV, DOC)
  if (method === "POST" && pathname === "/api/document/translate") {
    let fileBytes = null;
    try {
      const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
      let filename = "document.txt";
      let sourceLang = "auto";
      let targetLang = "vi";
      let domain = "general";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file.arrayBuffer !== "function") {
          return jsonResponse(
            { ok: false, code: "ERR_MISSING_FILE", message: "Vui lòng đính kèm tệp tài liệu." },
            400
          );
        }
        filename = file.name || "document.txt";
        sourceLang = String(formData.get("sourceLang") || "auto");
        targetLang = String(formData.get("targetLang") || "vi");
        domain = String(formData.get("domain") || "general");
        fileBytes = new Uint8Array(await file.arrayBuffer());
      } else {
        const body = await request.json();
        filename = String(body?.filename || "document.txt");
        sourceLang = String(body?.sourceLang || "auto");
        targetLang = String(body?.targetLang || "vi");
        domain = String(body?.domain || "general");
        fileBytes = base64ToUint8Array(body?.base64Content || "");
      }

      const result = await translateDocumentInMemory(
        fileBytes,
        { filename, sourceLang, targetLang, domain },
        env
      );

      if (!result.ok) {
        sanitizedLog("WARN", "DOCUMENT_TRANSLATE_REJECTED", { errorCode: result.code });
        return jsonResponse(result, 400);
      }

      sanitizedLog("INFO", "DOCUMENT_TRANSLATE_COMPLETED", {
        format: result.format,
        durationMs: result.durationMs
      });

      return jsonResponse(result, 200);
    } catch (_) {
      return jsonResponse(
        {
          ok: false,
          code: "ERR_DOCUMENT_PROCESSING_FAILED",
          message: "Không thể xử lý tệp tài liệu. Vui lòng kiểm tra định dạng tệp."
        },
        400
      );
    } finally {
      if (fileBytes) wipeBuffer(fileBytes);
    }
  }

  // 13. API dịch hình ảnh & nhận diện OCR trên bộ nhớ tạm (PNG, JPG/JPEG, WEBP)
  if (method === "POST" && pathname === "/api/ocr/translate") {
    let imageBytes = null;
    try {
      const contentType = (request.headers.get("Content-Type") || "").toLowerCase();
      let filename = "image.png";
      let sourceLang = "auto";
      let targetLang = "vi";
      let domain = "general";
      let clientExtractedText = "";

      if (contentType.includes("multipart/form-data")) {
        const formData = await request.formData();
        const file = formData.get("file");
        if (!file || typeof file.arrayBuffer !== "function") {
          return jsonResponse(
            { ok: false, code: "ERR_MISSING_IMAGE", message: "Vui lòng chọn tệp hình ảnh." },
            400
          );
        }
        filename = file.name || "image.png";
        sourceLang = String(formData.get("sourceLang") || "auto");
        targetLang = String(formData.get("targetLang") || "vi");
        domain = String(formData.get("domain") || "general");
        clientExtractedText = String(formData.get("clientExtractedText") || "");
        imageBytes = new Uint8Array(await file.arrayBuffer());
      } else {
        const body = await request.json();
        filename = String(body?.filename || "image.png");
        sourceLang = String(body?.sourceLang || "auto");
        targetLang = String(body?.targetLang || "vi");
        domain = String(body?.domain || "general");
        clientExtractedText = String(body?.clientExtractedText || "");
        imageBytes = base64ToUint8Array(body?.base64Content || "");
      }

      const result = await processImageOcrAndTranslate(
        imageBytes,
        { filename, sourceLang, targetLang, domain, clientExtractedText },
        env
      );

      if (!result.ok) {
        sanitizedLog("WARN", "OCR_TRANSLATE_REJECTED", { errorCode: result.code });
        return jsonResponse(result, 400);
      }

      sanitizedLog("INFO", "OCR_TRANSLATE_COMPLETED", {
        format: result.format,
        durationMs: result.durationMs
      });

      return jsonResponse(result, 200);
    } catch (_) {
      return jsonResponse(
        {
          ok: false,
          code: "ERR_OCR_PROCESSING_FAILED",
          message: "Không thể xử lý hình ảnh OCR. Vui lòng kiểm tra định dạng PNG/JPG/WEBP."
        },
        400
      );
    } finally {
      if (imageBytes) wipeBuffer(imageBytes);
    }
  }

  // 14. Chặn rõ ràng mọi endpoint lịch sử / lưu trữ nếu có truy vấn trái phép
  if (
    pathname.startsWith("/api/history") ||
    pathname.startsWith("/api/saved") ||
    pathname.startsWith("/api/r2") ||
    pathname.startsWith("/api/dictionary/save")
  ) {
    try {
      guardedR2.put();
    } catch (_) {}
    return jsonResponse(
      {
        ok: false,
        code: "ERR_ZERO_DATA_STORAGE_POLICY",
        message:
          "Hệ thống Dịch thuật Word Bridge tuân thủ chính sách ZERO USER DATA STORAGE: Nghiêm cấm lưu lịch sử dịch thuật, bản dịch đã lưu, từ điển cá nhân hoặc tệp người dùng."
      },
      403
    );
  }

  return jsonResponse(
    {
      ok: false,
      code: "ERR_NOT_FOUND",
      message: "Không tìm thấy đường dẫn yêu cầu trên Dịch thuật Word Bridge."
    },
    404
  );
}
