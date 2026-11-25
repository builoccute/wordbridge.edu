import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import os from "node:os";
import worker from "../src/index.js";
import { SQLiteD1Database, MemoryR2Bucket } from "./helpers/sqlite-d1-shim.js";

function extractCookie(res, name) {
  const raw = res.headers.get("set-cookie") || "";
  const m = raw.match(new RegExp(`${name}=([^;]+)`));
  return m ? `${name}=${m[1]}` : "";
}

async function createTestEnv(extraEnv = {}) {
  const dbPath = path.join(os.tmpdir(), `wb-v42-test-${Date.now()}-${Math.random().toString(36).slice(2)}.sqlite3`);
  const db = new SQLiteD1Database(dbPath);
  await db.applyAllMigrations();
  const env = {
    DB: db,
    R2: new MemoryR2Bucket(),
    APP_BASE_URL: "https://wordbridge.io.vn",
    ENVIRONMENT: "staging",
    WEBAUTHN_RP_ID: "wordbridge.io.vn",
    TOKEN_PEPPER: "test-pepper-v42",
    EMAIL_PROVIDER: "unconfigured",
    STATIC_ASSETS_LOADER: async (assetPath) => {
      const clean = assetPath.replace(/^\/+/, "");
      const full = path.join(process.cwd(), clean);
      if (!fs.existsSync(full) || !fs.statSync(full).isFile()) return null;
      return { body: fs.readFileSync(full), contentType: clean.endsWith(".json") ? "application/json; charset=utf-8" : "application/octet-stream" };
    },
    ...extraEnv
  };
  return { env, db, cleanup: () => { try { db.close(); } catch {} try { fs.unlinkSync(dbPath); } catch {} } };
}

async function req(env, urlPath, opts = {}) {
  const { method = "GET", headers = {}, body = undefined } = opts;
  const request = new Request(`https://wordbridge.io.vn${urlPath}`, {
    method,
    headers: body && typeof body === "string" ? { "Content-Type": "application/json", ...headers } : headers,
    body
  });
  return worker.fetch(request, env, {});
}

test("1. P0 Health, Missing DB 503, Error Codes 1100/1101 & Session Invalid 401", async () => {
  const { env, cleanup } = await createTestEnv();
  try {
    const health = await req(env, "/api/v1/health");
    assert.equal(health.status, 200);
    const hJson = await health.json();
    assert.equal(hJson.ok, true);
    assert.equal(hJson.version, "4.2.1");

    const noDb = await worker.fetch(new Request("https://wordbridge.io.vn/"), { R2: new MemoryR2Bucket() }, {});
    assert.equal(noDb.status, 503);

    const err1100 = await req(env, "/help/errors/1100");
    assert.equal(err1100.status, 200);
    assert.match(await err1100.text(), /1100/);

    const err1101 = await req(env, "/help/errors/1101");
    assert.equal(err1101.status, 200);
    assert.match(await err1101.text(), /1101/);

    const sessInvalid = await req(env, "/session-invalid");
    assert.equal(sessInvalid.status, 401);
    assert.match(await sessInvalid.text(), /Phiên đăng nhập không hợp lệ/);

    const notFound = await req(env, "/this-page-does-not-exist-v42");
    assert.equal(notFound.status, 404);
  } finally {
    cleanup();
  }
});

