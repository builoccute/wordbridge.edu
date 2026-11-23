# Báo Cáo Nghiệm Thu & Bàn Giao Sản Phẩm — WORD BRIDGE V4.2

## 1. Tóm tắt các hạng mục đã hoàn thiện (P0 – P5)
- **P0 — Bảo mật & Ổn định Worker:**
  - Chặn hoàn toàn `/quan-tri`, `/quan-tri/*`, `/admin`, `/admin/*` trả về `404` (không chuyển hướng, không lộ cấu trúc HTML/API quản trị).
  - Gỡ nút Quản trị khỏi Header/Footer, gỡ toàn bộ tham chiếu `/quan-tri` khỏi `/help`, trang bảo trì `503`, `constants.js`, `sitemap.js`, và `/api/v1/openapi.json`.
  - Giữ nguyên `AdminService` và `/api/v1/admin/*` ở tầng backend với xác thực phiên + RBAC + CSRF nghiêm ngặt.
  - Khắc phục các nguồn gây Cloudflare 1101 trong `src/utils/crypto.js` và `src/index.js`, bổ sung structured error logging nội bộ và lưới chống crash kép cho `fetch()` & `scheduled()`.
- **P1 — Thống nhất kiến trúc & Build:**
  - Thống nhất entrypoint duy nhất `src/index.js` với native `DB`, `R2`, `ASSETS`.
  - Đồng bộ `scripts/build.mjs`, `package.json`, `src/types/index.d.ts` — `npm run build` kiểm tra 42 module JS và xác minh ranh giới song ngữ / bảo mật thành công.
- **P2 — Loại bỏ hoàn toàn Tiếng Nga khỏi sản phẩm công khai:**
  - Cập nhật `constants.js`, `validation.js`, `types/index.d.ts`, `dictionary-service.js`, `reader-service.js`, `practice-service.js`, `intelligence-service.js`, toàn bộ `src/pages/*.js`, `public/scripts/app.js`, `i18n.js`, mẫu email và xóa `public/branding/card-ru.jpg`.
  - Chặn `/learning/russian`, `/learning/ru`, `/dictionary/russian`, `/specialized/russian` trả về `410 Gone`.
  - Tạo migration không phá hủy `database/migrations/0014_v42_bilingual_zh_en_archive_ru.sql` và kịch bản rollback `database/rollbacks/0014_v42_rollback.sql` (không `DROP TABLE`, không xóa tài khoản hay lịch sử người học).
- **P3 & P4 — Tái cấu trúc giao diện & Làm sạch nội dung:**
  - Ánh xạ toàn bộ 22 ảnh tham chiếu (`docs/UI-REFERENCE-MAP.md`), nâng cấp `public/styles/design-system.css` theo bảng màu chính thức (`#146466`, `#C92F1C`, `#5AABA9`, `#E2E2C4`), responsive 360px–1920px.
  - Xây dựng trọn bộ trang lỗi `src/pages/error-pages.js` (400–504 & 1101 Worker Exception).
  - Làm sạch toàn bộ thông báo kỹ thuật nội bộ trên giao diện công khai.

## 2. Danh sách Route Công Khai Cuối Cùng (Song ngữ Trung – Anh)
- **Công khai & Hỗ trợ:** `/`, `/features`, `/about`, `/faq`, `/contact`, `/help`, `/policies/:slug`, `/search`
- **Hệ thống Học ngoại ngữ:** `/learning`, `/learning/chinese`, `/learning/english`, `/learning/path`, `/learning/skills`, `/skills/:skill` (7 kỹ năng: vocabulary, grammar, listening, speaking, pronunciation, reading, writing), `/programs/:slug`, `/courses/:slug`, `/courses/:slug/curriculum`, `/modules/:slug`, `/weeks/:slug`, `/lessons/:slug`, `/lessons/:slug/result`, `/my-learning`, `/my-learning/history`, `/my-learning/vocabulary`, `/my-knowledge`, `/my-mistakes`
- **Từ điển & Flashcards:** `/dictionary`, `/dictionary/chinese`, `/dictionary/english`, `/dictionary/:lang/:slug`, `/vocabulary`, `/vocabulary/notebook`, `/vocabulary/sets`, `/vocabulary/flashcards`, `/vocabulary/review`
- **Cổng Luyện Tập:** `/practice`, `/practice/listening`, `/practice/speaking`, `/practice/reading`, `/practice/writing`, `/practice/vocabulary`, `/practice/grammar`, `/practice/history`, `/practice/results/:id`
- **Chuyên ngành, Thư viện đọc & Trí tuệ ngôn ngữ:** `/specialized`, `/specialized/:slug`, `/reader`, `/reader/:slug`, `/intelligence`, `/intelligence/:slug`, `/learner-meet`, `/learner-meet/*`
- **Tài khoản & Bảo mật:** `/login`, `/register`, `/verify-email`, `/forgot-password`, `/reset-password`, `/profile`, `/account`, `/account/passkeys`, `/account/sessions`, `/account/student-benefit`

