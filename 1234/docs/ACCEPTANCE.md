# Nghiệm thu 22/11/2026

## Bản dọn gọn 80 file

Từ ZIP nghiệm thu 103 file, bỏ một tài liệu baseline đã bị thay thế, giảm 13 file qua việc gộp các module liên quan và giảm 9 file qua việc tổ chức 12 dataset thành ba catalog ngành. Mỗi URL JSON theo lĩnh vực vẫn trả đúng nội dung của dataset gốc. Toàn bộ 16 migration SQL giữ nguyên từng byte. Test bảo toàn dữ liệu đọc cả 12 URL và đối chiếu số mục từng lĩnh vực với index. Bộ V4 đạt 24/24 sau khi dọn. Bộ đầy đủ vẫn có đúng ba kỳ vọng V3 khác hợp đồng V4.

## Matrix trước khi sửa

T = có entrypoint trong source. ? = cần chạy kiểm chứng, chưa phải PASS.

| System | UI | Data | API | Auth | VI | EN | Mobile | Keyboard | Error | Persistence | Test | Status |
|---|---|---|---|---|---|---|---|---|---|---|---|---|
| Learning Home | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Learning Path | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Vocabulary | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Grammar | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Listening | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Speaking | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Pronunciation | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Reading | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Writing | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Practice | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Dictionary | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Flashcard | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Review | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Memory | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| My Knowledge | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| My Mistakes | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Practice Insights | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Specialized | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Examination handoff | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Learner Meet handoff | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Search | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Auth Gate | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |
| Bridge Engine | T | ? | ? | ? | ? | ? | ? | ? | ? | ? | ? | Chờ kiểm chứng |

## Kết luận nghiệm thu

**NOT READY.** Backend cục bộ đã chứng minh được các luồng học và lưu dữ liệu dưới đây. Điều kiện P0 về toàn bộ UI chrome ở cả hai chiều chuyển ngôn ngữ chưa được chứng minh trên tất cả trạng thái sinh động. Chromium chưa mở được trang trong môi trường này. Không có phiên staging hay xác nhận SSO liên miền.

Vòng nghiệm thu trước khi dọn tiếp tục từ đúng 99 file. Bốn file mới phục vụ bốn mục đích riêng: ma trận này, bộ quét chuỗi, test sự kiện client và trình kiểm tra DOM/browser. Tại thời điểm đó có 103 file. Không thay đổi migration hoặc dataset, không đưa database QA vào ZIP.

## Bằng chứng tái lập

Chạy ở thư mục có package.json. Test dùng Python sqlite3 qua D1 shim, Worker thật tại src/index.js và session riêng cho mỗi fixture. Database đã migrate có 358 dictionary entries, 115 lessons, 4 practice exercises, 5 question-bank rows và 3 bản ghi audio. File audio của ba bản ghi đều chưa được cung cấp.

| Lệnh | Kết quả vòng này | Phạm vi |
|---|---|---|
| npm run test:v4 | 24/24 PASS | 21 contract/integration và 3 test event client |
| npm test | 54 pass, 3 fail trong tổng số 57 | Chạy cả test lịch sử nguyên bản |
| npm run test:legacy | 3 expected incompatibilities | Hai assertion admin yêu cầu 200, assertion Help yêu cầu 200. V4 yêu cầu redirect. Các assertion nằm sau chỗ fail trong mỗi test lịch sử chưa chạy tới. |
| npm run lint:check và npm run build | PASS | Cú pháp entrypoints và preflight cấu hình Worker |
| npm run qa:browser | 28/28 HTTP/parsed DOM, 6 width conditions, 5 cặp màu. Browser BLOCKED, exit 77 | Chạy local server và SQLite cùng tiến trình QA. Cần Python lxml, Playwright và Chromium. |
| npm run qa:ui | In JSONL theo file, dòng, loại và nội dung candidate | Scan source, không phải chứng nhận bản dịch |

