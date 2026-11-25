// src/modules/legal-policies.js
// WORD BRIDGE V4.2.0 — Full Legal Policies (Terms of Use & Privacy Policy),
// Versioning, Granular Consent Logging & User Privacy Center

export const PRIVACY_SECTIONS = [
  {
    id: "gioi-thieu",
    title: "1. Giới thiệu",
    body: `WORD BRIDGE tôn trọng quyền riêng tư và quyền kiểm soát dữ liệu cá nhân của người dùng.
Chính sách này giải thích cách WORD BRIDGE thu thập, sử dụng, lưu trữ, xử lý, bảo vệ, chia sẻ và xóa dữ liệu cá nhân khi người dùng truy cập website, đăng ký tài khoản, học tập, đọc tài liệu, luyện tập, sử dụng các công cụ ngôn ngữ và liên hệ với nền tảng.
WORD BRIDGE hướng đến nguyên tắc:
- Chỉ thu thập dữ liệu cần thiết.
- Sử dụng dữ liệu đúng mục đích đã thông báo.
- Hạn chế lưu giữ dữ liệu không cần thiết.
- Không công khai dữ liệu cá nhân của người dùng.
- Không bán dữ liệu cá nhân.
- Không sử dụng dữ liệu ngoài phạm vi đã thông báo và căn cứ xử lý hợp pháp.
- Bảo vệ quyền truy cập và quyền kiểm soát dữ liệu của người dùng.
Khi sử dụng dịch vụ, người dùng cần đọc chính sách này và các thông báo riêng về xử lý dữ liệu được cung cấp trong từng chức năng.`
  },
  {
    id: "pham-vi-ap-dung",
    title: "2. Phạm vi áp dụng",
    body: `Chính sách áp dụng đối với:
- Website WORD BRIDGE (https://wordbridge.io.vn).
- Tài khoản thành viên.
- Khu vực Học tập (/learning).
- Thư viện đọc (/reader).
- Cổng Luyện tập (/practice).
- Từ điển và hệ thống từ vựng.
- Hệ thống nghe, nói, đọc và viết.
- Công cụ dịch thuật.
- Công cụ đánh giá phát âm.
- Các dịch vụ API ngôn ngữ.
- Hệ thống lưu trữ dữ liệu.
- Trung tâm hỗ trợ và liên hệ (/help, /contact).
- Các dịch vụ khác được WORD BRIDGE công bố.
Chính sách áp dụng cho cả phiên truy cập đã đăng nhập và một số hoạt động truy cập công khai có phát sinh dữ liệu kỹ thuật.`
  },
  {
    id: "cac-loai-du-lieu",
    title: "3. Các loại dữ liệu có thể được thu thập",
    body: `3.1. Dữ liệu tài khoản: Họ và tên, Email, Số điện thoại, Tên đăng nhập, Ảnh đại diện nếu người dùng cung cấp, Trường học, Nơi làm việc hoặc tổ chức, Ngôn ngữ sử dụng, Cài đặt tài khoản, Trạng thái xác minh.

3.2. Dữ liệu xác thực: Định danh tài khoản, Thông tin xác minh email, Dữ liệu phiên đăng nhập, Thông tin liên kết OAuth, Thông tin khóa công khai và credential liên quan đến Passkeys/WebAuthn, Lịch sử đăng nhập và sự kiện bảo mật. WORD BRIDGE không lưu mật khẩu ở dạng văn bản thuần. WORD BRIDGE không thu thập hoặc lưu trữ dữ liệu sinh trắc học thô của người dùng thông qua Passkeys/WebAuthn; việc xác thực sinh trắc học (nếu thiết bị hỗ trợ) được thực hiện tại thiết bị của người dùng theo cơ chế của hệ điều hành và trình duyệt.

3.3. Dữ liệu học tập: Khóa học đã tham gia, Bài học đã truy cập, Tiến độ học tập, Câu trả lời, Kết quả luyện tập, Lịch sử tra cứu, Từ vựng đã lưu, Ghi chú cá nhân, Mục tiêu học tập, Lịch sử ôn tập, Thống kê năng lực ngôn ngữ.

3.4. Dữ liệu giọng nói và âm thanh: Bản ghi âm, Đoạn âm thanh, Văn bản được chuyển đổi từ giọng nói, Kết quả phân tích phát âm, Thông tin về độ trôi chảy, độ rõ ràng và các chỉ số đánh giá mà dịch vụ hỗ trợ, Dữ liệu phục vụ việc trả về kết quả luyện tập. Dữ liệu giọng nói chỉ được sử dụng cho mục đích ngôn ngữ đã được thông báo. WORD BRIDGE không sử dụng bản ghi giọng nói để xây dựng dấu giọng nhằm nhận dạng danh tính người dùng.

3.5. Dữ liệu bài viết và nội dung người dùng: Bài viết, Bản nháp, Nội dung được gửi để kiểm tra ngữ pháp, Nội dung dịch, Câu trả lời tự luận, Tài liệu được tải lên, Ghi chú, Lịch sử chỉnh sửa. Nội dung cá nhân không được mặc nhiên chuyển thành nội dung công khai.

3.6. Dữ liệu hỗ trợ: Loại yêu cầu, Tiêu đề, Nội dung, Tệp đính kèm, Thông tin liên hệ, Nội dung trao đổi với bộ phận hỗ trợ, Trạng thái xử lý.

3.7. Dữ liệu kỹ thuật: Địa chỉ IP khi cần cho bảo mật hoặc vận hành, Loại trình duyệt, Loại thiết bị, Hệ điều hành, Thời gian truy cập, Request ID, Log lỗi, Thông tin kết nối, Cookie và dữ liệu phiên theo cấu hình thực tế.`
  },
  {
    id: "muc-dich-xu-ly",
    title: "4. Mục đích xử lý dữ liệu",
    body: `WORD BRIDGE có thể xử lý dữ liệu cho các mục đích:
1. Tạo và quản lý tài khoản.
2. Xác thực và bảo vệ tài khoản.
3. Cung cấp dịch vụ học ngôn ngữ.
4. Ghi nhận tiến độ học tập.
5. Lưu kết quả luyện tập.
6. Cung cấp chức năng đọc, nghe, nói và viết.
7. Chuyển giọng nói thành văn bản khi người dùng yêu cầu.
8. Phát âm thanh bằng dịch vụ TTS.
9. Đánh giá phát âm trong phạm vi API hỗ trợ.
10. Kiểm tra và góp ý bài viết.
11. Dịch thuật và tra cứu từ vựng.
12. Lưu trữ tài liệu theo yêu cầu của người dùng.
13. Hỗ trợ kỹ thuật.
14. Xử lý phản ánh, khiếu nại và báo cáo vi phạm.
15. Phát hiện và ngăn chặn hành vi gian lận hoặc tấn công.
16. Kiểm tra, khắc phục và cải thiện độ ổn định hệ thống.
17. Thực hiện nghĩa vụ pháp lý khi có yêu cầu hợp lệ.
Không sử dụng dữ liệu cho mục đích khác nếu chưa có căn cứ xử lý phù hợp và thông báo cần thiết.`
  },
  {
    id: "can-cu-xu-ly",
    title: "5. Căn cứ xử lý dữ liệu",
    body: `WORD BRIDGE xác định căn cứ xử lý đối với từng hoạt động cụ thể theo quy định pháp luật hiện hành (bao gồm Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15 và Nghị định 356/2025/NĐ-CP).
Tùy từng trường hợp, việc xử lý có thể được thực hiện để:
- Cung cấp dịch vụ mà người dùng yêu cầu.
- Thực hiện thỏa thuận giữa người dùng và chủ thể vận hành.
- Thực hiện nghĩa vụ pháp lý.
- Bảo vệ quyền và lợi ích hợp pháp trong phạm vi pháp luật cho phép.
- Thực hiện hoạt động xử lý dựa trên sự đồng ý hợp lệ của người dùng khi pháp luật yêu cầu.
Không sử dụng một ô đồng ý chung để thay thế cho mọi loại thông báo và sự đồng ý cần thiết. Đối với những chức năng cần sự đồng ý riêng, hệ thống giải thích mục đích, phạm vi dữ liệu, bên nhận dữ liệu và cách rút lại sự đồng ý phù hợp.`
  },
  {
    id: "api-ben-thu-ba",
    title: "6. Xử lý dữ liệu bằng API và dịch vụ bên thứ ba",
    body: `WORD BRIDGE có thể sử dụng các nhà cung cấp dịch vụ để vận hành hạ tầng và máy chủ (Cloudflare Workers), cơ sở dữ liệu (Cloudflare D1), lưu trữ tài liệu (Cloudflare R2), dịch vụ gửi email, xác thực OAuth, Text-to-Speech, Speech-to-Text, đánh giá phát âm, dịch thuật, OCR và phân tích nội dung ngôn ngữ.
Nhà cung cấp chỉ được nhận dữ liệu cần thiết cho chức năng tương ứng. WORD BRIDGE chỉ công bố các nhà cung cấp thực tế được kích hoạt cấu hình trong hệ thống và không gửi nội dung người dùng tới API bên ngoài mà không có thông báo cần thiết.`
  },
  {
    id: "zero-storage-dich-thuat",
    title: "7. Dịch thuật và nguyên tắc không lưu trữ dữ liệu mặc định",
    body: `Đối với dịch vụ dịch thuật độc lập của WORD BRIDGE, việc xử lý văn bản tuân thủ nguyên tắc Zero User Data Storage:
- Không lưu mặc định nội dung yêu cầu dịch.
- Không lưu mặc định bản dịch đầu ra.
- Không lưu mặc định tài liệu được tải lên để dịch.
- Không sử dụng nội dung dịch làm dữ liệu huấn luyện nếu chưa có căn cứ và thông báo phù hợp.
- Không ghi nội dung dịch đầy đủ vào application log.
- Không chia sẻ nội dung dịch với mục đích quảng cáo.
Việc truyền nội dung đến nhà cung cấp API để thực hiện dịch thuật vẫn có thể phát sinh xử lý ở nhà cung cấp đó theo điều khoản của nhà cung cấp. Nếu người dùng chủ động lưu nội dung vào một tính năng khác của tài khoản, việc lưu trữ được thể hiện riêng và tuân theo cài đặt của tính năng đó.`
  },
  {
    id: "du-lieu-am-thanh-bai-viet",
    title: "8. Dữ liệu âm thanh và bài viết",
    body: `Dữ liệu âm thanh được xử lý nhằm cung cấp chức năng luyện nghe, nói và đánh giá phát âm. Mặc định, WORD BRIDGE ưu tiên xử lý tạm thời và hạn chế lưu trữ bản ghi âm (tự động hết hạn theo lịch xóa định kỳ). Nếu người dùng chủ động lưu bản ghi vào hồ sơ học tập, hệ thống hiển thị rõ trạng thái lưu và cung cấp chức năng xóa phù hợp tại Trung tâm quyền riêng tư.
Đối với bài viết: chỉ lưu bản nháp khi người dùng sử dụng chức năng lưu hoặc tự động lưu đã được thông báo; không công khai bài viết; không tự ý sử dụng nội dung để huấn luyện mô hình; không chuyển giao nội dung ngoài mục đích đã thông báo.`
  },
  {
    id: "thoi-han-luu-tru",
    title: "9. Thời hạn lưu trữ",
    body: `WORD BRIDGE lưu dữ liệu trong khoảng thời gian cần thiết để thực hiện mục đích xử lý và tuân thủ nghĩa vụ pháp lý:
- Hồ sơ tài khoản: Trong thời gian tài khoản hoạt động và thời gian cần thiết sau khi đóng tài khoản.
- Thông tin xác thực: Theo vòng đời bảo mật của tài khoản.
- Tiến độ học tập: Đến khi người dùng xóa hoặc đóng tài khoản, trừ dữ liệu phải lưu theo quy định.
- Bản ghi âm tạm thời: Xóa tự động sau khi hoàn tất xử lý hoặc hết thời hạn tạm lưu (mặc định tối đa 24 giờ qua tác vụ dọn dẹp định kỳ).
- Bản ghi âm người dùng chủ động lưu: Đến khi người dùng xóa hoặc tài khoản được xử lý theo chính sách.
- Bài viết và bản nháp: Theo cài đặt lưu trữ và thao tác của người dùng.
- Nội dung dịch thuật: Không lưu mặc định theo chính sách Zero User Data Storage.
- Phiếu hỗ trợ: Trong thời gian xử lý và thời hạn lưu trữ hợp pháp cần thiết.
- Log bảo mật: Theo lịch lưu trữ bảo mật được phê duyệt.`
  },
  {
    id: "cookie",
    title: "10. Cookie và công nghệ tương tự",
    body: `WORD BRIDGE sử dụng cookie thiết yếu để duy trì phiên đăng nhập (HttpOnly, SameSite), bảo vệ phiên quản trị và ghi nhận tùy chọn ngôn ngữ giao diện. Cookie thiết yếu được phân biệt rõ với cookie phân tích hoặc quảng cáo. WORD BRIDGE không cài đặt công cụ quảng cáo hoặc theo dõi hành vi bên thứ ba khi chưa có thông báo và cơ chế đồng ý phù hợp theo pháp luật áp dụng.`
  },
  {
    id: "chia-se-du-lieu",
    title: "11. Chia sẻ dữ liệu",
    body: `WORD BRIDGE không bán dữ liệu cá nhân của người dùng. Dữ liệu chỉ có thể được chia sẻ trong phạm vi cần thiết với nhà cung cấp hạ tầng, nhà cung cấp API, nhà cung cấp xác thực, nhà cung cấp email, đơn vị hỗ trợ kỹ thuật có thẩm quyền, cơ quan nhà nước có thẩm quyền theo yêu cầu hợp lệ hoặc chủ thể khác khi có căn cứ xử lý phù hợp.`
  },
  {
    id: "xuyen-bien-gioi",
    title: "12. Xử lý dữ liệu xuyên biên giới",
    body: `Một số dịch vụ hạ tầng (như mạng biên Cloudflare) hoặc API ngôn ngữ có thể xử lý dữ liệu tại quốc gia hoặc vùng lãnh thổ khác Việt Nam. WORD BRIDGE xác định rõ nhà cung cấp, khu vực xử lý thực tế, loại dữ liệu, mục đích chuyển và thực hiện hồ sơ đánh giá tác động theo quy định pháp luật Việt Nam hiện hành trước khi vận hành chính thức.`
  },
  {
    id: "quyen-nguoi-dung",
    title: "13. Quyền của người dùng",
    body: `Người dùng có đầy đủ các quyền về dữ liệu cá nhân theo Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15:
- Được thông báo về hoạt động xử lý.
- Truy cập dữ liệu.
- Yêu cầu chỉnh sửa.
- Yêu cầu xóa.
- Rút lại sự đồng ý khi việc xử lý dựa trên sự đồng ý.
- Yêu cầu hạn chế xử lý khi đủ điều kiện.
- Phản đối việc xử lý khi pháp luật cho phép.
- Yêu cầu cung cấp dữ liệu trong phạm vi quy định.
- Khiếu nại, tố cáo hoặc yêu cầu bồi thường theo quy định.`
  },
  {
    id: "quy-trinh-quyen-du-lieu",
    title: "14. Quy trình thực hiện quyền dữ liệu",
    body: `Người dùng có thể gửi yêu cầu qua Trung tâm quyền riêng tư trong tài khoản (/account/privacy), Trang Liên hệ (/contact) hoặc Email quyền riêng tư chính thức được công bố.
Quy trình xử lý gồm 7 bước: (1) Ghi nhận yêu cầu, (2) Xác minh danh tính phù hợp, (3) Xác định loại dữ liệu, (4) Kiểm tra quyền truy cập, (5) Xử lý trong thời hạn pháp luật quy định, (6) Thông báo kết quả, (7) Lưu nhật ký xử lý cần thiết.`
  },
  {
    id: "bao-ve-du-lieu",
    title: "15. Bảo vệ tài khoản và dữ liệu",
    body: `WORD BRIDGE áp dụng các biện pháp bảo mật phù hợp gồm: mã hóa kết nối HTTPS/TLS, quản lý quyền truy cập RBAC, bảo vệ phiên & CSRF, hash mật khẩu và mã PIN quản trị có salt (PBKDF2-SHA256), giới hạn truy cập API, kiểm soát tệp tải lên, giám sát sự cố, nhật ký kiểm toán và sao lưu có kiểm soát.`
  },
  {
    id: "bao-ve-tre-em",
    title: "16. Bảo vệ dữ liệu trẻ em",
    body: `WORD BRIDGE áp dụng cơ chế bảo vệ phù hợp với người dùng chưa thành niên, không thu thập dữ liệu trẻ em quá mức cần thiết, thực hiện yêu cầu xác nhận của cha mẹ/người đại diện hợp pháp khi pháp luật quy định và không sử dụng dữ liệu trẻ em cho quảng cáo hành vi.`
  },
  {
    id: "su-co-du-lieu",
    title: "17. Thông báo và xử lý sự cố dữ liệu",
    body: `Khi phát hiện sự cố dữ liệu, WORD BRIDGE kích hoạt quy trình phản ứng sự cố: ngăn chặn truy cập trái phép, đánh giá phạm vi ảnh hưởng, bảo toàn chứng cứ, khắc phục nguyên nhân, thực hiện nghĩa vụ thông báo cho cơ quan có thẩm quyền và chủ thể dữ liệu theo quy định pháp luật.`
  },
  {
    id: "thay-doi-chinh-sach",
    title: "18. Thay đổi chính sách",
    body: `WORD BRIDGE có thể cập nhật chính sách khi chức năng, nhà cung cấp, phạm vi dữ liệu hoặc quy định pháp luật thay đổi. Mỗi phiên bản đều có số phiên bản và ngày hiệu lực rõ ràng; lịch sử phiên bản cũ được lưu giữ đầy đủ.`
  },
  {
    id: "thong-tin-lien-he",
    title: "19. Thông tin liên hệ",
    body: `Thông tin chủ thể vận hành, email quyền riêng tư và email hỗ trợ được quản trị viên cấu hình và xác minh chính thức trước khi xuất bản trên môi trường production (hiển thị chi tiết ở khối Thông tin pháp lý của trang này). Website chính thức: https://wordbridge.io.vn.`
  }
];

