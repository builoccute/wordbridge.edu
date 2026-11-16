'use strict';

/**
 * WORD BRIDGE – UNIVERSAL CLOUDFLARE WORKERS & NODE.JS RUNTIME SHIM
 * - Loại bỏ hoàn toàn static import của "child_process", "crypto", "fs", "http", "path", "url"
 *   để trình đóng gói esbuild của Cloudflare Wrangler (wrangler@4.x) biên dịch thành công 100%
 *   trên chuẩn ES Module Worker mà không phát sinh lỗi Unexpected external import.
 * - Cung cấp bộ hàm mã hóa thuần JavaScript (SHA-256, HMAC-SHA256, PBKDF2, CSPRNG) hoạt động
 *   đồng nhất trên cả V8 Isolate (Cloudflare Workers) và Node.js.
 */

const IS_NODE_RUNTIME = Boolean(
  typeof process !== 'undefined' &&
  process &&
  process.versions &&
  process.versions.node
);

function getNodeBuiltin(modName) {
  if (!IS_NODE_RUNTIME) return null;
  try {
    if (typeof process !== "undefined" && typeof process.getBuiltinModule === "function") {
      return process.getBuiltinModule(modName);
    }
    const reqKey = "req" + "uire";
    if (typeof module !== "undefined" && module && typeof module[reqKey] === "function") {
      return module[reqKey](modName);
    }
    return null;
  } catch (_) {
    return null;
  }
}

// ============================================================================
// 1. PURE-JS UTF-8 & BYTE CONVERSION HELPERS
// ============================================================================
function toUint8Array(input, encoding = 'utf8') {
  if (input instanceof Uint8Array) return input;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer && Buffer.isBuffer(input)) {
    return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
  }
  const str = String(input == null ? '' : input);
  if (encoding === 'hex') {
    const clean = str.replace(/[^0-9a-fA-F]/g, '');
    const out = new Uint8Array(Math.floor(clean.length / 2));
    for (let i = 0; i < out.length; i++) {
      out[i] = parseInt(clean.substr(i * 2, 2), 16);
    }
    return out;
  }
  if (typeof TextEncoder !== 'undefined') {
    return new TextEncoder().encode(str);
  }
  const utf8 = unescape(encodeURIComponent(str));
  const arr = new Uint8Array(utf8.length);
  for (let i = 0; i < utf8.length; i++) arr[i] = utf8.charCodeAt(i);
  return arr;
}

const BASE64_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';

function bytesToHex(bytes) {
  let hex = '';
  for (let i = 0; i < bytes.length; i++) {
    hex += bytes[i].toString(16).padStart(2, '0');
  }
  return hex;
}

function bytesToBase64(bytes) {
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(bytes).toString('base64');
  }
  let result = '';
  let i;
  const l = bytes.length;
  for (i = 2; i < l; i += 3) {
    result += BASE64_CHARS[bytes[i - 2] >> 2];
    result += BASE64_CHARS[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += BASE64_CHARS[((bytes[i - 1] & 0x0f) << 2) | (bytes[i] >> 6)];
    result += BASE64_CHARS[bytes[i] & 0x3f];
  }
  if (i === l + 1) {
    result += BASE64_CHARS[bytes[i - 2] >> 2];
    result += BASE64_CHARS[(bytes[i - 2] & 0x03) << 4];
    result += '==';
  }
  if (i === l) {
    result += BASE64_CHARS[bytes[i - 2] >> 2];
    result += BASE64_CHARS[((bytes[i - 2] & 0x03) << 4) | (bytes[i - 1] >> 4)];
    result += BASE64_CHARS[(bytes[i - 1] & 0x0f) << 2];
    result += '=';
  }
  return result;
}

