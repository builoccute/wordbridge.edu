import { renderPublicPage } from '../layouts/site-layout.js';
import { htmlResponse } from '../utils/http.js';
import { escapeHtml } from '../utils/validation.js';

export const USER_APP_40_FEATURES = [
  [1, 'Thanh tiến độ học tập theo Chương trình / Học phần / Tuần', '/learning'],
  [2, 'Đánh dấu hoàn thành bài học & lưu thời gian học thực tế', '/my-learning'],
  [3, 'Tìm kiếm & lọc nhanh 36 tuần / 108 bài học Trung – Anh – Nga', '/learning'],
  [4, 'Ghi chú cá nhân trong từng bài học (lưu SQLite tại Quản trị)', '/my-learning'],
  [5, 'Gợi ý bài học tiếp theo & lịch sử học liên tục', '/my-learning/history'],
  [6, 'Tra cứu từ điển đa điều kiện (Pinyin, IPA, loại từ, chuyên ngành)', '/dictionary'],
  [7, 'Lưu / bỏ lưu từ vào Sổ từ vựng 1-chạm ở mọi trang', '/dictionary'],
  [8, 'Tạo & quản lý Bộ từ vựng cá nhân theo chuyên ngành', '/vocabulary/sets'],
  [9, 'Chế độ lật thẻ Flashcard tương tác (mặt trước / mặt sau)', '/vocabulary/flashcards'],
  [10, 'Hàng đợi ôn tập ngắt quãng SM-2 theo chu kỳ nhớ', '/vocabulary/review'],
  [11, 'Xuất Sổ từ vựng cá nhân ra CSV / JSON ôn offline', '/api/v1/vocabulary/export'],
  [12, 'Trình phát Audio HTML5 (Play/Pause/Stop/Tua ±5s/0.75x–1.5x/Loop)', '/learning'],
  [13, 'Phát từng câu (Sentence-by-sentence) kèm highlight câu đang nghe', '/learning'],
  [14, 'Ghi âm tự luyện đọc cục bộ trên trình duyệt để tự nghe đối chiếu', '/practice/speaking'],
  [15, 'Đọc mẫu tham khảo Web Speech API (gắn nhãn giọng tổng hợp)', '/dictionary'],
  [16, 'Giao diện Luyện tập 6 phân hệ (Nghe, Nói, Đọc, Viết, Từ vựng, Ngữ pháp)', '/practice'],
  [17, 'Chấm trắc nghiệm tức thì & giải thích đáp án chi tiết', '/practice'],
  [18, 'Chế độ tự luận Viết/Nói kèm bảng Rubric & trạng thái chờ chấm', '/practice/writing'],
  [19, 'Thống kê lịch sử & phân tích điểm mạnh/yếu theo kỹ năng', '/practice/history'],
  [20, 'Bộ đếm từ / Hán tự / ký tự trực tiếp trong khung bài Viết', '/practice/writing'],
  [21, 'Đồng hồ đếm ngược thời gian thi tham chiếu & cảnh báo sắp hết giờ', '/examinations'],
  [22, 'Bảng điều hướng câu hỏi (đã làm / chưa làm / đánh dấu)', '/examinations'],
  [23, 'Tự động lưu nháp bài thi tránh mất dữ liệu khi rớt mạng', '/examinations'],
  [24, 'Trang kết quả khảo thí chi tiết từng phần (không cấp chứng chỉ)', '/examinations/history'],
  [25, 'Lịch sử các lần thi thử theo dõi tiến bộ qua từng đợt', '/examinations/history'],
  [26, 'Bộ lọc 10 nhóm Ngoại ngữ Chuyên ngành (chỉ Trung & Anh, chặn Nga CN)', '/specialized'],
  [27, 'Ma trận Thuật ngữ Chuyên ngành + Cảnh báo Bẫy nghĩa (False Friends)', '/specialized'],
  [28, 'Tạo phòng & tham gia Learner Meet theo mã phiên thực hành', '/learner-meet'],
  [29, 'Kiểm tra Micro/Camera trước phiên (khóa cứng không chat/share/ghi hình)', '/learner-meet'],
  [30, 'Đánh giá sau phiên & lịch sử thực hành Learner Meet', '/learner-meet/history'],
  [31, 'Giao diện trực quan cho 15 Hệ thống Trí tuệ Ngôn ngữ', '/intelligence'],
  [32, 'Lưu & xem lại lịch sử phân tích của 15 hệ thống Trí tuệ', '/intelligence'],
  [33, 'Menu di động (Mobile Drawer) tối ưu cả Điện thoại & Laptop', '/'],
  [34, 'Chuyển đổi Sáng / Tối (Light/Dark Mode) & chỉnh cỡ chữ bài học', '/'],
  [35, 'Hệ thống Toast thông báo & trạng thái Loading rõ ràng', '/'],
  [36, 'Quản lý hồ sơ cá nhân & đổi mật khẩu đồng bộ CSRF tại Portal', 'https://portal.wordbridge.io.vn/'],
  [37, 'Đăng ký & Đăng nhập bằng Passkey (WebAuthn) chạy thật trên trình duyệt', 'https://portal.wordbridge.io.vn/login'],
  [38, 'Quản lý & thu hồi phiên đăng nhập / thiết bị từ xa', 'https://portal.wordbridge.io.vn/'],
  [39, 'Xác nhận ưu đãi sinh viên .edu (3 tháng PERSONAL PLUS) & quyền riêng tư', 'https://portal.wordbridge.io.vn/'],
  [40, 'Liên thông SSO 1-chạm sang Thư viện PDF Reader & Cổng Thi Thật Exam', 'https://reader.wordbridge.io.vn/'],
];