export const TERMS_SECTIONS = [
  {
    id: "dieu-1",
    title: "Điều 1. Giới thiệu",
    body: `Chào mừng bạn đến với WORD BRIDGE. WORD BRIDGE là nền tảng học tập, thực hành, tra cứu và phát triển năng lực ngôn ngữ, tập trung vào tiếng Trung và tiếng Anh. Nền tảng cung cấp các chức năng: Học tập, Thư viện đọc, Luyện tập, Luyện nghe, Luyện nói, Luyện đọc, Luyện viết, Tra từ điển, Học từ vựng, Dịch thuật, Đánh giá phát âm, Phân tích tiến độ học tập và các công cụ hỗ trợ ngôn ngữ. Điều khoản này quy định quyền và trách nhiệm của người dùng khi truy cập và sử dụng WORD BRIDGE.`
  },
  {
    id: "dieu-2",
    title: "Điều 2. Chấp nhận điều khoản",
    body: `Khi tạo tài khoản hoặc sử dụng các chức năng yêu cầu chấp nhận điều khoản, người dùng được yêu cầu đọc và xác nhận đã hiểu, đồng ý với Điều khoản sử dụng áp dụng. Việc chấp nhận được ghi nhận theo phiên bản điều khoản có hiệu lực tại thời điểm đó. Hệ thống không sử dụng ô đồng ý được đánh dấu sẵn đối với xác nhận cần chủ động của người dùng.`
  },
  {
    id: "dieu-3",
    title: "Điều 3. Điều kiện tài khoản",
    body: `Người dùng phải cung cấp thông tin chính xác và cập nhật khi đăng ký (bao gồm Họ tên, Email, Số điện thoại, Thông tin xác minh, Trường học hoặc tổ chức làm việc). Người dùng chịu trách nhiệm bảo vệ tài khoản, không sử dụng tài khoản của người khác khi chưa được cho phép và không mạo danh cá nhân hoặc tổ chức.`
  },
  {
    id: "dieu-4",
    title: "Điều 4. Phương thức đăng nhập",
    body: `WORD BRIDGE hỗ trợ các phương thức đăng nhập gồm Email và mật khẩu, Google, Facebook, Microsoft, Apple (khi được kích hoạt cấu hình nhà cung cấp) và Passkeys/WebAuthn. Passkeys/WebAuthn không đồng nghĩa với việc WORD BRIDGE nhận hoặc lưu dữ liệu sinh trắc học thô của người dùng.`
  },
  {
    id: "dieu-5",
    title: "Điều 5. Phạm vi dịch vụ",
    body: `WORD BRIDGE cung cấp công cụ học ngôn ngữ và nội dung giáo dục. Một số chức năng có thể yêu cầu đăng nhập, quyền sử dụng microphone, tải tệp, kết nối internet, sử dụng API của nhà cung cấp hoặc đồng ý với thông báo xử lý dữ liệu riêng.`
  },
  {
    id: "dieu-6",
    title: "Điều 6. Phạm vi học thuật",
    body: `WORD BRIDGE hỗ trợ người dùng học và thực hành tiếng Trung và tiếng Anh. Các kết quả từ điển, bản dịch, nhận xét bài viết, đánh giá phát âm và đề xuất học tập nhằm hỗ trợ quá trình học; không tự động trở thành chứng chỉ ngoại ngữ, văn bằng, chứng nhận đào tạo chính thức hay kết quả thi được cơ quan có thẩm quyền công nhận. WORD BRIDGE không cung cấp chức năng cấp chứng chỉ.`
  },
  {
    id: "dieu-7",
    title: "Điều 7. Công cụ API và kết quả tự động",
    body: `Một số chức năng sử dụng API xử lý ngôn ngữ hoặc hệ thống tự động. Kết quả có thể bị ảnh hưởng bởi chất lượng âm thanh, ngữ cảnh hoặc giọng vùng miền và chỉ phản ánh các tiêu chí mà dịch vụ thực sự hỗ trợ. Không sử dụng kết quả tự động làm căn cứ duy nhất cho quyết định pháp lý, y tế, tài chính hoặc quyết định chuyên môn có rủi ro cao.`
  },
  {
    id: "dieu-8",
    title: "Điều 8. Quyền và trách nhiệm đối với nội dung người dùng",
    body: `Người dùng chịu trách nhiệm đối với nội dung tải lên, nhập, lưu hoặc gửi qua nền tảng; không gửi nội dung vi phạm pháp luật, xâm phạm sở hữu trí tuệ, xâm phạm dữ liệu cá nhân trái phép, chứa mã độc hoặc nhằm tấn công hệ thống. Người dùng giữ quyền đối với nội dung của mình và chỉ cấp cho WORD BRIDGE quyền kỹ thuật có giới hạn để lưu trữ, xử lý và hiển thị theo yêu cầu.`
  },
  {
    id: "dieu-9",
    title: "Điều 9. Quyền sở hữu trí tuệ",
    body: `Tên thương hiệu WORD BRIDGE, logo, thiết kế, giao diện, mã nguồn, cấu trúc sản phẩm và tài liệu do WORD BRIDGE biên soạn thuộc quyền sở hữu hợp pháp của chủ sở hữu tương ứng. Không được sao chép, phân phối, thương mại hóa hoặc khai thác trái phép.`
  },
  {
    id: "dieu-10",
    title: "Điều 10. Quy tắc sử dụng",
    body: `Người dùng không được: (1) Tấn công hoặc làm gián đoạn hệ thống; (2) Thử truy cập khu vực quản trị không được cấp quyền; (3) Vượt qua cơ chế đăng nhập hoặc phân quyền; (4) Cố tình khai thác lỗ hổng; (5) Tự động thu thập dữ liệu trái phép; (6) Gửi yêu cầu API vượt giới hạn; (7) Tạo tài khoản giả nhằm gian lận; (8) Phát tán mã độc; (9) Can thiệp dữ liệu của người dùng khác; (10) Vi phạm bản quyền; (11) Sử dụng dịch vụ vào mục đích trái pháp luật; (12) Lạm dụng chức năng ghi âm, tải lên hoặc liên hệ.`
  },
  {
    id: "dieu-11",
    title: "Điều 11. An toàn và bảo mật",
    body: `Người dùng có trách nhiệm giữ kín thông tin đăng nhập, không chia sẻ mã xác thực, không dùng mật khẩu yếu, đăng xuất trên thiết bị công cộng và thông báo khi phát hiện truy cập bất thường. WORD BRIDGE có quyền giới hạn hoặc tạm ngừng một chức năng khi cần thiết để bảo vệ tài khoản và hệ thống.`
  },
  {
    id: "dieu-12",
    title: "Điều 12. Dịch vụ bên thứ ba",
    body: `WORD BRIDGE có thể sử dụng dịch vụ của nhà cung cấp bên thứ ba để vận hành hạ tầng, xác thực, gửi email, xử lý âm thanh và xử lý ngôn ngữ theo điều khoản của nhà cung cấp và chính sách quyền riêng tư.`
  },
  {
    id: "dieu-13",
    title: "Điều 13. Tài liệu học tập và nội dung chuyên ngành",
    body: `Tài liệu được cung cấp nhằm phục vụ mục tiêu học tập và tham khảo, không phải tư vấn chuyên môn có tính ràng buộc. Đối với thuật ngữ, quy định hoặc tài liệu thuộc ngành chuyên sâu, người dùng cần đối chiếu nguồn có thẩm quyền khi sử dụng vào công việc thực tế.`
  },
  {
    id: "dieu-14",
    title: "Điều 14. Quyền tạm ngừng hoặc hạn chế",
    body: `WORD BRIDGE có thể giới hạn, tạm ngừng hoặc khóa tài khoản khi có dấu hiệu xâm nhập, vi phạm điều khoản, gây hại cho người dùng khác, nguy cơ đối với hệ thống hoặc theo yêu cầu hợp lệ từ cơ quan có thẩm quyền. Người dùng có cơ chế liên hệ hoặc khiếu nại qua /contact.`
  },
  {
    id: "dieu-15",
    title: "Điều 15. Chấm dứt tài khoản",
    body: `Người dùng có thể yêu cầu đóng hoặc xóa tài khoản thông qua Trung tâm quyền riêng tư (/account/privacy) hoặc kênh hỗ trợ. Một số dữ liệu có thể cần lưu giữ theo nghĩa vụ pháp luật hoặc xử lý tranh chấp và sẽ được thông báo rõ phạm vi khi xử lý yêu cầu.`
  },
  {
    id: "dieu-16",
    title: "Điều 16. Thay đổi và bảo trì dịch vụ",
    body: `WORD BRIDGE có thể cập nhật, sửa lỗi, bảo trì hoặc nâng cấp dịch vụ và sẽ nỗ lực thông báo trước đối với các đợt bảo trì dự kiến có ảnh hưởng đáng kể.`
  },
  {
    id: "dieu-17",
    title: "Điều 17. Phí dịch vụ",
    body: `Mọi chính sách phí (nếu có trong tương lai) sẽ được công bố rõ ràng trước khi giao dịch; không tự động thu phí khi chưa có thông báo và xác nhận phù hợp theo pháp luật bảo vệ quyền lợi người tiêu dùng.`
  },
  {
    id: "dieu-18",
    title: "Điều 18. Quyền riêng tư",
    body: `Việc xử lý dữ liệu cá nhân được thực hiện theo Chính sách quyền riêng tư tại /policies/privacy. Điều khoản sử dụng không thay thế thông báo hoặc sự đồng ý riêng về xử lý dữ liệu khi pháp luật yêu cầu.`
  },
  {
    id: "dieu-19",
    title: "Điều 19. Giới hạn trách nhiệm",
    body: `Trong giới hạn pháp luật cho phép, nền tảng không bảo đảm mọi kết quả tự động luôn chính xác tuyệt đối. Không nội dung nào trong điều khoản này loại bỏ hoặc hạn chế quyền hợp pháp bắt buộc của người tiêu dùng và chủ thể dữ liệu theo pháp luật Việt Nam.`
  },
  {
    id: "dieu-20",
    title: "Điều 20. Bất khả kháng",
    body: `Các sự kiện ngoài khả năng kiểm soát hợp lý như sự cố hạ tầng diện rộng, thiên tai, sự cố mạng hoặc yêu cầu của cơ quan nhà nước có thể ảnh hưởng đến hoạt động dịch vụ; WORD BRIDGE sẽ thực hiện các biện pháp phù hợp để khôi phục dịch vụ.`
  },
  {
    id: "dieu-21",
    title: "Điều 21. Giải quyết phản ánh và tranh chấp",
    body: `Người dùng có thể gửi phản ánh hoặc khiếu nại qua /contact, Trung tâm Trợ giúp (/help) hoặc email chính thức được công bố. Các bên ưu tiên thương lượng thiện chí; nếu không đạt được thỏa thuận, tranh chấp được xử lý theo pháp luật Việt Nam.`
  },
  {
    id: "dieu-22",
    title: "Điều 22. Luật áp dụng",
    body: `Điều khoản được điều chỉnh và giải thích theo pháp luật Việt Nam (bao gồm Luật Bảo vệ quyền lợi người tiêu dùng số 19/2023/QH15, Luật Giao dịch điện tử số 20/2023/QH15 và Luật Bảo vệ dữ liệu cá nhân số 91/2025/QH15).`
  },
  {
    id: "dieu-23",
    title: "Điều 23. Cập nhật điều khoản",
    body: `Mỗi phiên bản điều khoản có số phiên bản và ngày hiệu lực riêng. Khi có thay đổi đáng kể ảnh hưởng đến quyền hoặc nghĩa vụ của người dùng, nền tảng sẽ thông báo và yêu cầu xác nhận lại theo quy định.`
  },
  {
    id: "dieu-24",
    title: "Điều 24. Thông tin liên hệ",
    body: `Thông tin chủ thể vận hành, email hỗ trợ và email pháp lý được quản trị viên xác minh và cấu hình chính thức trước khi công bố production. Website chính thức: https://wordbridge.io.vn.`
  }
];

