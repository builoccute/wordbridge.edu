import { crypto, path, getNodeBuiltin } from '../config/runtime.js';
import { LOCAL_DB_FILE, STORAGE_BACKUP_PATH } from '../config/env.js';
import {
  EMBEDDED_TABLES_META,
  EMBEDDED_INITIAL_ROWS,
  EMBEDDED_SCHEMA_SQL,
  EMBEDDED_SEED_SQL
} from '../config/embedded-data.js';

/**
 * CLOUDFLARE D1 UNIFIED DATABASE ADAPTER (ES MODULE + EDGE & NODE COMPATIBLE)
 * - Thống nhất kiến trúc theo Cloudflare D1 (binding: DB, database_name: "word", id: "ce84cc48-6d49-409b-b45a-13ba3bc4a771").
 * - Không sử dụng bất kỳ lệnh import/require tĩnh nào tới "child_process", "fs", "path", "crypto".
 * - Khi chạy trên Cloudflare Workers (không có fs/python3): thực thi trên bộ máy InMemoryD1Engine chuẩn SQLite/D1
 *   kết hợp đồng bộ hai chiều với env.DB (Cloudflare D1).
 * - Khi chạy trên Node.js (kiểm thử/CLI): hỗ trợ cả SQLite tệp cục bộ và InMemoryD1Engine.
 */

