/**
 * @file src/services/languages.js
 * @description Danh mục Ngôn ngữ Dịch thuật Toàn cầu & Bộ Nhận diện Ngôn ngữ Thực tế.
 * Lưu ý kiến trúc:
 *   - Word Bridge Learning chỉ giới hạn trong 05 ngôn ngữ học tập (zh, en, ko, ja, ru).
 *   - Word Bridge Trans (dichthuat.wordbridge.io.vn) là nền tảng dịch thuật toàn cầu,
 *     hỗ trợ 104 ngôn ngữ trên toàn thế giới (bao gồm các hệ chữ Latin, Hán, Nhật, Hàn,
 *     Cyrillic, Ả Rập/Do Thái/Ba Tư RTL, Ấn Độ, Đông Nam Á, Châu Âu và Châu Phi).
 */

export const GLOBAL_LANGUAGES = Object.freeze([
  { code: "auto", name: "Tự động nhận diện", nameEn: "Detect Language", nativeName: "Auto Detect", dir: "ltr", speechLang: "" },
  { code: "vi", name: "Tiếng Việt", nameEn: "Vietnamese", nativeName: "Tiếng Việt", dir: "ltr", speechLang: "vi-VN", popular: true },
  { code: "en", name: "Tiếng Anh", nameEn: "English", nativeName: "English", dir: "ltr", speechLang: "en-US", popular: true },
  { code: "zh", name: "Tiếng Trung (Giản thể)", nameEn: "Chinese (Simplified)", nativeName: "中文 (简体)", dir: "ltr", speechLang: "zh-CN", popular: true },
  { code: "zh-TW", name: "Tiếng Trung (Phồn thể)", nameEn: "Chinese (Traditional)", nativeName: "中文 (繁體)", dir: "ltr", speechLang: "zh-TW", popular: true },
  { code: "ja", name: "Tiếng Nhật", nameEn: "Japanese", nativeName: "日本語", dir: "ltr", speechLang: "ja-JP", popular: true },
  { code: "ko", name: "Tiếng Hàn", nameEn: "Korean", nativeName: "한국어", dir: "ltr", speechLang: "ko-KR", popular: true },
  { code: "ru", name: "Tiếng Nga", nameEn: "Russian", nativeName: "Русский", dir: "ltr", speechLang: "ru-RU", popular: true },
  { code: "fr", name: "Tiếng Pháp", nameEn: "French", nativeName: "Français", dir: "ltr", speechLang: "fr-FR", popular: true },
  { code: "de", name: "Tiếng Đức", nameEn: "German", nativeName: "Deutsch", dir: "ltr", speechLang: "de-DE", popular: true },
  { code: "es", name: "Tiếng Tây Ban Nha", nameEn: "Spanish", nativeName: "Español", dir: "ltr", speechLang: "es-ES", popular: true },
  { code: "pt", name: "Tiếng Bồ Đào Nha", nameEn: "Portuguese", nativeName: "Português", dir: "ltr", speechLang: "pt-PT" },
  { code: "it", name: "Tiếng Ý", nameEn: "Italian", nativeName: "Italiano", dir: "ltr", speechLang: "it-IT" },
  { code: "ar", name: "Tiếng Ả Rập", nameEn: "Arabic", nativeName: "العربية", dir: "rtl", speechLang: "ar-SA", popular: true },
  { code: "th", name: "Tiếng Thái", nameEn: "Thai", nativeName: "ไทย", dir: "ltr", speechLang: "th-TH", popular: true },
  { code: "id", name: "Tiếng Indonesia", nameEn: "Indonesian", nativeName: "Bahasa Indonesia", dir: "ltr", speechLang: "id-ID" },
  { code: "ms", name: "Tiếng Mã Lai", nameEn: "Malay", nativeName: "Bahasa Melayu", dir: "ltr", speechLang: "ms-MY" },
  { code: "hi", name: "Tiếng Hindi", nameEn: "Hindi", nativeName: "हिन्दी", dir: "ltr", speechLang: "hi-IN" },
  { code: "nl", name: "Tiếng Hà Lan", nameEn: "Dutch", nativeName: "Nederlands", dir: "ltr", speechLang: "nl-NL" },
  { code: "pl", name: "Tiếng Ba Lan", nameEn: "Polish", nativeName: "Polski", dir: "ltr", speechLang: "pl-PL" },
  { code: "tr", name: "Tiếng Thổ Nhĩ Kỳ", nameEn: "Turkish", nativeName: "Türkçe", dir: "ltr", speechLang: "tr-TR" },
  { code: "uk", name: "Tiếng Ukraina", nameEn: "Ukrainian", nativeName: "Українська", dir: "ltr", speechLang: "uk-UA" },
  { code: "cs", name: "Tiếng Séc", nameEn: "Czech", nativeName: "Čeština", dir: "ltr", speechLang: "cs-CZ" },
  { code: "sv", name: "Tiếng Thụy Điển", nameEn: "Swedish", nativeName: "Svenska", dir: "ltr", speechLang: "sv-SE" },
  { code: "da", name: "Tiếng Đan Mạch", nameEn: "Danish", nativeName: "Dansk", dir: "ltr", speechLang: "da-DK" },
  { code: "fi", name: "Tiếng Phần Lan", nameEn: "Finnish", nativeName: "Suomi", dir: "ltr", speechLang: "fi-FI" },
  { code: "no", name: "Tiếng Na Uy", nameEn: "Norwegian", nativeName: "Norsk", dir: "ltr", speechLang: "nb-NO" },
  { code: "el", name: "Tiếng Hy Lạp", nameEn: "Greek", nativeName: "Ελληνικά", dir: "ltr", speechLang: "el-GR" },
  { code: "he", name: "Tiếng Do Thái", nameEn: "Hebrew", nativeName: "עברית", dir: "rtl", speechLang: "he-IL" },
  { code: "fa", name: "Tiếng Ba Tư", nameEn: "Persian", nativeName: "فارسی", dir: "rtl", speechLang: "fa-IR" },
  { code: "ur", name: "Tiếng Urdu", nameEn: "Urdu", nativeName: "اردو", dir: "rtl", speechLang: "ur-PK" },
  { code: "bn", name: "Tiếng Bengal", nameEn: "Bengali", nativeName: "বাংলা", dir: "ltr", speechLang: "bn-BD" },
  { code: "ta", name: "Tiếng Tamil", nameEn: "Tamil", nativeName: "தமிழ்", dir: "ltr", speechLang: "ta-IN" },
  { code: "te", name: "Tiếng Telugu", nameEn: "Telugu", nativeName: "తెలుగు", dir: "ltr", speechLang: "te-IN" },
  { code: "mr", name: "Tiếng Marathi", nameEn: "Marathi", nativeName: "मराठी", dir: "ltr", speechLang: "mr-IN" },
  { code: "gu", name: "Tiếng Gujarati", nameEn: "Gujarati", nativeName: "ગુજરાતી", dir: "ltr", speechLang: "gu-IN" },
  { code: "kn", name: "Tiếng Kannada", nameEn: "Kannada", nativeName: "ಕನ್ನಡ", dir: "ltr", speechLang: "kn-IN" },
  { code: "ml", name: "Tiếng Malayalam", nameEn: "Malayalam", nativeName: "മലയാളം", dir: "ltr", speechLang: "ml-IN" },
  { code: "pa", name: "Tiếng Punjab", nameEn: "Punjabi", nativeName: "ਪੰਜਾਬੀ", dir: "ltr", speechLang: "pa-IN" },
  { code: "ne", name: "Tiếng Nepal", nameEn: "Nepali", nativeName: "नेपाली", dir: "ltr", speechLang: "ne-NP" },
  { code: "si", name: "Tiếng Sinhala", nameEn: "Sinhala", nativeName: "සිංහල", dir: "ltr", speechLang: "si-LK" },
  { code: "km", name: "Tiếng Khmer", nameEn: "Khmer", nativeName: "ខ្មែរ", dir: "ltr", speechLang: "km-KH" },
  { code: "lo", name: "Tiếng Lào", nameEn: "Lao", nativeName: "ລາວ", dir: "ltr", speechLang: "lo-LA" },
  { code: "my", name: "Tiếng Myanmar", nameEn: "Burmese", nativeName: "မြန်မာ", dir: "ltr", speechLang: "my-MM" },
  { code: "tl", name: "Tiếng Filipino (Tagalog)", nameEn: "Filipino", nativeName: "Filipino", dir: "ltr", speechLang: "fil-PH" },
  { code: "hu", name: "Tiếng Hungary", nameEn: "Hungarian", nativeName: "Magyar", dir: "ltr", speechLang: "hu-HU" },
  { code: "ro", name: "Tiếng Romania", nameEn: "Romanian", nativeName: "Română", dir: "ltr", speechLang: "ro-RO" },
  { code: "bg", name: "Tiếng Bulgaria", nameEn: "Bulgarian", nativeName: "Български", dir: "ltr", speechLang: "bg-BG" },
  { code: "sr", name: "Tiếng Serbia", nameEn: "Serbian", nativeName: "Српски", dir: "ltr", speechLang: "sr-RS" },
  { code: "hr", name: "Tiếng Croatia", nameEn: "Croatian", nativeName: "Hrvatski", dir: "ltr", speechLang: "hr-HR" },
  { code: "sk", name: "Tiếng Slovakia", nameEn: "Slovak", nativeName: "Slovenčina", dir: "ltr", speechLang: "sk-SK" },
  { code: "sl", name: "Tiếng Slovenia", nameEn: "Slovenian", nativeName: "Slovenščina", dir: "ltr", speechLang: "sl-SI" },
  { code: "et", name: "Tiếng Estonia", nameEn: "Estonian", nativeName: "Eesti", dir: "ltr", speechLang: "et-EE" },
  { code: "lv", name: "Tiếng Latvia", nameEn: "Latvian", nativeName: "Latviešu", dir: "ltr", speechLang: "lv-LV" },
  { code: "lt", name: "Tiếng Litva", nameEn: "Lithuanian", nativeName: "Lietuvių", dir: "ltr", speechLang: "lt-LT" },
  { code: "is", name: "Tiếng Iceland", nameEn: "Icelandic", nativeName: "Íslenska", dir: "ltr", speechLang: "is-IS" },
  { code: "ga", name: "Tiếng Ireland", nameEn: "Irish", nativeName: "Gaeilge", dir: "ltr", speechLang: "ga-IE" },
  { code: "cy", name: "Tiếng Xứ Wales", nameEn: "Welsh", nativeName: "Cymraeg", dir: "ltr", speechLang: "cy-GB" },
  { code: "ca", name: "Tiếng Catalan", nameEn: "Catalan", nativeName: "Català", dir: "ltr", speechLang: "ca-ES" },
  { code: "gl", name: "Tiếng Galicia", nameEn: "Galician", nativeName: "Galego", dir: "ltr", speechLang: "gl-ES" },
  { code: "eu", name: "Tiếng Basque", nameEn: "Basque", nativeName: "Euskara", dir: "ltr", speechLang: "eu-ES" },
  { code: "mt", name: "Tiếng Malta", nameEn: "Maltese", nativeName: "Malti", dir: "ltr", speechLang: "mt-MT" },
  { code: "sq", name: "Tiếng Albania", nameEn: "Albanian", nativeName: "Shqip", dir: "ltr", speechLang: "sq-AL" },
  { code: "mk", name: "Tiếng Macedonia", nameEn: "Macedonian", nativeName: "Македонски", dir: "ltr", speechLang: "mk-MK" },
  { code: "bs", name: "Tiếng Bosnia", nameEn: "Bosnian", nativeName: "Bosanski", dir: "ltr", speechLang: "bs-BA" },
  { code: "be", name: "Tiếng Belarus", nameEn: "Belarusian", nativeName: "Беларуская", dir: "ltr", speechLang: "be-BY" },
  { code: "ka", name: "Tiếng Gruzia", nameEn: "Georgian", nativeName: "ქართული", dir: "ltr", speechLang: "ka-GE" },
  { code: "hy", name: "Tiếng Armenia", nameEn: "Armenian", nativeName: "Հայերեն", dir: "ltr", speechLang: "hy-AM" },
  { code: "az", name: "Tiếng Azerbaijan", nameEn: "Azerbaijani", nativeName: "Azərbaycan", dir: "ltr", speechLang: "az-AZ" },
  { code: "kk", name: "Tiếng Kazakh", nameEn: "Kazakh", nativeName: "Қазақ тілі", dir: "ltr", speechLang: "kk-KZ" },
  { code: "uz", name: "Tiếng Uzbek", nameEn: "Uzbek", nativeName: "Oʻzbek", dir: "ltr", speechLang: "uz-UZ" },
  { code: "ky", name: "Tiếng Kyrgyz", nameEn: "Kyrgyz", nativeName: "Кыргызча", dir: "ltr", speechLang: "ky-KG" },
  { code: "tg", name: "Tiếng Tajik", nameEn: "Tajik", nativeName: "Тоҷикӣ", dir: "ltr", speechLang: "tg-TJ" },
  { code: "tk", name: "Tiếng Turkmen", nameEn: "Turkmen", nativeName: "Türkmen", dir: "ltr", speechLang: "tk-TM" },
  { code: "mn", name: "Tiếng Mông Cổ", nameEn: "Mongolian", nativeName: "Монгол", dir: "ltr", speechLang: "mn-MN" },
  { code: "ps", name: "Tiếng Pashto", nameEn: "Pashto", nativeName: "پښتو", dir: "rtl", speechLang: "ps-AF" },
  { code: "sd", name: "Tiếng Sindhi", nameEn: "Sindhi", nativeName: "سنڌي", dir: "rtl", speechLang: "sd-PK" },
  { code: "ku", name: "Tiếng Kurd", nameEn: "Kurdish", nativeName: "Kurdî", dir: "ltr", speechLang: "ku-TR" },
  { code: "am", name: "Tiếng Amharic", nameEn: "Amharic", nativeName: "አማርኛ", dir: "ltr", speechLang: "am-ET" },
  { code: "ti", name: "Tiếng Tigrinya", nameEn: "Tigrinya", nativeName: "ትግርኛ", dir: "ltr", speechLang: "ti-ER" },
  { code: "sw", name: "Tiếng Swahili", nameEn: "Swahili", nativeName: "Kiswahili", dir: "ltr", speechLang: "sw-KE" },
  { code: "af", name: "Tiếng Afrikaans", nameEn: "Afrikaans", nativeName: "Afrikaans", dir: "ltr", speechLang: "af-ZA" },
  { code: "zu", name: "Tiếng Zulu", nameEn: "Zulu", nativeName: "isiZulu", dir: "ltr", speechLang: "zu-ZA" },
  { code: "xh", name: "Tiếng Xhosa", nameEn: "Xhosa", nativeName: "isiXhosa", dir: "ltr", speechLang: "xh-ZA" },
  { code: "yo", name: "Tiếng Yoruba", nameEn: "Yoruba", nativeName: "Èdè Yorùbá", dir: "ltr", speechLang: "yo-NG" },
  { code: "ig", name: "Tiếng Igbo", nameEn: "Igbo", nativeName: "Igbo", dir: "ltr", speechLang: "ig-NG" },
  { code: "ha", name: "Tiếng Hausa", nameEn: "Hausa", nativeName: "Hausa", dir: "ltr", speechLang: "ha-NG" },
  { code: "so", name: "Tiếng Somali", nameEn: "Somali", nativeName: "Soomaali", dir: "ltr", speechLang: "so-SO" },
  { code: "mg", name: "Tiếng Malagasy", nameEn: "Malagasy", nativeName: "Malagasy", dir: "ltr", speechLang: "mg-MG" },
  { code: "rw", name: "Tiếng Kinyarwanda", nameEn: "Kinyarwanda", nativeName: "Kinyarwanda", dir: "ltr", speechLang: "rw-RW" },
  { code: "sn", name: "Tiếng Shona", nameEn: "Shona", nativeName: "chiShona", dir: "ltr", speechLang: "sn-ZW" },
  { code: "ny", name: "Tiếng Chichewa", nameEn: "Chichewa", nativeName: "Chichewa", dir: "ltr", speechLang: "ny-MW" },
  { code: "st", name: "Tiếng Sesotho", nameEn: "Sesotho", nativeName: "Sesotho", dir: "ltr", speechLang: "st-LS" },
  { code: "ln", name: "Tiếng Lingala", nameEn: "Lingala", nativeName: "Lingála", dir: "ltr", speechLang: "ln-CD" },
  { code: "ht", name: "Tiếng Creole Haiti", nameEn: "Haitian Creole", nativeName: "Kreyòl Ayisyen", dir: "ltr", speechLang: "ht-HT" },
  { code: "jv", name: "Tiếng Java", nameEn: "Javanese", nativeName: "Basa Jawa", dir: "ltr", speechLang: "jv-ID" },
  { code: "su", name: "Tiếng Sunda", nameEn: "Sundanese", nativeName: "Basa Sunda", dir: "ltr", speechLang: "su-ID" },
  { code: "ceb", name: "Tiếng Cebuano", nameEn: "Cebuano", nativeName: "Cebuano", dir: "ltr", speechLang: "ceb-PH" },
  { code: "mi", name: "Tiếng Maori", nameEn: "Maori", nativeName: "Te Reo Māori", dir: "ltr", speechLang: "mi-NZ" },
  { code: "sm", name: "Tiếng Samoa", nameEn: "Samoan", nativeName: "Gagana Sāmoa", dir: "ltr", speechLang: "sm-WS" },
  { code: "haw", name: "Tiếng Hawaii", nameEn: "Hawaiian", nativeName: "ʻŌlelo Hawaiʻi", dir: "ltr", speechLang: "haw-US" },
  { code: "eo", name: "Quốc tế ngữ (Esperanto)", nameEn: "Esperanto", nativeName: "Esperanto", dir: "ltr", speechLang: "eo" },
  { code: "la", name: "Tiếng Latinh", nameEn: "Latin", nativeName: "Latina", dir: "ltr", speechLang: "la" },
  { code: "lb", name: "Tiếng Luxembourg", nameEn: "Luxembourgish", nativeName: "Lëtzebuergesch", dir: "ltr", speechLang: "lb-LU" },
  { code: "yi", name: "Tiếng Yiddish", nameEn: "Yiddish", nativeName: "ייִדיש", dir: "rtl", speechLang: "yi" }
]);

