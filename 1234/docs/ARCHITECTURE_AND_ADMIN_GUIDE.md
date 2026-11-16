# TÀI LIỆU KIẾN TRÚC, CẤU HÌNH, TRIỂN KHAI CLOUDFLARE D1/R2, RESEND, OAUTH 2.0 & VẬN HÀNH QUẢN TRỊ — WORD BRIDGE (2026–2027)

> **Dự án:** WORD BRIDGE  
> **Slogan:** *Where Languages Bring People Together.*  
> **Tên miền chính thức:** `https://wordbridge.io.vn`  
> **Bốn trụ cột cốt lõi:** `LEARN` • `CONNECT` • `COMMUNITY` • `GROW`  
> **Năm ngôn ngữ hỗ trợ:** Tiếng Trung (`zh`), Tiếng Anh (`en`), Tiếng Hàn (`ko`), Tiếng Nhật (`ja`), Tiếng Nga (`ru`)

---

## MỤC 1. KIẾN TRÚC HỆ THỐNG THỰC TẾ (ACTUAL SYSTEM ARCHITECTURE)

### 1.1. Hợp nhất đường chạy sản xuất (`src/worker.js` và `src/server.js`)
- Trong `wrangler.toml`, điểm vào chính của Cloudflare Workers là `main = "src/worker.js"`.
- Toàn bộ logic điều phối API nghiệp vụ, kiểm tra bảo mật WAF, xác thực phiên, phân quyền RBAC, kiểm tra hạn mức lưu trữ và gửi email Resend được đặt thống nhất tại hàm `dispatchApiRequest` trong `src/server.js` và được `src/worker.js` gọi trực tiếp trong hàm `fetch(request, env, ctx)`.
- Nhờ kiến trúc này, **100% API nghiệp vụ chạy hoàn toàn giống nhau** giữa môi trường sản xuất Cloudflare Workers (`src/worker.js`) và môi trường máy chủ Node.js/kiểm thử tự động (`src/server.js`), khắc phục triệt để tình trạng `worker.js` chỉ là khung rỗng trước đây.

### 1.2. Cơ sở dữ liệu chính thức: Cloudflare D1 (`word`)
- **Binding:** `DB`
- **Database Name:** `word`
- **Database ID:** `ce84cc48-6d49-409b-b45a-13ba3bc4a771`
- **Adapter (`src/adapters/database.adapter.js`):**
  - Khi chạy trên Cloudflare Workers có `env.DB`, toàn bộ biến đổi dữ liệu được đồng bộ trực tiếp vào Cloudflare D1 qua `flushToCloudflareD1(env.DB)`.
  - Khi chạy cục bộ hoặc kiểm thử tự động, adapter vận hành trên cơ sở dữ liệu tương thích chuẩn SQLite/D1 với `PRAGMA foreign_keys = ON`, hỗ trợ `createBackup()`, `restoreBackup()`, `verifyRestoreCapability()` và `checkIntegrity()`.

### 1.3. Lưu trữ đối tượng chính thức: Cloudflare R2 (`word`)
- **Binding:** `R2`
- **Bucket Name:** `word`
- **Adapter (`src/adapters/storage.adapter.js`):**
  - Kiểm tra chữ ký tệp thực tế (**Magic Bytes**) cho các định dạng được phép (`PDF`, `PNG`, `JPEG`, `WEBP`, `MP3`, `WAV`, `OGG`, `TXT`, `JSON`), từ chối tệp giả mạo phần mở rộng hoặc tệp thực thi nguy hiểm.
  - Sinh khóa đối tượng ngẫu nhiên (`storage_key`) chống đoán đường dẫn.
  - Kiểm soát quyền truy cập khi tải xuống (`/api/resources/download`): người dùng từ tài khoản khác hoặc tổ chức khác không thể truy cập tệp riêng tư hoặc tệp nội bộ của đơn vị không thuộc quyền.

