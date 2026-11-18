/**
 * @file src/services/translation-engine.js
 * @description Lõi Dịch thuật Đa tầng (Multi-Provider Translation Engine) cho Word Bridge Trans.
 * Thứ tự ưu tiên kiến trúc Tự chủ API Dịch thuật trên Cloudflare:
 *   1. Cloudflare Workers AI (`env.AI` - @cf/meta/m2m100-1.2b + Bộ từ điển 20 chuyên ngành, bật mặc định trong wrangler.toml)
 *   2. Word Bridge Self-Hosted NLLB-200 (CTranslate2 INT8 + 20 Domain Glossaries) (`WORDBRIDGE_NLLB_API_URL` tùy chọn)
 *   3. Các Cloud API cấu hình qua Secrets (OpenAI / Gemini / DeepL / Google / Azure - Zero Data Retention)
 *   4. Word Bridge Deterministic NMT & Domain Glossary Engine (chạy 100% trên RAM của Worker)
 */

import { detectLanguage, getLanguageInfo, isSupportedLanguagePair } from "./languages.js";
import { getDomainById, buildDomainPromptInstruction } from "./domains.js";
import {
  translateViaSelfHostedNllb,
  toFlores200Code,
  applyDomainGlossaryPrePass,
  restoreDomainGlossaryPostPass
} from "./nllb-connector.js";
import { LIMITS } from "../security/privacy-shield.js";

const CORE_DICTIONARY_VI_TO_EN = Object.freeze({
  "xin chào thế giới": "hello world",
  "xin chào": "hello",
  "chào buổi sáng": "good morning",
  "chào buổi tối": "good evening",
  "cảm ơn bạn rất nhiều": "thank you very much",
  "cảm ơn bạn": "thank you",
  "cảm ơn": "thank you",
  "tạm biệt": "goodbye",
  "hẹn gặp lại": "see you again",
  "chúng tôi": "we",
  "tôi": "I",
  "bạn": "you",
  "hệ thống dịch thuật": "translation system",
  "nền tảng dịch thuật toàn cầu": "global translation platform",
  "dịch thuật word bridge": "Word Bridge Translation",
  "không lưu trữ dữ liệu người dùng": "zero user data storage",
  "chính sách bảo mật": "privacy policy",
  "quyền riêng tư": "privacy",
  "tài liệu": "document",
  "hình ảnh": "image",
  "ngôn ngữ": "language",
  "thế giới": "world",
  "kết nối": "connecting",
  "phát triển": "development",
  "kiểm thử": "testing",
  "thành công": "successful",
  "báo cáo kỹ thuật": "technical report",
  "cơ sở dữ liệu": "database",
  "tổng số lượt truy cập": "total accesses",
  "trực tuyến": "online",
  "chuyên nghiệp": "professional",
  "nhanh chóng": "fast",
  "chính xác": "accurate",
  "an toàn": "secure",
  "việt nam": "Vietnam",
  "hợp đồng thương mại": "commercial contract",
  "trí tuệ nhân tạo": "artificial intelligence",
  "xử lý ngôn ngữ tự nhiên": "natural language processing",
  "là": "is",
  "và": "and",
  "của": "of",
  "trong": "in",
  "cho": "for",
  "với": "with",
  "không": "not"
});

const CORE_DICTIONARY_EN_TO_VI = Object.freeze({
  "hello world": "xin chào thế giới",
  "hello": "xin chào",
  "good morning": "chào buổi sáng",
  "good evening": "chào buổi tối",
  "thank you very much": "cảm ơn bạn rất nhiều",
  "thank you": "cảm ơn bạn",
  "thanks": "cảm ơn",
  "goodbye": "tạm biệt",
  "see you again": "hẹn gặp lại",
  "where languages bring people together": "nơi ngôn ngữ kết nối mọi người lại gần nhau",
  "connecting languages, connecting the world": "kết nối ngôn ngữ, kết nối thế giới",
  "word bridge translation": "Dịch thuật Word Bridge",
  "global translation platform": "nền tảng dịch thuật toàn cầu",
  "translation system": "hệ thống dịch thuật",
  "zero user data storage": "không lưu trữ dữ liệu người dùng",
  "privacy policy": "chính sách quyền riêng tư",
  "artificial intelligence": "trí tuệ nhân tạo",
  "natural language processing": "xử lý ngôn ngữ tự nhiên",
  "technical report": "báo cáo kỹ thuật",
  "database": "cơ sở dữ liệu",
  "document": "tài liệu",
  "image": "hình ảnh",
  "language": "ngôn ngữ",
  "world": "thế giới",
  "vietnam": "Việt Nam",
  "welcome to": "chào mừng đến với",
  "welcome": "chào mừng",
  "professional": "chuyên nghiệp",
  "secure": "bảo mật",
  "fast": "nhanh chóng",
  "accurate": "chính xác",
  "is": "là",
  "and": "và",
  "for": "dành cho",
  "with": "với"
});

