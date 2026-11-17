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


        <!-- TIẾNG ANH CHUYÊN NGÀNH CHO HỌC SINH CAO ĐẲNG NGHỀ, TRUNG CẤP NGHỀ, GDNN - GDTX (MỘT TÌNH HUỐNG - BA LỚP) -->
        <section class="wb-section">
          <div class="wb-card" style="border-top:5px solid var(--wb-deep-teal);background:linear-gradient(135deg,#F3F9F9 0%,#FFFDF7 100%);">
            <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;margin-bottom:14px;">
              <div>
                <span class="wb-badge wb-badge-red">TRỌNG TÂM ĐÀO TẠO NGHỀ • CƠ CHẾ "MỘT TÌNH HUỐNG - BA LỚP"</span>
                <h2 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Tiếng Anh Chuyên Ngành cho Học sinh Cao đẳng nghề, Trung cấp nghề &amp; GDNN - GDTX</h2>
                <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
                  Tổ chức toàn bộ việc học từ vựng, mẫu câu, đóng vai phản xạ và ghép cặp bạn học quanh một đơn vị duy nhất: <strong>Tình huống nghề nghiệp thực tế</strong> được giáo viên chuyên môn của khoa rà soát.
                </p>
              </div>
              <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <a href="/tinh-huong" class="wb-btn wb-btn-primary" data-nav="/tinh-huong">
                  ${WB.icon('layers', 16)}
                  <span>Vào Thư viện Tình huống 3 Lớp</span>
                </a>
                <a href="/ghep-cap" class="wb-btn wb-btn-accent" data-nav="/ghep-cap">
                  ${WB.icon('users', 16)}
                  <span>Ghép cặp Luyện nói &amp; Rubric</span>
                </a>
                <a href="/doi-thu-va-gia-tri" class="wb-btn wb-btn-outline" data-nav="/doi-thu-va-gia-tri">
                  <span>Phân tích Đối thủ &amp; Giá trị Khác biệt</span>
                </a>
              </div>
            </div>

            <div class="wb-grid-3" style="margin-bottom:16px;">
              <div class="wb-card" style="background:#FFFFFF;">
                <span class="wb-badge wb-badge-teal">LỚP 1 • LỚP NỘI DUNG</span>
                <h4 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Từ vựng, Mẫu câu &amp; Hội thoại Nghề</h4>
                <p style="font-size:13px;color:var(--wb-text-muted);margin:0;">Biên soạn sát chương trình đào tạo nghề Việt Nam (Cơ khí, Điện - Điện tử, Tin học, Ô tô, Thiết kế Đồ họa, Kinh tế - Du lịch, Điều dưỡng, Logistics) và được giáo viên chuyên môn rà soát.</p>
              </div>
              <div class="wb-card" style="background:#FFFFFF;">
                <span class="wb-badge wb-badge-red">LỚP 2 • LỚP LUYỆN TẬP</span>
                <h4 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Kịch bản Đóng vai A/B &amp; Rubric 5 Tiêu chí</h4>
                <p style="font-size:13px;color:var(--wb-text-muted);margin:0;">Thực hành đóng vai 2 người có mục tiêu công việc cụ thể, kèm bảng tiêu chí (Rubric) để người cùng luyện nhận xét có cấu trúc thay cho trò chuyện tự do.</p>
              </div>
              <div class="wb-card" style="background:#FFFFFF;">
                <span class="wb-badge wb-badge-success">LỚP 3 • LỚP CỘNG ĐỒNG</span>
                <h4 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Ghép cặp Cùng Trường, Khoa, Lớp &amp; Ngành</h4>
                <p style="font-size:13px;color:var(--wb-text-muted);margin:0;">Ghép cặp ngang hàng theo ngành học, trình độ và khung giờ rảnh trong cộng đồng học sinh, sinh viên tin cậy (Cao đẳng nghề, Trung cấp nghề, GDNN - GDTX).</p>
              </div>
            </div>

            <div style="font-size:13px;color:var(--wb-deep-teal);display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;padding-top:10px;border-top:1px solid var(--wb-border);">
              <div><strong>Nhóm sáng lập:</strong> Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như • Vũ Tiến Anh</div>
              <div><strong>8 Lĩnh vực Chuyên ngành:</strong> Cơ khí • Điện - Điện tử • Tin học • Công nghệ Ô tô • Thiết kế Đồ họa • Kinh tế - Du lịch • Điều dưỡng • Logistics</div>
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
          <p><strong>Nhóm sáng lập:</strong> Bùi Tấn Lộc • Cao Anh Nhựt • Võ Gia Như • Vũ Tiến Anh.</p>
          <p><strong>Đối tượng người học trọng tâm:</strong> Học sinh, sinh viên Trường Cao đẳng nghề, Trường Trung cấp nghề, Học viên Trung tâm GDNN - GDTX và người đi làm các lĩnh vực chuyên ngành nghề nghiệp.</p>
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

  // ============================================================================
  // 10. THƯ VIỆN TÌNH HUỐNG TIẾNG ANH CHUYÊN NGÀNH - CƠ CHẾ "MỘT TÌNH HUỐNG - BA LỚP" (/tinh-huong)
  // ============================================================================
  WB.registerView('/tinh-huong', async function (root, _pathname, searchParams) {
    const selectedSlug = searchParams?.get('slug') || '';
    const filterMajor = searchParams?.get('major') || 'Tất cả';
    const filterLevel = searchParams?.get('level') || 'Tất cả';
    const filterQ = searchParams?.get('q') || '';

    const speakEn = (text) => {
      if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const u = new SpeechSynthesisUtterance(text);
        u.lang = 'en-US';
        u.rate = 0.92;
        window.speechSynthesis.speak(u);
      }
    };

    if (selectedSlug) {
      try {
        const res = await WB.api('/api/career/scenarios?slug=' + encodeURIComponent(selectedSlug));
        const sc = res.scenario;
        const sessions = res.sessions || [];
        const vocab = sc.vocab || [];
        const phrases = sc.phrases || [];
        const dialogue = sc.dialogue || [];
        const roleA = sc.role_a || { title: 'Vai A', goal: '', tasks: [] };
        const roleB = sc.role_b || { title: 'Vai B', goal: '', tasks: [] };
        const rubric = sc.rubric || [];

        root.innerHTML = `
          <div class="wb-container wb-section">
            <div style="margin-bottom:14px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;">
              <a href="/tinh-huong" class="wb-btn wb-btn-outline" data-nav="/tinh-huong">Quay lại Thư viện Tình huống Nghề</a>
              <div style="display:flex;gap:8px;">
                <a href="/ghep-cap?scenario=${encodeURIComponent(sc.slug)}" class="wb-btn wb-btn-accent" data-nav="/ghep-cap?scenario=${encodeURIComponent(sc.slug)}">
                  ${WB.icon('users', 16)}
                  <span>Ghép cặp Luyện Tình huống Này</span>
                </a>
              </div>
            </div>

            <div class="wb-card" style="margin-bottom:20px;border-top:5px solid var(--wb-deep-teal);">
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                <span class="wb-badge wb-badge-teal">NGÀNH: ${sc.major.toUpperCase()}</span>
                <span class="wb-badge wb-badge-red">TRÌNH ĐỘ: ${sc.level}</span>
                <span class="wb-badge wb-badge-ivory">${sc.duration_minutes} PHÚT THỰC HÀNH</span>
                <span class="wb-badge wb-badge-success">ĐỐI TƯỢNG: ${sc.target_audience}</span>
              </div>
              <h1 style="margin:6px 0 8px 0;color:var(--wb-deep-teal);">${sc.title}</h1>
              <p style="font-size:14px;color:var(--wb-text-muted);margin:0 0 12px 0;">${sc.summary}</p>
              <div style="font-size:12.5px;color:var(--wb-deep-teal);background:var(--wb-bg-soft);padding:10px 14px;border-radius:10px;">
                <strong>Biên soạn:</strong> ${sc.author_name} • <strong>Rà soát chuyên môn:</strong> ${sc.reviewed_by_teacher} • <strong>Nguồn:</strong> ${sc.source_attribution}
              </div>
            </div>

            <!-- BA LỚP NỘI DUNG - LUYỆN TẬP - CỘNG ĐỒNG -->
            <div class="wb-card" style="margin-bottom:20px;">
              <span class="wb-badge wb-badge-teal">LỚP 1 • LỚP NỘI DUNG CHUYÊN NGÀNH (DO GIÁO VIÊN KHOA RÀ SOÁT)</span>
              <h2 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">1. Bộ Từ vựng Kỹ thuật &amp; Mẫu câu Tình huống Nghề (${sc.major})</h2>

              <div class="wb-grid-2" style="margin-bottom:18px;">
                <div>
                  <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Từ vựng Chuyên ngành Cốt lõi (${vocab.length})</h3>
                  ${vocab.map((v, i) => `
                    <div style="padding:10px 12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:8px;background:var(--wb-bg-soft);">
                      <div style="display:flex;justify-content:space-between;align-items:center;">
                        <div>
                          <strong style="font-size:15px;color:var(--wb-deep-teal);">${v.word}</strong>
                          <span style="font-size:12.5px;color:var(--wb-text-muted);margin-left:6px;">${v.phonetic} (${v.pos})</span>
                        </div>
                        <button type="button" class="wb-btn wb-btn-outline wb-speak-en-btn" data-text="${v.word.replace(/"/g, '&quot;')}" style="padding:3px 8px;font-size:12px;">
                          ${WB.icon('volume', 14)} <span>Nghe</span>
                        </button>
                      </div>
                      <div style="font-weight:700;color:var(--wb-vermilion);font-size:13.5px;margin-top:4px;">Nghĩa: ${v.meaning}</div>
                      <div style="font-size:12.5px;color:var(--wb-text-muted);margin-top:3px;"><em>Ví dụ:</em> ${v.example}</div>
                    </div>
                  `).join('')}
                </div>

                <div>
                  <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Mẫu câu Giao tiếp Nghề nghiệp (${phrases.length})</h3>
                  ${phrases.map(p => `
                    <div style="padding:10px 12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:8px;">
                      <div style="display:flex;justify-content:space-between;align-items:flex-start;gap:8px;">
                        <strong style="color:var(--wb-deep-teal);font-size:14px;">"${p.en}"</strong>
                        <button type="button" class="wb-btn wb-btn-outline wb-speak-en-btn" data-text="${p.en.replace(/"/g, '&quot;')}" style="padding:3px 8px;font-size:12px;flex-shrink:0;">
                          ${WB.icon('volume', 14)}
                        </button>
                      </div>
                      <div style="font-size:13px;color:var(--wb-text-main);margin-top:4px;">→ ${p.vi}</div>
                      <div style="font-size:12px;color:var(--wb-text-muted);margin-top:3px;"><em>Ngữ cảnh áp dụng:</em> ${p.context}</div>
                    </div>
                  `).join('')}
                </div>
              </div>

              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Hội thoại Mẫu Song ngữ Anh – Việt (${dialogue.length} lượt lời)</h3>
              <div style="display:flex;flex-direction:column;gap:8px;">
                ${dialogue.map(d => `
                  <div style="padding:12px 14px;border-radius:12px;border-left:4px solid ${d.role === 'A' ? 'var(--wb-deep-teal)' : 'var(--wb-vermilion)'};background:var(--wb-bg-soft);display:flex;justify-content:space-between;align-items:flex-start;gap:10px;">
                    <div>
                      <span class="wb-badge ${d.role === 'A' ? 'wb-badge-teal' : 'wb-badge-red'}">Vai ${d.role} • ${d.speakerName}</span>
                      <div style="font-weight:700;font-size:14.5px;color:var(--wb-deep-teal);margin-top:6px;">${d.en}</div>
                      <div style="font-size:13.5px;color:var(--wb-text-muted);margin-top:3px;">${d.vi}</div>
                    </div>
                    <button type="button" class="wb-btn wb-btn-outline wb-speak-en-btn" data-text="${d.en.replace(/"/g, '&quot;')}" style="padding:4px 10px;font-size:12px;flex-shrink:0;">
                      ${WB.icon('volume', 14)} <span>Phát âm</span>
                    </button>
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- LỚP 2: KỊCH BẢN ĐÓNG VAI 2 NGƯỜI & BẢNG TIÊU CHÍ RUBRIC -->
            <div class="wb-card" style="margin-bottom:20px;border-top:4px solid var(--wb-vermilion);">
              <span class="wb-badge wb-badge-red">LỚP 2 • LỚP LUYỆN TẬP ĐÓNG VAI CÓ CẤU TRÚC &amp; RUBRIC CHẤM ĐIỂM</span>
              <h2 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">2. Kịch bản Đóng vai Hai Người (Vai A &amp; Vai B) kèm Bảng Tiêu chí Nhận xét (Rubric)</h2>

              <div class="wb-grid-2" style="margin-bottom:18px;">
                <div class="wb-card" style="background:var(--wb-bg-soft);">
                  <span class="wb-badge wb-badge-teal">${roleA.title || 'Vai A'}</span>
                  <p style="font-size:13.5px;margin:8px 0;"><strong>Mục tiêu vai đóng:</strong> ${roleA.goal || ''}</p>
                  <ul style="padding-left:18px;margin:0;font-size:13px;">
                    ${(roleA.tasks || []).map(t => `<li style="margin-bottom:5px;">${t}</li>`).join('')}
                  </ul>
                </div>
                <div class="wb-card" style="background:var(--wb-bg-soft);">
                  <span class="wb-badge wb-badge-red">${roleB.title || 'Vai B'}</span>
                  <p style="font-size:13.5px;margin:8px 0;"><strong>Mục tiêu vai đóng:</strong> ${roleB.goal || ''}</p>
                  <ul style="padding-left:18px;margin:0;font-size:13px;">
                    ${(roleB.tasks || []).map(t => `<li style="margin-bottom:5px;">${t}</li>`).join('')}
                  </ul>
                </div>
              </div>

              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Bảng Tiêu chí Nhận xét Chéo (Rubric ${rubric.length} Tiêu chí chuẩn hóa)</h3>
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>STT</th><th>Tiêu chí đánh giá</th><th>Mô tả chi tiết</th><th>Thang điểm</th></tr>
                  </thead>
                  <tbody>
                    ${rubric.map((r, idx) => `
                      <tr>
                        <td><strong>0${idx + 1}</strong></td>
                        <td><strong>${r.criterion}</strong></td>
                        <td>${r.description}</td>
                        <td><span class="wb-badge wb-badge-ivory">1 – ${r.maxScore || 5} điểm</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- LỚP 3: LỚP CỘNG ĐỒNG GHÉP CẶP CÙNG TRƯỜNG, KHOA, LỚP -->
            <div class="wb-card" style="border-top:4px solid var(--wb-deep-teal);">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:10px;margin-bottom:12px;">
                <div>
                  <span class="wb-badge wb-badge-success">LỚP 3 • LỚP CỘNG ĐỒNG GHÉP CẶP CÙNG NGÀNH, TRÌNH ĐỘ &amp; LỊCH RẢNH</span>
                  <h2 style="margin:6px 0 0 0;color:var(--wb-deep-teal);">3. Lịch hẹn Ghép cặp Đang mở cho Tình huống Này (${sessions.length})</h2>
                </div>
                <a href="/ghep-cap?scenario=${encodeURIComponent(sc.slug)}" class="wb-btn wb-btn-primary" data-nav="/ghep-cap?scenario=${encodeURIComponent(sc.slug)}">
                  Tạo hoặc Nhận Lịch Ghép cặp Ngay
                </a>
              </div>
              ${sessions.length === 0 ? `
                <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Chưa có lịch hẹn mở cho tình huống này. Hãy bấm <strong>"Tạo hoặc Nhận Lịch Ghép cặp Ngay"</strong> để mở phòng luyện cùng bạn học cùng ngành!</p>
              ` : `
                <div class="wb-grid-2">
                  ${sessions.map(s => `
                    <div class="wb-card" style="background:var(--wb-bg-soft);">
                      <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                        <span class="wb-badge wb-badge-teal">${s.slot_label} (${s.scheduled_date})</span>
                        <span class="wb-badge ${s.status === 'OPEN' ? 'wb-badge-success' : 'wb-badge-ivory'}">${s.status === 'OPEN' ? 'Đang mở ghép cặp' : 'Đã hoàn thành'}</span>
                      </div>
                      <div style="font-weight:700;color:var(--wb-deep-teal);">Bạn tạo lịch: ${s.host_name}</div>
                      <div style="font-size:12.5px;color:var(--wb-text-muted);margin-top:2px;">Đơn vị: ${s.school_name} • Hệ: ${s.education_system}</div>
                      <div style="font-size:12.5px;margin-top:6px;">${s.notes || ''}</div>
                    </div>
                  `).join('')}
                </div>
              `}
            </div>
          </div>
        `;

        root.querySelectorAll('.wb-speak-en-btn').forEach(btn => {
          btn.onclick = () => speakEn(btn.getAttribute('data-text'));
        });
        return;
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    }

    const data = await WB.api(
      `/api/career/scenarios?major=${encodeURIComponent(filterMajor)}&level=${encodeURIComponent(filterLevel)}&q=${encodeURIComponent(filterQ)}`
    );
    const scenarios = data.scenarios || [];
    const majors = ['Tất cả', ...(data.majors || ['Cơ khí', 'Điện - Điện tử', 'Tin học', 'Kinh tế - Du lịch', 'Công nghệ Ô tô', 'Thiết kế Đồ họa', 'Điều dưỡng - Y dược', 'Logistics - Xuất nhập khẩu'])];
    const levels = ['Tất cả', 'Cơ bản (A2)', 'Trung bình (B1)', 'Khá (B2)'];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;border-top:5px solid var(--wb-deep-teal);">
          <div style="display:flex;justify-content:space-between;align-items:flex-start;flex-wrap:wrap;gap:14px;">
            <div style="max-width:760px;">
              <span class="wb-badge wb-badge-teal">TIẾNG ANH CHUYÊN NGÀNH • CƠ CHẾ "MỘT TÌNH HUỐNG - BA LỚP"</span>
              <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Thư viện Tình huống Nghề nghiệp (Cao đẳng nghề • Trung cấp nghề • GDNN - GDTX)</h1>
              <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
                Mỗi tình huống nghề nghiệp gồm 3 lớp: <strong>(1) Lớp nội dung</strong> (từ vựng, mẫu câu, hội thoại mẫu do giáo viên chuyên môn rà soát), <strong>(2) Lớp luyện tập</strong> (kịch bản đóng vai A/B kèm bảng tiêu chí Rubric), và <strong>(3) Lớp cộng đồng</strong> (ghép cặp cùng trường, cùng khoa, cùng lớp).
              </p>
            </div>
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
              <a href="/ghep-cap" class="wb-btn wb-btn-accent" data-nav="/ghep-cap">${WB.icon('users', 16)} <span>Vào Phòng Ghép cặp</span></a>
              <a href="/doi-thu-va-gia-tri" class="wb-btn wb-btn-outline" data-nav="/doi-thu-va-gia-tri"><span>Phân tích Đối thủ &amp; Giá trị</span></a>
            </div>
          </div>

          <form id="wbScenarioFilterForm" class="wb-grid-4" style="margin-top:16px;padding-top:14px;border-top:1px solid var(--wb-border);">
            <div>
              <label class="wb-label">Lĩnh vực chuyên ngành</label>
              <select class="wb-select" name="major">
                ${majors.map(m => `<option value="${m}" ${m === filterMajor ? 'selected' : ''}>${m}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="wb-label">Trình độ tiếng Anh</label>
              <select class="wb-select" name="level">
                ${levels.map(lv => `<option value="${lv}" ${lv === filterLevel ? 'selected' : ''}>${lv}</option>`).join('')}
              </select>
            </div>
            <div>
              <label class="wb-label">Từ khóa tình huống</label>
              <input type="search" class="wb-input" name="q" value="${filterQ}" placeholder="Tìm CNC, OBD-II, mạch điện, IT, in ấn..." />
            </div>
            <div style="display:flex;align-items:flex-end;">
              <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Lọc Tình huống (${scenarios.length})</button>
            </div>
          </form>
        </div>

        <div class="wb-grid-2">
          ${scenarios.map(s => `
            <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;flex-wrap:wrap;margin-bottom:8px;">
                  <span class="wb-badge wb-badge-teal">${s.major}</span>
                  <span class="wb-badge wb-badge-ivory">${s.level} • ${s.duration_minutes} phút</span>
                </div>
                <h3 style="margin:6px 0 8px 0;color:var(--wb-deep-teal);">${s.title}</h3>
                <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${s.summary}</p>
                <div style="font-size:12px;color:var(--wb-text-muted);background:var(--wb-bg-soft);padding:8px 10px;border-radius:8px;margin-bottom:12px;">
                  <div><strong>Biên soạn:</strong> ${s.author_name}</div>
                  <div><strong>Rà soát:</strong> ${s.reviewed_by_teacher}</div>
                  <div><strong>Cấu trúc 3 lớp:</strong> ${(s.vocab || []).length} thuật ngữ • ${(s.dialogue || []).length} câu hội thoại • Đóng vai A/B + Rubric 5 tiêu chí</div>
                </div>
              </div>
              <div style="display:flex;justify-content:space-between;align-items:center;gap:8px;padding-top:10px;border-top:1px solid var(--wb-border);">
                <a href="/tinh-huong?slug=${encodeURIComponent(s.slug)}" class="wb-btn wb-btn-primary" data-nav="/tinh-huong?slug=${encodeURIComponent(s.slug)}">
                  <span>Học &amp; Đóng vai 3 Lớp</span>
                  ${WB.icon('arrowRight', 15)}
                </a>
                <a href="/ghep-cap?scenario=${encodeURIComponent(s.slug)}" class="wb-btn wb-btn-outline" data-nav="/ghep-cap?scenario=${encodeURIComponent(s.slug)}">
                  Ghép cặp (${s.open_sessions_count} lịch mở)
                </a>
              </div>
            </div>
          `).join('')}
        </div>
      </div>
    `;

    document.getElementById('wbScenarioFilterForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const p = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (v && v !== 'Tất cả') p.set(k, String(v));
      }
      WB.navigate('/tinh-huong' + (p.toString() ? '?' + p.toString() : ''));
    };
  });

  // ============================================================================
  // 11. PHÒNG GHÉP CẶP LUYỆN NÓI NGANG HÀNG THEO NGÀNH & CHẤM ĐIỂM RUBRIC (/ghep-cap)
  // ============================================================================
  WB.registerView('/ghep-cap', async function (root, _pathname, searchParams) {
    const preSlug = searchParams?.get('scenario') || '';
    const [scRes, sesRes] = await Promise.all([
      WB.api('/api/career/scenarios'),
      WB.api('/api/career/sessions')
    ]);
    const scenarios = scRes.scenarios || [];
    const sessions = sesRes.sessions || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;border-top:5px solid var(--wb-deep-teal);">
          <span class="wb-badge wb-badge-teal">LỚP 3 • CỘNG ĐỒNG GHÉP CẶP NGANG HÀNG CÓ CẤU TRÚC</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Phòng Ghép cặp Luyện nói Chuyên ngành &amp; Nhận xét Chéo theo Rubric</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
            Khác với trò chuyện tự do trên mạng xã hội mở, WORD BRIDGE ghép cặp <strong>cùng ngành nghề, cùng trình độ, có kịch bản Vai A / Vai B và bảng tiêu chí Rubric 5 mục</strong> trong cộng đồng học sinh, sinh viên tin cậy (Cao đẳng nghề, Trung cấp nghề, GDNN - GDTX).
          </p>
        </div>

        <div class="wb-grid-2" style="margin-bottom:22px;">
          <!-- Biểu mẫu tạo lịch hẹn ghép cặp -->
          <div class="wb-card">
            <span class="wb-badge wb-badge-red">TẠO LỊCH HẸN MỚI</span>
            <h3 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">Đăng ký Lịch hẹn Ghép cặp Tình huống Nghề</h3>
            <form id="wbCreateCareerSessionForm">
              <div class="wb-form-group">
                <label class="wb-label">Chọn Tình huống Chuyên ngành <span class="req">*</span></label>
                <select class="wb-select" name="scenario_slug" required>
                  ${scenarios.map(s => `<option value="${s.slug}" ${s.slug === preSlug ? 'selected' : ''}>[${s.major} - ${s.level}] ${s.title}</option>`).join('')}
                </select>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Họ tên người tạo lịch</label>
                  <input type="text" class="wb-input" name="host_name" value="${WB.state.user?.full_name || ''}" placeholder="Nhập họ tên học sinh / sinh viên..." required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Hệ đào tạo</label>
                  <select class="wb-select" name="education_system">
                    <option value="Cao đẳng nghề">Trường Cao đẳng nghề</option>
                    <option value="Trung cấp nghề">Trường Trung cấp nghề</option>
                    <option value="GDNN - GDTX">Trung tâm GDNN - GDTX</option>
                    <option value="Đại học / Người đi làm">Đại học / Người đi làm chuyên môn</option>
                  </select>
                </div>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Trường / Trung tâm</label>
                  <input type="text" class="wb-input" name="school_name" value="Trường Cao đẳng nghề Việt Nam - Singapore (VSVC)" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Lớp / Khoa</label>
                  <input type="text" class="wb-input" name="class_name" value="T25DH2DA" required />
                </div>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Khung giờ rảnh cố định</label>
                  <select class="wb-select" name="slot_label">
                    <option value="Thứ 2 (19:00 - 19:45)">Thứ 2 (19:00 - 19:45)</option>
                    <option value="Thứ 3 (19:30 - 20:15)">Thứ 3 (19:30 - 20:15)</option>
                    <option value="Thứ 4 (19:00 - 19:45)">Thứ 4 (19:00 - 19:45)</option>
                    <option value="Thứ 5 (19:30 - 20:15)">Thứ 5 (19:30 - 20:15)</option>
                    <option value="Thứ 6 (19:00 - 19:45)">Thứ 6 (19:00 - 19:45)</option>
                    <option value="Thứ 7 (09:00 - 09:45)">Thứ 7 (09:00 - 09:45)</option>
                    <option value="Chủ nhật (20:00 - 20:45)">Chủ nhật (20:00 - 20:45)</option>
                  </select>
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Ngày thực hành</label>
                  <input type="date" class="wb-input" name="scheduled_date" value="2026-11-25" required />
                </div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Ghi chú vai đóng mong muốn (Vai A / Vai B)</label>
                <input type="text" class="wb-input" name="notes" placeholder="Ví dụ: Mình đóng Vai A (Kỹ thuật viên), tìm bạn đóng Vai B..." />
              </div>
              <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Đăng Lịch hẹn Ghép cặp Cùng Ngành</button>
            </form>
          </div>

          <!-- Biểu mẫu chấm điểm Rubric sau buổi luyện -->
          <div class="wb-card">
            <span class="wb-badge wb-badge-teal">PHIẾU NHẬN XÉT CHÉO RUBRIC 5 TIÊU CHÍ</span>
            <h3 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">Chấm điểm &amp; Nhận xét Bạn Cùng Luyện</h3>
            <form id="wbSubmitRubricForm">
              <div class="wb-form-group">
                <label class="wb-label">Chọn Phiên Ghép cặp cần chấm điểm <span class="req">*</span></label>
                <select class="wb-select" name="session_id" required>
                  ${sessions.map(s => `<option value="${s.id}">[${s.major}] ${s.scenario_title} — ${s.host_name}</option>`).join('')}
                </select>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">1. Thuật ngữ chuyên ngành (1–5)</label>
                  <input type="number" class="wb-input" name="terminology" min="1" max="5" value="5" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">2. Phát âm &amp; Độ rõ ý (1–5)</label>
                  <input type="number" class="wb-input" name="clarity" min="1" max="5" value="5" required />
                </div>
              </div>
              <div class="wb-grid-3">
                <div class="wb-form-group">
                  <label class="wb-label">3. Đúng trọng tâm vai (1–5)</label>
                  <input type="number" class="wb-input" name="task_completion" min="1" max="5" value="5" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">4. Phản xạ xác nhận (1–5)</label>
                  <input type="number" class="wb-input" name="interaction" min="1" max="5" value="4" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">5. Thái độ nghề nghiệp (1–5)</label>
                  <input type="number" class="wb-input" name="professionalism" min="1" max="5" value="5" required />
                </div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Điểm mạnh của bạn cùng luyện <span class="req">*</span></label>
                <input type="text" class="wb-input" name="strengths" required placeholder="Ví dụ: Dùng chuẩn các thuật ngữ kỹ thuật, giọng rõ ràng..." />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Điểm cần cải thiện <span class="req">*</span></label>
                <input type="text" class="wb-input" name="improvements" required placeholder="Ví dụ: Chú ý thêm âm cuối -s/-ed và tốc độ nói..." />
              </div>
              <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Gửi Phiếu Nhận xét Rubric</button>
            </form>
          </div>
        </div>

        <!-- Danh sách phiên ghép cặp -->
        <div class="wb-card">
          <h2 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh sách Phiên Ghép cặp Luyện nói Theo Ngành (${sessions.length})</h2>
          <div class="wb-grid-2">
            ${sessions.map(s => `
              <div class="wb-card" style="background:var(--wb-bg-soft);display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;gap:6px;flex-wrap:wrap;margin-bottom:8px;">
                    <span class="wb-badge wb-badge-teal">${s.major} • ${s.level}</span>
                    <span class="wb-badge ${s.status === 'OPEN' ? 'wb-badge-success' : 'wb-badge-ivory'}">${s.status === 'OPEN' ? 'Đang mở nhận cặp' : (s.status === 'MATCHED' ? 'Đã ghép cặp' : 'Đã hoàn thành Rubric')}</span>
                  </div>
                  <h4 style="margin:4px 0 6px 0;color:var(--wb-deep-teal);">${s.scenario_title}</h4>
                  <div style="font-size:13px;color:var(--wb-text-main);">
                    • <strong>Người tạo (Vai A):</strong> ${s.host_name}<br/>
                    • <strong>Bạn cùng luyện (Vai B):</strong> ${s.partner_name || '<em>Đang chờ bạn cùng ngành nhận lịch</em>'}<br/>
                    • <strong>Trường / Hệ:</strong> ${s.school_name} (${s.education_system} – Lớp ${s.class_name})<br/>
                    • <strong>Khung giờ:</strong> ${s.slot_label} • Ngày: ${s.scheduled_date} • Mã phòng: <code>${s.meeting_room_code}</code>
                  </div>
                  ${(s.rubrics || []).map(rv => `
                    <div style="margin-top:8px;padding:8px 10px;background:#FFFFFF;border-left:3px solid var(--wb-deep-teal);border-radius:6px;font-size:12.5px;">
                      <strong>Kết quả Rubric (${rv.overall_score}/5.0):</strong> ${rv.strengths}<br/>
                      <span style="color:var(--wb-text-muted);">Góp ý: ${rv.improvements}</span>
                    </div>
                  `).join('')}
                </div>
                <div style="margin-top:12px;padding-top:10px;border-top:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;">
                  <a href="/tinh-huong?slug=${encodeURIComponent(s.scenario_slug)}" class="wb-btn wb-btn-outline" data-nav="/tinh-huong?slug=${encodeURIComponent(s.scenario_slug)}" style="padding:5px 10px;font-size:12px;">Xem kịch bản 3 lớp</a>
                  ${s.status === 'OPEN' ? `
                    <button type="button" class="wb-btn wb-btn-primary wb-join-career-ses-btn" data-id="${s.id}" style="padding:5px 12px;font-size:12px;">Nhận Ghép cặp Ngay</button>
                  ` : ''}
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbCreateCareerSessionForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/career/sessions', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã đăng lịch hẹn ghép cặp chuyên ngành thành công!', 'success');
        WB.navigate('/ghep-cap');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbSubmitRubricForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const raw = Object.fromEntries(fd.entries());
      try {
        await WB.api('/api/career/sessions/rubric', {
          method: 'POST',
          body: {
            session_id: raw.session_id,
            scores: {
              terminology: Number(raw.terminology || 5),
              clarity: Number(raw.clarity || 5),
              task_completion: Number(raw.task_completion || 5),
              interaction: Number(raw.interaction || 4),
              professionalism: Number(raw.professionalism || 5)
            },
            strengths: raw.strengths,
            improvements: raw.improvements
          }
        });
        WB.toast('Đã lưu phiếu chấm điểm Rubric 5 tiêu chí thành công!', 'success');
        WB.navigate('/ghep-cap');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-join-career-ses-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/career/sessions/join', {
            method: 'POST',
            body: {
              session_id: btn.getAttribute('data-id'),
              partner_name: WB.state.user?.full_name || 'Bạn học cùng ngành (VSVC)'
            }
          });
          WB.toast('Đã nhận lịch ghép cặp thành công! Hãy chuẩn bị kịch bản Vai B.', 'success');
          WB.navigate('/ghep-cap');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  });

  // ============================================================================
  // 12. PHÂN TÍCH ĐỐI THỦ, GIẢI PHÁP THAY THẾ & GIÁ TRỊ KHÁC BIỆT (MỤC V & VI - /doi-thu-va-gia-tri, /de-an)
  // ============================================================================
  const renderCompetitorAndInnovation = async function (root) {
    const res = await WB.api('/api/career/competitors');
    const comp = res.competitor_analysis;
    const brand = res.brand;

    root.innerHTML = `
      <div class="wb-container wb-section">
        <!-- HEADER ĐỀ ÁN & NHÓM SÁNG LẬP -->
        <div class="wb-card" style="margin-bottom:20px;border-top:5px solid var(--wb-deep-teal);">
          <span class="wb-badge wb-badge-teal">HỒ SƠ ĐỀ ÁN WORD BRIDGE • TIẾNG ANH CHUYÊN NGÀNH CHO GDNN - GDTX</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">V. Phân tích Đối thủ &amp; VI. Tính mới và Giá trị Khác biệt</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0 0 12px 0;">
            Định vị dành riêng cho <strong>Học sinh, sinh viên trường Cao đẳng nghề, Trung cấp nghề, GDNN - GDTX</strong> với các môn tiếng Anh chuyên ngành thuộc nhiều lĩnh vực nghề nghiệp.
          </p>
          <div class="wb-grid-4">
            ${(brand.FOUNDING_TEAM || []).map(m => `
              <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;border-left:3px solid var(--wb-deep-teal);">
                <div style="font-weight:800;color:var(--wb-deep-teal);font-size:14.5px;">${m.name}</div>
                <div style="font-size:12px;color:var(--wb-vermilion);font-weight:700;margin-top:2px;">${m.role}</div>
                <div style="font-size:12px;color:var(--wb-text-muted);margin-top:4px;">${m.unit}</div>
              </div>
            `).join('')}
          </div>
        </div>

        <!-- V. PHÂN TÍCH ĐỐI THỦ VÀ GIẢI PHÁP THAY THẾ -->
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-red">MỤC V • PHÂN TÍCH ĐỐI THỦ VÀ GIẢI PHÁP THAY THẾ</span>
          <h2 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">1. Điểm mạnh &amp; Hạn chế của các Giải pháp Hiện có đối với Học sinh, Sinh viên Nghề</h2>
          <div class="wb-table-wrap" style="margin-bottom:20px;">
            <table class="wb-table">
              <thead>
                <tr>
                  <th style="width:24%;">Giải pháp</th>
                  <th style="width:38%;">Điểm mạnh</th>
                  <th style="width:38%;">Hạn chế với nhóm khách hàng của dự án</th>
                </tr>
              </thead>
              <tbody>
                ${comp.section_v_details.map(r => `
                  <tr>
                    <td><strong>${r.solution}</strong></td>
                    <td>${r.strengths}</td>
                    <td style="color:var(--wb-vermilion);">${r.limitations}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>

          <h2 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">2. Bảng So sánh theo Tiêu chí (Đánh giá ban đầu của nhóm)</h2>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead>
                <tr>
                  <th>Giải pháp</th>
                  <th>Nội dung theo ngành nghề</th>
                  <th>Luyện nói với người thật</th>
                  <th>Cộng đồng cùng ngành</th>
                  <th>Chi phí thấp cho HSSV</th>
                  <th>Giao diện tiếng Việt</th>
                </tr>
              </thead>
              <tbody>
                ${comp.comparison_matrix.map(row => `
                  <tr style="${row.is_wordbridge ? 'background:#E6F4F3;font-weight:700;' : ''}">
                    <td><strong style="color:${row.is_wordbridge ? 'var(--wb-deep-teal)' : 'inherit'};">${row.solution}</strong></td>
                    <td><span class="wb-badge ${row.career_content === 'Có' ? 'wb-badge-success' : (row.career_content === 'Không' ? 'wb-badge-ivory' : 'wb-badge-teal')}">${row.career_content}</span></td>
                    <td><span class="wb-badge ${row.real_person_speaking.startsWith('Có') ? 'wb-badge-success' : 'wb-badge-ivory'}">${row.real_person_speaking}</span></td>
                    <td><span class="wb-badge ${row.same_major_community === 'Có' ? 'wb-badge-success' : 'wb-badge-ivory'}">${row.same_major_community}</span></td>
                    <td><span class="wb-badge ${row.low_cost_for_students === 'Có' ? 'wb-badge-success' : 'wb-badge-ivory'}">${row.low_cost_for_students}</span></td>
                    <td><span class="wb-badge ${row.vietnamese_ui === 'Có' ? 'wb-badge-success' : 'wb-badge-ivory'}">${row.vietnamese_ui}</span></td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>

        <!-- VI. TÍNH MỚI VÀ GIÁ TRỊ KHÁC BIỆT -->
        <div class="wb-card" style="margin-bottom:20px;border-top:4px solid var(--wb-deep-teal);">
          <span class="wb-badge wb-badge-teal">MỤC VI • TÍNH MỚI VÀ GIÁ TRỊ KHÁC BIỆT</span>
          <h2 style="margin:8px 0 8px 0;color:var(--wb-deep-teal);">Tổ chức Xoay Quanh Một Đơn vị Duy nhất: Tình huống Nghề nghiệp</h2>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0 0 16px 0;">${comp.section_vi_innovation.intro}</p>

          <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">1. Cơ chế "Một tình huống - Ba lớp"</h3>
          <div class="wb-grid-3" style="margin-bottom:18px;">
            ${comp.section_vi_innovation.three_layers_mechanism.map(l => `
              <div class="wb-card" style="background:var(--wb-bg-soft);">
                <span class="wb-badge wb-badge-teal">${l.layer}</span>
                <p style="font-size:13.5px;margin:10px 0 0 0;line-height:1.6;">${l.description}</p>
              </div>
            `).join('')}
          </div>

          <div class="wb-grid-2" style="margin-bottom:18px;">
            <div class="wb-card" style="background:var(--wb-bg-soft);">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">2. Ba Điểm Khác biệt so với Đối thủ</h3>
              <ul style="padding-left:18px;margin:0;font-size:13.5px;line-height:1.65;">
                ${comp.section_vi_innovation.three_differentiators.map(d => `<li style="margin-bottom:6px;">${d}</li>`).join('')}
              </ul>
            </div>
            <div class="wb-card" style="background:var(--wb-bg-soft);">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">3. Điều Nhóm Thừa nhận Minh bạch</h3>
              <p style="font-size:13.5px;line-height:1.65;margin:0;">${comp.section_vi_innovation.candid_acknowledgment}</p>
              <div style="margin-top:12px;">
                <a href="/khao-sat" class="wb-btn wb-btn-outline" data-nav="/khao-sat">Xem &amp; Thực hiện Khảo sát Kiểm chứng H1–H6</a>
              </div>
            </div>
          </div>

          <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">4. Những Câu hỏi Ban Giám khảo có thể Đặt ra &amp; Trả lời của Nhóm</h3>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead>
                <tr>
                  <th style="width:32%;">Câu hỏi của Ban Giám khảo</th>
                  <th style="width:68%;">Trả lời của Nhóm sáng lập WORD BRIDGE</th>
                </tr>
              </thead>
              <tbody>
                ${comp.section_vi_innovation.judge_qna.map(qa => `
                  <tr>
                    <td><strong style="color:var(--wb-deep-teal);">${qa.question}</strong></td>
                    <td>${qa.answer}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;
  };
  WB.registerView('/doi-thu-va-gia-tri', renderCompetitorAndInnovation);
  WB.registerView('/de-an', renderCompetitorAndInnovation);

  // ============================================================================
  // 13. KHẢO SÁT NHU CẦU H1–H6 CHO HỌC SINH TRƯỜNG NGHỀ & GDNN - GDTX (/khao-sat)
  // ============================================================================
  WB.registerView('/khao-sat', async function (root) {
    const data = await WB.api('/api/career/surveys');
    const hyps = data.hypotheses || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;border-top:5px solid var(--wb-deep-teal);">
          <span class="wb-badge wb-badge-teal">KIỂM CHỨNG GIẢ THUYẾT H1–H6 • KHẢO SÁT THỰC TẾ (${data.total_responses} PHẢN HỒI)</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Khảo sát Nhu cầu Tiếng Anh Chuyên ngành (Cao đẳng nghề • Trung cấp nghề • GDNN - GDTX)</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
            Số liệu thu thập trực tiếp để kiểm chứng 5 giả thuyết cốt lõi về nhu cầu học từ vựng và luyện nói theo tình huống nghề nghiệp.
          </p>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Gửi Phản hồi Khảo sát Nhanh (Ẩn danh)</h3>
            <form id="wbVocationalSurveyForm">
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Hệ đào tạo của bạn</label>
                  <select class="wb-select" name="education_type">
                    <option value="Cao đẳng nghề">Trường Cao đẳng nghề</option>
                    <option value="Trung cấp nghề">Trường Trung cấp nghề</option>
                    <option value="GDNN - GDTX">Trung tâm GDNN - GDTX</option>
                    <option value="Sinh viên / Người đi làm">Sinh viên ĐH / Người đi làm</option>
                  </select>
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Ngành nghề theo học</label>
                  <select class="wb-select" name="major">
                    <option value="Cơ khí">Cơ khí</option>
                    <option value="Điện - Điện tử">Điện - Điện tử</option>
                    <option value="Tin học">Tin học / CNTT</option>
                    <option value="Công nghệ Ô tô">Công nghệ Ô tô</option>
                    <option value="Thiết kế Đồ họa">Thiết kế Đồ họa</option>
                    <option value="Kinh tế - Du lịch">Kinh tế - Du lịch</option>
                    <option value="Điều dưỡng - Y dược">Điều dưỡng - Y dược</option>
                    <option value="Logistics - Xuất nhập khẩu">Logistics - Xuất nhập khẩu</option>
                  </select>
                </div>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mức độ sát ngành của các ứng dụng bạn từng học (1 = Rất chưa sát, 5 = Rất sát)</label>
                <select class="wb-select" name="career_relevance_score">
                  <option value="1">1 - Rất chưa sát ngành nghề đang học</option>
                  <option value="2" selected>2 - Chưa sát tình huống thực hành xưởng/công việc</option>
                  <option value="3">3 - Bình thường</option>
                  <option value="4">4 - Khá sát</option>
                  <option value="5">5 - Rất sát</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mức độ sẵn sàng ghép cặp luyện nói cùng ngành theo kịch bản &amp; Rubric (1–5)</label>
                <select class="wb-select" name="pair_willingness_score">
                  <option value="5" selected>5 - Rất sẵn sàng tham gia hàng tuần</option>
                  <option value="4">4 - Sẵn sàng</option>
                  <option value="3">3 - Phân vân</option>
                  <option value="2">2 - Ít sẵn sàng</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Góp ý tình huống nghề bạn muốn bổ sung thêm</label>
                <textarea class="wb-textarea" name="feedback_note" rows="3" placeholder="Ví dụ: Cần thêm tình huống đọc bản vẽ AutoCAD 2D, giao tiếp xưởng hàn..."></textarea>
              </div>
              <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Gửi Khảo sát &amp; Cập nhật Chỉ số H1–H5</button>
            </form>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Kết quả Kiểm chứng Giả thuyết Trực tiếp (${data.total_responses} mẫu)</h3>
            ${hyps.map(h => `
              <div style="padding:10px 12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;background:var(--wb-bg-soft);">
                <div style="display:flex;justify-content:space-between;align-items:center;">
                  <strong style="color:var(--wb-deep-teal);">${h.code}: ${h.title}</strong>
                  <span class="wb-badge ${h.passed ? 'wb-badge-success' : 'wb-badge-ivory'}">${h.actual_pct}% (Ngưỡng ≥ ${h.target_pct}%)</span>
                </div>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbVocationalSurveyForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/career/surveys', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Cảm ơn bạn! Phản hồi khảo sát đã được ghi nhận vào hệ thống.', 'success');
        WB.navigate('/khao-sat');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });

})(window.WB);
