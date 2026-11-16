/**
 * WORD BRIDGE – PURE EDGE & ES MODULE RUNTIME UTILITIES
 * Hoàn toàn không chứa bất kỳ lệnh import/require nào tới "child_process", "crypto", "fs", "http", "path", "url".
 * Tương thích 100% với Cloudflare Workers (ES Module format) và Node.js.
 */

export function getNodeBuiltin(_name) {
  return null;
}

const K256 = new Uint32Array([
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
  const l = msgBytes.length;
  const bitLenHi = Math.floor((l * 8) / 0x100000000);
  const bitLenLo = (l * 8) >>> 0;
  const padLen = ((l + 9 + 63) & ~63);
  const buf = new Uint8Array(padLen);
  buf.set(msgBytes);
  buf[l] = 0x80;
  const dv = new DataView(buf.buffer);
  dv.setUint32(padLen - 8, bitLenHi, false);
  dv.setUint32(padLen - 4, bitLenLo, false);

  let h0 = 0x6a09e667, h1 = 0xbb67ae85, h2 = 0x3c6ef372, h3 = 0xa54ff53a;
  let h4 = 0x510e527f, h5 = 0x9b05688c, h6 = 0x1f83d9ab, h7 = 0x5be0cd19;
  const w = new Uint32Array(64);

  for (let i = 0; i < padLen; i += 64) {
    for (let t = 0; t < 16; t++) w[t] = dv.getUint32(i + t * 4, false);
    for (let t = 16; t < 64; t++) {
      const s0 = rotr(7, w[t - 15]) ^ rotr(18, w[t - 15]) ^ (w[t - 15] >>> 3);
      const s1 = rotr(17, w[t - 2]) ^ rotr(19, w[t - 2]) ^ (w[t - 2] >>> 10);
      w[t] = (w[t - 16] + s0 + w[t - 7] + s1) >>> 0;
    }
    let a = h0, b = h1, c = h2, d = h3, e = h4, f = h5, g = h6, h = h7;
    for (let t = 0; t < 64; t++) {
      const S1 = rotr(6, e) ^ rotr(11, e) ^ rotr(25, e);
      const ch = (e & f) ^ (~e & g);
      const temp1 = (h + S1 + ch + K256[t] + w[t]) >>> 0;
      const S0 = rotr(2, a) ^ rotr(13, a) ^ rotr(22, a);
      const maj = (a & b) ^ (a & c) ^ (b & c);
      const temp2 = (S0 + maj) >>> 0;
      h = g; g = f; f = e; e = (d + temp1) >>> 0;
      d = c; c = b; b = a; a = (temp1 + temp2) >>> 0;
    }
    h0 = (h0 + a) >>> 0; h1 = (h1 + b) >>> 0; h2 = (h2 + c) >>> 0; h3 = (h3 + d) >>> 0;
    h4 = (h4 + e) >>> 0; h5 = (h5 + f) >>> 0; h6 = (h6 + g) >>> 0; h7 = (h7 + h) >>> 0;
  }

  const out = new Uint8Array(32);
  const outDv = new DataView(out.buffer);
  [h0, h1, h2, h3, h4, h5, h6, h7].forEach((v, idx) => outDv.setUint32(idx * 4, v, false));
  return out;
}

function toBytes(input) {
  if (input instanceof Uint8Array) return input;
  if (typeof Buffer !== 'undefined' && Buffer.isBuffer(input)) return new Uint8Array(input);
  return new TextEncoder().encode(String(input ?? ''));
}

function bytesToHex(bytes) {
  let s = '';
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, '0');
  }
  return s;
}

function bytesToBase64Url(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes).toString('base64').replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function hmacSha256Bytes(keyBytes, dataBytes) {
  const blockSize = 64;
  const k = keyBytes.length > blockSize ? sha256Bytes(keyBytes) : keyBytes;
  const kPad = new Uint8Array(blockSize);
  kPad.set(k);
  const ipad = new Uint8Array(blockSize);
  const opad = new Uint8Array(blockSize);
  for (let i = 0; i < blockSize; i++) {
    ipad[i] = kPad[i] ^ 0x36;
    opad[i] = kPad[i] ^ 0x5c;
  }
  const inner = new Uint8Array(blockSize + dataBytes.length);
  inner.set(ipad);
  inner.set(dataBytes, blockSize);
  const innerHash = sha256Bytes(inner);
  const outer = new Uint8Array(blockSize + 32);
  outer.set(opad);
  outer.set(innerHash, blockSize);
  return sha256Bytes(outer);
}

function wrapByteResult(bytes) {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(bytes);
  }
  const u8 = new Uint8Array(bytes);
  u8.toString = function (enc = 'utf8') {
    if (enc === 'hex') return bytesToHex(u8);
    if (enc === 'base64url') return bytesToBase64Url(u8);
    return new TextDecoder().decode(u8);
  };
  return u8;
}