### 1.4. Phân tách Ngôn ngữ Giao diện và Ngôn ngữ Học tập
- **Ngôn ngữ giao diện (`ui_locale`):** Điều khiển nhãn hiển thị trên giao diện người dùng (Tiếng Việt là ngôn ngữ chuẩn mặc định).
- **Ngôn ngữ đang học (`users.learning_languages`):** Danh sách ngôn ngữ mục tiêu của tài khoản trong 05 ngôn ngữ (`zh`, `en`, `ko`, `ja`, `ru`).
- **Ngôn ngữ bài thực hành (`practice_exercises.language_code`)** và **Ngôn ngữ kết nối cộng đồng (`community_posts.language_code`, `friendships`)**: Độc lập hoàn toàn. Việc chuyển đổi ngôn ngữ giao diện ở Header tuyệt đối không làm thay đổi ngôn ngữ đang học trong hồ sơ người dùng.

---

## MỤC 2. CẤU HÌNH MÔI TRƯỜNG & DANH SÁCH BIẾN MÔI TRƯỜNG (KHÔNG KÈM KHÓA BÍ MẬT)

### 2.1. Cấu hình `wrangler.toml`
```toml
name = "wordbridge"
main = "src/worker.js"
compatibility_date = "2026-04-01"
workers_dev = false

routes = [
  { pattern = "wordbridge.io.vn/*", zone_name = "wordbridge.io.vn" },
  { pattern = "www.wordbridge.io.vn/*", zone_name = "wordbridge.io.vn" }
]

[assets]
directory = "./src/frontend"
binding = "ASSETS"

[[d1_databases]]
binding = "DB"
database_name = "word"
database_id = "ce84cc48-6d49-409b-b45a-13ba3bc4a771"
migrations_dir = "database/migrations"

[[r2_buckets]]
binding = "R2"
bucket_name = "word"
```

### 2.2. Danh mục Biến môi trường cần thiết (`.env.example` / Cloudflare Secrets)

| Tên biến | Phân loại | Giá trị mặc định / Mẫu (Không chứa khóa thật) | Mô tả chức năng |
| :--- | :--- | :--- | :--- |
| `APP_ORIGIN` | Biến cấu hình | `https://wordbridge.io.vn` | Tên miền chính thức duy nhất của nền tảng |
| `TIMEZONE` | Biến cấu hình | `Asia/Ho_Chi_Minh` | Múi giờ chuẩn để tính chu kỳ làm mới hạn mức ngày `01` hằng tháng |
| `MONTHLY_QUOTA_GB` | Biến cấu hình | `50` | Tham số tham chiếu hạ tầng máy chủ (**không ghi đè** hạn mức mặc định từng gói dịch vụ) |
| `SESSION_SECRET` | **Cloudflare Secret** | *(Đặt qua `wrangler secret put`)* | Khóa bí mật ký bảo vệ CSRF và phiên xác thực |
| `ADMIN_BOOTSTRAP_SECRET` | **Cloudflare Secret** | *(Đặt qua `wrangler secret put`)* | Mã bí mật máy chủ dùng một lần để khởi tạo Quản trị viên cấp cao đầu tiên |
| `RESEND_API_KEY` | **Cloudflare Secret** | *(Đặt qua `wrangler secret put`)* | Khóa API dịch vụ gửi email giao dịch Resend |
| `GOOGLE_CLIENT_ID` | Biến OAuth | *(Tùy chọn)* | Client ID ứng dụng Google OAuth 2.0 |
| `GOOGLE_CLIENT_SECRET` | **Cloudflare Secret** | *(Tùy chọn)* | Client Secret ứng dụng Google OAuth 2.0 |
| `FACEBOOK_CLIENT_ID` | Biến OAuth | *(Tùy chọn)* | App ID ứng dụng Facebook OAuth 2.0 |
| `FACEBOOK_CLIENT_SECRET` | **Cloudflare Secret** | *(Tùy chọn)* | App Secret ứng dụng Facebook OAuth 2.0 |
| `MICROSOFT_CLIENT_ID` | Biến OAuth | *(Tùy chọn)* | Client ID ứng dụng Microsoft Entra ID OAuth 2.0 |
| `MICROSOFT_CLIENT_SECRET` | **Cloudflare Secret** | *(Tùy chọn)* | Client Secret ứng dụng Microsoft OAuth 2.0 |
| `APPLE_CLIENT_ID` | Biến OAuth | *(Tùy chọn)* | Services ID ứng dụng Sign in with Apple |
| `APPLE_CLIENT_SECRET` | **Cloudflare Secret** | *(Tùy chọn)* | Private Key / Secret ứng dụng Sign in with Apple |

