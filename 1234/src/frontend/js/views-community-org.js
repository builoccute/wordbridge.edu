'use strict';

(function (WB) {
  // 1. CONNECT – TÌM BẠN THỰC HÀNH, DANH SÁCH BẠN HỌC & CHAT (/ket-noi, /ban-be, /tin-nhan - PHẦN IX)
  const renderConnectionsAndChat = async function (root, pathname, searchParams) {
    if (!WB.state.user) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card">
            <span class="wb-badge wb-badge-red">YÊU CẦU ĐĂNG NHẬP</span>
            <h2 style="color:var(--wb-deep-teal);margin:10px 0;">Vui lòng đăng nhập để sử dụng tính năng Kết nối Bạn học &amp; Nhắn tin</h2>
            <p style="color:var(--wb-text-muted);">Hệ thống bảo vệ quyền riêng tư của thành viên và chỉ mở kết nối cho tài khoản đã xác thực.</p>
            <a href="/dang-nhap" class="wb-btn wb-btn-primary" data-nav="/dang-nhap">Đăng nhập ngay</a>
          </div>
        </div>
      `;
      return;
    }

    const q = searchParams?.get('q') || '';
    const lang = searchParams?.get('language_code') || '';
    const level = searchParams?.get('level') || '';
    const supportLang = searchParams?.get('support_language') || '';
    const goal = searchParams?.get('goal') || '';
    const interest = searchParams?.get('interest') || '';
    const hours = searchParams?.get('available_hours') || '';

    const partnersRes = await WB.api(
      `/api/connections/search?q=${encodeURIComponent(q)}&language_code=${encodeURIComponent(lang)}&level=${encodeURIComponent(level)}&support_language=${encodeURIComponent(supportLang)}&goal=${encodeURIComponent(goal)}&interest=${encodeURIComponent(interest)}&available_hours=${encodeURIComponent(hours)}`
    );
    const partners = partnersRes.partners || [];
    const overview = await WB.api('/api/connections/overview');
    const friends = overview.friends || [];
    const pendingReceived = overview.pending_received || [];
    const savedFavorites = overview.saved_favorites || [];
    const conversations = overview.conversations || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">KẾT NỐI &amp; BẠN HỌC</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/ket-noi' ? 'active' : ''}" data-nav="/ket-noi">${WB.icon('search', 16)} <span>Tìm bạn thực hành</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/ban-be' ? 'active' : ''}" data-nav="/ban-be">${WB.icon('users', 16)} <span>Danh sách bạn học (${friends.length})</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/tin-nhan' ? 'active' : ''}" data-nav="/tin-nhan">${WB.icon('chat', 16)} <span>Chat &amp; Phòng thực hành</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/cong-dong">${WB.icon('layers', 16)} <span>Bảng tin cộng đồng</span></a></li>
            </ul>
          </aside>

          <div>
            <div class="wb-card" style="margin-bottom:18px;">
              <span class="wb-badge wb-badge-teal">CONNECT – KẾT NỐI ĐỒNG THUẬN HAI BÊN</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">
                ${pathname === '/tin-nhan' ? 'Chat Bạn học &amp; Phòng Thực hành theo Chủ đề' : pathname === '/ban-be' ? 'Danh sách Bạn học, Lời mời &amp; Hồ sơ Yêu thích' : 'Tìm Bạn Thực hành Ngoại ngữ'}
              </h1>
              <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
                Bảo vệ quyền riêng tư: Không công khai vị trí chính xác, email và số điện thoại. Chỉ mở nhắn tin riêng tư sau khi hai bên đồng thuận kết nối.
              </p>

              <!-- Bộ lọc 8 tiêu chí (PHẦN IX) -->
              <form id="wbPartnerFilterForm">
                <div class="wb-grid-4" style="margin-bottom:10px;">
                  <input type="text" class="wb-input" name="q" value="${q}" placeholder="Tên hoặc tài khoản..." />
                  <select class="wb-select" name="language_code">
                    <option value="">Ngôn ngữ đang học</option>
                    <option value="zh" ${lang === 'zh' ? 'selected' : ''}>Tiếng Trung</option>
                    <option value="en" ${lang === 'en' ? 'selected' : ''}>Tiếng Anh</option>
                    <option value="ko" ${lang === 'ko' ? 'selected' : ''}>Tiếng Hàn</option>
                    <option value="ja" ${lang === 'ja' ? 'selected' : ''}>Tiếng Nhật</option>
                    <option value="ru" ${lang === 'ru' ? 'selected' : ''}>Tiếng Nga</option>
                  </select>
                  <input type="text" class="wb-input" name="level" value="${level}" placeholder="Trình độ (A1, B1, HSK 2...)" />
                  <select class="wb-select" name="support_language">
                    <option value="">Ngôn ngữ có thể hỗ trợ</option>
                    <option value="vi" ${supportLang === 'vi' ? 'selected' : ''}>Tiếng Việt</option>
                    <option value="en" ${supportLang === 'en' ? 'selected' : ''}>Tiếng Anh</option>
                    <option value="zh" ${supportLang === 'zh' ? 'selected' : ''}>Tiếng Trung</option>
                  </select>
                </div>
                <div class="wb-grid-4">
                  <input type="text" class="wb-input" name="goal" value="${goal}" placeholder="Mục tiêu rèn luyện..." />
                  <input type="text" class="wb-input" name="interest" value="${interest}" placeholder="Chủ đề quan tâm..." />
                  <input type="text" class="wb-input" name="available_hours" value="${hours}" placeholder="Thời gian rảnh (VD: 19:00)" />
                  <button type="submit" class="wb-btn wb-btn-primary">Lọc bạn thực hành</button>
                </div>
              </form>
            </div>

            ${pendingReceived.length > 0 ? `
              <div class="wb-card" style="margin-bottom:18px;border-left:4px solid var(--wb-vermilion);">
                <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Lời mời Kết nối Đang chờ Phản hồi (${pendingReceived.length})</h3>
                ${pendingReceived.map(pr => `
                  <div style="display:flex;justify-content:space-between;align-items:center;padding:10px 0;border-bottom:1px solid var(--wb-border);flex-wrap:wrap;gap:8px;">
                    <div>
                      <strong>${pr.requester_name} (@${pr.requester_username})</strong> — Trình độ ${pr.requester_level}
                      <div style="font-size:12.5px;color:var(--wb-text-muted);">Lời nhắn: ${pr.match_note || 'Cùng thực hành ngoại ngữ'}</div>
                    </div>
                    <div style="display:flex;gap:8px;">
                      <button type="button" class="wb-btn wb-btn-primary wb-respond-fr-btn" data-id="${pr.id}" data-action="accept" style="padding:5px 12px;font-size:12.5px;">Chấp nhận</button>
                      <button type="button" class="wb-btn wb-btn-outline wb-respond-fr-btn" data-id="${pr.id}" data-action="decline" style="padding:5px 12px;font-size:12.5px;">Từ chối</button>
                      <button type="button" class="wb-btn wb-btn-outline wb-respond-fr-btn" data-id="${pr.id}" data-action="block" style="padding:5px 12px;font-size:12.5px;">Chặn</button>
                    </div>
                  </div>
                `).join('')}
              </div>
            ` : ''}

            <div class="wb-grid-2">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Gợi ý Bạn thực hành Phù hợp (${partners.length})</h3>
                ${partners.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Chưa có bạn học nào khớp bộ lọc hiện tại.</p>` : `
                  ${partners.map(p => `
                    <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;">
                      <div style="display:flex;justify-content:space-between;align-items:start;gap:8px;">
                        <div>
                          <strong>${p.full_name} (@${p.username})</strong>
                          <div style="font-size:12.5px;color:var(--wb-text-muted);margin-top:2px;">
                            Đang học: <strong>${(p.learning_languages || []).join(', ').toUpperCase()}</strong> •
                            Hỗ trợ: <strong>${(p.native_or_support_languages || ['vi']).join(', ').toUpperCase()}</strong> •
                            Trình độ: <strong>${p.proficiency_level}</strong>
                          </div>
                          <div style="font-size:12.5px;color:var(--wb-text-muted);">
                            Mục tiêu: ${p.learning_goals} • Giờ rảnh: ${p.available_hours} • Hình thức: ${p.practice_mode}
                          </div>
                        </div>
                      </div>
                      <div style="display:flex;gap:8px;margin-top:10px;flex-wrap:wrap;">
                        <button type="button" class="wb-btn wb-btn-primary wb-send-friend-btn" data-id="${p.id}" style="padding:5px 12px;font-size:12.5px;">Gửi lời mời kết nối</button>
                        <button type="button" class="wb-btn wb-btn-outline wb-fav-partner-btn" data-id="${p.id}" style="padding:5px 12px;font-size:12.5px;">${p.is_saved_favorite ? 'Đã lưu yêu thích' : 'Lưu hồ sơ'}</button>
                        <button type="button" class="wb-btn wb-btn-outline wb-block-partner-btn" data-id="${p.id}" style="padding:5px 12px;font-size:12.5px;">Chặn</button>
                      </div>
                    </div>
                  `).join('')}
                `}
              </div>

              <div class="wb-card wb-chat-composer">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Bạn học Đã kết nối (${friends.length}) &amp; Phòng thực hành Nhóm (${conversations.length})</h3>
                ${friends.length > 0 ? `
                  <div style="margin-bottom:14px;">
                    ${friends.map(f => {
                      const friendName = f.requester_id === WB.state.user.id ? f.addressee_name : f.requester_name;
                      return `
                        <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--wb-border);font-size:13.5px;">
                          <span><strong>${friendName}</strong> <span class="wb-badge wb-badge-success">Đã đồng thuận</span></span>
                          <button type="button" class="wb-btn wb-btn-outline wb-respond-fr-btn" data-id="${f.id}" data-action="unfriend" style="padding:4px 8px;font-size:12px;">Hủy kết nối</button>
                        </div>
                      `;
                    }).join('')}
                  </div>
                ` : `<p style="font-size:13px;color:var(--wb-text-muted);">Bạn chưa có kết nối đồng thuận nào.</p>`}

                <h4 style="margin:14px 0 8px 0;color:var(--wb-deep-teal);">Hồ sơ Yêu thích Đã lưu (${savedFavorites.length})</h4>
                ${savedFavorites.map(sf => `<div style="font-size:13px;margin-bottom:4px;">• <strong>${sf.full_name} (@${sf.username})</strong> — Trình độ ${sf.proficiency_level}</div>`).join('')}

                <hr style="margin:16px 0;border:none;border-top:1px solid var(--wb-border);" />
                <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Tạo Nhóm thực hành Nhỏ / Phòng thực hành theo Chủ đề</h4>
                <form id="wbCreateChatGroupForm">
                  <div class="wb-form-group">
                    <label class="wb-label">Tên nhóm hoặc phòng thực hành <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="title" required placeholder="VD: Phòng luyện hội thoại Tiếng Anh B1 tối 20h" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Chủ đề thực hành</label>
                    <input type="text" class="wb-input" name="topic" placeholder="VD: Phản xạ từ vựng và sắp xếp câu" />
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Tạo Phòng Thực hành</button>
                </form>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbPartnerFilterForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const params = new URLSearchParams();
      for (const [k, v] of fd.entries()) {
        if (v) params.set(k, String(v));
      }
      WB.navigate(`${pathname}?${params.toString()}`);
    };

    root.querySelectorAll('.wb-send-friend-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/friends/request', {
            method: 'POST',
            body: { addressee_id: btn.getAttribute('data-id'), match_note: 'Cùng thực hành ngoại ngữ trên WORD BRIDGE!' }
          });
          WB.toast('Đã gửi lời mời kết nối! Nhắn tin riêng tư sẽ mở sau khi bạn học chấp nhận.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-respond-fr-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/friends/respond', {
            method: 'POST',
            body: { friendship_id: btn.getAttribute('data-id'), action: btn.getAttribute('data-action') }
          });
          WB.toast('Đã cập nhật trạng thái kết nối bạn học!', 'success');
          renderConnectionsAndChat(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-fav-partner-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const r = await WB.api('/api/connections/favorite', { method: 'POST', body: { partner_user_id: btn.getAttribute('data-id') } });
          WB.toast(r.saved ? 'Đã lưu hồ sơ bạn học yêu thích!' : 'Đã bỏ lưu hồ sơ.', 'success');
          renderConnectionsAndChat(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-block-partner-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/connections/block', { method: 'POST', body: { blocked_user_id: btn.getAttribute('data-id') } });
          WB.toast('Đã chặn tài khoản này khỏi danh sách kết nối.', 'success');
          renderConnectionsAndChat(root, pathname, searchParams);
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
          WB.toast('Đã tạo phòng thực hành nhóm thành công!', 'success');
          renderConnectionsAndChat(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  };

  WB.registerView('/ket-noi', renderConnectionsAndChat);
  WB.registerView('/ban-be', renderConnectionsAndChat);
  WB.registerView('/tin-nhan', renderConnectionsAndChat);

  // 2. COMMUNITY – CỘNG ĐỒNG NGOẠI NGỮ (/cong-dong, /cong-dong/clb, /cong-dong/doi, /cong-dong/nhom - PHẦN X)
  const renderCommunityHub = async function (root, pathname, searchParams) {
    const langFilter = searchParams?.get('language_code') || '';
    const q = searchParams?.get('q') || '';
    const res = await WB.api(`/api/community/posts?language_code=${encodeURIComponent(langFilter)}&q=${encodeURIComponent(q)}`);
    const posts = res.posts || [];
    const grpRes = await WB.api(`/api/community/groups?language_code=${encodeURIComponent(langFilter)}`);
    const groups = grpRes.groups || [];
    const activities = grpRes.activities || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">CỘNG ĐỒNG NGOẠI NGỮ</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong' ? 'active' : ''}" data-nav="/cong-dong">${WB.icon('news', 16)} <span>Bảng tin cộng đồng</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/clb' ? 'active' : ''}" data-nav="/cong-dong/clb">${WB.icon('building', 16)} <span>Câu lạc bộ ngoại ngữ</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/doi' ? 'active' : ''}" data-nav="/cong-dong/doi">${WB.icon('flag', 16)} <span>Đội thực hành</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/cong-dong/nhom' ? 'active' : ''}" data-nav="/cong-dong/nhom">${WB.icon('users', 16)} <span>Nhóm &amp; Thử thách</span></a></li>
              <li><a class="wb-sidebar-link" data-nav="/cong-dong/to-chuc">${WB.icon('search', 16)} <span>Khám phá tổ chức</span></a></li>
            </ul>
          </aside>

          <div>
            <!-- Thanh chọn 6 cộng đồng ngôn ngữ (5 ngoại ngữ + Cộng đồng đa ngôn ngữ) -->
            <div class="wb-card" style="margin-bottom:18px;">
              <div class="wb-visual-banner-card" style="margin-bottom:14px;">
                <div>
                  <span class="wb-badge wb-badge-teal">COMMUNITY – CỘNG ĐỒNG 05 NGOẠI NGỮ &amp; ĐA NGÔN NGỮ</span>
                  <h2 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">Cộng đồng WORD BRIDGE — Kết nối Người học Toàn cầu</h2>
                  <p style="margin:0;font-size:13px;color:var(--wb-text-muted);">Không gian chia sẻ kinh nghiệm tự thực hành, thảo luận chủ đề và đồng hành cùng Câu lạc bộ, Đội, Nhóm.</p>
                </div>
                <img src="/assets/banners/banner-community-globe.webp" alt="Cộng đồng WORD BRIDGE" class="wb-visual-banner-art" />
              </div>
              <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Bảng tin Cộng đồng, Nhóm Thực hành &amp; Thử thách Ngắn hạn</h1>
              <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
                <button type="button" class="wb-btn ${langFilter === '' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="">Tất cả cộng đồng</button>
                <button type="button" class="wb-btn ${langFilter === 'zh' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="zh">Cộng đồng Tiếng Trung</button>
                <button type="button" class="wb-btn ${langFilter === 'en' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="en">Cộng đồng Tiếng Anh</button>
                <button type="button" class="wb-btn ${langFilter === 'ko' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="ko">Cộng đồng Tiếng Hàn</button>
                <button type="button" class="wb-btn ${langFilter === 'ja' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="ja">Cộng đồng Tiếng Nhật</button>
                <button type="button" class="wb-btn ${langFilter === 'ru' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="ru">Cộng đồng Tiếng Nga</button>
                <button type="button" class="wb-btn ${langFilter === 'multi' ? 'wb-btn-primary' : 'wb-btn-outline'} wb-comm-lang-btn" data-lang="multi">Cộng đồng Đa ngôn ngữ</button>
              </div>
              <form id="wbCommSearchForm" style="display:flex;gap:8px;">
                <input type="search" class="wb-input" name="q" value="${q}" placeholder="Tìm kiếm bài viết, chủ đề thảo luận trong cộng đồng..." />
                <button type="submit" class="wb-btn wb-btn-primary">Tìm bài viết</button>
              </form>
            </div>

            <div class="wb-grid-2" style="margin-bottom:20px;">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đăng Bài viết Thảo luận &amp; Chia sẻ Học liệu</h3>
                <form id="wbCreatePostForm">
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Cộng đồng ngôn ngữ</label>
                      <select class="wb-select" name="language_code">
                        <option value="en">Cộng đồng Tiếng Anh</option>
                        <option value="zh">Cộng đồng Tiếng Trung</option>
                        <option value="ko">Cộng đồng Tiếng Hàn</option>
                        <option value="ja">Cộng đồng Tiếng Nhật</option>
                        <option value="ru">Cộng đồng Tiếng Nga</option>
                        <option value="multi">Cộng đồng Đa ngôn ngữ</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Chủ đề</label>
                      <input type="text" class="wb-input" name="topic_tag" value="Kinh nghiệm thực hành" />
                    </div>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Tiêu đề bài viết <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="title" required placeholder="Nhập tiêu đề bài chia sẻ..." />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Nội dung chia sẻ <span class="req">*</span></label>
                    <textarea class="wb-textarea" name="content" rows="3" required placeholder="Chia sẻ phương pháp rèn luyện từ vựng, nghe hiểu hoặc tài liệu..."></textarea>
                  </div>
                  <button type="submit" class="wb-btn wb-btn-primary">Đăng Bài lên Bảng tin</button>
                </form>
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Tạo Nhóm Thực hành theo Trình độ / Người mới &amp; Thử thách</h3>
                <form id="wbCreateCommunityGroupForm" style="margin-bottom:14px;">
                  <div class="wb-grid-2">
                    <div class="wb-form-group">
                      <label class="wb-label">Loại hình nhóm</label>
                      <select class="wb-select" name="group_category">
                        <option value="nhom">Nhóm thực hành theo trình độ / người mới</option>
                        <option value="clb">Câu lạc bộ ngoại ngữ</option>
                        <option value="doi">Đội chuyên môn</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Ngôn ngữ</label>
                      <select class="wb-select" name="language_code">
                        <option value="en">Tiếng Anh</option>
                        <option value="zh">Tiếng Trung</option>
                        <option value="ko">Tiếng Hàn</option>
                        <option value="ja">Tiếng Nhật</option>
                        <option value="ru">Tiếng Nga</option>
                        <option value="multi">Đa ngôn ngữ</option>
                      </select>
                    </div>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Tên Nhóm / Câu lạc bộ <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="name" required placeholder="VD: Nhóm dành cho người mới bắt đầu Tiếng Trung HSK 1" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Mô tả &amp; Thử thách ngắn hạn</label>
                    <textarea class="wb-textarea" name="description" rows="2" placeholder="VD: Thử thách 7 ngày luyện nghe và sắp xếp câu mỗi tối..."></textarea>
                  </div>
                  <button type="submit" class="wb-btn wb-btn-accent">Khởi tạo Nhóm Thực hành</button>
                </form>

                ${groups.length > 0 ? `
                  <div style="border-top:1px solid var(--wb-border);padding-top:10px;">
                    <strong>Nhóm đang hoạt động (${groups.length}):</strong>
                    ${groups.slice(0, 4).map(g => `
                      <div style="display:flex;justify-content:space-between;align-items:center;padding:6px 0;font-size:13px;">
                        <span><strong>${g.name}</strong> (${g.member_count} thành viên)</span>
                        <button type="button" class="wb-btn wb-btn-outline wb-join-grp-btn" data-id="${g.id}" style="padding:3px 8px;font-size:12px;">Theo dõi nhóm</button>
                      </div>
                    `).join('')}
                  </div>
                ` : ''}
              </div>
            </div>

            <!-- Danh sách bài viết cộng đồng -->
            <div class="wb-card">
              <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Bảng tin Thảo luận Cộng đồng (${posts.length})</h3>
              ${posts.length === 0 ? `<p style="font-size:13.5px;color:var(--wb-text-muted);">Chưa có bài viết nào trong chuyên mục này.</p>` : `
                ${posts.map(p => `
                  <div style="padding:16px;border:1px solid var(--wb-border);border-radius:12px;margin-bottom:14px;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
                      <span class="wb-badge wb-badge-teal">${p.language_code.toUpperCase()} • ${p.topic_tag}</span>
                      <span style="font-size:12px;color:var(--wb-text-muted);">Người đăng: ${p.author_name || 'Thành viên'} • ${p.created_at.slice(0, 16).replace('T', ' ')}</span>
                    </div>
                    <h4 style="margin:0 0 6px 0;color:var(--wb-deep-teal);font-size:17px;">${p.title}</h4>
                    <p style="margin:0 0 12px 0;font-size:14px;">${p.content}</p>

                    <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:10px;">
                      <button type="button" class="wb-btn wb-btn-outline wb-like-post-btn" data-id="${p.id}" style="padding:5px 10px;font-size:12.5px;">
                        ${WB.icon('heart', 14)} <span>Thích (${p.likes_count || 0})</span>
                      </button>
                      <button type="button" class="wb-btn wb-btn-outline wb-bookmark-post-btn" data-id="${p.id}" style="padding:5px 10px;font-size:12.5px;">
                        ${WB.icon('bookmark', 14)} <span>Lưu bài</span>
                      </button>
                      <button type="button" class="wb-btn wb-btn-outline wb-report-post-btn" data-id="${p.id}" style="padding:5px 10px;font-size:12.5px;">
                        Báo cáo vi phạm
                      </button>
                    </div>

                    <!-- Bình luận và Trả lời bình luận -->
                    <div style="background:var(--wb-bg-soft);padding:10px 12px;border-radius:8px;">
                      ${(p.comments || []).map(c => `
                        <div style="font-size:13px;padding:4px 0;border-bottom:1px dashed var(--wb-border);">
                          <strong>${c.author_name || 'Thành viên'}:</strong> ${c.content}
                        </div>
                      `).join('')}
                      <form class="wb-comment-form" data-post-id="${p.id}" style="display:flex;gap:8px;margin-top:8px;">
                        <input type="text" class="wb-input" name="content" required placeholder="Viết bình luận hoặc trả lời trao đổi..." style="padding:6px 10px;font-size:13px;" />
                        <button type="submit" class="wb-btn wb-btn-primary" style="padding:6px 12px;font-size:12.5px;">Gửi bình luận</button>
                      </form>
                    </div>
                  </div>
                `).join('')}
              `}
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-comm-lang-btn').forEach(btn => {
      btn.onclick = () => {
        const l = btn.getAttribute('data-lang');
        WB.navigate(`${pathname}${l ? `?language_code=${encodeURIComponent(l)}` : ''}`);
      };
    });

    document.getElementById('wbCommSearchForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      WB.navigate(`${pathname}?language_code=${encodeURIComponent(langFilter)}&q=${encodeURIComponent(fd.get('q') || '')}`);
    };

    document.getElementById('wbCreatePostForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) return WB.navigate('/dang-nhap');
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/community/posts', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã đăng bài viết lên Bảng tin cộng đồng!', 'success');
        renderCommunityHub(root, pathname, searchParams);
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
        WB.toast('Đã khởi tạo Nhóm thực hành thành công!', 'success');
        renderCommunityHub(root, pathname, searchParams);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-join-grp-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/community/groups/join', { method: 'POST', body: { group_id: btn.getAttribute('data-id') } });
          WB.toast('Đã tham gia và theo dõi nhóm thực hành!', 'success');
          renderCommunityHub(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-like-post-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/community/posts/like', { method: 'POST', body: { post_id: btn.getAttribute('data-id') } });
          renderCommunityHub(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-bookmark-post-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          const r = await WB.api('/api/community/posts/bookmark', { method: 'POST', body: { post_id: btn.getAttribute('data-id') } });
          WB.toast(r.bookmarked ? 'Đã lưu bài viết vào danh mục yêu thích!' : 'Đã bỏ lưu bài viết.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-report-post-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        try {
          await WB.api('/api/resources/report', {
            method: 'POST',
            body: { post_id: btn.getAttribute('data-id'), report_type: 'inappropriate', reason: 'Báo cáo nội dung bài viết cần kiểm duyệt' }
          });
          WB.toast('Đã gửi báo cáo nội dung vi phạm tới bộ phận kiểm duyệt.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-comment-form').forEach(form => {
      form.onsubmit = async e => {
        e.preventDefault();
        if (!WB.state.user) return WB.navigate('/dang-nhap');
        const fd = new FormData(form);
        try {
          await WB.api('/api/community/comments', {
            method: 'POST',
            body: { post_id: form.getAttribute('data-post-id'), content: fd.get('content') }
          });
          renderCommunityHub(root, pathname, searchParams);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  };

  WB.registerView('/cong-dong', renderCommunityHub);
  WB.registerView('/cong-dong/clb', renderCommunityHub);
  WB.registerView('/cong-dong/doi', renderCommunityHub);
  WB.registerView('/cong-dong/nhom', renderCommunityHub);

  // 3. KHÁM PHÁ TỔ CHỨC CÔNG KHAI (/cong-dong/to-chuc - PHẦN XI.1)
  WB.registerView('/cong-dong/to-chuc', async function (root, pathname, searchParams) {
    const q = searchParams?.get('q') || '';
    const unitCategory = searchParams?.get('unit_category') || '';
    const field = searchParams?.get('field_of_activity') || '';

    const res = await WB.api(
      `/api/organizations/explore?q=${encodeURIComponent(q)}&unit_category=${encodeURIComponent(unitCategory)}&field_of_activity=${encodeURIComponent(field)}`
    );
    const orgs = res.organizations || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;margin-bottom:14px;">
            <div>
              <div class="wb-visual-banner-card" style="margin-bottom:14px;">
                <div>
                  <span class="wb-badge wb-badge-teal">KHÁM PHÁ TỔ CHỨC &amp; CÂU LẠC BỘ</span>
                  <h2 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">Hệ sinh thái Câu lạc bộ, Đội, Nhóm &amp; Tổ chức Giáo dục</h2>
                  <p style="margin:0;font-size:13px;color:var(--wb-text-muted);">Tìm hiểu cơ cấu, lĩnh vực hoạt động, chương trình đồng hành và mạng lưới tổ chức trên WORD BRIDGE.</p>
                </div>
                <img src="/assets/banners/banner-globe-books.webp" alt="Khám phá tổ chức WORD BRIDGE" class="wb-visual-banner-art" />
              </div>
              <h1 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">Khám phá Tổ chức, Câu lạc bộ, Đội &amp; Nhóm trên WORD BRIDGE</h1>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">
                Tìm kiếm đơn vị theo loại hình và lĩnh vực hoạt động, xem hồ sơ giới thiệu công khai và gửi yêu cầu tham gia (Không công khai dữ liệu nội bộ của đơn vị).
              </p>
            </div>
            <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-accent" data-nav="/dang-ky-to-chuc">Đăng ký Tổ chức mới</a>
          </div>

          <form id="wbExploreOrgFilterForm" class="wb-grid-4">
            <input type="search" class="wb-input" name="q" value="${q}" placeholder="Tìm tên tổ chức, tên viết tắt..." />
            <select class="wb-select" name="unit_category">
              <option value="">Tất cả loại hình đơn vị</option>
              <option value="Tổ chức" ${unitCategory === 'Tổ chức' ? 'selected' : ''}>Tổ chức</option>
              <option value="Câu lạc bộ" ${unitCategory === 'Câu lạc bộ' ? 'selected' : ''}>Câu lạc bộ</option>
              <option value="Đội" ${unitCategory === 'Đội' ? 'selected' : ''}>Đội</option>
              <option value="Nhóm" ${unitCategory === 'Nhóm' ? 'selected' : ''}>Nhóm</option>
            </select>
            <input type="text" class="wb-input" name="field_of_activity" value="${field}" placeholder="Lĩnh vực hoạt động..." />
            <button type="submit" class="wb-btn wb-btn-primary">Tìm kiếm Tổ chức</button>
          </form>
        </div>

        ${orgs.length === 0 ? `
          <div class="wb-card">
            <p style="margin:0;color:var(--wb-text-muted);">Hiện chưa có tổ chức công khai nào khớp bộ lọc. Bạn có thể đăng ký tổ chức mới ngay hôm nay!</p>
          </div>
        ` : `
          <div class="wb-grid-2">
            ${orgs.map(o => `
              <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
                <div>
                  <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                    <span class="wb-badge wb-badge-teal">${o.unit_category} • ${o.short_name}</span>
                    <span class="wb-badge wb-badge-ivory">${o.province_name}</span>
                  </div>
                  <h3 style="margin:0 0 6px 0;color:var(--wb-deep-teal);">${o.name}</h3>
                  <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 8px 0;"><strong>Lĩnh vực:</strong> ${o.field_of_activity} • <strong>Phạm vi:</strong> ${o.operation_scope}</p>
                  <p style="font-size:13.5px;margin:0 0 10px 0;">${o.introduction}</p>
                  ${(o.public_groups || []).length > 0 ? `
                    <div style="font-size:12.5px;color:var(--wb-text-muted);margin-bottom:10px;">
                      <strong>Nhóm cộng đồng công khai:</strong> ${o.public_groups.map(g => g.name).join(', ')}
                    </div>
                  ` : ''}
                </div>
                <div style="padding-top:10px;border-top:1px solid var(--wb-border);display:flex;justify-content:flex-end;">
                  <button type="button" class="wb-btn wb-btn-primary wb-req-join-org-btn" data-id="${o.id}" data-name="${o.name}">Gửi yêu cầu tham gia</button>
                </div>
              </div>
            `).join('')}
          </div>
        `}
      </div>
    `;

    document.getElementById('wbExploreOrgFilterForm').onsubmit = e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      WB.navigate(`/cong-dong/to-chuc?q=${encodeURIComponent(fd.get('q') || '')}&unit_category=${encodeURIComponent(fd.get('unit_category') || '')}&field_of_activity=${encodeURIComponent(fd.get('field_of_activity') || '')}`);
    };

    root.querySelectorAll('.wb-req-join-org-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập để gửi yêu cầu tham gia tổ chức.');
          return WB.navigate('/dang-nhap');
        }
        try {
          await WB.api('/api/organizations/join-request', {
            method: 'POST',
            body: { org_id: btn.getAttribute('data-id'), message: `Xin tham gia sinh hoạt tại ${btn.getAttribute('data-name')}` }
          });
          WB.toast('Đã gửi yêu cầu tham gia tổ chức! Ban quản lý đơn vị sẽ xét duyệt yêu cầu của bạn.', 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  });

  // 4. TỔ CHỨC & CỘNG ĐỒNG CỦA TÔI (/khong-gian-cua-toi - PHẦN XI.2 & XXI.7: Chặn ngay khi chưa đăng nhập hoặc hướng dẫn khi chưa là thành viên)
  WB.registerView('/khong-gian-cua-toi', async function (root) {
    if (!WB.state.user) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card" style="border-top:4px solid var(--wb-vermilion);">
            <span class="wb-badge wb-badge-red">YÊU CẦU ĐĂNG NHẬP TÀI KHOẢN</span>
            <h1 style="color:var(--wb-deep-teal);margin:10px 0;">Tổ chức &amp; Cộng đồng của tôi</h1>
            <p style="color:var(--wb-text-muted);margin:0 0 16px 0;">
              Khu vực này dành riêng cho thành viên đã đăng nhập. Vui lòng đăng nhập tài khoản để xem các tổ chức, nhiệm vụ, thông báo và tài liệu nội bộ của đơn vị bạn tham gia.
            </p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <a href="/dang-nhap" class="wb-btn wb-btn-primary" data-nav="/dang-nhap">Đăng nhập ngay</a>
              <a href="/cong-dong/to-chuc" class="wb-btn wb-btn-outline" data-nav="/cong-dong/to-chuc">Khám phá tổ chức công khai</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const res = await WB.api('/api/organizations/my-space');
    const mySpace = res.my_space;

    // Quy tắc Phần XI.2: Đã đăng nhập nhưng chưa là thành viên -> hướng dẫn đăng ký hoặc tham gia tổ chức, không hiển thị không gian nội bộ giả
    if (!mySpace.has_organization_membership) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card" style="border-top:4px solid var(--wb-deep-teal);">
            <span class="wb-badge wb-badge-teal">HƯỚNG DẪN THAM GIA HOẶC ĐĂNG KÝ TỔ CHỨC</span>
            <h1 style="color:var(--wb-deep-teal);margin:10px 0;">Tài khoản của bạn hiện chưa là thành viên của tổ chức nào</h1>
            <p style="color:var(--wb-text-muted);margin:0 0 16px 0;">
              Để truy cập không gian sinh hoạt nội bộ (nhiệm vụ, tài liệu nội bộ, lịch sinh hoạt và thông báo đơn vị), bạn có thể gửi yêu cầu tham gia một tổ chức đang hoạt động hoặc nộp hồ sơ đăng ký tổ chức mới.
            </p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:18px;">
              <a href="/cong-dong/to-chuc" class="wb-btn wb-btn-primary" data-nav="/cong-dong/to-chuc">Khám phá &amp; Xin tham gia Tổ chức</a>
              <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-accent" data-nav="/dang-ky-to-chuc">Đăng ký Tổ chức mới</a>
            </div>
            ${(mySpace.applications || []).length > 0 ? `
              <h3 style="margin:14px 0 8px 0;color:var(--wb-deep-teal);">Hồ sơ Đăng ký Tổ chức của bạn (${mySpace.applications.length})</h3>
              ${mySpace.applications.map(a => `
                <div style="padding:10px;background:var(--wb-bg-soft);border-radius:8px;margin-bottom:8px;font-size:13.5px;">
                  <strong>Mã hồ sơ: ${a.application_code}</strong> (Biểu mẫu Loại ${a.form_type}) — <span class="wb-badge wb-badge-ivory">${a.status}</span>
                </div>
              `).join('')}
            ` : ''}
          </div>
        </div>
      `;
      return;
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <span class="wb-badge wb-badge-teal">KHÔNG GIAN THÀNH VIÊN TỔ CHỨC</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Tổ chức &amp; Cộng đồng của tôi</h1>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">
                Hiển thị các tổ chức mà tài khoản của bạn đang có tư cách thành viên chính thức cùng dữ liệu trong phạm vi được phân quyền.
              </p>
            </div>
            ${mySpace.has_management_permission ? `
              <a href="/to-chuc" class="wb-btn wb-btn-primary" data-nav="/to-chuc">Mở Không gian Quản lý Tổ chức</a>
            ` : ''}
          </div>
        </div>

        <div class="wb-grid-2" style="margin-bottom:20px;">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh sách Tổ chức Tham gia &amp; Hồ sơ Thành viên (${mySpace.organizations.length})</h3>
            ${mySpace.organizations.map(o => `
              <div style="padding:12px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:10px;">
                <span class="wb-badge wb-badge-teal">${o.org_code} • ${o.unit_category}</span>
                <h4 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">${o.org_name} (${o.short_name})</h4>
                <div style="font-size:13px;color:var(--wb-text-muted);">
                  Vai trò phân quyền: <strong>${o.org_role_name_vi}</strong> • Chức danh: <strong>${o.title}</strong> • Ngày tham gia: ${(o.joined_at || '').slice(0, 10)}
                </div>
              </div>
            `).join('')}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Nhiệm vụ &amp; Thông báo Nội bộ của Tổ chức</h3>
            <h4 style="font-size:14px;margin:0 0 6px 0;color:var(--wb-deep-teal);">Nhiệm vụ được giao (${(mySpace.internal_tasks || []).length}):</h4>
            ${(mySpace.internal_tasks || []).length === 0 ? `<p style="font-size:13px;color:var(--wb-text-muted);">Chưa có nhiệm vụ nội bộ mới.</p>` : `
              ${mySpace.internal_tasks.map(t => `
                <div style="padding:8px 10px;background:var(--wb-bg-soft);border-radius:8px;margin-bottom:6px;font-size:13px;">
                  <strong>${t.title}</strong>: ${t.description} <span class="wb-badge wb-badge-ivory">${t.status === 'completed' ? 'Hoàn thành' : 'Đang thực hiện'}</span>
                </div>
              `).join('')}
            `}

            <h4 style="font-size:14px;margin:14px 0 6px 0;color:var(--wb-deep-teal);">Thông báo nội bộ (${(mySpace.internal_announcements || []).length}):</h4>
            ${(mySpace.internal_announcements || []).map(an => `
              <div style="padding:8px 10px;background:var(--wb-bg-mint);border-radius:8px;margin-bottom:6px;font-size:13px;">
                <strong>${an.title}:</strong> ${an.content}
              </div>
            `).join('')}
          </div>
        </div>

        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Tài liệu Nội bộ của Tổ chức (${(mySpace.internal_resources || []).length})</h3>
            ${(mySpace.internal_resources || []).length === 0 ? `<p style="font-size:13px;color:var(--wb-text-muted);">Chưa có tài liệu nội bộ nào.</p>` : `
              ${mySpace.internal_resources.map(r => `
                <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);font-size:13.5px;">
                  <strong>${r.title}</strong> <span class="wb-badge wb-badge-teal">${r.language_code.toUpperCase()}</span>
                </div>
              `).join('')}
            `}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Lịch sinh hoạt Nội bộ &amp; Nhóm tham gia (${(mySpace.groups || []).length})</h3>
            ${(mySpace.internal_activities || []).map(act => `
              <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);font-size:13.5px;">
                <strong>${act.title}</strong> — ${act.schedule_time}
              </div>
            `).join('')}
            ${(mySpace.groups || []).map(g => `
              <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);font-size:13.5px;">
                Nhóm: <strong>${g.group_name}</strong> (${g.language_code.toUpperCase()})
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  });

  // 5. KHÔNG GIAN QUẢN LÝ TỔ CHỨC (/to-chuc - PHẦN XI.3 & XXI.7: Chỉ dành cho người có quyền quản lý, chặn thành viên thông thường ngay khi vào trang)
  WB.registerView('/to-chuc', async function (root, pathname, searchParams) {
    if (!WB.state.user) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card" style="border-top:4px solid var(--wb-vermilion);">
            <span class="wb-badge wb-badge-red">CHẶN TRUY CẬP CHƯA XÁC THỰC</span>
            <h1 style="color:var(--wb-vermilion);margin:10px 0;">Không gian Quản lý Tổ chức yêu cầu đăng nhập</h1>
            <p style="color:var(--wb-text-muted);margin:0 0 16px 0;">
              Chỉ người dùng đã đăng nhập và có quyền quản lý tổ chức hợp lệ mới được phép truy cập khu vực này.
            </p>
            <a href="/dang-nhap" class="wb-btn wb-btn-primary" data-nav="/dang-nhap">Đăng nhập ngay</a>
          </div>
        </div>
      `;
      return;
    }

    const orgIdParam = searchParams?.get('org_id') || '';
    let ws = null;
    try {
      const res = await WB.api(`/api/organizations/manage${orgIdParam ? `?org_id=${encodeURIComponent(orgIdParam)}` : ''}`);
      ws = res.workspace;
    } catch (err) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card" style="border-top:4px solid var(--wb-vermilion);">
            <span class="wb-badge wb-badge-red">TỪ CHỐI TRUY CẬP QUẢN LÝ TỔ CHỨC</span>
            <h2 style="color:var(--wb-vermilion);margin:10px 0;">Tài khoản của bạn không có quyền quản lý tổ chức</h2>
            <p style="color:var(--wb-text-muted);margin:0 0 16px 0;">${err.message}</p>
            <div style="display:flex;gap:12px;flex-wrap:wrap;">
              <a href="/khong-gian-cua-toi" class="wb-btn wb-btn-primary" data-nav="/khong-gian-cua-toi">Về Tổ chức &amp; Cộng đồng của tôi</a>
              <a href="/dang-ky-to-chuc" class="wb-btn wb-btn-outline" data-nav="/dang-ky-to-chuc">Đăng ký Tổ chức mới</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const org = ws.organization;
    const members = ws.members || [];
    const joinReqs = ws.join_requests || [];
    const tasks = ws.tasks || [];
    const announcements = ws.announcements || [];
    const quota = ws.storage_quota || {};
    const report = ws.practice_report || {};

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
            <div>
              <div class="wb-dash-header-banner" style="margin-bottom:14px;">
                <div>
                  <span class="wb-badge wb-badge-teal">KHÔNG GIAN QUẢN LÝ TỔ CHỨC • VAI TRÒ: ${ws.viewer_role_name_vi.toUpperCase()}</span>
              <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">${org.name} (${org.short_name})</h1>
              <p style="margin:0;font-size:13.5px;color:var(--wb-text-muted);">
                Mã đơn vị: <strong>${org.code}</strong> • Gói hiện tại: <strong>${org.plan_code}</strong> •
                Thành viên: <strong>${report.active_members_count}/${report.max_members_limit}</strong> •
                Dung lượng dùng chung: <strong>${quota.metered_used_human || '0 B'} / ${quota.effective_quota_human || '50 GB'}</strong>
              </p>
            </div>
            <div style="margin-top:10px;"><a href="/goi-dich-vu" class="wb-btn wb-btn-accent" data-nav="/goi-dich-vu">Nâng cấp Gói Tổ chức Plus</a></div>
                </div>
                <img src="/assets/banners/header-org-building.webp" alt="Không gian Quản lý Tổ chức WORD BRIDGE" class="wb-dash-header-art" />
              </div>
          </div>
        </div>

        <div class="wb-grid-3" style="margin-bottom:20px;">
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Thành viên đang hoạt động</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-deep-teal);">${report.active_members_count} / ${report.max_members_limit}</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Tổng lượt thực hành của thành viên</div>
            <div style="font-size:28px;font-weight:800;color:var(--wb-vermilion);">${report.total_member_practice_attempts || 0} lượt</div>
          </div>
          <div class="wb-card">
            <div style="font-size:13px;color:var(--wb-text-muted);">Dung lượng chu kỳ tháng (${quota.cycle_month || 'Hiện tại'})</div>
            <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${quota.metered_used_human || '0 B'} / ${quota.effective_quota_human || '50 GB'}</div>
          </div>
        </div>

        <div class="wb-grid-2" style="margin-bottom:20px;">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Mời Thành viên &amp; Phân quyền 06 Vai trò Tổ chức</h3>
            <form id="wbCreateOrgMemberForm">
              <input type="hidden" name="org_id" value="${org.id}" />
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Họ và tên thành viên <span class="req">*</span></label>
                  <input type="text" class="wb-input" name="full_name" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Vai trò phân quyền (06 vai trò) <span class="req">*</span></label>
                  <select class="wb-select" name="org_role" required>
                    <option value="member">Thành viên</option>
                    <option value="group_leader">Người phụ trách nhóm</option>
                    <option value="coordinator">Điều phối viên</option>
                    <option value="executive">Ban điều hành</option>
                    <option value="manager">Người quản lý</option>
                    <option value="owner">Chủ sở hữu tổ chức</option>
                  </select>
                </div>
              </div>
              <div class="wb-grid-2">
                <div class="wb-form-group">
                  <label class="wb-label">Email đăng nhập <span class="req">*</span></label>
                  <input type="email" class="wb-input" name="email" required />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Mật khẩu khởi tạo (&gt;=15 ký tự) <span class="req">*</span></label>
                  <input type="password" class="wb-input" name="password" required />
                </div>
              </div>
              <button type="submit" class="wb-btn wb-btn-primary">Mời &amp; Cấp quyền Thành viên</button>
            </form>

            ${joinReqs.length > 0 ? `
              <hr style="margin:16px 0;border:none;border-top:1px solid var(--wb-border);" />
              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Duyệt Yêu cầu Tham gia Tổ chức (${joinReqs.length})</h4>
              ${joinReqs.map(jr => `
                <div style="display:flex;justify-content:space-between;align-items:center;padding:8px 0;border-bottom:1px solid var(--wb-border);font-size:13px;">
                  <span><strong>${jr.full_name} (@${jr.username})</strong></span>
                  <div style="display:flex;gap:6px;">
                    <button type="button" class="wb-btn wb-btn-primary wb-review-join-btn" data-id="${jr.id}" data-dec="approved" style="padding:4px 8px;font-size:12px;">Duyệt</button>
                    <button type="button" class="wb-btn wb-btn-outline wb-review-join-btn" data-id="${jr.id}" data-dec="rejected" style="padding:4px 8px;font-size:12px;">Từ chối</button>
                  </div>
                </div>
              `).join('')}
            ` : ''}
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Giao Nhiệm vụ &amp; Đăng Thông báo Nội bộ</h3>
            <form id="wbCreateOrgTaskForm" style="margin-bottom:16px;">
              <input type="hidden" name="org_id" value="${org.id}" />
              <div class="wb-form-group">
                <label class="wb-label">Tiêu đề nhiệm vụ <span class="req">*</span></label>
                <input type="text" class="wb-input" name="title" required placeholder="VD: Hoàn thành bộ đề luyện đọc hiểu tuần 2" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mô tả chi tiết nhiệm vụ <span class="req">*</span></label>
                <input type="text" class="wb-input" name="description" required placeholder="Hướng dẫn thực hiện nhiệm vụ..." />
              </div>
              <button type="submit" class="wb-btn wb-btn-primary">Giao Nhiệm vụ Nội bộ</button>
            </form>

            <form id="wbCreateOrgAnnounceForm" style="padding-top:12px;border-top:1px solid var(--wb-border);">
              <input type="hidden" name="org_id" value="${org.id}" />
              <div class="wb-form-group">
                <label class="wb-label">Tiêu đề thông báo nội bộ <span class="req">*</span></label>
                <input type="text" class="wb-input" name="title" required placeholder="VD: Lịch sinh hoạt câu lạc bộ tối thứ Bảy" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Nội dung thông báo <span class="req">*</span></label>
                <input type="text" class="wb-input" name="content" required placeholder="Nội dung gửi tới các thành viên..." />
              </div>
              <button type="submit" class="wb-btn wb-btn-accent">Đăng Thông báo Nội bộ</button>
            </form>
          </div>
        </div>

        <div class="wb-card">
          <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Danh sách Thành viên &amp; Phân quyền Vai trò (${members.length})</h3>
          <div class="wb-table-wrap">
            <table class="wb-table">
              <thead>
                <tr><th>Họ tên</th><th>Email</th><th>Vai trò hiện tại</th><th>Đổi vai trò</th><th>Thu hồi quyền</th></tr>
              </thead>
              <tbody>
                ${members.map(m => `
                  <tr>
                    <td><strong>${m.full_name}</strong> (@${m.username})</td>
                    <td>${m.email}</td>
                    <td><span class="wb-badge wb-badge-teal">${m.org_role_name_vi}</span></td>
                    <td>
                      <select class="wb-select wb-change-member-role-sel" data-uid="${m.user_id}" style="padding:4px 8px;font-size:12.5px;width:auto;">
                        <option value="owner" ${m.org_role === 'owner' || m.org_role === 'head' ? 'selected' : ''}>Chủ sở hữu tổ chức</option>
                        <option value="manager" ${m.org_role === 'manager' ? 'selected' : ''}>Người quản lý</option>
                        <option value="executive" ${m.org_role === 'executive' ? 'selected' : ''}>Ban điều hành</option>
                        <option value="coordinator" ${m.org_role === 'coordinator' ? 'selected' : ''}>Điều phối viên</option>
                        <option value="group_leader" ${m.org_role === 'group_leader' ? 'selected' : ''}>Người phụ trách nhóm</option>
                        <option value="member" ${m.org_role === 'member' ? 'selected' : ''}>Thành viên</option>
                      </select>
                    </td>
                    <td>
                      ${m.org_role !== 'head' && m.org_role !== 'owner' ? `
                        <button type="button" class="wb-btn wb-btn-outline wb-remove-org-member-btn" data-uid="${m.user_id}" style="padding:4px 8px;font-size:12px;">Thu hồi quyền</button>
                      ` : '—'}
                    </td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbCreateOrgMemberForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/organizations/members', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã mời và cấp quyền thành viên thành công!', 'success');
        WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbCreateOrgTaskForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/organizations/tasks', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã giao nhiệm vụ nội bộ!', 'success');
        WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbCreateOrgAnnounceForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/organizations/announcements', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã đăng thông báo nội bộ!', 'success');
        WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-review-join-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/organizations/join-requests/review', {
            method: 'POST',
            body: { org_id: org.id, request_id: btn.getAttribute('data-id'), decision: btn.getAttribute('data-dec') }
          });
          WB.toast('Đã xử lý yêu cầu tham gia tổ chức!', 'success');
          WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-change-member-role-sel').forEach(sel => {
      sel.onchange = async () => {
        try {
          await WB.api('/api/organizations/members/role', {
            method: 'POST',
            body: { org_id: org.id, member_user_id: sel.getAttribute('data-uid'), new_org_role: sel.value }
          });
          WB.toast('Đã cập nhật vai trò phân quyền thành viên!', 'success');
          WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-remove-org-member-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/organizations/members/remove', {
            method: 'POST',
            body: { org_id: org.id, member_user_id: btn.getAttribute('data-uid'), reason: 'Thu hồi quyền từ Không gian Quản lý Tổ chức' }
          });
          WB.toast('Đã thu hồi quyền thành viên (Dữ liệu tổ chức được giữ nguyên 100%)!', 'success');
          WB.navigate('/to-chuc?org_id=' + encodeURIComponent(org.id), false);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });
  });

  // 6. HỆ THỐNG ĐĂNG KÝ TỔ CHỨC 2 LOẠI – ĐÚNG 3 MỤC I, II, III (/dang-ky-to-chuc)
  WB.registerView('/dang-ky-to-chuc', async function (root) {
    const catRes = await WB.api('/api/organizations/catalog');
    const catalog = catRes.catalog;
    const provinces = catalog.provinces || [];
    const fields = catalog.approved_activity_fields || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <div class="wb-visual-banner-card" style="margin-bottom:14px;">
            <div>
              <span class="wb-badge wb-badge-teal">HỆ THỐNG ĐĂNG KÝ TỔ CHỨC &amp; XÉT DUYỆT</span>
              <h2 style="margin:6px 0 4px 0;color:var(--wb-deep-teal);">Đăng ký Câu lạc bộ / Đội / Nhóm &amp; Tổ chức Pháp nhân</h2>
              <p style="margin:0;font-size:13px;color:var(--wb-text-muted);">Xây dựng không gian hoạt động chính thức, quản lý thành viên 06 vai trò và kết nối cộng đồng ngoại ngữ.</p>
            </div>
            <img src="/assets/banners/hero-globe-books.webp" alt="Đăng ký tổ chức WORD BRIDGE" class="wb-visual-banner-art" />
          </div>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Đăng ký Tổ chức / Đơn vị trên WORD BRIDGE</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 14px 0;">
            Biểu mẫu gồm <strong>03 mục chính: I. THÔNG TIN TỔ CHỨC – II. THÔNG TIN NGƯỜI ĐẠI DIỆN – III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ</strong>, áp dụng dữ liệu hành chính 34 tỉnh/thành phố Việt Nam hiện hành và chữ ký xác nhận.
          </p>
          <div style="display:flex;gap:12px;flex-wrap:wrap;">
            <button type="button" class="wb-btn wb-btn-primary" id="wbOrgType1Btn">Loại 1: Tổ chức chưa có tư cách pháp nhân độc lập (CLB, Đội, Nhóm...)</button>
            <button type="button" class="wb-btn wb-btn-outline" id="wbOrgType2Btn">Loại 2: Tổ chức có tư cách pháp nhân độc lập (Trường học, Doanh nghiệp...)</button>
          </div>
        </div>

        <form id="wbOrgApplicationForm" class="wb-card">
          <input type="hidden" name="form_type" id="wbOrgFormType" value="1" />

          <div style="border-bottom:2px solid var(--wb-border);padding-bottom:18px;margin-bottom:22px;">
            <span class="wb-badge wb-badge-red">MỤC I</span>
            <h2 style="margin:8px 0 14px 0;color:var(--wb-deep-teal);">I. THÔNG TIN TỔ CHỨC</h2>

            <div id="wbType2LegalLookupBox" style="display:none;background:var(--wb-bg-mint);padding:16px;border-radius:12px;margin-bottom:18px;border:1px solid var(--wb-light-teal);">
              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Tra cứu Mã số doanh nghiệp / Mã số tổ chức / Mã số pháp lý (Biểu mẫu Loại 2)</h4>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <input type="text" class="wb-input" id="wbLegalCodeInput" style="flex:1;" placeholder="Nhập mã số pháp lý (VD: 0303460456)" />
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
                <input type="text" class="wb-input" id="wbOrgShortName" required placeholder="VD: SFEC, USSH..." />
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
                <label class="wb-label">Biểu trưng đơn vị <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgLogoUrl" value="/assets/favicon.svg" required />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Lĩnh vực hoạt động <span class="req">*</span></label>
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
                <label class="wb-label">Trang thông tin điện tử (Nếu có)</label>
                <input type="url" class="wb-input" id="wbOrgWebsite" placeholder="https://..." />
              </div>
            </div>

            <div class="wb-form-group" style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <label class="wb-label" style="margin:0;">Kênh mạng xã hội của đơn vị (Ít nhất 01 liên kết hợp lệ) <span class="req">*</span></label>
                <button type="button" class="wb-btn wb-btn-outline" id="wbAddSocialRowBtn" style="padding:5px 12px;font-size:12.5px;">Thêm mạng xã hội</button>
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
                <label class="wb-label">Sứ mệnh &amp; Tầm nhìn <span class="req">*</span></label>
                <textarea class="wb-textarea" id="wbOrgMission" rows="2" required>Kết nối người học ngoại ngữ và xây dựng môi trường rèn luyện thực tế.</textarea>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Phạm vi hoạt động <span class="req">*</span></label>
                <input type="text" class="wb-input" id="wbOrgScope" value="Toàn quốc" required />
              </div>
            </div>

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

            <div id="wbType1SponsorSection" style="background:#FDFDF7;padding:14px;border:1px solid var(--wb-border);border-radius:10px;">
              <label class="wb-label">Đơn vị có đơn vị bảo trợ pháp lý không?</label>
              <div style="display:flex;gap:18px;margin-bottom:10px;">
                <label><input type="radio" name="has_sponsor" value="no" checked /> Không</label>
                <label><input type="radio" name="has_sponsor" value="yes" /> Có</label>
              </div>
              <div id="wbSponsorFields" style="display:none;" class="wb-grid-3">
                <input type="text" class="wb-input" id="wbSponsorName" placeholder="Tên đơn vị bảo trợ pháp lý *" />
                <input type="text" class="wb-input" id="wbSponsorRep" placeholder="Người đại diện đơn vị bảo trợ *" />
                <input type="tel" class="wb-input" id="wbSponsorPhone" placeholder="Số điện thoại bảo trợ *" />
                <input type="text" class="wb-input" id="wbSponsorDoc" placeholder="Số/Tên văn bản xác nhận bảo trợ *" />
                <input type="text" class="wb-input" id="wbSponsorTerm" placeholder="Phạm vi &amp; Thời hạn bảo trợ *" />
              </div>
            </div>
          </div>

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

          <div>
            <span class="wb-badge wb-badge-red">MỤC III</span>
            <h2 style="margin:8px 0 14px 0;color:var(--wb-deep-teal);">III. XEM LẠI VÀ XÁC NHẬN NỘP HỒ SƠ</h2>

            <div class="wb-grid-2">
              <div>
                <label class="wb-label">Phương thức Chữ ký xác nhận của Người đại diện <span class="req">*</span></label>
                <select class="wb-select" id="wbSignatureMethod" style="margin-bottom:10px;">
                  <option value="direct_draw">1. Ký trực tiếp bằng chuột, bút cảm ứng hoặc ngón tay</option>
                  <option value="upload_image">2. Tải ảnh chữ ký xác nhận hồ sơ</option>
                  <option value="digital_cert">3. Chữ ký số hợp lệ theo chứng thư số</option>
                </select>
                <canvas id="wbSignatureCanvas" width="420" height="140" style="border:2px dashed var(--wb-deep-teal);border-radius:10px;background:#FFFFFF;cursor:crosshair;touch-action:none;width:100%;max-width:420px;"></canvas>
                <div style="margin-top:8px;display:flex;gap:8px;">
                  <button type="button" class="wb-btn wb-btn-outline" id="wbClearSigBtn">Xóa &amp; Ký lại</button>
                </div>
              </div>

              <div>
                <div style="background:var(--wb-bg-soft);padding:14px;border-radius:10px;margin-bottom:12px;font-size:13px;">
                  <strong>Lưu ý xác nhận:</strong><br/>
                  Chữ ký gắn với hồ sơ tổ chức, người xác nhận và thời điểm ký. Sau khi nộp, hồ sơ được chuyển tới bộ phận Quản trị Tổ chức để xét duyệt trước khi cấp không gian hoạt động chính thức.
                </div>
                <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:10px;">
                  <input type="checkbox" id="wbConfirmAccurate" required />
                  <span>Tôi xác nhận toàn bộ thông tin đã cung cấp ở Mục I và Mục II là chính xác, trung thực và đầy đủ.</span>
                </label>
                <label style="display:flex;align-items:center;gap:8px;font-size:13.5px;margin-bottom:16px;">
                  <input type="checkbox" id="wbConfirmTerms" required />
                  <span>Tôi đồng ý với Điều khoản sử dụng và Chính sách quyền riêng tư của WORD BRIDGE.</span>
                </label>
                <button type="submit" class="wb-btn wb-btn-accent" style="width:100%;">Gửi Hồ sơ Đăng ký Tổ chức</button>
              </div>
            </div>
          </div>
        </form>
      </div>
    `;

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

    root.querySelectorAll('input[name="has_sponsor"]').forEach(r => {
      r.onchange = () => {
        document.getElementById('wbSponsorFields').style.display = r.value === 'yes' && r.checked ? 'grid' : 'none';
      };
    });

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
          resBox.innerHTML = `<strong>Đã tìm thấy pháp nhân:</strong> ${item.legal_name} (${item.short_name}) • Trạng thái: ${item.operating_status}`;
        } else {
          resBox.innerHTML = `<span>${res.note}</span>`;
        }
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

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
