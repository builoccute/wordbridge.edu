'use strict';

(function (WB) {
  // DỊCH VỤ, GÓI THÀNH VIÊN, HỖ TRỢ, THANH TOÁN QR & HÓA ĐƠN (/dich-vu, /goi-dich-vu, /thanh-toan, /thanh-toan/lich-su, /hoa-don - PHẦN 16, 17, 18)
  const renderCommerceAndPayment = async function (root, pathname) {
    const cat = await WB.api('/api/commerce/catalog');
    const plans = cat.plans || [];
    const addons = cat.addons || [];
    const supportPrograms = cat.support_programs || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-teal">DỊCH VỤ, GÓI THÀNH VIÊN, HỖ TRỢ CỘNG ĐỒNG & PAYMENT CORE QR (PHẦN 16, 17, 18)</span>
          <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">
            ${pathname.startsWith('/thanh-toan') ? 'Trung tâm Thanh toán QR & Đối soát Giao dịch' : pathname === '/hoa-don' ? 'Quản lý Hóa đơn Điện tử' : 'Gói Dịch vụ, Chương trình Hỗ trợ & Tiện ích Bổ sung'}
          </h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
            Giá dịch vụ được quản lý tập trung theo đúng Đề án. Tài khoản cá nhân mới được dùng thử Personal Plus 07 ngày; Tổ chức được dùng thử 14 ngày (tối đa 10 thành viên). Không tự động gia hạn khi chưa có sự đồng ý; hết hạn chuyển về gói Free và giữ nguyên lịch sử học tập.
          </p>
        </div>

        <!-- Bảng giá 05 Gói Dịch vụ Chuẩn Đề Án -->
        <h2 class="wb-section-title">Bảng Giá Gói Thành Viên Cá Nhân & Tổ Chức</h2>
        <div class="wb-grid-3" style="margin-bottom:24px;">
          ${plans.map(p => `
            <div class="wb-card" style="display:flex;flex-direction:column;justify-content:space-between;">
              <div>
                <span class="wb-badge ${p.target_type === 'organization' ? 'wb-badge-red' : 'wb-badge-teal'}">${p.target_type.toUpperCase()}</span>
                <h3 style="margin:10px 0 6px 0;color:var(--wb-deep-teal);">${p.name}</h3>
                <div style="font-size:26px;font-weight:800;color:var(--wb-vermilion);margin-bottom:10px;">
                  ${Number(p.price_vnd).toLocaleString('vi-VN')} đ
                </div>
                <ul style="font-size:13px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 14px 0;">
                  ${(p.features || []).map(f => `<li style="margin-bottom:4px;">${f}</li>`).join('')}
                </ul>
              </div>
              ${p.price_vnd > 0 ? `
                <button type="button" class="wb-btn wb-btn-primary wb-create-order-btn" data-plan="${p.code}">
                  Tạo Đơn Thanh toán QR (${p.name})
                </button>
              ` : `<span class="wb-badge wb-badge-success" style="text-align:center;padding:10px;">Gói Mặc định Miễn phí</span>`}
            </div>
          `).join('')}
        </div>

        <!-- Khu vực hiển thị Đơn hàng QR vừa khởi tạo -->
        <div id="wbActiveOrderQrBox" style="display:none;margin-bottom:24px;" class="wb-card"></div>

        <!-- 04 Chương trình Hỗ trợ Chính thức & 06 Nhóm Tiện ích Bổ sung -->
        <div class="wb-grid-2">
          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">Đăng ký Chương trình Hỗ trợ (Sinh viên, Phi lợi nhuận, Community Access, Hoàn cảnh khó khăn)</h3>
            <ul style="font-size:13px;color:var(--wb-text-muted);padding-left:18px;margin:0 0 14px 0;">
              ${supportPrograms.map(sp => `<li style="margin-bottom:6px;"><strong>${sp.name}:</strong> ${sp.condition}</li>`).join('')}
            </ul>
            <form id="wbSupportProgramForm">
              <div class="wb-form-group">
                <label class="wb-label">Chọn Chương trình Hỗ trợ <span class="req">*</span></label>
                <select class="wb-select" name="program_type" required>
                  <option value="student_plus">Sinh viên: Miễn phí 03 tháng Personal Plus (Xác minh duy nhất qua email trường .edu.vn)</option>
                  <option value="community_access">Community Access: CLB chưa có pháp nhân (03 tháng / kỳ duyệt)</option>
                  <option value="nonprofit_30">Tổ chức Phi lợi nhuận: Giảm 30% (245.000đ/tháng hoặc 2.450.000đ/năm)</option>
                  <option value="hardship_support">Hoàn cảnh khó khăn: Hỗ trợ 12 tháng (Bảo mật hồ sơ, ngân sách tối đa 5.000.000đ/năm)</option>
                </select>
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Email sinh viên do trường cấp (Bắt buộc nếu chọn Chương trình Sinh viên, không dùng thẻ sinh viên)</label>
                <input type="email" class="wb-input" name="student_edu_email" placeholder="sinhvien@vsvc.edu.vn hoặc @hcmussh.edu.vn" />
              </div>
              <div class="wb-form-group">
                <label class="wb-label">Mục tiêu học tập / Thuyết minh hồ sơ</label>
                <textarea class="wb-textarea" name="reason" rows="2" required placeholder="Trình bày mục tiêu rèn luyện ngoại ngữ hoặc hoạt động cộng đồng..."></textarea>
              </div>
              <button type="submit" class="wb-btn wb-btn-accent">Nộp Hồ sơ Xét duyệt Hỗ trợ</button>
            </form>
          </div>

          <div class="wb-card">
            <h3 style="margin:0 0 12px 0;color:var(--wb-deep-teal);">06 Nhóm Tiện ích Bổ sung & Giới thiệu Thành viên</h3>
            <div class="wb-table-wrap" style="margin-bottom:16px;">
              <table class="wb-table">
                <thead>
                  <tr><th>#</th><th>Nhóm Tiện ích Bổ sung</th><th>Giá tham chiếu</th></tr>
                </thead>
                <tbody>
                  ${addons.map(a => `
                    <tr>
                      <td>0${a.number}</td>
                      <td><strong>${a.name}</strong></td>
                      <td>${Number(a.base_price_vnd).toLocaleString('vi-VN')} đ</td>
                    </tr>
                  `).join('')}
                </tbody>
              </table>
            </div>

            <h4 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">Nhập Mã Giới thiệu Thành viên (Chống tự giới thiệu)</h4>
            <form id="wbReferralForm" style="display:flex;gap:8px;">
              <input type="text" class="wb-input" name="referral_code" required placeholder="Nhập mã giới thiệu từ bạn học..." />
              <button type="submit" class="wb-btn wb-btn-primary">Áp dụng</button>
            </form>
          </div>
        </div>
      </div>
    `;

    root.querySelectorAll('.wb-create-order-btn').forEach(btn => {
      btn.onclick = async () => {
        if (!WB.state.user) {
          WB.toast('Vui lòng đăng nhập để tạo đơn thanh toán QR.');
          return WB.navigate('/dang-nhap');
        }
        try {
          const res = await WB.api('/api/payments/orders', {
            method: 'POST',
            body: { plan_code: btn.getAttribute('data-plan') }
          });
          const ord = res.order;
          const box = document.getElementById('wbActiveOrderQrBox');
          box.style.display = 'block';
          box.innerHTML = `
            <span class="wb-badge wb-badge-red">ĐƠN HÀNG THANH TOÁN QR ĐANG CHỜ ĐỐI SOÁT</span>
            <h3 style="margin:8px 0;color:var(--wb-deep-teal);">Mã đơn hàng: ${ord.order_code} • Mã giao dịch: ${ord.transaction_code}</h3>
            <div class="wb-grid-2">
              <div>
                <p style="margin:4px 0;"><strong>Số tiền cần chuyển khoản:</strong> <span style="color:var(--wb-vermilion);font-weight:800;">${Number(ord.final_amount_vnd).toLocaleString('vi-VN')} đồng</span></p>
                <p style="margin:4px 0;"><strong>Nội dung chuyển khoản bắt buộc:</strong> <code style="background:var(--wb-bg-mint);padding:4px 8px;border-radius:6px;font-weight:800;">${ord.transfer_content}</code></p>
                <p style="margin:4px 0;font-size:13px;color:var(--wb-text-muted);">Thời hạn thanh toán: ${ord.expires_at}</p>
                <button type="button" class="wb-btn wb-btn-outline" id="wbNotifyTransferBtn" data-id="${ord.id}" style="margin-top:10px;">
                  Gửi Thông báo Đã chuyển khoản (Chờ Webhook/Đối soát)
                </button>
              </div>
              <div style="background:var(--wb-bg-soft);padding:12px;border-radius:10px;font-size:12.5px;">
                <strong>Chuẩn VietQR Payload:</strong>
                <pre style="white-space:pre-wrap;word-break:break-all;margin:6px 0 0 0;">${ord.qr_payload}</pre>
              </div>
            </div>
          `;
          document.getElementById('wbNotifyTransferBtn').onclick = async () => {
            const nRes = await WB.api('/api/payments/notify-transfer', { method: 'POST', body: { order_id: ord.id } });
            WB.toast(nRes.notice);
          };
          WB.toast(`Đã khởi tạo đơn hàng ${ord.order_code}!`, 'success');
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
        WB.toast(`Đã nộp hồ sơ hỗ trợ! Trạng thái: ${res.application.status}`, 'success');
      } catch (err) {
        WB.toast(err.message, 'error');
      }
    };

    document.getElementById('wbReferralForm').onsubmit = async e => {
      e.preventDefault();
      if (!WB.state.user) return WB.navigate('/dang-nhap');
      const fd = new FormData(e.target);
      try {
        await WB.api('/api/commerce/referrals/apply', { method: 'POST', body: Object.fromEntries(fd.entries()) });
        WB.toast('Đã áp dụng mã giới thiệu thành công!', 'success');
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

  // HỆ THỐNG KHẢO THÍ WORD BRIDGE – /khao-thi & CHỐNG GIAN LẬN (PHẦN 19 & 20)
  WB.registerView('/khao-thi', async function (root) {
    const res = await WB.api('/api/exams');
    const exams = res.exams || [];

    root.innerHTML = `
      <div class="wb-container wb-section">
        <div class="wb-card" style="margin-bottom:20px;">
          <span class="wb-badge wb-badge-red">HỆ THỐNG KHẢO THÍ WORD BRIDGE – https://wordbridge.io.vn/khao-thi</span>
          <h1 style="margin:8px 0 4px 0;color:var(--wb-deep-teal);">HỆ THỐNG KHẢO THÍ WORD BRIDGE</h1>
          <p style="font-size:13.5px;color:var(--wb-text-muted);margin:0;">
            Phân hệ khảo thí chính thức tích hợp trực tiếp bên trong website WORD BRIDGE (Không tách website riêng, không dùng thương hiệu Vipro). Kết quả kỳ thi chính thức tại <code>/khao-thi</code> được tách biệt hoàn toàn với điểm luyện tập tại <code>/hoc-tap</code>.
          </p>
        </div>

        <div class="wb-grid-2" style="margin-bottom:20px;">
          ${exams.map(ex => `
            <div class="wb-card">
              <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;">
                <span class="wb-badge wb-badge-teal">${ex.code} • ${ex.language_code.toUpperCase()} • Trình độ ${ex.level}</span>
                <span class="wb-badge wb-badge-ivory">${ex.duration_minutes} phút</span>
              </div>
              <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">${ex.title}</h3>
              <p style="font-size:13px;color:var(--wb-text-muted);margin:0 0 12px 0;">
                Điểm đạt: ${ex.pass_score}/${ex.total_score} • Trộn đề & đáp án tự động •
                Camera: ${ex.require_camera ? 'Yêu cầu xin quyền minh bạch trước khi vào phòng thi' : 'Không bắt buộc'}
              </p>
              <button type="button" class="wb-btn wb-btn-primary wb-enter-exam-btn" data-id="${ex.id}" data-cam="${ex.require_camera}">
                Kiểm tra Thiết bị & Vào Phòng thi →
              </button>
            </div>
          `).join('')}
        </div>

        <!-- Khu vực Phòng thi Trực tuyến & Bảo vệ Liêm chính Khảo thí -->
        <div id="wbExamRoomContainer" style="display:none;" class="wb-card"></div>
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
          if (reqCam) {
            await WB.api('/api/exams/register', {
              method: 'POST',
              body: { exam_id: examId, device_checked: true, camera_consented: true }
            });
          }
          const room = await WB.api('/api/exams/enter-room', { method: 'POST', body: { exam_id: examId } });
          WB.state.activeExamSession = room;
          renderExamRoomInside(document.getElementById('wbExamRoomContainer'), room);
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
              Mã thí sinh: <strong>${room.candidate_code}</strong> • Mã đề: <strong>${room.session.paper_version_code}</strong> • Mức rủi ro liêm chính: <strong id="wbExamRiskBadge">${room.session.risk_level}</strong>
            </div>
          </div>
          <div style="display:flex;gap:10px;align-items:center;">
            <div style="background:var(--wb-deep-teal);color:#FFF;padding:8px 14px;border-radius:8px;font-weight:800;">
              ⏱ Còn lại: <span id="wbExamTimerSpan">${Math.floor(room.session.remaining_seconds / 60)}:${String(room.session.remaining_seconds % 60).padStart(2, '0')}</span>
            </div>
            <button type="button" class="wb-btn wb-btn-outline" id="wbExamAutoSaveBtn">💾 Lưu tạm</button>
            <button type="button" class="wb-btn wb-btn-accent" id="wbExamSubmitBtn">📤 Nộp bài chính thức</button>
          </div>
        </div>

        <form id="wbExamPaperForm">
          ${questions.map((q, idx) => `
            <div style="padding:14px;border:1px solid var(--wb-border);border-radius:10px;margin-bottom:14px;">
              <div style="display:flex;justify-content:space-between;margin-bottom:6px;">
                <strong>Câu ${idx + 1} (${q.question_type} • ${q.points} điểm):</strong>
                <label style="font-size:12.5px;"><input type="checkbox" class="wb-flag-q" value="${q.id}" /> 🚩 Đánh dấu xem lại</label>
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
          WB.toast(`Đã tự động lưu bài làm lúc ${s.auto_saved_at.slice(11, 19)}!`, 'success');
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
            <h3 style="margin:0 0 8px 0;color:var(--wb-deep-teal);">✅ Đã Nộp Bài Thi Chính Thức Thành Công!</h3>
            <p style="margin:0 0 10px 0;">Điểm số đạt được: <strong>${resSub.score} điểm</strong> • Thời điểm nộp: ${resSub.submitted_at} • Trạng thái khóa sau nộp: Đã khóa chỉnh sửa.</p>
            <button type="button" class="wb-btn wb-btn-outline" id="wbAppealExamBtn">Gửi Yêu cầu Phúc khảo & Giải trình</button>
          `;
          document.getElementById('wbAppealExamBtn').onclick = async () => {
            await WB.api('/api/exams/appeals', {
              method: 'POST',
              body: {
                session_id: room.session.id,
                reason: 'Đề nghị rà soát kết quả chấm điểm tự động',
                explanation_text: 'Thí sinh gửi yêu cầu phúc khảo chính thức trên HỆ THỐNG KHẢO THÍ WORD BRIDGE.'
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
