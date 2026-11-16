'use strict';

(function (WB) {
  // 1. CỔNG ĐĂNG NHẬP QUẢN TRỊ VIÊN RIÊNG BIỆT (/quan-tri/dang-nhap - PHẦN XVIII & XXI.8)
  WB.registerView('/quan-tri/dang-nhap', async function (root) {
    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="max-width:560px;margin:0 auto;border-top:5px solid var(--wb-deep-teal);">
          <span class="wb-badge wb-badge-teal">CỔNG XÁC THỰC QUẢN TRỊ VIÊN ĐỘC LẬP</span>
          <h1 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Đăng nhập Quản trị Hệ thống WORD BRIDGE</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0 0 18px 0;">
            Khu vực dành riêng cho đội ngũ vận hành và quản trị được phân quyền. Cổng đăng nhập Quản trị sử dụng phiên xác thực độc lập, kiểm soát giới hạn lượt thử và ghi nhật ký bảo mật.
          </p>
          <form id="wbAdminDedicatedLoginForm">
            <div class="wb-form-group">
              <label class="wb-label">Email hoặc Tài khoản Quản trị viên <span class="req">*</span></label>
              <input type="text" class="wb-input" name="email" required placeholder="Nhập email quản trị viên" />
            </div>
            <div class="wb-form-group">
              <label class="wb-label">Mật khẩu Quản trị viên <span class="req">*</span></label>
              <input type="password" class="wb-input" name="password" required placeholder="Nhập mật khẩu quản trị" />
            </div>
            <div class="wb-form-group">
              <label class="wb-label">Mã bảo vệ Quản trị bổ sung (Nếu máy chủ yêu cầu)</label>
              <input type="password" class="wb-input" name="security_code" placeholder="Nhập mã bảo vệ cấp máy chủ" />
            </div>
            <button type="submit" class="wb-btn wb-btn-primary" style="width:100%;">Xác thực &amp; Vào Bảng điều khiển Quản trị</button>
          </form>
        </div>
      </div>
    `;

    document.getElementById('wbAdminDedicatedLoginForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await WB.api('/api/admin/auth/login', {
          method: 'POST',
          body: Object.fromEntries(fd.entries())
        });
        WB.setSession(res.admin_user, res.admin_session.token, true);
        WB.toast('Đã xác thực phiên Quản trị viên thành công!', 'success');
        WB.navigate('/quan-tri');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  });

  // 2. BẢNG ĐIỀU KHIỂN QUẢN TRỊ TOÀN DIỆN (/quan-tri, /quan-tri/luu-tru, /quan-tri/cms, /quan-tri/email, /quan-tri/bao-tri - PHẦN XVIII & XIX)
  // Hoàn toàn bằng tiếng Việt 100%, không lộ đường dẫn kỹ thuật hay biến môi trường.
  const renderAdminCenter = async function (root, pathname) {
    if (!WB.state.user) {
      return WB.navigate('/quan-tri/dang-nhap');
    }

    let dash = null;
    let storageDash = null;
    let emailOverview = null;
    let cmsPages = [];
    let newsArticles = [];
    try {
      dash = await WB.api('/api/admin/dashboard');
      storageDash = await WB.api('/api/admin/storage/dashboard');
      emailOverview = await WB.api('/api/admin/emails');
      const cmsRes = await WB.api('/api/cms/pages');
      cmsPages = cmsRes.pages || [];
      const newsRes = await WB.api('/api/news?includeDrafts=1');
      newsArticles = newsRes.articles || [];
    } catch (err) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card" style="border-top:4px solid var(--wb-vermilion);">
            <span class="wb-badge wb-badge-red">KIỂM SOÁT PHÂN QUYỀN QUẢN TRỊ</span>
            <h2 style="color:var(--wb-vermilion);margin:10px 0;">Từ chối Truy cập Khu vực Quản trị</h2>
            <p>${err.message}</p>
            <div style="display:flex;gap:12px;">
              <a href="/quan-tri/dang-nhap" class="wb-btn wb-btn-primary" data-nav="/quan-tri/dang-nhap">Đăng nhập Quản trị viên</a>
              <a href="/" class="wb-btn wb-btn-outline" data-nav="/">Về Trang chủ</a>
            </div>
          </div>
        </div>
      `;
      return;
    }

    const m = dash.metrics;
    const maint = dash.maintenance;
    const templates = emailOverview.templates || [];
    const recentQueue = emailOverview.recent_queue || [];
    const infra = storageDash.infrastructure_overview;
    const accounts = storageDash.account_quotas || [];
    const cycles = storageDash.monthly_cycles || { active_organization_cycles: [], historical_cycles: [] };
    const alerts = storageDash.alerts || [];
    const recentOrders = dash.recent_orders || [];
    const orgApps = dash.org_applications || [];
    const supportApps = dash.support_program_applications || [];
    const violationReports = dash.violation_reports || [];
    const auditLogs = dash.audit_logs || [];

    const translatePlanName = (code) => {
      const map = {
        personal_free: 'Người Dùng bản Miễn Phí (1 GB)',
        personal_plus_monthly: 'Người Dùng bản Plus – Tháng (5 GB)',
        personal_plus_yearly: 'Người Dùng bản Plus – Năm (5 GB)',
        org_trial: 'Dùng thử Tổ chức 14 ngày (50 GB/tháng)',
        org_plus_monthly: 'Tổ Chức Plus – Tháng (50 GB/tháng)',
        org_plus_yearly: 'Tổ Chức Plus – Năm (120 GB/tháng)'
      };
      return map[code] || code;
    };

    const translateOrderStatusVi = (st) => {
      const map = {
        pending: 'Chờ đối soát',
        paid: 'Đã thanh toán',
        refunded: 'Đã hoàn tiền',
        underpaid: 'Thanh toán thiếu',
        wrong_content: 'Sai nội dung'
      };
      return map[st] || st;
    };

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">BẢNG ĐIỀU KHIỂN QUẢN TRỊ</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri' ? 'active' : ''}" data-nav="/quan-tri">${WB.icon('chart', 16)} <span>Tổng quan &amp; Nghiệp vụ</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/luu-tru' ? 'active' : ''}" data-nav="/quan-tri/luu-tru">${WB.icon('database', 16)} <span>Quản lý Dung lượng</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/cms' ? 'active' : ''}" data-nav="/quan-tri/cms">${WB.icon('news', 16)} <span>Nội dung &amp; Tin tức</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/email' ? 'active' : ''}" data-nav="/quan-tri/email">${WB.icon('mail', 16)} <span>Quản lý Email</span></a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/bao-tri' ? 'active' : ''}" data-nav="/quan-tri/bao-tri">${WB.icon('settings', 16)} <span>Bảo trì &amp; Sao lưu</span></a></li>
            </ul>
          </aside>

          <div>
            <!-- 1. TỔNG QUAN HỆ THỐNG (SỐ LIỆU THẬT 100%) -->
            <div class="wb-card" style="margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <div class="wb-dash-header-banner" style="margin-bottom:14px;">
                  <div>
                    <span class="wb-badge wb-badge-teal">QUẢN TRỊ HỆ THỐNG WORD BRIDGE • VAI TRÒ: ${(WB.state.user.role_name_vi || 'Quản trị viên').toUpperCase()}</span>
                  <h1 style="margin:6px 0 0 0;color:var(--wb-deep-teal);">Tổng quan Vận hành Toàn Nền tảng</h1>
                </div>
                <div style="display:flex;gap:8px;">
                  <div style="margin-top:10px;"><button type="button" class="wb-btn wb-btn-outline" id="wbTriggerBackupBtn">Sao lưu &amp; Kiểm tra Phục hồi</button></div>
                  </div>
                  <img src="/assets/banners/header-analytics-chart.webp" alt="Báo cáo và Thống kê WORD BRIDGE" class="wb-dash-header-art" />
                </div>
              </div>
              <div class="wb-grid-4" style="margin-top:16px;">
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Tổng tài khoản / Thành viên</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.total_accounts} / ${m.personal_members}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Tổ chức hoạt động / Chờ duyệt</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.organizations_approved} / ${m.org_applications_pending}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Bài thực hành / Lượt làm bài</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.practice_exercises_total} / ${m.practice_attempts_total}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Đơn đã thanh toán / Chờ đối soát</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-vermilion);">${m.payment_orders_paid} / ${m.payment_orders_pending || 0}</div>
                </div>
              </div>
            </div>

            <!-- 2. XÉT DUYỆT HỒ SƠ TỔ CHỨC, ĐỐI SOÁT CHUYỂN KHOẢN & HOÀN TIỀN, DUYỆT HỖ TRỢ -->
            <div class="wb-grid-2" style="margin-bottom:20px;">
              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đối soát Chuyển khoản &amp; Quản lý Hoàn tiền (${recentOrders.length})</h3>
                ${recentOrders.length === 0 ? `<p style="font-size:13px;color:var(--wb-text-muted);">Chưa có đơn hàng phát sinh.</p>` : `
                  <div class="wb-table-wrap">
                    <table class="wb-table">
                      <thead>
                        <tr><th>Mã đơn</th><th>Loại gói</th><th>Số tiền</th><th>Trạng thái</th><th>Thao tác</th></tr>
                      </thead>
                      <tbody>
                        ${recentOrders.slice(0, 8).map(o => `
                          <tr>
                            <td><strong>${o.order_code}</strong><br/><span style="font-size:11.5px;color:var(--wb-text-muted);">${o.transfer_content}</span></td>
                            <td>${translatePlanName(o.plan_code)} ${o.org_id ? '(Tổ chức)' : '(Cá nhân)'}</td>
                            <td>${Number(o.final_amount_vnd).toLocaleString('vi-VN')} đ</td>
                            <td><span class="wb-badge ${o.status === 'paid' ? 'wb-badge-success' : 'wb-badge-ivory'}">${translateOrderStatusVi(o.status)}</span></td>
                            <td>
                              ${o.status === 'pending' ? `
                                <button type="button" class="wb-btn wb-btn-primary wb-admin-reconcile-btn" data-id="${o.id}" data-amt="${o.final_amount_vnd}" data-cnt="${o.transfer_content}" style="padding:4px 8px;font-size:12px;">Xác nhận thanh toán</button>
                              ` : o.status === 'paid' ? `
                                <button type="button" class="wb-btn wb-btn-outline wb-admin-refund-btn" data-id="${o.id}" style="padding:4px 8px;font-size:12px;">Hoàn tiền</button>
                              ` : '—'}
                            </td>
                          </tr>
                        `).join('')}
                      </tbody>
                    </table>
                  </div>
                `}
              </div>

              <div class="wb-card">
                <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Xét duyệt Hồ sơ Tổ chức (${orgApps.length}) &amp; Chương trình Hỗ trợ (${supportApps.length})</h3>
                ${orgApps.length === 0 ? `<p style="font-size:13px;color:var(--wb-text-muted);">Chưa có hồ sơ đăng ký tổ chức.</p>` : `
                  ${orgApps.slice(0, 5).map(a => `
                    <div style="padding:8px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                      <div>
                        <strong>${a.org_name} (${a.short_name})</strong> — Mã: ${a.application_code}
                        <div><span class="wb-badge wb-badge-ivory">${a.status}</span></div>
                      </div>
                      ${a.status === 'Chờ xét duyệt' ? `
                        <button type="button" class="wb-btn wb-btn-primary wb-admin-approve-org-btn" data-id="${a.id}" style="padding:4px 10px;font-size:12px;">Phê duyệt</button>
                      ` : ''}
                    </div>
                  `).join('')}
                `}

                <h4 style="margin:14px 0 8px 0;color:var(--wb-deep-teal);">Hồ sơ Chương trình Hỗ trợ Cộng đồng:</h4>
                ${supportApps.slice(0, 5).map(s => `
                  <div style="padding:6px 0;border-bottom:1px solid var(--wb-border);display:flex;justify-content:space-between;align-items:center;font-size:13px;">
                    <span><strong>${s.full_name || s.user_id}</strong> (${s.program_type}) — <span class="wb-badge wb-badge-teal">${s.status === 'approved' ? 'Đã duyệt' : 'Chờ duyệt'}</span></span>
                    ${s.status === 'pending' ? `
                      <button type="button" class="wb-btn wb-btn-outline wb-admin-approve-support-btn" data-id="${s.id}" style="padding:3px 8px;font-size:12px;">Duyệt hỗ trợ</button>
                    ` : ''}
                  </div>
                `).join('')}
              </div>
            </div>

            <!-- 3. QUẢN LÝ HẠ TẦNG D1/R2 & HẠN MỨC DUNG LƯỢNG -->
            <div class="wb-card" style="margin-bottom:20px;border-top:4px solid var(--wb-deep-teal);">
              <span class="wb-badge wb-badge-red">HẠ TẦNG CLOUDFLARE D1 &amp; R2 • QUẢN LÝ HẠN MỨC DUNG LƯỢNG</span>
              <h2 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Quản lý Dung lượng Lưu trữ theo Gói &amp; Chu kỳ Tháng</h2>
              <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 14px 0;">
                • <strong>Kiến trúc sản xuất thống nhất:</strong> Cơ sở dữ liệu ${infra.database_engine} và Lưu trữ đối tượng ${infra.storage_engine}.<br/>
                • <strong>Chính sách bảo vệ quyền lợi gói:</strong> Người Dùng bản Miễn Phí (1 GB), Người Dùng bản Plus (5 GB), Tổ Chức Plus Tháng (50 GB/tổ chức/tháng), Tổ Chức Plus Năm (120 GB/tổ chức/tháng). Không đặt biến hạn mức toàn hệ thống để ghi đè quyền lợi từng gói.
              </p>

              <div style="background:var(--wb-bg-soft);padding:16px;border-radius:12px;margin-bottom:16px;">
                <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Cấp Hạn mức Riêng cho Tài khoản Cá nhân hoặc Tổ chức</h4>
                <form id="wbAdminQuotaForm">
                  <div class="wb-grid-4">
                    <div class="wb-form-group">
                      <label class="wb-label">Chọn Tài khoản / Tổ chức</label>
                      <select class="wb-select" id="wbQuotaTargetSelect" required>
                        ${accounts.map(a => `<option value="${a.target_type}:${a.target_id}">[${a.target_type === 'organization' ? 'Tổ chức' : 'Cá nhân'}] ${a.display_name} — ${translatePlanName(a.plan_code)}</option>`).join('')}
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Thao tác điều chỉnh</label>
                      <select class="wb-select" name="action">
                        <option value="set_custom">Đặt hạn mức riêng</option>
                        <option value="increase">Tăng thêm hạn mức (+)</option>
                        <option value="decrease">Giảm hạn mức (-)</option>
                        <option value="set_unlimited">Chuyển sang Không giới hạn</option>
                        <option value="remove_custom">Gỡ hạn mức riêng (Về mặc định gói)</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Mức dung lượng &amp; Đơn vị</label>
                      <div style="display:flex;gap:6px;">
                        <input type="number" class="wb-input" name="amount" value="100" min="1" step="1" />
                        <select class="wb-select" name="unit" style="width:90px;">
                          <option value="GB">GB</option>
                          <option value="TB">TB</option>
                        </select>
                      </div>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Lý do ghi nhật ký</label>
                      <input type="text" class="wb-input" name="reason" value="Quản trị viên cấp hạn mức riêng" required />
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button type="submit" class="wb-btn wb-btn-primary">Áp dụng Cấu hình Hạn mức</button>
                    <button type="button" class="wb-btn wb-btn-outline" id="wbTriggerMonthlyCycleResetBtn">
                      Làm mới Bộ đếm Chu kỳ Tháng Tổ chức (Ngày 01 hằng tháng – Không xóa dữ liệu cũ)
                    </button>
                  </div>
                </form>
              </div>

              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr>
                      <th>Phân loại</th>
                      <th>Tài khoản / Tổ chức</th>
                      <th>Gói dịch vụ</th>
                      <th>Hạn mức Mặc định</th>
                      <th>Hạn mức Cấp riêng</th>
                      <th>Hạn mức Hiệu lực</th>
                      <th>Đang sử dụng</th>
                      <th>Trạng thái</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${accounts.map(a => `
                      <tr>
                        <td><span class="wb-badge ${a.target_type === 'organization' ? 'wb-badge-red' : 'wb-badge-teal'}">${a.target_type === 'organization' ? 'Tổ chức' : 'Cá nhân'}</span></td>
                        <td><strong>${a.display_name}</strong></td>
                        <td>${translatePlanName(a.plan_code)}</td>
                        <td>${a.default_quota_human}${a.is_monthly_cycle ? '/tháng' : ''}</td>
                        <td>${a.is_unlimited ? '<strong>Không giới hạn</strong>' : (a.admin_custom_quota_human || '—')}</td>
                        <td><strong>${a.effective_quota_human}${a.is_monthly_cycle && !a.is_unlimited ? '/tháng' : ''}</strong></td>
                        <td>${a.metered_used_human} (${a.usage_percent}%)</td>
                        <td>
                          <span class="wb-badge ${a.over_quota_blocked ? 'wb-badge-red' : 'wb-badge-success'}">
                            ${a.over_quota_blocked ? 'Chạm hạn mức (Ngăn tải mới, giữ nguyên dữ liệu cũ)' : 'Hoạt động bình thường'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 4. QUẢN LÝ NỘI DUNG TRANG & TIN TỨC CHÍNH THỨC -->
            <div class="wb-card" style="margin-bottom:20px;">
              <span class="wb-badge wb-badge-teal">QUẢN TRỊ NỘI DUNG &amp; TIN TỨC</span>
              <h2 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">Soạn thảo Bài viết Tin tức &amp; Trang Nội dung</h2>

              <form id="wbAdminNewsEditorForm" style="background:var(--wb-bg-soft);padding:16px;border-radius:12px;margin-bottom:18px;">
                <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Đăng hoặc Cập nhật Bài viết Khu vực Tin tức</h4>
                <div class="wb-grid-3">
                  <div class="wb-form-group">
                    <label class="wb-label">Tiêu đề bài viết <span class="req">*</span></label>
                    <input type="text" class="wb-input" name="title" required placeholder="Nhập tiêu đề bài viết tin tức..." />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Chuyên mục</label>
                    <select class="wb-select" name="category">
                      <option value="cap_nhat_san_pham">Cập nhật sản phẩm</option>
                      <option value="huong_dan">Hướng dẫn sử dụng nền tảng</option>
                      <option value="kinh_nghiem">Kinh nghiệm tự thực hành</option>
                      <option value="cong_dong">Tin tức cộng đồng</option>
                    </select>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Trạng thái xuất bản</label>
                    <select class="wb-select" name="workflow_action">
                      <option value="publish">Xuất bản chính thức</option>
                      <option value="save_draft">Lưu bản nháp</option>
                    </select>
                  </div>
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Tóm tắt bài viết</label>
                  <input type="text" class="wb-input" name="summary" required placeholder="Nhập mô tả ngắn gọn..." />
                </div>
                <div class="wb-form-group">
                  <label class="wb-label">Nội dung chi tiết <span class="req">*</span></label>
                  <textarea class="wb-textarea" name="html_content" rows="3" required placeholder="<p>Nội dung bài viết...</p>"></textarea>
                </div>
                <button type="submit" class="wb-btn wb-btn-primary">Lưu &amp; Cập nhật Bài viết Tin tức</button>
              </form>

              <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">Chỉnh sửa Trang Nội dung Hệ thống</h4>
              <div class="wb-grid-2" style="margin-bottom:12px;">
                <div>
                  <label class="wb-label">Chọn trang nội dung</label>
                  <select class="wb-select" id="wbCmsSlugSelect">
                    ${cmsPages.map(p => `<option value="${p.slug}">${p.title} (Phiên bản ${p.version})</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="wb-label">Tiêu đề hiển thị</label>
                  <input type="text" class="wb-input" id="wbCmsTitleInput" value="${cmsPages[0]?.title || 'Trang chủ WORD BRIDGE'}" />
                </div>
              </div>
              <div id="wbWordEditorCanvas" class="wb-word-canvas" contenteditable="true" style="border-radius:12px;">
                ${cmsPages[0]?.html_content || '<h2>WORD BRIDGE</h2><p>Chỉnh sửa nội dung trực tiếp...</p>'}
              </div>
              <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                <button type="button" class="wb-btn wb-btn-outline wb-cms-save-btn" data-action="save_draft">Lưu bản nháp</button>
                <button type="button" class="wb-btn wb-btn-primary wb-cms-save-btn" data-action="publish">Xuất bản lên Website</button>
              </div>
            </div>

            <!-- 5. QUẢN LÝ EMAIL RESEND, LỊCH SỬ GỬI & THỬ LẠI EMAIL LỖI -->
            <div class="wb-card" style="margin-bottom:20px;">
              <span class="wb-badge wb-badge-teal">QUẢN LÝ EMAIL HỆ THỐNG (RESEND)</span>
              <h2 style="margin:8px 0 8px 0;color:var(--wb-deep-teal);">Phân luồng 04 Địa chỉ Email Chính thức &amp; Hàng đợi Gửi Email</h2>
              <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:12px;">
                • Tự động hệ thống: <strong>noreply@wordbridge.io.vn</strong> |
                • Liên hệ chung: <strong>wordbridge.education@gmail.com</strong> |
                • Chăm sóc khách hàng: <strong>cskh@wordbridge.io.vn</strong> |
                • Hợp tác: <strong>contact@wordbridge.io.vn</strong><br/>
                • Trạng thái kết nối: <em>${emailOverview.provider_status.status_label}</em>
              </div>

              <div style="display:flex;gap:10px;align-items:center;margin-bottom:14px;flex-wrap:wrap;">
                <select class="wb-select" id="wbEmailTemplateSelect" style="flex:1;">
                  ${templates.map(t => `<option value="${t.slug}">Mẫu số ${String(t.template_number).padStart(2, '0')} — ${t.title} (Phản hồi về: ${t.reply_to_address})</option>`).join('')}
                </select>
                <button type="button" class="wb-btn wb-btn-primary" id="wbPreviewEmailBtn">Xem trước Mẫu HTML</button>
              </div>
              <div id="wbEmailPreviewContainer" style="display:none;border:1px solid var(--wb-border);border-radius:10px;padding:12px;background:#F8FAFA;margin-bottom:14px;"></div>

              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Lịch sử Hàng đợi Email Gần đây (${recentQueue.length})</h4>
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Người nhận</th><th>Tiêu đề</th><th>Trạng thái xác nhận</th><th>Số lần thử</th><th>Thao tác</th></tr>
                  </thead>
                  <tbody>
                    ${recentQueue.slice(0, 10).map(eq => `
                      <tr>
                        <td>${eq.to_email}</td>
                        <td><strong>${eq.subject}</strong></td>
                        <td><span class="wb-badge ${eq.status === 'sent' ? 'wb-badge-success' : eq.status === 'failed' ? 'wb-badge-red' : 'wb-badge-ivory'}">${eq.status_vi}</span></td>
                        <td>${eq.retry_count}</td>
                        <td>
                          ${eq.status !== 'sent' ? `<button type="button" class="wb-btn wb-btn-outline wb-retry-email-btn" data-id="${eq.id}" style="padding:4px 8px;font-size:12px;">Gửi lại</button>` : 'Đã xác nhận'}
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>

            <!-- 6. BẢO TRÌ HỆ THỐNG & NHẬT KÝ HOẠT ĐỘNG -->
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">ĐIỀU KHIỂN BẢO TRÌ &amp; NHẬT KÝ HOẠT ĐỘNG</span>
              <h2 style="margin:8px 0 8px 0;color:var(--wb-deep-teal);">Chế độ Vận hành Website &amp; Nhật ký Kiểm toán</h2>
              <form id="wbMaintenanceForm" style="margin-bottom:18px;">
                <div class="wb-grid-3">
                  <div class="wb-form-group">
                    <label class="wb-label">Chế độ vận hành</label>
                    <select class="wb-select" name="mode">
                      <option value="active" ${maint.mode === 'active' ? 'selected' : ''}>Hoạt động bình thường</option>
                      <option value="maintenance_all" ${maint.mode === 'maintenance_all' ? 'selected' : ''}>Bảo trì toàn hệ thống</option>
                      <option value="maintenance_module" ${maint.mode === 'maintenance_module' ? 'selected' : ''}>Bảo trì từng phân hệ</option>
                    </select>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Lý do bảo trì</label>
                    <input type="text" class="wb-input" name="reason" value="${maint.reason || 'Nâng cấp định kỳ hệ thống'}" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Thời gian dự kiến mở lại</label>
                    <input type="text" class="wb-input" name="scheduled_end" value="${maint.scheduled_end || '2026-11-16 06:00'}" />
                  </div>
                </div>
                <button type="submit" class="wb-btn wb-btn-accent">Cập nhật Chế độ Vận hành</button>
              </form>

              <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Nhật ký Hoạt động Hệ thống Gần đây (${auditLogs.length})</h4>
              <div class="wb-table-wrap">
                <table class="wb-table">
                  <thead>
                    <tr><th>Thời gian</th><th>Vai trò thực hiện</th><th>Hành động</th><th>Đối tượng</th></tr>
                  </thead>
                  <tbody>
                    ${auditLogs.slice(0, 10).map(al => `
                      <tr>
                        <td style="font-size:12px;">${(al.created_at || '').slice(0, 19).replace('T', ' ')}</td>
                        <td>${al.actor_role}</td>
                        <td><strong>${al.action}</strong></td>
                        <td>${al.target_type} (${al.target_id})</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>
    `;

    document.getElementById('wbTriggerBackupBtn').onclick = async () => {
      try {
        const res = await WB.api('/api/admin/storage/verify-recovery', { method: 'POST', body: {} });
        WB.toast(`Đã sao lưu cơ sở dữ liệu (${res.database_backup.backup_file}) & kiểm tra toàn vẹn phục hồi thành công!`, 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-admin-reconcile-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/payments/reconcile', {
            method: 'POST',
            body: {
              order_id: btn.getAttribute('data-id'),
              received_amount_vnd: Number(btn.getAttribute('data-amt')),
              received_content: btn.getAttribute('data-cnt'),
              source: 'manual_reconcile'
            }
          });
          WB.toast('Đã xác nhận đối soát thanh toán và kích hoạt đúng gói dịch vụ!', 'success');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-admin-refund-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/payments/refund', {
            method: 'POST',
            body: { order_id: btn.getAttribute('data-id'), reason: 'Hoàn tiền theo đối soát quản trị' }
          });
          WB.toast('Đã hoàn tiền đơn hàng đúng đối tượng hưởng quyền!', 'success');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-admin-approve-org-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/organizations/applications/review', {
            method: 'POST',
            body: { application_id: btn.getAttribute('data-id'), new_status: 'Đã phê duyệt', review_note: 'Hồ sơ hợp lệ' }
          });
          WB.toast('Đã phê duyệt hồ sơ và kích hoạt không gian tổ chức!', 'success');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    root.querySelectorAll('.wb-admin-approve-support-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          await WB.api('/api/admin/support-programs/review', {
            method: 'POST',
            body: { application_id: btn.getAttribute('data-id'), status: 'approved', review_note: 'Đủ điều kiện hỗ trợ' }
          });
          WB.toast('Đã phê duyệt chương trình hỗ trợ!', 'success');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    document.getElementById('wbAdminQuotaForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      const [target_type, target_id] = String(document.getElementById('wbQuotaTargetSelect').value).split(':');
      try {
        const res = await WB.api('/api/admin/storage/quota', {
          method: 'POST',
          body: {
            target_type,
            target_id,
            action: fd.get('action'),
            amount: Number(fd.get('amount') || 0),
            unit: fd.get('unit'),
            reason: fd.get('reason')
          }
        });
        WB.toast(res.warning || `Đã cập nhật hạn mức thành công: ${res.quota.effective_quota_human}!`, res.warning ? 'info' : 'success');
        renderAdminCenter(root, pathname);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbTriggerMonthlyCycleResetBtn').onclick = async () => {
      try {
        const res = await WB.api('/api/admin/storage/cycles/reset', { method: 'POST', body: {} });
        WB.toast(`Đã làm mới bộ đếm chu kỳ tháng (${res.new_cycle_month}) cho ${res.organizations_reset_count} tổ chức; số tệp bị xóa: ${res.files_deleted}!`, 'success');
        renderAdminCenter(root, pathname);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbAdminNewsEditorForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/news', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        e.target.reset();
        WB.toast('Đã lưu và cập nhật bài viết tin tức!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbCmsSlugSelect').onchange = e => {
      const found = cmsPages.find(p => p.slug === e.target.value);
      if (found) {
        document.getElementById('wbCmsTitleInput').value = found.title;
        document.getElementById('wbWordEditorCanvas').innerHTML = found.html_content;
      }
    };

    root.querySelectorAll('.wb-cms-save-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const action = btn.getAttribute('data-action');
          const res = await WB.api('/api/cms/pages', {
            method: 'POST',
            body: {
              slug: document.getElementById('wbCmsSlugSelect').value,
              title: document.getElementById('wbCmsTitleInput').value,
              html_content: document.getElementById('wbWordEditorCanvas').innerHTML,
              workflow_action: action
            }
          });
          WB.toast(`Đã cập nhật nội dung trang "${res.page.title}" (Phiên bản ${res.page.version})!`, 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    document.getElementById('wbPreviewEmailBtn').onclick = async () => {
      const slug = document.getElementById('wbEmailTemplateSelect').value;
      const box = document.getElementById('wbEmailPreviewContainer');
      try {
        const res = await WB.api(`/api/admin/emails/preview?slug=${encodeURIComponent(slug)}`);
        box.style.display = 'block';
        box.innerHTML = `
          <div style="margin-bottom:8px;font-size:13px;">
            <strong>Tiêu đề:</strong> ${res.preview.subject}<br/>
            <strong>Người gửi:</strong> ${res.preview.sender_name} &lt;${res.preview.from_address}&gt; |
            <strong>Địa chỉ phản hồi:</strong> ${res.preview.reply_to_address}
          </div>
          <iframe style="width:100%;height:380px;border:1px solid var(--wb-border);border-radius:8px;background:#FFF;" srcdoc="${res.preview.html.replace(/"/g, '&quot;')}"></iframe>
        `;
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    root.querySelectorAll('.wb-retry-email-btn').forEach(btn => {
      btn.onclick = async () => {
        try {
          const r = await WB.api('/api/admin/emails/retry', { method: 'POST', body: { queue_id: btn.getAttribute('data-id') } });
          WB.toast(`Kết quả thử lại: ${r.status_vi}`, r.sent ? 'success' : 'info');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    document.getElementById('wbMaintenanceForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/admin/maintenance', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã cập nhật trạng thái vận hành hệ thống!', 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  };

  WB.registerView('/quan-tri', renderAdminCenter);
  WB.registerView('/quan-tri/luu-tru', renderAdminCenter);
  WB.registerView('/quan-tri/cms', renderAdminCenter);
  WB.registerView('/quan-tri/email', renderAdminCenter);
  WB.registerView('/quan-tri/bao-tri', renderAdminCenter);
  WB.registerView('*', renderAdminCenter);
})(window.WB);