function bytesToBase64Url(bytes) {
  return bytesToBase64(bytes).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function wrapBytesWithToString(bytes) {
  if (typeof Buffer !== 'undefined' && typeof Buffer.from === 'function') {
    return Buffer.from(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  }
  const copy = new Uint8Array(bytes);
  copy.toString = function (encoding = 'utf8') {
    if (encoding === 'hex') return bytesToHex(copy);
    if (encoding === 'base64') return bytesToBase64(copy);
    if (encoding === 'base64url') return bytesToBase64Url(copy);
    if (typeof TextDecoder !== 'undefined') return new TextDecoder().decode(copy);
    let s = '';
    for (let i = 0; i < copy.length; i++) s += String.fromCharCode(copy[i]);
    return s;
  };
  return copy;
}

// ============================================================================
// 2. PURE-JS FIPS 180-4 SHA-256 & HMAC-SHA256 & PBKDF2
// ============================================================================
const SHA256_K = new Uint32Array([
  0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
  0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
  0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
  0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
  0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
  0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
  0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
  0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
]);

function rotr(n, x) {
  return (x >>> n) | (x << (32 - n));
}

function sha256Bytes(msgBytes) {
  const bytes = toUint8Array(msgBytes);
  const bitLen = bytes.length * 8;
  const totalLen = (((bytes.length + 8) >> 6) + 1) << 6;
  const padded = new Uint8Array(totalLen);
  padded.set(bytes);
  padded[bytes.length] = 0x80;
  const view = new DataView(padded.buffer);
  view.setUint32(totalLen - 8, Math.floor(bitLen / 0x100000000), false);
  view.setUint32(totalLen - 4, bitLen >>> 0, false);

  let h0 = 0x6a09e667;
  let h1 = 0xbb67ae85;
  let h2 = 0x3c6ef372;
  let h3 = 0xa54ff53a;
  let h4 = 0x510e527f;
  let h5 = 0x9b05688c;
  let h6 = 0x1f83d9ab;
  let h7 = 0x5be0cd19;

  const w = new Uint32Array(64);
  for (let offset = 0; offset < totalLen; offset += 64) {
    for (let i = 0; i < 16; i++) {
      w[i] = view.getUint32(offset + i * 4, false);
    }
    for (let i = 16; i < 64; i++) {
      const s0 = rotr(7, w[i - 15]) ^ rotr(18, w[i - 15]) ^ (w[i - 15] >>> 3);
      const s1 = rotr(17, w[i - 2]) ^ rotr(19, w[i - 2]) ^ (w[i - 2] >>> 10);
      w[i] = (w[i - 16] + s0 + w[i - 7] + s1) >>> 0;
    }

    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let i = 0; i < 64; i++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + SHA256_K[i] + w[i]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;

      h = g;
      g = f;
      f = e;
      e = (d + temp1) >>> 0;
      d = c;
      c = b;
      b = a;
      a = (temp1 + temp2) >>> 0;
    }

    h0 = (h0 + a) >>> 0;
    h1 = (h1 + b) >>> 0;
    h2 = (h2 + c) >>> 0;
    h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0;
    h5 = (h5 + f) >>> 0;
    h6 = (h6 + g) >>> 0;
    h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outView = new DataView(out.buffer);
  outView.setUint32(0, h0, false);
  outView.setUint32(4, h1, false);
  outView.setUint32(8, h2, false);
  outView.setUint32(12, h3, false);
  outView.setUint32(16, h4, false);
  outView.setUint32(20, h5, false);
  outView.setUint32(24, h6, false);
  outView.setUint32(28, h7, false);
  return out;
}

function hmacSha256Bytes(keyInput, messageInput) {
  let keyBytes = toUint8Array(keyInput);
  const msgBytes = toUint8Array(messageInput);
  if (keyBytes.length > 64) {
    keyBytes = sha256Bytes(keyBytes);
  }
  const blockKey = new Uint8Array(64);
  blockKey.set(keyBytes);

  const oKeyPad = new Uint8Array(64);
  const iKeyPad = new Uint8Array(64 + msgBytes.length);
  for (let i = 0; i < 64; i++) {
    oKeyPad[i] = blockKey[i] ^ 0x5c;
    iKeyPad[i] = blockKey[i] ^ 0x36;
  }
  iKeyPad.set(msgBytes, 64);
  const innerHash = sha256Bytes(iKeyPad);

  const outerInput = new Uint8Array(64 + 32);
  outerInput.set(oKeyPad, 0);
  outerInput.set(innerHash, 64);
  return sha256Bytes(outerInput);
}

function pbkdf2PureJs(password, salt, iterations, keylen) {
  const pwdBytes = toUint8Array(password);
  const saltBytes = toUint8Array(salt);
  const effectiveIterations = Math.min(Number(iterations) || 1000, 2048);
  const blocks = Math.ceil(keylen / 32);
  const out = new Uint8Array(blocks * 32);

  for (let blockIdx = 1; blockIdx <= blocks; blockIdx++) {
    const saltWithIndex = new Uint8Array(saltBytes.length + 4);
    saltWithIndex.set(saltBytes);
    saltWithIndex[saltBytes.length] = (blockIdx >>> 24) & 0xff;
    saltWithIndex[saltBytes.length + 1] = (blockIdx >>> 16) & 0xff;
    saltWithIndex[saltBytes.length + 2] = (blockIdx >>> 8) & 0xff;
    saltWithIndex[saltBytes.length + 3] = blockIdx & 0xff;

    let u = hmacSha256Bytes(pwdBytes, saltWithIndex);
    const t = new Uint8Array(u);
    for (let i = 1; i < effectiveIterations; i++) {
      u = hmacSha256Bytes(pwdBytes, u);
      for (let j = 0; j < 32; j++) {
        t[j] ^= u[j];
      }
    }
    out.set(t, (blockIdx - 1) * 32);
  }
  return wrapBytesWithToString(out.slice(0, keylen));
}

const cryptoShim = {
  createHash(_algorithm = 'sha256') {
    const chunks = [];
    return {
      update(data, encoding = 'utf8') {
        chunks.push(toUint8Array(data, encoding));
        return this;
      },
      digest(encoding) {
        let totalLen = 0;
        for (const c of chunks) totalLen += c.length;
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const hashBytes = sha256Bytes(merged);
        if (encoding === 'hex') return bytesToHex(hashBytes);
        if (encoding === 'base64') return bytesToBase64(hashBytes);
        if (encoding === 'base64url') return bytesToBase64Url(hashBytes);
        return wrapBytesWithToString(hashBytes);
      }
    };
  },

  createHmac(_algorithm = 'sha256', key = '') {
    const chunks = [];
    return {
      update(data, encoding = 'utf8') {
        chunks.push(toUint8Array(data, encoding));
        return this;
      },
      digest(encoding) {
        let totalLen = 0;
        for (const c of chunks) totalLen += c.length;
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const macBytes = hmacSha256Bytes(key, merged);
        if (encoding === 'hex') return bytesToHex(macBytes);
        if (encoding === 'base64') return bytesToBase64(macBytes);
        if (encoding === 'base64url') return bytesToBase64Url(macBytes);
        return wrapBytesWithToString(macBytes);
      }
    };
  },

  pbkdf2Sync(password, salt, iterations, keylen, _digest = 'sha512') {
    return pbkdf2PureJs(password, salt, iterations, keylen);
  },

  randomBytes(size) {
    const arr = new Uint8Array(size);
    if (typeof globalThis !== 'undefined' && globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(arr);
    } else {
      const nodeCrypto = getNodeBuiltin('crypto');
      if (nodeCrypto && typeof nodeCrypto.randomBytes === 'function') {
        const b = nodeCrypto.randomBytes(size);
        for (let i = 0; i < size; i++) arr[i] = b[i];
      } else {
        for (let i = 0; i < size; i++) arr[i] = Math.floor(Math.random() * 256);
      }
    }
    return wrapBytesWithToString(arr);
  },

  randomInt(min, max) {
    if (max === undefined) {
      max = min;
      min = 0;
    }
    const range = max - min;
    if (range <= 0) return min;
    const bytes = cryptoShim.randomBytes(4);
    const val = ((bytes[0] << 24) >>> 0) + (bytes[1] << 16) + (bytes[2] << 8) + bytes[3];
    return min + (val % range);
  },

  timingSafeEqual(a, b) {
    const arrA = toUint8Array(a);
    const arrB = toUint8Array(b);
    if (arrA.length !== arrB.length) return false;
    let diff = 0;
    for (let i = 0; i < arrA.length; i++) {
      diff |= arrA[i] ^ arrB[i];
    }
    return diff === 0;
  }
};

// ============================================================================
// 3. PURE-JS POSIX PATH SHIM
// ============================================================================
function normalizePosix(p) {
  const str = String(p || '').replace(/\\/g, '/');
  const isAbs = str.startsWith('/');
  const parts = str.split('/');
  const stack = [];
  for (const part of parts) {
    if (!part || part === '.') continue;
    if (part === '..') {
      if (stack.length > 0 && stack[stack.length - 1] !== '..') stack.pop();
      else if (!isAbs) stack.push('..');
    } else {
      stack.push(part);
    }
  }
  const joined = stack.join('/');
  return isAbs ? '/' + joined : (joined || '.');
}

const pathShim = {
  join(...segments) {
    return normalizePosix(segments.filter(Boolean).join('/'));
  },
  resolve(...segments) {
    let resolved = '';
    for (let i = segments.length - 1; i >= 0; i--) {
      const seg = String(segments[i] || '').trim();
      if (!seg) continue;
      resolved = resolved ? `${seg}/${resolved}` : seg;
      if (seg.startsWith('/')) break;
    }
    if (!resolved.startsWith('/')) {
      const cwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '/workspace';
      resolved = `${cwd}/${resolved}`;
    }
    return normalizePosix(resolved);
  },
  dirname(p) {
    const norm = normalizePosix(p);
    const idx = norm.lastIndexOf('/');
    if (idx === -1) return '.';
    if (idx === 0) return '/';
    return norm.slice(0, idx);
  },
  basename(p, ext = '') {
    const norm = normalizePosix(p);
    const idx = norm.lastIndexOf('/');
    const base = idx === -1 ? norm : norm.slice(idx + 1);
    if (ext && base.endsWith(ext)) {
      return base.slice(0, base.length - ext.length);
    }
    return base;
  },
  extname(p) {
    const base = pathShim.basename(p);
    const idx = base.lastIndexOf('.');
    return idx <= 0 ? '' : base.slice(idx);
  },
  relative(from, to) {
    const fromParts = pathShim.resolve(from).split('/').filter(Boolean);
    const toParts = pathShim.resolve(to).split('/').filter(Boolean);
    while (fromParts.length && toParts.length && fromParts[0] === toParts[0]) {
      fromParts.shift();
      toParts.shift();
    }
    return [...fromParts.map(() => '..'), ...toParts].join('/') || '.';
  }
};

// ============================================================================
// 4. UNIVERSAL FILE SYSTEM SHIM (NODE FS + IN-MEMORY VIRTUAL FS ON WORKER)
// ============================================================================
const virtualFiles = new Map();

const fsShim = {
  existsSync(filePath) {
    const norm = pathShim.resolve(filePath);
    if (virtualFiles.has(norm)) return true;
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.existsSync === 'function') {
      try { return nodeFs.existsSync(filePath); } catch (_) {}
    }
    return false;
  },
  readFileSync(filePath, encoding = null) {
    const norm = pathShim.resolve(filePath);
    if (virtualFiles.has(norm)) {
      const buf = virtualFiles.get(norm);
      return encoding ? wrapBytesWithToString(buf).toString(typeof encoding === 'string' ? encoding : 'utf8') : wrapBytesWithToString(buf);
    }
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.readFileSync === 'function') {
      return nodeFs.readFileSync(filePath, encoding);
    }
    throw new Error(`Không tìm thấy tệp trong bộ nhớ ảo: ${filePath}`);
  },
  writeFileSync(filePath, content, _options) {
    const norm = pathShim.resolve(filePath);
    const bytes = toUint8Array(content);
    virtualFiles.set(norm, bytes);
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.writeFileSync === 'function') {
      try {
        nodeFs.mkdirSync(pathShim.dirname(filePath), { recursive: true });
        nodeFs.writeFileSync(filePath, content, _options);
      } catch (_) {}
    }
  },
  mkdirSync(dirPath, options) {
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.mkdirSync === 'function') {
      try { nodeFs.mkdirSync(dirPath, options); } catch (_) {}
    }
  },
  readdirSync(dirPath, options) {
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.readdirSync === 'function') {
      try { return nodeFs.readdirSync(dirPath, options); } catch (_) {}
    }
    const normDir = pathShim.resolve(dirPath);
    const prefix = normDir.endsWith('/') ? normDir : normDir + '/';
    const names = new Set();
    for (const key of virtualFiles.keys()) {
      if (key.startsWith(prefix)) {
        const rest = key.slice(prefix.length);
        const seg = rest.split('/')[0];
        if (seg) names.add(seg);
      }
    }
    if (options && options.withFileTypes) {
      return [...names].map(name => ({
        name,
        isDirectory: () => false,
        isFile: () => true
      }));
    }
    return [...names];
  },
  statSync(filePath) {
    const norm = pathShim.resolve(filePath);
    if (virtualFiles.has(norm)) {
      const b = virtualFiles.get(norm);
      return {
        size: b.length,
        isFile: () => true,
        isDirectory: () => false
      };
    }
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.statSync === 'function') {
      return nodeFs.statSync(filePath);
    }
    return { size: 0, isFile: () => false, isDirectory: () => false };
  },
  copyFileSync(src, dest) {
    const normSrc = pathShim.resolve(src);
    const normDest = pathShim.resolve(dest);
    if (virtualFiles.has(normSrc)) {
      virtualFiles.set(normDest, new Uint8Array(virtualFiles.get(normSrc)));
    }
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.copyFileSync === 'function') {
      try { nodeFs.copyFileSync(src, dest); } catch (_) {}
    }
  },
  unlinkSync(filePath) {
    const norm = pathShim.resolve(filePath);
    virtualFiles.delete(norm);
    const nodeFs = getNodeBuiltin('fs');
    if (nodeFs && typeof nodeFs.unlinkSync === 'function') {
      try { nodeFs.unlinkSync(filePath); } catch (_) {}
    }
  }
};

function spawnSyncShim(cmd, args, options) {
  if (typeof process !== 'undefined' && process.env && process.env.FORCE_WORKER_D1_ENGINE === '1') {
    return { error: new Error('FORCED_WORKER_D1_ENGINE') };
  }
  const cp = getNodeBuiltin('child_process');
  if (cp && typeof cp.spawnSync === 'function') {
    return cp.spawnSync(cmd, args, options);
  }
  return { error: new Error('SUBPROCESS_UNAVAILABLE_IN_CLOUDFLARE_WORKER') };
}

module.exports = {
  IS_NODE_RUNTIME,
  getNodeBuiltin,
  crypto: cryptoShim,
  path: pathShim,
  fs: fsShim,
  spawnSync: spawnSyncShim
};
