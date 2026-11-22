# WORD BRIDGE — Miền 1 (`wordbridge.io.vn`)

**Trạng thái: V4 work-in-progress, chưa sẵn sàng triển khai production.** Đây là bản chỉnh sửa có kiểm chứng trên ZIP đầu vào, không phải bản đã đạt toàn bộ tiêu chí nghiệm thu.

## Phạm vi và nguyên tắc

- Entrypoint Worker: `src/index.js` qua `wrangler.toml`; Cloudflare Assets lấy từ `public/`.
- Chỉ tái cấu trúc **Miền 1**. Các miền `portal`, `quantri`, `exam`, `help`, `reader` là hệ thống độc lập, không triển khai trong repo này.
- V4 chỉ kết nối SQLite/file storage qua dịch vụ nội bộ ở `quantri.wordbridge.io.vn`; cấu hình Worker không có binding D1/R2 trực tiếp. Cần kiểm tra hợp đồng API và secret (`QUANTRI_INTERNAL_SECRET`) trước production.
- UI chọn đúng **VI/EN**; bộ khung chung có dịch thuật, **nội dung trang chưa dịch hoàn chỉnh**. Ngôn ngữ học không phụ thuộc ngôn ngữ UI.
- Giao diện đầu xem công khai; tương tác yêu cầu xác thực, hỗ trợ `next`/`intent` về Portal. Dữ liệu riêng tư không công khai.
- Icon SVG đơn sắc `currentColor`; tránh liên kết rỗng/hành động giả. Không khôi phục social, B2B, legacy subscription ở Miền 1.
- Giữ nguyên tất cả migration SQL và dữ liệu chuyên ngành; thay đổi schema/auth/legacy entitlements phải có hợp đồng backend và migration riêng.

## Chạy kiểm tra

Yêu cầu Node.js >=18.18 và Python3 (SQLite shim cục bộ):

```bash
npm run lint:check
npm run build
npm test
npm run dev:local
```

Bộ hợp đồng hiện hành chạy bằng `npm run test:v4`. Kết quả vòng này là **24/24 PASS**. Ba test tương thích V3 yêu cầu trả HTML quản trị/Help tại Miền 1 còn thất bại đúng tại các redirect đã được kiểm tra riêng. Xem [ma trận nghiệm thu và bằng chứng](docs/ACCEPTANCE.md).

`npm run build` là preflight tĩnh, không chứng minh Cloudflare Worker deploy đã thành công. Không chạy deploy trước khi kiểm tra hợp đồng control-plane, đăng nhập/SSO, vận hành dữ liệu thực tế và browser QA.

## Tài liệu hiện hành

- [`docs/ACCEPTANCE.md`](docs/ACCEPTANCE.md): kiến trúc hiện hành, giới hạn và các chặn triển khai.
- Bên ngoài ZIP mã nguồn: `wordbridge-audit.zip` có route registry, link crawl, báo cáo cleanup và test.
- Bên ngoài ZIP mã nguồn: `wordbridge-legacy-archive.zip` lưu các tài liệu/script/template V3 đã chuyển ra khỏi repo production. **Không dùng chúng làm sự thật kỹ thuật V4.**

Đây là bản triển khai từng phần dựa trên AI Implementation Playbook của người dùng; không báo đã hoàn tất 12 learning systems, VI/EN toàn bộ trang hoặc mọi tiêu chí Definition of Done.