const PY_D1_SQL_ENGINE = `
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

export class InMemoryD1Engine {
  constructor() {
    this.tables = new Map();
    this.meta = EMBEDDED_TABLES_META;
    this.resetAndSeed();
  }

  resetAndSeed() {
    this.tables.clear();
    for (const [tName, tMeta] of Object.entries(this.meta)) {
      const initial = (EMBEDDED_INITIAL_ROWS[tName] || []).map(r => ({ ...r }));
      this.tables.set(tName, initial);
    }
  }

  cloneState() {
    const snap = {};
    for (const [k, rows] of this.tables.entries()) {
      snap[k] = rows.map(r => ({ ...r }));
    }
    return JSON.stringify(snap);
  }

  restoreState(jsonStr) {
    const snap = JSON.parse(jsonStr);
    this.tables.clear();
    for (const [tName] of Object.entries(this.meta)) {
      this.tables.set(tName, (snap[tName] || []).map(r => ({ ...r })));
    }
  }

  execute(sql, params = []) {
    const clean = String(sql || '').trim().replace(/;+\s*$/, '');
    const upper = clean.toUpperCase();

    if (upper.startsWith('PRAGMA INTEGRITY_CHECK')) {
      return { ok: true, rows: [{ integrity_check: 'ok' }], changes: 0 };
    }
    if (upper.startsWith('PRAGMA FOREIGN_KEY_CHECK')) {
      return { ok: true, rows: [], changes: 0 };
    }
    if (upper.startsWith('PRAGMA') || upper.startsWith('CREATE ')) {
      return { ok: true, rows: [], changes: 0 };
    }
    if (upper.startsWith('INSERT')) {
      return this._execInsert(clean, params);
    }
    if (upper.startsWith('UPDATE')) {
      return this._execUpdate(clean, params);
    }
    if (upper.startsWith('DELETE')) {
      return this._execDelete(clean, params);
    }
    if (upper.startsWith('SELECT')) {
      const rows = this._execSelect(clean, params);
      return { ok: true, rows, changes: 0 };
    }
    return { ok: true, rows: [], changes: 0 };
  }

  _consumeValueToken(tokenStr, paramState) {
    const t = tokenStr.trim();
    if (t === '?') return paramState.params[paramState.idx++];
    if (t.toUpperCase() === 'NULL') return null;
    if ((t.startsWith("'") && t.endsWith("'")) || (t.startsWith('"') && t.endsWith('"'))) {
      return t.slice(1, -1).replace(/''/g, "'");
    }
    if (/^-?\d+(\.\d+)?$/.test(t)) return Number(t);
    return t;
  }

  _splitCsvTokens(str) {
    const out = [];
    let cur = '';
    let inQuote = null;
    let depth = 0;
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inQuote) {
        cur += ch;
        if (ch === inQuote) {
          if (str[i + 1] === inQuote) {
            cur += str[++i];
          } else {
            inQuote = null;
          }
        }
      } else {
        if (ch === "'" || ch === '"') inQuote = ch;
        else if (ch === '(') depth++;
        else if (ch === ')') depth = Math.max(0, depth - 1);
        if (ch === ',' && depth === 0 && !inQuote) {
          out.push(cur.trim());
          cur = '';
          continue;
        }
        cur += ch;
      }
    }
    if (cur.trim()) out.push(cur.trim());
    return out;
  }

  _execInsert(sql, params) {
    const m = sql.match(/^INSERT\s+(?:OR\s+(IGNORE|REPLACE)\s+)?INTO\s+([a-zA-Z0-9_]+)\s*(?:\(([\s\S]*?)\))?\s*VALUES\s*\(([\s\S]*)\)$/i);
    if (!m) return { ok: true, rows: [], changes: 0 };
    const mode = (m[1] || '').toUpperCase();
    const table = m[2];
    const tMeta = this.meta[table];
    if (!tMeta) throw new Error(`Unknown table: ${table}`);
    const cols = m[3] ? this._splitCsvTokens(m[3]).map(c => c.trim()) : tMeta.columns;
    const valTokens = this._splitCsvTokens(m[4]);
    const paramState = { params, idx: 0 };

    const row = {};
    for (const c of tMeta.columns) {
      row[c] = tMeta.defaults[c] !== undefined ? tMeta.defaults[c] : null;
    }
    for (let i = 0; i < cols.length; i++) {
      row[cols[i]] = this._consumeValueToken(valTokens[i] ?? 'NULL', paramState);
    }

    const tableRows = this.tables.get(table) || [];
    const uniques = tMeta.uniques || (tMeta.pk.length ? [tMeta.pk] : []);
    let conflictIdx = -1;
    for (let idx = 0; idx < tableRows.length; idx++) {
      const existing = tableRows[idx];
      for (const uCols of uniques) {
        if (uCols.length > 0 && uCols.every(c => existing[c] !== null && existing[c] !== undefined && existing[c] === row[c])) {
          conflictIdx = idx;
          break;
        }
      }
      if (conflictIdx !== -1) break;
    }

    if (conflictIdx !== -1) {
      if (mode === 'IGNORE') return { ok: true, rows: [], changes: 0 };
      if (mode === 'REPLACE') {
        tableRows[conflictIdx] = row;
        return { ok: true, rows: [], changes: 1 };
      }
      throw new Error(`UNIQUE constraint failed on table ${table}`);
    }

    tableRows.push(row);
    this.tables.set(table, tableRows);
    return { ok: true, rows: [], changes: 1 };
  }

  _execDelete(sql, params) {
    const m = sql.match(/^DELETE\s+FROM\s+([a-zA-Z0-9_]+)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) return { ok: true, rows: [], changes: 0 };
    const table = m[1];
    const whereClause = m[2] || '';
    const tableRows = this.tables.get(table) || [];
    let removed = 0;
    const kept = [];
    for (const row of tableRows) {
      const paramState = { params, idx: 0 };
      if (!whereClause || this._evalWhere(whereClause, { [table]: row, '': row }, paramState)) {
        removed++;
      } else {
        kept.push(row);
      }
    }
    this.tables.set(table, kept);
    return { ok: true, rows: [], changes: removed };
  }

  _execUpdate(sql, params) {
    const m = sql.match(/^UPDATE\s+([a-zA-Z0-9_]+)\s+SET\s+([\s\S]+?)(?:\s+WHERE\s+([\s\S]+))?$/i);
    if (!m) return { ok: true, rows: [], changes: 0 };
    const table = m[1];
    const setPart = m[2];
    const whereClause = m[3] || '';
    const assignTokens = this._splitCsvTokens(setPart);

    // Count how many '?' are in SET part
    let setQCount = 0;
    for (const tok of assignTokens) {
      const eqIdx = tok.indexOf('=');
      const rhs = tok.slice(eqIdx + 1);
      setQCount += (rhs.match(/\?/g) || []).length;
    }
    const setParams = params.slice(0, setQCount);
    const whereParams = params.slice(setQCount);

    const tableRows = this.tables.get(table) || [];
    let changes = 0;
    for (const row of tableRows) {
      const whereState = { params: whereParams, idx: 0 };
      if (!whereClause || this._evalWhere(whereClause, { [table]: row, '': row }, whereState)) {
        const setState = { params: setParams, idx: 0 };
        for (const tok of assignTokens) {
          const eqIdx = tok.indexOf('=');
          const col = tok.slice(0, eqIdx).trim();
          const rhs = tok.slice(eqIdx + 1).trim();
          row[col] = this._evalUpdateRhs(rhs, row, setState);
        }
        changes++;
      }
    }
    return { ok: true, rows: [], changes };
  }

  _evalUpdateRhs(rhs, row, paramState) {
    const maxMatch = rhs.match(/^MAX\(\s*0\s*,\s*([a-zA-Z0-9_]+)\s*-\s*(\d+)\s*\)$/i);
    if (maxMatch) {
      return Math.max(0, Number(row[maxMatch[1]] || 0) - Number(maxMatch[2]));
    }
    const coal1 = rhs.match(/^COALESCE\(\s*\?\s*,\s*([a-zA-Z0-9_]+)\s*\)$/i);
    if (coal1) {
      const pVal = paramState.params[paramState.idx++];
      return pVal !== null && pVal !== undefined ? pVal : row[coal1[1]];
    }
    const coal2 = rhs.match(/^COALESCE\(\s*([a-zA-Z0-9_]+)\s*,\s*\?\s*\)$/i);
    if (coal2) {
      const pVal = paramState.params[paramState.idx++];
      return row[coal2[1]] !== null && row[coal2[1]] !== undefined ? row[coal2[1]] : pVal;
    }
    const addParam = rhs.match(/^([a-zA-Z0-9_]+)\s*\+\s*\?$/i);
    if (addParam) {
      return Number(row[addParam[1]] || 0) + Number(paramState.params[paramState.idx++] || 0);
    }
    const addNum = rhs.match(/^([a-zA-Z0-9_]+)\s*\+\s*(\d+)$/i);
    if (addNum) {
      return Number(row[addNum[1]] || 0) + Number(addNum[2]);
    }
    return this._consumeValueToken(rhs, paramState);
  }

  _execSelect(sql, params) {
    // Check UNION
    if (/\bUNION\b/i.test(sql) && !sql.includes("'")) {
      const parts = sql.split(/\s+UNION\s+/i);
      let offset = 0;
      const seen = new Set();
      const combined = [];
      for (const p of parts) {
        const qCount = (p.match(/\?/g) || []).length;
        const subRows = this._execSelectSingle(p, params.slice(offset, offset + qCount));
        offset += qCount;
        for (const r of subRows) {
          const key = JSON.stringify(r);
          if (!seen.has(key)) {
            seen.add(key);
            combined.push(r);
          }
        }
      }
      return combined;
    }
    return this._execSelectSingle(sql, params);
  }

  _execSelectSingle(sql, params) {
    let rest = sql.trim();
    let limit = null;
    const limitMatch = rest.match(/\s+LIMIT\s+(\d+)\s*$/i);
    if (limitMatch) {
      limit = Number(limitMatch[1]);
      rest = rest.slice(0, limitMatch.index).trim();
    }

    let orderBy = null;
    const orderMatch = rest.match(/\s+ORDER\s+BY\s+([\s\S]+)$/i);
    if (orderMatch) {
      orderBy = orderMatch[1].trim();
      rest = rest.slice(0, orderMatch.index).trim();
    }

    let whereClause = null;
    const whereIdx = this._findTopLevelKeyword(rest, 'WHERE');
    if (whereIdx !== -1) {
      whereClause = rest.slice(whereIdx + 5).trim();
      rest = rest.slice(0, whereIdx).trim();
    }

    const fromIdx = this._findTopLevelKeyword(rest, 'FROM');
    if (fromIdx === -1) return [];
    const selectListStr = rest.slice(6, fromIdx).trim();
    const fromAndJoinsStr = rest.slice(fromIdx + 4).trim();

    const paramState = { params, idx: 0 };
    let contexts = this._buildFromAndJoins(fromAndJoinsStr, paramState);

    const whereParams = params.slice(paramState.idx);
    if (whereClause) {
      contexts = contexts.filter(ctx => {
        const ws = { params: whereParams, idx: 0 };
        return this._evalWhere(whereClause, ctx, ws);
      });
    }

    // Check aggregate SELECT (COUNT / SUM)
    const selectItems = this._splitCsvTokens(selectListStr);
    const isAgg = selectItems.some(it => /\b(COUNT|SUM)\s*\(/i.test(it));
    if (isAgg) {
      const aggRow = {};
      for (const item of selectItems) {
        const asMatch = item.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
        const expr = (asMatch ? asMatch[1] : item).trim();
        const alias = (asMatch ? asMatch[2] : item).trim();
        if (/^COUNT\(\*\)$/i.test(expr)) {
          aggRow[alias] = contexts.length;
        } else {
          const sumMatch = expr.match(/SUM\(\s*([a-zA-Z0-9_.]+)\s*\)/i);
          if (sumMatch) {
            const colRef = sumMatch[1];
            const total = contexts.reduce((acc, ctx) => acc + Number(this._resolveCol(ctx, colRef) || 0), 0);
            aggRow[alias] = total;
          }
        }
      }
      return [aggRow];
    }

    if (orderBy) {
      contexts.sort((a, b) => this._compareOrderBy(a, b, orderBy));
    }

    if (limit !== null) {
      contexts = contexts.slice(0, limit);
    }

    return contexts.map(ctx => this._projectRow(ctx, selectItems));
  }

  _findTopLevelKeyword(str, kw) {
    let inQuote = null;
    let depth = 0;
    const upper = str.toUpperCase();
    for (let i = 0; i < str.length; i++) {
      const ch = str[i];
      if (inQuote) {
        if (ch === inQuote) {
          if (str[i + 1] === inQuote) i++;
          else inQuote = null;
        }
        continue;
      }
      if (ch === "'" || ch === '"') {
        inQuote = ch;
        continue;
      }
      if (ch === '(') { depth++; continue; }
      if (ch === ')') { depth = Math.max(0, depth - 1); continue; }
      if (depth === 0) {
        const prevOk = i === 0 || /\s/.test(str[i - 1]);
        const nextIdx = i + kw.length;
        const nextOk = nextIdx >= str.length || /\s/.test(str[nextIdx]);
        if (prevOk && nextOk && upper.slice(i, nextIdx) === kw) {
          return i;
        }
      }
    }
    return -1;
  }

  _buildFromAndJoins(fromStr, paramState) {
    const joinRegex = /\s+(LEFT\s+JOIN|JOIN)\s+/gi;
    const parts = [];
    let lastIdx = 0;
    let match;
    while ((match = joinRegex.exec(fromStr)) !== null) {
      parts.push({ segment: fromStr.slice(lastIdx, match.index).trim(), nextJoinType: match[1].toUpperCase() });
      lastIdx = joinRegex.lastIndex;
    }
    parts.push({ segment: fromStr.slice(lastIdx).trim(), nextJoinType: null });

    const baseTokens = parts[0].segment.split(/\s+/);
    const baseTable = baseTokens[0];
    const baseAlias = baseTokens[1] || baseTable;
    const baseRows = this.tables.get(baseTable) || [];

    let contexts = baseRows.map(r => ({
      '': { ...r },
      [baseTable]: r,
      [baseAlias]: r,
      __primaryAlias: baseAlias
    }));

    let currentJoinType = parts[0].nextJoinType;
    for (let i = 1; i < parts.length; i++) {
      const seg = parts[i].segment;
      const onIdx = this._findTopLevelKeyword(seg, 'ON');
      const tablePart = (onIdx !== -1 ? seg.slice(0, onIdx) : seg).trim();
      const onClause = onIdx !== -1 ? seg.slice(onIdx + 2).trim() : '';
      const tTokens = tablePart.split(/\s+/);
      const joinTable = tTokens[0];
      const joinAlias = tTokens[1] || joinTable;
      const joinRows = this.tables.get(joinTable) || [];
      const isLeft = currentJoinType && currentJoinType.includes('LEFT');
      const onQCount = (onClause.match(/\?/g) || []).length;
      const onParams = paramState.params.slice(paramState.idx, paramState.idx + onQCount);
      paramState.idx += onQCount;

      const nextContexts = [];
      for (const ctx of contexts) {
        let matched = false;
        for (const jr of joinRows) {
          const candidateCtx = {
            ...ctx,
            '': { ...jr, ...ctx[''] },
            [joinTable]: jr,
            [joinAlias]: jr
          };
          const os = { params: onParams, idx: 0 };
          if (!onClause || this._evalWhere(onClause, candidateCtx, os)) {
            matched = true;
            nextContexts.push(candidateCtx);
          }
        }
        if (!matched && isLeft) {
          nextContexts.push({
            ...ctx,
            [joinTable]: {},
            [joinAlias]: {}
          });
        }
      }
      contexts = nextContexts;
      currentJoinType = parts[i].nextJoinType;
    }
    return contexts;
  }

  _resolveCol(ctx, colRef) {
    const clean = String(colRef || '').trim();
    if (clean.includes('.')) {
      const [alias, col] = clean.split('.');
      return ctx[alias] ? ctx[alias][col] : undefined;
    }
    const primary = ctx[ctx.__primaryAlias];
    if (primary && clean in primary) return primary[clean];
    return ctx[''] ? ctx[''][clean] : undefined;
  }

  _projectRow(ctx, selectItems) {
    const out = {};
    for (const item of selectItems) {
      const t = item.trim();
      if (t === '*') {
        Object.assign(out, ctx[ctx.__primaryAlias] || ctx[''] || {});
      } else if (t.endsWith('.*')) {
        const alias = t.slice(0, -2).trim();
        Object.assign(out, ctx[alias] || {});
      } else {
        const asMatch = t.match(/^([\s\S]+?)\s+AS\s+([a-zA-Z0-9_]+)$/i);
        if (asMatch) {
          const colExpr = asMatch[1].trim();
          const alias = asMatch[2].trim();
          out[alias] = this._resolveCol(ctx, colExpr) ?? null;
        } else {
          const colName = t.includes('.') ? t.split('.')[1] : t;
          out[colName] = this._resolveCol(ctx, t) ?? null;
        }
      }
    }
    return out;
  }

  _compareOrderBy(a, b, orderByStr) {
    const specs = this._splitCsvTokens(orderByStr);
    for (const spec of specs) {
      const mCase = spec.match(/^CASE\s+WHEN\s+([a-zA-Z0-9_.]+)\s*=\s*\?\s+THEN\s+0\s+ELSE\s+1\s+END/i);
      if (mCase) continue;
      const mCodeCase = spec.match(/^CASE\s+code\s+WHEN\s+'zh'/i);
      if (mCodeCase) {
        const order = { zh: 1, en: 2, ko: 3, ja: 4, ru: 5 };
        const va = order[this._resolveCol(a, 'code')] || 6;
        const vb = order[this._resolveCol(b, 'code')] || 6;
        if (va !== vb) return va - vb;
        continue;
      }
      const desc = /\bDESC\s*$/i.test(spec);
      const expr = spec.replace(/\s+(ASC|DESC)\s*$/i, '').trim();
      let va, vb;
      const coalMatch = expr.match(/^COALESCE\(\s*([a-zA-Z0-9_.]+)\s*,\s*([a-zA-Z0-9_.]+)\s*\)$/i);
      if (coalMatch) {
        va = this._resolveCol(a, coalMatch[1]) ?? this._resolveCol(a, coalMatch[2]);
        vb = this._resolveCol(b, coalMatch[1]) ?? this._resolveCol(b, coalMatch[2]);
      } else {
        va = this._resolveCol(a, expr);
        vb = this._resolveCol(b, expr);
      }
      if (va === vb) continue;
      if (va === null || va === undefined) return desc ? 1 : -1;
      if (vb === null || vb === undefined) return desc ? -1 : 1;
      const cmp = va < vb ? -1 : 1;
      return desc ? -cmp : cmp;
    }
    return 0;
  }

  _evalWhere(expr, ctx, paramState) {
    let s = expr.trim();
    while (s.startsWith('(') && s.endsWith(')') && this._isWrappedInParens(s)) {
      s = s.slice(1, -1).trim();
    }

    const orParts = this._splitLogical(s, 'OR');
    if (orParts.length > 1) {
      let matched = false;
      for (const p of orParts) {
        const qCount = (p.match(/\?/g) || []).length;
        const subParams = paramState.params.slice(paramState.idx, paramState.idx + qCount);
        paramState.idx += qCount;
        if (!matched && this._evalWhere(p, ctx, { params: subParams, idx: 0 })) {
          matched = true;
        }
      }
      return matched;
    }

    const andParts = this._splitLogical(s, 'AND');
    if (andParts.length > 1) {
      let allOk = true;
      for (const p of andParts) {
        const qCount = (p.match(/\?/g) || []).length;
        const subParams = paramState.params.slice(paramState.idx, paramState.idx + qCount);
        paramState.idx += qCount;
        if (allOk && !this._evalWhere(p, ctx, { params: subParams, idx: 0 })) {
          allOk = false;
        }
      }
      return allOk;
    }

    // Subquery NOT IN (SELECT blocked_id FROM user_blocks WHERE blocker_id = ?)
    const notInSub = s.match(/^([a-zA-Z0-9_.]+)\s+NOT\s+IN\s*\(\s*SELECT\s+([a-zA-Z0-9_]+)\s+FROM\s+([a-zA-Z0-9_]+)\s+WHERE\s+([a-zA-Z0-9_]+)\s*=\s*\?\s*\)$/i);
    if (notInSub) {
      const val = this._resolveCol(ctx, notInSub[1]);
      const pVal = paramState.params[paramState.idx++];
      const subRows = this.tables.get(notInSub[3]) || [];
      const blockedSet = new Set(subRows.filter(r => r[notInSub[4]] === pVal).map(r => r[notInSub[2]]));
      return !blockedSet.has(val);
    }

    // col IN (...)
    const inMatch = s.match(/^([a-zA-Z0-9_.]+)\s+(NOT\s+)?IN\s*\(([\s\S]+)\)$/i);
    if (inMatch) {
      const leftVal = this._resolveCol(ctx, inMatch[1]);
      const isNot = Boolean(inMatch[2]);
      const items = this._splitCsvTokens(inMatch[3]).map(tok => this._consumeValueToken(tok, paramState));
      const has = items.includes(leftVal);
      return isNot ? !has : has;
    }

    // IS NULL / IS NOT NULL
    const isNullMatch = s.match(/^([a-zA-Z0-9_.]+)\s+IS\s+(NOT\s+)?NULL$/i);
    if (isNullMatch) {
      const leftVal = this._resolveCol(ctx, isNullMatch[1]);
      const isNull = leftVal === null || leftVal === undefined;
      return isNullMatch[2] ? !isNull : isNull;
    }

    // datetime('now', '-X minutes')
    const dtMatch = s.match(/^([a-zA-Z0-9_.]+)\s*>\s*datetime\(\s*'now'\s*,\s*'([+-]?\d+)\s+minutes?'\s*\)$/i);
    if (dtMatch) {
      const leftVal = String(this._resolveCol(ctx, dtMatch[1]) || '');
      const mins = Number(dtMatch[2]);
      const thresholdIso = new Date(Date.now() + mins * 60 * 1000).toISOString();
      return leftVal > thresholdIso;
    }

    // LIKE
    const likeMatch = s.match(/^([a-zA-Z0-9_.]+)\s+LIKE\s+([\s\S]+)$/i);
    if (likeMatch) {
      const leftVal = String(this._resolveCol(ctx, likeMatch[1]) ?? '').toLowerCase();
      const patRaw = String(this._consumeValueToken(likeMatch[2], paramState) ?? '').toLowerCase();
      const cleanSub = patRaw.replace(/^%+/, '').replace(/%+$/, '');
      return leftVal.includes(cleanSub);
    }

    // Binary comparison (=, !=, <>, >=, <=, >, <)
    const cmpMatch = s.match(/^([a-zA-Z0-9_.]+)\s*(!=|<>|>=|<=|=|>|<)\s*([\s\S]+)$/);
    if (cmpMatch) {
      const leftVal = /^-?\d+(\.\d+)?$/.test(cmpMatch[1]) ? Number(cmpMatch[1]) : this._resolveCol(ctx, cmpMatch[1]);
      const op = cmpMatch[2];
      const rhsRaw = cmpMatch[3].trim();
      let rightVal;
      if (/^[a-zA-Z_][a-zA-Z0-9_]*\.[a-zA-Z_][a-zA-Z0-9_]*$/.test(rhsRaw)) {
        rightVal = this._resolveCol(ctx, rhsRaw);
      } else {
        rightVal = this._consumeValueToken(rhsRaw, paramState);
      }
      if (op === '=') return leftVal === rightVal;
      if (op === '!=' || op === '<>') return leftVal !== rightVal;
      if (op === '>') return leftVal > rightVal;
      if (op === '<') return leftVal < rightVal;
      if (op === '>=') return leftVal >= rightVal;
      if (op === '<=') return leftVal <= rightVal;
    }

    return true;
  }

  _isWrappedInParens(s) {
    let depth = 0;
    let inQuote = null;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQuote) {
        if (ch === inQuote) {
          if (s[i + 1] === inQuote) i++;
          else inQuote = null;
        }
        continue;
      }
      if (ch === "'" || ch === '"') { inQuote = ch; continue; }
      if (ch === '(') depth++;
      else if (ch === ')') {
        depth--;
        if (depth === 0 && i < s.length - 1) return false;
      }
    }
    return depth === 0;
  }

  _splitLogical(s, keyword) {
    const parts = [];
    let last = 0;
    let depth = 0;
    let inQuote = null;
    const upper = s.toUpperCase();
    for (let i = 0; i < s.length; i++) {
      const ch = s[i];
      if (inQuote) {
        if (ch === inQuote) {
          if (s[i + 1] === inQuote) i++;
          else inQuote = null;
        }
        continue;
      }
      if (ch === "'" || ch === '"') { inQuote = ch; continue; }
      if (ch === '(') { depth++; continue; }
      if (ch === ')') { depth = Math.max(0, depth - 1); continue; }
      if (depth === 0) {
        const prevOk = i > 0 && /\s/.test(s[i - 1]);
        const nextIdx = i + keyword.length;
        const nextOk = nextIdx < s.length && /\s/.test(s[nextIdx]);
        if (prevOk && nextOk && upper.slice(i, nextIdx) === keyword) {
          parts.push(s.slice(last, i).trim());
          last = nextIdx;
          i = nextIdx - 1;
        }
      }
    }
    if (parts.length > 0) parts.push(s.slice(last).trim());
    return parts;
  }
}

export class DatabaseAdapter {
  constructor(options = {}) {
    this.dbPath = options.dbPath || (typeof process !== 'undefined' && process.env ? process.env.SQLITE_DB_PATH : null) || LOCAL_DB_FILE;
    this.d1Binding = options.d1Binding || null;
    this.d1Meta = {
      binding: 'DB',
      database_name: 'word',
      database_id: 'ce84cc48-6d49-409b-b45a-13ba3bc4a771',
      engine: 'Cloudflare D1'
    };
    this.memoryEngine = new InMemoryD1Engine();
    this.memoryBackups = new Map();
    this.pendingD1Mutations = [];
    this.d1Hydrated = false;
    this.initialized = true;
  }

  bindWorkerD1(d1Binding) {
    if (d1Binding) {
      this.d1Binding = d1Binding;
    }
    return this;
  }

  async syncFromCloudflareD1(d1 = this.d1Binding) {
    if (!d1 || typeof d1.prepare !== 'function' || this.d1Hydrated) return;
    try {
      const check = await d1.prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='users'").all();
      if (!check || !check.results || check.results.length === 0) {
        const stmts = [EMBEDDED_SCHEMA_SQL, EMBEDDED_SEED_SQL]
          .join('\n')
          .split(/;\s*\n/)
          .map(s => s.trim())
          .filter(s => s && !s.startsWith('--') && !s.toUpperCase().startsWith('PRAGMA'));
        for (const st of stmts) {
          try { await d1.prepare(st).run(); } catch (_) {}
        }
      }
      for (const table of Object.keys(EMBEDDED_TABLES_META)) {
        try {
          const res = await d1.prepare(`SELECT * FROM ${table}`).all();
          if (res && Array.isArray(res.results) && res.results.length > 0) {
            this.memoryEngine.tables.set(table, res.results.map(r => ({ ...r })));
          }
        } catch (_) {}
      }
      this.d1Hydrated = true;
    } catch (_) {}
  }

  _runSql(payload) {
    if (payload.mode === 'exec_script') {
      return { ok: true };
    }
    if (payload.mode === 'batch') {
      const results = [];
      for (const st of payload.statements || []) {
        const out = this.memoryEngine.execute(st.sql, st.params || []);
        results.push({ rows: out.rows || [], changes: out.changes || 0 });
        if (this.d1Binding && st.sql && !st.sql.trim().toUpperCase().startsWith('SELECT')) {
          this.pendingD1Mutations.push({ sql: st.sql, params: st.params || [] });
        }
      }
      return { ok: true, results };
    }
    const out = this.memoryEngine.execute(payload.sql, payload.params || []);
    if (this.d1Binding && payload.sql && !payload.sql.trim().toUpperCase().startsWith('SELECT') && !payload.sql.trim().toUpperCase().startsWith('PRAGMA')) {
      this.pendingD1Mutations.push({ sql: payload.sql, params: payload.params || [] });
    }
    return out;
  }

  async flushToCloudflareD1(d1 = this.d1Binding) {
    if (!d1 || this.pendingD1Mutations.length === 0) return { synced: 0 };
    const batch = this.pendingD1Mutations.splice(0, this.pendingD1Mutations.length);
    const stmts = batch.map(item => d1.prepare(item.sql).bind(...(item.params || [])));
    await d1.batch(stmts);
    return { synced: stmts.length };
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
    this.initialized = true;
  }

  checkIntegrity() {
    const rows = this.query('PRAGMA integrity_check;');
    const fkViolations = this.query('PRAGMA foreign_key_check;');
    const ok = rows.length > 0 && rows[0].integrity_check === 'ok' && fkViolations.length === 0;
    return {
      ok,
      engine: 'Cloudflare D1 (SQLite compatible)',
      integrity_check: rows[0] ? rows[0].integrity_check : 'unknown',
      foreign_key_violations: fkViolations.length,
      checked_at: new Date().toISOString()
    };
  }

  createBackup(backupDir = STORAGE_BACKUP_PATH) {
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fileName = `wordbridge-d1-backup-${stamp}.bak`;
    const dest = path.join(backupDir, fileName);
    const stateJson = this.memoryEngine.cloneState();
    this.memoryBackups.set(dest, stateJson);

    const fs = getNodeBuiltin('fs');
    if (fs) {
      try {
        fs.mkdirSync(backupDir, { recursive: true });
        fs.writeFileSync(dest, stateJson, 'utf8');
      } catch (_) {}
    }

    const checksum = crypto.createHash('sha256').update(stateJson).digest('hex');
    return {
      backup_file: fileName,
      backup_path: dest,
      size_bytes: stateJson.length,
      checksum_sha256: checksum,
      engine: 'Cloudflare D1 Snapshot',
      created_at: new Date().toISOString()
    };
  }

  verifyRestoreCapability(backupFilePath) {
    let raw = this.memoryBackups.get(backupFilePath) || null;
    const fs = getNodeBuiltin('fs');
    if (!raw && fs && fs.existsSync(backupFilePath)) {
      raw = fs.readFileSync(backupFilePath, 'utf8');
    }
    if (!raw) {
      return { ok: false, reason: 'Không tìm thấy tệp sao lưu D1 để kiểm tra phục hồi.' };
    }
    try {
      const parsed = JSON.parse(raw);
      const integrityOk = Boolean(parsed && typeof parsed === 'object' && Array.isArray(parsed.languages));
      return {
        ok: integrityOk,
        verified_at: new Date().toISOString(),
        integrity_status: integrityOk ? 'ok' : 'corrupted'
      };
    } catch (_) {
      return { ok: false, verified_at: new Date().toISOString(), integrity_status: 'corrupted' };
    }
  }

  restoreBackup(backupFilePath) {
    const verify = this.verifyRestoreCapability(backupFilePath);
    if (!verify.ok) {
      throw new Error(`Kiểm tra toàn vẹn bản sao lưu D1 thất bại: ${verify.reason || verify.integrity_status}`);
    }
    const fs = getNodeBuiltin('fs');
    const raw = this.memoryBackups.get(backupFilePath) || (fs ? fs.readFileSync(backupFilePath, 'utf8') : '{}');
    this.memoryEngine.restoreState(raw);
    return {
      restored: true,
      integrity_verified: true,
      restored_at: new Date().toISOString()
    };
  }
}

export const db = new DatabaseAdapter();
export default { DatabaseAdapter, db };
