# Dịch thuật Word Bridge (Word Bridge Translation – Trans)

- **Tên hệ thống:** Dịch thuật Word Bridge (`Word Bridge Translation` – Dịch vụ `Trans`)
- **Tên miền chính thức:** [https://dichthuat.wordbridge.io.vn](https://dichthuat.wordbridge.io.vn)
- **Hệ sinh thái:** Word Bridge ([https://wordbridge.io.vn](https://wordbridge.io.vn))
- **Khẩu hiệu:** *Where Languages Bring People Together.* / *WORD BRIDGE – CONNECTING LANGUAGES, CONNECTING THE WORLD.*
- **Nguyên tắc kiến trúc cốt lõi:** **ZERO USER DATA STORAGE** (Không lưu trữ bất kỳ văn bản, tệp tài liệu, hình ảnh OCR, metadata hay lịch sử dịch thuật nào của người dùng; chỉ lưu duy nhất tổng số lượt truy cập website `total_accesses` trong Cloudflare D1).

## 1. Phân biệt Word Bridge Learning và Word Bridge Trans

| Tiêu chí | Word Bridge Learning (`wordbridge.io.vn`) | Word Bridge Trans (`dichthuat.wordbridge.io.vn`) |
| :--- | :--- | :--- |
| **Định hướng** | Nền tảng học tập và thực hành ngoại ngữ | Hệ thống dịch thuật trực tuyến toàn cầu & Cổng API dịch thuật riêng |
| **Phạm vi ngôn ngữ** | Hỗ trợ ban đầu 05 ngôn ngữ học tập (`zh`, `en`, `ko`, `ja`, `ru`) | Hỗ trợ **104 ngôn ngữ toàn cầu** (ánh xạ chuẩn **FLORES-200** của Meta NLLB-200, bao gồm cả RTL như `ar`, `he`, `fa`, `ur`) |
| **Chế độ chuyên ngành** | Theo giáo trình học tập | **20 chế độ dịch thuật chuyên ngành** độc lập |
| **Chính sách dữ liệu** | Lưu tiến độ học tập theo tài khoản | **ZERO USER DATA STORAGE** (Chỉ lưu tổng lượt truy cập `site_metrics.total_accesses`) |

## 2. Cấu trúc Thư mục Dự án (Bao gồm Microservice NLLB-200 Tự chủ – Phương án 3)

```text
word-bridge-translation/
├── package.json                                  # Khai báo scripts build, test, audit, deploy
├── package-lock.json                             # Khóa phiên bản phụ thuộc phục vụ CI/CD
├── wrangler.toml                                 # Cấu hình Cloudflare Workers, D1 (word) & R2 (word)
├── .gitignore                                    # Loại bỏ node_modules, Secrets và tệp tạm
├── .env.example                                  # Mẫu khai báo biến môi trường (không chứa Secrets)
├── README.md                                     # Tài liệu hướng dẫn cài đặt, GitHub và triển khai
├── migrations/
│   └── 0001_site_metrics_zero_storage.sql        # Migration bổ sung an toàn cho bảng site_metrics
├── public/
│   └── assets/
│       └── logo.jpg                              # Logo chính thức của thương hiệu Word Bridge
├── scripts/
│   └── build.js                                  # Kịch bản kiểm tra cú pháp & kiểm toán Zero-Storage
├── self-hosted-nmt/                              # [Phương án 3] Microservice NMT NLLB-200 + CTranslate2 INT8
│   ├── app.py                                    # Máy chủ FastAPI + CTranslate2 INT8 + SentencePiece (Zero Storage)
│   ├── requirements.txt                          # Thư viện Python cho CTranslate2 & FastAPI
│   └── Dockerfile                                # Đóng gói container tự động tải mô hình NLLB-200 INT8 (--no-access-log)
├── src/
│   ├── worker.js                                 # Điểm vào chuẩn ES Module cho Cloudflare Workers
│   ├── server.js                                 # Máy chủ HTTP cục bộ (Node.js >= 20)
│   ├── api/
│   │   └── router.js                             # Bộ định tuyến Web & Public API v1 (/api/v1/translate)
│   ├── db/
│   │   └── d1-metrics.js                         # Bộ đếm nguyên tử D1 & Tường lửa SQL Zero-Storage
│   ├── security/
│   │   ├── privacy-shield.js                     # Kiểm tra Magic Bytes, Rate Limiter, xóa bộ nhớ tạm
│   │   └── r2-guard.js                           # Khóa bảo vệ R2 (chặn ghi tệp người dùng, bảo toàn bucket)
│   ├── services/
│   │   ├── languages.js                          # Danh mục 104 ngôn ngữ toàn cầu & nhận diện ngôn ngữ
│   │   ├── domains.js                            # 20 chuyên ngành dịch thuật & từ điển thuật ngữ công khai
│   │   ├── nllb-connector.js                     # Bộ kết nối NLLB-200 (FLORES-200) + Pre/Post-pass thuật ngữ
│   │   ├── translation-engine.js                 # Lõi dịch thuật đa tầng (NLLB-200 / Workers AI / Cloud / Built-in)
│   │   ├── document-processor.js                 # Xử lý dịch tài liệu trên RAM (PDF, DOCX, XLSX, PPTX, TXT, CSV, DOC)
│   │   └── ocr-processor.js                      # Nhận diện OCR & dịch hình ảnh trên RAM (PNG, JPG, WEBP)
│   └── ui/
│       ├── assets.js                             # Phục vụ tài nguyên thương hiệu Word Bridge
│       └── template.js                           # Giao diện Frontend Responsive (Zero Browser Storage)
└── tests/
    └── full-system.test.js                       # Bộ kiểm thử tự động toàn diện (22/22 bài kiểm thử PASS)
```

## 3. Triển khai Microservice API Dịch thuật Tự chủ (Phương án 3: Meta NLLB-200 + CTranslate2 INT8 + 20 Chuyên ngành)

Dự án đã tích hợp sẵn toàn bộ mã nguồn của **Phương án 3** trong thư mục `self-hosted-nmt/` và bộ kết nối `src/services/nllb-connector.js`:

1. **Khởi chạy Container Microservice NLLB-200 (200 ngôn ngữ, chỉ tốn ~650 MB RAM ở chế độ INT8):**
   ```bash
   cd self-hosted-nmt
   docker build -t wordbridge-nllb200-nmt .
   docker run -d --name wb-nmt -p 8080:8080 \
     -e WORDBRIDGE_NLLB_TOKEN="<token_noi_bo_tuy_chon>" \
     wordbridge-nllb200-nmt
   ```
2. **Kết nối vào Cloudflare Worker của Word Bridge Trans:**
   ```bash
   npx wrangler secret put WORDBRIDGE_NLLB_API_URL
   # Nhập địa chỉ máy chủ NLLB-200 của bạn (ví dụ qua Cloudflare Tunnel: https://nmt-internal.wordbridge.io.vn)
   npx wrangler secret put WORDBRIDGE_NLLB_TOKEN
   ```
3. **Gọi Cổng API Dịch thuật Của Riêng Word Bridge (`/api/v1/translate`):**
   Các ứng dụng trong hệ sinh thái Word Bridge có thể gọi trực tiếp API dịch thuật (hỗ trợ cả câu đơn và mảng `batch`):
   ```bash
   curl -X POST https://dichthuat.wordbridge.io.vn/api/v1/translate \
     -H "Content-Type: application/json" \
     -d '{
       "text": ["Thỏa thuận bảo mật thông tin", "Hệ thống dịch thuật toàn cầu"],
       "source_lang": "vi",
       "target_lang": "en",
       "domain": "legal"
     }'
   ```

## 4. Hướng dẫn Đưa Mã nguồn lên GitHub và Triển khai Cloudflare Workers

```bash
# 1. Kiểm tra Build & Chạy 22/22 bài kiểm thử tự động
npm install
npm run build
npm test

# 2. Đưa mã nguồn lên GitHub
git init
git branch -M main
git add .
git commit -m "feat: release Word Bridge Translation with Self-Hosted NLLB-200 NMT & Zero Storage"
git remote add origin https://github.com/<ten-to-chuc>/word-bridge-translation.git
git push -u origin main

# 3. Thực thi Migration D1 an toàn & Deploy lên Cloudflare Workers
npm run db:migrate:remote
npm run deploy
```