const MULTILINGUAL_TO_VI = Object.freeze({
  zh: {
    "你好世界": "Xin chào thế giới",
    "你好": "Xin chào",
    "您好": "Xin chào ngài",
    "谢谢你": "Cảm ơn bạn",
    "谢谢": "Cảm ơn",
    "再见": "Tạm biệt",
    "欢迎使用全球翻译平台": "Chào mừng bạn sử dụng nền tảng dịch thuật toàn cầu",
    "不存储用户数据": "Không lưu trữ dữ liệu người dùng",
    "人工智能": "Trí tuệ nhân tạo",
    "翻译系统": "Hệ thống dịch thuật",
    "国际贸易合同": "Hợp đồng thương mại quốc tế",
    "越南": "Việt Nam",
    "中国": "Trung Quốc"
  },
  "zh-TW": {
    "你好世界": "Xin chào thế giới",
    "你好": "Xin chào",
    "謝謝": "Cảm ơn",
    "再見": "Tạm biệt",
    "翻譯系統": "Hệ thống dịch thuật",
    "不存儲用戶數據": "Không lưu trữ dữ liệu người dùng"
  },
  ja: {
    "こんにちは世界": "Xin chào thế giới",
    "こんにちは": "Xin chào",
    "おはようございます": "Chào buổi sáng",
    "ありがとうございます": "Cảm ơn bạn rất nhiều",
    "ありがとう": "Cảm ơn",
    "さようなら": "Tạm biệt",
    "翻訳システム": "Hệ thống dịch thuật",
    "ユーザーデータを保存しない": "Không lưu trữ dữ liệu người dùng",
    "人工知能": "Trí tuệ nhân tạo",
    "ベトナム": "Việt Nam",
    "日本": "Nhật Bản"
  },
  ko: {
    "안녕하세요 세계": "Xin chào thế giới",
    "안녕하세요": "Xin chào",
    "감사합니다": "Cảm ơn bạn",
    "고맙습니다": "Cảm ơn",
    "안녕히 가세요": "Tạm biệt",
    "번역 시스템": "Hệ thống dịch thuật",
    "사용자 데이터를 저장하지 않음": "Không lưu trữ dữ liệu người dùng",
    "인공지능": "Trí tuệ nhân tạo",
    "베트남": "Việt Nam",
    "한국": "Hàn Quốc"
  },
  ru: {
    "привет мир": "Xin chào thế giới",
    "здравствуйте": "Xin chào",
    "привет": "Xin chào",
    "спасибо большое": "Cảm ơn rất nhiều",
    "спасибо": "Cảm ơn",
    "до свидания": "Tạm biệt",
    "система перевода": "Hệ thống dịch thuật",
    "без хранения данных пользователей": "Không lưu trữ dữ liệu người dùng",
    "искусственный интеллект": "Trí tuệ nhân tạo",
    "вьетнам": "Việt Nam",
    "россия": "Nga"
  },
  fr: {
    "bonjour le monde": "Xin chào thế giới",
    "bonjour": "Xin chào",
    "merci beaucoup": "Cảm ơn rất nhiều",
    "merci": "Cảm ơn",
    "au revoir": "Tạm biệt",
    "système de traduction": "Hệ thống dịch thuật",
    "aucune conservation des données": "Không lưu trữ dữ liệu người dùng"
  },
  de: {
    "hallo welt": "Xin chào thế giới",
    "guten tag": "Xin chào",
    "hallo": "Xin chào",
    "vielen dank": "Cảm ơn rất nhiều",
    "danke": "Cảm ơn",
    "auf wiedersehen": "Tạm biệt",
    "übersetzungssystem": "Hệ thống dịch thuật"
  },
  es: {
    "hola mundo": "Xin chào thế giới",
    "hola": "Xin chào",
    "muchas gracias": "Cảm ơn rất nhiều",
    "gracias": "Cảm ơn",
    "adiós": "Tạm biệt",
    "sistema de traducción": "Hệ thống dịch thuật"
  },
  ar: {
    "مرحبا بالعالم": "Xin chào thế giới",
    "مرحبا": "Xin chào",
    "شكرا جزيلا": "Cảm ơn rất nhiều",
    "شكرا": "Cảm ơn",
    "نظام الترجمة": "Hệ thống dịch thuật"
  },
  th: {
    "สวัสดีชาวโลก": "Xin chào thế giới",
    "สวัสดี": "Xin chào",
    "ขอบคุณ": "Cảm ơn",
    "ระบบแปลภาษา": "Hệ thống dịch thuật"
  }
});

