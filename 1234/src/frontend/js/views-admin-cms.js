'use strict';

(function (WB) {
  // TRUNG TÂM QUẢN TRỊ TOÀN WEBSITE (/quan-tri), QUẢN LÝ LƯU TRỮ & HẠN MỨC (/quan-tri/luu-tru - PHỤ LỤC A),
  // CMS WORD (/quan-tri/cms), EMAIL CENTER (/quan-tri/email) & BẢO TRÌ (/quan-tri/bao-tri)
  const renderAdminCenter = async function (root, pathname) {
    if (!WB.state.user) {
      WB.toast('Vui lòng đăng nhập tài khoản Quản trị viên để truy cập Trung tâm quản trị (/quan-tri).');
      return WB.navigate('/dang-nhap');
    }

    let dash = null;
    let storageDash = null;
    let emailOverview = null;
    let cmsPages = [];
    try {
      dash = await WB.api('/api/admin/dashboard');
      storageDash = await WB.api('/api/admin/storage/dashboard');
      emailOverview = await WB.api('/api/admin/emails');
      const cmsRes = await WB.api('/api/cms/pages');
      cmsPages = cmsRes.pages || [];
    } catch (err) {
      root.innerHTML = `
        <div class="wb-container wb-section">
          <div class="wb-card">
            <span class="wb-badge wb-badge-red">KIỂM SOÁT PHÂN QUYỀN RBAC BACKEND (PHẦN 24.9)</span>
            <h2 style="color:var(--wb-vermilion);margin:10px 0;">Từ chối Truy cập Trung tâm Quản trị</h2>
            <p>${err.message}</p>
            <a href="/" class="wb-btn wb-btn-primary" data-nav="/">Quay về Trang chủ</a>
          </div>
        </div>
      `;
      return;
    }

    const m = dash.metrics;
    const maint = dash.maintenance;
    const templates = emailOverview.templates || [];
    const infra = storageDash.infrastructure_overview;
    const accounts = storageDash.account_quotas || [];
    const cycles = storageDash.monthly_cycles || { active_organization_cycles: [], historical_cycles: [] };
    const alerts = storageDash.alerts || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-workspace-layout">
          <aside class="wb-sidebar">
            <div style="font-weight:800;color:var(--wb-deep-teal);margin-bottom:10px;">TRUNG TÂM QUẢN TRỊ</div>
            <ul class="wb-sidebar-menu">
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri' ? 'active' : ''}" data-nav="/quan-tri">📊 Dashboard Số liệu Thực</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/luu-tru' ? 'active' : ''}" data-nav="/quan-tri/luu-tru">🗄️ Lưu trữ & Hạn mức (Phụ lục A)</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/cms' ? 'active' : ''}" data-nav="/quan-tri/cms">📝 WORD BRIDGE CMS (Word)</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/email' ? 'active' : ''}" data-nav="/quan-tri/email">✉️ Quản lý 29 Mẫu Email</a></li>
              <li><a class="wb-sidebar-link ${pathname === '/quan-tri/bao-tri' ? 'active' : ''}" data-nav="/quan-tri/bao-tri">🛠️ Bảo trì Đóng/Mở Web</a></li>
            </ul>
          </aside>

          <div>
            <!-- 1. Dashboard Số liệu Thực 100% (PHẦN 24.1) -->
            <div class="wb-card" style="margin-bottom:20px;">
              <div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div>
                  <span class="wb-badge wb-badge-teal">TRUNG TÂM ĐIỀU HÀNH DUY NHẤT (/quan-tri)</span>
                  <h1 style="margin:6px 0 0 0;color:var(--wb-deep-teal);">Quản trị Toàn Hệ sinh thái WORD BRIDGE</h1>
                </div>
                <div style="display:flex;gap:8px;">
                  <button type="button" class="wb-btn wb-btn-outline" id="wbTriggerBackupBtn">💾 Sao lưu & Kiểm tra Phục hồi</button>
                </div>
              </div>
              <div class="wb-grid-4" style="margin-top:16px;">
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Tổng tài khoản / Cá nhân</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.total_accounts} / ${m.personal_members}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Tổ chức duyệt / Chờ duyệt</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.organizations_approved} / ${m.org_applications_pending}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Bài thực hành / Lượt làm</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-deep-teal);">${m.practice_exercises_total} / ${m.practice_attempts_total}</div>
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Kỳ thi / Phiên thi / 29 Email</div>
                  <div style="font-size:22px;font-weight:800;color:var(--wb-vermilion);">${m.exams_total} / ${m.exam_sessions_total} / ${m.email_templates_count}</div>
                </div>
              </div>
            </div>

            <!-- 2. DASHBOARD HẠ TẦNG DATABASE, STORAGE & QUẢN LÝ HẠN MỨC (/quan-tri/luu-tru - PHỤ LỤC A) -->
            <div class="wb-card" style="margin-bottom:20px;border-top:4px solid var(--wb-deep-teal);">
              <span class="wb-badge wb-badge-red">PHỤ LỤC A – HẠ TẦNG DATABASE/STORAGE ĐỘC LẬP & QUẢN LÝ HẠN MỨC (/quan-tri/luu-tru)</span>
              <h2 style="margin:8px 0 6px 0;color:var(--wb-deep-teal);">Quản lý Hạ tầng Lưu trữ Riêng, Hạn mức (GB/TB) & Chu kỳ Tháng</h2>
              <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 14px 0;">
                • <strong>Hạ tầng độc lập (A1):</strong> ${infra.database_engine} & ${infra.storage_engine} (Không dùng Cloudflare D1/R2).<br/>
                • <strong>Nguyên tắc hạn mức (A2 & A3):</strong> Không đặt giới hạn GB cố định chung cho toàn website. Mặc định theo gói: <strong>Personal Free 1 GB</strong>, <strong>Personal Plus 5 GB</strong>, <strong>Organization Plus Tháng 50 GB/tháng</strong>, <strong>Organization Plus Năm 120 GB/tháng</strong> (Tối đa 30 thành viên, tính chung cho tổ chức, không nhân theo số thành viên).
              </p>

              <!-- A8.1 Tổng quan hạ tầng -->
              <div class="wb-grid-4" style="margin-bottom:16px;">
                <div style="background:var(--wb-bg-mint);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Dung lượng Máy chủ Cấp phát</div>
                  <div style="font-size:18px;font-weight:800;color:var(--wb-deep-teal);">${(infra.provisioned_server_bytes / (1024 ** 4)).toFixed(2)} TB</div>
                </div>
                <div style="background:var(--wb-bg-mint);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Thực tế Đang Lưu trữ</div>
                  <div style="font-size:18px;font-weight:800;color:var(--wb-vermilion);">${(infra.actual_stored_bytes / (1024 ** 3)).toFixed(3)} GB</div>
                </div>
                <div style="background:var(--wb-bg-mint);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Dung lượng Khả dụng</div>
                  <div style="font-size:18px;font-weight:800;color:var(--wb-deep-teal);">${(infra.available_server_bytes / (1024 ** 4)).toFixed(2)} TB</div>
                </div>
                <div style="background:var(--wb-bg-mint);padding:12px;border-radius:10px;">
                  <div style="font-size:12px;color:var(--wb-text-muted);">Mở rộng Hạ tầng & Chu kỳ</div>
                  <div style="font-size:14px;font-weight:800;color:var(--wb-success);">Sẵn sàng • Asia/Ho_Chi_Minh</div>
                </div>
              </div>

              
              <!-- Cài đặt nhanh MONTHLY_QUOTA_GB tại máy chủ & R2/D1 Binding -->
              <div style="background:#FFFDF7;padding:14px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:16px;display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;">
                <div style="font-size:13px;">
                  <strong>⚡ Cấu hình Hạn mức Tháng Mặc định tại Máy chủ (<code>MONTHLY_QUOTA_GB</code>):</strong>
                  Đang áp dụng <strong>${dash.integrations.infrastructure.monthly_quota_gb || 50} GB / tháng</strong> •
                  D1 Database: <code>word (ce84cc48-6d49-409b-b45a-13ba3bc4a771)</code> • R2 Bucket: <code>word</code>
                </div>
                <form id="wbServerMonthlyQuotaForm" style="display:flex;gap:8px;align-items:center;">
                  <input type="number" class="wb-input" name="monthly_quota_gb" value="${dash.integrations.infrastructure.monthly_quota_gb || 50}" min="1" style="width:110px;" required />
                  <button type="submit" class="wb-btn wb-btn-accent">Cập nhật MONTHLY_QUOTA_GB</button>
                </form>
              </div>

              <!-- A5. Form Admin điều chỉnh hạn mức riêng (GB / TB / Không giới hạn / Gỡ cấu hình riêng) -->
              <div style="background:var(--wb-bg-soft);padding:16px;border-radius:12px;margin-bottom:16px;">
                <h4 style="margin:0 0 10px 0;color:var(--wb-deep-teal);">⚙️ Điều chỉnh Hạn mức Riêng cho Tài khoản Cá nhân hoặc Tổ chức (Ưu tiên cao hơn mặc định gói)</h4>
                <form id="wbAdminQuotaForm">
                  <div class="wb-grid-4">
                    <div class="wb-form-group">
                      <label class="wb-label">Chọn Tài khoản / Tổ chức</label>
                      <select class="wb-select" id="wbQuotaTargetSelect" required>
                        ${accounts.map(a => `<option value="${a.target_type}:${a.target_id}">[${a.target_type === 'organization' ? 'TỔ CHỨC' : 'CÁ NHÂN'}] ${a.display_name} — Gói: ${a.plan_code}</option>`).join('')}
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Thao tác Điều chỉnh</label>
                      <select class="wb-select" name="action" id="wbQuotaActionSelect">
                        <option value="set_custom">Đặt hạn mức riêng</option>
                        <option value="increase">Tăng thêm hạn mức (+)</option>
                        <option value="decrease">Giảm hạn mức (-)</option>
                        <option value="set_unlimited">Chuyển sang Không giới hạn</option>
                        <option value="remove_custom">Gỡ hạn mức riêng (Về mặc định gói)</option>
                      </select>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Mức dung lượng & Đơn vị (GB / TB)</label>
                      <div style="display:flex;gap:6px;">
                        <input type="number" class="wb-input" name="amount" value="100" min="1" step="1" />
                        <select class="wb-select" name="unit" style="width:90px;">
                          <option value="GB">GB</option>
                          <option value="TB">TB</option>
                        </select>
                      </div>
                    </div>
                    <div class="wb-form-group">
                      <label class="wb-label">Lý do ghi Audit Log</label>
                      <input type="text" class="wb-input" name="reason" value="Admin điều chỉnh hạn mức tại /quan-tri/luu-tru" required />
                    </div>
                  </div>
                  <div style="display:flex;gap:10px;flex-wrap:wrap;">
                    <button type="submit" class="wb-btn wb-btn-primary">Áp dụng Cấu hình Hạn mức</button>
                    <button type="button" class="wb-btn wb-btn-outline" id="wbTriggerMonthlyCycleResetBtn">
                      🔄 Chạy Làm mới Bộ đếm Chu kỳ Tháng Tổ chức (Ngày 01 Asia/Ho_Chi_Minh – Không xóa dữ liệu)
                    </button>
                  </div>
                </form>
              </div>

              <!-- A8.2 Bảng Quản lý Hạn mức Tài khoản Cá nhân & Tổ chức -->
              <div class="wb-table-wrap" style="margin-bottom:14px;">
                <table class="wb-table">
                  <thead>
                    <tr>
                      <th>Loại</th>
                      <th>Tài khoản / Tổ chức</th>
                      <th>Gói dịch vụ</th>
                      <th>Hạn mức Mặc định</th>
                      <th>Hạn mức Admin đặt</th>
                      <th>Hạn mức Hiệu lực</th>
                      <th>Đang sử dụng</th>
                      <th>Trạng thái Giới hạn</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${accounts.map(a => `
                      <tr>
                        <td><span class="wb-badge ${a.target_type === 'organization' ? 'wb-badge-red' : 'wb-badge-teal'}">${a.target_type === 'organization' ? 'Tổ chức' : 'Cá nhân'}</span></td>
                        <td><strong>${a.display_name}</strong></td>
                        <td>${a.plan_code}</td>
                        <td>${a.default_quota_human}${a.is_monthly_cycle ? '/tháng' : ''}</td>
                        <td>${a.is_unlimited ? '<strong>Không giới hạn</strong>' : (a.admin_custom_quota_human || '—')}</td>
                        <td><strong>${a.effective_quota_human}${a.is_monthly_cycle && !a.is_unlimited ? '/tháng' : ''}</strong> (${a.priority_source})</td>
                        <td>${a.metered_used_human} (${a.usage_percent}%)</td>
                        <td>
                          <span class="wb-badge ${a.over_quota_blocked ? 'wb-badge-red' : 'wb-badge-success'}">
                            ${a.over_quota_blocked ? 'Đã đạt/vượt hạn mức (Ngăn tải mới, giữ nguyên đọc/tải xuống)' : 'Hoạt động bình thường'}
                          </span>
                        </td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>

              <!-- A8.3 & A8.4 Cảnh báo & Lịch sử Chu kỳ Tháng -->
              <div class="wb-grid-2">
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;font-size:13px;">
                  <strong>🔔 Cảnh báo Hạn mức & Hạ tầng (${alerts.length}):</strong>
                  ${alerts.length === 0 ? `<div style="color:var(--wb-text-muted);margin-top:4px;">Không có cảnh báo vượt hạn mức hoặc sự cố máy chủ.</div>` : `
                    <ul style="margin:6px 0 0 0;padding-left:18px;">
                      ${alerts.map(al => `<li>${al.message}</li>`).join('')}
                    </ul>
                  `}
                </div>
                <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;font-size:13px;">
                  <strong>📅 Lịch sử Làm mới Chu kỳ Tháng Tổ chức (${cycles.historical_cycles.length}):</strong>
                  ${cycles.historical_cycles.length === 0 ? `<div style="color:var(--wb-text-muted);margin-top:4px;">Trạng thái tác vụ tự động: ${cycles.automated_job_status}</div>` : `
                    <ul style="margin:6px 0 0 0;padding-left:18px;">
                      ${cycles.historical_cycles.slice(0, 5).map(c => `<li>Tổ chức ${c.org_id} • Chu kỳ ${c.cycle_month} • Đã chốt: ${c.closing_cycle_used_bytes} B • Bảo toàn: ${c.total_persistent_stored_bytes} B</li>`).join('')}
                    </ul>
                  `}
                </div>
              </div>
            </div>

            <!-- 3. WORD BRIDGE CMS – Trình soạn thảo trực quan dạng Microsoft Word (/quan-tri/cms - PHẦN 25) -->
            <div class="wb-card" style="margin-bottom:20px;">
              <span class="wb-badge wb-badge-teal">WORD BRIDGE CMS – TRÌNH SOẠN THẢO DẠNG MICROSOFT WORD (/quan-tri/cms)</span>
              <h2 style="margin:8px 0 12px 0;color:var(--wb-deep-teal);">Soạn thảo & Chỉnh sửa Nội dung Website Trực quan</h2>
              <div class="wb-grid-2" style="margin-bottom:12px;">
                <div>
                  <label class="wb-label">Chọn trang cần chỉnh sửa</label>
                  <select class="wb-select" id="wbCmsSlugSelect">
                    ${cmsPages.map(p => `<option value="${p.slug}">${p.slug} — ${p.title} (v${p.version} • ${p.status})</option>`).join('')}
                  </select>
                </div>
                <div>
                  <label class="wb-label">Tiêu đề trang & SEO</label>
                  <input type="text" class="wb-input" id="wbCmsTitleInput" value="${cmsPages[0]?.title || 'Trang chủ WORD BRIDGE'}" />
                </div>
              </div>

              <!-- Thanh công cụ Ribbon chuẩn Microsoft Word (Đầy đủ 24 công cụ - PHẦN 25.1) -->
              <div class="wb-word-ribbon" role="toolbar" aria-label="Thanh công cụ soạn thảo WORD BRIDGE CMS">
                <select class="wb-word-btn" id="wbWordBlockCmd">
                  <option value="P">Đoạn văn</option>
                  <option value="H1">Tiêu đề H1</option>
                  <option value="H2">Tiêu đề H2</option>
                  <option value="H3">Tiêu đề H3</option>
                </select>
                <select class="wb-word-btn" id="wbWordFontCmd">
                  <option value="Be Vietnam Pro">Be Vietnam Pro</option>
                  <option value="Times New Roman">Times New Roman</option>
                  <option value="Segoe UI">Segoe UI</option>
                </select>
                <button type="button" class="wb-word-btn" data-cmd="bold"><b>B In đậm</b></button>
                <button type="button" class="wb-word-btn" data-cmd="italic"><i>I In nghiêng</i></button>
                <button type="button" class="wb-word-btn" data-cmd="underline"><u>U Gạch chân</u></button>
                <button type="button" class="wb-word-btn" data-cmd="justifyLeft">Căn trái</button>
                <button type="button" class="wb-word-btn" data-cmd="justifyCenter">Căn giữa</button>
                <button type="button" class="wb-word-btn" data-cmd="justifyRight">Căn phải</button>
                <button type="button" class="wb-word-btn" data-cmd="justifyFull">Căn đều</button>
                <button type="button" class="wb-word-btn" data-cmd="insertUnorderedList">• Danh sách</button>
                <button type="button" class="wb-word-btn" data-cmd="insertOrderedList">1. Đánh số</button>
                <button type="button" class="wb-word-btn" data-cmd="indent">→ Thụt lề</button>
                <button type="button" class="wb-word-btn" data-cmd="outdent">← Giảm lề</button>
                <button type="button" class="wb-word-btn" data-cmd="insertHorizontalRule">― Phân cách</button>
                <button type="button" class="wb-word-btn" id="wbWordInsertTableBtn">⊞ Chèn bảng</button>
                <button type="button" class="wb-word-btn" data-cmd="undo">↶ Hoàn tác</button>
                <button type="button" class="wb-word-btn" data-cmd="redo">↷ Làm lại</button>
                <button type="button" class="wb-word-btn" data-cmd="removeFormat">✕ Xóa định dạng</button>
              </div>
              <div id="wbWordEditorCanvas" class="wb-word-canvas" contenteditable="true">
                ${cmsPages[0]?.html_content || '<h2>WORD BRIDGE</h2><p>Chỉnh sửa nội dung trực tiếp...</p>'}
              </div>
              <div style="display:flex;gap:10px;margin-top:12px;flex-wrap:wrap;">
                <button type="button" class="wb-btn wb-btn-outline wb-cms-save-btn" data-action="save_draft">💾 Lưu nháp</button>
                <button type="button" class="wb-btn wb-btn-outline wb-cms-save-btn" data-action="submit_review">📋 Gửi duyệt</button>
                <button type="button" class="wb-btn wb-btn-primary wb-cms-save-btn" data-action="publish">🚀 Xuất bản lên Website</button>
                <button type="button" class="wb-btn wb-btn-danger wb-cms-save-btn" data-action="unpublish">⏸ Gỡ xuất bản</button>
              </div>
            </div>

            <!-- 4. Email Management Center & Xem trước 29 Mẫu Email HTML Độc lập (/quan-tri/email - PHẦN 21) -->
            <div class="wb-card" style="margin-bottom:20px;">
              <span class="wb-badge wb-badge-teal">EMAIL MANAGEMENT CENTER – /quan-tri/email (29 MẪU ĐỘC LẬP)</span>
              <h2 style="margin:8px 0 8px 0;color:var(--wb-deep-teal);">Quản lý 04 Địa chỉ Email Chính thức & 29 Mẫu Email HTML</h2>
              <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:12px;">
                • Tự động hệ thống: <strong>noreply@wordbridge.io.vn</strong> |
                • Liên hệ chính: <strong>wordbridge.education@gmail.com</strong> |
                • CSKH: <strong>cskh@wordbridge.io.vn</strong> |
                • Hợp tác: <strong>contact@wordbridge.io.vn</strong><br/>
                • Trạng thái tích hợp: <em>${emailOverview.provider_status.status_label}</em>
              </div>
              <div style="display:flex;gap:10px;align-items:center;margin-bottom:12px;flex-wrap:wrap;">
                <select class="wb-select" id="wbEmailTemplateSelect" style="flex:1;">
                  ${templates.map(t => `<option value="${t.slug}">#${String(t.template_number).padStart(2, '0')} — ${t.slug} (${t.title} • Reply-To: ${t.reply_to_address})</option>`).join('')}
                </select>
                <button type="button" class="wb-btn wb-btn-primary" id="wbPreviewEmailBtn">👁️ Xem trước Mẫu Email</button>
              </div>
              <div id="wbEmailPreviewContainer" style="display:none;border:1px solid var(--wb-border);border-radius:10px;padding:12px;background:#F8FAFA;"></div>
            </div>

            <!-- 5. Trung tâm Bảo trì & Điều khiển Đóng/Mở Website (/quan-tri/bao-tri - PHẦN 26) -->
            <div class="wb-card">
              <span class="wb-badge wb-badge-red">TRUNG TÂM BẢO TRÌ & ĐIỀU KHIỂN ĐÓNG/MỞ WEBSITE (/quan-tri/bao-tri)</span>
              <h2 style="margin:8px 0 8px 0;color:var(--wb-deep-teal);">Điều khiển Trạng thái Vận hành Website An toàn</h2>
              <form id="wbMaintenanceForm">
                <div class="wb-grid-3">
                  <div class="wb-form-group">
                    <label class="wb-label">Chế độ vận hành</label>
                    <select class="wb-select" name="mode">
                      <option value="active" ${maint.mode === 'active' ? 'selected' : ''}>Website hoạt động bình thường</option>
                      <option value="maintenance_all" ${maint.mode === 'maintenance_all' ? 'selected' : ''}>Bảo trì toàn website</option>
                      <option value="maintenance_module" ${maint.mode === 'maintenance_module' ? 'selected' : ''}>Bảo trì một phân hệ</option>
                      <option value="suspended" ${maint.mode === 'suspended' ? 'selected' : ''}>Website tạm ngưng dịch vụ</option>
                      <option value="emergency" ${maint.mode === 'emergency' ? 'selected' : ''}>Bảo trì khẩn cấp</option>
                    </select>
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Số ngày thông báo trước (Mặc định 03 ngày)</label>
                    <input type="number" class="wb-input" name="advance_notice_days" value="${maint.advance_notice_days || 3}" min="0" max="30" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Thời gian dự kiến mở lại</label>
                    <input type="text" class="wb-input" name="scheduled_end" value="${maint.scheduled_end || '2026-11-16 06:00'}" />
                  </div>
                </div>
                <div class="wb-grid-2">
                  <div class="wb-form-group">
                    <label class="wb-label">Tên đợt bảo trì & Lý do</label>
                    <input type="text" class="wb-input" name="reason" value="${maint.reason || 'Nâng cấp định kỳ hệ thống'}" />
                  </div>
                  <div class="wb-form-group">
                    <label class="wb-label">Người phụ trách</label>
                    <input type="text" class="wb-input" name="responsible_person" value="${maint.responsible_person || 'Bùi Tấn Lộc – Ban Quản trị Kỹ thuật'}" />
                  </div>
                </div>
                <button type="submit" class="wb-btn wb-btn-accent">Cập nhật Trạng thái Bảo trì</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    `;

    // Sao lưu Database & Kiểm tra phục hồi
    document.getElementById('wbTriggerBackupBtn').onclick = async () => {
      try {
        const res = await WB.api('/api/admin/storage/verify-recovery', { method: 'POST', body: {} });
        WB.toast(`Đã sao lưu Database (${res.database_backup.backup_file}) & kiểm tra phục hồi: ${res.database_recovery_verified.integrity_status.toUpperCase()}!`, 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    
    const srvQuotaForm = document.getElementById('wbServerMonthlyQuotaForm');
    if (srvQuotaForm) {
      srvQuotaForm.onsubmit = async e => {
        e.preventDefault();
        const fd = new FormData(srvQuotaForm);
        try {
          const res = await WB.api('/api/admin/storage/monthly-quota-config', {
            method: 'POST',
            body: { monthly_quota_gb: Number(fd.get('monthly_quota_gb')) }
          });
          WB.toast(`Đã cập nhật MONTHLY_QUOTA_GB tại máy chủ thành ${res.monthly_quota_gb} GB/tháng!`, 'success');
          renderAdminCenter(root, pathname);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }

    // Điều chỉnh hạn mức tại /quan-tri/luu-tru
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

    // Làm mới bộ đếm chu kỳ tháng cho các tổ chức
    document.getElementById('wbTriggerMonthlyCycleResetBtn').onclick = async () => {
      try {
        const res = await WB.api('/api/admin/storage/cycles/reset', { method: 'POST', body: {} });
        WB.toast(`Đã làm mới bộ đếm chu kỳ tháng (${res.new_cycle_month}) cho ${res.organizations_reset_count} tổ chức; số tệp bị xóa: ${res.files_deleted}!`, 'success');
        renderAdminCenter(root, pathname);
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    // Các nút trên thanh công cụ CMS Word
    root.querySelectorAll('.wb-word-btn[data-cmd]').forEach(btn => {
      btn.onclick = () => document.execCommand(btn.getAttribute('data-cmd'), false, null);
    });
    document.getElementById('wbWordBlockCmd').onchange = e => document.execCommand('formatBlock', false, e.target.value);
    document.getElementById('wbWordFontCmd').onchange = e => document.execCommand('fontName', false, e.target.value);
    document.getElementById('wbWordInsertTableBtn').onclick = () => {
      const editor = document.getElementById('wbWordEditorCanvas');
      editor.innerHTML += `<table class="wb-table" style="margin:10px 0;"><thead><tr><th>Cột 1</th><th>Cột 2</th></tr></thead><tbody><tr><td>Nội dung 1</td><td>Nội dung 2</td></tr></tbody></table>`;
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
          WB.toast(`Đã thực hiện [${action}] cho trang ${res.page.slug} (Phiên bản v${res.page.version})!`, 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    // Xem trước 29 mẫu Email HTML độc lập
    document.getElementById('wbPreviewEmailBtn').onclick = async () => {
      const slug = document.getElementById('wbEmailTemplateSelect').value;
      const box = document.getElementById('wbEmailPreviewContainer');
      try {
        const res = await WB.api(`/api/admin/emails/preview?slug=${encodeURIComponent(slug)}`);
        box.style.display = 'block';
        box.innerHTML = `
          <div style="margin-bottom:8px;font-size:13px;">
            <strong>Tiêu đề:</strong> ${res.preview.subject}<br/>
            <strong>From:</strong> ${res.preview.sender_name} &lt;${res.preview.from_address}&gt; |
            <strong>Reply-To:</strong> ${res.preview.reply_to_address}
          </div>
          <iframe style="width:100%;height:420px;border:1px solid var(--wb-border);border-radius:8px;background:#FFF;" srcdoc="${res.preview.html.replace(/"/g, '&quot;')}"></iframe>
        `;
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    // Lưu cấu hình Bảo trì
    document.getElementById('wbMaintenanceForm').onsubmit = async e => {
      e.preventDefault();
      const fd = new FormData(e.target);
      try {
        const res = await WB.api('/api/admin/maintenance', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast(`Đã cập nhật chế độ vận hành website: ${res.maintenance.mode}`, 'success');
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