export const SUPPLEMENTAL_POLICIES = {
  "data-protection": {
    title: "Chính sách bảo vệ dữ liệu cá nhân",
    summary: "Quy định chi tiết việc thu thập, lưu trữ, phân quyền và thực hiện quyền chủ thể dữ liệu theo Luật 91/2025/QH15 và Nghị định 356/2025/NĐ-CP.",
    sections: [
      { id: "nguyen-tac", title: "1. Nguyên tắc bảo vệ dữ liệu cá nhân", body: "WORD BRIDGE chỉ xử lý dữ liệu cá nhân khi có căn cứ hợp pháp, giới hạn mục đích, tối thiểu hóa lưu trữ và bảo đảm toàn vẹn dữ liệu trên Cloudflare D1 và R2." },
      { id: "quyen-chu-the", title: "2. Thực hiện quyền của chủ thể dữ liệu", body: "Thành viên có thể gửi yêu cầu truy cập, chỉnh sửa, xóa, rút lại sự đồng ý hoặc hạn chế xử lý ngay tại Trung tâm quyền riêng tư (/account/privacy) hoặc qua trang Liên hệ (/contact)." }
    ]
  },
  cookies: {
    title: "Chính sách Cookie",
    summary: "Phân biệt rõ cookie thiết yếu phục vụ bảo mật phiên đăng nhập với các công nghệ lưu trữ tùy chọn giao diện.",
    sections: [
      { id: "cookie-thiet-yeu", title: "1. Cookie thiết yếu", body: "Cookie wb_session (HttpOnly, SameSite=Lax) duy trì phiên đăng nhập người dùng; cookie wb_admin_session (HttpOnly, SameSite=Strict) bảo vệ phiên quản trị sau khi xác minh PIN 6 chữ số." },
      { id: "quan-ly-cookie", title: "2. Quản lý và từ chối Cookie", body: "WORD BRIDGE không kích hoạt cookie quảng cáo bên thứ ba. Bạn có thể xóa hoặc chặn cookie trong cài đặt trình duyệt bất kỳ lúc nào." }
    ]
  },
  community: {
    title: "Quy tắc sử dụng cộng đồng",
    summary: "Tiêu chuẩn ứng xử tôn trọng, an toàn và tập trung vào học thuật trên WORD BRIDGE.",
    sections: [
      { id: "ton-trong", title: "1. Môi trường học thuật lành mạnh", body: "Tôn trọng người học khác, không phát tán nội dung quấy rối, thù hận, lừa đảo hoặc vi phạm pháp luật." },
      { id: "bao-cao", title: "2. Báo cáo hành vi vi phạm", body: "Mọi hành vi vi phạm có thể được báo cáo trực tiếp thông qua biểu mẫu Liên hệ (/contact) nhóm 'Báo cáo nội dung' hoặc 'Báo cáo bảo mật'." }
    ]
  },
  "account-safety": {
    title: "Hướng dẫn an toàn tài khoản",
    summary: "Khuyến nghị bảo mật mật khẩu, Passkeys/WebAuthn và quản lý phiên đăng nhập trên WORD BRIDGE.",
    sections: [
      { id: "mat-khau-passkey", title: "1. Mật khẩu mạnh và Passkeys", body: "Sử dụng mật khẩu tối thiểu 10 ký tự gồm chữ hoa, chữ thường và chữ số; kích hoạt Passkey (WebAuthn) tại /account/passkeys để đăng nhập an toàn mà không gửi dữ liệu sinh trắc học lên máy chủ." },
      { id: "quan-ly-phien", title: "2. Kiểm soát phiên đăng nhập", body: "Thường xuyên rà soát thiết bị đang đăng nhập và thu hồi các phiên lạ tại /account/sessions." }
    ]
  },
  "data-deletion": {
    title: "Quy trình gửi yêu cầu xóa dữ liệu",
    summary: "Hướng dẫn xóa bản ghi âm, bản nháp bài viết hoặc gửi yêu cầu xóa tài khoản và dữ liệu cá nhân.",
    sections: [
      { id: "tu-xoa", title: "1. Tự xóa dữ liệu học tập", body: "Bạn có thể xóa trực tiếp bản ghi âm đã lưu và bản nháp bài viết tại Trung tâm quyền riêng tư (/account/privacy)." },
      { id: "yeu-cau-xoa-tai-khoan", title: "2. Yêu cầu xóa tài khoản", body: "Gửi yêu cầu 'Xóa dữ liệu' tại /account/privacy hoặc /contact. Hệ thống xác minh danh tính, xóa dữ liệu trên D1 và R2 theo phạm vi pháp luật cho phép và gửi thông báo xác nhận kết quả." }
    ]
  },
  "violation-report": {
    title: "Quy trình báo cáo vi phạm",
    summary: "Tiếp nhận và xử lý báo cáo nội dung sai lệch, vi phạm bản quyền hoặc sự cố bảo mật.",
    sections: [
      { id: "gui-bao-cao", title: "1. Cách gửi báo cáo", body: "Đăng nhập và chọn nhóm yêu cầu 'Báo cáo nội dung' hoặc 'Báo cáo bảo mật' tại trang Liên hệ (/contact), đính kèm đường dẫn và mô tả chi tiết." },
      { id: "xu-ly-bao-cao", title: "2. Quy trình tiếp nhận", body: "Mỗi báo cáo được cấp mã tiếp nhận riêng, lưu trong hệ thống CSKH và phản hồi trạng thái minh bạch trong tài khoản của bạn." }
    ]
  },
  complaints: {
    title: "Hướng dẫn xử lý khiếu nại",
    summary: "Cơ chế tiếp nhận, xác minh và phản hồi khiếu nại về dịch vụ hoặc quyết định hạn chế tài khoản.",
    sections: [
      { id: "tiep-nhan", title: "1. Kênh tiếp nhận khiếu nại", body: "Gửi khiếu nại qua /contact hoặc Trung tâm Trợ giúp (/help). Hệ thống tự động tạo mã phiếu để theo dõi tiến độ xử lý." },
      { id: "giai-quyet", title: "2. Nguyên tắc giải quyết", body: "Các bên ưu tiên giải quyết thiện chí, minh bạch và tôn trọng đầy đủ quyền bảo vệ người tiêu dùng theo Luật 19/2023/QH15." }
    ]
  }
};