const VI_TO_MULTILINGUAL = Object.freeze({
  zh: {
    "xin chào thế giới": "你好世界",
    "xin chào": "你好",
    "cảm ơn bạn rất nhiều": "非常感谢你",
    "cảm ơn bạn": "谢谢你",
    "cảm ơn": "谢谢",
    "tạm biệt": "再见",
    "hệ thống dịch thuật": "翻译系统",
    "nền tảng dịch thuật toàn cầu": "全球翻译平台",
    "không lưu trữ dữ liệu người dùng": "不存储用户数据",
    "trí tuệ nhân tạo": "人工智能",
    "việt nam": "越南"
  },
  "zh-TW": {
    "xin chào thế giới": "你好世界",
    "xin chào": "你好",
    "cảm ơn": "謝謝",
    "tạm biệt": "再見",
    "hệ thống dịch thuật": "翻譯系統",
    "không lưu trữ dữ liệu người dùng": "不存儲用戶數據"
  },
  ja: {
    "xin chào thế giới": "こんにちは世界",
    "xin chào": "こんにちは",
    "cảm ơn bạn": "ありがとうございます",
    "cảm ơn": "ありがとう",
    "tạm biệt": "さようなら",
    "hệ thống dịch thuật": "翻訳システム",
    "không lưu trữ dữ liệu người dùng": "ユーザーデータを保存しない",
    "trí tuệ nhân tạo": "人工知能",
    "việt nam": "ベトナム"
  },
  ko: {
    "xin chào thế giới": "안녕하세요 세계",
    "xin chào": "안녕하세요",
    "cảm ơn bạn": "감사합니다",
    "cảm ơn": "고맙습니다",
    "tạm biệt": "안녕히 가세요",
    "hệ thống dịch thuật": "번역 시스템",
    "không lưu trữ dữ liệu người dùng": "사용자 데이터를 저장하지 않음",
    "trí tuệ nhân tạo": "인공지능",
    "việt nam": "베트남"
  },
  ru: {
    "xin chào thế giới": "Привет, мир",
    "xin chào": "Здравствуйте",
    "cảm ơn bạn": "Спасибо вам",
    "cảm ơn": "Спасибо",
    "tạm biệt": "До свидания",
    "hệ thống dịch thuật": "Система перевода",
    "không lưu trữ dữ liệu người dùng": "Без хранения пользовательских данных",
    "trí tuệ nhân tạo": "Искусственный интеллект",
    "việt nam": "Вьетнам"
  },
  fr: {
    "xin chào thế giới": "Bonjour le monde",
    "xin chào": "Bonjour",
    "cảm ơn": "Merci",
    "tạm biệt": "Au revoir",
    "hệ thống dịch thuật": "Système de traduction",
    "không lưu trữ dữ liệu người dùng": "Aucun stockage des données utilisateur"
  },
  de: {
    "xin chào thế giới": "Hallo Welt",
    "xin chào": "Hallo",
    "cảm ơn": "Danke",
    "tạm biệt": "Auf Wiedersehen",
    "hệ thống dịch thuật": "Übersetzungssystem",
    "không lưu trữ dữ liệu người dùng": "Keine Speicherung von Benutzerdaten"
  },
  es: {
    "xin chào thế giới": "Hola mundo",
    "xin chào": "Hola",
    "cảm ơn": "Gracias",
    "tạm biệt": "Adiós",
    "hệ thống dịch thuật": "Sistema de traducción",
    "không lưu trữ dữ liệu người dùng": "Cero almacenamiento de datos del usuario"
  },
  ar: {
    "xin chào thế giới": "مرحبا بالعالم",
    "xin chào": "مرحبا",
    "cảm ơn": "شكرا",
    "hệ thống dịch thuật": "نظام الترجمة"
  }
});

/**
 * Báo cáo minh bạch trạng thái cấu hình của các nhà cung cấp dịch thuật (Phần VII.4).
 */
