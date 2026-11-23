# WORD BRIDGE • Bàn giao ngày 23/11/2026

**Kết luận:** bản mã nguồn đã sửa đạt các kiểm thử local được ghi dưới đây. Quyết định phát hành production còn phụ thuộc vào bằng chứng vận hành và dịch vụ bên ngoài.

## Những thay đổi chính

| Hạng mục | Thực hiện |
|---|---|
| Kiến trúc | Dùng entrypoint theo Wrangler, khóa dependency qua package-lock, kiểm tra binding trước khi tạo bundle. Đã bỏ Worker và app shell cũ khỏi gói. Router .mjs còn phục vụ các bài test lịch sử, ngoài đồ thị import của sản phẩm. |
| P0 | Bắt rejection khi dựng trang và gọi API, ghi mã yêu cầu và khung stack nội bộ. Cron báo lỗi khi job thất bại. Bỏ module dựng trang quản trị công khai. Chặn cả HTML và API tại Worker. Duy trì dịch vụ nội bộ, audit log và nghiệp vụ nhận phiếu. |
| Danh mục | Hai ngôn ngữ học tập zh/en, hai ngôn ngữ giao diện vi/en. View D1 áp dụng cho danh mục, tra cứu, chi tiết học liệu, thẻ ôn và tiến độ. Xóa thẻ, ảnh và liên kết Nga khỏi phần công khai. |
| UI và nghiệp vụ | Sửa header/footer, hai cột đăng ký, trang học có danh sách tuần, bảy trang kỹ năng, flashcards và trang hướng dẫn lỗi. Từ vựng tiếp tục dùng SM-2. Năm bộ thẻ kỹ năng dùng giáo trình đã phát hành và lưu tự đánh giá theo tài khoản. Các bài có đáp án dùng Practice riêng. |
| Auth | Thêm xác minh chữ ký WebAuthn, challenge hết hạn và dùng một lần, origin/RP ID, user verification, bộ đếm và trạng thái tài khoản. Khóa cũ chưa có bằng chứng đăng ký hợp lệ cần đăng ký lại bằng mật khẩu. Giữ quy trình email và password hash. |
| An toàn đầu ra | Trang bảo trì bỏ liên kết nội bộ. Dữ liệu phân tích hiển thị qua textContent. HTML chứa phiên, thông tin người học và CSRF dùng private/no-store. |

## Kết quả kiểm thử

| Phép kiểm | Phạm vi và kết quả |
|---|---|
| Source | 176 tệp đầu vào, 35 module trong đồ thị nguồn của entrypoint. Kiểm tra cú pháp JS/MJS và bundle. |
| Tự động | 57/57 bài Node đạt, gồm unit, tích hợp, bảo mật và một số hợp đồng module lịch sử. Có kiểm tra riêng entrypoint thực cho route ngừng phục vụ, D1 rejection, cron, auth, ownership và CSRF. |
| Crawler | 490 URL duyệt từ liên kết nội bộ và các trang khởi đầu trên seed local. 483 trả 200, 7 chuyển đến đăng nhập. Không phát hiện liên kết quản trị hoặc dấu hiệu ngôn ngữ Nga theo bộ dò trong các HTML đã duyệt. |
| Responsive | 481 trang HTML × 8 chiều rộng = 3.848 phép đo. Không phát hiện document tràn ngang hoặc ngoại lệ JavaScript chưa bắt. Phép đo không đánh giá sự khớp thị giác từng pixel, hoặc chữ bị cắt bên trong một thành phần. |
| Browser E2E | 144 phép đo trên 18 trang đại diện, có 404. Chuyển locale, đăng ký, đăng nhập bằng mật khẩu, thêm/dùng/thu hồi Passkey bằng bộ xác thực ảo, ghi và phát lại qua thiết bị âm thanh mô phỏng, lưu rồi tải lại bài viết. Kiểm thử email token riêng qua API local. |
| Dữ liệu | 19 migration gồm 17 tệp cũ và 2 tệp mới. Test snapshot trước/sau cho 106 bảng ban đầu giữ nguyên số hàng. integrity_check = ok; foreign_key_check không trả lỗi. Thử hoàn tác và phục hồi backup SQLite sang database tách biệt. |
| Cloudflare local | Wrangler dry-run xuất bundle cho DB, R2 và ASSETS. Migrator Wrangler chạy trên D1 local. Kiểm tra riêng Worker bundle trên workerd/Miniflare cho danh mục, trang học, flashcard và đường quản trị. |
| Scheduled | Bốn job trong scheduled sweep được ghi trạng thái thành công trên dữ liệu kiểm thử cục bộ. |
| Dữ liệu chuyên ngành | Test đối chiếu metadata và độ dài từng mảng words của 12 bộ dữ liệu, tổng 12.104 mục trong ZIP. Số này không phải số thành viên hay số mục từ được kiểm định học thuật. |

## Điều kiện còn mở khi đưa website vào sử dụng thật

1. Dashboard Cloudflare yêu cầu đăng nhập. Chưa đọc được log của Ray ID hoặc version đang phục vụ www. Cần bản xuất deployment, binding và log đúng thời điểm.
2. Xác nhận custom domain, origin cho WebAuthn, phạm vi cookie và host sinh liên kết email. Chưa kiểm thử trên thiết bị Passkey vật lý hoặc xuyên hai host production.
3. Kiểm tra gửi, nhận, retry và webhook của nhà cung cấp email thật. Chưa gửi email tới học viên.
4. Kiểm kê object R2 thật, quyền phát hành, nội dung và liên kết từng học liệu. Không có bản ghi âm sản xuất hoặc âm thanh thiết bị người học trong ZIP. Chưa có tích hợp được kiểm chứng cho điểm phát âm cấp âm vị.
5. Dữ liệu seed chỉ có một số bài luyện tập có bộ câu hỏi độc lập đã phát hành. Năm bộ thẻ kỹ năng dùng nội dung của bài học. Chưa có bằng chứng về bộ audio, bản chép lời, đáp án hoặc tiêu chí chấm bổ sung cho mọi nội dung trong ảnh.
6. Cần duyệt cách dịch VI/EN trên toàn bộ nội dung động, độ khớp hình ảnh, độ tương phản và trải nghiệm đọc màn hình với người dùng thực. Đã kiểm tra locale và responsive; chưa có chứng nhận accessibility hay tỷ lệ khớp thiết kế.
7. Trang chính sách nguồn đang dùng mô tả ngắn. Cần nội dung được chủ dự án phê duyệt để công bố chính thức.
8. Nghiệm thu staging với dữ liệu có cấu trúc tương đương production, xác minh backup D1 thật và quyền phát hành. Chưa deploy hoặc thay đổi D1/R2 production.


# Sự cố Worker ngày 23/11/2026

| Dữ kiện | Giá trị |
|---|---|
| Host được báo lỗi | www.wordbridge.io.vn |
| Ray ID do chủ dự án cung cấp | a5ee8729dc25797c |
| Thời gian | 07:40:49 UTC, 14:40:49 tại Việt Nam |
| Worker trong cấu hình ZIP | wordbridge-edu, src/index.js |
| Worker/version thực tế tại thời điểm xảy ra | Chưa xác minh |
| Nguyên nhân của Ray ID | Chưa xác minh |

Cloudflare định nghĩa 1101 là ngoại lệ JavaScript của Worker. Ảnh thiết kế ghi phiên đăng nhập không hợp lệ. Trang hướng dẫn trong bản sửa mô tả sự cố xử lý tại máy chủ. Tài liệu Cloudflare: https://developers.cloudflare.com/workers/observability/errors/

Trong bản gốc, lệnh return của nhiều route trả thẳng Promise của hàm dựng trang và API từ bên trong try. Khi Promise bị reject sau thời điểm return, catch này không nhận ngoại lệ. Đây là lỗi xác định được trong mã. Regression test gây lỗi đọc D1 tại /learning/path và xác nhận Worker trả HTTP 500 với mã theo dõi, giữ chẩn đoán ở log nội bộ. Lỗi thiếu binding DB trả 503. Lỗi cron được ghi riêng và báo thất bại cho trình lập lịch. Module chính import được và scheduled đã chạy đủ bốn job với D1 cục bộ.

Sự cố build độc lập với nguyên nhân của Ray ID. Build cũ chủ động ném lỗi nếu tồn tại D1 hoặc R2 trong cấu hình. Bản sửa kiểm tra đúng tên binding và bundle bằng Wrangler dry-run.

Để kết luận sự cố thật, đối chiếu log request và ngoại lệ tại thời điểm trên với hostname, phiên bản deployment, route/custom domain, binding và thay đổi phát hành. Nếu log hết hạn, cần bản xuất đã lưu hoặc một sự kiện mới có cùng triệu chứng. So sánh stack với source map đúng phiên bản. Bộ ZIP không có bản xuất log hoặc lịch sử deployment đó.

# Route của Worker công khai

Danh sách đường dẫn cụ thể được duyệt từ các trang và dữ liệu seed nằm trong bảng kiểm kê bên dưới. Các đoạn có dấu hai chấm bên dưới biểu thị khóa dữ liệu. Một số màn hình kết quả cá nhân cần phiên hợp lệ.

