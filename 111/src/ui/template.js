/**
 * @file src/ui/template.js
 * @description Giao diện Người dùng (Frontend UI/UX) của Hệ thống Dịch thuật Word Bridge (Trans).
 * Tên miền: https://dichthuat.wordbridge.io.vn
 * Thiết kế tổng hợp tinh hoa từ:
 *   - Google Translate (thanh tác vụ đa phương thức Văn bản / Tài liệu / Hình ảnh OCR + phím tắt ngôn ngữ nhanh)
 *   - Microsoft Bing Translator (bố cục song song tốc độ cao, phát âm TTS, đếm từ/ký tự thời gian thực)
 *   - ChatGPT Translate (chế độ dịch thuật ngữ cảnh theo 20 chuyên ngành chuyên sâu)
 *   - iLoveTranslation (bộ lọc tìm kiếm nhanh 104 ngôn ngữ toàn cầu & thanh công cụ chuẩn hóa văn bản)
 *
 * CAM KẾT KỸ THUẬT ZERO USER DATA STORAGE TRÊN TRÌNH DUYỆT:
 *   - KHÔNG gọi localStorage, sessionStorage, indexedDB, document.cookie hay Cache API.
 *   - KHÔNG có tính năng Lịch sử dịch thuật, Lưu bản dịch, Từ điển cá nhân hay Tệp gần đây.
 *   - Mọi dữ liệu chỉ tồn tại trên biến bộ nhớ phiên hiện tại và bị xóa ngay khi nhấn Xóa hoặc đóng trang.
 */

import { GLOBAL_LANGUAGES } from "../services/languages.js";
import { SPECIALIZED_DOMAINS } from "../services/domains.js";
import { WORD_BRIDGE_LOGO_SVG } from "./assets.js";

