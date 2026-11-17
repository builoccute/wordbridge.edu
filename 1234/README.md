# WORD BRIDGE – NỀN TẢNG THỰC HÀNH TIẾNG ANH THEO CHUYÊN NGÀNH VÀ TÌNH HUỐNG NGHỀ NGHIỆP
## Tích hợp Phân hệ Lưu trữ Mã nguồn & Dữ liệu độc lập (`WORD BRIDGE SOURCE STORAGE`)

- **Tên sản phẩm**: WORD BRIDGE
- **Định hướng sản phẩm**: Nền tảng thực hành tiếng Anh theo chuyên ngành và tình huống nghề nghiệp
- **Đối tượng trọng tâm**:
  1. **Nhóm A**: Học viên Trung tâm GDNN–GDTX
  2. **Nhóm B**: Học sinh trường Trung cấp nghề
  3. **Nhóm C**: Sinh viên trường Cao đẳng nghề
  4. **Nhóm D**: Sinh viên đại học theo các khối ngành chuyên môn
  5. **Nhóm E**: Người đang làm việc chuyên môn
- **Phân hệ lưu trữ**: `WORD BRIDGE SOURCE STORAGE` (`Quản trị → Lưu trữ mã nguồn` | Đường dẫn riêng: `/luu-tru-ma-nguon`)
- **Kiến trúc hạ tầng**: GitHub + Cloudflare Workers / Next.js + Dịch vụ lưu trữ SQLite BLOB độc lập (`storage-service/server.py`).
- **Nguyên tắc kiến trúc**: Tuyệt đối **không sử dụng Cloudflare R2** và **không sử dụng Cloudflare D1**. Dữ liệu kho lưu trữ độc lập hoàn toàn với vòng đời build/redeploy của website.

---

## 1. Hướng dẫn cài đặt và khởi chạy

### Bước 1: Chuẩn bị biến môi trường
Sao chép tệp `.env.example` thành `.env` và cập nhật các khóa bảo mật:
```bash
cp .env.example .env
```
*(Lưu ý: Không bao giờ commit tệp `.env` thật, mật khẩu, private key, tệp `.db` production hoặc BLOB người dùng lên GitHub).*

### Bước 2: Khởi chạy Dịch vụ Lưu trữ SQLite BLOB độc lập (`storage-service`)
Dịch vụ lưu trữ chạy độc lập trên máy chủ/hạ tầng có ổ đĩa bền vững:
```bash
python3 storage-service/server.py --init-only
python3 storage-service/server.py
```
Mặc định dịch vụ lắng nghe tại `http://127.0.0.1:4100` và chỉ chấp nhận kết nối từ Worker/Next.js có kèm header xác thực `X-Storage-Service-Token`.

### Bước 3: Khởi chạy ứng dụng web WORD BRIDGE
```bash
npm install
npm run db:push
npm run db:seed
npm run dev
```
Truy cập phân hệ quản trị kho lưu trữ tại:
- Menu quản trị: **Quản trị (`/admin`) → Lưu trữ mã nguồn**
- Đường dẫn trực tiếp: **`/luu-tru-ma-nguon`**

---

## 2. Tài liệu kỹ thuật đi kèm trong Repository

1. `docs/storage/STORAGE_API_AND_SCHEMA.md`: Tài liệu chi tiết Storage API, cấu trúc 14 bảng SQLite BLOB và cơ chế xác thực 6 lớp + PIN Argon2id.
2. `docs/storage/DEPLOYMENT_GITHUB_WORKERS.md`: Tài liệu triển khai GitHub CI/CD, Cloudflare Workers và kết nối Storage Service độc lập.
3. `docs/storage/BACKUP_AND_RESTORE.md`: Quy trình sao lưu nhất quán (SQLite Online Backup API + WAL), kiểm tra toàn vẹn và khôi phục sau sự cố.
4. `tests/run_mandatory_tests.py`: Bộ kịch bản kiểm thử tự động toàn diện 10 hạng mục bắt buộc (Phần XV) và 38 tiêu chí nghiệm thu (Phần XVI).
# TÀI LIỆU KIẾN TRÚC STORAGE API & CƠ SỞ DỮ LIỆU SQLITE BLOB ĐỘC LẬP
**Phân hệ**: WORD BRIDGE SOURCE STORAGE (`/luu-tru-ma-nguon`)

