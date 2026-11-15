# WORD BRIDGE – Where Languages Bring People Together. (2026/2027)

- **Tên nền tảng:** WORD BRIDGE
- **Slogan:** Where Languages Bring People Together.
- **Tên miền chính thức duy nhất:** `https://wordbridge.io.vn`
- **Mô hình kiến trúc:** Một website duy nhất (Modular Monolith) tích hợp toàn bộ chức năng trên một tên miền. Tuyệt đối không tạo subdomain sản phẩm (`learn`, `portal`, `exam`, `admin`, `help`, `api`, `vipro`), không có mục Sự kiện (`/su-kien`), không dùng thương hiệu Vipro/VIPRO và không sử dụng hình ảnh AI.
- **Hạ tầng dữ liệu độc lập (Phụ lục A):** Tự xây dựng, triển khai và quản lý **Database PostgreSQL riêng** và **Máy chủ Object Storage riêng** (`docker-compose.yml`). Tuyệt đối **không sử dụng Cloudflare D1 hoặc Cloudflare R2**, không dùng chung database/storage với dự án khác.

---

## 1. Chính sách Hạn mức Lưu trữ & Chu kỳ Tháng (`/quan-tri/luu-tru` – Phụ lục A)

- **Không giới hạn GB cố định chung cho toàn website:** Hạn mức được cấp theo gói dịch vụ của từng tài khoản/tổ chức hoặc cấu hình riêng của Admin.
- **Hạn mức mặc định theo gói:**
  1. `Personal Free`: **1 GB / tài khoản** (không tự động reset hàng tháng).
  2. `Personal Plus (Tháng / Năm)`: **5 GB / tài khoản** (khi hết gói chuyển về `Personal Free` 1 GB; nếu đang lưu > 1 GB thì cảnh báo và ngăn tải lên tệp mới, **tuyệt đối không tự động xóa dữ liệu cũ**, giữ nguyên quyền đọc & tải xuống).
  3. `Organization Plus – Gói tháng`: **50 GB / tháng**, tối đa **30 thành viên** (quản lý tập trung trong không gian tổ chức, **không nhân hạn mức theo số thành viên**, tự động làm mới bộ đếm vào ngày `01` hàng tháng theo múi giờ `Asia/Ho_Chi_Minh`, không cộng dồn dung lượng dư, **không xóa dữ liệu đã lưu khi làm mới**).
  4. `Organization Plus – Gói năm`: **120 GB / tháng**, tối đa **30 thành viên** (quản lý tập trung trong không gian tổ chức, **không nhân hạn mức theo số thành viên**, tự động làm mới bộ đếm vào ngày `01` hàng tháng theo múi giờ `Asia/Ho_Chi_Minh`, không cộng dồn dung lượng dư, **không xóa dữ liệu đã lưu khi làm mới**).
- **Quyền điều chỉnh của Admin (`/quan-tri/luu-tru`):** Admin có thể tìm kiếm từng tài khoản cá nhân hoặc tổ chức để tăng/giảm/đặt hạn mức riêng theo **GB** hoặc **TB**, chuyển sang **Không giới hạn**, hoặc **Gỡ hạn mức riêng** (lập tức trở về hạn mức mặc định theo gói đang hoạt động). Cấu hình riêng của Admin luôn có độ ưu tiên cao hơn mặc định của gói và được ghi `audit_logs` đầy đủ.

---

## 2. Quy chuẩn 04 Địa chỉ Email Chính thức & 29 Mẫu Email HTML

| Địa chỉ Email | Vai trò | Phạm vi sử dụng |
|---|---|---|
| `noreply@wordbridge.io.vn` | Email gửi tự động từ hệ thống | OTP, xác minh email, cảnh báo bảo mật, hóa đơn, thông báo tự động (`WORD BRIDGE – Email tự động từ hệ thống`) |
| `wordbridge.education@gmail.com` | Liên hệ chính thức | Liên hệ chung, thông tin chính thức của WORD BRIDGE |
| `cskh@wordbridge.io.vn` | Chăm sóc khách hàng | Hỗ trợ tài khoản, học tập, thanh toán, khiếu nại, liên kết `/ho-tro` |
| `contact@wordbridge.io.vn` | Hợp tác & Truyền thông | Hợp tác giáo dục, doanh nghiệp, báo chí, truyền thông, tài trợ |

---

## 3. Hướng dẫn Cài đặt, Chạy, Build & Kiểm thử

```bash
cp .env.example .env
npm run migrate
npm run seed
npm run build
npm test
npm start
```
