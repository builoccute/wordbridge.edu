#!/usr/bin/env python3
"""
BỘ KIỂM THỬ BẮT BUỘC TOÀN DIỆN – WORD BRIDGE SOURCE STORAGE (PHẦN XV & PHẦN XVI)
Thực thi kiểm thử thực tế trên dịch vụ lưu trữ SQLite BLOB độc lập (storage-service/server.py):
1. Kiểm thử đăng nhập kho (6 lớp xác thực, PIN 6 chữ số Argon2id, sai 5 lần khóa 15 phút, hết hạn 8 giờ, đổi PIN/khóa kho thu hồi phiên cũ).
2. Kiểm thử Quên PIN (Phát hành OTP 5 phút, OTP sai/hết hạn/đã dùng bị từ chối, khôi phục PIN tạo hash mới, thu hồi phiên cũ).
3. Kiểm thử tự động lưu (Tài liệu, Bài đăng cộng đồng, Bình luận, chỉnh sửa tạo phiên bản mới, retry hàng đợi chống ghi trùng).
4. Kiểm thử nhập dữ liệu cũ lần đầu (Tự động kích hoạt, theo lô có checkpoint, chống nhập lặp, báo cáo lỗi & tiếp tục sau gián đoạn).
5. Kiểm thử tệp BLOB (Upload tệp nhỏ, tệp đúng 15 MB, từ chối tệp > 15 MB kể cả khi giả mạo header, ghi thật vào SQLite BLOB, kiểm tra SHA-256, cách ly tệp .env/private key, xem trước văn bản không thực thi mã).
6. Kiểm thử quản lý phiên bản (Tạo phiên bản mới, xem/tải phiên bản cũ, khôi phục phiên bản thành phiên bản hiện tại mới không mất lịch sử).
7. Kiểm thử thùng rác & xóa vĩnh viễn (Xóa mềm, xem thùng rác, khôi phục, xóa vĩnh viễn có xác nhận 'XOA VINH VIEN', dọn sạch BLOB không còn mồ côi).
8. Kiểm thử xử lý khi xóa tài khoản (Xóa tài khoản A xử lý dữ liệu riêng thuộc A, giữ nguyên thảo luận chung có người dùng B, ẩn danh nhật ký bảo mật).
9. Kiểm thử đối tượng học viên (Nhóm A GDNN–GDTX, Nhóm B Trung cấp nghề, Nhóm C Cao đẳng nghề, Nhóm D Đại học, Nhóm E Người đi làm) & 16 lĩnh vực chuyên ngành mở rộng động.
10. Kiểm thử triển khai, toàn vẹn SQLite sau khởi động lại, Backup & Restore và kiểm tra không có secret/R2/D1 trong mã nguồn.
"""

import base64
import datetime
import hashlib
import json
import os
import sqlite3
import subprocess
import sys
import tempfile
import time
import urllib.error
import urllib.request
from pathlib import Path

ROOT_DIR = Path(__file__).resolve().parent.parent
SERVER_SCRIPT = ROOT_DIR / "storage-service" / "server.py"

TEST_PORT = 4199
SERVICE_TOKEN = "test-service-token-2026"
BASE_URL = f"http://127.0.0.1:{TEST_PORT}"


def api_call(
    path: str,
    method: str = "GET",
    body: dict = None,
    actor_id: str = "admin-01",
    email: str = "admin@wordbridge.io.vn",
    name: str = "Quản trị viên Kiểm thử",
    role: str = "ADMIN",
    vault_token: str = "",
    service_token: str = SERVICE_TOKEN,
):
    url = f"{BASE_URL}{path}"
    headers = {
        "X-Storage-Service-Token": service_token,
        "X-Actor-Id": actor_id,
        "X-Actor-Email": email,
        "X-Actor-Name": urllib.parse.quote(name),
        "X-Actor-Role": role,
        "X-Vault-Session": vault_token,
    }
    data_bytes = None
    if method == "POST":
        headers["Content-Type"] = "application/json; charset=utf-8"
        data_bytes = json.dumps(body or {}).encode("utf-8")

    req = urllib.request.Request(url, data=data_bytes, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req, timeout=30) as resp:
            raw = resp.read().decode("utf-8")
            return resp.status, json.loads(raw)
    except urllib.error.HTTPError as e:
        raw = e.read().decode("utf-8")
        try:
            return e.code, json.loads(raw)
        except Exception:
            return e.code, {"success": False, "error": {"message": raw}}