const FALSE_FRIENDS_SAMPLES = [
  { term: 'Demurrage (EN · Logistics)', common: 'Thường bị nhầm là hư hỏng hàng (Damage)', specialized: 'Phí lưu bãi container quá thời hạn miễn phí tại cảng.' },
  { term: 'Execution (EN · Hợp đồng)', common: 'Nghĩa phổ thông: thi hành án / xử tử', specialized: 'Ký kết chính thức và đưa hợp đồng vào hiệu lực.' },
  { term: '信用证 xìnyòngzhèng (ZH · XNK)', common: 'Dễ dịch thô là "giấy chứng nhận uy tín"', specialized: 'Thư tín dụng ngân hàng (Letter of Credit — L/C).' },
  { term: '公差 gōngchā (ZH · Cơ khí)', common: 'Nghĩa phổ thông: đi công tác', specialized: 'Dung sai kỹ thuật (Tolerance) trên bản vẽ cơ khí.' },
];

export function renderFeaturesPage({ user, runtime }) {
  const html = `
    <section class="wb-hero">
      <span class="wb-badge wb-badge-red">TIẾNG CHUYÊN NGÀNH · 40 TÍNH NĂNG APP</span>
      <h1>40 Tính Năng Ứng Dụng Cho Người Học Chuyên Ngành</h1>
      <p>Kế thừa tinh hoa từ các nền tảng học ngôn ngữ hàng đầu thế giới và nâng cấp chuyên sâu cho 10 lĩnh vực chuyên ngành Trung – Anh (kèm Tiếng Nga tổng quát). Xem công khai toàn bộ — đăng nhập để lưu tiến độ & sử dụng.</p>
      <div style="display:flex;gap:10px;flex-wrap:wrap;">
        <a href="/specialized" class="wb-btn wb-btn-accent">Khám phá 10 Chuyên ngành</a>
        <a href="https://reader.wordbridge.io.vn/" class="wb-btn wb-btn-ghost">Mở Thư viện PDF (Reader)</a>
        <a href="https://exam.wordbridge.io.vn/" class="wb-btn wb-btn-ghost">Vào Cổng Thi Thật (Exam)</a>
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Điểm nâng cấp độc quyền: Cảnh báo "Bẫy nghĩa Chuyên ngành" (False Friends)</h2>
      <div class="wb-grid-2">
        ${FALSE_FRIENDS_SAMPLES.map((f) => `
          <article class="wb-card" style="margin:0;border-left:4px solid var(--wb-red);">
            <h3 style="margin:0 0 6px;color:var(--wb-teal);">${escapeHtml(f.term)}</h3>
            <p class="wb-muted" style="margin:0 0 6px;"><strong>Dễ nhầm (đời thường):</strong> ${escapeHtml(f.common)}</p>
            <p style="margin:0;"><strong>Nghĩa chuyên ngành chuẩn:</strong> ${escapeHtml(f.specialized)}</p>
          </article>`).join('')}
      </div>
    </section>

    <section class="wb-card">
      <h2 style="margin-top:0;color:var(--wb-teal);">Danh mục đầy đủ 40 Tính năng Người dùng (1 – 40)</h2>
      <div class="wb-grid-2">
        ${USER_APP_40_FEATURES.map(([num, label, href]) => `
          <div style="display:flex;justify-content:space-between;align-items:center;gap:10px;padding:10px 12px;border:1px solid var(--wb-border);border-radius:10px;background:var(--wb-surface-2);">
            <div><span class="wb-badge" style="margin-right:8px;">#${num}</span><strong>${escapeHtml(label)}</strong></div>
            <a href="${escapeHtml(href)}" class="wb-btn wb-btn-outline wb-btn-sm">Mở</a>
          </div>`).join('')}
      </div>
    </section>
  `;

  return htmlResponse(renderPublicPage({
    title: '40 Tính năng Học Tiếng Chuyên Ngành',
    currentPath: '/features',
    breadcrumbs: [{ label: 'Trang chủ', href: '/' }, { label: '40 Tính năng' }],
    user,
    runtime,
    contentHtml: html,
  }));
}
