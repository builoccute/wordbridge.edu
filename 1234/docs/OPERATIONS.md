# SỔ TAY VẬN HÀNH & GIÁM SÁT HỆ THỐNG (`docs/OPERATIONS.md`)

## 1. Vận hành 7 Trung tâm Quản trị Chuyên sâu (100% Tiếng Việt)
1. **Trung tâm biên tập học liệu:** Quản lý quy trình `DRAFT → REVIEW → APPROVED → PUBLISHED` cho bài học, từ điển và ngữ pháp.
2. **Trung tâm quản trị khảo thí:** Quản lý ngân hàng câu hỏi Trung – Anh – Nga, cấu hình thời gian làm bài và giám sát phân tích năng lực (không cấp chứng chỉ).
3. **Trung tâm trí tuệ học tập:** Theo dõi 15 hệ thống trí tuệ ngôn ngữ và cấu hình adapter AI bên ngoài khi cần.
4. **Trung tâm đa ngôn ngữ:** Đảm bảo chỉ mở Học tổng quát cho Trung – Anh – Nga và chỉ mở Ngoại ngữ chuyên ngành cho Trung – Anh.
5. **Trung tâm chất lượng ngôn ngữ:** Rà soát độ chính xác phiên âm Pinyin, IPA, Cyrillic và ngữ cảnh ví dụ.
6. **Trung tâm bảo mật và kiểm toán:** Rà soát bảng `audit_logs`, `security_events`, quản lý khóa tài khoản Brute-force và xử lý yêu cầu xóa dữ liệu cá nhân.
7. **Trung tâm vận hành hạ tầng:** Giám sát D1 `word`, R2 `word`, quét tệp mồ côi (`findOrphanedObjects`), kiểm tra hàng đợi Email Adapter và tạo bản sao lưu định kỳ.

## 2. Quy trình Kiểm tra Tệp Mồ côi trên R2 Bucket `word`
Hệ thống cung cấp hàm `r2.findOrphanedObjects(referencedKeysSet)` đối chiếu danh sách đối tượng thực tế trên R2 bucket `word` với cột `r2_object_key` trong bảng `learning_resources` và `profiles` trên D1, giúp phát hiện các tệp tải lên dở dang mà không tự ý xóa nhầm tài nguyên hệ thống.
