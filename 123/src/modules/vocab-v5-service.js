/**
 * WORD BRIDGE V5.0 — Bilingual Vocabulary Engine (EN – ZH – VI)
 * Enforces published-only visibility, honest verified counts, tone-insensitive Pinyin search,
 * multi-dimensional filtering (lang, topic, domain, pos, level), and notebook/SRS payload mapping.
 */

export function normalizePinyin(input) {
  return String(input || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export function filterPublishedEntries(entries) {
  return (Array.isArray(entries) ? entries : []).filter(
    (item) => item && item.reviewStatus === "published"
  );
}

export function searchVocabV5(entries, options = {}) {
  const published = filterPublishedEntries(entries);
  const q = String(options.q || "").trim();
  const qLower = q.toLowerCase();
  const qPlain = normalizePinyin(q);
  const lang = String(options.lang || "").trim().toLowerCase();
  const topic = String(options.topic || "").trim().toLowerCase();
  const domain = String(options.domain || "").trim().toLowerCase();
  const pos = String(options.pos || "").trim().toLowerCase();
  const level = String(options.level || "").trim().toLowerCase();
  const page = Math.max(1, Number(options.page || 1));
  const limit = Math.min(100, Math.max(1, Number(options.limit || 50)));

  let filtered = published;

  if (lang === "en") filtered = filtered.filter((e) => Boolean(e.en));
  else if (lang === "zh") filtered = filtered.filter((e) => Boolean(e.zh));
  else if (lang === "bilingual") filtered = filtered.filter((e) => Boolean(e.en && e.zh));

  if (domain) {
    filtered = filtered.filter((e) => String(e.domain || "").toLowerCase() === domain);
  }
  if (topic) {
    filtered = filtered.filter((e) => String(e.topic || "").toLowerCase().includes(topic));
  }
  if (pos) {
    filtered = filtered.filter((e) => String(e.pos || "").toLowerCase() === pos);
  }
  if (level) {
    filtered = filtered.filter((e) => String(e.level || "").toLowerCase().includes(level));
  }
  if (q) {
    filtered = filtered.filter((e) => {
      const enMatch = String(e.en || "").toLowerCase().includes(qLower);
      const zhMatch = String(e.zh || "").includes(q);
      const pinyinMatch =
        String(e.pinyin || "").toLowerCase().includes(qLower) ||
        normalizePinyin(e.pinyinPlain || e.pinyin).includes(qPlain);
      const viMatch = String(e.meaningVi || "").toLowerCase().includes(qLower);
      const topicMatch = String(e.topic || "").toLowerCase().includes(qLower);
      return enMatch || zhMatch || pinyinMatch || viMatch || topicMatch;
    });
  }

  const total = filtered.length;
  const totalPages = Math.max(1, Math.ceil(total / limit));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * limit;

  return {
    ok: true,
    version: "5.0.0",
    publishedTotal: published.length,
    total,
    page: safePage,
    limit,
    totalPages,
    entries: filtered.slice(start, start + limit)
  };
}

export function getVocabV5EntryById(entries, id) {
  const cleanId = String(id || "").trim();
  if (!cleanId) return null;
  return filterPublishedEntries(entries).find((e) => e.id === cleanId) || null;
}

export function toDictionaryNotebookPayload(entry) {
  return {
    id: `v5_${entry.id.toLowerCase()}`,
    languageCode: "bilingual",
    slug: entry.id.toLowerCase(),
    headword: `${entry.en} — ${entry.zh}`,
    phonetic: `${entry.ipa} | ${entry.pinyin}`,
    partOfSpeech: entry.pos,
    meaningVi: entry.meaningVi,
    definitionEn: entry.defEn,
    definitionZh: entry.defZh,
    exampleSentence: `${entry.exampleEn} / ${entry.exampleZh}`,
    exampleVi: entry.exampleVi,
    domain: entry.domain,
    topic: entry.topic,
    level: entry.level,
    source: entry.source
  };
}
