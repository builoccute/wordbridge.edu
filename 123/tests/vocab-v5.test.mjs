import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { runVocabV5Audit } from "../scripts/vocab-v5-qa.mjs";
import {
  normalizePinyin,
  filterPublishedEntries,
  searchVocabV5,
  getVocabV5EntryById,
  toDictionaryNotebookPayload
} from "../src/modules/vocab-v5-service.js";

const V5_DIR = path.join(process.cwd(), "public", "data", "vocab-v5");
const indexV5 = JSON.parse(fs.readFileSync(path.join(V5_DIR, "index.json"), "utf8"));
const progressV5 = JSON.parse(fs.readFileSync(path.join(V5_DIR, "progress.json"), "utf8"));
const entries = (indexV5.shards || []).flatMap((s) =>
  JSON.parse(fs.readFileSync(path.join(V5_DIR, s.file), "utf8")).entries || []
);

test("V5.0 published corpus passes full automated QA audit with zero errors", () => {
  const report = runVocabV5Audit(V5_DIR);
  assert.equal(report.ok, true, `QA errors: ${report.errors.join("; ")}`);
  assert.equal(report.total, progressV5.publishedValidEntries);
  assert.equal(report.published, progressV5.publishedValidEntries);
  assert.equal(report.enCount, progressV5.publishedValidEntries);
  assert.equal(report.zhCount, progressV5.publishedValidEntries);
  assert.equal(report.bilingualCount, progressV5.publishedValidEntries);
  assert.equal(report.duplicateCount, 0);
  assert.ok(report.published >= 1000);
});

test("Honest count policy: publishedTotal matches verified published records, never premature 50,000", () => {
  assert.equal(indexV5.displayCountPolicy, "published_only");
  assert.equal(indexV5.publishedTotal, entries.length);
  assert.equal(indexV5.publishedTotal, progressV5.publishedValidEntries);
  assert.ok(indexV5.publishedTotal < 50000);
});

test("Search by English, Chinese, Pinyin (toned & toneless), and Vietnamese across Batch 001 & 002", () => {
  assert.ok(searchVocabV5(entries, { q: "hypothesis" }).entries.some((e) => e.en === "hypothesis"));
  assert.ok(searchVocabV5(entries, { q: "general ledger" }).entries.some((e) => e.en === "general ledger"));
  assert.ok(searchVocabV5(entries, { q: "供应链" }).entries.some((e) => e.en === "supply chain"));
  assert.ok(searchVocabV5(entries, { q: "诊断" }).entries.some((e) => e.en === "diagnosis"));
  assert.ok(searchVocabV5(entries, { q: "suànfǎ" }).entries.some((e) => e.en === "algorithm"));
  assert.ok(searchVocabV5(entries, { q: "suanfa" }).entries.some((e) => e.en === "algorithm"));
  assert.ok(searchVocabV5(entries, { q: "zhenduan" }).entries.some((e) => e.en === "diagnosis"));
  assert.equal(normalizePinyin("jiàngé chóngfù"), "jiange chongfu");
  assert.ok(searchVocabV5(entries, { q: "lặp lại ngắt quãng" }).entries.some((e) => e.en === "spaced repetition"));
});

test("Multi-dimensional filtering by domain, topic, pos, level, and published-only gate", () => {
  assert.ok(searchVocabV5(entries, { domain: "technology" }).total >= 100);
  assert.ok(searchVocabV5(entries, { domain: "accounting" }).total >= 101);
  assert.ok(searchVocabV5(entries, { domain: "healthcare" }).total >= 102);

  const byPos = searchVocabV5(entries, { pos: "idiom" });
  assert.ok(byPos.total >= 25);
  assert.ok(byPos.entries.every((e) => e.pos === "idiom"));

  const byLevel = searchVocabV5(entries, { level: "HSK 5" });
  assert.ok(byLevel.total > 300);

  const mixed = [...entries, { ...entries[0], id: "WB5-DRAFT-1", reviewStatus: "draft" }];
  assert.equal(filterPublishedEntries(mixed).length, entries.length);
  assert.equal(getVocabV5EntryById(mixed, "WB5-DRAFT-1"), null);
});

test("Detail lookup and Personal Notebook / Flashcard / SRS payload mapping", () => {
  const detail = getVocabV5EntryById(entries, "WB5-00501");
  assert.ok(detail);
  assert.equal(detail.en, "general ledger");
  assert.equal(detail.zh, "总分类账");

  const mapped = toDictionaryNotebookPayload(detail);
  assert.equal(mapped.id, "v5_wb5-00501");
  assert.equal(mapped.languageCode, "bilingual");
  assert.ok(mapped.headword.includes("general ledger") && mapped.headword.includes("总分类账"));
});
