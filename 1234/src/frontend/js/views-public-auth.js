'use strict';

(function (WB) {
  // TRANG CHỦ WORD BRIDGE (Đủ 15 phần theo PHẦN 06.2, không dùng số liệu ảo)
  WB.registerView('/', async function (root) {
    const langs = WB.state.bootstrap?.languages || [];
    const plans = WB.state.bootstrap?.pricing?.plans || [];

    root.innerHTML = `
      <!-- 1. Hero giới thiệu WORD BRIDGE -->
      <section class="wb-hero">
        <div class="wb-container wb-hero-grid">
          <div>
            <span class="wb-badge wb-badge-teal" style="margin-bottom:10px;">NỀN TẢNG THỰC HÀNH NGOẠI NGỮ & KẾT NỐI CỘNG ĐỒNG</span>
            <h1 class="wb-hero-title">WORD BRIDGE – Where Languages Bring People Together.</h1>
            <p style="font-size:16px;color:var(--wb-text-muted);margin:14px 0 22px 0;">
              Hợp nhất công cụ tự rèn luyện 05 ngôn ngữ, bộ lọc tìm bạn đồng hành, không gian vận hành câu lạc bộ/tổ chức và hệ thống khảo thí vào chung một nền tảng duy nhất tại <strong>https://wordbridge.io.vn</strong>.
            </p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <a href="/hoc-tap" class="wb-btn wb-btn-primary" data-nav="/hoc-tap">▶ Bắt đầu Thực hành ngay</a>
              <a href="/dang-ky" class="wb-btn wb-btn-accent" data-nav="/dang-ky">Đăng ký Tài khoản Cá nhân</a>
              <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-outline" data-nav="/dang-ky-to-chuc">Đăng ký Tổ chức / CLB</a>
            </div>
          </div>
          <div>
            <img src="/assets/hero-globe-illustration.svg" alt="Minh họa 5 ngôn ngữ WORD BRIDGE" style="width:100%;height:auto;border-radius:16px;box-shadow:var(--wb-shadow-md);" />
          </div>
        </div>
      </section>

      <div class="wb-container">
        <!-- 2 & 3. Giới thiệu nền tảng & 4 Định hướng LEARN – CONNECT – COMMUNITY – GROW -->
        <section class="wb-section">
          <h2 class="wb-section-title">Bốn Định Hướng Cốt Lõi: LEARN – CONNECT – COMMUNITY – GROW</h2>
          <div class="wb-grid-4">
            <div class="wb-card">
              <span class="wb-badge wb-badge-teal">01 • LEARN</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Thực hành & Tự rèn luyện</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Rèn phản xạ mỗi ngày với 04 công cụ cốt lõi (Nghe điền từ, Từ vựng, Sắp xếp câu, Đọc hiểu) kèm Trợ lý AI giải thích ngữ cảnh.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">02 • CONNECT</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Kết nối Bạn thực hành</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Tìm bạn đồng hành cùng ngôn ngữ, trình độ, mục tiêu và khung giờ rảnh. Chỉ mở trò chuyện khi hai bên cùng đồng thuận.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-ivory">03 • COMMUNITY</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Cộng đồng, CLB & Tổ chức</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Không gian sinh hoạt chung cho câu lạc bộ, đội, nhóm và tổ chức giáo dục để chia sẻ học liệu, mở thử thách và quản trị thành viên.</p>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-success">04 • GROW</span>
              <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">Theo dõi Sự tiến bộ</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Lưu lịch sử điểm số thực tế theo từng kỹ năng, quản lý mục tiêu cá nhân và đánh giá năng lực tại Hệ Thống Khảo Thí WORD BRIDGE.</p>
            </div>
          </div>
        </section>

        <!-- 4. Năm ngôn ngữ -->
        <section class="wb-section">
          <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:14px;">
            <h2 class="wb-section-title" style="margin:0;">Năm Ngôn Ngữ Trọng Tâm Trên WORD BRIDGE</h2>
            <a href="/ngon-ngu" class="wb-btn wb-btn-outline" data-nav="/ngon-ngu">Khám phá chi tiết →</a>
          </div>
          <div class="wb-grid-5">
            ${langs.map(l => `
              <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <span class="wb-badge wb-badge-teal">${l.code.toUpperCase()}</span>
                  <h3 style="margin:10px 0 4px 0;color:var(--wb-deep-teal);">${l.name_vi}</h3>
                  <div style="font-weight:700;font-size:15px;color:var(--wb-vermilion);margin-bottom:8px;">${l.native_name}</div>
                  <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${l.script_system}</p>
                </div>
                <a href="/hoc-tap?lang=${l.code}" class="wb-btn wb-btn-primary" data-nav="/hoc-tap">Thực hành ${l.name_vi}</a>
              </div>
            `).join('')}
          </div>
        </section>

        <!-- 5 & 6. Bốn công cụ thực hành & Theo dõi tiến độ -->
        <section class="wb-section">
          <h2 class="wb-section-title">Bốn Công Cụ Thực Hành Cốt Lõi & Theo Dõi Tiến Độ Thực Tế</h2>
          <div class="wb-grid-4">
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🎧 A. Nghe điền từ</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Phát âm thanh, tạm dừng, điều chỉnh tốc độ, điền từ còn thiếu, chấm điểm và xem giải thích ngữ cảnh.</p>
              <a href="/hoc-tap/nghe" class="wb-btn wb-btn-outline" data-nav="/hoc-tap/nghe">Mở bài Nghe</a>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🗂️ B. Từ vựng & Flashcard</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Xem giải nghĩa, phiên âm, ví dụ, lật thẻ ghi nhớ, tự tạo bộ từ riêng và làm bài kiểm tra trí nhớ.</p>
              <a href="/hoc-tap/tu-vung" class="wb-btn wb-btn-outline" data-nav="/hoc-tap/tu-vung">Ôn Từ vựng</a>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🧩 C. Sắp xếp câu</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Kéo thả hoặc bấm chọn các từ bị xáo trộn để ghép thành câu hoàn chỉnh theo đúng quy tắc ngữ pháp.</p>
              <a href="/hoc-tap/sap-xep-cau" class="wb-btn wb-btn-outline" data-nav="/hoc-tap/sap-xep-cau">Sắp xếp câu</a>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">📖 D. Đọc hiểu</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Đọc đoạn văn phân cấp theo chủ đề và trình độ, trả lời câu hỏi trắc nghiệm và lưu kết quả vào Tiến độ.</p>
              <a href="/hoc-tap/doc-hieu" class="wb-btn wb-btn-outline" data-nav="/hoc-tap/doc-hieu">Luyện Đọc hiểu</a>
            </div>
          </div>
        </section>

        <!-- 7, 8, 9. Tìm bạn luyện tập, Cộng đồng & Tổ chức / Câu lạc bộ -->
        <section class="wb-section">
          <h2 class="wb-section-title">Kết Nối Bạn Học, Cộng Đồng Ngoại Ngữ & Không Gian Tổ Chức</h2>
          <div class="wb-grid-3">
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🤝 Tìm bạn luyện tập & Chat</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Lọc bạn học theo ngôn ngữ, trình độ, mục tiêu và khung giờ. Bảo vệ quyền riêng tư: ẩn vị trí chính xác và số điện thoại mặc định.</p>
              <a href="/ket-noi" class="wb-btn wb-btn-primary" data-nav="/ket-noi">Tìm bạn thực hành</a>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🌐 Cộng đồng, CLB, Đội & Nhóm</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Đăng bài theo ngôn ngữ, chia sẻ học liệu, tạo thử thách duy trì thói quen và lên lịch sinh hoạt nội bộ ngay trong nhóm.</p>
              <a href="/cong-dong" class="wb-btn wb-btn-primary" data-nav="/cong-dong">Vào Cộng đồng</a>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🏛️ Không gian Quản trị Tổ chức</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Hỗ trợ 02 loại biểu mẫu đăng ký (Chưa có pháp nhân & Có pháp nhân độc lập), cấp tài khoản thành viên và báo cáo tiến độ đơn vị.</p>
              <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-accent" data-nav="/dang-ky-to-chuc">Đăng ký Tổ chức</a>
            </div>
          </div>
        </section>

        <!-- 10 & 11. Dịch vụ & Hệ Thống Khảo Thí WORD BRIDGE -->
        <section class="wb-section">
          <div class="wb-grid-2">
            <div class="wb-card">
              <span class="wb-badge wb-badge-teal">MÔ HÌNH DỊCH VỤ & HỖ TRỢ CỘNG ĐỒNG</span>
              <h3 style="margin:10px 0 8px 0;color:var(--wb-deep-teal);">Gói Thành viên Minh bạch & Chính sách Hỗ trợ</h3>
              <ul style="font-size:13.5px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 16px 0;">
                ${plans.map(p => `<li><strong>${p.name}:</strong> ${Number(p.price_vnd).toLocaleString('vi-VN')} đồng</li>`).join('')}
                <li><strong>Chính sách hỗ trợ:</strong> Tổ chức phi lợi nhuận (-30%), Community Access (03 tháng), Sinh viên (Miễn phí 03 tháng qua email trường cấp), Hoàn cảnh khó khăn (Miễn phí 12 tháng).</li>
              </ul>
              <a href="/goi-dich-vu" class="wb-btn wb-btn-primary" data-nav="/goi-dich-vu">Xem Bảng giá & Hỗ trợ</a>
            </div>
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">PHÂN HỆ KHẢO THÍ TÍCH HỢP (/khao-thi)</span>
              <h3 style="margin:10px 0 8px 0;color:var(--wb-deep-teal);">HỆ THỐNG KHẢO THÍ WORD BRIDGE</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
                Tổ chức kỳ thi đánh giá năng lực trực tuyến ngay trên <strong>https://wordbridge.io.vn/khao-thi</strong> với ngân hàng câu hỏi 8 dạng, đồng hồ máy chủ, tự động lưu bài làm, bảo vệ liêm chính khảo thí và quy trình phúc khảo minh bạch.
              </p>
              <a href="/khao-thi" class="wb-btn wb-btn-accent" data-nav="/khao-thi">Vào Hệ Thống Khảo Thí</a>
            </div>
          </div>
        </section>

        <!-- 12, 13, 14. Hướng dẫn bắt đầu, FAQ & CTA đăng ký -->
        <section class="wb-section">
          <div class="wb-grid-2">
            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">🚀 Hướng dẫn Bắt đầu trong 03 Bước</h3>
              <ol style="font-size:14px;color:var(--wb-text-muted);padding-left:18px;margin:0;">
                <li style="margin-bottom:8px;"><strong>Bước 1:</strong> Đăng ký tài khoản cá nhân (nhận ngay 07 ngày dùng thử Personal Plus) hoặc gửi hồ sơ đăng ký Tổ chức/CLB.</li>
                <li style="margin-bottom:8px;"><strong>Bước 2:</strong> Chọn 1 trong 5 ngôn ngữ và hoàn thành bài thực hành Nghe điền từ, Từ vựng, Sắp xếp câu hoặc Đọc hiểu.</li>
                <li><strong>Bước 3:</strong> Xem thống kê tại mục Theo dõi tiến độ, kết nối bạn tập cùng khung giờ và tham gia nhóm cộng đồng.</li>
              </ol>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">❓ Câu hỏi Thường gặp (FAQ)</h3>
              <div style="font-size:13.5px;color:var(--wb-text-muted);">
                <p style="margin:0 0 8px 0;"><strong>1. WORD BRIDGE có phải website bán khóa học video (LMS) không?</strong><br/>Không. WORD BRIDGE là nền tảng tự thực hành ngoại ngữ sống và kết nối cộng đồng, không bán khóa học video quay sẵn hay dịch vụ gia sư.</p>
                <p style="margin:0;"><strong>2. Khi hết hạn dùng thử hoặc hạ về gói Miễn phí thì lịch sử học tập có bị mất không?</strong><br/>Không. Toàn bộ lịch sử thực hành và bộ từ vựng cá nhân của bạn được giữ nguyên 100%.</p>
              </div>
            </div>
          </div>
        </section>
      </div>
    `;
  });

  // GIỚI THIỆU & KHÁM PHÁ (/gioi-thieu, /kham-pha)
  const renderAboutAndExplore = async function (root, pathname) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card">
          <span class="wb-badge wb-badge-teal">ĐỀ ÁN KHỞI NGHIỆP WORD BRIDGE (2026–2027)</span>
          <h1 style="color:var(--wb-deep-teal);margin:10px 0;">${pathname === '/gioi-thieu' ? 'Giới thiệu Nền tảng WORD BRIDGE' : 'Khám phá Hệ sinh thái Ngoại ngữ WORD BRIDGE'}</h1>
          <p><strong>Slogan:</strong> Where Languages Bring People Together.</p>
          <p><strong>Đơn vị thực hiện đề án:</strong> Nhóm sinh viên Bùi Tấn Lộc (Trưởng nhóm – Thiết kế kỹ thuật, lập trình, kiểm thử, bảo mật & hạ tầng), Cao Anh Nhựt (Kế hoạch & kiểm soát tiến độ), Võ Gia Như (Khảo sát khách hàng, truyền thông & chăm sóc người dùng) – Trường Cao đẳng nghề Việt Nam - Singapore.</p>
          <p>WORD BRIDGE giải quyết sự phân mảnh trong hành trình tự rèn luyện ngoại ngữ bằng cách hợp nhất 04 công cụ thực hành cốt lõi (Nghe điền từ, Từ vựng, Sắp xếp câu, Đọc hiểu), Trợ lý AI hỗ trợ ngữ cảnh, bộ lọc tìm bạn đồng hành, không gian vận hành CLB/Tổ chức và Hệ Thống Khảo Thí trên một tên miền duy nhất <strong>https://wordbridge.io.vn</strong>.</p>
          <div style="display:flex;gap:12px;margin-top:18px;flex-wrap:wrap;">
            <a href="/ngon-ngu" class="wb-btn wb-btn-primary" data-nav="/ngon-ngu">Khám phá 05 Ngôn ngữ</a>
            <a href="/hoc-tap" class="wb-btn wb-btn-accent" data-nav="/hoc-tap">Vào Trung tâm Học tập</a>
            <a href="/cong-dong/to-chuc" class="wb-btn wb-btn-outline" data-nav="/cong-dong/to-chuc">Khám phá Tổ chức</a>
          </div>
        </div>
      </div>
    `;
  };
  WB.registerView('/gioi-thieu', renderAboutAndExplore);
  WB.registerView('/kham-pha', renderAboutAndExplore);

  // ĐĂNG NHẬP (/dang-nhap - PHẦN 07.2, sát thiết kế trang 27 của 42.pdf, không có Zalo)
  WB.registerView('/dang-nhap', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-grid-2" style="align-items:center;">
          <div>
            <img src="/assets/logo-light.svg" alt="WORD BRIDGE" style="height:54px;margin-bottom:14px;" />
            <h1 style="color:var(--wb-deep-teal);margin:0 0 12px 0;">Kết nối – Học tập – Đồng hành cùng cộng đồng đa ngôn ngữ</h1>
            <p style="color:var(--wb-text-muted);">Một tài khoản duy nhất sử dụng xuyên suốt toàn bộ hệ sinh thái WORD BRIDGE trên <strong>https://wordbridge.io.vn</strong>. Đăng nhập thành công không chuyển hướng sang bất kỳ tên miền phụ nào khác.</p>
            <img src="/assets/hero-globe-illustration.svg" alt="WORD BRIDGE" style="width:100%;max-width:460px;border-radius:14px;margin-top:12px;" />
          </div>
          <div class="wb-card">
            <h2 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">Đăng nhập WORD BRIDGE</h2>
            <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 18px 0;">Chào mừng bạn trở lại với WORD BRIDGE!</p>
            <form id="wbLoginForm">
              <div class="wb-form-group">
                <label class="wb-label">Email hoặc Tên người dùng <span class="req">*</span></label>
                <input type="text" class="wb-input" name="email" required placeholder="Nhập email hoặc username" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mật khẩu <span class="req">*</span></label>
                <input type="password" class="wb-input" name="password" required placeholder="Nhập mật khẩu (>= 15 ký tự)" />
              </div>
              <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">→ Đăng nhập</button>
            </form>

            <div style="margin:18px 0;text-align:center;font-size:13px;color:var(--wb-text-muted);">
              Hoặc liên kết đăng nhập nhanh (Yêu cầu xác minh chính chủ trước khi gộp hồ sơ):
            </div>
            <div class="wb-grid-4">
              <button type="button" class="wb-btn wb-btn-outline wb-oauth-btn" data-provider="google">Google</button>
              <button type="button" class="wb-btn wb-btn-outline wb-oauth-btn" data-provider="facebook">Facebook</button>
              <button type="button" class="wb-btn wb-btn-outline wb-oauth-btn" data-provider="microsoft">Microsoft</button>
              <button type="button" class="wb-btn wb-btn-outline wb-oauth-btn" data-provider="apple">Apple</button>
            </div>
            <div style="margin-top:16px;text-align:center;font-size:13.5px;">
              Chưa có tài khoản? <a href="/dang-ky" data-nav="/dang-ky"><strong>Đăng ký cá nhân ngay</strong></a> |
              <a href="/dang-ky-to-chuc" data-nav="/dang-ky-to-chuc"><strong>Đăng ký Tổ chức</strong></a>
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
        WB.setSession(res.user, res.session.token);
        WB.toast('Đăng nhập thành công!');
        WB.navigate('/hoc-tap');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-oauth-btn').forEach(btn => {
      btn.onclick = () => {
        const prov = btn.getAttribute('data-provider');
        WB.toast(`Phương thức ${prov.toUpperCase()}: Theo quy tắc bảo mật PHẦN 07.2, tài khoản liên kết phải được xác minh chính chủ sau khi đăng nhập để tránh tự động gộp nhầm hồ sơ.`);
      };
    });
  });

  // ĐĂNG KÝ CÁ NHÂN (/dang-ky - PHẦN 07.1 & 07.3: Mật khẩu >= 15 ký tự, 1 chữ hoa, 3 ký tự đặc biệt, SĐT bắt buộc)
  WB.registerView('/dang-ky', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="max-width:760px;margin:0 auto;">
          <span class="wb-badge wb-badge-teal">TÀI KHOẢN DÙNG CHUNG TOÀN HỆ THỐNG</span>
          <h1 style="color:var(--wb-deep-teal);margin:8px 0 6px 0;">Đăng ký Tài khoản Cá nhân WORD BRIDGE</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 18px 0;">
            Tặng ngay <strong>07 ngày dùng thử miễn phí gói Personal Plus</strong> cho tài khoản cá nhân mới. Hết thời gian dùng thử tự động chuyển về gói Free (0đ) và giữ nguyên lịch sử thực hành.
          </p>
          <form id="wbRegisterForm">
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Họ và tên <span class="req">*</span></label>
                <input type="text" class="wb-input" name="full_name" required placeholder="Ví dụ: Nguyễn Minh Anh" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Tên người dùng (Username)</label>
                <input type="text" class="wb-input" name="username" placeholder="Ví dụ: minhanh_wb" />
              </div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Địa chỉ Email <span class="req">*</span></label>
                <input type="email" class="wb-input" name="email" required placeholder="email@domain.com" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Số điện thoại di động (Bắt buộc) <span class="req">*</span></label>
                <input type="tel" class="wb-input" name="phone" required placeholder="09xxxxxxxx" />
              </div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Mật khẩu (>= 15 ký tự, >= 1 chữ hoa, >= 3 ký tự đặc biệt) <span class="req">*</span></label>
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
                Tôi đồng ý với <a href="/phap-ly" data-nav="/phap-ly">Điều khoản sử dụng và Quy chế cộng đồng</a> của WORD BRIDGE.
              </label>
            </div>
            <div class="wb-form-group">
              <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;">
                <input type="checkbox" name="accept_privacy" required />
                Tôi đồng ý với <a href="/phap-ly" data-nav="/phap-ly">Chính sách bảo vệ dữ liệu cá nhân</a> của WORD BRIDGE.
              </label>
            </div>
            <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Hoàn tất Đăng ký Tài khoản Cá nhân</button>
          </form>
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
        strengthEl.textContent = `Cần tối thiểu 15 ký tự (hiện ${val.length}), >=1 chữ hoa (${hasUpper ? 'Đạt' : 'Chưa'}), >=3 ký tự đặc biệt (hiện ${specials})`;
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
        WB.setSession(res.user, res.session.token);
        WB.toast('Đăng ký tài khoản thành công! Đã kích hoạt 07 ngày dùng thử Personal Plus.', 'success');
        WB.navigate('/ho-so');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });

  // HỒ SƠ CÁ NHÂN, THÔNG BÁO & CÀI ĐẶT (/ho-so, /thong-bao, /cai-dat - PHẦN 07.5 & 07.6)
  const renderProfileAndSettings = async function (root, pathname) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập để xem Hồ sơ & Cài đặt.');
      return WB.navigate('/dang-nhap');
    }
    const data = await WB.api('/api/profile');
    const u = data.profile;
    const mySpace = data.my_space || { organizations: [], groups: [], applications: [] };

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/ho-so' ? 'active' : ''}" data-nav="/ho-so">👤 Hồ sơ cá nhân</a></li>
              <li><a class="wb-sidebar-link" data-nav="/tien-do">📊 Tiến độ & Kết quả</a></li>
              <li><a class="wb-sidebar-link" data-nav="/khong-gian-cua-toi">🏛️ Tổ chức & Cộng đồng của tôi</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/thong-bao' ? 'active' : ''}" data-nav="/thong-bao">🔔 Thông báo</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cai-dat' ? 'active' : ''}" data-nav="/cai-dat">🔒 Bảo mật & Cài đặt</a></li>
            </ul>
          </aside>
          <div>
            <div class="wb-card" style="margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <span class="wb-badge wb-badge-teal">Gói hiện tại: ${u.plan_code}</span>
                  <h1 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">${u.full_name} (@${u.username})</h1>
                  <div style="font-size:13.5px;color:var(--wb-text-muted);">Email: ${u.email} • SĐT định danh: ${u.phone} (Luôn ẩn công khai mặc định)</div>
                </div>
                <button type="button" class="wb-btn wb-btn-outline" id="wbRevokeOtherSessionsBtn">Đăng xuất thiết bị khác</button>
              </div>
            </div>

            <div class="wb-grid-2">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Cập nhật Hồ sơ & Quyền riêng tư</h3>
                <form id="wbProfileUpdateForm">
                  <div class="wb-form-group">
                    <label class="wb-label">Họ và tên</label>
                    <input type="text" class="wb-input" name="full_name" value="${u.full_name}" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Giới thiệu bản thân</label>
                    <textarea class="wb-textarea" name="bio" rows="2">${u.bio || ''}</textarea>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Trình độ hiện tại</label>
                    <input type="text" class="wb-input" name="proficiency_level" value="${u.proficiency_level}" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Mục tiêu học tập</label>
                    <input type="text" class="wb-input" name="learning_goals" value="${u.learning_goals}" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Khung giờ rảnh luyện tập</label>
                    <input type="text" class="wb-input" name="available_hours" value="${u.available_hours}" />
                  </div>
                  <button type="submit" class="wb-btn wb-btn-primary">Lưu cập nhật Hồ sơ</button>
                </form>
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đổi Mật khẩu An toàn (>= 15 ký tự)</h3>
                <form id="wbChangePasswordForm">
                  <div class="wb-form-group">
                    <label class="wb-label">Mật khẩu hiện tại</label>
                    <input type="password" class="wb-input" name="current_password" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Mật khẩu mới (>= 15 ký tự, >=1 chữ hoa, >=3 ký tự đặc biệt)</label>
                    <input type="password" class="wb-input" name="new_password" required />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Xác nhận mật khẩu mới</label>
                    <input type="password" class="wb-input" name="confirm_password" required />
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Cập nhật Mật khẩu</button>
                </form>

                <hr style="margin:20px 0;border:none;border-top:1px solid var(--wb-border);" />
                <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Tổ chức và Cộng đồng của tôi (${mySpace.organizations.length} đơn vị, ${mySpace.groups.length} nhóm)</h4>
                <a href="/khong-gian-cua-toi" class="wb-btn wb-btn-outline" data-nav="/khong-gian-cua-toi">Mở Không gian của tôi →</a>
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

    document.getElementById('wbRevokeOtherSessionsBtn').onclick = async () => {
      try {
        await WB.api('/api/auth/sessions/revoke-others', { method: 'POST', body: {} });
        WB.toast('Đã đăng xuất toàn bộ các thiết bị khác!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  };

  WB.registerView('/ho-so', renderProfileAndSettings);
  WB.registerView('/thong-bao', renderProfileAndSettings);
  WB.registerView('/cai-dat', renderProfileAndSettings);

  // TRUNG TÂM TRỢ GIÚP & CSKH (/ho-tro - PHẦN 23, liên kết cskh@wordbridge.io.vn)
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
          <span class="wb-badge wb-badge-teal">TRUNG TÂM TRỢ GIÚP & CHĂM SÓC KHÁCH HÀNG (/ho-tro)</span>
          <h1 style="margin:8px 0;color:var(--wb-deep-teal);">Hỗ trợ & Giải đáp Thắc mắc WORD BRIDGE</h1>
          <p style="font-size:14px;color:var(--wb-text-muted);margin:0;">
            Email Chăm sóc khách hàng chuyên trách: <strong>cskh@wordbridge.io.vn</strong> | Liên hệ chính thức: <strong>wordbridge.education@gmail.com</strong> | Hợp tác & truyền thông: <strong>contact@wordbridge.io.vn</strong>
          </p>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Gửi Yêu cầu Hỗ trợ (Ticket CSKH)</h3>
            ${WB.state.user ? `
              <form id="wbSupportTicketForm">
                <div class="wb-form-group">
                  <label class="wb-label">Loại vấn đề cần hỗ trợ <span class="req">*</span></label>
                  <select class="wb-select" name="category" required>
                    <option value="account">Hỗ trợ Tài khoản & Đăng nhập</option>
                    <option value="learning">Hỗ trợ Học tập & 4 Công cụ thực hành</option>
                    <option value="community">Hỗ trợ Cộng đồng & Bạn bè</option>
                    <option value="organization">Hỗ trợ Hồ sơ Tổ chức & Thành viên</option>
                    <option value="payment">Hỗ trợ Thanh toán, Giao dịch & Gói dịch vụ</option>
                    <option value="exam">Hỗ trợ Hệ Thống Khảo Thí (/khao-thi)</option>
                    <option value="security">Báo cáo Bảo mật & Quyền riêng tư</option>
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
                <button type="submit" class="wb-btn wb-btn-primary">Gửi Phiếu Hỗ trợ tới cskh@wordbridge.io.vn</button>
              </form>
            ` : `<p>Vui lòng <a href="/dang-nhap" data-nav="/dang-nhap"><strong>Đăng nhập</strong></a> để tạo và theo dõi phiếu hỗ trợ cá nhân (Bảo mật phiếu hỗ trợ theo quyền).</p>`}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh sách Phiếu Hỗ trợ của tôi (${tickets.length})</h3>
            ${tickets.length === 0 ? `<p style="color:var(--wb-text-muted);font-size:13.5px;">Chưa có phiếu hỗ trợ nào.</p>` : `
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Mã Ticket</th><th>Chủ đề</th><th>Trạng thái</th></tr>
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
          WB.toast('Đã tạo phiếu hỗ trợ thành công!', 'success');
          WB.navigate('/ho-tro', false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  });

  // CHÍNH SÁCH, ĐIỀU KHOẢN & BẢO VỆ NGƯỜI CHƯA THÀNH NIÊN (/phap-ly - PHẦN 28)
  WB.registerView('/phap-ly', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card">
          <span class="wb-badge wb-badge-teal">HỆ THỐNG QUY CHẾ, PHÁP LÝ & AN TOÀN CỘNG ĐỒNG (PHẦN 28)</span>
          <h1 style="color:var(--wb-deep-teal);margin:10px 0;">Điều khoản Dịch vụ, Chính sách Quyền riêng tư & Bảo vệ Trẻ em</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);">
            Lưu ý minh bạch: Các văn bản quy chế dưới đây được thiết lập phục vụ vận hành hệ sinh thái WORD BRIDGE và tuân thủ quy định pháp luật hiện hành (Nghị định 147/2024/NĐ-CP, Luật Bảo vệ dữ liệu cá nhân 91/2025/QH15, Luật Thương mại điện tử 122/2025/QH15); không tự tuyên bố đã được cơ quan nhà nước phê duyệt chuyên môn khi đang trong giai đoạn hoàn thiện thủ tục.
          </p>
          <div class="wb-grid-2" style="margin-top:18px;">
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">1. Bảo vệ Dữ liệu Cá nhân & Quyền riêng tư</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Thu thập dữ liệu ở mức tối thiểu đúng mục đích học tập và kết nối; tách biệt đồng ý thiết yếu với đồng ý tùy chọn; cam kết tuyệt đối không mua bán dữ liệu cá nhân người dùng.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">2. Bảo vệ Người chưa thành niên & Học sinh</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Mặc định ẩn vị trí chính xác và số điện thoại; không tự động mở chat từ người lạ khi chưa có sự đồng thuận kết bạn; tích hợp nút Chặn và Báo cáo vi phạm ở mọi bài đăng và hồ sơ.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">3. Chính sách Thanh toán, Gia hạn & Hoàn tiền</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Công khai rõ giá gói dịch vụ; không tự động gia hạn nếu khách hàng chưa đồng ý; giữ nguyên lịch sử học tập khi hạ về gói Miễn phí; hoàn tiền minh bạch qua đối soát.</p>
            </div>
            <div class="wb-card">
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">4. Chính sách Bản quyền & Quy trình Xử lý Khiếu nại</h3>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">Tôn trọng quyền sở hữu trí tuệ đối với học liệu tải lên; tiếp nhận và xử lý báo cáo vi phạm bản quyền có lưu nhật ký kiểm duyệt đầy đủ.</p>
            </div>
          </div>
        </div>
      </div>
    `;
  });
})(window.WB);
