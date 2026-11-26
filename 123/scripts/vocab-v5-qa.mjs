import fs from "node:fs";
import path from "node:path";

const ROOT = process.cwd();
const V5_DIR = path.join(ROOT, "public", "data", "vocab-v5");
const REQUIRED_FIELDS = [
  "id", "en", "zh", "pinyin", "ipa", "meaningVi", "pos",
  "defEn", "defZh", "context", "exampleEn", "exampleZh", "exampleVi",
  "topic", "domain", "level", "source", "reviewStatus"
];
const TONE_REGEX = /[āáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ]/;
const HANZI_REGEX = /[\u4e00-\u9fff]/;
const TEMPLATE_EX_PATTERNS = [/^请检查.+。$/, /^Verify the .+ parameters according to /i, /^Apply .+ according to /i, /^请依据.+核查/];

export function runVocabV5Audit(v5Dir = V5_DIR) {
  const indexPath = path.join(v5Dir, "index.json");
  const index = JSON.parse(fs.readFileSync(indexPath, "utf8"));
  const seenIds = new Set();
  const seenEn = new Set();
  const seenZh = new Set();

  let total = 0;
  let published = 0;
  let enCount = 0;
  let zhCount = 0;
  let bilingualCount = 0;
  const errors = [];

  for (const shardMeta of index.shards || []) {
    const shardPath = path.join(v5Dir, shardMeta.file);
    const shard = JSON.parse(fs.readFileSync(shardPath, "utf8"));
    for (const item of shard.entries || []) {
      total += 1;
      for (const field of REQUIRED_FIELDS) {
        if (item[field] === undefined || item[field] === null || String(item[field]).trim() === "") {
          errors.push(`Missing required field "${field}" on ${item.id || "UNKNOWN"}`);
        }
      }
      if (seenIds.has(item.id)) errors.push(`Duplicate ID: ${item.id}`);
      seenIds.add(item.id);

      const enKey = String(item.en || "").trim().toLowerCase();
      const zhKey = String(item.zh || "").trim();
      if (enKey) {
        enCount += 1;
        if (seenEn.has(enKey)) errors.push(`Duplicate EN term: ${item.en} (${item.id})`);
        seenEn.add(enKey);
      }
      if (zhKey) {
        zhCount += 1;
        if (seenZh.has(zhKey)) errors.push(`Duplicate ZH term: ${item.zh} (${item.id})`);
        seenZh.add(zhKey);
      }
      if (enKey && zhKey) bilingualCount += 1;

      const ipa = String(item.ipa || "").trim();
      if (!ipa.startsWith("/") || !ipa.endsWith("/") || ipa.slice(1, -1).toLowerCase() === enKey) {
        errors.push(`Invalid/fake IPA on ${item.id}: ${ipa}`);
      }
      const pinyin = String(item.pinyin || "").trim();
      if (!TONE_REGEX.test(pinyin) || HANZI_REGEX.test(pinyin) || pinyin === "中文简体") {
        errors.push(`Invalid/fake Pinyin on ${item.id}: ${pinyin}`);
      }
      if (!HANZI_REGEX.test(zhKey)) {
        errors.push(`ZH field missing Hanzi on ${item.id}: ${zhKey}`);
      }
      const exEn = String(item.exampleEn || "").trim();
      const exZh = String(item.exampleZh || "").trim();
      if (TEMPLATE_EX_PATTERNS.some((rx) => rx.test(exEn) || rx.test(exZh))) {
        errors.push(`Template example detected on ${item.id}`);
      }
      if (item.reviewStatus === "published") published += 1;
    }
  }

  if (index.publishedTotal !== published) {
    errors.push(`index.json publishedTotal (${index.publishedTotal}) != actual published (${published})`);
  }
  if (index.publishedTotal >= 50000 && published < 50000) {
    errors.push("Honest count policy violated: reported 50,000 before reaching 50,000 published entries.");
  }

  return {
    ok: errors.length === 0,
    total,
    published,
    enCount,
    zhCount,
    bilingualCount,
    duplicateCount: (total - seenIds.size) + (enCount - seenEn.size) + (zhCount - seenZh.size),
    errorCount: errors.length,
    errors: errors.slice(0, 50)
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const report = runVocabV5Audit();
  console.log(JSON.stringify(report, null, 2));
  if (!report.ok) process.exit(1);
}