**Flashcard.** Ca “specialized term → notebook → flashcard” đọc mục số 1 trong bộ Cắt gọt kim loại. Save hai lần trả cùng notebook ID. Review thấy thẻ đến hạn. Grade 4 cập nhật repetitions thành 1 và next_review_at sau last_reviewed_at. GET mới còn thẻ trong Flashcard và My Knowledge, hàng đợi Review không còn thẻ. Quality 98 bị từ chối. Trigger SQLite ép UPDATE thất bại cho đáp ứng 503, ok=false, repetitions không đổi. Test khác phát lại yêu cầu với expectedReview cũ và nhận 409. Client test chạy handler Space, phím 3, giữ reveal qua đổi locale, lỗi mạng rồi gửi lại thành công. Test vuốt xác nhận mặt sau được đóng khi sang thẻ. Đây là hai lớp bằng chứng Worker/SQLite và JS event doubles. Chưa có bằng chứng một lần chạy xuyên cả hai lớp trong Chromium.

**Memory.** Source lưu repetitions, ease_factor, interval_days, last_reviewed_at, next_review_at và mastery_status. Quality dưới 3 đặt lại repetition về 0 và lịch về 1 ngày. Bốn lần ôn đạt liên tiếp tạo trạng thái mastered. Badge ưu tiên việc đến hạn ôn. “Mastered” yêu cầu cả trạng thái đã lưu và ít nhất 4 repetition. Schema này lưu snapshot hiện tại, không lưu lịch sử từng rating hoặc độ tự tin theo các chiều kỹ năng.

**Practice và Mistakes.** Test gửi bài viết rỗng nhận 422, gửi văn bản hợp lệ tạo kết quả pending_manual_review với score=null. GET result đọc lại đúng văn bản. Trả lời sai câu hiện tại đơn tạo mục lỗi có prompt và giải thích, lịch sử và Learning Home liên kết đúng result ID. Làm lại đúng tạo nhãn “Correct on retest” từ lần chấm sau. My Mistakes tính lại khi đọc từ practice feedback và lesson breakdown. Không tồn tại bản ghi “resolved” độc lập. Với hai lượt một sai, một đúng, điểm trung bình trong lịch sử là 50%. Số liệu Practice Insights lấy tối đa 100 lượt gần nhất của tài khoản. Bảng theo tuần dùng tuần bắt đầu thứ Hai UTC. Số từ đã ôn là số mục có last_reviewed_at, không phải tổng số lần ôn.

## Ma trận hành động

Các điều khiển cần thiết để đọc trang và để thiết lập danh tính được phép trước khi có session. Hai nhãn dưới đây áp dụng cho hành động người dùng. Webhook email là endpoint máy–máy với chữ ký riêng.

| Thao tác / entrypoint | Phân loại | Nơi thực thi |
|---|---|---|
| Điều hướng nội bộ, skip link, menu, breadcrumb, mở/đóng mô tả, đổi VI/EN và tùy chọn trình bày | PUBLIC_READ | HTML công khai và trình duyệt |
| Xem chương trình, khóa, tuần, lesson, skill, đề bài luyện, dictionary entry, lĩnh vực và preview thuật ngữ; sang bài đọc tiếp theo | PUBLIC_READ | Worker render dữ liệu discovery |
| Mở/đóng Auth Gate, sang Portal đăng nhập/đăng ký, OAuth, passkey authentication, xác minh email và yêu cầu khôi phục | PUBLIC_READ | Ngoại lệ thiết lập danh tính. Callback/token do auth service hoặc Portal kiểm tra |
| Gửi global search, dictionary query/filter | AUTH_REQUIRED | /search, /dictionary, /api/v1/dictionary/search; query rỗng có thể xem landing |
| Tìm/lọc/chuyển trang kho thuật ngữ, phát mẫu TTS | AUTH_REQUIRED | /api/v1/specialized/terms kiểm tra session; phát âm tổng hợp là năng lực trình duyệt trên giao diện đã xác thực |
| Save term, thêm/sửa/xóa notebook, export CSV | AUTH_REQUIRED | /api/v1/vocabulary/notebook, notebook/:id, vocabulary/export; save chuyên ngành chỉ nhận domain và số mục rồi tra nguồn server |
| Mở notebook, set, flashcard, hàng đợi ôn, lật, đổi mode, vuốt, phím rating, gửi grade | AUTH_REQUIRED | Worker bảo vệ trang cá nhân; POST vocabulary/review kiểm tra session, CSRF, ownership và revision khi client gửi |
| Làm bài, nhập/sửa bản nháp, nộp, xem kết quả và history | AUTH_REQUIRED | Form chỉ có trên trang đã đăng nhập; practice/submit và practice/results/:id kiểm tra tại server |
| Phát/dừng/tua/lặp/đổi tốc độ audio, chọn segment, chép chính tả; cho phép mic, ghi, dừng, nghe lại, xóa và ghi lại | AUTH_REQUIRED | Audio stream yêu cầu session và asset published. MediaRecorder dùng browser permission; bản ghi chỉ ở thiết bị |
| Lưu lesson notes, làm comprehension, ghi nhận progress, mở lesson result | AUTH_REQUIRED | lessons/notes, learning/progress, trang result cá nhân |
| Mở My Learning, My Knowledge, My Mistakes, Practice Insights | AUTH_REQUIRED | Worker yêu cầu session; truy vấn có account_id |
| Khởi chạy Exam, Meet, Reader | AUTH_REQUIRED | Discovery và CTA của Miền 1; từ khách sang Portal với next/intent; đích nằm trên hostname cố định |
| Chạy language intelligence, gửi support ticket, quản lý profile/passkeys/student benefit, logout | AUTH_REQUIRED | Router API kiểm tra session, CSRF đối với mutation. Xác minh single-use token là bước thiết lập/xác nhận danh tính |
| API lịch sử admin/jobs/content/exam/meet | AUTH_REQUIRED | Giữ nguyên các tầng role/ownership có sẵn; không dùng làm UI quản trị/thi của Miền 1 |

