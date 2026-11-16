'use strict';

(function (WB) {
  // 1. GÓI DỊCH VỤ, THANH TOÁN QR THỦ CÔNG & LỊCH SỬ GIAO DỊCH (/dich-vu, /goi-dich-vu, /thanh-toan, /thanh-toan/lich-su, /hoa-don - PHẦN XV & XIX)
  const renderCommerceAndPayment = async function (root, pathname) {
    const cat = await WB.api('/api/commerce/catalog');
    const plans = cat.plans || [];
    const addons = cat.addons || [];
    const supportPrograms = cat.support_programs || [];
    let myOrgs = [];
    let txHistory = { orders: [], invoices: [] };

    if (WB.state.user) {
      try {
        const sp = await WB.api('/api/organizations/my-space');
        myOrgs = (sp.my_space?.organizations || []).filter(o => o.can_manage_org);
        txHistory = await WB.api('/api/payments/orders');
      } catch (_) {}
    }

    const translateTargetType = (t) => t === 'organization' ? 'Gói dành cho Tổ chức' : 'Gói dành cho Cá nhân';
    const translateOrderStatus = (st) => {
      const m = {
        pending: 'Đang chờ đối soát',
        paid: 'Đã thanh toán & Kích hoạt',
        refunded: 'Đã hoàn tiền',
        underpaid: 'Thanh toán thiếu',
        wrong_content: 'Sai nội dung chuyển khoản',
        expired: 'Đã hết hạn'
      };
      return m[st] || st;
    };

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">GÓI THÀNH VIÊN, CHƯƠNG TRÌNH HỖ TRỢ &amp; THANH TOÁN ĐỐI SOÁT</span>
          <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">
            ${pathname.startsWith('/thanh-toan') ? 'Thanh toán Chuyển khoản Thủ công &amp; Đối soát QR' : pathname === '/hoa-don' ? 'Tra cứu Hóa đơn Dịch vụ' : 'Bảng giá Gói Thành viên &amp; Chính sách Hỗ trợ'}
          </h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
            Giữ nguyên bảng giá và hạn mức dung lượng chuẩn: Người Dùng bản Miễn Phí (0 đồng – 1 GB), Người Dùng bản Plus Tháng (129.000 đồng/tháng – 5 GB), Người Dùng bản Plus Năm (1.000.000 đồng/năm – 5 GB), Tổ Chức Plus Tháng (350.000 đồng/tháng – 50 GB/tổ chức/tháng), Tổ Chức Plus Năm (3.500.000 đồng/năm – 120 GB/tổ chức/tháng).
          </p>
        </div>

        ${myOrgs.length > 0 ? `
          <div class="wb-card" style="margin-bottom:18px;background:var(--wb-bg-soft);">
            <label class="wb-label" style="margin-bottom:6px;">Chọn Tổ chức nhận quyền lợi khi đăng ký Gói Tổ Chức Plus:</label>
            <select class="wb-select" id="wbBuyerOrgSelect" style="max-width:460px;">
              ${myOrgs.map(o => `<option value="${o.org_id}">${o.org_name} (${o.short_name})</option>`).join('')}
            </select>
          </div>
        ` : ''}

        <!-- Bảng giá 05 Gói Dịch vụ bằng tiếng Việt 100% -->
        <h2 class="wb-section-title">Bảng Giá Tiêu Chuẩn Cá Nhân &amp; Tổ Chức</h2>
        <div class="wb-grid-3" style="margin-bottom:24px;">
          ${plans.map(p => `
            <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <span class="wb-badge ${p.target_type === 'organization' ? 'wb-badge-red' : 'wb-badge-teal'}">${translateTargetType(p.target_type)}</span>
                <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">${p.name}</h3>
                <div style="font-size:26px;font-weight:800;color:var(--wb-vermilion);margin-bottom:10px;">
                  ${Number(p.price_vnd).toLocaleString('vi-VN')} đồng${p.billing_cycle === 'monthly' ? '/tháng' : p.billing_cycle === 'yearly' ? '/năm' : ''}
                </div>
                <ul style="font-size:13px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 14px 0;">
                  ${(p.features || []).map(f => `<li style="margin-bottom:4px;">${f}</li>`).join('')}
                </ul>
              </div>
              ${p.price_vnd > 0 ? `
                <button type="button" class="wb-btn wb-btn-primary wb-create-order-btn" data-plan="${p.code}" data-target="${p.target_type}">
                  Chọn gói &amp; Tạo đơn chuyển khoản QR
                </button>
              ` : `<span class="wb-badge wb-badge-success" style="text-align:center;padding:10px;">Gói Mặc định Miễn phí</span>`}
            </div>
          `).join('')}
        </div>

        <!-- Khu vực hiển thị Đơn hàng QR vừa khởi tạo -->
        <div id="wbActiveOrderQrBox" style="display:none;margin-bottom:24px;" class="wb-card"></div>

        <!-- 04 Chương trình Hỗ trợ Chính thức & Lịch sử Giao dịch -->
        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Bốn Chương trình Hỗ trợ Cộng đồng &amp; Sinh viên</h3>
            <ul style="font-size:13px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 14px 0;">
              ${supportPrograms.map(sp => `<li style="margin-bottom:6px;"><strong>${sp.name}:</strong> ${sp.condition}</li>`).join('')}
            </ul>
            <form id="wbSupportProgramForm">
              <div class="wb-form-group">
                <label class="wb-label">Chọn Chương trình Hỗ trợ <span class="req">*</span></label>
                <select class="wb-select" name="program_type" required>
                  <option value="student_plus">Sinh viên: Miễn phí 03 tháng Người Dùng bản Plus (Chỉ xác minh qua email sinh viên trường cấp)</option>
                  <option value="community_access">Hỗ Trợ Cộng Đồng: Xét duyệt theo kỳ 03 tháng</option>
                  <option value="nonprofit_30">Tổ chức Phi lợi nhuận: Giảm 30% khi đủ điều kiện</option>
                  <option value="hardship_support">Hỗ trợ người có hoàn cảnh khó khăn</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Email sinh viên do trường cấp (Bắt buộc với chương trình Sinh viên, không thay bằng thẻ sinh viên)</label>
                <input type="email" class="wb-input" name="student_edu_email" placeholder="sinhvien@ten-truong.edu.vn" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Thuyết minh hồ sơ đăng ký hỗ trợ</label>
                <textarea class="wb-textarea" name="reason" rows="2" required placeholder="Trình bày mục tiêu học tập hoặc hoạt động cộng đồng..."></textarea>
              </div>
              <button type="submit" class="wb-btn wb-btn-accent">Gửi Hồ sơ Xét duyệt Hỗ trợ</button>
            </form>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Lịch sử Đơn hàng &amp; Giao dịch của tôi (${(txHistory.orders || []).length})</h3>
            ${(txHistory.orders || []).length === 0 ? `
              <p style="font-size:13.5px;color:var(--wb-text-muted);">Chưa có giao dịch nào.</p>
            ` : `
              <div class="wb-table-wrap" style="margin-bottom:16px;">
                <table class="wb-table">
                  <thead>
                    <tr><th>Mã đơn</th><th>Gói đăng ký</th><th>Số tiền</th><th>Trạng thái</th></tr>
                  </thead>
                  <tbody>
                    ${txHistory.orders.map(o => `
                      <tr>
                        <td><strong>${o.order_code}</strong></td>
                        <td>${o.plan_code} ${o.org_id ? '(Tổ chức)' : '(Cá nhân)'}</td>
                        <td>${Number(o.final_amount_vnd).toLocaleString('vi-VN')} đ</td>
                        <td><span class="wb-badge ${o.status === 'paid' ? 'wb-badge-success' : 'wb-badge-ivory'}">${translateOrderStatus(o.status)}</span></td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            `}

            <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">06 Nhóm Tiện ích Mở rộng Tổ chức</h4>
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead>
                  <tr><th>STT</th><th>Tên nhóm tiện ích</th><th>Mức phí tham chiếu</th></tr>
                </thead>
                <tbody>
                  ${addons.map(a => `
                    <tr>
                      <td>0${a.number}</td>
                      <td><strong>${a.name}</strong></td>
                      <td>${Number(a.base_price_vnd).toLocaleString('vi-VN')} đồng</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-create-order-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập để tạo đơn thanh toán.');
          return WB.navigate('/dang-nhap');
        }
        const planCode = btn.getAttribute('data-plan');
        const targetType = btn.getAttribute('data-target');
        const orgSel = document.getElementById('wbBuyerOrgSelect');
        const orgId = targetType === 'organization' && orgSel ? orgSel.value : null;

        try {
          const res = await WB.api('/api/payments/orders', {
            method: 'POST',
            body: { plan_code: planCode, org_id: orgId }
          });
          const ord = res.order;
          const box = document.getElementById('wbActiveOrderQrBox');
          box.style.display = 'block';
          box.innerHTML = `
            <span class="wb-badge wb-badge-red">ĐƠN HÀNG CHUYỂN KHOẢN THỦ CÔNG • CHỜ ĐỐI SOÁT</span>
            <h3 style="margin:8px 0;color:var(--wb-deep-teal);">Mã đơn hàng: ${ord.order_code} • Mã giao dịch: ${ord.transaction_code}</h3>
            <div class="wb-grid-2">
              <div>
                <p style="margin:4px 0;"><strong>Số tiền cần chuyển khoản:</strong> <span style="color:var(--wb-vermilion);font-weight:800;">${Number(ord.final_amount_vnd).toLocaleString('vi-VN')} đồng</span></p>
                <p style="margin:4px 0;"><strong>Nội dung chuyển khoản bắt buộc:</strong> <strong style="background:var(--wb-bg-mint);padding:4px 8px;border-radius:6px;">${ord.transfer_content}</strong></p>
                <p style="margin:4px 0;font-size:13px;color:var(--wb-text-muted);">Thời hạn thanh toán: ${ord.expires_at.slice(0, 16).replace('T', ' ')}</p>
                <button type="button" class="wb-btn wb-btn-outline" id="wbNotifyTransferBtn" data-id="${ord.id}" style="margin-top:10px;">
                  Gửi Thông tin Đã chuyển khoản (Chuyển sang Chờ đối soát)
                </button>
              </div>
              <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;font-size:13px;">
                <strong>Hướng dẫn đối soát:</strong>
                <p style="margin:6px 0 0 0;color:var(--wb-text-muted);">
                  Quét mã QR hoặc chuyển khoản đúng số tiền và nội dung chuyển khoản. Sau khi bạn gửi thông tin giao dịch, Quản trị viên sẽ kiểm tra giao dịch thực tế và xác nhận kích hoạt đúng gói dịch vụ.
                </p>
              </div>
            </div>
          `;
          document.getElementById('wbNotifyTransferBtn').onclick = async () => {
            const nRes = await WB.api('/api/payments/notify-transfer', { method: 'POST', body: { order_id: ord.id } });
            WB.toast(nRes.notice);
          };
          WB.toast(`Đã tạo đơn hàng ${ord.order_code}!`, 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    document.getElementById('wbSupportProgramForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) return WB.navigate('/dang-nhap');
      const fd = new FormData(e.target);
      try {
        const res = await WB.api('/api/commerce/support-programs/apply', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast(`Đã gửi hồ sơ chương trình hỗ trợ!`, 'success');
        if (res.application.status === 'approved') {
          WB.toast('Đã xác minh email sinh viên và kích hoạt ưu đãi 03 tháng miễn phí!', 'success');
        }
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };
  };

  WB.registerView('/dich-vu', renderCommerceAndPayment);
  WB.registerView('/goi-dich-vu', renderCommerceAndPayment);
  WB.registerView('/thanh-toan', renderCommerceAndPayment);
  WB.registerView('/thanh-toan/lich-su', renderCommerceAndPayment);
  WB.registerView('/hoa-don', renderCommerceAndPayment);

  // 2. HỆ THỐNG KHẢO THÍ WORD BRIDGE (/khao-thi - PHẦN XII & XXI.12: Ẩn hoàn toàn URL và slug kỹ thuật, tách biệt điểm luyện tập)
  WB.registerView('/khao-thi', async function (root) {
    const res = await WB.api('/api/exams');
    const exams = res.exams || [];
    let history = { sessions: [], appeals: [] };
    if (WB.state.user) {
      try {
        history = await WB.api('/api/exams/history');
      } catch (_) {}
    }

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-red">HỆ THỐNG KHẢO THÍ ĐỘC LẬP</span>
          <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">Hệ thống Khảo Thí &amp; Đánh giá Năng lực Ngoại ngữ</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
            Kết quả khảo thí chính thức được tách biệt hoàn toàn với điểm thực hành tại Trung tâm học tập. Hệ thống bảo mật đề thi trên máy chủ, trộn câu hỏi và đáp án, tự động lưu bài làm, chống nộp trùng và hỗ trợ phúc khảo minh bạch.
          </p>
        </div>

        <h2 class="wb-section-title">Danh sách Kỳ thi Đang tổ chức (${exams.length})</h2>
        <div class="wb-grid-2" style="margin-bottom:20px;">
          ${exams.map(ex => `
            <div class="wb-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;flex-wrap:wrap;gap:6px;">
                <span class="wb-badge wb-badge-teal">Mã kỳ thi: ${ex.code} • ${ex.language_code.toUpperCase()} • Trình độ ${ex.level}</span>
                <span class="wb-badge wb-badge-ivory">Thời lượng: ${ex.duration_minutes} phút</span>
              </div>
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">${ex.title}</h3>
              <div style="font-size:13px;color:var(--wb-text-muted);margin-bottom:12px;">
                <div><strong>Điểm đạt yêu cầu:</strong> ${ex.pass_score}/${ex.total_score} điểm</div>
                <div><strong>Điều kiện tham gia:</strong> ${ex.participation_conditions}</div>
                <div><strong>Hướng dẫn trước khi thi:</strong> ${ex.pre_exam_instructions}</div>
                <div><strong>Quyền thiết bị:</strong> ${ex.require_camera ? 'Kỳ thi yêu cầu xác nhận bật Camera minh bạch trong giờ thi (Cho phép từ chối nếu chưa sẵn sàng)' : 'Chỉ kiểm tra trình duyệt tiêu chuẩn, không yêu cầu Camera'}</div>
              </div>
              <div style="display:flex;gap:10px;flex-wrap:wrap;">
                <button type="button" class="wb-btn wb-btn-primary wb-enter-exam-btn" data-id="${ex.id}" data-cam="${ex.require_camera ? '1' : '0'}">
                  Kiểm tra Thiết bị &amp; Vào Phòng thi
                </button>
              </div>
            </div>
          `).join('')}
        </div>

        <!-- Khu vực Phòng thi Trực tuyến -->
        <div id="wbExamRoomContainer" style="display:none;margin-bottom:24px;" class="wb-card"></div>

        <!-- Lịch sử thi & Phúc khảo của thí sinh -->
        <div class="wb-card">
          <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Lịch sử Dự thi &amp; Kết quả Khảo Thí của tôi (${(history.sessions || []).length})</h3>
          ${(history.sessions || []).length === 0 ? `
            <p style="font-size:13.5px;color:var(--wb-text-muted);">Bạn chưa có lượt dự thi nào được ghi nhận.</p>
          ` : `
            <div class="wb-table-wrap">
              <table class="wb-table">
                <thead>
                  <tr><th>Kỳ thi</th><th>Mã đề</th><th>Trạng thái</th><th>Điểm số</th><th>Thời gian nộp</th></tr>
                </thead>
                <tbody>
                  ${history.sessions.map(s => `
                    <tr>
                      <td><strong>${s.exam_title}</strong> (${s.exam_code})</td>
                      <td>${s.paper_version_code}</td>
                      <td><span class="wb-badge wb-badge-teal">${s.session_status_vi}</span></td>
                      <td><strong>${s.score !== null ? `${s.score}/${s.total_score}` : 'Đang làm bài'}</strong></td>
                      <td style="font-size:12px;">${(s.submitted_at || s.server_started_at || '').slice(0, 16).replace('T', ' ')}</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>
          `}
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-enter-exam-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập tài khoản thí sinh để vào Phòng thi.');
          return WB.navigate('/dang-nhap');
        }
        const examId = btn.getAttribute('data-id');
        const reqCam = btn.getAttribute('data-cam') === '1';
        try {
          const room = await WB.api('/api/exams/enter-room', {
            method: 'POST',
            body: { exam_id: examId, device_checked: true, camera_consented: true }
          });
          WB.state.activeExamSession = room;
          renderExamRoomInside(document.getElementById('wbExamRoomContainer'), room, reqCam);
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    });

    function renderExamRoomInside(box, room) {
      box.style.display = 'block';
      const questions = room.questions || [];
      box.innerHTML = `
        <div class="wb-exam-sticky-bar" style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:12px;border-bottom:2px solid var(--wb-border);padding-bottom:14px;margin-bottom:18px;">
          <div>
            <span class="wb-badge wb-badge-red">${room.system_name}</span>
            <h2 style="margin:6px 0 0 0;color:var(--wb-deep-teal);">${room.exam.title}</h2>
            <div style="font-size:13px;color:var(--wb-text-muted);">
              Mã thí sinh: <strong>${room.candidate_code}</strong> • Mã đề: <strong>${room.session.paper_version_code}</strong> • Mức độ an toàn phòng thi: <strong id="wbExamRiskBadge">${room.session.risk_level}</strong>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;flex-wrap:wrap;">
            <div style="background:var(--wb-deep-teal);color:#FFF;padding:8px 14px;border-radius:8px;font-weight:800;">
              Thời gian còn lại: <span id="wbExamTimerSpan">${Math.floor(room.session.remaining_seconds / 60)}:${String(room.session.remaining_seconds % 60).padStart(2, '0')}</span>
            </div>
            <button type="button" class="wb-btn wb-btn-outline" id="wbExamAutoSaveBtn">Lưu tạm bài làm</button>
            <button type="button" class="wb-btn wb-btn-accent" id="wbExamSubmitBtn">Nộp bài chính thức</button>
          </div>
        </div>

        <!-- Bảng điều hướng câu hỏi (Question Navigation Palette - PHẦN XII) -->
        <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;margin-bottom:16px;">
          <div style="font-size:13px;font-weight:700;margin-bottom:8px;color:var(--wb-deep-teal);">Bảng điều hướng câu hỏi (${questions.length} câu):</div>
          <div style="display:flex;gap:8px;flex-wrap:wrap;">
            ${questions.map((q, idx) => `
              <button type="button" class="wb-btn wb-btn-outline wb-q-nav-btn" data-target="wbExamQCard_${idx + 1}" style="padding:5px 12px;font-size:12.5px;">
                Câu ${idx + 1}
              </button>
            `).join('')}
          </div>
        </div>

        <form id="wbExamPaperForm">
          ${questions.map((q, idx) => `
            <div id="wbExamQCard_${idx + 1}" style="padding:14px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;flex-wrap:wrap;gap:6px;">
                <strong>Câu ${idx + 1} (${q.question_type_vi} • ${q.points} điểm):</strong>
                <label style="font-size:12.5px;display:inline-flex;align-items:center;gap:4px;">
                  <input type="checkbox" class="wb-flag-q" value="${q.id}" /> Đánh dấu xem lại
                </label>
              </div>
              <p style="margin:0 0 10px 0;font-weight:600;">${q.prompt}</p>
              ${q.options && q.options.length > 0 ? `
                <select class="wb-select wb-exam-ans" data-qid="${q.id}">
                  <option value="">-- Chọn phương án trả lời --</option>
                  ${q.options.map(opt => `<option value="${opt}">${opt}</option>`).join('')}
                </select>
              ` : `
                <input type="text" class="wb-input wb-exam-ans" data-qid="${q.id}" placeholder="Nhập câu trả lời của bạn..." />
              `}
            </div>
          `).join('')}
        </form>

        <div id="wbExamResultPanel" style="display:none;margin-top:16px;padding:16px;background:var(--wb-bg-mint);border-radius:10px;"></div>
      `;

      box.querySelectorAll('.wb-q-nav-btn').forEach(btn => {
        btn.onclick = () => {
          const el = document.getElementById(btn.getAttribute('data-target'));
          if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        };
      });

      const collectAnswers = () => {
        const ans = {};
        box.querySelectorAll('.wb-exam-ans').forEach(el => {
          const qid = el.getAttribute('data-qid');
          if (el.value) ans[qid] = el.value;
        });
        const flagged = [];
        box.querySelectorAll('.wb-flag-q:checked').forEach(el => flagged.push(el.value));
        return { answers: ans, flagged_questions: flagged };
      };

      document.getElementById('wbExamAutoSaveBtn').onclick = async () => {
        try {
          const payload = collectAnswers();
          const s = await WB.api('/api/exams/autosave', {
            method: 'POST',
            body: { session_id: room.session.id, ...payload }
          });
          WB.toast(`Đã tự động lưu câu trả lời lúc ${s.auto_saved_at.slice(11, 19)}!`, 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };

      document.getElementById('wbExamSubmitBtn').onclick = async () => {
        try {
          const payload = collectAnswers();
          const resSub = await WB.api('/api/exams/submit', {
            method: 'POST',
            body: { session_id: room.session.id, answers: payload.answers }
          });
          const resPanel = document.getElementById('wbExamResultPanel');
          resPanel.style.display = 'block';
          resPanel.innerHTML = `
            <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Đã Nộp Bài Thi Chính Thức Thành Công!</h3>
            <p style="margin:0 0 8px 0;">
              Điểm số đạt được: <strong>${resSub.score}/${resSub.total_score} điểm</strong> •
              Kết quả: <strong>${resSub.passed ? 'Đạt yêu cầu' : 'Chưa đạt yêu cầu'}</strong> •
              Thời điểm nộp: ${resSub.submitted_at.slice(0, 19).replace('T', ' ')}
            </p>
            <p style="font-size:12.5px;color:var(--wb-text-muted);margin:0 0 12px 0;">${resSub.disclaimer}</p>
            <button type="button" class="wb-btn wb-btn-outline" id="wbAppealExamBtn">Gửi Yêu cầu Phúc khảo Bài thi</button>
          `;
          document.getElementById('wbAppealExamBtn').onclick = async () => {
            await WB.api('/api/exams/appeals', {
              method: 'POST',
              body: {
                session_id: room.session.id,
                reason: 'Đề nghị rà soát kết quả chấm điểm bài thi',
                explanation_text: 'Thí sinh gửi yêu cầu phúc khảo chính thức trên Hệ thống Khảo Thí WORD BRIDGE.'
              }
            });
            WB.toast('Đã gửi yêu cầu phúc khảo thành công!', 'success');
          };
          WB.toast(`Đã nộp bài! Điểm kỳ thi: ${resSub.score}`, 'success');
        } catch (err) {
          WB.toast(err.message, 'error');
        }
      };
    }
  });
})(window.WB);
