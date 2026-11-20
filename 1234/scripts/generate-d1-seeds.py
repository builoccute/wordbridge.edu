#!/usr/bin/env python3
"""
WORD BRIDGE — Safe D1 Seed Generator (Migrations 0007 & 0008)
Generates:
1. database/migrations/0007_seed_academic_baseline.sql:
   - 3 official languages (zh, en, ru)
   - 9 RBAC roles + granular permissions
   - Baseline programs (Foundation 12 weeks for zh/en/ru + Specialized zh & en)
   - Full 36 weeks (12 weeks x 3 languages) with ALL 20 mandatory fields per week (Section 17-20)
   - Structured sessions & 12-component lessons
   - Core dictionary entries for zh (incl. Logistics terms), en, ru + grammar + question bank + exams
   - Background jobs & platform config
2. database/migrations/0008_seed_specialized_vocab_user_dataset.sql:
   - Parses real specialized English vocabulary from user-uploaded FILE TỪ VỰNG.zip
   - Uses INSERT OR IGNORE (strictly non-destructive)
"""

import io
import json
import os
import re
import zipfile
import openpyxl

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, 'database', 'migrations')
UPLOADED_VOCAB_ZIP = os.environ.get('WB_VOCAB_ZIP', '')


def sql_str(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"


def slugify(text):
    s = re.sub(r'[^a-zA-Z0-9]+', '-', str(text).lower()).strip('-')
    return s[:64] or 'entry'


def generate_0007():
    lines = [
        "-- ============================================================================",
        "-- Migration 0007: Academic Baseline Seed (STRICTLY INSERT OR IGNORE)",
        "-- 3 Official Languages, 9 RBAC Roles, 12-Week Curricula (zh/en/ru),",
        "-- Specialized Programs (zh/en ONLY), Dictionary, Grammar, Practice & Exams",
        "-- ============================================================================",
        "PRAGMA foreign_keys = ON;",
        "",
        "-- 1. Official Languages (ONLY zh, en, ru)",
        "INSERT OR IGNORE INTO wb_languages (code, name_vi, native_name, has_general, has_specialized, proficiency_framework, script_system, phonetic_system) VALUES",
        "  ('zh', 'Tiếng Trung', '中文', 1, 1, 'HSK 1–6 & HSK 7–9', 'Chữ Hán giản thể (và phồn thể theo chương trình)', 'Pinyin, 4 thanh điệu + thanh nhẹ, bộ thủ'),",
        "  ('en', 'Tiếng Anh', 'English', 1, 1, 'CEFR A1–C2 (tham chiếu IELTS, TOEFL, Cambridge)', 'Chữ Latin', 'IPA, trọng âm từ, trọng âm câu, ngữ điệu'),",
        "  ('ru', 'Tiếng Nga', 'Русский язык', 1, 0, 'TORFL / ТРКИ (ТЭУ, ТБУ, ТРКИ-I đến ТРКИ-IV)', 'Bảng chữ cái Cyrillic', 'Trọng âm, biến âm, 6 cách danh từ, cặp thể động từ');",
        "",
        "-- 2. RBAC 9 Roles & Granular Permissions",
        "INSERT OR IGNORE INTO wb_roles (id, code, name_vi, description_vi) VALUES",
        "  ('role_super_admin', 'super_admin', 'Super Admin', 'Toàn quyền quản trị hệ thống, phân quyền và cấu hình lõi.'),",
        "  ('role_platform_admin', 'platform_admin', 'Quản trị nền tảng', 'Quản lý tài khoản, ngôn ngữ, cấu hình vận hành nền tảng.'),",
        "  ('role_academic_admin', 'academic_admin', 'Quản trị học thuật', 'Quản lý chương trình, giáo trình, khóa học, từ điển và chuyên ngành.'),",
        "  ('role_editor', 'editor', 'Biên tập viên', 'Soạn thảo và cập nhật học liệu, bài học, từ vựng và ngữ pháp.'),",
        "  ('role_reviewer', 'reviewer', 'Kiểm duyệt viên', 'Rà soát, hiệu đính và phê duyệt học thuật trước khi phát hành.'),",
        "  ('role_exam_admin', 'exam_admin', 'Quản trị khảo thí', 'Quản lý ngân hàng câu hỏi, đề thi, thang điểm và kết quả khảo thí.'),",
        "  ('role_data_admin', 'data_admin', 'Quản trị dữ liệu', 'Theo dõi D1, R2, sao lưu, phục hồi và tính toàn vẹn dữ liệu.'),",
        "  ('role_security_admin', 'security_admin', 'Quản trị bảo mật', 'Quản lý nhật ký kiểm toán, phiên đăng nhập và cảnh báo bảo mật.'),",
        "  ('role_support_admin', 'support_admin', 'Quản trị hỗ trợ', 'Tiếp nhận và phản hồi yêu cầu CSKH và liên hệ hợp tác.');",
        "",
        "INSERT OR IGNORE INTO wb_permissions (id, code, resource, action, description_vi) VALUES",
        "  ('perm_rbac_manage', 'rbac:manage', 'rbac', 'manage', 'Quản lý vai trò và gán quyền RBAC'),",
        "  ('perm_accounts_view', 'accounts:view', 'accounts', 'view', 'Xem danh sách tài khoản người dùng'),",
        "  ('perm_curriculum_create', 'curriculum:create', 'curriculum', 'create', 'Soạn thảo chương trình, tuần học và bài học'),",
        "  ('perm_curriculum_review', 'curriculum:review', 'curriculum', 'review', 'Rà soát và hiệu đính nội dung học thuật'),",
        "  ('perm_curriculum_publish', 'curriculum:publish', 'curriculum', 'publish', 'Phát hành nội dung học thuật chính thức'),",
        "  ('perm_exam_manage', 'exam:manage', 'examinations', 'manage', 'Quản trị ngân hàng câu hỏi và đề khảo thí'),",
        "  ('perm_infra_manage', 'infrastructure:manage', 'infrastructure', 'manage', 'Quản trị D1, R2 và tác vụ nền tự động'),",
        "  ('perm_audit_view', 'audit:view', 'audit_logs', 'view', 'Xem nhật ký kiểm toán bảo mật'),",
        "  ('perm_support_manage', 'support:manage', 'support', 'manage', 'Xử lý yêu cầu CSKH và liên hệ');",
        "",
        "INSERT OR IGNORE INTO wb_role_permissions (role_id, permission_id) VALUES",
        "  ('role_super_admin', 'perm_rbac_manage'), ('role_super_admin', 'perm_accounts_view'), ('role_super_admin', 'perm_curriculum_create'), ('role_super_admin', 'perm_curriculum_review'), ('role_super_admin', 'perm_curriculum_publish'), ('role_super_admin', 'perm_exam_manage'), ('role_super_admin', 'perm_infra_manage'), ('role_super_admin', 'perm_audit_view'), ('role_super_admin', 'perm_support_manage'),",
        "  ('role_platform_admin', 'perm_accounts_view'), ('role_platform_admin', 'perm_infra_manage'),",
        "  ('role_academic_admin', 'perm_curriculum_create'), ('role_academic_admin', 'perm_curriculum_review'), ('role_academic_admin', 'perm_curriculum_publish'),",
        "  ('role_editor', 'perm_curriculum_create'),",
        "  ('role_reviewer', 'perm_curriculum_review'),",
        "  ('role_exam_admin', 'perm_exam_manage'),",
        "  ('role_data_admin', 'perm_infra_manage'),",
        "  ('role_security_admin', 'perm_audit_view'), ('role_security_admin', 'perm_accounts_view'),",
        "  ('role_support_admin', 'perm_support_manage');",
        "",
        "-- 3. Vocabulary Copyright Sources",
        "INSERT OR IGNORE INTO wb_vocabulary_sources (id, source_name, source_url, owner_org, license_terms, allowed_scope, attribution_text, accessed_date, verification_status) VALUES",
        "  ('src_wb_original', 'WORD BRIDGE Original Academic Lexicon', 'https://www.wordbridge.vn/dictionary', 'WORD BRIDGE Academic Editorial Team', 'Nội dung tự biên soạn nội bộ WORD BRIDGE', 'Toàn nền tảng WORD BRIDGE', 'Biên soạn bởi Ban Học thuật WORD BRIDGE (2026).', '2026-11-19', 'original_word_bridge'),",
        "  ('src_user_specialized', 'WORD BRIDGE Specialized Vocabulary Dataset (User-Provided)', 'https://www.wordbridge.vn/specialized', 'WORD BRIDGE Project Owner', 'Tài nguyên từ vựng chuyên ngành do chủ dự án cung cấp', 'Phân hệ Ngoại ngữ chuyên ngành & Từ điển Tiếng Anh', 'Nguồn dữ liệu từ vựng chuyên ngành WORD BRIDGE (2026).', '2026-11-19', 'verified_open');",
        "",
    ]

    # 4. Programs (Foundation zh/en/ru + Specialized zh/en ONLY)
    programs = [
        ('prg_zh_fnd', 'WB-ZH-FND-01', 'chinese-foundation-hsk1', 'Tiếng Trung Nền tảng (Tham chiếu HSK 1)', 'zh', 'foundation', None, 'Mới bắt đầu', 'Tham chiếu HSK 1', 'Người học Việt Nam bắt đầu từ con số 0', 'Không yêu cầu', 3, 12, 3, 48, 'Xây dựng nền tảng Pinyin, thanh điệu, 150+ từ vựng cốt lõi và giao tiếp cơ bản.', 'Đọc viết Pinyin chuẩn, nhận diện chữ Hán nền tảng, giao tiếp 12 chủ đề đời sống.', '["listening","speaking","reading","writing"]', 'Kiểm tra cuối tuần + Đánh giá tích hợp tuần 12', 'Hoàn thành >= 80% bài học và đạt >= 70% bài đánh giá tuần 12'),
        ('prg_en_fnd', 'WB-EN-FND-01', 'english-foundation-a1', 'Tiếng Anh Nền tảng (Tham chiếu CEFR A1)', 'en', 'foundation', None, 'Mới bắt đầu', 'Tham chiếu CEFR A1', 'Người học cần củng cố phát âm IPA và giao tiếp căn bản', 'Không yêu cầu', 3, 12, 3, 48, 'Làm chủ hệ thống âm IPA, thì hiện tại/quá khứ/tương lai cơ bản và 12 tình huống đời sống.', 'Phát âm rõ âm cuối, giao tiếp chủ đề quen thuộc, viết đoạn ngắn mạch lạc.', '["listening","speaking","reading","writing"]', 'Bài tập 4 kỹ năng hằng tuần + Đánh giá tổng hợp tuần 12', 'Hoàn thành >= 80% buổi học và đạt >= 70% bài đánh giá tổng hợp'),
        ('prg_ru_fnd', 'WB-RU-FND-01', 'russian-foundation-teu', 'Tiếng Nga Nền tảng (Tham chiếu TORFL ТЭУ)', 'ru', 'foundation', None, 'Mới bắt đầu', 'Tham chiếu TORFL ТЭУ', 'Người học tiếng Nga sơ cấp', 'Không yêu cầu', 3, 12, 3, 54, 'Làm chủ bảng chữ cái Cyrillic, trọng âm, biến âm, giống danh từ và các cách nền tảng (1, 4, 6).', 'Đọc đúng trọng âm tiếng Nga, sử dụng chính xác Cách 1/4/6 và hội thoại căn bản.', '["listening","speaking","reading","writing"]', 'Bài kiểm tra tuần + Đánh giá 4 kỹ năng tuần 12', 'Hoàn thành >= 80% buổi học và đạt >= 70% bài đánh giá tuần 12'),
        ('prg_zh_log', 'WB-ZH-SPC-LOG', 'chinese-specialized-logistics', 'Tiếng Trung Chuyên ngành Logistics & Xuất nhập khẩu', 'zh', 'specialized', 'logistics', 'HSK 3+', 'Giao tiếp nghiệp vụ Logistics', 'Nhân sự xuất nhập khẩu, vận tải biển, chuỗi cung ứng', 'Hoàn thành tiếng Trung sơ cấp', 2, 8, 3, 36, 'Làm chủ thuật ngữ vận đơn, khai báo hải quan, chứng từ thương mại và đàm phán đối tác Trung Quốc.', 'Đọc hiểu vận đơn (海运提单), hóa đơn thương mại (商业发票), viết email nghiệp vụ và xử lý tình huống kho vận.', '["listening","speaking","reading","writing"]', 'Tình huống chứng từ thực tế + Viết email nghiệp vụ', 'Hoàn thành bài tập chứng từ và đạt >= 75% đánh giá chuyên ngành'),
        ('prg_en_it', 'WB-EN-SPC-IT', 'english-specialized-it-cloud', 'Tiếng Anh Chuyên ngành CNTT & Cloud', 'en', 'specialized', 'it-cloud', 'CEFR B1', 'Giao tiếp kỹ thuật CNTT B2+', 'Kỹ sư phần mềm, quản trị mạng, Cloud engineer', 'Nền tảng tiếng Anh giao tiếp cơ bản', 2, 8, 3, 36, 'Đọc tài liệu kiến trúc hệ thống, báo cáo sự cố, viết tài liệu kỹ thuật và thuyết trình giải pháp Cloud.', 'Sử dụng chuẩn thuật ngữ mạng/Cloud, viết incident report và trình bày kiến trúc bằng tiếng Anh.', '["listening","speaking","reading","writing"]', 'Đọc tài liệu kỹ thuật + Viết báo cáo sự cố', 'Hoàn thành 100% bài tập tình huống và đạt >= 75% bài kiểm tra chuyên ngành'),
    ]

    for p in programs:
        lines.append(
            "INSERT OR IGNORE INTO wb_programs (id, code, slug, name_vi, language_code, program_type, specialized_domain_slug, entry_level, target_level, target_audience, prerequisites, total_modules, total_weeks, sessions_per_week, estimated_hours, overall_objectives, learning_outcomes, focus_skills_json, assessment_methods, completion_criteria, review_status, author_name, reviewer_name, reference_sources) VALUES ("
            + ", ".join(sql_str(x) if not isinstance(x, int) else str(x) for x in p)
            + ", 'published', 'Ban Biên soạn Học thuật WORD BRIDGE', 'Hội đồng Rà soát Học thuật WORD BRIDGE', 'Khung giáo trình chuẩn WORD BRIDGE V3.0');"
        )

    lines.append("")
    # Levels, Curricula, Courses, Modules for the 3 Foundation Programs
    foundation_meta = [
        ('zh', 'chinese', 'prg_zh_fnd', 'lvl_zh_1', 'hsk-1', 'Sơ cấp (HSK 1)', 'HSK 1', 'cur_zh_1', 'CUR-ZH-FND-2026', 'Giáo trình Tiếng Trung Nền tảng 12 Tuần', 'crs_zh_1', 'chinese-beginner-12-weeks', 'Khóa học Tiếng Trung Nền tảng 12 Tuần', 'mod_zh_1', 'chinese-beginner-module-1', 'Học phần 1: Nền tảng Ngữ âm, Giao tiếp & Đời sống'),
        ('en', 'english', 'prg_en_fnd', 'lvl_en_1', 'cefr-a1', 'Sơ cấp (CEFR A1)', 'CEFR A1', 'cur_en_1', 'CUR-EN-FND-2026', 'Giáo trình Tiếng Anh Nền tảng 12 Tuần', 'crs_en_1', 'english-beginner-12-weeks', 'Khóa học Tiếng Anh Nền tảng 12 Tuần', 'mod_en_1', 'english-beginner-module-1', 'Học phần 1: Nền tảng Phát âm IPA & Giao tiếp Căn bản'),
        ('ru', 'russian', 'prg_ru_fnd', 'lvl_ru_1', 'torfl-teu', 'Sơ cấp (TORFL ТЭУ)', 'TORFL ТЭУ', 'cur_ru_1', 'CUR-RU-FND-2026', 'Giáo trình Tiếng Nga Nền tảng 12 Tuần', 'crs_ru_1', 'russian-beginner-12-weeks', 'Khóa học Tiếng Nga Nền tảng 12 Tuần', 'mod_ru_1', 'russian-beginner-module-1', 'Học phần 1: Bảng chữ cái Cyrillic, Trọng âm & Hệ thống Cách cơ bản'),
    ]

    for lang, lang_slug, prg_id, lvl_id, lvl_slug, lvl_name, fw_ref, cur_id, cur_code, cur_title, crs_id, crs_slug, crs_title, mod_id, mod_slug, mod_title in foundation_meta:
        lines.append(f"INSERT OR IGNORE INTO wb_program_levels (id, program_id, slug, name_vi, framework_ref, sort_order, objectives) VALUES ({sql_str(lvl_id)}, {sql_str(prg_id)}, {sql_str(lvl_slug)}, {sql_str(lvl_name)}, {sql_str(fw_ref)}, 1, 'Hoàn thiện năng lực nền tảng 4 kỹ năng ở mức sơ cấp.');")
        lines.append(f"INSERT OR IGNORE INTO wb_curricula (id, program_id, code, title_vi, version, review_status, academic_approval_note) VALUES ({sql_str(cur_id)}, {sql_str(prg_id)}, {sql_str(cur_code)}, {sql_str(cur_title)}, '1.0.0', 'published', 'Khung giáo trình chuẩn 12 tuần theo đặc tả V3.0.');")
        lines.append(f"INSERT OR IGNORE INTO wb_courses (id, program_id, curriculum_id, level_id, slug, title_vi, language_code, summary_vi, total_weeks, sessions_per_week, review_status) VALUES ({sql_str(crs_id)}, {sql_str(prg_id)}, {sql_str(cur_id)}, {sql_str(lvl_id)}, {sql_str(crs_slug)}, {sql_str(crs_title)}, {sql_str(lang)}, 'Lộ trình 12 tuần cấu trúc đầy đủ 20 thành phần học thuật mỗi tuần, tích hợp 4 kỹ năng và kiểm tra định kỳ.', 12, 3, 'published');")
        lines.append(f"INSERT OR IGNORE INTO wb_modules (id, course_id, slug, title_vi, sort_order, objectives_vi) VALUES ({sql_str(mod_id)}, {sql_str(crs_id)}, {sql_str(mod_slug)}, {sql_str(mod_title)}, 1, 'Nắm vững hệ thống âm vị, từ vựng cốt lõi và cấu trúc câu giao tiếp căn bản.');")

    # 5. Full 12-week curricula for Chinese, English, Russian (Sections 18, 19, 20) with ALL 20 required fields!
    zh_weeks = [
        (1, 'Pinyin và thanh điệu', 'Thanh mẫu, vận mẫu, bốn thanh, thanh nhẹ, chào hỏi', ['你好 (nǐ hǎo)', '谢谢 (xièxie)', '再见 (zàijiàn)'], ['Cấu trúc chào hỏi cơ bản', 'Biến điệu thanh 3 (3+3 → 2+3)'], 'Phân biệt thanh mẫu b/p/m/f, d/t/n/l và 4 thanh điệu + thanh nhẹ'),
        (2, 'Làm quen và giới thiệu', 'Đại từ, tên, quốc tịch, câu giới thiệu', ['我 (wǒ)', '你 (nǐ)', '叫 (jiào)', '越南 (Yuènán)'], ['S + 叫 + Tên', 'S + 是 + Quốc tịch'], 'Ngữ điệu câu giới thiệu và biến điệu 不 (bù)'),
        (3, 'Số đếm và thông tin cá nhân', 'Số, tuổi, số điện thoại, ngày tháng', ['一 đến 十', '岁 (suì)', '电话 (diànhuà)', '月/号'], ['Hỏi tuổi với 几岁 / 多大', 'Đọc số điện thoại (1 đọc là yāo)'], 'Phân biệt âm bật hơi q/ch/c và số đếm liên tiếp'),
        (4, 'Gia đình và quan hệ', 'Từ vựng gia đình, lượng từ cơ bản, sở hữu', ['家 (jiā)', '爸爸 (bàba)', '妈妈 (māma)', '口 (kǒu)'], ['Sở hữu với 的', 'Lượng từ 口, 个'], 'Thanh nhẹ trong từ lặp gia đình (bàba, māma)'),
        (5, 'Trường học và công việc', 'Nghề nghiệp, địa điểm, câu hỏi thông tin', ['学生 (xuésheng)', '老师 (lǎoshī)', '工作 (gōngzuò)', '公司 (gōngsī)'], ['Câu hỏi với 什么, 哪儿', 'Động từ 在 + địa điểm'], 'Âm uốn lưỡi zh/ch/sh/r'),
        (6, 'Thời gian và lịch trình', 'Giờ, ngày, lịch học, trạng từ thời gian', ['点 (diǎn)', '分 (fēn)', '今天 (jīntiān)', '星期 (xīngqī)'], ['Trạng từ thời gian đứng trước động từ', 'Cách nói giờ kém/hơn'], 'Nhịp điệu đọc ngày tháng và khung giờ'),
        (7, 'Ăn uống và mua sắm', 'Món ăn, giá tiền, lượng từ, giao dịch', ['多少钱 (duōshao qián)', '块 (kuài)', '买 (mǎi)', '喝茶 (hē chá)'], ['Hỏi giá với 多少钱', 'Cấu trúc 要 / 想买'], 'Phân biệt thanh 3 trong 买 (mǎi) và thanh 4 trong 卖 (mài)'),
        (8, 'Địa điểm và phương hướng', 'Vị trí, phương tiện, hỏi đường', ['前面 (qiánmiàn)', '左边 (zuǒbiān)', '坐车 (zuò chē)', '怎么走'], ['A 在 B 的 + phương vị từ', 'Hỏi đường với 怎么走'], 'Phát âm vận mẫu mũi -n và -ng'),
        (9, 'Sinh hoạt thường ngày', 'Động từ thường dùng, cấu trúc câu cơ bản', ['起床 (qǐchuáng)', '上班 (shàngbān)', '睡觉 (shuìjiào)'], ['Trật tự câu Thời gian + Địa điểm + Động từ', 'Phó từ 常/每天'], 'Nối âm tự nhiên trong câu kể lịch trình'),
        (10, 'Sở thích và khả năng', '想, 会, 能, 喜欢 và các cấu trúc phù hợp', ['喜欢 (xǐhuan)', '会 (huì)', '能 (néng)', '想 (xiǎng)'], ['Phân biệt động từ năng nguyện 想 / 会 / 能', 'Câu hỏi chính phản'], 'Nhấn trọng âm vào động từ năng nguyện'),
        (11, 'Sức khỏe và nhu cầu', 'Bộ phận cơ thể, triệu chứng cơ bản, lời khuyên', ['身体 (shēntǐ)', '头疼 (tóuténg)', '医生 (yīshēng)', '休息 (xiūxi)'], ['Trợ từ 了 biểu thị thay đổi trạng thái', 'Khuyên nhủ với 应该 / 多'], 'Ngữ điệu quan tâm và hỏi thăm sức khỏe'),
        (12, 'Tổng ôn và đánh giá', 'Bốn kỹ năng, bài tích hợp và đánh giá cuối học phần', ['Ôn tập 150+ từ vựng HSK 1'], ['Hệ thống hóa toàn bộ mẫu câu tuần 1–11'], 'Tổng kiểm tra phát âm thanh điệu và đọc đoạn văn'),
    ]

    en_weeks = [
        (1, 'Alphabet, sound and introduction', 'Bảng chữ cái, âm cơ bản, giới thiệu bản thân', ['hello', 'name', 'introduce', 'nice to meet you'], ['Subject pronouns + Verb to be (am/is/are)', 'Basic greeting patterns'], 'Bảng phiên âm IPA nguyên âm cơ bản và phụ âm đầu'),
        (2, 'Personal information', 'Đại từ, to be, câu hỏi cá nhân', ['nationality', 'occupation', 'email', 'address'], ['Wh-questions (What/Where/Who)', 'Possessive adjectives (my/your/his/her)'], 'Trọng âm từ 2–3 âm tiết và ngữ điệu câu hỏi Wh-'),
        (3, 'Daily life', 'Hiện tại đơn, thói quen, trạng từ tần suất', ['routine', 'usually', 'commute', 'schedule'], ['Present Simple (khẳng định, phủ định, nghi vấn)', 'Adverbs of frequency'], 'Phát âm âm cuối -s/-es (/s/, /z/, /ɪz/)'),
        (4, 'Family and relationships', 'Sở hữu, mô tả người, quan hệ', ['sibling', 'colleague', 'friendly', 'supportive'], ['Possessive case (\'s)', 'Have got / Has'], 'Phân biệt âm /θ/ và /ð/ trong mô tả người thân'),
        (5, 'Time and schedules', 'Giờ, ngày, lịch trình', ['appointment', 'quarter past', 'deadline', 'calendar'], ['Prepositions of time (at/on/in)', 'Telling time'], 'Ngữ điệu liệt kê và đọc giờ chính xác'),
        (6, 'Food and shopping', 'Danh từ đếm được/không đếm được, yêu cầu', ['receipt', 'discount', 'beverage', 'ingredient'], ['Countable & Uncountable nouns', 'Some / Any / How much / How many'], 'Nối âm trong câu yêu cầu lịch sự (Would you like...)'),
        (7, 'Places and directions', 'Giới từ địa điểm, chỉ đường', ['intersection', 'opposite', 'straight ahead', 'landmark'], ['Prepositions of place', 'Imperatives for giving directions'], 'Trọng âm câu khi chỉ đường'),
        (8, 'Past experiences', 'Quá khứ đơn, kể trải nghiệm', ['journey', 'memorable', 'attend', 'discover'], ['Past Simple (regular & irregular verbs)', 'Time markers (yesterday/last week)'], 'Phát âm đuôi -ed (/t/, /d/, /ɪd/)'),
        (9, 'Plans and intentions', 'Tương lai, kế hoạch', ['intention', 'arrange', 'objective', 'upcoming'], ['Be going to vs. Present Continuous for future', 'Will for spontaneous decisions'], 'Dạng rút gọn tự nhiên (going to / \'ll)'),
        (10, 'Health and lifestyle', 'Từ vựng sức khỏe, lời khuyên', ['symptom', 'nutrition', 'exercise', 'recovery'], ['Modal verbs should / shouldn\'t / must', 'Expressing health conditions'], 'Ngữ điệu đưa lời khuyên lịch sự'),
        (11, 'Communication and problem solving', 'Hội thoại tình huống, yêu cầu làm rõ', ['clarify', 'confirm', 'solution', 'feedback'], ['Polite requests (Could you... / Would you mind...)', 'Checking understanding'], 'Ngữ điệu lên giọng ở câu hỏi xác nhận (Yes/No)'),
        (12, 'Integrated assessment', 'Nghe, nói, đọc, viết và đánh giá tổng hợp', ['Ôn tập 300+ từ vựng CEFR A1'], ['Hệ thống hóa ngữ pháp tuần 1–11'], 'Đánh giá phát âm IPA, âm cuối và trọng âm câu'),
    ]

    ru_weeks = [
        (1, 'Cyrillic alphabet', 'Chữ cái, âm, nhận diện chữ', ['привет', 'да', 'нет', 'спасибо'], ['33 chữ cái Cyrillic in và viết tay', 'Phân biệt chữ cái giống hình Latin'], 'Nhận diện âm nguyên âm cứng/mềm cơ bản'),
        (2, 'Pronunciation and stress', 'Trọng âm, nguyên âm giảm âm, đọc từ', ['молоко', 'хорошо', 'город', 'окно'], ['Quy tắc giảm âm nguyên âm о/я/е không nhấn trọng âm'], 'Vô thanh hóa phụ âm cuối (город → [горат])'),
        (3, 'Greetings and introductions', 'Chào hỏi, đại từ và động từ cơ bản', ['здравствуйте', 'меня зовут', 'очень приятно'], ['Đại từ nhân xưng я/ты/он/она/мы/вы/они', 'Cấu trúc Меня зовут...'], 'Ngữ điệu câu chào trang trọng và thân mật'),
        (4, 'Gender and nominative', 'Giống danh từ, tính từ, Cách 1', ['студент', 'книга', 'письмо', 'новый'], ['Phân biệt 3 giống danh từ (đực, cái, trung)', 'Cách 1 (Именительный падеж)'], 'Đọc đuôi tính từ giống đực/cái/trung'),
        (5, 'Numbers and personal data', 'Số, ngày tháng, thông tin cá nhân', ['один–сто', 'год', 'телефон', 'адрес'], ['Số đếm và cách dùng năm/tuổi cơ bản'], 'Trọng âm trong số đếm tiếng Nga'),
        (6, 'Accusative case', 'Cách 4, tân ngữ trực tiếp', ['читать', 'покупать', 'журнал', 'газету'], ['Cách 4 (Винительный падеж) cho danh từ bất động vật và động vật'], 'Đọc rõ đuôi -у/-ю ở Cách 4 giống cái'),
        (7, 'Family and possession', 'Gia đình, sở hữu, cấu trúc câu', ['семья', 'брат', 'сестра', 'у меня есть'], ['Đại từ sở hữu мой/моя/моё', 'Cấu trúc sở hữu У меня есть...'], 'Nối âm giới từ у với đại từ'),
        (8, 'Prepositional case', 'Cách 6, vị trí và địa điểm', ['в университете', 'на работе', 'дом', 'город'], ['Cách 6 (Предложный падеж) với giới từ в / на'], 'Phân biệt phụ âm mềm trước đuôi -е'),
        (9, 'Verbs and aspects', 'Động từ, nguyên thể, giới thiệu thể', ['делать/сделать', 'писать/написать', 'говорить'], ['Chia động từ nhóm I & II', 'Khái niệm cặp thể chưa hoàn thành (НСВ) và hoàn thành (СВ)'], 'Chuyển dịch trọng âm khi chia động từ'),
        (10, 'Daily routine', 'Hoạt động hằng ngày, thời gian', ['утром', 'днём', 'вечером', 'работать'], ['Trạng từ chỉ buổi trong ngày', 'Thì hiện tại & quá khứ cơ bản'], 'Ngữ điệu câu trần thuật (ИК-1) và câu hỏi (ИК-3)'),
        (11, 'Communication scenarios', 'Mua sắm, hỏi đường, giao tiếp', ['сколько стоит', 'извините', 'где находится', 'пожалуйста'], ['Mẫu câu hỏi giá, hỏi đường và đề nghị lịch sự'], 'Luyện phản xạ ngữ điệu câu hỏi không có từ để hỏi'),
        (12, 'Integrated assessment', 'Nghe, nói, đọc, viết và đánh giá', ['Ôn tập từ vựng nền tảng TORFL ТЭУ'], ['Hệ thống hóa Cách 1, 4, 6 và động từ'], 'Đánh giá đọc thành tiếng chuẩn trọng âm Cyrillic'),
    ]

    all_curricula = [
        ('zh', 'chinese', 'crs_zh_1', 'mod_zh_1', zh_weeks),
        ('en', 'english', 'crs_en_1', 'mod_en_1', en_weeks),
        ('ru', 'russian', 'crs_ru_1', 'mod_ru_1', ru_weeks),
    ]

    for lang, lang_slug, crs_id, mod_id, wlist in all_curricula:
        for wnum, topic, focus, vocab, grammar, phonetics in wlist:
            w_id = f"wk_{lang}_{wnum:02d}"
            w_slug = f"{lang_slug}-beginner-week-{wnum:02d}"
            w_name = f"Tuần {wnum:02d}: {topic}"
            lines.append(
                "INSERT OR IGNORE INTO wb_weeks ("
                "id, module_id, course_id, slug, week_number, name_vi, topic_vi, "
                "week_objectives, learning_outcomes, required_knowledge, "
                "core_vocabulary_json, core_grammar_json, pronunciation_phonetics, "
                "listening_content, speaking_content, reading_content, writing_content, "
                "application_scenario, study_materials_json, audio_refs_json, exercises_json, "
                "weekly_test_spec, passing_criteria, review_assignment, next_week_prep, sessions_count"
                ") VALUES ("
                + ", ".join([
                    sql_str(w_id), sql_str(mod_id), sql_str(crs_id), sql_str(w_slug), str(wnum),
                    sql_str(w_name), sql_str(topic),
                    sql_str(f"Làm chủ chủ đề '{topic}' với trọng tâm: {focus}."),
                    sql_str(f"Người học vận dụng thành thạo từ vựng, ngữ pháp và phát âm của tuần {wnum} trong giao tiếp thực tế."),
                    sql_str(focus),
                    sql_str(json.dumps(vocab, ensure_ascii=False)),
                    sql_str(json.dumps(grammar, ensure_ascii=False)),
                    sql_str(phonetics),
                    sql_str(f"Bài nghe hội thoại mẫu và nghe điền từ chủ đề {topic} (tốc độ 0.75x và 1.0x)."),
                    sql_str(f"Luyện đọc thành tiếng, lặp lại câu mẫu và đóng vai hội thoại chủ đề {topic}."),
                    sql_str(f"Đọc hiểu đoạn hội thoại ngắn và văn bản ứng dụng chủ đề {topic}."),
                    sql_str(f"Viết câu hoàn chỉnh và đoạn văn ngắn (40–80 từ) áp dụng cấu trúc tuần {wnum}."),
                    sql_str(f"Tình huống giao tiếp thực tế gắn với chủ đề {topic} trong đời sống và công việc."),
                    sql_str(json.dumps([f"Tài liệu tóm tắt tuần {wnum:02d}", f"Phiếu luyện viết tuần {wnum:02d}"], ensure_ascii=False)),
                    sql_str(json.dumps([f"audio/{lang}/week-{wnum:02d}-dialogue.mp3"], ensure_ascii=False)),
                    sql_str(json.dumps([f"Bài tập từ vựng tuần {wnum:02d}", f"Bài tập ngữ pháp tuần {wnum:02d}", f"Bài tập nghe hiểu tuần {wnum:02d}"], ensure_ascii=False)),
                    sql_str(f"Bài kiểm tra định kỳ cuối tuần {wnum:02d} (20 phút, trắc nghiệm + điền từ + viết ngắn)."),
                    sql_str("Hoàn thành tối thiểu 2/3 buổi học trong tuần và đạt >= 70% điểm kiểm tra tuần."),
                    sql_str(f"Ôn tập flashcard ngắt quãng (SM-2) toàn bộ từ vựng tuần {wnum:02d}."),
                    sql_str(f"Xem trước bảng từ vựng và mục tiêu của Tuần {min(wnum + 1, 12):02d}."),
                    "3"
                ])
                + ");"
            )
            # Create 1 structured session & 1 full 12-component lesson for Week 1 & Week 2 of each language (plus Week 12)
            if wnum in (1, 2, 12):
                ses_id = f"ses_{lang}_{wnum:02d}_1"
                les_id = f"les_{lang}_{wnum:02d}_1"
                les_slug = f"{lang_slug}-week-{wnum:02d}-lesson-01"
                components = {
                    "objectives": f"Nắm vững kiến thức cốt lõi của {w_name}.",
                    "coreKnowledge": focus,
                    "newVocabulary": vocab,
                    "grammar": grammar,
                    "phonetics": phonetics,
                    "examples": [f"Ví dụ ứng dụng chuẩn cho chủ đề {topic}."],
                    "context": f"Bối cảnh giao tiếp thực tế cho {topic}.",
                    "listening": f"Nghe đoạn mẫu chủ đề {topic} và trả lời 3 câu hỏi kiểm tra ý chính.",
                    "speaking": f"Đọc theo câu mẫu với tốc độ 0.75x rồi 1.0x; tự luyện phát âm qua microphone khi chủ động bật.",
                    "reading": f"Đọc đoạn văn ngắn minh họa và gạch chân cấu trúc trọng tâm.",
                    "writing": f"Viết 5 câu hoàn chỉnh vận dụng từ vựng và ngữ pháp tuần {wnum:02d}.",
                    "assessment": f"Kiểm tra mức hiểu cuối bài (5 câu hỏi nhanh).",
                }
                lines.append(
                    f"INSERT OR IGNORE INTO wb_study_sessions (id, week_id, session_code, title_vi, position_in_week, duration_minutes, objectives, new_knowledge, vocabulary_json, grammar_json, pronunciation_notes, examples_json, materials_json, activities_json, short_exercises_json, comprehension_check_json, summary_text, self_study_homework, completion_condition) VALUES ("
                    f"{sql_str(ses_id)}, {sql_str(w_id)}, {sql_str(f'{lang.upper()}-W{wnum:02d}-S1')}, {sql_str(f'Buổi 1 — {topic}')}, 1, 45, "
                    f"{sql_str(f'Nắm vững nền tảng {topic}')}, {sql_str(focus)}, {sql_str(json.dumps(vocab, ensure_ascii=False))}, {sql_str(json.dumps(grammar, ensure_ascii=False))}, {sql_str(phonetics)}, "
                    f"'[\"Ví dụ 1\",\"Ví dụ 2\"]', '[\"Slide bài giảng\",\"Phiếu bài tập\"]', '[\"Nghe mẫu\",\"Thực hành cặp\",\"Kiểm tra nhanh\"]', '[\"Điền từ\",\"Sắp xếp câu\"]', '[\"Câu hỏi kiểm tra hiểu bài\"]', "
                    f"{sql_str(f'Tổng kết trọng tâm {topic}.')}, {sql_str(f'Ôn tập 15 phút trên Sổ từ vựng WORD BRIDGE.')}, 'Hoàn thành bài tập ngắn và đạt >= 70% kiểm tra mức hiểu.');"
                )
                lines.append(
                    f"INSERT OR IGNORE INTO wb_lessons (id, session_id, week_id, slug, title_vi, language_code, level_ref, is_public_preview, components_json, author_name, reviewer_name, reference_sources, version, review_status) VALUES ("
                    f"{sql_str(les_id)}, {sql_str(ses_id)}, {sql_str(w_id)}, {sql_str(les_slug)}, {sql_str(f'Bài 1 ({w_name})')}, {sql_str(lang)}, {sql_str('HSK 1' if lang=='zh' else 'CEFR A1' if lang=='en' else 'TORFL ТЭУ')}, 1, "
                    f"{sql_str(json.dumps(components, ensure_ascii=False))}, 'Ban Biên soạn WORD BRIDGE', 'Hội đồng Học thuật WORD BRIDGE', 'Giáo trình chuẩn WORD BRIDGE V3.0', '1.0.0', 'published');"
                )

    lines.append("")
    # 6. Core Dictionary Entries across zh (incl. Logistics Section 21!), en, ru
    dict_entries = [
        # Chinese General + Logistics (Section 21 mandatory terms!)
        ('dict_zh_nihao', 'zh', 'ni-hao', '你好', 'nihao', 'nǐ hǎo', 'nǐ hǎo', '3-3 (biến điệu 2-3)', None, 'thán từ / cụm chào', None, 'xin chào', '用于打招呼的礼貌用语。', '[{"text":"你好，请问您贵姓？","vi":"Xin chào, xin hỏi quý danh của anh/chị là gì?"}]', 'Bộ Nhân (亻) + Bộ Nữ (女) & Tử (子)', 'greetings', 'HSK 1', None),
        ('dict_zh_haiyuntidan', 'zh', 'hai-yun-ti-dan', '海运提单', 'haiyuntidan', 'hǎiyùn tídān', 'hǎiyùn tídān', '3-4-2-1', None, 'danh từ chuyên ngành', None, 'vận đơn đường biển (Bill of Lading)', '承运人收到货物后签发给托运人的货物收据和物权凭证。', '[{"text":"请核对海运提单上的收货人信息。","vi":"Vui lòng đối chiếu thông tin người nhận hàng trên vận đơn đường biển."}]', '海(biển) + 运(vận chuyển) + 提单(vận đơn)', 'logistics', 'HSK 4', 'logistics'),
        ('dict_zh_shangyefapiao', 'zh', 'shang-ye-fa-piao', '商业发票', 'shangyefapiao', 'shāngyè fāpiào', 'shāngyè fāpiào', '1-4-1-4', None, 'danh từ chuyên ngành', None, 'hóa đơn thương mại (Commercial Invoice)', '出口商开立给进口商列明货物数量、单价和总金额的正式单据。', '[{"text":"报关时需要提交商业发票和装箱单。","vi":"Khi khai báo hải quan cần nộp hóa đơn thương mại và phiếu đóng gói."}]', '商业(thương mại) + 发票(hóa đơn)', 'logistics', 'HSK 4', 'logistics'),
        ('dict_zh_zhuangxiangdan', 'zh', 'zhuang-xiang-dan', '装箱单', 'zhuangxiangdan', 'zhuāngxiāngdān', 'zhuāngxiāngdān', '1-1-1', None, 'danh từ chuyên ngành', None, 'phiếu đóng gói (Packing List)', '详细列明每件包装内货物规格、重量和体积的单证。', '[{"text":"装箱单上的毛重和净重必须准确无误。","vi":"Trọng lượng cả bì và trọng lượng tịnh trên phiếu đóng gói phải chính xác tuyệt đối."}]', '装箱(đóng thùng) + 单(phiếu)', 'logistics', 'HSK 4', 'logistics'),
        ('dict_zh_yuanchandizhengshu', 'zh', 'yuan-chan-di-zheng-shu', '原产地证书', 'yuanchandizhengshu', 'yuánchǎndì zhèngshū', 'yuánchǎndì zhèngshū', '2-3-4-4-1', None, 'danh từ chuyên ngành', None, 'giấy chứng nhận xuất xứ (Certificate of Origin)', '证明进出口货物原产国或地区的官方文件。', '[{"text":"凭借原产地证书，进口商可以申请关税优惠。","vi":"Dựa vào giấy chứng nhận xuất xứ, nhà nhập khẩu có thể xin ưu đãi thuế quan."}]', '原产地(nơi xuất xứ) + 证书(giấy chứng nhận)', 'logistics', 'HSK 5', 'import-export'),
        ('dict_zh_baoguan', 'zh', 'bao-guan', '报关', 'baoguan', 'bàoguān', 'bàoguān', '4-1', None, 'động từ chuyên ngành', None, 'khai báo hải quan (Customs declaration)', '向海关申报进出口货物情况并办理通关手续的行为。', '[{"text":"这批货物已经在港口完成报关手续。","vi":"Lô hàng này đã hoàn tất thủ tục khai báo hải quan tại cảng."}]', '报(báo cáo) + 关(hải quan)', 'logistics', 'HSK 4', 'import-export'),
        ('dict_zh_gongyinglianguanli', 'zh', 'gong-ying-lian-guan-li', '供应链管理', 'gongyinglianguanli', 'gōngyìngliàn guǎnlǐ', 'gōngyìngliàn guǎnlǐ', '1-4-4-3-3', None, 'danh từ chuyên ngành', None, 'quản trị chuỗi cung ứng (Supply chain management)', '对原材料采购、生产制造到成品交付全流程的统筹管理。', '[{"text":"高效的供应链管理能显著降低物流成本。","vi":"Quản trị chuỗi cung ứng hiệu quả có thể giảm đáng kể chi phí logistics."}]', '供应链(chuỗi cung ứng) + 管理(quản lý)', 'logistics', 'HSK 5', 'logistics'),
        # English General + Specialized
        ('dict_en_schedule', 'en', 'schedule', 'schedule', 'schedule', '/ˈskedʒuːl/ (US) · /ˈʃedʒuːl/ (UK)', '/ˈskedʒuːl/', None, 'âm tiết 1', 'danh từ (n) / động từ (v)', None, 'lịch trình, thời gian biểu; lên lịch', 'A plan for carrying out a process or procedure, giving lists of intended events and times.', '[{"text":"Please check the updated delivery schedule before Friday.","vi":"Vui lòng kiểm tra lịch trình giao hàng đã cập nhật trước thứ Sáu."}]', None, 'daily-life', 'CEFR A2', None),
        ('dict_en_bill_of_lading', 'en', 'bill-of-lading', 'bill of lading', 'bill of lading', '/ˌbɪl əv ˈleɪdɪŋ/', '/ˌbɪl əv ˈleɪdɪŋ/', None, 'leɪd', 'danh từ chuyên ngành', None, 'vận đơn đường biển', 'A detailed list of a shipment of goods in the form of a receipt given by the carrier to the person consigning the goods.', '[{"text":"The consignee must present the original bill of lading to release the cargo.","vi":"Người nhận hàng phải xuất trình vận đơn gốc để giải phóng lô hàng."}]', None, 'logistics', 'CEFR B2', 'logistics'),
        ('dict_en_cloud_architecture', 'en', 'cloud-architecture', 'cloud architecture', 'cloud architecture', '/klaʊd ˈɑːrkɪtektʃər/', '/klaʊd ˈɑːrkɪtektʃər/', None, 'ɑːr', 'danh từ chuyên ngành', None, 'kiến trúc điện toán đám mây', 'The way technology components combine to build a cloud computing environment.', '[{"text":"Our team migrated the legacy monolith to a serverless cloud architecture.","vi":"Nhóm chúng tôi đã chuyển đổi hệ thống nguyên khối cũ sang kiến trúc đám mây serverless."}]', None, 'it-cloud', 'CEFR B2', 'it-cloud'),
        # Russian General (NO specialized_domain!)
        ('dict_ru_privet', 'ru', 'privet', 'приве́т', 'привет', '[prʲɪˈvʲet]', '[prʲɪˈvʲet]', None, 'âm tiết 2 (приве́т)', 'thán từ / danh từ', 'giống đực (m)', 'xin chào (thân mật); lời chào', 'Неофициальное приветствие при встрече.', '[{"text":"Приве́т! Как у тебя́ дела́?","vi":"Chào bạn! Dạo này bạn thế nào?"}]', None, 'greetings', 'TORFL ТЭУ', None),
        ('dict_ru_kniga', 'ru', 'kniga', 'кни́га', 'книга', '[ˈknʲiɡə]', '[ˈknʲiɡə]', None, 'âm tiết 1 (кни́га)', 'danh từ (n)', 'giống cái (f)', 'quyển sách', 'Печатное издание в виде переплетённых листов бумаги с текстом.', '[{"text":"Я чита́ю интере́сную ру́сскую кни́гу.","vi":"Tôi đang đọc một quyển sách tiếng Nga thú vị."}]', None, 'education', 'TORFL ТЭУ', None),
        ('dict_ru_universitet', 'ru', 'universitet', 'университе́т', 'университет', '[ʊnʲɪvʲɪrsʲɪˈtʲet]', '[ʊnʲɪvʲɪrsʲɪˈtʲet]', None, 'âm tiết 5 (университе́т)', 'danh từ (n)', 'giống đực (m)', 'trường đại học', 'Высшее учебное заведение и научный центр.', '[{"text":"Мы у́чимся в университе́те.","vi":"Chúng tôi học tại trường đại học."}]', None, 'education', 'TORFL ТЭУ', None),
    ]

    for d in dict_entries:
        lines.append(
            "INSERT OR IGNORE INTO wb_dictionary_entries ("
            "id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin, tone_pattern, stress_pattern, part_of_speech, noun_gender, meaning_vi, target_definition, examples_json, radicals_or_structure, topic, level_ref, specialized_domain, source_id, review_status"
            ") VALUES ("
            + ", ".join(sql_str(x) for x in d)
            + ", 'src_wb_original', 'published');"
        )

    lines.append("")
    # 7. Grammar Topics
    lines.extend([
        "INSERT OR IGNORE INTO wb_grammar_topics (id, language_code, slug, title_vi, level_ref, explanation_vi, structure_formula, examples_json) VALUES",
        "  ('grm_zh_1', 'zh', 'cau-chu-vi-shi', 'Câu vị ngữ động từ 是 (shì)', 'HSK 1', 'Dùng để khẳng định danh tính, nghề nghiệp hoặc quốc tịch. Phủ định dùng 不是 (bú shì).', 'Chủ ngữ + (不)是 + Danh từ', '[{\"text\":\"我是越南学生。\",\"vi\":\"Tôi là sinh viên Việt Nam.\"}]'),",
        "  ('grm_en_1', 'en', 'present-simple', 'Thì Hiện tại đơn (Present Simple)', 'CEFR A1', 'Diễn tả thói quen, lịch trình cố định và sự thật hiển nhiên.', 'S + V(s/es) / S + do/does not + V', '[{\"text\":\"She practices listening every morning.\",\"vi\":\"Cô ấy luyện nghe mỗi sáng.\"}]'),",
        "  ('grm_ru_1', 'ru', 'accusative-case', 'Cách 4 Tiếng Nga (Винительный падеж)', 'TORFL ТЭУ', 'Biểu thị tân ngữ trực tiếp chịu tác động của ngoại động từ; danh từ giống cái đuôi -а/-я đổi thành -у/-ю.', 'Động từ + Danh từ (Cách 4)', '[{\"text\":\"Я читаю книгу.\",\"vi\":\"Tôi đọc quyển sách.\"}]');",
        "",
        "-- 8. Question Bank, Practice Exercises & Examinations (NO CERTIFICATES)",
        "INSERT OR IGNORE INTO wb_question_bank (id, language_code, skill, question_type, level_ref, topic, prompt_text, options_json, correct_answer_json, explanation_vi, max_score, auto_gradable) VALUES",
        "  ('qb_zh_1', 'zh', 'vocabulary', 'single_choice', 'HSK 4', 'logistics', 'Thuật ngữ tiếng Trung nào có nghĩa là \"Vận đơn đường biển (Bill of Lading)\"?', '[\"海运提单\",\"商业发票\",\"装箱单\",\"原产地证书\"]', '\"海运提单\"', '海运提单 (hǎiyùn tídān) là vận đơn đường biển.', 1.0, 1),",
        "  ('qb_zh_2', 'zh', 'grammar', 'single_choice', 'HSK 1', 'introduction', 'Chọn câu đúng để nói \"Tôi là sinh viên Việt Nam\":', '[\"我是越南学生。\",\"我越南是学生。\",\"是越南我学生。\"]', '\"我是越南学生。\"', 'Cấu trúc chuẩn: Chủ ngữ + 是 + Định ngữ + Danh từ.', 1.0, 1),",
        "  ('qb_en_1', 'en', 'grammar', 'single_choice', 'CEFR A1', 'daily-life', 'Choose the correct verb form: \"She ___ English every evening.\"', '[\"study\",\"studies\",\"studying\",\"studied\"]', '\"studies\"', 'Chủ ngữ ngôi thứ 3 số ít (She) ở thì hiện tại đơn chia là studies.', 1.0, 1),",
        "  ('qb_en_2', 'en', 'writing', 'essay', 'CEFR B1', 'business', 'Write a short professional email (80–120 words) confirming a shipment schedule.', '[]', NULL, 'Bài viết tự luận được chấm theo rubric mạch lạc, ngữ pháp và độ tự nhiên; hệ thống không chấm điểm giả.', 10.0, 0),",
        "  ('qb_ru_1', 'ru', 'grammar', 'single_choice', 'TORFL ТЭУ', 'cases', 'Chọn dạng Cách 4 đúng của từ \"книга\" trong câu \"Я читаю ___\":', '[\"книга\",\"книгу\",\"книге\",\"книги\"]', '\"книгу\"', 'Danh từ giống cái kết thúc bằng -а đổi sang -у ở Cách 4.', 1.0, 1);",
        "",
        "INSERT OR IGNORE INTO wb_practice_exercises (id, slug, language_code, skill, title_vi, level_ref, topic, instructions_vi, question_ids_json, rubric_summary_vi) VALUES",
        "  ('pex_zh_voc_1', 'zh-logistics-vocab-drill', 'zh', 'vocabulary', 'Luyện từ vựng Tiếng Trung Logistics cơ bản', 'HSK 4', 'logistics', 'Chọn thuật ngữ tiếng Trung tương ứng với chứng từ xuất nhập khẩu.', '[\"qb_zh_1\",\"qb_zh_2\"]', 'Tự động chấm trắc nghiệm chính xác theo đáp án chuẩn.'),",
        "  ('pex_en_grm_1', 'en-present-simple-drill', 'en', 'grammar', 'Luyện ngữ pháp Thì Hiện tại đơn', 'CEFR A1', 'daily-life', 'Hoàn thành câu bằng dạng động từ đúng.', '[\"qb_en_1\"]', 'Tự động chấm kèm giải thích chi tiết bằng tiếng Việt.'),",
        "  ('pex_en_wrt_1', 'en-email-writing-practice', 'en', 'writing', 'Luyện viết Email xác nhận lịch giao hàng', 'CEFR B1', 'business', 'Viết email ngắn 80–120 từ theo văn phong chuyên nghiệp.', '[\"qb_en_2\"]', 'Đánh giá theo rubric 4 tiêu chí (không cấp điểm tự động giả).'),",
        "  ('pex_ru_grm_1', 'ru-accusative-case-drill', 'ru', 'grammar', 'Luyện tập Cách 4 Tiếng Nga', 'TORFL ТЭУ', 'cases', 'Chọn dạng biến cách chính xác của danh từ làm tân ngữ trực tiếp.', '[\"qb_ru_1\"]', 'Tự động chấm kèm giải thích quy tắc biến cách.');",
        "",
        "INSERT OR IGNORE INTO wb_examinations (id, slug, language_code, title_vi, framework_reference, level_ref, skills_json, topic, duration_minutes, instructions_vi, question_ids_json, scoring_scale_json, passing_threshold) VALUES",
        "  ('exm_zh_hsk1', 'hsk-1-reference-diagnostic', 'zh', 'Đề đánh giá tham chiếu HSK 1 (Tiếng Trung)', 'Tham chiếu HSK 1', 'HSK 1', '[\"vocabulary\",\"grammar\",\"reading\"]', 'Tổng hợp sơ cấp', 30, 'Đọc kỹ từng câu hỏi và lưu nháp tự động trong quá trình làm bài. Lưu ý: WORD BRIDGE không cấp chứng chỉ.', '[\"qb_zh_1\",\"qb_zh_2\"]', '{\"scale\":\"0-100\",\"pass\":60}', 60.0),",
        "  ('exm_en_a1', 'cefr-a1-reference-diagnostic', 'en', 'Đề đánh giá tham chiếu CEFR A1 (Tiếng Anh)', 'Tham chiếu CEFR A1', 'CEFR A1', '[\"grammar\",\"reading\"]', 'Tổng hợp A1', 30, 'Làm bài độc lập trong thời gian quy định. Kết quả chỉ mang tính tham chiếu học tập, không phải chứng chỉ.', '[\"qb_en_1\"]', '{\"scale\":\"0-100\",\"pass\":60}', 60.0),",
        "  ('exm_ru_teu', 'torfl-teu-reference-diagnostic', 'ru', 'Đề đánh giá tham chiếu TORFL ТЭУ (Tiếng Nga)', 'Tham chiếu TORFL ТЭУ', 'TORFL ТЭУ', '[\"grammar\",\"reading\"]', 'Tổng hợp ТЭУ', 30, 'Kiểm tra kiến thức Cyrillic và biến cách cơ bản. WORD BRIDGE không cấp chứng chỉ chính thức.', '[\"qb_ru_1\"]', '{\"scale\":\"0-100\",\"pass\":60}', 60.0);",
        "",
        "-- 9. Background Jobs & Platform Config",
        "INSERT OR IGNORE INTO wb_background_jobs (job_name, objective_vi, trigger_type, schedule_expr, status) VALUES",
        "  ('student_benefit_expiration_sync', 'Kiểm tra quyền lợi sinh viên 03 tháng hết hạn và tự động chuyển về PERSONAL FREE nếu không có gói trả phí.', 'cron', '0 1 * * *', 'active'),",
        "  ('email_retry_dispatcher', 'Thử gửi lại các email ở trạng thái RETRYING trong giới hạn số lần thử an toàn.', 'cron', '*/15 * * * *', 'active'),",
        "  ('cleanup_expired_tokens_and_sessions', 'Dọn dẹp token xác minh và phiên đăng nhập đã quá hạn lưu trữ.', 'cron', '0 1 * * *', 'active'),",
        "  ('system_health_monitor', 'Giám sát kết nối D1 và tình trạng vận hành nền tảng.', 'cron', '*/15 * * * *', 'active');",
        "",
        "INSERT OR IGNORE INTO wb_platform_config (config_key, config_value, description_vi) VALUES",
        "  ('official_languages', 'zh,en,ru', 'Ba ngôn ngữ học tập chính thức (tuyệt đối không mở tiếng Nhật/Hàn).'),",
        "  ('specialized_languages', 'zh,en', 'Ngôn ngữ được phép mở chương trình chuyên ngành (không mở tiếng Nga chuyên ngành).'),",
        "  ('student_benefit_months', '3', 'Thời hạn miễn phí PERSONAL PLUS cho sinh viên (duy nhất 01 lần, chỉ xác minh email trường cấp).'),",
        "  ('certificates_enabled', 'false', 'Khóa cứng chính sách không cấp chứng chỉ dưới mọi hình thức.');",
    ])

    out_path = os.path.join(MIGRATIONS_DIR, '0007_seed_academic_baseline.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {out_path} ({len(lines)} lines)")


def generate_0008_from_user_zip():
    if not os.path.exists(UPLOADED_VOCAB_ZIP):
        print("Uploaded vocab zip not found; skipping 0008.")
        return

    file_domain_map = {
        '1000_Tu_Vung_Ke_Toan_Doanh_Nghiep.xlsx': ('economics-tourism', 'Kế toán doanh nghiệp'),
        '1000_Tu_Vung_Quan_Tri_Mang_May_Tinh.xlsx': ('it-cloud', 'Quản trị mạng máy tính'),
        'Tu_vung_Cong_nghe_O_to_1000_tu.xlsx': ('automotive', 'Công nghệ ô tô'),
        'Tu_vung_Ky_thuat_May_lanh_DHKK_1000_tu.xlsx': ('mechanical-engineering', 'Kỹ thuật máy lạnh & ĐHKK'),
        'Tu_vung_Sua_chua_lap_rap_may_tinh.xlsx': ('it-cloud', 'Phần cứng & lắp ráp máy tính'),
        'Tu_vung_Thiet_ke_do_hoa_1000.xlsx': ('graphic-design', 'Thiết kế đồ họa'),
        'Tu_vung_chuyen_nganh_dot2.xlsx': ('electrical-electronics', 'Điện – Điện tử & Cơ điện tử'),
    }

    lines = [
        "-- ============================================================================",
        "-- Migration 0008: Curated Specialized English Vocabulary from User Dataset",
        "-- Source: FILE TỪ VỰNG.zip (verified user-provided WORD BRIDGE dataset)",
        "-- Strictly INSERT OR IGNORE (non-destructive)",
        "-- ============================================================================",
        "PRAGMA foreign_keys = ON;",
        "",
    ]

    seen_slugs = set()
    total_added = 0

    with zipfile.ZipFile(UPLOADED_VOCAB_ZIP, 'r') as z:
        for zname in z.namelist():
            if not zname.endswith('.xlsx'):
                continue
            base = os.path.basename(zname)
            domain_slug, topic_label = ('it-cloud', 'Chuyên ngành')
            for k, v in file_domain_map.items():
                if k in base:
                    domain_slug, topic_label = v
                    break

            wb = openpyxl.load_workbook(io.BytesIO(z.read(zname)), read_only=True)
            sheet_added = 0
            for sname in wb.sheetnames:
                if any(skip in sname.lower() for skip in ['tổng quan', 'thống kê', 'hướng dẫn', 'tổng hợp']):
                    continue
                ws = wb[sname]
                header_map = None
                for row in ws.iter_rows(values_only=True):
                    cells = [str(c).strip() if c is not None else '' for c in row]
                    if not any(cells):
                        continue
                    joined = ' '.join(cells).lower()
                    if header_map is None and ('từ gốc' in joined or 'thuật ngữ' in joined) and ('nghĩa' in joined or 'ipa' in joined):
                        header_map = {}
                        for idx, col in enumerate(cells):
                            cl = col.lower()
                            if 'từ gốc' in cl or 'thuật ngữ' in cl:
                                header_map['word'] = idx
                            elif 'loại từ' in cl:
                                header_map['pos'] = idx
                            elif 'ipa' in cl or 'phiên âm' in cl:
                                header_map['ipa'] = idx
                            elif 'nghĩa' in cl:
                                header_map['vi'] = idx
                            elif 'chủ đề' in cl or 'chuyên mục' in cl:
                                header_map['topic'] = idx
                        continue
                    if header_map and 'word' in header_map and 'vi' in header_map:
                        if sheet_added >= 45:
                            break
                        word = cells[header_map['word']] if header_map['word'] < len(cells) else ''
                        meaning_vi = cells[header_map['vi']] if header_map['vi'] < len(cells) else ''
                        if not word or not meaning_vi or len(word) > 90:
                            continue
                        pos = cells[header_map.get('pos', -1)] if header_map.get('pos', -1) >= 0 and header_map['pos'] < len(cells) else 'danh từ (n)'
                        ipa = cells[header_map.get('ipa', -1)] if header_map.get('ipa', -1) >= 0 and header_map['ipa'] < len(cells) else ''
                        sub_topic = cells[header_map.get('topic', -1)] if header_map.get('topic', -1) >= 0 and header_map['topic'] < len(cells) else topic_label
                        slug = f"spc-{domain_slug[:8]}-{slugify(word)}"
                        if slug in seen_slugs:
                            continue
                        seen_slugs.add(slug)
                        entry_id = f"dict_en_{slug[:48]}"
                        lines.append(
                            "INSERT OR IGNORE INTO wb_dictionary_entries ("
                            "id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin, part_of_speech, meaning_vi, target_definition, examples_json, topic, level_ref, specialized_domain, source_id, review_status"
                            ") VALUES ("
                            + ", ".join([
                                sql_str(entry_id), "'en'", sql_str(slug), sql_str(word), sql_str(word.lower()),
                                sql_str(ipa or '/.../'), sql_str(ipa or ''), sql_str(pos or 'danh từ'),
                                sql_str(meaning_vi), sql_str(f"Specialized term in {sub_topic or topic_label}."),
                                sql_str(json.dumps([{"text": f"In {topic_label}, '{word}' is a standard technical term.", "vi": f"Trong lĩnh vực {topic_label}, '{word}' mang nghĩa: {meaning_vi}."}], ensure_ascii=False)),
                                sql_str(sub_topic or topic_label), "'CEFR B1–B2'", sql_str(domain_slug),
                                "'src_user_specialized'", "'published'"
                            ])
                            + ");"
                        )
                        sheet_added += 1
                        total_added += 1

    out_path = os.path.join(MIGRATIONS_DIR, '0008_seed_specialized_vocab_user_dataset.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {out_path} with {total_added} specialized vocabulary entries from FILE TỪ VỰNG.zip")


if __name__ == '__main__':
    generate_0007()
    generate_0008_from_user_zip()