const LANGUAGE_MAP = new Map(GLOBAL_LANGUAGES.map((l) => [l.code.toLowerCase(), l]));

export function getLanguageInfo(code) {
  if (!code) return null;
  const normalized = String(code).trim();
  return (
    LANGUAGE_MAP.get(normalized.toLowerCase()) ||
    GLOBAL_LANGUAGES.find((l) => l.code.toLowerCase() === normalized.toLowerCase()) ||
    null
  );
}

export function isSupportedLanguagePair(sourceLang, targetLang) {
  const src = sourceLang === "auto" ? { code: "auto" } : getLanguageInfo(sourceLang);
  const tgt = getLanguageInfo(targetLang);
  if (!src || !tgt || tgt.code === "auto") {
    return {
      supported: false,
      reason: "Mã ngôn ngữ nguồn hoặc ngôn ngữ đích không nằm trong danh mục hỗ trợ đã kiểm chứng."
    };
  }
  return {
    supported: true,
    source: src,
    target: tgt
  };
}

// Ký tự dấu đặc trưng riêng của tiếng Việt (không trùng với dấu sắc/huyền đơn của Pháp/Tây Ban Nha/Ý)
const UNIQUE_VIETNAMESE_DIACRITIC_RE =
  /[ăđơưắằẳẵặấầẩẫậếềểễệốồổỗộớờởỡợứừửữựảẻỉỏủỷạẹịọụỵãẽĩõũỹỳ]/i;