## 1. Kiến trúc tổng thể (Không sử dụng Cloudflare R2 & Cloudflare D1)
- **Cloudflare Workers / Next.js Server**: Xử lý xác thực tài khoản (`lc_session`), kiểm tra RBAC (`role === "ADMIN"`), kiểm tra phiên PIN 8 giờ (`wb_vault_session`), cấp quyền tải lên/tải xuống và giao tiếp với Storage Service qua HTTPS/HTTP kèm `X-Storage-Service-Token`.
- **Dịch vụ lưu trữ SQLite BLOB độc lập (`storage-service/server.py`)**: Chạy trên máy chủ có ổ đĩa bền vững, bật chế độ `PRAGMA journal_mode=WAL;`, lưu dữ liệu nhị phân thực tế trong bảng `storage_file_blobs` (kiểm tra giới hạn 15 MB/tệp và xác minh SHA-256 ngay sau khi ghi).

## 2. Cấu trúc các bảng trong SQLite
1. `storage_system_state`: Lưu trạng thái khóa kho toàn hệ thống (`system_lock`) và trạng thái nhập dữ liệu cũ lần đầu (`initial_import_state`).
2. `storage_nodes`: Thông tin nút lưu trữ vật lý hoặc shard SQLite khi mở rộng dung lượng.
3. `storage_access_pins`: Lưu `pin_hash` (băm bằng **Argon2id** qua `libargon2` với salt riêng 16-byte cho từng tài khoản và server pepper), bộ đếm nhập sai (`failed_attempts`), thời điểm bắt đầu và kết thúc khóa 15 phút (`lock_started_at`, `lock_until`).
4. `storage_access_sessions`: Phiên truy cập kho lưu trữ có thời hạn tối đa 8 giờ (`expires_at`), tự động thu hồi khi đăng xuất, đổi PIN, khôi phục PIN hoặc khóa kho toàn hệ thống.
5. `storage_recovery_requests`: Lưu yêu cầu khôi phục PIN (`otp_hash` SHA-256, thời hạn 5 phút, chỉ dùng 1 lần, hủy mã cũ khi cấp mã mới).
6. `storage_items`: Thông tin tổng hợp của từng mục lưu trữ (`DOCUMENT`, `COMMUNITY_POST`, `COMMUNITY_COMMENT`, `UPLOADED_FILE`), mối liên kết `source_id`, trạng thái cách ly (`is_quarantined`), liên kết ngoài (`external_url`).
7. `storage_versions`: Lịch sử phiên bản (`version_number`, `checksum_sha256`, người thực hiện, thời điểm, mô tả thay đổi). Không bao giờ ghi đè phiên bản cũ.
8. `storage_files`: Metadata tệp tải lên (tên tệp, định dạng, kích thước, người tải, checksum SHA-256, vị trí logic).
9. `storage_file_blobs`: Lưu dữ liệu nhị phân `BLOB` thực tế trong SQLite kèm kiểm tra toàn vẹn `length(blob_data)` và `checksum_sha256`.
10. `storage_upload_sessions`: Quản lý phiên tải lên và hỗ trợ hủy tác vụ đang tải mà không tạo bản ghi dở dang.
11. `storage_archive_events`: Hàng đợi sự kiện tự động lưu có khóa chống ghi trùng (`idempotency_key`), hỗ trợ tự động thử lại khi có lỗi tạm thời.
12. `storage_import_jobs` & `storage_import_checkpoints`: Quản lý nhập dữ liệu cũ theo lô có checkpoint và chống nhập trùng.
13. `storage_trash`: Lưu thông tin mục trong thùng rác trước khi xóa vĩnh viễn.
14. `storage_audit_logs`: Nhật ký truy cập và hoạt động (25 sự kiện) có chuỗi băm toàn vẹn (`integrity_hash`) chống chỉnh sửa tùy tiện.
15. `storage_account_deletion_tasks`: Ghi nhận tác vụ xử lý dữ liệu kho khi một tài khoản WORD BRIDGE bị xóa.
16. `vocational_taxonomy_fields` & `vocational_taxonomy_specialties`: Lưu danh mục 16 lĩnh vực (A–P) và chuyên ngành nghề nghiệp mở rộng động.

