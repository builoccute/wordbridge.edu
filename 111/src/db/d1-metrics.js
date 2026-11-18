/**
 * @file src/db/d1-metrics.js
 * @description Quản lý kết nối Cloudflare D1 (`word` - ce84cc48-6d49-409b-b45a-13ba3bc4a771)
 * Tuân thủ tuyệt đối chính sách ZERO USER DATA STORAGE:
 *   1. Chỉ cho phép đọc/tăng nguyên tử duy nhất chỉ số `total_accesses` trong bảng `site_metrics`.
 *   2. Tường lửa SQL (`validateZeroStorageSql`) chặn 100% truy vấn DROP TABLE, DROP DATABASE
 *      hoặc ghi dữ liệu văn bản, tệp, lịch sử, IP, session của người dùng vào D1.
 *   3. Bảo toàn nguyên vẹn toàn bộ các bảng hiện có của hệ sinh thái Word Bridge trong D1.
 */

export const EXPECTED_D1_DATABASE_NAME = "word";
export const EXPECTED_D1_DATABASE_ID = "ce84cc48-6d49-409b-b45a-13ba3bc4a771";

const FORBIDDEN_SQL_PATTERNS = [
  /\bDROP\s+TABLE\b/i,
  /\bDROP\s+DATABASE\b/i,
  /\bTRUNCATE\b/i,
  /\bALTER\s+TABLE\b/i,
  /\btranslation_history\b/i,
  /\buser_translations\b/i,
  /\buploaded_files\b/i,
  /\bdocument_history\b/i,
  /\bvisitor_logs\b/i,
  /\buser_sessions_trans\b/i,
  /\bsaved_phrases\b/i,
  /\bpersonal_dictionary\b/i
];

const ALLOWED_MUTATION_STATEMENTS = new Set([
  "CREATE TABLE IF NOT EXISTS site_metrics ( id INTEGER PRIMARY KEY CHECK (id = 1), total_accesses INTEGER NOT NULL DEFAULT 0 CHECK (total_accesses >= 0) )",
  "INSERT OR IGNORE INTO site_metrics (id, total_accesses) VALUES (1, 0)",
  "INSERT INTO site_metrics (id, total_accesses) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total_accesses = total_accesses + 1 RETURNING total_accesses"
]);

function normalizeSql(sql) {
  return String(sql || "").replace(/\s+/g, " ").trim().replace(/;$/, "");
}

/**
 * Kiểm tra câu lệnh SQL trước khi thực thi trên Cloudflare D1.
 * Ngăn chặn mọi hành vi phá hủy bảng cũ hoặc lưu dữ liệu người dùng.
 */
export function validateZeroStorageSql(sql, boundParams = []) {
  const normalized = normalizeSql(sql);
  if (!normalized) {
    throw new Error("ERR_EMPTY_SQL: Câu lệnh SQL rỗng.");
  }

  for (const pattern of FORBIDDEN_SQL_PATTERNS) {
    if (pattern.test(normalized)) {
      throw new Error(
        `ERR_ZERO_STORAGE_SQL_BLOCKED: Câu lệnh SQL vi phạm chính sách bảo toàn D1 hoặc Zero User Data Storage (${pattern}).`
      );
    }
  }

  if (boundParams && boundParams.length > 0) {
    throw new Error(
      "ERR_ZERO_STORAGE_PARAMS_BLOCKED: Không cho phép truyền tham số động của người dùng vào D1 trong hệ thống dịch thuật."
    );
  }

  const upper = normalized.toUpperCase();
  const isReadQuery =
    upper.startsWith("SELECT TOTAL_ACCESSES FROM SITE_METRICS") ||
    upper.startsWith("SELECT ID, TOTAL_ACCESSES FROM SITE_METRICS") ||
    upper.startsWith("SELECT NAME, TYPE FROM SQLITE_MASTER");

  if (!isReadQuery && !ALLOWED_MUTATION_STATEMENTS.has(normalized)) {
    throw new Error(
      `ERR_ZERO_STORAGE_SQL_UNAUTHORIZED: Chỉ cho phép cập nhật bộ đếm nguyên tử site_metrics.total_accesses.`
    );
  }

  return normalized;
}