export class LegalPolicyService {
  constructor(db, env = {}) {
    this.db = db;
    this.env = env;
  }

  async getPolicyMetadata(slug) {
    try {
      const doc = await this.db.prepare("SELECT * FROM wb_policy_documents WHERE slug = ?").bind(slug).first();
      const latestPublished = await this.db.prepare(
        "SELECT * FROM wb_policy_versions WHERE policy_slug = ? AND status = 'published' ORDER BY published_at DESC LIMIT 1"
      ).bind(slug).first();
      return { doc: doc || null, latestPublished: latestPublished || null };
    } catch {
      return { doc: null, latestPublished: null };
    }
  }

  validateProductionOperatorConfig(meta = {}) {
    const missing = [];
    if (!meta.operator_name) missing.push("operator_name");
    if (!meta.privacy_email) missing.push("privacy_email");
    if (!meta.support_email) missing.push("support_email");
    if (!meta.effective_date) missing.push("effective_date");
    return { readyForProduction: missing.length === 0, missing };
  }

  async recordConsent(accountId, { policyType, policyVersion = "1.0", policyEffectiveDate = null, acceptanceStatus = "accepted", consentPurpose = "account_agreement", source = "web", metadata = {} }) {
    if (!accountId || !policyType) return { ok: false, status: 400, error: "Thiếu thông tin ghi nhận sự đồng ý." };
    const id = `con_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.prepare(
      `INSERT INTO wb_user_policy_consents (id, account_id, policy_type, policy_version, policy_effective_date, acceptance_status, consent_purpose, source, metadata_json)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).bind(id, accountId, policyType, policyVersion, policyEffectiveDate, acceptanceStatus, consentPurpose, source, JSON.stringify(metadata)).run();
    return { ok: true, consentId: id };
  }

  async listUserConsents(accountId) {
    try {
      return (await this.db.prepare(
        "SELECT * FROM wb_user_policy_consents WHERE account_id = ? ORDER BY created_at DESC LIMIT 50"
      ).bind(accountId).all()).results || [];
    } catch {
      return [];
    }
  }

  async createPrivacyRequest(accountId, { requestType, details = "" }) {
    const allowed = ["access", "rectify", "delete", "withdraw_consent", "restrict_processing", "export"];
    if (!allowed.includes(requestType)) {
      return { ok: false, status: 400, error: "Loại yêu cầu quyền riêng tư không hợp lệ." };
    }
    const id = `prv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.prepare(
      `INSERT INTO wb_privacy_requests (id, account_id, request_type, status, details)
       VALUES (?, ?, ?, 'received', ?)`
    ).bind(id, accountId, requestType, String(details || "").slice(0, 2000)).run();
    if (requestType === "withdraw_consent") {
      await this.recordConsent(accountId, {
        policyType: "privacy",
        acceptanceStatus: "withdrawn",
        consentPurpose: "api_optional_processing",
        source: "privacy_center",
        metadata: { requestId: id }
      });
    }
    return { ok: true, requestId: id, status: "received", message: "Đã tiếp nhận yêu cầu quyền riêng tư của bạn." };
  }

  async listUserPrivacyRequests(accountId) {
    try {
      return (await this.db.prepare(
        "SELECT * FROM wb_privacy_requests WHERE account_id = ? ORDER BY created_at DESC LIMIT 30"
      ).bind(accountId).all()).results || [];
    } catch {
      return [];
    }
  }

  async createPolicyDraft(actor, { policySlug, version, changeLevel = "minor", summaryVi = "", contentVi, contentEn = "", effectiveDate = null }) {
    if (!policySlug || !version || !contentVi) {
      return { ok: false, status: 400, error: "Thiếu mã chính sách, số phiên bản hoặc nội dung." };
    }
    const id = `polv_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    await this.db.prepare(
      `INSERT INTO wb_policy_versions (id, policy_slug, version, status, change_level, summary_vi, content_vi, content_en, effective_date, created_by)
       VALUES (?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?)`
    ).bind(id, policySlug, version, changeLevel, summaryVi, contentVi, contentEn, effectiveDate, actor.accountId).run();
    return { ok: true, versionId: id };
  }

  async transitionPolicyVersion(actor, versionId, action) {
    const row = await this.db.prepare("SELECT * FROM wb_policy_versions WHERE id = ?").bind(versionId).first();
    if (!row) return { ok: false, status: 404, error: "Không tìm thấy phiên bản chính sách." };
    if (action === "submit_review") {
      await this.db.prepare("UPDATE wb_policy_versions SET status = 'in_review' WHERE id = ?").bind(versionId).run();
      return { ok: true, status: "in_review" };
    }
    if (action === "approve") {
      if (row.created_by === actor.accountId && !actor.roles?.includes("super_admin")) {
        return { ok: false, status: 403, error: "Người biên soạn không được tự phê duyệt phiên bản chính sách do chính mình tạo." };
      }
      await this.db.prepare("UPDATE wb_policy_versions SET status = 'approved', reviewed_by = ?, approved_by = ? WHERE id = ?").bind(actor.accountId, actor.accountId, versionId).run();
      return { ok: true, status: "approved" };
    }
    if (action === "publish") {
      if (row.created_by === actor.accountId && !actor.roles?.includes("super_admin")) {
        return { ok: false, status: 403, error: "Cần người có thẩm quyền phê duyệt khác với người biên soạn trước khi xuất bản." };
      }
      const doc = await this.db.prepare("SELECT * FROM wb_policy_documents WHERE slug = ?").bind(row.policy_slug).first();
      const check = this.validateProductionOperatorConfig({ ...doc, effective_date: row.effective_date || doc?.effective_date });
      if (this.env.ENVIRONMENT === "production" && !check.readyForProduction) {
        return {
          ok: false,
          status: 422,
          error: `Chặn xuất bản production: thiếu thông tin pháp lý bắt buộc (${check.missing.join(", ")}).`
        };
      }
      await this.db.prepare("UPDATE wb_policy_versions SET status = 'archived' WHERE policy_slug = ? AND status = 'published'").bind(row.policy_slug).run();
      await this.db.prepare("UPDATE wb_policy_versions SET status = 'published', approved_by = COALESCE(approved_by, ?), published_at = datetime('now') WHERE id = ?").bind(actor.accountId, versionId).run();
      await this.db.prepare("UPDATE wb_policy_documents SET current_version = ?, effective_date = COALESCE(?, effective_date), updated_at = datetime('now') WHERE slug = ?").bind(row.version, row.effective_date, row.policy_slug).run();
      return { ok: true, status: "published" };
    }
    return { ok: false, status: 400, error: "Thao tác chuyển trạng thái chính sách không hợp lệ." };
  }
}

