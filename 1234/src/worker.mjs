import { createWordBridgeRuntime } from './api/router.mjs';
import { buildSecurityHeaders } from './utils/security.mjs';

/**
 * WORD BRIDGE — Full-Stack Interactive Web Platform Shell (SSR + Hydrated Client Controller)
 *
 * Implements:
 * - Locked Header with exact 8 navigation items + Login/Register or User Avatar Menu (NO PDF Reader).
 * - Locked Homepage with all 12 required sections (Zero fake vanity counters/dashboards).
 * - Public View vs Authenticated Action flows for:
 *   1. Trang chủ
 *   2. Học ngoại ngữ (Tiếng Trung, Tiếng Anh, Tiếng Nga)
 *   3. Từ điển (Tra từ, Pinyin/IPA/Cyrillic, bộ thủ, sổ từ cá nhân, Spaced Repetition)
 *   4. Luyện tập (Nghe, Nói, Đọc, Viết, Phát âm)
 *   5. Khảo thí (HSK, CEFR, TORFL/ТРКИ — Tuyệt đối không cấp chứng chỉ)
 *   6. Ngoại ngữ chuyên ngành (Chỉ Tiếng Trung và Tiếng Anh — Không có Tiếng Nga)
 *   7. Learner Meet (1-1 & Nhóm bằng Âm thanh/Video — Không chat, Không ghi âm/ghi hình, Không chia sẻ màn hình)
 *   8. Giới thiệu & 15 Hệ thống Trí tuệ Ngôn ngữ khác biệt
 *   9. Tài khoản cá nhân & Trung tâm bảo mật (Đăng ký 8 trường bắt buộc, OAuth 4 nhà cung cấp, Passkey WebAuthn, Chính sách Sinh viên 03 tháng Personal Plus)
 *   10. Quản trị viên 100% Tiếng Việt (5 nhóm phân hệ A–E và 7 Trung tâm Quản trị Chuyên sâu)
 *   11. Các trang Hỗ trợ & Chính sách ở Footer (Trung tâm trợ giúp, FAQ, Liên hệ, Điều khoản, Quyền riêng tư, Bảo vệ dữ liệu, Chính sách sử dụng).
 */

