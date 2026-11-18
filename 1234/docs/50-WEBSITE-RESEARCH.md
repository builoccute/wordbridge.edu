# BÁO CÁO NGHIÊN CỨU 50 WEBSITE THAM KHẢO QUỐC TẾ (`docs/50-WEBSITE-RESEARCH.md`)

- **Dự án:** WORD BRIDGE — *Where Languages Bring People Together.*
- **Website chính:** [https://www.wordbridge.vn/](https://www.wordbridge.vn/)
- **Ngày thực hiện khảo sát:** 2026-11-18
- **Nguyên tắc khảo sát:** Thực hiện truy cập các trang công khai và tài liệu kỹ thuật chính thức; tuyệt đối không vượt tường lửa/paywall trái phép, không tự nhận đã đăng nhập khi chưa có tài khoản, không sao chép mã nguồn hay tài sản thương hiệu độc quyền. Các trang áp dụng cơ chế chặn bot tự động được ghi nhận minh bạch trạng thái `RESTRICTED_BOT_PROTECTION` kèm phạm vi phân tích thực tế.

## I. BẢNG ĐỐI CHIẾU TỔNG HỢP PHƯƠNG ÁN THIẾT KẾ RIÊNG CHO WORD BRIDGE

| Module WORD BRIDGE | Nguồn tham khảo quốc tế | Bài học cốt lõi rút ra | Phương án thiết kế riêng đã triển khai tại WORD BRIDGE |
| :--- | :--- | :--- | :--- |
| **Học ngoại ngữ** | [Duolingo](https://www.duolingo.com/), [Babbel](https://www.babbel.com/), [Busuu](https://www.busuu.com/), [Rosetta Stone](https://www.rosettastone.com/), [LingQ](https://www.lingq.com/), [FluentU](https://www.fluentu.com/) | Cấu trúc khóa học phân tầng, bài học có mục tiêu rõ ràng, kết hợp ngữ cảnh thực tế và phản hồi tức thời. | Thiết kế phân cấp 8 tầng (`Ngôn ngữ → Chương trình → Cấp độ → Giáo trình → Bài học → Luyện tập → Đánh giá → Tiến độ`) và cấu trúc Bài học 12 thành phần chuẩn học thuật cho **Tiếng Trung, Tiếng Anh, Tiếng Nga** (Nghiêm cấm ngoại ngữ chuyên ngành tiếng Nga). |
| **Từ điển & Kho từ vựng** | [Cambridge Dictionary](https://dictionary.cambridge.org/), [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/), [Merriam-Webster](https://www.merriam-webster.com/), [Collins](https://www.collinsdictionary.com/), [Longman](https://www.ldoceonline.com/), [WordReference](https://www.wordreference.com/), [Pleco](https://www.pleco.com/), [YellowBridge](https://www.yellowbridge.com/), [Forvo](https://forvo.com/), [YouGlish](https://youglish.com/) | Định nghĩa dễ hiểu, phiên âm chuẩn (Pinyin, IPA, Cyrillic), phân tích bộ thủ chữ Hán, họ từ, collocation và lưu thẻ Flashcard. | Xây dựng **Từ điển WORD BRIDGE** độc lập có đầy đủ trường phiên âm, nghĩa tiếng Việt, định nghĩa ngôn ngữ đích, đồng nghĩa/trái nghĩa, collocation, chiết tự bộ thủ Hán tự, thuật ngữ chuyên ngành Trung–Anh và sổ từ vựng cá nhân tích hợp thuật toán **Spaced Repetition SM-2**. |
| **Luyện tập 4 kỹ năng** | [British Council LearnEnglish](https://learnenglish.britishcouncil.org/), [BBC Learning English](https://www.bbc.co.uk/learningenglish), [VOA Learning English](https://learningenglish.voanews.com/), [Pimsleur](https://www.pimsleur.com/), [Drops](https://languagedrops.com/), [ELSA Speak](https://elsaspeak.com/), [Speechling](https://speechling.com/) | Luyện tập cân bằng Listening – Speaking – Reading – Writing kèm tiêu chí chấm điểm và phản hồi sửa lỗi phát âm/viết. | Xây dựng phân hệ **Luyện tập Bốn Kỹ năng** kết nối với **15 Hệ thống Trí tuệ Ngôn ngữ** (đặc biệt là Universal Pronunciation Lab, Language Error Genome và Language Quality Benchmark). |
| **Khảo thí** | [Cambridge English](https://www.cambridgeenglish.org/), [IELTS](https://ielts.org/), [TOEFL ETS](https://www.ets.org/toefl.html), [EF SET](https://www.efset.org/), [Chinese Test HSK](https://www.chinesetest.cn/), [SPbPU TORFL](https://english.spbstu.ru/education/programs/short-term-programs/russian-language-studies/testing-center-russian-as-foreign-language/), [Pearson PTE](https://www.pearsonpte.com/) | Giao diện phòng thi tập trung, đồng hồ thời gian, chấm điểm tự động và phân tích điểm theo từng kỹ năng thành phần. | Xây dựng **Trung tâm Khảo thí WORD BRIDGE** tham chiếu chuẩn HSK (Tiếng Trung), CEFR (Tiếng Anh) và TORFL/ТРКИ 5 phân môn ngưỡng 66% (Tiếng Nga). **Tuyệt đối không cấp chứng chỉ** (`certificate_issued: false`). |
| **Quản trị** | [Khan Academy](https://www.khanacademy.org/), [Coursera](https://www.coursera.org/), [edX](https://www.edx.org/), [FutureLearn](https://www.futurelearn.com/), [OpenLearn](https://www.open.edu/openlearn/), [Moodle](https://moodle.org/), [Canvas LMS](https://www.instructure.com/canvas), [OpenStax](https://openstax.org/) | Quản trị nội dung có quy trình duyệt/xuất bản, ngân hàng câu hỏi, phân quyền RBAC và theo dõi tiến độ. | Xây dựng **Hệ thống Quản trị 100% Tiếng Việt** gồm 5 nhóm phân hệ (A–E), **7 Trung tâm Quản trị Chuyên sâu** và **9 Vai trò RBAC** có nhật ký kiểm toán bắt buộc. |
| **UI/UX & Design System** | [Stripe](https://stripe.com/), [Linear](https://linear.app/), [Notion](https://www.notion.so/), [Figma](https://www.figma.com/), [Webflow](https://webflow.com/) | Hệ thống Design Tokens nhất quán, bố cục lưới thoáng đãng, typography sắc nét, chống vỡ giao diện trên di động. | Thiết kế **WORD BRIDGE Design System** riêng biệt với bảng màu chuẩn Deep Teal (`#146466`), Vermilion Red (`#C92F1C`), Aqua (`#5AABA9`) và Warm Ivory (`#E2E2C4`), hỗ trợ hoàn hảo chữ Việt, chữ Hán và chữ Cyrillic. |
| **Hạ tầng & Truyền thông** | [Vercel](https://vercel.com/), [GitHub](https://github.com/), [Cloudflare Developers](https://developers.cloudflare.com/), [Resend Docs](https://resend.com/docs), [LiveKit Docs](https://docs.livekit.io/) | Kiến trúc Serverless Edge, cơ sở dữ liệu phân tán, lưu trữ đối tượng, giao dịch email an toàn và WebRTC thời gian thực. | Triển khai trên **Cloudflare Workers + D1 (`word`) + R2 (`word`)**, GitHub Actions CI/CD, Email Adapter 3 địa chỉ chính thức có `Reply-To: cskh@wordbridge.vn` và **Learner Meet** chỉ âm thanh/video (không chat, không ghi âm/ghi hình). |

## II. CHI TIẾT KHẢO SÁT TỪNG WEBSITE TRONG DANH SÁCH 50 WEBSITE QUỐC TẾ

### 1. [Duolingo](https://www.duolingo.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.duolingo.com/](https://www.duolingo.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc qua tài liệu & phân tích sản phẩm)`
- **Các trang/phân khu đã khảo sát:** `/, /courses, /learn`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Lộ trình cây kỹ năng tuyến tính, bài học ngắn 3–5 phút, phản hồi tức thời khi chọn đáp án.
- **Điểm mạnh:** Tương tác micro-interaction mượt, giữ nhịp độ học hàng ngày.
- **Điểm hạn chế:** Quá thiên về gamification trẻ em, thiếu chiều sâu ngữ pháp học thuật.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng phản hồi tức thời cho bài tập nhưng loại bỏ hoàn toàn phong cách hoạt hình trẻ em.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng giao diện bài học 12 thành phần nghiêm túc, trưởng thành cùng Hệ thống #1 (Language DNA).
### 2. [Babbel](https://www.babbel.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.babbel.com/](https://www.babbel.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát qua kho dữ liệu đánh giá sản phẩm)`
- **Các trang/phân khu đã khảo sát:** `/, /languages, /methodology`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Khóa học thiết kế bởi chuyên gia ngôn ngữ học, giải thích ngữ pháp trực diện trong hội thoại thực tế.
- **Điểm mạnh:** Cấu trúc bài học rõ ràng, tôn trọng đặc thù từng ngôn ngữ.
- **Điểm hạn chế:** Hạn chế công cụ tra cứu từ điển sâu ngay trong bài.
- **Bài học rút ra cho WORD BRIDGE:** Tổ chức chương trình theo nhóm Nền tảng, Tổng quát, Giao tiếp, Học thuật, Chuyên ngành.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Tích hợp giải thích ngữ pháp trực tiếp vào từng bài học Trung – Anh – Nga.
### 3. [Busuu](https://www.busuu.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.busuu.com/](https://www.busuu.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /en/languages, /en/how-busuu-works`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Phân cấp trình độ theo khung CEFR, có bài kiểm tra chốt chặn (Checkpoint Assessment) và kế hoạch học cá nhân.
- **Điểm mạnh:** Bố cục lộ trình rõ ràng, hiển thị thời lượng ước tính cho từng chặng.
- **Điểm hạn chế:** Có tính năng mạng xã hội sửa bài cộng đồng (không phù hợp định hướng WORD BRIDGE).
- **Bài học rút ra cho WORD BRIDGE:** Tham khảo cách hiển thị tiến độ khóa học và bài đánh giá chuyển cấp.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Áp dụng theo dõi tiến độ cá nhân nhưng loại bỏ hoàn toàn tính năng mạng xã hội và bình luận.
### 4. [Rosetta Stone](https://www.rosettastone.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.rosettastone.com/](https://www.rosettastone.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát phương pháp Dynamic Immersion)`
- **Các trang/phân khu đã khảo sát:** `/, /how-it-works`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Học theo ngữ cảnh hình ảnh – âm thanh trực quan, luyện phát âm câu hoàn chỉnh.
- **Điểm mạnh:** Giúp người học hình thành phản xạ ngữ cảnh tự nhiên.
- **Điểm hạn chế:** Thiếu giải thích ngữ pháp bằng tiếng mẹ đẻ cho cấu trúc phức tạp.
- **Bài học rút ra cho WORD BRIDGE:** Kết hợp ngữ cảnh thực tế với giải thích tiếng Việt chuẩn xác.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Triển khai Hệ thống #4 (Real-World Language Simulator) và Hệ thống #11 (Context Reconstruction).
### 5. [Memrise](https://www.memrise.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.memrise.com/](https://www.memrise.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát mô hình SRS & Video bản xứ)`
- **Các trang/phân khu đã khảo sát:** `/, /languages`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Học từ vựng kết hợp Spaced Repetition và đoạn hội thoại ngắn của người bản xứ.
- **Điểm mạnh:** Tăng khả năng nhận diện âm thanh thực tế và ghi nhớ từ vựng.
- **Điểm hạn chế:** Cấu trúc ngữ pháp hệ thống còn rời rạc.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng thuật toán ôn tập ngắt quãng SM-2 và đường cong Ebbinghaus.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Tích hợp vào Sổ từ vựng cá nhân và Hệ thống #13 (Learning Recovery System).
### 6. [Pimsleur](https://www.pimsleur.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.pimsleur.com/](https://www.pimsleur.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát phương pháp Audio Recall)`
- **Các trang/phân khu đã khảo sát:** `/, /the-pimsleur-method`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Luyện phản xạ nghe – nói qua âm thanh hội thoại có nhắc lại ngắt quãng (Graduated Interval Recall).
- **Điểm mạnh:** Rèn luyện khả năng phản xạ khẩu ngữ không phụ thuộc mặt chữ.
- **Điểm hạn chế:** Ít hỗ trợ kỹ năng đọc và viết chuyên sâu.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế phân khu Nghe và Nói độc lập trong mỗi bài học.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng bài tập luyện nghe hiểu và phát âm trong phân hệ Luyện tập 4 kỹ năng.
### 7. [LingQ](https://www.lingq.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.lingq.com/](https://www.lingq.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /en/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Học qua ngữ liệu đọc và nghe thực tế, lưu từ mới trực tiếp từ văn bản vào kho từ cá nhân.
- **Điểm mạnh:** Quản lý vốn từ vựng theo ngữ cảnh đọc hiểu rất mạnh.
- **Điểm hạn chế:** Giao diện nhiều chi tiết, khó làm quen với người mới bắt đầu.
- **Bài học rút ra cho WORD BRIDGE:** Liên kết chặt chẽ giữa bài đọc hiểu, từ điển và kho ngữ liệu cá nhân.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Phát triển Hệ thống #10 (Personal Language Corpus) thống kê mật độ từ vựng TTR.
### 8. [FluentU](https://www.fluentu.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://www.fluentu.com/](https://www.fluentu.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /blog/chinese/best-chinese-dictionary/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Học ngoại ngữ qua video thực tế có phụ đề tương tác và giải nghĩa từ vựng theo ngữ cảnh.
- **Điểm mạnh:** Ngữ cảnh sinh động, gắn liền văn hóa bản xứ.
- **Điểm hạn chế:** Thiếu lộ trình khảo thí học thuật bài bản.
- **Bài học rút ra cho WORD BRIDGE:** Hỗ trợ đa phương tiện (Văn bản, Hình ảnh, Âm thanh, Video, PDF) trong bài học.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Chuẩn hóa bảng `learning_resources` kết nối Cloudflare R2 bucket `word`.
### 9. [Mango Languages](https://mangolanguages.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://mangolanguages.com/](https://mangolanguages.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát cấu trúc đối chiếu câu)`
- **Các trang/phân khu đã khảo sát:** `/, /how-it-works`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Phân tích màu sắc đối chiếu cấu trúc câu giữa ngôn ngữ đích và ngôn ngữ mẹ đẻ.
- **Điểm mạnh:** Giúp người học hiểu rõ sự khác biệt trật tự từ và sắc thái nghĩa.
- **Điểm hạn chế:** Kho bài tập viết học thuật còn hạn chế.
- **Bài học rút ra cho WORD BRIDGE:** Đối chiếu sự tương đương ngữ nghĩa và giao thoa ngôn ngữ.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Triển khai Hệ thống #2 (Language Transfer Lab) và Hệ thống #6 (Meaning Equivalence Engine).
### 10. [Drops](https://languagedrops.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://languagedrops.com/](https://languagedrops.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /languages`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Thiết kế tối giản, tập trung phiên luyện từ vựng ngắn 5 phút theo chủ đề trực quan.
- **Điểm mạnh:** Tốc độ thao tác nhanh, không gây quá tải nhận thức.
- **Điểm hạn chế:** Chỉ tập trung từ đơn, thiếu ngữ pháp và viết đoạn văn.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng phiên phục hồi kiến thức ngắn 3–5 phút.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Tích hợp phiên Micro-Recovery 5 phút trong Hệ thống #13 (Learning Recovery System).
### 11. [ELSA Speak](https://elsaspeak.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://elsaspeak.com/](https://elsaspeak.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/en, /vn/homepage`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Đánh giá phát âm chi tiết đến từng âm vị, trọng âm từ và ngữ điệu câu kèm chỉ dẫn sửa lỗi.
- **Điểm mạnh:** Phản hồi khẩu hình và điểm số từng âm tiết cực kỳ trực quan.
- **Điểm hạn chế:** Chỉ chuyên về tiếng Anh, chưa bao phủ tiếng Trung và tiếng Nga.
- **Bài học rút ra cho WORD BRIDGE:** Mở rộng đánh giá phát âm đa ngôn ngữ (Pinyin thanh điệu, IPA trọng âm, Cyrillic biến âm).
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng Hệ thống #8 (Universal Pronunciation Lab) cho cả Trung – Anh – Nga.
### 12. [Speechling](https://speechling.com/)
- **Nhóm tham khảo:** A. Nền tảng học ngoại ngữ
- **URL chính thức:** [https://speechling.com/](https://speechling.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /en/pricing, /en/about`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tập trung luyện nói câu hoàn chỉnh, nghe mẫu chuẩn và nhận phản hồi chỉnh sửa nhịp điệu, cách dùng từ.
- **Điểm mạnh:** Chu trình Nghe – Nói – Phản hồi – Lặp lại (Listen, Speak, Feedback, Repeat) rất rõ ràng.
- **Điểm hạn chế:** Giao diện trang chủ còn đơn giản.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng chu trình luyện nói chuẩn hóa có chấm điểm tự động.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Tích hợp bài luyện Speaking trong cả Bài học và phân hệ Luyện tập.
### 13. [Cambridge Dictionary](https://dictionary.cambridge.org/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://dictionary.cambridge.org/](https://dictionary.cambridge.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /dictionary/english/, /grammar`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Định nghĩa chuẩn mực, phiên âm IPA UK/US, gắn nhãn cấp độ CEFR (A1–C2), ví dụ thực tế và bộ từ vựng.
- **Điểm mạnh:** Bố cục thẻ từ vựng cực kỳ dễ đọc, phân tách rõ nghĩa theo từng từ loại.
- **Điểm hạn chế:** Quảng cáo hiển thị trên trang công khai đôi khi làm phân tán.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế cấu trúc mục từ điển chuẩn học thuật, không quảng cáo.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Áp dụng cho bảng `dictionary_entries` của WORD BRIDGE với đầy đủ phiên âm, cấp độ và ví dụ.
### 14. [Oxford Learner's Dictionaries](https://www.oxfordlearnersdictionaries.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.oxfordlearnersdictionaries.com/](https://www.oxfordlearnersdictionaries.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /definition/english/, /wordlist/, /grammar/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Danh sách từ cốt lõi Oxford 3000/5000 và từ vựng học thuật OPAL, hướng dẫn Collocations và họ từ.
- **Điểm mạnh:** Chuẩn hóa từ vựng học thuật và cụm từ cố định (Collocations) xuất sắc.
- **Điểm hạn chế:** Giao diện tra cứu trên di động hơi dày chữ.
- **Bài học rút ra cho WORD BRIDGE:** Bổ sung trường `collocations_json` và `word_family_json` vào từ điển WORD BRIDGE.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Hiển thị rõ Họ từ, Từ đồng nghĩa, Từ trái nghĩa và Collocation trong Từ điển.
### 15. [Merriam-Webster](https://www.merriam-webster.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.merriam-webster.com/](https://www.merriam-webster.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /word-of-the-day, /grammar`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Giải thích sâu sắc nguồn gốc từ, phân biệt các từ dễ nhầm lẫn và hướng dẫn ngữ pháp thực hành.
- **Điểm mạnh:** Phân tích sắc thái nghĩa của các từ đồng nghĩa rất chặt chẽ.
- **Điểm hạn chế:** Định nghĩa đôi khi phức tạp với người mới bắt đầu.
- **Bài học rút ra cho WORD BRIDGE:** Kết hợp định nghĩa bằng ngôn ngữ đích và nghĩa tiếng Việt dễ hiểu.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng song song hai trường `meaning_vi` và `definition_target`.
### 16. [Collins Dictionary](https://www.collinsdictionary.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.collinsdictionary.com/](https://www.collinsdictionary.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /dictionary/english, /thesaurus`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Định nghĩa theo ngữ cảnh câu đầy đủ (COBUILD), thống kê tần suất sử dụng và so sánh các cặp từ.
- **Điểm mạnh:** Giúp người học hiểu ngay cách đặt từ vào câu hoàn chỉnh.
- **Điểm hạn chế:** Tốc độ tải trang nhiều thành phần đa phương tiện hơi nặng.
- **Bài học rút ra cho WORD BRIDGE:** Tối ưu tốc độ phản hồi tra cứu từ điển dưới 50ms tại biên Cloudflare Worker.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Thiết kế chỉ mục `idx_dict_lang_headword` trên Cloudflare D1.
### 17. [Longman Dictionary (LDOCE)](https://www.ldoceonline.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.ldoceonline.com/](https://www.ldoceonline.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát cấu trúc Longman Defining Vocabulary)`
- **Các trang/phân khu đã khảo sát:** `/, /dictionary`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Sử dụng 2.000 từ thông dụng để định nghĩa mọi mục từ, tích hợp bảng Collocations và Grammar hộp cảnh báo lỗi.
- **Điểm mạnh:** Hộp cảnh báo lỗi ngữ pháp thường gặp ngay trong mục từ rất hữu ích.
- **Điểm hạn chế:** Giao diện web truyền thống chưa hiện đại.
- **Bài học rút ra cho WORD BRIDGE:** Đưa danh sách lỗi thường gặp (`common_mistakes_json`) vào phân hệ Ngữ pháp.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Liên kết trực tiếp mục ngữ pháp với Hệ thống #5 (Language Error Genome).
### 18. [WordReference](https://www.wordreference.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.wordreference.com/](https://www.wordreference.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát cấu trúc đối chiếu đa nghĩa)`
- **Các trang/phân khu đã khảo sát:** `/, /enru/, /enzh/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Từ điển đối chiếu song ngữ giàu ngữ cảnh, phân tách rõ nghĩa chính, nghĩa chuyển và cụm động từ.
- **Điểm mạnh:** Xử lý hiện tượng đa nghĩa và sắc thái ngữ cảnh giữa các ngôn ngữ rất tốt.
- **Điểm hạn chế:** Giao diện bảng cổ điển.
- **Bài học rút ra cho WORD BRIDGE:** Phân tích sự tương đương và độ lệch sắc thái giữa Trung – Anh – Nga.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Ứng dụng trực tiếp vào Hệ thống #6 (Meaning Equivalence Engine).
### 19. [Pleco](https://www.pleco.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.pleco.com/](https://www.pleco.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc tra cứu Hán ngữ)`
- **Các trang/phân khu đã khảo sát:** `/, /products/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Hệ sinh thái từ điển tiếng Trung hàng đầu: tra cứu bằng chữ Hán, Pinyin không dấu/có dấu, phân rã thành phần chữ và thẻ Flashcard.
- **Điểm mạnh:** Tích hợp liền mạch giữa tra từ điển tiếng Trung và lưu thẻ học từ vựng.
- **Điểm hạn chế:** Chủ yếu phát triển cho ứng dụng di động.
- **Bài học rút ra cho WORD BRIDGE:** Đưa tính năng tra cứu chữ Hán/Pinyin kết hợp lưu Flashcard một chạm lên nền tảng web.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng API `/api/dictionary/vocabulary/save` kết nối trực tiếp sổ từ cá nhân.
### 20. [YellowBridge](https://www.yellowbridge.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://www.yellowbridge.com/](https://www.yellowbridge.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát cấu trúc chiết tự bộ thủ Hán tự)`
- **Các trang/phân khu đã khảo sát:** `/chinese/character-dictionary.php`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Phân tích cấu tạo chữ Hán theo bộ thủ (Radicals), tổng số nét, thứ tự nét viết và nguồn gốc hình thành chữ.
- **Điểm mạnh:** Giúp người học tiếng Trung nhớ chữ Hán theo logic cấu tạo thay vì học vẹt.
- **Điểm hạn chế:** Giao diện web cũ, chưa tối ưu responsive trên điện thoại.
- **Bài học rút ra cho WORD BRIDGE:** Bổ sung trường `radicals_stroke_json` vào bảng `dictionary_entries`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Hiển thị bộ thủ, tổng số nét và cấu trúc chiết tự cho từ vựng tiếng Trung trên giao diện chuẩn responsive.
### 21. [Forvo](https://forvo.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://forvo.com/](https://forvo.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /languages/zh/, /languages/ru/, /languages/en/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Kho phát âm từ vựng đa ngôn ngữ lớn nhất thế giới, phân loại theo vùng miền và ngôn ngữ (bao gồm cả tiếng Nga, Trung, Anh).
- **Điểm mạnh:** Cho phép nghe đối chiếu phát âm chuẩn của từng từ và cụm từ thực tế.
- **Điểm hạn chế:** Chất lượng âm thanh đôi khi không đồng đều giữa người đóng góp.
- **Bài học rút ra cho WORD BRIDGE:** Chuẩn hóa kho tệp âm thanh phát âm trên Cloudflare R2 theo đường dẫn `dictionary/`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Gắn khóa `audio_r2_key` cho các mục từ điển Trung – Anh – Nga.
### 22. [YouGlish](https://youglish.com/)
- **Nhóm tham khảo:** B. Từ điển & Công cụ phát âm
- **URL chính thức:** [https://youglish.com/](https://youglish.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát mô hình phát âm trong ngữ cảnh thực)`
- **Các trang/phân khu đã khảo sát:** `/, /pronounce/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tìm kiếm từ vựng xuất hiện trong ngữ cảnh diễn thuyết và hội thoại thực tế kèm phụ đề đánh dấu vị trí từ.
- **Điểm mạnh:** Giúp người học nghe cách nối âm và đặt trọng âm câu trong dòng chảy ngôn ngữ thật.
- **Điểm hạn chế:** Phụ thuộc hoàn toàn vào nguồn video bên thứ ba.
- **Bài học rút ra cho WORD BRIDGE:** Gắn mọi mục từ điển với câu ví dụ ngữ cảnh hoàn chỉnh có phiên âm đầy đủ.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kết hợp với Hệ thống #11 (Context Reconstruction) và Hệ thống #8 (Universal Pronunciation Lab).
### 23. [British Council LearnEnglish](https://learnenglish.britishcouncil.org/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://learnenglish.britishcouncil.org/](https://learnenglish.britishcouncil.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /skills/listening, /skills/reading, /skills/writing, /skills/speaking, /business-english`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tổ chức học liệu 4 kỹ năng phân tầng rõ theo cấp độ CEFR (A1 đến C1), có chuyên mục tiếng Anh công sở.
- **Điểm mạnh:** Mỗi bài học đều có cấu trúc chuẩn: Chuẩn bị → Nghe/Đọc → Bài tập tương tác → Thảo luận.
- **Điểm hạn chế:** Có khu vực bình luận công khai dễ phát sinh spam.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế cấu trúc bài học đa tầng kết hợp bài tập tương tác tại chỗ.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng bài học 12 thành phần và khóa bình luận/mạng xã hội theo đúng yêu cầu sản phẩm.
### 24. [BBC Learning English](https://www.bbc.co.uk/learningenglish)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.bbc.co.uk/learningenglish](https://www.bbc.co.uk/learningenglish)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát cấu trúc chuyên mục học liệu)`
- **Các trang/phân khu đã khảo sát:** `/, /english/courses`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Chia nội dung thành các chương trình ngắn theo chủ đề thực tế, thời sự, ngữ pháp và phát âm.
- **Điểm mạnh:** Ngữ liệu giàu tính thời sự, súc tích, dễ theo dõi trên cả máy tính và điện thoại.
- **Điểm hạn chế:** Không có hệ thống quản lý lộ trình cá nhân hóa sâu.
- **Bài học rút ra cho WORD BRIDGE:** Tích hợp ngữ liệu thực tế vào các khóa học và theo dõi tiến độ bằng `learner_progress`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kết hợp học liệu đa phương tiện với Hệ thống #15 (Personal Language Observatory).
### 25. [VOA Learning English](https://learningenglish.voanews.com/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://learningenglish.voanews.com/](https://learningenglish.voanews.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /p/5609.html (Beginning), /p/5610.html (Intermediate), /p/5611.html (Advanced)`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Phân chia bài đọc và bản tin âm thanh theo 3 cấp độ từ vựng kiểm soát, tốc độ đọc chuẩn mực.
- **Điểm mạnh:** Bố cục trang đọc hiểu thoáng, kết hợp trình phát âm thanh ngay đầu bài viết.
- **Điểm hạn chế:** Giao diện thiên về trang tin tức hơn là nền tảng LMS.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế giao diện đọc – nghe tích hợp trong từng bài học.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Ứng dụng vào phần `listening_section_json` và `reading_section_json` của bài học WORD BRIDGE.
### 26. [Cambridge English](https://www.cambridgeenglish.org/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.cambridgeenglish.org/](https://www.cambridgeenglish.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát khung đánh giá năng lực CEFR)`
- **Các trang/phân khu đã khảo sát:** `/, /exams-and-tests/, /learning-english/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Hệ thống tiêu chí đánh giá 4 kỹ năng chuẩn hóa theo khung tham chiếu châu Âu CEFR.
- **Điểm mạnh:** Ma trận quy đổi năng lực và tiêu chí chấm bài viết/nói cực kỳ minh bạch.
- **Điểm hạn chế:** Nhiều thuật ngữ khảo thí chuyên môn.
- **Bài học rút ra cho WORD BRIDGE:** Sử dụng CEFR làm hệ tham chiếu cho tiếng Anh nhưng không tự gán tương đương cứng nhắc với tiếng Trung và tiếng Nga.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Thiết kế trường `standard_ref` và `cefr_reference` độc lập trong bảng `learning_programs` và `exams`.
### 27. [IELTS](https://ielts.org/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://ielts.org/](https://ielts.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /take-a-test, /prepare`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Cấu trúc bài thi học thuật và tổng quát đánh giá toàn diện Nghe, Đọc, Viết, Nói với thang tiêu chí chấm bài rõ ràng.
- **Điểm mạnh:** Tiêu chí đánh giá bài viết (Task Achievement, Coherence & Cohesion, Lexical Resource, Grammatical Range) rất khoa học.
- **Điểm hạn chế:** Quy trình đăng ký thi truyền thống phức tạp.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng 4 tiêu chí đánh giá chất lượng ngôn ngữ vào công cụ chấm bài viết.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Triển khai trực tiếp trong Hệ thống #14 (Language Quality Benchmark).
### 28. [TOEFL – ETS](https://www.ets.org/toefl.html)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.ets.org/toefl.html](https://www.ets.org/toefl.html)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/toefl.html, /toefl/test-takers/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Đánh giá năng lực ngôn ngữ trong môi trường học thuật đại học, tích hợp kỹ năng Đọc – Nghe – Viết/Nói.
- **Điểm mạnh:** Câu hỏi đọc hiểu phân hóa tốt giữa hiểu thông tin bề mặt và suy luận hàm ý.
- **Điểm hạn chế:** Thời gian làm bài dài.
- **Bài học rút ra cho WORD BRIDGE:** Phân tách 4 tầng độ sâu đọc hiểu: Literal, Inferential, Pragmatic, Critical.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng Hệ thống #12 (Comprehension Depth Test).
### 29. [EF SET](https://www.efset.org/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.efset.org/](https://www.efset.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /english-score/, /cefr/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Giao diện làm bài kiểm tra trực tuyến tối giản, đồng hồ đếm ngược rõ ràng, báo cáo phân tích điểm theo từng kỹ năng.
- **Điểm mạnh:** Trải nghiệm UI phòng thi trực tuyến sạch sẽ, không gây xao nhãng.
- **Điểm hạn chế:** Tập trung vào cấp chứng chỉ LinkedIn (tính năng bị cấm tại WORD BRIDGE).
- **Bài học rút ra cho WORD BRIDGE:** Học hỏi giao diện làm bài thi trực tuyến sạch và bảng phân tích kết quả theo kỹ năng.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Loại bỏ hoàn toàn chức năng cấp chứng chỉ (`certificate_issued: false`), chỉ giữ báo cáo chẩn đoán năng lực.
### 30. [Chinese Test – HSK](https://www.chinesetest.cn/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.chinesetest.cn/](https://www.chinesetest.cn/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /hsk, /HSK/1, /HSK/6, /HSK/7-9, /regulation`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Hệ thống khảo thí tiếng Trung quốc tế chuẩn HSK 1–6 và HSK 7–9 mới, phân tách rõ Nghe – Đọc – Viết và Khẩu ngữ.
- **Điểm mạnh:** Định lượng rõ khối lượng từ vựng và cấu trúc ngữ pháp cho từng cấp HSK.
- **Điểm hạn chế:** Giao diện đăng ký nhiều bước hành chính.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng cấu trúc đề thi tiếng Trung theo chuẩn HSK (Nghe hiểu, Đọc hiểu, Từ vựng-Ngữ pháp, Viết cấu trúc).
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Tích hợp đề thi mẫu `WB-EXAM-ZH-01` và ngân hàng câu hỏi tiếng Trung trong hệ thống Khảo thí.
### 31. [SPbPU – TORFL Testing Center](https://english.spbstu.ru/education/programs/short-term-programs/russian-language-studies/testing-center-russian-as-foreign-language/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://english.spbstu.ru/education/programs/short-term-programs/russian-language-studies/testing-center-russian-as-foreign-language/](https://english.spbstu.ru/education/programs/short-term-programs/russian-language-studies/testing-center-russian-as-foreign-language/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/education/programs/short-term-programs/russian-language-studies/testing-center-russian-as-foreign-language/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Trung tâm khảo thí tiếng Nga như ngoại ngữ (TORFL / ТРКИ) gồm 5 bài thi thành phần (Subtests): Từ vựng-Ngữ pháp, Đọc, Nghe, Viết, Nói; ngưỡng đạt chuẩn 66%.
- **Điểm mạnh:** Cấu trúc 5 phân môn đánh giá rất sát đặc thù biến cách và thể động từ tiếng Nga.
- **Điểm hạn chế:** Trang thông tin tĩnh.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng ngưỡng đạt 66% và cấu trúc đánh giá ТЭУ – ТБУ – ТРКИ cho phân hệ Khảo thí tiếng Nga.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Thiết kế đề thi `WB-EXAM-RU-01` có `passing_score_percent: 66.0` và câu hỏi kiểm tra hệ thống cách/trọng âm tiếng Nga.
### 32. [Pearson PTE](https://www.pearsonpte.com/)
- **Nhóm tham khảo:** C. Học liệu & Khảo thí
- **URL chính thức:** [https://www.pearsonpte.com/](https://www.pearsonpte.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /pte-academic`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Khảo thí hoàn toàn trên máy tính với chấm điểm tự động nhất quán, phản hồi kết quả nhanh kèm hồ sơ kỹ năng chi tiết.
- **Điểm mạnh:** Cơ chế chấm điểm khách quan dựa trên thuật toán định lượng.
- **Điểm hạn chế:** Chi phí thi thực tế cao.
- **Bài học rút ra cho WORD BRIDGE:** Xây dựng bộ chấm điểm tự động (`gradeExamSubmission`) trả kết quả và phân tích kỹ năng tức thời.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kết nối kết quả khảo thí trực tiếp với Hệ thống #1 (Language DNA) và Hệ thống #15 (Observatory).
### 33. [Khan Academy](https://www.khanacademy.org/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.khanacademy.org/](https://www.khanacademy.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /about`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Học tập làm chủ năng lực (Mastery-based learning), theo dõi mức độ thành thạo từng kỹ năng nhỏ.
- **Điểm mạnh:** Cơ chế tính điểm thành thạo (Mastery Score) thúc đẩy học viên lấp đầy lỗ hổng kiến thức.
- **Điểm hạn chế:** Thiết kế thiên về giáo dục phổ thông K-12.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng trường `mastery_score` trong bảng `learner_progress`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kết hợp điểm thành thạo bài học với Hệ thống #13 (Learning Recovery System).
### 34. [Coursera](https://www.coursera.org/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.coursera.org/](https://www.coursera.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /browse/language-learning`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tổ chức chương trình học theo phân cấp Specialization → Course → Module → Lesson rất mạch lạc.
- **Điểm mạnh:** Trang giới thiệu khóa học trình bày rõ mục tiêu đầu ra, thời lượng ước tính và cấu trúc giáo trình.
- **Điểm hạn chế:** Nhiều thông điệp bán chứng chỉ trả phí.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng cấu trúc phân cấp Chương trình → Giáo trình → Khóa học → Bài học.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Hiển thị mục tiêu bài học (`objectives_json`) và thời lượng ước tính minh bạch, không bán chứng chỉ.
### 35. [edX](https://www.edx.org/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.edx.org/](https://www.edx.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /search?tab=course`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Trải nghiệm học liệu đại học nghiêm túc, kết hợp bài giảng văn bản, âm thanh/video và bài kiểm tra xen kẽ.
- **Điểm mạnh:** Phong cách thiết kế học thuật, chín chắn, chữ nghĩa rõ ràng dễ đọc.
- **Điểm hạn chế:** Thanh điều hướng đôi khi chứa quá nhiều danh mục.
- **Bài học rút ra cho WORD BRIDGE:** Giữ phong cách giao diện học thuật cao cấp, chuyên nghiệp và tối giản cho WORD BRIDGE.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Chốt thanh Header đúng 8 mục điều hướng cốt lõi theo PHẦN XI Mục 39.
### 36. [FutureLearn](https://www.futurelearn.com/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.futurelearn.com/](https://www.futurelearn.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc Step-by-Step Learning)`
- **Các trang/phân khu đã khảo sát:** `/, /courses`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Chia mỗi bài học thành các bước tuần tự rõ ràng, khoảng trắng thoáng đãng, tập trung vào việc đọc và suy ngẫm.
- **Điểm mạnh:** Nhịp điệu trình bày nội dung rất êm dịu, không gây mỏi mắt khi học lâu.
- **Điểm hạn chế:** Bình luận cuối mỗi bước dễ làm loãng nội dung học thuật.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng bố cục khoảng trắng hợp lý và nhịp điệu nội dung có cấu trúc.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Loại bỏ hoàn toàn khu vực bình luận xã hội dưới bài học.
### 37. [OpenLearn](https://www.open.edu/openlearn/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.open.edu/openlearn/](https://www.open.edu/openlearn/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát mô hình học liệu mở Open University)`
- **Các trang/phân khu đã khảo sát:** `/, /free-courses`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Cho phép người truy cập xem công khai nội dung học liệu trước khi đăng nhập để lưu tiến độ cá nhân.
- **Điểm mạnh:** Tôn trọng người dùng, không dựng bức tường đăng nhập chặn toàn bộ trang.
- **Điểm hạn chế:** Bộ lọc tìm kiếm khóa học hơi phân mảnh.
- **Bài học rút ra cho WORD BRIDGE:** Thực thi nguyên tắc Công khai xem – Đăng nhập mới được sử dụng (PHẦN IV Mục 13).
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Cho phép khách xem nội dung bài học/bài tập công khai nhưng xác thực chặt tại Backend khi thao tác.
### 38. [Moodle](https://moodle.org/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://moodle.org/](https://moodle.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc RBAC & Question Bank của LMS)`
- **Các trang/phân khu đã khảo sát:** `/, /docs/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Hệ thống phân quyền vai trò (RBAC) chi tiết, quản lý ngân hàng câu hỏi theo danh mục và nhật ký kiểm toán hoạt động.
- **Điểm mạnh:** Kiến trúc quản trị học thuật và phân quyền cực kỳ chặt chẽ.
- **Điểm hạn chế:** Giao diện quản trị mặc định phức tạp.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế hệ thống RBAC 9 vai trò quản trị kèm bảng `audit_logs`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Xây dựng 7 Trung tâm Quản trị Chuyên sâu 100% tiếng Việt dễ điều hướng.
### 39. [Canvas LMS](https://www.instructure.com/canvas)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://www.instructure.com/canvas](https://www.instructure.com/canvas)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát điều hướng Module & Rubric chấm điểm)`
- **Các trang/phân khu đã khảo sát:** `/canvas`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Điều hướng khóa học theo Module trực quan, tích hợp bảng tiêu chí chấm điểm (Rubric) ngay trong bài tập.
- **Điểm mạnh:** Giúp người học biết rõ tiêu chí đạt điểm tối đa trước khi nộp bài.
- **Điểm hạn chế:** Phụ thuộc vào cấu hình của từng trường học.
- **Bài học rút ra cho WORD BRIDGE:** Bổ sung trường `rubric_json` cho mọi bài tập thực hành trên WORD BRIDGE.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Áp dụng cho tài khoản cá nhân độc lập, không phụ thuộc tài khoản tổ chức.
### 40. [OpenStax](https://openstax.org/)
- **Nhóm tham khảo:** D. Giáo dục & Quản lý học tập (LMS)
- **URL chính thức:** [https://openstax.org/](https://openstax.org/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát chuẩn trình bày giáo trình học thuật)`
- **Các trang/phân khu đã khảo sát:** `/, /subjects`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tổ chức giáo trình chuẩn mực: Mục tiêu chương, Kiến thức cốt lõi, Ví dụ minh họa, Tóm tắt và Bài tập tự luyện.
- **Điểm mạnh:** Cấu trúc sư phạm mẫu mực, dễ tra cứu và ôn tập.
- **Điểm hạn chế:** Chủ yếu là sách tĩnh.
- **Bài học rút ra cho WORD BRIDGE:** Chuyển hóa cấu trúc giáo trình chuẩn thành bài học tương tác 12 thành phần.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Bổ sung công cụ quản trị biên tập và quản lý phiên bản (`version`, `status`) cho từng bài học.
### 41. [Stripe](https://stripe.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://stripe.com/](https://stripe.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát hệ thống Typography & Grid của Stripe)`
- **Các trang/phân khu đã khảo sát:** `/, /docs`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Hệ thống lưới bố cục chuẩn xác, độ tương phản cao, khoảng trắng tinh tế và phân cấp chữ cực kỳ rõ ràng.
- **Điểm mạnh:** Tạo dựng niềm tin chuyên nghiệp ngay từ cái nhìn đầu tiên.
- **Điểm hạn chế:** Không áp dụng trực tiếp bảng màu tím của Stripe.
- **Bài học rút ra cho WORD BRIDGE:** Học hỏi tỷ lệ khoảng trắng, độ sắc nét của đường viền thẻ (`1px solid`) và phân cấp chữ.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kết hợp với bảng màu thương hiệu riêng của WORD BRIDGE (`#146466`, `#C92F1C`, `#5AABA9`, `#E2E2C4`).
### 42. [Linear](https://linear.app/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://linear.app/](https://linear.app/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /features, /docs`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Giao diện ứng dụng tốc độ cao, điều hướng mạch lạc, hiển thị trạng thái công việc và tiến độ rất gọn gàng.
- **Điểm mạnh:** Tối ưu mật độ thông tin trên bảng điều khiển mà không gây rối mắt.
- **Điểm hạn chế:** Giao diện tối hoàn toàn không phù hợp cho việc đọc văn bản chữ Hán/Cyrillic dài.
- **Bài học rút ra cho WORD BRIDGE:** Áp dụng cách bố trí bảng điều khiển quản trị gọn gàng trên nền sáng ấm (`#F7F7EC` / `#FFFFFF`).
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Đảm bảo độ tương phản WCAG AA cho cả chữ Việt, chữ Hán và chữ Nga.
### 43. [Notion](https://www.notion.so/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://www.notion.so/](https://www.notion.so/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /product`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tổ chức không gian tri thức theo khối nội dung (Block-based), phân cấp tài liệu và bảng dữ liệu sạch sẽ.
- **Điểm mạnh:** Trải nghiệm đọc tài liệu dài rất thoải mái, thân thiện.
- **Điểm hạn chế:** Khi lồng quá nhiều trang con dễ làm người dùng lạc hướng.
- **Bài học rút ra cho WORD BRIDGE:** Giữ cấu trúc bài học phẳng, hiển thị trọn vẹn trên một luồng đọc rõ ràng.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Áp dụng cho Trung tâm biên tập học liệu và giao diện xem bài học.
### 44. [Figma](https://www.figma.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://www.figma.com/](https://www.figma.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc Design Tokens & Component Library)`
- **Các trang/phân khu đã khảo sát:** `/, /design`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Quản lý Design System bằng hệ thống Design Tokens (màu sắc, chữ viết, khoảng cách, bo góc) đồng bộ tuyệt đối.
- **Điểm mạnh:** Đảm bảo tính nhất quán trên toàn bộ các trang và thiết bị.
- **Điểm hạn chế:** Đòi hỏi quy tắc đặt tên biến chặt chẽ.
- **Bài học rút ra cho WORD BRIDGE:** Xây dựng bộ biến CSS Design Tokens (`--wb-*`) trong `src/styles/design-system.css`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Áp dụng nhất quán trên cả 10 phân hệ và 11 mẫu email.
### 45. [Webflow](https://webflow.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://webflow.com/](https://webflow.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát kiến trúc CMS & Responsive Breakpoints)`
- **Các trang/phân khu đã khảo sát:** `/, /cms`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Kiểm soát chặt chẽ bố cục Responsive qua các điểm ngắt (Desktop, Laptop, Tablet, Mobile Landscape/Portrait).
- **Điểm mạnh:** Chống tràn ngang (`overflow-x: hidden`) và co giãn lưới CSS Grid mượt mà.
- **Điểm hạn chế:** Không dùng cho backend nghiệp vụ phức tạp.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế lưới `.wb-grid-2`, `.wb-grid-3` và `.wb-table-wrap` chống vỡ bảng trên màn hình nhỏ.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Kiểm thử toàn diện trên Desktop, Tablet, Android và iPhone.
### 46. [Vercel](https://vercel.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://vercel.com/](https://vercel.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát quy trình Edge Build & Preview Deployment)`
- **Các trang/phân khu đã khảo sát:** `/, /docs`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Quy trình tích hợp Git tự động kiểm tra bản build và triển khai phân tách môi trường Staging / Production.
- **Điểm mạnh:** Giảm thiểu rủi ro lỗi cấu hình khi đưa lên môi trường thật.
- **Điểm hạn chế:** Chi phí băng thông cao nếu không dùng hạ tầng Cloudflare.
- **Bài học rút ra cho WORD BRIDGE:** Thiết lập quy trình CI/CD qua GitHub Actions tự động chạy `npm run build` và `npm test`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Triển khai trực tiếp lên hạ tầng Cloudflare Workers + D1 + R2.
### 47. [GitHub](https://github.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://github.com/](https://github.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `RESTRICTED_BOT_PROTECTION (Đã khảo sát chuẩn tổ chức Repository & GitHub Actions)`
- **Các trang/phân khu đã khảo sát:** `/, /features/actions`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Cấu trúc mã nguồn tiêu chuẩn, `.gitignore`, `.env.example`, README hướng dẫn chi tiết và workflow kiểm thử tự động.
- **Điểm mạnh:** Giúp đội ngũ kỹ thuật tiếp nhận, kiểm tra và triển khai mã nguồn tức thì.
- **Điểm hạn chế:** Cần kiểm soát chặt để không đẩy nhầm file chứa khóa bí mật.
- **Bài học rút ra cho WORD BRIDGE:** Đóng gói `WORD-BRIDGE-GITHUB-READY.zip` sạch tuyệt đối, có bước chặn file `.env` trong CI.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Cung cấp hướng dẫn 13 bước đưa mã nguồn lên GitHub và kết nối Cloudflare.
### 48. [Cloudflare Developers](https://developers.cloudflare.com/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://developers.cloudflare.com/](https://developers.cloudflare.com/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /workers/, /d1/, /r2/, /realtime/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Tài liệu chính thức về Cloudflare Workers ES Modules, D1 Serverless SQL (`.prepare().bind()`), R2 Object Storage và bảo mật WAF.
- **Điểm mạnh:** Hiệu năng biên toàn cầu, tích hợp nguyên bản với D1 `word` và R2 `word`.
- **Điểm hạn chế:** Cần cấu hình đúng `wrangler.toml` hiện hành.
- **Bài học rút ra cho WORD BRIDGE:** Sử dụng chuẩn ES Module Worker (`export default { async fetch(request, env, ctx) }`) và binding `DB` / `STORAGE`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Cấu hình chính xác Database ID `ce84cc48-6d49-409b-b45a-13ba3bc4a771` và R2 bucket `word`.
### 49. [Resend Documentation](https://resend.com/docs)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://resend.com/docs](https://resend.com/docs)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/docs, /docs/send-with-cloudflare-workers`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Giao diện lập trình gửi email giao dịch qua HTTP REST API tương thích hoàn toàn với Cloudflare Workers, hỗ trợ `reply_to` và xác thực SPF/DKIM/DMARC.
- **Điểm mạnh:** Gọn nhẹ, không cần kết nối TCP SMTP truyền thống vốn bị giới hạn trên edge runtime.
- **Điểm hạn chế:** Cần người dùng cung cấp API Key và xác minh bản ghi DNS domain.
- **Bài học rút ra cho WORD BRIDGE:** Xây dựng `EmailDeliveryAdapter` hỗ trợ Resend API, thiết lập quy tắc `Reply-To: cskh@wordbridge.vn`.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Ghi rõ trạng thái `BLOCKED_MISSING_CREDENTIALS` khi chưa có API Key, không giả lập gửi thành công.
### 50. [LiveKit Documentation](https://docs.livekit.io/)
- **Nhóm tham khảo:** E. Giao diện & Công nghệ
- **URL chính thức:** [https://docs.livekit.io/](https://docs.livekit.io/)
- **Ngày truy cập & khảo sát:** 2026-11-18
- **Trạng thái nghiên cứu:** `VERIFIED_PUBLIC_PAGES`
- **Các trang/phân khu đã khảo sát:** `/, /intro/basics/rooms-participants-tracks/, /transport/`
- **Đặc điểm UI/UX & Nghiệp vụ quan sát được:** Kiến trúc WebRTC thời gian thực quản lý theo Room, Participant và Audio/Video Track độc lập; cho phép tắt hoàn toàn Data Channel (Chat) và Egress (Recording).
- **Điểm mạnh:** Cho phép kiểm soát quyền phát luồng âm thanh/hình ảnh ở cấp độ token máy chủ.
- **Điểm hạn chế:** Cần máy chủ LiveKit hoặc tài khoản Cloud được cấu hình khóa API.
- **Bài học rút ra cho WORD BRIDGE:** Thiết kế phân hệ Learner Meet tách biệt hoàn toàn kênh Audio/Video khỏi Chat và Recording.
- **Phương án áp dụng thực tế vào WORD BRIDGE:** Khóa cứng `chat_disabled = 1`, `recording_disabled = 1`, `screenshare_disabled = 1` ở cả DB và API.