test("2. 20/20 UI Routes Status, Zero Russian Content, Exam 410 & Contact Rules", async () => {
  const { env, cleanup } = await createTestEnv();
  try {
    const publicRoutes = [
      "/register", "/flashcards/listening", "/learning", "/learning/chinese",
      "/flashcards/speaking", "/skills/pronunciation", "/learning/english",
      "/contact", "/vocabulary/flashcards", "/learning/skills",
      "/flashcards/writing", "/specialized", "/login", "/flashcards/grammar",
      "/vocabulary/flashcards?lang=zh", "/practice", "/help/errors", "/help"
    ];
    for (const r of publicRoutes) {
      const res = await req(env, r);
      assert.equal(res.status, 200, `Expected 200 on ${r}, got ${res.status}`);
      const html = await res.text();
      assert.doesNotMatch(html, /tiếng nga|russian|русск/i, `Found forbidden Russian text on ${r}`);
    }

    // Contact page specific rules (Image 09)
    const contactHtml = await (await req(env, "/contact")).text();
    assert.match(contactHtml, /CSKH \(Chăm sóc khách hàng\)/);
    assert.match(contactHtml, /Trung Tâm Trợ Giúp/);
    assert.match(contactHtml, /Phản hồi &amp; góp ý/);
    assert.match(contactHtml, /\/login\?next=%2Fcontact&amp;intent=contact\.send/);
    assert.doesNotMatch(contactHtml, /Giờ làm việc|08:00|Support/i);

    // Russian & Exam routes strictly 410
    assert.equal((await req(env, "/learning/russian")).status, 410);
    assert.equal((await req(env, "/examinations")).status, 410);
    assert.equal((await req(env, "/api/v1/examinations")).status, 410);
  } finally {
    cleanup();
  }
});