export function renderTranslationAppHtml({ totalAccesses = 0, providerStatus = {} } = {}) {
  const languagesJson = JSON.stringify(GLOBAL_LANGUAGES);
  const domainsJson = JSON.stringify(SPECIALIZED_DOMAINS);
  const initialProviderName =
    providerStatus.activePrimaryName || "Word Bridge Deterministic NMT & Domain Glossary Engine";

  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Dịch thuật Word Bridge (Trans) – Nền tảng Dịch thuật Toàn cầu | dichthuat.wordbridge.io.vn</title>
  <meta name="description" content="Word Bridge Translation (Trans) – Hệ thống dịch thuật trực tuyến toàn cầu hỗ trợ 104 ngôn ngữ, 20 chuyên ngành, dịch tài liệu (PDF, DOCX, XLSX, PPTX, TXT, CSV) và OCR hình ảnh với chính sách Zero User Data Storage." />
  <style>
    :root {
      --wb-teal-dark: #084c59;
      --wb-teal-main: #0d6efd;
      --wb-teal-brand: #0e6373;
      --wb-aqua: #2994a3;
      --wb-red: #d1101a;
      --wb-red-soft: #fef2f2;
      --wb-bg: #f4f7f9;
      --wb-surface: #ffffff;
      --wb-border: #d9e3ea;
      --wb-text: #11242b;
      --wb-muted: #526872;
      --wb-success: #0f766e;
      --wb-warning: #b45309;
      --wb-radius: 14px;
      --wb-shadow: 0 8px 28px rgba(8, 76, 89, 0.08);
    }

    *, *::before, *::after { box-sizing: border-box; }
    html, body {
      margin: 0;
      padding: 0;
      background: var(--wb-bg);
      color: var(--wb-text);
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      font-size: 15px;
      line-height: 1.5;
      -webkit-font-smoothing: antialiased;
    }

    /* Header thương hiệu Word Bridge */
    .wb-header {
      background: var(--wb-surface);
      border-bottom: 1px solid var(--wb-border);
      position: sticky;
      top: 0;
      z-index: 50;
      box-shadow: 0 2px 10px rgba(8, 76, 89, 0.04);
    }
    .wb-header-inner {
      max-width: 1360px;
      margin: 0 auto;
      padding: 10px 20px;
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 16px;
      flex-wrap: wrap;
    }
    .wb-brand {
      display: flex;
      align-items: center;
      gap: 14px;
      text-decoration: none;
      color: inherit;
    }
    .wb-logo-box {
      width: 220px;
      height: 58px;
      display: flex;
      align-items: center;
      overflow: hidden;
      border-radius: 8px;
      flex-shrink: 0;
    }
    .wb-logo-box img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
    .wb-title-group {
      display: flex;
      flex-direction: column;
      border-left: 2px solid var(--wb-border);
      padding-left: 14px;
    }
    .wb-service-title {
      font-size: 18px;
      font-weight: 800;
      color: var(--wb-teal-dark);
      display: flex;
      align-items: center;
      gap: 8px;
      margin: 0;
    }
    .wb-badge-trans {
      background: var(--wb-red);
      color: #fff;
      font-size: 11px;
      font-weight: 800;
      padding: 2px 8px;
      border-radius: 999px;
      letter-spacing: 0.04em;
      text-transform: uppercase;
    }
    .wb-service-sub {
      font-size: 12px;
      color: var(--wb-muted);
      margin-top: 2px;
    }

    /* Thanh trạng thái Zero User Data Storage & Bộ đếm D1 */
    .wb-header-badges {
      display: flex;
      align-items: center;
      gap: 10px;
      flex-wrap: wrap;
    }
    .wb-pill {
      display: inline-flex;
      align-items: center;
      gap: 6px;
      padding: 6px 12px;
      border-radius: 999px;
      font-size: 12.5px;
      font-weight: 600;
      border: 1px solid var(--wb-border);
      background: #f8fbfc;
      color: var(--wb-teal-dark);
    }
    .wb-pill-privacy {
      background: #ecfdf5;
      border-color: #a7f3d0;
      color: #065f46;
    }
    .wb-pill-counter {
      background: #f0f9ff;
      border-color: #bae6fd;
      color: #075985;
    }
    .wb-dot-live {
      width: 8px;
      height: 8px;
      border-radius: 50%;
      background: #10b981;
      display: inline-block;
    }

    /* Vùng chứa chính */
    .wb-main {
      max-width: 1360px;
      margin: 18px auto 40px;
      padding: 0 20px;
    }

    /* Thanh công cụ chọn Chế độ dịch & Chuyên ngành */
    .wb-mode-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 14px;
      margin-bottom: 16px;
      flex-wrap: wrap;
    }
    .wb-mode-tabs {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .wb-mode-btn {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 18px;
      border-radius: 10px;
      border: 1px solid var(--wb-border);
      background: var(--wb-surface);
      color: var(--wb-teal-dark);
      font-weight: 700;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.16s ease;
    }
    .wb-mode-btn:hover {
      border-color: var(--wb-aqua);
      background: #f0f9fa;
    }
    .wb-mode-btn.active {
      background: var(--wb-teal-dark);
      color: #ffffff;
      border-color: var(--wb-teal-dark);
      box-shadow: 0 4px 12px rgba(8, 76, 89, 0.18);
    }

    /* Chọn chuyên ngành (20 lĩnh vực) */
    .wb-domain-selector {
      display: flex;
      align-items: center;
      gap: 10px;
      background: var(--wb-surface);
      padding: 7px 14px;
      border-radius: 10px;
      border: 1px solid var(--wb-border);
    }
    .wb-domain-selector label {
      font-size: 13px;
      font-weight: 700;
      color: var(--wb-teal-dark);
      white-space: nowrap;
    }
    .wb-select {
      padding: 6px 10px;
      border-radius: 8px;
      border: 1px solid var(--wb-border);
      background: #f8fbfc;
      color: var(--wb-text);
      font-size: 13.5px;
      font-weight: 600;
      outline: none;
      cursor: pointer;
    }
    .wb-select:focus {
      border-color: var(--wb-aqua);
    }

    /* Khung dịch thuật chính */
    .wb-workspace-card {
      background: var(--wb-surface);
      border: 1px solid var(--wb-border);
      border-radius: var(--wb-radius);
      box-shadow: var(--wb-shadow);
      overflow: hidden;
    }

    /* Thanh chọn ngôn ngữ Nguồn - Đảo chiều - Đích */
    .wb-lang-bar {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      align-items: center;
      gap: 10px;
      padding: 12px 16px;
      background: #f8fbfc;
      border-bottom: 1px solid var(--wb-border);
    }
    .wb-lang-side {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-wrap: wrap;
    }
    .wb-quick-pills {
      display: flex;
      align-items: center;
      gap: 4px;
      flex-wrap: wrap;
    }
    .wb-lang-pill {
      padding: 6px 11px;
      border-radius: 8px;
      border: 1px solid transparent;
      background: transparent;
      color: var(--wb-muted);
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .wb-lang-pill:hover {
      background: #e6f2f5;
      color: var(--wb-teal-dark);
    }
    .wb-lang-pill.active {
      background: #e0f2fe;
      color: var(--wb-teal-dark);
      border-color: #7dd3fc;
      font-weight: 700;
    }
    .wb-lang-dropdown-wrap {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-left: auto;
    }
    .wb-lang-search {
      width: 125px;
      padding: 6px 9px;
      border: 1px solid var(--wb-border);
      border-radius: 7px;
      font-size: 12.5px;
    }
    .wb-swap-btn {
      width: 40px;
      height: 40px;
      border-radius: 50%;
      border: 1px solid var(--wb-border);
      background: var(--wb-surface);
      color: var(--wb-teal-dark);
      font-size: 18px;
      font-weight: 700;
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.2s, background 0.15s;
    }
    .wb-swap-btn:hover {
      background: var(--wb-teal-dark);
      color: #fff;
      transform: rotate(180deg);
    }

    /* Bố cục 2 cột Nhập văn bản & Kết quả dịch */
    .wb-panes {
      display: grid;
      grid-template-columns: 1fr 1fr;
      min-height: 330px;
    }
    .wb-pane {
      display: flex;
      flex-direction: column;
      padding: 16px;
      position: relative;
    }
    .wb-pane-source {
      border-right: 1px solid var(--wb-border);
    }
    .wb-pane-target {
      background: #fbfdfe;
    }
    .wb-textarea {
      width: 100%;
      flex: 1;
      min-height: 220px;
      border: none;
      resize: vertical;
      font-family: inherit;
      font-size: 16.5px;
      line-height: 1.6;
      color: var(--wb-text);
      background: transparent;
      outline: none;
    }
    .wb-textarea::placeholder {
      color: #94a3b8;
    }
    .wb-output-box {
      width: 100%;
      flex: 1;
      min-height: 220px;
      font-size: 16.5px;
      line-height: 1.6;
      color: var(--wb-text);
      white-space: pre-wrap;
      overflow-wrap: break-word;
    }
    .wb-output-placeholder {
      color: #94a3b8;
      font-style: italic;
    }

    /* Thanh công cụ chân khung nhập & khung kết quả */
    .wb-pane-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 12px;
      border-top: 1px dashed var(--wb-border);
      margin-top: 10px;
      flex-wrap: wrap;
    }
    .wb-tool-group {
      display: flex;
      align-items: center;
      gap: 6px;
      flex-wrap: wrap;
    }
    .wb-icon-btn {
      display: inline-flex;
      align-items: center;
      gap: 5px;
      padding: 6px 11px;
      border-radius: 8px;
      border: 1px solid var(--wb-border);
      background: var(--wb-surface);
      color: var(--wb-teal-dark);
      font-size: 12.5px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.15s;
    }
    .wb-icon-btn:hover {
      background: #e6f2f5;
      border-color: var(--wb-aqua);
    }
    .wb-primary-btn {
      display: inline-flex;
      align-items: center;
      gap: 7px;
      padding: 9px 20px;
      border-radius: 9px;
      border: none;
      background: var(--wb-red);
      color: #ffffff;
      font-size: 14px;
      font-weight: 700;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(209, 16, 26, 0.25);
      transition: background 0.15s;
    }
    .wb-primary-btn:hover {
      background: #b00d15;
    }
    .wb-stats-meta {
      font-size: 12px;
      color: var(--wb-muted);
      font-variant-numeric: tabular-nums;
    }

    /* Khu vực Dịch Tài liệu & Dịch Hình ảnh OCR */
    .wb-panel-hidden {
      display: none !important;
    }
    .wb-upload-section {
      padding: 28px 24px;
    }
    .wb-dropzone {
      border: 2px dashed var(--wb-aqua);
      border-radius: 14px;
      background: #f4fbfd;
      padding: 36px 24px;
      text-align: center;
      cursor: pointer;
      transition: all 0.18s ease;
    }
    .wb-dropzone:hover, .wb-dropzone.dragover {
      background: #e6f7fa;
      border-color: var(--wb-teal-dark);
    }
    .wb-dropzone-title {
      font-size: 17px;
      font-weight: 800;
      color: var(--wb-teal-dark);
      margin-bottom: 6px;
    }
    .wb-dropzone-desc {
      font-size: 13.5px;
      color: var(--wb-muted);
      margin-bottom: 14px;
    }
    .wb-format-chips {
      display: flex;
      justify-content: center;
      gap: 8px;
      flex-wrap: wrap;
      margin-top: 12px;
    }
    .wb-format-chip {
      background: #ffffff;
      border: 1px solid var(--wb-border);
      padding: 4px 10px;
      border-radius: 6px;
      font-size: 12px;
      font-weight: 700;
      color: var(--wb-teal-dark);
    }

    /* Khu vực kết quả tài liệu & OCR */
    .wb-result-card {
      margin-top: 20px;
      border: 1px solid var(--wb-border);
      border-radius: 12px;
      padding: 18px;
      background: #f8fbfc;
    }
    .wb-alert {
      margin-top: 14px;
      padding: 12px 16px;
      border-radius: 10px;
      font-size: 13.5px;
      font-weight: 600;
      display: none;
    }
    .wb-alert.show {
      display: block;
    }
    .wb-alert-error {
      background: var(--wb-red-soft);
      border: 1px solid #fecaca;
      color: #991b1b;
    }
    .wb-alert-success {
      background: #ecfdf5;
      border: 1px solid #a7f3d0;
      color: #065f46;
    }
    .wb-alert-info {
      background: #eff6ff;
      border: 1px solid #bfdbfe;
      color: #1e40af;
    }

    /* Bảng thông tin kiến trúc Zero User Data Storage & Hạ tầng */
    .wb-info-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 16px;
      margin-top: 22px;
    }
    .wb-info-card {
      background: var(--wb-surface);
      border: 1px solid var(--wb-border);
      border-radius: 12px;
      padding: 16px 18px;
    }
    .wb-info-card h3 {
      margin: 0 0 8px 0;
      font-size: 14.5px;
      color: var(--wb-teal-dark);
      display: flex;
      align-items: center;
      gap: 8px;
    }
    .wb-info-card p {
      margin: 0;
      font-size: 13px;
      color: var(--wb-muted);
      line-height: 1.55;
    }

    .wb-footer {
      max-width: 1360px;
      margin: 28px auto;
      padding: 18px 20px;
      border-top: 1px solid var(--wb-border);
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 12px;
      font-size: 12.5px;
      color: var(--wb-muted);
    }

    @media (max-width: 960px) {
      .wb-lang-bar {
        grid-template-columns: 1fr;
      }
      .wb-panes {
        grid-template-columns: 1fr;
      }
      .wb-pane-source {
        border-right: none;
        border-bottom: 1px solid var(--wb-border);
      }
      .wb-info-grid {
        grid-template-columns: 1fr;
      }
    }
  </style>