## Ma trận kết quả theo subfeature

Mỗi ô ghi phần chức năng theo đúng phạm vi đã kiểm tra. Dấu “—” nghĩa là không ghi nhận kết luận ở ô đó. Cổng nghiệm thu chung VI/EN, layout trình duyệt và accessibility được liệt kê riêng và vẫn áp dụng cho mọi dòng.

| System | COMPLETE | BLOCKED | FAILED | Evidence |
|---|---|---|---|---|
| Learning Home | Discovery; dùng kết quả đã lưu cho tiếp tục học, việc đến hạn, kỹ năng dưới 80%, hoạt động và gợi ý | — | — | Hai trạng thái visitor/learner; URL result từ POST xuất hiện trong Home. Ưu tiên ôn đến hạn, kỹ năng yếu, bài đang học, chọn path. |
| Learning Path | Timeline deterministic; chưa bắt đầu, đang học, cần ôn, hoàn tất | — | — | Test một lesson hoàn thành chưa hoàn tất course; đủ lesson published mới hoàn tất. Bài dưới ngưỡng đậu 70% dẫn tới review-needed, kể cả progress thiếu course_id. |
| Vocabulary | Studio đúng exercise, server chấm theo question bank; notebook và ôn | — | — | pex_zh_voc_1; test route đối chiếu từng exercise ID; chuỗi notebook → SRS. |
| Grammar | Submit, chấm, giải thích, làm lại | — | — | qb_en_1 sai rồi đúng; kết quả và history được lưu. |
| Listening | Hiển thị prompt lesson; nếu có published asset thì player, transcript/segment thật và dictation tự đối chiếu | Phát media thật, nghe/seek/sync trên thiết bị; bài comprehension nghe | — | Source có 3 metadata draft, size=0; không có listening question/exercise. Test publish metadata trong fixture, kiểm tra transcript/segment và stream báo thiếu file. Cần R2 object được xuất bản và câu hỏi liên kết. |
| Speaking | Prompt lesson; lifecycle xin quyền, ghi, dừng, tạo playback, retry, hủy trước khi cấp quyền; lỗi thiết bị | Mic/loa thật; nộp audio và nhận đánh giá | — | Test client chạy unsupported, denied, missing, cancel, blob playback, retry. Router V4 không có upload speaking attempt. Cần thiết bị và hợp đồng lưu bản ghi nếu yêu cầu nộp. |
| Pronunciation | Phiên âm từ entry published, liên kết mục từ, tự ghi và nghe lại | Phoneme scoring | — | Query ipa_or_pinyin/stress_pattern/tone_pattern; dùng chung recorder đã test. Chưa có endpoint phân tích phoneme. Cần đặc tả scoring/provider. |
| Reading | Reader từng lesson có excerpt thật; bài trước/sau; từ điển; sang lesson để làm bài và lưu tiến độ nếu có | Kết quả riêng cho reading-only comprehension | — | 108 lesson có reading và examples trong baseline; 0 standalone reading exercises. Cần câu hỏi reading gắn passage để công bố điểm kỹ năng đọc riêng. |
| Writing | Prompt, draft theo account/exercise trong sessionStorage, validation, gửi và đọc lại bài | Chấm rubric và trả nhận xét | — | pex_en_wrt_1; 422/201 và GET result; có pending_manual_review, chưa có reviewer workflow trong Miền 1. Cần kết quả đánh giá của reviewer. |
| Practice | Dashboard, tách đúng sáu route, kết quả và retry | — | — | Test từng ID của 4 exercise hiện có qua cả 6 URL; 2 kỹ năng không có exercise dùng nội dung lesson khi thích hợp. |
| Dictionary | Lookup, view published entry, chỉ hiện nhóm dữ liệu có giá trị, save, xem lịch ôn và sang Practice/Review | — | — | Test search và specialized entry; POST notebook, record mới tồn tại sau request khác. |
| Flashcard | Reveal, rating, xác nhận server, error/retry, phím và swipe ở mức event | Trải nghiệm browser thật | — | API/SQLite và client event tests mô tả ở trên. |
| Review | Due queue, cập nhật lịch, reload, từ chối grade cũ | — | — | GET trước và sau POST; test stale 409, storage failure 503. |
| Memory | Ánh xạ SRS theo bằng chứng và rule đã nêu | Lịch sử từng rating/confidence nếu cần | — | Test 4 lần đạt rồi một lần sai. Schema notebook chỉ giữ snapshot. |
| My Knowledge | Mục đã lưu, hạn ôn, số bài hoàn thành, điểm theo skill có dữ liệu | — | — | Test xác nhận term lưu từ dataset xuất hiện; chiều chưa đo hiển thị dấu gạch. |
| My Mistakes | Derived inbox, giải thích và retest | — | — | Đọc cả mảng feedback hiện hành và object envelope cũ; test sai → đúng. |
| Practice Insights | Activity, tỉ lệ điểm trên maximum, phân bố skill, hoạt động theo tuần, câu sai lặp lại, số term từng ôn | Phút luyện tập chính xác | — | Không suy thời lượng từ submitted_at duy nhất; cần duration hoặc start/end trong attempt. |
| Specialized | 12 lĩnh vực → 12.104 term → search/filter server → entry → notebook → flashcard/review | Các module audio/writing/scenario riêng theo ngành | — | Test term “metal cutting”; nguồn chỉ có số thứ tự, term, POS, IPA, nghĩa và topic. Cần học liệu có liên kết lĩnh vực. |
| Examination handoff | Discovery metadata, CTA khách/đăng nhập, đích Exam | EXTERNAL VERIFICATION BLOCKED | — | Kiểm tra href, hostname và auth gate. Cần Exam/Portal xác nhận session, locale và return contract. |
| Learner Meet handoff | Discovery, intent join và đích Portal /meet | EXTERNAL VERIFICATION BLOCKED | — | Cả hai trạng thái auth được kiểm tra. Cần Portal và phiên thật để kiểm chứng tiếp tục session. |
| Search | Query theo category, trả entry thật, guest → login giữ query/locale/intent | — | — | Test metal+cutting, category, locale=en; authenticated dictionary hit trỏ đúng slug. |
| Auth Gate | Chặn tại server, giữ context nội bộ, bảo vệ các thao tác cá nhân | Callback/cookie liên miền; focus modal thực | — | 401 cho notebook/grade/submit/ticket/notes/stream; next chỉ về origin chính; native dialog có accessible name. |
| Bridge Engine | Dictionary/specialized → save → review; sai → giải thích → retry; bài đọc/path → lesson | — | — | Assertions dùng URL phát sinh từ entry/result thật. Đây là các quy tắc điều hướng deterministic. |
| Ownership V4 | /admin → Quantri; /help → Help; curriculum thuộc Quantri | Live hostname | — | Replacement assertions PASS, bao gồm path và query của curriculum. |
| VI/EN | Registry shell chung server/client, chuỗi tĩnh đã chuyển, chuyển ngôn ngữ tại chỗ giữ route/reveal | — | Phạm vi tất cả template/JS runtime ở cả hai chiều chưa đạt bằng chứng P0 | Xem audit bên dưới. Đây là công việc nội bộ. |
| Responsive và accessibility | DOM 28 trang, tên điều khiển, skip link, main, h1, dialog, focus CSS, reduced motion, 5 cặp màu | Render thật ở 6 viewport, focus/đọc màn hình, thiết bị touch/mic | — | Lệnh qa:browser; chi tiết phía dưới. |

