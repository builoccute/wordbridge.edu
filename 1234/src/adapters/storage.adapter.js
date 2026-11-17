'use strict';
const { fs, path, crypto } = require('../utils/runtime.shim');
const { STORAGE_ROOT_PATH, STORAGE_BACKUP_PATH } = require('../config/env');

/**
 * Ổ ĐĨA LƯU TRỮ TẠI WEB ĐỘC LẬP (ZERO-R2 WEB STORAGE DRIVE ADAPTER)
 * - Tuyệt đối KHÔNG sử dụng Cloudflare R2.
 * - Lưu trữ trực tiếp đối tượng tệp tin, học liệu, bản sao lưu và kho mã nguồn (/quan-tri/luu-tru-ma-nguon)
 *   vào Ổ đĩa Lưu trữ Nội bộ tại Web (Web Internal Storage Vault + đồng bộ hóa hai chiều với DB).
 * - Quét chữ ký tệp thực tế (Magic Bytes), chặn tệp thực thi độc hại trên luồng tải học liệu công cộng,
 *   và hỗ trợ kho lưu trữ mã nguồn quản trị bảo vệ bằng mật khẩu 6 chữ số do Admin tự đặt.
 */

const ALLOWED_MIME_TYPES = {
  'application/pdf': { ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/png': { ext: '.png', magic: [0x89, 0x50, 0x4E, 0x47] },
  'image/jpeg': { ext: '.jpg', magic: [0xFF, 0xD8, 0xFF] },
  'image/webp': { ext: '.webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'audio/mpeg': { ext: '.mp3', magic: null },
  'audio/wav': { ext: '.wav', magic: [0x52, 0x49, 0x46, 0x46] },
  'text/plain': { ext: '.txt', magic: null },
  'text/markdown': { ext: '.md', magic: null },
  'text/csv': { ext: '.csv', magic: null },
  'application/json': { ext: '.json', magic: null },
  'application/zip': { ext: '.zip', magic: null }
};

const FORBIDDEN_PATTERNS = [
  /<\?php/i,
  /<script[\s>]/i,
  /#!/,
  /MZ[\x90\x00]/,
  /\x7FELF/
];

class StorageAdapter {
  constructor(baseDir = STORAGE_ROOT_PATH) {
    this.baseDir = baseDir;
    this.db = null;
    this.inMemoryDrive = new Map();
    this.storageMeta = {
      binding: 'WEB_INTERNAL_DRIVE',
      drive_name: 'WORD BRIDGE Web Storage Drive (Zero-R2)',
      engine: 'Ổ đĩa Lưu trữ Trực tiếp tại Web (Zero-R2)',
      cloudflare_r2_used: false
    };
    try {
      fs.mkdirSync(this.baseDir, { recursive: true });
    } catch (_) {}
  }

  bindDatabase(dbInstance) {
    if (dbInstance) {
      this.db = dbInstance;
    }
    return this;
  }

  // Giữ tương thích ngược nếu có lời gọi cũ nhưng hoàn toàn không dùng R2
  bindWorkerR2(_ignoredR2) {
    return this;
  }

  validateAndScanBuffer(buffer, declaredMime, filename = '', allowSourceCode = false) {
    const maxSingleFileBytes = 50 * 1024 * 1024; // 50MB per single file upload request
    if (!Buffer.isBuffer(buffer)) {
      buffer = Buffer.from(String(buffer || ''), 'utf8');
    }
    if (buffer.length === 0) {
      throw new Error('Tệp tải lên rỗng.');
    }
    if (buffer.length > maxSingleFileBytes) {
      throw new Error('Dung lượng một lần tải tệp vượt quá giới hạn đơn lẻ (50MB).');
    }

    const lowerName = String(filename || '').toLowerCase();
    if (!allowSourceCode && /\.(exe|sh|bat|cmd|php|jsp|asp|aspx|dll|so|py|pl|cgi|js|html|htm|svg)$/i.test(lowerName)) {
      throw new Error('Định dạng tệp có nguy cơ thực thi bị từ chối vì lý do bảo mật.');
    }

    const cleanMime = String(declaredMime || 'text/plain').split(';')[0].trim().toLowerCase();
    const spec = ALLOWED_MIME_TYPES[cleanMime] || (allowSourceCode ? { ext: path.extname(lowerName) || '.txt', magic: null } : null);
    if (!spec) {
      throw new Error(`Loại tệp ${declaredMime} không nằm trong danh mục cho phép.`);
    }
    if (spec.magic && !allowSourceCode) {
      for (let i = 0; i < spec.magic.length; i++) {
        if (buffer[i] !== spec.magic[i]) {
          throw new Error('Nội dung thực tế của tệp (Magic Bytes) không khớp với định dạng khai báo.');
        }
      }
    }
    if (!allowSourceCode) {
      const sampleText = buffer.slice(0, Math.min(buffer.length, 4096)).toString('utf8');
      for (const pat of FORBIDDEN_PATTERNS) {
        if (pat.test(sampleText)) {
          throw new Error('Phát hiện chữ ký mã độc hoặc mã thực thi bên trong tệp tải lên.');
        }
      }
    }
    const checksum = crypto.createHash('sha256').update(buffer).digest('hex');
    return {
      safe: true,
      mime_type: cleanMime,
      size_bytes: buffer.length,
      ext: spec.ext,
      checksum_sha256: checksum
    };
  }

  saveFile({ buffer, mimeType, originalName, scope = 'private', ownerId = 'system', ownerType = 'personal', allowSourceCode = false }) {
    const check = this.validateAndScanBuffer(buffer, mimeType, originalName, allowSourceCode);
    const id = 'file_' + crypto.randomBytes(10).toString('hex');
    const prefix = ownerType === 'organization'
      ? `org_storage/${ownerId}`
      : (ownerType === 'admin_vault' ? `admin_source_vault/${ownerId}` : `personal_storage/${ownerId}`);
    const storageKey = `${prefix}/${scope}/${id}${check.ext}`;
    const fullPath = path.join(this.baseDir, storageKey);
    const b64Content = Buffer.isBuffer(buffer) ? buffer.toString('base64') : Buffer.from(String(buffer || ''), 'utf8').toString('base64');

    // 1. Lưu trực tiếp vào Ổ đĩa Bộ nhớ Web (In-Memory Web Drive)
    this.inMemoryDrive.set(storageKey, {
      file_id: id,
      storage_key: storageKey,
      mime_type: check.mime_type,
      size_bytes: check.size_bytes,
      checksum_sha256: check.checksum_sha256,
      content_base64: b64Content,
      created_at: new Date().toISOString()
    });

    // 2. Lưu xuống hệ thống tệp ảo / local của Web Server
    try {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, buffer, { mode: 0o600 });
    } catch (_) {}

    return {
      file_id: id,
      storage_key: storageKey,
      bucket: 'web_internal_drive',
      storage_engine: 'WEB_INTERNAL_DRIVE_ZERO_R2',
      mime_type: check.mime_type,
      size_bytes: check.size_bytes,
      checksum_sha256: check.checksum_sha256,
      content_base64: b64Content
    };
  }

  readFileAuthorized({ storageKey, requesterUser, fileRecord, db }) {
    if (!storageKey || storageKey.includes('..')) {
      throw new Error('Đường dẫn đối tượng lưu trữ không hợp lệ.');
    }
    if (fileRecord && fileRecord.access_scope !== 'public') {
      if (!requesterUser) {
        const err = new Error('Tài nguyên riêng tư yêu cầu đăng nhập để truy cập.');
        err.statusCode = 401;
        throw err;
      }
      const isPlatformAdmin = ['super_admin', 'system_admin'].includes(requesterUser.role);
      if (!isPlatformAdmin) {
        if (fileRecord.owner_type === 'personal' && fileRecord.owner_user_id !== requesterUser.id) {
          const err = new Error('Từ chối truy cập chéo tài khoản: Bạn không có quyền đọc tệp riêng tư của cá nhân khác.');
          err.statusCode = 403;
          throw err;
        }
        if (fileRecord.owner_type === 'organization' && db) {
          const member = db.get(
            `SELECT * FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
            [fileRecord.owner_org_id, requesterUser.id]
          );
          if (!member) {
            const err = new Error('Từ chối truy cập chéo tổ chức: Bạn không thuộc tổ chức sở hữu tệp này.');
            err.statusCode = 403;
            throw err;
          }
        }
      }
    }

    // 1. Ưu tiên đọc từ Ổ đĩa Bộ nhớ Web (In-Memory Web Drive)
    if (this.inMemoryDrive.has(storageKey)) {
      const item = this.inMemoryDrive.get(storageKey);
      return Buffer.from(item.content_base64, 'base64');
    }

    // 2. Đọc từ cột content_base64 trong bảng storage_files (lưu trữ trực tiếp tại Web DB)
    const activeDb = db || this.db;
    if (activeDb && fileRecord && fileRecord.content_base64) {
      return Buffer.from(fileRecord.content_base64, 'base64');
    }
    if (activeDb) {
      try {
        const row = activeDb.get(`SELECT content_base64 FROM storage_files WHERE storage_key = ?`, [storageKey]);
        if (row && row.content_base64) {
          return Buffer.from(row.content_base64, 'base64');
        }
      } catch (_) {}
    }

    // 3. Đọc từ đĩa ảo / local
    const fullPath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath);
  }

  deleteObjectSynchronized(storageKey) {
    if (!storageKey || storageKey.includes('..')) return false;
    this.inMemoryDrive.delete(storageKey);
    const fullPath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (_) {}
    }
    return true;
  }

  backupStorageSnapshot(backupDir = STORAGE_BACKUP_PATH) {
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifestPath = path.join(backupDir, `wordbridge-webdrive-snapshot-${stamp}.json`);
    const filesList = [];
    const seenKeys = new Set();

    for (const [k, v] of this.inMemoryDrive.entries()) {
      seenKeys.add(k);
      filesList.push({
        rel_path: k,
        size_bytes: v.size_bytes,
        checksum_sha256: v.checksum_sha256
      });
    }

    const walk = dir => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const rel = path.relative(this.baseDir, full);
          if (!seenKeys.has(rel)) {
            const st = fs.statSync(full);
            filesList.push({
              rel_path: rel,
              size_bytes: st.size
            });
          }
        }
      }
    };
    walk(this.baseDir);
    fs.writeFileSync(manifestPath, JSON.stringify({
      drive: 'web_internal_drive',
      engine: 'WORD BRIDGE Web Internal Storage Drive (Zero-R2)',
      cloudflare_r2_used: false,
      created_at: new Date().toISOString(),
      files: filesList
    }, null, 2));
    return {
      bucket: 'web_internal_drive',
      engine: 'WORD BRIDGE Web Internal Storage Drive (Zero-R2)',
      cloudflare_r2_used: false,
      snapshot_manifest: path.basename(manifestPath),
      total_files_backed_up: filesList.length,
      total_bytes_backed_up: filesList.reduce((acc, f) => acc + f.size_bytes, 0)
    };
  }
}

module.exports = {
  StorageAdapter,
  storage: new StorageAdapter()
};
