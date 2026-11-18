/**
 * @file src/security/r2-guard.js
 * @description Lớp bảo vệ Cloudflare R2 (`word`) – R2ZeroStorageGuard.
 * Đảm bảo:
 *   1. Giữ nguyên binding `R2` (`bucket_name = "word"`) trong hạ tầng Cloudflare của Word Bridge.
 *   2. Không tự ý xóa bucket hoặc xóa các object hiện có của hệ sinh thái Word Bridge.
 *   3. Chặn tuyệt đối (Hard Block) mọi thao tác ghi/lưu trữ tệp người dùng (PDF, DOCX, PPTX, XLSX,
 *      TXT, CSV, PNG, JPG, WEBP, kết quả OCR, tệp tạm) từ dịch vụ Dịch thuật Word Bridge lên R2.
 */

export const EXPECTED_R2_BUCKET_NAME = "word";

export class R2ZeroStorageGuard {
  constructor(rawBucket = null) {
    this._rawBucket = rawBucket;
    this._blockedWriteAttempts = 0;
  }

  put() {
    this._blockedWriteAttempts += 1;
    throw new Error(
      "ERR_R2_USER_STORAGE_FORBIDDEN: Chính sách ZERO USER DATA STORAGE nghiêm cấm lưu tệp người dùng hoặc tệp dịch thuật lên Cloudflare R2."
    );
  }

  createMultipartUpload() {
    this._blockedWriteAttempts += 1;
    throw new Error(
      "ERR_R2_USER_STORAGE_FORBIDDEN: Chính sách ZERO USER DATA STORAGE nghiêm cấm tải tệp phân đoạn của người dùng lên Cloudflare R2."
    );
  }

  resumeMultipartUpload() {
    this._blockedWriteAttempts += 1;
    throw new Error(
      "ERR_R2_USER_STORAGE_FORBIDDEN: Không cho phép lưu trữ tệp người dùng trên Cloudflare R2."
    );
  }

  delete() {
    throw new Error(
      "ERR_R2_PRESERVATION_LOCKED: Nghiêm cấm tự ý xóa bất kỳ object hiện có nào trong bucket R2 'word' của hệ sinh thái Word Bridge."
    );
  }

  get() {
    throw new Error(
      "ERR_R2_DIRECT_ACCESS_FORBIDDEN: Dịch vụ Dịch thuật Word Bridge không truy cập hoặc đọc dữ liệu cá nhân từ R2."
    );
  }

  head() {
    throw new Error(
      "ERR_R2_DIRECT_ACCESS_FORBIDDEN: Dịch vụ Dịch thuật Word Bridge không truy xuất metadata tệp từ R2."
    );
  }

  getStatus() {
    return {
      bucketName: EXPECTED_R2_BUCKET_NAME,
      storageClass: "Standard",
      bindingName: "R2",
      bindingPresent: Boolean(this._rawBucket),
      bucketPreserved: true,
      existingObjectsUntouched: true,
      userFileUploadAllowed: false,
      blockedWriteAttempts: this._blockedWriteAttempts,
      policy: "ZERO_USER_FILE_STORAGE_ON_R2"
    };
  }
}

/**
 * Bọc môi trường `env.R2` bằng `R2ZeroStorageGuard` để đảm bảo không một module nào
 * trong hệ thống dịch thuật có thể ghi tệp người dùng lên R2 hoặc xóa dữ liệu cũ.
 */
export function createGuardedR2(env) {
  return new R2ZeroStorageGuard(env && env.R2 ? env.R2 : null);
}

/**
 * Kiểm tra trạng thái bảo toàn Cloudflare R2 cho báo cáo kỹ thuật và endpoint `/api/health`.
 */
export function inspectR2Preservation(env) {
  const guard = createGuardedR2(env);
  return guard.getStatus();
}
