#!/usr/bin/env python3
"""
WORD BRIDGE SOURCE STORAGE - INDEPENDENT SQLITE BLOB STORAGE SERVICE
Tên phân hệ: WORD BRIDGE SOURCE STORAGE
Vị trí quản trị: Quản trị -> Lưu trữ mã nguồn (/luu-tru-ma-nguon)
Không sử dụng: Cloudflare R2, Cloudflare D1
Hạ tầng: Dịch vụ lưu trữ SQLite BLOB bền vững độc lập (giao tiếp với Cloudflare Workers / Next.js qua API bảo mật)
"""

import base64
import ctypes
import ctypes.util
import datetime
import hashlib
import hmac
import http.server
import json
import os
import shutil
import sqlite3
import sys
import threading
import time
import urllib.parse
import uuid
from pathlib import Path
from typing import Any, Dict, List, Optional, Tuple

# Configuration
STORAGE_DIR = Path(os.environ.get("WB_STORAGE_DIR", Path(__file__).resolve().parent / "data"))
STORAGE_DIR.mkdir(parents=True, exist_ok=True)
BACKUP_DIR = STORAGE_DIR / "backups"
BACKUP_DIR.mkdir(parents=True, exist_ok=True)

DB_PATH = Path(os.environ.get("WB_STORAGE_DB_PATH", STORAGE_DIR / "wordbridge_source_storage.db"))
SOURCE_APP_DB_PATH = Path(
    os.environ.get(
        "WB_SOURCE_APP_DB_PATH",
        Path(__file__).resolve().parent.parent / "prisma" / "dev.db",
    )
)
SERVICE_TOKEN = os.environ.get("WB_STORAGE_SERVICE_TOKEN", "wb-storage-internal-secret-2026")
PIN_PEPPER = os.environ.get("WB_STORAGE_PIN_PEPPER", "wb-pin-server-pepper-secret-2026")
PORT = int(os.environ.get("WB_STORAGE_PORT", "4100"))

MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024  # 15 MB per file
PIN_MAX_FAILED_ATTEMPTS = 5
PIN_LOCKOUT_SECONDS = 15 * 60  # 15 minutes
SESSION_TTL_SECONDS = 8 * 60 * 60  # 8 hours
OTP_TTL_SECONDS = 5 * 60  # 5 minutes

DB_LOCK = threading.RLock()

# Load libargon2 if available for Argon2id PIN hashing
_libargon2 = None
try:
    _lib_path = ctypes.util.find_library("argon2")
    if _lib_path:
        _libargon2 = ctypes.CDLL(_lib_path)
        _libargon2.argon2id_hash_encoded.argtypes = [
            ctypes.c_uint32,
            ctypes.c_uint32,
            ctypes.c_uint32,
            ctypes.c_void_p,
            ctypes.c_size_t,
            ctypes.c_void_p,
            ctypes.c_size_t,
            ctypes.c_size_t,
            ctypes.c_char_p,
            ctypes.c_size_t,
        ]
        _libargon2.argon2id_hash_encoded.restype = ctypes.c_int
        _libargon2.argon2_verify.argtypes = [
            ctypes.c_char_p,
            ctypes.c_void_p,
            ctypes.c_size_t,
            ctypes.c_int,
        ]
        _libargon2.argon2_verify.restype = ctypes.c_int
except Exception:
    _libargon2 = None


def now_iso() -> str:
    return datetime.datetime.now(datetime.timezone.utc).isoformat()


def parse_iso(ts: Optional[str]) -> Optional[datetime.datetime]:
    if not ts:
        return None
    try:
        if ts.endswith("Z"):
            ts = ts[:-1] + "+00:00"
        dt = datetime.datetime.fromisoformat(ts)
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=datetime.timezone.utc)
        return dt
    except Exception:
        return None


def hash_pin_argon2id(pin: str, salt_hex: Optional[str] = None) -> Tuple[str, str, str]:
    """
    Hash 6-digit PIN with unique account salt and server pepper using Argon2id (priority)
    or scrypt fallback if libargon2 is unavailable.
    Never logs or returns plain PIN.
    """
    salt_bytes = bytes.fromhex(salt_hex) if salt_hex else os.urandom(16)
    salt_out = salt_bytes.hex()
    material = f"{pin}:{PIN_PEPPER}".encode("utf-8")

    if _libargon2 is not None:
        encoded = ctypes.create_string_buffer(256)
        res = _libargon2.argon2id_hash_encoded(
            3, 65536, 4, material, len(material), salt_bytes, len(salt_bytes), 32, encoded, 256
        )
        if res == 0:
            return encoded.value.decode("utf-8"), salt_out, "argon2id"

    derived = hashlib.scrypt(material, salt=salt_bytes, n=16384, r=8, p=1, dklen=32)
    return f"scrypt${salt_out}${derived.hex()}", salt_out, "scrypt"


def verify_pin_hash(pin: str, stored_hash: str) -> bool:
    """Verify 6-digit PIN in constant time against Argon2id or scrypt hash."""
    if not stored_hash or not pin or len(pin) != 6 or not pin.isdigit():
        return False
    material = f"{pin}:{PIN_PEPPER}".encode("utf-8")
    if stored_hash.startswith("$argon2id$") and _libargon2 is not None:
        res = _libargon2.argon2_verify(stored_hash.encode("utf-8"), material, len(material), 2)
        return res == 0
    if stored_hash.startswith("scrypt$"):
        parts = stored_hash.split("$")
        if len(parts) != 3:
            return False
        salt_bytes = bytes.fromhex(parts[1])
        expected = bytes.fromhex(parts[2])
        derived = hashlib.scrypt(material, salt=salt_bytes, n=16384, r=8, p=1, dklen=32)
        return hmac.compare_digest(derived, expected)
    return False


def hash_otp(account_id: str, email: str, otp_code: str) -> str:
    raw = f"{account_id.strip()}:{email.strip().lower()}:{otp_code.strip()}:{PIN_PEPPER}"
    return hashlib.sha256(raw.encode("utf-8")).hexdigest()


def compute_sha256(data: bytes) -> str:
    return hashlib.sha256(data).hexdigest()


# Initial Vocational & Career Taxonomy (Phần II.2, II.3, II.4)
INITIAL_LEARNER_GROUPS = [
    {
        "code": "GROUP_A",
        "name": "Nhóm A – Học viên Trung tâm GDNN–GDTX",
        "institutionType": "Trung tâm GDNN–GDTX",
        "description": "Học viên đang theo học tại các Trung tâm Giáo dục nghề nghiệp – Giáo dục thường xuyên.",
        "needs": [
            "Tiếng Anh cơ bản phục vụ học tập và định hướng nghề nghiệp",
            "Tiếng Anh giao tiếp trong môi trường nghề",
            "Từ vựng theo ngành hoặc nghề đang học",
            "Đọc hiểu hướng dẫn, quy trình và tài liệu chuyên môn",
            "Giao tiếp với khách hàng, đồng nghiệp và người hướng dẫn",
            "Chuẩn bị cho thực tập, học nghề và tìm kiếm việc làm",
        ],
    },
    {
        "code": "GROUP_B",
        "name": "Nhóm B – Học sinh trường Trung cấp nghề",
        "institutionType": "Trường Trung cấp nghề",
        "description": "Học sinh đang học tại các trường trung cấp nghề, theo nhiều khoa và chuyên ngành khác nhau.",
        "needs": [
            "Tiếng Anh theo đúng ngành đang học",
            "Thuật ngữ và từ vựng nghề nghiệp",
            "Đọc hiểu tài liệu kỹ thuật",
            "Mô tả dụng cụ, thiết bị, quy trình và thao tác nghề",
            "Trao đổi trong môi trường thực hành và thực tập",
            "Giao tiếp khi tiếp xúc với doanh nghiệp hoặc khách hàng nước ngoài",
            "Chuẩn bị phỏng vấn và tìm kiếm việc làm",
        ],
    },
    {
        "code": "GROUP_C",
        "name": "Nhóm C – Sinh viên trường Cao đẳng nghề",
        "institutionType": "Trường Cao đẳng nghề",
        "description": "Sinh viên đang theo học tại các trường cao đẳng nghề, cao đẳng kỹ thuật và các cơ sở đào tạo nghề có chương trình chuyên môn.",
        "needs": [
            "Tiếng Anh chuyên ngành theo khoa và chuyên ngành đào tạo",
            "Đọc tài liệu, hướng dẫn và tiêu chuẩn kỹ thuật bằng tiếng Anh",
            "Trình bày quy trình và giải thích vấn đề chuyên môn",
            "Giao tiếp trong quá trình thực tập",
            "Viết email công việc và báo cáo chuyên môn",
            "Tham gia phỏng vấn tuyển dụng",
            "Chuẩn bị làm việc tại doanh nghiệp có yếu tố nước ngoài",
            "Nâng cao năng lực cạnh tranh nghề nghiệp",
        ],
    },
    {
        "code": "GROUP_D",
        "name": "Nhóm D – Sinh viên đại học theo các khối ngành chuyên môn",
        "institutionType": "Trường Đại học",
        "description": "Sinh viên đại học thuộc các ngành CNTT, Kỹ thuật, Kinh tế - Kế toán, Y tế, Du lịch - Khách sạn, Quản trị, Logistics và các ngành chuyên môn khác.",
        "needs": [
            "Đọc tài liệu chuyên ngành",
            "Thuyết trình chuyên môn",
            "Viết email công việc",
            "Luyện phỏng vấn tuyển dụng",
            "Sử dụng tiếng Anh trong hoạt động chuyên môn",
        ],
    },
    {
        "code": "GROUP_E",
        "name": "Nhóm E – Người đang làm việc chuyên môn",
        "institutionType": "Người đã đi làm hoặc tự học nghề nghiệp",
        "description": "Kỹ thuật viên, nhân viên văn phòng, kế toán, nhân sự công nghệ, nhân viên kỹ thuật, dịch vụ và người lao động nâng cao tiếng Anh nghề nghiệp.",
        "needs": [
            "Giao tiếp công việc hàng ngày",
            "Họp chuyên môn",
            "Đọc tài liệu kỹ thuật và quy trình",
            "Xử lý tình huống thực tế",
            "Viết email và làm việc với đối tác nước ngoài",
        ],
    },
]

INSTITUTION_TYPES = [
    {"code": "GDNN_GDTX", "name": "Trung tâm GDNN–GDTX", "order": 1},
    {"code": "TRUNG_CAP_NGHE", "name": "Trường Trung cấp nghề", "order": 2},
    {"code": "CAO_DANG_NGHE", "name": "Trường Cao đẳng nghề", "order": 3},
    {"code": "CAO_DANG_KY_THUAT", "name": "Trường Cao đẳng có đào tạo chuyên ngành kỹ thuật và nghề nghiệp", "order": 4},
    {"code": "DAI_HOC", "name": "Trường Đại học", "order": 5},
    {"code": "CO_SO_KHAC", "name": "Cơ sở đào tạo chuyên môn khác", "order": 6},
    {"code": "DI_LAM_TU_HOC", "name": "Người đã đi làm hoặc tự học nghề nghiệp", "order": 7},
]

INITIAL_VOCATIONAL_FIELDS = [
    {
        "code": "A",
        "name": "Công nghệ thông tin và công nghệ số",
        "specialties": [
            "Công nghệ thông tin", "Khoa học máy tính", "Lập trình phần mềm", "Phát triển website",
            "Phát triển ứng dụng", "Trí tuệ nhân tạo", "Khoa học dữ liệu", "Quản trị cơ sở dữ liệu",
            "Mạng máy tính", "An ninh mạng", "Điện toán đám mây", "Thiết kế đồ họa", "Đa phương tiện", "Công nghệ số"
        ],
    },
    {
        "code": "B",
        "name": "Kế toán, kinh tế và quản trị",
        "specialties": [
            "Kế toán doanh nghiệp", "Kế toán tài chính", "Kiểm toán", "Thuế", "Tài chính", "Ngân hàng",
            "Kinh doanh", "Marketing", "Thương mại điện tử", "Quản trị doanh nghiệp", "Nhân sự",
            "Hành chính văn phòng", "Kinh doanh quốc tế"
        ],
    },
    {
        "code": "C",
        "name": "Công nghệ ô tô và phương tiện",
        "specialties": [
            "Công nghệ ô tô", "Bảo dưỡng và sửa chữa ô tô", "Kỹ thuật động cơ", "Điện ô tô",
            "Điện tử ô tô", "Chẩn đoán ô tô", "Công nghệ xe điện", "Xe máy", "Bảo dưỡng phương tiện"
        ],
    },
    {
        "code": "D",
        "name": "Cơ khí và chế tạo",
        "specialties": [
            "Công nghệ kỹ thuật cơ khí", "Cơ khí chế tạo", "Gia công cơ khí", "CNC", "Hàn", "Tiện",
            "Phay", "Cắt gọt kim loại", "Thiết kế cơ khí", "Đúc kim loại", "Bảo trì thiết bị công nghiệp", "Cơ điện tử"
        ],
    },
    {
        "code": "E",
        "name": "Y tế và chăm sóc sức khỏe",
        "specialties": [
            "Y khoa", "Điều dưỡng", "Dược", "Kỹ thuật xét nghiệm", "Kỹ thuật hình ảnh y học",
            "Phục hồi chức năng", "Hộ sinh", "Răng hàm mặt", "Chăm sóc sức khỏe cộng đồng",
            "Chăm sóc người cao tuổi", "Thiết bị y tế", "Dinh dưỡng", "Sơ cứu"
        ],
    },
    {
        "code": "F",
        "name": "Điện, điện tử và tự động hóa",
        "specialties": [
            "Điện công nghiệp", "Điện dân dụng", "Điện tử", "Tự động hóa", "Điều khiển công nghiệp",
            "Robot công nghiệp", "Cảm biến", "Điện lạnh", "Hệ thống điện", "Năng lượng tái tạo"
        ],
    },
    {
        "code": "G",
        "name": "Xây dựng và kiến trúc",
        "specialties": [
            "Kỹ thuật xây dựng", "Xây dựng dân dụng và công nghiệp", "Kiến trúc", "Nội thất", "Trắc địa",
            "Bản vẽ kỹ thuật", "Kết cấu", "Cấp thoát nước", "Vật liệu xây dựng", "Quản lý công trình", "An toàn lao động"
        ],
    },
    {
        "code": "H",
        "name": "Du lịch, nhà hàng và khách sạn",
        "specialties": [
            "Quản trị khách sạn", "Lễ tân", "Quản trị nhà hàng", "Nghiệp vụ buồng phòng",
            "Hướng dẫn du lịch", "Điều hành tour", "Dịch vụ du lịch", "Chăm sóc khách hàng"
        ],
    },
    {
        "code": "I",
        "name": "Ẩm thực và công nghệ thực phẩm",
        "specialties": [
            "Kỹ thuật chế biến món ăn", "Nghiệp vụ bếp", "Làm bánh", "Pha chế", "Barista",
            "Công nghệ thực phẩm", "Kiểm soát chất lượng", "An toàn thực phẩm", "Chế biến nông sản", "Chế biến thủy sản"
        ],
    },
    {
        "code": "J",
        "name": "Logistics và vận tải",
        "specialties": [
            "Logistics", "Quản lý kho", "Chuỗi cung ứng", "Xuất nhập khẩu", "Chứng từ thương mại",
            "Vận tải đường bộ", "Vận tải đường biển", "Vận tải hàng không", "Giao nhận", "Hải quan"
        ],
    },
    {
        "code": "K",
        "name": "Nông nghiệp và môi trường",
        "specialties": [
            "Nông nghiệp công nghệ cao", "Trồng trọt", "Chăn nuôi", "Thú y", "Nuôi trồng thủy sản",
            "Lâm nghiệp", "Công nghệ sinh học", "Bảo vệ thực vật", "Môi trường", "Quản lý tài nguyên", "Xử lý chất thải"
        ],
    },
    {
        "code": "L",
        "name": "Thiết kế và sáng tạo",
        "specialties": [
            "Thiết kế đồ họa", "Thiết kế thời trang", "Thiết kế nội thất", "Nhiếp ảnh",
            "Điện ảnh", "Sáng tạo nội dung số", "Hoạt hình", "Thiết kế sản phẩm", "Mỹ thuật ứng dụng"
        ],
    },
    {
        "code": "M",
        "name": "Làm đẹp và dịch vụ cá nhân",
        "specialties": [
            "Chăm sóc da", "Trang điểm", "Tạo mẫu tóc", "Chăm sóc móng",
            "Spa", "Chăm sóc cá nhân", "Dịch vụ thẩm mỹ không xâm lấn"
        ],
    },
    {
        "code": "N",
        "name": "Giáo dục và khoa học xã hội",
        "specialties": [
            "Giáo dục", "Sư phạm", "Tâm lý học", "Công tác xã hội", "Quản lý giáo dục",
            "Truyền thông", "Quan hệ công chúng", "Nghiên cứu xã hội", "Phát triển cộng đồng"
        ],
    },
    {
        "code": "O",
        "name": "Pháp luật và hành chính",
        "specialties": [
            "Pháp luật", "Pháp chế doanh nghiệp", "Hành chính", "Văn thư và lưu trữ",
            "Quản lý hành chính", "Nhân sự", "Tuân thủ và quản trị rủi ro"
        ],
    },
    {
        "code": "P",
        "name": "Các lĩnh vực khác",
        "specialties": [
            "Hàng không", "Hàng hải", "Đường sắt", "Dịch vụ công",
            "An toàn và bảo hộ lao động", "Khoa học", "Công nghệ mới", "Các ngành nghề mới phát sinh"
        ],
    },
]

ALLOWED_EXTENSIONS = {
    ".zip", ".pdf", ".txt", ".md", ".json", ".html", ".css", ".js", ".ts",
    ".jsx", ".tsx", ".sql", ".prisma", ".yaml", ".yml", ".toml", ".xml",
    ".csv", ".env", ".key", ".pem", ".conf", ".ini", ".sh", ".py"
}

TEXT_PREVIEWABLE_EXTENSIONS = {
    ".txt", ".md", ".json", ".html", ".css", ".js", ".ts", ".jsx", ".tsx",
    ".sql", ".prisma", ".yaml", ".yml", ".toml", ".xml", ".csv", ".conf", ".ini", ".sh", ".py"
}

SENSITIVE_FILENAME_PATTERNS = [
    ".env", "private", "id_rsa", ".pem", ".key", "credential", "secret", "token"
]


def is_sensitive_file(filename: str, content_bytes: bytes) -> Tuple[bool, str]:
    lower_name = filename.lower()
    for pat in SENSITIVE_FILENAME_PATTERNS:
        if pat in lower_name:
            return True, f"Tên tệp khớp mẫu nhạy cảm ({pat}) – đưa vào diện cảnh báo/cách ly bảo mật."
    try:
        sample = content_bytes[:4096].decode("utf-8", errors="ignore")
        for marker in ["BEGIN RSA PRIVATE KEY", "BEGIN PRIVATE KEY", "RESEND_API_KEY=", "AUTH_SECRET=", "ACCESS_TOKEN="]:
            if marker in sample:
                return True, f"Nội dung tệp chứa khóa/bí mật ({marker}) – đưa vào khu vực cách ly bảo mật."
    except Exception:
        pass
    return False, ""


def get_conn(db_path: Path = DB_PATH) -> sqlite3.Connection:
    conn = sqlite3.connect(str(db_path), timeout=30.0, check_same_thread=False)
    conn.row_factory = sqlite3.Row
    conn.execute("PRAGMA journal_mode=WAL;")
    conn.execute("PRAGMA synchronous=NORMAL;")
    conn.execute("PRAGMA foreign_keys=ON;")
    return conn


