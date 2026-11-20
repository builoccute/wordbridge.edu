#!/usr/bin/env python3
"""
WORD BRIDGE V3.2 — Safe Curriculum Content Enrichment (Migration 0012)
Replaces all generic placeholder tokens (e.g. 'Từ trọng tâm ZH W03-S3-A') in
wb_study_sessions and wb_lessons with real, topic-matched Chinese, English,
and Russian vocabulary, grammar formulas, phonetic notes, and examples across
all 36 weeks (108 sessions & 108 lessons). Strictly non-destructive UPDATEs.
"""
import json
import os

REPO_ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
OUT_PATH = os.path.join(REPO_ROOT, 'database', 'migrations', '0012_v32_real_curriculum_content.sql')


def sql_str(val):
    return "'" + str(val).replace("'", "''") + "'"


CURRICULUM_BANK = {
    'zh': [
        (['你好 (nǐ hǎo)', '谢谢 (xièxie)', '再见 (zàijiàn)', '请问 (qǐngwèn)'], ['Cấu trúc chào hỏi cơ bản', 'Biến điệu thanh 3: 3+3 → 2+3'], '你好，请问您贵姓？ — Xin chào, xin hỏi quý danh của anh/chị?'),
        (['我 (wǒ)', '你 (nǐ)', '叫 (jiào)', '越南 (Yuènán)'], ['S + 叫 + Tên', 'S + 是 + Quốc tịch'], '我叫明，我是越南人。 — Tôi tên là Minh, tôi là người Việt Nam.'),
        (['一 (yī)', '十 (shí)', '岁 (suì)', '电话 (diànhuà)'], ['Hỏi tuổi: 你今年多大？', 'Đọc số điện thoại (1 đọc yāo)'], '我的电话号码是0912-345-678。 — Số điện thoại của tôi là 0912-345-678.'),
        (['家 (jiā)', '爸爸 (bàba)', '妈妈 (māma)', '口 (kǒu)'], ['Sở hữu với 的', 'Lượng từ 口 cho thành viên gia đình'], '我家有四口人。 — Gia đình tôi có bốn người.'),
        (['学生 (xuésheng)', '老师 (lǎoshī)', '工作 (gōngzuò)', '公司 (gōngsī)'], ['Câu hỏi với 什么 / 哪儿', 'Động từ 在 + địa điểm'], '我在胡志明市的一家公司工作。 — Tôi làm việc tại một công ty ở TP.HCM.'),
        (['点 (diǎn)', '分 (fēn)', '今天 (jīntiān)', '星期 (xīngqī)'], ['Trạng từ thời gian đứng trước động từ', 'Cách nói giờ: 八点半'], '我们星期一上午九点开会。 — Chúng tôi họp lúc 9 giờ sáng thứ Hai.'),
        (['多少钱 (duōshao qián)', '块 (kuài)', '买 (mǎi)', '喝茶 (hē chá)'], ['Hỏi giá: 这个多少钱？', 'Cấu trúc 想买 + số lượng + lượng từ'], '请问这杯茶多少钱？ — Xin hỏi ly trà này bao nhiêu tiền?'),
        (['前面 (qiánmiàn)', '左边 (zuǒbiān)', '坐车 (zuò chē)', '怎么走 (zěnme zǒu)'], ['A 在 B 的 + phương vị từ', 'Hỏi đường: 去...怎么走？'], '请问去火车站怎么走？ — Xin hỏi đi đến ga tàu hỏa đi thế nào?'),
        (['起床 (qǐchuáng)', '上班 (shàngbān)', '吃饭 (chīfàn)', '睡觉 (shuìjiào)'], ['Trật tự câu: Thời gian + Địa điểm + Động từ', 'Phó từ 每天 / 常'], '我每天早上六点半起床。 — Mỗi sáng tôi thức dậy lúc 6 giờ 30.'),
        (['喜欢 (xǐhuan)', '会 (huì)', '能 (néng)', '想 (xiǎng)'], ['Phân biệt động từ năng nguyện 想 / 会 / 能', 'Câu hỏi chính phản: 会不会'], '我会说汉语和英语。 — Tôi biết nói tiếng Trung và tiếng Anh.'),
        (['身体 (shēntǐ)', '头疼 (tóuténg)', '医生 (yīshēng)', '休息 (xiūxi)'], ['Trợ từ 了 biểu thị thay đổi trạng thái', 'Khuyên nhủ với 应该 / 多'], '你应该多喝水，好好休息。 — Bạn nên uống nhiều nước và nghỉ ngơi cho tốt.'),
        (['复习 (fùxí)', '考试 (kǎoshì)', '练习 (liànxí)', '进步 (jìnbù)'], ['Tổng hợp mẫu câu khẳng định, phủ định, nghi vấn HSK 1'], '经过十二周的学习，我的汉语进步很大。 — Sau 12 tuần học, tiếng Trung của tôi tiến bộ rất nhiều.'),
    ],
    'en': [
        (['hello', 'introduce', 'pronounce', 'alphabet'], ['Subject pronouns + be (am/is/are)', 'Basic greeting patterns'], 'Hello, my name is Lan. Nice to meet you.'),
        (['nationality', 'occupation', 'email', 'address'], ['Wh-questions: What / Where / Who', 'Possessive adjectives (my/your/his/her)'], 'Where are you from and what do you do?'),
        (['routine', 'usually', 'commute', 'schedule'], ['Present Simple (+ / - / ?)', 'Adverbs of frequency before main verbs'], 'She usually commutes to work at 7:30 AM.'),
        (['sibling', 'colleague', 'friendly', 'supportive'], ['Possessive case (\'s)', 'Have / Has for family descriptions'], 'My older brother is a supportive colleague.'),
        (['appointment', 'deadline', 'quarter past', 'calendar'], ['Prepositions of time: at / on / in', 'Telling exact time'], 'The project meeting starts at 9:15 on Monday.'),
        (['receipt', 'discount', 'beverage', 'ingredient'], ['Countable vs. Uncountable nouns', 'How much / How many / Some / Any'], 'How much is this fresh orange juice?'),
        (['intersection', 'opposite', 'straight ahead', 'landmark'], ['Prepositions of place (next to, opposite, between)', 'Imperatives for directions'], 'Go straight ahead and turn left at the second intersection.'),
        (['journey', 'memorable', 'attend', 'discover'], ['Past Simple (regular -ed & irregular verbs)', 'Past time markers'], 'Last week, we attended a memorable workshop in Da Nang.'),
        (['intention', 'arrange', 'objective', 'upcoming'], ['Be going to vs. Present Continuous for plans', 'Will for spontaneous decisions'], 'We are going to review the curriculum next Friday.'),
        (['symptom', 'nutrition', 'exercise', 'recovery'], ['Modal verbs: should / shouldn\'t / must', 'Giving health advice'], 'You should get enough sleep for a faster recovery.'),
        (['clarify', 'confirm', 'solution', 'feedback'], ['Polite requests: Could you...? / Would you mind...?', 'Checking comprehension'], 'Could you clarify the delivery schedule in your email?'),
        (['assessment', 'proficiency', 'summary', 'fluency'], ['Integrated review of tenses, modals and prepositions (CEFR A1)'], 'Consistent daily practice builds measurable language proficiency.'),
    ],
    'ru': [
        (['приве́т', 'да', 'нет', 'спаси́бо'], ['33 chữ cái Cyrillic in/viết tay', 'Phân biệt âm cứng và âm mềm cơ bản'], 'Приве́т! Спаси́бо за по́мощь. — Chào bạn! Cảm ơn vì sự giúp đỡ.'),
        (['молоко́', 'хорошо́', 'го́род', 'окно́'], ['Giảm âm nguyên âm о không nhấn (аканье)', 'Vô thanh hóa phụ âm cuối'], 'Э́то большо́й и краси́вый го́род. — Đây là một thành phố lớn và đẹp.'),
        (['здра́вствуйте', 'меня́ зову́т', 'о́чень прия́тно', 'до свида́ния'], ['Đại từ nhân xưng я/ты/он/она/мы/вы/они', 'Cấu trúc Меня́ зову́т...'], 'Здра́вствуйте! Меня́ зову́т Анто́н. — Xin chào! Tôi tên là Anton.'),
        (['студе́нт', 'кни́га', 'письмо́', 'но́вый'], ['3 giống danh từ (đực, cái, trung)', 'Cách 1 (Имени́тельный паде́ж)'], 'Э́то но́вая интере́сная кни́га. — Đây là một quyển sách mới thú vị.'),
        (['оди́н', 'де́сять', 'год', 'телефо́н'], ['Số đếm 1–100', 'Hỏi tuổi: Ско́лько вам лет?'], 'Мой но́мер телефо́на про́ст. — Số điện thoại của tôi rất đơn giản.'),
        (['чита́ть', 'покупа́ть', 'журна́л', 'газе́ту'], ['Cách 4 (Вини́тельный паде́ж): giống cái -а → -у, -я → -ю'], 'Я чита́ю ру́сскую газе́ту ка́ждое у́тро. — Tôi đọc báo tiếng Nga mỗi sáng.'),
        (['семья́', 'брат', 'сестра́', 'у меня́ есть'], ['Đại từ sở hữu мой/моя́/моё', 'Cấu trúc sở hữu У меня́ есть...'], 'У меня́ есть ста́рший брат и мла́дшая сестра́. — Tôi có một anh trai và một em gái.'),
        (['университе́т', 'рабо́та', 'в го́роде', 'на уро́ке'], ['Cách 6 (Предло́жный паде́ж) với giới từ в / на'], 'Мы у́чимся в университе́те в Москве́. — Chúng tôi học tại trường đại học ở Moscow.'),
        (['де́лать/сде́лать', 'писа́ть/написа́ть', 'говори́ть', 'понима́ть'], ['Chia động từ nhóm I & II', 'Cặp thể chưa hoàn thành (НСВ) & hoàn thành (СВ)'], 'Я хорошо́ понима́ю, когда́ вы говори́те ме́дленно. — Tôi hiểu rõ khi bạn nói chậm.'),
        (['у́тром', 'днём', 'ве́чером', 'рабо́тать'], ['Trạng từ chỉ thời điểm trong ngày', 'Thì hiện tại và quá khứ'], 'У́тром я слу́шаю а́удио, а ве́чером пишу́ упражне́ния. — Buổi sáng tôi nghe audio, buổi tối tôi làm bài tập viết.'),
        (['ско́лько сто́ит', 'извини́те', 'где нахо́дится', 'пожа́луйста'], ['Mẫu câu hỏi đường, hỏi giá và yêu cầu lịch sự'], 'Извини́те, где нахо́дится ближайшая ста́нция метро́? — Xin lỗi, ga tàu điện ngầm gần nhất ở đâu?'),
        (['результа́т', 'зада́ча', 'о́пыт', 'цель'], ['Tổng ôn Cách 1, 4, 6, giống danh từ và chia động từ TORFL ТЭУ'], 'Наша цель — уве́ренно говори́ть и чита́ть по-ру́сски. — Mục tiêu của chúng ta là tự tin nói và đọc tiếng Nga.'),
    ],
}


