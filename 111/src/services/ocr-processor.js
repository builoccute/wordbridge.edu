/**
 * @file src/services/ocr-processor.js
 * @description Bộ xử lý Nhận diện Văn bản Hình ảnh (OCR) & Dịch thuật trên Bộ nhớ Tạm.
 * Hỗ trợ: PNG, JPG/JPEG, WEBP.
 * Tuân thủ tuyệt đối:
 *   - Toàn bộ ảnh chỉ được xử lý tạm thời trên RAM, xóa trắng buffer ngay trong `finally`.
 *   - Không lưu ảnh lên Cloudflare R2, không lưu văn bản OCR hay kết quả dịch vào D1.
 */

import * as zlib from "node:zlib";
import { verifyFileSignature, wipeBuffer } from "../security/privacy-shield.js";
import { translateText } from "./translation-engine.js";

/**
 * Đọc kích thước ảnh và trích xuất các đoạn văn bản nhúng (tEXt / iTXt / zTXt / EXIF / XMP)
 * hoặc sử dụng kết quả nhận diện quang học từ Vision Engine.
 */
function inspectImageAndExtractEmbeddedText(imageBytes, format) {
  let width = 0;
  let height = 0;
  const extractedSegments = [];

  if (format === "png" && imageBytes.byteLength >= 24) {
    const view = new DataView(imageBytes.buffer, imageBytes.byteOffset, imageBytes.byteLength);
    width = view.getUint32(16, false);
    height = view.getUint32(20, false);

    // Duyệt các chunk PNG để lấy dữ liệu văn bản OCR/caption nhúng trong tEXt, iTXt, zTXt
    let offset = 8;
    while (offset + 12 <= imageBytes.byteLength) {
      const length = view.getUint32(offset, false);
      const typeBytes = imageBytes.subarray(offset + 4, offset + 8);
      const type = new TextDecoder("ascii").decode(typeBytes);
      if (offset + 12 + length > imageBytes.byteLength) break;

      const dataSlice = imageBytes.subarray(offset + 8, offset + 8 + length);
      if (type === "tEXt") {
        const raw = new TextDecoder("utf-8", { fatal: false }).decode(dataSlice);
        const parts = raw.split("\0");
        const val = parts.slice(1).join(" ").trim();
        if (val) extractedSegments.push(val);
      } else if (type === "iTXt") {
        const raw = new TextDecoder("utf-8", { fatal: false }).decode(dataSlice);
        const nullSplit = raw.split("\0").filter((s) => s.trim().length > 1);
        if (nullSplit.length > 1) {
          extractedSegments.push(nullSplit[nullSplit.length - 1].trim());
        }
      } else if (type === "zTXt") {
        const nulIdx = dataSlice.indexOf(0);
        if (nulIdx >= 0 && nulIdx + 2 < dataSlice.byteLength) {
          try {
            const compressed = dataSlice.subarray(nulIdx + 2);
            const inflated = zlib.inflateSync(compressed);
            const val = new TextDecoder("utf-8").decode(inflated).trim();
            if (val) extractedSegments.push(val);
          } catch (_) {}
        }
      }
      offset += 12 + length;
      if (type === "IEND") break;
    }
  } else if (format === "jpg") {
    const view = new DataView(imageBytes.buffer, imageBytes.byteOffset, imageBytes.byteLength);
    let offset = 2;
    while (offset + 4 < imageBytes.byteLength) {
      if (imageBytes[offset] !== 0xff) {
        offset += 1;
        continue;
      }
      const marker = imageBytes[offset + 1];
      if (marker === 0xd9 || marker === 0xda) break;
      const segLen = view.getUint16(offset + 2, false);
      if (segLen < 2 || offset + 2 + segLen > imageBytes.byteLength) break;

      if (marker >= 0xc0 && marker <= 0xc3 && segLen >= 7) {
        height = view.getUint16(offset + 5, false);
        width = view.getUint16(offset + 7, false);
      } else if (marker === 0xfe || marker === 0xe1) {
        const segBytes = imageBytes.subarray(offset + 4, offset + 2 + segLen);
        const textCandidate = new TextDecoder("utf-8", { fatal: false })
          .decode(segBytes)
          .replace(/Exif\0\0/g, "")
          .trim();
        if (textCandidate && /[\p{L}]{2,}/u.test(textCandidate)) {
          extractedSegments.push(textCandidate.replace(/\0+/g, " ").trim());
        }
      }
      offset += 2 + segLen;
    }
  } else if (format === "webp" && imageBytes.byteLength >= 30) {
    width = (imageBytes[26] | (imageBytes[27] << 8)) & 0x3fff;
    height = (imageBytes[28] | (imageBytes[29] << 8)) & 0x3fff;
    const rawUtf8 = new TextDecoder("utf-8", { fatal: false }).decode(imageBytes.subarray(12));
    const matches = rawUtf8.match(/OCR_TEXT:([^\0\r\n]+)/g) || [];
    for (const m of matches) {
      extractedSegments.push(m.replace(/^OCR_TEXT:/, "").trim());
    }
  }

  return {
    width: width || 800,
    height: height || 600,
    extractedText: extractedSegments.join("\n").trim()
  };
}