test("3. Full Legal Policies (/policies/terms & /policies/privacy) + Consent + Privacy Center", async () => {
  const { env, cleanup } = await createTestEnv();
  try {
    const termsRes = await req(env, "/policies/terms");
    assert.equal(termsRes.status, 200);
    const termsHtml = await termsRes.text();
    assert.match(termsHtml, /Điều 1\. Giới thiệu/);
    assert.match(termsHtml, /Điều 24\. Thông tin liên hệ/);
    assert.match(termsHtml, /không cung cấp chức năng cấp chứng chỉ/i);

    const privacyRes = await req(env, "/policies/privacy");
    assert.equal(privacyRes.status, 200);
    const privacyHtml = await privacyRes.text();
    assert.match(privacyHtml, /1\. Giới thiệu/);
    assert.match(privacyHtml, /Zero User Data Storage/);
    assert.match(privacyHtml, /19\. Thông tin liên hệ/);

    for (const slug of ["data-protection", "cookies", "community", "account-safety", "data-deletion", "violation-report", "complaints"]) {
      assert.equal((await req(env, `/policies/${slug}`)).status, 200, `Policy ${slug} should return 200`);
    }
    assert.equal((await req(env, "/policies/unknown-slug")).status, 404);

    // Register user with school only (workplace optional per E2) + Terms acceptance
    const regRes = await req(env, "/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Nguyen Van A",
        dateOfBirth: "2000-05-15",
        phoneNumber: "0901234567",
        email: "learner@example.com",
        password: "Password1234",
        confirmPassword: "Password1234",
        schoolName: "Dai hoc Quoc gia",
        workplaceName: "",
        termsAccepted: true
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    const sessionCookie = extractCookie(regRes, "wb_session");
    assert.ok(sessionCookie);

    const consentsRes = await req(env, "/api/v1/privacy/consents", { headers: { Cookie: sessionCookie } });
    const consentsData = await consentsRes.json();
    assert.ok(consentsData.consents.some((c) => c.policy_type === "terms" && c.acceptance_status === "accepted"));
    assert.ok(consentsData.consents.some((c) => c.policy_type === "privacy" && c.acceptance_status === "notified"));

    // Privacy Center page & withdraw_consent request
    const privPage = await req(env, "/account/privacy", { headers: { Cookie: sessionCookie } });
    assert.equal(privPage.status, 200);
    const privReq = await req(env, "/api/v1/privacy/requests", {
      method: "POST",
      headers: { Cookie: sessionCookie, "X-CSRF-Token": regData.csrfToken },
      body: JSON.stringify({ requestType: "withdraw_consent", details: "Rút lại đồng ý xử lý bổ sung" })
    });
    assert.equal(privReq.status, 201);
  } finally {
    cleanup();
  }
});

test("4. Admin Center (/quan-tri) + 6-Digit PIN Lock, Lockout, RBAC & Production Policy Guard", async () => {
  const { env, db, cleanup } = await createTestEnv();
  try {
    // Guest redirected to login
    const guestAdmin = await req(env, "/quan-tri");
    assert.equal(guestAdmin.status, 302);

    // Register normal user -> 403 on /quan-tri and /api/v1/admin/dashboard
    const regRes = await req(env, "/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "Admin User",
        dateOfBirth: "1995-01-01",
        phoneNumber: "0909888777",
        email: "admin@wordbridge.io.vn",
        password: "AdminPassword123",
        confirmPassword: "AdminPassword123",
        schoolName: "",
        workplaceName: "Word Bridge Ops",
        termsAccepted: true
      })
    });
    const regData = await regRes.json();
    const userCookie = extractCookie(regRes, "wb_session");
    const csrf = regData.csrfToken;

    assert.equal((await req(env, "/quan-tri", { headers: { Cookie: userCookie } })).status, 403);
    assert.equal((await req(env, "/api/v1/admin/dashboard", { headers: { Cookie: userCookie } })).status, 403);

    // Grant super_admin role in D1
    const saRole = await db.prepare("SELECT id FROM wb_roles WHERE code = 'super_admin'").first();
    await db.prepare("INSERT INTO wb_account_roles (account_id, role_id) VALUES (?, ?)").bind(regData.accountId, saRole.id).run();

    // Before PIN: /quan-tri shows PIN setup screen; /api/v1/admin/dashboard blocked with 403 ADMIN_PIN_REQUIRED
    const pinScreen = await req(env, "/quan-tri", { headers: { Cookie: userCookie } });
    assert.equal(pinScreen.status, 200);
    assert.match(await pinScreen.text(), /Thiết lập mã PIN quản trị 6 chữ số/);
    assert.equal(pinScreen.headers.get("cache-control"), "private, no-store");

    const blockedApi = await req(env, "/api/v1/admin/dashboard", { headers: { Cookie: userCookie } });
    assert.equal(blockedApi.status, 403);

    // Reject weak PIN
    const weakPin = await req(env, "/api/v1/admin/pin/setup", {
      method: "POST",
      headers: { Cookie: userCookie, "X-CSRF-Token": csrf },
      body: JSON.stringify({ pin: "123456", confirmPin: "123456" })
    });
    assert.equal(weakPin.status, 400);

    // Setup strong 6-digit PIN -> unlocks admin session
    const setupPin = await req(env, "/api/v1/admin/pin/setup", {
      method: "POST",
      headers: { Cookie: userCookie, "X-CSRF-Token": csrf },
      body: JSON.stringify({ pin: "482917", confirmPin: "482917" })
    });
    assert.equal(setupPin.status, 200);
    const adminCookie = extractCookie(setupPin, "wb_admin_session");
    assert.ok(adminCookie, "Expected wb_admin_session cookie");

    // Verify PIN is NOT stored in plaintext in D1
    const pinRow = await db.prepare("SELECT pin_hash FROM wb_admin_pins WHERE account_id = ?").bind(regData.accountId).first();
    assert.ok(pinRow && !pinRow.pin_hash.includes("482917"), "PIN must be salted hash, never plaintext");

    // Now /quan-tri and /api/v1/admin/dashboard succeed!
    const dashHtml = await (await req(env, "/quan-tri", { headers: { Cookie: `${userCookie}; ${adminCookie}` } })).text();
    assert.match(dashHtml, /Trung tâm Quản trị/);
    assert.match(dashHtml, /Tổng quan hệ thống/);

    const dashApi = await req(env, "/api/v1/admin/dashboard", { headers: { Cookie: `${userCookie}; ${adminCookie}` } });
    assert.equal(dashApi.status, 200);

    // Lock admin session -> /quan-tri requires PIN again
    await req(env, "/api/v1/admin/pin/lock", { method: "POST", headers: { Cookie: `${userCookie}; ${adminCookie}`, "X-CSRF-Token": csrf } });
    const relocked = await req(env, "/quan-tri", { headers: { Cookie: `${userCookie}; ${adminCookie}` } });
    assert.match(await relocked.text(), /Xác minh mã PIN quản trị 6 chữ số/);

    // Brute-force 5 wrong PINs -> 429 lockout
    for (let i = 0; i < 4; i++) {
      const bad = await req(env, "/api/v1/admin/pin/verify", {
        method: "POST",
        headers: { Cookie: userCookie, "X-CSRF-Token": csrf },
        body: JSON.stringify({ pin: "111222" })
      });
      assert.equal(bad.status, 401);
    }
    const locked = await req(env, "/api/v1/admin/pin/verify", {
      method: "POST",
      headers: { Cookie: userCookie, "X-CSRF-Token": csrf },
      body: JSON.stringify({ pin: "111222" })
    });
    assert.equal(locked.status, 429);
  } finally {
    cleanup();
  }
});

