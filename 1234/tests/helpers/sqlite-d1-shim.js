/**
 * Real SQLite3-backed Cloudflare D1 & in-memory R2 test harness.
 */
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';

export class SQLiteD1Database {
  constructor(dbPath = ':memory:') {
    const bridgePath = path.resolve(process.cwd(), 'tests/helpers/sqlite_bridge.py');
    this.proc = spawn('python3', [bridgePath, dbPath], { stdio: ['pipe', 'pipe', 'pipe'] });
    this.rl = readline.createInterface({ input: this.proc.stdout });
    this.queue = [];
    this.rl.on('line', (line) => {
      const next = this.queue.shift();
      if (!next) return;
      try {
        const parsed = JSON.parse(line);
        if (parsed.ok) next.resolve(parsed);
        else next.reject(new Error(parsed.error));
      } catch (err) {
        next.reject(err);
      }
    });
  }

  _send(payload) {
    return new Promise((resolve, reject) => {
      this.queue.push({ resolve, reject });
      this.proc.stdin.write(JSON.stringify(payload) + '\n');
    });
  }

  async exec(sql) {
    return this._send({ op: 'exec', sql });
  }

  prepare(sql) {
    const db = this;
    return {
      _params: [],
      bind(...params) {
        this._params = params.map((p) => (p === undefined ? null : p));
        return this;
      },
      async all() {
        const res = await db._send({ op: 'all', sql, params: this._params });
        return { results: res.results };
      },
      async first() {
        const res = await db._send({ op: 'first', sql, params: this._params });
        return res.result;
      },
      async run() {
        const res = await db._send({ op: 'run', sql, params: this._params });
        return { success: true, meta: res.meta };
      },
    };
  }

  async applyAllMigrations(migrationsDir = path.resolve(process.cwd(), 'database/migrations')) {
    const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
    for (const file of files) {
      const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
      await this.exec(sql);
    }
    return files;
  }

  close() {
    this.rl.close();
    this.proc.kill();
  }
}

export class MemoryR2Bucket {
  constructor() {
    this.store = new Map();
  }
  async put(key, body, options = {}) {
    this.store.set(key, {
      key,
      body,
      httpMetadata: options.httpMetadata || {},
      customMetadata: options.customMetadata || {},
    });
  }
  async get(key) {
    return this.store.get(key) || null;
  }
  async list({ prefix = '', limit = 100 } = {}) {
    const objects = [];
    for (const [k, v] of this.store.entries()) {
      if (k.startsWith(prefix)) objects.push({ key: k, customMetadata: v.customMetadata });
      if (objects.length >= limit) break;
    }
    return { objects };
  }
}

export async function createTestEnv(extraEnv = {}) {
  const db = new SQLiteD1Database(':memory:');
  try { await db.applyAllMigrations(); } catch (err) { db.close(); throw err; }
  const r2 = new MemoryR2Bucket();
  return {
    DB: db,
    R2: r2,
    APP_BASE_URL: 'https://wordbridge.io.vn',
    EMAIL_PROVIDER: 'unconfigured',
    LEARNER_MEET_PROVIDER: 'unconfigured',
    EXPOSE_TEST_TOKENS: 'true',
    TOKEN_PEPPER: 'test-pepper',
    ...extraEnv,
  };
}