const VIETNAMESE_COMMON_WORDS = new Set([
  "của", "và", "các", "trong", "được", "cho", "là", "với", "không", "những",
  "một", "người", "này", "đã", "khi", "tại", "theo", "từ", "về", "như",
  "chúng", "tôi", "bạn", "hệ", "thống", "dịch", "thuật", "ngôn", "ngữ",
  "xin", "chào", "cảm", "ơn", "việt", "nam", "phát", "triển", "dữ", "liệu"
]);

const LATIN_LANG_SIGNATURES = [
  {
    code: "en",
    words: new Set(["the", "and", "is", "are", "to", "of", "in", "for", "with", "that", "this", "from", "hello", "world", "translation", "system", "language", "data", "platform", "we", "you", "have"])
  },
  {
    code: "fr",
    chars: /[œæç]/i,
    words: new Set(["le", "la", "les", "des", "est", "dans", "pour", "avec", "une", "sur", "pas", "bonjour", "monde", "merci", "système", "traduction", "nous", "vous", "aucune", "données"])
  },
  {
    code: "de",
    chars: /[äöüß]/i,
    words: new Set(["der", "die", "das", "und", "ist", "in", "den", "von", "mit", "für", "auf", "nicht", "ein", "eine", "hallo", "welt", "danke", "übersetzung", "übersetzungssystem"])
  },
  {
    code: "es",
    chars: /[ñ¿¡]/i,
    words: new Set(["el", "la", "los", "las", "de", "que", "en", "y", "es", "por", "con", "para", "una", "hola", "mundo", "gracias", "traducción", "sistema"])
  },
  {
    code: "pt",
    chars: /[ãõ]/i,
    words: new Set(["o", "a", "os", "as", "de", "que", "não", "para", "com", "uma", "olá", "obrigado", "tradução", "sistema", "você"])
  },
  {
    code: "it",
    words: new Set(["il", "lo", "la", "gli", "le", "di", "che", "non", "per", "con", "una", "ciao", "grazie", "traduzione", "sistema"])
  },
  {
    code: "id",
    words: new Set(["yang", "dan", "di", "ini", "untuk", "dengan", "tidak", "dari", "dalam", "halo", "terima", "kasih", "sistem", "bahasa"])
  },
  {
    code: "pl",
    chars: /[ąćęłńśźż]/i,
    words: new Set(["i", "w", "nie", "na", "z", "do", "to", "że", "jest", "się", "cześć", "dziękuję"])
  },
  {
    code: "tr",
    chars: /[ğış]/i,
    words: new Set(["ve", "bir", "bu", "için", "ile", "de", "da", "merhaba", "teşekkürler", "çeviri"])
  },
  {
    code: "nl",
    words: new Set(["de", "het", "een", "en", "van", "in", "is", "op", "te", "voor", "met", "hallo", "dank"])
  }
];

