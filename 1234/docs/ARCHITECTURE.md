# KIẾN TRÚC TỔNG THỂ HỆ THỐNG WORD BRIDGE (`docs/ARCHITECTURE.md`)

## 1. Tổng quan Kiến trúc & Định vị Sản phẩm
**WORD BRIDGE** (*Where Languages Bring People Together.*) là nền tảng học tập, thực hành, khảo thí và phân tích trí tuệ ngôn ngữ trực tuyến dành cho ba ngôn ngữ: **Tiếng Trung (`zh`)**, **Tiếng Anh (`en`)** và **Tiếng Nga (`ru`)** tại tên miền chính [https://www.wordbridge.vn/](https://www.wordbridge.vn/).

Nền tảng tuân thủ kiến trúc nguyên khối mô-đun hóa (Modular Monolith on Serverless Edge) vận hành trực tiếp trên **Cloudflare Workers**, kết nối nguyên bản với cơ sở dữ liệu **Cloudflare D1 (`word`)** và kho lưu trữ đối tượng **Cloudflare R2 (`word`)** mà không chia tách thành các subdomain rời rạc cho từng phân hệ học tập. Ứng dụng độc lập duy nhất nằm ngoài website chính là **PDF Reader** tại `https://reader.wordbridge.vn/` (chỉ kết nối qua cầu nối tài khoản trung tâm SSO khi có thông số kỹ thuật, tuyệt đối không xuất hiện trên Header, Footer hay Trang chủ của WORD BRIDGE).

## 2. Sơ đồ Kiến trúc Luồng Dữ liệu & Thành phần Hệ thống

```
[ Người dùng (Desktop / Laptop / Tablet / Android / iPhone) ]
                           │
                           ▼ (HTTPS / TLS 1.3 / Cloudflare WAF)
┌────────────────────────────────────────────────────────────────────────────┐
│                   WEBSITE CHÍNH: https://www.wordbridge.vn/                │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Tầng Giao diện (SSR App Shell + Hydrated Client + Design System CSS) │  │
│  │ • 10 Phân hệ chính • Header 8 mục chuẩn • Footer 4 cột • Quản trị VI │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Tầng Bảo mật, Xác thực & Phân quyền (Authentication & RBAC Guard)    │  │
│  │ • PBKDF2-SHA256 (100.000 vòng) • Liên kết xác minh Email (Không OTP) │  │
│  │ • WebAuthn/FIDO2 Passkey (Chỉ lưu Public Key) • OAuth 4 Providers    │  │
│  │ • CSRF / XSS / SQLi Guard / Rate Limiter / Brute-Force Lockout       │  │
│  │ • RBAC 9 Vai trò Quản trị + Kiểm tra Quyền sở hữu Dữ liệu (IDOR)     │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
│                                     │                                      │
│                                     ▼                                      │
│  ┌──────────────────────────────────────────────────────────────────────┐  │
│  │ Tầng Nghiệp vụ Lõi & 15 Hệ thống Trí tuệ Ngôn ngữ (Backend Router)   │  │
│  │ • Học tập (Trung/Anh/Nga) & Ngoại ngữ chuyên ngành (Chỉ Trung & Anh) │  │
│  │ • Từ điển & Spaced Repetition (SM-2) • Luyện tập 4 kỹ năng           │  │
│  │ • Khảo thí (HSK/CEFR/TORFL - Không cấp chứng chỉ)                    │  │
│  │ • Learner Meet (Chỉ Audio/Video - Không Chat/Record/ScreenShare)     │  │
│  │ • 15 Hệ thống Trí tuệ Ngôn ngữ (Language DNA -> Observatory)         │  │
│  └──────────────────────────────────────────────────────────────────────┘  │
└───────────────┬──────────────────────┬──────────────────────┬──────────────┘
                │                      │                      │
                ▼                      ▼                      ▼
┌───────────────────────────┐ ┌────────────────────┐ ┌───────────────────────┐
│   CLOUDFLARE D1 (`word`)  │ │ CLOUDFLARE R2(`word`)│ │ CÁC ADAPTER TÍCH HỢP  │
│ ID: ce84cc48-6d49-409b-   │ │ • 11 tiền tố chuẩn │ │ • Email Adapter (3    │
│     b45a-13ba3bc4a771     │ │ • Phân quyền tệp   │ │   địa chỉ + Reply-To) │
│ • 35 bảng chuẩn hóa       │ │   Public / Private │ │ • OAuth (Google, FB,  │
│ • 100% Prepared Statement │ │ • Quét tệp mồ côi  │ │   Microsoft, Apple)   │
│ • Không dùng DROP TABLE   │ │ • Cấm lưu bản ghi  │ │ • WebRTC Learner Meet │
│ • Có Backup / Restore     │ │   Learner Meet     │ │ • SSO PDF Reader      │
└───────────────────────────┘ └────────────────────┘ └───────────────────────┘
```

## 3. Lựa chọn Công nghệ (Technology Stack) & Lý do Lựa chọn

| Hạng mục | Công nghệ lựa chọn | Lý do lựa chọn & Tương thích Cloudflare | Chi phí & Hạn chế |
| :--- | :--- | :--- | :--- |
| **Runtime & Backend** | Cloudflare Workers (ES Modules `export default`) | Tương thích 100% với D1 binding `DB` và R2 binding `STORAGE`, độ trễ toàn cầu thấp, không có cold-start. | Thuộc gói Free/Included của Cloudflare; giới hạn thời gian CPU mỗi request được tối ưu nhờ thuật toán nhẹ. |
| **Ngôn ngữ lập trình** | JavaScript (ES2024 `.mjs`) + TypeScript Definitions (`.d.ts`) | Không cần trình biên dịch nặng hay phụ thuộc Node.js native (`fs`, `child_process`) trong Worker bundle. | Đảm bảo build thành công 100% trên mọi môi trường CI/CD. |
| **Frontend & UI** | Server-Side Rendered HTML5 + Modular Client ES Module + Custom CSS Design Tokens | Tải trang tức thì, kiểm soát tuyệt đối khả năng tiếp cận (WCAG AA), hiển thị chuẩn chữ Việt, chữ Hán và chữ Nga. | Không phát sinh chi phí bản quyền thư viện UI bên thứ ba. |
| **Database Access** | Parameterized SQL Layer trên Cloudflare D1 (`word`) | Sử dụng `.prepare(sql).bind(...params)` chống triệt để SQL Injection; đi kèm bộ kiểm tra chặn lệnh `DROP TABLE`. | Tuân thủ giới hạn kích thước truy vấn SQLite của Cloudflare D1. |
| **Object Storage** | Cloudflare R2 (`word` - Default Storage Class) | Không tính phí băng thông chiều ra (Zero Egress Fee), hỗ trợ metadata tùy chỉnh phân quyền tệp công khai và riêng tư. | Bắt buộc kiểm tra loại tệp và dung lượng trước khi ghi. |
| **Authentication & RBAC** | Web Crypto API (`PBKDF2-SHA256`, `SHA-256`) + Session Cookie `HttpOnly` + WebAuthn Passkey + OAuth 2.0 Adapter | Bảo mật chuẩn công nghiệp ngay trên Edge runtime mà không cần thư viện C++ bên ngoài (`bcrypt` native). | Các nhà cung cấp OAuth cần điền Client ID/Secret thực tế trước khi kích hoạt trên production. |
| **Email Integration** | `EmailDeliveryAdapter` (Hỗ trợ Resend HTTP API & 11 mẫu HTML/PlainText nội bộ) | Thực thi đúng 3 địa chỉ email chính thức, quy tắc `Reply-To: cskh@wordbridge.vn` và logo SVG/HTML fallback (không dùng PNG). | Không tự ý kích hoạt dịch vụ trả phí; ghi nhận trạng thái chờ cấu hình khi chưa có API Key. |
| **Testing Framework** | Node.js Native Test Runner (`node --test`) | Chạy trực tiếp 4 tầng kiểm thử (Unit, Integration, Security, E2E) không cần tải gói phụ thuộc ngoài mạng. | Đạt 100% pass rate (14/14 test suites). |