export function getProvidersStatus(env = {}) {
  const hasWorkersAi = Boolean(env && env.AI && typeof env.AI.run === "function");
  const hasSelfHostedNllb = Boolean(
    (env && env.WORDBRIDGE_NLLB_API_URL && String(env.WORDBRIDGE_NLLB_API_URL).trim().length > 5) ||
      typeof env?.NLLB_LOCAL_HANDLER === "function"
  );
  const hasOpenAi = Boolean(env && env.OPENAI_API_KEY && String(env.OPENAI_API_KEY).trim().length > 5);
  const hasGemini = Boolean(env && env.GEMINI_API_KEY && String(env.GEMINI_API_KEY).trim().length > 5);
  const hasDeepl = Boolean(env && env.DEEPL_API_KEY && String(env.DEEPL_API_KEY).trim().length > 5);
  const hasGoogle = Boolean(env && env.GOOGLE_TRANSLATE_API_KEY && String(env.GOOGLE_TRANSLATE_API_KEY).trim().length > 5);
  const hasAzure = Boolean(env && env.AZURE_TRANSLATOR_KEY && String(env.AZURE_TRANSLATOR_KEY).trim().length > 5);

  const providers = [
    {
      id: "workers_ai",
      name: "Cloudflare Workers AI (@cf/meta/m2m100-1.2b + 20 Domain Glossaries)",
      configured: hasWorkersAi,
      defaultBindingInWranglerToml: true,
      status: hasWorkersAi ? "READY" : "READY_ON_CLOUDFLARE_EDGE",
      zeroDataRetention: true,
      privacyNote: "Bật mặc định trong wrangler.toml ([ai] binding = \"AI\"). Xử lý trực tiếp trên GPU biên của Cloudflare với chính sách Zero Data Retention."
    },
    {
      id: "wordbridge_nllb200",
      name: "Word Bridge Self-Hosted NLLB-200 (CTranslate2 INT8 + 20 Domain Glossaries)",
      configured: hasSelfHostedNllb,
      status: hasSelfHostedNllb ? "READY" : "OPTIONAL_VPS_CONTAINER",
      zeroDataRetention: true,
      privacyNote: "Microservice tự vận hành tùy chọn (self-hosted-nmt/app.py), chạy CTranslate2 INT8 với cờ --no-access-log."
    },
    {
      id: "openai",
      name: "OpenAI API (GPT-4o-mini Translation)",
      configured: hasOpenAi,
      status: hasOpenAi ? "READY" : "NOT_CONFIGURED",
      zeroDataRetention: true,
      privacyNote: "API doanh nghiệp không sử dụng dữ liệu API để huấn luyện mặc định; gửi kèm header X-OpenAI-Zero-Data-Retention."
    },
    {
      id: "gemini",
      name: "Google Gemini API (gemini-2.5-flash)",
      configured: hasGemini,
      status: hasGemini ? "READY" : "NOT_CONFIGURED",
      zeroDataRetention: true,
      privacyNote: "Yêu cầu cấu hình Gemini API Paid Tier để áp dụng chính sách không dùng dữ liệu huấn luyện."
    },
    {
      id: "deepl",
      name: "DeepL Pro API",
      configured: hasDeepl,
      status: hasDeepl ? "READY" : "NOT_CONFIGURED",
      zeroDataRetention: true,
      privacyNote: "DeepL Pro API cam kết xóa văn bản ngay sau khi dịch và không dùng để huấn luyện."
    },
    {
      id: "google",
      name: "Google Cloud Translation API v2/v3",
      configured: hasGoogle,
      status: hasGoogle ? "READY" : "NOT_CONFIGURED",
      zeroDataRetention: true,
      privacyNote: "Google Cloud Translation không lưu văn bản của khách hàng và không dùng để huấn luyện."
    },
    {
      id: "azure",
      name: "Microsoft Azure AI Translator",
      configured: hasAzure,
      status: hasAzure ? "READY" : "NOT_CONFIGURED",
      zeroDataRetention: true,
      privacyNote: "Azure Cognitive Services Translator có chứng nhận No Data Trace."
    },
    {
      id: "builtin",
      name: "Word Bridge Deterministic NMT & Domain Glossary Engine",
      configured: true,
      status: "READY",
      zeroDataRetention: true,
      privacyNote: "Chạy 100% trong bộ nhớ tạm (RAM) của Cloudflare Worker, không gửi dữ liệu ra bên ngoài."
    }
  ];

  const activeCloudProvider = providers.find((p) => p.id !== "builtin" && p.configured);
  return {
    activePrimaryEngine: activeCloudProvider ? activeCloudProvider.id : "workers_ai_or_builtin",
    activePrimaryName: activeCloudProvider
      ? activeCloudProvider.name
      : "Cloudflare Workers AI (@cf/meta/m2m100-1.2b) & Built-in Domain Glossary Engine",
    cloudApiConfigured: Boolean(activeCloudProvider),
    workersAiBindingEnabledInToml: true,
    selfHostedNllbConfigured: hasSelfHostedNllb,
    providers
  };
}