def build_migration_0012():
    lines = [
        "-- ============================================================================",
        "-- Migration 0012: V3.2 Real Curriculum Content Enrichment (Zero Placeholders)",
        "-- Replaces generic session/lesson placeholder labels with authentic, topic-matched",
        "-- Chinese, English, and Russian vocabulary, grammar, and examples across all 108",
        "-- study sessions and 108 foundation lessons. STRICTLY NON-DESTRUCTIVE.",
        "-- ============================================================================",
        "PRAGMA foreign_keys = ON;",
        "",
    ]

    lang_labels = {'zh': 'Tiếng Trung', 'en': 'Tiếng Anh', 'ru': 'Tiếng Nga'}

    for lang, weeks in CURRICULUM_BANK.items():
        for w_idx, (vocab, grammar, example) in enumerate(weeks, 1):
            for pos in (1, 2, 3):
                ses_id = f"ses_{lang}_{w_idx:02d}_{pos}"
                les_id = f"les_{lang}_{w_idx:02d}_{pos}"
                # Give each of the 3 sessions in a week distinct vocabulary slice & focus
                s_vocab = vocab[:2] if pos == 1 else (vocab[2:] if pos == 2 else vocab)
                s_focus = (
                    f"Buổi 1 — Ngữ âm & Từ vựng nền tảng ({', '.join(s_vocab)})" if pos == 1
                    else f"Buổi 2 — Ngữ pháp ứng dụng ({grammar[0]}) & Nghe–Đọc" if pos == 2
                    else f"Buổi 3 — Thực hành Nói–Viết tổng hợp & Kiểm tra tuần {w_idx:02d}"
                )
                comp = {
                    "objectives": f"Tuần {w_idx:02d} ({lang_labels[lang]}) — {s_focus}.",
                    "coreKnowledge": f"Trọng tâm học thuật: {grammar[0]}. Ví dụ chuẩn: {example}",
                    "newVocabulary": s_vocab,
                    "grammar": grammar,
                    "phonetics": f"Luyện phát âm chuẩn các từ {', '.join(s_vocab)} theo đặc trưng ngữ âm {lang_labels[lang]}.",
                    "examples": [example],
                    "context": f"Tình huống giao tiếp thực tế áp dụng mẫu câu: {example}",
                    "listening": f"Nghe đoạn hội thoại chuẩn tốc độ 0.75x → 1.0x chứa các từ {', '.join(s_vocab)}.",
                    "speaking": f"Đọc thành tiếng câu mẫu \"{example}\" và tự tạo 2 câu tương tự.",
                    "reading": f"Đọc hiểu đoạn văn ngắn ứng dụng cấu trúc {grammar[0]}.",
                    "writing": f"Viết 5 câu hoàn chỉnh sử dụng ít nhất 2 từ trong nhóm: {', '.join(s_vocab)}.",
                    "assessment": f"Kiểm tra mức hiểu cuối buổi {pos} tuần {w_idx:02d} (chấm tự động tại backend).",
                    "checkQuestionIds": [f"qb_{lang}_1"],
                }
                lines.append(
                    f"UPDATE wb_study_sessions SET "
                    f"new_knowledge = {sql_str(s_focus)}, "
                    f"vocabulary_json = {sql_str(json.dumps(s_vocab, ensure_ascii=False))}, "
                    f"grammar_json = {sql_str(json.dumps(grammar, ensure_ascii=False))}, "
                    f"examples_json = {sql_str(json.dumps([example], ensure_ascii=False))} "
                    f"WHERE id = {sql_str(ses_id)};"
                )
                lines.append(
                    f"UPDATE wb_lessons SET "
                    f"components_json = {sql_str(json.dumps(comp, ensure_ascii=False))}, "
                    f"version = '1.2.0', updated_at = datetime('now') "
                    f"WHERE id = {sql_str(les_id)};"
                )

    with open(OUT_PATH, 'w', encoding='utf-8') as f:
        f.write('\n'.join(lines) + '\n')
    print(f"Generated {OUT_PATH} ({len(lines)} lines, 108 sessions + 108 lessons enriched)")


if __name__ == '__main__':
    build_migration_0012()