## 3. Danh sách Endpoint Storage API
- **Access API**:
  - `GET /api/v1/access/status`: Kiểm tra trạng thái 6 lớp xác thực, PIN, thời gian khóa còn lại và danh sách tài khoản Admin.
  - `POST /api/v1/access/setup-pin`: Thiết lập mã PIN 6 chữ số lần đầu.
  - `POST /api/v1/access/verify-pin`: Xác minh PIN, đặt lại bộ đếm sai hoặc khóa 15 phút khi sai 5 lần liên tiếp; cấp phiên 8 giờ.
  - `POST /api/v1/access/change-pin`: Đổi mã PIN và thu hồi phiên kho cũ.
  - `POST /api/v1/access/logout`: Thu hồi phiên truy cập kho.
  - `POST /api/v1/access/forgot-pin/request` & `POST /api/v1/access/forgot-pin/reset`: Phát hành OTP 5 phút dùng 1 lần và đặt lại PIN mới.
  - `POST /api/v1/access/system-lock`: Khóa / mở khóa kho toàn hệ thống.
  - `POST /api/v1/access/admin-permissions`: Cấp quyền, thu hồi quyền, yêu cầu đặt lại PIN hoặc khóa tài khoản kho.
- **Archive & Version API**:
  - `POST /api/v1/archive/events`: Nhận sự kiện tự động lưu (Tài liệu, Bài đăng, Bình luận) có `idempotencyKey`.
  - `GET /api/v1/overview`: Thống kê dung lượng thực tế từ SQLite và ổ đĩa vật lý.
  - `GET /api/v1/items`: Tìm kiếm và lọc kết hợp có phân trang (không tải BLOB).
  - `GET /api/v1/items/<id>` & `GET /api/v1/items/<id>/preview`: Xem chi tiết lịch sử phiên bản và xem trước văn bản an toàn (không thực thi mã).
  - `POST /api/v1/versions/restore`: Khôi phục phiên bản cũ thành phiên bản hiện tại mới.
- **File BLOB & Trash API**:
  - `POST /api/v1/files/upload-session` & `POST /api/v1/files/upload`: Tải tệp ≤ 15 MB vào SQLite BLOB và xác minh SHA-256.
  - `GET /api/v1/download/<id>`: Tải xuống BLOB hoặc phiên bản nội dung có ghi nhật ký.
  - `GET /api/v1/trash`, `POST /api/v1/trash/move`, `POST /api/v1/trash/restore`, `POST /api/v1/trash/permanent-delete`: Quản lý thùng rác và xóa vĩnh viễn có xác nhận nhiều bước (`XOA VINH VIEN`).
- **Import, Audit & Account Deletion API**:
  - `GET /api/v1/import/status` & `POST /api/v1/import/run`: Nhập dữ liệu cũ lần đầu theo lô có checkpoint.
  - `GET /api/v1/audit-logs`: Truy vấn và lọc nhật ký hoạt động.
  - `POST /api/v1/accounts/handle-deletion`: Xử lý dữ liệu kho khi xóa tài khoản.
  - `POST /api/v1/backup/create` & `POST /api/v1/backup/restore`: Sao lưu và khôi phục nhất quán SQLite BLOB.
# HƯỚNG DẪN TRIỂN KHAI GITHUB, CLOUDFLARE WORKERS & DỊCH VỤ LƯU TRỮ SQLITE ĐỘC LẬP

## 1. Quy tắc bảo mật GitHub Repository (Phần XII.1)
- Chỉ lưu mã nguồn ứng dụng WORD BRIDGE, cấu hình mẫu `.env.example`, migration và tài liệu kỹ thuật.
- `.gitignore` đã cấu hình chặn tuyệt đối: `.env`, `*.db`, `*.db-wal`, `*.db-shm`, `storage-service/data/`, khóa bí mật và các bản sao lưu chứa dữ liệu người dùng.

