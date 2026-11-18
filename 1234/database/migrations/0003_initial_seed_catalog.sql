-- =============================================================================
-- Migration: 0003_initial_seed_catalog.sql
-- Project: WORD BRIDGE (https://www.wordbridge.vn/)
-- Purpose: Initial foundational reference data for 3 languages (zh, en, ru),
--          9 RBAC roles, permissions, 15 Language Intelligence system definitions,
--          initial courses/lessons, dictionary entries, exercises, and exams.
--          Uses INSERT OR IGNORE to preserve any existing records in D1 `word`.
-- =============================================================================

PRAGMA foreign_keys = ON;

INSERT OR IGNORE INTO schema_migrations (version, name, checksum) VALUES
('0001', '0001_initial_schema.sql', 'sha256:wb-0001-initial-schema'),
('0002', '0002_language_intelligence_15_systems.sql', 'sha256:wb-0002-li-15-systems'),
('0003', '0003_initial_seed_catalog.sql', 'sha256:wb-0003-seed-catalog');

-- 1. Three Official Target Languages (Chinese, English, Russian ONLY)
INSERT OR IGNORE INTO languages (code, name_vi, native_name, supports_general, supports_specialized, proficiency_framework, is_active) VALUES
('zh', 'Tiếng Trung', '中文 (普通话)', 1, 1, 'HSK 1–6 & HSK 7–9 (Tham chiếu CEFR A1–C2)', 1),
('en', 'Tiếng Anh', 'English', 1, 1, 'CEFR A1–C2 (Tham chiếu IELTS / TOEFL / Cambridge)', 1),
('ru', 'Tiếng Nga', 'Русский язык', 1, 0, 'TORFL / ТРКИ (ТЭУ, ТБУ, ТРКИ-I đến ТРКИ-IV)', 1);

-- 2. RBAC Roles (9 Admin Roles + Learner/Instructor)
INSERT OR IGNORE INTO roles (code, name_vi, description_vi, is_admin_role) VALUES
('SUPER_ADMIN', 'Super Admin', 'Toàn quyền quản trị tối cao trên toàn bộ nền tảng WORD BRIDGE, phê duyệt phân quyền RBAC và cấu hình lõi.', 1),
('PLATFORM_ADMIN', 'Quản trị nền tảng', 'Quản lý cấu hình hệ thống, ngôn ngữ, tài khoản và vận hành tổng thể nền tảng.', 1),
('ACADEMIC_ADMIN', 'Quản trị học thuật', 'Quản lý chương trình học, giáo trình, khóa học, lộ trình và học liệu chuyên môn.', 1),
('CONTENT_EDITOR', 'Biên tập viên', 'Soạn thảo, cập nhật bài học, từ điển, ngữ pháp và bài tập tương tác.', 1),
('MODERATOR', 'Kiểm duyệt viên', 'Rà soát chất lượng nội dung bài học, học liệu và giám sát vận hành phiên Learner Meet.', 1),
('EXAM_ADMIN', 'Quản trị khảo thí', 'Quản lý ngân hàng câu hỏi, cấu trúc đề thi, chấm điểm và phân tích năng lực khảo thí.', 1),
('DATA_ADMIN', 'Quản trị dữ liệu', 'Quản lý cơ sở dữ liệu Cloudflare D1, kho lưu trữ R2, sao lưu phục hồi và trí tuệ ngôn ngữ.', 1),
('SECURITY_ADMIN', 'Quản trị bảo mật', 'Giám sát nhật ký bảo mật, kiểm toán RBAC, phiên đăng nhập và xử lý yêu cầu quyền riêng tư.', 1),
('SUPPORT_ADMIN', 'Quản trị hỗ trợ', 'Xử lý yêu cầu hỗ trợ học viên, xác minh chính sách sinh viên và phản hồi CSKH.', 1),
('INSTRUCTOR', 'Người hướng dẫn', 'Hướng dẫn học thuật và điều phối phiên thực hành Learner Meet.', 0),
('LEARNER', 'Người học', 'Tài khoản học viên cá nhân học tập, tra cứu từ điển, luyện tập và khảo thí.', 0);

-- 3. Core Permissions
INSERT OR IGNORE INTO permissions (code, module_vi, description_vi) VALUES
('admin.dashboard.view', 'Dashboard', 'Xem bảng điều khiển quản trị tổng thể'),
('admin.accounts.manage', 'Tài khoản', 'Quản lý tài khoản cá nhân và trạng thái xác minh'),
('admin.rbac.manage', 'RBAC', 'Cấp phát và thu hồi vai trò quản trị có kiểm toán'),
('admin.languages.manage', 'Quản lý ngôn ngữ', 'Quản lý cấu hình 3 ngôn ngữ Trung - Anh - Nga'),
('admin.platform.config', 'Cấu hình nền tảng', 'Quản lý cấu hình hệ thống và gói dịch vụ'),
('admin.academic.manage', 'Quản trị học thuật', 'Quản lý chương trình, giáo trình, khóa học, bài học và lộ trình'),
('admin.dictionary.manage', 'Từ điển & Ngữ pháp', 'Biên tập từ điển, thuật ngữ chuyên ngành và ngữ pháp'),
('admin.practice.manage', 'Luyện tập', 'Quản lý bài tập bốn kỹ năng và tình huống tương tác'),
('admin.exam.manage', 'Khảo thí', 'Quản lý ngân hàng câu hỏi, đề thi và kết quả đánh giá năng lực'),
('admin.meet.manage', 'Vận hành Learner Meet', 'Giám sát metadata vận hành phiên Learner Meet'),
('admin.intelligence.manage', 'Trí tuệ ngôn ngữ', 'Quản lý và giám sát 15 hệ thống trí tuệ ngôn ngữ'),
('admin.security.audit', 'Bảo mật và kiểm toán', 'Xem nhật ký bảo mật, kiểm toán phân quyền và phiên đăng nhập'),
('admin.infrastructure.manage', 'Hạ tầng và dữ liệu', 'Quản lý kết nối Cloudflare D1, R2, email adapter và backup');

-- Map all permissions to SUPER_ADMIN
INSERT OR IGNORE INTO role_permissions (role_code, permission_code)
SELECT 'SUPER_ADMIN', code FROM permissions;

-- 4. Seed 15 Differentiating Language Intelligence Systems
INSERT OR IGNORE INTO language_intelligence_systems
(system_number, system_slug, name_en, name_vi, objective_vi, target_audience_vi, input_schema_json, output_schema_json, algorithm_method, privacy_rule_vi, requires_external_ai_adapter, is_enabled)
VALUES
(1, 'language-dna', 'Language DNA', 'Bản đồ năng lực ngôn ngữ nhiều chiều', 'Phân rã năng lực ngôn ngữ của người học thành 6 trục định lượng: Từ vựng, Ngữ pháp, Ngữ âm, Ngữ dụng, Độ trôi chảy và Độ hiểu sâu.', 'Người học Trung – Anh – Nga ở mọi cấp độ', '{"submissions":"array","exam_scores":"array","vocab_retention":"number"}', '{"axes":["lexical","grammatical","phonetic","pragmatic","fluency","comprehension"],"radar_vector":"object"}', 'Weighted Multi-Axis Bayesian Competence Aggregation', 'Chỉ tính toán trên dữ liệu bài tập và khảo thí của chính chủ tài khoản; không chia sẻ công khai.', 0, 1),
(2, 'language-transfer-lab', 'Language Transfer Lab', 'Phân tích chuyển giao và giao thoa ngôn ngữ', 'Phát hiện giao thoa tiêu cực (Negative Transfer) và chuyển giao tích cực giữa tiếng Việt và ba ngôn ngữ Trung – Anh – Nga.', 'Người học gặp lỗi cấu trúc câu do thói quen dịch từng từ từ tiếng mẹ đẻ', '{"source_lang":"string","target_lang":"string","sample_text":"string"}', '{"positive_transfers":"array","negative_interferences":"array","transfer_index":"number"}', 'Contrastive Morphosyntactic Pattern Matcher + Optional AI Adapter', 'Chỉ phân tích văn bản bài tập người học gửi lên; không thu thập dữ liệu ngoài luồng.', 0, 1),
(3, 'knowledge-to-language', 'Knowledge-to-Language', 'Học ngôn ngữ thông qua kiến thức và lĩnh vực chuyên môn', 'Chuyển hóa kiến thức chuyên ngành (Cơ khí, Điện-Điện tử, CNTT, Kinh tế-Du lịch, Ô tô, Thiết kế, Điều dưỡng, Logistics) thành năng lực ngoại ngữ tiếng Trung và tiếng Anh.', 'Sinh viên và người đi làm học tiếng Trung chuyên ngành và tiếng Anh chuyên ngành', '{"language_code":"zh|en","domain_code":"string"}', '{"concept_nodes":"array","bilingual_terms":"array","task_drills":"array"}', 'Content-and-Language Integrated Learning (CLIL) Concept Graph Mapping', 'Chỉ áp dụng cho tiếng Trung và tiếng Anh; tuân thủ quy tắc không mở chuyên ngành tiếng Nga.', 0, 1),
(4, 'real-world-language-simulator', 'Real-World Language Simulator', 'Mô phỏng tình huống thực tế nhiều bước', 'Đặt người học vào chuỗi tình huống giao tiếp thực tế nhiều bước rẽ nhánh có chấm điểm ngữ dụng.', 'Người học luyện phản xạ giao tiếp và xử lý tình huống công việc/đời sống', '{"scenario_code":"string","step_choice":"string","utterance":"string"}', '{"next_step":"number","pragmatic_score":"number","branch_feedback":"string"}', 'Deterministic Finite-State Branching Dialogue Evaluator', 'Trạng thái phiên mô phỏng thuộc quyền sở hữu riêng của từng tài khoản cá nhân.', 0, 1),
(5, 'language-error-genome', 'Language Error Genome', 'Phân tích nguyên nhân gốc của lỗi ngôn ngữ lặp lại', 'Phân loại mã gen lỗi (thanh điệu tiếng Trung, cách/thể động từ tiếng Nga, mạo từ/thì tiếng Anh) và truy tìm nguyên nhân gốc.', 'Người học mắc lỗi lặp đi lặp lại trong bài tập viết và ngữ pháp', '{"account_id":"string","language_code":"string","submission_text":"string"}', '{"error_genes":"array","root_causes":"array","remediation_drills":"array"}', 'Recurring Error Pattern Clustering & Etiology Classification', 'Chỉ người sở hữu tài khoản mới có quyền xem hồ sơ mã gen lỗi của mình.', 0, 1),
(6, 'meaning-equivalence-engine', 'Meaning Equivalence Engine', 'Phân tích ý nghĩa, sắc thái và ngữ cảnh', 'Đối chiếu sự tương đương và độ lệch sắc thái biểu đạt giữa tiếng Trung, tiếng Anh, tiếng Nga và tiếng Việt theo văn phong.', 'Người học trung – cao cấp và người học dịch thuật, viết học thuật', '{"concept_query":"string","register":"string"}', '{"equivalences":"object","semantic_divergence":"string","pragmatic_warnings":"array"}', 'Cross-Lingual Semantic Register & Nuance Matrix', 'Tra cứu an toàn, không lưu vết truy vấn cá nhân cho mục đích quảng cáo.', 0, 1),
(7, 'language-timeline', 'Language Timeline', 'Theo dõi tiến trình năng lực theo thời gian', 'Xây dựng trục thời gian năng lực dọc (Longitudinal Trajectory) giúp đối chiếu sự tiến bộ qua từng tuần và tháng.', 'Mọi người học đã đăng nhập trên WORD BRIDGE', '{"account_id":"string","language_code":"string"}', '{"snapshots":"array","velocity_delta":"number","projected_milestone":"string"}', 'Time-Series Moving Average & Competence Velocity Estimation', 'Dữ liệu lịch sử học tập được bảo vệ theo ownership của tài khoản.', 0, 1),
(8, 'universal-pronunciation-lab', 'Universal Pronunciation Lab', 'Đánh giá phát âm theo từng ngôn ngữ', 'Đánh giá độ chính xác âm vị, thanh điệu Pinyin (tiếng Trung), trọng âm từ/câu (tiếng Anh) và hiện tượng biến âm/trọng âm (tiếng Nga).', 'Người học luyện kỹ năng Speaking và phát âm chuẩn', '{"language_code":"string","target_phrase":"string","spoken_transcript":"string"}', '{"phoneme_accuracy":"number","prosody_tone_score":"number","character_feedback":"array"}', 'Levenshtein Phonetic Alignment & Tone/Stress Rule Analyzer', 'Không lưu trữ bản ghi âm thô lâu dài nếu người học không yêu cầu; tuyệt đối không lấy âm thanh từ Learner Meet.', 0, 1),
(9, 'multi-language-knowledge-graph', 'Multi-Language Knowledge Graph', 'Đồ thị kiến thức Trung – Anh – Nga', 'Liên kết các khái niệm từ vựng và cấu trúc ngữ pháp giữa tiếng Trung, tiếng Anh và tiếng Nga trên cùng một đồ thị.', 'Người học đa ngôn ngữ hoặc học ngoại ngữ thứ 2, thứ 3', '{"node_query":"string"}', '{"nodes":"array","edges":"array","contrastive_notes":"array"}', 'Tri-Lingual Graph Traversal & Structural Contrast Mapping', 'Dữ liệu học thuật chuẩn hóa, minh bạch nguồn tham chiếu.', 0, 1),
(10, 'personal-language-corpus', 'Personal Language Corpus', 'Kho ngữ liệu cá nhân', 'Tập hợp toàn bộ câu viết và bài tập của người học thành kho ngữ liệu cá nhân để thống kê mật độ từ vựng (Lexical Density) và độ đa dạng từ (TTR).', 'Người học muốn theo dõi sự trưởng thành của vốn từ chủ động', '{"account_id":"string","language_code":"string","text":"string"}', '{"token_count":"number","unique_lemmas":"number","type_token_ratio":"number","lexical_density":"number"}', 'Corpus Tokenization, Lemmatization & Type-Token Ratio (TTR) Computation', 'Kho ngữ liệu hoàn toàn riêng tư, chỉ thuộc quyền truy cập của chủ tài khoản.', 0, 1),
(11, 'context-reconstruction', 'Context Reconstruction', 'Tái dựng ngữ cảnh sử dụng', 'Yêu cầu người học suy luận bối cảnh giao tiếp, vai vế người nói và ý đồ ngữ dụng từ một đoạn trích ngôn ngữ.', 'Người học rèn luyện tư duy ngữ cảnh và nghe/đọc hiểu thực tế', '{"language_code":"string","fragment_id":"string","user_hypothesis":"object"}', '{"context_match_score":"number","register_analysis":"string","exemplar":"string"}', 'Pragmatic Clue Verification & Register Matching Algorithm', 'Chỉ lưu điểm kết quả bài luyện vào tiến độ cá nhân.', 0, 1),
(12, 'comprehension-depth-test', 'Comprehension Depth Test', 'Đánh giá mức độ hiểu sâu và suy luận', 'Đo lường 4 tầng đọc/nghe hiểu: Nghĩa bề mặt (Literal), Suy luận (Inferential), Hàm ngôn ngữ dụng (Pragmatic) và Tư duy phản biện (Critical).', 'Người học chuẩn bị khảo thí học thuật và đọc hiểu nâng cao', '{"passage_id":"string","answers":"object"}', '{"literal":"number","inferential":"number","pragmatic":"number","critical":"number","depth_index":"number"}', 'Four-Tier Taxonomic Comprehension Scoring Model', 'Kết quả gắn với tài khoản cá nhân, không công khai bảng xếp hạng.', 0, 1),
(13, 'learning-recovery-system', 'Learning Recovery System', 'Phát hiện kiến thức bị quên và hỗ trợ phục hồi', 'Áp dụng đường cong quên lãng Ebbinghaus để phát hiện từ vựng/ngữ pháp có nguy cơ rơi rụng và tạo lộ trình phục hồi 5 phút.', 'Người học bị gián đoạn việc học hoặc có tỷ lệ sai tăng cao ở kiến thức cũ', '{"account_id":"string","language_code":"string"}', '{"at_risk_items":"array","retention_probability":"number","recovery_micro_plan":"array"}', 'Ebbinghaus Exponential Decay R = exp(-t/S) & Priority Queueing', 'Chỉ xử lý trên lịch sử ôn tập của chính người học.', 0, 1),
(14, 'language-quality-benchmark', 'Language Quality Benchmark', 'Đánh giá độ chính xác, tự nhiên và phù hợp', 'Chấm điểm đoạn văn của người học theo 4 tiêu chí: Độ chính xác ngữ pháp, Độ tự nhiên (Idiomaticity), Độ phù hợp văn phong (Register) và Tính mạch lạc.', 'Người học luyện viết email, báo cáo chuyên ngành và luận học thuật', '{"language_code":"string","submitted_text":"string","target_register":"string"}', '{"grammatical_accuracy":"number","idiomatic_naturalness":"number","register_appropriateness":"number","cohesion_score":"number","composite_benchmark":"number"}', 'Rule-Based Linguistic Heuristic & Register Lexicon Analyzer (+ Optional AI Adapter)', 'Văn bản người dùng gửi lên không bao giờ được dùng để huấn luyện AI.', 0, 1),
(15, 'personal-language-observatory', 'Personal Language Observatory', 'Trung tâm phân tích học tập cá nhân', 'Tổng hợp tín hiệu từ 14 hệ thống trên cùng tiến độ bài học và khảo thí để đưa ra khuyến nghị hành động tiếp theo (Next-Best-Action).', 'Toàn bộ học viên đã đăng nhập trên WORD BRIDGE', '{"account_id":"string","language_code":"string"}', '{"readiness_index":"number","strengths":"array","bottlenecks":"array","next_best_actions":"array"}', 'Multi-Signal Telemetry Synthesis & Decision Tree Recommender', 'Tuân thủ tuyệt đối quyền riêng tư; không dùng dữ liệu Learner Meet.', 0, 1);
