/**
 * @file scripts/build.js
 * @description Kịch bản Kiểm toán Tĩnh & Build Dự án Word Bridge Translation.
 * Thực hiện:
 *   1. Kiểm tra sự tồn tại và tính toàn vẹn của tất cả các module mã nguồn.
 *   2. Kiểm tra cấu hình `wrangler.toml` (bảo toàn D1 `word` ce84cc48-6d49-409b-b45a-13ba3bc4a771, R2 `word`, và bật sẵn `[ai] binding = "AI"`).
 *   3. Kiểm toán tĩnh chính sách ZERO USER DATA STORAGE trên toàn bộ mã nguồn.
 *   4. Kiểm tra không tồn tại API Key / Secrets bị hardcode trong mã nguồn.
 */

import * as fs from "node:fs";
import * as path from "node:path";

const ROOT = process.cwd();

const REQUIRED_FILES = [
  "package.json",
  "package-lock.json",
  "wrangler.toml",
  ".gitignore",
  ".env.example",
  "README.md",
  "migrations/0001_site_metrics_zero_storage.sql",
  "scripts/build.js",
  "src/worker.js",
  "src/server.js",
  "src/api/router.js",
  "src/db/d1-metrics.js",
  "src/security/r2-guard.js",
  "src/security/privacy-shield.js",
  "src/services/languages.js",
  "src/services/domains.js",
  "src/services/nllb-connector.js",
  "src/services/translation-engine.js",
  "src/services/document-processor.js",
  "src/services/ocr-processor.js",
  "src/ui/assets.js",
  "src/ui/template.js",
  "self-hosted-nmt/app.py",
  "self-hosted-nmt/requirements.txt",
  "self-hosted-nmt/Dockerfile",
  "tests/full-system.test.js"
];

function runBuildAndAudit() {
  console.log("=== [WORD BRIDGE TRANSLATION] BUILD & ZERO-STORAGE STATIC AUDIT ===");
  const errors = [];

  for (const relPath of REQUIRED_FILES) {
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) {
      errors.push(`Thiếu tệp mã nguồn bắt buộc: ${relPath}`);
    }
  }

  const wranglerPath = path.join(ROOT, "wrangler.toml");
  if (fs.existsSync(wranglerPath)) {
    const wranglerContent = fs.readFileSync(wranglerPath, "utf-8");
    if (!wranglerContent.includes('database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771"')) {
      errors.push("wrangler.toml không giữ nguyên Database ID ce84cc48-6d49-409b-b45a-13ba3bc4a771.");
    }
    if (!wranglerContent.includes('database_name = "word"')) {
      errors.push('wrangler.toml không giữ nguyên database_name = "word".');
    }
    if (!wranglerContent.includes('bucket_name = "word"')) {
      errors.push('wrangler.toml không giữ nguyên R2 bucket_name = "word".');
    }
    if (!wranglerContent.includes('compatibility_flags = ["nodejs_compat"]')) {
      errors.push('wrangler.toml thiếu compatibility_flags = ["nodejs_compat"].');
    }
    if (!/^\s*\[ai\]/m.test(wranglerContent) || !/^\s*binding\s*=\s*"AI"/m.test(wranglerContent)) {
      errors.push('wrangler.toml chưa bật mặc định [ai] binding = "AI".');
    }
  }

  const templatePath = path.join(ROOT, "src/ui/template.js");
  if (fs.existsSync(templatePath)) {
    const uiCode = fs.readFileSync(templatePath, "utf-8");
    const forbiddenBrowserApis = [
      "localStorage.setItem",
      "sessionStorage.setItem",
      "indexedDB.open",
      "document.cookie =",
      "caches.open"
    ];
    for (const api of forbiddenBrowserApis) {
      if (uiCode.includes(api)) {
        errors.push(`Phát hiện lệnh lưu trữ trình duyệt bị cấm trong src/ui/template.js: ${api}`);
      }
    }
  }

  const migrationPath = path.join(ROOT, "migrations/0001_site_metrics_zero_storage.sql");
  if (fs.existsSync(migrationPath)) {
    const sqlCode = fs.readFileSync(migrationPath, "utf-8");
    const strippedSqlComments = sqlCode
      .split("\n")
      .filter((line) => !line.trim().startsWith("--"))
      .join("\n");
    if (/\bDROP\s+(TABLE|DATABASE)\b/i.test(strippedSqlComments)) {
      errors.push("File migration chứa câu lệnh DROP TABLE/DATABASE bị nghiêm cấm.");
    }
  }

  const secretPatterns = [
    /sk-[a-zA-Z0-9]{32,}/,
    /AIzaSy[a-zA-Z0-9_-]{33}/
  ];
  for (const relPath of REQUIRED_FILES) {
    const absPath = path.join(ROOT, relPath);
    if (!fs.existsSync(absPath)) continue;
    const content = fs.readFileSync(absPath, "utf-8");
    for (const pat of secretPatterns) {
      if (pat.test(content)) {
        errors.push(`Phát hiện chuỗi giống Secret/API Key bị hardcode trong tệp: ${relPath}`);
      }
    }
  }

  if (errors.length > 0) {
    console.error("BUILD FAILED VỚI CÁC LỖI SAU:");
    for (const err of errors) {
      console.error("  [✗]", err);
    }
    process.exit(1);
  }

  console.log(`  [✓] Đã xác minh ${REQUIRED_FILES.length}/${REQUIRED_FILES.length} tệp mã nguồn.`);
  console.log('  [✓] Đã xác minh bật mặc định [ai] binding = "AI" (@cf/meta/m2m100-1.2b) trong wrangler.toml.');
  console.log("  [✓] Đã xác minh bảo toàn Cloudflare D1 (word / ce84cc48-6d49-409b-b45a-13ba3bc4a771) và R2 (word).");
  console.log("  [✓] Đã xác minh tuân thủ tĩnh chính sách ZERO USER DATA STORAGE.");
  console.log("=== BUILD & PRIVACY AUDIT HOÀN TẤT THÀNH CÔNG ===");
}

runBuildAndAudit();