## 2. Triển khai Dịch vụ Lưu trữ SQLite BLOB Độc lập (Phần XII.3)
1. Đặt thư mục `storage-service/` trên máy chủ hoặc container có ổ đĩa gắn kết bền vững (Persistent Volume), độc lập hoàn toàn với vòng đời deploy của Cloudflare Workers.
2. Thiết lập biến môi trường trên máy chủ lưu trữ:
   ```bash
   export WB_STORAGE_DIR="/var/lib/wordbridge-storage"
   export WB_STORAGE_DB_PATH="/var/lib/wordbridge-storage/wordbridge_source_storage.db"
   export WB_STORAGE_SERVICE_TOKEN="<khóa-bí-mật-32-ký-tự>"
   export WB_STORAGE_PIN_PEPPER="<khóa-pepper-argon2id-32-ký-tự>"
   export WB_STORAGE_PORT="4100"
   ```
3. Khởi chạy dịch vụ dưới dạng systemd daemon hoặc supervisor và đặt sau Reverse Proxy HTTPS (Nginx/Caddy) chỉ cho phép kết nối từ Worker với `X-Storage-Service-Token`.

## 3. Triển khai Website lên Cloudflare Workers / Next.js (Phần XII.2)
1. Thiết lập các biến môi trường (`AUTH_SECRET`, `WB_STORAGE_SERVICE_URL`, `WB_STORAGE_SERVICE_TOKEN`, `RESEND_API_KEY`) trong phần Secrets của môi trường máy chủ.
2. Không cấu hình và không sử dụng binding Cloudflare R2 hay Cloudflare D1.
3. Khi redeploy hoặc cập nhật phiên bản website, cơ sở dữ liệu `wordbridge_source_storage.db` trên dịch vụ lưu trữ độc lập hoàn toàn không bị ảnh hưởng, đảm bảo 100% dữ liệu và BLOB được giữ nguyên.
# QUY TRÌNH SAO LƯU (BACKUP), KIỂM TRA TOÀN VẸN & KHÔI PHỤC (RESTORE) SQLITE BLOB

## 1. Nguyên tắc an toàn khi dùng SQLite BLOB (Phần XII.6, XII.7)
- Hệ thống bật chế độ `PRAGMA journal_mode=WAL;` và `PRAGMA foreign_keys=ON;`.
- **Tuyệt đối không sao chép thủ công (`cp`) tệp `.db` đang mở ghi** vì có thể gây lỗi nhất quán giữa tệp chính và tệp `-wal`.
- Mọi thao tác sao lưu trong `WORD BRIDGE SOURCE STORAGE` đều sử dụng **SQLite Online Backup API (`sqlite3.Connection.backup`)**, đảm bảo tính nhất quán giao dịch 100% ngay cả khi hệ thống đang hoạt động.

## 2. Quy trình Sao lưu (Backup)
1. Truy cập **Quản trị → Lưu trữ mã nguồn (`/luu-tru-ma-nguon`) → Cài đặt bảo mật & Sao lưu**, hoặc gọi `POST /api/admin/storage/backup` với `{"action": "CREATE_BACKUP"}`.
2. Hệ thống thực hiện:
   - Ghi toàn bộ trang dữ liệu và BLOB nhất quán sang tệp `backups/bk_<timestamp>_<id>.db`.
   - Chạy `PRAGMA integrity_check;` trực tiếp trên tệp sao lưu vừa tạo.
   - Tính mã băm `SHA-256` của tệp sao lưu và lưu metadata vào `bk_<timestamp>_<id>.json`.
   - Ghi nhật ký sự kiện `CREATE_BACKUP` vào `storage_audit_logs`.

## 3. Quy trình Khôi phục (Restore) & Mở rộng Shard
1. Trước khi khôi phục, hệ thống tự động chạy `PRAGMA integrity_check;` trên bản sao lưu được chọn.
2. Nếu bản sao lưu toàn vẹn (`ok`), hệ thống khóa ghi tạm thời (`DB_LOCK`), sử dụng SQLite Backup API để nạp toàn bộ trạng thái về cơ sở dữ liệu chính và ghi nhật ký `RESTORE_BACKUP`.
3. Khi dung lượng ổ đĩa gần đầy (hệ thống cảnh báo tự động trên Dashboard), quản trị viên có thể mở rộng phân vùng ổ đĩa hoặc đăng ký nút lưu trữ mới trong bảng `storage_nodes` để phân shard SQLite mà không làm gián đoạn ứng dụng và không chuyển sang R2/D1.