</head>
<body>
  <!-- HEADER THƯƠNG HIỆU WORD BRIDGE -->
  <header class="wb-header">
    <div class="wb-header-inner">
      <a href="/" class="wb-brand" title="Dịch thuật Word Bridge - Trang chủ">
        <div class="wb-logo-box">
          <img src="/assets/logo.jpg" alt="WORD BRIDGE Logo" onerror="this.style.display='none'; this.parentElement.innerHTML=${JSON.stringify(WORD_BRIDGE_LOGO_SVG)};" />
        </div>
        <div class="wb-title-group">
          <h1 class="wb-service-title">
            Dịch thuật Word Bridge
            <span class="wb-badge-trans">TRANS</span>
          </h1>
          <span class="wb-service-sub">WORD BRIDGE – CONNECTING LANGUAGES, CONNECTING THE WORLD</span>
        </div>
      </a>

      <div class="wb-header-badges">
        <div class="wb-pill wb-pill-privacy" title="Hệ thống cam kết không lưu văn bản dịch, không lưu tệp, không lưu lịch sử người dùng">
          <span class="wb-dot-live"></span>
          <span>Zero User Data Storage: Đang bật</span>
        </div>
        <div class="wb-pill wb-pill-counter" title="Chỉ số thống kê duy nhất được lưu trữ trên Cloudflare D1 (site_metrics.total_accesses)">
          <span>Tổng lượt truy cập:</span>
          <strong id="wbTotalAccesses">${Number(totalAccesses).toLocaleString("vi-VN")}</strong>
        </div>
        <div class="wb-pill" title="Trạng thái công cụ dịch thuật">
          <span>Engine:</span>
          <strong id="wbActiveProvider">${initialProviderName}</strong>
        </div>
      </div>
    </div>
  </header>

  <main class="wb-main">
    <!-- THANH CHỌN CHẾ ĐỘ & CHUYÊN NGÀNH -->
    <div class="wb-mode-bar">
      <div class="wb-mode-tabs" role="tablist">
        <button type="button" class="wb-mode-btn active" id="tabBtnText" onclick="switchMode('text')">
          <span>文A</span>
          <span>Dịch văn bản (104 ngôn ngữ)</span>
        </button>
        <button type="button" class="wb-mode-btn" id="tabBtnDoc" onclick="switchMode('document')">
          <span>📄</span>
          <span>Dịch tài liệu (PDF, DOCX, XLSX, PPTX, TXT, CSV)</span>
        </button>
        <button type="button" class="wb-mode-btn" id="tabBtnOcr" onclick="switchMode('ocr')">
          <span>📷</span>
          <span>Dịch hình ảnh &amp; OCR (PNG, JPG, WEBP)</span>
        </button>
      </div>

      <div class="wb-domain-selector">
        <label for="wbDomainSelect">Chuyên ngành (20 lĩnh vực):</label>
        <select id="wbDomainSelect" class="wb-select" onchange="onDomainChange()"></select>
      </div>
    </div>

    <!-- KHUNG LÀM VIỆC CHÍNH -->
    <section class="wb-workspace-card">
      <!-- THANH CHỌN NGÔN NGỮ TOÀN CẦU -->
      <div class="wb-lang-bar">
        <div class="wb-lang-side">
          <div class="wb-quick-pills" id="wbSourceQuickPills">
            <button type="button" class="wb-lang-pill active" data-lang="auto" onclick="selectSourceLang('auto')">Tự động nhận diện</button>
            <button type="button" class="wb-lang-pill" data-lang="vi" onclick="selectSourceLang('vi')">Tiếng Việt</button>
            <button type="button" class="wb-lang-pill" data-lang="en" onclick="selectSourceLang('en')">Tiếng Anh</button>
            <button type="button" class="wb-lang-pill" data-lang="zh" onclick="selectSourceLang('zh')">Tiếng Trung</button>
            <button type="button" class="wb-lang-pill" data-lang="ja" onclick="selectSourceLang('ja')">Tiếng Nhật</button>
            <button type="button" class="wb-lang-pill" data-lang="ko" onclick="selectSourceLang('ko')">Tiếng Hàn</button>
            <button type="button" class="wb-lang-pill" data-lang="ru" onclick="selectSourceLang('ru')">Tiếng Nga</button>
          </div>
          <div class="wb-lang-dropdown-wrap">
            <input type="search" id="wbSourceSearch" class="wb-lang-search" placeholder="Tìm ngôn ngữ nguồn..." oninput="filterLangSelect('source')" />
            <select id="wbSourceSelect" class="wb-select" onchange="selectSourceLang(this.value)"></select>
          </div>
        </div>

        <button type="button" class="wb-swap-btn" id="wbSwapBtn" onclick="swapLanguages()" title="Đảo chiều ngôn ngữ">
          ⇄
        </button>

        <div class="wb-lang-side">
          <div class="wb-quick-pills" id="wbTargetQuickPills">
            <button type="button" class="wb-lang-pill" data-lang="vi" onclick="selectTargetLang('vi')">Tiếng Việt</button>
            <button type="button" class="wb-lang-pill active" data-lang="en" onclick="selectTargetLang('en')">Tiếng Anh</button>
            <button type="button" class="wb-lang-pill" data-lang="zh" onclick="selectTargetLang('zh')">Tiếng Trung</button>
            <button type="button" class="wb-lang-pill" data-lang="ja" onclick="selectTargetLang('ja')">Tiếng Nhật</button>
            <button type="button" class="wb-lang-pill" data-lang="ko" onclick="selectTargetLang('ko')">Tiếng Hàn</button>
            <button type="button" class="wb-lang-pill" data-lang="ru" onclick="selectTargetLang('ru')">Tiếng Nga</button>
            <button type="button" class="wb-lang-pill" data-lang="fr" onclick="selectTargetLang('fr')">Tiếng Pháp</button>
          </div>
          <div class="wb-lang-dropdown-wrap">
            <input type="search" id="wbTargetSearch" class="wb-lang-search" placeholder="Tìm ngôn ngữ đích..." oninput="filterLangSelect('target')" />
            <select id="wbTargetSelect" class="wb-select" onchange="selectTargetLang(this.value)"></select>
          </div>
        </div>
      </div>

      <!-- TAB 1: DỊCH VĂN BẢN TRỰC TUYẾN -->
      <div id="panelTextMode" class="wb-panes">
        <!-- Cột nhập văn bản nguồn -->
        <div class="wb-pane wb-pane-source">
          <textarea
            id="wbSourceInput"
            class="wb-textarea"
            maxlength="15000"
            placeholder="Nhập văn bản cần dịch (hỗ trợ 104 ngôn ngữ toàn cầu, tự động nhận diện ngôn ngữ và thuật ngữ chuyên ngành)..."
            oninput="onSourceTextInput()"
          ></textarea>

          <div class="wb-pane-footer">
            <div class="wb-tool-group">
              <button type="button" class="wb-icon-btn" onclick="speakText('source')" title="Phát âm văn bản nguồn">
                🔊 Phát âm
              </button>
              <button type="button" class="wb-icon-btn" onclick="cleanSourceWhitespace()" title="Làm sạch khoảng trắng thừa">
                ✨ Chuẩn hóa khoảng trắng
              </button>
              <button type="button" class="wb-icon-btn" onclick="clearSourceText()" title="Xóa nội dung (giải phóng bộ nhớ phiên)">
                🗑️ Xóa
              </button>
            </div>
            <div class="wb-tool-group">
              <span class="wb-stats-meta" id="wbDetectedBadge">Ngôn ngữ: Tự động</span>
              <span class="wb-stats-meta" id="wbSourceCounters">0 / 15.000 ký tự · 0 từ</span>
              <button type="button" class="wb-primary-btn" id="wbTranslateBtn" onclick="executeTextTranslation()">
                Dịch ngay →
              </button>
            </div>
          </div>
        </div>

        <!-- Cột hiển thị kết quả dịch -->
        <div class="wb-pane wb-pane-target">
          <div id="wbTargetOutput" class="wb-output-box wb-output-placeholder">Bản dịch sẽ hiển thị trực tiếp tại đây (không lưu lịch sử, không lưu cache)...</div>

          <div class="wb-pane-footer">
            <div class="wb-tool-group">
              <button type="button" class="wb-icon-btn" onclick="speakText('target')" title="Phát âm bản dịch">
                🔊 Phát âm
              </button>
              <button type="button" class="wb-icon-btn" onclick="copyTranslatedText()" title="Sao chép bản dịch">
                📋 Sao chép
              </button>
              <select id="wbCaseMode" class="wb-select" onchange="executeTextTranslation()" title="Chuyển đổi chữ hoa / chữ thường">
                <option value="">Giữ nguyên kiểu chữ</option>
                <option value="sentence">Chữ hoa đầu câu</option>
                <option value="title">Chữ Hoa Đầu Từ</option>
                <option value="upper">CHỮ IN HOA</option>
                <option value="lower">chữ in thường</option>
              </select>
            </div>
            <div class="wb-tool-group">
              <span class="wb-stats-meta" id="wbDomainTermBadge">Chuyên ngành: Tổng quát</span>
              <span class="wb-stats-meta" id="wbTargetCounters">0 ký tự · 0 từ</span>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 2: DỊCH TÀI LIỆU TRỰC TUYẾN (IN-MEMORY) -->
      <div id="panelDocumentMode" class="wb-upload-section wb-panel-hidden">
        <div
          class="wb-dropzone"
          id="wbDocDropzone"
          onclick="document.getElementById('wbDocFileInput').click()"
          ondragover="event.preventDefault(); this.classList.add('dragover');"
          ondragleave="this.classList.remove('dragover');"
          ondrop="handleFileDrop(event, 'document')"
        >
          <div class="wb-dropzone-title">Kéo thả tài liệu vào đây hoặc nhấn để chọn tệp</div>
          <div class="wb-dropzone-desc">
            Xử lý 100% trên bộ nhớ tạm (RAM) và trả trực tiếp tệp đã dịch cho trình duyệt. Tuyệt đối không tải tệp lên Cloudflare R2 hay D1.
          </div>
          <button type="button" class="wb-primary-btn">Chọn tài liệu cần dịch (Tối đa 10 MB)</button>
          <input
            type="file"
            id="wbDocFileInput"
            accept=".pdf,.docx,.doc,.txt,.pptx,.xlsx,.csv"
            style="display:none"
            onchange="handleDocFileSelected(this.files[0])"
          />
          <div class="wb-format-chips">
            <span class="wb-format-chip">PDF (.pdf)</span>
            <span class="wb-format-chip">Word (.docx / .doc)</span>
            <span class="wb-format-chip">Excel (.xlsx)</span>
            <span class="wb-format-chip">PowerPoint (.pptx)</span>
            <span class="wb-format-chip">Văn bản (.txt)</span>
            <span class="wb-format-chip">Bảng dữ liệu (.csv)</span>
          </div>
        </div>

        <div id="wbDocResultCard" class="wb-result-card wb-panel-hidden">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:12px;">
            <div>
              <strong id="wbDocResultTitle" style="font-size:15px; color:var(--wb-teal-dark);">Tài liệu đã dịch thành công</strong>
              <div id="wbDocResultMeta" style="font-size:12.5px; color:var(--wb-muted); margin-top:4px;"></div>
            </div>
            <button type="button" class="wb-primary-btn" id="wbDocDownloadBtn">⬇️ Tải tài liệu đã dịch</button>
          </div>
          <div id="wbDocLimitationNote" style="margin-top:10px; font-size:12.5px; color:var(--wb-warning);"></div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px; margin-top:14px;">
            <div>
              <div style="font-size:12px; font-weight:700; color:var(--wb-muted); margin-bottom:4px;">TRÍCH ĐOẠN NỘI DUNG GỐC:</div>
              <pre id="wbDocSourcePreview" style="background:#fff; padding:10px; border-radius:8px; border:1px solid var(--wb-border); max-height:180px; overflow:auto; white-space:pre-wrap; font-size:12.5px; margin:0;"></pre>
            </div>
            <div>
              <div style="font-size:12px; font-weight:700; color:var(--wb-muted); margin-bottom:4px;">TRÍCH ĐOẠN KẾT QUẢ DỊCH:</div>
              <pre id="wbDocTranslatedPreview" style="background:#fff; padding:10px; border-radius:8px; border:1px solid var(--wb-border); max-height:180px; overflow:auto; white-space:pre-wrap; font-size:12.5px; margin:0;"></pre>
            </div>
          </div>
        </div>
      </div>

      <!-- TAB 3: DỊCH HÌNH ẢNH & NHẬN DIỆN OCR (IN-MEMORY) -->
      <div id="panelOcrMode" class="wb-upload-section wb-panel-hidden">
        <div
          class="wb-dropzone"
          id="wbOcrDropzone"
          onclick="document.getElementById('wbOcrFileInput').click()"
          ondragover="event.preventDefault(); this.classList.add('dragover');"
          ondragleave="this.classList.remove('dragover');"
          ondrop="handleFileDrop(event, 'ocr')"
        >
          <div class="wb-dropzone-title">Chọn hình ảnh để nhận diện văn bản (OCR) và dịch tự động</div>
          <div class="wb-dropzone-desc">
            Hỗ trợ PNG, JPG/JPEG, WEBP (tối đa 5 MB). Hình ảnh chỉ xử lý tạm thời trên RAM, không lưu lên Cloudflare R2.
          </div>
          <button type="button" class="wb-primary-btn">Chọn hình ảnh (PNG, JPG, WEBP)</button>
          <input
            type="file"
            id="wbOcrFileInput"
            accept="image/png,image/jpeg,image/webp,.png,.jpg,.jpeg,.webp"
            style="display:none"
            onchange="handleOcrFileSelected(this.files[0])"
          />
          <div class="wb-format-chips">
            <span class="wb-format-chip">PNG (.png)</span>
            <span class="wb-format-chip">JPEG (.jpg / .jpeg)</span>
            <span class="wb-format-chip">WEBP (.webp)</span>
          </div>
        </div>

        <div id="wbOcrResultCard" class="wb-result-card wb-panel-hidden">
          <div style="display:flex; justify-content:space-between; align-items:center; flex-wrap:wrap; gap:10px; margin-bottom:12px;">
            <strong id="wbOcrMetaTitle" style="color:var(--wb-teal-dark);">Kết quả Nhận diện OCR &amp; Dịch thuật</strong>
            <button type="button" class="wb-icon-btn" onclick="copyOcrTranslated()">📋 Sao chép bản dịch OCR</button>
          </div>
          <div style="display:grid; grid-template-columns:1fr 1fr; gap:14px;">
            <div>
              <div style="font-size:12px; font-weight:700; color:var(--wb-muted); margin-bottom:4px;">VĂN BẢN TRÍCH XUẤT TỪ ẢNH (BẢN GỐC):</div>
              <pre id="wbOcrExtractedBox" style="background:#fff; padding:12px; border-radius:8px; border:1px solid var(--wb-border); min-height:130px; white-space:pre-wrap; font-size:13.5px; margin:0;"></pre>
            </div>
            <div>
              <div style="font-size:12px; font-weight:700; color:var(--wb-muted); margin-bottom:4px;">KẾT QUẢ DỊCH THUẬT:</div>
              <pre id="wbOcrTranslatedBox" style="background:#fff; padding:12px; border-radius:8px; border:1px solid var(--wb-border); min-height:130px; white-space:pre-wrap; font-size:13.5px; margin:0;"></pre>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- KHU VỰC THÔNG BÁO TRẠNG THÁI & LỖI -->
    <div id="wbStatusAlert" class="wb-alert" role="status" aria-live="polite"></div>

    <!-- THÔNG TIN CAM KẾT KIẾN TRÚC ZERO USER DATA STORAGE -->
    <section class="wb-info-grid">
      <div class="wb-info-card">
        <h3>🛡️ Chính sách Zero User Data Storage</h3>
        <p>
          Hệ thống <strong>không lưu trữ</strong> văn bản nguồn, kết quả dịch, tệp tải lên, metadata, lịch sử dịch thuật hay từ điển cá nhân trên cả máy chủ (D1/R2) lẫn trình duyệt (LocalStorage/IndexedDB/Cookies).
        </p>
      </div>
      <div class="wb-info-card">
        <h3>🌍 Dịch thuật Toàn cầu 104 Ngôn ngữ &amp; 20 Chuyên ngành</h3>
        <p>
          Khác với nền tảng học tập Word Bridge Learning (5 ngôn ngữ), <strong>Word Bridge Trans</strong> mở rộng hỗ trợ 104 ngôn ngữ thế giới (kể cả ngôn ngữ RTL như Ả Rập, Do Thái, Ba Tư) cùng 20 chế độ dịch thuật chuyên ngành.
        </p>
      </div>
      <div class="wb-info-card">
        <h3>⚡ Hạ tầng Biên Cloudflare D1 &amp; R2 Bảo toàn</h3>
        <p>
          Database D1 (<code>word</code>) chỉ lưu duy nhất tổng số lượt truy cập trang (<code>total_accesses</code>) bằng truy vấn nguyên tử. Bucket R2 (<code>word</code>) được khóa ghi đối với mọi tài liệu người dùng.
        </p>
      </div>
    </section>
  </main>

  <footer class="wb-footer">
    <div>
      <strong>Dịch thuật Word Bridge (Word Bridge Translation – Trans)</strong> · Website: <a href="https://dichthuat.wordbridge.io.vn">dichthuat.wordbridge.io.vn</a> · Hệ sinh thái: <a href="https://wordbridge.io.vn">wordbridge.io.vn</a>
    </div>
    <div>
      Chính sách dữ liệu: <strong>ZERO USER DATA STORAGE</strong> (Cache-Control: no-store)
    </div>
  </footer>

  <script>
    // Dữ liệu cấu hình tĩnh trong bộ nhớ phiên (tuyệt đối không ghi vào LocalStorage/SessionStorage/IndexedDB)
    const WB_LANGUAGES = ${languagesJson};
    const WB_DOMAINS = ${domainsJson};

    let currentState = {
      mode: "text",
      sourceLang: "auto",
      targetLang: "en",
      domain: "general",
      debounceTimer: null,
      lastDocBlobUrl: null
    };

    function initApp() {
      populateLanguageSelects();
      populateDomainSelect();
      updateQuickPills();
    }

    function populateLanguageSelects(filterSide) {
      const srcSearch = (document.getElementById("wbSourceSearch").value || "").toLowerCase().trim();
      const tgtSearch = (document.getElementById("wbTargetSearch").value || "").toLowerCase().trim();

      if (!filterSide || filterSide === "source") {
        const srcSelect = document.getElementById("wbSourceSelect");
        srcSelect.innerHTML = "";
        WB_LANGUAGES.forEach((lang) => {
          if (
            !srcSearch ||
            lang.name.toLowerCase().includes(srcSearch) ||
            lang.nameEn.toLowerCase().includes(srcSearch) ||
            lang.nativeName.toLowerCase().includes(srcSearch) ||
            lang.code.toLowerCase().includes(srcSearch)
          ) {
            const opt = document.createElement("option");
            opt.value = lang.code;
            opt.textContent = lang.code === "auto" ? "✨ Tự động nhận diện" : lang.name + " (" + lang.nativeName + " - " + lang.code + ")";
            if (lang.code === currentState.sourceLang) opt.selected = true;
            srcSelect.appendChild(opt);
          }
        });
      }

      if (!filterSide || filterSide === "target") {
        const tgtSelect = document.getElementById("wbTargetSelect");
        tgtSelect.innerHTML = "";
        WB_LANGUAGES.filter((l) => l.code !== "auto").forEach((lang) => {
          if (
            !tgtSearch ||
            lang.name.toLowerCase().includes(tgtSearch) ||
            lang.nameEn.toLowerCase().includes(tgtSearch) ||
            lang.nativeName.toLowerCase().includes(tgtSearch) ||
            lang.code.toLowerCase().includes(tgtSearch)
          ) {
            const opt = document.createElement("option");
            opt.value = lang.code;
            opt.textContent = lang.name + " (" + lang.nativeName + " - " + lang.code + ")";
            if (lang.code === currentState.targetLang) opt.selected = true;
            tgtSelect.appendChild(opt);
          }
        });
      }
    }

    function filterLangSelect(side) {
      populateLanguageSelects(side);
    }

    function populateDomainSelect() {
      const sel = document.getElementById("wbDomainSelect");
      sel.innerHTML = "";
      WB_DOMAINS.forEach((d) => {
        const opt = document.createElement("option");
        opt.value = d.id;
        opt.textContent = d.name + " (" + d.nameEn + ")";
        if (d.id === currentState.domain) opt.selected = true;
        sel.appendChild(opt);
      });
    }

    function updateQuickPills() {
      document.querySelectorAll("#wbSourceQuickPills .wb-lang-pill").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-lang") === currentState.sourceLang);
      });
      document.querySelectorAll("#wbTargetQuickPills .wb-lang-pill").forEach((btn) => {
        btn.classList.toggle("active", btn.getAttribute("data-lang") === currentState.targetLang);
      });
      document.getElementById("wbSourceSelect").value = currentState.sourceLang;
      document.getElementById("wbTargetSelect").value = currentState.targetLang;

      const srcInfo = WB_LANGUAGES.find((l) => l.code === currentState.sourceLang);
      const tgtInfo = WB_LANGUAGES.find((l) => l.code === currentState.targetLang);
      document.getElementById("wbSourceInput").dir = srcInfo && srcInfo.dir === "rtl" ? "rtl" : "ltr";
      document.getElementById("wbTargetOutput").dir = tgtInfo && tgtInfo.dir === "rtl" ? "rtl" : "ltr";
    }

    function selectSourceLang(code) {
      currentState.sourceLang = code;
      updateQuickPills();
      if (document.getElementById("wbSourceInput").value.trim()) {
        executeTextTranslation();
      }
    }

    function selectTargetLang(code) {
      if (code === "auto") return;
      currentState.targetLang = code;
      updateQuickPills();
      if (document.getElementById("wbSourceInput").value.trim()) {
        executeTextTranslation();
      }
    }

    function swapLanguages() {
      if (currentState.sourceLang === "auto") {
        const detectedAttr = document.getElementById("wbDetectedBadge").getAttribute("data-detected");
        currentState.sourceLang = detectedAttr && detectedAttr !== "und" ? detectedAttr : "vi";
      }
      const prevSource = currentState.sourceLang;
      currentState.sourceLang = currentState.targetLang;
      currentState.targetLang = prevSource;
      updateQuickPills();

      const outBox = document.getElementById("wbTargetOutput");
      if (!outBox.classList.contains("wb-output-placeholder") && outBox.textContent.trim()) {
        document.getElementById("wbSourceInput").value = outBox.textContent;
        executeTextTranslation();
      }
    }

    function onDomainChange() {
      currentState.domain = document.getElementById("wbDomainSelect").value;
      const d = WB_DOMAINS.find((item) => item.id === currentState.domain);
      document.getElementById("wbDomainTermBadge").textContent = "Chuyên ngành: " + (d ? d.name : "Tổng quát");
      if (document.getElementById("wbSourceInput").value.trim()) {
        executeTextTranslation();
      }
    }

    function switchMode(mode) {
      currentState.mode = mode;
      document.getElementById("tabBtnText").classList.toggle("active", mode === "text");
      document.getElementById("tabBtnDoc").classList.toggle("active", mode === "document");
      document.getElementById("tabBtnOcr").classList.toggle("active", mode === "ocr");

      document.getElementById("panelTextMode").classList.toggle("wb-panel-hidden", mode !== "text");
      document.getElementById("panelDocumentMode").classList.toggle("wb-panel-hidden", mode !== "document");
      document.getElementById("panelOcrMode").classList.toggle("wb-panel-hidden", mode !== "ocr");
      hideAlert();
    }

    function showAlert(type, message) {
      const box = document.getElementById("wbStatusAlert");
      box.className = "wb-alert show wb-alert-" + type;
      box.textContent = message;
    }

    function hideAlert() {
      const box = document.getElementById("wbStatusAlert");
      box.className = "wb-alert";
      box.textContent = "";
    }

    function onSourceTextInput() {
      const text = document.getElementById("wbSourceInput").value;
      const charCount = Array.from(text).length;
      const words = text.trim() ? text.trim().split(/\\s+/).length : 0;
      document.getElementById("wbSourceCounters").textContent =
        charCount.toLocaleString("vi-VN") + " / 15.000 ký tự · " + words.toLocaleString("vi-VN") + " từ";

      if (currentState.debounceTimer) clearTimeout(currentState.debounceTimer);
      if (!text.trim()) {
        clearTargetOutput();
        return;
      }
      currentState.debounceTimer = setTimeout(() => {
        executeTextTranslation();
      }, 320);
    }

    function clearTargetOutput() {
      const out = document.getElementById("wbTargetOutput");
      out.textContent = "Bản dịch sẽ hiển thị trực tiếp tại đây (không lưu lịch sử, không lưu cache)...";
      out.classList.add("wb-output-placeholder");
      document.getElementById("wbTargetCounters").textContent = "0 ký tự · 0 từ";
      document.getElementById("wbDetectedBadge").textContent = "Ngôn ngữ: Tự động";
    }

    function clearSourceText() {
      document.getElementById("wbSourceInput").value = "";
      document.getElementById("wbSourceCounters").textContent = "0 / 15.000 ký tự · 0 từ";
      clearTargetOutput();
      hideAlert();
    }

    function cleanSourceWhitespace() {
      const input = document.getElementById("wbSourceInput");
      input.value = input.value
        .replace(/[ \\t]+/g, " ")
        .replace(/ *\\r?\\n */g, "\\n")
        .replace(/\\n{3,}/g, "\\n\\n")
        .trim();
      onSourceTextInput();
    }

    async function executeTextTranslation() {
      const text = document.getElementById("wbSourceInput").value;
      if (!text.trim()) {
        showAlert("error", "Vui lòng nhập văn bản cần dịch.");
        return;
      }
      hideAlert();
      const outBox = document.getElementById("wbTargetOutput");
      outBox.classList.remove("wb-output-placeholder");
      outBox.textContent = "Đang xử lý dịch thuật trên bộ nhớ tạm...";

      try {
        const response = await fetch("/api/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            text,
            sourceLang: currentState.sourceLang,
            targetLang: currentState.targetLang,
            domain: currentState.domain,
            caseMode: document.getElementById("wbCaseMode").value
          })
        });
        const data = await response.json();
        if (!response.ok || !data.ok) {
          outBox.textContent = "";
          outBox.classList.add("wb-output-placeholder");
          showAlert("error", data.message || "Không thể thực hiện dịch văn bản.");
          return;
        }

        outBox.textContent = data.translatedText;
        outBox.dir = data.targetLanguage?.dir || "ltr";

        const badge = document.getElementById("wbDetectedBadge");
        badge.setAttribute("data-detected", data.sourceLanguage?.resolved || "en");
        badge.textContent =
          (data.sourceLanguage?.autoDetected ? "Đã nhận diện: " : "Nguồn: ") +
          (data.sourceLanguage?.name || data.sourceLanguage?.resolved) +
          (data.sourceLanguage?.isMultilingual ? " (Đa ngôn ngữ)" : "");

        document.getElementById("wbSourceCounters").textContent =
          (data.stats?.source?.charCount || 0).toLocaleString("vi-VN") +
          " / 15.000 ký tự · " +
          (data.stats?.source?.wordCount || 0).toLocaleString("vi-VN") +
          " từ";

        document.getElementById("wbTargetCounters").textContent =
          (data.stats?.target?.charCount || 0).toLocaleString("vi-VN") +
          " ký tự · " +
          (data.stats?.target?.wordCount || 0).toLocaleString("vi-VN") +
          " từ";

        const termCount = data.domain?.appliedTerminologyCount || 0;
        document.getElementById("wbDomainTermBadge").textContent =
          "Chuyên ngành: " +
          (data.domain?.name || "Tổng quát") +
          (termCount > 0 ? " (" + termCount + " thuật ngữ chuẩn)" : "");
      } catch (err) {
        showAlert("error", "Lỗi kết nối máy chủ dịch thuật. Vui lòng thử lại.");
      }
    }

    async function copyTranslatedText() {
      const outBox = document.getElementById("wbTargetOutput");
      if (outBox.classList.contains("wb-output-placeholder") || !outBox.textContent.trim()) {
        showAlert("info", "Chưa có nội dung bản dịch để sao chép.");
        return;
      }
      try {
        await navigator.clipboard.writeText(outBox.textContent);
        showAlert("success", "Đã sao chép bản dịch vào bộ nhớ tạm clipboard.");
      } catch (_) {
        showAlert("info", "Trình duyệt không cấp quyền clipboard tự động; vui lòng bôi đen để sao chép.");
      }
    }

    function speakText(side) {
      if (!("speechSynthesis" in window)) {
        showAlert("info", "Trình duyệt hiện tại không hỗ trợ Web Speech API để phát âm.");
        return;
      }
      const text =
        side === "source"
          ? document.getElementById("wbSourceInput").value.trim()
          : document.getElementById("wbTargetOutput").classList.contains("wb-output-placeholder")
            ? ""
            : document.getElementById("wbTargetOutput").textContent.trim();

      if (!text) {
        showAlert("info", "Không có văn bản để phát âm.");
        return;
      }

      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      const langCode =
        side === "source"
          ? currentState.sourceLang === "auto"
            ? document.getElementById("wbDetectedBadge").getAttribute("data-detected") || "vi"
            : currentState.sourceLang
          : currentState.targetLang;

      const langInfo = WB_LANGUAGES.find((l) => l.code === langCode);
      utterance.lang = (langInfo && langInfo.speechLang) || langCode;
      window.speechSynthesis.speak(utterance);
    }

    function handleFileDrop(evt, type) {
      evt.preventDefault();
      evt.currentTarget.classList.remove("dragover");
      const file = evt.dataTransfer?.files?.[0];
      if (!file) return;
      if (type === "document") handleDocFileSelected(file);
      else handleOcrFileSelected(file);
    }

    function arrayBufferToBase64(buffer) {
      const bytes = new Uint8Array(buffer);
      let binary = "";
      const chunkSize = 0x8000;
      for (let i = 0; i < bytes.length; i += chunkSize) {
        binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunkSize));
      }
      return btoa(binary);
    }

    async function handleDocFileSelected(file) {
      if (!file) return;
      hideAlert();
      document.getElementById("wbDocResultCard").classList.add("wb-panel-hidden");
      showAlert("info", "Đang đọc và dịch tài liệu trực tiếp trên bộ nhớ tạm (không lưu tệp lên R2/D1)...");

      try {
        const buffer = await file.arrayBuffer();
        const base64Content = arrayBufferToBase64(buffer);

        const response = await fetch("/api/document/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            filename: file.name,
            base64Content,
            sourceLang: currentState.sourceLang,
            targetLang: currentState.targetLang,
            domain: currentState.domain
          })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          showAlert("error", data.message || "Không thể dịch tài liệu này.");
          return;
        }

        if (currentState.lastDocBlobUrl) {
          URL.revokeObjectURL(currentState.lastDocBlobUrl);
          currentState.lastDocBlobUrl = null;
        }

        const binStr = atob(data.downloadBase64);
        const outBytes = new Uint8Array(binStr.length);
        for (let i = 0; i < binStr.length; i++) {
          outBytes[i] = binStr.charCodeAt(i);
        }
        const blob = new Blob([outBytes], { type: data.mimeType });
        const blobUrl = URL.createObjectURL(blob);
        currentState.lastDocBlobUrl = blobUrl;

        document.getElementById("wbDocResultTitle").textContent =
          "Đã dịch hoàn tất: " + data.outputFilename;
        document.getElementById("wbDocResultMeta").textContent =
          "Định dạng: " +
          data.format.toUpperCase() +
          " · Dung lượng: " +
          data.outputByteLength.toLocaleString("vi-VN") +
          " bytes · Thời gian: " +
          data.durationMs +
          " ms · Không lưu R2/D1";
        document.getElementById("wbDocLimitationNote").textContent = data.limitationsNotice || "";
        document.getElementById("wbDocSourcePreview").textContent = data.sourcePreview || "";
        document.getElementById("wbDocTranslatedPreview").textContent = data.translatedPreview || "";

        const dlBtn = document.getElementById("wbDocDownloadBtn");
        dlBtn.onclick = () => {
          const a = document.createElement("a");
          a.href = blobUrl;
          a.download = data.outputFilename;
          document.body.appendChild(a);
          a.click();
          a.remove();
        };

        document.getElementById("wbDocResultCard").classList.remove("wb-panel-hidden");
        showAlert("success", "Tài liệu đã được dịch trên bộ nhớ tạm và sẵn sàng tải xuống.");
      } catch (err) {
        showAlert("error", "Phát sinh lỗi khi xử lý tài liệu trên trình duyệt.");
      } finally {
        document.getElementById("wbDocFileInput").value = "";
      }
    }

    async function handleOcrFileSelected(file) {
      if (!file) return;
      hideAlert();
      document.getElementById("wbOcrResultCard").classList.add("wb-panel-hidden");
      showAlert("info", "Đang nhận diện văn bản OCR và dịch thuật trên bộ nhớ tạm...");

      try {
        const buffer = await file.arrayBuffer();
        const base64Content = arrayBufferToBase64(buffer);

        const response = await fetch("/api/ocr/translate", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          cache: "no-store",
          body: JSON.stringify({
            filename: file.name,
            base64Content,
            sourceLang: currentState.sourceLang,
            targetLang: currentState.targetLang,
            domain: currentState.domain
          })
        });

        const data = await response.json();
        if (!response.ok || !data.ok) {
          showAlert("error", data.message || "Không thể nhận diện văn bản từ hình ảnh này.");
          return;
        }

        document.getElementById("wbOcrMetaTitle").textContent =
          "Kết quả OCR (" +
          data.format.toUpperCase() +
          " · " +
          data.dimensions.width +
          "x" +
          data.dimensions.height +
          "px · Ngôn ngữ nguồn: " +
          (data.sourceLanguage?.name || data.sourceLanguage?.resolved) +
          ")";
        document.getElementById("wbOcrExtractedBox").textContent = data.extractedText;
        document.getElementById("wbOcrTranslatedBox").textContent = data.translatedText;
        document.getElementById("wbOcrResultCard").classList.remove("wb-panel-hidden");
        showAlert("success", "Đã trích xuất văn bản OCR và dịch thành công mà không lưu trữ hình ảnh.");
      } catch (err) {
        showAlert("error", "Phát sinh lỗi khi xử lý hình ảnh OCR.");
      } finally {
        document.getElementById("wbOcrFileInput").value = "";
      }
    }

    async function copyOcrTranslated() {
      const text = document.getElementById("wbOcrTranslatedBox").textContent.trim();
      if (!text) return;
      try {
        await navigator.clipboard.writeText(text);
        showAlert("success", "Đã sao chép kết quả dịch OCR.");
      } catch (_) {}
    }

    initApp();
  </script>
</body>
</html>`;
}
