'use strict';

(function (WB) {
  // KẾT NỐI BẠN HỌC, BẠN BÈ & CHAT (/ket-noi, /ban-be, /tin-nhan - PHẦN 11 & 12)
  const renderConnectionsAndChat = async function (root, pathname) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập để sử dụng tính năng Tìm bạn thực hành, Bạn bè và Chat.');
      return WB.navigate('/dang-nhap');
    }
    let partners = [];
    try {
      const res = await WB.api('/api/connections/search');
      partners = res.partners || [];
    } catch (_) {}

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">KẾT NỐI & TIN NHẮN</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/ket-noi' ? 'active' : ''}" data-nav="/ket-noi">🤝 Tìm bạn thực hành</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/ban-be' ? 'active' : ''}" data-nav="/ban-be">👥 Quản lý Bạn bè</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/tin-nhan' ? 'active' : ''}" data-nav="/tin-nhan">💬 Chat & Nhắn tin</a></li>
              <li><a class="wb-sidebar-link" data-nav="/cong-dong">🌐 Bảng tin Cộng đồng</a></li>
            </ul>
          </aside>

          <div>
            <div class="wb-card" style="margin-bottom:18px;">
              <span class="wb-badge wb-badge-teal">CONNECT – KẾT NỐI ĐỒNG THUẬN 02 BÊN</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">
                ${pathname === '/tin-nhan' ? 'Chat Cá nhân & Thảo luận Nhóm' : pathname === '/ban-be' ? 'Hệ thống Quản lý Bạn bè' : 'Tìm Bạn Thực hành Ngoại ngữ'}
              </h1>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
                Quy tắc an toàn: Hệ thống ẩn vị trí chính xác và số điện thoại. Việc kết nối và mở trò chuyện riêng tư chỉ thực hiện sau khi cả hai bên đồng ý lời mời kết bạn (Không có nút gọi video giả).
              </p>
            </div>

            <div class="wb-grid-2">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh sách Gợi ý Bạn Học Đồng hành (${partners.length})</h3>
                ${partners.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Hiện chưa có người dùng khác trùng bộ lọc. Hãy mời bạn bè cùng tham gia!</p>` : `
                  ${partners.map(p => `
                    <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;display:flex;justify-content:space-between;align-items:center;">
                      <div>
                        <strong>${p.full_name} (@${p.username})</strong>
                        <div style="font-size:12.5px;color:var(--wb-text-muted);">Ngôn ngữ: ${(p.learning_languages || []).join(', ')} • Trình độ: ${p.proficiency_level} • Khung giờ: ${p.available_hours}</div>
                      </div>
                      <button type="button" class="wb-btn wb-btn-primary wb-send-friend-btn" data-id="${p.id}">+ Kết bạn</button>
                    </div>
                  `).join('')}
                `}
              </div>

              <div class="wb-card wb-chat-composer">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Tạo Nhóm Thảo luận Ngoại ngữ</h3>
                <form id="wbCreateChatGroupForm">
                  <div class="wb-form-group">
                    <label class="wb-label">Tên nhóm thảo luận <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="title" required placeholder="VD: Nhóm luyện phản xạ Tiếng Anh B1 tối 20h" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Chủ đề rèn luyện</label>
                    <input type="text" class="wb-input" name="topic" placeholder="VD: Luyện từ vựng & sắp xếp câu theo chủ đề" />
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Tạo Nhóm Chat</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-send-friend-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/friends/request', {
            method: 'POST',
            body: { addressee_id: btn.getAttribute('data-id'), match_note: 'Cùng luyện tập ngoại ngữ trên WORD BRIDGE!' }
          });
          WB.toast('Đã gửi lời mời kết bạn! Trò chuyện riêng sẽ mở sau khi bạn học đồng ý.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    const grpForm = document.getElementById('wbCreateChatGroupForm');
    if (grpForm) {
      grpForm.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(grpForm);
        try {
          await WB.api('/api/chat/groups', { method: 'POST', body: Object.fromEntries(fd.entries()) });
          grpForm.reset();
          WB.toast('Đã tạo nhóm thảo luận thành công!', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  };

  WB.registerView('/ket-noi', renderConnectionsAndChat);
  WB.registerView('/ban-be', renderConnectionsAndChat);
  WB.registerView('/tin-nhan', renderConnectionsAndChat);

  // CỘNG ĐỒNG, CLB, ĐỘI, NHÓM (/cong-dong, /cong-dong/clb, /cong-dong/doi, /cong-dong/nhom - PHẦN 13)
  const renderCommunityHub = async function (root, pathname) {
    const res = await WB.api('/api/community/posts');
    const posts = res.posts || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">KHÔNG GIAN CỘNG ĐỒNG</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong' ? 'active' : ''}" data-nav="/cong-dong">📰 Bảng tin Ngoại ngữ</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/clb' ? 'active' : ''}" data-nav="/cong-dong/clb">🏛️ Câu lạc bộ (CLB)</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/doi' ? 'active' : ''}" data-nav="/cong-dong/doi">🚩 Đội chuyên môn</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/nhom' ? 'active' : ''}" data-nav="/cong-dong/nhom">👥 Nhóm thực hành</a></li>
              <li><a class="wb-sidebar-link" data-nav="/cong-dong/to-chuc">🏢 Khám phá Tổ chức</a></li>
            </ul>
          </aside>

          <div>
            <div class="wb-card" style="margin-bottom:18px;">
              <span class="wb-badge wb-badge-teal">COMMUNITY – CỘNG ĐỒNG NGOẠI NGỮ TRỌNG TÂM</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Cộng đồng WORD BRIDGE & Hoạt động Nhóm Nội bộ</h1>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
                Chia sẻ bài viết theo ngôn ngữ, tạo Nhóm/CLB/Đội, thiết lập Thử thách duy trì thói quen và Lịch sinh hoạt nội bộ (Không tách thành trang Sự kiện độc lập).
              </p>
            </div>

            <div class="wb-grid-2" style="margin-bottom:20px;">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đăng Bài viết Ngoại ngữ Mới</h3>
                <form id="wbCreatePostForm">
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Ngôn ngữ</label>
                      <select class="wb-select" name="language_code">
                        <option value="en">Tiếng Anh</option>
                        <option value="zh">Tiếng Trung</option>
                        <option value="ko">Tiếng Hàn</option>
                        <option value="ja">Tiếng Nhật</option>
                        <option value="ru">Tiếng Nga</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Nhóm chủ đề</label>
                      <input type="text" class="wb-input" name="topic_tag" value="Kinh nghiệm thực hành" />
                    </div>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Tiêu đề bài viết <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="title" required placeholder="Nhập tiêu đề bài chia sẻ..." />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Nội dung <span class="req">*</span></label>
                    <textarea class="wb-textarea" name="content" rows="3" required placeholder="Chia sẻ phương pháp rèn luyện từ vựng, nghe hiểu..."></textarea>
                  </div>
                  <button type="submit" class="wb-btn wb-btn-primary">Đăng Bài lên Bảng tin</button>
                </form>
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Tạo Nhóm / CLB / Đội & Thử thách Nội bộ</h3>
                <form id="wbCreateCommunityGroupForm">
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Phân loại</label>
                      <select class="wb-select" name="group_category">
                        <option value="clb">Câu lạc bộ (CLB)</option>
                        <option value="doi">Đội</option>
                        <option value="nhom">Nhóm học tập</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Ngôn ngữ trọng tâm</label>
                      <select class="wb-select" name="language_code">
                        <option value="en">Tiếng Anh</option>
                        <option value="zh">Tiếng Trung</option>
                        <option value="ko">Tiếng Hàn</option>
                        <option value="ja">Tiếng Nhật</option>
                        <option value="ru">Tiếng Nga</option>
                      </select>
                    </div>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Tên CLB / Đội / Nhóm <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="name" required placeholder="VD: CLB Thực hành Tiếng Trung HSK" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Mô tả & Lịch sinh hoạt nội bộ</label>
                    <textarea class="wb-textarea" name="description" rows="2" placeholder="Mô tả mục tiêu và lịch sinh hoạt hàng tuần của nhóm..."></textarea>
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Khởi tạo Không gian Nhóm</button>
                </form>
              </div>
            </div>

            <div class="wb-card">
              <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Bảng tin Thảo luận Cộng đồng (${posts.length})</h3>
              ${posts.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Chưa có bài đăng nào. Hãy là người đầu tiên chia sẻ kinh nghiệm thực hành ngoại ngữ!</p>` : `
                ${posts.map(p => `
                  <div style="padding:14px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:12px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;">
                      <span class="wb-badge wb-badge-teal">${p.language_code.toUpperCase()} • ${p.topic_tag}</span>
                      <span style="font-size:12px;color:var(--wb-text-muted);">Tác giả: ${p.author_name || 'Thành viên'} • ${p.created_at.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <h4 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">${p.title}</h4>
                    <p style="margin:0;font-size:14px;">${p.content}</p>
                  </div>
                `).join('')}
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbCreatePostForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) return WB.navigate('/dang-nhap');
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/community/posts', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã đăng bài viết lên Bảng tin cộng đồng!', 'success');
        renderCommunityHub(root, pathname);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbCreateCommunityGroupForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) return WB.navigate('/dang-nhap');
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/community/groups', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        e.target.reset();
        WB.toast('Đã tạo không gian Nhóm / CLB / Đội thành công!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  };

  WB.registerView('/cong-dong', renderCommunityHub);
  WB.registerView('/cong-dong/clb', renderCommunityHub);
  WB.registerView('/cong-dong/doi', renderCommunityHub);
  WB.registerView('/cong-dong/nhom', renderCommunityHub);

  // KHÁM PHÁ TỔ CHỨC, KHÔNG GIAN CỦA TÔI & QUẢN LÝ TỔ CHỨC (/cong-dong/to-chuc, /khong-gian-cua-toi, /to-chuc - PHẦN 14)
  const renderOrganizationWorkspace = async function (root, pathname) {
    let mySpace = { organizations: [], groups: [], applications: [] };
    if (WB.state.user) {
      try {
        const prof = await WB.api('/api/profile');
        mySpace = prof.my_space || mySpace;
      } catch (_) {}
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span class="wb-badge wb-badge-teal">HỆ THỐNG TỔ CHỨC, CÂU LẠC BỘ, ĐỘI & NHÓM (PHẦN 14)</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">
                ${pathname === '/khong-gian-cua-toi' ? 'Tổ chức và Cộng đồng của tôi' : pathname === '/to-chuc' ? 'Không gian Quản lý Tổ chức' : 'Khám phá Tổ chức & Đơn vị trên WORD BRIDGE'}
              </h1>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">
                Mỗi tổ chức được phê duyệt có không gian quản trị riêng, cấp tài khoản thành viên và cô lập dữ liệu hoàn toàn giữa các đơn vị.
              </p>
            </div>
            <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-accent" data-nav="/dang-ky-to-chuc">+ Đăng ký Tổ chức Mới (Loại 1 & Loại 2)</a>
          </div>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đơn vị & Tổ chức của tôi (${mySpace.organizations.length})</h3>
            ${mySpace.organizations.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Bạn chưa thuộc đơn vị nào hoặc hồ sơ đang chờ phê duyệt.</p>` : `
              ${mySpace.organizations.map(o => `
                <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;">
                  <span class="wb-badge wb-badge-teal">${o.org_code} • ${o.unit_category}</span>
                  <h4 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">${o.org_name} (${o.short_name})</h4>
                  <div style="font-size:13px;color:var(--wb-text-muted);">Vai trò: <strong>${o.org_role}</strong> • Chức vụ: <strong>${o.title}</strong></div>
                </div>
              `).join('')}
            `}

            <h3 style="margin:18px 0 12px 0;color:var(--wb-deep-teal);">Trạng thái Hồ sơ Đăng ký Tổ chức (${mySpace.applications.length})</h3>
            ${mySpace.applications.map(a => `
              <div style="padding:10px;background:var(--wb-bg-soft);border-radius:8px;margin-bottom:8px;font-size:13.5px;">
                <strong>Mã hồ sơ: ${a.application_code}</strong> (Biểu mẫu Loại ${a.form_type}) —
                <span class="wb-badge wb-badge-ivory">${a.status}</span>
                ${a.review_note ? `<div style="margin-top:4px;color:var(--wb-text-muted);">Ghi chú xét duyệt: ${a.review_note}</div>` : ''}
              </div>
            `).join('')}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Cấp Tài khoản Thành viên Tổ chức (Dành cho Đơn vị đã phê duyệt)</h3>
            <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 12px 0;">
              Tài khoản thành viên chỉ được truy cập dữ liệu của đơn vị mình, tuyệt đối không được mặc định cấp quyền quản trị nền tảng.
            </p>
            <form id="wbCreateOrgMemberForm">
              <div class="wb-form-group">
                <label class="wb-label">Chọn Tổ chức đã phê duyệt <span class="req">*</span></label>
                <select class="wb-select" name="org_id" required>
                  <option value="">-- Chọn đơn vị của bạn --</option>
                  ${mySpace.organizations.map(o => `<option value="${o.org_id}">${o.org_name} (${o.short_name})</option>`).join('')}
                </select>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Họ tên thành viên <span class="req">*</span></label>
                  <input type="text" class="wb-input" name="full_name" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Chức vụ trong đơn vị</label>
                  <input type="text" class="wb-input" name="title" value="Thành viên Ban điều hành" />
                </div>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Email đăng nhập <span class="req">*</span></label>
                  <input type="email" class="wb-input" name="email" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Mật khẩu khởi tạo (>=15 ký tự) <span class="req">*</span></label>
                  <input type="password" class="wb-input" name="password" required />
                </div>
              </div>
              <button type="submit" class="wb-btn wb-btn-primary">Tạo & Cấp quyền Tài khoản Thành viên</button>
            </form>
          </div>
        </div>
      </div>
    `;

    const memForm = document.getElementById('wbCreateOrgMemberForm');
    if (memForm) {
      memForm.onsubmit = async e => {
        e.preventDefault();
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        const fd = new FormData(memForm);
        try {
          await WB.api('/api/organizations/members', { method: 'POST', body: Object.fromEntries(fd.entries()) });
          memForm.reset();
          WB.toast('Đã cấp tài khoản thành viên tổ chức thành công!', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  };

  WB.registerView('/cong-dong/to-chuc', renderOrganizationWorkspace);
  WB.registerView('/khong-gian-cua-toi', renderOrganizationWorkspace);
  WB.registerView('/to-chuc', renderOrganizationWorkspace);

  // HỆ THỐNG ĐĂNG KÝ TỔ CHỨC 2 LOẠI – ĐÚNG 3 MỤC I, II, III (/dang-ky-to-chuc - PHẦN 15)
  WB.registerView('/dang-ky-to-chuc', async function (root) {
    const catRes = await WB.api('/api/organizations/catalog');
    const catalog = catRes.catalog;
    const provinces = catalog.provinces || [];
    const fields = catalog.approved_activity_fields || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">HỆ THỐNG ĐĂNG KÝ TỔ CHỨC & XÉT DUYỆT (PHẦN 15)</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Đăng ký Tổ chức / Đơn vị trên WORD BRIDGE</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
            Hỗ trợ đúng 02 loại biểu mẫu đăng ký. Mỗi biểu mẫu gồm đúng <strong>03 mục chính: I. THÔNG TIN TỔ CHỨC – II. THÔNG TIN NGƯỜI ĐẠI DIỆN – III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ</strong>, áp dụng dữ liệu hành chính 34 tỉnh/thành phố Việt Nam hiện hành (Không có trường Quốc gia) và chữ ký xác nhận 3 phương thức.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button type="button" class="wb-btn wb-btn-primary" id="wbOrgType1Btn">Loại 1: Tổ chức chưa có tư cách pháp nhân độc lập (CLB, Đội, Nhóm...)</button>
            <button type="button" class="wb-btn wb-btn-outline" id="wbOrgType2Btn">Loại 2: Tổ chức có tư cách pháp nhân độc lập (Trường học, Doanh nghiệp...)</button>
          </div>
        </div>

        <form id="wbOrgApplicationForm" class="wb-card">
          <input type="hidden" name="form_type" id="wbOrgFormType" value="1" />

          <!-- MỤC I. THÔNG TIN TỔ CHỨC -->
          <div style="border-bottom:2px solid var(--wb-border);padding-bottom:18px;margin-bottom:22px;">
            <span class="wb-badge wb-badge-red">MỤC I</span>
            <h2 style="margin:8px 0 14px 0;color:var(--wb-deep-teal);">I. THÔNG TIN TỔ CHỨC</h2>

            <!-- Khu vực tra cứu mã số pháp nhân dành riêng cho Loại 2 (PHẦN 15.2) -->
            <div id="wbType2LegalLookupBox" style="display:none;background:var(--wb-bg-mint);padding:16px;border-radius:12px;margin-bottom:18px;border:1px solid var(--wb-light-teal);">
              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">🔍 Tra cứu Mã số doanh nghiệp / Mã số tổ chức / Mã số pháp lý (Biểu mẫu Loại 2)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input type="text" class="wb-input" id="wbLegalCodeInput" style="flex:1;" placeholder="Nhập 1 trường mã số duy nhất (VD: 0303460456 hoặc 3700589124 hoặc 0318202699)" />
                <button type="button" class="wb-btn wb-btn-primary" id="wbLookupLegalBtn">Tra cứu Dữ liệu Công khai</button>
              </div>
              <div id="wbLegalLookupResult" style="margin-top:10px;font-size:13px;color:var(--wb-text-main);"></div>
            </div>

            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Tên đơn vị <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgName" required placeholder="Nhập tên đầy đủ của đơn vị" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Tên viết tắt <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgShortName" required placeholder="VD: SFEC, USSH, VSVC..." />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Loại đơn vị <span class="req">*</span></label>
                <select class="wb-select" id="wbOrgUnitCategory">
                  <option value="Câu lạc bộ">Câu lạc bộ</option>
                  <option value="Tổ chức">Tổ chức</option>
                  <option value="Đội">Đội</option>
                  <option value="Nhóm">Nhóm</option>
                  <option value="Khác">Khác</option>
                </select>
              </div>
            </div>

            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Logo đơn vị (URL/Tệp bắt buộc) <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgLogoUrl" value="/assets/favicon.svg" required />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Lĩnh vực hoạt động (05 lựa chọn & Khác) <span class="req">*</span></label>
                <select class="wb-select" id="wbOrgField" required>
                  ${fields.map(f => `<option value="${f}">${f}</option>`).join('')}
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Ngày thành lập <span class="req">*</span></label>
                <input type="date" class="wb-input" id="wbOrgFoundedDate" value="2025-11-01" required />
              </div>
            </div>

            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Email đơn vị <span class="req">*</span></label>
                <input type="email" class="wb-input" id="wbOrgEmail" required placeholder="contact@organization.vn" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Số điện thoại đơn vị <span class="req">*</span></label>
                <input type="tel" class="wb-input" id="wbOrgPhone" required placeholder="09xxxxxxxx" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Website chính thức (Nếu có)</label>
                <input type="url" class="wb-input" id="wbOrgWebsite" placeholder="https://..." />
              </div>
            </div>

            <!-- Nhóm Mạng xã hội gộp duy nhất (+ Thêm mạng xã hội - PHẦN 15.1) -->
            <div class="wb-form-group" style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <label class="wb-label" style="margin:0;">Nhóm Mạng xã hội (Bắt buộc ít nhất 01 đường dẫn hợp lệ) <span class="req">*</span></label>
                <button type="button" class="wb-btn wb-btn-outline" id="wbAddSocialRowBtn" style="padding:5px 12px;font-size:12.5px;">+ Thêm mạng xã hội</button>
              </div>
              <div id="wbSocialLinksContainer">
                <div class="wb-grid-2 wb-social-row" style="margin-bottom:8px;">
                  <select class="wb-select wb-social-platform">
                    <option value="Facebook">Facebook</option>
                    <option value="Instagram">Instagram</option>
                    <option value="TikTok">TikTok</option>
                    <option value="YouTube">YouTube</option>
                    <option value="LinkedIn">LinkedIn</option>
                    <option value="Khác">Khác</option>
                  </select>
                  <input type="url" class="wb-input wb-social-url" value="https://facebook.com/wordbridge" required placeholder="https://..." />
                </div>
              </div>
            </div>

            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Giới thiệu đơn vị <span class="req">*</span></label>
                <textarea class="wb-textarea" id="wbOrgIntro" rows="2" required>Đơn vị thực hành và phát triển cộng đồng ngoại ngữ.</textarea>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Sứ mệnh & Tầm nhìn <span class="req">*</span></label>
                <textarea class="wb-textarea" id="wbOrgMission" rows="2" required>Kết nối người học ngoại ngữ và xây dựng môi trường rèn luyện thực tế.</textarea>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Hoạt động chính, Quy mô & Phạm vi <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgScope" value="Toàn quốc / Hoạt động trực tuyến (Online)" required />
              </div>
            </div>

            <!-- Địa chỉ hành chính 34 tỉnh/thành phố (Không có trường Quốc gia - PHẦN 15.3) -->
            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Tỉnh / Thành phố (34 đơn vị hiện hành) <span class="req">*</span></label>
                <select class="wb-select" id="wbOrgProvince" required>
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  ${provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('')}
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Xã / Phường / Đặc khu trực thuộc <span class="req">*</span></label>
                <select class="wb-select" id="wbOrgCommune" required disabled>
                  <option value="">-- Chọn Tỉnh trước --</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Địa chỉ chi tiết (Số nhà, đường...) <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgAddressDetail" required placeholder="Nhập số nhà, tên đường..." />
              </div>
            </div>

            <!-- Bảo trợ pháp lý dành cho Loại 1 (PHẦN 15.1) -->
            <div id="wbType1SponsorSection" style="background:#FDFDF7;padding:14px;border:1px solid var(--wb-border);border-radius:10px;">
              <label class="wb-label">Đơn vị có đơn vị bảo trợ pháp lý không?</label>
              <div style="display:flex;gap:18px;margin-bottom:10px;">
                <label><input type="radio" name="has_sponsor" value="no" checked /> Không</label>
                <label><input type="radio" name="has_sponsor" value="yes" /> Có (Hiển thị thông tin đơn vị bảo trợ)</label>
              </div>
              <div id="wbSponsorFields" style="display:none;" class="wb-grid-3">
                <input type="text" class="wb-input" id="wbSponsorName" placeholder="Tên đơn vị bảo trợ pháp lý *" />
                <input type="text" class="wb-input" id="wbSponsorRep" placeholder="Người đại diện đơn vị bảo trợ *" />
                <input type="tel" class="wb-input" id="wbSponsorPhone" placeholder="Số điện thoại bảo trợ *" />
                <input type="text" class="wb-input" id="wbSponsorDoc" placeholder="Số/Tên văn bản xác nhận bảo trợ *" />
                <input type="text" class="wb-input" id="wbSponsorTerm" placeholder="Phạm vi & Thời hạn bảo trợ *" />
              </div>
            </div>
          </div>

          <!-- MỤC II. THÔNG TIN NGƯỜI ĐẠI DIỆN -->
          <div style="border-bottom:2px solid var(--wb-border);padding-bottom:18px;margin-bottom:22px;">
            <span class="wb-badge wb-badge-red">MỤC II</span>
            <h2 style="margin:8px 0 14px 0;color:var(--wb-deep-teal);">II. THÔNG TIN NGƯỜI ĐẠI DIỆN</h2>
            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Họ và tên người đại diện <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbRepName" required placeholder="Nhập họ tên đầy đủ" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Ngày sinh <span class="req">*</span></label>
                <input type="date" class="wb-input" id="wbRepBirth" value="2000-01-01" required />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Chức vụ <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbRepTitle" value="Chủ nhiệm / Người đại diện" required />
              </div>
            </div>
            <div class="wb-grid-2">
              <div class="wb-form-group">
                <label class="wb-label">Email người đại diện <span class="req">*</span></label>
                <input type="email" class="wb-input" id="wbRepEmail" required placeholder="rep@organization.vn" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Số điện thoại người đại diện <span class="req">*</span></label>
                <input type="tel" class="wb-input" id="wbRepPhone" required placeholder="09xxxxxxxx" />
              </div>
            </div>
            <div class="wb-grid-3">
              <div class="wb-form-group">
                <label class="wb-label">Tỉnh / Thành phố liên hệ <span class="req">*</span></label>
                <select class="wb-select" id="wbRepProvince" required>
                  <option value="">-- Chọn Tỉnh / Thành phố --</option>
                  ${provinces.map(p => `<option value="${p.code}">${p.name}</option>`).join('')}
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Xã / Phường / Đặc khu liên hệ <span class="req">*</span></label>
                <select class="wb-select" id="wbRepCommune" required disabled>
                  <option value="">-- Chọn Tỉnh trước --</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Địa chỉ chi tiết người đại diện <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbRepAddressDetail" required placeholder="Số nhà, tên đường..." />
              </div>
            </div>
          </div>

          <!-- MỤC III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ (Kèm 3 phương thức chữ ký - PHẦN 15.4) -->
          <div>
            <span class="wb-badge wb-badge-red">MỤC III</span>
            <h2 style="margin:8px 0 14px 0;color:var(--wb-deep-teal);">III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ</h2>

            <div class="wb-grid-2">
              <div>
                <label class="wb-label">Phương thức Chữ ký xác nhận của Người đại diện (03 phương thức) <span class="req">*</span></label>
                <select class="wb-select" id="wbSignatureMethod" style="margin-bottom:10px;">
                  <option value="direct_draw">1. Ký trực tiếp bằng chuột, bút cảm ứng hoặc ngón tay</option>
                  <option value="upload_image">2. Tải ảnh chữ ký (Xác nhận hồ sơ, không mặc định tương đương chữ ký số)</option>
                  <option value="digital_cert">3. Chữ ký số hợp lệ (Token / Chứng thư số)</option>
                </select>
                <canvas id="wbSignatureCanvas" width="420" height="140" style="border:2px dashed var(--wb-deep-teal);border-radius:10px;background:#FFFFFF;cursor:crosshair;touch-action:none;width:100%;max-width:420px;"></canvas>
                <div style="margin-top:8px;display:flex;gap:8px;">
                  <button type="button" class="wb-btn wb-btn-outline" id="wbClearSigBtn">🗑️ Xóa & Ký lại</button>
                </div>
              </div>

              <div>
                <div style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;margin-bottom:12px;font-size:13px;">
                  <strong>Lưu ý pháp lý về chữ ký (PHẦN 15.4):</strong><br/>
                  Chữ ký gắn với hồ sơ tổ chức, người xác nhận và thời điểm ký. Hệ thống không mặc định ảnh chữ ký hoặc chữ ký vẽ tay có giá trị pháp lý tương đương chữ ký số chứng thư số.
                </div>
                <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:10px;">
                  <input type="checkbox" id="wbConfirmAccurate" required />
                  Tôi xác nhận toàn bộ thông tin đã cung cấp ở Mục I và Mục II là chính xác, trung thực và đầy đủ.
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:16px;">
                  <input type="checkbox" id="wbConfirmTerms" required />
                  Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của WORD BRIDGE.
                </label>
                <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">🚀 Gửi Hồ sơ Đăng ký Tổ chức</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

    // Chuyển đổi Loại 1 & Loại 2
    const type1Btn = document.getElementById('wbOrgType1Btn');
    const type2Btn = document.getElementById('wbOrgType2Btn');
    const formTypeInp = document.getElementById('wbOrgFormType');
    const lookupBox = document.getElementById('wbType2LegalLookupBox');
    const sponsorSec = document.getElementById('wbType1SponsorSection');

    type1Btn.onclick = () => {
      formTypeInp.value = '1';
      type1Btn.className = 'wb-btn wb-btn-primary';
      type2Btn.className = 'wb-btn wb-btn-outline';
      lookupBox.style.display = 'none';
      sponsorSec.style.display = 'block';
    };
    type2Btn.onclick = () => {
      formTypeInp.value = '2';
      type2Btn.className = 'wb-btn wb-btn-primary';
      type1Btn.className = 'wb-btn wb-btn-outline';
      lookupBox.style.display = 'block';
      sponsorSec.style.display = 'none';
    };

    // Khi đổi tỉnh phải xóa lựa chọn cấp xã cũ (PHẦN 15.3)
    function bindProvinceCommuneSelect(provSelectId, commSelectId) {
      const pSel = document.getElementById(provSelectId);
      const cSel = document.getElementById(commSelectId);
      pSel.onchange = () => {
        const code = pSel.value;
        cSel.innerHTML = '<option value="">-- Chọn Xã / Phường / Đặc khu --</option>';
        if (!code) {
          cSel.disabled = true;
          return;
        }
        const found = provinces.find(p => p.code === code);
        if (found) {
          cSel.disabled = false;
          for (const cm of found.communes) {
            const opt = document.createElement('option');
            opt.value = cm;
            opt.textContent = cm;
            cSel.appendChild(opt);
          }
        }
      };
    }
    bindProvinceCommuneSelect('wbOrgProvince', 'wbOrgCommune');
    bindProvinceCommuneSelect('wbRepProvince', 'wbRepCommune');

    // Bảo trợ pháp lý Có / Không
    root.querySelectorAll('input[name="has_sponsor"]').forEach(r => {
      r.onchange = () => {
        document.getElementById('wbSponsorFields').style.display = r.value === 'yes' && r.checked ? 'grid' : 'none';
      };
    });

    // Thêm mạng xã hội động
    document.getElementById('wbAddSocialRowBtn').onclick = () => {
      const container = document.getElementById('wbSocialLinksContainer');
      const row = document.createElement('div');
      row.className = 'wb-grid-2 wb-social-row';
      row.style.marginBottom = '8px';
      row.innerHTML = `
        <select class="wb-select wb-social-platform">
          <option value="Facebook">Facebook</option>
          <option value="Instagram">Instagram</option>
          <option value="TikTok">TikTok</option>
          <option value="YouTube">YouTube</option>
          <option value="LinkedIn">LinkedIn</option>
          <option value="Khác">Khác</option>
        </select>
        <input type="url" class="wb-input wb-social-url" placeholder="https://..." />
      `;
      container.appendChild(row);
    };

    // Tra cứu mã số pháp nhân ở Loại 2
    document.getElementById('wbLookupLegalBtn').onclick = async () => {
      const code = document.getElementById('wbLegalCodeInput').value.trim();
      const resBox = document.getElementById('wbLegalLookupResult');
      try {
        const res = await WB.api(`/api/organizations/lookup-legal?code=${encodeURIComponent(code)}`);
        if (res.results && res.results.length > 0) {
          const item = res.results[0];
          document.getElementById('wbOrgName').value = item.legal_name;
          document.getElementById('wbOrgShortName').value = item.short_name;
          document.getElementById('wbOrgFoundedDate').value = item.founded_date;
          document.getElementById('wbOrgAddressDetail').value = item.headquarters_address;
          document.getElementById('wbRepName').value = item.representative_name;
          document.getElementById('wbRepTitle').value = item.representative_title;
          resBox.innerHTML = `<strong>✅ Đã tìm thấy pháp nhân:</strong> ${item.legal_name} (${item.short_name}) • Trạng thái: ${item.operating_status} • Nguồn: ${item.source_name} (${res.looked_up_at})`;
        } else {
          resBox.innerHTML = `<span>ℹ️ ${res.note}</span>`;
        }
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    // Bảng vẽ chữ ký trên Canvas
    const canvas = document.getElementById('wbSignatureCanvas');
    const ctx = canvas.getContext('2d');
    let drawing = false;
    let hasSigned = false;
    ctx.strokeStyle = '#146466';
    ctx.lineWidth = 2.5;
    ctx.font = 'italic 20px serif';
    ctx.fillStyle = '#146466';
    ctx.fillText('Chữ ký xác nhận đại diện', 80, 75);
    hasSigned = true;

    canvas.addEventListener('pointerdown', e => {
      drawing = true;
      hasSigned = true;
      const rect = canvas.getBoundingClientRect();
      ctx.beginPath();
      ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    });
    canvas.addEventListener('pointermove', e => {
      if (!drawing) return;
      const rect = canvas.getBoundingClientRect();
      ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
      ctx.stroke();
    });
    window.addEventListener('pointerup', () => { drawing = false; });

    document.getElementById('wbClearSigBtn').onclick = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      hasSigned = false;
    };

    // Submit biểu mẫu đăng ký tổ chức
    document.getElementById('wbOrgApplicationForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) {
        WB.toast('Vui lòng đăng nhập tài khoản trước khi nộp hồ sơ đăng ký tổ chức.');
        return WB.navigate('/dang-nhap');
      }
      if (!hasSigned) {
        return WB.toast('Vui lòng thực hiện ký xác nhận tại Mục III trước khi gửi hồ sơ.', 'error');
      }
      const socials = [];
      root.querySelectorAll('.wb-social-row').forEach(r => {
        const p = r.querySelector('.wb-social-platform').value;
        const u = r.querySelector('.wb-social-url').value.trim();
        if (u) socials.push({ platform: p, url: u });
      });

      const hasSponsor = root.querySelector('input[name="has_sponsor"]:checked')?.value === 'yes';
      const payload = {
        form_type: Number(formTypeInp.value),
        section_i: {
          name: document.getElementById('wbOrgName').value,
          short_name: document.getElementById('wbOrgShortName').value,
          unit_category: document.getElementById('wbOrgUnitCategory').value,
          logo_url: document.getElementById('wbOrgLogoUrl').value,
          field_of_activity: document.getElementById('wbOrgField').value,
          founded_date: document.getElementById('wbOrgFoundedDate').value,
          email: document.getElementById('wbOrgEmail').value,
          phone: document.getElementById('wbOrgPhone').value,
          website: document.getElementById('wbOrgWebsite').value,
          social_links: socials,
          introduction: document.getElementById('wbOrgIntro').value,
          mission: document.getElementById('wbOrgMission').value,
          operation_scope: document.getElementById('wbOrgScope').value,
          province_code: document.getElementById('wbOrgProvince').value,
          commune_name: document.getElementById('wbOrgCommune').value,
          address_detail: document.getElementById('wbOrgAddressDetail').value,
          legal_code: document.getElementById('wbLegalCodeInput').value,
          has_legal_sponsor: hasSponsor,
          legal_sponsor: hasSponsor ? {
            sponsor_name: document.getElementById('wbSponsorName').value,
            representative_name: document.getElementById('wbSponsorRep').value,
            phone: document.getElementById('wbSponsorPhone').value,
            confirmation_doc: document.getElementById('wbSponsorDoc').value,
            scope_and_term: document.getElementById('wbSponsorTerm').value
          } : {}
        },
        section_ii: {
          full_name: document.getElementById('wbRepName').value,
          birth_date: document.getElementById('wbRepBirth').value,
          title: document.getElementById('wbRepTitle').value,
          email: document.getElementById('wbRepEmail').value,
          phone: document.getElementById('wbRepPhone').value,
          province_code: document.getElementById('wbRepProvince').value,
          commune_name: document.getElementById('wbRepCommune').value,
          address_detail: document.getElementById('wbRepAddressDetail').value
        },
        section_iii: {
          signature_method: document.getElementById('wbSignatureMethod').value,
          signature_data: canvas.toDataURL('image/png'),
          confirmed_accurate: document.getElementById('wbConfirmAccurate').checked,
          accepted_terms: document.getElementById('wbConfirmTerms').checked
        }
      };

      try {
        const res = await WB.api('/api/organizations/applications', { method: 'POST', body: payload });
        WB.toast(`Đã nộp hồ sơ đăng ký tổ chức thành công! Mã hồ sơ: ${res.application.application_code}`, 'success');
        WB.navigate('/khong-gian-cua-toi');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });
})(window.WB);