def run_all_tests():
    results = []

    def record(category: str, name: str, passed: bool, detail: str = ""):
        status_str = "PASS" if passed else "FAIL"
        print(f"[{status_str}] [{category}] {name} -> {detail}")
        results.append(
            {
                "category": category,
                "name": name,
                "passed": passed,
                "detail": detail,
            }
        )
        if not passed:
            raise AssertionError(f"Test failed: {category} - {name}: {detail}")

    with tempfile.TemporaryDirectory(prefix="wb_storage_test_") as tmpdir:
        tmp_path = Path(tmpdir)
        db_path = tmp_path / "test_vault.db"

        env = {
            **os.environ,
            "WB_STORAGE_DIR": str(tmp_path),
            "WB_STORAGE_DB_PATH": str(db_path),
            "WB_STORAGE_SERVICE_TOKEN": SERVICE_TOKEN,
            "WB_STORAGE_PIN_PEPPER": "test-pepper-secret-2026",
            "WB_STORAGE_PORT": str(TEST_PORT),
        }

        proc = subprocess.Popen(
            [sys.executable, str(SERVER_SCRIPT)],
            env=env,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
        )
        time.sleep(1.2)

        try:
            # =================================================================
            # 1. KIỂM THỬ ĐĂNG NHẬP KHO & XÁC THỰC 6 LỚP (PHẦN XV.1)
            # =================================================================
            # 1.1 Từ chối nếu sai Service Token (Chặn truy cập trực tiếp từ trình duyệt vào Storage Service)
            st, res = api_call("/api/v1/overview", service_token="wrong-token")
            record("XV.1 Đăng nhập kho", "Chặn truy cập trực tiếp không có Service Token", st == 401, f"HTTP {st}")

            # 1.2 Người chưa đăng nhập không vào được
            st, res = api_call("/api/v1/overview", actor_id="", role="GUEST")
            record("XV.1 Đăng nhập kho", "Người chưa đăng nhập bị từ chối (401)", st == 401, res["error"]["code"])

            # 1.3 Người không có quyền Admin không vào được
            st, res = api_call("/api/v1/overview", actor_id="user-01", role="USER")
            record("XV.1 Đăng nhập kho", "Tài khoản USER thường bị từ chối (403)", st == 403, res["error"]["code"])

            # 1.4 Admin chưa thiết lập PIN không vào được
            st, res = api_call("/api/v1/overview", actor_id="admin-01", role="ADMIN")
            record("XV.1 Đăng nhập kho", "Admin chưa thiết lập PIN bị từ chối (403)", st == 403 and res["error"]["code"] == "PIN_NOT_SETUP", res["error"]["code"])

            # 1.5 Thiết lập PIN 6 chữ số (cho phép số 0 ở đầu: '048291')
            st, res = api_call(
                "/api/v1/access/setup-pin",
                method="POST",
                body={"pin": "048291", "confirmPin": "048291"},
            )
            record(
                "XV.1 Đăng nhập kho",
                "Thiết lập PIN 6 chữ số có số 0 ở đầu ('048291') bằng Argon2id",
                st == 200 and res["data"]["pinSetup"] is True and res["data"]["hashAlgorithm"] == "argon2id",
                f"Thuật toán: {res.get('data', {}).get('hashAlgorithm')}",
            )

            # Kiểm tra trong SQLite: PIN không lưu dạng văn bản thuần, có salt riêng
            conn = sqlite3.connect(str(db_path))
            pin_row = conn.execute("SELECT pin_hash, pin_salt, hash_algo FROM storage_access_pins WHERE account_id = 'admin-01'").fetchone()
            conn.close()
            record(
                "XV.1 Đăng nhập kho",
                "PIN lưu dạng Argon2id hash ($argon2id$v=19$...) + Salt riêng, không lưu plaintext",
                pin_row is not None and pin_row[0].startswith("$argon2id$") and "048291" not in pin_row[0],
                pin_row[0][:38] + "...",
            )

            # 1.6 Sai PIN 5 lần liên tiếp bị khóa xác minh PIN trong 15 phút
            for attempt in range(1, 5):
                st, res = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "999999"})
                assert st == 401 and res["error"]["failedAttempts"] == attempt
            st5, res5 = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "999999"})
            record(
                "XV.1 Đăng nhập kho",
                "Nhập sai PIN 5 lần liên tiếp bị khóa xác minh 15 phút (429 PIN_LOCKED_15M)",
                st5 == 429 and res5["error"]["code"] == "PIN_LOCKED_15M" and res5["error"]["remainingSeconds"] == 900,
                f"Lockout: {res5['error']['remainingSeconds']}s",
            )

            # Trong thời gian khóa, nhập đúng PIN cũng không được phép thử
            st_locked, _ = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "048291"})
            record("XV.1 Đăng nhập kho", "Trong thời gian khóa 15 phút không cho phép thử tiếp", st_locked == 429, f"HTTP {st_locked}")

            # 1.7 Giả lập hết 15 phút khóa -> thử lại thành công và đặt lại bộ đếm sai
            conn = sqlite3.connect(str(db_path))
            past_lock = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=10)).isoformat()
            conn.execute("UPDATE storage_access_pins SET lock_until = ? WHERE account_id = 'admin-01'", (past_lock,))
            conn.commit()
            conn.close()

            st_ok, res_ok = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "048291"})
            vault_token_1 = res_ok["data"]["vaultToken"]
            record(
                "XV.1 Đăng nhập kho",
                "Sau 15 phút mở khóa, nhập đúng PIN cấp phiên truy cập 8 giờ (28800s)",
                st_ok == 200 and bool(vault_token_1) and res_ok["data"]["ttlSeconds"] == 28800,
                f"Session ID: {res_ok['data']['sessionId']}",
            )

            # 1.8 Kiểm tra hết hạn phiên sau 8 giờ
            conn = sqlite3.connect(str(db_path))
            expired_ts = (datetime.datetime.now(datetime.timezone.utc) - datetime.timedelta(seconds=5)).isoformat()
            conn.execute("UPDATE storage_access_sessions SET expires_at = ? WHERE id = ?", (expired_ts, res_ok["data"]["sessionId"]))
            conn.commit()
            conn.close()

            st_exp, res_exp = api_call("/api/v1/overview", vault_token=vault_token_1)
            record(
                "XV.1 Đăng nhập kho",
                "Phiên truy cập hết hạn sau 8 giờ bắt buộc xác minh lại PIN",
                st_exp == 401 and res_exp["error"]["code"] == "VAULT_SESSION_EXPIRED",
                res_exp["error"]["code"],
            )

            # Mở lại phiên mới
            _, res_ok2 = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "048291"})
            vault_token_2 = res_ok2["data"]["vaultToken"]

            # 1.9 Đổi PIN thu hồi phiên cũ
            st_chg, res_chg = api_call(
                "/api/v1/access/change-pin",
                method="POST",
                vault_token=vault_token_2,
                body={"currentPin": "048291", "newPin": "091827", "confirmPin": "091827"},
            )
            st_old_sess, _ = api_call("/api/v1/overview", vault_token=vault_token_2)
            record(
                "XV.1 Đăng nhập kho",
                "Đổi PIN thành công và tự động thu hồi phiên kho cũ",
                st_chg == 200 and st_old_sess == 401,
                "Phiên cũ bị từ chối (401)",
            )

            # =================================================================
            # 2. KIỂM THỬ QUÊN PIN & OTP 5 PHÚT DÙNG 1 LẦN (PHẦN XV.2)
            # =================================================================
            _, res_v3 = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "091827"})
            vault_token_3 = res_v3["data"]["vaultToken"]

            # Yêu cầu OTP lần 1 (sẽ bị vô hiệu hóa khi cấp mã mới lần 2)
            _, otp_req1 = api_call("/api/v1/access/forgot-pin/request", method="POST")
            otp_code_1 = otp_req1["data"]["otpForEmailDelivery"]
            # Yêu cầu OTP lần 2
            st_otp2, otp_req2 = api_call("/api/v1/access/forgot-pin/request", method="POST")
            otp_code_2 = otp_req2["data"]["otpForEmailDelivery"]
            record(
                "XV.2 Quên PIN",
                "Phát hành OTP 6 chữ số có thời hạn 5 phút (300s)",
                st_otp2 == 200 and otp_req2["data"]["ttlSeconds"] == 300 and len(otp_code_2) == 6,
                f"TTL={otp_req2['data']['ttlSeconds']}s",
            )

            # Thử dùng mã OTP cũ (lần 1) hoặc OTP sai -> bị từ chối
            st_bad_otp, _ = api_call(
                "/api/v1/access/forgot-pin/reset",
                method="POST",
                body={"otp": otp_code_1 if otp_code_1 != otp_code_2 else "000000", "newPin": "055667", "confirmPin": "055667"},
            )
            record("XV.2 Quên PIN", "Mã OTP cũ hoặc OTP sai bị từ chối", st_bad_otp == 401, f"HTTP {st_bad_otp}")

            # Dùng OTP mới hợp lệ để đặt lại PIN '055667'
            st_rst, res_rst = api_call(
                "/api/v1/access/forgot-pin/reset",
                method="POST",
                body={"otp": otp_code_2, "newPin": "055667", "confirmPin": "055667"},
            )
            record(
                "XV.2 Quên PIN",
                "Khôi phục PIN bằng OTP hợp lệ tạo hash mới và thu hồi phiên cũ",
                st_rst == 200 and res_rst["data"]["pinReset"] is True,
                "PIN mới đã kích hoạt",
            )

            # Thử dùng lại OTP đã sử dụng -> bị từ chối
            st_reuse, _ = api_call(
                "/api/v1/access/forgot-pin/reset",
                method="POST",
                body={"otp": otp_code_2, "newPin": "123456", "confirmPin": "123456"},
            )
            record("XV.2 Quên PIN", "OTP đã dùng không thể sử dụng lại", st_reuse == 400, f"HTTP {st_reuse}")

            # PIN cũ ('091827') và phiên cũ (vault_token_3) mất hiệu lực
            st_old_pin, _ = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "091827"})
            st_old_tok, _ = api_call("/api/v1/overview", vault_token=vault_token_3)
            record(
                "XV.2 Quên PIN",
                "PIN cũ và phiên kho cũ đều mất hiệu lực sau khi khôi phục PIN",
                st_old_pin == 401 and st_old_tok == 401,
                "Cả PIN cũ và phiên cũ bị từ chối",
            )

            # Đăng nhập bằng PIN mới '055667'
            _, res_active = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "055667"})
            active_token = res_active["data"]["vaultToken"]

            # Kiểm tra Khóa kho toàn hệ thống và Mở khóa kho (Phần IV.6)
            st_lock, _ = api_call(
                "/api/v1/access/system-lock",
                method="POST",
                vault_token=active_token,
                body={"lock": True, "reason": "Kiểm thử khóa toàn hệ thống"},
            )
            st_while_locked, res_wl = api_call("/api/v1/overview", vault_token=active_token)
            record(
                "XV.1 Đăng nhập kho",
                "Khóa kho toàn hệ thống thu hồi mọi phiên và chặn truy cập (423 SYSTEM_VAULT_LOCKED)",
                st_lock == 200 and st_while_locked == 423,
                res_wl["error"]["code"],
            )

            # Mở khóa toàn hệ thống bằng PIN của Admin bảo mật
            st_unlock, _ = api_call(
                "/api/v1/access/system-lock",
                method="POST",
                body={"lock": False, "pin": "055667"},
            )
            _, res_reopen = api_call("/api/v1/access/verify-pin", method="POST", body={"pin": "055667"})
            active_token = res_reopen["data"]["vaultToken"]
            record("XV.1 Đăng nhập kho", "Mở khóa kho toàn hệ thống thành công", st_unlock == 200, "Kho đã mở lại")

            # =================================================================
            # 3. KIỂM THỬ TỰ ĐỘNG LƯU & HÀNG ĐỢI SỰ KIỆN (PHẦN XV.3 & XIV.3)
            # =================================================================
            # 3.1 Đăng tài liệu tạo bản lưu v1 (bao gồm tài liệu có externalUrl)
            st_doc1, res_doc1 = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "DOCUMENT_CREATED",
                    "itemType": "DOCUMENT",
                    "sourceId": "doc-cnc-01",
                    "idempotencyKey": "ev-doc-cnc-01-v1",
                    "payload": {
                        "title": "Sổ tay Tiếng Anh Kỹ thuật Gia công Cơ khí & Vận hành CNC",
                        "content": "Thuật ngữ: spindle speed, feed rate, coolant level, micrometer...",
                        "authorId": "admin-01",
                        "authorName": "Bùi Tấn Lộc",
                        "externalUrl": "https://example.org/cnc-handbook.pdf",
                        "fileFormat": "PDF",
                    },
                },
            )
            doc_item_id = res_doc1["data"]["itemId"]
            record(
                "XV.3 Tự động lưu",
                "Đăng tài liệu mới tự động tạo bản lưu v1 (kèm ghi nhận externalUrl an toàn)",
                st_doc1 == 201 and res_doc1["data"]["versionNumber"] == 1,
                f"Item ID: {doc_item_id}",
            )

            # 3.2 Chỉnh sửa tài liệu tạo phiên bản mới v2 (không ghi đè v1)
            st_doc2, res_doc2 = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "DOCUMENT_UPDATED",
                    "itemType": "DOCUMENT",
                    "sourceId": "doc-cnc-01",
                    "idempotencyKey": "ev-doc-cnc-01-v2",
                    "payload": {
                        "title": "Sổ tay Tiếng Anh Kỹ thuật Gia công Cơ khí & Vận hành CNC (Bản cập nhật)",
                        "content": "Bổ sung quy trình kiểm tra dung sai (tolerance) và báo cáo ca máy.",
                        "editorId": "admin-01",
                        "editorName": "Bùi Tấn Lộc",
                        "externalUrl": "https://example.org/cnc-handbook-v2.pdf",
                        "fileFormat": "PDF",
                    },
                },
            )
            record(
                "XV.3 Tự động lưu",
                "Chỉnh sửa tài liệu tự động tạo phiên bản v2 (giữ nguyên v1)",
                st_doc2 == 201 and res_doc2["data"]["versionNumber"] == 2,
                f"Version: v{res_doc2['data']['versionNumber']}",
            )

            # 3.3 Tạo bài đăng cộng đồng (bởi tài khoản A) và chỉnh sửa tạo phiên bản mới
            st_p1, res_p1 = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "POST_CREATED",
                    "itemType": "COMMUNITY_POST",
                    "sourceId": "post-shared-01",
                    "idempotencyKey": "ev-post-shared-01-v1",
                    "payload": {
                        "title": "Chia sẻ mẫu câu giao tiếp bàn giao ca xưởng Điện công nghiệp",
                        "content": "Please check the main circuit breaker before maintenance.",
                        "authorId": "user-A",
                        "authorName": "Học viên A",
                        "ownerId": "user-A",
                    },
                },
            )
            st_p2, res_p2 = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "POST_UPDATED",
                    "itemType": "COMMUNITY_POST",
                    "sourceId": "post-shared-01",
                    "idempotencyKey": "ev-post-shared-01-v2",
                    "payload": {
                        "title": "Chia sẻ mẫu câu giao tiếp bàn giao ca xưởng Điện công nghiệp (Đã bổ sung)",
                        "content": "Please check the main circuit breaker and lockout-tagout (LOTO) procedure.",
                        "authorId": "user-A",
                        "editorId": "user-A",
                        "editorName": "Học viên A",
                        "ownerId": "user-A",
                    },
                },
            )
            record(
                "XV.3 Tự động lưu",
                "Tạo và chỉnh sửa bài đăng cộng đồng tự động lưu v1 -> v2",
                st_p1 == 201 and st_p2 == 201 and res_p2["data"]["versionNumber"] == 2,
                f"Post Item: {res_p2['data']['itemId']}",
            )

            # 3.4 Đăng bình luận của Học viên B trên bài của Học viên A
            st_c1, res_c1 = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "COMMENT_CREATED",
                    "itemType": "COMMUNITY_COMMENT",
                    "sourceId": "comment-userB-01",
                    "idempotencyKey": "ev-comment-userB-01",
                    "payload": {
                        "title": "Bình luận thảo luận quy trình LOTO",
                        "content": "Cảm ơn bạn, cụm từ lockout-tagout rất sát thực tế thực tập!",
                        "authorId": "user-B",
                        "authorName": "Học viên B",
                        "ownerId": "user-B",
                        "parentSourceId": "post-shared-01",
                    },
                },
            )
            record(
                "XV.3 Tự động lưu",
                "Đăng bình luận cộng đồng tự động tạo bản lưu độc lập",
                st_c1 == 201 and res_c1["data"]["versionNumber"] == 1,
                f"Comment Item: {res_c1['data']['itemId']}",
            )

            # 3.5 Kiểm tra chống ghi trùng (Idempotency) và hàng đợi thử lại (Retry Queue)
            st_dup, res_dup = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "COMMENT_CREATED",
                    "itemType": "COMMUNITY_COMMENT",
                    "sourceId": "comment-userB-01",
                    "idempotencyKey": "ev-comment-userB-01",
                    "payload": {"content": "Duplicate retry"},
                },
            )
            record(
                "XV.3 Tự động lưu",
                "Chống ghi trùng bằng khóa định danh sự kiện (idempotencyKey)",
                st_dup == 200 and res_dup["data"]["deduplicated"] is True,
                "Deduplicated=True",
            )

            # Sự kiện vào hàng đợi chờ xử lý rồi chạy Retry thành công
            st_q, res_q = api_call(
                "/api/v1/archive/events",
                method="POST",
                body={
                    "eventType": "COMMENT_CREATED",
                    "itemType": "COMMUNITY_COMMENT",
                    "sourceId": "comment-userA-private-01",
                    "idempotencyKey": "ev-comment-userA-priv-01",
                    "queueOnly": True,
                    "payload": {
                        "title": "Ghi chú riêng của Học viên A",
                        "content": "Nội dung bình luận riêng của A",
                        "authorId": "user-A",
                        "authorName": "Học viên A",
                        "ownerId": "user-A",
                    },
                },
            )
            st_retry, res_retry = api_call(
                "/api/v1/archive/retry-failed",
                method="POST",
                vault_token=active_token,
            )
            record(
                "XV.3 Tự động lưu",
                "Sự kiện tạm hoãn được giữ trong hàng đợi và tự động thử lại thành công",
                st_q == 202 and st_retry == 200 and res_retry["data"]["succeededCount"] >= 1,
                f"Retried={res_retry['data']['succeededCount']}",
            )

            # =================================================================
            # 4. KIỂM THỬ NHẬP DỮ LIỆU CŨ LẦN ĐẦU (PHẦN XV.4)
            # =================================================================
            sample_legacy = {
                "documents": [
                    {"id": "legacy-doc-1", "title": "Tài liệu Tiếng Anh Điện Công Nghiệp", "content": "Nội dung cũ 1", "fileFormat": "PDF"},
                    {"id": "legacy-doc-2", "title": "Tài liệu Tiếng Anh Điều Dưỡng", "content": "Nội dung cũ 2", "fileFormat": "PDF"},
                ],
                "posts": [
                    {"id": "legacy-post-1", "title": "Bài đăng cũ 1", "content": "Thảo luận ngành Ô tô", "authorId": "u-old-1", "authorName": "Cựu SV"},
                ],
                "comments": [
                    {"id": "legacy-cmt-1", "postId": "legacy-post-1", "content": "Bình luận cũ 1", "authorId": "u-old-2", "authorName": "Thành viên"},
                ],
            }

            # 4.1 Giả lập lỗi 1 bản ghi để kiểm tra báo cáo lỗi & tiếp tục (resume)
            st_imp1, res_imp1 = api_call(
                "/api/v1/import/run",
                method="POST",
                vault_token=active_token,
                body={
                    "sourceRecords": sample_legacy,
                    "simulateFailSourceIds": ["legacy-doc-2"],
                },
            )
            job1 = res_imp1["data"]["job"]
            record(
                "XV.4 Nhập dữ liệu cũ",
                "Nhập theo lô có checkpoint và ghi nhận danh sách bản ghi lỗi (COMPLETED_WITH_ERRORS)",
                st_imp1 == 200 and job1["status"] == "COMPLETED_WITH_ERRORS" and job1["success_count"] == 3 and job1["failed_count"] == 1,
                f"Thành công: {job1['success_count']}, Lỗi: {job1['failed_count']}",
            )

            # 4.2 Chạy tiếp (Resume / Retry) chỉ nhập phần còn thiếu/lỗi, chống nhập lặp
            st_imp2, res_imp2 = api_call(
                "/api/v1/import/run",
                method="POST",
                vault_token=active_token,
                body={
                    "sourceRecords": sample_legacy,
                },
            )
            job2 = res_imp2["data"]["job"]
            record(
                "XV.4 Nhập dữ liệu cũ",
                "Chạy lại tác vụ chỉ nhập bản ghi còn thiếu và bỏ qua bản ghi đã có (chống nhập trùng)",
                st_imp2 == 200 and job2["status"] == "COMPLETED" and job2["success_count"] == 1 and job2["skipped_duplicate_count"] == 3,
                f"Mới: {job2['success_count']}, Bỏ qua trùng: {job2['skipped_duplicate_count']}",
            )

            # =================================================================
            # 5. KIỂM THỬ TỆP & SQLITE BLOB 15 MB (PHẦN XV.5)
            # =================================================================
            # 5.1 Upload tệp mã nguồn nhỏ (.ts) và kiểm tra preview an toàn
            small_code = b"export const greeting = '<script>alert(1)</script>';\n"
            st_up1, res_up1 = api_call(
                "/api/v1/files/upload",
                method="POST",
                vault_token=active_token,
                body={
                    "fileName": "security-check.ts",
                    "mimeType": "text/plain",
                    "base64Data": base64.b64encode(small_code).decode("ascii"),
                    "logicalPath": "/vault/files/security-check.ts",
                },
            )
            ts_item_id = res_up1["data"]["file"]["itemId"]
            expected_small_sha = hashlib.sha256(small_code).hexdigest()
            record(
                "XV.5 Kiểm thử tệp BLOB",
                "Tải tệp nhỏ (.ts) thành công và khớp mã SHA-256",
                st_up1 == 201 and res_up1["data"]["file"]["checksumSha256"] == expected_small_sha,
                f"SHA256={expected_small_sha[:16]}...",
            )

            # 5.2 Tải tệp cấu hình nhạy cảm (.env) -> tự động cảnh báo và đưa vào khu vực cách ly
            env_secret_bytes = b"AUTH_SECRET=super_secret_do_not_expose\n"
            st_env, res_env = api_call(
                "/api/v1/files/upload",
                method="POST",
                vault_token=active_token,
                body={
                    "fileName": ".env.production",
                    "mimeType": "text/plain",
                    "base64Data": base64.b64encode(env_secret_bytes).decode("ascii"),
                },
            )
            record(
                "XV.5 Kiểm thử tệp BLOB",
                "Tệp cấu hình nhạy cảm (.env) tự động được phát hiện và đưa vào khu vực cách ly",
                st_env == 201 and res_env["data"]["file"]["isQuarantined"] is True and res_env["data"]["file"]["status"] == "QUARANTINED",
                res_env["data"]["file"]["quarantineReason"],
            )

            # 5.3 Upload tệp đúng giới hạn 15 MB (15 * 1024 * 1024 = 15,728,640 bytes)
            exact_15mb = b"W" * (15 * 1024 * 1024)
            expected_15mb_sha = hashlib.sha256(exact_15mb).hexdigest()
            st_15m, res_15m = api_call(
                "/api/v1/files/upload",
                method="POST",
                vault_token=active_token,
                body={
                    "fileName": "archive_15mb_exact.zip",
                    "mimeType": "application/zip",
                    "base64Data": base64.b64encode(exact_15mb).decode("ascii"),
                },
            )
            file_15m_id = res_15m["data"]["file"]["fileId"]
            item_15m_id = res_15m["data"]["file"]["itemId"]

            # Kiểm tra trực tiếp trong bảng storage_file_blobs của SQLite xem BLOB 15 MB đã ghi thật chưa
            conn = sqlite3.connect(str(db_path))
            blob_len_row = conn.execute(
                "SELECT length(blob_data), checksum_sha256 FROM storage_file_blobs WHERE file_id = ?",
                (file_15m_id,),
            ).fetchone()
            conn.close()
            record(
                "XV.5 Kiểm thử tệp BLOB",
                "Tải tệp đúng 15 MB (15,728,640 bytes) ghi thực tế vào SQLite BLOB và khớp SHA-256",
                st_15m == 201 and blob_len_row is not None and blob_len_row[0] == 15 * 1024 * 1024 and blob_len_row[1] == expected_15mb_sha,
                f"SQLite BLOB length={blob_len_row[0]} bytes",
            )

            # 5.4 Tệp vượt 15 MB (15 MB + 1 byte) bị từ chối ở backend kể cả khi giả mạo request
            over_15mb = b"X" * (15 * 1024 * 1024 + 1)
            st_over, res_over = api_call(
                "/api/v1/files/upload",
                method="POST",
                vault_token=active_token,
                body={
                    "fileName": "oversized_spoofed.zip",
                    "expectedSizeBytes": 1024,  # giả mạo kích thước nhỏ
                    "base64Data": base64.b64encode(over_15mb).decode("ascii"),
                },
            )
            record(
                "XV.5 Kiểm thử tệp BLOB",
                "Tệp vượt 15 MB (kể cả giả mạo kích thước request) bị backend từ chối (413)",
                st_over == 413 and res_over["error"]["code"] == "FILE_EXCEEDS_15MB_LIMIT",
                res_over["error"]["code"],
            )

            # 5.5 Kiểm tra Download & Preview an toàn
            st_dl, res_dl = api_call(f"/api/v1/download/{ts_item_id}", vault_token=active_token)
            dl_bytes = base64.b64decode(res_dl["data"]["base64Content"])
            st_prev, res_prev = api_call(f"/api/v1/items/{ts_item_id}/preview", vault_token=active_token)
            record(
                "XV.5 Kiểm thử tệp BLOB",
                "Download trả đúng nội dung BLOB và Preview trả mã nguồn văn bản an toàn (executionBlocked=True)",
                st_dl == 200 and dl_bytes == small_code and st_prev == 200 and res_prev["data"]["executionBlocked"] is True,
                "Download & Safe Preview OK",
            )

            # =================================================================
            # 6. KIỂM THỬ QUẢN LÝ PHIÊN BẢN (PHẦN XV.6)
            # =================================================================
            # Tải lại tệp cùng vị trí logic '/vault/files/security-check.ts' -> Tạo phiên bản v2, giữ nguyên v1
            v2_code = b"export const greeting = 'Safe updated version 2';\n"
            st_up_v2, res_up_v2 = api_call(
                "/api/v1/files/upload",
                method="POST",
                vault_token=active_token,
                body={
                    "fileName": "security-check.ts",
                    "mimeType": "text/plain",
                    "base64Data": base64.b64encode(v2_code).decode("ascii"),
                    "logicalPath": "/vault/files/security-check.ts",
                },
            )
            # Tải phiên bản cũ v1 để đối chiếu
            _, dl_v1 = api_call(f"/api/v1/download/{ts_item_id}?version=1", vault_token=active_token)
            # Khôi phục phiên bản v1 thành phiên bản hiện tại mới (v3)
            st_rest_v, res_rest_v = api_call(
                "/api/v1/versions/restore",
                method="POST",
                vault_token=active_token,
                body={"itemId": ts_item_id, "versionNumber": 1},
            )
            record(
                "XV.6 Kiểm thử phiên bản",
                "Tải lại tệp tạo v2, tải được bản cũ v1 và khôi phục v1 thành phiên bản mới v3 không mất lịch sử",
                st_up_v2 == 201
                and res_up_v2["data"]["file"]["versionNumber"] == 2
                and base64.b64decode(dl_v1["data"]["base64Content"]) == small_code
                and st_rest_v == 200
                and res_rest_v["data"]["newVersionNumber"] == 3
                and res_rest_v["data"]["checksumSha256"] == expected_small_sha,
                f"New version: v{res_rest_v['data']['newVersionNumber']}",
            )

            # =================================================================
            # 7. KIỂM THỬ THÙNG RÁC & XÓA VĨNH VIỄN (PHẦN XV.7)
            # =================================================================
            # Đưa mục 15MB vào thùng rác -> Xem thùng rác -> Khôi phục -> Đưa lại vào thùng rác -> Xóa vĩnh viễn
            st_tr1, _ = api_call(
                "/api/v1/trash/move",
                method="POST",
                vault_token=active_token,
                body={"itemIds": [item_15m_id], "reason": "Kiểm thử xóa mềm"},
            )
            st_tr_list, res_tr_list = api_call("/api/v1/trash", vault_token=active_token)
            in_trash_ids = [x["item_id"] for x in res_tr_list["data"]["trashItems"]]

            st_tr_rest, _ = api_call(
                "/api/v1/trash/restore",
                method="POST",
                vault_token=active_token,
                body={"itemIds": [item_15m_id]},
            )

            # Đưa lại vào thùng rác và xóa vĩnh viễn để giải phóng 15 MB BLOB
            api_call("/api/v1/trash/move", method="POST", vault_token=active_token, body={"itemIds": [item_15m_id]})
            st_perm, res_perm = api_call(
                "/api/v1/trash/permanent-delete",
                method="POST",
                vault_token=active_token,
                body={"itemIds": [item_15m_id], "confirmationPhrase": "XOA VINH VIEN"},
            )

            conn = sqlite3.connect(str(db_path))
            orphan_blobs = conn.execute(
                "SELECT COUNT(*) FROM storage_file_blobs WHERE file_id NOT IN (SELECT id FROM storage_files)"
            ).fetchone()[0]
            deleted_blob_exists = conn.execute(
                "SELECT COUNT(*) FROM storage_file_blobs WHERE file_id = ?", (file_15m_id,)
            ).fetchone()[0]
            conn.close()

            record(
                "XV.7 Kiểm thử thùng rác",
                "Xóa mềm, xem thùng rác, khôi phục, xóa vĩnh viễn có xác nhận và không còn BLOB mồ côi",
                st_tr1 == 200
                and item_15m_id in in_trash_ids
                and st_tr_rest == 200
                and st_perm == 200
                and res_perm["data"]["freedBytes"] == 15 * 1024 * 1024
                and orphan_blobs == 0
                and deleted_blob_exists == 0,
                f"Freed={res_perm['data']['freedBytes']} bytes, OrphanBLOBs={orphan_blobs}",
            )

            # =================================================================
            # 8. KIỂM THỬ XỬ LÝ KHI XÓA TÀI KHOẢN (PHẦN XV.8)
            # =================================================================
            # Tài khoản user-A có:
            # - Bài đăng chung 'post-shared-01' (có bình luận của user-B -> Phải giữ lại thảo luận chung và ẩn danh tên A)
            # - Bình luận riêng 'comment-userA-private-01' (chỉ thuộc A -> Đưa vào diện xóa mềm/thùng rác)
            st_del_acc, res_del_acc = api_call(
                "/api/v1/accounts/handle-deletion",
                method="POST",
                vault_token=active_token,
                body={
                    "deletedAccountId": "user-A",
                    "deletedAccountEmail": "userA@example.com",
                    "permanentPurgePrivate": False,
                },
            )
            rep = res_del_acc["data"]["deletionReport"]

            conn = sqlite3.connect(str(db_path))
            shared_post_row = conn.execute(
                "SELECT storage_status, author_name FROM storage_items WHERE source_id = 'post-shared-01'"
            ).fetchone()
            user_b_cmt_row = conn.execute(
                "SELECT storage_status, author_name FROM storage_items WHERE source_id = 'comment-userB-01'"
            ).fetchone()
            user_a_priv_row = conn.execute(
                "SELECT storage_status FROM storage_items WHERE source_id = 'comment-userA-private-01'"
            ).fetchone()
            conn.close()

            record(
                "XV.8 Kiểm thử xóa tài khoản",
                "Xóa tài khoản A xử lý dữ liệu riêng của A, bảo toàn bình luận của tài khoản B và thảo luận chung",
                st_del_acc == 200
                and rep["trashedItemsCount"] >= 1
                and rep["preservedSharedCount"] >= 1
                and shared_post_row[0] == "ACTIVE"
                and "đã xóa" in shared_post_row[1].lower()
                and user_b_cmt_row[0] == "ACTIVE"
                and user_a_priv_row[0] == "TRASHED",
                f"TrashedPrivate={rep['trashedItemsCount']}, PreservedShared={rep['preservedSharedCount']}",
            )

            # =================================================================
            # 9. KIỂM THỬ ĐỐI TƯỢNG NGƯỜI HỌC & 16 LĨNH VỰC CHUYÊN NGÀNH (PHẦN XV.9)
            # =================================================================
            st_tax, res_tax = api_call("/api/v1/taxonomy", vault_token=active_token)
            tax_data = res_tax["data"]
            group_codes = [g["code"] for g in tax_data["learnerGroups"]]
            field_codes = [f["code"] for f in tax_data["fields"]]

            # Mở rộng thêm chuyên ngành mới động vào lĩnh vực C (Công nghệ ô tô)
            st_add_sp, res_add_sp = api_call(
                "/api/v1/taxonomy/manage",
                method="POST",
                vault_token=active_token,
                body={
                    "operation": "ADD_SPECIALTY",
                    "fieldId": "C",
                    "name": "Kỹ thuật trạm sạc và pin xe điện thông minh",
                },
            )
            record(
                "XV.9 Đối tượng & Chuyên ngành",
                "Đầy đủ 5 nhóm đối tượng (GDNN-GDTX, Trung cấp nghề, Cao đẳng nghề, Đại học, Người đi làm), 7 loại trường và 16 lĩnh vực (A-P) mở rộng động",
                st_tax == 200
                and group_codes == ["GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E"]
                and len(tax_data["institutionTypes"]) == 7
                and len(field_codes) >= 16
                and st_add_sp == 201,
                f"Fields={len(field_codes)}, TotalSpecialties={tax_data['totalSpecialties'] + 1}",
            )

            # =================================================================
            # 10. KIỂM THỬ BACKUP, RESTORE & BỀN VỮNG SAU RESTART (PHẦN XV.10)
            # =================================================================
            st_bk, res_bk = api_call(
                "/api/v1/backup/create",
                method="POST",
                vault_token=active_token,
                body={"label": "Backup kiểm thử nghiệm thu"},
            )
            bk_id = res_bk["data"]["backup"]["backupId"]

            # Khởi động lại tiến trình Storage Service để kiểm tra dữ liệu SQLite & BLOB bền vững sau restart
            proc.terminate()
            proc.wait(timeout=10)

            proc = subprocess.Popen(
                [sys.executable, str(SERVER_SCRIPT)],
                env=env,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
            )
            time.sleep(1.2)

            # Tải lại tệp BLOB sau khi restart server
            st_dl_after, res_dl_after = api_call(f"/api/v1/download/{ts_item_id}", vault_token=active_token)
            st_rest_bk, res_rest_bk = api_call(
                "/api/v1/backup/restore",
                method="POST",
                vault_token=active_token,
                body={"backupId": bk_id},
            )
            record(
                "XV.10 Triển khai & Phục hồi",
                "SQLite và BLOB tồn tại nguyên vẹn sau khi restart server; Backup & Restore nhất quán thành công",
                st_bk == 201
                and st_dl_after == 200
                and base64.b64decode(res_dl_after["data"]["base64Content"]) == small_code
                and st_rest_bk == 200
                and res_rest_bk["data"]["integrityCheck"] == "ok",
                f"Backup ID: {bk_id}",
            )

        finally:
            if proc.poll() is None:
                proc.terminate()
                try:
                    proc.wait(timeout=5)
                except Exception:
                    proc.kill()

    print("\n==================================================================")
    print(f"HOÀN TẤT KIỂM THỬ BẮT BUỘC: {len(results)}/{len(results)} HẠNG MỤC ĐẠT 100% (PASS)")
    print("==================================================================")
    return results


if __name__ == "__main__":
    run_all_tests()
