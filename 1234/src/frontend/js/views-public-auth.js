'use strict';

(function (WB) {
  // 1. TRANG CHỦ WORD BRIDGE (PHẦN IV.2, 3, 4 - Khớp 100% ảnh mẫu trang chủ được duyệt, icon SVG đơn sắc, ẩn URL thô)
  WB.registerView('/', async function (root) {
    const langs = WB.state.bootstrap?.languages || [];
    const plans = WB.state.bootstrap?.pricing?.plans || [];

    root.innerHTML = `
      <!-- HERO TRANG CHỦ ĐÃ DUYỆT -->
      <section class="wb-hero">
        <div class="wb-container wb-hero-grid">
          <div>
            <div class="wb-hero-kicker">Nền tảng ngoại ngữ và<br/>cộng đồng học tập</div>
            <h1 class="wb-hero-brand-line">
              <span class="word-part">WORD</span> <span class="bridge-part">BRIDGE</span>
            </h1>
            <div class="wb-hero-slogan">Where Languages Bring People Together.</div>
            <p class="wb-hero-desc">
              <strong>Học ngoại ngữ • Kết nối người học • Đồng hành cùng tổ chức</strong><br/>
              Cùng xây dựng một cộng đồng học tập đa ngôn ngữ, cởi mở và bền vững.
            </p>
            <div style="display:flex;gap:14px;flex-wrap:wrap;">
              <a href="/dang-ky" class="wb-btn wb-btn-accent wb-btn-pill" data-nav="/dang-ky">
                ${WB.icon('userPlus', 18)}
                <span>Đăng ký tài khoản</span>
              </a>
              <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-outline wb-btn-pill" data-nav="/dang-ky-to-chuc">
                ${WB.icon('building', 18)}
                <span>Đăng ký tổ chức</span>
              </a>
            </div>
          </div>
          <div>
            <img src="/assets/banners/hero-globe-books.webp" alt="Minh họa Địa cầu và Sách ngoại ngữ WORD BRIDGE" style="width:100%;height:auto;max-height:380px;object-fit:contain;border-radius:18px;display:block;" />
          </div>
        </div>
      </section>

      <div class="wb-container">
        <!-- THANH 05 NHÓM GIÁ TRỊ (PHẦN IV.3) -->
        <nav class="wb-pillars-strip" aria-label="Năm nhóm giá trị cốt lõi">
          <a href="/hoc-tap" class="wb-pillar-item" data-nav="/hoc-tap">
            <div class="wb-pillar-icon">${WB.icon('cap', 22)}</div>
            <div>
              <strong>Học ngoại ngữ</strong>
              <span>Theo lộ trình phù hợp</span>
            </div>
          </a>
          <a href="/ket-noi" class="wb-pillar-item" data-nav="/ket-noi">
            <div class="wb-pillar-icon">${WB.icon('users', 22)}</div>
            <div>
              <strong>Kết nối cộng đồng</strong>
              <span>Người học toàn cầu</span>
            </div>
          </a>
          <a href="/cong-dong/to-chuc" class="wb-pillar-item" data-nav="/cong-dong/to-chuc">
            <div class="wb-pillar-icon">${WB.icon('building', 22)}</div>
            <div>
              <strong>Đồng hành cùng tổ chức</strong>
              <span>Câu lạc bộ, đội, nhóm, đơn vị</span>
            </div>
          </a>
          <a href="/khao-thi" class="wb-pillar-item" data-nav="/khao-thi">
            <div class="wb-pillar-icon">${WB.icon('calendar', 22)}</div>
            <div>
              <strong>Khảo Thí</strong>
              <span>Đánh giá năng lực, cấp chứng nhận</span>
            </div>
          </a>
          <a href="/tien-do" class="wb-pillar-item" data-nav="/tien-do">
            <div class="wb-pillar-icon">${WB.icon('award', 22)}</div>
            <div>
              <strong>Phát triển kỹ năng</strong>
              <span>Và mở rộng cơ hội</span>
            </div>
          </a>
        </nav>

        <!-- KHU VỰC 03 NHÓM NGƯỜI DÙNG (PHẦN IV.4) -->
        <section class="wb-user-groups-row" aria-label="Ba nhóm người dùng trọng tâm">
          <a href="/hoc-tap" class="wb-user-group-card wb-ug-personal" data-nav="/hoc-tap">
            <div class="wb-ug-icon-circle">${WB.icon('user', 26)}</div>
            <div class="wb-ug-body">
              <h3>Dành cho cá nhân</h3>
              <p>Học ngoại ngữ, tham gia cộng đồng, phát triển kỹ năng và kết nối bạn bè.</p>
            </div>
            <div class="wb-ug-arrow">${WB.icon('arrowRight', 18)}</div>
          </a>

          <a href="/dang-ky-to-chuc" class="wb-user-group-card wb-ug-org" data-nav="/dang-ky-to-chuc">
            <div class="wb-ug-icon-circle">${WB.icon('building', 26)}</div>
            <div class="wb-ug-body">
              <h3>Dành cho tổ chức</h3>
              <p>Đăng ký và quản lý tổ chức, xây dựng không gian hoạt động và kết nối thành viên.</p>
            </div>
            <div class="wb-ug-arrow" style="color:var(--wb-vermilion);">${WB.icon('arrowRight', 18)}</div>
          </a>

          <a href="/khong-gian-cua-toi" class="wb-user-group-card wb-ug-member" data-nav="/khong-gian-cua-toi">
            <div class="wb-ug-icon-circle">${WB.icon('users', 26)}</div>
            <div class="wb-ug-body">
              <h3>Dành cho thành viên tổ chức</h3>
              <p>Tham gia hoạt động, học tập và cộng tác trong tổ chức của bạn.</p>
            </div>
            <div class="wb-ug-arrow" style="color:#8C6825;">${WB.icon('arrowRight', 18)}</div>
          </a>
        </section>

        <!-- KHÁM PHÁ WORD BRIDGE (9 Ô CHỨC NĂNG + BANNER CTA BÊN PHẢI) -->
        <section class="wb-explore-home-row">
          <div>
            <h2 class="wb-section-title" style="margin-bottom:14px;">
              <span>Khám phá <span style="color:var(--wb-deep-teal);">WORD</span> <span style="color:var(--wb-vermilion);">BRIDGE</span></span>
            </h2>
            <div class="wb-explore-9-grid">
              <a href="/ngon-ngu" class="wb-explore-tile" data-nav="/ngon-ngu">
                <div class="wb-explore-tile-icon">${WB.icon('book', 24)}</div>
                <span>Thực hành<br/>ngoại ngữ</span>
              </a>
              <a href="/hoc-tap/kiem-tra-trinh-do" class="wb-explore-tile accent-red" data-nav="/hoc-tap/kiem-tra-trinh-do">
                <div class="wb-explore-tile-icon">${WB.icon('layers', 24)}</div>
                <span>Lộ trình<br/>tự thực hành</span>
              </a>
              <a href="/hoc-tap/nghe" class="wb-explore-tile" data-nav="/hoc-tap/nghe">
                <div class="wb-explore-tile-icon">${WB.icon('headphones', 24)}</div>
                <span>Luyện nghe<br/>&amp; phát âm</span>
              </a>
              <a href="/hoc-tap/tu-vung" class="wb-explore-tile" data-nav="/hoc-tap/tu-vung">
                <div class="wb-explore-tile-icon" style="font-weight:900;font-size:20px;line-height:1;">Aa</div>
                <span>Từ vựng<br/>&amp; ngữ pháp</span>
              </a>
              <a href="/ket-noi" class="wb-explore-tile" data-nav="/ket-noi">
                <div class="wb-explore-tile-icon">${WB.icon('chat', 24)}</div>
                <span>Giao tiếp<br/>thực hành</span>
              </a>
              <a href="/cong-dong" class="wb-explore-tile" data-nav="/cong-dong">
                <div class="wb-explore-tile-icon">${WB.icon('users', 24)}</div>
                <span>Cộng đồng<br/>học tập</span>
              </a>
              <a href="/khao-thi" class="wb-explore-tile accent-red" data-nav="/khao-thi">
                <div class="wb-explore-tile-icon">${WB.icon('calendar', 24)}</div>
                <span>Khảo Thí<br/>Đánh giá năng lực</span>
              </a>
              <a href="/tin-tuc" class="wb-explore-tile accent-red" data-nav="/tin-tuc">
                <div class="wb-explore-tile-icon">${WB.icon('news', 24)}</div>
                <span>Tin tức<br/>&amp; chia sẻ</span>
              </a>
              <a href="/tai-nguyen" class="wb-explore-tile" data-nav="/tai-nguyen">
                <div class="wb-explore-tile-icon">${WB.icon('building', 24)}</div>
                <span>Tài nguyên<br/>học tập</span>
              </a>
            </div>
          </div>

          <div class="wb-cta-join-banner">
            <div>
              <h3 style="margin:0 0 8px 0;font-size:19px;line-height:1.3;">
                Tham gia cộng đồng<br/>
                <span style="color:#FFFFFF;">WORD</span> <span style="color:#FF6B57;">BRIDGE</span><br/>
                ngay hôm nay!
              </h3>
              <ul style="list-style:none;padding:0;margin:0 0 14px 0;font-size:13px;color:#E8F4F4;">
                <li style="margin-bottom:4px;">${WB.icon('check', 14)} Thực hành hiệu quả theo trình độ</li>
                <li style="margin-bottom:4px;">${WB.icon('check', 14)} Kết nối bạn học toàn cầu</li>
                <li>${WB.icon('check', 14)} Tham gia nhiều hoạt động thú vị</li>
              </ul>
              <a href="/dang-ky" class="wb-btn" data-nav="/dang-ky" style="background:#F5EED7;color:#146466;border-radius:999px;padding:8px 18px;font-size:13px;">
                <span>Tạo tài khoản miễn phí</span>
                ${WB.icon('arrowRight', 15)}
              </a>
            </div>
            <img src="/assets/favicon.svg" alt="Biểu trưng WORD BRIDGE" style="width:88px;height:88px;border-radius:50%;flex-shrink:0;" />
          </div>
        </section>

        <!-- BỐN TRỤ CỘT CỐT LÕI: LEARN – CONNECT – COMMUNITY – GROW -->
        <section class="wb-section">
          <h2 class="wb-section-title">Bốn Trụ Cột Định Hướng: LEARN – CONNECT – COMMUNITY – GROW</h2>
          <div class="wb-grid-4">
            <div class="wb-card">
              <span class="wb-badge wb-badge-teal">01 • LEARN</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Tự thực hành &amp; Rèn luyện</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Rèn phản xạ với bốn công cụ cốt lõi (Nghe điền từ, Từ vựng &amp; Flashcard, Sắp xếp câu, Đọc hiểu), lộ trình tự thực hành và Trợ lý AI giải thích ngữ cảnh.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">02 • CONNECT</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Tìm bạn đồng hành</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Kết nối người học theo ngôn ngữ, trình độ, mục tiêu và khung giờ rảnh. Bảo vệ quyền riêng tư và chỉ mở nhắn tin khi hai bên cùng đồng thuận.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-ivory">03 • COMMUNITY</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Cộng đồng &amp; Tổ chức</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Xây dựng và duy trì cộng đồng năm ngoại ngữ, câu lạc bộ, đội, nhóm và không gian quản lý tổ chức với phân quyền sáu vai trò rõ ràng.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-success">04 • GROW</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Theo dõi &amp; Phát triển</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Theo dõi tiến độ thực tế theo kỹ năng, chuỗi ngày rèn luyện, sổ tay lỗi sai, huy hiệu thành tích thật và đánh giá tại Hệ thống Khảo Thí.</p>
            </div>
          </div>
        </section>

        <!-- NĂM NGÔN NGỮ ĐƯỢC HỖ TRỢ -->
        <section class="wb-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;flex-wrap:wrap;gap:10px;">
            <h2 class="wb-section-title" style="margin:0;">Năm Ngoại Ngữ Trọng Tâm Được Hỗ Trợ</h2>
            <a href="/ngon-ngu" class="wb-btn wb-btn-outline" data-nav="/ngon-ngu">
              <span>Khám phá 05 ngôn ngữ</span>
              ${WB.icon('arrowRight', 16)}
            </a>
          </div>
          <div class="wb-grid-5">
            ${langs.map(l => `
              <div class="wb-lang-landmark-card">
                <img src="/assets/banners/lang-${l.code}-landmark.webp" alt="Biểu tượng văn hóa ${l.name_vi}" class="wb-lang-landmark-img" loading="lazy" />
                <div class="wb-lang-card-body"><div>
                  <span class="wb-badge wb-badge-teal">${l.code.toUpperCase()}</span>
                  <h3 style="margin:10px 0 4px 0;color:var(--wb-deep-teal);">${l.name_vi}</h3>
                  <div style="font-weight:700;font-size:15px;color:var(--wb-vermilion);margin-bottom:8px;">${l.native_name}</div>
                  <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${l.script_system}</p>
                </div>
                <a href="/hoc-tap?lang=${l.code}" class="wb-btn wb-btn-primary" data-nav="/hoc-tap?lang=${l.code}" style="width:100%;">Thực hành ${l.name_vi}</a>
                </div></div>
            `).join('')}
          </div>
        </section>

        <!-- GÓI DỊCH VỤ & HỖ TRỢ CỘNG ĐỒNG -->
        <section class="wb-section">
          <div class="wb-grid-2">
            <div class="wb-card">
              <span class="wb-badge wb-badge-teal">BẢNG GIÁ TIÊU CHUẨN &amp; CHƯƠNG TRÌNH HỖ TRỢ</span>
              <h3 style="margin:10px 0 8px 0;color:var(--wb-deep-teal);">Gói Thành viên Cá nhân &amp; Tổ chức</h3>
              <ul style="font-size:13.5px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 16px 0;">
                ${plans.map(p => `<li style="margin-bottom:4px;"><strong>${p.name}:</strong> ${Number(p.price_vnd).toLocaleString('vi-VN')} đồng</li>`).join('')}
                <li><strong>Chính sách hỗ trợ:</strong> Tổ chức phi lợi nhuận giảm 30%, Hỗ Trợ Cộng Đồng theo kỳ 03 tháng, Sinh viên miễn phí 03 tháng qua email trường cấp, Hỗ trợ người có hoàn cảnh khó khăn.</li>
              </ul>
              <a href="/goi-dich-vu" class="wb-btn wb-btn-primary" data-nav="/goi-dich-vu">Xem chi tiết Gói thành viên</a>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">KHẢO THÍ ĐỘC LẬP</span>
              <h3 style="margin:10px 0 8px 0;color:var(--wb-deep-teal);">Hệ thống Khảo Thí &amp; Đánh giá Năng lực</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
                Tổ chức kỳ thi đánh giá năng lực với ngân hàng câu hỏi phân loại theo ngôn ngữ, trình độ và kỹ năng, đồng hồ đếm ngược, tự động lưu câu trả lời, chống nộp trùng và quy trình phúc khảo minh bạch.
              </p>
              <a href="/khao-thi" class="wb-btn wb-btn-accent" data-nav="/khao-thi">Vào Hệ thống Khảo Thí</a>
            </div>
          </div>
        </section>
      </div>
    `;
  });

  // 2. GIỚI THIỆU & KHÁM PHÁ (/gioi-thieu, /kham-pha)
  const renderAboutAndExplore = async function (root, pathname) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card">
          <div class="wb-visual-banner-card" style="margin-bottom:18px;">
            <div>
              <span class="wb-badge wb-badge-teal">ĐỀ ÁN KHỞI NGHIỆP WORD BRIDGE (2026–2027)</span>
              <h2 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Tổng quan Tổ chức &amp; Hệ sinh thái Ngoại ngữ WORD BRIDGE</h2>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">Sứ mệnh kết nối cộng đồng ngoại ngữ thông qua 4 trụ cột LEARN – CONNECT – COMMUNITY – GROW trên 05 ngôn ngữ trọng tâm.</p>
            </div>
            <img src="/assets/banners/banner-globe-books.webp" alt="Tổng quan WORD BRIDGE" class="wb-visual-banner-art" />
          </div>
          <span class="wb-badge wb-badge-teal">THÔNG TIN CHÍNH THỨC</span>
          <h1 style="color:var(--wb-deep-teal);margin:10px 0;">${pathname === '/gioi-thieu' ? 'Giới thiệu Nền tảng WORD BRIDGE' : 'Khám phá Hệ sinh thái Ngoại ngữ WORD BRIDGE'}</h1>
          <p><strong>Khẩu hiệu:</strong> Where Languages Bring People Together.</p>
          <p><strong>Nhóm sáng lập:</strong> Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như.</p>
          <p>WORD BRIDGE là nền tảng thực hành ngoại ngữ và kết nối cộng đồng tích hợp bốn trụ cột <strong>LEARN – CONNECT – COMMUNITY – GROW</strong>, hỗ trợ năm ngoại ngữ (Tiếng Trung, Tiếng Anh, Tiếng Hàn, Tiếng Nhật, Tiếng Nga), tìm bạn thực hành đồng thuận hai bên, vận hành câu lạc bộ/tổ chức và khảo thí trực tuyến.</p>
          <div style="display:flex;gap:12px;margin-top:18px;flex-wrap:wrap;">
            <a href="/ngon-ngu" class="wb-btn wb-btn-primary" data-nav="/ngon-ngu">Khám phá 05 ngôn ngữ</a>
            <a href="/hoc-tap" class="wb-btn wb-btn-accent" data-nav="/hoc-tap">Trung tâm học tập</a>
            <a href="/cong-dong/to-chuc" class="wb-btn wb-btn-outline" data-nav="/cong-dong/to-chuc">Khám phá tổ chức</a>
          </div>
        </div>
      </div>
    `;
  };
  WB.registerView('/gioi-thieu', renderAboutAndExplore);
  WB.registerView('/kham-pha', renderAboutAndExplore);

  // 3. ĐĂNG NHẬP THÀNH VIÊN (/dang-nhap - PHẦN XXI.9: Không còn nút OAuth placeholder giả, tích hợp luồng OAuth thực tế & khôi phục mật khẩu)
  WB.registerView('/dang-nhap', async function (root) {
    let oauthProviders = {};
    try {
      const pRes = await WB.api('/api/auth/oauth/providers');
      oauthProviders = pRes.providers || {};
    } catch (_) {}
    const configuredProviders = Object.values(oauthProviders).filter(p => p.configured);

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-grid-2" style="align-items:start;">
          <div>
            <img src="/assets/logo-light.svg" alt="WORD BRIDGE" style="height:52px;margin-bottom:14px;" />
            <h1 style="color:var(--wb-deep-teal);margin:0 0 12px 0;">Kết nối – Thực hành – Đồng hành cùng cộng đồng đa ngôn ngữ</h1>
            <p style="color:var(--wb-text-muted);">Sử dụng tài khoản thành viên để truy cập Trung tâm học tập, Theo dõi tiến độ, Tìm bạn thực hành, Cộng đồng ngoại ngữ và Không gian Tổ chức.</p>
            <img src="/assets/banners/hero-globe-books.webp" alt="WORD BRIDGE Địa cầu và Sách ngoại ngữ" style="width:100%;max-width:500px;border-radius:16px;margin-top:12px;border:1px solid var(--wb-border);display:block;" />
          </div>

          <div class="wb-card">
            <h2 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">Đăng nhập Tài khoản</h2>
            <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 18px 0;">Chào mừng bạn trở lại với WORD BRIDGE!</p>
            <form id="wbLoginForm">
              <div class="wb-form-group">
                <label class="wb-label">Email hoặc Tên người dùng <span class="req">*</span></label>
                <input type="text" class="wb-input" name="email" required placeholder="Nhập email hoặc tên người dùng" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mật khẩu <span class="req">*</span></label>
                <input type="password" class="wb-input" name="password" required placeholder="Nhập mật khẩu tài khoản" />
              </div>
              <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">
                <span>Đăng nhập</span>
                ${WB.icon('arrowRight', 16)}
              </button>
            </form>

            ${configuredProviders.length > 0 ? `
              <div style="margin:18px 0 10px 0;text-align:center;font-size:13px;color:var(--wb-text-muted);">
                Đăng nhập qua nhà cung cấp OAuth 2.0 đã cấu hình:
              </div>
              <div class="wb-grid-2">
                ${configuredProviders.map(p => `
                  <button type="button" class="wb-btn wb-btn-outline wb-oauth-real-btn" data-provider="${p.provider}">
                    Đăng nhập với ${p.name}
                  </button>
                `).join('')}
              </div>
            ` : ''}

            <div style="margin-top:16px;padding-top:14px;border-top:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;font-size:13.5px;">
              <button type="button" class="wb-btn wb-btn-outline" id="wbToggleForgotPwdBtn" style="padding:6px 12px;font-size:12.5px;">Khôi phục mật khẩu</button>
              <div>
                Chưa có tài khoản? <a href="/dang-ky" data-nav="/dang-ky"><strong>Đăng ký cá nhân</strong></a> |
                <a href="/dang-ky-to-chuc" data-nav="/dang-ky-to-chuc"><strong>Đăng ký tổ chức</strong></a>
              </div>
            </div>

            <!-- Khu vực Khôi phục mật khẩu bằng mã OTP -->
            <div id="wbForgotPwdPanel" style="display:none;margin-top:16px;padding:14px;background:var(--wb-bg-soft);border-radius:10px;">
              <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Khôi phục Mật khẩu An toàn qua Email OTP</h4>
              <form id="wbSendResetOtpForm" style="display:flex;gap:8px;margin-bottom:10px;">
                <input type="email" class="wb-input" name="email" id="wbResetEmailInput" required placeholder="Nhập email đã đăng ký..." />
                <button type="submit" class="wb-btn wb-btn-primary">Nhận mã OTP</button>
              </form>
              <form id="wbConfirmResetPwdForm">
                <div class="wb-form-group">
                  <label class="wb-label">Mã OTP khôi phục</label>
                  <input type="text" class="wb-input" name="otp_code" required placeholder="Nhập 6 chữ số OTP" />
                </div>
                <div class="wb-grid-2">
                  <div class="wb-form-group">
                    <label class="wb-label">Mật khẩu mới (&gt;= 15 ký tự)</label>
                    <input type="password" class="wb-input" name="new_password" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Xác nhận mật khẩu mới</label>
                    <input type="password" class="wb-input" name="confirm_password" required />
                  </div>
                </div>
                <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Đặt lại Mật khẩu</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('wbLoginForm');
    form.onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(form);
      try {
        const res = await WB.api('/api/auth/login', {
          method: 'POST',
          body: Object.fromEntries(fd.entries())
        });
        WB.setSession(res.user, res.session.token, false);
        WB.toast('Đăng nhập thành công!', 'success');
        WB.navigate('/hoc-tap');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-oauth-real-btn').forEach(btn => {
      btn.onclick = async () => {
        const prov = btn.getAttribute('data-provider');
        try {
          const res = await WB.api(`/api/auth/oauth/authorize?provider=${encodeURIComponent(prov)}`);
          if (res.authorization_url) {
            window.location.href = res.authorization_url;
          }
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    const toggleForgotBtn = document.getElementById('wbToggleForgotPwdBtn');
    const forgotPanel = document.getElementById('wbForgotPwdPanel');
    toggleForgotBtn.onclick = () => {
      forgotPanel.style.display = forgotPanel.style.display === 'none' ? 'block' : 'none';
    };

    document.getElementById('wbSendResetOtpForm').onsubmit = async e => {
      e.preventDefault();
      const email = document.getElementById('wbResetEmailInput').value.trim();
      try {
        const res = await WB.api('/api/auth/password/forgot', { method: 'POST', body: { email } });
        WB.toast(res.message, 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbConfirmResetPwdForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const email = document.getElementById('wbResetEmailInput').value.trim();
      try {
        await WB.api('/api/auth/password/reset', {
          method: 'POST',
          body: Object.assign({ email }, Object.fromEntries(fd.entries()))
        });
        WB.toast('Đã đặt lại mật khẩu thành công! Vui lòng đăng nhập bằng mật khẩu mới.', 'success');
        forgotPanel.style.display = 'none';
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });

  // 4. ĐĂNG KÝ CÁ NHÂN (/dang-ky)
  WB.registerView('/dang-ky', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-grid-2" style="align-items:start;">
          <div class="wb-card" style="background:linear-gradient(135deg,#F2F9F9 0%,#E1F2F1 100%);">
            <span class="wb-badge wb-badge-teal">CHÀO MỪNG THÀNH VIÊN MỚI</span>
            <h2 style="color:var(--wb-deep-teal);margin:10px 0 8px 0;">Đăng ký Tài khoản Cá nhân</h2>
            <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">Tạo tài khoản để thực hành 05 ngoại ngữ, kết nối bạn học đồng hành và tham gia cộng đồng WORD BRIDGE.</p>
            <img src="/assets/banners/hero-globe-books.webp" alt="Minh họa Địa cầu và Sách ngoại ngữ" style="width:100%;border-radius:14px;margin-bottom:14px;display:block;" />
            <ul style="list-style:none;padding:0;margin:0;font-size:13.5px;color:var(--wb-text-main);">
              <li style="margin-bottom:8px;"><strong>✓ Thực hành ngoại ngữ hiệu quả:</strong> Lộ trình cá nhân hóa và 04 công cụ rèn luyện sâu.</li>
              <li style="margin-bottom:8px;"><strong>✓ Kết nối cộng đồng toàn cầu:</strong> Tìm bạn học đồng thuận hai chiều an toàn.</li>
              <li><strong>✓ Quà tặng thành viên mới:</strong> Kích hoạt ngay 07 ngày trải nghiệm gói Người Dùng bản Plus.</li>
            </ul>
          </div>
          <div class="wb-card">
          <span class="wb-badge wb-badge-teal">TÀI KHOẢN CÁ NHÂN WORD BRIDGE</span>
          <h1 style="color:var(--wb-deep-teal);margin:8px 0 6px 0;">Đăng ký Tài khoản Cá nhân</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 18px 0;">
            Tặng ngay <strong>07 ngày dùng thử miễn phí gói Người Dùng bản Plus</strong> cho tài khoản cá nhân mới. Hết thời gian dùng thử tự động chuyển về gói Người Dùng bản Miễn Phí (0 đồng) và giữ nguyên 100% lịch sử thực hành.
          </p>
          <form id="wbRegisterForm">
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Họ và tên <span class="req">*</span></label>
                <input type="text" class="wb-input" name="full_name" required placeholder="Ví dụ: Nguyễn Minh Anh" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Tên người dùng</label>
                <input type="text" class="wb-input" name="username" placeholder="Ví dụ: minhanh_wb" />
              </div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Địa chỉ Email <span class="req">*</span></label>
                <input type="email" class="wb-input" name="email" required placeholder="email@domain.com" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Số điện thoại di động <span class="req">*</span></label>
                <input type="tel" class="wb-input" name="phone" required placeholder="09xxxxxxxx" />
              </div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Mật khẩu (Tối thiểu 15 ký tự, 1 chữ hoa, 3 ký tự đặc biệt) <span class="req">*</span></label>
                <input type="password" class="wb-input" name="password" id="wbRegPwd" required placeholder="Ít nhất 15 ký tự, 1 hoa, 3 ký tự đặc biệt" />
                <div id="wbPwdStrengthBar" style="font-size:12px;margin-top:5px;color:var(--wb-text-muted);">Độ mạnh mật khẩu: Chưa nhập</div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Xác nhận mật khẩu <span class="req">*</span></label>
                <input type="password" class="wb-input" name="confirm_password" required placeholder="Nhập lại mật khẩu" />
              </div>
            </div>
            <div class="wb-form-group">
              <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;">
                <input type="checkbox" name="accept_terms" required />
                <span>Tôi đồng ý với <a href="/phap-ly" data-nav="/phap-ly">Điều khoản sử dụng và Quy chế cộng đồng</a> của WORD BRIDGE.</span>
              </label>
            </div>
            <div class="wb-form-group">
              <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;">
                <input type="checkbox" name="accept_privacy" required />
                <span>Tôi đồng ý với <a href="/phap-ly" data-nav="/phap-ly">Chính sách bảo vệ dữ liệu cá nhân</a> của WORD BRIDGE.</span>
              </label>
            </div>
            <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Hoàn tất Đăng ký Tài khoản</button>
          </form>
        </div>
        </div>
      </div>
    `;

    const pwdInput = document.getElementById('wbRegPwd');
    const strengthEl = document.getElementById('wbPwdStrengthBar');
    pwdInput.oninput = () => {
      const val = pwdInput.value || '';
      const hasLen = val.length >= 15;
      const hasUpper = /[A-Z]/.test(val);
      const specials = (val.match(/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/g) || []).length;
      if (hasLen && hasUpper && specials >= 3) {
        strengthEl.textContent = `Độ mạnh mật khẩu: Mạnh (Đạt chuẩn ${val.length} ký tự, ${specials} ký tự đặc biệt)`;
        strengthEl.style.color = 'var(--wb-success)';
      } else {
        strengthEl.textContent = `Cần tối thiểu 15 ký tự (hiện ${val.length}), ít nhất 1 chữ hoa (${hasUpper ? 'Đạt' : 'Chưa'}), ít nhất 3 ký tự đặc biệt (hiện ${specials})`;
        strengthEl.style.color = 'var(--wb-vermilion)';
      }
    };

    const form = document.getElementById('wbRegisterForm');
    form.onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(form);
      const payload = Object.fromEntries(fd.entries());
      payload.accept_terms = form.elements.accept_terms.checked;
      payload.accept_privacy = form.elements.accept_privacy.checked;
      try {
        const res = await WB.api('/api/auth/register', { method: 'POST', body: payload });
        WB.setSession(res.user, res.session.token, false);
        WB.toast('Đăng ký tài khoản thành công! Đã kích hoạt 07 ngày dùng thử Người Dùng bản Plus.', 'success');
        WB.navigate('/ho-so');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });

  // 5. HỒ SƠ CÁ NHÂN, THÔNG BÁO & CÀI ĐẶT (/ho-so, /thong-bao, /cai-dat)
  const renderProfileAndSettings = async function (root, pathname) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập để xem Hồ sơ cá nhân và Cài đặt.');
      return WB.navigate('/dang-nhap');
    }
    const data = await WB.api('/api/profile');
    const u = data.profile;
    const prefs = data.notification_preferences || {};
    const notifications = data.notifications || [];
    const mySpace = data.my_space || { organizations: [], groups: [], applications: [] };
    let sessions = [];
    try {
      const sesRes = await WB.api('/api/auth/sessions');
      sessions = sesRes.sessions || [];
    } catch (_) {}

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/ho-so' ? 'active' : ''}" data-nav="/ho-so">${WB.icon('user', 16)} <span>Hồ sơ cá nhân</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/tien-do">${WB.icon('chart', 16)} <span>Theo dõi tiến độ</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/khong-gian-cua-toi">${WB.icon('building', 16)} <span>Tổ chức &amp; Cộng đồng của tôi</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/thong-bao' ? 'active' : ''}" data-nav="/thong-bao">${WB.icon('bell', 16)} <span>Thông báo (${notifications.filter(n => !n.is_read).length})</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cai-dat' ? 'active' : ''}" data-nav="/cai-dat">${WB.icon('settings', 16)} <span>Bảo mật &amp; Cài đặt</span></a></li>
            </ul>
          </aside>

          <div>
            <div class="wb-dash-header-banner">
              <div>
                <span class="wb-badge wb-badge-teal">Gói hiện tại: ${u.plan_name_vi || u.plan_code}</span>
                  <h1 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">${u.full_name} (@${u.username})</h1>
                  <div style="font-size:13.5px;color:var(--wb-text-muted);">
                    Email: ${u.email} • Số điện thoại: ${u.phone} (Được bảo vệ ẩn công khai) • Ngoại ngữ đang học: <strong>${(u.learning_languages || []).join(', ').toUpperCase()}</strong>
                  </div>
                </div>
                <div style="margin-top:10px;"><button type="button" class="wb-btn wb-btn-outline" id="wbRevokeOtherSessionsBtn">Thu hồi phiên thiết bị khác</button></div>
              </div>
              <img src="/assets/banners/header-security-shield.webp" alt="Bảo mật và Cài đặt tài khoản" class="wb-dash-header-art" />
            </div>

            <div class="wb-grid-2" style="margin-bottom:20px;">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Cập nhật Hồ sơ &amp; Nhu cầu Thực hành</h3>
                <form id="wbProfileUpdateForm">
                  <div class="wb-form-group">
                    <label class="wb-label">Họ và tên</label>
                    <input type="text" class="wb-input" name="full_name" value="${u.full_name}" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Giới thiệu bản thân</label>
                    <textarea class="wb-textarea" name="bio" rows="2">${u.bio || ''}</textarea>
                  </div>
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Trình độ hiện tại</label>
                      <input type="text" class="wb-input" name="proficiency_level" value="${u.proficiency_level}" />
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Khung giờ rảnh luyện tập</label>
                      <input type="text" class="wb-input" name="available_hours" value="${u.available_hours}" />
                    </div>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Mục tiêu học tập</label>
                    <input type="text" class="wb-input" name="learning_goals" value="${u.learning_goals}" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Hình thức thực hành yêu thích</label>
                    <input type="text" class="wb-input" name="practice_mode" value="${u.practice_mode || ''}" />
                  </div>
                  <button type="submit" class="wb-btn wb-btn-primary">Lưu cập nhật Hồ sơ</button>
                </form>
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đổi Mật khẩu &amp; Cài đặt Nhận Thông báo</h3>
                <form id="wbChangePasswordForm" style="margin-bottom:18px;">
                  <div class="wb-form-group">
                    <label class="wb-label">Mật khẩu hiện tại</label>
                    <input type="password" class="wb-input" name="current_password" required />
                  </div>
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Mật khẩu mới (&gt;= 15 ký tự)</label>
                      <input type="password" class="wb-input" name="new_password" required />
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Xác nhận mật khẩu mới</label>
                      <input type="password" class="wb-input" name="confirm_password" required />
                    </div>
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Cập nhật Mật khẩu</button>
                </form>

                <hr style="margin:16px 0;border:none;border-top:1px solid var(--wb-border);" />
                <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Tùy chọn Nhận Thông báo (PHẦN XVII)</h4>
                <form id="wbNotifPrefsForm" style="font-size:13.5px;">
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <input type="checkbox" name="in_app_enabled" ${prefs.in_app_enabled !== false ? 'checked' : ''} />
                    <span>Thông báo trong website</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <input type="checkbox" name="email_transaction" ${prefs.email_transaction !== false ? 'checked' : ''} />
                    <span>Thông báo giao dịch và gói thành viên</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <input type="checkbox" name="email_organization" ${prefs.email_organization !== false ? 'checked' : ''} />
                    <span>Thông báo từ tổ chức tham gia</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <input type="checkbox" name="email_connection" ${prefs.email_connection !== false ? 'checked' : ''} />
                    <span>Thông báo lời mời kết nối bạn học</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:6px;">
                    <input type="checkbox" name="email_community" ${prefs.email_community !== false ? 'checked' : ''} />
                    <span>Thông báo bài viết và bình luận cộng đồng</span>
                  </label>
                  <label style="display:flex;align-items:center;gap:8px;margin-bottom:10px;">
                    <input type="checkbox" name="study_reminder_enabled" ${prefs.study_reminder_enabled !== false ? 'checked' : ''} />
                    <span>Nhắc nhở mục tiêu thực hành hàng ngày</span>
                  </label>
                  <button type="submit" class="wb-btn wb-btn-outline">Lưu cài đặt thông báo</button>
                </form>
              </div>
            </div>

            <div class="wb-grid-2">
              <div class="wb-card">
                <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:10px;">
                  <h3 style="margin:0;color:var(--wb-deep-teal);">Thông báo gần đây (${notifications.length})</h3>
                  <button type="button" class="wb-btn wb-btn-outline" id="wbMarkAllNotifReadBtn" style="padding:4px 10px;font-size:12px;">Đánh dấu đã đọc tất cả</button>
                </div>
                ${notifications.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Chưa có thông báo mới.</p>` : `
                  ${notifications.slice(0, 8).map(n => `
                    <div style="padding:10px;border-bottom:1px solid var(--wb-border);font-size:13.5px;">
                      <strong>${n.title}</strong> ${n.is_read ? '' : '<span class="wb-badge wb-badge-red">Mới</span>'}
                      <div style="color:var(--wb-text-muted);margin-top:2px;">${n.message}</div>
                    </div>
                  `).join('')}
                `}
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Quản lý Phiên Đăng nhập (${sessions.length})</h3>
                <div class="wb-table-wrap">
                  <table class="wb-table">
                    <thead>
                      <tr><th>Thiết bị</th><th>Trạng thái</th><th>Thao tác</th></tr>
                    </thead>
                    <tbody>
                      ${sessions.map(s => `
                        <tr>
                          <td><strong>${s.device_name}</strong><br/><span style="font-size:12px;color:var(--wb-text-muted);">IP: ${s.ip_address}</span></td>
                          <td><span class="wb-badge ${s.is_revoked ? 'wb-badge-red' : 'wb-badge-success'}">${s.is_revoked ? 'Đã thu hồi' : (s.is_current ? 'Phiên hiện tại' : 'Đang hoạt động')}</span></td>
                          <td>
                            ${!s.is_revoked && !s.is_current ? `<button type="button" class="wb-btn wb-btn-outline wb-revoke-ses-btn" data-id="${s.id}" style="padding:4px 8px;font-size:12px;">Thu hồi</button>` : '—'}
                          </td>
                        </tr>
                      `).join('')}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbProfileUpdateForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await WB.api('/api/profile', { method: 'PUT', body: Object.fromEntries(fd.entries()) });
        WB.state.user = res.profile;
        WB.renderHeaderUser();
        WB.toast('Đã cập nhật hồ sơ cá nhân!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbChangePasswordForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/auth/password/change', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        e.target.reset();
        WB.toast('Đã đổi mật khẩu thành công!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbNotifPrefsForm').onsubmit = async e => {
      e.preventDefault();
      const f = e.target.elements;
      try {
        await WB.api('/api/notifications/preferences', {
          method: 'PUT',
          body: {
            in_app_enabled: f.in_app_enabled.checked,
            email_transaction: f.email_transaction.checked,
            email_organization: f.email_organization.checked,
            email_connection: f.email_connection.checked,
            email_community: f.email_community.checked,
            study_reminder_enabled: f.study_reminder_enabled.checked
          }
        });
        WB.toast('Đã lưu cài đặt nhận thông báo!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbMarkAllNotifReadBtn').onclick = async () => {
      await WB.api('/api/notifications/read', { method: 'POST', body: { mark_all: true } });
      WB.toast('Đã đánh dấu đã đọc toàn bộ thông báo.', 'success');
      renderProfileAndSettings(root, pathname);
    };

    document.getElementById('wbRevokeOtherSessionsBtn').onclick = async () => {
      try {
        await WB.api('/api/auth/sessions/revoke-others', { method: 'POST', body: {} });
        WB.toast('Đã thu hồi toàn bộ phiên đăng nhập trên các thiết bị khác!', 'success');
        renderProfileAndSettings(root, pathname);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-revoke-ses-btn').forEach(btn => {
      btn.onclick = async () => {
        await WB.api('/api/auth/sessions/revoke', { method: 'POST', body: { session_id: btn.getAttribute('data-id') } });
        WB.toast('Đã thu hồi phiên đăng nhập.', 'success');
        renderProfileAndSettings(root, pathname);
      };
    });
  };

  WB.registerView('/ho-so', renderProfileAndSettings);
  WB.registerView('/thong-bao', renderProfileAndSettings);
  WB.registerView('/cai-dat', renderProfileAndSettings);

  // 6. KHU VỰC TIN TỨC & CẬP NHẬT CHÍNH THỨC (/tin-tuc - PHẦN XIV)
  WB.registerView('/tin-tuc', async function (root, pathname, searchParams) {
    const selectedCategory = searchParams?.get('category') || '';
    const searchQuery = searchParams?.get('q') || '';
    const articleSlug = searchParams?.get('bai-viet') || '';

    if (articleSlug) {
      try {
        const detail = await WB.api(`/api/news?slug=${encodeURIComponent(articleSlug)}`);
        const art = detail.article;
        const related = detail.related_articles || [];
        root.innerHTML = `
          <div class="wb-container wb-section">
            <div style="margin-bottom:14px;">
              <a href="/tin-tuc" class="wb-btn wb-btn-outline" data-nav="/tin-tuc">Quay lại Danh sách Tin tức</a>
            </div>
            <div class="wb-card" style="margin-bottom:22px;">
              <span class="wb-badge wb-badge-teal">${art.category_name_vi}</span>
              <h1 style="color:var(--wb-deep-teal);margin:10px 0 8px 0;">${art.title}</h1>
              <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:18px;">
                Ngày đăng: ${(art.published_at || art.created_at || '').slice(0, 10)} • Ban biên tập WORD BRIDGE
              </div>
              <div style="line-height:1.75;font-size:15px;">${art.html_content}</div>
            </div>

            <div class="wb-card">
              <h3 style="margin:0 0 14px 0;color:var(--wb-deep-teal);">Bài viết Liên quan</h3>
              <div class="wb-grid-3">
                ${related.map(r => `
                  <div class="wb-card" style="background:var(--wb-bg-soft);">
                    <span class="wb-badge wb-badge-ivory">${r.category_name_vi}</span>
                    <h4 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">${r.title}</h4>
                    <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 10px 0;">${r.summary}</p>
                    <a href="/tin-tuc?bai-viet=${encodeURIComponent(r.slug)}" class="wb-btn wb-btn-outline" data-nav="/tin-tuc?bai-viet=${encodeURIComponent(r.slug)}">Đọc chi tiết</a>
                  </div>
                `).join('')}
              </div>
            </div>
          </div>
        `;
        return;
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    }

    const res = await WB.api(`/api/news?category=${encodeURIComponent(selectedCategory)}&q=${encodeURIComponent(searchQuery)}`);
    const articles = res.articles || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div class="wb-visual-banner-card" style="margin-bottom:16px;">
            <div>
              <span class="wb-badge wb-badge-teal">TIN TỨC &amp; HƯỚNG DẪN SỬ DỤNG NỀN TẢNG</span>
              <h2 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Bản tin Cập nhật Sản phẩm &amp; Kinh nghiệm Tự thực hành</h2>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">Cập nhật những thông tin mới nhất về WORD BRIDGE, phương pháp rèn luyện 05 ngoại ngữ và hoạt động tiêu biểu của các Câu lạc bộ, Đội, Nhóm.</p>
            </div>
            <img src="/assets/banners/banner-globe-books.webp" alt="Tin tức WORD BRIDGE" class="wb-visual-banner-art" />
          </div>
          <span class="wb-badge wb-badge-teal">TRA CỨU BÀI VIẾT</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Tin tức, Cập nhật Sản phẩm &amp; Kinh nghiệm Thực hành</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0 0 16px 0;">
            Tổng hợp thông tin cập nhật chính thức từ WORD BRIDGE, tài liệu hướng dẫn rèn luyện năm ngoại ngữ và hoạt động tiêu biểu của cộng đồng.
          </p>
          <form id="wbNewsFilterForm" class="wb-grid-3">
            <input type="search" class="wb-input" name="q" value="${searchQuery}" placeholder="Tìm kiếm bài viết tin tức, hướng dẫn..." />
            <select class="wb-select" name="category">
              <option value="">Tất cả chuyên mục</option>
              <option value="huong_dan" ${selectedCategory === 'huong_dan' ? 'selected' : ''}>Hướng dẫn sử dụng nền tảng</option>
              <option value="cap_nhat_san_pham" ${selectedCategory === 'cap_nhat_san_pham' ? 'selected' : ''}>Cập nhật sản phẩm</option>
              <option value="kinh_nghiem" ${selectedCategory === 'kinh_nghiem' ? 'selected' : ''}>Kinh nghiệm tự thực hành</option>
              <option value="cong_dong" ${selectedCategory === 'cong_dong' ? 'selected' : ''}>Tin tức cộng đồng</option>
            </select>
            <button type="submit" class="wb-btn wb-btn-primary">Lọc bài viết</button>
          </form>
        </div>

        ${articles.length === 0 ? `
          <div class="wb-card">
            <p style="margin:0;color:var(--wb-text-muted);">Không tìm thấy bài viết nào khớp với bộ lọc hiện tại.</p>
          </div>
        ` : `
          <div class="wb-grid-3">
            ${articles.map(a => `
              <article class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <span class="wb-badge wb-badge-teal">${a.category_name_vi}</span>
                  <h3 style="margin:10px 0 8px 0;color:var(--wb-deep-teal);">${a.title}</h3>
                  <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">${a.summary}</p>
                </div>
                <div style="display:flex;justify-content:space-between;align-items:center;padding-top:10px;border-top:1px solid var(--wb-border);">
                  <span style="font-size:12px;color:var(--wb-text-muted);">${(a.published_at || a.created_at || '').slice(0, 10)}</span>
                  <a href="/tin-tuc?bai-viet=${encodeURIComponent(a.slug)}" class="wb-btn wb-btn-outline" data-nav="/tin-tuc?bai-viet=${encodeURIComponent(a.slug)}">Xem chi tiết</a>
                </div>
              </article>
            `).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById('wbNewsFilterForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const q = fd.get('q') || '';
      const cat = fd.get('category') || '';
      WB.navigate(`/tin-tuc?category=${encodeURIComponent(cat)}&q=${encodeURIComponent(q)}`);
    };
  });

  // 7. TÌM KIẾM THỐNG NHẤT TOÀN NỀN TẢNG (/tim-kiem - PHẦN XIII & XXI.16)
  WB.registerView('/tim-kiem', async function (root, pathname, searchParams) {
    const q = searchParams?.get('q') || '';
    const lang = searchParams?.get('language_code') || '';
    const level = searchParams?.get('level') || '';
    const topic = searchParams?.get('topic') || '';
    const contentType = searchParams?.get('content_type') || 'all';
    const timeRange = searchParams?.get('time_range') || 'all';

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card">
          <p style="margin:0;font-weight:700;color:var(--wb-deep-teal);">Đang tìm kiếm dữ liệu trên toàn nền tảng WORD BRIDGE...</p>
        </div>
      </div>
    `;

    const res = await WB.api(
      `/api/search?q=${encodeURIComponent(q)}&language_code=${encodeURIComponent(lang)}&level=${encodeURIComponent(level)}&topic=${encodeURIComponent(topic)}&content_type=${encodeURIComponent(contentType)}&time_range=${encodeURIComponent(timeRange)}`
    );
    const r = res.results || {};

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">TÌM KIẾM THỐNG NHẤT TOÀN NỀN TẢNG</span>
          <h1 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">Tra cứu Ngoại ngữ, Bài thực hành, Từ vựng, Học liệu, Cộng đồng &amp; Tổ chức</h1>
          <form id="wbUnifiedSearchForm">
            <div class="wb-grid-3" style="margin-bottom:12px;">
              <input type="search" class="wb-input" name="q" value="${q}" placeholder="Nhập từ khóa tìm kiếm..." />
              <select class="wb-select" name="language_code">
                <option value="">Tất cả ngôn ngữ</option>
                <option value="zh" ${lang === 'zh' ? 'selected' : ''}>Tiếng Trung</option>
                <option value="en" ${lang === 'en' ? 'selected' : ''}>Tiếng Anh</option>
                <option value="ko" ${lang === 'ko' ? 'selected' : ''}>Tiếng Hàn</option>
                <option value="ja" ${lang === 'ja' ? 'selected' : ''}>Tiếng Nhật</option>
                <option value="ru" ${lang === 'ru' ? 'selected' : ''}>Tiếng Nga</option>
              </select>
              <select class="wb-select" name="content_type">
                <option value="all" ${contentType === 'all' ? 'selected' : ''}>Tất cả loại nội dung (10 nhóm)</option>
                <option value="languages" ${contentType === 'languages' ? 'selected' : ''}>Ngoại ngữ</option>
                <option value="exercises" ${contentType === 'exercises' ? 'selected' : ''}>Bài thực hành</option>
                <option value="vocabulary" ${contentType === 'vocabulary' ? 'selected' : ''}>Từ vựng</option>
                <option value="resources" ${contentType === 'resources' ? 'selected' : ''}>Tài liệu học tập</option>
                <option value="posts" ${contentType === 'posts' ? 'selected' : ''}>Bài viết cộng đồng</option>
                <option value="groups" ${contentType === 'groups' ? 'selected' : ''}>Nhóm thực hành</option>
                <option value="organizations" ${contentType === 'organizations' ? 'selected' : ''}>Tổ chức</option>
                <option value="learners" ${contentType === 'learners' ? 'selected' : ''}>Người học đồng hành</option>
                <option value="news" ${contentType === 'news' ? 'selected' : ''}>Tin tức &amp; Hướng dẫn</option>
              </select>
            </div>
            <div class="wb-grid-4">
              <input type="text" class="wb-input" name="level" value="${level}" placeholder="Trình độ (A1, B1, HSK 1, N5...)" />
              <input type="text" class="wb-input" name="topic" value="${topic}" placeholder="Chủ đề quan tâm..." />
              <select class="wb-select" name="time_range">
                <option value="all" ${timeRange === 'all' ? 'selected' : ''}>Mọi thời gian</option>
                <option value="today" ${timeRange === 'today' ? 'selected' : ''}>Trong 24 giờ qua</option>
                <option value="week" ${timeRange === 'week' ? 'selected' : ''}>Trong 7 ngày qua</option>
                <option value="month" ${timeRange === 'month' ? 'selected' : ''}>Trong 30 ngày qua</option>
              </select>
              <button type="submit" class="wb-btn wb-btn-primary">Thực hiện Tìm kiếm</button>
            </div>
          </form>
        </div>

        ${res.total_count === 0 ? `
          <div class="wb-card">
            <h3 style="margin:0 0 6px 0;color:var(--wb-vermilion);">Không tìm thấy kết quả phù hợp</h3>
            <p style="margin:0;color:var(--wb-text-muted);">${res.empty_message}</p>
          </div>
        ` : `
          <div class="wb-grid-2">
            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Bài thực hành (${(r.exercises || []).length}) &amp; Ngoại ngữ (${(r.languages || []).length})</h3>
              ${(r.languages || []).map(l => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${l.name_vi} (${l.native_name})</strong> — <span style="font-size:12.5px;color:var(--wb-text-muted);">${l.script_system}</span></div>
                  <a href="/hoc-tap?lang=${l.code}" class="wb-btn wb-btn-outline" data-nav="/hoc-tap?lang=${l.code}" style="padding:4px 10px;font-size:12px;">Thực hành</a>
                </div>
              `).join('')}
              ${(r.exercises || []).map(e => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div>
                    <span class="wb-badge wb-badge-teal">${e.language_code.toUpperCase()} • ${e.level}</span>
                    <strong style="margin-left:6px;">${e.title}</strong>
                  </div>
                  <a href="/hoc-tap?lang=${e.language_code}" class="wb-btn wb-btn-outline" data-nav="/hoc-tap?lang=${e.language_code}" style="padding:4px 10px;font-size:12px;">Làm bài</a>
                </div>
              `).join('')}
            </div>

            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Tài liệu (${(r.resources || []).length}), Từ vựng (${(r.vocabulary || []).length}) &amp; Tin tức (${(r.news || []).length})</h3>
              ${(r.resources || []).map(rs => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${rs.title}</strong> <span class="wb-badge wb-badge-ivory">${rs.language_code.toUpperCase()}</span></div>
                  <a href="/tai-nguyen" class="wb-btn wb-btn-outline" data-nav="/tai-nguyen" style="padding:4px 10px;font-size:12px;">Xem tài liệu</a>
                </div>
              `).join('')}
              ${(r.news || []).map(nw => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${nw.title}</strong> <span class="wb-badge wb-badge-teal">${nw.category_name_vi}</span></div>
                  <a href="/tin-tuc?bai-viet=${encodeURIComponent(nw.slug)}" class="wb-btn wb-btn-outline" data-nav="/tin-tuc?bai-viet=${encodeURIComponent(nw.slug)}" style="padding:4px 10px;font-size:12px;">Đọc bài</a>
                </div>
              `).join('')}
            </div>

            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Bài viết Cộng đồng (${(r.posts || []).length}) &amp; Nhóm thực hành (${(r.groups || []).length})</h3>
              ${(r.posts || []).map(p => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);">
                  <strong>${p.title}</strong> <span class="wb-badge wb-badge-teal">${p.language_code.toUpperCase()}</span>
                  <div style="font-size:12.5px;color:var(--wb-text-muted);">${p.content.slice(0, 120)}...</div>
                </div>
              `).join('')}
              ${(r.groups || []).map(g => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${g.name}</strong> (${g.member_count} thành viên)</div>
                  <a href="/cong-dong/nhom" class="wb-btn wb-btn-outline" data-nav="/cong-dong/nhom" style="padding:4px 10px;font-size:12px;">Vào nhóm</a>
                </div>
              `).join('')}
            </div>

            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Tổ chức (${(r.organizations || []).length}) &amp; Bạn học (${(r.learners || []).length})</h3>
              ${(r.organizations || []).map(o => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${o.name} (${o.short_name})</strong> — ${o.province_name}</div>
                  <a href="/cong-dong/to-chuc" class="wb-btn wb-btn-outline" data-nav="/cong-dong/to-chuc" style="padding:4px 10px;font-size:12px;">Xem hồ sơ</a>
                </div>
              `).join('')}
              ${(r.learners || []).map(u => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <div><strong>${u.full_name} (@${u.username})</strong> — Trình độ ${u.proficiency_level}</div>
                  <a href="/ket-noi" class="wb-btn wb-btn-outline" data-nav="/ket-noi" style="padding:4px 10px;font-size:12px;">Kết nối</a>
                </div>
              `).join('')}
            </div>
          </div>
        `}
      </div>
    `;

    document.getElementById('wbUnifiedSearchForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (v) params.set(k, String(v));
      }
      WB.navigate('/tim-kiem?' + params.toString());
    };
  });

  // 8. TRUNG TÂM TRỢ GIÚP & CHĂM SÓC KHÁCH HÀNG (/ho-tro - PHẦN V: Không hiển thị đường dẫn kỹ thuật /ho-tro)
  WB.registerView('/ho-tro', async function (root) {
    let tickets = [];
    if (WB.state.user) {
      try {
        const res = await WB.api('/api/support/tickets');
        tickets = res.tickets || [];
      } catch (_) {}
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:22px;">
          <div class="wb-dash-header-banner" style="margin-bottom:16px;">
            <div>
              <span class="wb-badge wb-badge-teal">TRUNG TÂM TRỢ GIÚP &amp; CHĂM SÓC KHÁCH HÀNG</span>
              <h2 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Hỗ trợ Kỹ thuật, Tài khoản, Tổ chức &amp; Đối soát Thanh toán</h2>
              <p style="margin:0;font-size:13px;color:var(--wb-text-muted);">Đội ngũ Chăm sóc khách hàng WORD BRIDGE luôn sẵn sàng giải đáp và đồng hành cùng bạn.</p>
            </div>
            <img src="/assets/banners/header-security-shield.webp" alt="Trung tâm trợ giúp WORD BRIDGE" class="wb-dash-header-art" />
          </div>
          <span class="wb-badge wb-badge-teal">LIÊN HỆ CHÍNH THỨC</span>
          <h1 style="margin:8px 0;color:var(--wb-deep-teal);">Hỗ trợ &amp; Giải đáp Thắc mắc WORD BRIDGE</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
            Chăm sóc khách hàng: <strong>cskh@wordbridge.io.vn</strong> | Liên hệ chính thức: <strong>wordbridge.education@gmail.com</strong> | Hợp tác &amp; truyền thông: <strong>contact@wordbridge.io.vn</strong>
          </p>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Gửi Yêu cầu Hỗ trợ</h3>
            ${WB.state.user ? `
              <form id="wbSupportTicketForm">
                <div class="wb-form-group">
                  <label class="wb-label">Nhóm vấn đề cần hỗ trợ <span class="req">*</span></label>
                  <select class="wb-select" name="category" required>
                    <option value="account">Hỗ trợ Tài khoản &amp; Đăng nhập</option>
                    <option value="learning">Hỗ trợ Học tập &amp; Công cụ thực hành</option>
                    <option value="community">Hỗ trợ Cộng đồng &amp; Kết nối bạn học</option>
                    <option value="organization">Hỗ trợ Hồ sơ Tổ chức &amp; Thành viên</option>
                    <option value="payment">Hỗ trợ Thanh toán, Giao dịch &amp; Gói dịch vụ</option>
                    <option value="exam">Hỗ trợ Hệ thống Khảo Thí</option>
                    <option value="security">Báo cáo Bảo mật &amp; Quyền riêng tư</option>
                  </select>
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Tiêu đề yêu cầu <span class="req">*</span></label>
                  <input type="text" class="wb-input" name="subject" required placeholder="Nhập tóm tắt vấn đề..." />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Mô tả chi tiết <span class="req">*</span></label>
                  <textarea class="wb-textarea" name="description" rows="4" required placeholder="Mô tả chi tiết hoặc mã đơn hàng / mã hồ sơ..."></textarea>
                </div>
                <button type="submit" class="wb-btn wb-btn-primary">Gửi Yêu cầu Hỗ trợ</button>
              </form>
            ` : `<p>Vui lòng <a href="/dang-nhap" data-nav="/dang-nhap"><strong>Đăng nhập</strong></a> để tạo và theo dõi phiếu hỗ trợ cá nhân.</p>`}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Phiếu Hỗ trợ của tôi (${tickets.length})</h3>
            ${tickets.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Chưa có phiếu hỗ trợ nào.</p>` : `
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Mã phiếu</th><th>Chủ đề</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody>
                    ${tickets.map(t => `
                      <tr>
                        <td><strong>${t.ticket_code}</strong></td>
                        <td>${t.subject}</td>
                        <td><span class="wb-badge wb-badge-teal">${t.status}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}
          </div>
        </div>
      </div>
    `;

    const form = document.getElementById('wbSupportTicketForm');
    if (form) {
      form.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(form);
        try {
          await WB.api('/api/support/tickets', { method: 'POST', body: Object.fromEntries(fd.entries()) });
          WB.toast('Đã gửi phiếu hỗ trợ thành công!', 'success');
          WB.navigate('/ho-tro', false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  });

  // 9. ĐIỀU KHOẢN, QUYỀN RIÊNG TƯ & BẢO VỆ TRẺ EM (/phap-ly)
  WB.registerView('/phap-ly', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card">
          <span class="wb-badge wb-badge-teal">ĐIỀU KHOẢN &amp; CHÍNH SÁCH BẢO VỆ DỮ LIỆU</span>
          <h1 style="color:var(--wb-deep-teal);margin:10px 0;">Điều khoản Dịch vụ, Quyền riêng tư &amp; Bảo vệ Trẻ em</h1>
          <div class="wb-grid-2" style="margin-top:18px;">
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">1. Bảo vệ Dữ liệu Cá nhân &amp; Quyền riêng tư</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Thu thập dữ liệu ở mức tối thiểu đúng mục đích thực hành ngoại ngữ và kết nối cộng đồng; không tự động công khai email, số điện thoại hay vị trí chính xác của người học.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">2. Bảo vệ Người chưa thành niên</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Yêu cầu sự đồng ý của phụ huynh/người giám hộ đối với người chưa thành niên; không tự động ghép cặp hoặc mở tin nhắn từ người lạ khi chưa có sự đồng thuận hai bên.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">3. Chính sách Gói dịch vụ, Thanh toán &amp; Hoàn tiền</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Sử dụng quy trình chuyển khoản ngân hàng thủ công kèm đối soát thực tế; tách biệt rõ gói cá nhân và gói tổ chức; không xóa dữ liệu khi hạ cấp gói hoặc làm mới chu kỳ tháng.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">4. Quyền Sở hữu Trí tuệ &amp; Học liệu</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Mọi tài liệu trong Thư viện tài nguyên đều ghi nhận thông tin nguồn, tác giả và quyền sử dụng; tiếp nhận và xử lý báo cáo vi phạm bản quyền minh bạch.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  });
})(window.WB);