| Phân hệ | Route |
|---|---|
| Giới thiệu | /, /about, /features, /faq, /contact, /policies/:policy, /sitemap.xml |
| Học tập | /learning, /learning/chinese, /learning/english, /learning/path, /learning/skills, /skills/:skill |
| Giáo trình | /programs/:slug, /programs/:slug/levels/:level, /courses/:slug, /courses/:slug/curriculum, /modules/:slug, /weeks/:slug, /lessons/:slug, /lessons/:slug/result |
| Tiến độ | /my-learning, /my-learning/history, /my-learning/vocabulary, /my-knowledge, /my-mistakes |
| Tra cứu | /dictionary, /dictionary/:language, /dictionary/:language/:entry, /search, /specialized, /specialized/:domain |
| Bộ thẻ | /vocabulary, /vocabulary/notebook, /vocabulary/sets, /vocabulary/flashcards, /vocabulary/review, /flashcards/{grammar,listening,speaking,reading,writing} |
| Luyện tập | /practice, /practice/{grammar,vocabulary,listening,speaking,reading,writing}, /practice/history, /practice/results/:id |
| Thư viện và phân tích | /reader, /reader/:slug, /intelligence, /intelligence/:system |
| Phòng luyện hội thoại trong nguồn | /learner-meet, /learner-meet/{sessions,create,history}, /learner-meet/{join,room}/:id |
| Thành viên | /login, /register, /verify-email, /forgot-password, /reset-password, /profile, /account, /account/{security,sessions,passkeys,student-benefit} |
| Hỗ trợ | /help, /help/errors, /help/errors/:code |
| API | /api/v1/*; xem nhánh đang dùng trong src/api/router.js, API ghi chú và xuất từ vựng trong src/index.js. OpenAPI công khai mô tả các endpoint chính. |

## Route đã dừng

- /admin, /quan-tri, đường dẫn con và /api/v1/admin trả 404 trên Worker công khai, kể cả khi có phiên super_admin.
- Các slug ngôn ngữ ru, russian, tieng-nga và các nhánh tương ứng trả 410. Chi tiết học liệu cũ bị loại qua view trả 404. Không phát hành ảnh số 22.
- /examinations, /examination-attempts/*, /examination-results/* và API khảo thí tương ứng đã dừng.
- /social, /friends, /feed, /organizations, /account/subscription, /oauth/callback, /account/linked-accounts và API xác thực OAuth cũ đã dừng.
- /api/v1/sso/reader/issue đã dừng. Thư viện dùng /reader.

## Kết quả duyệt route bản RC

| pathname | guest_http_status |
|---|---|
| / | 200 |
| /about | 200 |
| /branding/favicon.png | 200 |
| /contact | 200 |
| /courses/chinese-beginner-12-weeks | 200 |
| /courses/chinese-beginner-12-weeks/curriculum | 200 |
| /courses/chinese-specialized-business-course | 200 |
| /courses/chinese-specialized-business-course/curriculum | 200 |
| /courses/chinese-specialized-logistics-course | 200 |
| /courses/chinese-specialized-logistics-course/curriculum | 200 |
| /courses/chinese-specialized-manufacturing-course | 200 |
| /courses/chinese-specialized-manufacturing-course/curriculum | 200 |
| /courses/english-beginner-12-weeks | 200 |
| /courses/english-beginner-12-weeks/curriculum | 200 |
| /courses/english-specialized-automotive-course | 200 |
| /courses/english-specialized-automotive-course/curriculum | 200 |
| /courses/english-specialized-design-econ-course | 200 |
| /courses/english-specialized-design-econ-course/curriculum | 200 |
| /courses/english-specialized-it-cloud-course | 200 |
| /courses/english-specialized-it-cloud-course/curriculum | 200 |
| /courses/english-specialized-mechanical-course | 200 |
| /courses/english-specialized-mechanical-course/curriculum | 200 |
| /dictionary | 200 |
| /dictionary/chinese | 200 |
| /dictionary/chinese/bao-guan | 200 |
| /dictionary/chinese/gong-ying-lian-guan-li | 200 |
| /dictionary/chinese/hai-yun-ti-dan | 200 |
| /dictionary/chinese/ni-hao | 200 |
| /dictionary/chinese/shang-ye-fa-piao | 200 |
| /dictionary/chinese/yuan-chan-di-zheng-shu | 200 |
| /dictionary/chinese/zh-core-01-xi-xie | 200 |
| /dictionary/chinese/zh-core-02-z-iji-n | 200 |
| /dictionary/chinese/zh-core-03-xu-x | 200 |
| /dictionary/chinese/zh-core-04-l-osh | 200 |
| /dictionary/chinese/zh-core-05-xu-sheng | 200 |
| /dictionary/chinese/zh-core-07-ji-t-ng | 200 |
| /dictionary/chinese/zh-core-08-g-ngzu | 200 |
| /dictionary/chinese/zh-core-09-g-ngs | 200 |
| /dictionary/chinese/zh-core-10-sh-ji-n | 200 |
| /dictionary/chinese/zh-core-11-j-nti-n | 200 |
| /dictionary/chinese/zh-core-12-m-ngti-n | 200 |
| /dictionary/chinese/zh-core-13-x-ngq | 200 |
| /dictionary/chinese/zh-core-14-ti-nq | 200 |
| /dictionary/chinese/zh-core-15-y-yu-n | 200 |
| /dictionary/chinese/zh-core-16-y-sh-ng | 200 |
| /dictionary/chinese/zh-core-19-y-nh-ng | 200 |
| /dictionary/chinese/zh-core-20-sh-ch-ng | 200 |
| /dictionary/chinese/zh-core-21-h-tong | 200 |
| /dictionary/chinese/zh-core-22-b-oji-d-n | 200 |
| /dictionary/chinese/zh-core-23-x-ny-ngzh-ng | 200 |
| /dictionary/chinese/zh-core-24-j-zhu-ngxi-ng | 200 |
| /dictionary/chinese/zh-core-25-c-ngch | 200 |
| /dictionary/chinese/zh-core-26-hu-y-n-d-il | 200 |
| /dictionary/chinese/zh-core-27-gu-nshu | 200 |
| /dictionary/chinese/zh-core-28-ji-ny-n-ji-ny | 200 |
| /dictionary/chinese/zh-core-29-sh-ngch-nxi-n | 200 |
| /dictionary/chinese/zh-core-30-zh-li-ng-k-ngzh | 200 |
| /dictionary/chinese/zh-core-31-di-nl-b-n | 200 |
| /dictionary/chinese/zh-core-32-chu-ng-nq | 200 |
| /dictionary/chinese/zh-core-34-ji-ohu-q | 200 |
| /dictionary/chinese/zh-core-35-c-ig-u | 200 |
| /dictionary/chinese/zh-core-36-g-ngy-ngsh-ng | 200 |
| /dictionary/chinese/zh-core-37-k-c-n | 200 |
| /dictionary/chinese/zh-core-38-y-nf-i | 200 |
| /dictionary/chinese/zh-core-39-b-oxi-nd-n | 200 |
| /dictionary/chinese/zh-core-40-zhu-ngchu-n | 200 |
| /dictionary/chinese/zh-core-41-m-d-g-ng | 200 |
| /dictionary/chinese/zh-core-42-q-y-ng-ng | 200 |
| /dictionary/chinese/zh-core-43-q-nggu-n | 200 |
| /dictionary/chinese/zh-core-44-m-oy-sh-y | 200 |
| /dictionary/chinese/zh-core-45-y-ngp-n | 200 |
| /dictionary/chinese/zh-core-46-d-ngd-n | 200 |
| /dictionary/chinese/zh-core-47-f-pi-o | 200 |
| /dictionary/chinese/zh-core-48-f-ku-n-f-ngsh | 200 |
| /dictionary/chinese/zh-core-49-nqu-n-bi-ozh-n | 200 |
| /dictionary/chinese/zh-core-50-sh-b-i-w-ih | 200 |
| /dictionary/chinese/zh-core-51-j-sh-gu-g | 200 |
| /dictionary/chinese/zh-core-52-hu-y | 200 |
| /dictionary/chinese/zh-core-53-b-og-o | 200 |
| /dictionary/chinese/zh-core-55-j-ngy-n | 200 |
| /dictionary/chinese/zh-core-56-hu-nj-ng | 200 |
| /dictionary/chinese/zh-core-57-w-nhu | 200 |
| /dictionary/chinese/zh-core-58-y-y-n | 200 |
| /dictionary/chinese/zh-core-59-ji-oli | 200 |
| /dictionary/chinese/zh-core-60-f-zh-n | 200 |
| /dictionary/chinese/zhuang-xiang-dan | 200 |
| /dictionary/english | 200 |
| /dictionary/english/bill-of-lading | 200 |
| /dictionary/english/cloud-architecture | 200 |
| /dictionary/english/spc-automoti-brake-horsepower-bhp | 200 |
| /dictionary/english/spc-automoti-charge-air-intercooler | 200 |
| /dictionary/english/spc-automoti-compression-piston-ring | 200 |
| /dictionary/english/spc-automoti-connecting-rod-assembly | 200 |
| /dictionary/english/spc-automoti-continuously-variable-transmission-cvt | 200 |
| /dictionary/english/spc-automoti-cylinder-engine-block | 200 |
| /dictionary/english/spc-automoti-cylinder-head-assembly | 200 |
| /dictionary/english/spc-automoti-diaphragm-clutch-pressure-plate | 200 |
| /dictionary/english/spc-automoti-dry-dual-clutch-transmission | 200 |
| /dictionary/english/spc-automoti-dual-mass-flywheel | 200 |
| /dictionary/english/spc-automoti-dual-overhead-camshaft-dohc | 200 |
| /dictionary/english/spc-automoti-engine-oil-pan-sump | 200 |
| /dictionary/english/spc-automoti-forged-aluminum-piston | 200 |
| /dictionary/english/spc-automoti-forged-steel-crankshaft | 200 |
| /dictionary/english/spc-automoti-four-stroke-engine-cycle | 200 |
| /dictionary/english/spc-automoti-friction-clutch-disc | 200 |
| /dictionary/english/spc-automoti-helical-gear-ratio | 200 |
| /dictionary/english/spc-automoti-hydraulic-release-bearing | 200 |
| /dictionary/english/spc-automoti-hydraulic-torque-converter | 200 |
| /dictionary/english/spc-automoti-intake-and-exhaust-valves | 200 |
| /dictionary/english/spc-automoti-internal-combustion-engine | 200 |
| /dictionary/english/spc-automoti-oil-control-piston-ring | 200 |
| /dictionary/english/spc-automoti-planetary-automatic-transmission | 200 |
| /dictionary/english/spc-automoti-roller-timing-chain | 200 |
| /dictionary/english/spc-automoti-single-overhead-camshaft-sohc | 200 |
| /dictionary/english/spc-automoti-six-speed-manual-transmission | 200 |
| /dictionary/english/spc-automoti-steering-wheel-paddle-shifter | 200 |
| /dictionary/english/spc-automoti-synchromesh-blocker-ring | 200 |
| /dictionary/english/spc-automoti-toothed-timing-belt | 200 |
| /dictionary/english/spc-automoti-two-stroke-engine-cycle | 200 |
| /dictionary/english/spc-automoti-variable-geometry-turbocharger | 200 |
| /dictionary/english/spc-automoti-wet-dual-clutch-transmission-dct | 200 |
| /dictionary/english/spc-electric-active-power | 200 |
| /dictionary/english/spc-electric-alternating-current | 200 |
| /dictionary/english/spc-electric-ampere | 200 |
| /dictionary/english/spc-electric-apparent-power | 200 |
| /dictionary/english/spc-electric-capacitance | 200 |
| /dictionary/english/spc-electric-charge | 200 |
| /dictionary/english/spc-electric-circuit | 200 |
| /dictionary/english/spc-electric-conductor | 200 |
| /dictionary/english/spc-electric-current | 200 |
| /dictionary/english/spc-electric-cycle | 200 |
| /dictionary/english/spc-electric-electric | 200 |
| /dictionary/english/spc-electric-electrical | 200 |
| /dictionary/english/spc-electric-electricity | 200 |
| /dictionary/english/spc-electric-energy | 200 |
| /dictionary/english/spc-electric-frequency | 200 |
| /dictionary/english/spc-electric-hertz | 200 |
| /dictionary/english/spc-electric-insulator | 200 |
| /dictionary/english/spc-electric-kilowatt | 200 |
| /dictionary/english/spc-electric-kilowatt-hour | 200 |
| /dictionary/english/spc-electric-ohm | 200 |
| /dictionary/english/spc-electric-parallel-circuit | 200 |
| /dictionary/english/spc-electric-peak-value | 200 |
| /dictionary/english/spc-electric-phase | 200 |
| /dictionary/english/spc-electric-power | 200 |
| /dictionary/english/spc-electric-resistance | 200 |
| /dictionary/english/spc-electric-semiconductor | 200 |
| /dictionary/english/spc-electric-series-circuit | 200 |
| /dictionary/english/spc-electric-sine-wave | 200 |
| /dictionary/english/spc-electric-single-phase | 200 |
| /dictionary/english/spc-electric-three-phase | 200 |
| /dictionary/english/spc-electric-volt | 200 |
| /dictionary/english/spc-electric-voltage | 200 |
| /dictionary/english/spc-electric-watt | 200 |
| /dictionary/english/spc-electric-waveform | 200 |
| /dictionary/english/spc-graphic--alignment | 200 |
| /dictionary/english/spc-graphic--asymmetry | 200 |
| /dictionary/english/spc-graphic--background | 200 |
| /dictionary/english/spc-graphic--balance | 200 |
| /dictionary/english/spc-graphic--baseline-grid | 200 |
| /dictionary/english/spc-graphic--column-grid | 200 |
| /dictionary/english/spc-graphic--composition | 200 |
| /dictionary/english/spc-graphic--contrast | 200 |
| /dictionary/english/spc-graphic--emphasis | 200 |
| /dictionary/english/spc-graphic--focal-point | 200 |
| /dictionary/english/spc-graphic--gestalt-principles | 200 |
| /dictionary/english/spc-graphic--golden-ratio | 200 |
| /dictionary/english/spc-graphic--graphic-design | 200 |
| /dictionary/english/spc-graphic--grid-system | 200 |
| /dictionary/english/spc-graphic--harmony | 200 |
| /dictionary/english/spc-graphic--layout | 200 |
| /dictionary/english/spc-graphic--modular-grid | 200 |
| /dictionary/english/spc-graphic--negative-space | 200 |
| /dictionary/english/spc-graphic--positive-space | 200 |
| /dictionary/english/spc-graphic--proportion | 200 |
| /dictionary/english/spc-graphic--proximity | 200 |
| /dictionary/english/spc-graphic--radial-balance | 200 |
| /dictionary/english/spc-graphic--repetition | 200 |
| /dictionary/english/spc-graphic--rhythm | 200 |
| /dictionary/english/spc-graphic--rule-of-thirds | 200 |
| /dictionary/english/spc-graphic--scale | 200 |
| /dictionary/english/spc-graphic--symmetry | 200 |
| /dictionary/english/spc-graphic--unity | 200 |
| /dictionary/english/spc-graphic--variety | 200 |
| /dictionary/english/spc-graphic--visual-communication | 200 |
| /dictionary/english/spc-graphic--visual-hierarchy | 200 |
| /dictionary/english/spc-graphic--white-space | 200 |
| /dictionary/english/spc-it-cloud-address-bus | 200 |
| /dictionary/english/spc-it-cloud-all-in-one | 200 |
| /dictionary/english/spc-it-cloud-analog | 200 |
| /dictionary/english/spc-it-cloud-architecture | 200 |
| /dictionary/english/spc-it-cloud-bandwidth | 200 |
| /dictionary/english/spc-it-cloud-binary | 200 |
| /dictionary/english/spc-it-cloud-bit | 200 |
| /dictionary/english/spc-it-cloud-bus | 200 |
| /dictionary/english/spc-it-cloud-byte | 200 |
| /dictionary/english/spc-it-cloud-clock-speed | 200 |
| /dictionary/english/spc-it-cloud-component | 200 |
| /dictionary/english/spc-it-cloud-computer | 200 |
| /dictionary/english/spc-it-cloud-data | 200 |
| /dictionary/english/spc-it-cloud-desktop | 200 |
| /dictionary/english/spc-it-cloud-firmware | 200 |
| /dictionary/english/spc-it-cloud-gigabyte | 200 |
| /dictionary/english/spc-it-cloud-hardware | 200 |
| /dictionary/english/spc-it-cloud-input | 200 |
| /dictionary/english/spc-it-cloud-instruction | 200 |
| /dictionary/english/spc-it-cloud-kilobyte | 200 |
| /dictionary/english/spc-it-cloud-laptop | 200 |
| /dictionary/english/spc-it-cloud-mainframe | 200 |
| /dictionary/english/spc-it-cloud-megabyte | 200 |
| /dictionary/english/spc-it-cloud-memory | 200 |
| /dictionary/english/spc-it-cloud-mini-pc | 200 |
| /dictionary/english/spc-it-cloud-output | 200 |
| /dictionary/english/spc-it-cloud-peripheral | 200 |
| /dictionary/english/spc-it-cloud-petabyte | 200 |
| /dictionary/english/spc-it-cloud-processing | 200 |
| /dictionary/english/spc-it-cloud-server | 200 |
| /dictionary/english/spc-it-cloud-software | 200 |
| /dictionary/english/spc-it-cloud-storage | 200 |
| /dictionary/english/spc-it-cloud-system | 200 |
| /dictionary/english/spc-it-cloud-terabyte | 200 |
| /dictionary/english/spc-it-cloud-workstation | 200 |
| /dictionary/english/spc-mechanic-absorption-refrigeration | 200 |
| /dictionary/english/spc-mechanic-air-cooled-condenser | 200 |
| /dictionary/english/spc-mechanic-brazed-plate-heat-exchanger | 200 |
| /dictionary/english/spc-mechanic-capillary-expansion-tube | 200 |
| /dictionary/english/spc-mechanic-centrifugal-compressor | 200 |
| /dictionary/english/spc-mechanic-centrifugal-oil-separator | 200 |
| /dictionary/english/spc-mechanic-condenser-unit | 200 |
| /dictionary/english/spc-mechanic-dew-point-temperature | 200 |
| /dictionary/english/spc-mechanic-dry-bulb-temperature | 200 |
| /dictionary/english/spc-mechanic-filter-drier-core | 200 |
| /dictionary/english/spc-mechanic-heat-transfer | 200 |
| /dictionary/english/spc-mechanic-hermetic-compressor | 200 |
| /dictionary/english/spc-mechanic-humidity-ratio | 200 |
| /dictionary/english/spc-mechanic-latent-heat | 200 |
| /dictionary/english/spc-mechanic-moisture-indicator-sight-glass | 200 |
| /dictionary/english/spc-mechanic-open-type-compressor | 200 |
| /dictionary/english/spc-mechanic-psychrometric-chart | 200 |
| /dictionary/english/spc-mechanic-reciprocating-compressor | 200 |
| /dictionary/english/spc-mechanic-refrigerant-compressor | 200 |
| /dictionary/english/spc-mechanic-refrigerant-solenoid-valve | 200 |
| /dictionary/english/spc-mechanic-refrigeration-cycle | 200 |
| /dictionary/english/spc-mechanic-relative-humidity | 200 |
| /dictionary/english/spc-mechanic-rotary-compressor | 200 |
| /dictionary/english/spc-mechanic-screw-compressor | 200 |
| /dictionary/english/spc-mechanic-scroll-compressor | 200 |
| /dictionary/english/spc-mechanic-semi-hermetic-compressor | 200 |
| /dictionary/english/spc-mechanic-sensible-heat | 200 |
| /dictionary/english/spc-mechanic-specific-enthalpy | 200 |
| /dictionary/english/spc-mechanic-specific-entropy | 200 |
| /dictionary/english/spc-mechanic-subcooling | 200 |
| /dictionary/english/spc-mechanic-superheat | 200 |
| /dictionary/english/spc-mechanic-thermal-conduction | 200 |
| /dictionary/english/spc-mechanic-thermal-convection | 200 |
| /dictionary/english/spc-mechanic-thermal-radiation | 200 |
| /dictionary/english/spc-mechanic-thermodynamics | 200 |
| /dictionary/english/spc-mechanic-vapor-compression-cycle | 200 |
| /dictionary/english/spc-mechanic-wet-bulb-temperature | 200 |
| /faq | 200 |
| /features | 200 |
| /flashcards/grammar | 200 |
| /flashcards/listening | 200 |
| /flashcards/reading | 200 |
| /flashcards/speaking | 200 |
| /flashcards/writing | 200 |
| /forgot-password | 200 |
| /help | 200 |
| /help/errors | 200 |
| /help/errors/1101 | 200 |
| /help/errors/400 | 200 |
| /help/errors/401 | 200 |
| /help/errors/403 | 200 |
| /help/errors/404 | 200 |
| /help/errors/408 | 200 |
| /help/errors/409 | 200 |
| /help/errors/410 | 200 |
| /help/errors/413 | 200 |
| /help/errors/415 | 200 |
| /help/errors/422 | 200 |
| /help/errors/429 | 200 |
| /help/errors/500 | 200 |
| /help/errors/502 | 200 |
| /help/errors/503 | 200 |
| /help/errors/504 | 200 |
| /intelligence | 200 |
| /intelligence/comprehension-depth | 200 |
| /intelligence/context-reconstruction | 200 |
| /intelligence/knowledge-graph | 200 |
| /intelligence/knowledge-to-language | 200 |
| /intelligence/language-dna | 200 |
| /intelligence/language-error-genome | 200 |
| /intelligence/language-observatory | 200 |
| /intelligence/language-quality | 200 |
| /intelligence/language-timeline | 200 |
| /intelligence/language-transfer-lab | 200 |
| /intelligence/learning-recovery | 200 |
| /intelligence/meaning-equivalence | 200 |
| /intelligence/personal-corpus | 200 |
| /intelligence/pronunciation-lab | 200 |
| /intelligence/real-world-simulator | 200 |
| /learner-meet | 200 |
| /learner-meet/sessions | 200 |
| /learning | 200 |
| /learning/chinese | 200 |
| /learning/english | 200 |
| /learning/path | 200 |
| /learning/skills | 200 |
| /lessons/chinese-business-lesson-01 | 200 |
| /lessons/chinese-logistics-lesson-01 | 200 |
| /lessons/chinese-manufacturing-lesson-01 | 200 |
| /lessons/chinese-week-01-lesson-01 | 200 |
| /lessons/chinese-week-01-lesson-02 | 200 |
| /lessons/chinese-week-01-lesson-03 | 200 |
| /lessons/chinese-week-02-lesson-01 | 200 |
| /lessons/chinese-week-02-lesson-02 | 200 |
| /lessons/chinese-week-02-lesson-03 | 200 |
| /lessons/chinese-week-03-lesson-01 | 200 |
| /lessons/chinese-week-03-lesson-02 | 200 |
| /lessons/chinese-week-03-lesson-03 | 200 |
| /lessons/chinese-week-04-lesson-01 | 200 |
| /lessons/chinese-week-04-lesson-02 | 200 |
| /lessons/chinese-week-04-lesson-03 | 200 |
| /lessons/chinese-week-05-lesson-01 | 200 |
| /lessons/chinese-week-05-lesson-02 | 200 |
| /lessons/chinese-week-05-lesson-03 | 200 |
| /lessons/chinese-week-06-lesson-01 | 200 |
| /lessons/chinese-week-06-lesson-02 | 200 |
| /lessons/chinese-week-06-lesson-03 | 200 |
| /lessons/chinese-week-07-lesson-01 | 200 |
| /lessons/chinese-week-07-lesson-02 | 200 |
| /lessons/chinese-week-07-lesson-03 | 200 |
| /lessons/chinese-week-08-lesson-01 | 200 |
| /lessons/chinese-week-08-lesson-02 | 200 |
| /lessons/chinese-week-08-lesson-03 | 200 |
| /lessons/chinese-week-09-lesson-01 | 200 |
| /lessons/chinese-week-09-lesson-02 | 200 |
| /lessons/chinese-week-09-lesson-03 | 200 |
| /lessons/chinese-week-10-lesson-01 | 200 |
| /lessons/chinese-week-10-lesson-02 | 200 |
| /lessons/chinese-week-10-lesson-03 | 200 |
| /lessons/chinese-week-11-lesson-01 | 200 |
| /lessons/chinese-week-11-lesson-02 | 200 |
| /lessons/chinese-week-11-lesson-03 | 200 |
| /lessons/chinese-week-12-lesson-01 | 200 |
| /lessons/chinese-week-12-lesson-02 | 200 |
| /lessons/chinese-week-12-lesson-03 | 200 |
| /lessons/english-automotive-lesson-01 | 200 |
| /lessons/english-design-healthcare-lesson-01 | 200 |
| /lessons/english-it-cloud-lesson-01 | 200 |
| /lessons/english-mechanical-lesson-01 | 200 |
| /lessons/english-week-01-lesson-01 | 200 |
| /lessons/english-week-01-lesson-02 | 200 |
| /lessons/english-week-01-lesson-03 | 200 |
| /lessons/english-week-02-lesson-01 | 200 |
| /lessons/english-week-02-lesson-02 | 200 |
| /lessons/english-week-02-lesson-03 | 200 |
| /lessons/english-week-03-lesson-01 | 200 |
| /lessons/english-week-03-lesson-02 | 200 |
| /lessons/english-week-03-lesson-03 | 200 |
| /lessons/english-week-04-lesson-01 | 200 |
| /lessons/english-week-04-lesson-02 | 200 |
| /lessons/english-week-04-lesson-03 | 200 |
| /lessons/english-week-05-lesson-01 | 200 |
| /lessons/english-week-05-lesson-02 | 200 |
| /lessons/english-week-05-lesson-03 | 200 |
| /lessons/english-week-06-lesson-01 | 200 |
| /lessons/english-week-06-lesson-02 | 200 |
| /lessons/english-week-06-lesson-03 | 200 |
| /lessons/english-week-07-lesson-01 | 200 |
| /lessons/english-week-07-lesson-02 | 200 |
| /lessons/english-week-07-lesson-03 | 200 |
| /lessons/english-week-08-lesson-01 | 200 |
| /lessons/english-week-08-lesson-02 | 200 |
| /lessons/english-week-08-lesson-03 | 200 |
| /lessons/english-week-09-lesson-01 | 200 |
| /lessons/english-week-09-lesson-02 | 200 |
| /lessons/english-week-09-lesson-03 | 200 |
| /lessons/english-week-10-lesson-01 | 200 |
| /lessons/english-week-10-lesson-02 | 200 |
| /lessons/english-week-10-lesson-03 | 200 |
| /lessons/english-week-11-lesson-01 | 200 |
| /lessons/english-week-11-lesson-02 | 200 |
| /lessons/english-week-11-lesson-03 | 200 |
| /lessons/english-week-12-lesson-01 | 200 |
| /lessons/english-week-12-lesson-02 | 200 |
| /lessons/english-week-12-lesson-03 | 200 |
| /login | 200 |
| /modules/chinese-beginner-module-1 | 200 |
| /modules/chinese-business-module-1 | 200 |
| /modules/chinese-logistics-module-1 | 200 |
| /modules/chinese-manufacturing-module-1 | 200 |
| /modules/english-automotive-module-1 | 200 |
| /modules/english-beginner-module-1 | 200 |
| /modules/english-design-healthcare-module-1 | 200 |
| /modules/english-it-cloud-module-1 | 200 |
| /modules/english-mechanical-module-1 | 200 |
| /my-knowledge | 302 |
| /my-learning | 302 |
| /my-mistakes | 302 |
| /policies/privacy | 200 |
| /policies/terms | 200 |
| /practice | 200 |
| /practice/grammar | 200 |
| /practice/history | 302 |
| /practice/listening | 200 |
| /practice/reading | 200 |
| /practice/speaking | 200 |
| /practice/vocabulary | 200 |
| /practice/writing | 200 |
| /programs/chinese-foundation-hsk1 | 200 |
| /programs/chinese-foundation-hsk1/levels/hsk-1 | 200 |
| /programs/chinese-specialized-logistics | 200 |
| /programs/english-foundation-a1 | 200 |
| /programs/english-foundation-a1/levels/cefr-a1 | 200 |
| /programs/english-specialized-it-cloud | 200 |
| /reader | 200 |
| /reader/en-specialized-incident-report-reading | 200 |
| /reader/zh-hsk1-daily-greetings-dialogue | 200 |
| /reader/zh-specialized-logistics-bill-of-lading | 200 |
| /register | 200 |
| /search | 200 |
| /skills/grammar | 200 |
| /skills/listening | 200 |
| /skills/pronunciation | 200 |
| /skills/reading | 200 |
| /skills/speaking | 200 |
| /skills/vocabulary | 200 |
| /skills/writing | 200 |
| /specialized | 200 |
| /specialized/automotive | 200 |
| /specialized/bao-tri-thiet-bi-co-dien | 200 |
| /specialized/business | 200 |
| /specialized/cat-got-kim-loai | 200 |
| /specialized/chinese | 200 |
| /specialized/co-dien-tu | 200 |
| /specialized/cong-nghe-o-to | 200 |
| /specialized/dien-cong-nghiep | 200 |
| /specialized/dien-tu-cong-nghiep | 200 |
| /specialized/economics-tourism | 200 |
| /specialized/electrical-electronics | 200 |
| /specialized/english | 200 |
| /specialized/graphic-design | 200 |
| /specialized/healthcare | 200 |
| /specialized/import-export | 200 |
| /specialized/it-cloud | 200 |
| /specialized/ke-toan-doanh-nghiep | 200 |
| /specialized/ky-thuat-may-lanh-dhkk | 200 |
| /specialized/logistics | 200 |
| /specialized/mechanical-engineering | 200 |
| /specialized/nguoi-sua-chua-may-cong-cu | 200 |
| /specialized/quan-tri-mang-may-tinh | 200 |
| /specialized/sua-chua-lap-rap-may-tinh | 200 |
| /specialized/thiet-ke-do-hoa | 200 |
| /styles/design-system.css | 200 |
| /vocabulary/flashcards | 200 |
| /vocabulary/notebook | 302 |
| /vocabulary/review | 302 |
| /vocabulary/sets | 302 |
| /weeks/chinese-beginner-week-01 | 200 |
| /weeks/chinese-beginner-week-02 | 200 |
| /weeks/chinese-beginner-week-03 | 200 |
| /weeks/chinese-beginner-week-04 | 200 |
| /weeks/chinese-beginner-week-05 | 200 |
| /weeks/chinese-beginner-week-06 | 200 |
| /weeks/chinese-beginner-week-07 | 200 |
| /weeks/chinese-beginner-week-08 | 200 |
| /weeks/chinese-beginner-week-09 | 200 |
| /weeks/chinese-beginner-week-10 | 200 |
| /weeks/chinese-beginner-week-11 | 200 |
| /weeks/chinese-beginner-week-12 | 200 |
| /weeks/chinese-business-week-01 | 200 |
| /weeks/chinese-logistics-week-01 | 200 |
| /weeks/chinese-manufacturing-week-01 | 200 |
| /weeks/english-automotive-week-01 | 200 |
| /weeks/english-beginner-week-01 | 200 |
| /weeks/english-beginner-week-02 | 200 |
| /weeks/english-beginner-week-03 | 200 |
| /weeks/english-beginner-week-04 | 200 |
| /weeks/english-beginner-week-05 | 200 |
| /weeks/english-beginner-week-06 | 200 |
| /weeks/english-beginner-week-07 | 200 |
| /weeks/english-beginner-week-08 | 200 |
| /weeks/english-beginner-week-09 | 200 |
| /weeks/english-beginner-week-10 | 200 |
| /weeks/english-beginner-week-11 | 200 |
| /weeks/english-beginner-week-12 | 200 |
| /weeks/english-design-healthcare-week-01 | 200 |
| /weeks/english-it-cloud-week-01 | 200 |
| /weeks/english-mechanical-week-01 | 200 |

## Kiểm kê 176 tệp ZIP đầu vào trước lần thu gọn

| input_path | bytes | input_sha256 | classification | delivery_status |
|---|---|---|---|---|
| README.md | 6669 | 7d611d9817997b6759651ed65d625716589d48eceeb4f758dead3d74a6808a31 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| database/documentation/SCHEMA-OVERVIEW.md | 2334 | 43c0952813224f87a1c90103cfcd3b0c1aab22a1283bfa5934cd674ae5b7e613 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/documentation/SCHEMA-REFERENCE.md | 9408 | 2174cac6434cb1423cc127992af25f36041c28a39c6a5a7cfed7cf954210d4d0 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0001_core_accounts_rbac.sql | 6781 | 0a70916c67c4263c6f0a553dc77dc04e452e2c198f7b444a7771d9a90b3ab3e3 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0001_initial_schema.sql | 24222 | 93de520d56b1fd438d2ad3ef67b707e3376305b908991b5cc135953cb27967da | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0002_language_intelligence_15_systems.sql | 10519 | 426aaa0a60cbbbce663b32c2409fafc27b8f5c82d198f632dc7a382d6a9ce8f7 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0002_languages_curriculum.sql | 8613 | 0b7b0a7044b173448cb9a801fa269cda744360fcb4ff8d214dfaafc1d74bc33a | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0003_dictionary_vocabulary_audio.sql | 4925 | e9818193adac88e85f458318a1330c8598330c3dac7a164e47a3215968b4e3ba | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0003_initial_seed_catalog.sql | 15961 | 47a293cba31e469effe4f3f8795510f7451ba6fb8a49fd578fbce3ffae3334b4 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0004_academic_content_seed.sql | 57633 | d2b066eb593f7454ca81661732e6b4e0be66c3c6a11bfbff57c06af10ee64c55 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0004_practice_examinations.sql | 4369 | 1a1457f97c5b8dcd624f2de187844b13d01d4a2f5ddc4230bea0f98afe1b1e8d | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0005_learner_meet_intelligence.sql | 3023 | 856bea13716270da5cde27628bffb023d2d2a57c85e45ea1d3f2869a6306c8aa | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0006_email_automation_jobs_audit.sql | 3851 | c39edf86b18df7de6c6f111cb2a09947759831b4d35d3f404ea1c26ecdb3115d | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0007_seed_academic_baseline.sql | 141984 | d0c5d26486643ec69779a75cf6b8731e259b294e4246586b7259471db5d0e487 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0008_seed_specialized_vocab_user_dataset.sql | 194734 | 092387aaaa7e30b2ae73bcb46444a08158a5a182439d2ca71fbefab0e198f04f | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0009_v31_security_and_curriculum_extensions.sql | 2696 | 190771c9d6940b832584da63171ad9171188720557944122fc75bdcd8d731d5a | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0010_seed_complete_108_sessions_lessons_and_specialized.sql | 417839 | 942337ceb027c8e3be24a448274fbf332ad4a3bac91ac235c55dbb5dcd24d032 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0011_seed_balanced_trilingual_dictionary_and_audio.sql | 94097 | 27fbd888ca03492bfa7433c96dee5b6b895b5df32ce8107cebbb2faa1aa04c6b | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0012_v32_real_curriculum_content.sql | 232674 | e17ccb55dfbf9511bc8211ea16c97e0917d410e13cccf01000feab89229591bb | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/migrations/0013_v41_one_domain_admin_help_reader_remove_exam.sql | 16010 | c5b8d19059736777f9c4fb9a83251ae1894b79b4208cd28c519bf4513c577640 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| database/rollbacks/0013_v41_rollback.sql | 1888 | dcd409fa85683422ad58667064325d6798cb105d37b10ffc1a5ac9d3b2e25cf4 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/1000-WEBSITE-RESEARCH.md | 1619 | fb03725d64b2388c3db09eecc20200e9d0cd95f4c9c64d9e9fa10f5f70ea8003 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/50-WEBSITE-RESEARCH.md | 62463 | 1355fc44220396501a45fa37383870a1bbe6eb1a8f2e8d00deea621c6203e9b0 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/ACCEPTANCE.md | 21669 | bbbf9cde5c80be9c1c714328529789086fdbd6ec3e9ad2d4ea88964425a0edac | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/API-DOCUMENTATION.md | 3548 | a35baefd2ec30ddbdeca075bc4e40208c87dfac4bc90aeda4f31afc2d2f207c2 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/ARCHITECTURE.md | 2049 | fa791acbf5f227a4e105a75ae4f8f6465a70865f4ae04bb99e0271e9b2463c4b | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/CHANGELOG.md | 1517 | 0ac431ce4684927573a31da7aaa2731bc30620dfa6b06ac21c47708630d9c519 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/COMPETITIVE-ANALYSIS.md | 851 | 79fc5a2ec79ea871f0f7d82081c43f3201e8d46e498748a4354a491c129c3afa | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/CURRICULUM-SPECIFICATION.md | 1111 | f66eb505734d0db2f7ec9a8ee057c0dca1e8dd5a47d1f7ceb6a35cbee7da4e37 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/DATABASE.md | 2334 | 43c0952813224f87a1c90103cfcd3b0c1aab22a1283bfa5934cd674ae5b7e613 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/DEPLOYMENT.md | 1095 | 6472fb1e18ceb3d511ec68c3ac153cc073a3b9117cf722b69811eab7bc33a62f | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/EMAIL-SPECIFICATION.md | 1722 | 2368917e0351dd1d8cd6e875202382a71f7b23f0238e1a349f462b44c04a63fc | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/FEATURE-SPECIFICATION.md | 1761 | 27752d9b6b22128fbe0c9b5b1fab72c77cb3a23fc5a6472de679f4d5ccab0cf9 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/MULTI-PAGE-SITEMAP.md | 2651 | 4388e672f2bab685917aba062a505abc66e5c5eb8b5ce834fec15b270cd43cab | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/OPERATIONS.md | 1574 | 132eac9ed619dd04530f685565de50f4bf349b67815990d3d1c2e036a93e77a2 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/PRODUCT-BENCHMARK.md | 1054 | 9a451b8a6f360489574d720490e692c8a9d088741e7134e8b55556e351e37a48 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/REMAINING-ISSUES.md | 2748 | d582a30c36bc892a8aa0cfb2c372fb7ef288d2545db0f635a555ac1f84afd274 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/SECURITY.md | 1553 | fba8983d8daceb817f67be2210293bdb1d869629bac61c11e75c1df2ca95ab34 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/TEST-REPORT.md | 2371 | 790ba34907abc30d147b438f0bc1de401c6ae0ff9abfd1544c19bc9d7fa919a1 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/UI-UX-SPECIFICATION.md | 963 | 49c7dfd48e4134ffd67448651df418bd5d7e07a82133b4a9d0d06b2dc5778eb8 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| docs/WEBSITE-RESEARCH-INDEX.csv | 20014 | 3a2805b8de05755da3d806ad232cca0596210e294ef8351d7cd9803e111fbb2a | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| email/documentation/DOMAIN-AUTH-DNS.md | 1722 | 2368917e0351dd1d8cd6e875202382a71f7b23f0238e1a349f462b44c04a63fc | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| email/layouts/base-layout.js | 6137 | e5ddc6d8a26631ca93eadde0cf81d63e8ff593fb55994fbcaa034b4096e3d235 | Worker import | Đã cập nhật |
| email/templates/01-email-verification.html | 2653 | 2f59ce64c1b6ad2463fb6e3cabd7521b324a877a249f46d0ae640a479f53fa72 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/02-welcome.html | 2694 | 181ee8ece1e05bde194a76c72ce795687ff9a89f8c5dcd080fe0c5f9b34661d6 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/03-password-recovery.html | 2666 | 4065e6c54358414b57c8b5e06750c8fe4f059ee5b40261a963440f43507e9dad | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/04-new-login-alert.html | 2672 | 3457c83bb85b311a413eca86b7711e9c876dd34b566875fdd493c840965d0168 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/05-security-change.html | 2666 | edbf39d86206e5f0c8368e2fbd511085ae0e1cb316a9a6a0f1b3d5dccb460171 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/06-account-notice.html | 2681 | 437f105df4ddf3301d53526cf8c9e05bf413caaef79044f32099084842d3a8d5 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/07-learning-notice.html | 2698 | 44e03a97cc92d29ab4c0592cc734445e0c7c5817f838445d66e8dbc7617033d8 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/08-exam-notice.html | 2670 | 6024ea06405103aa5caf602c27e87d242b47bb4e2a6a8366d9597637a1a10b06 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/09-system-notice.html | 2668 | 4d6339d7d12cb86606e299a172cf80c3a568bf9c4f188827e5540b3512a4420d | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/10-support-response.html | 2668 | 5e3c757108846a26af8079e6b9c918879946fa253e0978f9d74cc0eed59a2168 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/11-contact-inquiry.html | 2665 | 3b0f012f81cf16793bfe1914a229ce47d91f420cfb67ab1d802fe6affeee013a | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| email/templates/registry.js | 13205 | ad70b7c052ca5d5645c1b3648e6e50cf3fed2baee5188569b2f16c8270dfa4e2 | Worker import | Giữ nguyên |
| package.json | 1474 | 5a95e31376cfbf86f3f92a3c002e2d1f478c9738cc58e372e94605c0ed8e9020 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| public/assets/app-client.js | 22071 | 25926fe13d2e85a76c3d657db71fba59c29505dc73c932403a22367455499e43 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/assets/design-system.css | 7637 | 5224b679520ee0f29d640f820bd8dace257ad9ab54c67d1304c6ce535f99e824 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/branding/README-LOGO-SLOT.md | 1258 | 20c819761c00bd74bb65a0e2c9139cf5360ff97b3d60efedde48f0e44bf321f5 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/branding/README.md | 1097 | 0107005dbeaa87bf08c3cace299a860e588547c0723af7580a9ecec920ac3fb4 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/branding/card-en.jpg | 20213 | b496d801f82ef4147dfce6ad4559f4bac5efb51a48361f6d7d36c4f2b579b4ac | Tài sản web | Giữ nguyên |
| public/branding/card-ru.jpg | 22960 | 7017d282a9fefc514d73012ab1751f172dcc78c0d11ed013b7a9967105b4a601 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/branding/card-zh.jpg | 24242 | dc0eaaed77eea9594773b2d1bf9de9d7163eba1158271ac814845b124d7aacba | Tài sản web | Giữ nguyên |
| public/branding/favicon.png | 16099 | 948e5d4af2f5e8aafd7d1de7b66c2d8569cde6bc2c9a39271a6353f38f263dfc | Tài sản web | Giữ nguyên |
| public/branding/footer-glow-book.jpg | 11903 | 362e7b135ec072099c35a10f9131678c76b748f8b82590c717fceefeae3f9a03 | Tài sản web | Giữ nguyên |
| public/branding/hero-books.jpg | 37626 | 336816e4aa3e2715a030b687686aff84943b74fe28c04a5a855101d7c62ec183 | Tài sản web | Đã rút khỏi gói; còn trong ZIP đầu vào |
| public/branding/logo-reference.jpg | 66569 | e28ce9150de194448a6861d96b5c179ce9ebb2d45a38f6e9f1e1f251a5b89c6e | Tài sản web | Giữ nguyên |
| public/branding/logo-wordbridge.jpg | 66569 | e28ce9150de194448a6861d96b5c179ce9ebb2d45a38f6e9f1e1f251a5b89c6e | Tài sản web | Giữ nguyên |
| public/branding/logo-wordbridge.svg | 1310 | 4429efdd301ca983c3fbe3f95caadb3f59960315f250972b81d59a49ad36250e | Tài sản web | Giữ nguyên |
| public/data/vocab/bao-tri-thiet-bi-co-dien.json | 152891 | e5440ded37aac597b54b31ea0b404b588cd2dbe7c330c02b29f3701900eca1d4 | Tài sản web | Giữ nguyên |
| public/data/vocab/cat-got-kim-loai.json | 140257 | 977815a9a932162c740b5cc39a497cd51d117917c335bcc44221aa39f39bc747 | Tài sản web | Giữ nguyên |
| public/data/vocab/co-dien-tu.json | 136041 | db853ce0bb45064c00cdf6ede4acce193b426372ed78d60241a3e674d11e8d40 | Tài sản web | Giữ nguyên |
| public/data/vocab/cong-nghe-o-to.json | 226142 | 45526d86faf81c5be01136e01754575c5269669f07c2a98ec5b0bab0436b62a4 | Tài sản web | Giữ nguyên |
| public/data/vocab/dien-cong-nghiep.json | 144662 | 5eb75f7ae7fe9f0aba964fae0be1666025929b874b0273843995852785512eb6 | Tài sản web | Giữ nguyên |
| public/data/vocab/dien-tu-cong-nghiep.json | 153695 | a881ea63ef433752ea8ef73abdb1fcf33f4e6c13a00e28512853ab93054f7250 | Tài sản web | Giữ nguyên |
| public/data/vocab/digital-business.json | 733279 | 628badacf1e51a0bee4a8125f72d158074a196644b0e0537ac99e887f0983b71 | Tài sản web | Giữ nguyên |
| public/data/vocab/index.json | 8267 | 76026e522050300c643e12a01f76d2672c02b36b91ac7b4862aaed145347dc5d | Tài sản web | Giữ nguyên |
| public/data/vocab/industrial.json | 587375 | d8af4ee412b46fbc68e7b7b142ed143311be2341cfb562dcb429b2e4105f4838 | Tài sản web | Giữ nguyên |
| public/data/vocab/ke-toan-doanh-nghiep.json | 171123 | ba29d4178b817821e3427b216f353a6f03b9ca27ff12de05e4c47492ac15fccf | Tài sản web | Giữ nguyên |
| public/data/vocab/ky-thuat-may-lanh-dhkk.json | 243342 | 9faaa2feda854cefb3e208822e3f498cf281752743aab2fcf0a9478bc2559f72 | Tài sản web | Giữ nguyên |
| public/data/vocab/mechanical.json | 757023 | ab26f28294822a45da21f201fc07a62142940963bd9dcfba5bf4ea393d9b36a1 | Tài sản web | Giữ nguyên |
| public/data/vocab/nguoi-sua-chua-may-cong-cu.json | 147187 | 1e475c8fa02a2162243ee29bb4415859707f36c6da8a77b65c0dbe51f15a173f | Tài sản web | Giữ nguyên |
| public/data/vocab/quan-tri-mang-may-tinh.json | 212942 | 416f25fe4228e478368a96e066950101d62968d6d88e5d2d28cdc91019e9a69c | Tài sản web | Giữ nguyên |
| public/data/vocab/sua-chua-lap-rap-may-tinh.json | 166259 | a5fe47579f76b36403d09ac9dd3ca97be6041cc572158a5f47020be676f49592 | Tài sản web | Giữ nguyên |
| public/data/vocab/thiet-ke-do-hoa.json | 182856 | c3f24696206c67eabbae8c7c7d2b5f2bc98e0ce6acf4326c809da1e1072a77da | Tài sản web | Giữ nguyên |
| public/scripts/app.js | 25835 | b660063d8f7052f1164d6395837ddb0afc7fccdf332807241adee687ef141066 | Tài sản web | Đã cập nhật |
| public/scripts/i18n.js | 64499 | 6f3c5cca02d096355eda9cf77c6764ee2b96fbb0eb31d2749aaa200a0d8341cc | Tài sản web | Đã cập nhật |
| public/scripts/vocab-explorer.js | 6245 | 808b3be6bdc31a7a7d47b2fe74faecea7ca678d185af0cc09dedc82415ec4b2f | Tài sản web | Giữ nguyên |
| public/styles/design-system.css | 25395 | 2f193a5e1fde0ca63f9644c85338cf1ba89d22ef9b40cdd943575d4d2160cddc | Tài sản web | Đã cập nhật |
| scripts/audit-ui.mjs | 1867 | d155cac85fb336cd66e7f9914a3c5319893a3260e8825fa8422eb4e8f3c12a1b | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/build.mjs | 892 | 7cc8c43186dd4ff88b6db6f73c50a75b1e6a487bb0f3190284afae57fbd6cd2d | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| scripts/d1-backup.sh | 468 | 2473db6207d79fd702f8960e7aa1b92fdb72af32e113411695755b75b838fd12 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/d1-restore.sh | 738 | bb7761d1cd159f158518a2a3b44d621ad9cddb593eda43033b4ebb50285446de | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/dev-server.mjs | 1880 | bd26926f57cb27c494ea769bbb31bce217742d60b997055ec0a60b57ab10d897 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| scripts/generate-d1-seeds.py | 55272 | 302eefb845465c8de3109928c4cdc86dba211c0fdc0b4a9c563bc6a813e2f3b9 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/generate-v31-seeds.py | 47162 | 79ce5183d8a1f4422bffa35786c22957eddc5a3d48078aff745465ef4207dc9b | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/generate-v32-real-curriculum.py | 13880 | 1d9423d478024ab9fbfd241852c1a46b1d3418057e5d962bf1d828e0e458da75 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| scripts/qa-browser.mjs | 3289 | 78946ec21728ca6a1c2ccad94067d19d0e3f2db814773115d8dc983a8346002c | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| scripts/qa_selenium.py | 3699 | 16dc23de65d7c826df544d0bd60d2f3e54bd1ec6f7d5f48e9a0ef5c143720bd5 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| scripts/run-local-dev.mjs | 2229 | cfb852b9c60c27bf409206871d325d4746dce3524ea5d875c4afd8a5d48b7ac2 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| src/api/router.js | 39643 | 1d4efa1783ea4b1041c94642289022e6f7ce9a20b4f80491fee2757c21fe8b44 | Worker import | Đã cập nhật |
| src/api/router.mjs | 77345 | 5c6ee492a4621388d2460ce0e4a5e89304bd69607963981254d64b2e70dc9e54 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/config/constants.js | 14630 | be67363f3a9c1c7973175f33b9bcb0d64967f734c567f27c030d17f47cecff2f | Worker import | Đã cập nhật |
| src/config/sitemap.js | 3713 | 167431bee68e6222eaefaa0885c418942534116cd4e88f4806ea92925821dc28 | Worker import | Đã cập nhật |
| src/index.js | 21609 | 79b7a3cb9cfea7295b49acf6a8e925c539085183c921d7913500645f8cb8550a | Worker import | Đã cập nhật |
| src/layouts/site-layout.js | 12437 | a34957a4377df0dcb8239a687225c9d19e453afa4cedb55dd29308adf182ad85 | Worker import | Đã cập nhật |
| src/modules/account/sso-pdf-reader.mjs | 1407 | 220324d183cf07ca2362b6f503d559363e8f3faa10099a0af221c8b01a62d680 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/administration/admin-service.js | 34681 | ec28d0ecc8f0b8cbc92b14e5172f7095843d69ca755b794d1204ab3482b332ef | Worker import | Giữ nguyên |
| src/modules/administration/centers.mjs | 7322 | 78c2ee4fe6a4e3aa907aa7851af389e80d5d0cf76803ecdbefbc065aea0b4cd7 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/administration/legacy-domains.mjs | 12894 | b40ff43afc926d810d35912f0b80706fc162f796066157f692a3ce2ad73608ae | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/audio/audio-service.js | 2772 | 507f0f65b4cc14a29f30f0669bbe950c2bc19a20f55258573e0ce30231c71a6d | Worker import | Đã cập nhật |
| src/modules/audio/media-service.js | 7032 | b0c9a6212344ebe9ffeec0ea0a7baea3bf51fdddca15d80fbee8cc2aab343e69 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| src/modules/dictionary/dictionary-service.js | 15584 | aea8d12c55c4f2ef1a415dc6dab47c3d543a39cf7acd899c9f4e13af8dd4fb0d | Worker import | Đã cập nhật |
| src/modules/dictionary/spaced-repetition.mjs | 1176 | 71f3aceff2d98bbebc4e8fd718aa442c2e5a194097c783f1b1cefe29d3aab640 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/examination/examination-service.js | 5164 | 37f7c20e1990187246fba14cc789fc2395d52c2b142ac9078652bb0a8cf9deb8 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/examination/grading.mjs | 2906 | b8137ac267408ea042dd662e59512a8b5745b2176185c8b4c67b01f8c9620fc8 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/examination/learning-rules.mjs | 4085 | 5400105c0a2b14b8edf0b5caea5cb799ddc74447eee70b98e632dade302a7c19 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/intelligence/intelligence-service.js | 18063 | 5f9da7dfec22b6d68f7097b5583eda2a7f20ce0fd394a53e9d70c183fda3e3f6 | Worker import | Đã cập nhật |
| src/modules/language-intelligence/engine.mjs | 35208 | 900c9dd9bcddd9f5345d7e72cfe6916a18e5ea54efcba8042a7a1be84aedff3a | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/learner-meet/learner-meet-service.js | 5477 | f36058e487a9bfb711462ea42d57b875be8d37b881aa56640cfbc12f75b3be23 | Worker import | Đã cập nhật |
| src/modules/learner-meet/service.mjs | 4149 | ad6f8d251d2c4c2eb2a7684b8f70f0ea1ff1c4f931b236e3d8960f51a6509b47 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/modules/practice/assessment-service.js | 10054 | ef740b7f5ddc892f748b1cc7334a602490287f5e2f06ca086a6b8246787052aa | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| src/modules/practice/practice-service.js | 4533 | 98622f90a311d166a2cbc922adf8799e00983ff0159318a0f038afd38f2ca5f1 | Worker import | Đã cập nhật |
| src/modules/reader/reader-service.js | 5667 | 0e73071633851cc06d7e1a6911e8c277bbf6bd3a5a5b99d2c59badd6816086aa | Worker import | Đã cập nhật |
| src/pages/account-pages.js | 14275 | 53eb9602096b8ace1f2402fa8dc415b7ba0f6e52a97dddfebc64f139c0c8dd33 | Worker import | Đã cập nhật |
| src/pages/admin-pages.js | 27580 | bbed1134a40be6072e3f3c28230e4d6a0f281d28f24d31b2b45cc6ae7151ad22 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| src/pages/app-shell.mjs | 38726 | be5d8a66a7da068d6979d9d8c974b7d66184a71bfb219ba4ac93fe4dae701b06 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| src/pages/dictionary-pages.js | 29212 | 4422983008b2325c17043ac08798ee337137722701196fb6271a975208bb54e9 | Worker import | Đã cập nhật |
| src/pages/features-page.js | 4866 | 2e4e33c32a4257655dbe3939c98eb2716c41c59a1c12f04efa62eb5f2a40f519 | Worker import | Đã cập nhật |
| src/pages/help-pages.js | 10965 | 43fbcc6c51d0f8aa1f971dc4c2bef442d93fd68757a51dd98821936f00183790 | Worker import | Đã cập nhật |
| src/pages/intelligence-pages.js | 5235 | c8e6e0de084fa4bf52e09cc2e4e15644b8e46a061aca5725d86909518b0d387b | Worker import | Đã cập nhật |
| src/pages/learning-pages.js | 35381 | de95963b1f4de5da19b1198ca81b61b437fc83fe97db0ebd8236f8fb6942f847 | Worker import | Đã cập nhật |
| src/pages/learning-system-pages.js | 27663 | 4a020f10e41d3ae7eef12ad4b6668416bbe8d0496749877f447b049b28d0e7a9 | Worker import | Đã cập nhật |
| src/pages/practice-exam-pages.js | 19435 | 589d77cc78e6a49d94961bf0334bcee333da904107ff7cce66d6f3dafb6cdea6 | Worker import | Đã cập nhật |
| src/pages/public-pages.js | 10918 | 3cdd8c19168fd36ecc2ec915ac2281a985edf3bcb4edfd9db37c9b03c6487ec8 | Worker import | Đã cập nhật |
| src/pages/reader-pages.js | 10321 | 240168f4e907a5b562f96bb6d1c450353f1542a4dfb1debb1b0d7f3391711ec9 | Worker import | Đã cập nhật |
| src/pages/specialized-meet-pages.js | 13435 | 55a96597014a4ed13a67ff2ebae8ffc78d57025686affc07fd6f2cb402eb978a | Worker import | Đã cập nhật |
| src/services/auth-service.js | 27081 | aec60557c16356720ca88cdf7957e3045e18fe5825311e7cf27fe5fa0ff990c8 | Worker import | Đã cập nhật |
| src/services/d1-database.mjs | 60387 | 1349ac43f0cb812a5800aa7d011691278eb78a763a41e0afd18a6e1b1e01099f | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/services/email-service.js | 11103 | e71c60904268adbecb27299714e8b8b4b38f9d0d9389e472399043bfcb6fce35 | Worker import | Giữ nguyên |
| src/services/email-service.mjs | 12775 | a1a397ed26148880064a45220c4b5d2546626bc4df187acebd7bb19d54d6f995 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/services/jobs-service.js | 4497 | b71390d4be40051c239b7753e9e0010a6e48538be24e99cdb87ca86579f351d8 | Worker import | Giữ nguyên |
| src/services/quantri-client.js | 1531 | ca4366e5e1dfd63851e23642fb0f8667d244f5b9ccd31ff6646b7cb2cd67df56 | Worker import | Đã cập nhật |
| src/services/r2-storage.mjs | 7843 | 9f1a21f004904f6a8bf65b30c8ccc4327535947b8e1fdfe997611200bc75d0ad | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/services/student-benefit-service.js | 7480 | 8d132d195f7909fb07e12f628247fe70a82ac2cb70aca32b158ec4ebed874111 | Worker import | Đã cập nhật |
| src/styles/design-system.css | 7637 | 5224b679520ee0f29d640f820bd8dace257ad9ab54c67d1304c6ce535f99e824 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/types/index.d.ts | 1387 | da4ab2e8f450b5a663b3195ad7a9c232f5d67c7563866f1f00a0932db89baa21 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| src/utils/crypto.js | 3016 | 6ec544dcf4d0c95805222636905f134cab788e922793371640f9199dc3b50ccb | Worker import | Giữ nguyên |
| src/utils/http.js | 2456 | 4e14244079cede06cef3974c1ca4ce60474b5fb5a2cf9d45e25048e1c6c39966 | Worker import | Đã cập nhật |
| src/utils/security.mjs | 7439 | 0b3ee282dc7a055d6b29de6c857f3889e65a6575dec5f00a01064b3c815349b2 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| src/utils/validation.js | 4770 | 22e11384dddf69038e162ab73f56f5f236f596ebfd9eb0b44d5ac98af60aa11e | Worker import | Đã cập nhật |
| src/worker.mjs | 39921 | 5f2152e341262c8db86c4b4309a8b750e42a9fb82b8f49307f01923d5898f0cb | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| storage/documentation/R2-STORAGE-POLICY.md | 681 | 19cb74e64c97e804805f57a446836d9a6402a20d95da3592c8f91475280db252 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| storage/r2-adapter.js | 4791 | 85d34ef949a9842b85c5d24d4f52838333246eae70b3d736d8f26964e371a29d | Worker import | Giữ nguyên |
| tests/e2e/acceptance-29-items.test.mjs | 3661 | 0e16bd0778d83d2e1e78fc98084b0561ff0f69e96c072d76ca503893e241d32d | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/e2e/acceptance.py | 7264 | 6d306f75c8ab8aa625b1409dd54ebc27727a9e0cece6d700c679bb44587dca93 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/e2e/combined.test.mjs | 10961 | 9d43a1052bed00c4e0fe9fed446ee21d4b245207c2200474da1cef39fc70dc13 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/e2e/user-journeys.test.js | 6945 | bb3687dbbfed99ccf4f0fb82c4128708e1da41aaa1a52cbe8ddffc81331f6c41 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/helpers/sqlite-d1-shim.js | 3285 | 6886ceee2f0cf1270791800b4701833bc3ea22f19a2cee1bb5aefada2732fbdd | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/helpers/sqlite_bridge.py | 1485 | a5453f9b337eb2f9bf5ce30c72025bc8eaa211d4c5164d1b84ddd2520566f87e | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| tests/integration/api-workflows.test.mjs | 6892 | c8c61b10c512d6148d2d642019db790f00c4bf2ffcadb2f7f99480f0b5262a69 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/integration/combined.test.mjs | 25739 | 39058d755dbfe790fe9d3624266b69fea0dd090a7de38f76cf801e09d1cc5945 | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/integration/migrations-d1.test.js | 3091 | 56fc3d83bdca9ac745b7d7dec82cbaff681473cb124447f7e5988f40f9ae44ca | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| tests/integration/multipage-navigation.test.js | 3320 | 3ccf1a39dd25fe702bdafb8363280b3653adafa23d1438419e0a7cf05ca6b65d | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/integration/oauth-passkey-ownership.test.js | 7105 | fe661fae9de48629998b265a114b017eba55b590a22295dffd31062e2f3ff150 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/integration/v32-curriculum-and-sso.test.js | 4857 | 88af19ce4c0c17e7c81b71931c2acf90055632091384e5a014899a2c2ddc754e | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/integration/v4-contract.test.mjs | 20365 | 5e8109f8a25f0e9b7512a9905692f06fc26d420bf0f01dbeecba2052d1e48caa | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/integration/v41-one-domain-complete.test.mjs | 19545 | b2f9ca00cbcf2a35f3081a7c717edbb455ed2dea02a23e8196e4c32d1ff5bac2 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/security/security-hardening.test.mjs | 4803 | b96b5068549b24c761c79d914cde8e8702a35d034891847492da57b9e02af813 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| tests/unit/client-workflows.test.mjs | 7122 | 007f995275adb9596de9f12566c9550810c0c92a41c36d8b8d5fb6fd91deb3cb | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| tests/unit/combined.test.mjs | 21257 | d7ac1213452201c1a8d6e7d8e07cd0a6355a8ac26657bcf3bebfda4da929999a | Ngoài đồ thị import Worker; xem đường dẫn | Đã rút khỏi gói; còn trong ZIP đầu vào |
| tests/unit/core-systems.test.mjs | 6996 | 9d265845983680081db409560b5b54c1ad0c25b71b608b47baa28fda77a34324 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| tests/unit/email-templates.test.js | 2797 | 97368e5ad38efb57f50943f4cd8cf72d88ae38a331cae3fc8e4442202f6f8979 | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/unit/language-scope.test.js | 3219 | 9c9b4847951983648c4ddd3c5af9f8c0ad55aece0a89953be7b45b0f961afe4c | Ngoài đồ thị import Worker; xem đường dẫn | Đã cập nhật |
| tests/unit/security-csrf-webhook.test.js | 7568 | d0da7aeec93ad220da380215d0e00cbfdf07698efeee0381b1770f7559fb15f3 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
| wrangler.toml | 915 | 1704ec694ff451451644aa112bb5b1ad02592f72719de39fbdedac3a4f653c35 | Ngoài đồ thị import Worker; xem đường dẫn | Giữ nguyên |