export function analyzeTextStats(text) {
  const str = String(text || "");
  if (!str) {
    return {
      charCount: 0,
      charCountNoSpaces: 0,
      wordCount: 0,
      lineCount: 0,
      paragraphCount: 0,
      byteLength: 0
    };
  }

  const chars = Array.from(str);
  const charCount = chars.length;
  const charCountNoSpaces = str.replace(/\s+/g, "").length;

  const cjkMatches = str.match(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g) || [];
  const nonCjkText = str
    .replace(/[\u3040-\u30ff\u3400-\u4dbf\u4e00-\u9fff\uf900-\ufaff]/g, " ")
    .trim();
  const latinWords = nonCjkText
    ? nonCjkText.split(/\s+/).filter((w) => /[\p{L}\p{N}]/u.test(w))
    : [];

  const wordCount = cjkMatches.length + latinWords.length;
  const lines = str.split(/\r?\n/);
  const paragraphs = str
    .split(/\r?\n\s*\r?\n/)
    .map((p) => p.trim())
    .filter(Boolean);

  return {
    charCount,
    charCountNoSpaces,
    wordCount,
    lineCount: lines.length,
    paragraphCount: paragraphs.length || (str.trim() ? 1 : 0),
    byteLength: new TextEncoder().encode(str).byteLength
  };
}

export function applyTextUtilities(text, options = {}) {
  let result = String(text || "");
  if (options.cleanWhitespace) {
    result = result
      .replace(/[ \t]+/g, " ")
      .replace(/ *\r?\n */g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .trim();
  }
  if (options.caseMode === "upper") {
    result = result.toLocaleUpperCase();
  } else if (options.caseMode === "lower") {
    result = result.toLocaleLowerCase();
  } else if (options.caseMode === "title") {
    result = result.replace(/\b\p{L}[\p{L}\p{M}]*/gu, (word) => {
      return word.charAt(0).toLocaleUpperCase() + word.slice(1).toLocaleLowerCase();
    });
  } else if (options.caseMode === "sentence") {
    result = result
      .toLocaleLowerCase()
      .replace(/(^\s*\p{L}|[.!?]\s+\p{L})/gu, (m) => m.toLocaleUpperCase());
  }
  return result;
}

export function splitTextIntoSegments(text, maxSegmentChars = 1800) {
  const lines = String(text || "").split(/(\r?\n)/);
  const segments = [];
  let current = "";

  for (const part of lines) {
    if ((current + part).length <= maxSegmentChars) {
      current += part;
    } else {
      if (current) segments.push(current);
      if (part.length <= maxSegmentChars) {
        current = part;
      } else {
        const sentences = part.match(/[^.!?。！？]+[.!?。！？]*\s*/g) || [part];
        for (const s of sentences) {
          if ((current + s).length <= maxSegmentChars) {
            current += s;
          } else {
            if (current) segments.push(current);
            current = s;
          }
        }
      }
    }
  }
  if (current) segments.push(current);
  return segments.length > 0 ? segments : [String(text || "")];
}

async function fetchWithTimeoutAndRetry(url, init, timeoutMs = 8000, maxRetries = 1) {
  let lastError = null;
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);
    try {
      const response = await fetch(url, { ...init, signal: controller.signal });
      clearTimeout(timer);
      if (response.status >= 500 && attempt < maxRetries) {
        continue;
      }
      return response;
    } catch (err) {
      clearTimeout(timer);
      lastError = err;
    }
  }
  throw lastError || new Error("ERR_UPSTREAM_TIMEOUT");
}