## Chuỗi giao diện và dữ liệu học

Registry dùng chung tại public/scripts/i18n.js. Việc đổi ngôn ngữ không reload trang. Server gate giữ locale cùng next và intent. UI kiểm thử giữ mặt thẻ đã lật và query khi đổi VI → EN → VI. Những đoạn có data-learning-content giữ nguyên văn. Dữ liệu như “Hello, my name is Lan”, IPA, nghĩa tiếng Việt và văn bản bài nộp không được dịch máy.

Bộ quét kiểm tra src/, public/ và email/, gồm HTML text, placeholder, aria-label, title, alt, một số dạng message và biểu thức template. Mỗi candidate có file và dòng. Các nhóm cần phân biệt:

- Historical: entrypoint, shell và service .mjs của V3 không phục vụ UI triển khai. Giữ vì suite lịch sử.
- Email-template: nội dung email giao dịch, nằm ngoài UI trình duyệt.
- Manual-review: có cả phép so sánh JavaScript bị regex nhận nhầm thành text, tên kỹ thuật API/OAuth, email, mã khung HSK/CEFR, đơn vị thời gian và khóa registry. Report giữ lại để có thể kiểm lại.
- Dynamic-expression: gồm dữ liệu học nguyên văn, tên riêng, ngày/điểm, cùng với chuỗi UI ghép dữ liệu. Nhóm này không được miễn trừ tập thể. Chẳng hạn nhãn nguồn/version của dictionary, tiêu đề chứa tên mục từ và thông báo phát sinh sau một thao tác phải được đối chiếu cả VI và EN. Lệnh scan không chứng minh mọi nhánh đã được dịch.