test("5. Language Services Provider Adapters (F1-F9), 6-Method OAuth Status & 100 Specialized Domains", async () => {
  const { env, cleanup } = await createTestEnv();
  try {
    // 6-Method Auth status
    const providers = await (await req(env, "/api/v1/auth/providers")).json();
    assert.equal(providers.methods.length, 6);
    assert.equal((await req(env, "/api/v1/auth/oauth/google/start")).status, 503);

    // 100 Specialized Domains Catalog (Item 100 split into 4 independent keys = 103)
    const cat100 = await (await req(env, "/api/v1/specialized/catalog-100")).json();
    assert.equal(cat100.totalTaxonomyItems, 100);
    assert.equal(cat100.independentDomainKeys, 103);
    assert.equal(cat100.foundationTopics.zh.length, 22);
    assert.equal(cat100.foundationTopics.en.length, 22);

    // Register user to test authenticated Language APIs
    const regRes = await req(env, "/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "API Tester",
        dateOfBirth: "1998-08-08",
        phoneNumber: "0912345678",
        email: "apitester@example.com",
        password: "ApiPassword123",
        confirmPassword: "ApiPassword123",
        schoolName: "HCMUS",
        workplaceName: "",
        termsAccepted: true
      })
    });
    const regData = await regRes.json();
    const cookie = extractCookie(regRes, "wb_session");
    const headers = { Cookie: cookie, "X-CSRF-Token": regData.csrfToken };

    // F1 Reading
    const rCreate = await (await req(env, "/api/v1/skills/reading/attempts", { method: "POST", headers, body: JSON.stringify({ languageCode: "en" }) })).json();
    assert.equal(rCreate.ok, true);
    const rSub = await (await req(env, `/api/v1/skills/reading/attempts/${rCreate.attemptId}/submit`, { method: "POST", headers, body: JSON.stringify({ answers: {}, rubricNotes: "Detailed critical analysis of the main argument." }) })).json();
    assert.equal(rSub.ok, true);

    // F2 Listening TTS -> 503 NOT_CONFIGURED (never fake audio)
    const ttsRes = await req(env, "/api/v1/speech/tts", { method: "POST", headers, body: JSON.stringify({ text: "Hello", languageCode: "en" }) });
    assert.equal(ttsRes.status, 503);

    // F3 & F4 Speaking + Audio Upload + Pronunciation NOT_CONFIGURED
    const spk = await (await req(env, "/api/v1/skills/speaking/sessions", { method: "POST", headers, body: JSON.stringify({ languageCode: "zh", targetText: "你好", targetPhonetic: "nǐ hǎo" }) })).json();
    assert.equal(spk.ok, true);
    const up = await req(env, `/api/v1/skills/speaking/sessions/${spk.sessionId}/audio`, { method: "POST", headers, body: JSON.stringify({ audioBase64: Buffer.from("RIFF_FAKE_WAV_TEST").toString("base64") }) });
    assert.equal(up.status, 200);
    const pron = await req(env, "/api/v1/pronunciation/assessments", { method: "POST", headers, body: JSON.stringify({ speakingSessionId: spk.sessionId, languageCode: "zh", targetText: "你好" }) });
    assert.equal(pron.status, 503);

    // F5 Writing Save & Evaluate
    const wrt = await (await req(env, "/api/v1/skills/writing/submissions", { method: "POST", headers, body: JSON.stringify({ languageCode: "en", promptTitle: "Intro", content: "i like learning English and Chinese every day on Word Bridge" }) })).json();
    assert.equal(wrt.ok, true);
    const wrtEval = await (await req(env, `/api/v1/skills/writing/submissions/${wrt.submissionId}/evaluate`, { method: "POST", headers, body: JSON.stringify({}) })).json();
    assert.equal(wrtEval.ok, true);
    assert.ok(wrtEval.evaluation.issuesDetected.length >= 1);

    // F6 Translation -> 503 NOT_CONFIGURED + Zero User Data Storage
    const tr = await req(env, "/api/v1/translation/translate", { method: "POST", headers, body: JSON.stringify({ text: "Hello world", sourceLang: "en", targetLang: "vi" }) });
    assert.equal(tr.status, 503);

    // F8 OCR -> 503 NOT_CONFIGURED
    const ocr = await req(env, "/api/v1/ocr/extract", { method: "POST", headers, body: JSON.stringify({ languageCode: "en" }) });
    assert.equal(ocr.status, 503);

    // F9 Unified Progress
    const prog = await (await req(env, "/api/v1/learning/progress", { headers: { Cookie: cookie } })).json();
    assert.equal(prog.ok, true);
    assert.equal(prog.skills.reading.attempts, 1);
    assert.equal(prog.skills.speaking.sessions, 1);
    assert.equal(prog.skills.writing.evaluated, 1);
  } finally {
    cleanup();
  }
});