const TRADITIONAL_HAN_CHARS = /[體國學語譯經際電網書車門開關東風馬鳥魚龍龜]/;

/**
 * Nhận diện ngôn ngữ thực tế từ văn bản đầu vào (hỗ trợ đoạn ngắn, đoạn dài và đa ngôn ngữ).
 */
export function detectLanguage(rawText) {
  const text = String(rawText || "").trim();
  if (!text) {
    return {
      detected: false,
      code: "und",
      name: "Chưa xác định",
      confidence: 0,
      isMultilingual: false,
      detectedScripts: [],
      message: "Nội dung trống, không thể nhận diện ngôn ngữ."
    };
  }

  const strippedSymbols = text.replace(/https?:\/\/\S+/g, "").replace(/[0-9\s\p{P}\p{S}]/gu, "");
  if (!strippedSymbols) {
    return {
      detected: false,
      code: "und",
      name: "Không thể xác định (Chỉ gồm số/ký hiệu)",
      confidence: 0,
      isMultilingual: false,
      detectedScripts: [],
      message: "Văn bản chỉ chứa số, liên kết hoặc ký tự đặc biệt nên không thể xác định ngôn ngữ cụ thể."
    };
  }

  const scriptCounts = {
    han: 0,
    hiraganaKatakana: 0,
    hangul: 0,
    cyrillic: 0,
    arabic: 0,
    hebrew: 0,
    thai: 0,
    devanagari: 0,
    greek: 0,
    khmer: 0,
    lao: 0,
    myanmar: 0,
    bengali: 0,
    tamil: 0,
    georgian: 0,
    armenian: 0,
    latin: 0
  };

  for (const ch of strippedSymbols) {
    const cp = ch.codePointAt(0);
    if ((cp >= 0x3040 && cp <= 0x309f) || (cp >= 0x30a0 && cp <= 0x30ff) || (cp >= 0x31f0 && cp <= 0x31ff)) {
      scriptCounts.hiraganaKatakana += 1;
    } else if ((cp >= 0xac00 && cp <= 0xd7af) || (cp >= 0x1100 && cp <= 0x11ff) || (cp >= 0x3130 && cp <= 0x318f)) {
      scriptCounts.hangul += 1;
    } else if ((cp >= 0x4e00 && cp <= 0x9fff) || (cp >= 0x3400 && cp <= 0x4dbf)) {
      scriptCounts.han += 1;
    } else if (cp >= 0x0400 && cp <= 0x04ff) {
      scriptCounts.cyrillic += 1;
    } else if ((cp >= 0x0600 && cp <= 0x06ff) || (cp >= 0x0750 && cp <= 0x077f)) {
      scriptCounts.arabic += 1;
    } else if (cp >= 0x0590 && cp <= 0x05ff) {
      scriptCounts.hebrew += 1;
    } else if (cp >= 0x0e00 && cp <= 0x0e7f) {
      scriptCounts.thai += 1;
    } else if (cp >= 0x0900 && cp <= 0x097f) {
      scriptCounts.devanagari += 1;
    } else if (cp >= 0x0370 && cp <= 0x03ff) {
      scriptCounts.greek += 1;
    } else if (cp >= 0x1780 && cp <= 0x17ff) {
      scriptCounts.khmer += 1;
    } else if (cp >= 0x0e80 && cp <= 0x0eff) {
      scriptCounts.lao += 1;
    } else if (cp >= 0x1000 && cp <= 0x109f) {
      scriptCounts.myanmar += 1;
    } else if (cp >= 0x0980 && cp <= 0x09ff) {
      scriptCounts.bengali += 1;
    } else if (cp >= 0x0b80 && cp <= 0x0bff) {
      scriptCounts.tamil += 1;
    } else if (cp >= 0x10a0 && cp <= 0x10ff) {
      scriptCounts.georgian += 1;
    } else if (cp >= 0x0530 && cp <= 0x058f) {
      scriptCounts.armenian += 1;
    } else if ((cp >= 0x0041 && cp <= 0x024f) || (cp >= 0x1e00 && cp <= 0x1eff)) {
      scriptCounts.latin += 1;
    }
  }

  const totalChars = Math.max(1, Object.values(scriptCounts).reduce((a, b) => a + b, 0));
  const activeScripts = Object.entries(scriptCounts)
    .filter(([, count]) => count > 0)
    .sort((a, b) => b[1] - a[1]);

  if (scriptCounts.hiraganaKatakana > 0 && scriptCounts.hiraganaKatakana >= scriptCounts.latin * 0.4) {
    const jpRatio = (scriptCounts.hiraganaKatakana + scriptCounts.han) / totalChars;
    return buildDetectionResult("ja", Math.min(0.99, 0.78 + jpRatio * 0.2), activeScripts, totalChars);
  }

  if (scriptCounts.hangul > 0 && scriptCounts.hangul >= scriptCounts.latin * 0.35) {
    const koRatio = scriptCounts.hangul / totalChars;
    return buildDetectionResult("ko", Math.min(0.99, 0.8 + koRatio * 0.19), activeScripts, totalChars);
  }

  if (scriptCounts.han > 0 && scriptCounts.han >= scriptCounts.latin * 0.35) {
    const zhCode = TRADITIONAL_HAN_CHARS.test(text) ? "zh-TW" : "zh";
    const zhRatio = scriptCounts.han / totalChars;
    return buildDetectionResult(zhCode, Math.min(0.99, 0.8 + zhRatio * 0.19), activeScripts, totalChars);
  }

  if (scriptCounts.cyrillic > 0 && scriptCounts.cyrillic >= scriptCounts.latin * 0.4) {
    if (/[іїєґ]/i.test(text)) {
      return buildDetectionResult("uk", 0.94, activeScripts, totalChars);
    }
    return buildDetectionResult("ru", 0.95, activeScripts, totalChars);
  }

  if (scriptCounts.arabic > 0) {
    if (/[پچژگ]/.test(text)) return buildDetectionResult("fa", 0.93, activeScripts, totalChars);
    if (/[ٹڈڑںے]/.test(text)) return buildDetectionResult("ur", 0.93, activeScripts, totalChars);
    return buildDetectionResult("ar", 0.95, activeScripts, totalChars);
  }
  if (scriptCounts.hebrew > 0) return buildDetectionResult("he", 0.96, activeScripts, totalChars);
  if (scriptCounts.thai > 0) return buildDetectionResult("th", 0.97, activeScripts, totalChars);
  if (scriptCounts.devanagari > 0) return buildDetectionResult("hi", 0.95, activeScripts, totalChars);
  if (scriptCounts.greek > 0) return buildDetectionResult("el", 0.96, activeScripts, totalChars);
  if (scriptCounts.khmer > 0) return buildDetectionResult("km", 0.96, activeScripts, totalChars);
  if (scriptCounts.lao > 0) return buildDetectionResult("lo", 0.96, activeScripts, totalChars);
  if (scriptCounts.myanmar > 0) return buildDetectionResult("my", 0.96, activeScripts, totalChars);
  if (scriptCounts.bengali > 0) return buildDetectionResult("bn", 0.96, activeScripts, totalChars);
  if (scriptCounts.tamil > 0) return buildDetectionResult("ta", 0.96, activeScripts, totalChars);
  if (scriptCounts.georgian > 0) return buildDetectionResult("ka", 0.96, activeScripts, totalChars);
  if (scriptCounts.armenian > 0) return buildDetectionResult("hy", 0.96, activeScripts, totalChars);

  const tokens = text
    .toLowerCase()
    .replace(/[^\p{L}\s]/gu, " ")
    .split(/\s+/)
    .filter(Boolean);

  let viMatches = 0;
  for (const t of tokens) {
    if (VIETNAMESE_COMMON_WORDS.has(t)) viMatches += 1;
  }

  if (UNIQUE_VIETNAMESE_DIACRITIC_RE.test(text) || viMatches >= 2) {
    const confidence = UNIQUE_VIETNAMESE_DIACRITIC_RE.test(text) ? 0.98 : 0.88;
    return buildDetectionResult("vi", confidence, activeScripts, totalChars, tokens);
  }

  let bestCode = "en";
  let bestScore = 0;
  for (const sig of LATIN_LANG_SIGNATURES) {
    let score = 0;
    if (sig.chars && sig.chars.test(text)) score += 2.5;
    for (const t of tokens) {
      if (sig.words.has(t)) score += 1.5;
    }
    if (score > bestScore) {
      bestScore = score;
      bestCode = sig.code;
    }
  }

  const confidence = bestScore > 0 ? Math.min(0.96, 0.72 + bestScore * 0.05) : 0.68;
  return buildDetectionResult(bestCode, confidence, activeScripts, totalChars, tokens);
}