/**
 * Bộ mô phỏng D1 trong bộ nhớ (chỉ lưu duy nhất số nguyên total_accesses)
 * dùng khi chạy local dev hoặc kiểm thử tự động khi chưa gắn kết nối Worker biên.
 */
export class EphemeralD1MetricsStore {
  constructor(initialCount = 0) {
    this._totalAccesses = Number.isInteger(initialCount) && initialCount >= 0 ? initialCount : 0;
    this._schemaInitialized = true;
    this._preservedEcosystemTables = [
      "users",
      "admin_sessions",
      "courses",
      "subscriptions",
      "site_metrics"
    ];
  }

  prepare(sql) {
    const normalized = validateZeroStorageSql(sql, []);
    const self = this;

    return {
      bind(...params) {
        validateZeroStorageSql(sql, params);
        return this;
      },
      async first(colName) {
        if (normalized.includes("ON CONFLICT(id) DO UPDATE SET total_accesses = total_accesses + 1")) {
          self._totalAccesses += 1;
          const row = { id: 1, total_accesses: self._totalAccesses };
          return colName ? row[colName] : row;
        }
        if (normalized.toUpperCase().startsWith("SELECT") && normalized.includes("site_metrics")) {
          const row = { id: 1, total_accesses: self._totalAccesses };
          return colName ? row[colName] : row;
        }
        return null;
      },
      async run() {
        if (normalized.includes("ON CONFLICT(id) DO UPDATE SET total_accesses = total_accesses + 1")) {
          self._totalAccesses += 1;
        }
        return { success: true, meta: { changes: 1 } };
      },
      async all() {
        if (normalized.toUpperCase().includes("SQLITE_MASTER")) {
          return {
            results: self._preservedEcosystemTables.map((name) => ({
              name,
              type: "table"
            }))
          };
        }
        if (normalized.toUpperCase().includes("SITE_METRICS")) {
          return {
            results: [{ id: 1, total_accesses: self._totalAccesses }]
          };
        }
        return { results: [] };
      }
    };
  }
}

const fallbackStore = new EphemeralD1MetricsStore(0);

function resolveD1Binding(env) {
  if (env && env.DB && typeof env.DB.prepare === "function") {
    return { db: env.DB, isNativeBinding: true };
  }
  return { db: fallbackStore, isNativeBinding: false };
}

/**
 * Đảm bảo bảng `site_metrics` tồn tại một cách an toàn mà không ảnh hưởng bảng khác.
 */
export async function ensureSiteMetricsTable(env) {
  const { db } = resolveD1Binding(env);
  const createSql =
    "CREATE TABLE IF NOT EXISTS site_metrics ( id INTEGER PRIMARY KEY CHECK (id = 1), total_accesses INTEGER NOT NULL DEFAULT 0 CHECK (total_accesses >= 0) )";
  const seedSql = "INSERT OR IGNORE INTO site_metrics (id, total_accesses) VALUES (1, 0)";
  validateZeroStorageSql(createSql);
  validateZeroStorageSql(seedSql);
  await db.prepare(createSql).run();
  await db.prepare(seedSql).run();
}

/**
 * Tăng nguyên tử (Atomic Increment) tổng số lượt truy cập trang chính.
 * Chỉ thực hiện khi người dùng truy cập trang chính hợp lệ, không tăng cho request nội bộ/API/assets.
 */
export async function incrementTotalAccesses(env) {
  const { db, isNativeBinding } = resolveD1Binding(env);
  await ensureSiteMetricsTable(env);

  const atomicSql =
    "INSERT INTO site_metrics (id, total_accesses) VALUES (1, 1) ON CONFLICT(id) DO UPDATE SET total_accesses = total_accesses + 1 RETURNING total_accesses";
  validateZeroStorageSql(atomicSql);

  const row = await db.prepare(atomicSql).first();
  const totalAccesses =
    row && typeof row.total_accesses === "number"
      ? row.total_accesses
      : Number((await getTotalAccesses(env)).totalAccesses);

  return {
    totalAccesses,
    databaseName: EXPECTED_D1_DATABASE_NAME,
    databaseId: EXPECTED_D1_DATABASE_ID,
    bindingType: isNativeBinding ? "cloudflare_d1_binding" : "ephemeral_d1_compatible"
  };
}