test("6. P1/P2/P3 Fixes: Profile 1-of-2, Contact 12-Cat Anti-Spam, Editor Separation, Cron Audio Cleanup, OpenAPI & Academic UI", async () => {
  const { env, db, cleanup } = await createTestEnv();
  try {
    // Register user
    const regRes = await req(env, "/api/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        fullName: "P1 Tester",
        dateOfBirth: "1999-03-03",
        phoneNumber: "0987654321",
        email: "p1tester@example.com",
        password: "StrongPassword123",
        confirmPassword: "StrongPassword123",
        schoolName: "Bach Khoa",
        workplaceName: "",
        termsAccepted: true
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    const cookie = extractCookie(regRes, "wb_session");
    const headers = { Cookie: cookie, "X-CSRF-Token": regData.csrfToken };

    // P1: Profile update with ONLY schoolName succeeds
    const profRes = await req(env, "/api/v1/account/profile", {
      method: "POST",
      headers,
      body: JSON.stringify({ fullName: "P1 Tester Updated", phoneNumber: "0987654321", schoolName: "Bach Khoa", workplaceName: "" })
    });
    assert.equal(profRes.status, 200);

    // P1: Contact 12-category ticket + anti-duplicate spam 429
    const t1 = await req(env, "/api/v1/support/tickets", {
      method: "POST",
      headers,
      body: JSON.stringify({ requestType: "privacy_personal_data", senderName: "P1 Tester", senderEmail: "p1tester@example.com", subject: "Yeu cau du lieu", messageBody: "Toi muon kiem tra du lieu ca nhan cua toi." })
    });
    assert.equal(t1.status, 201);
    const tDup = await req(env, "/api/v1/support/tickets", {
      method: "POST",
      headers,
      body: JSON.stringify({ requestType: "privacy_personal_data", senderName: "P1 Tester", senderEmail: "p1tester@example.com", subject: "Yeu cau du lieu", messageBody: "Toi muon kiem tra du lieu ca nhan cua toi." })
    });
    assert.equal(tDup.status, 429);

    // P1: Cron cleanup deletes expired temporary speaking audio from D1 & R2
    const spk = await (await req(env, "/api/v1/skills/speaking/sessions", {
      method: "POST",
      headers,
      body: JSON.stringify({ languageCode: "en", targetText: "Hello world", retainLongTerm: false })
    })).json();
    await req(env, `/api/v1/skills/speaking/sessions/${spk.sessionId}/audio`, {
      method: "POST",
      headers,
      body: JSON.stringify({ audioBase64: Buffer.from("TEST_TEMP_AUDIO").toString("base64") })
    });
    await db.prepare("UPDATE wb_speaking_sessions SET audio_expires_at = datetime('now', '-1 hour') WHERE id = ?").bind(spk.sessionId).run();
    await worker.scheduled({}, env);
    const afterCron = await db.prepare("SELECT r2_audio_key FROM wb_speaking_sessions WHERE id = ?").bind(spk.sessionId).first();
    assert.equal(afterCron.r2_audio_key, null, "Expired temp audio key must be purged by Cron");

    // P2: OpenAPI exposes V4.2 public endpoints and ZERO /admin paths
    const openapi = await (await req(env, "/api/v1/openapi.json")).json();
    assert.ok(openapi.paths["/translation/translate"]);
    assert.ok(openapi.paths["/pronunciation/assessments"]);
    assert.ok(openapi.paths["/specialized/catalog-100"]);
    assert.equal(Object.keys(openapi.paths).some((k) => k.includes("admin")), false);

    // P2: 22 topics on /learning/chinese & /learning/english + 100 domains on /specialized
    const zhHtml = await (await req(env, "/learning/chinese")).text();
    assert.match(zhHtml, /22 chủ điểm nền tảng/);
    const enHtml = await (await req(env, "/learning/english")).text();
    assert.match(enHtml, /22 chủ điểm nền tảng/);
    const specHtml = await (await req(env, "/specialized")).text();
    assert.match(specHtml, /100 lĩnh vực chuyên ngành/);
    assert.match(specHtml, /103 mã chuyên ngành độc lập/);

    // P0 regression check (Test #34): infrastructure ASSETS exception surfaces HTTP 500
    const infraRes = await worker.fetch(new Request("https://wordbridge.io.vn/styles/design-system.css"), {
      ASSETS: { fetch() { throw new Error("TEST_ASSET_BACKEND_FAILED"); } }
    }, {});
    assert.equal(infraRes.status, 500);
  } finally {
    cleanup();
  }
});

test("V4.3-Suite-7: 8 Excel Vocab Datasets + 12,000 Authored Terms (36,104 total), 1,000-Article Native Web Reader (500 ZH + 500 EN), PBKDF2 100,000 Guard & <= 80 Files", async () => {
  const { env, db, cleanup } = await createTestEnv();
  try {
    // 1. Verify PBKDF2 100,000 iterations in src/index.js & safe rejection of >100k hash (0 HTTP 500)
    const srcText = fs.readFileSync(path.join(process.cwd(), "src/index.js"), "utf8");
    assert.match(srcText, /PBKDF2_ITERATIONS\s*=\s*1e5/);
    const regRes = await req(env, "/api/v1/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        fullName: "V43 Tester",
        dateOfBirth: "2000-05-15",
        phoneNumber: "0909888777",
        email: "v43tester@wordbridge.io.vn",
        password: "StrongPassword@2026!",
        confirmPassword: "StrongPassword@2026!",
        schoolName: "ĐH Bách Khoa TP.HCM",
        workplaceName: "Word Bridge Lab",
        termsAccepted: true
      })
    });
    assert.equal(regRes.status, 201);
    const regData = await regRes.json();
    const cookie = extractCookie(regRes, "wb_session");
    const csrf = regData.csrfToken;
    const accRow = await db.prepare("SELECT password_hash FROM wb_accounts WHERE email = ?").bind("v43tester@wordbridge.io.vn").first();
    assert.ok(accRow.password_hash.startsWith("pbkdf2_sha256$100000$"), "Password hash MUST use exact 100,000 PBKDF2 iterations");

    // Simulate malformed/over-limit PBKDF2 hash (>100,000 iterations) -> must return 401, NEVER 500
    await db.prepare("UPDATE wb_accounts SET password_hash = ? WHERE email = ?")
      .bind("pbkdf2_sha256$999999$00112233445566778899aabbccddeeff$00112233", "v43tester@wordbridge.io.vn").run();
    const badLogin = await req(env, "/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "v43tester@wordbridge.io.vn", password: "StrongPassword@2026!" })
    });
    assert.equal(badLogin.status, 401, "Over-limit PBKDF2 hash must fail closed with 401, not 500");

    // 2. Verify 36,104 bilingual specialized terms (12,104 EN Excel + 12,000 ZH Excel + 12,000 Authored +1,000/domain)
    const idxJson = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/vocab/index.json"), "utf8"));
    assert.equal(idxJson.domainCount, 22);
    assert.equal(idxJson.uploadedEnWords, 12104);
    assert.equal(idxJson.uploadedZhWords, 12000);
    assert.equal(idxJson.authoredNewWords, 12000);
    assert.equal(idxJson.totalWords, 46104);
    for (const d of idxJson.domains) {
      assert.equal(d.authoredTotalCount, 1000, `${d.slug} must have +1,000 newly authored terms`);
      assert.ok(d.enCount >= 500 && d.zhCount >= 500, `${d.slug} must have >=500 EN & >=500 ZH terms`);
    }

    // API tests on /api/v1/specialized/terms (EN, ZH, authored +1,000, pagination)
    const specZhRes = await req(env, "/api/v1/specialized/terms?domain=dien-cong-nghiep&lang=zh&src=wb_v43&page=2&limit=25", {
      headers: { Cookie: cookie }
    });
    assert.equal(specZhRes.status, 200);
    const specZh = await specZhRes.json();
    assert.equal(specZh.total, 500);
    assert.equal(specZh.page, 2);
    assert.equal(specZh.words.length, 25);
    assert.equal(specZh.words[0].l, "zh");
    assert.equal(specZh.words[0].src, "wb_v43");

    // Interactive explorer mounted on /specialized/<slug>
    const specPageRes = await req(env, "/specialized/ke-toan-doanh-nghiep");
    assert.equal(specPageRes.status, 200);
    const specPageHtml = await specPageRes.text();
    assert.match(specPageHtml, /id="wb-vocab-explorer"/);
    assert.match(specPageHtml, /vocab-explorer\.js/);

    // 3. Verify 1,000-article Native Web Reading Library (500 ZH / 500 sub-fields + 500 EN / 500 sub-fields, ZERO PDFs)
    const readerLib = JSON.parse(fs.readFileSync(path.join(process.cwd(), "public/data/reader-library.json"), "utf8"));
    assert.equal(readerLib.totalCount, 1000);
    assert.equal(readerLib.zhCount, 500);
    assert.equal(readerLib.enCount, 500);
    assert.equal(readerLib.articles.length, 1000);
    const zhSubFields = new Set(readerLib.articles.filter((a) => a.language_code === "zh").map((a) => a.sub_field_vi));
    const enSubFields = new Set(readerLib.articles.filter((a) => a.language_code === "en").map((a) => a.sub_field_vi));
    assert.equal(zhSubFields.size, 500, "Must cover 500 distinct Chinese specialized sub-fields");
    assert.equal(enSubFields.size, 500, "Must cover 500 distinct English specialized sub-fields");
    assert.ok(readerLib.articles.every((a) => a.references && a.references.length >= 2 && a.content_text.length > 400));

    // Reader API & HTML routes (list, filter, detail, progress save)
    const rListRes = await req(env, "/api/v1/reader/documents?language=zh&page=1&limit=20");
    assert.equal(rListRes.status, 200);
    const rList = await rListRes.json();
    assert.ok(rList.stats.zhCount >= 500 && rList.stats.enCount >= 500);
    assert.equal(rList.documents.length, 20);

    const sampleZh = readerLib.articles.find((a) => a.language_code === "zh");
    const sampleEn = readerLib.articles.find((a) => a.language_code === "en");
    const rZhHtml = await (await req(env, `/reader/${sampleZh.slug}`)).text();
    assert.match(rZhHtml, /Nguồn tham chiếu khoa học, khảo thí & tiêu chuẩn quốc tế/);
    assert.match(rZhHtml, /data-wb-tts=/);
    const rEnHtml = await (await req(env, `/reader/${sampleEn.slug}`)).text();
    assert.match(rEnHtml, /Nguồn tham chiếu khoa học, khảo thí & tiêu chuẩn quốc tế/);

    // Save reading progress on built-in web article (no FK error, 200 OK)
    const saveProg = await req(env, "/api/v1/reader/progress", {
      method: "POST",
      headers: { "Content-Type": "application/json", Cookie: cookie, "X-CSRF-Token": csrf },
      body: JSON.stringify({ documentId: sampleZh.id, progressPercent: 85, bookmarked: true, personalNotes: "Bài đọc rất chuẩn xác." })
    });
    assert.equal(saveProg.status, 200);
    const saveProgData = await saveProg.json();
    assert.equal(saveProgData.ok, true);
    assert.equal(saveProgData.progressPercent, 85);

    // 4. Verify total project file count <= 80
    let fileCount = 0;
    function walk(dir) {
      for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        if (entry.name === "node_modules" || entry.name === ".git") continue;
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) walk(full);
        else fileCount++;
      }
    }
    walk(process.cwd());
    assert.ok(fileCount <= 80, `Total project files (${fileCount}) must be <= 80`);
  } finally {
    cleanup();
  }
});