function buildDetectionResult(code, confidence, activeScripts, totalChars, tokens = []) {
  const info = getLanguageInfo(code) || {
    code,
    name: code.toUpperCase(),
    nameEn: code.toUpperCase(),
    nativeName: code.toUpperCase(),
    dir: "ltr"
  };

  const secondaryLanguages = [];
  const scriptToLang = {
    latin: "en",
    han: "zh",
    hiraganaKatakana: "ja",
    hangul: "ko",
    cyrillic: "ru",
    arabic: "ar"
  };

  for (const [scriptName, count] of activeScripts) {
    if (count / totalChars >= 0.12) {
      const mapped = scriptToLang[scriptName];
      if (mapped && mapped !== code && !secondaryLanguages.includes(mapped)) {
        secondaryLanguages.push(mapped);
      }
    }
  }

  if (code === "vi" && tokens.length >= 4) {
    let enHits = 0;
    const enSet = LATIN_LANG_SIGNATURES[0].words;
    for (const t of tokens) {
      if (enSet.has(t)) enHits += 1;
    }
    if (enHits >= 2 && !secondaryLanguages.includes("en")) {
      secondaryLanguages.push("en");
    }
  }

  return {
    detected: true,
    code: info.code,
    name: info.name,
    nameEn: info.nameEn,
    nativeName: info.nativeName,
    dir: info.dir,
    confidence: Number(confidence.toFixed(2)),
    isMultilingual: secondaryLanguages.length > 0,
    secondaryLanguages,
    detectedScripts: activeScripts.map(([script]) => script)
  };
}
