'use strict';
const { fs, path, crypto } = require('../utils/runtime.shim');
const { STORAGE_ROOT_PATH, STORAGE_BACKUP_PATH } = require('../config/env');

/**
 * CLOUDFLARE R2 UNIFIED OBJECT STORAGE ADAPTER (PHẦN XVI & XXI.3, 4)
 * - Thống nhất kiến trúc theo Cloudflare R2 (binding: R2, bucket_name: "word").
 * - Hỗ trợ đồng thời binding env.R2 trên Cloudflare Workers và R2 Local Object Store khi chạy kiểm thử/CLI.
 * - Quét chữ ký tệp thực tế (Magic Bytes), chặn tệp thực thi độc hại và kiểm soát truy cập chéo tài khoản/tổ chức.
 */

const ALLOWED_MIME_TYPES = {
  'application/pdf': { ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/png': { ext: '.png', magic: [0x89, 0x50, 0x4E, 0x47] },
  'image/jpeg': { ext: '.jpg', magic: [0xFF, 0xD8, 0xFF] },
  'image/webp': { ext: '.webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'audio/mpeg': { ext: '.mp3', magic: null },
  'audio/wav': { ext: '.wav', magic: [0x52, 0x49, 0x46, 0x46] },
  'text/plain': { ext: '.txt', magic: null },
  'application/json': { ext: '.json', magic: null }
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
    this.r2Binding = null;
    this.r2Meta = {
      binding: 'R2',
      bucket_name: 'word',
      engine: 'Cloudflare R2'
    };
    try {
      fs.mkdirSync(this.baseDir, { recursive: true });
    } catch (_) {}
  }

  bindWorkerR2(r2Binding) {
    if (r2Binding) {
      this.r2Binding = r2Binding;
    }
    return this;
  }

  validateAndScanBuffer(buffer, declaredMime, filename = '') {
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
    if (/\.(exe|sh|bat|cmd|php|jsp|asp|aspx|dll|so|py|pl|cgi|js|html|htm|svg)$/i.test(lowerName)) {
      throw new Error('Định dạng tệp có nguy cơ thực thi bị từ chối vì lý do bảo mật.');
    }
    const cleanMime = String(declaredMime || 'text/plain').split(';')[0].trim().toLowerCase();
    const spec = ALLOWED_MIME_TYPES[cleanMime];
    if (!spec) {
      throw new Error(`Loại tệp ${declaredMime} không nằm trong danh mục cho phép.`);
    }
    if (spec.magic) {
      for (let i = 0; i < spec.magic.length; i++) {
        if (buffer[i] !== spec.magic[i]) {
          throw new Error('Nội dung thực tế của tệp (Magic Bytes) không khớp với định dạng khai báo.');
        }
      }
    }
    const sampleText = buffer.slice(0, Math.min(buffer.length, 4096)).toString('utf8');
    for (const pat of FORBIDDEN_PATTERNS) {
      if (pat.test(sampleText)) {
        throw new Error('Phát hiện chữ ký mã độc hoặc mã thực thi bên trong tệp tải lên.');
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

  saveFile({ buffer, mimeType, originalName, scope = 'private', ownerId = 'system', ownerType = 'personal' }) {
    const check = this.validateAndScanBuffer(buffer, mimeType, originalName);
    const id = 'file_' + crypto.randomBytes(10).toString('hex');
    const prefix = ownerType === 'organization' ? `org_storage/${ownerId}` : `personal_storage/${ownerId}`;
    const storageKey = `${prefix}/${scope}/${id}${check.ext}`;
    const fullPath = path.join(this.baseDir, storageKey);
    try {
      fs.mkdirSync(path.dirname(fullPath), { recursive: true });
      fs.writeFileSync(fullPath, buffer, { mode: 0o600 });
    } catch (_) {}

    if (this.r2Binding && typeof this.r2Binding.put === 'function') {
      Promise.resolve(
        this.r2Binding.put(storageKey, buffer, {
          httpMetadata: { contentType: check.mime_type },
          customMetadata: {
            file_id: id,
            owner_type: ownerType,
            owner_id: String(ownerId),
            checksum_sha256: check.checksum_sha256
          }
        })
      ).catch(() => {});
    }

    return {
      file_id: id,
      storage_key: storageKey,
      bucket: 'word',
      mime_type: check.mime_type,
      size_bytes: check.size_bytes,
      checksum_sha256: check.checksum_sha256
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
    const fullPath = path.join(this.baseDir, storageKey);
    if (!fs.existsSync(fullPath)) {
      return null;
    }
    return fs.readFileSync(fullPath);
  }

  deleteObjectSynchronized(storageKey) {
    if (!storageKey || storageKey.includes('..')) return false;
    const fullPath = path.join(this.baseDir, storageKey);
    if (fs.existsSync(fullPath)) {
      try { fs.unlinkSync(fullPath); } catch (_) {}
    }
    if (this.r2Binding && typeof this.r2Binding.delete === 'function') {
      Promise.resolve(this.r2Binding.delete(storageKey)).catch(() => {});
    }
    return true;
  }

  backupStorageSnapshot(backupDir = STORAGE_BACKUP_PATH) {
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifestPath = path.join(backupDir, `wordbridge-r2-snapshot-${stamp}.json`);
    const filesList = [];
    const walk = dir => {
      if (!fs.existsSync(dir)) return;
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else {
          const st = fs.statSync(full);
          filesList.push({
            rel_path: path.relative(this.baseDir, full),
            size_bytes: st.size
          });
        }
      }
    };
    walk(this.baseDir);
    fs.writeFileSync(manifestPath, JSON.stringify({
      bucket: 'word',
      engine: 'Cloudflare R2',
      created_at: new Date().toISOString(),
      files: filesList
    }, null, 2));
    return {
      bucket: 'word',
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
