/**
 * WORD BRIDGE — Idempotent D1 Catalog Seed Generator
 * Generates `migrations/seeds/seed_wb_catalog_d1.sql` from verified JSON files:
 *   - 8 Self-Study Courses (`wb_courses`)
 *   - 2,000 Flashcards (`wb_flashcard_deck_items`, strictly `FLASHCARD_ONLY`)
 *   - 49 Audio Asset Bindings (`wb_audio_asset_bindings`, strictly `TEXT_SCRIPT_ONLY`)
 *
 * Usage:
 *   node integration/seed-d1-from-json.mjs
 *   npx wrangler d1 execute word --local --file=migrations/seeds/seed_wb_catalog_d1.sql
 *   npx wrangler d1 execute word --remote --file=migrations/seeds/seed_wb_catalog_d1.sql
 */
import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const DATA = path.join(ROOT, "data");
const OUT_DIR = path.join(ROOT, "migrations", "seeds");
fs.mkdirSync(OUT_DIR, { recursive: true });
const OUT_FILE = path.join(OUT_DIR, "seed_wb_catalog_d1.sql");

function sqlStr(v) {
  if (v === null || v === undefined) return "NULL";
  return "'" + String(v).replace(/'/g, "''") + "'";
}

function sqlNum(v, fallback = 0) {
  const n = Number(v);
  return Number.isFinite(n) ? String(n) : String(fallback);
}

const lines = [
  "-- ============================================================================",
  "-- WORD BRIDGE — Idempotent D1 Seed for wb_courses, wb_flashcard_deck_items,",
  "--               and wb_audio_asset_bindings (Generated from verified data/)",
  "-- Safety: Strictly targets wb_* tables only. Never touches legacy dictionary.",
  "-- ============================================================================",
  ""
];

// 1. Courses (8)
const courses = JSON.parse(fs.readFileSync(path.join(DATA, "courses", "courses-001.json"), "utf8"));
for (const c of courses) {
  lines.push(
    `INSERT OR REPLACE INTO wb_courses (id, title, language, proficiency_scale, scale_note_vi, category, description, entry_level, target_level, target_audience, estimated_hours, delivery_mode, certificate_issued, status, payload_json) VALUES (` +
    [
      sqlStr(c.id), sqlStr(c.title), sqlStr(c.language), sqlStr(c.proficiency_scale),
      sqlStr(c.scale_note_vi || ""), sqlStr(c.category), sqlStr(c.description),
      sqlStr(c.entry_level), sqlStr(c.target_level), sqlStr(c.target_audience || ""),
      sqlNum(c.estimated_hours, 10), "'SELF_STUDY'", "0", sqlStr(c.status || "REVIEW_REQUIRED"),
      sqlStr(JSON.stringify(c))
    ].join(", ") + ");"
  );
}

// 2. Flashcards (2,000, strictly FLASHCARD_ONLY)
let fcCount = 0;
for (let i = 1; i <= 4; i++) {
  const f = path.join(DATA, "flashcards", `flashcards-00${i}.json`);
  const cards = JSON.parse(fs.readFileSync(f, "utf8"));
  for (const fc of cards) {
    fcCount++;
    lines.push(
      `INSERT OR REPLACE INTO wb_flashcard_deck_items (id, en, zh, pinyin, ipa, vi, pos, example_en, example_zh, example_pinyin, example_vi, topic, domain_id, level_en, level_zh, deck_scope, status) VALUES (` +
      [
        sqlStr(fc.id), sqlStr(fc.en), sqlStr(fc.zh), sqlStr(fc.pinyin), sqlStr(fc.ipa),
        sqlStr(fc.vi), sqlStr(fc.pos), sqlStr(fc.example_en), sqlStr(fc.example_zh),
        sqlStr(fc.example_pinyin), sqlStr(fc.example_vi), sqlStr(fc.topic),
        sqlNum(fc.domain, 1), sqlStr(fc.level_en), sqlStr(fc.level_zh),
        "'FLASHCARD_ONLY'", sqlStr(fc.status || "REVIEW_REQUIRED")
      ].join(", ") + ");"
    );
  }
}

// 3. Audio Bindings (49, strictly TEXT_SCRIPT_ONLY unless audio_url exists)
const bindings = JSON.parse(fs.readFileSync(path.join(DATA, "audio", "audio-manifest.json"), "utf8"));
for (const b of bindings) {
  lines.push(
    `INSERT OR REPLACE INTO wb_audio_asset_bindings (binding_id, module, source_id, language, asset_status, audio_url, r2_object_key, duration_seconds, allow_playback_button) VALUES (` +
    [
      sqlStr(b.binding_id), sqlStr(b.module), sqlStr(b.source_id), sqlStr(b.language),
      sqlStr(b.asset_status || "TEXT_SCRIPT_ONLY"),
      b.audio_url ? sqlStr(b.audio_url) : "NULL",
      sqlStr(b.r2_object_key),
      sqlNum(b.duration_seconds, 0),
      b.allow_playback_button ? "1" : "0"
    ].join(", ") + ");"
  );
}

fs.writeFileSync(OUT_FILE, lines.join("\n") + "\n", "utf8");
console.log(`SEED_GENERATED: courses=${courses.length}, flashcards=${fcCount}, audio=${bindings.length}, file=${OUT_FILE}`);