export function renderApplicationHtml(designCss = '') {
  return `<!DOCTYPE html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>WORD BRIDGE — Where Languages Bring People Together | Nền tảng Ngoại ngữ Trung – Anh – Nga</title>
  <meta name="description" content="WORD BRIDGE — Nền tảng học tập, thực hành, khảo thí và trí tuệ ngôn ngữ trực tuyến cho Tiếng Trung, Tiếng Anh và Tiếng Nga.">
  ${designCss ? `<style>${designCss}</style>` : `<link rel="stylesheet" href="/assets/design-system.css">`}
</head>
<body>
  <a href="#main-content" class="skip-link">Chuyển đến nội dung chính</a>

  <!-- HEADER ĐÃ CHỐT (PHẦN XI MỤC 39: 8 MỤC ĐIỀU HƯỚNG + ĐĂNG NHẬP/ĐĂNG KÝ - KHÔNG CÓ PDF READER) -->
  <header class="wb-header" role="banner">
    <div class="wb-header-inner">
      <a href="#trang-chu" class="wb-brand-slot" aria-label="WORD BRIDGE Trang chủ">
        <!-- Vị trí tích hợp Logo SVG chính thức (Đang dùng Wordmark chữ tạm thời theo PHẦN XI Mục 37) -->
        <div class="wb-wordmark" data-logo-slot="official-svg-pending">
          <span class="wb-wordmark-word">WORD</span>
          <span class="wb-wordmark-bridge">BRIDGE</span>
        </div>
        <span class="wb-tagline">Where Languages Bring People Together.</span>
      </a>

      <nav class="wb-nav" aria-label="Điều hướng chính">
        <a href="#trang-chu" class="wb-nav-link" aria-current="page">Trang chủ</a>
        <a href="#hoc-ngoai-ngu" class="wb-nav-link">Học ngoại ngữ</a>
        <a href="#tu-dien" class="wb-nav-link">Từ điển</a>
        <a href="#luyen-tap" class="wb-nav-link">Luyện tập</a>
        <a href="#khao-thi" class="wb-nav-link">Khảo thí</a>
        <a href="#ngoai-ngu-chuyen-nganh" class="wb-nav-link">Ngoại ngữ chuyên ngành</a>
        <a href="#learner-meet" class="wb-nav-link">Learner Meet</a>
        <a href="#gioi-thieu" class="wb-nav-link">Giới thiệu</a>
      </nav>

      <div class="wb-auth-actions" id="header-auth-zone">
        <a href="#dang-nhap" class="wb-btn wb-btn-outline" id="btn-header-login">Đăng nhập</a>
        <a href="#dang-ky" class="wb-btn wb-btn-primary" id="btn-header-register">Đăng ký</a>
        <div id="header-user-menu" style="display:none;align-items:center;gap:10px;">
          <span class="wb-badge" id="header-user-badge">Học viên</span>
          <a href="#trung-tam-bao-mat" class="wb-btn wb-btn-outline">Tài khoản &amp; Bảo mật</a>
          <a href="#quan-tri" class="wb-btn wb-btn-accent" id="btn-header-admin" style="display:none;">Quản trị</a>
          <button type="button" class="wb-btn wb-btn-outline" id="btn-logout">Đăng xuất</button>
        </div>
      </div>
    </div>
  </header>

  <main id="main-content" class="wb-container" role="main">
    <!-- KHU VỰC THÔNG BÁO TRẠNG THÁI THỰC TẾ -->
    <div id="wb-status-banner" role="status" aria-live="polite" style="display:none;padding:14px 18px;border-radius:8px;margin-bottom:20px;background:#e6f4f3;border-left:4px solid #146466;font-weight:600;"></div>

    <!-- 1. KHU VỰC HERO (TRANG CHỦ MỤC 1) -->
    <section id="trang-chu" class="wb-hero" aria-labelledby="hero-heading">
      <span class="wb-badge" style="background:#E2E2C4;color:#146466;">NỀN TẢNG HỌC TẬP &amp; THỰC HÀNH NGOẠI NGỮ TRỰC TUYẾN</span>
      <h1 id="hero-heading" style="font-size:2.2rem;margin:14px 0 10px;">WORD BRIDGE — Where Languages Bring People Together.</h1>
      <p style="font-size:1.08rem;max-width:860px;margin:0 0 22px;color:#F7F7EC;">
        Hệ sinh thái học tập, tra cứu từ điển, luyện tập bốn kỹ năng, khảo thí năng lực, ngoại ngữ chuyên ngành, thực hành trực tiếp Learner Meet và 15 hệ thống trí tuệ ngôn ngữ chuyên sâu dành cho <strong>Tiếng Trung</strong>, <strong>Tiếng Anh</strong> và <strong>Tiếng Nga</strong>.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap;">
        <a href="#hoc-ngoai-ngu" class="wb-btn wb-btn-accent">Khám phá Chương trình học</a>
        <a href="#he-thong-khac-biet" class="wb-btn" style="background:#E2E2C4;color:#146466;">Trải nghiệm 15 Hệ thống Trí tuệ Ngôn ngữ</a>
        <a href="#dang-ky" class="wb-btn wb-btn-outline" style="border-color:#E2E2C4;color:#ffffff;">Tạo tài khoản cá nhân</a>
      </div>
    </section>

    <!-- 2. GIỚI THIỆU WORD BRIDGE (TRANG CHỦ MỤC 2) -->
    <section id="gioi-thieu" class="wb-section" aria-labelledby="intro-heading">
      <h2 id="intro-heading" style="color:var(--wb-deep-teal);margin-top:0;">Giới thiệu WORD BRIDGE &amp; Nguyên tắc Vận hành</h2>
      <p>
        <strong>WORD BRIDGE</strong> được thiết kế từ gốc với kiến trúc học thuật chuẩn hóa cho người học Việt Nam và quốc tế. Nền tảng áp dụng nguyên tắc <strong>Công khai xem – Đăng nhập mới được sử dụng</strong>: khách truy cập có thể xem trước cấu trúc chương trình, nội dung bài học, đề bài tập và mục từ điển công khai; khi đăng nhập tài khoản cá nhân đã xác minh email, hệ thống mở khóa toàn bộ chức năng lưu tiến độ, tra cứu từ điển tương tác, sổ từ vựng Spaced Repetition, chấm điểm bài tập, khảo thí, Learner Meet và 15 hệ thống phân tích năng lực.
      </p>
      <div class="wb-grid-3" style="margin-top:16px;">
        <div class="wb-card">
          <strong>Kiến trúc Tài khoản Cá nhân &amp; Bảo mật</strong>
          <p style="margin:0;font-size:0.92rem;color:var(--wb-text-secondary);">Xác minh liên kết email (không dùng OTP), hỗ trợ OAuth (Google, Facebook, Microsoft, Apple) và khóa bảo mật WebAuthn/FIDO2 Passkey không lưu sinh trắc học.</p>
        </div>
        <div class="wb-card">
          <strong>Chính sách Hỗ trợ Sinh viên</strong>
          <p style="margin:0;font-size:0.92rem;color:var(--wb-text-secondary);">Miễn phí 03 tháng gói Personal Plus (hưởng 1 lần duy nhất) khi xác minh bằng email sinh viên do trường cấp (không nhận ảnh thẻ sinh viên thay thế).</p>
        </div>
        <div class="wb-card">
          <strong>Tập trung Học thuật Thuần túy</strong>
          <p style="margin:0;font-size:0.92rem;color:var(--wb-text-secondary);">Không mạng xã hội, không bảng tin gây xao nhãng, không cấp chứng chỉ thương mại hóa, không ghi âm hay lưu nội dung phiên Learner Meet.</p>
        </div>
      </div>
    </section>

    <!-- 3. BA NGÔN NGỮ HỌC TẬP (TRANG CHỦ MỤC 3) -->
    <section class="wb-section" aria-labelledby="three-langs-heading">
      <h2 id="three-langs-heading" style="color:var(--wb-deep-teal);margin-top:0;">Ba Ngôn ngữ Học tập Chính thức: Tiếng Trung – Tiếng Anh – Tiếng Nga</h2>
      <p style="color:var(--wb-text-secondary);">Phạm vi ngôn ngữ được kiểm soát chặt chẽ tại tầng cơ sở dữ liệu và API (Không xây dựng tiếng Nhật hoặc tiếng Hàn).</p>
      <div class="wb-table-wrap">
        <table class="wb-table" aria-label="Bảng phạm vi ba ngôn ngữ học tập">
          <thead>
            <tr>
              <th>Ngôn ngữ</th>
              <th>Tên bản ngữ</th>
              <th>Học tổng quát</th>
              <th>Học chuyên ngành</th>
              <th>Hệ quy chiếu trình độ</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>Tiếng Trung (zh)</strong></td>
              <td class="lang-zh">中文 (普通话)</td>
              <td><span class="wb-badge">Có hỗ trợ</span></td>
              <td><span class="wb-badge">Có hỗ trợ</span></td>
              <td>HSK 1–6 &amp; HSK 7–9 (Tham chiếu CEFR A1–C2)</td>
            </tr>
            <tr>
              <td><strong>Tiếng Anh (en)</strong></td>
              <td>English</td>
              <td><span class="wb-badge">Có hỗ trợ</span></td>
              <td><span class="wb-badge">Có hỗ trợ</span></td>
              <td>CEFR A1–C2 (Tham chiếu IELTS / TOEFL / Cambridge)</td>
            </tr>
            <tr>
              <td><strong>Tiếng Nga (ru)</strong></td>
              <td class="lang-ru">Русский язык</td>
              <td><span class="wb-badge">Có hỗ trợ</span></td>
              <td><span class="wb-badge wb-badge-red">Không hỗ trợ chuyên ngành</span></td>
              <td>TORFL / ТРКИ (ТЭУ, ТБУ, ТРКИ-I đến ТРКИ-IV)</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- 4. CHƯƠNG TRÌNH HỌC & BÀI HỌC (TRANG CHỦ MỤC 4) -->
    <section id="hoc-ngoai-ngu" class="wb-section" aria-labelledby="programs-heading">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <h2 id="programs-heading" style="color:var(--wb-deep-teal);margin:0;">Học ngoại ngữ: Chương trình, Giáo trình &amp; Bài học 12 Thành phần</h2>
        <div>
          <label for="filter-program-lang" style="font-weight:600;margin-right:8px;">Lọc ngôn ngữ:</label>
          <select id="filter-program-lang" class="wb-select" style="width:auto;display:inline-block;">
            <option value="">Tất cả (Trung – Anh – Nga)</option>
            <option value="zh">Tiếng Trung (中文)</option>
            <option value="en">Tiếng Anh (English)</option>
            <option value="ru">Tiếng Nga (Русский)</option>
          </select>
        </div>
      </div>
      <p style="color:var(--wb-text-secondary);">Cấu trúc phân cấp chuẩn: Ngôn ngữ → Chương trình → Cấp độ → Giáo trình → Bài học → Luyện tập → Đánh giá → Tiến độ.</p>
      <div id="programs-list-container" class="wb-grid-3" style="margin-top:16px;"></div>
      <h3 style="color:var(--wb-deep-teal);margin-top:28px;">Danh sách Bài học Công khai Xem trước (Đăng nhập để Bắt đầu &amp; Lưu tiến độ)</h3>
      <div id="lessons-list-container" class="wb-grid-2"></div>
    </section>

    <!-- 5. NGOẠI NGỮ CHUYÊN NGÀNH (TRANG CHỦ MỤC 5) -->
    <section id="ngoai-ngu-chuyen-nganh" class="wb-section" aria-labelledby="esp-heading">
      <h2 id="esp-heading" style="color:var(--wb-deep-teal);margin-top:0;">Ngoại ngữ Chuyên ngành (Dành riêng cho Tiếng Trung và Tiếng Anh)</h2>
      <p>
        Hệ thống ngoại ngữ chuyên ngành tích hợp trực tiếp với <strong>Hệ thống #3 (Knowledge-to-Language)</strong> cho phép học viên làm chủ thuật ngữ, quy trình nghiệp vụ và giao tiếp chuyên môn. Theo đúng quy định sản phẩm, phân hệ này <strong>chỉ phục vụ Tiếng Trung và Tiếng Anh</strong> (tuyệt đối không mở cho Tiếng Nga).
      </p>
      <div class="wb-grid-2" id="specialized-courses-container">
        <div class="wb-card">
          <div>
            <span class="wb-badge">Tiếng Trung Chuyên Ngành (zh)</span>
            <h3 class="lang-zh" style="margin:8px 0;">国际物流、跨境贸易与制造业工程汉语</h3>
            <p style="font-size:0.92rem;">Bao gồm vận đơn đường biển (海运提单), thủ tục thông quan (报关清关), quản lý chuỗi cung ứng (供应链管理) và kỹ thuật nhà máy bán dẫn/cơ điện.</p>
          </div>
          <button type="button" class="wb-btn wb-btn-primary" data-esp-lang="zh" data-esp-domain="LOGISTICS">Tải học liệu &amp; Tình huống Tiếng Trung Chuyên ngành</button>
        </div>
        <div class="wb-card">
          <div>
            <span class="wb-badge">Tiếng Anh Chuyên Ngành (en)</span>
            <h3 style="margin:8px 0;">English for Specific Purposes (8 Nhóm ngành trọng điểm)</h3>
            <p style="font-size:0.92rem;">Công nghệ thông tin &amp; Cloud, Kỹ thuật Cơ khí, Điện - Điện tử, Công nghệ Ô tô, Kinh tế - Du lịch, Thiết kế Đồ họa, Điều dưỡng - Y dược, và Logistics - Xuất nhập khẩu.</p>
          </div>
          <button type="button" class="wb-btn wb-btn-primary" data-esp-lang="en" data-esp-domain="IT_CLOUD">Tải học liệu &amp; Tình huống Tiếng Anh Chuyên ngành</button>
        </div>
      </div>
      <div id="esp-interactive-output" style="margin-top:16px;"></div>
    </section>

    <!-- 6. TỪ ĐIỂN & KHO TỪ VỰNG (TRANG CHỦ MỤC 6) -->
    <section id="tu-dien" class="wb-section" aria-labelledby="dict-heading">
      <h2 id="dict-heading" style="color:var(--wb-deep-teal);margin-top:0;">Từ điển Đa Ngôn ngữ &amp; Sổ Từ vựng Spaced Repetition</h2>
      <p style="color:var(--wb-text-secondary);">Hỗ trợ tra từ, cụm từ, phiên âm Pinyin/IPA/Cyrillic, từ loại, nghĩa tiếng Việt, ví dụ ngữ cảnh, từ đồng nghĩa/trái nghĩa, họ từ, collocation, phân tích bộ thủ chữ Hán và thuật ngữ chuyên ngành Trung – Anh.</p>
      <form id="form-dictionary-search" style="display:flex;gap:10px;flex-wrap:wrap;margin-bottom:20px;">
        <input type="search" id="dict-query-input" class="wb-input" style="flex:1;min-width:220px;" placeholder="Nhập từ vựng (VD: 供应链, 桥梁, resilience, idempotency, вдохновение)..." aria-label="Từ khóa tra cứu từ điển">
        <select id="dict-lang-select" class="wb-select" style="width:auto;" aria-label="Ngôn ngữ từ điển">
          <option value="">Tất cả ngôn ngữ</option>
          <option value="zh">Tiếng Trung (中文)</option>
          <option value="en">Tiếng Anh (English)</option>
          <option value="ru">Tiếng Nga (Русский)</option>
        </select>
        <button type="submit" class="wb-btn wb-btn-primary">Tra cứu tương tác (Yêu cầu đăng nhập)</button>
      </form>
      <div id="dictionary-results-container" class="wb-grid-2"></div>
    </section>

    <!-- 7. LUYỆN TẬP BỐN KỸ NĂNG (TRANG CHỦ MỤC 7) -->
    <section id="luyen-tap" class="wb-section" aria-labelledby="practice-heading">
      <h2 id="practice-heading" style="color:var(--wb-deep-teal);margin-top:0;">Luyện tập Tương tác Bốn Kỹ năng (Listening – Speaking – Reading – Writing)</h2>
      <p style="color:var(--wb-text-secondary);">Khách chưa đăng nhập có thể xem nội dung bài tập bên dưới. Để nộp bài, chấm điểm phát âm/viết và lưu kết quả cá nhân, hệ thống yêu cầu xác thực tại Backend.</p>
      <div id="exercises-list-container" class="wb-grid-2"></div>
    </section>

    <!-- 8. KHẢO THÍ & ĐÁNH GIÁ NĂNG LỰC (TRANG CHỦ MỤC 8 - KHÔNG CẤP CHỨNG CHỈ) -->
    <section id="khao-thi" class="wb-section" aria-labelledby="exam-heading">
      <h2 id="exam-heading" style="color:var(--wb-deep-teal);margin-top:0;">Trung tâm Khảo thí &amp; Đánh giá Năng lực Ngôn ngữ</h2>
      <div style="padding:12px 16px;background:var(--wb-warm-ivory-light);border-left:4px solid var(--wb-vermilion-red);border-radius:6px;margin-bottom:18px;font-size:0.92rem;">
        <strong>Quy định Khảo thí WORD BRIDGE (PHẦN IV Mục 14.1 &amp; PHẦN VIII Mục 24):</strong> Hệ thống thực hiện chấm điểm, lưu kết quả và phân tích năng lực chuyên sâu theo chuẩn tham chiếu HSK, CEFR và TORFL/ТРКИ. <strong>WORD BRIDGE tuyệt đối không xây dựng chức năng cấp chứng chỉ</strong> dưới mọi hình thức.
      </div>
      <div id="exams-list-container" class="wb-grid-3"></div>
      <div id="exam-active-workspace" style="margin-top:20px;"></div>
    </section>

    <!-- 9. LEARNER MEET (TRANG CHỦ MỤC 9 - CHỈ ÂM THANH & VIDEO, KHÔNG CHAT, KHÔNG GHI ÂM/GHI HÌNH) -->
    <section id="learner-meet" class="wb-section" aria-labelledby="meet-heading">
      <h2 id="meet-heading" style="color:var(--wb-deep-teal);margin-top:0;">Learner Meet — Thực hành Hội thoại Trực tiếp 1–1 &amp; Nhóm bằng Âm thanh / Video</h2>
      <div style="padding:14px 18px;background:#fff8f6;border:1px solid var(--wb-vermilion-red);border-radius:8px;margin-bottom:18px;font-size:0.92rem;">
        <strong>Thông báo Quyền riêng tư &amp; Giới hạn Kỹ thuật Learner Meet (PHẦN IV Mục 14.3 &amp; 14.4):</strong>
        <ul style="margin:6px 0 0 0;padding-left:20px;">
          <li>Learner Meet <strong>chỉ hỗ trợ âm thanh (Microphone) và hình ảnh (Camera) thời gian thực</strong>.</li>
          <li><strong>Tuyệt đối không có:</strong> Chat văn bản, gửi tin nhắn, gửi tệp đính kèm, chia sẻ màn hình (Screen Share), hoặc nút Ghi âm/Ghi hình (Record).</li>
          <li>Hệ thống <strong>không chủ động ghi âm, ghi hình hay lưu trữ nội dung phiên</strong> và không bao giờ sử dụng phiên thực hành để huấn luyện AI hoặc quảng cáo (chỉ lưu metadata thời điểm tham gia/rời phiên).</li>
          <li><em>Lưu ý minh bạch:</em> Nền tảng không thể ngăn chặn việc người tham gia tự ghi lại bằng thiết bị phần cứng hoặc phần mềm bên ngoài của họ.</li>
        </ul>
      </div>

      <div class="wb-grid-2">
        <div class="wb-card">
          <h3 style="margin:0;">Tạo phiên Thực hành Learner Meet mới</h3>
          <form id="form-create-meet">
            <div class="wb-form-group">
              <label for="meet-lang">Ngôn ngữ thực hành</label>
              <select id="meet-lang" class="wb-select" required>
                <option value="en">Tiếng Anh (English)</option>
                <option value="zh">Tiếng Trung (中文)</option>
                <option value="ru">Tiếng Nga (Русский)</option>
              </select>
            </div>
            <div class="wb-form-group">
              <label for="meet-mode">Hình thức phiên</label>
              <select id="meet-mode" class="wb-select" required>
                <option value="ONE_ON_ONE">Thực hành 1–1 (Tối đa 2 người)</option>
                <option value="GROUP">Thực hành Nhóm (3–12 người)</option>
              </select>
            </div>
            <div class="wb-form-group">
              <label for="meet-topic">Chủ đề hội thoại</label>
              <input type="text" id="meet-topic" class="wb-input" placeholder="VD: Phản xạ đàm phán Logistics / Thuyết trình học thuật" required>
            </div>
            <button type="submit" class="wb-btn wb-btn-primary">Khởi tạo Phiên (Yêu cầu đăng nhập)</button>
          </form>
        </div>

        <div class="wb-card">
          <h3 style="margin:0;">Bảng Điều khiển Âm thanh &amp; Video Trực tiếp</h3>
          <p id="meet-room-status" style="font-size:0.92rem;color:var(--wb-text-secondary);">Chưa tham gia phiên nào. Hãy đăng nhập và tạo hoặc tham gia một phiên.</p>
          <div style="display:flex;gap:10px;flex-wrap:wrap;">
            <button type="button" class="wb-btn wb-btn-outline" id="btn-meet-mic" disabled>Bật / Tắt Microphone</button>
            <button type="button" class="wb-btn wb-btn-outline" id="btn-meet-cam" disabled>Bật / Tắt Camera</button>
            <button type="button" class="wb-btn wb-btn-accent" id="btn-meet-leave" disabled>Rời phiên</button>
          </div>
          <div id="meet-active-rooms-list" style="margin-top:12px;"></div>
        </div>
      </div>
    </section>

    <!-- 10. 15 HỆ THỐNG TRÍ TUỆ NGÔN NGỮ KHÁC BIỆT (TRANG CHỦ MỤC 10) -->
    <section id="he-thong-khac-biet" class="wb-section" aria-labelledby="li-heading">
      <h2 id="li-heading" style="color:var(--wb-deep-teal);margin-top:0;">15 Hệ thống Trí tuệ Ngôn ngữ Khác biệt của WORD BRIDGE</h2>
      <p style="color:var(--wb-text-secondary);">
        Mỗi hệ thống dưới đây đều có bảng cơ sở dữ liệu riêng trong D1, thuật toán định lượng thực tế và API xử lý trực tiếp tại <code>/api/language-intelligence/evaluate/:slug</code>. Nhấn vào bất kỳ hệ thống nào để chạy phân tích trực tiếp.
      </p>
      <div id="fifteen-systems-grid" class="wb-grid-3"></div>
      <div id="li-evaluation-console" style="margin-top:22px;padding:20px;background:var(--wb-warm-ivory-light);border:1px solid var(--wb-aqua);border-radius:10px;display:none;">
        <h3 id="li-console-title" style="margin-top:0;color:var(--wb-deep-teal);">Kết quả Phân tích Hệ thống Trí tuệ Ngôn ngữ</h3>
        <pre id="li-console-output" style="background:#122425;color:#E2E2C4;padding:16px;border-radius:8px;overflow-x:auto;font-size:0.86rem;"></pre>
      </div>
    </section>

    <!-- 11. ĐĂNG KÝ, ĐĂNG NHẬP & TRUNG TÂM BẢO MẬT (TRANG CHỦ MỤC 11) -->
    <section id="dang-ky" class="wb-section" aria-labelledby="auth-section-heading">
      <h2 id="auth-section-heading" style="color:var(--wb-deep-teal);margin-top:0;">Tài khoản Cá nhân, Đăng ký 8 Trường Bắt buộc &amp; Trung tâm Bảo mật</h2>
      <div class="wb-grid-2">
        <!-- Form Đăng ký trực tiếp bằng Email & Mật khẩu -->
        <div class="wb-card">
          <h3 style="margin-top:0;color:var(--wb-deep-teal);">Đăng ký Tài khoản Cá nhân Mới (Xác minh qua Liên kết Email)</h3>
          <p style="font-size:0.86rem;color:var(--wb-text-secondary);margin-top:0;">
            Tất cả 8 trường dưới đây là bắt buộc. <strong>Trường học</strong> và <strong>Nơi làm việc/tổ chức công tác</strong> là hai trường độc lập. Không dùng OTP.
          </p>
          <form id="form-register">
            <div class="wb-form-group">
              <label for="reg-fullname">1. Họ và tên *</label>
              <input type="text" id="reg-fullname" class="wb-input" required placeholder="Nguyễn Văn An">
            </div>
            <div class="wb-grid-2" style="gap:12px;">
              <div class="wb-form-group">
                <label for="reg-dob">2. Ngày sinh *</label>
                <input type="date" id="reg-dob" class="wb-input" required value="2002-05-15">
              </div>
              <div class="wb-form-group">
                <label for="reg-phone">3. Số điện thoại *</label>
                <input type="tel" id="reg-phone" class="wb-input" required placeholder="+84901234567">
              </div>
            </div>
            <div class="wb-form-group">
              <label for="reg-email">4. Địa chỉ Email *</label>
              <input type="email" id="reg-email" class="wb-input" required placeholder="hocvien@example.edu.vn">
            </div>
            <div class="wb-grid-2" style="gap:12px;">
              <div class="wb-form-group">
                <label for="reg-password">5. Mật khẩu * (≥8 ký tự, Hoa/thường/số)</label>
                <input type="password" id="reg-password" class="wb-input" required placeholder="WordBridge2026">
              </div>
              <div class="wb-form-group">
                <label for="reg-confirm">6. Xác nhận mật khẩu *</label>
                <input type="password" id="reg-confirm" class="wb-input" required placeholder="WordBridge2026">
              </div>
            </div>
            <div class="wb-form-group">
              <label for="reg-school">7. Trường học * (Trường bắt buộc riêng biệt)</label>
              <input type="text" id="reg-school" class="wb-input" required placeholder="Trường Đại học / Cao đẳng đang theo học hoặc đã tốt nghiệp">
            </div>
            <div class="wb-form-group">
              <label for="reg-workplace">8. Nơi làm việc / Tổ chức công tác * (Trường bắt buộc riêng biệt)</label>
              <input type="text" id="reg-workplace" class="wb-input" required placeholder="Tên doanh nghiệp / Đơn vị công tác hoặc Thực tập">
            </div>
            <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Đăng ký &amp; Nhận Liên kết Xác minh Email</button>
          </form>
          <div id="register-verification-box" style="display:none;margin-top:14px;padding:12px;background:#e6f4f3;border-radius:8px;font-size:0.9rem;"></div>
        </div>

        <!-- Form Đăng nhập, OAuth, Passkey & Ưu đãi Sinh viên -->
        <div class="wb-card" id="dang-nhap">
          <div>
            <h3 style="margin-top:0;color:var(--wb-deep-teal);">Đăng nhập, Liên kết OAuth &amp; Khóa Passkey (WebAuthn/FIDO2)</h3>
            <form id="form-login">
              <div class="wb-form-group">
                <label for="login-email">Email</label>
                <input type="email" id="login-email" class="wb-input" required placeholder="hocvien@example.edu.vn">
              </div>
              <div class="wb-form-group">
                <label for="login-password">Mật khẩu</label>
                <input type="password" id="login-password" class="wb-input" required placeholder="••••••••">
              </div>
              <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Đăng nhập bằng Email &amp; Mật khẩu</button>
            </form>

            <div style="margin-top:18px;padding-top:14px;border-top:1px solid var(--wb-border);">
              <strong style="font-size:0.9rem;">Đăng nhập Liên kết (Không tự gộp tài khoản trùng email):</strong>
              <div style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px;margin-top:8px;">
                <button type="button" class="wb-btn wb-btn-outline btn-oauth" data-provider="google">Google OAuth</button>
                <button type="button" class="wb-btn wb-btn-outline btn-oauth" data-provider="facebook">Facebook OAuth</button>
                <button type="button" class="wb-btn wb-btn-outline btn-oauth" data-provider="microsoft">Microsoft OAuth</button>
                <button type="button" class="wb-btn wb-btn-outline btn-oauth" data-provider="apple">Apple Sign-In</button>
              </div>
            </div>

            <div id="trung-tam-bao-mat" style="margin-top:18px;padding-top:14px;border-top:1px solid var(--wb-border);">
              <strong style="font-size:0.9rem;">Trung tâm Bảo mật, Passkey (FIDO2) &amp; Chính sách Sinh viên 03 tháng:</strong>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:10px;">
                <button type="button" class="wb-btn wb-btn-outline" id="btn-add-passkey">Thêm Passkey Mới</button>
                <button type="button" class="wb-btn wb-btn-outline" id="btn-view-security">Xem Trung tâm Bảo mật</button>
                <button type="button" class="wb-btn wb-btn-accent" id="btn-claim-student">Kích hoạt 03 tháng Sinh viên (.edu)</button>
              </div>
              <div id="security-center-panel" style="margin-top:12px;font-size:0.88rem;"></div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- 12. HỆ THỐNG QUẢN TRỊ 100% TIẾNG VIỆT (PHẦN X: 5 NHÓM PHÂN HỆ & 7 TRUNG TÂM CHUYÊN SÂU) -->
    <section id="quan-tri" class="wb-section" aria-labelledby="admin-heading">
      <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
        <h2 id="admin-heading" style="color:var(--wb-deep-teal);margin:0;">Hệ thống Quản trị WORD BRIDGE (Giao diện 100% Tiếng Việt)</h2>
        <span class="wb-badge">Kiểm soát quyền truy cập bằng RBAC (9 Vai trò Quản trị)</span>
      </div>
      <p style="color:var(--wb-text-secondary);">
        Toàn bộ nhãn, menu, trạng thái và thông báo trong phân hệ quản trị sử dụng tiếng Việt thống nhất. Không cấp quyền quản trị mặc định cho tài khoản mới; mọi thao tác thay đổi quyền đều lưu nhật ký kiểm toán bảo mật.
      </p>

      <h3 style="color:var(--wb-deep-teal);">Bảy Trung tâm Quản trị Chuyên sâu</h3>
      <div class="wb-grid-3" id="seven-admin-centers-grid">
        <div class="wb-card"><strong>1. Trung tâm biên tập học liệu</strong><span style="font-size:0.88rem;">Tạo, chỉnh sửa, xem trước, duyệt, phát hành và quản lý phiên bản bài học, từ điển, ngữ pháp.</span></div>
        <div class="wb-card"><strong>2. Trung tâm quản trị khảo thí</strong><span style="font-size:0.88rem;">Quản lý ngân hàng câu hỏi, cấu hình đề thi, chấm điểm và phân tích kết quả (Không cấp chứng chỉ).</span></div>
        <div class="wb-card"><strong>3. Trung tâm trí tuệ học tập</strong><span style="font-size:0.88rem;">Giám sát thuật toán, dữ liệu đầu vào/đầu ra và trạng thái vận hành của 15 hệ thống khác biệt.</span></div>
        <div class="wb-card"><strong>4. Trung tâm đa ngôn ngữ</strong><span style="font-size:0.88rem;">Quản trị chuẩn ngôn ngữ Tiếng Trung, Tiếng Anh, Tiếng Nga và khóa phạm vi chuyên ngành.</span></div>
        <div class="wb-card"><strong>5. Trung tâm chất lượng ngôn ngữ</strong><span style="font-size:0.88rem;">Rà soát độ chính xác phiên âm, ngữ cảnh, từ đồng nghĩa, collocation và ví dụ học thuật.</span></div>
        <div class="wb-card"><strong>6. Trung tâm bảo mật và kiểm toán</strong><span style="font-size:0.88rem;">Theo dõi nhật ký kiểm toán RBAC, cảnh báo bảo mật, phiên đăng nhập và yêu cầu quyền riêng tư.</span></div>
        <div class="wb-card"><strong>7. Trung tâm vận hành hạ tầng</strong><span style="font-size:0.88rem;">Giám sát Cloudflare D1 (<code>word</code>), R2 (<code>word</code>), quét tệp mồ côi, Email Adapter và sao lưu phục hồi.</span></div>
      </div>

      <h3 style="color:var(--wb-deep-teal);margin-top:24px;">Năm Nhóm Phân hệ Quản trị (A – E)</h3>
      <div class="wb-table-wrap">
        <table class="wb-table" aria-label="Bảng các phân hệ quản trị tiếng Việt">
          <thead>
            <tr>
              <th>Nhóm phân hệ</th>
              <th>Các module quản trị trực thuộc</th>
              <th>Trạng thái kiểm soát</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td><strong>A. Quản trị nền tảng</strong></td>
              <td>1. Dashboard • 2. Tài khoản • 3. RBAC • 4. Quản lý ngôn ngữ • 5. Cấu hình nền tảng</td>
              <td><span class="wb-badge">Hoạt động thực tế</span></td>
            </tr>
            <tr>
              <td><strong>B. Quản trị học thuật</strong></td>
              <td>1. Chương trình học • 2. Giáo trình • 3. Khóa học • 4. Bài học • 5. Lộ trình • 6. Học liệu • 7. Từ điển • 8. Ngữ pháp • 9. Ngoại ngữ chuyên ngành</td>
              <td><span class="wb-badge">Hoạt động thực tế</span></td>
            </tr>
            <tr>
              <td><strong>C. Luyện tập và khảo thí</strong></td>
              <td>1. Luyện tập • 2. Ngân hàng câu hỏi • 3. Bài thi • 4. Đánh giá năng lực • 5. Vận hành Learner Meet</td>
              <td><span class="wb-badge">Hoạt động thực tế</span></td>
            </tr>
            <tr>
              <td><strong>D. Trí tuệ ngôn ngữ</strong></td>
              <td>1. Quản lý và giám sát 15 hệ thống trí tuệ ngôn ngữ</td>
              <td><span class="wb-badge">Hoạt động thực tế</span></td>
            </tr>
            <tr>
              <td><strong>E. Bảo mật và vận hành</strong></td>
              <td>1. Bảo mật và kiểm toán • 2. Hạ tầng và dữ liệu (Cloudflare D1 &amp; R2)</td>
              <td><span class="wb-badge">Hoạt động thực tế</span></td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- CÁC TRANG HỖ TRỢ & CHÍNH SÁCH ĐƯỢC LIÊN KẾT TỪ FOOTER (ĐẢM BẢO MỌI LIÊN KẾT ĐỀU TỒN TẠI THỰC TẾ) -->
    <section id="ho-tro-chinh-sach" class="wb-section" aria-labelledby="policy-heading">
      <h2 id="policy-heading" style="color:var(--wb-deep-teal);margin-top:0;">Hỗ trợ Học viên &amp; Hệ thống Chính sách Nền tảng</h2>
      <div class="wb-grid-2">
        <div class="wb-card" id="trung-tam-tro-giup">
          <h3 style="margin:0;color:var(--wb-deep-teal);">Trung tâm Trợ giúp &amp; Câu hỏi Thường gặp (FAQ)</h3>
          <p id="cau-hoi-thuong-gap" style="font-size:0.9rem;margin:0;">
            <strong>1. Làm sao để kích hoạt tài khoản?</strong> Mở liên kết xác minh được gửi tới email sau khi hoàn tất biểu mẫu 8 trường bắt buộc.<br>
            <strong>2. Sinh viên nhận gói Personal Plus 03 tháng thế nào?</strong> Xác minh bằng địa chỉ email sinh viên do trường cấp (<code>.edu.vn</code> / <code>.edu</code>).<br>
            <strong>3. Liên hệ hỗ trợ trực tiếp:</strong> <span id="lien-he-ho-tro">Chăm sóc khách hàng: <a href="mailto:cskh@wordbridge.vn">cskh@wordbridge.vn</a> | Hợp tác: <a href="mailto:contact@wordbridge.vn">contact@wordbridge.vn</a></span>.
          </p>
        </div>
        <div class="wb-card" id="dieu-khoan-chinh-sach">
          <h3 style="margin:0;color:var(--wb-deep-teal);">Điều khoản, Quyền riêng tư &amp; Bảo vệ Dữ liệu</h3>
          <p style="font-size:0.9rem;margin:0;">
            <strong id="dieu-khoan-su-dung">• Điều khoản sử dụng:</strong> Chỉ sử dụng tài khoản cá nhân; tuân thủ phân quyền RBAC.<br>
            <strong id="chinh-sach-quyen-rieng-tu">• Chính sách quyền riêng tư:</strong> Không bán dữ liệu cá nhân; không lưu sinh trắc học Passkey.<br>
            <strong id="chinh-sach-bao-ve-du-lieu">• Chính sách bảo vệ dữ liệu:</strong> Mã hóa mật khẩu PBKDF2-SHA256, phân tách dữ liệu công khai/riêng tư trên R2.<br>
            <strong id="chinh-sach-su-dung-nen-tang">• Chính sách sử dụng nền tảng:</strong> Không ghi âm/ghi hình Learner Meet; văn bản chính thức đang chờ bộ phận pháp chế phê duyệt cuối cùng (Nhóm C).
          </p>
        </div>
      </div>
    </section>
  </main>

  <!-- FOOTER ĐÃ CHỐT (PHẦN XI MỤC 40: 4 CỘT KHÁM PHÁ, HỌC TẬP, HỖ TRỢ, CHÍNH SÁCH + THÔNG TIN THƯƠNG HIỆU - KHÔNG CÓ PDF READER) -->
  <footer class="wb-footer" role="contentinfo">
    <div class="wb-footer-inner">
      <div>
        <h3>Khám phá</h3>
        <ul>
          <li><a href="#trang-chu">Trang chủ</a></li>
          <li><a href="#gioi-thieu">Giới thiệu</a></li>
          <li><a href="#hoc-ngoai-ngu">Học ngoại ngữ</a></li>
          <li><a href="#ngoai-ngu-chuyen-nganh">Ngoại ngữ chuyên ngành</a></li>
        </ul>
      </div>
      <div>
        <h3>Học tập</h3>
        <ul>
          <li><a href="#tu-dien">Từ điển</a></li>
          <li><a href="#luyen-tap">Luyện tập</a></li>
          <li><a href="#khao-thi">Khảo thí</a></li>
          <li><a href="#learner-meet">Learner Meet</a></li>
        </ul>
      </div>
      <div>
        <h3>Hỗ trợ</h3>
        <ul>
          <li><a href="#trung-tam-tro-giup">Trung tâm trợ giúp</a></li>
          <li><a href="#cau-hoi-thuong-gap">Câu hỏi thường gặp</a></li>
          <li><a href="#lien-he-ho-tro">Liên hệ hỗ trợ</a></li>
        </ul>
      </div>
      <div>
        <h3>Chính sách</h3>
        <ul>
          <li><a href="#dieu-khoan-su-dung">Điều khoản sử dụng</a></li>
          <li><a href="#chinh-sach-quyen-rieng-tu">Chính sách quyền riêng tư</a></li>
          <li><a href="#chinh-sach-bao-ve-du-lieu">Chính sách bảo vệ dữ liệu</a></li>
          <li><a href="#chinh-sach-su-dung-nen-tang">Chính sách sử dụng nền tảng</a></li>
        </ul>
      </div>
    </div>
    <div class="wb-footer-brand">
      <div style="font-weight:800;font-size:1.05rem;">WORD BRIDGE</div>
      <div>Where Languages Bring People Together.</div>
      <div>Nền tảng học tập và thực hành ngoại ngữ Trung – Anh – Nga.</div>
      <div style="margin-top:6px;">© 2026 WORD BRIDGE. All rights reserved.</div>
    </div>
  </footer>

  <script type="module" src="/assets/app-client.js"></script>
</body>
</html>`;
}

/**
 * WORD BRIDGE — Cloudflare Worker Entrypoint (ES Module Format)
 * Website: https://wordbridge.io.vn/
 * Bindings:
 * - DB: Cloudflare D1 `word` (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
 * - STORAGE: Cloudflare R2 `word`
 */





let sharedRuntime = null;

export function getOrCreateRuntime(env = {}) {
  if (!sharedRuntime) {
    sharedRuntime = createWordBridgeRuntime(env);
  }
  return sharedRuntime;
}

export default {
  async fetch(request, env = {}, ctx = {}) {
    const runtime = getOrCreateRuntime(env);
    const url = new URL(request.url);

    if (url.pathname.startsWith('/api/')) {
      return runtime.handleApiRequest(request);
    }

    if (env.ASSETS && typeof env.ASSETS.fetch === 'function' && url.pathname.startsWith('/assets/')) {
      return env.ASSETS.fetch(request);
    }

    const html = renderApplicationHtml();
    return new Response(html, {
      status: 200,
      headers: {
        ...buildSecurityHeaders(env.APP_URL || 'https://wordbridge.io.vn'),
        'Content-Type': 'text/html; charset=utf-8',
      },
    });
  },
};