test("V4.4-Suite-8: Pure Vietnamese UI (no EN switcher), All 22/22 Specialized Domains Direct Study (46,104 terms), and >10,000-Term Practice Bank", async () => {
  const { env, cleanup } = await createTestEnv();
  try {
    // 1. No EN UI switcher on Home or public pages
    for (const p of ["/", "/specialized", "/practice", "/reader", "/dictionary", "/help"]) {
      const res = await req(env, p);
      assert.equal(res.status, 200, `${p} must return 200`);
      const html = await res.text();
      assert.doesNotMatch(html, /data-wb-locale/, `${p} must NOT contain EN UI switcher`);
    }

    // 2. All 22 specialized domains return 200 with #wb-vocab-explorer (never redirect to /) & real API terms
    const domRes = await req(env, "/api/v1/specialized/domains");
    const domData = await domRes.json();
    assert.equal(domData.domains.length, 22);
    for (const d of domData.domains) {
      assert.ok(d.count >= 1000, `${d.slug} must have >= 1,000 terms`);
      const pageRes = await req(env, `/specialized/${d.slug}`);
      assert.equal(pageRes.status, 200, `/specialized/${d.slug} must return 200`);
      const pageHtml = await pageRes.text();
      assert.match(pageHtml, /id="wb-vocab-explorer"/, `/specialized/${d.slug} must mount vocab explorer`);
      const apiRes = await req(env, `/api/v1/specialized/terms?domain=${d.slug}&limit=10`);
      assert.equal(apiRes.status, 200);
      const apiData = await apiRes.json();
      assert.ok(apiData.total >= 1000 && apiData.words.length === 10);
    }

    // 3. >10,000-term Practice Bank across All, Listening, Speaking, Reading, Writing, Vocabulary, Grammar
    for (const sk of ["", "listening", "speaking", "reading", "writing", "vocabulary", "grammar"]) {
      const pUrl = sk ? `/practice/${sk}` : "/practice";
      const pRes = await req(env, pUrl);
      assert.equal(pRes.status, 200, `${pUrl} must return 200`);
      const pHtml = await pRes.text();
      assert.match(pHtml, /id="wb-practice-bank"/, `${pUrl} must mount interactive practice bank`);
    }
    const pbRes = await req(env, "/api/v1/practice/bank?skill=all&page=1&limit=20");
    assert.equal(pbRes.status, 200);
    const pb = await pbRes.json();
    assert.ok(pb.total > 10000, `Practice bank total (${pb.total}) must exceed 10,000 terms`);
    assert.equal(pb.total, 46104);
    assert.equal(pb.items.length, 20);

    const pbReadRes = await req(env, "/api/v1/practice/bank?skill=reading&page=1&limit=20");
    const pbRead = await pbReadRes.json();
    assert.equal(pbRead.total, 1000);
    assert.ok(pbRead.bankWordsTotal > 10000);
  } finally {
    cleanup();
  }
});
