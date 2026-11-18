-- ============================================================================
-- MIGRATION 0001: BỘ ĐẾM LƯỢT TRUY CẬP TỐI GIẢN (ZERO USER DATA STORAGE)
-- Dự án: Dịch thuật Word Bridge (https://dichthuat.wordbridge.io.vn)
-- Database: word (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
-- Nguyên tắc:
--   1. Bảo toàn tuyệt đối toàn bộ bảng hiện có trong Database `word` (KHÔNG DROP TABLE).
--   2. Chỉ tạo bảng `site_metrics` với duy nhất 1 dòng (id = 1) lưu `total_accesses`.
--   3. Không lưu IP, không lưu thời gian từng lượt, không lưu session, không lưu nội dung dịch.
-- ============================================================================

CREATE TABLE IF NOT EXISTS site_metrics (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  total_accesses INTEGER NOT NULL DEFAULT 0 CHECK (total_accesses >= 0)
);

INSERT OR IGNORE INTO site_metrics (id, total_accesses) VALUES (1, 0);
