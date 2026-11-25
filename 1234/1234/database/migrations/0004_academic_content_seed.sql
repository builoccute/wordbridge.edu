-- =============================================================================
-- Migration: 0004_academic_content_seed.sql
-- Project: WORD BRIDGE (https://www.wordbridge.vn/)
-- Purpose: Seed structured programs, courses, lessons, dictionary entries,
--          exercises, exams, and 15-system baseline datasets for Chinese (General
--          + Specialized), English (General + Specialized), and Russian (General ONLY).
-- =============================================================================

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO schema_migrations (version, name, checksum) VALUES
('0004', '0004_academic_content_seed.sql', 'sha256:wb-0004-academic-seed');

-- 1. Learning Programs (General for zh, en, ru; Specialized ONLY for zh, en)
INSERT OR IGNORE INTO learning_programs
(id, language_code, slug, title_vi, title_native, program_group, level_code, cefr_reference, specialized_domain, description_vi, is_public, status, version)
VALUES
('prog-zh-gen-1', 'zh', 'tieng-trung-tong-quat-so-trung-cap', 'Tiếng Trung Tổng Quát & Giao Tiếp Chuẩn HSK', '综合汉语与标准交际课程', 'GENERAL', 'HSK 1 - HSK 4', 'A1 - B2 (Tham chiếu)', NULL, 'Chương trình phát triển toàn diện 4 kỹ năng Nghe - Nói - Đọc - Viết chữ Hán, Pinyin và ngữ pháp hệ thống.', 1, 'PUBLISHED', 1),
('prog-zh-spec-1', 'zh', 'tieng-trung-chuyen-nganh-thuong-mai-ky-thuat', 'Tiếng Trung Chuyên Ngành: Logistics, Thương Mại & Kỹ Thuật Sản Xuất', '商务物流与工程技术专业汉语', 'SPECIALIZED', 'HSK 3 - HSK 6', 'B1 - C1 (Tham chiếu)', 'Logistics, Thương mại điện tử, Cơ khí - Điện tử', 'Chương trình tiếng Trung chuyên ngành phục vụ làm việc tại doanh nghiệp sản xuất, xuất nhập khẩu và kỹ thuật công nghiệp.', 1, 'PUBLISHED', 1),
('prog-en-gen-1', 'en', 'tieng-anh-tong-quat-hoc-thuat', 'Tiếng Anh Tổng Quát, Giao Tiếp & Học Thuật Quốc Tế', 'General & Academic English Mastery', 'GENERAL', 'CEFR A1 - C1', 'CEFR A1 - C1', NULL, 'Chương trình làm chủ 4 kỹ năng tiếng Anh từ nền tảng đến học thuật và giao tiếp chuyên nghiệp.', 1, 'PUBLISHED', 1),
('prog-en-spec-1', 'en', 'tieng-anh-chuyen-nganh-8-linh-vuc', 'Tiếng Anh Chuyên Ngành Đa Lĩnh Vực (8 Nhóm Ngành Trọng Điểm)', 'English for Specific Purposes (ESP - 8 Core Industries)', 'SPECIALIZED', 'CEFR B1 - C1', 'CEFR B1 - C1', 'CNTT, Cơ khí, Điện-Điện tử, Kinh tế-Du lịch, Ô tô, Đồ họa, Điều dưỡng-Y dược, Logistics', 'Chương trình tiếng Anh chuyên ngành thực chiến theo tình huống công việc, hồ sơ kỹ thuật và giao tiếp doanh nghiệp.', 1, 'PUBLISHED', 1),
('prog-ru-gen-1', 'ru', 'tieng-nga-tong-quat-giao-tiep-trki', 'Tiếng Nga Tổng Quát & Giao Tiếp Chuẩn ТРКИ (TORFL)', 'Общий курс русского языка как иностранного (ТРКИ)', 'GENERAL', 'ТЭУ (A1) - ТРКИ-II (B2)', 'A1 - B2 (Tham chiếu TORFL)', NULL, 'Chương trình học tiếng Nga tổng quát: bảng chữ cái Cyrillic, hệ thống 6 cách danh từ, cặp thể động từ và giao tiếp đời sống/học thuật (Không bao gồm ngoại ngữ chuyên ngành).', 1, 'PUBLISHED', 1);

-- 2. Curricula
INSERT OR IGNORE INTO curricula (id, program_id, code, title_vi, syllabus_summary_vi, order_index, version, status) VALUES
('curr-zh-gen', 'prog-zh-gen-1', 'CURR-ZH-GEN-01', 'Giáo trình Hán Ngữ Hiện Đại & Giao Tiếp Đa Ngữ Cảnh', 'Từ hệ thống thanh điệu Pinyin, cấu tạo bộ thủ chữ Hán đến hội thoại và đọc hiểu văn bản hiện đại.', 1, 1, 'PUBLISHED'),
('curr-zh-spec', 'prog-zh-spec-1', 'CURR-ZH-SPEC-01', 'Giáo trình Tiếng Trung Chuyên Ngành Chuỗi Cung Ứng & Nhà Máy', 'Thuật ngữ hợp đồng ngoại thương, vận đơn, quản lý chất lượng dây chuyền sản xuất và đàm phán đối tác.', 1, 1, 'PUBLISHED'),
('curr-en-gen', 'prog-en-gen-1', 'CURR-EN-GEN-01', 'Giáo trình Tiếng Anh Bốn Kỹ Năng & Tư Duy Học Thuật', 'Xây dựng nền tảng ngữ âm IPA, ngữ pháp ứng dụng, đọc hiểu chuyên sâu và viết luận học thuật.', 1, 1, 'PUBLISHED'),
('curr-en-spec', 'prog-en-spec-1', 'CURR-EN-SPEC-01', 'Giáo trình Tiếng Anh Chuyên Ngành Kỹ Thuật, CNTT & Thương Mại', 'Đọc tài liệu kỹ thuật, giao tiếp dự án phần mềm, vận hành xuất nhập khẩu và chăm sóc y tế.', 1, 1, 'PUBLISHED'),
('curr-ru-gen', 'prog-ru-gen-1', 'CURR-RU-GEN-01', 'Giáo trình Tiếng Nga Tổng Quát ТРКИ (Từ Sơ Cấp đến Trung Cấp)', 'Làm chủ ngữ âm tiếng Nga, biến đổi 6 cách (Падежи), động từ chuyển động và hội thoại chuẩn mực.', 1, 1, 'PUBLISHED');

-- 3. Courses
INSERT OR IGNORE INTO courses (id, curriculum_id, language_code, slug, title_vi, title_target, level_code, is_specialized, specialized_field, estimated_hours, status, version) VALUES
('course-zh-101', 'curr-zh-gen', 'zh', 'han-ngu-nen-tang-hsk1-hsk2', 'Hán Ngữ Nền Tảng & Phản Xạ Nghe Nói (HSK 1–2)', '基础汉语与听说训练', 'HSK 1-2', 0, NULL, 36, 'PUBLISHED', 1),
('course-zh-spec-201', 'curr-zh-spec', 'zh', 'tieng-trung-logistics-xuat-nhap-khau', 'Tiếng Trung Chuyên Ngành Logistics & Xuất Nhập Khẩu', '国际物流与进出口实务汉语', 'HSK 4', 1, 'Logistics - Xuất nhập khẩu', 45, 'PUBLISHED', 1),
('course-en-101', 'curr-en-gen', 'en', 'english-core-communication-b1', 'Tiếng Anh Giao Tiếp & Học Thuật Cốt Lõi (CEFR B1–B2)', 'Core Academic & Communicative English', 'CEFR B1-B2', 0, NULL, 40, 'PUBLISHED', 1),
('course-en-spec-201', 'curr-en-spec', 'en', 'english-for-software-engineering-it', 'Tiếng Anh Chuyên Ngành Công Nghệ Thông Tin & Kỹ Thuật Phần Mềm', 'English for Software Engineering & Cloud Operations', 'CEFR B2', 1, 'Công nghệ thông tin', 45, 'PUBLISHED', 1),
('course-en-spec-202', 'curr-en-spec', 'en', 'english-for-mechanical-automotive-logistics', 'Tiếng Anh Chuyên Ngành Kỹ Thuật Cơ Khí, Ô Tô & Chuỗi Cung Ứng', 'Technical English for Engineering, Automotive & Supply Chain', 'CEFR B1-B2', 1, 'Cơ khí - Ô tô - Logistics', 48, 'PUBLISHED', 1),
('course-ru-101', 'curr-ru-gen', 'ru', 'tieng-nga-tong-quat-teu-tbu', 'Tiếng Nga Tổng Quát: Ngữ Âm, Hệ Thống Cách & Hội Thoại (ТЭУ–ТБУ)', 'Русский язык: фонетика, падежная система и диалоги', 'ТЭУ - ТБУ (A1-A2)', 0, NULL, 42, 'PUBLISHED', 1);

-- 4. Lessons (Complete 12-Part Structured Lessons)
INSERT OR IGNORE INTO lessons
(id, course_id, language_code, slug, title_vi, title_target, order_index, objectives_json, vocabulary_json, grammar_json, new_knowledge_html, examples_json, context_dialogue_json, listening_section_json, speaking_section_json, reading_section_json, writing_section_json, media_assets_json, status, version)
VALUES
('lesson-zh-01', 'course-zh-101', 'zh', 'chao-hoi-va-gioi-thieu-ban-than-tieng-trung', 'Bài 1: Chào hỏi, Quốc tịch và Giao tiếp Lịch sự trong Tiếng Trung', '第一课：问候、国籍与礼貌交际', 1,
 '["Nắm vững quy tắc biến điệu thanh 3 liên tiếp trong Pinyin","Sử dụng chuẩn xác đại từ nhân xưng 你 (nǐ) và 您 (nín)","Đặt câu hỏi và trả lời về họ tên, quốc tịch, nghề nghiệp"]',
 '[{"word":"您好","pinyin":"nín hǎo","meaning_vi":"Xin chào (trang trọng)"},{"word":"请问","pinyin":"qǐng wèn","meaning_vi":"Xin hỏi"},{"word":"留学生","pinyin":"liúxuéshēng","meaning_vi":"Du học sinh"}]',
 '[{"pattern":"S + 是 + Danh từ","explanation_vi":"Cấu trúc khẳng định xác định danh tính hoặc nghề nghiệp"},{"pattern":"Câu hỏi với 吗 (ma) và 呢 (ne)","explanation_vi":"Đặt câu hỏi nghi vấn có/không và câu hỏi chuyển tiếp ngắn gọn"}]',
 '<p>Trong giao tiếp tiếng Trung hiện đại, sự phân biệt giữa <strong>你 (nǐ)</strong> và <strong>您 (nín)</strong> thể hiện thái độ tôn trọng đối với người lớn tuổi, giảng viên hoặc đối tác. Khi hai âm tiết mang thanh 3 đi liền nhau (ví dụ: 你好 nǐ hǎo), âm tiết thứ nhất được phát âm chuyển thành thanh 2 (ní hǎo), nhưng khi viết Pinyin vẫn giữ nguyên dấu thanh gốc.</p>',
 '[{"target":"您好，请问您贵姓？","phonetic":"Nín hǎo, qǐngwèn nín guìxìng?","vi":"Xin chào ngài, xin hỏi quý danh của ngài là gì?"},{"target":"我是越南留学生。","phonetic":"Wǒ shì Yuènán liúxuéshēng.","vi":"Tôi là lưu học sinh Việt Nam."}]',
 '[{"speaker":"Lý Minh","line":"您好！请问您是王老师吗？","vi":"Xin chào! Xin hỏi thầy có phải là thầy Vương không ạ?"},{"speaker":"Vương Hải","line":"我是。你好，你是新来的留学生吗？","vi":"Đúng vậy. Chào bạn, bạn là lưu học sinh mới đến phải không?"}]',
 '{"audio_r2_key":"learning/chinese/hsk1/lesson01-dialogue.mp3","transcript":"您好！请问您贵姓？免贵姓陈，我是越南工程师。","comprehension_question":"Người nói làm nghề gì và đến từ đâu?"}',
 '{"prompt":"Hãy ghi âm câu tự giới thiệu họ tên, trường học và nơi làm việc của bạn bằng tiếng Trung.","target_sentence":"大家好，我是越南学生，很高兴认识你们。"}',
 '{"passage":"陈明是一名来自越南胡志明市的工程师。他现在学习中文和专业术语，因为他每天都跟中国供应商合作。","questions":["Trần Minh đến từ thành phố nào?","Vì sao anh ấy học tiếng Trung và thuật ngữ chuyên ngành?"]}',
 '{"prompt":"Viết một đoạn văn ngắn (40-60 chữ Hán) giới thiệu bản thân, trường học và công việc của bạn.","min_words":30}',
 '[{"type":"AUDIO","r2_key":"learning/chinese/hsk1/lesson01-dialogue.mp3"},{"type":"PDF","r2_key":"learning/chinese/hsk1/lesson01-handout.pdf"}]',
 'PUBLISHED', 1),

('lesson-zh-spec-01', 'course-zh-spec-201', 'zh', 'quy-trinh-thong-quan-va-van-don-duong-bien', 'Bài 1 (Chuyên ngành): Vận đơn đường biển (提单) và Thủ tục Thông quan Xuất nhập khẩu', '专业第一课：海运提单与报关清关流程', 1,
 '["Làm chủ 15 thuật ngữ cốt lõi về vận đơn (提单), khai báo hải quan (报关) và thông quan (清关)","Đọc hiểu thông báo giao nhận hàng hóa quốc tế bằng tiếng Trung","Soạn thảo email xác nhận lịch tàu và chứng từ xuất khẩu"]',
 '[{"word":"海运提单","pinyin":"hǎiyùn tídān","meaning_vi":"Vận đơn đường biển (Bill of Lading)"},{"word":"报关单","pinyin":"bàoguāndān","meaning_vi":"Tờ khai hải quan"},{"word":"装箱单","pinyin":"zhuāngxiāngdān","meaning_vi":"Phiếu đóng gói (Packing List)"}]',
 '[{"pattern":"把 + Tân ngữ + Động từ + Kết quả","explanation_vi":"Câu chữ 把 dùng trong quy trình xử lý chứng từ và vận chuyển hàng hóa"},{"pattern":"由 + Chủ thể + 负责","explanation_vi":"Do đơn vị/bộ phận nào chịu trách nhiệm thực hiện"}]',
 '<p>Trong nghiệp vụ Logistics Trung – Việt, bộ chứng từ xuất nhập khẩu tiêu chuẩn gồm <strong>商业发票 (Hóa đơn thương mại)</strong>, <strong>装箱单 (Packing List)</strong>, <strong>海运提单 (Bill of Lading)</strong> và <strong>原产地证书 (Giấy chứng nhận xuất xứ C/O)</strong>. Khi giao dịch, cần dùng cấu trúc câu rõ ràng về thời hạn và trách nhiệm pháp lý.</p>',
 '[{"target":"请尽快把正本提单寄给我们，以便及时办理清关手续。","phonetic":"Qǐng jǐnkuài bǎ zhèngběn tídān jì gěi wǒmen, yǐbiàn jíshí bànlǐ qīngguān shǒuxù.","vi":"Vui lòng gửi sớm vận đơn gốc cho chúng tôi để kịp thời làm thủ tục thông quan."}]',
 '[{"speaker":"Chuyên viên Logistics","line":"王经理，这批机电设备的报关资料已经准备齐全了吗？","vi":"Giám đốc Vương, hồ sơ khai báo hải quan của lô thiết bị cơ điện này đã chuẩn bị đầy đủ chưa?"}]',
 '{"audio_r2_key":"specialized/chinese/logistics/lesson01-customs.mp3","transcript":"货柜将于明日抵达海防港，请核对装箱单与提单号。","comprehension_question":"Container hàng sẽ cập cảng nào vào ngày mai?"}',
 '{"prompt":"Thực hành thông báo tình trạng thông quan lô hàng với đối tác bằng tiếng Trung.","target_sentence":"这批货物的报关手续已经顺利完成。"}',
 '{"passage":"根据双方签署的采购合同，卖方应在货物装船后三个工作日内提供全套清关单据，包括商业发票、装箱单和原产地证书。","questions":["Bên bán phải cung cấp bộ chứng từ trong thời hạn bao lâu sau khi xếp hàng lên tàu?"]}',
 '{"prompt":"Viết email tiếng Trung (60-80 chữ) nhắc đối tác gửi bản scan vận đơn và Packing List để chuẩn bị khai báo hải quan.","min_words":45}',
 '[{"type":"PDF","r2_key":"specialized/chinese/logistics/bill-of-lading-guide.pdf"}]',
 'PUBLISHED', 1),

('lesson-en-01', 'course-en-101', 'en', 'academic-argumentation-and-hedging-in-english', 'Bài 1: Cấu trúc Lập luận Học thuật và Ngôn ngữ Thận trọng (Academic Hedging)', 'Unit 1: Academic Argumentation & Epistemic Hedging', 1,
 '["Phân biệt mệnh đề khẳng định tuyệt đối và mệnh đề học thuật có tính thận trọng (Hedging)","Sử dụng thành thạo các động từ học thuật: indicate, suggest, demonstrate, appear to","Viết đoạn văn nghị luận 150 từ đạt chuẩn mạch lạc (Cohesion & Coherence)"]',
 '[{"word":"empirical","phonetic":"/ɪmˈpɪr.ɪ.kəl/","meaning_vi":"Thực nghiệm, dựa trên quan sát thực tế"},{"word":"corroborate","phonetic":"/kəˈrɒb.ə.reɪt/","meaning_vi":"Củng cố, xác nhận bằng bằng chứng"},{"word":"plausible","phonetic":"/ˈplɔː.zə.bəl/","meaning_vi":"Hợp lý, có khả năng đúng"}]',
 '[{"pattern":"It is widely acknowledged that + Clause, whereas + Clause","explanation_vi":"Cấu trúc đối chiếu quan điểm phổ biến và luận điểm phản biện"},{"pattern":"Modal Verbs + Passive Infinitive (may be attributed to)","explanation_vi":"Giảm độ tuyệt đối khi nêu nguyên nhân của một hiện tượng học thuật"}]',
 '<p>Trong văn viết học thuật tiếng Anh (Academic Writing), người viết tránh đưa ra các nhận định tuyệt đối không có căn cứ. Thay vì viết <em>"Remote work increases productivity"</em>, văn phong học thuật chuẩn sử dụng kỹ thuật <strong>Hedging</strong>: <em>"Empirical findings suggest that flexible work arrangements may contribute to higher productivity in knowledge-intensive sectors."</em></p>',
 '[{"target":"The preliminary data appear to corroborate the hypothesis regarding cross-lingual transfer.","phonetic":"/ðə prɪˈlɪmɪnəri ˈdeɪtə əˈpɪə tə kəˈrɒbəreɪt ðə haɪˈpɒθəsɪs/","vi":"Dữ liệu sơ bộ dường như củng cố giả thuyết về sự chuyển giao liên ngôn ngữ."}]',
 '[{"speaker":"Dr. Evans","line":"How firmly can we state the causal link between spaced repetition and long-term lexical retention?","vi":"Chúng ta có thể khẳng định mối liên hệ nhân quả giữa lặp lại ngắt quãng và khả năng ghi nhớ từ vựng dài hạn ở mức độ nào?"}]',
 '{"audio_r2_key":"learning/english/b2/unit01-lecture.mp3","transcript":"While correlation is evident across three cohorts, researchers caution against overgeneralizing the findings.","comprehension_question":"Why do the researchers caution against overgeneralizing?"}',
 '{"prompt":"Trình bày quan điểm của bạn về vai trò của ngoại ngữ trong kỷ nguyên số bằng kỹ thuật Academic Hedging.","target_sentence":"Current evidence suggests that multilingual competence significantly enhances cognitive flexibility."}',
 '{"passage":"Academic discourse relies heavily on epistemic modality to calibrate the strength of claims. By deploying lexical hedges such as arguably, ostensibly, and tend to, authors protect their propositions from immediate refutation while maintaining scholarly objectivity.","questions":["What is the primary function of epistemic modality in academic discourse?"]}',
 '{"prompt":"Write a 120-word academic paragraph analyzing how technology transforms foreign language acquisition, using at least three hedging devices.","min_words":90}',
 '[{"type":"AUDIO","r2_key":"learning/english/b2/unit01-lecture.mp3"}]',
 'PUBLISHED', 1),

('lesson-en-spec-01', 'course-en-spec-201', 'en', 'cloud-architecture-incident-postmortem-english', 'Bài 1 (Chuyên ngành CNTT): Báo cáo Sự cố Hệ thống (Incident Postmortem) & Kiến trúc Đám mây', 'ESP Unit 1: Cloud Architecture & Blameless Incident Postmortems', 1,
 '["Sử dụng chính xác thuật ngữ kỹ thuật phần mềm: latency, throughput, idempotency, failover, rate limiting","Trình bày nguyên nhân gốc (Root Cause Analysis) trong cuộc họp kỹ thuật","Viết báo cáo Incident Postmortem rõ ràng, khách quan theo chuẩn kỹ thuật quốc tế"]',
 '[{"word":"idempotent","phonetic":"/ˌaɪ.dɛmˈpoʊ.tənt/","meaning_vi":"Tính bất biến khi thực thi lặp lại (trong API/hệ thống phân tán)"},{"word":"mitigation","phonetic":"/ˌmɪt.ɪˈɡeɪ.ʃən/","meaning_vi":"Biện pháp giảm thiểu tác động sự cố"},{"word":"bottleneck","phonetic":"/ˈbɒt.əl.nek/","meaning_vi":"Điểm nghẽn hiệu năng"}]',
 '[{"pattern":"Had + S + Past Participle, S + would have + Past Participle","explanation_vi":"Câu điều kiện loại 3 đảo ngữ dùng phân tích kịch bản phòng ngừa sự cố trong báo cáo kỹ thuật"}]',
 '<p>Khi vận hành nền tảng đám mây quốc tế, báo cáo <strong>Blameless Postmortem</strong> tập trung vào nguyên nhân hệ thống thay vì đổ lỗi cá nhân. Cấu trúc chuẩn gồm: <em>Executive Summary, Impact & Severity, Root Cause Analysis (5 Whys), Trigger & Detection, Mitigation Steps,</em> và <em>Action Items</em>.</p>',
 '[{"target":"The elevated p99 latency was triggered by an unindexed database query during peak traffic.","phonetic":"Technical report statement","vi":"Độ trễ p99 tăng cao bị kích hoạt bởi một truy vấn cơ sở dữ liệu chưa đánh chỉ mục trong giờ cao điểm."}]',
 '[{"speaker":"Site Reliability Engineer","line":"We mitigated the connection pool exhaustion by deploying a parameterized edge cache and rate limiter.","vi":"Chúng tôi đã khắc phục tình trạng cạn kiệt vùng kết nối bằng cách triển khai bộ nhớ đệm biên tham số hóa và bộ giới hạn tần suất."}]',
 '{"audio_r2_key":"specialized/english/it/unit01-standup.mp3","transcript":"The canary deployment detected a regression in the authentication worker, prompting an immediate automated rollback.","comprehension_question":"What triggered the automated rollback?"}',
 '{"prompt":"Hãy tóm tắt bằng tiếng Anh cách xử lý một sự cố quá tải API trong 3 câu ngắn gọn.","target_sentence":"We identified the bottleneck and enforced strict rate limiting at the edge."}',
 '{"passage":"To ensure high availability across distributed edge nodes, all mutating API endpoints must enforce idempotency keys and prepared SQL statements, preventing duplicate transactions during network retries.","questions":["Why are idempotency keys required on mutating API endpoints?"]}',
 '{"prompt":"Write a concise Root Cause & Remediation summary (80-120 words) in English for a simulated API timeout incident.","min_words":70}',
 '[{"type":"PDF","r2_key":"specialized/english/it/postmortem-template.pdf"}]',
 'PUBLISHED', 1),

('lesson-ru-01', 'course-ru-101', 'ru', 'bang-chu-cai-cyrillic-trong-am-va-cach-1-cach-4-tieng-nga', 'Bài 1: Hệ thống Trọng âm, Hiện tượng Biến âm (Аканье) và Danh từ Cách 1 – Cách 4 trong Tiếng Nga', 'Урок 1: Русское ударение, редукция гласных и Именительный / Винительный падежи', 1,
 '["Nắm vững quy tắc trọng âm tiếng Nga và hiện tượng đọc nguyên âm о không mang trọng âm thành âm [a]","Phân biệt giống của danh từ tiếng Nga (Giống đực, Giống cái, Giống trung) ở Cách 1 (Именительный падеж)","Chia đúng danh từ và tính từ ở Cách 4 (Винительный падеж) làm tân ngữ trực tiếp"]',
 '[{"word":"здравствуйте","phonetic":"[zdrástvuytye]","meaning_vi":"Xin chào (trang trọng)"},{"word":"университет","phonetic":"[oo-nee-vyer-see-tyét]","meaning_vi":"Trường đại học"},{"word":"библиотека","phonetic":"[beeb-lee-a-tyé-ka]","meaning_vi":"Thư viện"}]',
 '[{"pattern":"Я изучаю + Danh từ Cách 4 (Винительный падеж)","explanation_vi":"Diễn tả hành động học hoặc nghiên cứu một môn học/ngôn ngữ (ví dụ: Я изучаю русский язык)"},{"pattern":"Это + Danh từ Cách 1","explanation_vi":"Cấu trúc giới thiệu người hoặc sự vật ở cách nguyên thể"}]',
 '<p>Trong tiếng Nga, <strong>trọng âm (Ударение)</strong> quyết định cách phát âm của các nguyên âm xung quanh. Khi nguyên âm <strong>о</strong> đứng ở âm tiết không mang trọng âm (như trong từ <em>молоко́</em> [ma-la-kó]), nó được phát âm gần giống âm [a]. Đồng thời, danh từ giống cái kết thúc bằng <strong>-а / -я</strong> khi chuyển sang Cách 4 (làm tân ngữ trực tiếp của ngoại động từ) sẽ đổi đuôi thành <strong>-у / -ю</strong> (ví dụ: <em>книга → Я читаю книгу</em>).</p>',
 '[{"target":"Здравствуйте! Меня зовут Антон, я изучаю русский язык и литературу.","phonetic":"Zdrástvuytye! Meenyá zavút Antón, ya eezoocháyu rússkiy yazýk ee leetyeratúru.","vi":"Xin chào! Tôi tên là Anton, tôi đang học tiếng Nga và văn học."}]',
 '[{"speaker":"Анна","line":"Скажите, пожалуйста, что вы сейчас читаете?","vi":"Xin vui lòng cho biết, hiện tại bạn đang đọc gì vậy?"},{"speaker":"Виктор","line":"Сейчас я читаю интересную русскую книгу и слушаю диалог.","vi":"Hiện tại tôi đang đọc một cuốn sách tiếng Nga thú vị và nghe hội thoại."}]',
 '{"audio_r2_key":"learning/russian/a1/urok01-dialogue.mp3","transcript":"Доброе утро! Это наш новый университет, а там большая библиотека.","comprehension_question":"Trong đoạn băng có nhắc đến những địa điểm nào?"}',
 '{"prompt":"Đọc to câu giới thiệu bản thân và ngôn ngữ bạn đang học bằng tiếng Nga (chú ý trọng âm và biến âm о).","target_sentence":"Здравствуйте, я изучаю русский язык на платформе WORD BRIDGE."}',
 '{"passage":"Виктор — студент из Вьетнама. Каждый день утром он читает новый текст, учит русские слова и слушает аудиозаписи. Вечером он пишет упражнения в тетради.","questions":["Victor làm những hoạt động học tập nào vào buổi sáng?","Buổi tối anh ấy làm gì?"]}',
 '{"prompt":"Viết 4–5 câu bằng tiếng Nga giới thiệu tên bạn, bạn đến từ đâu và bạn đang đọc/học gì (sử dụng Cách 1 và Cách 4).","min_words":25}',
 '[{"type":"AUDIO","r2_key":"learning/russian/a1/urok01-dialogue.mp3"}]',
 'PUBLISHED', 1);

-- 5. Dictionary Entries (Multi-lingual zh, en, ru + Specialized zh & en)
INSERT OR IGNORE INTO dictionary_entries
(id, language_code, headword, phonetic, audio_r2_key, part_of_speech, meaning_vi, definition_target, examples_json, usage_context, synonyms_json, antonyms_json, word_family_json, collocations_json, radicals_stroke_json, is_specialized, specialized_domain, level_code, is_public_preview)
VALUES
('dict-zh-001', 'zh', '桥梁', 'qiáo liáng', 'dictionary/zh/qiaoliang.mp3', 'Danh từ (名词)', 'Cây cầu; cầu nối (nghĩa đen và nghĩa bóng)', '连接两岸的建筑物；比喻能起沟通作用的人或事物。',
 '[{"target":"语言是沟通不同文化的桥梁。","phonetic":"Yǔyán shì gōutōng bùtóng wénhuà de qiáoliáng.","vi":"Ngôn ngữ là cây cầu kết nối các nền văn hóa khác nhau."}]',
 'Dùng trong cả văn cảnh kỹ thuật xây dựng lẫn ẩn dụ học thuật, ngoại giao.',
 '["纽带 (niǔdài)"]', '["隔阂 (géhé)"]', '["大桥","桥梁工程","架桥"]', '["文化桥梁","架起桥梁","沟通桥梁"]',
 '{"radicals":["木 (Mộc - 4 nét)","米 (Mễ)","刃 (Nhẫn)"],"total_strokes":21,"decomposition":"桥 (木+乔) + 梁 (氵+刃+木)"}', 0, NULL, 'HSK 4', 1),

('dict-zh-002', 'zh', '供应链', 'gōng yìng liàn', 'dictionary/zh/gongyinglian.mp3', 'Danh từ chuyên ngành (专业名词)', 'Chuỗi cung ứng (Supply Chain)', '围绕核心企业，从配套零件开始到制成中间产品以及最终产品，最后由销售网络把产品送到消费者手中的整体功能网链结构。',
 '[{"target":"数字化转型有助于提升跨境供应链的透明度。","phonetic":"Shùzìhuà zhuǎnxíng yǒuzhùyú tíshēng kuàjìng gōngyìngliàn de tòumíngdù.","vi":"Chuyển đổi số giúp nâng cao tính minh bạch của chuỗi cung ứng xuyên biên giới."}]',
 'Thuật ngữ cốt lõi trong Logistics, xuất nhập khẩu và quản trị sản xuất công nghiệp.',
 '["产业链 (chǎnyèliàn)"]', '["断链 (duànliàn)"]', '["供应商","供应链管理","供应"]', '["全球供应链","优化供应链","供应链金融"]',
 '{"radicals":["亻 (Nhân đứng)","广 (Nghiễm)","钅 (Kim)"],"total_strokes":26,"decomposition":"供 + 应 + 链"}', 1, 'Logistics & Thương mại quốc tế', 'HSK 5', 1),

('dict-zh-003', 'zh', '半导体', 'bàn dǎo tǐ', 'dictionary/zh/bandaoti.mp3', 'Danh từ chuyên ngành (工程术语)', 'Chất bán dẫn (Semiconductor)', '常温下导电性能介于导体与绝缘体之间的材料。',
 '[{"target":"半导体芯片是现代电子设备的核心组件。","phonetic":"Bàndǎotǐ xīnpiàn shì xiàndài diànzǐ shèbèi de héxīn zǔjiàn.","vi":"Vi mạch bán dẫn là linh kiện cốt lõi của thiết bị điện tử hiện đại."}]',
 'Sử dụng trong kỹ thuật Điện - Điện tử, vi mạch và sản xuất công nghệ cao.',
 '["晶片"]', '["绝缘体 (juéyuántǐ)"]', '["导体","超导体","半导体材料"]', '["半导体产业","半导体封装","功率半导体"]',
 '{"radicals":["寸 (Thốn)","亻 (Nhân)"],"total_strokes":18,"decomposition":"半 + 导 + 体"}', 1, 'Điện - Điện tử & Bán dẫn', 'HSK 5', 1),

('dict-en-001', 'en', 'resilience', '/rɪˈzɪl.jəns/', 'dictionary/en/resilience.mp3', 'Noun', 'Khả năng phục hồi, tính kiên cường; độ bền đàn hồi (kỹ thuật)', 'The capacity to withstand or to recover quickly from difficulties; the ability of a substance or system to return to its original state.',
 '[{"target":"Architectural resilience ensures that distributed systems remain operational during regional outages.","phonetic":"/ˌɑːkɪˈtektʃərəl rɪˈzɪljəns/","vi":"Khả năng chịu lỗi kiến trúc bảo đảm các hệ thống phân tán vẫn vận hành khi xảy ra sự cố vùng."}]',
 'Dùng phổ biến trong tâm lý học giáo dục, kinh tế vĩ mô và kỹ thuật hệ thống.',
 '["robustness","adaptability","tenacity"]', '["fragility","vulnerability"]', '["resilient (adj)","resiliently (adv)"]', '["system resilience","build resilience","supply chain resilience"]',
 '{}', 0, NULL, 'CEFR C1', 1),

('dict-en-002', 'en', 'idempotency', '/ˌaɪ.dɛmˈpoʊ.tən.si/', 'dictionary/en/idempotency.mp3', 'Noun (Technical ESP)', 'Tính bất biến khi thực thi lặp lại (trong API và giao dịch mạng)', 'A property of certain operations in mathematics and computer science whereby they can be applied multiple times without changing the result beyond the initial application.',
 '[{"target":"Payment gateway webhooks require strict idempotency to prevent double charging on network retries.","phonetic":"/strɪkt ˌaɪdɛmˈpoʊtənsi/","vi":"Các webhook cổng thanh toán đòi hỏi tính idempotency nghiêm ngặt để ngăn chặn việc trừ tiền hai lần khi mạng thử lại."}]',
 'Thuật ngữ chuyên ngành Công nghệ thông tin, Backend API và Tài chính số.',
 '["repeatability"]', '["side-effect mutation"]', '["idempotent (adj)"]', '["idempotency key","enforce idempotency","idempotent request"]',
 '{}', 1, 'Công nghệ thông tin & Kỹ thuật phần mềm', 'CEFR C1', 1),

('dict-en-003', 'en', 'preventive maintenance', '/prɪˈven.tɪv ˈmeɪn.tən.əns/', 'dictionary/en/preventive-maintenance.mp3', 'Noun Phrase (Technical ESP)', 'Bảo trì phòng ngừa (trong cơ khí, ô tô và vận hành nhà máy)', 'Routine inspection and servicing of equipment to detect and correct potential failures before they occur.',
 '[{"target":"Adhering to the preventive maintenance schedule reduces unplanned CNC machine downtime by 40%.","phonetic":"/prɪˈventɪv ˈmeɪntənəns ˈʃedjuːl/","vi":"Tuân thủ lịch bảo trì phòng ngừa giúp giảm 40% thời gian dừng máy CNC ngoài kế hoạch."}]',
 'Thuật ngữ chuyên ngành Cơ khí, Công nghệ Ô tô và Quản lý sản xuất.',
 '["scheduled maintenance","proactive servicing"]', '["corrective maintenance","reactive repair"]', '["maintain (v)","maintenance (n)"]', '["preventive maintenance checklist","conduct preventive maintenance"]',
 '{}', 1, 'Kỹ thuật Cơ khí & Công nghệ Ô tô', 'CEFR B2', 1),

('dict-ru-001', 'ru', 'вдохновение', '[vdakh-na-vyé-nee-ye]', 'dictionary/ru/vdohnovenie.mp3', 'Существительное (Danh từ giống trung)', 'Cảm hứng, nguồn cảm hứng sáng tạo', 'Творческий подъём, прилив творческих сил.',
 '[{"target":"Изучение иностранных языков даёт человеку новое вдохновение и расширяет кругозор.","phonetic":"Eezoochyéneeye eenastránnykh yazykóv dayót chyelavyékoo nóvaye vdakhnavyéneeye.","vi":"Việc học ngoại ngữ mang lại cho con người nguồn cảm hứng mới và mở rộng tầm nhìn."}]',
 'Danh từ giống trung (Средний род), biến đổi theo hệ thống 6 cách tiếng Nga.',
 '["воодушевление","подъём"]', '["апатия","уныние"]', '["вдохновлять (НСВ)","вдохновить (СВ)","вдохновенный (прил.)"]', '["источник вдохновения","черпать вдохновение","творческое вдохновение"]',
 '{}', 0, NULL, 'ТРКИ-I (B1)', 1),

('dict-ru-002', 'ru', 'преподаватель', '[prye-pa-da-vá-tyelʼ]', 'dictionary/ru/prepodavatel.mp3', 'Существительное (Danh từ giống đực)', 'Giảng viên (đại học, cao đẳng, học viện)', 'Работник высшей или средней специальной школы, ведущий учебный предмет.',
 '[{"target":"Наш преподаватель подробно объяснил систему русских падежей.","phonetic":"Nash pryepadavátyelʼ padróbna abʼyasnéel seestyému rússkeekh padyezhéy.","vi":"Giảng viên của chúng tôi đã giải thích chi tiết hệ thống các cách trong tiếng Nga."}]',
 'Khác với учитель (giáo viên phổ thông), преподаватель dùng cho giảng viên đại học/chuyên nghiệp.',
 '["педагог","лектор"]', '["студент","ученик"]', '["преподавать (v)","преподавание (n)"]', '["опытный преподаватель","преподаватель русского языка"]',
 '{}', 0, NULL, 'ТБУ (A2)', 1);

-- 6. Grammar Entries
INSERT OR IGNORE INTO grammar_entries
(id, language_code, code, title_vi, structure_formula, explanation_vi, examples_json, common_mistakes_json, level_code)
VALUES
('gram-zh-01', 'zh', 'ZH-GRAM-BA', 'Câu chữ 把 (把字句) biểu thị sự tác động và kết quả xử lý', 'Chủ ngữ + 把 + Tân ngữ xác định + Động từ + Thành phần khác (Bổ ngữ kết quả/xu hướng)', 'Dùng khi muốn nhấn mạnh hành động của chủ ngữ đã tác động làm thay đổi vị trí hoặc trạng thái của một tân ngữ xác định.', '["请把那份报关单放在桌子上。","我已经把今天的生词复习完了。"]', '["Đặt phủ định Không (不/没) sau chữ 把 thay vì đặt trước chữ 把","Dùng câu chữ 把 với các động từ chỉ cảm xúc hoặc nhận thức (như 知道, 喜欢) không có thành phần kết quả"]', 'HSK 3'),
('gram-en-01', 'en', 'EN-GRAM-INV-COND', 'Đảo ngữ câu điều kiện loại 3 trong văn phong học thuật và kỹ thuật', 'Had + Subject + Past Participle (V3/ed), Subject + would/could/might + have + Past Participle', 'Thay thế cho If + Subject + had + V3 nhằm tăng tính trang trọng trong báo cáo phân tích nguyên nhân hoặc luận văn.', '["Had the rate limiter been configured at the edge, the service degradation would have been prevented."]', '["Dùng thêm từ If sau khi đã đảo trợ động từ Had lên đầu mệnh đề"]', 'CEFR C1'),
('gram-ru-01', 'ru', 'RU-GRAM-ACCUSATIVE', 'Cách 4 (Винительный падеж) của danh từ chỉ vật và danh từ chỉ người', 'Ngoại động từ + Tân ngữ Cách 4 (Giống cái -а/-я -> -у/-ю; Giống đực bất động vật giữ nguyên như Cách 1; Giống đực động vật đổi như Cách 2)', 'Biểu thị đối tượng trực tiếp chịu tác động của hành động hoặc đích đến của chuyển động (với giới từ в / на).', '["Я читаю интересную статью.","Мы слушаем нашего преподавателя."]', '["Quên đổi đuôi -а thành -у đối với danh từ giống cái","Không phân biệt danh từ giống đực chỉ người (đổi đuôi giống Cách 2) và danh từ chỉ vật"]', 'ТЭУ (A1)');

-- 7. Interactive Exercises Across Four Skills (Listening, Speaking, Reading, Writing)
INSERT OR IGNORE INTO exercises
(id, lesson_id, language_code, skill_type, exercise_format, level_code, title_vi, prompt_text, options_json, correct_answer_json, explanation_vi, rubric_json, is_public_view)
VALUES
('ex-zh-listen-01', 'lesson-zh-01', 'zh', 'LISTENING', 'MULTIPLE_CHOICE', 'HSK 2', 'Luyện nghe phản xạ: Xác định thông tin lịch hẹn và nghề nghiệp',
 'Nghe câu hội thoại: "您好，我是陈明，我们公司负责这批电子产品的海运物流。" — Công ty của Trần Minh phụ trách lĩnh vực nào?',
 '["A. Sản xuất phần mềm máy tính","B. Vận tải đường biển (Logistics) cho lô hàng điện tử","C. Đào tạo ngôn ngữ tại trường đại học","D. Thiết kế kiến trúc dân dụng"]',
 '{"selected":"B. Vận tải đường biển (Logistics) cho lô hàng điện tử"}',
 'Từ khóa 海运物流 (hǎiyùn wùliú) nghĩa là vận tải logistics đường biển và 电子产品 (diànzǐ chǎnpǐn) là sản phẩm điện tử.',
 '{"max_score":10}', 1),

('ex-zh-write-01', 'lesson-zh-spec-01', 'zh', 'WRITING', 'WRITING_PROMPT', 'HSK 4', 'Luyện viết chuyên ngành: Soạn thông báo gửi chứng từ thông quan bằng chữ Hán',
 'Hãy viết 2-3 câu bằng tiếng Trung sử dụng cấu trúc chữ 把 (把字句) để yêu cầu đối tác gửi vận đơn gốc (正本提单) và phiếu đóng gói (装箱单).',
 '[]',
 '{"required_keywords":["把","提单","装箱单"]}',
 'Bài viết cần có cấu trúc chữ 把 kèm thành phần kết quả (như 寄给我们 hoặc 发过来) và dùng đúng thuật ngữ chuyên ngành.',
 '{"criteria":["Đúng cấu trúc ngữ pháp chữ 把 (40%)","Chính xác thuật ngữ chuyên ngành (40%)","Mạch lạc và lịch sự (20%)"]}', 1),

('ex-en-read-01', 'lesson-en-01', 'en', 'READING', 'MULTIPLE_CHOICE', 'CEFR B2', 'Đọc hiểu học thuật: Nhận diện chức năng của Epistemic Hedging',
 'Đọc câu sau: "Empirical observations suggest that spaced repetition intervals may substantially mitigate lexical attrition." — Từ ngữ nào đóng vai trò là công cụ Hedging giúp câu văn khách quan học thuật?',
 '["A. Empirical observations","B. suggest that / may","C. spaced repetition intervals","D. lexical attrition"]',
 '{"selected":"B. suggest that / may"}',
 'Động từ "suggest that" và động từ khuyết thiếu "may" giúp người viết trình bày kết luận dựa trên bằng chứng một cách thận trọng khoa học.',
 '{"max_score":10}', 1),

('ex-en-speak-01', 'lesson-en-spec-01', 'en', 'SPEAKING', 'PRONUNCIATION', 'CEFR B2', 'Luyện phát âm & Trọng âm câu tiếng Anh chuyên ngành CNTT',
 'Hãy đọc chuẩn xác câu báo cáo kỹ thuật sau để hệ thống đánh giá âm vị và trọng âm: "We enforced idempotency keys and parameterized queries at the edge."',
 '[]',
 '{"target_phrase":"We enforced idempotency keys and parameterized queries at the edge."}',
 'Chú ý trọng âm từ idempotency (/ˌaɪ.dɛmˈpoʊ.tən.si/) và parameterized (/pəˈræm.ɪ.tə.raɪzd/).',
 '{"phoneme_weight":0.5,"stress_weight":0.5}', 1),

('ex-ru-gram-01', 'lesson-ru-01', 'ru', 'GRAMMAR', 'MULTIPLE_CHOICE', 'ТЭУ (A1)', 'Luyện tập Ngữ pháp Tiếng Nga: Chia danh từ và tính từ ở Cách 4 (Винительный падеж)',
 'Chọn dạng đúng để hoàn thành câu: "Каждый вечер студент читает __________." (nguyên thể: интересная русская книга)',
 '["A. интересная русская книга","B. интересную русскую книгу","C. интересной русской книги","D. интересным русским книгам"]',
 '{"selected":"B. интересную русскую книгу"}',
 'Động từ читать đòi hỏi tân ngữ trực tiếp ở Cách 4 (Винительный падеж). Danh từ giống cái книга đổi đuôi -а thành -у (книгу), tính từ giống cái đổi -ая thành -ую (интересную русскую).',
 '{"max_score":10}', 1);

-- 8. Question Bank & Standardized Exams (Strictly NO Certificates)
INSERT OR IGNORE INTO question_bank
(id, language_code, skill_type, level_code, question_type, stem_text, choices_json, answer_key_json, points, difficulty, status)
VALUES
('qb-zh-01', 'zh', 'LEXIS_GRAMMAR', 'HSK 3', 'SINGLE_CHOICE', 'Chọn câu sử dụng đúng cấu trúc câu chữ 把 (把字句):',
 '["A. 我把那本书看完了。","B. 我把那本书看。","C. 我不把那本书看完。","D. 我把知道这件事。"]',
 '{"correct":"A. 我把那本书看完了。","explanation":"Câu chữ 把 cần có thành phần bổ ngữ kết quả (完了) phía sau động từ và từ phủ định phải đứng trước chữ 把."}', 25, 0.4, 'ACTIVE'),
('qb-zh-02', 'zh', 'READING', 'HSK 4', 'SINGLE_CHOICE', 'Trong thương mại quốc tế, chứng từ nào dùng để kê khai chi tiết quy cách đóng gói, số lượng và trọng lượng từng kiện hàng?',
 '["A. 装箱单 (Packing List)","B. 登机牌 (Boarding Pass)","C. 借书证 (Library Card)","D. 菜单 (Menu)"]',
 '{"correct":"A. 装箱单 (Packing List)","explanation":"装箱单 là phiếu đóng gói hàng hóa trong bộ chứng từ xuất nhập khẩu."}', 25, 0.5, 'ACTIVE'),
('qb-zh-03', 'zh', 'LISTENING', 'HSK 3', 'SINGLE_CHOICE', 'Khi nghe câu "这批货物已经顺利办完清关手续了", trạng thái của lô hàng là gì?',
 '["A. Đã hoàn tất thủ tục thông quan thuận lợi","B. Đang bị giữ lại tại kho ngoại quan","C. Chưa được đóng gói tại nhà máy","D. Đã bị hủy đơn đặt hàng"]',
 '{"correct":"A. Đã hoàn tất thủ tục thông quan thuận lợi","explanation":"顺利办完清关手续 nghĩa là hoàn tất thuận lợi thủ tục thông quan."}', 25, 0.4, 'ACTIVE'),
('qb-zh-04', 'zh', 'WRITING', 'HSK 4', 'SINGLE_CHOICE', 'Sắp xếp các cụm từ sau thành câu hoàn chỉnh: [1] 沟通不同文化 [2] 语言 [3] 的重要桥梁 [4] 是',
 '["A. [2][4][1][3] (语言是沟通不同文化的重要桥梁)","B. [1][4][2][3]","C. [3][4][2][1]","D. [2][1][4][3]"]',
 '{"correct":"A. [2][4][1][3] (语言是沟通不同文化的重要桥梁)","explanation":"Trật tự định ngữ tiếng Trung: Định ngữ (沟通不同文化) + 的 + Trung tâm ngữ (重要桥梁)."}', 25, 0.5, 'ACTIVE'),

('qb-en-01', 'en', 'LEXIS_GRAMMAR', 'CEFR B2', 'SINGLE_CHOICE', 'Choose the most academically appropriate sentence to complete the research report:',
 '["A. Preliminary telemetry data suggest that edge caching may reduce p99 latency by up to 35%.","B. Edge caching definitely fixes all latency problems forever.","C. Had the cache been enabled, latency will drop tomorrow.","D. The data is corroborating with the server."]',
 '{"correct":"A. Preliminary telemetry data suggest that edge caching may reduce p99 latency by up to 35%.","explanation":"Uses plural verb with data and appropriate epistemic hedging (suggest, may)."}', 25, 0.5, 'ACTIVE'),
('qb-en-02', 'en', 'READING', 'CEFR B2', 'SINGLE_CHOICE', 'In software engineering and API design, what does an "idempotent" operation guarantee?',
 '["A. Executing the same request multiple times produces the same state as executing it once.","B. The request bypasses authentication and RBAC checks.","C. The database table is dropped and recreated on every request.","D. The response is always compressed as an image."]',
 '{"correct":"A. Executing the same request multiple times produces the same state as executing it once.","explanation":"Idempotency prevents duplicate side effects during network retries."}', 25, 0.5, 'ACTIVE'),
('qb-en-03', 'en', 'LISTENING', 'CEFR B2', 'SINGLE_CHOICE', 'Transcript: "Had the preventive maintenance schedule been followed, the turbine bearing failure would have been avoided." — What actually happened?',
 '["A. The preventive maintenance schedule was not followed, and the bearing failed.","B. The maintenance was completed early and the turbine worked smoothly.","C. The turbine was replaced before installation.","D. The engineers cancelled the inspection because the bearing was new."]',
 '{"correct":"A. The preventive maintenance schedule was not followed, and the bearing failed.","explanation":"Inverted third conditional expresses a counterfactual past situation."}', 25, 0.6, 'ACTIVE'),
('qb-en-04', 'en', 'WRITING', 'CEFR C1', 'SINGLE_CHOICE', 'Which transition best signals a contrastive concession in formal academic writing?',
 '["A. Notwithstanding the initial calibration overhead, the model achieved superior precision.","B. Because of the overhead, so the model achieved precision.","C. Plus, the model was really good anyway.","D. Despite of the calibration overhead, it worked."]',
 '{"correct":"A. Notwithstanding the initial calibration overhead, the model achieved superior precision.","explanation":"Notwithstanding + noun phrase is a formal academic concession structure."}', 25, 0.6, 'ACTIVE'),

('qb-ru-01', 'ru', 'LEXIS_GRAMMAR', 'ТЭУ (A1)', 'SINGLE_CHOICE', 'Выберите правильную форму слова (Cách 4 - Винительный падеж): «Антон каждый день слушает __________ и читает __________».',
 '["A. русскую музыку / новый журнал","B. русская музыка / нового журнала","C. русской музыке / новому журналу","D. русской музыкой / новым журналом"]',
 '{"correct":"A. русскую музыку / новый журнал","explanation":"Музыка (giống cái) đổi sang Cách 4 thành русскую музыку; журнал (giống đực bất động vật) giữ nguyên новый журнал."}', 25, 0.4, 'ACTIVE'),
('qb-ru-02', 'ru', 'READING', 'ТБУ (A2)', 'SINGLE_CHOICE', 'Прочитайте текст: «Вчера вечером Анна долго готовилась к экзамену в библиотеке, потому что она хочет свободно говорить по-русски». — Где занималась Анна?',
 '["A. В библиотеке (Tại thư viện)","B. На стадионе (Tại sân vận động)","C. В аэропорту (Tại sân bay)","D. В магазине (Tại cửa hàng)"]',
 '{"correct":"A. В библиотеке (Tại thư viện)","explanation":"В библиотеке là Cách 6 (Предложный падеж) chỉ địa điểm tại thư viện."}', 25, 0.4, 'ACTIVE'),
('qb-ru-03', 'ru', 'LISTENING', 'ТЭУ (A1)', 'SINGLE_CHOICE', 'В слове «молоко́» ударение падает на последний слог. Как произносятся первые две буквы «о»?',
 '["A. Произносятся редуцированно, близко к звуку [а] ([малако́])","B. Чётко произносятся как ударный звук [о]","C. Не произносятся вообще","D. Произносятся как согласный звук"]',
 '{"correct":"A. Произносятся редуцированно, близко к звуку [а] ([малако́])","explanation":"Hiện tượng Аканье (biến âm о không trọng âm thành âm gần [a]) trong ngữ âm tiếng Nga chuẩn."}', 25, 0.4, 'ACTIVE'),
('qb-ru-04', 'ru', 'WRITING', 'ТБУ (A2)', 'SINGLE_CHOICE', 'Какое предложение построено грамматически правильно в официальном стиле?',
 '["A. Здравствуйте, уважаемый преподаватель! Разрешите задать Вам вопрос по грамматике.","B. Привет преподаватель, я хочу спросить ты вопрос.","C. Здравствуйте, уважаемая преподаватель, я изучаю русский языку.","D. Скажи мне быстрый ответ про падежи."]',
 '{"correct":"A. Здравствуйте, уважаемый преподаватель! Разрешите задать Вам вопрос по грамматике.","explanation":"Sử dụng đúng thức mệnh lệnh lịch sự (Здравствуйте, Разрешите) và đại từ Cách 3 (Вам)."}', 25, 0.5, 'ACTIVE');

INSERT OR IGNORE INTO exams
(id, language_code, code, title_vi, standard_ref, level_code, duration_minutes, passing_score_percent, question_ids_json, sections_json, status)
VALUES
('exam-zh-hsk34', 'zh', 'WB-EXAM-ZH-01', 'Bài Đánh Giá Năng Lực Tiếng Trung Tổng Quát & Chuyên Ngành (Tham chiếu HSK 3–4)', 'HSK 3-4 Standard Assessment (No Certificate Issued)', 'HSK 3-4', 40, 65.0,
 '["qb-zh-01","qb-zh-02","qb-zh-03","qb-zh-04"]',
 '[{"name":"Nghe hiểu","weight":25},{"name":"Đọc hiểu","weight":25},{"name":"Từ vựng - Ngữ pháp","weight":25},{"name":"Viết cấu trúc","weight":25}]', 'PUBLISHED'),
('exam-en-b2', 'en', 'WB-EXAM-EN-01', 'Bài Đánh Giá Năng Lực Tiếng Anh Học Thuật & Chuyên Ngành (Tham chiếu CEFR B2)', 'CEFR B2 Diagnostic Assessment (No Certificate Issued)', 'CEFR B2', 45, 65.0,
 '["qb-en-01","qb-en-02","qb-en-03","qb-en-04"]',
 '[{"name":"Listening","weight":25},{"name":"Reading","weight":25},{"name":"Lexis & Grammar","weight":25},{"name":"Academic Writing","weight":25}]', 'PUBLISHED'),
('exam-ru-trki1', 'ru', 'WB-EXAM-RU-01', 'Bài Đánh Giá Năng Lực Tiếng Nga Tổng Quát (Tham chiếu ТЭУ – ТБУ / TORFL)', 'TORFL / ТРКИ Diagnostic Assessment (5 Subtests - No Certificate Issued)', 'ТЭУ - ТБУ', 45, 66.0,
 '["qb-ru-01","qb-ru-02","qb-ru-03","qb-ru-04"]',
 '[{"name":"Лексика и Грамматика","weight":25},{"name":"Чтение","weight":25},{"name":"Аудирование","weight":25},{"name":"Письмо","weight":25}]', 'PUBLISHED');

-- 9. Seed 15-System Domain Data (System 3, System 6, System 9, System 11)
INSERT OR IGNORE INTO li_knowledge_domain_nodes
(id, domain_code, domain_name_vi, concept_key, term_zh, pinyin_zh, term_en, ipa_en, explanation_vi, task_scenario_json)
VALUES
('k2l-01', 'LOGISTICS', 'Logistics & Xuất nhập khẩu', 'bill_of_lading', '海运提单', 'hǎiyùn tídān', 'Bill of Lading (B/L)', '/bɪl əv ˈleɪ.dɪŋ/', 'Chứng từ vận tải đường biển xác nhận hợp đồng chuyên chở và quyền sở hữu hàng hóa.', '{"task":"Kiểm tra thông tin Consignee và Notify Party trên vận đơn trước khi phát hành lệnh giao hàng (D/O)."}'),
('k2l-02', 'IT_CLOUD', 'Công nghệ thông tin & Điện toán đám mây', 'prepared_statement', '参数化查询 / 预编译语句', 'cānshùhuà cháxún', 'Parameterized Query / Prepared Statement', '/pəˈræm.ɪ.tə.raɪzd ˈkwɪə.ri/', 'Cơ chế tách biệt cấu trúc lệnh SQL và dữ liệu tham số đầu vào nhằm triệt tiêu lỗ hổng SQL Injection.', '{"task":"Rà soát toàn bộ truy vấn Cloudflare D1 để bảo đảm 100% sử dụng .prepare(sql).bind(...params)."}'),
('k2l-03', 'MECHANICAL_AUTO', 'Kỹ thuật Cơ khí & Công nghệ Ô tô', 'torque_calibration', '扭矩校准', 'niǔjǔ jiàozhǔn', 'Torque Calibration', '/tɔːk ˌkæl.ɪˈbreɪ.ʃən/', 'Quy trình hiệu chuẩn lực siết mô-men xoắn trên dây chuyền lắp ráp cơ khí và động cơ ô tô.', '{"task":"Đọc bảng thông số lực siết tiêu chuẩn (N·m) và lập biên bản kiểm tra kỹ thuật bằng tiếng Trung hoặc tiếng Anh."}'),
('k2l-04', 'HEALTHCARE_NURSING', 'Điều dưỡng & Y dược', 'vital_signs_monitoring', '生命体征监测', 'shēngmìng tǐzhēng jiāncè', 'Vital Signs Monitoring', '/ˈvaɪ.təl saɪnz ˈmɒn.ɪ.tər.ɪŋ/', 'Theo dõi các chỉ số sinh tồn của bệnh nhân gồm nhịp tim, huyết áp, nhịp thở và thân nhiệt.', '{"task":"Ghi nhận và bàn giao ca trực điều dưỡng bằng thuật ngữ tiếng Anh/tiếng Trung chuẩn xác."}');

INSERT OR IGNORE INTO li_meaning_equivalences
(id, concept_slug, expression_zh, expression_en, expression_ru, register_level, semantic_divergence_vi, pragmatic_notes_json)
VALUES
('mee-01', 'verify-compliance', '核实合规性 (héshí héguīxìng)', 'Verify regulatory compliance', 'Проверить соответствие требованиям (proveritʼ sootvetstviye trebovaniyam)', 'FORMAL', 'Cả ba cụm từ đều mang sắc thái trang trọng dùng trong kiểm toán, kỹ thuật và pháp chế; tiếng Nga dùng danh từ Cách 4 + Cách 3 (требованиям).', '{"zh":"Thường đi với cấu trúc 严格核实","en":"Dùng trong báo cáo kiểm toán và kỹ thuật","ru":"Đòi hỏi danh từ đứng sau соответствие chia ở Cách 3 (Дательный падеж)"}'),
('mee-02', 'request-clarification', '烦请进一步说明 (fánqǐng jìnyībù shuōmíng)', 'Could you kindly elaborate on...', 'Не могли бы Вы уточнить... (Ne mogli by Vy utochnitʼ...)', 'FORMAL', 'Cách diễn đạt lịch sự khi yêu cầu đối tác hoặc giảng viên giải thích rõ hơn một điểm chưa rõ.', '{"zh":"烦请 trang trọng hơn 请","en":"Elaborate on nhấn mạnh bổ sung chi tiết","ru":"Cấu trúc phủ định giả định Не могли бы Вы tạo sắc thái tôn trọng cao"}');

INSERT OR IGNORE INTO li_knowledge_graph_edges
(id, node_id, label_vi, node_zh, node_en, node_ru, relation_type, linked_node_id, contrastive_note_vi)
VALUES
('mkg-01', 'aspect-completion', 'Biểu thị hành động hoàn tất', 'Động từ + 了 / 完 (Ví dụ: 看完了)', 'Present Perfect / Past Simple (have read / finished reading)', 'Thể hoàn thành СВ (Совершенный вид: прочитать)', 'STRUCTURAL_CONTRAST', 'aspect-ongoing', 'Tiếng Trung dùng trợ từ động thái 了 hoặc bổ ngữ kết quả 完; tiếng Anh dùng hệ thống Thì-Thể (Have + V3); tiếng Nga biến đổi tiền tố/hậu tố động từ (читать -> прочитать).'),
('mkg-02', 'polite-address', 'Đại từ xưng hô lịch sự ngôi thứ hai', '您 (nín) phân biệt với 你 (nǐ)', 'You (kèm modal verbs: Could you / Would you)', 'Вы (Vy) phân biệt với ты (ty)', 'PREREQUISITE', 'register-formal', 'Tiếng Trung và tiếng Nga phân biệt trực tiếp bằng đại từ nhân xưng (您 / Вы), trong khi tiếng Anh giữ nguyên đại từ "you" và chuyển tải sự trang trọng qua trợ động từ khuyết thiếu.');

INSERT OR IGNORE INTO li_context_reconstructions
(id, language_code, fragment_text, missing_context_clues_json, expected_register, expected_speaker_intent, reconstructed_exemplar, explanation_vi)
VALUES
('ctx-zh-01', 'zh', '“……提单号已经核对无误，请贵司安排目的港清关。”', '["Văn bản thương mại","Từ khóa 贵司 (Quý công ty) và 目的港清关 (Thông quan cảng đích)"]', 'FORMAL', 'Thông báo xác nhận chứng từ vận tải và đề nghị đối tác nhận hàng làm thủ tục hải quan', '尊敬的客户：您好！关于本批次机电设备，海运提单号已经核对无误，请贵司安排目的港清关。', 'Từ 贵司 và thuật ngữ 清关 cho thấy đây là email giao dịch B2B giữa đơn vị xuất khẩu/forwarder và doanh nghiệp nhập khẩu.'),
('ctx-en-01', 'en', '"...root cause was traced to an unindexed foreign key during the migration rollout."', '["Technical engineering register","Passive voice","Terms: root cause, unindexed foreign key, migration rollout"]', 'TECHNICAL', 'Báo cáo nguyên nhân kỹ thuật trong cuộc họp hoặc tài liệu Incident Postmortem', 'During the postmortem review, the root cause was traced to an unindexed foreign key during the migration rollout.', 'Ngôn ngữ khách quan, không đổ lỗi cá nhân, điển hình của báo cáo SRE/DevOps.'),
('ctx-ru-01', 'ru', '«...Разрешите представить Вам результаты нашего исследования по фонетике.»', '["Thức mệnh lệnh lịch sự Разрешите","Đại từ viết hoa Вам","Thuật ngữ học thuật исследования"]', 'ACADEMIC', 'Mở đầu bài thuyết trình học thuật hoặc bảo vệ chuyên đề trước hội đồng giảng viên', 'Уважаемые коллеги и преподаватели! Разрешите представить Вам результаты нашего исследования по фонетике.', 'Cấu trúc Разрешите + инфинитив + Вам là chuẩn mực văn phong học thuật trang trọng trong tiếng Nga.');

-- 10. Platform Configurations
INSERT OR IGNORE INTO platform_configurations (config_key, config_value_json, description_vi) VALUES
('brand.identity', '{"name":"WORD BRIDGE","tagline":"Where Languages Bring People Together.","domain":"https://www.wordbridge.vn","pdf_reader_url":"https://reader.wordbridge.vn","official_logo_svg_status":"MISSING_OFFICIAL_INPUT_USING_FALLBACK_SLOT","colors":{"deep_teal":"#146466","vermilion_red":"#C92F1C","aqua":"#5AABA9","warm_ivory":"#E2E2C4"}}', 'Nhận diện thương hiệu và bảng màu chuẩn WORD BRIDGE'),
('language.scope', '{"supported":["zh","en","ru"],"general":["zh","en","ru"],"specialized":["zh","en"],"excluded":["ja","ko"],"admin_ui_language":"vi"}', 'Phạm vi 3 ngôn ngữ bắt buộc và ngôn ngữ quản trị tiếng Việt'),
('prohibited.features', '{"certificates":false,"social_network":false,"learner_meet_chat":false,"learner_meet_recording":false,"learner_meet_screenshare":false,"organization_accounts":false}', 'Các tính năng tuyệt đối không xây dựng theo quy định sản phẩm'),
('subscription.student_policy', '{"plan":"PERSONAL_PLUS","free_months":3,"one_time_only":true,"verification_method":"EDU_EMAIL_LINK_ONLY","accept_student_id_card":false,"fallback_plan":"PERSONAL_FREE"}', 'Chính sách hỗ trợ sinh viên 03 tháng Personal Plus miễn phí một lần duy nhất qua email trường cấp');
