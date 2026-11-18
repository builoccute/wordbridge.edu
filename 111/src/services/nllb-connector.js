/**
 * @file src/services/nllb-connector.js
 * @description Bộ kết nối Microservice NMT Tự chủ của Word Bridge (Meta NLLB-200 + CTranslate2 INT8)
 * kết hợp Bộ Từ điển Thuật ngữ 20 Chuyên ngành (Domain Glossary Pre/Post-Processor).
 *
 * Kiến trúc Phương án 3:
 *   1. Ánh xạ 104 mã ngôn ngữ ISO-639 của Word Bridge sang chuẩn FLORES-200 (200 ngôn ngữ của NLLB-200).
 *   2. Tiền xử lý (Pre-processing): Bảo vệ thuật ngữ chuyên ngành chuẩn hóa và các thực thể cố định (URL, Email, Số).
 *   3. Gọi Microservice NLLB-200 CTranslate2 INT8 tự vận hành (`WORDBRIDGE_NLLB_API_URL`) hoàn toàn không lưu dữ liệu.
 *   4. Hậu xử lý (Post-processing): Khôi phục và đồng bộ thuật ngữ chuyên ngành trong toàn văn bản.
 */

import { getDomainById } from "./domains.js";

export const ISO_TO_FLORES200 = Object.freeze({
  vi: "vie_Latn",
  en: "eng_Latn",
  zh: "zho_Hans",
  "zh-TW": "zho_Hant",
  ja: "jpn_Jpan",
  ko: "kor_Hang",
  ru: "rus_Cyrl",
  fr: "fra_Latn",
  de: "deu_Latn",
  es: "spa_Latn",
  pt: "por_Latn",
  it: "ita_Latn",
  ar: "arb_Arab",
  th: "tha_Thai",
  id: "ind_Latn",
  ms: "zsm_Latn",
  hi: "hin_Deva",
  nl: "nld_Latn",
  pl: "pol_Latn",
  tr: "tur_Latn",
  uk: "ukr_Cyrl",
  cs: "ces_Latn",
  sv: "swe_Latn",
  da: "dan_Latn",
  fi: "fin_Latn",
  no: "nob_Latn",
  el: "ell_Grek",
  he: "heb_Hebr",
  fa: "pes_Arab",
  ur: "urd_Arab",
  bn: "ben_Beng",
  ta: "tam_Taml",
  te: "tel_Telu",
  mr: "mar_Deva",
  gu: "guj_Gujr",
  kn: "kan_Knda",
  ml: "mal_Mlym",
  pa: "pan_Guru",
  ne: "npi_Deva",
  si: "sin_Sinh",
  km: "khm_Khmr",
  lo: "lao_Laoo",
  my: "mya_Mymr",
  tl: "tgl_Latn",
  hu: "hun_Latn",
  ro: "ron_Latn",
  bg: "bul_Cyrl",
  sr: "srp_Cyrl",
  hr: "hrv_Latn",
  sk: "slk_Latn",
  sl: "slv_Latn",
  et: "est_Latn",
  lv: "lvs_Latn",
  lt: "lit_Latn",
  is: "isl_Latn",
  ga: "gle_Latn",
  cy: "cym_Latn",
  ca: "cat_Latn",
  gl: "glg_Latn",
  eu: "eus_Latn",
  mt: "mlt_Latn",
  sq: "als_Latn",
  mk: "mkd_Cyrl",
  bs: "bos_Latn",
  be: "bel_Cyrl",
  ka: "kat_Geor",
  hy: "hye_Armn",
  az: "azj_Latn",
  kk: "kaz_Cyrl",
  uz: "uzn_Latn",
  ky: "kir_Cyrl",
  tg: "tgk_Cyrl",
  tk: "tuk_Latn",
  mn: "khk_Cyrl",
  ps: "pbt_Arab",
  sd: "snd_Arab",
  ku: "kmr_Latn",
  am: "amh_Ethi",
  ti: "tir_Ethi",
  sw: "swh_Latn",
  af: "afr_Latn",
  zu: "zul_Latn",
  xh: "xho_Latn",
  yo: "yor_Latn",
  ig: "ibo_Latn",
  ha: "hau_Latn",
  so: "som_Latn",
  mg: "plt_Latn",
  rw: "kin_Latn",
  sn: "sna_Latn",
  ny: "nya_Latn",
  st: "sot_Latn",
  ln: "lin_Latn",
  ht: "hat_Latn",
  jv: "jav_Latn",
  su: "sun_Latn",
  ceb: "ceb_Latn",
  mi: "mri_Latn",
  sm: "smo_Latn",
  haw: "haw_Latn",
  eo: "epo_Latn",
  la: "lat_Latn",
  lb: "ltz_Latn",
  yi: "ydd_Hebr"
});