---

## MỤC 3. HƯỚNG DẪN CHạy MIGRATION & DỮ LIỆU (D1 & CỤC BỘ)

### 3.1. Chạy Migration và Seed trên môi trường Cục bộ
```bash
# Khởi tạo toàn bộ bảng từ database/schema.sql + các bản vá trong database/migrations/
npm run migrate

# Nạp dữ liệu chuẩn (05 ngôn ngữ, 05 gói dịch vụ tiếng Việt, bài tập mẫu, kỳ thi mẫu, tin tức, 34 đơn vị hành chính)
npm run seed

# Sao lưu và kiểm tra khả năng phục hồi dữ liệu
npm run backup
```

### 3.2. Chạy Migration và Seed trên Cloudflare D1 (`word`)
```bash
# 1. Áp dụng schema chính thức lên cơ sở dữ liệu D1 "word"
npx wrangler d1 execute word --remote --file=./database/schema.sql

# 2. Áp dụng bản nâng cấp 2026-2027 (phiên Admin riêng, OAuth state, lộ trình học tập, tin tức)
npx wrangler d1 execute word --remote --file=./database/migrations/0006_upgrade_2026_full_features.sql

# 3. Nạp dữ liệu tham chiếu ban đầu
npx wrangler d1 execute word --remote --file=./database/seeds/01_reference_data.sql
```

---

## MỤC 4. HƯỚNG DẪN TRIỂN KHAI CLOUDFLARE WORKERS, D1 & R2

```bash
# Bước 1: Đăng nhập tài khoản Cloudflare quản lý tên miền wordbridge.io.vn
npx wrangler login

# Bước 2: Kiểm tra kết nối D1 database "word" và R2 bucket "word"
npx wrangler d1 info word
npx wrangler r2 bucket list

# Bước 3: Thiết lập các biến bí mật (Secrets) trên Cloudflare Workers
npx wrangler secret put SESSION_SECRET
npx wrangler secret put ADMIN_BOOTSTRAP_SECRET
npx wrangler secret put RESEND_API_KEY

# Bước 4: Kiểm tra toàn vẹn cấu trúc trước khi phát hành
npm run verify
npm test

# Bước 5: Triển khai Worker lên https://wordbridge.io.vn
npx wrangler deploy
```

---

## MỤC 5. HƯỚNG DẪN CẤU HÌNH EMAIL GIAO DỊCH RESEND