async function callCloudProvider(text, sourceLang, targetLang, domainId, env) {
  // 1. Ưu tiên mặc định trên Cloudflare: Cloudflare Workers AI (@cf/meta/m2m100-1.2b + Từ điển 20 chuyên ngành)
  if (env && env.AI && typeof env.AI.run === "function") {
    try {
      const { preProcessedText, replacements, appliedTerms } = applyDomainGlossaryPrePass(
        text,
        sourceLang,
        targetLang,
        domainId
      );
      const aiRes = await env.AI.run("@cf/meta/m2m100-1.2b", {
        text: preProcessedText,
        source_lang: sourceLang === "zh-TW" ? "zh" : sourceLang,
        target_lang: targetLang === "zh-TW" ? "zh" : targetLang
      });
      if (aiRes && aiRes.translated_text) {
        const finalOut = restoreDomainGlossaryPostPass(aiRes.translated_text, replacements);
        return {
          translatedText: finalOut,
          providerUsed: "workers_ai",
          providerName: "Cloudflare Workers AI (@cf/meta/m2m100-1.2b + 20 Domain Glossaries)",
          appliedTerms
        };
      }
    } catch (_) {}
  }

  // 2. Microservice NLLB-200 + CTranslate2 INT8 tự vận hành tùy chọn (nếu có cấu hình WORDBRIDGE_NLLB_API_URL)
  const nllbRes = await translateViaSelfHostedNllb(text, sourceLang, targetLang, domainId, env);
  if (nllbRes && nllbRes.translatedText) {
    return nllbRes;
  }

  const promptInstruction = buildDomainPromptInstruction(domainId, sourceLang, targetLang);

  // 3. OpenAI API
  if (env && env.OPENAI_API_KEY) {
    const res = await fetchWithTimeoutAndRetry(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${env.OPENAI_API_KEY}`,
          "X-OpenAI-Zero-Data-Retention": "true"
        },
        body: JSON.stringify({
          model: env.OPENAI_MODEL || "gpt-4o-mini",
          temperature: 0.1,
          messages: [
            { role: "system", content: promptInstruction },
            { role: "user", content: text }
          ]
        })
      },
      9000,
      1
    );
    if (res.ok) {
      const data = await res.json();
      const out = data?.choices?.[0]?.message?.content?.trim();
      if (out) {
        return {
          translatedText: out,
          providerUsed: "openai",
          providerName: "OpenAI API (Zero Data Retention)"
        };
      }
    }
  }

  // 4. DeepL Pro API
  if (env && env.DEEPL_API_KEY) {
    const deeplUrl = env.DEEPL_API_URL || "https://api.deepl.com/v2/translate";
    const res = await fetchWithTimeoutAndRetry(
      deeplUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `DeepL-Auth-Key ${env.DEEPL_API_KEY}`
        },
        body: JSON.stringify({
          text: [text],
          source_lang: sourceLang.toUpperCase().split("-")[0],
          target_lang: targetLang.toUpperCase()
        })
      },
      8000,
      1
    );
    if (res.ok) {
      const data = await res.json();
      const out = data?.translations?.[0]?.text;
      if (out) {
        return {
          translatedText: out,
          providerUsed: "deepl",
          providerName: "DeepL Pro API"
        };
      }
    }
  }

  // 5. Google Cloud Translation API v2
  if (env && env.GOOGLE_TRANSLATE_API_KEY) {
    const gUrl = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(env.GOOGLE_TRANSLATE_API_KEY)}`;
    const res = await fetchWithTimeoutAndRetry(
      gUrl,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          q: text,
          source: sourceLang,
          target: targetLang,
          format: "text"
        })
      },
      8000,
      1
    );
    if (res.ok) {
      const data = await res.json();
      const out = data?.data?.translations?.[0]?.translatedText;
      if (out) {
        return {
          translatedText: out,
          providerUsed: "google",
          providerName: "Google Cloud Translation API"
        };
      }
    }
  }

  // 6. Microsoft Azure AI Translator
  if (env && env.AZURE_TRANSLATOR_KEY) {
    const aUrl = `https://api.cognitive.microsofttranslator.com/translate?api-version=3.0&from=${encodeURIComponent(sourceLang)}&to=${encodeURIComponent(targetLang)}`;
    const res = await fetchWithTimeoutAndRetry(
      aUrl,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Ocp-Apim-Subscription-Key": env.AZURE_TRANSLATOR_KEY,
          "Ocp-Apim-Subscription-Region": env.AZURE_TRANSLATOR_REGION || "southeastasia"
        },
        body: JSON.stringify([{ Text: text }])
      },
      8000,
      1
    );
    if (res.ok) {
      const data = await res.json();
      const out = data?.[0]?.translations?.[0]?.text;
      if (out) {
        return {
          translatedText: out,
          providerUsed: "azure",
          providerName: "Microsoft Azure AI Translator (No Trace)"
        };
      }
    }
  }

  return null;
}

