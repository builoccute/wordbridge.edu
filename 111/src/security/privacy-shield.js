/**
 * @file src/security/privacy-shield.js
 * @description Trung tâm Bảo mật & Quyền riêng tư của Word Bridge Translation:
 *   - HTTP Headers chống lưu Cache (Cache-Control: no-store) và chống XSS/Clickjacking.
 *   - Kiểm tra chữ ký byte thực tế của tệp (Magic Bytes Inspection) chống giả mạo MIME type.
 *   - Phát hiện và chặn tệp thực thi nguy hiểm hoặc tệp Office chứa Macro (vbaProject.bin).
 *   - Rate Limiting trên bộ nhớ tạm không lưu địa chỉ IP hoặc định danh cá nhân.
 *   - Cơ chế xóa sạch vùng nhớ đệm (wipeBuffer) ngay sau khi xử lý xong yêu cầu.
 *   - Ghi log kỹ thuật đã lọc sạch 100% nội dung văn bản và thông tin tệp.
 */

export const NO_STORE_HEADERS = Object.freeze({
  "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
  "Pragma": "no-cache",
  "Expires": "0",
  "Surrogate-Control": "no-store",
  "X-Content-Type-Options": "nosniff",
  "X-Frame-Options": "DENY",
  "Referrer-Policy": "no-referrer",
  "Permissions-Policy": "camera=(), geolocation=(), payment=(), usb=(), interest-cohort=()",
  "Cross-Origin-Resource-Policy": "same-origin",
  "X-Zero-User-Data-Storage": "enforced; only-metric=total_accesses",
  "Content-Security-Policy":
    "default-src 'self'; img-src 'self' data: blob:; style-src 'self' 'unsafe-inline'; script-src 'self' 'unsafe-inline'; connect-src 'self'; media-src 'self' data: blob:; object-src 'none'; frame-ancestors 'none'; base-uri 'self';"
});

export const LIMITS = Object.freeze({
  MAX_TEXT_CHARS: 15000,
  MAX_DOCUMENT_BYTES: 10 * 1024 * 1024, // 10 MB in-memory safe limit on Cloudflare Workers
  MAX_IMAGE_BYTES: 5 * 1024 * 1024,     // 5 MB in-memory safe limit for OCR
  MAX_DOCUMENT_PAGES: 50,
  RATE_LIMIT_WINDOW_MS: 60 * 1000,
  RATE_LIMIT_MAX_REQUESTS: 90
});

/**
 * Bộ giới hạn tốc độ (Rate Limiter) hoạt động hoàn toàn trên RAM, không lưu IP.
 * Sử dụng khóa băm xoay vòng theo phút và tự động giải phóng sau mỗi cửa sổ 60 giây.
 */
export class EphemeralRateLimiter {
  constructor(maxRequests = LIMITS.RATE_LIMIT_MAX_REQUESTS, windowMs = LIMITS.RATE_LIMIT_WINDOW_MS) {
    this.maxRequests = maxRequests;
    this.windowMs = windowMs;
    this.buckets = new Map();
    this.ephemeralSalt = Math.random().toString(36).slice(2);
    this.currentWindowId = Math.floor(Date.now() / this.windowMs);
  }