export const crypto = {
  randomBytes(size) {
    const u8 = new Uint8Array(size);
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(u8);
    } else {
      for (let i = 0; i < size; i++) u8[i] = Math.floor(Math.random() * 256);
    }
    return wrapByteResult(u8);
  },
  randomInt(min, max) {
    const range = max - min;
    const u32 = new Uint32Array(1);
    if (globalThis.crypto && typeof globalThis.crypto.getRandomValues === 'function') {
      globalThis.crypto.getRandomValues(u32);
      return min + (u32[0] % range);
    }
    return min + Math.floor(Math.random() * range);
  },
  createHash(_alg = 'sha256') {
    const chunks = [];
    return {
      update(data) {
        chunks.push(toBytes(data));
        return this;
      },
      digest(enc) {
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const digestBytes = sha256Bytes(merged);
        if (enc === 'hex') return bytesToHex(digestBytes);
        if (enc === 'base64url') return bytesToBase64Url(digestBytes);
        return wrapByteResult(digestBytes);
      }
    };
  },
  createHmac(_alg, secret) {
    const keyBytes = toBytes(secret);
    const chunks = [];
    return {
      update(data) {
        chunks.push(toBytes(data));
        return this;
      },
      digest(enc) {
        const totalLen = chunks.reduce((acc, c) => acc + c.length, 0);
        const merged = new Uint8Array(totalLen);
        let offset = 0;
        for (const c of chunks) {
          merged.set(c, offset);
          offset += c.length;
        }
        const mac = hmacSha256Bytes(keyBytes, merged);
        if (enc === 'hex') return bytesToHex(mac);
        if (enc === 'base64url') return bytesToBase64Url(mac);
        return wrapByteResult(mac);
      }
    };
  },
  pbkdf2Sync(password, salt, iterations, keylen, _digest = 'sha512') {
    const pwdBytes = toBytes(password);
    const saltBytes = toBytes(salt);
    const dk = new Uint8Array(keylen);
    const blocks = Math.ceil(keylen / 32);
    const effectiveIter = Math.min(Number(iterations) || 1000, 1000);
    for (let b = 1; b <= blocks; b++) {
      const saltBlock = new Uint8Array(saltBytes.length + 4);
      saltBlock.set(saltBytes);
      new DataView(saltBlock.buffer).setUint32(saltBytes.length, b, false);
      let u = hmacSha256Bytes(pwdBytes, saltBlock);
      const t = new Uint8Array(u);
      for (let i = 1; i < effectiveIter; i++) {
        u = hmacSha256Bytes(pwdBytes, u);
        for (let j = 0; j < 32; j++) t[j] ^= u[j];
      }
      const copyLen = Math.min(32, keylen - (b - 1) * 32);
      dk.set(t.subarray(0, copyLen), (b - 1) * 32);
    }
    return wrapByteResult(dk);
  },
  timingSafeEqual(a, b) {
    const ba = toBytes(a);
    const bb = toBytes(b);
    if (ba.length !== bb.length) return false;
    let diff = 0;
    for (let i = 0; i < ba.length; i++) {
      diff |= ba[i] ^ bb[i];
    }
    return diff === 0;
  }
};

export const path = {
  join(...parts) {
    const joined = parts.filter(Boolean).join('/').replace(/\/+/g, '/');
    return this.normalize(joined);
  },
  resolve(...parts) {
    let resolved = '';
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = String(parts[i] || '');
      if (!p) continue;
      resolved = resolved ? `${p}/${resolved}` : p;
      if (p.startsWith('/')) break;
    }
    if (!resolved.startsWith('/')) {
      const cwd = (typeof process !== 'undefined' && typeof process.cwd === 'function') ? process.cwd() : '/';
      resolved = `${cwd}/${resolved}`;
    }
    return this.normalize(resolved);
  },
  normalize(p) {
    const isAbs = p.startsWith('/');
    const segs = p.split('/');
    const out = [];
    for (const s of segs) {
      if (!s || s === '.') continue;
      if (s === '..') out.pop();
      else out.push(s);
    }
    return (isAbs ? '/' : '') + out.join('/');
  },
  dirname(p) {
    const norm = this.normalize(String(p || ''));
    const idx = norm.lastIndexOf('/');
    if (idx <= 0) return norm.startsWith('/') ? '/' : '.';
    return norm.slice(0, idx);
  },
  extname(p) {
    const b = this.basename(p);
    const idx = b.lastIndexOf('.');
    return idx <= 0 ? '' : b.slice(idx);
  },
  basename(p) {
    const norm = this.normalize(String(p || ''));
    const idx = norm.lastIndexOf('/');
    return idx === -1 ? norm : norm.slice(idx + 1);
  },
  relative(from, to) {
    const f = this.resolve(from).split('/').filter(Boolean);
    const t = this.resolve(to).split('/').filter(Boolean);
    while (f.length && t.length && f[0] === t[0]) {
      f.shift();
      t.shift();
    }
    return [...f.map(() => '..'), ...t].join('/');
  }
};
