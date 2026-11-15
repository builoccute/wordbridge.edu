'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { STORAGE_ROOT_PATH, STORAGE_BACKUP_PATH } = require('../config/env');

/**
 * MÁY CHỦ STORAGE ĐỘC LẬP CỦA WORD BRIDGE (PHỤ LỤC A - MỤC A1, A6, A7, A9)
 * - Tuyệt đối KHÔNG sử dụng Cloudflare R2.
 * - Lưu trữ nhị phân trực tiếp trên phân vùng máy chủ Storage riêng;
 *   tuyệt đối KHÔNG lưu tệp lớn dưới dạng Base64 trong Database và KHÔNG dùng RAM/localStorage làm nơi lưu trữ lâu dài.
 * - Kiểm soát truy cập chéo tài khoản (cross-account) và truy cập chéo tổ chức (cross-organization).
 */

const ALLOWED_MIME_TYPES = {
  'application/pdf': { ext: '.pdf', magic: [0x25, 0x50, 0x44, 0x46] },
  'image/png': { ext: '.png', magic: [0x89, 0x50, 0x4E, 0x47] },
  'image/jpeg': { ext: '.jpg', magic: [0xFF, 0xD8, 0xFF] },
  'image/webp': { ext: '.webp', magic: [0x52, 0x49, 0x46, 0x46] },
  'audio/mpeg': { ext: '.mp3', magic: null },
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
    fs.mkdirSync(this.baseDir, { recursive: true });
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
    const spec = ALLOWED_MIME_TYPES[declaredMime];
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
    fs.mkdirSync(path.dirname(fullPath), { recursive: true });
    // Lưu trực tiếp dạng nhị phân xuống máy chủ Storage riêng, quyền 0600 (không thực thi)
    fs.writeFileSync(fullPath, buffer, { mode: 0o600 });
    return {
      file_id: id,
      storage_key: storageKey,
      mime_type: mimeType,
      size_bytes: check.size_bytes,
      checksum_sha256: check.checksum_sha256
    };
  }

  readFileAuthorized({ storageKey, requesterUser, fileRecord, db }) {
    if (!storageKey || storageKey.includes('..')) {
      throw new Error('Đường dẫn tệp không hợp lệ.');
    }
    if (fileRecord && fileRecord.access_scope !== 'public') {
      if (!requesterUser) {
        const err = new Error('Tệp riêng tư yêu cầu đăng nhập để truy cập.');
        err.statusCode = 401;
        throw err;
      }
      const isPlatformAdmin = ['super_admin', 'system_admin'].includes(requesterUser.role);
      if (!isPlatformAdmin) {
        if (fileRecord.owner_type === 'personal' && fileRecord.owner_user_id !== requesterUser.id) {
          const err = new Error('Từ chối truy cập chéo tài khoản (Cross-Account Protection): Bạn không có quyền đọc tệp riêng tư của cá nhân khác.');
          err.statusCode = 403;
          throw err;
        }
        if (fileRecord.owner_type === 'organization' && db) {
          const member = db.get(
            `SELECT * FROM org_members WHERE org_id = ? AND user_id = ? AND status = 'active'`,
            [fileRecord.owner_org_id, requesterUser.id]
          );
          if (!member) {
            const err = new Error('Từ chối truy cập chéo tổ chức (Cross-Organization Protection): Bạn không thuộc tổ chức sở hữu tệp này.');
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

  backupStorageSnapshot(backupDir = STORAGE_BACKUP_PATH) {
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifestPath = path.join(backupDir, `wordbridge-storage-snapshot-${stamp}.json`);
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
    fs.writeFileSync(manifestPath, JSON.stringify({ created_at: new Date().toISOString(), files: filesList }, null, 2));
    return {
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