**Cổng P0 còn mở.** Thiếu bằng chứng phân loại hết biểu thức động trong các template và kiểm tra trạng thái sinh từ JS sau khi đổi locale. Dependency là mã renderer/registry và coverage nội bộ; không cần đầu vào Quantri. Đầu vào kiểm chứng cần thiết là bộ state fixture cho những nhánh còn lại và đối chiếu DOM theo locale, tách chính xác nội dung học và UI chrome. Không công bố VI/EN COMPLETE chỉ dựa vào số chuỗi trong registry.

## QA giao diện và môi trường ngoài

- HTTP thật qua 127.0.0.1 với session trong SQLite test. 28 trang qua kiểm tra cây DOM, heading, landmark, tên button/input, skip link và dialog có tên.
- Sáu chiều rộng 360, 390, 768, 1024, 1440, 1920 px đã đối chiếu breakpoint CSS. Số block max-width khớp lần lượt là 17, 17, 10, 2, 0, 0. Hai kích thước cuối dùng desktop mặc định. Đã sửa grid Dictionary/Learning Home và khả năng xuống dòng, giới hạn chiều rộng audio và touch controls. Không có phép đo scrollWidth thật để kết luận hết overflow.
- Contrast của năm cặp token text/nền là 16,99; 6,59; 8,94; 14,25; 8,36. Đây là các cặp palette được kiểm, không phải chứng nhận mọi tổ hợp CSS.
- Chromium qua Playwright dừng trước navigation tại process_singleton_posix.cc:297, socket() failed: Operation not permitted. Server local vẫn trả 200. Trình QA chứa test browser cho focus, Escape, locale/reveal, lỗi grade, reload và scrollWidth; các bước này chưa thực thi trong Chromium. Cần runner cho phép khởi động browser bình thường. Screen reader và micro/loa vật lý cần kiểm tra thủ công.
- Quantri: cần staging với endpoint/schema thực, cấu hình HMAC/runtime và object storage. Local tests dùng SQLite/R2 shim, không xác nhận hợp đồng qua mạng.
- Portal/SSO/Exam: cần tài khoản staging, cookie policy, callback allowlist và contract tiếp nhận next/intent/locale. Miền 1 chỉ xác nhận được tham số/URL outbound.
- Staging: chưa nhận môi trường/credential và chưa triển khai. Không có kết luận production.

**Snapshot của bộ quét.** manual-review: 18, historical: 340, dynamic-expression: 359, email-template: 44. Số này tính theo vị trí/loại trong source, không phải số lỗi dịch xác nhận.