## 3. Danh sách Route Đã Loại Bỏ / Chặn Truy Cập
- **Chặn 404 (P0 — không chuyển hướng, không lộ cấu trúc):** `/quan-tri`, `/quan-tri/*`, `/admin`, `/admin/*`
- **Loại bỏ 410 Gone (Tiếng Nga):** `/learning/russian`, `/learning/ru`, `/dictionary/russian`, `/dictionary/ru`, `/specialized/russian`, `/specialized/ru`, `/branding/card-ru.jpg`
- **Loại bỏ 410 Gone (Khảo thí / Chứng chỉ / OAuth / Mạng xã hội / B2B):** `/examinations`, `/examinations/*`, `/examination-attempts/*`, `/examination-results/*`, `/oauth/callback`, `/account/linked-accounts`, `/social`, `/friends`, `/feed`, `/organizations`, `/account/subscription`, `/api/v1/examinations/*`, `/api/v1/auth/oauth/*`

## 4. Kết quả Kiểm thử Tự động (Local Verification)
- `npm run lint:check`: **PASS** (0 lỗi cú pháp).
- `npm run build`: **PASS** (`42 JS modules verified, native D1/R2/ASSETS unified`).
- `npm test`: **34/34 PASS (0 FAIL)** gồm:
  - `tests/integration/oauth-passkey-ownership.test.js` (3/3 PASS)
  - `tests/integration/v4-contract.test.mjs` (21/21 PASS)
  - `tests/integration/v41-one-domain-complete.test.mjs` (4/4 PASS)
  - `tests/integration/v42-bilingual-security-1101.test.mjs` (3/3 PASS — chặn P0 admin, 0 tiếng Nga, xử lý lỗi 1101 & Worker an toàn)
  - `tests/unit/client-workflows.test.mjs` (3/3 PASS — flashcard keyboard/swipe, micro, i18n)

## 5. Các hạng mục còn thiếu đầu vào / cần quyền Production của Chủ dự án
1. **Cloudflare Production Logs:** Cần quyền truy cập Cloudflare Dashboard để đối chiếu log thực tế của Ray ID `a5ee8729dc25797c`.
2. **Canonical Host Production:** Cần đối chiếu cấu hình DNS/Redirect thực tế giữa `wordbridge.io.vn` và `www.wordbridge.io.vn` trước khi bật redirect một chiều.
3. **Chạy Migration 0014 trên D1 Production:** Không tự ý chạy; cần sao lưu D1 bằng `scripts/d1-backup.sh` và có sự phê duyệt của chủ dự án trước khi chạy `npm run db:migrate:remote`.
4. **Dịch vụ bên thứ ba (Secrets chưa cấu hình):** Email transactional provider (`EMAIL_PROVIDER`, `EMAIL_API_KEY`), ASR chấm điểm phát âm chi tiết (`ASR_PROVIDER`, `ASR_API_KEY`), WebRTC SFU cho Learner Meet (`LEARNER_MEET_PROVIDER`), và tải các tệp audio chính thức lên R2 bucket `word`.
5. **Tệp ảnh tham chiếu trang Đọc hiểu:** Chưa có ảnh riêng trong ZIP gốc; đã thiết kế đồng bộ theo Design System của Nghe/Nói/Viết.


---

