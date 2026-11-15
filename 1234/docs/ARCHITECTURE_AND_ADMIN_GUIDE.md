# TÀI LIỆU KIẾN TRÚC, HẠ TẦNG ĐỘC LẬP (PHỤ LỤC A), QUẢN TRỊ, CMS WORD, KHẢO THÍ & BẢO MẬT

## 1. Hạ tầng Database & Storage Độc lập (Phụ lục A – Mục A1, A8, A9)
- **Database riêng:** Định hướng **PostgreSQL 16 tự quản lý** trên máy chủ riêng của WORD BRIDGE (`docker-compose.yml` + `src/adapters/database.adapter.js`), kèm engine thực thi SQL nội bộ phục vụ kiểm thử khi chưa cấp phát máy chủ vật lý. Tuyệt đối **không sử dụng Cloudflare D1**.
- **Máy chủ Storage riêng:** Lưu tệp nhị phân trực tiếp trên cụm lưu trữ riêng (`src/adapters/storage.adapter.js`), phân tách vùng lưu trữ cá nhân (`personal_storage/<user_id>/...`) và vùng lưu trữ tổ chức (`org_storage/<org_id>/...`). Tuyệt đối **không sử dụng Cloudflare R2**, **không lưu tệp lớn dạng Base64 trong Database** và **không dùng RAM/localStorage làm nơi lưu trữ lâu dài**.
- **Sao lưu & Kiểm tra Phục hồi:** Hỗ trợ tạo bản sao lưu Database kèm kiểm tra toàn vẹn phục hồi (`verifyRestoreCapability`) và chụp ảnh nhanh toàn bộ kho tệp Storage (`backupStorageSnapshot`).

## 2. Quản lý Hạn mức & Chu kỳ Tháng (`/quan-tri/luu-tru` – Mục A2..A7)
- **Thứ tự ưu tiên hạn mức:** `Không giới hạn do Admin đặt` > `Hạn mức GB/TB riêng do Admin đặt` > `Hạn mức mặc định của gói dịch vụ`.Khi Admin gỡ cấu hình riêng (`remove_custom`), hạn mức tự động quay về mức mặc định của gói đang hoạt động.
- **Chu kỳ tháng (`Asia/Ho_Chi_Minh`):** Vào ngày `01` hàng tháng, bộ đếm `cycle_used_bytes` của các tổ chức `Organization Plus` được chốt lưu vào `storage_quota_cycles` và làm mới về `0` mà **không xóa bất kỳ tệp hay dữ liệu nào đã lưu** (`total_stored_bytes` giữ nguyên 100%).
- **Khi thành viên rời tổ chức:** Dữ liệu tổ chức do thành viên đó đã tải lên vẫn thuộc quyền sở hữu của tổ chức (`owner_org_id`), không tự động xóa và không chuyển sang tài khoản cá nhân.
