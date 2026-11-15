# BÁO CÁO KIỂM THỬ & ĐỐI CHIẾU NGHIỆM THU TOÀN HỆ THỐNG + PHỤ LỤC A (A1–A10)

| Hạng mục Nghiệm thu (PHẦN 32 & PHỤ LỤC A10) | Trạng thái | Minh chứng Kỹ thuật trong Mã nguồn |
|---|---|---|
| **1. Một Website duy nhất tại `https://wordbridge.io.vn`, bỏ `/su-kien`, không Vipro** | ĐẠT | `src/config/constants.js`, `src/server.js` |
| **2. Database riêng (PostgreSQL tự quản lý) & Storage riêng; KHÔNG dùng Cloudflare D1/R2** | ĐẠT | `docker-compose.yml`, `src/adapters/database.adapter.js`, `src/adapters/storage.adapter.js` |
| **3. Không đặt giới hạn GB cố định chung cho toàn website** | ĐẠT | `GLOBAL_WEBSITE_FIXED_LIMIT_BYTES: null` |
| **4. Hạn mức mặc định: Personal Free 1 GB, Personal Plus 5 GB** | ĐẠT | `src/config/constants.js`, `src/modules/progress.module.js` |
| **5. Hạn mức Organization Plus: Tháng 50 GB/tháng, Năm 120 GB/tháng (Tối đa 30 thành viên, không nhân theo thành viên)** | ĐẠT | `src/modules/progress.module.js`, `src/modules/organizations.module.js` |
| **6. Làm mới bộ đếm tổ chức ngày 01 hàng tháng (`Asia/Ho_Chi_Minh`), không cộng dồn, không xóa dữ liệu cũ** | ĐẠT | `runMonthlyOrganizationQuotaReset()` trong `src/modules/progress.module.js` |
| **7. Admin điều chỉnh hạn mức riêng (GB/TB/Không giới hạn) ưu tiên hơn gói; gỡ cấu hình riêng về mặc định gói** | ĐẠT | `adminAdjustQuota()` tại `/quan-tri/luu-tru` |
| **8. Khi đạt/vượt hạn mức hoặc hạ gói: Ngăn tải mới, không xóa tệp cũ, giữ nguyên quyền đọc/tải xuống** | ĐẠT | `checkAndConsumeQuota()`, `downloadStorageFile()` |
| **9. Thành viên rời tổ chức không xóa tệp tổ chức, không chuyển quyền sở hữu sang cá nhân** | ĐẠT | `removeOrganizationMember()` trong `src/modules/organizations.module.js` |
| **10. Dashboard `/quan-tri/luu-tru`, Audit Log, Backup & Kiểm tra Phục hồi** | ĐẠT | `src/modules/admin.module.js`, `src/frontend/js/views-admin-cms.js`, `tests/full-system.test.js` |