# Báo Cáo Điều Tra & Khắc Phục Lỗi Cloudflare 1101 — WORD BRIDGE

## 1. Thông tin sự cố
- **Domain:** `www.wordbridge.io.vn`
- **Error code:** `1101` (`Worker threw an exception`)
- **Ray ID:** `a5ee8729dc25797c`
- **Thời điểm:** `2026-11-23 07:40:49 UTC`

> **Tuyên bố minh bạch về quyền truy cập Production:** Môi trường thực thi hiện tại không có quyền truy cập Cloudflare Dashboard / Workers Logs production nên **chưa thể truy xuất log trực tiếp của Ray ID `a5ee8729dc25797c` trên hạ tầng production**. Toàn bộ quá trình điều tra dưới đây được thực hiện bằng kiểm toán toàn bộ mã nguồn, đồ thị import/export, cấu hình `wrangler.toml`, kịch bản build và kiểm thử runtime thực tế ở tầng Worker (`src/index.js`).

## 2. Xác định Worker thực tế & Đồ thị mã nguồn
- **Entrypoint triển khai (`wrangler.toml`):** `main = "src/index.js"` (`name = "wordbridge-edu"`).
- **Bindings thực tế:** `ASSETS` (`./public`), `DB` (D1 `word`, ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771`), `R2` (bucket `word`), cron `*/15 * * * *`.
- **Phát hiện mâu thuẫn kiến trúc:** `scripts/build.mjs` trước đó chặn `[[d1_databases]]` và `[[r2_buckets]]` dù `src/index.js` phụ thuộc trực tiếp vào `env.DB` và `env.R2`. Ngoài ra tồn tại 19 tệp legacy không được import (`src/worker.mjs`, `src/api/router.mjs`, `src/pages/app-shell.mjs`, ...).

## 3. Các nguyên nhân gốc gây ngoại lệ Worker 1101 đã phát hiện và sửa trực tiếp trong mã nguồn

1. **Import top-level `node:crypto` trong `src/utils/crypto.js`:**
   - **Trước khi sửa:** `import { webcrypto as nodeWebCrypto } from 'node:crypto';` chạy ngay khi khởi tạo module. Nếu Worker production chạy mà chưa bật cờ `nodejs_compat` tương thích hoặc runtime edge không giải quyết được `node:crypto`, Worker sẽ crash ngay lúc khởi động bằng **Cloudflare 1101** trước khi vào hàm `fetch()`.
   - **Đã khắc phục:** Chuyển sang sử dụng trực tiếp `globalThis.crypto` chuẩn Web Crypto của Cloudflare Workers (không bao giờ gọi `node:crypto` trên Cloudflare Workers; chỉ dùng dynamic fallback khi chạy test trên Node 18 cũ).

2. **Ngoại lệ không được bắt ở ngoài `try/catch` trong `fetch()` và `scheduled()` (`src/index.js`):**
   - **Trước khi sửa:** `new URL(request.url)` nằm ngoài khối `try/catch`; khối `catch` gọi `render500Page(path)` không có lưới bảo vệ chống lỗi thứ cấp (double fault); hàm `scheduled(event, env)` hoàn toàn không có `try/catch`.
   - **Đã khắc phục:** Bọc `try/catch` toàn diện cho cả `new URL(request.url)`, toàn bộ luồng `fetch()`, `loadStaticAsset()` (`ASSETS.fetch`), `scheduled()` và bổ sung `emergencyFallback500(requestId)` khi lỗi render thứ cấp xảy ra.

3. **Thiếu cơ chế ghi nhận lỗi cấu trúc (Structured Internal Error Logging):**
   - **Trước khi sửa:** Khối `catch` trong `src/index.js` nuốt lỗi im lặng (`catch { return render500Page(path); }`), không ghi nhận Request ID, đường dẫn, loại lỗi hay stack trace nội bộ.
   - **Đã khắc phục:** Thêm `logInternalError()` ghi log JSON nội bộ gồm `timestamp`, `requestId` (ưu tiên `cf-ray`), `phase`, `path`, `errorType`, `message`, `stack`, `status` — tuyệt đối không trả stack trace, secrets hoặc token ra giao diện người dùng.

4. **Lệch cấu hình tên miền giữa `wordbridge.io.vn` và `www.wordbridge.io.vn`:**
   - `ALLOWED_RETURN_ORIGINS` trong `src/config/constants.js` trước đây chỉ liệt kê `https://wordbridge.io.vn`. Đã bổ sung `https://www.wordbridge.io.vn` vào `ALLOWED_RETURN_ORIGINS` và ghi rõ hướng dẫn kiểm tra canonical redirect một chiều trên Cloudflare để tránh vòng lặp redirect.

5. **Xử lý sai ngữ nghĩa mã lỗi 1101 trên giao diện tham chiếu:**
   - Ảnh tham chiếu số 03 ghi nhầm 1101 là "Phiên đăng nhập không hợp lệ". Đã xây dựng `src/pages/error-pages.js` xử lý mã `1101` đúng bản chất là **Sự cố thực thi hệ thống (Worker Exception)**.

## 4. Các bước xác minh bắt buộc trên Cloudflare Production (cần quyền chủ dự án)
1. Mở **Cloudflare Dashboard -> Workers & Pages -> `wordbridge-edu` -> Logs** và lọc theo Ray ID `a5ee8729dc25797c` hoặc khung giờ `2026-11-23 07:40:49 UTC` để đối chiếu stack trace thực tế tại thời điểm sự cố.
2. Xác nhận Worker đang gắn với route `www.wordbridge.io.vn/*` và `wordbridge.io.vn/*` đúng là `wordbridge-edu` (entrypoint `src/index.js`), có đủ binding `DB`, `R2`, `ASSETS` và cờ `nodejs_compat`.
3. Xác nhận quy tắc chuyển hướng canonical giữa `wordbridge.io.vn` và `www.wordbridge.io.vn` khớp với `APP_BASE_URL` và `WEBAUTHN_RP_ID`.


---

# Bảng Ánh Xạ 22 Ảnh Giao Diện Tham Chiếu — WORD BRIDGE V4.2

Tài liệu đối chiếu toàn bộ 22 tệp ảnh tham chiếu thiết kế từ `ẢNH GIAO DIỆN WED.zip` với route thực tế, thành phần mã nguồn, trạng thái triển khai và các điều chỉnh bắt buộc theo quy định sản phẩm V4.2 (song ngữ Trung – Anh, không có cổng quản trị công khai, xử lý đúng mã lỗi 1101).

| STT | Tệp ảnh tham chiếu | Trang / Route tương ứng | Thành phần mã nguồn | Trạng thái triển khai | Điểm điều chỉnh / Ghi chú |
| --- | --- | --- | --- | --- | --- |
| 01 | `06977332-dfc2-43a0-b934-9e92b35a661b.webp` | `/register` — Đăng ký tài khoản | `src/pages/account-pages.js` (`renderRegisterPage`) | Đã triển khai HTML/CSS/JS thực tế | Giữ đủ 8 trường bắt buộc (Trường học & Nơi làm việc độc lập), bố cục 2 cột, không có OAuth Google/Facebook. |
| 02 | `0997827c-36f7-4c75-92e7-ef57d85438ef.webp` | `/practice/listening`, `/skills/listening` | `src/pages/practice-exam-pages.js`, `src/pages/learning-system-pages.js` | Đã triển khai HTML/CSS/JS thực tế | Trình phát audio thực kết nối R2/metadata, không tạo bài tập giả. |
| 03 | `10b74828-ff36-4c0a-8898-17cdb5330215.webp` | Trang lỗi `1101` | `src/pages/error-pages.js` (`ERROR_CATALOG[1101]`) | Đã sửa & triển khai | **Đã sửa đúng bản chất**: Ảnh gốc ghi nhầm "Phiên đăng nhập không hợp lệ"; mã nguồn xử lý đúng là **Sự cố thực thi hệ thống (Cloudflare Worker Exception)**. |
| 04 | `13938f31-e73c-467a-a418-d42ffeff88b4.webp` | `/learning/chinese` — Học Tiếng Trung | `src/pages/learning-pages.js` (`renderLanguageLearningPage`) | Đã triển khai HTML/CSS/JS thực tế | Giữ khung tham chiếu HSK 1–6 & 7–9, Pinyin, chương trình nền tảng & chuyên ngành. |
| 05 | `17bc9b8f-1ab4-45fc-90c3-9307fef231b2.webp` | `/practice/speaking`, `/skills/speaking` | `src/pages/practice-exam-pages.js`, `public/scripts/app.js` | Đã triển khai HTML/CSS/JS thực tế | Ghi âm micro cục bộ, phát lại, thử lại; không chấm điểm phát âm giả. |
| 06 | `1e038a48-83b4-4718-ad61-9d454d301b7c.webp` | `/` — Trang chủ | `src/pages/public-pages.js` (`renderHomePage`) | Đã tái cấu trúc | Loại bỏ thẻ Tiếng Nga; cân đối lại lưới 2 thẻ ngôn ngữ **Tiếng Trung (ZH)** & **Tiếng Anh (EN)**, giữ dải giá trị cốt lõi, 12 ngành chuyên ngành và 4 thẻ công cụ. |
| 07 | `2dd71cfe-23ff-448d-a117-e005258bff92.webp` | `/skills/pronunciation` — Phát âm | `src/pages/learning-system-pages.js` | Đã triển khai HTML/CSS/JS thực tế | Hiển thị phiên âm IPA/Pinyin từ D1, nghe mẫu, ghi âm & phát lại cục bộ; không tạo điểm giả khi chưa cấu hình ASR. |
| 08 | `3d872cea-efb1-4bca-a30d-7b69cc09a184.webp` | `/learning/english` — Học Tiếng Anh | `src/pages/learning-pages.js` (`renderLanguageLearningPage`) | Đã triển khai HTML/CSS/JS thực tế | Sửa lỗi chữ trong ảnh tham chiếu ("Của viết: Chú Luân" -> chuẩn hóa thành "Chữ viết: Chữ Latin"), giữ CEFR A1–C2 & IPA. |
| 09 | `420dd155-91a3-42f0-8c9c-962d361446a0.webp` | Footer toàn website | `src/layouts/site-layout.js` (`renderPublicPage`) | Đã tái cấu trúc | Loại bỏ nút Tiếng Nga và số liệu thành viên chưa xác thực; hiển thị đúng 2 ngôn ngữ Trung – Anh, 12.104+ thuật ngữ chuyên ngành thật, wave SVG và thanh bản quyền. |
| 10 | `91a75d4b-7368-416b-824b-9ac975cc869f.webp` | `/vocabulary/flashcards` (tham khảo bố cục) | `src/pages/dictionary-pages.js`, `public/styles/design-system.css` | Chỉ lấy bố cục thẻ | Loại bỏ 100% nội dung tiếng Nga, dùng hoàn toàn dữ liệu Tiếng Trung / Tiếng Anh từ D1. |
| 11 | `97ef5e7e-f74a-4314-be56-5d7bb63be732.webp` | `/learning/skills` — Skill Center (7 hệ thống) | `src/pages/learning-system-pages.js` (`renderSkillCenterHub`) | Đã triển khai & làm sạch nội dung | Đầy đủ 7 hệ thống kỹ năng; đã thay câu kỹ thuật nội bộ ("presentation và bridge riêng...") bằng mô tả thân thiện cho người học. |
| 12 | `982d57e5-0fe8-422d-b6ef-1c45ad24f866.webp` | Trang lỗi `404` | `src/pages/error-pages.js` (`ERROR_CATALOG[404]`) | Đã triển khai HTML/CSS/SVG | Mã 404 lớn màu Deep Teal `#146466`, gạch nhấn Vermilion Red `#C92F1C`, nút Về Trang chủ & Khám phá Học tập. |
| 13 | `9ea70f0c-8775-4f0c-8ead-d3b10dd16c72.webp` | `/learning` — Hệ thống Học ngoại ngữ | `src/pages/learning-pages.js` (`renderLearningHub`) | Đã tái cấu trúc | Loại bỏ nút và thẻ chương trình Tiếng Nga (`RU-GEN`), chỉ hiển thị chương trình Tiếng Trung & Tiếng Anh. |
| 14 | `a59490db-db2e-437c-be99-43df2adc5045.webp` | `/practice/writing`, `/skills/writing` | `src/pages/practice-exam-pages.js`, `public/scripts/app.js` | Đã triển khai HTML/CSS/JS thực tế | Trình soạn thảo có đếm từ/ký tự CJK & Latin trực tiếp, nộp bài lưu D1. |
| 15 | `bf314f5d-a92b-481d-a6e1-6420e814ec08.webp` | `/specialized` & khối chuyên ngành Trang chủ | `src/pages/specialized-meet-pages.js`, `src/pages/public-pages.js` | Đã tái cấu trúc | Đầy đủ 12 bộ dữ liệu chuyên ngành (12.104 thuật ngữ) và 4 thẻ công cụ lõi bên dưới. |
| 16 | `c117b636-23df-4d08-a0b8-b3ce12ee9c96.webp` | `/login` — Đăng nhập | `src/pages/account-pages.js` (`renderLoginPage`) | Đã tái cấu trúc | Bố cục 2 cột: Form Email/Mật khẩu bên trái + khối "Vì sao chọn WORD BRIDGE?" 6 ô & quản lý Passkey bên phải. Không có OAuth. |
| 17 | `d5c5a2db-f997-48a2-ad30-465e07d515a9.webp` | `/skills/grammar`, `/practice/grammar` | `src/pages/learning-system-pages.js`, `src/pages/practice-exam-pages.js` | Đã triển khai HTML/CSS/JS thực tế | Kết nối câu hỏi & bài tập ngữ pháp Tiếng Trung / Tiếng Anh trong D1. |
| 18 | `dab8613b-70f4-4f79-b15d-a80aaa864845.webp` | `/vocabulary/flashcards` — Flashcard Từ vựng | `src/pages/dictionary-pages.js`, `public/scripts/app.js` | Đã triển khai HTML/CSS/JS thực tế | Thẻ 2D xếp lớp, lật thẻ bằng chuột/phím/vuốt cảm ứng, lưu tiến độ SM-2 thực tế vào D1. |
| 19 | `e32795f0-4a88-4777-994e-1a9d497961e9.webp` | `/practice` — Cổng Luyện Tập | `src/pages/practice-exam-pages.js` | Đã triển khai & lọc song ngữ | Lọc 6 kỹ năng + My Mistakes + Practice History; chỉ trả bài tập Tiếng Trung & Tiếng Anh. |
| 20 | `ef24f52e-f59b-4792-becd-1b61461d8631.webp` | Hệ thống trang lỗi (400–504 & 1101) | `src/pages/error-pages.js`, `src/services/quantri-client.js` | Đã triển khai đầy đủ | Bao phủ trọn bộ 400, 401, 403, 404, 408, 409, 410, 413, 415, 422, 429, 500, 502, 503, 504 và 1101; không lộ stack trace. |
| 21 | `efb5b4a1-e974-4d7c-9c68-e2e3f55ef354.webp` | `/help` — Trung Tâm Trợ Giúp | `src/pages/help-pages.js` (`renderHelpCenterPage`) | Đã tái cấu trúc | Banner Deep Teal viền đỏ, 5 nhóm hướng dẫn, 4 FAQ song ngữ Trung – Anh, form gửi & theo dõi yêu cầu hỗ trợ; **loại bỏ hoàn toàn mọi câu nhắc đến `/quan-tri`**. |
| 22 | `fe5bc5a5-8d2e-4b9b-a837-a7f098d6b99c.webp` | Trang Tiếng Nga (LOẠI BỎ) | Không đưa lên website; `/learning/russian` trả `410` | **Đã loại bỏ hoàn toàn** | Tuân thủ Quy tắc II.1: không giữ trang Tiếng Nga, không ẩn nút qua loa. |
| — | *(Chưa có ảnh riêng trong ZIP)* | `/skills/reading`, `/practice/reading` | `src/pages/learning-system-pages.js`, `src/pages/practice-exam-pages.js` | Đã thiết kế theo Design System | Đồng bộ phong cách với Nghe/Nói/Viết, chỉ dùng dữ liệu đọc hiểu thật từ D1 & `/reader`. |


---