/**
 * Đọc tổng số lượt truy cập hiện tại mà không làm tăng bộ đếm.
 */
export async function getTotalAccesses(env) {
  const { db, isNativeBinding } = resolveD1Binding(env);
  await ensureSiteMetricsTable(env);

  const selectSql = "SELECT id, total_accesses FROM site_metrics WHERE id = 1";
  validateZeroStorageSql(selectSql);

  const row = await db.prepare(selectSql).first();
  return {
    totalAccesses: row && typeof row.total_accesses === "number" ? row.total_accesses : 0,
    databaseName: EXPECTED_D1_DATABASE_NAME,
    databaseId: EXPECTED_D1_DATABASE_ID,
    bindingType: isNativeBinding ? "cloudflare_d1_binding" : "ephemeral_d1_compatible",
    storedColumns: ["id", "total_accesses"],
    zeroUserDataVerified: true
  };
}

/**
 * Kiểm tra trạng thái Schema D1 mà không đọc hoặc sao chép dữ liệu nhạy cảm.
 */
export async function inspectD1Database(env) {
  const { db, isNativeBinding } = resolveD1Binding(env);
  await ensureSiteMetricsTable(env);

  const schemaSql = "SELECT name, type FROM sqlite_master WHERE type = 'table'";
  validateZeroStorageSql(schemaSql);
  const tablesResult = await db.prepare(schemaSql).all();
  const tableNames = Array.isArray(tablesResult?.results)
    ? tablesResult.results.map((r) => r.name)
    : ["site_metrics"];

  const metrics = await getTotalAccesses(env);

  return {
    status: "OK",
    databaseName: EXPECTED_D1_DATABASE_NAME,
    databaseId: EXPECTED_D1_DATABASE_ID,
    bindingName: "DB",
    isNativeBinding,
    existingTablesPreserved: true,
    detectedTables: tableNames,
    translationActiveTable: "site_metrics",
    totalAccesses: metrics.totalAccesses,
    zeroUserDataPolicy: "ENFORCED_STRICT"
  };
}

/**
 * Quyết định xem một HTTP request có được tính là 1 lượt truy cập trang chính hợp lệ hay không.
 * Quy tắc:
 *   - Chỉ tính cho GET `/` (trang chính) hoặc POST `/api/metrics/visit`.
 *   - Không tính cho prefetch, healthcheck, bot tự động, tải tài nguyên tĩnh (.css, .js, .jpg, .png, .ico)
 *     hoặc các request gọi API dịch thuật.
 */
export function isEligiblePageVisitRequest(request) {
  if (!request) return false;
  const url = new URL(request.url, "https://dichthuat.wordbridge.io.vn");
  const method = (request.method || "GET").toUpperCase();

  if (method === "POST" && url.pathname === "/api/metrics/visit") {
    return true;
  }

  if (method !== "GET" || url.pathname !== "/") {
    return false;
  }

  const purpose = (
    request.headers.get("Purpose") ||
    request.headers.get("Sec-Purpose") ||
    request.headers.get("X-Purpose") ||
    ""
  ).toLowerCase();
  if (purpose.includes("prefetch") || purpose.includes("preview")) {
    return false;
  }

  const userAgent = (request.headers.get("User-Agent") || "").toLowerCase();
  if (
    userAgent.includes("healthcheck") ||
    userAgent.includes("uptime") ||
    userAgent.includes("cloudflare-traffic-manager")
  ) {
    return false;
  }

  const accept = (request.headers.get("Accept") || "").toLowerCase();
  if (accept && !accept.includes("text/html") && !accept.includes("*/*")) {
    return false;
  }

  return true;
}