export function renderFullPolicyHtml({ policySlug, docMeta = null, latestPublished = null, escapeHtml }) {
  const isTerms = policySlug === "terms";
  const isPrivacy = policySlug === "privacy";
  const supp = SUPPLEMENTAL_POLICIES[policySlug];
  if (!isTerms && !isPrivacy && !supp) return null;

  const title = isTerms ? "Điều khoản sử dụng (Terms of Use)" : isPrivacy ? "Chính sách quyền riêng tư (Privacy Policy)" : supp.title;
  const summary = isTerms
    ? "Quy định quyền, trách nhiệm, phạm vi học thuật (không cấp chứng chỉ), sử dụng API ngôn ngữ và bảo vệ người dùng trên nền tảng WORD BRIDGE."
    : isPrivacy
      ? "Minh bạch toàn bộ hoạt động thu thập, xử lý, lưu trữ tối thiểu, Zero User Data Storage cho dịch thuật và quyền chủ thể dữ liệu theo pháp luật Việt Nam."
      : supp.summary;
  const sections = isTerms ? TERMS_SECTIONS : isPrivacy ? PRIVACY_SECTIONS : supp.sections;


  const toc = sections.map((s) => `<li><a href="#${escapeHtml(s.id)}">${escapeHtml(s.title)}</a></li>`).join("");
  const bodyHtml = sections.map((s) => `
    <section id="${escapeHtml(s.id)}" class="wb-policy-section" style="margin-top:24px;padding-top:16px;border-top:1px solid #e2e8f0;">
      <h2 style="color:var(--wb-teal);font-size:1.18rem;margin:0 0 10px;">${escapeHtml(s.title)}</h2>
      <div style="white-space:pre-line;line-height:1.72;color:#1e293b;">${escapeHtml(s.body)}</div>
    </section>`).join("");

  const policyNav = [
    ["/policies/terms", "Điều khoản sử dụng"],
    ["/policies/privacy", "Chính sách quyền riêng tư"],
    ["/policies/data-protection", "Bảo vệ dữ liệu cá nhân"],
    ["/policies/cookies", "Chính sách Cookie"],
    ["/policies/community", "Quy tắc cộng đồng"],
    ["/policies/account-safety", "An toàn tài khoản"],
    ["/policies/data-deletion", "Yêu cầu xóa dữ liệu"],
    ["/policies/violation-report", "Báo cáo vi phạm"],
    ["/policies/complaints", "Xử lý khiếu nại"]
  ].map(([href, label]) => `<a href="${href}" class="wb-btn wb-btn-outline wb-btn-sm${href === `/policies/${policySlug}` ? " wb-btn-primary" : ""}">${escapeHtml(label)}</a>`).join(" ");

  return {
    title,
    html: `
      <div class="wb-policy-nav" style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:18px;">${policyNav}</div>
      <article class="wb-card wb-policy-doc">
        <h1 style="margin:0 0 10px;color:var(--wb-teal);">${escapeHtml(title)}</h1>
        <p style="font-size:1.02rem;color:#334155;margin:0 0 16px;">${escapeHtml(summary)}</p>
        <nav aria-label="Mục lục chính sách" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:14px 18px;margin-bottom:16px;">
          <strong style="display:block;margin-bottom:8px;color:var(--wb-teal);">Mục lục điều hướng</strong>
          <ol class="wb-policy-toc">${toc}</ol>
        </nav>
        ${bodyHtml}
        <div style="margin-top:28px;padding-top:16px;border-top:1px solid #e2e8f0;display:flex;gap:10px;flex-wrap:wrap;">
          <a href="/contact" class="wb-btn wb-btn-primary">Gửi yêu cầu qua Liên hệ</a>
          <a href="/account/privacy" class="wb-btn wb-btn-outline">Mở Trung tâm quyền riêng tư</a>
          <a href="/help" class="wb-btn wb-btn-outline">Trung Tâm Trợ Giúp</a>
        </div>
      </article>`
  };
}
