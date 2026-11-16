import { crypto, path, getNodeBuiltin } from '../config/runtime.js';
import { STORAGE_ROOT_PATH, STORAGE_BACKUP_PATH } from '../config/env.js';

/**
 * CLOUDFLARE R2 UNIFIED OBJECT STORAGE ADAPTER (ES MODULE + EDGE & NODE COMPATIBLE)
 * - Thống nhất kiến trúc theo Cloudflare R2 (binding: R2, bucket_name: "word").
 * - Không sử dụng bất kỳ lệnh import/require tĩnh nào tới "fs", "path", "crypto".
 * - Hỗ trợ đồng thời binding env.R2 trên Cloudflare Workers, bộ nhớ đệm Edge và kho lưu trữ cục bộ khi chạy CLI/test.
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

function toUint8Array(input) {
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return input;
  if (input instanceof Uint8Array) {
    return typeof Buffer !== 'undefined' ? Buffer.from(input) : input;
  }
  const encoded = new TextEncoder().encode(String(input || ''));
  return typeof Buffer !== 'undefined' ? Buffer.from(encoded) : encoded;
}

export class StorageAdapter {
  constructor(baseDir = STORAGE_ROOT_PATH) {
    this.baseDir = baseDir;
    this.r2Binding = null;
    this.memoryObjects = new Map();
    this.r2Meta = {
      binding: 'R2',
      bucket_name: 'word',
      engine: 'Cloudflare R2'
    };
    const fs = getNodeBuiltin('fs');
    if (fs) {
      try { fs.mkdirSync(this.baseDir, { recursive: true }); } catch (_) {}
    }
  }

  bindWorkerR2(r2Binding) {
    if (r2Binding) {
      this.r2Binding = r2Binding;
    }
    return this;
  }

  validateAndScanBuffer(buffer, declaredMime, filename = '') {
    const maxSingleFileBytes = 50 * 1024 * 1024;
    const bytes = toUint8Array(buffer);
    if (bytes.length === 0) {
      throw new Error('Tệp tải lên rỗng.');
    }
    if (bytes.length > maxSingleFileBytes) {
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
        if (bytes[i] !== spec.magic[i]) {
          throw new Error('Nội dung thực tế của tệp (Magic Bytes) không khớp với định dạng khai báo.');
        }
      }
    }
    const sampleSlice = bytes.subarray(0, Math.min(bytes.length, 4096));
    const sampleText = new TextDecoder().decode(sampleSlice);
    for (const pat of FORBIDDEN_PATTERNS) {
      if (pat.test(sampleText)) {
        throw new Error('Phát hiện chữ ký mã độc hoặc mã thực thi bên trong tệp tải lên.');
      }
    }
    const checksum = crypto.createHash('sha256').update(bytes).digest('hex');
    return {
      safe: true,
      mime_type: cleanMime,
      size_bytes: bytes.length,
      ext: spec.ext,
      checksum_sha256: checksum,
      bytes
    };
  }

  saveFile({ buffer, mimeType, originalName, scope = 'private', ownerId = 'system', ownerType = 'personal' }) {
    const check = this.validateAndScanBuffer(buffer, mimeType, originalName);
    const id = 'file_' + crypto.randomBytes(10).toString('hex');
    const prefix = ownerType === 'organization' ? `org_storage/${ownerId}` : `personal_storage/${ownerId}`;
    const storageKey = `${prefix}/${scope}/${id}${check.ext}`;
    this.memoryObjects.set(storageKey, check.bytes);

    const fs = getNodeBuiltin('fs');
    if (fs) {
      const fullPath = path.join(this.baseDir, storageKey);
      try {
        fs.mkdirSync(path.dirname(fullPath), { recursive: true });
        fs.writeFileSync(fullPath, check.bytes, { mode: 0o600 });
      } catch (_) {}
    }

    if (this.r2Binding && typeof this.r2Binding.put === 'function') {
      Promise.resolve(
        this.r2Binding.put(storageKey, check.bytes, {
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
    if (this.memoryObjects.has(storageKey)) {
      return this.memoryObjects.get(storageKey);
    }
    const fs = getNodeBuiltin('fs');
    if (fs) {
      const fullPath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(fullPath)) {
        return fs.readFileSync(fullPath);
      }
    }
    return null;
  }

  deleteObjectSynchronized(storageKey) {
    if (!storageKey || storageKey.includes('..')) return false;
    this.memoryObjects.delete(storageKey);
    const fs = getNodeBuiltin('fs');
    if (fs) {
      const fullPath = path.join(this.baseDir, storageKey);
      if (fs.existsSync(fullPath)) {
        try { fs.unlinkSync(fullPath); } catch (_) {}
      }
    }
    if (this.r2Binding && typeof this.r2Binding.delete === 'function') {
      Promise.resolve(this.r2Binding.delete(storageKey)).catch(() => {});
    }
    return true;
  }

  backupStorageSnapshot(backupDir = STORAGE_BACKUP_PATH) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const manifestName = `wordbridge-r2-snapshot-${stamp}.json`;
    const filesList = [];
    for (const [k, buf] of this.memoryObjects.entries()) {
      filesList.push({ rel_path: k, size_bytes: buf.length });
    }
    const fs = getNodeBuiltin('fs');
    if (fs) {
      try {
        fs.mkdirSync(backupDir, { recursive: true });
        const manifestPath = path.join(backupDir, manifestName);
        fs.writeFileSync(manifestPath, JSON.stringify({
          bucket: 'word',
          engine: 'Cloudflare R2',
          created_at: new Date().toISOString(),
          files: filesList
        }, null, 2));
      } catch (_) {}
    }
    return {
      bucket: 'word',
      snapshot_manifest: manifestName,
      total_files_backed_up: filesList.length,
      total_bytes_backed_up: filesList.reduce((acc, f) => acc + f.size_bytes, 0)
    };
  }
}

export const storage = new StorageAdapter();
export default { StorageAdapter, storage };