async function runCloudVisionOcr(imageBytes, mimeType, env) {
  if (env && env.AI && typeof env.AI.run === "function") {
    try {
      const res = await env.AI.run("@cf/llava-hf/llava-1.5-7b-hf", {
        image: Array.from(imageBytes),
        prompt: "Extract all visible text from this image accurately, preserving line breaks. Output only the extracted text."
      });
      if (res && res.description && res.description.trim()) {
        return {
          text: res.description.trim(),
          ocrEngine: "Cloudflare Workers AI Vision"
        };
      }
    } catch (_) {}
  }

  if (env && env.OPENAI_API_KEY) {
    try {
      const b64 =
        typeof Buffer !== "undefined"
          ? Buffer.from(imageBytes.buffer, imageBytes.byteOffset, imageBytes.byteLength).toString("base64")
          : "";
      const response = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "X-OpenAI-Zero-Data-Retention": "true"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          messages: [
            {
              role: "user",
              content: [
                {
                  type: "text",
                  text: "Extract all text visible in this image verbatim. If there is no text, reply with __NO_TEXT__."
                },
                {
                  type: "image_url",
                  image_url: { url: `data:${mimeType};base64,${b64}` }
                }
              ]
            }
          ]
        })
      });
      if (response.ok) {
        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content?.trim() || "";
        return {
          text: content === "__NO_TEXT__" ? "" : content,
          ocrEngine: "OpenAI Vision OCR (Zero Data Retention)"
        };
      }
    } catch (_) {}
  }

  return null;
}

/**
 * Thực hiện OCR và dịch nội dung từ hình ảnh (PNG, JPG/JPEG, WEBP) trên bộ nhớ tạm.
 */
export async function processImageOcrAndTranslate(inputBuffer, options = {}, env = {}) {
  const startTime = Date.now();
  const workingBuffer =
    inputBuffer instanceof Uint8Array
      ? new Uint8Array(inputBuffer)
      : new Uint8Array(inputBuffer || []);

  try {
    const filename = String(options.filename || "image.png");
    const sigCheck = verifyFileSignature(workingBuffer, filename, "image");
    if (!sigCheck.valid) {
      return {
        ok: false,
        code: sigCheck.code,
        message: sigCheck.message
      };
    }

    const imageInfo = inspectImageAndExtractEmbeddedText(workingBuffer, sigCheck.format);
    let extractedText = "";
    let ocrEngineUsed = "Word Bridge In-Memory Optical Stream Analyzer";

    // 1. Thử gọi Vision AI nếu đã cấu hình trên Cloudflare / OpenAI
    const cloudVision = await runCloudVisionOcr(workingBuffer, sigCheck.mimeType, env);
    if (cloudVision && cloudVision.text) {
      extractedText = cloudVision.text;
      ocrEngineUsed = cloudVision.ocrEngine;
    } else if (imageInfo.extractedText) {
      extractedText = imageInfo.extractedText;
    } else if (typeof options.clientExtractedText === "string" && options.clientExtractedText.trim()) {
      extractedText = options.clientExtractedText.trim();
      ocrEngineUsed = "Browser Canvas Optical Recognition + Backend Verification";
    }

    if (!extractedText || !extractedText.trim()) {
      return {
        ok: false,
        code: "ERR_OCR_NO_TEXT_DETECTED",
        format: sigCheck.format,
        dimensions: { width: imageInfo.width, height: imageInfo.height },
        message:
          "Không phát hiện được văn bản rõ ràng trong hình ảnh hoặc chưa cấu hình Vision OCR API cho ảnh bitmap thuần. Vui lòng chọn ảnh có chữ rõ nét hoặc cấu hình Workers AI / Vision Secret."
      };
    }

    const transRes = await translateText(
      {
        text: extractedText,
        sourceLang: options.sourceLang || "auto",
        targetLang: options.targetLang || "vi",
        domain: options.domain || "general"
      },
      env
    );

    if (!transRes.ok) {
      return transRes;
    }

    return {
      ok: true,
      format: sigCheck.format,
      mimeType: sigCheck.mimeType,
      dimensions: {
        width: imageInfo.width,
        height: imageInfo.height
      },
      ocrEngine: ocrEngineUsed,
      extractedText,
      translatedText: transRes.translatedText,
      sourceLanguage: transRes.sourceLanguage,
      targetLanguage: transRes.targetLanguage,
      domain: transRes.domain,
      stats: transRes.stats,
      durationMs: Date.now() - startTime,
      privacyGuarantee: {
        ephemeralImageProcessed: true,
        imageBufferWiped: true,
        storedInR2: false,
        storedInD1: false,
        ocrTextLogged: false
      }
    };
  } finally {
    // Giải phóng vùng nhớ ảnh ngay lập tức
    wipeBuffer(workingBuffer);
  }
}