def init_storage_db() -> None:
    with DB_LOCK:
        conn = get_conn()
        try:
            conn.executescript(
                """
                CREATE TABLE IF NOT EXISTS storage_system_state (
                    key TEXT PRIMARY KEY,
                    value_json TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_nodes (
                    id TEXT PRIMARY KEY,
                    node_code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    db_file_path TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    is_primary INTEGER NOT NULL DEFAULT 1,
                    notes TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_access_pins (
                    account_id TEXT PRIMARY KEY,
                    email TEXT NOT NULL,
                    name TEXT NOT NULL,
                    role TEXT NOT NULL DEFAULT 'ADMIN',
                    pin_hash TEXT,
                    pin_salt TEXT,
                    hash_algo TEXT DEFAULT 'argon2id',
                    is_authorized INTEGER NOT NULL DEFAULT 1,
                    is_locked INTEGER NOT NULL DEFAULT 0,
                    failed_attempts INTEGER NOT NULL DEFAULT 0,
                    lock_started_at TEXT,
                    lock_until TEXT,
                    must_reset_pin INTEGER NOT NULL DEFAULT 0,
                    pin_set_at TEXT,
                    pin_updated_at TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_access_sessions (
                    id TEXT PRIMARY KEY,
                    session_token_hash TEXT UNIQUE NOT NULL,
                    account_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    role TEXT NOT NULL,
                    ip_address TEXT,
                    user_agent TEXT,
                    created_at TEXT NOT NULL,
                    expires_at TEXT NOT NULL,
                    revoked_at TEXT,
                    revoke_reason TEXT
                );

                CREATE TABLE IF NOT EXISTS storage_recovery_requests (
                    id TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL,
                    email TEXT NOT NULL,
                    otp_hash TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    attempt_count INTEGER NOT NULL DEFAULT 0,
                    max_attempts INTEGER NOT NULL DEFAULT 5,
                    expires_at TEXT NOT NULL,
                    used_at TEXT,
                    manual_support_note TEXT,
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_items (
                    id TEXT PRIMARY KEY,
                    item_type TEXT NOT NULL, -- DOCUMENT | COMMUNITY_POST | COMMUNITY_COMMENT | UPLOADED_FILE
                    source_id TEXT,
                    parent_source_id TEXT,
                    title TEXT,
                    content TEXT,
                    preview_text TEXT,
                    author_id TEXT,
                    author_name TEXT,
                    author_email TEXT,
                    creator_id TEXT,
                    creator_name TEXT,
                    editor_id TEXT,
                    editor_name TEXT,
                    owner_id TEXT,
                    source_status TEXT DEFAULT 'ACTIVE',
                    storage_status TEXT NOT NULL DEFAULT 'ACTIVE', -- ACTIVE | TRASHED | QUARANTINED | DELETED
                    is_quarantined INTEGER NOT NULL DEFAULT 0,
                    quarantine_reason TEXT,
                    external_url TEXT,
                    external_source_note TEXT,
                    file_id TEXT,
                    file_format TEXT,
                    file_size_bytes INTEGER NOT NULL DEFAULT 0,
                    checksum_sha256 TEXT NOT NULL,
                    current_version INTEGER NOT NULL DEFAULT 1,
                    storage_path TEXT NOT NULL,
                    notes TEXT,
                    metadata_json TEXT NOT NULL DEFAULT '{}',
                    source_created_at TEXT,
                    source_updated_at TEXT,
                    source_published_at TEXT,
                    imported_batch_code TEXT,
                    archived_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    UNIQUE(item_type, source_id)
                );

                CREATE INDEX IF NOT EXISTS idx_storage_items_type_status ON storage_items(item_type, storage_status);
                CREATE INDEX IF NOT EXISTS idx_storage_items_owner ON storage_items(owner_id, author_id, creator_id);

                CREATE TABLE IF NOT EXISTS storage_versions (
                    id TEXT PRIMARY KEY,
                    item_id TEXT NOT NULL,
                    version_number INTEGER NOT NULL,
                    title TEXT,
                    content TEXT,
                    file_id TEXT,
                    file_size_bytes INTEGER NOT NULL DEFAULT 0,
                    checksum_sha256 TEXT NOT NULL,
                    actor_id TEXT,
                    actor_name TEXT,
                    actor_email TEXT,
                    change_summary TEXT,
                    notes TEXT,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    metadata_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(item_id) REFERENCES storage_items(id) ON DELETE CASCADE,
                    UNIQUE(item_id, version_number)
                );

                CREATE TABLE IF NOT EXISTS storage_files (
                    id TEXT PRIMARY KEY,
                    item_id TEXT NOT NULL,
                    version_number INTEGER NOT NULL DEFAULT 1,
                    file_name TEXT NOT NULL,
                    file_ext TEXT NOT NULL,
                    mime_type TEXT NOT NULL,
                    size_bytes INTEGER NOT NULL DEFAULT 0,
                    checksum_sha256 TEXT NOT NULL,
                    uploader_id TEXT,
                    uploader_name TEXT,
                    uploader_email TEXT,
                    storage_location TEXT NOT NULL,
                    is_quarantined INTEGER NOT NULL DEFAULT 0,
                    quarantine_reason TEXT,
                    status TEXT NOT NULL DEFAULT 'ACTIVE',
                    notes TEXT,
                    uploaded_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_file_blobs (
                    file_id TEXT PRIMARY KEY,
                    blob_data BLOB NOT NULL,
                    size_bytes INTEGER NOT NULL,
                    checksum_sha256 TEXT NOT NULL,
                    created_at TEXT NOT NULL,
                    FOREIGN KEY(file_id) REFERENCES storage_files(id) ON DELETE CASCADE
                );

                CREATE TABLE IF NOT EXISTS storage_upload_sessions (
                    id TEXT PRIMARY KEY,
                    account_id TEXT NOT NULL,
                    account_name TEXT NOT NULL,
                    file_name TEXT NOT NULL,
                    file_ext TEXT NOT NULL,
                    expected_size_bytes INTEGER NOT NULL,
                    received_size_bytes INTEGER NOT NULL DEFAULT 0,
                    expected_checksum TEXT,
                    actual_checksum TEXT,
                    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | UPLOADING | COMPLETED | CANCELLED | FAILED
                    error_message TEXT,
                    item_id TEXT,
                    file_id TEXT,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_archive_events (
                    id TEXT PRIMARY KEY,
                    idempotency_key TEXT UNIQUE NOT NULL,
                    event_type TEXT NOT NULL, -- DOCUMENT_CREATED | DOCUMENT_UPDATED | POST_CREATED | POST_UPDATED | COMMENT_CREATED | COMMENT_UPDATED
                    item_type TEXT NOT NULL,
                    source_id TEXT NOT NULL,
                    payload_json TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING | PROCESSING | COMPLETED | FAILED
                    retry_count INTEGER NOT NULL DEFAULT 0,
                    max_retries INTEGER NOT NULL DEFAULT 5,
                    last_error TEXT,
                    item_id TEXT,
                    version_number INTEGER,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    processed_at TEXT
                );

                CREATE TABLE IF NOT EXISTS storage_import_jobs (
                    id TEXT PRIMARY KEY,
                    batch_code TEXT UNIQUE NOT NULL,
                    triggered_by_id TEXT NOT NULL,
                    triggered_by_name TEXT NOT NULL,
                    status TEXT NOT NULL DEFAULT 'NOT_RUN',
                    -- NOT_RUN | PREPARING | IMPORTING | COMPLETED | COMPLETED_WITH_ERRORS | FAILED | RESUMING
                    total_discovered INTEGER NOT NULL DEFAULT 0,
                    processed_count INTEGER NOT NULL DEFAULT 0,
                    success_count INTEGER NOT NULL DEFAULT 0,
                    skipped_duplicate_count INTEGER NOT NULL DEFAULT 0,
                    failed_count INTEGER NOT NULL DEFAULT 0,
                    errors_json TEXT NOT NULL DEFAULT '[]',
                    started_at TEXT,
                    completed_at TEXT,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS storage_import_checkpoints (
                    id TEXT PRIMARY KEY,
                    job_id TEXT NOT NULL,
                    entity_type TEXT NOT NULL, -- DOCUMENT | COMMUNITY_POST | COMMUNITY_COMMENT
                    last_source_id TEXT,
                    processed_count INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'PENDING',
                    updated_at TEXT NOT NULL,
                    UNIQUE(job_id, entity_type)
                );

                CREATE TABLE IF NOT EXISTS storage_trash (
                    id TEXT PRIMARY KEY,
                    item_id TEXT UNIQUE NOT NULL,
                    item_type TEXT NOT NULL,
                    title TEXT,
                    deleted_by_id TEXT NOT NULL,
                    deleted_by_name TEXT NOT NULL,
                    deleted_at TEXT NOT NULL,
                    reason TEXT,
                    related_version INTEGER,
                    restore_status TEXT NOT NULL DEFAULT 'IN_TRASH', -- IN_TRASH | RESTORED | PERMANENTLY_DELETED
                    restored_at TEXT,
                    snapshot_json TEXT NOT NULL DEFAULT '{}'
                );

                CREATE TABLE IF NOT EXISTS storage_audit_logs (
                    id TEXT PRIMARY KEY,
                    event_code TEXT NOT NULL,
                    actor_id TEXT,
                    actor_email TEXT,
                    actor_name TEXT,
                    actor_role TEXT,
                    action_label TEXT NOT NULL,
                    target_item_id TEXT,
                    target_type TEXT,
                    target_label TEXT,
                    ip_address TEXT,
                    user_agent TEXT,
                    status TEXT NOT NULL DEFAULT 'SUCCESS',
                    error_reason TEXT,
                    details_json TEXT NOT NULL DEFAULT '{}',
                    integrity_hash TEXT NOT NULL,
                    created_at TEXT NOT NULL
                );

                CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON storage_audit_logs(created_at DESC);
                CREATE INDEX IF NOT EXISTS idx_audit_logs_actor ON storage_audit_logs(actor_id, event_code);

                CREATE TABLE IF NOT EXISTS storage_account_deletion_tasks (
                    id TEXT PRIMARY KEY,
                    deleted_account_id TEXT NOT NULL,
                    deleted_account_email_hash TEXT NOT NULL,
                    triggered_by_id TEXT NOT NULL,
                    policy_mode TEXT NOT NULL DEFAULT 'SOFT_DELETE_PRIVATE_KEEP_PUBLIC_DISCUSSION',
                    owned_items_count INTEGER NOT NULL DEFAULT 0,
                    trashed_items_count INTEGER NOT NULL DEFAULT 0,
                    anonymized_public_count INTEGER NOT NULL DEFAULT 0,
                    preserved_shared_count INTEGER NOT NULL DEFAULT 0,
                    freed_bytes INTEGER NOT NULL DEFAULT 0,
                    status TEXT NOT NULL DEFAULT 'COMPLETED',
                    report_json TEXT NOT NULL DEFAULT '{}',
                    created_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS vocational_taxonomy_fields (
                    id TEXT PRIMARY KEY,
                    code TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    group_name TEXT NOT NULL,
                    description TEXT,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    display_order INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL
                );

                CREATE TABLE IF NOT EXISTS vocational_taxonomy_specialties (
                    id TEXT PRIMARY KEY,
                    field_id TEXT NOT NULL,
                    field_code TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    name TEXT NOT NULL,
                    major_name TEXT NOT NULL,
                    target_groups_json TEXT NOT NULL DEFAULT '["GROUP_A","GROUP_B","GROUP_C","GROUP_D","GROUP_E"]',
                    sample_situations_json TEXT NOT NULL DEFAULT '[]',
                    content_modules_json TEXT NOT NULL DEFAULT '[]',
                    is_reviewed INTEGER NOT NULL DEFAULT 1,
                    is_active INTEGER NOT NULL DEFAULT 1,
                    display_order INTEGER NOT NULL DEFAULT 0,
                    created_at TEXT NOT NULL,
                    updated_at TEXT NOT NULL,
                    FOREIGN KEY(field_id) REFERENCES vocational_taxonomy_fields(id) ON DELETE CASCADE
                );
                """
            )

            # Initialize default system state if not present
            ts = now_iso()
            cur = conn.execute("SELECT key FROM storage_system_state WHERE key = 'system_lock'")
            if not cur.fetchone():
                conn.execute(
                    "INSERT INTO storage_system_state (key, value_json, updated_at) VALUES (?, ?, ?)",
                    (
                        "system_lock",
                        json.dumps(
                            {
                                "isLocked": False,
                                "lockedBy": None,
                                "lockedByName": None,
                                "reason": None,
                                "lockedAt": None,
                                "autoArchiveEnabled": True,
                            }
                        ),
                        ts,
                    ),
                )

            cur = conn.execute("SELECT key FROM storage_system_state WHERE key = 'initial_import_state'")
            if not cur.fetchone():
                conn.execute(
                    "INSERT INTO storage_system_state (key, value_json, updated_at) VALUES (?, ?, ?)",
                    (
                        "initial_import_state",
                        json.dumps(
                            {
                                "hasCompletedInitialImport": False,
                                "lastJobId": None,
                                "lastBatchCode": None,
                                "status": "NOT_RUN",
                            }
                        ),
                        ts,
                    ),
                )

            # Primary storage node record
            conn.execute(
                """
                INSERT OR IGNORE INTO storage_nodes (id, node_code, name, db_file_path, status, is_primary, notes, created_at, updated_at)
                VALUES (?, ?, ?, ?, 'ACTIVE', 1, ?, ?, ?)
                """,
                (
                    "node-primary-01",
                    "WB-SQLITE-NODE-01",
                    "Nút lưu trữ SQLite BLOB chính (Độc lập)",
                    str(DB_PATH),
                    "Lưu trữ bền vững trên ổ đĩa độc lập, bật WAL & kiểm tra toàn vẹn SHA-256.",
                    ts,
                    ts,
                ),
            )

            # Seed vocational taxonomy (Fields A-P and all specialties) if empty
            field_count = conn.execute("SELECT COUNT(*) AS cnt FROM vocational_taxonomy_fields").fetchone()["cnt"]
            if field_count == 0:
                default_modules = [
                    "Lộ trình tiếng Anh",
                    "Từ vựng chuyên môn",
                    "Thuật ngữ",
                    "Cách phát âm",
                    "Mẫu câu",
                    "Hội thoại nghề nghiệp",
                    "Tình huống thực tế",
                    "Bài đọc",
                    "Bài nghe",
                    "Bài viết",
                    "Bài nói",
                    "Bài tập",
                    "Bài kiểm tra",
                    "Nội dung chuẩn bị thực tập",
                    "Nội dung chuẩn bị phỏng vấn",
                    "Nội dung giao tiếp tại nơi làm việc",
                ]
                for idx, f_item in enumerate(INITIAL_VOCATIONAL_FIELDS, start=1):
                    f_id = f"field-{f_item['code'].lower()}"
                    conn.execute(
                        """
                        INSERT INTO vocational_taxonomy_fields
                        (id, code, name, group_name, description, is_active, display_order, created_at, updated_at)
                        VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
                        """,
                        (
                            f_id,
                            f_item["code"],
                            f_item["name"],
                            f"Khối ngành {f_item['name']}",
                            f"Danh mục chuyên ngành thuộc lĩnh vực {f_item['name']} phục vụ học viên GDNN–GDTX, Trung cấp nghề, Cao đẳng nghề, Đại học và người đi làm.",
                            idx,
                            ts,
                            ts,
                        ),
                    )
                    for s_idx, spec_name in enumerate(f_item["specialties"], start=1):
                        s_id = f"spec-{f_item['code'].lower()}-{s_idx:02d}"
                        slug = f"{f_item['code'].lower()}-{s_idx:02d}"
                        situations = [
                            f"Đọc hiểu quy trình, tiêu chuẩn kỹ thuật và tài liệu chuyên ngành {spec_name}",
                            f"Giao tiếp thực hành tại xưởng/phòng lab và báo cáo công việc ngành {spec_name}",
                            f"Phỏng vấn tuyển dụng và viết email chuyên môn ngành {spec_name}",
                        ]
                        conn.execute(
                            """
                            INSERT INTO vocational_taxonomy_specialties
                            (id, field_id, field_code, slug, name, major_name, target_groups_json, sample_situations_json, content_modules_json, is_reviewed, is_active, display_order, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
                            """,
                            (
                                s_id,
                                f_id,
                                f_item["code"],
                                slug,
                                spec_name,
                                f_item["name"],
                                json.dumps(["GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E"], ensure_ascii=False),
                                json.dumps(situations, ensure_ascii=False),
                                json.dumps(default_modules, ensure_ascii=False),
                                s_idx,
                                ts,
                                ts,
                            ),
                        )

            conn.commit()
        finally:
            conn.close()


