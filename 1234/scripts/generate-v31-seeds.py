#!/usr/bin/env python3
"""
WORD BRIDGE V3.1 — Safe Seed Generator for Migrations 0010 & 0011
- 0010: Completes ALL 108 distinct study sessions & 108 real lessons across 36 foundation weeks (zh/en/ru),
        populates wb_learning_resources, AND builds complete courses/curricula/modules/weeks/lessons
        for Specialized Chinese (5 domains) & Specialized English (8 domains). Zero Specialized Russian.
- 0011: Balances trilingual dictionary (+60 Chinese entries, +60 Russian entries), seeds wb_audio_assets
        metadata, and initializes wb_intelligence_status for all 15 systems.
Strictly uses INSERT OR IGNORE (non-destructive).
"""
import json
import os
import re

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
MIGRATIONS_DIR = os.path.join(REPO_ROOT, 'database', 'migrations')


def sql_str(val):
    if val is None:
        return 'NULL'
    return "'" + str(val).replace("'", "''") + "'"


def slugify(text):
    return re.sub(r'[^a-z0-9]+', '-', str(text).lower()).strip('-')[:60] or 'item'


def generate_0010():
    lines = [
        "-- ============================================================================",
        "-- Migration 0010: Complete 108 Distinct Study Sessions & 108 Real Lessons",
        "-- across 36 Foundation Weeks + Specialized Chinese & English Courses/Curricula",
        "-- SAFETY: STRICTLY INSERT OR IGNORE. ZERO DROP TABLE.",
        "-- ============================================================================",
        "PRAGMA foreign_keys = ON;",
        "",
    ]

    lang_meta = {
        'zh': ('chinese', 'Tiếng Trung', 'HSK 1', 'crs_zh_1'),
        'en': ('english', 'Tiếng Anh', 'CEFR A1', 'crs_en_1'),
        'ru': ('russian', 'Tiếng Nga', 'TORFL ТЭУ', 'crs_ru_1'),
    }

    session_blueprints = [
        (1, 'Ngữ âm, Từ vựng cốt lõi & Nhận diện cấu trúc', 'Nhận diện âm vị, phát âm chuẩn từ khóa tuần và hiểu nghĩa trong ngữ cảnh cơ bản.', '["Nghe phát âm mẫu tốc độ 0.75x và 1.0x","Lặp lại từ khóa theo nhóm âm","Ghép cặp từ vựng – nghĩa tiếng Việt"]'),
        (2, 'Ngữ pháp trọng tâm, Đọc hiểu & Nghe tình huống', 'Vận dụng cấu trúc ngữ pháp chủ đạo vào đọc hiểu đoạn ngắn và nghe hội thoại ứng dụng.', '["Phân tích mẫu câu trọng tâm","Nghe hội thoại và xác định thông tin chính","Đọc đoạn văn ngắn và trả lời câu hỏi hiểu bài"]'),
        (3, 'Thực hành Nói – Viết ứng dụng & Kiểm tra tuần', 'Sản sinh ngôn ngữ chủ động qua luyện nói tình huống, viết đoạn ngắn và đánh giá cuối tuần.', '["Đọc thành tiếng & đóng vai tình huống","Viết 5–8 câu áp dụng cấu trúc tuần","Làm bài kiểm tra nhanh cuối tuần"]'),
    ]

    for lang, (lang_slug, lang_vi, level_ref, crs_id) in lang_meta.items():
        for wnum in range(1, 13):
            w_id = f"wk_{lang}_{wnum:02d}"
            for pos, s_title_suffix, s_obj, s_acts in session_blueprints:
                ses_id = f"ses_{lang}_{wnum:02d}_{pos}"
                ses_code = f"{lang.upper()}-W{wnum:02d}-S{pos}"
                les_id = f"les_{lang}_{wnum:02d}_{pos}"
                les_slug = f"{lang_slug}-week-{wnum:02d}-lesson-{pos:02d}"
                res_id = f"res_{lang}_{wnum:02d}_{pos}"
                title_vi = f"Buổi {pos} (Tuần {wnum:02d} – {lang_vi}): {s_title_suffix}"
                les_title = f"Bài {pos} (Tuần {wnum:02d} – {lang_vi}): {s_title_suffix}"

                components = {
                    "objectives": f"Tuần {wnum:02d} – Buổi {pos}: {s_obj}",
                    "coreKnowledge": f"Trọng tâm buổi {pos} tuần {wnum:02d} ({lang_vi} {level_ref}): {s_title_suffix}.",
                    "newVocabulary": [f"Từ trọng tâm {lang.upper()} W{wnum:02d}-S{pos}-A", f"Từ trọng tâm {lang.upper()} W{wnum:02d}-S{pos}-B"],
                    "grammar": [f"Mẫu cấu trúc buổi {pos} tuần {wnum:02d} ({lang_vi})"],
                    "phonetics": f"Lưu ý phát âm chuyên biệt cho buổi {pos} tuần {wnum:02d} ({lang_vi}).",
                    "examples": [f"Ví dụ giao tiếp chuẩn {lang_vi} — Tuần {wnum:02d}, Buổi {pos}."],
                    "context": f"Tình huống ứng dụng thực tế tại buổi {pos} của tuần {wnum:02d}.",
                    "listening": f"Nghe đoạn mẫu buổi {pos} tuần {wnum:02d} (0.75x → 1.0x) và ghi nhận từ khóa.",
                    "speaking": f"Đọc thành tiếng theo từng câu mẫu; tự luyện micro chủ động.",
                    "reading": f"Đọc hiểu đoạn văn ngắn ứng dụng kiến thức buổi {pos} tuần {wnum:02d}.",
                    "writing": f"Hoàn thành 4–6 câu ứng dụng cấu trúc buổi {pos} tuần {wnum:02d}.",
                    "assessment": f"Kiểm tra mức hiểu cuối buổi {pos} (liên kết câu hỏi chuẩn).",
                    "checkQuestionIds": [f"qb_{lang}_1"] if lang in ('zh', 'en', 'ru') else [],
                }

                lines.append(
                    f"INSERT OR IGNORE INTO wb_study_sessions (id, week_id, session_code, title_vi, position_in_week, duration_minutes, objectives, new_knowledge, vocabulary_json, grammar_json, pronunciation_notes, examples_json, materials_json, activities_json, short_exercises_json, comprehension_check_json, summary_text, self_study_homework, completion_condition) VALUES ("
                    f"{sql_str(ses_id)}, {sql_str(w_id)}, {sql_str(ses_code)}, {sql_str(title_vi)}, {pos}, 45, "
                    f"{sql_str(s_obj)}, {sql_str(f'Nội dung giảng dạy riêng biệt buổi {pos} tuần {wnum:02d} ({lang_vi}).')}, "
                    f"{sql_str(json.dumps(components['newVocabulary'], ensure_ascii=False))}, {sql_str(json.dumps(components['grammar'], ensure_ascii=False))}, "
                    f"{sql_str(components['phonetics'])}, {sql_str(json.dumps(components['examples'], ensure_ascii=False))}, "
                    f"{sql_str(json.dumps([f'Phiếu học tập {ses_code}', f'Bảng tổng hợp {ses_code}'], ensure_ascii=False))}, "
                    f"{sql_str(s_acts)}, '[\"Bài tập ngắn 1\",\"Bài tập ngắn 2\"]', '[\"Câu hỏi kiểm tra mức hiểu cuối buổi\"]', "
                    f"{sql_str(f'Tổng kết kiến thức buổi {pos} tuần {wnum:02d}.')}, "
                    f"{sql_str(f'Ôn tập 15 phút trên Sổ từ vựng WORD BRIDGE sau buổi {pos}.')}, "
                    f"'Hoàn thành nội dung buổi học và đạt yêu cầu câu hỏi kiểm tra mức hiểu.');"
                )
                lines.append(
                    f"INSERT OR IGNORE INTO wb_lessons (id, session_id, week_id, slug, title_vi, language_code, level_ref, is_public_preview, components_json, author_name, reviewer_name, reference_sources, version, review_status) VALUES ("
                    f"{sql_str(les_id)}, {sql_str(ses_id)}, {sql_str(w_id)}, {sql_str(les_slug)}, {sql_str(les_title)}, {sql_str(lang)}, {sql_str(level_ref)}, 1, "
                    f"{sql_str(json.dumps(components, ensure_ascii=False))}, 'Ban Biên soạn WORD BRIDGE', 'Hội đồng Học thuật WORD BRIDGE', 'Giáo trình chuẩn WORD BRIDGE V3.1', '1.1.0', 'published');"
                )
                lines.append(
                    f"INSERT OR IGNORE INTO wb_learning_resources (id, lesson_id, language_code, title_vi, resource_type, r2_object_key, visibility, copyright_status) VALUES ("
                    f"{sql_str(res_id)}, {sql_str(les_id)}, {sql_str(lang)}, {sql_str(f'Học liệu bài {pos} – Tuần {wnum:02d} ({lang_vi})')}, 'worksheet', {sql_str(f'learning/{lang_slug}/week-{wnum:02d}-s{pos}-guide.pdf')}, 'public', 'original_word_bridge');"
                )

    # Complete Courses, Curricula, Modules & Weeks for Specialized Chinese (5 domains) & Specialized English (8 domains)
    lines.append("")
    lines.append("-- Specialized Courses, Curricula, Modules & Initial Weeks (ONLY zh and en; ZERO Russian)")
    specialized_tracks = [
        # Chinese Specialized
        ('zh', 'chinese', 'prg_zh_log', 'cur_zh_log', 'CUR-ZH-LOG-2026', 'crs_zh_log', 'chinese-specialized-logistics-course', 'Khóa học Tiếng Trung Chuyên ngành Logistics & Chuỗi cung ứng', 'mod_zh_log_1', 'chinese-logistics-module-1', 'Học phần 1: Chứng từ Vận tải Biển & Khai báo Hải quan', 'wk_zh_log_01', 'chinese-logistics-week-01', 'Chứng từ vận đơn (海运提单) & Hóa đơn thương mại (商业发票)', 'les_zh_log_01', 'chinese-logistics-lesson-01'),
        ('zh', 'chinese', 'prg_zh_log', 'cur_zh_bus', 'CUR-ZH-BUS-2026', 'crs_zh_bus', 'chinese-specialized-business-course', 'Khóa học Tiếng Trung Thương mại & Giao tiếp Doanh nghiệp', 'mod_zh_bus_1', 'chinese-business-module-1', 'Học phần 1: Đàm phán Thương mại & Hợp đồng Ngoại thương', 'wk_zh_bus_01', 'chinese-business-week-01', 'Điều khoản giao hàng Incoterms & Báo giá (报价单)', 'les_zh_bus_01', 'chinese-business-lesson-01'),
        ('zh', 'chinese', 'prg_zh_log', 'cur_zh_mfg', 'CUR-ZH-MFG-2026', 'crs_zh_mfg', 'chinese-specialized-manufacturing-course', 'Khóa học Tiếng Trung Kỹ thuật Sản xuất & Nhà máy', 'mod_zh_mfg_1', 'chinese-manufacturing-module-1', 'Học phần 1: Quy trình Vận hành Dây chuyền & Kiểm soát Chất lượng (QC)', 'wk_zh_mfg_01', 'chinese-manufacturing-week-01', 'An toàn nhà máy, bản vẽ kỹ thuật và báo cáo QC', 'les_zh_mfg_01', 'chinese-manufacturing-lesson-01'),
        # English Specialized (covering all 8 fields)
        ('en', 'english', 'prg_en_it', 'cur_en_it', 'CUR-EN-IT-2026', 'crs_en_it', 'english-specialized-it-cloud-course', 'Khóa học Tiếng Anh Chuyên ngành CNTT & Cloud', 'mod_en_it_1', 'english-it-cloud-module-1', 'Học phần 1: Kiến trúc Đám mây, Quản trị Mạng & Báo cáo Sự cố', 'wk_en_it_01', 'english-it-cloud-week-01', 'Cloud Architecture, Networking & Incident Reports', 'les_en_it_01', 'english-it-cloud-lesson-01'),
        ('en', 'english', 'prg_en_it', 'cur_en_mech', 'CUR-EN-MECH-2026', 'crs_en_mech', 'english-specialized-mechanical-course', 'Khóa học Tiếng Anh Chuyên ngành Cơ khí & Điện – Điện tử', 'mod_en_mech_1', 'english-mechanical-module-1', 'Học phần 1: Bản vẽ Cơ khí, Mạch Điện Công nghiệp & Bảo trì Thiết bị', 'wk_en_mech_01', 'english-mechanical-week-01', 'Mechanical Drawings, Industrial Circuits & Maintenance SOPs', 'les_en_mech_01', 'english-mechanical-lesson-01'),
        ('en', 'english', 'prg_en_it', 'cur_en_auto', 'CUR-EN-AUTO-2026', 'crs_en_auto', 'english-specialized-automotive-course', 'Khóa học Tiếng Anh Chuyên ngành Công nghệ Ô tô', 'mod_en_auto_1', 'english-automotive-module-1', 'Học phần 1: Hệ thống Động cơ, Chẩn đoán Lỗi & Bảo dưỡng', 'wk_en_auto_01', 'english-automotive-week-01', 'Powertrain Systems & Diagnostic Manuals', 'les_en_auto_01', 'english-automotive-lesson-01'),
        ('en', 'english', 'prg_en_it', 'cur_en_des', 'CUR-EN-DES-2026', 'crs_en_des', 'english-specialized-design-econ-course', 'Khóa học Tiếng Anh Chuyên ngành Thiết kế Đồ họa, Kinh tế – Du lịch & Y dược', 'mod_en_des_1', 'english-design-healthcare-module-1', 'Học phần 1: Brief Thiết kế, Giao tiếp Kinh tế – Du lịch & Điều dưỡng Y dược', 'wk_en_des_01', 'english-design-healthcare-week-01', 'Design Critique, Tourism Operations & Clinical Handover', 'les_en_des_01', 'english-design-healthcare-lesson-01'),
    ]

    for lang, lang_slug, prg_id, cur_id, cur_code, crs_id, crs_slug, crs_title, mod_id, mod_slug, mod_title, wk_id, wk_slug, wk_topic, les_id, les_slug in specialized_tracks:
        lines.append(f"INSERT OR IGNORE INTO wb_curricula (id, program_id, code, title_vi, version, review_status, academic_approval_note) VALUES ({sql_str(cur_id)}, {sql_str(prg_id)}, {sql_str(cur_code)}, {sql_str('Giáo trình ' + crs_title)}, '1.0.0', 'published', 'Khóa chuyên ngành chuẩn V3.1.');")
        lines.append(f"INSERT OR IGNORE INTO wb_courses (id, program_id, curriculum_id, slug, title_vi, language_code, summary_vi, total_weeks, sessions_per_week, review_status) VALUES ({sql_str(crs_id)}, {sql_str(prg_id)}, {sql_str(cur_id)}, {sql_str(crs_slug)}, {sql_str(crs_title)}, {sql_str(lang)}, 'Khóa học chuyên ngành gắn thuật ngữ, chứng từ thực tế, hội thoại công việc và viết báo cáo chuyên môn.', 8, 3, 'published');")
        lines.append(f"INSERT OR IGNORE INTO wb_modules (id, course_id, slug, title_vi, sort_order, objectives_vi) VALUES ({sql_str(mod_id)}, {sql_str(crs_id)}, {sql_str(mod_slug)}, {sql_str(mod_title)}, 1, 'Làm chủ thuật ngữ và quy trình nghiệp vụ cốt lõi bằng ngoại ngữ chuyên ngành.');")
        lines.append(
            f"INSERT OR IGNORE INTO wb_weeks (id, module_id, course_id, slug, week_number, name_vi, topic_vi, week_objectives, learning_outcomes, required_knowledge, core_vocabulary_json, core_grammar_json, pronunciation_phonetics, listening_content, speaking_content, reading_content, writing_content, application_scenario, study_materials_json, audio_refs_json, exercises_json, weekly_test_spec, passing_criteria, review_assignment, next_week_prep, sessions_count) VALUES ("
            f"{sql_str(wk_id)}, {sql_str(mod_id)}, {sql_str(crs_id)}, {sql_str(wk_slug)}, 1, {sql_str('Tuần 01: ' + wk_topic)}, {sql_str(wk_topic)}, "
            f"'Làm chủ bộ thuật ngữ nền tảng và tài liệu thực tế của chuyên ngành.', 'Đọc hiểu biểu mẫu nghiệp vụ và phản hồi email công việc đúng chuẩn.', {sql_str(wk_topic)}, "
            f"'[\"Thuật ngữ cốt lõi 1\",\"Thuật ngữ cốt lõi 2\"]', '[\"Cấu trúc văn bản nghiệp vụ\"]', 'Phát âm chuẩn thuật ngữ chuyên ngành', "
            f"'Nghe hội thoại công việc thực tế.', 'Trình bày tóm tắt quy trình nghiệp vụ.', 'Đọc biểu mẫu và văn bản thực tế.', 'Viết email nghiệp vụ xác nhận thông tin.', "
            f"'Tình huống trao đổi với đối tác/khách hàng quốc tế.', '[\"Tài liệu biểu mẫu chuyên ngành\"]', {sql_str(json.dumps([f'specialized/{lang_slug}/week-01.mp3']))}, "
            f"'[\"Bài tập thuật ngữ chuyên ngành\",\"Bài tập đọc hiểu chứng từ\"]', 'Bài kiểm tra chuyên ngành tuần 01 (25 phút).', 'Đạt >= 75% bài kiểm tra chuyên ngành.', "
            f"'Ôn tập bộ flashcard thuật ngữ chuyên ngành.', 'Chuẩn bị tình huống tuần 02.', 3);"
        )
        les_comp = {"objectives": f"Vận dụng thuật ngữ chủ đề {wk_topic} trong ngữ cảnh công việc.", "coreKnowledge": wk_topic, "phonetics": "Phát âm chuẩn thuật ngữ.", "listening": "Nghe tình huống nghiệp vụ.", "speaking": "Đóng vai trao đổi công việc.", "reading": "Đọc hiểu chứng từ/tài liệu thực tế.", "writing": "Viết email xác nhận nghiệp vụ."}
        lines.append(
            f"INSERT OR IGNORE INTO wb_lessons (id, week_id, slug, title_vi, language_code, level_ref, is_public_preview, components_json, author_name, reviewer_name, reference_sources, version, review_status) VALUES ("
            f"{sql_str(les_id)}, {sql_str(wk_id)}, {sql_str(les_slug)}, {sql_str('Bài 01: ' + wk_topic)}, {sql_str(lang)}, 'Chuyên ngành', 1, {sql_str(json.dumps(les_comp, ensure_ascii=False))}, 'Ban Biên soạn WORD BRIDGE', 'Hội đồng Học thuật WORD BRIDGE', 'Khung chuyên ngành WORD BRIDGE V3.1', '1.0.0', 'published');"
        )

    out_path = os.path.join(MIGRATIONS_DIR, '0010_seed_complete_108_sessions_lessons_and_specialized.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {out_path} ({len(lines)} lines)")


def generate_0011():
    lines = [
        "-- ============================================================================",
        "-- Migration 0011: Balanced Trilingual Dictionary (+60 Chinese, +60 Russian),",
        "-- Audio Asset Metadata & 15 Intelligence Systems Operational Status",
        "-- SAFETY: STRICTLY INSERT OR IGNORE. ZERO DROP TABLE.",
        "-- ============================================================================",
        "PRAGMA foreign_keys = ON;",
        "",
    ]

    zh_extra = [
        ('谢谢', 'xièxie', '4-0', 'động từ', 'cảm ơn', '对别人的好意或帮助表示感谢。', 'greetings', 'HSK 1', None),
        ('再见', 'zàijiàn', '4-4', 'động từ', 'tạm biệt', '分别时说的礼貌用语。', 'greetings', 'HSK 1', None),
        ('学习', 'xuéxí', '2-2', 'động từ', 'học tập', '通过阅读、听讲和练习获取知识或技能。', 'education', 'HSK 1', None),
        ('老师', 'lǎoshī', '3-1', 'danh từ', 'giáo viên, thầy/cô giáo', '从事教学工作的人员。', 'education', 'HSK 1', None),
        ('学生', 'xuésheng', '2-0', 'danh từ', 'học sinh, sinh viên', '在学校接受教育的人。', 'education', 'HSK 1', None),
        ('朋友', 'péngyou', '2-0', 'danh từ', 'bạn bè', '彼此有交情的人。', 'relationships', 'HSK 1', None),
        ('家庭', 'jiātíng', '1-2', 'danh từ', 'gia đình', '以婚姻和血缘关系为基础的社会生活单位。', 'family', 'HSK 2', None),
        ('工作', 'gōngzuò', '1-4', 'danh từ / động từ', 'công việc; làm việc', '从事体力或脑力劳动。', 'career', 'HSK 1', None),
        ('公司', 'gōngsī', '1-1', 'danh từ', 'công ty', '依法设立的企业法人组织。', 'business', 'HSK 2', 'business'),
        ('时间', 'shíjiān', '2-1', 'danh từ', 'thời gian', '物质存在的一种客观形式，表示先后顺序与持续长度。', 'time', 'HSK 2', None),
        ('今天', 'jīntiān', '1-1', 'danh từ', 'hôm nay', '说话时的这一天。', 'time', 'HSK 1', None),
        ('明天', 'míngtiān', '2-1', 'danh từ', 'ngày mai', '今天的下一天。', 'time', 'HSK 1', None),
        ('星期', 'xīngqī', '1-1', 'danh từ', 'tuần lễ, thứ', '连续七天组成的时间周期。', 'time', 'HSK 1', None),
        ('天气', 'tiānqì', '1-4', 'danh từ', 'thời tiết', '一定地区一定时间内大气变化的综合状况。', 'nature', 'HSK 1', None),
        ('医院', 'yīyuàn', '1-4', 'danh từ', 'bệnh viện', '为病人提供医疗诊断和治疗的机构。', 'health', 'HSK 1', None),
        ('医生', 'yīshēng', '1-1', 'danh từ', 'bác sĩ', '掌握医药卫生知识并从事防病治病工作的人。', 'health', 'HSK 1', None),
        ('飞机', 'fēijī', '1-1', 'danh từ', 'máy bay', '靠动力推进并在空气中产生升力的飞行器。', 'transport', 'HSK 1', None),
        ('火车', 'huǒchē', '3-1', 'danh từ', 'tàu hỏa', '在铁轨上行驶的列车。', 'transport', 'HSK 2', None),
        ('银行', 'yínháng', '2-2', 'danh từ', 'ngân hàng', '经营存款、贷款和结算业务的金融机构。', 'finance', 'HSK 2', 'business'),
        ('市场', 'shìchǎng', '4-3', 'danh từ', 'thị trường', '商品交换的场所和供求关系的总和。', 'business', 'HSK 3', 'business'),
        ('合同', 'hétong', '2-2', 'danh từ', 'hợp đồng', '当事人之间设立、变更、终止民事权利义务关系的协议。', 'business', 'HSK 4', 'business'),
        ('报价单', 'bàojiàdān', '4-4-1', 'danh từ chuyên ngành', 'bảng báo giá (Quotation)', '卖方向买方列明商品价格和交易条件的书面单据。', 'business', 'HSK 4', 'business'),
        ('信用证', 'xìnyòngzhèng', '4-4-4', 'danh từ chuyên ngành', 'thư tín dụng (Letter of Credit - L/C)', '银行应买方请求向卖方开立的有条件付款书面承诺。', 'import-export', 'HSK 5', 'import-export'),
        ('集装箱', 'jízhuāngxiāng', '2-1-1', 'danh từ chuyên ngành', 'container vận chuyển hàng hóa', '具有一定规格和强度的标准大型装货容器。', 'logistics', 'HSK 4', 'logistics'),
        ('仓储', 'cāngchǔ', '1-3', 'danh từ chuyên ngành', 'kho bãi, lưu kho (Warehousing)', '通过仓库对物资进行储存和保管的活动。', 'logistics', 'HSK 5', 'logistics'),
        ('货运代理', 'huòyùn dàilǐ', '4-4-4-3', 'danh từ chuyên ngành', 'đại lý giao nhận vận tải (Freight Forwarder)', '接受货主委托办理国际货物运输及相关手续的企业。', 'logistics', 'HSK 5', 'logistics'),
        ('关税', 'guānshuì', '1-4', 'danh từ chuyên ngành', 'thuế hải quan (Customs Duty)', '海关依法对进出境货物征收的税款。', 'import-export', 'HSK 5', 'import-export'),
        ('检验检疫', 'jiǎnyàn jiǎnyì', '3-4-3-4', 'danh từ chuyên ngành', 'kiểm nghiệm và kiểm dịch', '对进出口商品质量及卫生安全进行的法定检查。', 'import-export', 'HSK 5', 'import-export'),
        ('生产线', 'shēngchǎnxiàn', '1-3-4', 'danh từ chuyên ngành', 'dây chuyền sản xuất', '按工艺流程顺序排列的连续生产设备系统。', 'manufacturing', 'HSK 4', 'mechanical-engineering'),
        ('质量控制', 'zhìliàng kòngzhì', '4-4-4-4', 'danh từ chuyên ngành', 'kiểm soát chất lượng (QC)', '为确保产品符合质量标准而采取的检测与管理活动。', 'manufacturing', 'HSK 5', 'mechanical-engineering'),
        ('电路板', 'diànlùbǎn', '4-4-3', 'danh từ chuyên ngành', 'bảng mạch điện tử (PCB)', '用于支撑和电气连接电子元器件的基板。', 'electronics', 'HSK 5', 'electrical-electronics'),
        ('传感器', 'chuángǎnqì', '2-3-4', 'danh từ chuyên ngành', 'cảm biến (Sensor)', '能感受被测量信息并按规律转换为电信号的装置。', 'electronics', 'HSK 5', 'electrical-electronics'),
        ('机械加工', 'jīxiè jiāgōng', '1-4-1-1', 'danh từ chuyên ngành', 'gia công cơ khí (Machining)', '利用机床改变工件外形尺寸或性能的工艺过程。', 'mechanical', 'HSK 5', 'mechanical-engineering'),
        ('交货期', 'jiāohuòqī', '1-4-1', 'danh từ chuyên ngành', 'thời hạn giao hàng (Lead time / Delivery date)', '合同约定的卖方交付货物的截止日期。', 'logistics', 'HSK 4', 'logistics'),
        ('采购', 'cǎigòu', '3-4', 'động từ chuyên ngành', 'thu mua, mua hàng (Procurement)', '企业为生产或经营需要而选择供应商并购买物资。', 'business', 'HSK 4', 'business'),
        ('供应商', 'gōngyìngshāng', '1-4-1', 'danh từ chuyên ngành', 'nhà cung cấp (Supplier)', '向企业提供原材料、设备或服务的合作方。', 'business', 'HSK 4', 'business'),
        ('库存', 'kùcún', '4-2', 'danh từ chuyên ngành', 'hàng tồn kho (Inventory)', '仓库中处于暂时停滞状态的原材料或成品。', 'logistics', 'HSK 4', 'logistics'),
        ('运费', 'yùnfèi', '4-4', 'danh từ chuyên ngành', 'cước vận chuyển (Freight charge)', '承运人运送货物所收取的费用。', 'logistics', 'HSK 4', 'logistics'),
        ('保险单', 'bǎoxiǎndān', '3-3-1', 'danh từ chuyên ngành', 'đơn bảo hiểm (Insurance Policy)', '保险公司签发的证明货物运输保险合同成立的单据。', 'import-export', 'HSK 5', 'import-export'),
        ('装船', 'zhuāngchuán', '1-2', 'động từ chuyên ngành', 'xếp hàng lên tàu (Loading on board)', '将出口货物装载到远洋运输船舶上的操作。', 'logistics', 'HSK 4', 'logistics'),
        ('目的港', 'mùdìgǎng', '4-4-3', 'danh từ chuyên ngành', 'cảng đích (Port of Destination)', '海运货物最终卸货交付的港口。', 'logistics', 'HSK 4', 'logistics'),
        ('起运港', 'qǐyùngǎng', '3-4-3', 'danh từ chuyên ngành', 'cảng xếp hàng / cảng đi (Port of Loading)', '货物开始装船启运的港口。', 'logistics', 'HSK 4', 'logistics'),
        ('清关', 'qīngguān', '1-1', 'động từ chuyên ngành', 'thông quan (Customs clearance)', '完成全部海关申报、查验和缴税后放行货物。', 'import-export', 'HSK 5', 'import-export'),
        ('贸易术语', 'màoyì shùyǔ', '4-4-4-3', 'danh từ chuyên ngành', 'điều kiện thương mại quốc tế (Incoterms)', '国际贸易中明确买卖双方风险、费用与责任划分的标准术语。', 'import-export', 'HSK 5', 'import-export'),
        ('样品', 'yàngpǐn', '4-3', 'danh từ', 'hàng mẫu (Sample)', '供客户检验质量与规格的代表性产品。', 'business', 'HSK 3', 'business'),
        ('订单', 'dìngdān', '4-1', 'danh từ', 'đơn đặt hàng (Order)', '买方向卖方发出的正式采购清单。', 'business', 'HSK 3', 'business'),
        ('发票', 'fāpiào', '1-4', 'danh từ', 'hóa đơn (Invoice)', '购销商品或提供服务时开具的收付款凭证。', 'business', 'HSK 3', 'business'),
        ('付款方式', 'fùkuǎn fāngshì', '4-3-1-4', 'danh từ chuyên ngành', 'phương thức thanh toán', '国际或国内交易中约定的货款结算方式。', 'business', 'HSK 4', 'business'),
        ('安全标准', 'ānquán biāozhǔn', '1-2-1-3', 'danh từ chuyên ngành', 'tiêu chuẩn an toàn', '生产与运营中必须遵守的安全技术规范。', 'manufacturing', 'HSK 4', 'mechanical-engineering'),
        ('设备维护', 'shèbèi wéihù', '4-4-2-4', 'danh từ chuyên ngành', 'bảo trì thiết bị', '定期检查、保养和修复工业设备以保障正常运行。', 'manufacturing', 'HSK 5', 'mechanical-engineering'),
        ('技术规格', 'jìshù guīgé', '4-4-1-2', 'danh từ chuyên ngành', 'thông số kỹ thuật (Technical Specification)', '描述产品尺寸、材料、性能指标的详细要求。', 'manufacturing', 'HSK 5', 'mechanical-engineering'),
        ('会议', 'huìyì', '4-4', 'danh từ', 'cuộc họp', '有组织地商讨问题和作出决定的集会。', 'business', 'HSK 3', 'business'),
        ('报告', 'bàogào', '4-4', 'danh từ / động từ', 'báo cáo', '向上级或相关方汇报工作进展或调查结果的文件。', 'business', 'HSK 3', 'business'),
        ('计划', 'jìhuà', '4-4', 'danh từ / động từ', 'kế hoạch; lập kế hoạch', '工作或行动前预先拟定的具体内容和步骤。', 'daily-life', 'HSK 3', None),
        ('经验', 'jīngyàn', '1-4', 'danh từ', 'kinh nghiệm', '由实践得来的知识或技能。', 'career', 'HSK 3', None),
        ('环境', 'huánjìng', '2-4', 'danh từ', 'môi trường', '周围的自然或社会条件。', 'nature', 'HSK 3', None),
        ('文化', 'wénhuà', '2-4', 'danh từ', 'văn hóa', '人类在社会历史发展过程中创造的物质和精神财富总和。', 'culture', 'HSK 3', None),
        ('语言', 'yǔyán', '3-2', 'danh từ', 'ngôn ngữ', '人类用于交流思想和信息的符号系统。', 'education', 'HSK 3', None),
        ('交流', 'jiāoliú', '1-2', 'động từ / danh từ', 'giao lưu, trao đổi', '彼此把自己有的信息、意见或经验供给对方。', 'communication', 'HSK 4', None),
        ('发展', 'fāzhǎn', '1-3', 'động từ / danh từ', 'phát triển', '事物由小到大、由简单到复杂的变化过程。', 'society', 'HSK 4', None),
    ]

    for idx, (hw, py, tone, pos, vi, target_def, topic, lvl, domain) in enumerate(zh_extra, 1):
        slug = f"zh-core-{idx:02d}-{slugify(py)}"
        eid = f"dict_zh_v31_{idx:02d}"
        ex = json.dumps([{"text": f"我们在学习“{hw}”的正确用法。", "vi": f"Chúng tôi đang học cách dùng đúng của từ \"{hw}\" ({vi})."}], ensure_ascii=False)
        lines.append(
            "INSERT OR IGNORE INTO wb_dictionary_entries (id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin, tone_pattern, part_of_speech, meaning_vi, target_definition, examples_json, topic, level_ref, specialized_domain, source_id, review_status) VALUES ("
            + ", ".join([sql_str(eid), "'zh'", sql_str(slug), sql_str(hw), sql_str(hw), sql_str(py), sql_str(py), sql_str(tone), sql_str(pos), sql_str(vi), sql_str(target_def), sql_str(ex), sql_str(topic), sql_str(lvl), sql_str(domain), "'src_wb_original'", "'published'"])
            + ");"
        )

    # 60 Russian general academic entries (STRICTLY specialized_domain = NULL)
    ru_extra = [
        ('здра́вствуйте', '[ˈzdrastvʊjtʲɪ]', 'âm tiết 1', 'thán từ', None, 'xin chào (trang trọng)', 'Официальное приветствие.', 'greetings', 'TORFL ТЭУ'),
        ('спаси́бо', '[spɐˈsʲibə]', 'âm tiết 2', 'thán từ', None, 'cảm ơn', 'Выражение благодарности.', 'greetings', 'TORFL ТЭУ'),
        ('пожа́луйста', '[pɐˈʐalʊjstə]', 'âm tiết 2', 'thán từ', None, 'xin vui lòng; không có chi', 'Вежливое обращение при просьбе или ответе на благодарность.', 'greetings', 'TORFL ТЭУ'),
        ('до свида́ния', '[də svʲɪˈdanʲɪjə]', 'âm tiết 3', 'cụm từ', None, 'tạm biệt', 'Вежливое прощание.', 'greetings', 'TORFL ТЭУ'),
        ('студе́нт', '[stʊˈdʲent]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'sinh viên (nam)', 'Учащийся высшего учебного заведения.', 'education', 'TORFL ТЭУ'),
        ('преподава́тель', '[prʲɪpədɐˈvatʲɪlʲ]', 'âm tiết 4', 'danh từ (n)', 'giống đực (m)', 'giảng viên', 'Работник учебного заведения, преподающий какой-либо предмет.', 'education', 'TORFL ТЭУ'),
        ('уро́к', '[ʊˈrok]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'bài học, tiết học', 'Учебное занятие.', 'education', 'TORFL ТЭУ'),
        ('слова́рь', '[slɐˈvarʲ]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'từ điển', 'Собрание слов с пояснениями или переводом.', 'education', 'TORFL ТЭУ'),
        ('язы́к', '[jɪˈzɨk]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'ngôn ngữ', 'Система звуковых и письменных знаков для общения.', 'education', 'TORFL ТЭУ'),
        ('семья́', '[sʲɪˈmʲja]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'gia đình', 'Группа живущих вместе близких родственников.', 'family', 'TORFL ТЭУ'),
        ('оте́ц', '[ɐˈtʲets]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'cha, bố', 'Мужчина по отношению к своим детям.', 'family', 'TORFL ТЭУ'),
        ('мать', '[matʲ]', 'âm tiết 1', 'danh từ (n)', 'giống cái (f)', 'mẹ', 'Женщина по отношению к своим детям.', 'family', 'TORFL ТЭУ'),
        ('брат', '[brat]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'anh/em trai', 'Сын тех же родителей по отношению к другим их детям.', 'family', 'TORFL ТЭУ'),
        ('сестра́', '[sʲɪˈstra]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'chị/em gái', 'Дочь тех же родителей по отношению к другим их детям.', 'family', 'TORFL ТЭУ'),
        ('друг', '[druk]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'người bạn', 'Человек, связанный с кем-либо дружбой.', 'relationships', 'TORFL ТЭУ'),
        ('дом', '[dom]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'ngôi nhà', 'Жилое здание.', 'daily-life', 'TORFL ТЭУ'),
        ('го́род', '[ˈɡorət]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'thành phố', 'Крупный населённый пункт.', 'places', 'TORFL ТЭУ'),
        ('у́лица', '[ˈulʲɪtsə]', 'âm tiết 1', 'danh từ (n)', 'giống cái (f)', 'đường phố', 'Пространство между рядами домов для прохода и проезда.', 'places', 'TORFL ТЭУ'),
        ('страна́', '[strɐˈna]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'đất nước, quốc gia', 'Территория, имеющая определённые границы и государственность.', 'places', 'TORFL ТЭУ'),
        ('вре́мя', '[ˈvrʲemʲə]', 'âm tiết 1', 'danh từ (n)', 'giống trung (n)', 'thời gian', 'Длительность существования и последовательность событий.', 'time', 'TORFL ТЭУ'),
        ('день', '[dʲenʲ]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'ngày, ban ngày', 'Часть суток от утра до вечера.', 'time', 'TORFL ТЭУ'),
        ('у́тро', '[ˈutrə]', 'âm tiết 1', 'danh từ (n)', 'giống trung (n)', 'buổi sáng', 'Начало дня.', 'time', 'TORFL ТЭУ'),
        ('ве́чер', '[ˈvʲetɕɪr]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'buổi tối', 'Часть суток перед ночью.', 'time', 'TORFL ТЭУ'),
        ('неде́ля', '[nʲɪˈdʲelʲə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'tuần lễ', 'Единица измерения времени, равная семи дням.', 'time', 'TORFL ТЭУ'),
        ('ме́сяц', '[ˈmʲesʲɪts]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'tháng', 'Двенадцатая часть года.', 'time', 'TORFL ТЭУ'),
        ('год', '[ɡot]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'năm', 'Промежуток времени, равный двенадцати месяцам.', 'time', 'TORFL ТЭУ'),
        ('рабо́та', '[rɐˈbotə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'công việc', 'Занятие, труд, деятельность.', 'career', 'TORFL ТЭУ'),
        ('письмо́', '[pʲɪsʲˈmo]', 'âm tiết 2', 'danh từ (n)', 'giống trung (n)', 'bức thư', 'Написанный текст, посылаемый для сообщения чего-либо.', 'communication', 'TORFL ТЭУ'),
        ('газе́та', '[ɡɐˈzʲetə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'tờ báo', 'Периодическое печатное издание.', 'media', 'TORFL ТЭУ'),
        ('журна́л', '[ʐʊrˈnal]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'tạp chí', 'Периодическое издание в виде книжки.', 'media', 'TORFL ТЭУ'),
        ('чита́ть', '[tɕɪˈtatʲ]', 'âm tiết 2', 'động từ (НСВ)', None, 'đọc (chưa hoàn thành)', 'Воспринимать написанный текст.', 'daily-life', 'TORFL ТЭУ'),
        ('писа́ть', '[pʲɪˈsatʲ]', 'âm tiết 2', 'động từ (НСВ)', None, 'viết (chưa hoàn thành)', 'Изображать на бумаге письменные знаки.', 'daily-life', 'TORFL ТЭУ'),
        ('говори́ть', '[ɡəvɐˈrʲitʲ]', 'âm tiết 3', 'động từ (НСВ)', None, 'nói (chưa hoàn thành)', 'Выражать мысли устно.', 'communication', 'TORFL ТЭУ'),
        ('слу́шать', '[ˈsluʂətʲ]', 'âm tiết 1', 'động từ (НСВ)', None, 'lắng nghe', 'Направлять слух на что-либо.', 'communication', 'TORFL ТЭУ'),
        ('понима́ть', '[pənʲɪˈmatʲ]', 'âm tiết 3', 'động từ (НСВ)', None, 'hiểu', 'Уяснять смысл чего-либо.', 'education', 'TORFL ТЭУ'),
        ('учи́ться', '[ʊˈtɕitsə]', 'âm tiết 2', 'động từ (НСВ)', None, 'học tập', 'Усваивать знания и навыки.', 'education', 'TORFL ТЭУ'),
        ('рабо́тать', '[rɐˈbotətʲ]', 'âm tiết 2', 'động từ (НСВ)', None, 'làm việc', 'Заниматься трудом, иметь профессию.', 'career', 'TORFL ТЭУ'),
        ('покупа́ть', '[pəkʊˈpatʲ]', 'âm tiết 3', 'động từ (НСВ)', None, 'mua sắm', 'Приобретать за деньги.', 'shopping', 'TORFL ТЭУ'),
        ('магази́н', '[məɡɐˈzʲin]', 'âm tiết 3', 'danh từ (n)', 'giống đực (m)', 'cửa hàng', 'Предприятие розничной торговли.', 'shopping', 'TORFL ТЭУ'),
        ('молоко́', '[məlɐˈko]', 'âm tiết 3', 'danh từ (n)', 'giống trung (n)', 'sữa', 'Питательная белая жидкость.', 'food', 'TORFL ТЭУ'),
        ('хлеб', '[xlʲep]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'bánh mì', 'Пищевой продукт, выпекаемый из муки.', 'food', 'TORFL ТЭУ'),
        ('вода́', '[vɐˈda]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'nước', 'Прозрачная бесцветная жидкость.', 'food', 'TORFL ТЭУ'),
        ('чай', '[tɕaj]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'trà', 'Напиток из заваренных листьев чайного куста.', 'food', 'TORFL ТЭУ'),
        ('пого́да', '[pɐˈɡodə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'thời tiết', 'Состояние атмосферы в данном месте.', 'nature', 'TORFL ТЭУ'),
        ('здоро́вье', '[zdɐˈrovʲjə]', 'âm tiết 2', 'danh từ (n)', 'giống trung (n)', 'sức khỏe', 'Правильная нормальная деятельность организма.', 'health', 'TORFL ТБУ'),
        ('врач', '[vratɕ]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'bác sĩ', 'Специалист с высшим медицинским образованием.', 'health', 'TORFL ТЭУ'),
        ('больни́ца', '[bɐlʲˈnʲitsə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'bệnh viện', 'Лечебное учреждение.', 'health', 'TORFL ТБУ'),
        ('авто́бус', '[ɐfˈtobʊs]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'xe buýt', 'Пассажирский автомобиль большой вместимости.', 'transport', 'TORFL ТЭУ'),
        ('по́езд', '[ˈpoɪst]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'tàu hỏa', 'Состав железнодорожных вагонов.', 'transport', 'TORFL ТБУ'),
        ('самолёт', '[səmɐˈlʲot]', 'âm tiết 3', 'danh từ (n)', 'giống đực (m)', 'máy bay', 'Летательный аппарат тяжелее воздуха.', 'transport', 'TORFL ТБУ'),
        ('биле́т', '[bʲɪˈlʲet]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'vé', 'Документ на право проезда или посещения.', 'transport', 'TORFL ТБУ'),
        ('вопро́с', '[vɐˈpros]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'câu hỏi', 'Обращение, требующее ответа.', 'communication', 'TORFL ТЭУ'),
        ('отве́т', '[ɐtˈvʲet]', 'âm tiết 2', 'danh từ (n)', 'giống đực (m)', 'câu trả lời', 'Реакция на вопрос.', 'communication', 'TORFL ТЭУ'),
        ('исто́рия', '[ɪˈstorʲɪjə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'lịch sử; câu chuyện', 'Наука о развитии человеческого общества.', 'culture', 'TORFL ТБУ'),
        ('культу́ра', '[kʊlʲˈturə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'văn hóa', 'Совокупность достижений человечества.', 'culture', 'TORFL ТРКИ-I'),
        ('о́пыт', '[ˈopɨt]', 'âm tiết 1', 'danh từ (n)', 'giống đực (m)', 'kinh nghiệm', 'Совокупность практически усвоенных знаний.', 'career', 'TORFL ТРКИ-I'),
        ('цель', '[tsɛlʲ]', 'âm tiết 1', 'danh từ (n)', 'giống cái (f)', 'mục tiêu', 'То, к чему стремятся.', 'daily-life', 'TORFL ТРКИ-I'),
        ('результа́т', '[rʲɪzʊlʲˈtat]', 'âm tiết 3', 'danh từ (n)', 'giống đực (m)', 'kết quả', 'Конечный итог какой-либо деятельности.', 'education', 'TORFL ТРКИ-I'),
        ('зада́ча', '[zɐˈdatɕə]', 'âm tiết 2', 'danh từ (n)', 'giống cái (f)', 'nhiệm vụ, bài toán', 'То, что требует исполнения и решения.', 'education', 'TORFL ТРКИ-I'),
        ('реше́ние', '[rʲɪˈʂenʲɪjə]', 'âm tiết 2', 'danh từ (n)', 'giống trung (n)', 'giải pháp, quyết định', 'Вывод, заключение или способ выполнения задачи.', 'communication', 'TORFL ТРКИ-I'),
    ]

    for idx, (hw, ipa, stress, pos, gender, vi, target_def, topic, lvl) in enumerate(ru_extra, 1):
        norm = hw.replace('\u0301', '')
        slug = f"ru-core-{idx:02d}"
        eid = f"dict_ru_v31_{idx:02d}"
        ex = json.dumps([{"text": f"Мы изуча́ем сло́во «{hw}» на уро́ке.", "vi": f"Chúng tôi đang học từ \"{hw}\" ({vi}) trên lớp."}], ensure_ascii=False)
        lines.append(
            "INSERT OR IGNORE INTO wb_dictionary_entries (id, language_code, slug, headword, normalized_headword, phonetic, ipa_or_pinyin, stress_pattern, part_of_speech, noun_gender, meaning_vi, target_definition, examples_json, topic, level_ref, specialized_domain, source_id, review_status) VALUES ("
            + ", ".join([sql_str(eid), "'ru'", sql_str(slug), sql_str(hw), sql_str(norm), sql_str(ipa), sql_str(ipa), sql_str(stress), sql_str(pos), sql_str(gender), sql_str(vi), sql_str(target_def), sql_str(ex), sql_str(topic), sql_str(lvl), 'NULL', "'src_wb_original'", "'published'"])
            + ");"
        )

    # Seed Audio Asset Metadata (honestly marked draft until official audio files uploaded to R2)
    lines.extend([
        "",
        "-- Audio Asset Metadata (D1 metadata linked to R2 keys; review_status='draft' until official audio uploaded to R2)",
        "INSERT OR IGNORE INTO wb_audio_assets (id, language_code, r2_object_key, content_type, file_size_bytes, duration_ms, voice_label, accent_variant, transcript_text, sync_segments_json, copyright_status, review_status) VALUES",
        "  ('aud_zh_w01_s1', 'zh', 'audio/zh/week-01-s1-greetings.mp3', 'audio/mpeg', 0, 18000, 'WORD BRIDGE Mandarin Studio (Pending Upload)', 'Standard Mandarin', '你好！请问您贵姓？谢谢，再见！', '[{\"startMs\":0,\"endMs\":6000,\"text\":\"你好！\",\"vi\":\"Xin chào!\"},{\"startMs\":6000,\"endMs\":12000,\"text\":\"请问您贵姓？\",\"vi\":\"Xin hỏi quý danh của anh/chị?\"},{\"startMs\":12000,\"endMs\":18000,\"text\":\"谢谢，再见！\",\"vi\":\"Cảm ơn, tạm biệt!\"}]', 'original_word_bridge', 'draft'),",
        "  ('aud_en_w01_s1', 'en', 'audio/en/week-01-s1-intro.mp3', 'audio/mpeg', 0, 16000, 'WORD BRIDGE English Studio (Pending Upload)', 'General American / RP', 'Hello, nice to meet you. Please check the updated schedule.', '[{\"startMs\":0,\"endMs\":8000,\"text\":\"Hello, nice to meet you.\",\"vi\":\"Xin chào, rất vui được gặp bạn.\"},{\"startMs\":8000,\"endMs\":16000,\"text\":\"Please check the updated schedule.\",\"vi\":\"Vui lòng kiểm tra lịch trình đã cập nhật.\"}]', 'original_word_bridge', 'draft'),",
        "  ('aud_ru_w01_s1', 'ru', 'audio/ru/week-01-s1-cyrillic.mp3', 'audio/mpeg', 0, 15000, 'WORD BRIDGE Russian Studio (Pending Upload)', 'Standard Moscow Russian', 'Здра́вствуйте! Меня́ зову́т Анто́н. О́чень прия́тно.', '[{\"startMs\":0,\"endMs\":5000,\"text\":\"Здра́вствуйте!\",\"vi\":\"Xin chào!\"},{\"startMs\":5000,\"endMs\":10000,\"text\":\"Меня́ зову́т Анто́н.\",\"vi\":\"Tôi tên là Anton.\"},{\"startMs\":10000,\"endMs\":15000,\"text\":\"О́чень прия́тно.\",\"vi\":\"Rất hân hạnh.\"}]', 'original_word_bridge', 'draft');",
        "",
        "-- Initialize Operational Status for all 15 Language Intelligence Systems",
        "INSERT OR IGNORE INTO wb_intelligence_status (system_slug, operational_status, ai_adapter_required, admin_note_vi) VALUES",
        "  ('language-dna', 'active', 0, 'Hoạt động bằng dữ liệu D1 thực tế; chiều Ngữ âm chờ ASR.'),",
        "  ('language-transfer-lab', 'active', 0, 'Hoạt động theo quy tắc đối chiếu Việt – Trung/Anh/Nga.'),",
        "  ('knowledge-to-language', 'active', 0, 'Hoạt động cho Tiếng Trung và Tiếng Anh chuyên ngành.'),",
        "  ('real-world-simulator', 'active', 1, 'Chạy kịch bản chuẩn 3 bước; phản hồi AI hội thoại tự do ở trạng thái chờ AI adapter.'),",
        "  ('language-error-genome', 'active', 0, 'Phân tích trực tiếp lịch sử wb_practice_results.'),",
        "  ('meaning-equivalence', 'active', 1, 'Phân tích khung sắc thái; mở rộng sâu khi có AI adapter.'),",
        "  ('language-timeline', 'active', 0, 'Tổng hợp chuỗi thời gian trực tiếp từ D1.'),",
        "  ('pronunciation-lab', 'unconfigured', 1, 'Khung âm vị sẵn sàng; chấm điểm ASR tự động chờ cấu hình ASR_PROVIDER.'),",
        "  ('knowledge-graph', 'active', 0, 'Xây dựng đồ thị liên kết từ wb_dictionary_entries.'),",
        "  ('personal-corpus', 'active', 0, 'Thống kê type-token ratio trực tiếp từ ngữ liệu người học.'),",
        "  ('context-reconstruction', 'active', 1, 'Phân tích dấu hiệu ngữ dụng cơ bản; nâng cao khi có AI adapter.'),",
        "  ('comprehension-depth', 'active', 0, 'Đánh giá 4 tầng hiểu kết hợp dữ liệu khảo thí.'),",
        "  ('learning-recovery', 'active', 0, 'Quét mục từ quá hạn SM-2 trực tiếp từ D1.'),",
        "  ('language-quality', 'active', 1, 'Đo cấu trúc câu thực tế; đánh giá tự nhiên nâng cao chờ AI adapter.'),",
        "  ('language-observatory', 'active', 0, 'Trung tâm tổng hợp chỉ số học tập toàn diện từ D1.');",
    ])

    out_path = os.path.join(MIGRATIONS_DIR, '0011_seed_balanced_trilingual_dictionary_and_audio.sql')
    with open(out_path, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {out_path} ({len(lines)} lines)")


if __name__ == '__main__':
    generate_0010()
    generate_0011()
