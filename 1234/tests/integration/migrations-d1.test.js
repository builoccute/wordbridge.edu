import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { SQLiteD1Database } from '../helpers/sqlite-d1-shim.js';

test('All 11 D1 migrations are strictly non-destructive (ZERO DROP TABLE) and deliver 108 sessions, 115+ lessons, specialized zh/en courses & balanced 350+ dictionary', async () => {
  const migrationsDir = path.resolve(process.cwd(), 'database/migrations');
  const files = fs.readdirSync(migrationsDir).filter((f) => f.endsWith('.sql')).sort();
  assert.ok(files.length >= 11, `Expected at least 11 migration files, got ${files.length}`);

  for (const f of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, f), 'utf8').replace(/^--.*$/gm, '');
    assert.ok(!/\bDROP\s+TABLE\b/i.test(sql), `Destructive DROP TABLE found in ${f}`);
  }

  const db = new SQLiteD1Database(':memory:');
  try {
    await db.applyAllMigrations(migrationsDir);

    const langs = (await db.prepare('SELECT code, has_specialized FROM wb_languages ORDER BY code').all()).results;
    assert.deepEqual(langs, [
      { code: 'en', has_specialized: 1 },
      { code: 'ru', has_specialized: 0 },
      { code: 'zh', has_specialized: 1 },
    ]);

    await assert.rejects(() =>
      db.prepare("INSERT INTO wb_languages (code, name_vi, native_name, has_general, has_specialized, proficiency_framework, script_system, phonetic_system) VALUES ('ja', 'Tiếng Nhật', '日本語', 1, 0, 'JLPT', 'Kanji', 'Kana')").run()
    );

    const sessions = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_study_sessions').first();
    assert.equal(sessions.cnt, 108, 'Expected 108 distinct study sessions across 36 foundation weeks');

    const lessons = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_lessons').first();
    assert.ok(lessons.cnt >= 115, `Expected >= 115 real lessons (108 foundation + 7 specialized), got ${lessons.cnt}`);

    const resources = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_learning_resources').first();
    assert.ok(resources.cnt >= 108, `Expected >= 108 learning resources, got ${resources.cnt}`);

    const courses = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_courses').first();
    assert.ok(courses.cnt >= 10, `Expected >= 10 courses (3 foundation + 7 specialized zh/en), got ${courses.cnt}`);

    const dictByLang = (await db.prepare('SELECT language_code, COUNT(*) AS cnt FROM wb_dictionary_entries GROUP BY language_code ORDER BY language_code').all()).results;
    const map = Object.fromEntries(dictByLang.map((r) => [r.language_code, r.cnt]));
    assert.ok(map.zh >= 65, `Expected >= 65 Chinese dictionary entries, got ${map.zh}`);
    assert.ok(map.en >= 225, `Expected >= 225 English dictionary entries, got ${map.en}`);
    assert.ok(map.ru >= 60, `Expected >= 60 Russian dictionary entries, got ${map.ru}`);

    const intelStatuses = await db.prepare('SELECT COUNT(*) AS cnt FROM wb_intelligence_status').first();
    assert.equal(intelStatuses.cnt, 15, 'Expected 15 intelligence operational status rows');
  } finally {
    db.close();
  }
});