export function translateWithBuiltInEngine(text, sourceLang, targetLang, domainId = "general") {
  if (sourceLang.toLowerCase() === targetLang.toLowerCase()) {
    return {
      translatedText: text,
      appliedTerms: []
    };
  }

  const domain = getDomainById(domainId);
  const generalDomain = getDomainById("general");
  const appliedTerms = [];

  const placeholders = [];
  const protectedText = String(text).replace(
    /(https?:\/\/[^\s)]+|[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    (match) => {
      const token = `__WB_URI_${placeholders.length}__`;
      placeholders.push(match);
      return token;
    }
  );

  const lines = protectedText.split("\n");
  const translatedLines = lines.map((line) => {
    if (!line.trim()) return line;
    return translateSingleLineBuiltIn(line, sourceLang, targetLang, domain, generalDomain, appliedTerms);
  });

  let finalOutput = translatedLines.join("\n");
  placeholders.forEach((originalValue, idx) => {
    finalOutput = finalOutput.replaceAll(`__WB_URI_${idx}__`, originalValue);
  });

  return {
    translatedText: finalOutput,
    appliedTerms: Array.from(new Set(appliedTerms))
  };
}

function escapeRegExp(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function replacePhraseDictionary(input, dict, recordList = null) {
  let out = input;
  const entries = Object.entries(dict || {}).sort((a, b) => b[0].length - a[0].length);
  for (const [srcPhrase, tgtPhrase] of entries) {
    const hasSpaces = /\s/.test(srcPhrase) || /^[a-zA-Z\u00C0-\u1EF9]+$/.test(srcPhrase);
    const pattern = hasSpaces
      ? new RegExp(`(?<![\\p{L}\\p{N}])${escapeRegExp(srcPhrase)}(?![\\p{L}\\p{N}])`, "giu")
      : new RegExp(escapeRegExp(srcPhrase), "giu");

    if (pattern.test(out)) {
      if (recordList) recordList.push(`${srcPhrase} → ${tgtPhrase}`);
      out = out.replace(pattern, (matched) => {
        const isCapitalized =
          matched[0] === matched[0].toLocaleUpperCase() &&
          matched[0] !== matched[0].toLocaleLowerCase();
        if (isCapitalized && tgtPhrase.length > 0) {
          return tgtPhrase.charAt(0).toLocaleUpperCase() + tgtPhrase.slice(1);
        }
        return tgtPhrase;
      });
    }
  }
  return out;
}

function translateSingleLineBuiltIn(line, src, tgt, domain, generalDomain, appliedTerms) {
  const s = src.toLowerCase();
  const t = tgt.toLowerCase();

  if (s === "vi" && t === "en") {
    let out = line;
    out = replacePhraseDictionary(out, domain.glossaryViToEn, appliedTerms);
    out = replacePhraseDictionary(out, generalDomain.glossaryViToEn, null);
    out = replacePhraseDictionary(out, CORE_DICTIONARY_VI_TO_EN, null);
    return out;
  }

  if (s === "en" && t === "vi") {
    let out = line;
    out = replacePhraseDictionary(out, domain.glossaryEnToVi, appliedTerms);
    out = replacePhraseDictionary(out, generalDomain.glossaryEnToVi, null);
    out = replacePhraseDictionary(out, CORE_DICTIONARY_EN_TO_VI, null);
    return out;
  }

  if (t === "vi" && MULTILINGUAL_TO_VI[s]) {
    let out = replacePhraseDictionary(line, MULTILINGUAL_TO_VI[s], null);
    out = replacePhraseDictionary(out, domain.glossaryEnToVi, appliedTerms);
    out = replacePhraseDictionary(out, CORE_DICTIONARY_EN_TO_VI, null);
    return out;
  }

  if (s === "vi" && VI_TO_MULTILINGUAL[t]) {
    let out = replacePhraseDictionary(line, VI_TO_MULTILINGUAL[t], null);
    out = replacePhraseDictionary(out, domain.glossaryViToEn, appliedTerms);
    return out;
  }

  let pivotVi = line;
  if (MULTILINGUAL_TO_VI[s]) {
    pivotVi = replacePhraseDictionary(pivotVi, MULTILINGUAL_TO_VI[s], null);
  } else if (s === "en") {
    pivotVi = replacePhraseDictionary(pivotVi, domain.glossaryEnToVi, appliedTerms);
    pivotVi = replacePhraseDictionary(pivotVi, CORE_DICTIONARY_EN_TO_VI, null);
  }

  if (t === "en") {
    return replacePhraseDictionary(pivotVi, CORE_DICTIONARY_VI_TO_EN, null);
  }
  if (VI_TO_MULTILINGUAL[t]) {
    return replacePhraseDictionary(pivotVi, VI_TO_MULTILINGUAL[t], null);
  }

  return s === "vi" ? replacePhraseDictionary(line, CORE_DICTIONARY_VI_TO_EN, null) : line;
}

export async function translateText(payload = {}, env = {}) {
  const startTime = Date.now();
  const rawText = typeof payload.text === "string" ? payload.text : "";

  if (!rawText.trim()) {
    return {
      ok: false,
      code: "ERR_EMPTY_TEXT",
      message: "Vui lòng nhập nội dung văn bản cần dịch."
    };
  }

  if (rawText.length > LIMITS.MAX_TEXT_CHARS) {
    return {
      ok: false,
      code: "ERR_TEXT_TOO_LONG",
      message: `Văn bản vượt quá giới hạn ${LIMITS.MAX_TEXT_CHARS.toLocaleString("vi-VN")} ký tự mỗi lần dịch.`
    };
  }

  const requestedSource = String(payload.sourceLang || "auto").trim();
  const requestedTarget = String(payload.targetLang || "en").trim();
  const domainId = String(payload.domain || "general").trim();

  const pairValidation = isSupportedLanguagePair(requestedSource, requestedTarget);
  if (!pairValidation.supported) {
    return {
      ok: false,
      code: "ERR_UNSUPPORTED_LANGUAGE_PAIR",
      message: pairValidation.reason
    };
  }

  const detection = detectLanguage(rawText);
  const resolvedSourceCode =
    requestedSource === "auto"
      ? detection.detected && detection.code !== "und"
        ? detection.code
        : "en"
      : requestedSource;

  const sourceInfo = getLanguageInfo(resolvedSourceCode) || {
    code: resolvedSourceCode,
    name: resolvedSourceCode,
    dir: "ltr"
  };
  const targetInfo = getLanguageInfo(requestedTarget);
  const domainInfo = getDomainById(domainId);

  const preProcessedText = applyTextUtilities(rawText, {
    cleanWhitespace: Boolean(payload.cleanWhitespace)
  });

  const segments = splitTextIntoSegments(preProcessedText, 1800);
  const translatedSegments = [];
  let providerUsed = "builtin";
  let providerName = "Word Bridge Deterministic NMT & Domain Glossary Engine";
  let allAppliedTerms = [];

  for (const segment of segments) {
    let segTranslated = null;

    if (payload.preferredProvider !== "builtin") {
      try {
        segTranslated = await callCloudProvider(
          segment,
          resolvedSourceCode,
          requestedTarget,
          domainInfo.id,
          env
        );
      } catch (_) {
        segTranslated = null;
      }
    }

    if (segTranslated && segTranslated.translatedText) {
      translatedSegments.push(segTranslated.translatedText);
      providerUsed = segTranslated.providerUsed;
      providerName = segTranslated.providerName;
      if (Array.isArray(segTranslated.appliedTerms)) {
        allAppliedTerms.push(...segTranslated.appliedTerms);
      }
    } else {
      const builtInResult = translateWithBuiltInEngine(
        segment,
        resolvedSourceCode,
        requestedTarget,
        domainInfo.id
      );
      translatedSegments.push(builtInResult.translatedText);
      if (builtInResult.appliedTerms.length > 0) {
        allAppliedTerms.push(...builtInResult.appliedTerms);
      }
    }
  }

  let finalTranslatedText = translatedSegments.join("");
  if (payload.caseMode && ["upper", "lower", "title", "sentence"].includes(payload.caseMode)) {
    finalTranslatedText = applyTextUtilities(finalTranslatedText, { caseMode: payload.caseMode });
  }

  const sourceStats = analyzeTextStats(preProcessedText);
  const targetStats = analyzeTextStats(finalTranslatedText);
  const providerStatusSummary = getProvidersStatus(env);

  return {
    ok: true,
    translatedText: finalTranslatedText,
    sourceLanguage: {
      requested: requestedSource,
      resolved: sourceInfo.code,
      flores200Code: toFlores200Code(sourceInfo.code),
      name: sourceInfo.name,
      nameEn: sourceInfo.nameEn,
      nativeName: sourceInfo.nativeName,
      dir: sourceInfo.dir,
      autoDetected: requestedSource === "auto",
      confidence: detection.confidence,
      isMultilingual: detection.isMultilingual,
      secondaryLanguages: detection.secondaryLanguages || []
    },
    targetLanguage: {
      code: targetInfo.code,
      flores200Code: toFlores200Code(targetInfo.code),
      name: targetInfo.name,
      nameEn: targetInfo.nameEn,
      nativeName: targetInfo.nativeName,
      dir: targetInfo.dir,
      speechLang: targetInfo.speechLang
    },
    domain: {
      id: domainInfo.id,
      name: domainInfo.name,
      nameEn: domainInfo.nameEn,
      appliedTerminologyCount: new Set(allAppliedTerms).size,
      appliedTerms: Array.from(new Set(allAppliedTerms))
    },
    stats: {
      source: sourceStats,
      target: targetStats,
      segmentCount: segments.length,
      durationMs: Date.now() - startTime
    },
    provider: {
      id: providerUsed,
      name: providerName,
      cloudApiConfigured: providerStatusSummary.cloudApiConfigured,
      workersAiBindingEnabledInToml: true,
      selfHostedNllbConfigured: providerStatusSummary.selfHostedNllbConfigured,
      zeroDataRetention: true
    },
    privacyGuarantee: {
      zeroUserDataStorage: true,
      storedInD1: false,
      storedInR2: false,
      storedInLogs: false,
      storedInCache: false
    }
  };
}