1. **Xác thực tên miền gửi thư trên Resend:**
   - Truy cập bảng điều khiển [Resend Domains](https://resend.com/domains) và thêm tên miền `wordbridge.io.vn`.
   - Cấu hình các bản ghi DNS (`SPF`, `DKIM`, `DMARC`) vào Cloudflare DNS của `wordbridge.io.vn` cho đến khi trạng thái báo `Verified`.
2. **Định tuyến 04 địa chỉ Email chính thức:**
   - **Người gửi hệ thống tự động (`From`):** `WORD BRIDGE – Email tự động từ hệ thống <noreply@wordbridge.io.vn>`
   - **Liên hệ chính thức & chung:** `wordbridge.education@gmail.com`
   - **Chăm sóc khách hàng & Hỗ trợ (`Reply-To` cho tài khoản/đơn hàng):** `cskh@wordbridge.io.vn`
   - **Hợp tác & Truyền thông (`Reply-To` cho tổ chức/đối tác):** `contact@wordbridge.io.vn`
3. **Cơ chế xác nhận gửi thực tế (`src/adapters/email.adapter.js`):**
   - Mọi email khi tạo mới được xếp vào bảng `email_queue` với trạng thái `queued` (hoặc `provider_unconfigured` nếu chưa khai báo `RESEND_API_KEY`).
   - Hệ thống **chỉ chuyển trạng thái sang `sent` (`Đã gửi`) khi nhận được phản hồi HTTP `200/201` kèm `id` (`provider_id`) từ Resend API**.
   - Nếu mất kết nối hoặc khóa API lỗi, bản ghi giữ trạng thái `failed` kèm nguyên nhân lỗi và cho phép Quản trị viên bấm **Gửi lại (` POST /api/admin/emails/retry`)** mà không gửi trùng nhờ `idempotency_key`.

---

## MỤC 6. HƯỚNG DẪN CẤU HÌNH ĐĂNG NHẬP LIÊN KẾT OAUTH 2.0

1. **Nguyên tắc hiển thị minh bạch trên trang `/dang-nhap`:**
   - Hệ thống kiểm tra trạng thái cấu hình thực tế qua `GET /api/auth/oauth/providers`.
   - Nút đăng nhập nhanh (Google, Facebook, Microsoft, Apple) **chỉ hiển thị ở trạng thái sẵn sàng khi máy chủ đã được cấu hình đầy đủ `CLIENT_ID` và `CLIENT_SECRET`**. Tuyệt đối không hiển thị nút giả chỉ bật thông báo toast.
   - Không hỗ trợ Zalo theo đúng định hướng kiến trúc.
2. **Callback URI chuẩn cần khai báo trên Console của các nhà cung cấp:**
   - `https://wordbridge.io.vn/api/auth/oauth/callback`
3. **Cơ chế bảo mật OAuth 2.0 PKCE & Chống chiếm đoạt tài khoản:**
   - Mỗi yêu cầu khởi tạo (`GET /api/auth/oauth/authorize?provider=...`) sinh `state` ngẫu nhiên lưu vào bảng `oauth_states` kèm `code_verifier` (PKCE `S256`) có thời hạn 10 phút.
   - Nếu email trả về từ OAuth trùng với tài khoản đã tồn tại trên WORD BRIDGE nhưng chưa liên kết, hệ thống **bắt buộc xác minh chính chủ** (`ownership_verified`) trước khi gộp vào hồ sơ chung.

---

## MỤC 7. HƯỚNG DẪN TẠO QUẢN TRỊ VIÊN ĐẦU TIÊN AN TOÀN & ĐĂNG NHẬP CỔNG RIÊNG

1. **Tuyệt đối không tự cấp quyền Admin cho người đăng ký đầu tiên:**
   - Mọi tài khoản tạo qua `/dang-ky` (`POST /api/auth/register`) luôn có vai trò `user` (`Thành viên Cá nhân`).
2. **Quy trình khởi tạo Quản trị viên Cấp cao (`super_admin`) đầu tiên:**
   - Thiết lập biến môi trường bí mật `ADMIN_BOOTSTRAP_SECRET` trên máy chủ.
   - Gửi yêu cầu khởi tạo một lần duy nhất tới `POST /api/admin/auth/bootstrap`:
     ```bash
     curl -X POST https://wordbridge.io.vn/api/admin/auth/bootstrap \
       -H "Content-Type: application/json" \
       -d '{
         "bootstrap_secret": "<GIÁ_TRỊ_ADMIN_BOOTSTRAP_SECRET>",
         "full_name": "Ban Quản trị Cấp cao WORD BRIDGE",
         "email": "admin@wordbridge.io.vn",
         "phone": "0988504210",
         "password": "<MẬT_KHẨU_MẠNH_TỐI_THIỂU_15_KÝ_TỰ_3_KÝ_TỰ_ĐẶC_BIỆT>",
         "security_code": "<MÃ_BẢO_VỆ_QUẢN_TRỊ_TỐI_THIỂU_10_KÝ_TỰ>"
       }'
     ```
   - Ngay sau khi khởi tạo thành công, cờ `first_admin_bootstrapped = 1` trong bảng `admin_security_state` được khóa vĩnh viễn; mọi lệnh gọi bootstrap tiếp theo đều bị từ chối (`403 Forbidden`) và ghi vào `audit_logs`.
3. **Cổng đăng nhập Quản trị viên riêng biệt (`/quan-tri/dang-nhap`):**
   - Không đặt liên kết Quản trị trên Header hoặc Footer công khai.
   - Quản trị viên truy cập trực tiếp `/quan-tri/dang-nhap`, xác thực bằng Email, Mật khẩu và Mã bảo vệ Quản trị (`POST /api/admin/auth/login`).
   - Phiên Quản trị được lưu tách biệt trong bảng `admin_sessions` (tiền tố `wbadm_`), sử dụng cookie `HttpOnly; SameSite=Strict` và bộ nhớ phiên tạm thời, không lưu token nhạy cảm trong `localStorage`.
   - Nếu nhập sai quá 05 lần, cổng Quản trị tự động khóa tạm thời 15 phút và xếp hàng gửi email cảnh báo bảo mật (`security-alert.html`).

---

## MỤC 8. HƯỚNG DẪN VẬN HÀNH & XỬ LÝ SỰ CỐ (OPERATIONS & TROUBLESHOOTING)

1. **Làm mới hạn mức lưu trữ Tổ chức vào ngày 01 hằng tháng:**
   - Các gói Tổ chức (`org_trial`, `org_plus_monthly`: `50 GB/tổ chức/tháng`; `org_plus_yearly`: `120 GB/tổ chức/tháng`) được làm mới bộ đếm dung lượng tải lên trong tháng vào ngày `01` hằng tháng theo múi giờ `Asia/Ho_Chi_Minh` (`POST /api/admin/storage/cycles/reset`), không cộng dồn dung lượng dư sang tháng sau và **không xóa tệp cũ đã lưu**.
2. **Xử lý khi người dùng hoặc tổ chức chạm hạn mức lưu trữ:**
   - Khi đạt `100%` hạn mức, hệ thống chặn tải tệp mới (`403/400 Over Quota`), hiển thị cảnh báo rõ ràng trên trang `/quan-tri/luu-tru`, nhưng vẫn cho phép xem và tải xuống toàn bộ dữ liệu cũ.
3. **Đối soát thanh toán QR & Hoàn tiền an toàn:**
   - Thao tác bấm *"Tôi đã chuyển khoản"* của khách hàng (`POST /api/payments/notify-transfer`) chỉ chuyển đơn hàng vào danh sách chờ đối soát, không tự kích hoạt dịch vụ.
   - Quản trị viên Tài chính kiểm tra sao kê thực tế và xác nhận qua `POST /api/payments/reconcile`.
   - Khi hoàn tiền đơn hàng Tổ chức (`POST /api/payments/refund`), hệ thống chỉ đưa gói của Tổ chức về mức cơ bản (`org_trial`), tuyệt đối không đụng chạm hay hạ gói cá nhân (`users.plan_code`) của người đại diện mua đơn hàng.
4. **Chế độ Bảo trì Hệ thống (`/quan-tri/bao-tri`):**
   - Trước khi bật bảo trì toàn hệ thống hoặc theo phân hệ, hệ thống tự động cộng bù `15 phút` (`900 giây`) và lưu bài làm cho toàn bộ phiên thi Khảo Thí đang diễn ra (`exam_sessions`), đồng thời giữ nguyên trạng thái các đơn hàng đang chờ đối soát.
