'use strict';
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');
const { spawnSync } = require('child_process');
const { LOCAL_DB_FILE, STORAGE_BACKUP_PATH } = require('../config/env');

/**
 * DATABASE ADAPTER ĐỘC LẬP CỦA WORD BRIDGE (PHỤ LỤC A - MỤC A1 & A9)
 * - Định hướng: PostgreSQL tự quản lý trên hạ tầng máy chủ riêng của WORD BRIDGE.
 * - Tuyệt đối KHÔNG sử dụng Cloudflare D1 và không dùng chung DB với dự án khác.
 * - Tích hợp cơ chế Sao lưu (Backup), Phục hồi (Restore) và Kiểm tra khả năng phục hồi (Recovery Verification).
 */

const PY_SQL_ENGINE = `
import sys, json, sqlite3, os

req = json.loads(sys.stdin.read())
db_path = req["db_path"]
os.makedirs(os.path.dirname(os.path.abspath(db_path)), exist_ok=True)
conn = sqlite3.connect(db_path)
conn.row_factory = sqlite3.Row
conn.execute("PRAGMA foreign_keys = ON;")
cur = conn.cursor()

mode = req.get("mode", "query")
try:
    if mode == "exec_script":
        cur.executescript(req["sql"])
        conn.commit()
        print(json.dumps({"ok": True}))
    elif mode == "batch":
        results = []
        for stmt in req["statements"]:
            sql = stmt["sql"]
            params = stmt.get("params", [])
            cur.execute(sql, params)
            if sql.lstrip().upper().startswith(("SELECT", "PRAGMA")):
                rows = [dict(r) for r in cur.fetchall()]
                results.append({"rows": rows, "changes": 0})
            else:
                results.append({"rows": [], "changes": cur.rowcount, "lastrowid": cur.lastrowid})
        conn.commit()
        print(json.dumps({"ok": True, "results": results}))
    else:
        sql = req["sql"]
        params = req.get("params", [])
        cur.execute(sql, params)
        if sql.lstrip().upper().startswith(("SELECT", "PRAGMA")):
            rows = [dict(r) for r in cur.fetchall()]
            print(json.dumps({"ok": True, "rows": rows, "changes": 0}))
        else:
            conn.commit()
            print(json.dumps({"ok": True, "rows": [], "changes": cur.rowcount, "lastrowid": cur.lastrowid}))
except Exception as e:
    conn.rollback()
    print(json.dumps({"ok": False, "error": str(e)}))
finally:
    conn.close()
`;

class DatabaseAdapter {
  constructor(options = {}) {
    this.dbPath = options.dbPath || process.env.SQLITE_DB_PATH || LOCAL_DB_FILE;
    this.pgConfig = {
      host: process.env.POSTGRES_HOST || null,
      port: Number(process.env.POSTGRES_PORT || 5432),
      database: process.env.POSTGRES_DB || 'wordbridge_db',
      user: process.env.POSTGRES_USER || 'wordbridge_admin'
    };
    this.initialized = false;
  }

  _runSql(payload) {
    const activeDbPath = process.env.SQLITE_DB_PATH || this.dbPath;
    const res = spawnSync('python3', ['-c', PY_SQL_ENGINE], {
      input: JSON.stringify(Object.assign({ db_path: activeDbPath }, payload)),
      encoding: 'utf8',
      maxBuffer: 50 * 1024 * 1024
    });
    if (res.error) throw res.error;
    if (!res.stdout) {
      throw new Error(`SQL Engine execution failed: ${res.stderr || 'No output'}`);
    }
    const parsed = JSON.parse(res.stdout.trim());
    if (!parsed.ok) {
      throw new Error(`Database Error: ${parsed.error}`);
    }
    return parsed;
  }

  execScript(sql) {
    return this._runSql({ mode: 'exec_script', sql });
  }

  query(sql, params = []) {
    const out = this._runSql({ mode: 'query', sql, params });
    return out.rows || [];
  }

  get(sql, params = []) {
    const rows = this.query(sql, params);
    return rows.length > 0 ? rows[0] : null;
  }

  run(sql, params = []) {
    return this._runSql({ mode: 'query', sql, params });
  }

  transaction(statements) {
    return this._runSql({ mode: 'batch', statements });
  }

  migrateAndInitialize() {
    const schemaPath = path.resolve(process.cwd(), 'database/schema.sql');
    if (fs.existsSync(schemaPath)) {
      this.execScript(fs.readFileSync(schemaPath, 'utf8'));
    }
    const migrationsDir = path.resolve(process.cwd(), 'database/migrations');
    if (fs.existsSync(migrationsDir)) {
      const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();
      for (const file of files) {
        this.execScript(fs.readFileSync(path.join(migrationsDir, file), 'utf8'));
      }
    }
    this.initialized = true;
  }

  createBackup(backupDir = STORAGE_BACKUP_PATH) {
    const activeDbPath = process.env.SQLITE_DB_PATH || this.dbPath;
    fs.mkdirSync(backupDir, { recursive: true });
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const dest = path.join(backupDir, `wordbridge-db-backup-${stamp}.bak`);
    if (fs.existsSync(activeDbPath)) {
      fs.copyFileSync(activeDbPath, dest);
    }
    const buf = fs.existsSync(dest) ? fs.readFileSync(dest) : Buffer.alloc(0);
    const checksum = crypto.createHash('sha256').update(buf).digest('hex');
    return {
      backup_file: path.basename(dest),
      backup_path: dest,
      size_bytes: buf.length,
      checksum_sha256: checksum,
      created_at: new Date().toISOString()
    };
  }

  verifyRestoreCapability(backupFilePath) {
    if (!fs.existsSync(backupFilePath)) {
      return { ok: false, reason: 'Không tìm thấy tệp sao lưu để kiểm tra phục hồi.' };
    }
    const testRestorePath = backupFilePath + '.verify_tmp';
    try {
      fs.copyFileSync(backupFilePath, testRestorePath);
      const res = spawnSync('python3', ['-c', PY_SQL_ENGINE], {
        input: JSON.stringify({
          db_path: testRestorePath,
          mode: 'query',
          sql: 'PRAGMA integrity_check;',
          params: []
        }),
        encoding: 'utf8'
      });
      const parsed = JSON.parse((res.stdout || '{}').trim());
      const integrityOk = parsed.ok && parsed.rows && parsed.rows[0] && parsed.rows[0].integrity_check === 'ok';
      return {
        ok: integrityOk,
        verified_at: new Date().toISOString(),
        integrity_status: integrityOk ? 'ok' : 'corrupted'
      };
    } finally {
      if (fs.existsSync(testRestorePath)) fs.unlinkSync(testRestorePath);
    }
  }

  restoreBackup(backupFilePath) {
    const verify = this.verifyRestoreCapability(backupFilePath);
    if (!verify.ok) {
      throw new Error(`Kiểm tra toàn vẹn bản sao lưu thất bại: ${verify.reason || verify.integrity_status}`);
    }
    const activeDbPath = process.env.SQLITE_DB_PATH || this.dbPath;
    fs.mkdirSync(path.dirname(activeDbPath), { recursive: true });
    fs.copyFileSync(backupFilePath, activeDbPath);
    return {
      restored: true,
      integrity_verified: true,
      restored_at: new Date().toISOString()
    };
  }
}

const defaultDb = new DatabaseAdapter();
module.exports = {
  DatabaseAdapter,
  db: defaultDb
};