export function toFlores200Code(isoCode) {
  if (!isoCode) return "eng_Latn";
  const raw = String(isoCode).trim();
  if (ISO_TO_FLORES200[raw]) return ISO_TO_FLORES200[raw];
  const lower = raw.toLowerCase();
  for (const [k, v] of Object.entries(ISO_TO_FLORES200)) {
    if (k.toLowerCase() === lower) return v;
  }
  return "eng_Latn";
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Tiền xử lý văn bản trước khi đưa vào mô hình NLLB-200:
 * Gắn nhãn thuật ngữ chuyên ngành của Word Bridge để mô hình không dịch chệch thuật ngữ kỹ thuật.
 */
export function applyDomainGlossaryPrePass(text, sourceLang, targetLang, domainId = "general") {
  const domain = getDomainById(domainId);
  const s = String(sourceLang || "").toLowerCase();
  const t = String(targetLang || "").toLowerCase();

  let activeGlossary = null;
  if (s === "vi" && t === "en") activeGlossary = domain.glossaryViToEn;
  else if (s === "en" && t === "vi") activeGlossary = domain.glossaryEnToVi;

  if (!activeGlossary) {
    return { preProcessedText: text, replacements: [], appliedTerms: [] };
  }

  let out = String(text || "");
  const replacements = [];
  const appliedTerms = [];
  const sortedEntries = Object.entries(activeGlossary).sort((a, b) => b[0].length - a[0].length);

  for (const [srcTerm, tgtTerm] of sortedEntries) {
    const pattern = new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(srcTerm)}(?![\\p{L}\\p{N}])`, "giu");
    if (pattern.test(out)) {
      const token = `__WB_TERM_${replacements.length}__`;
      replacements.push({ token, tgtTerm });
      appliedTerms.push(`${srcTerm} → ${tgtTerm}`);
      out = out.replace(pattern, token);
    }
  }

  return { preProcessedText: out, replacements, appliedTerms };
}

export function restoreDomainGlossaryPostPass(translatedText, replacements = []) {
  let out = String(translatedText || "");
  for (const item of replacements) {
    out = out.replaceAll(item.token, item.tgtTerm);
  }
  return out;
}

/**
 * Gọi Microservice NLLB-200 + CTranslate2 INT8 tự vận hành của Word Bridge.
 * Hỗ trợ cả kết nối HTTP tới container `self-hosted-nmt` hoặc custom mock handler trong kiểm thử.
 */
export async function translateViaSelfHostedNllb(text, sourceLang, targetLang, domainId = "general", env = {}) {
  const endpoint = env?.WORDBRIDGE_NLLB_API_URL
    ? String(env.WORDBRIDGE_NLLB_API_URL).trim().replace(/\/+$/, "")
    : "";

  if (!endpoint && typeof env?.NLLB_LOCAL_HANDLER !== "function") {
    return null;
  }

  const srcFlores = toFlores200Code(sourceLang);
  const tgtFlores = toFlores200Code(targetLang);
  const { preProcessedText, replacements, appliedTerms } = applyDomainGlossaryPrePass(
    text,
    sourceLang,
    targetLang,
    domainId
  );

  const requestPayload = {
    text: preProcessedText,
    source_lang: sourceLang,
    target_lang: targetLang,
    src_flores: srcFlores,
    tgt_flores: tgtFlores,
    domain: domainId,
    beam_size: 2,
    zero_data_retention: true
  };

  let rawModelOutput = null;

  if (typeof env?.NLLB_LOCAL_HANDLER === "function") {
    const localRes = await env.NLLB_LOCAL_HANDLER(requestPayload);
    if (localRes && localRes.translated_text) {
      rawModelOutput = localRes.translated_text;
    }
  } else if (endpoint) {
    const headers = {
      "Content-Type": "application/json",
      "Cache-Control": "no-store",
      "X-Zero-User-Data-Storage": "true"
    };
    if (env.WORDBRIDGE_NLLB_TOKEN) {
      headers.Authorization = `Bearer ${env.WORDBRIDGE_NLLB_TOKEN}`;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 9000);
    try {
      const res = await fetch(`${endpoint}/v1/nllb/translate`, {
        method: "POST",
        headers,
        body: JSON.stringify(requestPayload),
        signal: controller.signal
      });
      clearTimeout(timer);
      if (res.ok) {
        const data = await res.json();
        if (data && typeof data.translated_text === "string") {
          rawModelOutput = data.translated_text;
        }
      }
    } catch (_) {
      clearTimeout(timer);
      return null;
    }
  }

  if (!rawModelOutput) return null;

  const finalOutput = restoreDomainGlossaryPostPass(rawModelOutput, replacements);
  return {
    translatedText: finalOutput,
    providerUsed: "wordbridge_nllb200",
    providerName: "Word Bridge Self-Hosted NLLB-200 (CTranslate2 INT8 + Domain Glossary)",
    srcFlores,
    tgtFlores,
    appliedTerms
  };
}