def append_audit_log(
    conn: sqlite3.Connection,
    event_code: str,
    action_label: str,
    actor_id: Optional[str] = None,
    actor_email: Optional[str] = None,
    actor_name: Optional[str] = None,
    actor_role: Optional[str] = "ADMIN",
    target_item_id: Optional[str] = None,
    target_type: Optional[str] = None,
    target_label: Optional[str] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    status: str = "SUCCESS",
    error_reason: Optional[str] = None,
    details: Optional[Dict[str, Any]] = None,
) -> str:
    """
    Append tamper-evident audit log entry (chained SHA-256 integrity hash).
    Never logs PIN, OTP, password, or secret tokens.
    """
    log_id = f"audit-{uuid.uuid4().hex[:16]}"
    ts = now_iso()
    safe_details = dict(details or {})
    for forbidden in ["pin", "newPin", "oldPin", "confirmPin", "otp", "code", "password", "token", "secret"]:
        safe_details.pop(forbidden, None)

    prev_row = conn.execute(
        "SELECT integrity_hash FROM storage_audit_logs ORDER BY created_at DESC LIMIT 1"
    ).fetchone()
    prev_hash = prev_row["integrity_hash"] if prev_row else "GENESIS"
    details_str = json.dumps(safe_details, ensure_ascii=False, sort_keys=True)
    chain_payload = f"{prev_hash}|{log_id}|{event_code}|{actor_id or ''}|{target_item_id or ''}|{status}|{ts}|{details_str}"
    integrity_hash = hashlib.sha256(chain_payload.encode("utf-8")).hexdigest()

    conn.execute(
        """
        INSERT INTO storage_audit_logs (
            id, event_code, actor_id, actor_email, actor_name, actor_role,
            action_label, target_item_id, target_type, target_label,
            ip_address, user_agent, status, error_reason, details_json,
            integrity_hash, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            log_id,
            event_code,
            actor_id,
            actor_email,
            actor_name,
            actor_role,
            action_label,
            target_item_id,
            target_type,
            target_label,
            ip_address or "127.0.0.1",
            user_agent or "WordBridge-Worker/1.0",
            status,
            error_reason,
            details_str,
            integrity_hash,
            ts,
        ),
    )
    return log_id


def get_system_lock_state(conn: sqlite3.Connection) -> Dict[str, Any]:
    row = conn.execute("SELECT value_json FROM storage_system_state WHERE key = 'system_lock'").fetchone()
    if not row:
        return {
            "isLocked": False,
            "lockedBy": None,
            "lockedByName": None,
            "reason": None,
            "lockedAt": None,
            "autoArchiveEnabled": True,
        }
    return json.loads(row["value_json"])


def set_system_lock_state(conn: sqlite3.Connection, state: Dict[str, Any]) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO storage_system_state (key, value_json, updated_at) VALUES ('system_lock', ?, ?)",
        (json.dumps(state, ensure_ascii=False), now_iso()),
    )


def get_initial_import_state(conn: sqlite3.Connection) -> Dict[str, Any]:
    row = conn.execute("SELECT value_json FROM storage_system_state WHERE key = 'initial_import_state'").fetchone()
    if not row:
        return {
            "hasCompletedInitialImport": False,
            "lastJobId": None,
            "lastBatchCode": None,
            "status": "NOT_RUN",
        }
    return json.loads(row["value_json"])


def set_initial_import_state(conn: sqlite3.Connection, state: Dict[str, Any]) -> None:
    conn.execute(
        "INSERT OR REPLACE INTO storage_system_state (key, value_json, updated_at) VALUES ('initial_import_state', ?, ?)",
        (json.dumps(state, ensure_ascii=False), now_iso()),
    )


def ensure_admin_pin_record(
    conn: sqlite3.Connection, account_id: str, email: str, name: str, role: str = "ADMIN"
) -> Dict[str, Any]:
    ts = now_iso()
    row = conn.execute(
        "SELECT * FROM storage_access_pins WHERE account_id = ?", (account_id,)
    ).fetchone()
    if not row:
        conn.execute(
            """
            INSERT INTO storage_access_pins (
                account_id, email, name, role, is_authorized, is_locked,
                failed_attempts, must_reset_pin, created_at, updated_at
            ) VALUES (?, ?, ?, ?, 1, 0, 0, 0, ?, ?)
            """,
            (account_id, email, name, role, ts, ts),
        )
        conn.commit()
        row = conn.execute(
            "SELECT * FROM storage_access_pins WHERE account_id = ?", (account_id,)
        ).fetchone()
    return dict(row)


def check_and_clear_expired_lockout(conn: sqlite3.Connection, pin_rec: Dict[str, Any]) -> Dict[str, Any]:
    if pin_rec.get("lock_until"):
        lock_dt = parse_iso(pin_rec["lock_until"])
        now_dt = datetime.datetime.now(datetime.timezone.utc)
        if lock_dt and now_dt >= lock_dt:
            conn.execute(
                """
                UPDATE storage_access_pins
                SET failed_attempts = 0, lock_started_at = NULL, lock_until = NULL, updated_at = ?
                WHERE account_id = ?
                """,
                (now_iso(), pin_rec["account_id"]),
            )
            conn.commit()
            pin_rec["failed_attempts"] = 0
            pin_rec["lock_started_at"] = None
            pin_rec["lock_until"] = None
    return pin_rec


def verify_vault_session(
    conn: sqlite3.Connection,
    account_id: str,
    role: str,
    vault_token: Optional[str],
    allow_when_system_locked: bool = False,
) -> Tuple[bool, int, str, str, Optional[Dict[str, Any]]]:
    """
    Multi-layer access verification (Phần IV.1):
    1. Logged in WORD BRIDGE account (account_id present)
    2. Appropriate Admin role (role == 'ADMIN' or 'SUPER_ADMIN')
    3. Vault not locked system-wide (unless managing lock)
    4. Account has PIN configured
    5. Valid 6-digit PIN verified in active session
    6. Session not expired (max 8 hours) and not revoked
    """
    if not account_id:
        return False, 401, "UNAUTHENTICATED", "Vui lòng đăng nhập tài khoản WORD BRIDGE.", None
    if role not in ("ADMIN", "SUPER_ADMIN"):
        return False, 403, "FORBIDDEN_ROLE", "Tài khoản không có quyền Admin để truy cập kho lưu trữ.", None

    sys_lock = get_system_lock_state(conn)
    if sys_lock.get("isLocked") and not allow_when_system_locked:
        return (
            False,
            423,
            "SYSTEM_VAULT_LOCKED",
            f"Kho lưu trữ đang bị khóa toàn hệ thống. Lý do: {sys_lock.get('reason') or 'Bảo trì bảo mật'}.",
            None,
        )

    pin_row = conn.execute(
        "SELECT * FROM storage_access_pins WHERE account_id = ?", (account_id,)
    ).fetchone()
    if not pin_row:
        return False, 403, "PIN_NOT_SETUP", "Tài khoản Admin chưa thiết lập mã PIN 6 chữ số.", None

    pin_rec = check_and_clear_expired_lockout(conn, dict(pin_row))
    if not pin_rec.get("is_authorized"):
        return False, 403, "ACCESS_REVOKED", "Quyền sử dụng kho lưu trữ của tài khoản này đã bị thu hồi.", None
    if pin_rec.get("is_locked"):
        return False, 403, "ACCOUNT_VAULT_LOCKED", "Tài khoản truy cập kho đang bị khóa bởi Quản trị viên.", None
    if not pin_rec.get("pin_hash") or pin_rec.get("must_reset_pin"):
        return False, 403, "PIN_NOT_SETUP", "Vui lòng thiết lập hoặc đặt lại mã PIN 6 chữ số trước khi mở kho.", None

    if not vault_token:
        return False, 401, "VAULT_SESSION_REQUIRED", "Vui lòng nhập mã PIN 6 chữ số để mở phiên truy cập kho.", None

    token_hash = hashlib.sha256(vault_token.encode("utf-8")).hexdigest()
    sess_row = conn.execute(
        """
        SELECT * FROM storage_access_sessions
        WHERE session_token_hash = ? AND account_id = ?
        """,
        (token_hash, account_id),
    ).fetchone()

    if not sess_row:
        return False, 401, "INVALID_VAULT_SESSION", "Phiên truy cập kho không hợp lệ. Vui lòng xác minh lại PIN.", None

    sess = dict(sess_row)
    if sess.get("revoked_at"):
        return (
            False,
            401,
            "VAULT_SESSION_REVOKED",
            f"Phiên truy cập kho đã bị thu hồi ({sess.get('revoke_reason') or 'Bảo mật'}). Vui lòng nhập lại PIN.",
            None,
        )

    exp_dt = parse_iso(sess.get("expires_at"))
    now_dt = datetime.datetime.now(datetime.timezone.utc)
    if not exp_dt or now_dt >= exp_dt:
        conn.execute(
            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'EXPIRED_8H' WHERE id = ?",
            (now_iso(), sess["id"]),
        )
        conn.commit()
        return False, 401, "VAULT_SESSION_EXPIRED", "Phiên truy cập kho 8 giờ đã hết hạn. Vui lòng xác minh lại PIN.", None

    return True, 200, "OK", "Hợp lệ", sess


def upsert_archive_item_internal(
    conn: sqlite3.Connection,
    item_type: str,
    source_id: str,
    title: Optional[str],
    content: str,
    author_id: Optional[str],
    author_name: Optional[str],
    author_email: Optional[str],
    creator_id: Optional[str],
    creator_name: Optional[str],
    editor_id: Optional[str],
    editor_name: Optional[str],
    owner_id: Optional[str],
    source_status: str = "ACTIVE",
    parent_source_id: Optional[str] = None,
    external_url: Optional[str] = None,
    file_format: Optional[str] = None,
    metadata: Optional[Dict[str, Any]] = None,
    source_created_at: Optional[str] = None,
    source_updated_at: Optional[str] = None,
    source_published_at: Optional[str] = None,
    imported_batch_code: Optional[str] = None,
    change_summary: Optional[str] = None,
    notes: Optional[str] = None,
    create_new_version_if_exists: bool = True,
) -> Tuple[str, int, bool]:
    """
    Insert or update a storage_item and create a new storage_version if content changed or requested.
    Never overwrites existing versions.
    Returns (item_id, version_number, is_new_item).
    """
    ts = now_iso()
    content_str = content or ""
    content_bytes = content_str.encode("utf-8")
    checksum = compute_sha256(content_bytes)
    size_bytes = len(content_bytes)
    meta_dict = dict(metadata or {})

    ext_note = None
    if external_url:
        ext_note = (
            "Tài liệu có liên kết ngoài (externalUrl). Hệ thống lưu liên kết và metadata nguồn; "
            "không tự động tải tệp từ URL ngoài để đảm bảo an toàn chống SSRF."
        )
        meta_dict["externalUrl"] = external_url
        meta_dict["externalSourceNote"] = ext_note

    existing = conn.execute(
        "SELECT * FROM storage_items WHERE item_type = ? AND source_id = ?",
        (item_type, source_id),
    ).fetchone()

    storage_path = f"/vault/{item_type.lower()}/{source_id}"

    if not existing:
        item_id = f"item-{uuid.uuid4().hex[:16]}"
        conn.execute(
            """
            INSERT INTO storage_items (
                id, item_type, source_id, parent_source_id, title, content, preview_text,
                author_id, author_name, author_email, creator_id, creator_name,
                editor_id, editor_name, owner_id, source_status, storage_status,
                is_quarantined, external_url, external_source_note, file_format,
                file_size_bytes, checksum_sha256, current_version, storage_path,
                notes, metadata_json, source_created_at, source_updated_at,
                source_published_at, imported_batch_code, archived_at, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', 0, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                item_type,
                source_id,
                parent_source_id,
                title,
                content_str,
                content_str[:500],
                author_id,
                author_name,
                author_email,
                creator_id or author_id,
                creator_name or author_name,
                editor_id,
                editor_name,
                owner_id or author_id or creator_id,
                source_status,
                external_url,
                ext_note,
                file_format or ("MARKDOWN" if item_type == "DOCUMENT" else "TEXT"),
                size_bytes,
                checksum,
                storage_path,
                notes,
                json.dumps(meta_dict, ensure_ascii=False),
                source_created_at or ts,
                source_updated_at or ts,
                source_published_at or ts,
                imported_batch_code,
                ts,
                ts,
            ),
        )
        ver_id = f"ver-{uuid.uuid4().hex[:16]}"
        conn.execute(
            """
            INSERT INTO storage_versions (
                id, item_id, version_number, title, content, file_size_bytes,
                checksum_sha256, actor_id, actor_name, actor_email,
                change_summary, notes, status, metadata_json, created_at
            ) VALUES (?, ?, 1, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
            """,
            (
                ver_id,
                item_id,
                title,
                content_str,
                size_bytes,
                checksum,
                creator_id or author_id,
                creator_name or author_name,
                author_email,
                change_summary or "Khởi tạo bản ghi lưu trữ lần đầu",
                notes,
                json.dumps(meta_dict, ensure_ascii=False),
                ts,
            ),
        )
        return item_id, 1, True

    item_dict = dict(existing)
    item_id = item_dict["id"]
    if not create_new_version_if_exists:
        return item_id, item_dict["current_version"], False

    next_ver = int(item_dict["current_version"]) + 1
    conn.execute(
        """
        UPDATE storage_items
        SET title = ?, content = ?, preview_text = ?,
            editor_id = ?, editor_name = ?, source_status = ?,
            external_url = ?, external_source_note = ?,
            file_size_bytes = ?, checksum_sha256 = ?,
            current_version = ?, notes = COALESCE(?, notes),
            metadata_json = ?, source_updated_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            title if title is not None else item_dict["title"],
            content_str,
            content_str[:500],
            editor_id or author_id,
            editor_name or author_name,
            source_status,
            external_url if external_url is not None else item_dict["external_url"],
            ext_note if external_url is not None else item_dict["external_source_note"],
            size_bytes,
            checksum,
            next_ver,
            notes,
            json.dumps(meta_dict, ensure_ascii=False),
            source_updated_at or ts,
            ts,
            item_id,
        ),
    )
    ver_id = f"ver-{uuid.uuid4().hex[:16]}"
    conn.execute(
        """
        INSERT INTO storage_versions (
            id, item_id, version_number, title, content, file_size_bytes,
            checksum_sha256, actor_id, actor_name, actor_email,
            change_summary, notes, status, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        """,
        (
            ver_id,
            item_id,
            next_ver,
            title if title is not None else item_dict["title"],
            content_str,
            size_bytes,
            checksum,
            editor_id or author_id,
            editor_name or author_name,
            author_email,
            change_summary or f"Cập nhật nội dung phiên bản #{next_ver}",
            notes,
            json.dumps(meta_dict, ensure_ascii=False),
            ts,
        ),
    )
    return item_id, next_ver, False


def process_archive_event_record(conn: sqlite3.Connection, event_row: Dict[str, Any]) -> Tuple[bool, Optional[str]]:
    """Process a queued auto-archive event reliably with idempotency protection."""
    ts = now_iso()
    event_id = event_row["id"]
    try:
        conn.execute(
            "UPDATE storage_archive_events SET status = 'PROCESSING', updated_at = ? WHERE id = ?",
            (ts, event_id),
        )
        payload = json.loads(event_row["payload_json"])
        item_type = event_row["item_type"]
        source_id = event_row["source_id"]
        event_type = event_row["event_type"]

        is_update = event_type.endswith("_UPDATED")
        item_id, ver_num, is_new = upsert_archive_item_internal(
            conn=conn,
            item_type=item_type,
            source_id=source_id,
            title=payload.get("title"),
            content=payload.get("content", ""),
            author_id=payload.get("authorId"),
            author_name=payload.get("authorName"),
            author_email=payload.get("authorEmail"),
            creator_id=payload.get("creatorId") or payload.get("authorId"),
            creator_name=payload.get("creatorName") or payload.get("authorName"),
            editor_id=payload.get("editorId"),
            editor_name=payload.get("editorName"),
            owner_id=payload.get("ownerId") or payload.get("authorId"),
            source_status=payload.get("sourceStatus", "ACTIVE"),
            parent_source_id=payload.get("parentSourceId"),
            external_url=payload.get("externalUrl"),
            file_format=payload.get("fileFormat"),
            metadata=payload.get("metadata", {}),
            source_created_at=payload.get("sourceCreatedAt"),
            source_updated_at=payload.get("sourceUpdatedAt"),
            source_published_at=payload.get("sourcePublishedAt"),
            change_summary=payload.get("changeSummary")
            or ("Cập nhật tạo phiên bản mới" if is_update else "Tự động lưu khi tạo mới"),
            notes=payload.get("notes"),
            create_new_version_if_exists=True,
        )

        conn.execute(
            """
            UPDATE storage_archive_events
            SET status = 'COMPLETED', item_id = ?, version_number = ?, last_error = NULL,
                processed_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (item_id, ver_num, ts, ts, event_id),
        )
        append_audit_log(
            conn,
            event_code="CREATE_VERSION" if not is_new else "AUTO_ARCHIVE",
            action_label=f"Tự động lưu {item_type} ({event_type}) -> v{ver_num}",
            actor_id=payload.get("editorId") or payload.get("authorId") or "SYSTEM",
            actor_name=payload.get("editorName") or payload.get("authorName") or "Hệ thống tự động",
            actor_role="SYSTEM",
            target_item_id=item_id,
            target_type=item_type,
            target_label=payload.get("title") or source_id,
            status="SUCCESS",
            details={"eventId": event_id, "sourceId": source_id, "versionNumber": ver_num},
        )
        return True, None
    except Exception as exc:
        err_msg = str(exc)
        retry_count = int(event_row.get("retry_count", 0)) + 1
        conn.execute(
            """
            UPDATE storage_archive_events
            SET status = 'FAILED', retry_count = ?, last_error = ?, updated_at = ?
            WHERE id = ?
            """,
            (retry_count, err_msg, ts, event_id),
        )
        return False, err_msg


def run_initial_import_job(
    conn: sqlite3.Connection,
    triggered_by_id: str,
    triggered_by_name: str,
    source_records: Optional[Dict[str, List[Dict[str, Any]]]] = None,
    resume_job_id: Optional[str] = None,
    simulate_fail_source_ids: Optional[List[str]] = None,
) -> Dict[str, Any]:
    """
    Execute or resume initial legacy data import in batches with checkpointing and deduplication (Phần VI).
    Only imports real records from source DB or provided source_records payload.
    Never fabricates fake version history.
    """
    ts = now_iso()
    fail_set = set(simulate_fail_source_ids or [])

    if resume_job_id:
        job_row = conn.execute("SELECT * FROM storage_import_jobs WHERE id = ?", (resume_job_id,)).fetchone()
        if not job_row:
            raise ValueError("Không tìm thấy tác vụ nhập dữ liệu để tiếp tục.")
        job = dict(job_row)
        job_id = job["id"]
        batch_code = job["batch_code"]
        conn.execute(
            "UPDATE storage_import_jobs SET status = 'RESUMING', updated_at = ? WHERE id = ?",
            (ts, job_id),
        )
    else:
        # Check if already running
        running = conn.execute(
            "SELECT * FROM storage_import_jobs WHERE status IN ('PREPARING', 'IMPORTING', 'RESUMING') ORDER BY started_at DESC LIMIT 1"
        ).fetchone()
        if running:
            return dict(running)

        job_id = f"imp-{uuid.uuid4().hex[:12]}"
        batch_code = f"BATCH-{datetime.datetime.now(datetime.timezone.utc).strftime('%Y%m%d-%H%M%S')}-{uuid.uuid4().hex[:4].upper()}"
        conn.execute(
            """
            INSERT INTO storage_import_jobs (
                id, batch_code, triggered_by_id, triggered_by_name, status,
                started_at, updated_at
            ) VALUES (?, ?, ?, ?, 'PREPARING', ?, ?)
            """,
            (job_id, batch_code, triggered_by_id, triggered_by_name, ts, ts),
        )
        for et in ("DOCUMENT", "COMMUNITY_POST", "COMMUNITY_COMMENT"):
            conn.execute(
                """
                INSERT OR IGNORE INTO storage_import_checkpoints (id, job_id, entity_type, last_source_id, processed_count, status, updated_at)
                VALUES (?, ?, ?, NULL, 0, 'PENDING', ?)
                """,
                (f"chk-{job_id}-{et.lower()}", job_id, et, ts),
            )
        conn.commit()

    # Load records from source_records payload or directly from SOURCE_APP_DB_PATH if it exists
    docs: List[Dict[str, Any]] = []
    posts: List[Dict[str, Any]] = []
    comments: List[Dict[str, Any]] = []

    if source_records is not None:
        docs = source_records.get("documents", [])
        posts = source_records.get("posts", [])
        comments = source_records.get("comments", [])
    elif SOURCE_APP_DB_PATH.exists():
        src_conn = sqlite3.connect(str(SOURCE_APP_DB_PATH))
        src_conn.row_factory = sqlite3.Row
        try:
            doc_rows = src_conn.execute(
                """
                SELECT d.*, c.name AS category_name, c.slug AS category_slug
                FROM Document d
                LEFT JOIN DocumentCategory c ON d.categoryId = c.id
                ORDER BY d.id ASC
                """
            ).fetchall()
            for r in doc_rows:
                rd = dict(r)
                docs.append(
                    {
                        "id": rd["id"],
                        "title": rd["title"],
                        "content": f"{rd.get('description', '')}\n\n{rd.get('previewContent', '')}".strip(),
                        "authorId": "SYSTEM_SEED",
                        "authorName": "Ban biên tập WORD BRIDGE",
                        "externalUrl": rd.get("externalUrl"),
                        "fileFormat": rd.get("fileType", "PDF"),
                        "createdAt": rd.get("createdAt"),
                        "metadata": {
                            "slug": rd.get("slug"),
                            "categoryName": rd.get("category_name"),
                            "level": rd.get("level"),
                            "pageCount": rd.get("pageCount"),
                            "fileSizeLabel": rd.get("fileSizeLabel"),
                            "isFree": bool(rd.get("isFree")),
                            "tagsJson": rd.get("tagsJson"),
                        },
                    }
                )

            post_rows = src_conn.execute(
                """
                SELECT p.*, u.name AS user_name, u.email AS user_email
                FROM CommunityPost p
                LEFT JOIN User u ON p.userId = u.id
                ORDER BY p.id ASC
                """
            ).fetchall()
            for r in post_rows:
                rd = dict(r)
                posts.append(
                    {
                        "id": rd["id"],
                        "title": rd.get("title"),
                        "content": rd.get("content", ""),
                        "authorId": rd.get("userId"),
                        "authorName": rd.get("user_name") or "Thành viên",
                        "authorEmail": rd.get("user_email"),
                        "createdAt": rd.get("createdAt"),
                        "updatedAt": rd.get("updatedAt"),
                        "metadata": {
                            "group": rd.get("group"),
                            "authorBadge": rd.get("authorBadge"),
                            "isPinned": bool(rd.get("isPinned")),
                            "pollJson": rd.get("pollJson"),
                        },
                    }
                )

            comment_rows = src_conn.execute(
                """
                SELECT c.*, u.name AS user_name, u.email AS user_email
                FROM CommunityComment c
                LEFT JOIN User u ON c.userId = u.id
                ORDER BY c.id ASC
                """
            ).fetchall()
            for r in comment_rows:
                rd = dict(r)
                comments.append(
                    {
                        "id": rd["id"],
                        "postId": rd.get("postId"),
                        "content": rd.get("content", ""),
                        "authorId": rd.get("userId"),
                        "authorName": rd.get("user_name") or "Thành viên",
                        "authorEmail": rd.get("user_email"),
                        "createdAt": rd.get("createdAt"),
                        "metadata": {"postId": rd.get("postId")},
                    }
                )
        finally:
            src_conn.close()

    total_discovered = len(docs) + len(posts) + len(comments)
    conn.execute(
        "UPDATE storage_import_jobs SET status = 'IMPORTING', total_discovered = ?, updated_at = ? WHERE id = ?",
        (total_discovered, now_iso(), job_id),
    )
    conn.commit()

    cur_job = dict(conn.execute("SELECT * FROM storage_import_jobs WHERE id = ?", (job_id,)).fetchone())
    processed = int(cur_job["processed_count"])
    success_cnt = int(cur_job["success_count"])
    skipped_cnt = int(cur_job["skipped_duplicate_count"])
    errors_list: List[Dict[str, Any]] = []

    batches = [
        ("DOCUMENT", docs),
        ("COMMUNITY_POST", posts),
        ("COMMUNITY_COMMENT", comments),
    ]

    for entity_type, records in batches:
        chk_row = conn.execute(
            "SELECT * FROM storage_import_checkpoints WHERE job_id = ? AND entity_type = ?",
            (job_id, entity_type),
        ).fetchone()
        last_source_id = chk_row["last_source_id"] if chk_row else None
        entity_processed = int(chk_row["processed_count"]) if chk_row else 0

        conn.execute(
            "UPDATE storage_import_checkpoints SET status = 'IMPORTING', updated_at = ? WHERE job_id = ? AND entity_type = ?",
            (now_iso(), job_id, entity_type),
        )

        for rec in records:
            src_id = str(rec["id"])
            if src_id in fail_set:
                errors_list.append(
                    {
                        "entityType": entity_type,
                        "sourceId": src_id,
                        "title": rec.get("title") or src_id,
                        "error": "Lỗi giả lập gián đoạn khi nhập bản ghi để kiểm thử retry.",
                        "timestamp": now_iso(),
                    }
                )
                continue

            # Check duplicate by (item_type, source_id)
            dup = conn.execute(
                "SELECT id FROM storage_items WHERE item_type = ? AND source_id = ?",
                (entity_type, src_id),
            ).fetchone()
            if dup:
                skipped_cnt += 1
                processed += 1
                entity_processed += 1
                last_source_id = src_id
                continue

            try:
                upsert_archive_item_internal(
                    conn=conn,
                    item_type=entity_type,
                    source_id=src_id,
                    title=rec.get("title") or (f"Bình luận #{src_id[:8]}" if entity_type == "COMMUNITY_COMMENT" else src_id),
                    content=rec.get("content", ""),
                    author_id=rec.get("authorId"),
                    author_name=rec.get("authorName"),
                    author_email=rec.get("authorEmail"),
                    creator_id=rec.get("creatorId") or rec.get("authorId"),
                    creator_name=rec.get("creatorName") or rec.get("authorName"),
                    editor_id=rec.get("editorId"),
                    editor_name=rec.get("editorName"),
                    owner_id=rec.get("authorId"),
                    source_status="ACTIVE",
                    parent_source_id=rec.get("postId"),
                    external_url=rec.get("externalUrl"),
                    file_format=rec.get("fileFormat"),
                    metadata=rec.get("metadata", {}),
                    source_created_at=str(rec.get("createdAt") or ts),
                    source_updated_at=str(rec.get("updatedAt") or rec.get("createdAt") or ts),
                    source_published_at=str(rec.get("createdAt") or ts),
                    imported_batch_code=batch_code,
                    change_summary=f"Nhập dữ liệu cũ lần đầu (Lô {batch_code})",
                    notes="Trạng thái hiện tại từ cơ sở dữ liệu nguồn (không tự dựng lịch sử phiên bản giả)",
                    create_new_version_if_exists=False,
                )
                success_cnt += 1
                processed += 1
                entity_processed += 1
                last_source_id = src_id

                # Save checkpoint after each record in batch
                conn.execute(
                    """
                    UPDATE storage_import_checkpoints
                    SET last_source_id = ?, processed_count = ?, updated_at = ?
                    WHERE job_id = ? AND entity_type = ?
                    """,
                    (last_source_id, entity_processed, now_iso(), job_id, entity_type),
                )
            except Exception as exc:
                errors_list.append(
                    {
                        "entityType": entity_type,
                        "sourceId": src_id,
                        "title": rec.get("title") or src_id,
                        "error": str(exc),
                        "timestamp": now_iso(),
                    }
                )

        conn.execute(
            """
            UPDATE storage_import_checkpoints
            SET status = 'COMPLETED', updated_at = ?
            WHERE job_id = ? AND entity_type = ?
            """,
            (now_iso(), job_id, entity_type),
        )
        conn.commit()

    failed_cnt = len(errors_list)
    final_status = "COMPLETED" if failed_cnt == 0 else "COMPLETED_WITH_ERRORS"
    done_ts = now_iso()

    conn.execute(
        """
        UPDATE storage_import_jobs
        SET status = ?, processed_count = ?, success_count = ?,
            skipped_duplicate_count = ?, failed_count = ?, errors_json = ?,
            completed_at = ?, updated_at = ?
        WHERE id = ?
        """,
        (
            final_status,
            processed,
            success_cnt,
            skipped_cnt,
            failed_cnt,
            json.dumps(errors_list, ensure_ascii=False),
            done_ts,
            done_ts,
            job_id,
        ),
    )

    set_initial_import_state(
        conn,
        {
            "hasCompletedInitialImport": failed_cnt == 0,
            "lastJobId": job_id,
            "lastBatchCode": batch_code,
            "status": final_status,
            "updatedAt": done_ts,
        },
    )

    append_audit_log(
        conn,
        event_code="INITIAL_DATA_IMPORT",
        action_label=f"Nhập dữ liệu cũ lô {batch_code} ({final_status})",
        actor_id=triggered_by_id,
        actor_name=triggered_by_name,
        actor_role="ADMIN",
        target_item_id=job_id,
        target_type="IMPORT_JOB",
        target_label=batch_code,
        status="SUCCESS" if failed_cnt == 0 else "PARTIAL_ERROR",
        error_reason=f"{failed_cnt} bản ghi lỗi" if failed_cnt > 0 else None,
        details={
            "totalDiscovered": total_discovered,
            "successCount": success_cnt,
            "skippedDuplicateCount": skipped_cnt,
            "failedCount": failed_cnt,
        },
    )
    conn.commit()
    return dict(conn.execute("SELECT * FROM storage_import_jobs WHERE id = ?", (job_id,)).fetchone())


def upload_file_blob_internal(
    conn: sqlite3.Connection,
    account_id: str,
    account_name: str,
    account_email: str,
    file_name: str,
    blob_bytes: bytes,
    mime_type: str = "application/octet-stream",
    logical_path: Optional[str] = None,
    notes: Optional[str] = None,
    session_id: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Validate and store a file into SQLite BLOB storage (Phần VII.1, VII.2, VIII.2, XII.4, XII.5).
    - Enforces max 15 MB per file in backend (cannot be bypassed by spoofing headers).
    - Never executes uploaded files.
    - Detects sensitive configuration files (.env, private keys, tokens) and quarantines/warns.
    - If re-uploading a file with the same logical path or filename, creates a new version without overwriting old BLOBs.
    - Verifies size and SHA-256 checksum after writing to SQLite BLOB table.
    """
    actual_size = len(blob_bytes)
    if actual_size == 0:
        raise ValueError("Không thể tải lên tệp rỗng (0 byte).")
    if actual_size > MAX_FILE_SIZE_BYTES:
        raise ValueError(
            f"Dung lượng tệp ({actual_size} bytes) vượt quá giới hạn tối đa 15 MB ({MAX_FILE_SIZE_BYTES} bytes) cho mỗi tệp."
        )

    clean_name = os.path.basename(file_name.strip()) or f"file-{int(time.time())}.bin"
    _, ext = os.path.splitext(clean_name)
    ext_lower = ext.lower() if ext else ".bin"

    checksum = compute_sha256(blob_bytes)
    is_sens, sens_reason = is_sensitive_file(clean_name, blob_bytes)

    storage_loc = logical_path.strip() if logical_path and logical_path.strip() else f"/vault/files/{clean_name}"
    ts = now_iso()

    # Check if an item already exists at the same logical source_id / storage_path
    source_key = f"FILE:{storage_loc}"
    existing_item = conn.execute(
        "SELECT * FROM storage_items WHERE item_type = 'UPLOADED_FILE' AND source_id = ?",
        (source_key,),
    ).fetchone()

    file_id = f"file-{uuid.uuid4().hex[:16]}"
    item_id = dict(existing_item)["id"] if existing_item else f"item-{uuid.uuid4().hex[:16]}"
    next_ver = (int(dict(existing_item)["current_version"]) + 1) if existing_item else 1

    # Extract safe text preview if it's a text-previewable file and not binary
    preview_str = ""
    if ext_lower in TEXT_PREVIEWABLE_EXTENSIONS or clean_name.endswith("schema.prisma"):
        try:
            preview_str = blob_bytes[:32768].decode("utf-8", errors="replace")
        except Exception:
            preview_str = ""

    # 1. Insert file metadata & BLOB inside transaction
    conn.execute(
        """
        INSERT INTO storage_files (
            id, item_id, version_number, file_name, file_ext, mime_type,
            size_bytes, checksum_sha256, uploader_id, uploader_name, uploader_email,
            storage_location, is_quarantined, quarantine_reason, status, notes, uploaded_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            file_id,
            item_id,
            next_ver,
            clean_name,
            ext_lower.lstrip(".").upper() or "BIN",
            mime_type,
            actual_size,
            checksum,
            account_id,
            account_name,
            account_email,
            storage_loc,
            1 if is_sens else 0,
            sens_reason if is_sens else None,
            "QUARANTINED" if is_sens else "ACTIVE",
            notes,
            ts,
        ),
    )

    conn.execute(
        """
        INSERT INTO storage_file_blobs (file_id, blob_data, size_bytes, checksum_sha256, created_at)
        VALUES (?, ?, ?, ?, ?)
        """,
        (file_id, sqlite3.Binary(blob_bytes), actual_size, checksum, ts),
    )

    # 2. Verify physical BLOB written in SQLite (Phần VII.1 & XII.5)
    verify_row = conn.execute(
        "SELECT length(blob_data) AS stored_len, blob_data FROM storage_file_blobs WHERE file_id = ?",
        (file_id,),
    ).fetchone()
    if not verify_row or int(verify_row["stored_len"]) != actual_size:
        raise RuntimeError("Lỗi xác minh dung lượng BLOB sau khi ghi vào SQLite.")
    stored_checksum = compute_sha256(bytes(verify_row["blob_data"]))
    if stored_checksum != checksum:
        raise RuntimeError("Lỗi xác minh mã kiểm tra SHA-256 sau khi ghi BLOB vào SQLite.")

    meta_dict = {
        "fileName": clean_name,
        "fileExt": ext_lower.lstrip(".").upper() or "BIN",
        "mimeType": mime_type,
        "sizeBytes": actual_size,
        "checksumSha256": checksum,
        "isQuarantined": is_sens,
        "quarantineReason": sens_reason if is_sens else None,
    }

    item_status = "QUARANTINED" if is_sens else "ACTIVE"
    if not existing_item:
        conn.execute(
            """
            INSERT INTO storage_items (
                id, item_type, source_id, title, content, preview_text,
                author_id, author_name, author_email, creator_id, creator_name,
                owner_id, source_status, storage_status, is_quarantined, quarantine_reason,
                file_id, file_format, file_size_bytes, checksum_sha256,
                current_version, storage_path, notes, metadata_json,
                source_created_at, source_updated_at, archived_at, updated_at
            ) VALUES (?, 'UPLOADED_FILE', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?, ?, ?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
            """,
            (
                item_id,
                source_key,
                clean_name,
                preview_str,
                preview_str[:500],
                account_id,
                account_name,
                account_email,
                account_id,
                account_name,
                account_id,
                item_status,
                1 if is_sens else 0,
                sens_reason if is_sens else None,
                file_id,
                ext_lower.lstrip(".").upper() or "BIN",
                actual_size,
                checksum,
                storage_loc,
                notes,
                json.dumps(meta_dict, ensure_ascii=False),
                ts,
                ts,
                ts,
                ts,
            ),
        )
    else:
        conn.execute(
            """
            UPDATE storage_items
            SET title = ?, content = ?, preview_text = ?,
                editor_id = ?, editor_name = ?, storage_status = ?,
                is_quarantined = ?, quarantine_reason = ?,
                file_id = ?, file_format = ?, file_size_bytes = ?,
                checksum_sha256 = ?, current_version = ?,
                notes = COALESCE(?, notes), metadata_json = ?,
                source_updated_at = ?, updated_at = ?
            WHERE id = ?
            """,
            (
                clean_name,
                preview_str,
                preview_str[:500],
                account_id,
                account_name,
                item_status,
                1 if is_sens else 0,
                sens_reason if is_sens else None,
                file_id,
                ext_lower.lstrip(".").upper() or "BIN",
                actual_size,
                checksum,
                next_ver,
                notes,
                json.dumps(meta_dict, ensure_ascii=False),
                ts,
                ts,
                item_id,
            ),
        )

    ver_id = f"ver-{uuid.uuid4().hex[:16]}"
    conn.execute(
        """
        INSERT INTO storage_versions (
            id, item_id, version_number, title, content, file_id,
            file_size_bytes, checksum_sha256, actor_id, actor_name, actor_email,
            change_summary, notes, status, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """,
        (
            ver_id,
            item_id,
            next_ver,
            clean_name,
            preview_str,
            file_id,
            actual_size,
            checksum,
            account_id,
            account_name,
            account_email,
            f"Tải tệp lên kho (Phiên bản #{next_ver})" if next_ver > 1 else "Tải tệp mới lên kho",
            notes,
            item_status,
            json.dumps(meta_dict, ensure_ascii=False),
            ts,
        ),
    )

    if session_id:
        conn.execute(
            """
            UPDATE storage_upload_sessions
            SET received_size_bytes = ?, actual_checksum = ?, status = 'COMPLETED',
                item_id = ?, file_id = ?, updated_at = ?
            WHERE id = ?
            """,
            (actual_size, checksum, item_id, file_id, ts, session_id),
        )

    append_audit_log(
        conn,
        event_code="FILE_UPLOAD",
        action_label=f"Tải tệp '{clean_name}' ({actual_size} bytes) -> Phiên bản #{next_ver}",
        actor_id=account_id,
        actor_email=account_email,
        actor_name=account_name,
        actor_role="ADMIN",
        target_item_id=item_id,
        target_type="UPLOADED_FILE",
        target_label=clean_name,
        status="SUCCESS",
        details={
            "fileId": file_id,
            "sizeBytes": actual_size,
            "checksumSha256": checksum,
            "versionNumber": next_ver,
            "isQuarantined": is_sens,
            "quarantineReason": sens_reason if is_sens else None,
        },
    )
    conn.commit()
    return {
        "itemId": item_id,
        "fileId": file_id,
        "fileName": clean_name,
        "fileExt": ext_lower.lstrip(".").upper() or "BIN",
        "sizeBytes": actual_size,
        "checksumSha256": checksum,
        "versionNumber": next_ver,
        "storageLocation": storage_loc,
        "isQuarantined": is_sens,
        "quarantineReason": sens_reason if is_sens else None,
        "status": item_status,
        "uploadedAt": ts,
    }


def restore_item_version_internal(
    conn: sqlite3.Connection,
    item_id: str,
    target_version_number: int,
    actor_id: str,
    actor_name: str,
    actor_email: Optional[str] = None,
    notes: Optional[str] = None,
) -> Dict[str, Any]:
    """
    Restore an older version of a document, post, or uploaded file to become the new current version (Phần VIII.2, VIII.3).
    Never overwrites version history. Never overwrites live website DB automatically.
    """
    item_row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
    if not item_row:
        raise ValueError("Không tìm thấy mục dữ liệu trong kho.")
    item = dict(item_row)

    ver_row = conn.execute(
        "SELECT * FROM storage_versions WHERE item_id = ? AND version_number = ?",
        (item_id, target_version_number),
    ).fetchone()
    if not ver_row:
        raise ValueError(f"Không tìm thấy phiên bản #{target_version_number} của mục này.")
    ver = dict(ver_row)

    next_ver = int(item["current_version"]) + 1
    ts = now_iso()

    conn.execute(
        """
        UPDATE storage_items
        SET title = ?, content = ?, preview_text = ?,
            file_id = ?, file_size_bytes = ?, checksum_sha256 = ?,
            current_version = ?, editor_id = ?, editor_name = ?,
            storage_status = CASE WHEN storage_status = 'TRASHED' THEN 'ACTIVE' ELSE storage_status END,
            updated_at = ?
        WHERE id = ?
        """,
        (
            ver["title"],
            ver["content"],
            (ver["content"] or "")[:500],
            ver["file_id"],
            ver["file_size_bytes"],
            ver["checksum_sha256"],
            next_ver,
            actor_id,
            actor_name,
            ts,
            item_id,
        ),
    )

    new_ver_id = f"ver-{uuid.uuid4().hex[:16]}"
    summary = f"Khôi phục từ phiên bản #{target_version_number} thành phiên bản hiện tại mới (#{next_ver})"
    conn.execute(
        """
        INSERT INTO storage_versions (
            id, item_id, version_number, title, content, file_id,
            file_size_bytes, checksum_sha256, actor_id, actor_name, actor_email,
            change_summary, notes, status, metadata_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)
        """,
        (
            new_ver_id,
            item_id,
            next_ver,
            ver["title"],
            ver["content"],
            ver["file_id"],
            ver["file_size_bytes"],
            ver["checksum_sha256"],
            actor_id,
            actor_name,
            actor_email,
            summary,
            notes or f"Khôi phục an toàn trong kho (không tự động ghi đè dữ liệu gốc trên website)",
            ver["metadata_json"],
            ts,
        ),
    )

    append_audit_log(
        conn,
        event_code="RESTORE_VERSION",
        action_label=f"Khôi phục '{item.get('title') or item_id}' từ v{target_version_number} -> v{next_ver}",
        actor_id=actor_id,
        actor_email=actor_email,
        actor_name=actor_name,
        actor_role="ADMIN",
        target_item_id=item_id,
        target_type=item["item_type"],
        target_label=item.get("title") or item_id,
        status="SUCCESS",
        details={
            "restoredFromVersion": target_version_number,
            "newVersionNumber": next_ver,
            "checksumSha256": ver["checksum_sha256"],
        },
    )
    conn.commit()
    return {
        "itemId": item_id,
        "restoredFromVersion": target_version_number,
        "newVersionNumber": next_ver,
        "checksumSha256": ver["checksum_sha256"],
        "syncToWebsiteNotice": "Bản ghi trong kho đã được khôi phục thành phiên bản mới. Dữ liệu gốc trên website không bị tự động ghi đè.",
    }


def move_to_trash_internal(
    conn: sqlite3.Connection,
    item_ids: List[str],
    actor_id: str,
    actor_name: str,
    actor_email: Optional[str] = None,
    reason: Optional[str] = None,
) -> Dict[str, Any]:
    """Soft-delete items to Trash first (Phần IX.1)."""
    ts = now_iso()
    moved = []
    for item_id in item_ids:
        row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            continue
        item = dict(row)
        if item["storage_status"] == "TRASHED":
            continue

        conn.execute(
            "UPDATE storage_items SET storage_status = 'TRASHED', updated_at = ? WHERE id = ?",
            (ts, item_id),
        )
        conn.execute(
            """
            INSERT OR REPLACE INTO storage_trash (
                id, item_id, item_type, title, deleted_by_id, deleted_by_name,
                deleted_at, reason, related_version, restore_status, snapshot_json
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'IN_TRASH', ?)
            """,
            (
                f"trash-{uuid.uuid4().hex[:14]}",
                item_id,
                item["item_type"],
                item["title"],
                actor_id,
                actor_name,
                ts,
                reason or "Đưa vào thùng rác từ giao diện quản trị kho",
                item["current_version"],
                json.dumps(
                    {
                        "previousStatus": item["storage_status"],
                        "checksumSha256": item["checksum_sha256"],
                        "sourceId": item["source_id"],
                    },
                    ensure_ascii=False,
                ),
            ),
        )
        append_audit_log(
            conn,
            event_code="MOVE_TO_TRASH",
            action_label=f"Đưa '{item.get('title') or item_id}' vào thùng rác",
            actor_id=actor_id,
            actor_email=actor_email,
            actor_name=actor_name,
            actor_role="ADMIN",
            target_item_id=item_id,
            target_type=item["item_type"],
            target_label=item.get("title") or item_id,
            status="SUCCESS",
            details={"reason": reason, "version": item["current_version"]},
        )
        moved.append(item_id)
    conn.commit()
    return {"movedCount": len(moved), "itemIds": moved}


def restore_from_trash_internal(
    conn: sqlite3.Connection,
    item_ids: List[str],
    actor_id: str,
    actor_name: str,
    actor_email: Optional[str] = None,
) -> Dict[str, Any]:
    """Restore one or multiple items from Trash preserving ID, checksum, and source info (Phần IX.2)."""
    ts = now_iso()
    restored = []
    for item_id in item_ids:
        row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            continue
        item = dict(row)
        trash_row = conn.execute("SELECT * FROM storage_trash WHERE item_id = ?", (item_id,)).fetchone()
        prev_status = "QUARANTINED" if item.get("is_quarantined") else "ACTIVE"
        if trash_row:
            try:
                snap = json.loads(trash_row["snapshot_json"] or "{}")
                if snap.get("previousStatus") in ("ACTIVE", "QUARANTINED"):
                    prev_status = snap["previousStatus"]
            except Exception:
                pass

        conn.execute(
            "UPDATE storage_items SET storage_status = ?, updated_at = ? WHERE id = ?",
            (prev_status, ts, item_id),
        )
        conn.execute(
            "UPDATE storage_trash SET restore_status = 'RESTORED', restored_at = ? WHERE item_id = ?",
            (ts, item_id),
        )
        append_audit_log(
            conn,
            event_code="RESTORE_FROM_TRASH",
            action_label=f"Khôi phục '{item.get('title') or item_id}' từ thùng rác",
            actor_id=actor_id,
            actor_email=actor_email,
            actor_name=actor_name,
            actor_role="ADMIN",
            target_item_id=item_id,
            target_type=item["item_type"],
            target_label=item.get("title") or item_id,
            status="SUCCESS",
            details={"checksumSha256": item["checksum_sha256"], "sourceId": item["source_id"]},
        )
        restored.append(item_id)
    conn.commit()
    return {"restoredCount": len(restored), "itemIds": restored}


def permanent_delete_internal(
    conn: sqlite3.Connection,
    item_ids: List[str],
    actor_id: str,
    actor_name: str,
    actor_email: Optional[str] = None,
    confirmation_phrase: str = "",
) -> Dict[str, Any]:
    """
    Permanent deletion from Trash (Phần IX.3):
    - Requires multi-step confirmation ('XOA VINH VIEN').
    - Cleans up associated storage_files and storage_file_blobs so zero orphan BLOBs remain.
    - Does not delete linked items belonging to other posts/discussions.
    """
    if confirmation_phrase.strip().upper() != "XOA VINH VIEN":
        raise ValueError("Vui lòng nhập chính xác cụm từ xác nhận 'XOA VINH VIEN' để xóa vĩnh viễn.")

    ts = now_iso()
    deleted_ids = []
    freed_bytes = 0

    for item_id in item_ids:
        row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
        if not row:
            continue
        item = dict(row)
        if item["storage_status"] != "TRASHED":
            raise ValueError(
                f"Mục '{item.get('title') or item_id}' chưa nằm trong thùng rác. Phải đưa vào thùng rác trước khi xóa vĩnh viễn."
            )

        # Find all files associated with this item and delete their BLOBs cleanly
        files = conn.execute("SELECT id, size_bytes FROM storage_files WHERE item_id = ?", (item_id,)).fetchall()
        for f in files:
            freed_bytes += int(f["size_bytes"] or 0)
            conn.execute("DELETE FROM storage_file_blobs WHERE file_id = ?", (f["id"],))
        conn.execute("DELETE FROM storage_files WHERE item_id = ?", (item_id,))
        conn.execute("DELETE FROM storage_versions WHERE item_id = ?", (item_id,))
        conn.execute(
            "UPDATE storage_trash SET restore_status = 'PERMANENTLY_DELETED', restored_at = ? WHERE item_id = ?",
            (ts, item_id),
        )
        conn.execute("DELETE FROM storage_items WHERE id = ?", (item_id,))

        append_audit_log(
            conn,
            event_code="PERMANENT_DELETE",
            action_label=f"Xóa vĩnh viễn '{item.get('title') or item_id}' khỏi kho lưu trữ",
            actor_id=actor_id,
            actor_email=actor_email,
            actor_name=actor_name,
            actor_role="ADMIN",
            target_item_id=item_id,
            target_type=item["item_type"],
            target_label=item.get("title") or item_id,
            status="SUCCESS",
            details={"freedBytes": freed_bytes},
        )
        deleted_ids.append(item_id)

    # Extra safety check: remove any orphaned BLOBs not referenced in storage_files
    conn.execute(
        "DELETE FROM storage_file_blobs WHERE file_id NOT IN (SELECT id FROM storage_files)"
    )
    conn.commit()
    return {"deletedCount": len(deleted_ids), "deletedIds": deleted_ids, "freedBytes": freed_bytes}


def handle_account_deletion_internal(
    conn: sqlite3.Connection,
    deleted_account_id: str,
    deleted_account_email: str,
    triggered_by_id: str,
    triggered_by_name: str,
    permanent_purge_private: bool = False,
) -> Dict[str, Any]:
    """
    Handle storage items when a WORD BRIDGE account is deleted (Phần XI):
    1. Identify all related data: created, owned, edited, uploaded files, versions, audit logs.
    2. Classify by ownership:
       - Private owned files/items exclusively owned by the account without public discussion children -> move to Trash (or purge if approved).
       - Shared/public community posts that have comments from OTHER users -> preserve discussion integrity, anonymize author display to 'Tài khoản đã xóa' while keeping other users' comments intact.
       - Items where user was only an editor or participant -> keep intact, anonymize editor label.
       - Security audit logs -> preserved per retention policy, email anonymized to SHA-256 hash.
    3. Never use uncontrolled cascade delete.
    """
    ts = now_iso()
    email_hash = hashlib.sha256((deleted_account_email or deleted_account_id).lower().encode("utf-8")).hexdigest()

    owned_rows = conn.execute(
        """
        SELECT * FROM storage_items
        WHERE owner_id = ? OR author_id = ? OR creator_id = ?
        """,
        (deleted_account_id, deleted_account_id, deleted_account_id),
    ).fetchall()

    owned_count = len(owned_rows)
    trashed_count = 0
    anonymized_public_count = 0
    preserved_shared_count = 0
    freed_bytes = 0

    for r in owned_rows:
        item = dict(r)
        item_id = item["id"]
        item_type = item["item_type"]

        # Check if this is a public community post that has comments from OTHER users
        has_other_users_comments = False
        if item_type == "COMMUNITY_POST" and item.get("source_id"):
            other_c = conn.execute(
                """
                SELECT COUNT(*) AS cnt FROM storage_items
                WHERE item_type = 'COMMUNITY_COMMENT'
                  AND parent_source_id = ?
                  AND COALESCE(author_id, '') != ?
                  AND storage_status = 'ACTIVE'
                """,
                (item["source_id"], deleted_account_id),
            ).fetchone()
            if other_c and int(other_c["cnt"]) > 0:
                has_other_users_comments = True

        # System documents are preserved as system assets, only anonymize creator reference
        if item_type == "DOCUMENT":
            conn.execute(
                """
                UPDATE storage_items
                SET author_name = 'Tài khoản đã xóa (Bảo lưu học liệu)',
                    author_email = NULL,
                    updated_at = ?
                WHERE id = ?
                """,
                (ts, item_id),
            )
            preserved_shared_count += 1
            continue

        if has_other_users_comments:
            # Preserve shared discussion so other users' comments are not lost (Phần XI.2)
            conn.execute(
                """
                UPDATE storage_items
                SET author_name = 'Thành viên đã xóa tài khoản',
                    author_email = NULL,
                    creator_name = 'Thành viên đã xóa tài khoản',
                    notes = COALESCE(notes, '') || ' [Đã ẩn danh chủ tài khoản xóa; giữ nguyên thảo luận chung]',
                    updated_at = ?
                WHERE id = ?
                """,
                (ts, item_id),
            )
            anonymized_public_count += 1
            preserved_shared_count += 1
        else:
            # Private/exclusively owned item -> move to Trash first (or purge if approved)
            move_to_trash_internal(
                conn,
                [item_id],
                actor_id=triggered_by_id,
                actor_name=triggered_by_name,
                reason=f"Xử lý dữ liệu thuộc sở hữu riêng khi xóa tài khoản {deleted_account_id}",
            )
            trashed_count += 1
            if permanent_purge_private:
                res = permanent_delete_internal(
                    conn,
                    [item_id],
                    actor_id=triggered_by_id,
                    actor_name=triggered_by_name,
                    confirmation_phrase="XOA VINH VIEN",
                )
                freed_bytes += int(res.get("freedBytes", 0))

    # Update items only edited by this user (do not delete!)
    conn.execute(
        """
        UPDATE storage_items
        SET editor_name = 'Tài khoản đã xóa', updated_at = ?
        WHERE editor_id = ? AND COALESCE(owner_id, '') != ?
        """,
        (ts, deleted_account_id, deleted_account_id),
    )

    # Anonymize email in audit logs while preserving security log records (Phần XI.2)
    conn.execute(
        """
        UPDATE storage_audit_logs
        SET actor_email = ?, actor_name = 'Tài khoản đã xóa (Ẩn danh)'
        WHERE actor_id = ?
        """,
        (f"sha256:{email_hash[:16]}", deleted_account_id),
    )

    # Revoke any PIN / sessions if the deleted account had admin vault records
    conn.execute(
        "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'ACCOUNT_DELETED' WHERE account_id = ?",
        (ts, deleted_account_id),
    )
    conn.execute("DELETE FROM storage_access_pins WHERE account_id = ?", (deleted_account_id,))

    task_id = f"deltask-{uuid.uuid4().hex[:12]}"
    report = {
        "taskId": task_id,
        "deletedAccountId": deleted_account_id,
        "deletedAccountEmailHash": email_hash,
        "ownedItemsCount": owned_count,
        "trashedItemsCount": trashed_count,
        "anonymizedPublicCount": anonymized_public_count,
        "preservedSharedCount": preserved_shared_count,
        "freedBytes": freed_bytes,
        "permanentPurgeApplied": permanent_purge_private,
        "completedAt": ts,
    }

    conn.execute(
        """
        INSERT INTO storage_account_deletion_tasks (
            id, deleted_account_id, deleted_account_email_hash, triggered_by_id,
            policy_mode, owned_items_count, trashed_items_count,
            anonymized_public_count, preserved_shared_count, freed_bytes,
            status, report_json, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'COMPLETED', ?, ?)
        """,
        (
            task_id,
            deleted_account_id,
            email_hash,
            triggered_by_id,
            "PURGE_PRIVATE_KEEP_SHARED" if permanent_purge_private else "TRASH_PRIVATE_KEEP_SHARED",
            owned_count,
            trashed_count,
            anonymized_public_count,
            preserved_shared_count,
            freed_bytes,
            json.dumps(report, ensure_ascii=False),
            ts,
        ),
    )

    append_audit_log(
        conn,
        event_code="ACCOUNT_DELETION_CLEANUP",
        action_label=f"Xử lý dữ liệu kho khi xóa tài khoản {deleted_account_id}",
        actor_id=triggered_by_id,
        actor_name=triggered_by_name,
        actor_role="ADMIN",
        target_item_id=deleted_account_id,
        target_type="USER_ACCOUNT",
        target_label=f"sha256:{email_hash[:12]}",
        status="SUCCESS",
        details=report,
    )
    conn.commit()
    return report


def create_consistent_backup(
    conn: sqlite3.Connection, actor_id: str, actor_name: str, label: Optional[str] = None
) -> Dict[str, Any]:
    """
    Create a transactionally consistent SQLite backup using sqlite3.Connection.backup API (Phần XII.6, XII.7).
    Never copies a live DB file unsafely during writes.
    """
    ts_slug = datetime.datetime.now(datetime.timezone.utc).strftime("%Y%m%d_%H%M%S")
    backup_id = f"bk_{ts_slug}_{uuid.uuid4().hex[:6]}"
    backup_filename = f"{backup_id}.db"
    backup_path = BACKUP_DIR / backup_filename

    dst_conn = sqlite3.connect(str(backup_path))
    try:
        with dst_conn:
            conn.backup(dst_conn)
        # Verify integrity of backup
        chk = dst_conn.execute("PRAGMA integrity_check;").fetchone()[0]
        if chk != "ok":
            raise RuntimeError(f"Kiểm tra tính toàn vẹn bản sao lưu thất bại: {chk}")
    finally:
        dst_conn.close()

    bk_bytes = backup_path.read_bytes()
    bk_checksum = compute_sha256(bk_bytes)
    bk_size = len(bk_bytes)

    meta = {
        "backupId": backup_id,
        "fileName": backup_filename,
        "sizeBytes": bk_size,
        "checksumSha256": bk_checksum,
        "integrityCheck": "ok",
        "label": label or "Sao lưu nhất quán SQLite BLOB",
        "createdBy": actor_name,
        "createdAt": now_iso(),
    }
    (BACKUP_DIR / f"{backup_id}.json").write_text(json.dumps(meta, ensure_ascii=False, indent=2), encoding="utf-8")

    append_audit_log(
        conn,
        event_code="CREATE_BACKUP",
        action_label=f"Sao lưu nhất quán cơ sở dữ liệu kho ({backup_filename})",
        actor_id=actor_id,
        actor_name=actor_name,
        actor_role="ADMIN",
        target_item_id=backup_id,
        target_type="BACKUP",
        target_label=backup_filename,
        status="SUCCESS",
        details=meta,
    )
    conn.commit()
    return meta


def restore_from_consistent_backup(
    backup_id: str, actor_id: str, actor_name: str
) -> Dict[str, Any]:
    """
    Restore the SQLite BLOB database from a verified consistent backup (Phần XII.3, XII.7).
    """
    clean_id = os.path.basename(backup_id).replace(".db", "")
    backup_path = BACKUP_DIR / f"{clean_id}.db"
    if not backup_path.exists():
        raise ValueError(f"Không tìm thấy tệp sao lưu '{clean_id}.db'.")

    # Verify backup integrity before restoring
    src_conn = sqlite3.connect(str(backup_path))
    try:
        chk = src_conn.execute("PRAGMA integrity_check;").fetchone()[0]
        if chk != "ok":
            raise RuntimeError(f"Bản sao lưu không toàn vẹn: {chk}")
    finally:
        src_conn.close()

    with DB_LOCK:
        src_conn = sqlite3.connect(str(backup_path))
        dst_conn = sqlite3.connect(str(DB_PATH))
        try:
            with dst_conn:
                src_conn.backup(dst_conn)
        finally:
            src_conn.close()
            dst_conn.close()

        conn = get_conn()
        try:
            append_audit_log(
                conn,
                event_code="RESTORE_BACKUP",
                action_label=f"Khôi phục cơ sở dữ liệu kho từ bản sao lưu '{clean_id}.db'",
                actor_id=actor_id,
                actor_name=actor_name,
                actor_role="ADMIN",
                target_item_id=clean_id,
                target_type="BACKUP",
                target_label=f"{clean_id}.db",
                status="SUCCESS",
                details={"backupId": clean_id},
            )
            conn.commit()
        finally:
            conn.close()

    return {
        "restored": True,
        "backupId": clean_id,
        "restoredAt": now_iso(),
        "integrityCheck": "ok",
    }


def get_storage_overview_stats(conn: sqlite3.Connection) -> Dict[str, Any]:
    """
    Compute real storage statistics from the SQLite database and physical disk (Phần III.2.A, III.2.C).
    Never returns fabricated/mock numbers.
    """
    active_counts = conn.execute(
        """
        SELECT item_type, COUNT(*) AS cnt, COALESCE(SUM(file_size_bytes), 0) AS total_bytes
        FROM storage_items
        WHERE storage_status != 'TRASHED'
        GROUP BY item_type
        """
    ).fetchall()

    by_type = {
        "DOCUMENT": 0,
        "COMMUNITY_POST": 0,
        "COMMUNITY_COMMENT": 0,
        "UPLOADED_FILE": 0,
    }
    logical_bytes = 0
    for r in active_counts:
        t = r["item_type"]
        if t in by_type:
            by_type[t] = int(r["cnt"])
        logical_bytes += int(r["total_bytes"] or 0)

    total_items = sum(by_type.values())
    total_versions = int(conn.execute("SELECT COUNT(*) AS cnt FROM storage_versions").fetchone()["cnt"])
    trash_count = int(
        conn.execute("SELECT COUNT(*) AS cnt FROM storage_items WHERE storage_status = 'TRASHED'").fetchone()["cnt"]
    )
    quarantined_count = int(
        conn.execute("SELECT COUNT(*) AS cnt FROM storage_items WHERE is_quarantined = 1 AND storage_status != 'TRASHED'").fetchone()["cnt"]
    )
    blob_stats = conn.execute(
        "SELECT COUNT(*) AS cnt, COALESCE(SUM(size_bytes), 0) AS bytes FROM storage_file_blobs"
    ).fetchone()
    blob_count = int(blob_stats["cnt"])
    blob_bytes = int(blob_stats["bytes"])

    pending_import_jobs = int(
        conn.execute(
            "SELECT COUNT(*) AS cnt FROM storage_import_jobs WHERE status IN ('PREPARING', 'IMPORTING', 'RESUMING')"
        ).fetchone()["cnt"]
    )
    pending_archive_events = int(
        conn.execute(
            "SELECT COUNT(*) AS cnt FROM storage_archive_events WHERE status IN ('PENDING', 'PROCESSING', 'FAILED')"
        ).fetchone()["cnt"]
    )

    # Real physical database and disk metrics
    db_file_size = DB_PATH.stat().st_size if DB_PATH.exists() else 0
    wal_path = Path(f"{DB_PATH}-wal")
    wal_size = wal_path.stat().st_size if wal_path.exists() else 0
    total_db_footprint = db_file_size + wal_size

    disk_usage = shutil.disk_usage(str(STORAGE_DIR))
    free_disk_bytes = disk_usage.free
    total_disk_bytes = disk_usage.total
    used_disk_bytes = disk_usage.used
    disk_used_pct = round((used_disk_bytes / total_disk_bytes) * 100, 2) if total_disk_bytes > 0 else 0.0

    integrity_row = conn.execute("PRAGMA quick_check;").fetchone()
    sqlite_healthy = integrity_row and integrity_row[0] == "ok"

    sys_lock = get_system_lock_state(conn)
    import_state = get_initial_import_state(conn)

    # List existing backups
    backups = []
    for meta_file in sorted(BACKUP_DIR.glob("bk_*.json"), reverse=True):
        try:
            backups.append(json.loads(meta_file.read_text(encoding="utf-8")))
        except Exception:
            pass

    warnings = []
    if free_disk_bytes < 500 * 1024 * 1024:
        warnings.append("Cảnh báo: Dung lượng ổ đĩa vật lý còn trống dưới 500 MB. Cần mở rộng ổ đĩa hoặc phân shard SQLite.")
    if pending_archive_events > 0:
        warnings.append(f"Có {pending_archive_events} sự kiện tự động lưu đang chờ xử lý hoặc cần thử lại.")
    if sys_lock.get("isLocked"):
        warnings.append(f"Kho lưu trữ đang khóa toàn hệ thống: {sys_lock.get('reason') or 'Bảo mật'}.")

    nodes = [dict(r) for r in conn.execute("SELECT * FROM storage_nodes ORDER BY is_primary DESC").fetchall()]

    return {
        "stats": {
            "totalItems": total_items,
            "documentsCount": by_type["DOCUMENT"],
            "communityPostsCount": by_type["COMMUNITY_POST"],
            "communityCommentsCount": by_type["COMMUNITY_COMMENT"],
            "uploadedFilesCount": by_type["UPLOADED_FILE"],
            "totalVersionsCount": total_versions,
            "trashItemsCount": trash_count,
            "quarantinedItemsCount": quarantined_count,
            "blobCount": blob_count,
            "blobBytes": blob_bytes,
            "logicalUsedBytes": logical_bytes + blob_bytes,
            "databaseFileSizeBytes": total_db_footprint,
            "physicalDiskFreeBytes": free_disk_bytes,
            "physicalDiskTotalBytes": total_disk_bytes,
            "physicalDiskUsedBytes": used_disk_bytes,
            "physicalDiskUsedPercent": disk_used_pct,
            "activeOrPendingTasksCount": pending_import_jobs + pending_archive_events,
            "pendingImportJobsCount": pending_import_jobs,
            "pendingArchiveEventsCount": pending_archive_events,
            "maxSingleFileBytes": MAX_FILE_SIZE_BYTES,
        },
        "systemStatus": {
            "vaultState": "LOCKED" if sys_lock.get("isLocked") else "OPEN",
            "systemLock": sys_lock,
            "storageServiceConnected": True,
            "sqliteStatus": "HEALTHY (WAL + Integrity OK)" if sqlite_healthy else "WARNING",
            "autoArchiveState": "ENABLED" if sys_lock.get("autoArchiveEnabled", True) else "PAUSED",
            "initialImportState": import_state,
            "lastBackup": backups[0] if backups else None,
            "backupsCount": len(backups),
            "warnings": warnings,
            "nodes": nodes,
            "architecture": {
                "engine": f"SQLite {sqlite3.sqlite_version} BLOB Engine (WAL Mode)",
                "pinHashAlgorithm": "Argon2id (libargon2) + Unique Salt + Server Pepper",
                "usesCloudflareR2": False,
                "usesCloudflareD1": False,
            },
        },
        "backups": backups[:10],
    }


class StorageHTTPRequestHandler(http.server.BaseHTTPRequestHandler):
    protocol_version = "HTTP/1.1"

    def log_message(self, format: str, *args: Any) -> None:
        # Quiet standard log or log without sensitive query params
        pass

    def _send_json(self, status_code: int, payload: Dict[str, Any]) -> None:
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status_code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(body)

    def _send_error(self, status_code: int, code: str, message: str, extra: Optional[Dict[str, Any]] = None) -> None:
        err_obj: Dict[str, Any] = {"code": code, "message": message}
        if extra:
            err_obj.update(extra)
        self._send_json(status_code, {"success": False, "error": err_obj})

    def _send_ok(self, data: Dict[str, Any], status_code: int = 200) -> None:
        self._send_json(status_code, {"success": True, "data": data})

    def _verify_service_token(self) -> bool:
        token = self.headers.get("X-Storage-Service-Token", "")
        return hmac.compare_digest(token, SERVICE_TOKEN)

    def _read_json_body(self, max_bytes: int = 25 * 1024 * 1024) -> Dict[str, Any]:
        length = int(self.headers.get("Content-Length", "0"))
        if length > max_bytes:
            raise ValueError(f"Payload vượt quá giới hạn cho phép ({max_bytes} bytes).")
        if length == 0:
            return {}
        raw = self.rfile.read(length)
        return json.loads(raw.decode("utf-8"))

    def _actor_context(self, body: Optional[Dict[str, Any]] = None) -> Dict[str, str]:
        b = body or {}
        return {
            "accountId": str(b.get("accountId") or self.headers.get("X-Actor-Id") or "").strip(),
            "email": str(b.get("email") or self.headers.get("X-Actor-Email") or "").strip(),
            "name": urllib.parse.unquote(str(b.get("name") or self.headers.get("X-Actor-Name") or "Admin").strip()),
            "role": str(b.get("role") or self.headers.get("X-Actor-Role") or "USER").strip(),
            "vaultToken": str(b.get("vaultToken") or self.headers.get("X-Vault-Session") or "").strip(),
            "ip": str(b.get("ip") or self.headers.get("X-Forwarded-For") or self.client_address[0] or "127.0.0.1"),
            "ua": str(b.get("userAgent") or self.headers.get("User-Agent") or "WordBridge-Worker"),
        }

    def do_GET(self) -> None:
        if not self._verify_service_token():
            self._send_error(401, "INVALID_SERVICE_TOKEN", "Từ chối kết nối trực tiếp: Thiếu hoặc sai khóa xác thực Worker -> Storage Service.")
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path
        qs = urllib.parse.parse_qs(parsed.query)
        actor = self._actor_context()

        with DB_LOCK:
            conn = get_conn()
            try:
                if path == "/api/v1/health":
                    stats = get_storage_overview_stats(conn)
                    self._send_ok({"healthy": True, **stats})
                    return

                if path == "/api/v1/taxonomy":
                    # Publicly readable for learner profile & scenario classification
                    fields = [
                        dict(r)
                        for r in conn.execute(
                            "SELECT * FROM vocational_taxonomy_fields WHERE is_active = 1 ORDER BY display_order ASC"
                        ).fetchall()
                    ]
                    specs = [
                        dict(r)
                        for r in conn.execute(
                            "SELECT * FROM vocational_taxonomy_specialties WHERE is_active = 1 ORDER BY display_order ASC"
                        ).fetchall()
                    ]
                    by_field: Dict[str, List[Dict[str, Any]]] = {}
                    for s in specs:
                        s["targetGroups"] = json.loads(s.get("target_groups_json") or "[]")
                        s["sampleSituations"] = json.loads(s.get("sample_situations_json") or "[]")
                        s["contentModules"] = json.loads(s.get("content_modules_json") or "[]")
                        by_field.setdefault(s["field_id"], []).append(s)
                    for f in fields:
                        f["specialties"] = by_field.get(f["id"], [])
                    self._send_ok(
                        {
                            "learnerGroups": INITIAL_LEARNER_GROUPS,
                            "institutionTypes": INSTITUTION_TYPES,
                            "fields": fields,
                            "totalFields": len(fields),
                            "totalSpecialties": len(specs),
                        }
                    )
                    return

                if path == "/api/v1/access/status":
                    if not actor["accountId"] or actor["role"] not in ("ADMIN", "SUPER_ADMIN"):
                        self._send_error(403, "FORBIDDEN", "Chỉ tài khoản Admin mới được kiểm tra trạng thái kho.")
                        return

                    pin_rec = ensure_admin_pin_record(
                        conn, actor["accountId"], actor["email"], actor["name"], actor["role"]
                    )
                    pin_rec = check_and_clear_expired_lockout(conn, pin_rec)
                    sys_lock = get_system_lock_state(conn)

                    has_pin = bool(pin_rec.get("pin_hash")) and not bool(pin_rec.get("must_reset_pin"))
                    lock_remaining = 0
                    if pin_rec.get("lock_until"):
                        lock_dt = parse_iso(pin_rec["lock_until"])
                        now_dt = datetime.datetime.now(datetime.timezone.utc)
                        if lock_dt and lock_dt > now_dt:
                            lock_remaining = int((lock_dt - now_dt).total_seconds())

                    session_valid = False
                    session_expires_at = None
                    if actor["vaultToken"] and has_pin and not sys_lock.get("isLocked"):
                        ok, _, _, _, sess = verify_vault_session(
                            conn, actor["accountId"], actor["role"], actor["vaultToken"]
                        )
                        if ok and sess:
                            session_valid = True
                            session_expires_at = sess["expires_at"]

                    # Never return pin_hash or pin_salt to client!
                    all_admins = []
                    for r in conn.execute("SELECT account_id, email, name, role, is_authorized, is_locked, failed_attempts, lock_until, must_reset_pin, pin_set_at, pin_updated_at FROM storage_access_pins ORDER BY created_at ASC").fetchall():
                        d = dict(r)
                        d["hasPinSetup"] = bool(
                            conn.execute(
                                "SELECT pin_hash FROM storage_access_pins WHERE account_id = ?",
                                (d["account_id"],),
                            ).fetchone()["pin_hash"]
                        )
                        all_admins.append(d)

                    self._send_ok(
                        {
                            "accountId": actor["accountId"],
                            "email": actor["email"],
                            "name": actor["name"],
                            "role": actor["role"],
                            "isAuthorized": bool(pin_rec.get("is_authorized")),
                            "isAccountLocked": bool(pin_rec.get("is_locked")),
                            "hasPinSetup": has_pin,
                            "mustResetPin": bool(pin_rec.get("must_reset_pin")),
                            "failedAttempts": int(pin_rec.get("failed_attempts") or 0),
                            "maxFailedAttempts": PIN_MAX_FAILED_ATTEMPTS,
                            "lockUntil": pin_rec.get("lock_until"),
                            "lockRemainingSeconds": lock_remaining,
                            "sessionValid": session_valid,
                            "sessionExpiresAt": session_expires_at,
                            "systemLock": sys_lock,
                            "adminAccounts": all_admins,
                        }
                    )
                    return

                # All routes below require full multi-layer vault verification (Logged-in + Admin + System Unlocked + PIN Setup + Active 8h Vault Session)
                ok, status_code, err_code, err_msg, sess = verify_vault_session(
                    conn, actor["accountId"], actor["role"], actor["vaultToken"]
                )
                if not ok:
                    self._send_error(status_code, err_code, err_msg)
                    return

                if path == "/api/v1/overview":
                    # Trigger initial legacy import automatically on first successful vault open (Phần VI.1)
                    imp_state = get_initial_import_state(conn)
                    auto_import_job = None
                    if not imp_state.get("hasCompletedInitialImport") and imp_state.get("status") == "NOT_RUN":
                        auto_import_job = run_initial_import_job(
                            conn, actor["accountId"], actor["name"]
                        )
                    append_audit_log(
                        conn,
                        event_code="ADMIN_OPEN_VAULT",
                        action_label="Admin mở trang tổng quan Kho lưu trữ mã nguồn",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                    )
                    conn.commit()
                    overview = get_storage_overview_stats(conn)
                    overview["autoTriggeredImportJob"] = auto_import_job
                    self._send_ok(overview)
                    return

                if path == "/api/v1/items":
                    item_type = (qs.get("type", [""])[0] or "").strip().upper()
                    status_filter = (qs.get("status", ["ACTIVE"])[0] or "ACTIVE").strip().upper()
                    file_format = (qs.get("format", [""])[0] or "").strip().upper()
                    creator = (qs.get("creator", [""])[0] or "").strip()
                    version_filter = (qs.get("version", [""])[0] or "").strip()
                    date_from = (qs.get("dateFrom", [""])[0] or "").strip()
                    date_to = (qs.get("dateTo", [""])[0] or "").strip()
                    q = (qs.get("q", [""])[0] or "").strip()
                    page = max(1, int(qs.get("page", ["1"])[0] or "1"))
                    page_size = max(1, min(100, int(qs.get("pageSize", ["20"])[0] or "20")))

                    where_clauses = ["1=1"]
                    params: List[Any] = []

                    if status_filter == "TRASHED":
                        where_clauses.append("storage_status = 'TRASHED'")
                    elif status_filter == "QUARANTINED":
                        where_clauses.append("is_quarantined = 1 AND storage_status != 'TRASHED'")
                    elif status_filter == "ALL":
                        where_clauses.append("storage_status != 'TRASHED'")
                    else:
                        where_clauses.append("storage_status = ?")
                        params.append(status_filter)

                    if item_type and item_type != "ALL":
                        where_clauses.append("item_type = ?")
                        params.append(item_type)

                    if file_format and file_format != "ALL":
                        where_clauses.append("UPPER(file_format) = ?")
                        params.append(file_format)

                    if creator:
                        where_clauses.append(
                            "(LOWER(COALESCE(author_name,'')) LIKE ? OR LOWER(COALESCE(creator_name,'')) LIKE ? OR LOWER(COALESCE(author_email,'')) LIKE ?)"
                        )
                        like_c = f"%{creator.lower()}%"
                        params.extend([like_c, like_c, like_c])

                    if version_filter and version_filter.isdigit():
                        where_clauses.append("current_version = ?")
                        params.append(int(version_filter))

                    if date_from:
                        where_clauses.append("archived_at >= ?")
                        params.append(date_from)
                    if date_to:
                        where_clauses.append("archived_at <= ?")
                        params.append(date_to + "T23:59:59Z")

                    if q:
                        where_clauses.append(
                            """(
                                LOWER(COALESCE(title,'')) LIKE ? OR
                                LOWER(COALESCE(content,'')) LIKE ? OR
                                LOWER(COALESCE(author_name,'')) LIKE ? OR
                                LOWER(COALESCE(id,'')) LIKE ? OR
                                LOWER(COALESCE(source_id,'')) LIKE ? OR
                                LOWER(COALESCE(checksum_sha256,'')) LIKE ?
                            )"""
                        )
                        like_q = f"%{q.lower()}%"
                        params.extend([like_q, like_q, like_q, like_q, like_q, like_q])
                        append_audit_log(
                            conn,
                            event_code="SEARCH_DATA",
                            action_label=f"Tìm kiếm dữ liệu kho với từ khóa '{q}'",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            ip_address=actor["ip"],
                            user_agent=actor["ua"],
                            status="SUCCESS",
                            details={"query": q, "itemType": item_type, "statusFilter": status_filter},
                        )
                        conn.commit()

                    where_sql = " AND ".join(where_clauses)
                    total = int(
                        conn.execute(f"SELECT COUNT(*) AS cnt FROM storage_items WHERE {where_sql}", params).fetchone()["cnt"]
                    )
                    offset = (page - 1) * page_size
                    # Never select BLOB columns in list queries!
                    rows = conn.execute(
                        f"""
                        SELECT id, item_type, source_id, parent_source_id, title, preview_text,
                               author_id, author_name, author_email, creator_id, creator_name,
                               editor_id, editor_name, owner_id, source_status, storage_status,
                               is_quarantined, quarantine_reason, external_url, external_source_note,
                               file_id, file_format, file_size_bytes, checksum_sha256,
                               current_version, storage_path, notes, metadata_json,
                               source_created_at, source_updated_at, imported_batch_code,
                               archived_at, updated_at
                        FROM storage_items
                        WHERE {where_sql}
                        ORDER BY updated_at DESC
                        LIMIT ? OFFSET ?
                        """,
                        [*params, page_size, offset],
                    ).fetchall()

                    items = []
                    for r in rows:
                        d = dict(r)
                        try:
                            d["metadata"] = json.loads(d.get("metadata_json") or "{}")
                        except Exception:
                            d["metadata"] = {}
                        items.append(d)

                    self._send_ok(
                        {
                            "items": items,
                            "pagination": {
                                "page": page,
                                "pageSize": page_size,
                                "total": total,
                                "totalPages": max(1, (total + page_size - 1) // page_size),
                            },
                        }
                    )
                    return

                if path.startswith("/api/v1/items/"):
                    parts = [p for p in path.split("/") if p]
                    # /api/v1/items/<item_id> or /api/v1/items/<item_id>/preview or /api/v1/items/<item_id>/versions
                    item_id = parts[3] if len(parts) >= 4 else ""
                    sub_action = parts[4] if len(parts) >= 5 else ""

                    row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
                    if not row:
                        self._send_error(404, "ITEM_NOT_FOUND", "Không tìm thấy mục dữ liệu trong kho.")
                        return
                    item = dict(row)
                    item["metadata"] = json.loads(item.get("metadata_json") or "{}")

                    versions = [
                        dict(v)
                        for v in conn.execute(
                            "SELECT * FROM storage_versions WHERE item_id = ? ORDER BY version_number DESC",
                            (item_id,),
                        ).fetchall()
                    ]
                    files = [
                        dict(f)
                        for f in conn.execute(
                            "SELECT * FROM storage_files WHERE item_id = ? ORDER BY version_number DESC",
                            (item_id,),
                        ).fetchall()
                    ]

                    if sub_action == "preview":
                        ver_param = (qs.get("version", [""])[0] or "").strip()
                        target_ver = int(ver_param) if ver_param.isdigit() else int(item["current_version"])
                        ver_row = conn.execute(
                            "SELECT * FROM storage_versions WHERE item_id = ? AND version_number = ?",
                            (item_id, target_ver),
                        ).fetchone()
                        content_preview = ver_row["content"] if ver_row else item.get("content") or ""
                        fmt = (item.get("file_format") or "TEXT").upper()

                        # Check if previewable text format
                        can_preview = True
                        if item["item_type"] == "UPLOADED_FILE":
                            ext_check = f".{fmt.lower()}"
                            if ext_check not in TEXT_PREVIEWABLE_EXTENSIONS and not (item.get("title") or "").endswith("schema.prisma"):
                                can_preview = False

                        append_audit_log(
                            conn,
                            event_code="PREVIEW_CONTENT",
                            action_label=f"Xem trước nội dung '{item.get('title') or item_id}' (v{target_ver})",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            target_item_id=item_id,
                            target_type=item["item_type"],
                            target_label=item.get("title") or item_id,
                            ip_address=actor["ip"],
                            user_agent=actor["ua"],
                            status="SUCCESS",
                        )
                        conn.commit()
                        self._send_ok(
                            {
                                "itemId": item_id,
                                "title": item.get("title"),
                                "itemType": item["item_type"],
                                "fileFormat": fmt,
                                "versionNumber": target_ver,
                                "canPreviewText": can_preview,
                                "safeSourceText": content_preview if can_preview else None,
                                "executionBlocked": True,
                                "securityNote": "Chế độ xem trước an toàn: Hiển thị dưới dạng mã nguồn văn bản thuần, không thực thi HTML/JS.",
                                "externalUrl": item.get("external_url"),
                                "externalSourceNote": item.get("external_source_note"),
                                "checksumSha256": ver_row["checksum_sha256"] if ver_row else item["checksum_sha256"],
                            }
                        )
                        return

                    self._send_ok({"item": item, "versions": versions, "files": files})
                    return

                if path.startswith("/api/v1/download/"):
                    # /api/v1/download/<item_id>?version=<v>
                    parts = [p for p in path.split("/") if p]
                    item_id = parts[3] if len(parts) >= 4 else ""
                    ver_param = (qs.get("version", [""])[0] or "").strip()

                    row = conn.execute("SELECT * FROM storage_items WHERE id = ?", (item_id,)).fetchone()
                    if not row:
                        self._send_error(404, "NOT_FOUND", "Không tìm thấy mục cần tải xuống.")
                        return
                    item = dict(row)
                    target_ver = int(ver_param) if ver_param.isdigit() else int(item["current_version"])

                    ver_row = conn.execute(
                        "SELECT * FROM storage_versions WHERE item_id = ? AND version_number = ?",
                        (item_id, target_ver),
                    ).fetchone()
                    if not ver_row:
                        self._send_error(404, "VERSION_NOT_FOUND", f"Không tìm thấy phiên bản #{target_ver}.")
                        return
                    ver = dict(ver_row)

                    file_id = ver.get("file_id") or item.get("file_id")
                    if file_id:
                        f_row = conn.execute("SELECT * FROM storage_files WHERE id = ?", (file_id,)).fetchone()
                        b_row = conn.execute("SELECT * FROM storage_file_blobs WHERE file_id = ?", (file_id,)).fetchone()
                        if not f_row or not b_row:
                            self._send_error(404, "BLOB_NOT_FOUND", "Không tìm thấy dữ liệu BLOB trong SQLite.")
                            return
                        blob_bytes = bytes(b_row["blob_data"])
                        calc_hash = compute_sha256(blob_bytes)
                        if calc_hash != b_row["checksum_sha256"]:
                            self._send_error(500, "CHECKSUM_MISMATCH", "Cảnh báo: Checksum BLOB không khớp khi tải xuống.")
                            return
                        filename = f_row["file_name"]
                        mime_type = f_row["mime_type"]
                    else:
                        text_body = ver.get("content") or item.get("content") or ""
                        blob_bytes = text_body.encode("utf-8")
                        calc_hash = compute_sha256(blob_bytes)
                        slug_name = (item.get("title") or item_id).replace(" ", "_")[:50]
                        filename = f"{slug_name}_v{target_ver}.txt"
                        mime_type = "text/plain; charset=utf-8"

                    append_audit_log(
                        conn,
                        event_code="FILE_DOWNLOAD",
                        action_label=f"Tải xuống '{filename}' (Phiên bản #{target_ver}, {len(blob_bytes)} bytes)",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        target_item_id=item_id,
                        target_type=item["item_type"],
                        target_label=filename,
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"versionNumber": target_ver, "sizeBytes": len(blob_bytes), "checksumSha256": calc_hash},
                    )
                    conn.commit()

                    self._send_ok(
                        {
                            "itemId": item_id,
                            "versionNumber": target_ver,
                            "fileName": filename,
                            "mimeType": mime_type,
                            "sizeBytes": len(blob_bytes),
                            "checksumSha256": calc_hash,
                            "base64Content": base64.b64encode(blob_bytes).decode("ascii"),
                        }
                    )
                    return

                if path == "/api/v1/trash":
                    rows = conn.execute(
                        """
                        SELECT t.*, i.file_size_bytes, i.checksum_sha256, i.source_id, i.storage_path, i.author_name
                        FROM storage_trash t
                        JOIN storage_items i ON t.item_id = i.id
                        WHERE i.storage_status = 'TRASHED' AND t.restore_status = 'IN_TRASH'
                        ORDER BY t.deleted_at DESC
                        """
                    ).fetchall()
                    self._send_ok({"trashItems": [dict(r) for r in rows]})
                    return

                if path == "/api/v1/import/status":
                    jobs = [
                        dict(r)
                        for r in conn.execute(
                            "SELECT * FROM storage_import_jobs ORDER BY started_at DESC LIMIT 10"
                        ).fetchall()
                    ]
                    for j in jobs:
                        j["errors"] = json.loads(j.get("errors_json") or "[]")
                        j["checkpoints"] = [
                            dict(c)
                            for c in conn.execute(
                                "SELECT * FROM storage_import_checkpoints WHERE job_id = ?", (j["id"],)
                            ).fetchall()
                        ]
                    events = [
                        dict(e)
                        for e in conn.execute(
                            "SELECT * FROM storage_archive_events ORDER BY created_at DESC LIMIT 30"
                        ).fetchall()
                    ]
                    self._send_ok(
                        {
                            "initialImportState": get_initial_import_state(conn),
                            "jobs": jobs,
                            "recentArchiveEvents": events,
                        }
                    )
                    return

                if path == "/api/v1/audit-logs":
                    actor_filter = (qs.get("actor", [""])[0] or "").strip()
                    action_filter = (qs.get("eventCode", [""])[0] or "").strip()
                    date_from = (qs.get("dateFrom", [""])[0] or "").strip()
                    date_to = (qs.get("dateTo", [""])[0] or "").strip()
                    page = max(1, int(qs.get("page", ["1"])[0] or "1"))
                    page_size = max(1, min(100, int(qs.get("pageSize", ["30"])[0] or "30")))

                    clauses = ["1=1"]
                    params = []
                    if actor_filter:
                        clauses.append("(LOWER(COALESCE(actor_name,'')) LIKE ? OR LOWER(COALESCE(actor_email,'')) LIKE ? OR LOWER(COALESCE(actor_id,'')) LIKE ?)")
                        lk = f"%{actor_filter.lower()}%"
                        params.extend([lk, lk, lk])
                    if action_filter and action_filter != "ALL":
                        clauses.append("event_code = ?")
                        params.append(action_filter)
                    if date_from:
                        clauses.append("created_at >= ?")
                        params.append(date_from)
                    if date_to:
                        clauses.append("created_at <= ?")
                        params.append(date_to + "T23:59:59Z")

                    w_sql = " AND ".join(clauses)
                    total = int(conn.execute(f"SELECT COUNT(*) AS cnt FROM storage_audit_logs WHERE {w_sql}", params).fetchone()["cnt"])
                    offset = (page - 1) * page_size
                    logs = []
                    for r in conn.execute(
                        f"SELECT * FROM storage_audit_logs WHERE {w_sql} ORDER BY created_at DESC LIMIT ? OFFSET ?",
                        [*params, page_size, offset],
                    ).fetchall():
                        d = dict(r)
                        try:
                            d["details"] = json.loads(d.get("details_json") or "{}")
                        except Exception:
                            d["details"] = {}
                        logs.append(d)

                    self._send_ok(
                        {
                            "logs": logs,
                            "pagination": {
                                "page": page,
                                "pageSize": page_size,
                                "total": total,
                                "totalPages": max(1, (total + page_size - 1) // page_size),
                            },
                        }
                    )
                    return

                self._send_error(404, "ROUTE_NOT_FOUND", f"Không tìm thấy đường dẫn Storage API: {path}")
            except Exception as exc:
                self._send_error(500, "INTERNAL_STORAGE_ERROR", str(exc))
            finally:
                conn.close()

    def do_POST(self) -> None:
        if not self._verify_service_token():
            self._send_error(401, "INVALID_SERVICE_TOKEN", "Từ chối kết nối trực tiếp: Thiếu hoặc sai khóa xác thực Worker -> Storage Service.")
            return

        parsed = urllib.parse.urlparse(self.path)
        path = parsed.path

        try:
            body = self._read_json_body()
        except Exception as exc:
            self._send_error(400, "INVALID_JSON_PAYLOAD", str(exc))
            return

        actor = self._actor_context(body)

        with DB_LOCK:
            conn = get_conn()
            try:
                # =========================================================
                # 1. INTERNAL AUTO-ARCHIVE & ACCOUNT DELETION HOOKS
                # (Called by Next.js / Cloudflare Worker backend with service token)
                # =========================================================
                if path == "/api/v1/archive/events":
                    sys_lock = get_system_lock_state(conn)
                    event_type = str(body.get("eventType") or "").strip().upper()
                    item_type = str(body.get("itemType") or "").strip().upper()
                    source_id = str(body.get("sourceId") or "").strip()
                    idempotency_key = str(
                        body.get("idempotencyKey") or f"{event_type}:{item_type}:{source_id}:{body.get('versionHint') or ''}"
                    ).strip()
                    payload = body.get("payload") or {}

                    if not event_type or not item_type or not source_id:
                        self._send_error(400, "INVALID_EVENT", "Thiếu thông tin sự kiện tự động lưu.")
                        return

                    # Check idempotency key to prevent duplicate archiving (Phần V.4)
                    existing_ev = conn.execute(
                        "SELECT * FROM storage_archive_events WHERE idempotency_key = ?",
                        (idempotency_key,),
                    ).fetchone()
                    if existing_ev:
                        ev_dict = dict(existing_ev)
                        if ev_dict["status"] == "COMPLETED":
                            self._send_ok(
                                {
                                    "deduplicated": True,
                                    "eventId": ev_dict["id"],
                                    "status": ev_dict["status"],
                                    "itemId": ev_dict["item_id"],
                                    "versionNumber": ev_dict["version_number"],
                                }
                            )
                            return

                    ts = now_iso()
                    ev_id = existing_ev["id"] if existing_ev else f"ev-{uuid.uuid4().hex[:16]}"
                    if not existing_ev:
                        conn.execute(
                            """
                            INSERT INTO storage_archive_events (
                                id, idempotency_key, event_type, item_type, source_id,
                                payload_json, status, retry_count, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, 'PENDING', 0, ?, ?)
                            """,
                            (
                                ev_id,
                                idempotency_key,
                                event_type,
                                item_type,
                                source_id,
                                json.dumps(payload, ensure_ascii=False),
                                ts,
                                ts,
                            ),
                        )
                        conn.commit()

                    # If system is locked or autoArchive is paused or simulateQueueOnly is true, keep in PENDING queue
                    if sys_lock.get("isLocked") or not sys_lock.get("autoArchiveEnabled", True) or body.get("queueOnly"):
                        self._send_ok(
                            {
                                "queued": True,
                                "eventId": ev_id,
                                "status": "PENDING",
                                "message": "Sự kiện đã được ghi nhận vào hàng đợi an toàn để xử lý sau.",
                            },
                            202,
                        )
                        return

                    ev_row = dict(conn.execute("SELECT * FROM storage_archive_events WHERE id = ?", (ev_id,)).fetchone())
                    ok_proc, err_proc = process_archive_event_record(conn, ev_row)
                    conn.commit()
                    updated_ev = dict(conn.execute("SELECT * FROM storage_archive_events WHERE id = ?", (ev_id,)).fetchone())
                    self._send_ok(
                        {
                            "processed": ok_proc,
                            "eventId": ev_id,
                            "status": updated_ev["status"],
                            "itemId": updated_ev["item_id"],
                            "versionNumber": updated_ev["version_number"],
                            "error": err_proc,
                        },
                        201 if ok_proc else 202,
                    )
                    return

                if path == "/api/v1/accounts/handle-deletion":
                    deleted_account_id = str(body.get("deletedAccountId") or "").strip()
                    deleted_email = str(body.get("deletedAccountEmail") or "").strip()
                    permanent_purge = bool(body.get("permanentPurgePrivate", False))
                    if not deleted_account_id:
                        self._send_error(400, "MISSING_ACCOUNT_ID", "Thiếu mã tài khoản bị xóa.")
                        return
                    report = handle_account_deletion_internal(
                        conn,
                        deleted_account_id=deleted_account_id,
                        deleted_account_email=deleted_email,
                        triggered_by_id=actor["accountId"] or "SYSTEM",
                        triggered_by_name=actor["name"] or "Hệ thống WORD BRIDGE",
                        permanent_purge_private=permanent_purge,
                    )
                    self._send_ok({"deletionReport": report})
                    return

                # =========================================================
                # 2. ACCESS & PIN MANAGEMENT ENDPOINTS (Phần IV & XIII.1)
                # =========================================================
                if not actor["accountId"] or actor["role"] not in ("ADMIN", "SUPER_ADMIN"):
                    self._send_error(403, "FORBIDDEN", "Yêu cầu tài khoản Admin đã đăng nhập.")
                    return

                pin_rec = ensure_admin_pin_record(
                    conn, actor["accountId"], actor["email"], actor["name"], actor["role"]
                )
                pin_rec = check_and_clear_expired_lockout(conn, pin_rec)
                sys_lock = get_system_lock_state(conn)

                if path == "/api/v1/access/setup-pin":
                    if not pin_rec.get("is_authorized") or pin_rec.get("is_locked"):
                        self._send_error(403, "ACCOUNT_LOCKED", "Tài khoản không có quyền hoặc đang bị khóa kho.")
                        return
                    if pin_rec.get("pin_hash") and not pin_rec.get("must_reset_pin"):
                        self._send_error(400, "PIN_ALREADY_SET", "Tài khoản đã thiết lập PIN. Vui lòng dùng chức năng Đổi PIN.")
                        return

                    pin = str(body.get("pin") or "").strip()
                    confirm_pin = str(body.get("confirmPin") or "").strip()
                    if len(pin) != 6 or not pin.isdigit():
                        self._send_error(400, "INVALID_PIN_FORMAT", "Mã PIN phải gồm chính xác 6 chữ số từ 0 đến 9 (cho phép số 0 ở đầu).")
                        return
                    if pin != confirm_pin:
                        self._send_error(400, "PIN_MISMATCH", "Mã PIN xác nhận không khớp.")
                        return

                    pin_hash, pin_salt, algo = hash_pin_argon2id(pin)
                    ts = now_iso()
                    conn.execute(
                        """
                        UPDATE storage_access_pins
                        SET pin_hash = ?, pin_salt = ?, hash_algo = ?,
                            must_reset_pin = 0, failed_attempts = 0,
                            lock_started_at = NULL, lock_until = NULL,
                            pin_set_at = COALESCE(pin_set_at, ?), pin_updated_at = ?, updated_at = ?
                        WHERE account_id = ?
                        """,
                        (pin_hash, pin_salt, algo, ts, ts, ts, actor["accountId"]),
                    )
                    append_audit_log(
                        conn,
                        event_code="PIN_SETUP",
                        action_label=f"Thiết lập mã PIN 6 chữ số lần đầu ({algo})",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"hashAlgorithm": algo},
                    )
                    conn.commit()
                    self._send_ok({"pinSetup": True, "hashAlgorithm": algo})
                    return

                if path == "/api/v1/access/verify-pin":
                    if sys_lock.get("isLocked"):
                        self._send_error(
                            423,
                            "SYSTEM_VAULT_LOCKED",
                            f"Kho lưu trữ đang bị khóa toàn hệ thống: {sys_lock.get('reason') or 'Bảo mật'}.",
                        )
                        return
                    if not pin_rec.get("is_authorized") or pin_rec.get("is_locked"):
                        self._send_error(403, "ACCOUNT_VAULT_LOCKED", "Tài khoản không có quyền hoặc đã bị khóa truy cập kho.")
                        return
                    if not pin_rec.get("pin_hash") or pin_rec.get("must_reset_pin"):
                        self._send_error(400, "PIN_NOT_SETUP", "Vui lòng thiết lập mã PIN 6 chữ số trước.")
                        return

                    # Check active 15-minute lockout
                    if pin_rec.get("lock_until"):
                        lock_dt = parse_iso(pin_rec["lock_until"])
                        now_dt = datetime.datetime.now(datetime.timezone.utc)
                        if lock_dt and lock_dt > now_dt:
                            rem_sec = int((lock_dt - now_dt).total_seconds())
                            self._send_error(
                                429,
                                "PIN_LOCKED_15M",
                                f"Tài khoản đang tạm khóa xác minh PIN trong 15 phút do nhập sai 5 lần liên tiếp. Còn lại {rem_sec} giây.",
                                {
                                    "lockStartedAt": pin_rec.get("lock_started_at"),
                                    "lockUntil": pin_rec.get("lock_until"),
                                    "remainingSeconds": rem_sec,
                                },
                            )
                            return

                    pin = str(body.get("pin") or "").strip()
                    if len(pin) != 6 or not pin.isdigit():
                        self._send_error(400, "INVALID_PIN_FORMAT", "Mã PIN phải gồm đúng 6 chữ số (0–9).")
                        return

                    if not verify_pin_hash(pin, pin_rec["pin_hash"]):
                        failed = int(pin_rec.get("failed_attempts") or 0) + 1
                        ts_now = datetime.datetime.now(datetime.timezone.utc)
                        lock_start = None
                        lock_until = None
                        if failed >= PIN_MAX_FAILED_ATTEMPTS:
                            lock_start = ts_now.isoformat()
                            lock_until = (ts_now + datetime.timedelta(seconds=PIN_LOCKOUT_SECONDS)).isoformat()

                        conn.execute(
                            """
                            UPDATE storage_access_pins
                            SET failed_attempts = ?, lock_started_at = ?, lock_until = ?, updated_at = ?
                            WHERE account_id = ?
                            """,
                            (failed, lock_start, lock_until, ts_now.isoformat(), actor["accountId"]),
                        )

                        append_audit_log(
                            conn,
                            event_code="PIN_LOCKED_OUT" if lock_until else "PIN_VERIFY_FAILED",
                            action_label=(
                                f"Khóa xác minh PIN 15 phút sau {failed} lần nhập sai liên tiếp"
                                if lock_until
                                else f"Nhập PIN kho lưu trữ thất bại (Lần {failed}/{PIN_MAX_FAILED_ATTEMPTS})"
                            ),
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            ip_address=actor["ip"],
                            user_agent=actor["ua"],
                            status="FAILED",
                            error_reason="WRONG_PIN",
                            details={"failedAttempts": failed, "lockUntil": lock_until},
                        )
                        conn.commit()

                        if lock_until:
                            self._send_error(
                                429,
                                "PIN_LOCKED_15M",
                                "Bạn đã nhập sai PIN 5 lần liên tiếp. Chức năng xác minh PIN bị khóa trong 15 phút (Tài khoản WORD BRIDGE chính không bị khóa).",
                                {
                                    "failedAttempts": failed,
                                    "lockStartedAt": lock_start,
                                    "lockUntil": lock_until,
                                    "remainingSeconds": PIN_LOCKOUT_SECONDS,
                                },
                            )
                        else:
                            self._send_error(
                                401,
                                "WRONG_PIN",
                                f"Mã PIN không chính xác. Còn {PIN_MAX_FAILED_ATTEMPTS - failed} lần thử trước khi tạm khóa 15 phút.",
                                {
                                    "failedAttempts": failed,
                                    "remainingAttempts": PIN_MAX_FAILED_ATTEMPTS - failed,
                                },
                            )
                        return

                    # PIN verified -> reset failed counter & create 8-hour vault session (Phần IV.4, IV.5)
                    now_dt = datetime.datetime.now(datetime.timezone.utc)
                    exp_dt = now_dt + datetime.timedelta(seconds=SESSION_TTL_SECONDS)
                    raw_session_token = f"wbvs_{uuid.uuid4().hex}{uuid.uuid4().hex}"
                    token_hash = hashlib.sha256(raw_session_token.encode("utf-8")).hexdigest()
                    sess_id = f"vsess-{uuid.uuid4().hex[:16]}"

                    conn.execute(
                        """
                        UPDATE storage_access_pins
                        SET failed_attempts = 0, lock_started_at = NULL, lock_until = NULL, updated_at = ?
                        WHERE account_id = ?
                        """,
                        (now_dt.isoformat(), actor["accountId"]),
                    )
                    conn.execute(
                        """
                        INSERT INTO storage_access_sessions (
                            id, session_token_hash, account_id, email, role,
                            ip_address, user_agent, created_at, expires_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                        """,
                        (
                            sess_id,
                            token_hash,
                            actor["accountId"],
                            actor["email"],
                            actor["role"],
                            actor["ip"],
                            actor["ua"],
                            now_dt.isoformat(),
                            exp_dt.isoformat(),
                        ),
                    )
                    append_audit_log(
                        conn,
                        event_code="PIN_VERIFY_SUCCESS",
                        action_label="Xác minh PIN 6 chữ số thành công – Mở phiên truy cập kho (8 giờ)",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"sessionId": sess_id, "expiresAt": exp_dt.isoformat()},
                    )

                    # Trigger first-time legacy data import if not yet run (Phần VI.1)
                    imp_state = get_initial_import_state(conn)
                    auto_import_job = None
                    if not imp_state.get("hasCompletedInitialImport") and imp_state.get("status") == "NOT_RUN":
                        auto_import_job = run_initial_import_job(
                            conn, actor["accountId"], actor["name"]
                        )

                    conn.commit()
                    self._send_ok(
                        {
                            "vaultToken": raw_session_token,
                            "sessionId": sess_id,
                            "expiresAt": exp_dt.isoformat(),
                            "ttlSeconds": SESSION_TTL_SECONDS,
                            "autoImportJob": auto_import_job,
                        }
                    )
                    return

                if path == "/api/v1/access/change-pin":
                    current_pin = str(body.get("currentPin") or "").strip()
                    new_pin = str(body.get("newPin") or "").strip()
                    confirm_pin = str(body.get("confirmPin") or "").strip()

                    if not pin_rec.get("pin_hash"):
                        self._send_error(400, "PIN_NOT_SET", "Chưa có PIN hiện tại.")
                        return
                    if not verify_pin_hash(current_pin, pin_rec["pin_hash"]):
                        append_audit_log(
                            conn,
                            event_code="PIN_CHANGE",
                            action_label="Đổi mã PIN thất bại do nhập sai PIN hiện tại",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            status="FAILED",
                            error_reason="WRONG_CURRENT_PIN",
                        )
                        conn.commit()
                        self._send_error(401, "WRONG_CURRENT_PIN", "Mã PIN hiện tại không chính xác.")
                        return
                    if len(new_pin) != 6 or not new_pin.isdigit():
                        self._send_error(400, "INVALID_NEW_PIN", "Mã PIN mới phải gồm đúng 6 chữ số (0–9).")
                        return
                    if new_pin != confirm_pin:
                        self._send_error(400, "PIN_MISMATCH", "Mã PIN mới và xác nhận không khớp.")
                        return

                    pin_hash, pin_salt, algo = hash_pin_argon2id(new_pin)
                    ts = now_iso()
                    conn.execute(
                        """
                        UPDATE storage_access_pins
                        SET pin_hash = ?, pin_salt = ?, hash_algo = ?,
                            must_reset_pin = 0, failed_attempts = 0,
                            lock_started_at = NULL, lock_until = NULL,
                            pin_updated_at = ?, updated_at = ?
                        WHERE account_id = ?
                        """,
                        (pin_hash, pin_salt, algo, ts, ts, actor["accountId"]),
                    )
                    # Revoke all old vault sessions for this account on PIN change (Phần IV.5)
                    conn.execute(
                        """
                        UPDATE storage_access_sessions
                        SET revoked_at = ?, revoke_reason = 'PIN_CHANGED'
                        WHERE account_id = ? AND revoked_at IS NULL
                        """,
                        (ts, actor["accountId"]),
                    )
                    append_audit_log(
                        conn,
                        event_code="PIN_CHANGE",
                        action_label="Thay đổi mã PIN 6 chữ số thành công và thu hồi các phiên kho cũ",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"hashAlgorithm": algo},
                    )
                    conn.commit()
                    self._send_ok({"pinChanged": True, "oldSessionsRevoked": True})
                    return

                if path == "/api/v1/access/logout":
                    ts = now_iso()
                    if actor["vaultToken"]:
                        th = hashlib.sha256(actor["vaultToken"].encode("utf-8")).hexdigest()
                        conn.execute(
                            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'LOGOUT' WHERE session_token_hash = ?",
                            (ts, th),
                        )
                    else:
                        conn.execute(
                            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'LOGOUT' WHERE account_id = ? AND revoked_at IS NULL",
                            (ts, actor["accountId"]),
                        )
                    append_audit_log(
                        conn,
                        event_code="ADMIN_CLOSE_VAULT",
                        action_label="Admin đóng phiên truy cập Kho lưu trữ mã nguồn",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                    )
                    conn.commit()
                    self._send_ok({"loggedOut": True})
                    return

                if path == "/api/v1/access/forgot-pin/request":
                    # Step 1-3 of Forgot PIN (Phần IV.7):
                    # Verify logged-in Admin account, invalidate previous OTPs, issue 5-minute single-use OTP
                    ts_now = datetime.datetime.now(datetime.timezone.utc)
                    # Rate limit: max 5 requests in 15 minutes
                    recent_cnt = conn.execute(
                        """
                        SELECT COUNT(*) AS cnt FROM storage_recovery_requests
                        WHERE account_id = ? AND created_at > ?
                        """,
                        (actor["accountId"], (ts_now - datetime.timedelta(minutes=15)).isoformat()),
                    ).fetchone()["cnt"]
                    if int(recent_cnt) >= 5:
                        self._send_error(429, "OTP_RATE_LIMITED", "Quá giới hạn yêu cầu mã OTP khôi phục PIN. Vui lòng thử lại sau 15 phút.")
                        return

                    # Invalidate old pending OTPs when issuing a new one (Phần IV.7)
                    conn.execute(
                        """
                        UPDATE storage_recovery_requests
                        SET status = 'SUPERSEDED'
                        WHERE account_id = ? AND status = 'PENDING'
                        """,
                        (actor["accountId"],),
                    )

                    otp_code = f"{uuid.uuid4().int % 1000000:06d}"
                    otp_hash = hash_otp(actor["accountId"], actor["email"], otp_code)
                    exp_at = (ts_now + datetime.timedelta(seconds=OTP_TTL_SECONDS)).isoformat()
                    req_id = f"rec-{uuid.uuid4().hex[:14]}"

                    conn.execute(
                        """
                        INSERT INTO storage_recovery_requests (
                            id, account_id, email, otp_hash, status, attempt_count,
                            max_attempts, expires_at, created_at
                        ) VALUES (?, ?, ?, ?, 'PENDING', 0, 5, ?, ?)
                        """,
                        (req_id, actor["accountId"], actor["email"], otp_hash, exp_at, ts_now.isoformat()),
                    )

                    # Never log raw OTP in audit_logs!
                    append_audit_log(
                        conn,
                        event_code="FORGOT_PIN_REQUEST",
                        action_label=f"Yêu cầu khôi phục PIN (Đã phát hành OTP hiệu lực 5 phút tới {actor['email']})",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"recoveryRequestId": req_id, "expiresAt": exp_at},
                    )
                    conn.commit()
                    # Return otpForEmailDelivery ONLY to the authenticated Next.js server proxy so it can send the email via Resend/SMTP
                    self._send_ok(
                        {
                            "recoveryRequestId": req_id,
                            "email": actor["email"],
                            "expiresAt": exp_at,
                            "ttlSeconds": OTP_TTL_SECONDS,
                            "otpForEmailDelivery": otp_code,
                        }
                    )
                    return

                if path == "/api/v1/access/forgot-pin/reset":
                    # Step 4-9 of Forgot PIN (Phần IV.7)
                    otp_code = str(body.get("otp") or "").strip()
                    new_pin = str(body.get("newPin") or "").strip()
                    confirm_pin = str(body.get("confirmPin") or "").strip()

                    if len(otp_code) != 6 or not otp_code.isdigit():
                        self._send_error(400, "INVALID_OTP", "Mã OTP phải gồm 6 chữ số.")
                        return
                    if len(new_pin) != 6 or not new_pin.isdigit():
                        self._send_error(400, "INVALID_PIN", "Mã PIN mới phải gồm đúng 6 chữ số (0–9).")
                        return
                    if new_pin != confirm_pin:
                        self._send_error(400, "PIN_MISMATCH", "Mã PIN mới và xác nhận không khớp.")
                        return

                    req_row = conn.execute(
                        """
                        SELECT * FROM storage_recovery_requests
                        WHERE account_id = ? AND status = 'PENDING'
                        ORDER BY created_at DESC LIMIT 1
                        """,
                        (actor["accountId"],),
                    ).fetchone()

                    if not req_row:
                        self._send_error(400, "NO_ACTIVE_OTP", "Không tìm thấy yêu cầu OTP hợp lệ hoặc mã đã bị thay thế/sử dụng.")
                        return

                    req_dict = dict(req_row)
                    now_dt = datetime.datetime.now(datetime.timezone.utc)
                    exp_dt = parse_iso(req_dict["expires_at"])

                    if req_dict.get("used_at") or req_dict["status"] != "PENDING":
                        self._send_error(400, "OTP_ALREADY_USED", "Mã OTP này đã được sử dụng hoặc không còn hiệu lực.")
                        return
                    if not exp_dt or now_dt >= exp_dt:
                        conn.execute(
                            "UPDATE storage_recovery_requests SET status = 'EXPIRED' WHERE id = ?",
                            (req_dict["id"],),
                        )
                        conn.commit()
                        self._send_error(400, "OTP_EXPIRED", "Mã OTP đã hết hạn 5 phút. Vui lòng yêu cầu mã mới.")
                        return

                    attempts = int(req_dict.get("attempt_count") or 0) + 1
                    expected_otp_hash = hash_otp(actor["accountId"], actor["email"], otp_code)
                    if not hmac.compare_digest(expected_otp_hash, req_dict["otp_hash"]):
                        new_status = "LOCKED_TOO_MANY_ATTEMPTS" if attempts >= int(req_dict["max_attempts"]) else "PENDING"
                        conn.execute(
                            "UPDATE storage_recovery_requests SET attempt_count = ?, status = ? WHERE id = ?",
                            (attempts, new_status, req_dict["id"]),
                        )
                        append_audit_log(
                            conn,
                            event_code="OTP_VERIFY",
                            action_label=f"Xác minh OTP khôi phục PIN thất bại (Lần {attempts})",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            status="FAILED",
                            error_reason="INVALID_OTP",
                        )
                        conn.commit()
                        self._send_error(401, "OTP_INVALID", "Mã OTP không chính xác.")
                        return

                    # Valid OTP -> mark single-use, hash new PIN, revoke all old vault sessions
                    ts_iso = now_dt.isoformat()
                    conn.execute(
                        "UPDATE storage_recovery_requests SET status = 'USED', used_at = ?, attempt_count = ? WHERE id = ?",
                        (ts_iso, attempts, req_dict["id"]),
                    )
                    pin_hash, pin_salt, algo = hash_pin_argon2id(new_pin)
                    conn.execute(
                        """
                        UPDATE storage_access_pins
                        SET pin_hash = ?, pin_salt = ?, hash_algo = ?,
                            must_reset_pin = 0, failed_attempts = 0,
                            lock_started_at = NULL, lock_until = NULL,
                            pin_updated_at = ?, updated_at = ?
                        WHERE account_id = ?
                        """,
                        (pin_hash, pin_salt, algo, ts_iso, ts_iso, actor["accountId"]),
                    )
                    conn.execute(
                        """
                        UPDATE storage_access_sessions
                        SET revoked_at = ?, revoke_reason = 'PIN_RECOVERY_RESET'
                        WHERE account_id = ? AND revoked_at IS NULL
                        """,
                        (ts_iso, actor["accountId"]),
                    )
                    append_audit_log(
                        conn,
                        event_code="OTP_VERIFY",
                        action_label="Xác minh OTP hợp lệ và khôi phục mã PIN 6 chữ số mới (Đã thu hồi phiên kho cũ)",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        ip_address=actor["ip"],
                        user_agent=actor["ua"],
                        status="SUCCESS",
                        details={"recoveryRequestId": req_dict["id"], "hashAlgorithm": algo},
                    )
                    conn.commit()
                    self._send_ok(
                        {
                            "pinReset": True,
                            "oldSessionsRevoked": True,
                            "securityNotice": "Mã PIN mới đã được lưu dạng Argon2id hash. Tất cả phiên truy cập kho cũ đã bị thu hồi.",
                        }
                    )
                    return

                # =========================================================
                # 3. SYSTEM LOCK / UNLOCK & ADMIN PERMISSIONS (Phần IV.2, IV.6)
                # =========================================================
                if path == "/api/v1/access/system-lock":
                    # Allow verifying vault session even when system is currently locked so Super Admin can unlock it
                    ok, status_code, err_code, err_msg, _ = verify_vault_session(
                        conn, actor["accountId"], actor["role"], actor["vaultToken"], allow_when_system_locked=True
                    )
                    if not ok:
                        # Also allow direct PIN verification for unlocking when vault is locked
                        pin_for_unlock = str(body.get("pin") or "").strip()
                        if not pin_rec.get("pin_hash") or not verify_pin_hash(pin_for_unlock, pin_rec["pin_hash"]):
                            self._send_error(status_code, err_code, "Cần phiên kho hợp lệ hoặc xác nhận đúng mã PIN 6 chữ số để khóa/mở khóa toàn hệ thống.")
                            return

                    lock_action = bool(body.get("lock", True))
                    reason = str(body.get("reason") or "Khóa bảo mật toàn hệ thống theo lệnh Quản trị viên").strip()
                    ts = now_iso()

                    if lock_action:
                        new_state = {
                            "isLocked": True,
                            "lockedBy": actor["accountId"],
                            "lockedByName": actor["name"],
                            "reason": reason,
                            "lockedAt": ts,
                            "autoArchiveEnabled": True,
                        }
                        set_system_lock_state(conn, new_state)
                        # Revoke ALL active vault sessions across the entire system (Phần IV.5, IV.6)
                        conn.execute(
                            """
                            UPDATE storage_access_sessions
                            SET revoked_at = ?, revoke_reason = 'SYSTEM_WIDE_LOCK'
                            WHERE revoked_at IS NULL
                            """,
                            (ts,),
                        )
                        append_audit_log(
                            conn,
                            event_code="SYSTEM_VAULT_LOCK",
                            action_label=f"Khóa kho lưu trữ toàn hệ thống (Lý do: {reason})",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            ip_address=actor["ip"],
                            user_agent=actor["ua"],
                            status="SUCCESS",
                            details={"reason": reason},
                        )
                    else:
                        new_state = {
                            "isLocked": False,
                            "lockedBy": None,
                            "lockedByName": None,
                            "reason": None,
                            "lockedAt": None,
                            "unlockedBy": actor["accountId"],
                            "unlockedByName": actor["name"],
                            "unlockedAt": ts,
                            "autoArchiveEnabled": True,
                        }
                        set_system_lock_state(conn, new_state)
                        append_audit_log(
                            conn,
                            event_code="SYSTEM_VAULT_UNLOCK",
                            action_label="Mở khóa kho lưu trữ toàn hệ thống",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            ip_address=actor["ip"],
                            user_agent=actor["ua"],
                            status="SUCCESS",
                            details={"reason": reason},
                        )

                    conn.commit()
                    self._send_ok({"systemLock": new_state})
                    return

                # All remaining POST actions require an active, verified 8h vault session
                ok, status_code, err_code, err_msg, _ = verify_vault_session(
                    conn, actor["accountId"], actor["role"], actor["vaultToken"]
                )
                if not ok:
                    self._send_error(status_code, err_code, err_msg)
                    return

                if path == "/api/v1/access/admin-permissions":
                    target_account_id = str(body.get("targetAccountId") or "").strip()
                    target_email = str(body.get("targetEmail") or "").strip()
                    target_name = str(body.get("targetName") or "Admin").strip()
                    action_type = str(body.get("action") or "").strip().upper()
                    # GRANT_ACCESS | REVOKE_ACCESS | REQUIRE_PIN_RESET | LOCK_ACCOUNT | UNLOCK_ACCOUNT | MANUAL_SUPERADMIN_RECOVERY

                    if not target_account_id:
                        self._send_error(400, "MISSING_TARGET", "Thiếu mã tài khoản Admin cần phân quyền.")
                        return

                    ensure_admin_pin_record(conn, target_account_id, target_email, target_name, "ADMIN")
                    ts = now_iso()

                    if action_type == "GRANT_ACCESS":
                        conn.execute(
                            "UPDATE storage_access_pins SET is_authorized = 1, updated_at = ? WHERE account_id = ?",
                            (ts, target_account_id),
                        )
                    elif action_type == "REVOKE_ACCESS":
                        conn.execute(
                            "UPDATE storage_access_pins SET is_authorized = 0, updated_at = ? WHERE account_id = ?",
                            (ts, target_account_id),
                        )
                        conn.execute(
                            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'ACCESS_REVOKED' WHERE account_id = ? AND revoked_at IS NULL",
                            (ts, target_account_id),
                        )
                    elif action_type in ("REQUIRE_PIN_RESET", "MANUAL_SUPERADMIN_RECOVERY"):
                        conn.execute(
                            """
                            UPDATE storage_access_pins
                            SET must_reset_pin = 1, failed_attempts = 0, lock_started_at = NULL, lock_until = NULL, updated_at = ?
                            WHERE account_id = ?
                            """,
                            (ts, target_account_id),
                        )
                        conn.execute(
                            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'ADMIN_REQUIRED_PIN_RESET' WHERE account_id = ? AND revoked_at IS NULL",
                            (ts, target_account_id),
                        )
                    elif action_type == "LOCK_ACCOUNT":
                        conn.execute(
                            "UPDATE storage_access_pins SET is_locked = 1, updated_at = ? WHERE account_id = ?",
                            (ts, target_account_id),
                        )
                        conn.execute(
                            "UPDATE storage_access_sessions SET revoked_at = ?, revoke_reason = 'ACCOUNT_LOCKED' WHERE account_id = ? AND revoked_at IS NULL",
                            (ts, target_account_id),
                        )
                    elif action_type == "UNLOCK_ACCOUNT":
                        conn.execute(
                            "UPDATE storage_access_pins SET is_locked = 0, failed_attempts = 0, lock_started_at = NULL, lock_until = NULL, updated_at = ? WHERE account_id = ?",
                            (ts, target_account_id),
                        )
                    else:
                        self._send_error(400, "UNKNOWN_PERMISSION_ACTION", f"Hành động phân quyền không hợp lệ: {action_type}")
                        return

                    append_audit_log(
                        conn,
                        event_code="PERMISSION_CHANGE" if action_type != "REQUIRE_PIN_RESET" else "PIN_RESET_REQUIRED",
                        action_label=f"Cập nhật quyền kho ({action_type}) cho tài khoản {target_email or target_account_id}",
                        actor_id=actor["accountId"],
                        actor_email=actor["email"],
                        actor_name=actor["name"],
                        actor_role=actor["role"],
                        target_item_id=target_account_id,
                        target_type="ADMIN_ACCOUNT",
                        target_label=target_email or target_account_id,
                        status="SUCCESS",
                        details={"action": action_type},
                    )
                    conn.commit()
                    self._send_ok({"updated": True, "targetAccountId": target_account_id, "action": action_type})
                    return

                # =========================================================
                # 4. FILE UPLOAD & BLOB MANAGEMENT (Phần VII.1, XIII.3)
                # =========================================================
                if path == "/api/v1/files/upload-session":
                    # Create upload session or cancel an active upload session
                    sub_op = str(body.get("operation") or "CREATE").strip().upper()
                    ts = now_iso()
                    if sub_op == "CANCEL":
                        sess_id = str(body.get("sessionId") or "").strip()
                        conn.execute(
                            "UPDATE storage_upload_sessions SET status = 'CANCELLED', updated_at = ? WHERE id = ?",
                            (ts, sess_id),
                        )
                        conn.commit()
                        self._send_ok({"cancelled": True, "sessionId": sess_id})
                        return

                    fname = str(body.get("fileName") or "").strip()
                    fsize = int(body.get("expectedSizeBytes") or 0)
                    if not fname or fsize <= 0:
                        self._send_error(400, "INVALID_UPLOAD_SESSION", "Tên tệp và kích thước phải hợp lệ.")
                        return
                    if fsize > MAX_FILE_SIZE_BYTES:
                        self._send_error(
                            413,
                            "FILE_TOO_LARGE",
                            f"Tệp '{fname}' ({fsize} bytes) vượt quá giới hạn tối đa 15 MB ({MAX_FILE_SIZE_BYTES} bytes).",
                        )
                        return
                    _, ext = os.path.splitext(fname)
                    us_id = f"upsess-{uuid.uuid4().hex[:14]}"
                    conn.execute(
                        """
                        INSERT INTO storage_upload_sessions (
                            id, account_id, account_name, file_name, file_ext,
                            expected_size_bytes, expected_checksum, status, created_at, updated_at
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, 'UPLOADING', ?, ?)
                        """,
                        (
                            us_id,
                            actor["accountId"],
                            actor["name"],
                            fname,
                            ext.lstrip(".").upper() or "BIN",
                            fsize,
                            body.get("expectedChecksum"),
                            ts,
                            ts,
                        ),
                    )
                    conn.commit()
                    self._send_ok({"uploadSessionId": us_id, "maxFileBytes": MAX_FILE_SIZE_BYTES}, 201)
                    return

                if path == "/api/v1/files/upload":
                    file_name = str(body.get("fileName") or "").strip()
                    b64_data = str(body.get("base64Data") or "").strip()
                    mime_type = str(body.get("mimeType") or "application/octet-stream").strip()
                    logical_path = body.get("logicalPath")
                    notes = body.get("notes")
                    upload_session_id = body.get("uploadSessionId")

                    if not file_name or not b64_data:
                        self._send_error(400, "MISSING_FILE_DATA", "Thiếu tên tệp hoặc dữ liệu nhị phân BLOB.")
                        return

                    try:
                        blob_bytes = base64.b64decode(b64_data, validate=True)
                    except Exception:
                        self._send_error(400, "INVALID_BASE64", "Dữ liệu tệp tải lên không đúng định dạng nhị phân Base64.")
                        return

                    # Strict backend check of actual decoded byte size (cannot be bypassed by spoofing claimed size)
                    if len(blob_bytes) > MAX_FILE_SIZE_BYTES:
                        append_audit_log(
                            conn,
                            event_code="FILE_UPLOAD",
                            action_label=f"Từ chối tải tệp '{file_name}' vượt quá giới hạn 15 MB ({len(blob_bytes)} bytes)",
                            actor_id=actor["accountId"],
                            actor_email=actor["email"],
                            actor_name=actor["name"],
                            actor_role=actor["role"],
                            status="FAILED",
                            error_reason="FILE_EXCEEDS_15MB_LIMIT",
                            details={"actualBytes": len(blob_bytes), "maxBytes": MAX_FILE_SIZE_BYTES},
                        )
                        conn.commit()
                        self._send_error(
                            413,
                            "FILE_EXCEEDS_15MB_LIMIT",
                            f"Backend từ chối: Kích thước thực tế của tệp ({len(blob_bytes)} bytes) vượt quá giới hạn 15 MB ({MAX_FILE_SIZE_BYTES} bytes).",
                        )
                        return

                    res = upload_file_blob_internal(
                        conn=conn,
                        account_id=actor["accountId"],
                        account_name=actor["name"],
                        account_email=actor["email"],
                        file_name=file_name,
                        blob_bytes=blob_bytes,
                        mime_type=mime_type,
                        logical_path=logical_path,
                        notes=notes,
                        session_id=upload_session_id,
                    )
                    self._send_ok({"file": res}, 201)
                    return

                # =========================================================
                # 5. VERSION RESTORE, TRASH, IMPORT, BACKUP & TAXONOMY
                # =========================================================
                if path == "/api/v1/versions/restore":
                    item_id = str(body.get("itemId") or "").strip()
                    ver_num = int(body.get("versionNumber") or 0)
                    notes = body.get("notes")
                    if not item_id or ver_num <= 0:
                        self._send_error(400, "INVALID_RESTORE_INPUT", "Thiếu mã mục hoặc số phiên bản cần khôi phục.")
                        return
                    res = restore_item_version_internal(
                        conn, item_id, ver_num, actor["accountId"], actor["name"], actor["email"], notes
                    )
                    self._send_ok(res)
                    return

                if path == "/api/v1/trash/move":
                    item_ids = body.get("itemIds") or ([body["itemId"]] if body.get("itemId") else [])
                    reason = body.get("reason")
                    res = move_to_trash_internal(
                        conn, [str(x) for x in item_ids], actor["accountId"], actor["name"], actor["email"], reason
                    )
                    self._send_ok(res)
                    return

                if path == "/api/v1/trash/restore":
                    item_ids = body.get("itemIds") or ([body["itemId"]] if body.get("itemId") else [])
                    res = restore_from_trash_internal(
                        conn, [str(x) for x in item_ids], actor["accountId"], actor["name"], actor["email"]
                    )
                    self._send_ok(res)
                    return

                if path == "/api/v1/trash/permanent-delete":
                    item_ids = body.get("itemIds") or ([body["itemId"]] if body.get("itemId") else [])
                    phrase = str(body.get("confirmationPhrase") or "")
                    res = permanent_delete_internal(
                        conn, [str(x) for x in item_ids], actor["accountId"], actor["name"], actor["email"], phrase
                    )
                    self._send_ok(res)
                    return

                if path == "/api/v1/import/run":
                    source_records = body.get("sourceRecords")
                    resume_job_id = body.get("resumeJobId")
                    simulate_fail = body.get("simulateFailSourceIds")
                    job = run_initial_import_job(
                        conn,
                        triggered_by_id=actor["accountId"],
                        triggered_by_name=actor["name"],
                        source_records=source_records,
                        resume_job_id=resume_job_id,
                        simulate_fail_source_ids=simulate_fail,
                    )
                    self._send_ok({"job": job})
                    return

                if path == "/api/v1/archive/retry-failed":
                    rows = conn.execute(
                        "SELECT * FROM storage_archive_events WHERE status IN ('PENDING', 'FAILED') ORDER BY created_at ASC"
                    ).fetchall()
                    retried = 0
                    succeeded = 0
                    for r in rows:
                        retried += 1
                        ok_p, _ = process_archive_event_record(conn, dict(r))
                        if ok_p:
                            succeeded += 1
                    conn.commit()
                    self._send_ok({"retriedCount": retried, "succeededCount": succeeded})
                    return

                if path == "/api/v1/backup/create":
                    label = body.get("label")
                    meta = create_consistent_backup(conn, actor["accountId"], actor["name"], label)
                    self._send_ok({"backup": meta}, 201)
                    return

                if path == "/api/v1/backup/restore":
                    backup_id = str(body.get("backupId") or "").strip()
                    if not backup_id:
                        self._send_error(400, "MISSING_BACKUP_ID", "Vui lòng chọn bản sao lưu cần khôi phục.")
                        return
                    conn.close()
                    res = restore_from_consistent_backup(backup_id, actor["accountId"], actor["name"])
                    self._send_ok(res)
                    return

                if path == "/api/v1/taxonomy/manage":
                    # Admin can add, edit, or group vocational fields & specialties dynamically without changing code (Phần II.4)
                    op = str(body.get("operation") or "").strip().upper()
                    ts = now_iso()
                    if op == "ADD_FIELD":
                        code = str(body.get("code") or "").strip().upper()
                        name = str(body.get("name") or "").strip()
                        group_name = str(body.get("groupName") or f"Khối ngành {name}").strip()
                        desc = str(body.get("description") or "").strip()
                        if not code or not name:
                            self._send_error(400, "INVALID_FIELD", "Vui lòng nhập mã và tên lĩnh vực.")
                            return
                        fid = f"field-{code.lower()}-{uuid.uuid4().hex[:4]}"
                        order = int(conn.execute("SELECT COUNT(*) AS cnt FROM vocational_taxonomy_fields").fetchone()["cnt"]) + 1
                        conn.execute(
                            """
                            INSERT INTO vocational_taxonomy_fields (id, code, name, group_name, description, is_active, display_order, created_at, updated_at)
                            VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
                            """,
                            (fid, code, name, group_name, desc, order, ts, ts),
                        )
                        conn.commit()
                        self._send_ok({"fieldId": fid, "code": code, "name": name}, 201)
                        return

                    if op == "ADD_SPECIALTY":
                        field_id = str(body.get("fieldId") or "").strip()
                        name = str(body.get("name") or "").strip()
                        major_name = str(body.get("majorName") or name).strip()
                        f_row = conn.execute("SELECT * FROM vocational_taxonomy_fields WHERE id = ? OR code = ?", (field_id, field_id)).fetchone()
                        if not f_row or not name:
                            self._send_error(400, "INVALID_SPECIALTY", "Vui lòng chọn lĩnh vực hợp lệ và nhập tên chuyên ngành.")
                            return
                        f_dict = dict(f_row)
                        sid = f"spec-{f_dict['code'].lower()}-{uuid.uuid4().hex[:6]}"
                        slug = f"{f_dict['code'].lower()}-{uuid.uuid4().hex[:6]}"
                        default_modules = [
                            "Lộ trình tiếng Anh", "Từ vựng chuyên môn", "Thuật ngữ", "Cách phát âm",
                            "Mẫu câu", "Hội thoại nghề nghiệp", "Tình huống thực tế", "Bài đọc",
                            "Bài nghe", "Bài viết", "Bài nói", "Bài tập", "Bài kiểm tra",
                            "Nội dung chuẩn bị thực tập", "Nội dung chuẩn bị phỏng vấn", "Nội dung giao tiếp tại nơi làm việc"
                        ]
                        situations = body.get("sampleSituations") or [
                            f"Đọc hiểu quy trình, tiêu chuẩn kỹ thuật và tài liệu chuyên ngành {name}",
                            f"Giao tiếp thực hành và báo cáo công việc chuyên ngành {name}",
                            f"Phỏng vấn tuyển dụng và viết email chuyên môn ngành {name}",
                        ]
                        order = int(conn.execute("SELECT COUNT(*) AS cnt FROM vocational_taxonomy_specialties WHERE field_id = ?", (f_dict["id"],)).fetchone()["cnt"]) + 1
                        conn.execute(
                            """
                            INSERT INTO vocational_taxonomy_specialties (
                                id, field_id, field_code, slug, name, major_name,
                                target_groups_json, sample_situations_json, content_modules_json,
                                is_reviewed, is_active, display_order, created_at, updated_at
                            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 1, ?, ?, ?)
                            """,
                            (
                                sid,
                                f_dict["id"],
                                f_dict["code"],
                                slug,
                                name,
                                major_name,
                                json.dumps(body.get("targetGroups") or ["GROUP_A", "GROUP_B", "GROUP_C", "GROUP_D", "GROUP_E"], ensure_ascii=False),
                                json.dumps(situations, ensure_ascii=False),
                                json.dumps(default_modules, ensure_ascii=False),
                                order,
                                ts,
                                ts,
                            ),
                        )
                        conn.commit()
                        self._send_ok({"specialtyId": sid, "name": name, "fieldCode": f_dict["code"]}, 201)
                        return

                    if op == "UPDATE_SPECIALTY":
                        spec_id = str(body.get("specialtyId") or "").strip()
                        name = str(body.get("name") or "").strip()
                        if not spec_id or not name:
                            self._send_error(400, "INVALID_UPDATE", "Thiếu ID hoặc tên chuyên ngành.")
                            return
                        conn.execute(
                            "UPDATE vocational_taxonomy_specialties SET name = ?, updated_at = ? WHERE id = ?",
                            (name, ts, spec_id),
                        )
                        conn.commit()
                        self._send_ok({"updated": True, "specialtyId": spec_id, "name": name})
                        return

                self._send_error(404, "ROUTE_NOT_FOUND", f"Không tìm thấy đường dẫn POST Storage API: {path}")
            except ValueError as ve:
                self._send_error(400, "VALIDATION_ERROR", str(ve))
            except Exception as exc:
                self._send_error(500, "INTERNAL_STORAGE_ERROR", str(exc))
            finally:
                try:
                    conn.close()
                except Exception:
                    pass


def run_server() -> None:
    init_storage_db()
    server = http.server.ThreadingHTTPServer(("127.0.0.1", PORT), StorageHTTPRequestHandler)
    print(f"[WORD BRIDGE SOURCE STORAGE] Independent SQLite BLOB Service listening on http://127.0.0.1:{PORT}")
    print(f"[WORD BRIDGE SOURCE STORAGE] Database path: {DB_PATH}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    if len(sys.argv) > 1 and sys.argv[1] == "--init-only":
        init_storage_db()
        print("Initialized SQLite BLOB database successfully at:", DB_PATH)
    else:
        run_server()