  _hashAnonymousKey(rawSignal) {
    const windowId = Math.floor(Date.now() / this.windowMs);
    if (windowId !== this.currentWindowId) {
      this.buckets.clear();
      this.ephemeralSalt = Math.random().toString(36).slice(2);
      this.currentWindowId = windowId;
    }
    const input = `${windowId}:${this.ephemeralSalt}:${String(rawSignal || "anon")}`;
    let hash = 2166136261;
    for (let i = 0; i < input.length; i++) {
      hash ^= input.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return `ephem_${(hash >>> 0).toString(16)}`;
  }

  check(request) {
    const cfRayPrefix = (request?.headers?.get("cf-connecting-ip") || "local-client").slice(0, 16);
    const bucketKey = this._hashAnonymousKey(cfRayPrefix);
    const count = (this.buckets.get(bucketKey) || 0) + 1;
    this.buckets.set(bucketKey, count);

    return {
      allowed: count <= this.maxRequests,
      remaining: Math.max(0, this.maxRequests - count),
      resetInSeconds: Math.ceil((this.windowMs - (Date.now() % this.windowMs)) / 1000)
    };
  }
}

export const globalRateLimiter = new EphemeralRateLimiter();

/**
 * Xóa trắng vùng nhớ tạm (Uint8Array / Buffer) ngay sau khi hoàn tất dịch tài liệu hoặc OCR.
 */
export function wipeBuffer(bufferLike) {
  if (!bufferLike) return true;
  try {
    if (bufferLike instanceof Uint8Array) {
      bufferLike.fill(0);
    } else if (bufferLike instanceof ArrayBuffer) {
      new Uint8Array(bufferLike).fill(0);
    }
  } catch (_) {
    // Ignore read-only view errors
  }
  return true;
}

/**
 * Kiểm tra chữ ký byte thực tế (Magic Bytes) và cấu trúc tệp tải lên.
 * Không tin tưởng đơn thuần vào phần mở rộng hoặc header Content-Type từ trình duyệt.
 */
export function verifyFileSignature(uint8Array, filename = "", category = "document") {
  if (!(uint8Array instanceof Uint8Array) || uint8Array.byteLength === 0) {
    return {
      valid: false,
      code: "ERR_EMPTY_FILE",
      message: "Tệp tải lên rỗng hoặc không có dữ liệu hợp lệ."
    };
  }

  const maxBytes = category === "image" ? LIMITS.MAX_IMAGE_BYTES : LIMITS.MAX_DOCUMENT_BYTES;
  if (uint8Array.byteLength > maxBytes) {
    const maxMb = Math.round(maxBytes / (1024 * 1024));
    return {
      valid: false,
      code: "ERR_FILE_TOO_LARGE",
      message: `Kích thước tệp vượt quá giới hạn xử lý trực tiếp trên bộ nhớ tạm (${maxMb} MB). Để tuân thủ chính sách Zero User Data Storage (không lưu tệp lên Cloudflare R2), vui lòng chia nhỏ tệp dưới ${maxMb} MB.`
    };
  }

  const ext = String(filename || "")
    .toLowerCase()
    .split(".")
    .pop();

  const b0 = uint8Array[0];
  const b1 = uint8Array[1];
  const b2 = uint8Array[2];
  const b3 = uint8Array[3];

  // Chặn tệp thực thi Windows PE (MZ) hoặc Linux ELF (\x7fELF)
  if ((b0 === 0x4d && b1 === 0x5a) || (b0 === 0x7f && b1 === 0x45 && b2 === 0x4c && b3 === 0x46)) {
    return {
      valid: false,
      code: "ERR_EXECUTABLE_BLOCKED",
      message: "Hệ thống bảo mật đã chặn tệp thực thi nhị phân không hợp lệ."
    };
  }

  if (category === "image") {
    const isPng = b0 === 0x89 && b1 === 0x50 && b2 === 0x4e && b3 === 0x47;
    const isJpeg = b0 === 0xff && b1 === 0xd8 && b2 === 0xff;
    const isWebp =
      uint8Array.byteLength >= 12 &&
      b0 === 0x52 &&
      b1 === 0x49 &&
      b2 === 0x46 &&
      b3 === 0x46 &&
      uint8Array[8] === 0x57 &&
      uint8Array[9] === 0x45 &&
      uint8Array[10] === 0x42 &&
      uint8Array[11] === 0x50;

    if (!isPng && !isJpeg && !isWebp) {
      return {
        valid: false,
        code: "ERR_INVALID_IMAGE_SIGNATURE",
        message: "Chữ ký byte của tệp không khớp với định dạng ảnh hỗ trợ (PNG, JPG/JPEG, WEBP)."
      };
    }

    const detectedFormat = isPng ? "png" : isJpeg ? "jpg" : "webp";
    return {
      valid: true,
      format: detectedFormat,
      mimeType: isPng ? "image/png" : isJpeg ? "image/jpeg" : "image/webp",
      byteLength: uint8Array.byteLength
    };
  }

  // Kiểm tra tài liệu: PDF (%PDF-)
  const isPdfMagic =
    uint8Array.byteLength >= 5 &&
    b0 === 0x25 &&
    b1 === 0x50 &&
    b2 === 0x44 &&
    b3 === 0x46 &&
    uint8Array[4] === 0x2d;

  if (isPdfMagic || ext === "pdf") {
    if (!isPdfMagic) {
      return {
        valid: false,
        code: "ERR_SPOOFED_PDF_MIME",
        message: "Tệp có phần mở rộng .pdf nhưng chữ ký byte thực tế không phải chuẩn %PDF-."
      };
    }
    return {
      valid: true,
      format: "pdf",
      mimeType: "application/pdf",
      byteLength: uint8Array.byteLength
    };
  }

  // Kiểm tra tài liệu OOXML (DOCX, XLSX, PPTX) có chữ ký ZIP PK\x03\x04
  const isZipMagic =
    uint8Array.byteLength >= 4 && b0 === 0x50 && b1 === 0x4b && b2 === 0x03 && b3 === 0x04;

  if (isZipMagic || ["docx", "xlsx", "pptx", "docm", "xlsm", "pptm"].includes(ext)) {
    if (!isZipMagic) {
      return {
        valid: false,
        code: "ERR_CORRUPT_OOXML",
        message: `Tệp .${ext} bị hỏng hoặc không đúng cấu trúc container OOXML (PK\\x03\\x04).`
      };
    }

    const rawLatin = new TextDecoder("latin1").decode(
      uint8Array.subarray(0, Math.min(uint8Array.byteLength, 65536))
    );

    if (rawLatin.includes("vbaProject.bin") || ["docm", "xlsm", "pptm"].includes(ext)) {
      return {
        valid: false,
        code: "ERR_MACRO_NOT_ALLOWED",
        message: "Hệ thống từ chối xử lý tệp Office có chứa Macro (vbaProject.bin) để đảm bảo an toàn bảo mật."
      };
    }

    if (rawLatin.includes("EncryptedPackage") || rawLatin.includes("EncryptionInfo")) {
      return {
        valid: false,
        code: "ERR_ENCRYPTED_DOCUMENT",
        message: "Tài liệu được đặt mật khẩu bảo vệ. Vui lòng gỡ mật khẩu trước khi dịch."
      };
    }

    let detectedOoxml = ext;
    if (rawLatin.includes("word/")) detectedOoxml = "docx";
    else if (rawLatin.includes("xl/")) detectedOoxml = "xlsx";
    else if (rawLatin.includes("ppt/")) detectedOoxml = "pptx";

    if (!["docx", "xlsx", "pptx"].includes(detectedOoxml)) {
      return {
        valid: false,
        code: "ERR_UNSUPPORTED_ARCHIVE",
        message: "Tệp nén ZIP không phải là tài liệu DOCX, XLSX hoặc PPTX hợp lệ."
      };
    }

    const mimeMap = {
      docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation"
    };

    return {
      valid: true,
      format: detectedOoxml,
      mimeType: mimeMap[detectedOoxml],
      byteLength: uint8Array.byteLength
    };
  }

  // Kiểm tra tài liệu Word 97-2003 (.doc - OLE2 Compound Document D0 CF 11 E0)
  const isOle2Magic =
    uint8Array.byteLength >= 8 &&
    b0 === 0xd0 &&
    b1 === 0xcf &&
    b2 === 0x11 &&
    b3 === 0xe0;

  if (isOle2Magic || ext === "doc") {
    if (!isOle2Magic) {
      return {
        valid: false,
        code: "ERR_INVALID_DOC_SIGNATURE",
        message: "Tệp .doc không có chữ ký OLE2 hợp lệ."
      };
    }
    return {
      valid: true,
      format: "doc",
      mimeType: "application/msword",
      byteLength: uint8Array.byteLength
    };
  }

  // Kiểm tra TXT và CSV (kiểm tra byte nhị phân lạ)
  if (["txt", "csv"].includes(ext)) {
    const sampleLen = Math.min(uint8Array.byteLength, 4096);
    let nullBytes = 0;
    for (let i = 0; i < sampleLen; i++) {
      if (uint8Array[i] === 0x00) nullBytes += 1;
    }
    const hasUtf16Bom = (b0 === 0xff && b1 === 0xfe) || (b0 === 0xfe && b1 === 0xff);
    if (nullBytes > 4 && !hasUtf16Bom) {
      return {
        valid: false,
        code: "ERR_BINARY_DISGUISED_AS_TEXT",
        message: "Tệp văn bản chứa dữ liệu nhị phân không hợp lệ."
      };
    }
    return {
      valid: true,
      format: ext,
      mimeType: ext === "csv" ? "text/csv; charset=utf-8" : "text/plain; charset=utf-8",
      byteLength: uint8Array.byteLength
    };
  }

  return {
    valid: false,
    code: "ERR_UNSUPPORTED_DOCUMENT_FORMAT",
    message:
      "Định dạng tệp không được hỗ trợ. Hệ thống chỉ hỗ trợ: PDF, DOCX, DOC, TXT, PPTX, XLSX, CSV."
  };
}

/**
 * Làm sạch chuỗi hiển thị HTML để phòng chống XSS tuyệt đối.
 */
export function escapeHtml(str) {
  return String(str || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Ghi log kỹ thuật đã loại bỏ hoàn toàn nội dung nhạy cảm (Zero Content Logging).
 * Tuyệt đối không ghi văn bản nguồn, bản dịch, tên tệp, nội dung tệp hay IP người dùng.
 */
export function sanitizedLog(level, eventCode, technicalMeta = {}) {
  const safeMeta = {};
  const allowedKeys = [
    "statusCode",
    "provider",
    "sourceLang",
    "targetLang",
    "domain",
    "format",
    "durationMs",
    "errorCode"
  ];
  for (const key of allowedKeys) {
    if (technicalMeta && technicalMeta[key] !== undefined) {
      safeMeta[key] = technicalMeta[key];
    }
  }
  return {
    timestamp: new Date().toISOString(),
    level,
    eventCode,
    meta: safeMeta,
    zeroContentVerified: true
  };
}
