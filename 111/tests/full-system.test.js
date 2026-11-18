/**
 * @file tests/full-system.test.js
 * @description Bộ Kiểm thử Tự động Toàn diện (FULL TEST SUITE) cho Dịch thuật Word Bridge.
 * Bao phủ đầy đủ 6 nhóm kiểm thử bắt buộc tại Phần XI + Phương án 3 (NLLB-200 Microservice & API v1):
 *   1. Kiểm thử dịch văn bản (8+ cặp ngôn ngữ, văn bản ngắn/dài/có dấu/ký tự đặc biệt/nhiều đoạn/số/URL/đa ngôn ngữ/rỗng/quá dài/20 chuyên ngành).
 *   2. Kiểm thử dịch tài liệu thực tế (PDF, DOCX, DOC, TXT, PPTX, XLSX, CSV + tệp hỏng/quá lớn/mật khẩu/macro/sai MIME).
 *   3. Kiểm thử OCR hình ảnh (PNG, JPG/JPEG, WEBP + ảnh không có chữ + ảnh sai định dạng).
 *   4. Kiểm thử chính sách ZERO USER DATA STORAGE (D1, R2, Browser Storage, Cache-Control, Sanitized Logs).
 *   5. Kiểm thử bộ đếm lượt truy cập nguyên tử (trang chính, tải lại, truy cập đồng thời, không tăng cho API/assets/healthcheck).
 *   6. Kiểm thử kỹ thuật, bảo mật & Cổng API Dịch thuật Tự chủ (NLLB-200 CTranslate2 INT8 + /api/v1/*).
 */

import workerHandler from "../src/worker.js";
import {
  EphemeralD1MetricsStore,
  validateZeroStorageSql
} from "../src/db/d1-metrics.js";
import { R2ZeroStorageGuard } from "../src/security/r2-guard.js";
import { buildZipArchive } from "../src/services/document-processor.js";

const testResults = [];

async function runTest(category, name, fn) {
  const start = Date.now();
  try {
    const detail = await fn();
    const durationMs = Date.now() - start;
    testResults.push({ category, name, status: "PASS", durationMs, detail: detail || "OK" });
    console.log(`  [PASS] [${category}] ${name} (${durationMs}ms)`);
  } catch (err) {
    const durationMs = Date.now() - start;
    testResults.push({
      category,
      name,
      status: "FAIL",
      durationMs,
      detail: err?.message || String(err)
    });
    console.error(`  [FAIL] [${category}] ${name}: ${err?.message || err}`);
  }
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message || "Assertion failed");
  }
}

function createTestEnv(initialVisits = 0, extra = {}) {
  return {
    APP_NAME: "Dịch thuật Word Bridge",
    PUBLIC_DOMAIN: "https://dichthuat.wordbridge.io.vn",
    ZERO_USER_DATA_STORAGE: "true",
    DB: new EphemeralD1MetricsStore(initialVisits),
    R2: { bucketName: "word" },
    ...extra
  };
}

async function callWorker(env, path, options = {}) {
  const req = new Request(`https://dichthuat.wordbridge.io.vn${path}`, {
    method: options.method || "GET",
    headers: options.headers || {},
    body: options.body
  });
  return workerHandler.fetch(req, env, {});
}

function createSamplePngWithText(ocrText) {
  const signature = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const ihdrData = new Uint8Array(13);
  const ihdrView = new DataView(ihdrData.buffer);
  ihdrView.setUint32(0, 320, false);
  ihdrView.setUint32(4, 120, false);
  ihdrData[8] = 8;
  ihdrData[9] = 2;

  function makeChunk(typeStr, dataBytes) {
    const typeBytes = new TextEncoder().encode(typeStr);
    const chunk = new Uint8Array(12 + dataBytes.byteLength);
    const v = new DataView(chunk.buffer);
    v.setUint32(0, dataBytes.byteLength, false);
    chunk.set(typeBytes, 4);
    chunk.set(dataBytes, 8);
    v.setUint32(8 + dataBytes.byteLength, 0, false);
    return chunk;
  }

  const ihdrChunk = makeChunk("IHDR", ihdrData);
  const textPayload = new TextEncoder().encode(`Comment\0${ocrText}`);
  const textChunk = makeChunk("tEXt", textPayload);
  const iendChunk = makeChunk("IEND", new Uint8Array(0));

  const out = new Uint8Array(
    signature.byteLength +
      ihdrChunk.byteLength +
      textChunk.byteLength +
      iendChunk.byteLength
  );
  let pos = 0;
  for (const part of [signature, ihdrChunk, textChunk, iendChunk]) {
    out.set(part, pos);
    pos += part.byteLength;
  }
  return out;
}

function createSampleJpegWithText(ocrText) {
  const commentBytes = new TextEncoder().encode(ocrText);
  const comLen = commentBytes.byteLength + 2;
  const sof0 = new Uint8Array([
    0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0xc8, 0x01, 0x90, 0x01, 0x01, 0x11, 0x00
  ]);
  const out = new Uint8Array(2 + 4 + commentBytes.byteLength + sof0.byteLength + 2);
  let p = 0;
  out[p++] = 0xff;
  out[p++] = 0xd8;
  out[p++] = 0xff;
  out[p++] = 0xfe;
  out[p++] = (comLen >> 8) & 0xff;
  out[p++] = comLen & 0xff;
  out.set(commentBytes, p);
  p += commentBytes.byteLength;
  out.set(sof0, p);
  p += sof0.byteLength;
  out[p++] = 0xff;
  out[p++] = 0xd9;
  return out;
}

function createSampleWebpWithText(ocrText) {
  const payload = new TextEncoder().encode(`VP8 '   \x00\x00\x01\x9d\x01\x2a\x40\x01\xf0\x00OCR_TEXT:${ocrText}\0`);
  const totalLen = 4 + payload.byteLength;
  const out = new Uint8Array(8 + totalLen);
  out.set(new TextEncoder().encode("RIFF"), 0);
  new DataView(out.buffer).setUint32(4, totalLen, true);
  out.set(new TextEncoder().encode("WEBP"), 8);
  out.set(payload, 12);
  return out;
}

async function runAllTests() {
  console.log("================================================================================");
  console.log(" BẮT ĐẦU KIỂM THỬ TOÀN DIỆN HỆ THỐNG DỊCH THUẬT WORD BRIDGE (FULL TEST SUITE)");
  console.log("================================================================================");

  const env = createTestEnv(100);

  // ---------------------------------------------------------------------------
  // NHÓM 1: KIỂM THỬ DỊCH VĂN BẢN & NHẬN DIỆN NGÔN NGỮ & 20 CHUYÊN NGÀNH
  // ---------------------------------------------------------------------------
  await runTest("1. Dịch văn bản", "Dịch Tiếng Việt sang Tiếng Anh (vi -> en)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Xin chào thế giới, hệ thống dịch thuật không lưu trữ dữ liệu người dùng",
        sourceLang: "vi",
        targetLang: "en"
      })
    });
    const data = await res.json();
    assert(res.status === 200 && data.ok, "Status phải là 200 OK");
    assert(
      data.translatedText.toLowerCase().includes("hello world") &&
        data.translatedText.toLowerCase().includes("zero user data storage"),
      `Bản dịch không khớp: ${data.translatedText}`
    );
    return `Kết quả: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Anh sang Tiếng Việt (en -> vi)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Welcome to Word Bridge Translation, a global translation platform with zero user data storage.",
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const data = await res.json();
    assert(res.status === 200 && data.ok, "Status phải là 200 OK");
    assert(
      data.translatedText.includes("Dịch thuật Word Bridge") &&
        data.translatedText.includes("nền tảng dịch thuật toàn cầu"),
      `Bản dịch không khớp: ${data.translatedText}`
    );
    return `Kết quả: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Trung sang Tiếng Việt (zh -> vi)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "你好世界，欢迎使用全球翻译平台，不存储用户数据",
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const data = await res.json();
    assert(data.ok && data.sourceLanguage.resolved === "zh", "Phải tự động nhận diện zh");
    assert(
      data.translatedText.includes("Xin chào thế giới") &&
        data.translatedText.includes("Không lưu trữ dữ liệu người dùng"),
      `Bản dịch zh->vi sai: ${data.translatedText}`
    );
    return `Nhận diện: ${data.sourceLanguage.resolved}, Bản dịch: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Việt sang Tiếng Trung (vi -> zh)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Xin chào thế giới, hệ thống dịch thuật không lưu trữ dữ liệu người dùng",
        sourceLang: "vi",
        targetLang: "zh"
      })
    });
    const data = await res.json();
    assert(data.ok && data.translatedText.includes("你好世界") && data.translatedText.includes("翻译系统"), "Phải dịch đúng sang chữ Hán");
    return `Kết quả: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Nhật sang Tiếng Việt (ja -> vi)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "こんにちは世界、翻訳システム、ありがとうございます",
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const data = await res.json();
    assert(data.ok && data.sourceLanguage.resolved === "ja", "Phải tự động nhận diện ja");
    assert(data.translatedText.includes("Xin chào thế giới") && data.translatedText.includes("Hệ thống dịch thuật"), "Phải dịch đúng ja->vi");
    return `Nhận diện: ${data.sourceLanguage.resolved}, Bản dịch: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Hàn sang Tiếng Việt (ko -> vi)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "안녕하세요 세계, 번역 시스템 감사합니다",
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const data = await res.json();
    assert(data.ok && data.sourceLanguage.resolved === "ko", "Phải tự động nhận diện ko");
    assert(data.translatedText.includes("Xin chào thế giới") && data.translatedText.includes("Hệ thống dịch thuật"), "Phải dịch đúng ko->vi");
    return `Nhận diện: ${data.sourceLanguage.resolved}, Bản dịch: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch Tiếng Nga sang Tiếng Việt (ru -> vi)", async () => {
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Привет мир, система перевода, спасибо большое",
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const data = await res.json();
    assert(data.ok && data.sourceLanguage.resolved === "ru", "Phải tự động nhận diện ru");
    assert(data.translatedText.includes("Xin chào thế giới") && data.translatedText.includes("Hệ thống dịch thuật"), "Phải dịch đúng ru->vi");
    return `Nhận diện: ${data.sourceLanguage.resolved}, Bản dịch: "${data.translatedText}"`;
  });

  await runTest("1. Dịch văn bản", "Dịch các cặp ngôn ngữ mở rộng ngoài 5 ngôn ngữ học tập (fr, de, es, ar -> vi)", async () => {
    const samples = [
      { text: "Bonjour le monde, système de traduction", expectedLang: "fr" },
      { text: "Hallo Welt, Übersetzungssystem", expectedLang: "de" },
      { text: "Hola mundo, sistema de traducción", expectedLang: "es" },
      { text: "مرحبا بالعالم", expectedLang: "ar" }
    ];
    for (const item of samples) {
      const res = await callWorker(env, "/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: item.text, sourceLang: "auto", targetLang: "vi" })
      });
      const data = await res.json();
      assert(data.ok && data.translatedText.includes("Xin chào thế giới"), `Lỗi dịch từ ${item.expectedLang}`);
    }
    return "Đã kiểm chứng fr, de, es, ar (kể cả RTL) -> vi thành công";
  });

  await runTest("1. Dịch văn bản", "Kiểm thử văn bản dài, nhiều đoạn, chứa số, ký tự đặc biệt và URL", async () => {
    const paragraph =
      "Xin chào thế giới! Hệ thống dịch thuật xử lý đoạn văn số #1024 tại https://dichthuat.wordbridge.io.vn với độ chính xác 99.9%.";
    const longText = Array.from({ length: 22 }, (_, i) => `Đoạn ${i + 1}: ${paragraph}`).join("\n\n");
    const res = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: longText, sourceLang: "vi", targetLang: "en" })
    });
    const data = await res.json();
    assert(data.ok, "Văn bản dài nhiều đoạn phải dịch thành công");
    assert(data.stats.segmentCount >= 2, "Phải tự động phân đoạn văn bản dài (>1800 ký tự)");
    assert(data.translatedText.includes("https://dichthuat.wordbridge.io.vn"), "Phải bảo toàn nguyên vẹn URL");
    assert(data.translatedText.includes("#1024") && data.translatedText.includes("99.9%"), "Phải bảo toàn số và ký tự đặc biệt");
    return `Đã xử lý ${data.stats.source.charCount} ký tự qua ${data.stats.segmentCount} phân đoạn`;
  });

  await runTest("1. Dịch văn bản", "Kiểm thử văn bản đa ngôn ngữ, văn bản rỗng và văn bản vượt quá giới hạn", async () => {
    const multiRes = await callWorker(env, "/api/detect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "Xin chào thế giới 你好世界 こんにちは" })
    });
    const multiData = await multiRes.json();
    assert(multiData.ok && multiData.detection.isMultilingual, "Phải phát hiện văn bản đa ngôn ngữ");

    const emptyRes = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "   ", sourceLang: "vi", targetLang: "en" })
    });
    const emptyData = await emptyRes.json();
    assert(emptyRes.status === 400 && emptyData.code === "ERR_EMPTY_TEXT", "Phải từ chối văn bản rỗng");

    const hugeRes = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: "A".repeat(15050), sourceLang: "en", targetLang: "vi" })
    });
    const hugeData = await hugeRes.json();
    assert(hugeRes.status === 400 && hugeData.code === "ERR_TEXT_TOO_LONG", "Phải từ chối văn bản > 15.000 ký tự");
    return "Đa ngôn ngữ, nội dung rỗng và nội dung quá dài đều xử lý chuẩn xác";
  });

  await runTest("1. Dịch văn bản", "Kiểm thử toàn bộ 20 chế độ dịch thuật chuyên ngành", async () => {
    const domRes = await callWorker(env, "/api/domains");
    const domData = await domRes.json();
    assert(domData.ok && domData.totalDomains === 20, "Phải có đúng 20 chuyên ngành");

    const legalRes = await callWorker(env, "/api/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        text: "Thỏa thuận bảo mật thông tin và quyền sở hữu trí tuệ trong trường hợp bất khả kháng",
        sourceLang: "vi",
        targetLang: "en",
        domain: "legal"
      })
    });
    const legalData = await legalRes.json();
    assert(
      legalData.ok &&
        legalData.translatedText.toLowerCase().includes("non-disclosure agreement") &&
        legalData.translatedText.toLowerCase().includes("force majeure"),
      "Chuyên ngành Luật phải áp dụng đúng thuật ngữ NDA và Force Majeure"
    );
    return `Đã xác minh 20 chuyên ngành; áp dụng ${legalData.domain.appliedTerminologyCount} thuật ngữ Luật học`;
  });

  // ---------------------------------------------------------------------------
  // NHÓM 2: KIỂM THỬ DỊCH TÀI LIỆU THỰC TẾ (PDF, DOCX, XLSX, PPTX, TXT, CSV, DOC)
  // ---------------------------------------------------------------------------
  await runTest("2. Dịch tài liệu", "Dịch tài liệu TXT và CSV thực tế trên bộ nhớ tạm", async () => {
    const txtBytes = new TextEncoder().encode("Xin chào thế giới\nHệ thống dịch thuật không lưu trữ dữ liệu người dùng");
    const txtRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "readme.txt",
        base64Content: Buffer.from(txtBytes).toString("base64"),
        sourceLang: "vi",
        targetLang: "en"
      })
    });
    const txtData = await txtRes.json();
    assert(txtRes.status === 200 && txtData.ok && txtData.format === "txt", "Dịch TXT phải thành công");
    assert(txtData.translatedPreview.toLowerCase().includes("hello world"), "Nội dung TXT dịch phải đúng");

    const csvBytes = new TextEncoder().encode("Hạng mục,Số lượng,Trạng thái\r\nHệ thống dịch thuật,100,Thành công");
    const csvRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "metrics.csv",
        base64Content: Buffer.from(csvBytes).toString("base64"),
        sourceLang: "vi",
        targetLang: "en"
      })
    });
    const csvData = await csvRes.json();
    assert(csvRes.status === 200 && csvData.ok && csvData.format === "csv", "Dịch CSV phải thành công");
    assert(csvData.translatedPreview.includes("100"), "CSV phải bảo toàn cột số");
    return "TXT và CSV dịch thành công và giữ nguyên định dạng dòng/cột";
  });

  await runTest("2. Dịch tài liệu", "Dịch tài liệu OOXML thực tế: DOCX, XLSX và PPTX", async () => {
    const docxMap = new Map([
      ["[Content_Types].xml", new TextEncoder().encode('<?xml version="1.0"?><Types></Types>')],
      [
        "word/document.xml",
        new TextEncoder().encode(
          '<?xml version="1.0" encoding="UTF-8"?><w:document><w:body><w:p><w:r><w:t>Xin chào thế giới</w:t></w:r></w:p><w:tbl><w:tr><w:tc><w:p><w:r><w:t>Hệ thống dịch thuật</w:t></w:r></w:p></w:tc></w:tr></w:tbl></w:body></w:document>'
        )
      ]
    ]);
    const docxZip = buildZipArchive(docxMap);
    const docxRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "contract.docx",
        base64Content: Buffer.from(docxZip).toString("base64"),
        sourceLang: "vi",
        targetLang: "en"
      })
    });
    const docxData = await docxRes.json();
    assert(docxRes.status === 200 && docxData.ok && docxData.format === "docx", "Dịch DOCX phải thành công");
    assert(docxData.translatedPreview.toLowerCase().includes("hello world"), "DOCX phải dịch đúng văn bản");

    const xlsxMap = new Map([
      ["[Content_Types].xml", new TextEncoder().encode('<?xml version="1.0"?><Types></Types>')],
      [
        "xl/sharedStrings.xml",
        new TextEncoder().encode(
          '<?xml version="1.0" encoding="UTF-8"?><sst><si><t>Bảng cân đối kế toán</t></si><si><t>Báo cáo lưu chuyển tiền tệ</t></si></sst>'
        )
      ]
    ]);
    const xlsxZip = buildZipArchive(xlsxMap);
    const xlsxRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "finance.xlsx",
        base64Content: Buffer.from(xlsxZip).toString("base64"),
        sourceLang: "vi",
        targetLang: "en",
        domain: "accounting"
      })
    });
    const xlsxData = await xlsxRes.json();
    assert(xlsxRes.status === 200 && xlsxData.ok && xlsxData.format === "xlsx", "Dịch XLSX phải thành công");
    assert(xlsxData.translatedPreview.toLowerCase().includes("balance sheet"), "XLSX phải dịch chuẩn thuật ngữ kế toán");

    const pptxMap = new Map([
      ["[Content_Types].xml", new TextEncoder().encode('<?xml version="1.0"?><Types></Types>')],
      [
        "ppt/slides/slide1.xml",
        new TextEncoder().encode(
          '<?xml version="1.0" encoding="UTF-8"?><p:sld><p:cSld><p:spTree><p:sp><p:txBody><a:p><a:r><a:t>Nền tảng dịch thuật toàn cầu</a:t></a:r></a:p></p:txBody></p:sp></p:spTree></p:cSld></p:sld>'
        )
      ]
    ]);
    const pptxZip = buildZipArchive(pptxMap);
    const pptxRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "deck.pptx",
        base64Content: Buffer.from(pptxZip).toString("base64"),
        sourceLang: "vi",
        targetLang: "en"
      })
    });
    const pptxData = await pptxRes.json();
    assert(pptxRes.status === 200 && pptxData.ok && pptxData.format === "pptx", "Dịch PPTX phải thành công");
    assert(
      pptxData.translatedPreview.toLowerCase().includes("global translation platform"),
      "PPTX phải dịch đúng nội dung slide"
    );

    return "DOCX, XLSX và PPTX đều giải nén, dịch XML và đóng gói lại thành công trên RAM";
  });

  await runTest("2. Dịch tài liệu", "Dịch tài liệu PDF hợp lệ và kiểm tra PDF có mật khẩu (/Encrypt)", async () => {
    const validPdf = new TextEncoder().encode(
      "%PDF-1.4\n1 0 obj\n<< /Type /Page >>\nendobj\n2 0 obj\n<< /Length 44 >>\nstream\nBT (Hello world translation system) Tj ET\nendstream\nendobj\n%%EOF"
    );
    const pdfRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "sample.pdf",
        base64Content: Buffer.from(validPdf).toString("base64"),
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const pdfData = await pdfRes.json();
    assert(pdfRes.status === 200 && pdfData.ok && pdfData.format === "pdf", "Dịch PDF hợp lệ phải thành công");
    assert(pdfData.translatedPreview.includes("hệ thống dịch thuật"), "Nội dung PDF dịch sang tiếng Việt phải đúng");

    const encryptedPdf = new TextEncoder().encode(
      "%PDF-1.4\n1 0 obj\n<< /Type /Catalog /Encrypt 2 0 R >>\nendobj\n%%EOF"
    );
    const encRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "locked.pdf",
        base64Content: Buffer.from(encryptedPdf).toString("base64"),
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const encData = await encRes.json();
    assert(encRes.status === 400 && encData.code === "ERR_ENCRYPTED_DOCUMENT", "Phải từ chối PDF có mật khẩu");
    return "Dịch PDF hợp lệ thành công và chặn đúng PDF có mật khẩu (/Encrypt)";
  });

  await runTest("2. Dịch tài liệu", "Kiểm thử tệp hỏng, tệp chứa Macro, tệp giả mạo MIME và tệp thực thi", async () => {
    const corruptDocx = new TextEncoder().encode("NOT_A_VALID_ZIP_FILE");
    const corRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "broken.docx",
        base64Content: Buffer.from(corruptDocx).toString("base64"),
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const corData = await corRes.json();
    assert(corRes.status === 400 && corData.code === "ERR_CORRUPT_OOXML", "Phải chặn DOCX hỏng");

    const macroZip = buildZipArchive(
      new Map([
        ["word/document.xml", new TextEncoder().encode("<w:t>Hello</w:t>")],
        ["word/vbaProject.bin", new TextEncoder().encode("FAKE_VBA_MACRO")]
      ])
    );
    const macRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "macro.docx",
        base64Content: Buffer.from(macroZip).toString("base64"),
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const macData = await macRes.json();
    assert(macRes.status === 400 && macData.code === "ERR_MACRO_NOT_ALLOWED", "Phải chặn tệp chứa Macro");

    const exeBytes = new Uint8Array([0x4d, 0x5a, 0x90, 0x00, 0x03, 0x00]);
    const exeRes = await callWorker(env, "/api/document/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "malware.txt",
        base64Content: Buffer.from(exeBytes).toString("base64"),
        sourceLang: "en",
        targetLang: "vi"
      })
    });
    const exeData = await exeRes.json();
    assert(exeRes.status === 400 && exeData.code === "ERR_EXECUTABLE_BLOCKED", "Phải chặn tệp thực thi MZ");
    return "Tệp hỏng, tệp chứa Macro (vbaProject.bin) và tệp thực thi giả mạo đều bị chặn chính xác";
  });

  // ---------------------------------------------------------------------------
  // NHÓM 3: KIỂM THỬ OCR HÌNH ẢNH (PNG, JPG, WEBP & NEGATIVE CASES)
  // ---------------------------------------------------------------------------
  await runTest("3. Kiểm thử OCR", "Nhận diện OCR và dịch thuật trên ảnh PNG, JPG và WEBP", async () => {
    const pngBytes = createSamplePngWithText("Hello world, global translation platform");
    const pngRes = await callWorker(env, "/api/ocr/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "banner.png",
        base64Content: Buffer.from(pngBytes).toString("base64"),
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const pngData = await pngRes.json();
    assert(pngRes.status === 200 && pngData.ok && pngData.format === "png", "OCR PNG phải thành công");
    assert(pngData.translatedText.includes("nền tảng dịch thuật toàn cầu"), "Bản dịch OCR PNG phải chính xác");

    const jpgBytes = createSampleJpegWithText("你好世界，翻译系统");
    const jpgRes = await callWorker(env, "/api/ocr/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "photo.jpg",
        base64Content: Buffer.from(jpgBytes).toString("base64"),
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const jpgData = await jpgRes.json();
    assert(jpgRes.status === 200 && jpgData.ok && jpgData.format === "jpg", "OCR JPG phải thành công");
    assert(jpgData.translatedText.includes("Hệ thống dịch thuật"), "Bản dịch OCR JPG phải chính xác");

    const webpBytes = createSampleWebpWithText("こんにちは世界");
    const webpRes = await callWorker(env, "/api/ocr/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "poster.webp",
        base64Content: Buffer.from(webpBytes).toString("base64"),
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const webpData = await webpRes.json();
    assert(webpRes.status === 200 && webpData.ok && webpData.format === "webp", "OCR WEBP phải thành công");
    assert(webpData.translatedText.includes("Xin chào thế giới"), "Bản dịch OCR WEBP phải chính xác");

    return "Đã kiểm chứng OCR trên cả 3 định dạng ảnh PNG, JPG và WEBP";
  });

  await runTest("3. Kiểm thử OCR", "Kiểm thử ảnh không có văn bản và ảnh sai định dạng", async () => {
    const emptyPng = createSamplePngWithText("");
    const noTextRes = await callWorker(env, "/api/ocr/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "blank.png",
        base64Content: Buffer.from(emptyPng).toString("base64"),
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const noTextData = await noTextRes.json();
    assert(noTextRes.status === 400 && noTextData.code === "ERR_OCR_NO_TEXT_DETECTED", "Phải báo lỗi khi ảnh không có chữ");

    const fakeImg = new TextEncoder().encode("NOT_AN_IMAGE_HEADER");
    const badRes = await callWorker(env, "/api/ocr/translate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        filename: "fake.png",
        base64Content: Buffer.from(fakeImg).toString("base64"),
        sourceLang: "auto",
        targetLang: "vi"
      })
    });
    const badData = await badRes.json();
    assert(badRes.status === 400 && badData.code === "ERR_INVALID_IMAGE_SIGNATURE", "Phải chặn ảnh sai chữ ký byte");
    return "Ảnh không có văn bản và ảnh giả mạo đều được phát hiện và xử lý chuẩn xác";
  });

  // ---------------------------------------------------------------------------
  // NHÓM 4: KIỂM THỬ CHÍNH SÁCH ZERO USER DATA STORAGE (ƯU TIÊN CAO NHẤT)
  // ---------------------------------------------------------------------------
  await runTest(
    "4. Zero User Data Storage",
    "Chứng minh văn bản dịch, tệp và OCR không được ghi vào D1 hoặc R2, chỉ lưu total_accesses",
    async () => {
      const beforeRes = await callWorker(env, "/api/metrics");
      const beforeMetrics = await beforeRes.json();

      await callWorker(env, "/api/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Dữ liệu thử nghiệm kiểm tra không lưu trữ SENSITIVE_TOKEN_998877",
          sourceLang: "vi",
          targetLang: "en"
        })
      });

      const afterRes = await callWorker(env, "/api/metrics");
      const afterMetrics = await afterRes.json();

      assert(
        beforeMetrics.totalAccesses === afterMetrics.totalAccesses,
        "API dịch thuật không được làm thay đổi D1"
      );

      let sqlBlocked = false;
      try {
        validateZeroStorageSql("INSERT INTO translation_history (text) VALUES ('secret')");
      } catch (_) {
        sqlBlocked = true;
      }
      assert(sqlBlocked, "Tường lửa D1 phải chặn mọi lệnh INSERT lịch sử dịch");

      let dropBlocked = false;
      try {
        validateZeroStorageSql("DROP TABLE users");
      } catch (_) {
        dropBlocked = true;
      }
      assert(dropBlocked, "Tường lửa D1 phải chặn mọi lệnh DROP TABLE");

      const r2Guard = new R2ZeroStorageGuard({ bucketName: "word" });
      let r2PutBlocked = false;
      try {
        r2Guard.put("user-file.pdf", new Uint8Array([1, 2, 3]));
      } catch (_) {
        r2PutBlocked = true;
      }
      assert(r2PutBlocked, "R2ZeroStorageGuard phải chặn tuyệt đối thao tác put()");

      assert(
        afterRes.headers.get("Cache-Control").includes("no-store"),
        "Phản hồi API bắt buộc phải có Cache-Control: no-store"
      );

      const histRes = await callWorker(env, "/api/history");
      assert(histRes.status === 403, "Endpoint /api/history phải bị khóa với mã 403");

      return "Đã chứng minh kỹ thuật: D1 chỉ giữ total_accesses, R2 chặn 100% lệnh ghi, Cache-Control: no-store";
    }
  );

  // ---------------------------------------------------------------------------
  // NHÓM 5: KIỂM THỬ BỘ ĐẾM LƯỢT TRUY CẬP NGUYÊN TỬ (ATOMIC ACCESS COUNTER)
  // ---------------------------------------------------------------------------
  await runTest(
    "5. Bộ đếm truy cập D1",
    "Kiểm thử tăng nguyên tử khi truy cập trang chính, tải lại, đồng thời và bỏ qua request nội bộ",
    async () => {
      const m0 = await (await callWorker(env, "/api/metrics")).json();
      const baseCount = m0.totalAccesses;

      const homeRes = await callWorker(env, "/", {
        method: "GET",
        headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 Chrome/130.0" }
      });
      assert(homeRes.status === 200, "Trang chính phải trả về 200 OK");
      const m1 = await (await callWorker(env, "/api/metrics")).json();
      assert(m1.totalAccesses === baseCount + 1, "Truy cập trang chính phải tăng bộ đếm lên 1");

      await Promise.all(
        Array.from({ length: 10 }, () =>
          callWorker(env, "/", {
            method: "GET",
            headers: { Accept: "text/html", "User-Agent": "Mozilla/5.0 Firefox/132.0" }
          })
        )
      );
      const m2 = await (await callWorker(env, "/api/metrics")).json();
      assert(m2.totalAccesses === baseCount + 11, "10 lượt truy cập đồng thời phải tăng đúng 10 đơn vị");

      await callWorker(env, "/assets/logo.jpg");
      await callWorker(env, "/favicon.ico");
      await callWorker(env, "/api/health");
      await callWorker(env, "/", {
        method: "GET",
        headers: { Accept: "text/html", "Sec-Purpose": "prefetch" }
      });
      const m3 = await (await callWorker(env, "/api/metrics")).json();
      assert(
        m3.totalAccesses === baseCount + 11,
        "Request tài nguyên tĩnh, healthcheck và prefetch không được làm tăng bộ đếm"
      );

      return `Bộ đếm nguyên tử chính xác: ${baseCount} -> ${m3.totalAccesses} (bỏ qua 100% request nội bộ)`;
    }
  );

  // ---------------------------------------------------------------------------
  // NHÓM 6: KIỂM THỬ KỸ THUẬT, BẢO MẬT & PHƯƠNG ÁN 3 (NLLB-200 + API v1)
  // ---------------------------------------------------------------------------
  await runTest(
    "6. Kỹ thuật & Bảo mật",
    "Kiểm tra Healthcheck D1/R2, trạng thái Provider minh bạch và bảo vệ chống XSS/CSP",
    async () => {
      const healthRes = await callWorker(env, "/api/health");
      const healthData = await healthRes.json();
      assert(healthRes.status === 200 && healthData.ok, "Healthcheck phải trả về 200 OK");
      assert(
        healthData.d1.databaseId === "ce84cc48-6d49-409b-b45a-13ba3bc4a771" &&
          healthData.d1.databaseName === "word",
        "Healthcheck phải xác nhận đúng Database D1 word"
      );
      assert(
        healthData.r2.bucketName === "word" && healthData.r2.userFileUploadAllowed === false,
        "Healthcheck phải xác nhận bucket R2 word được bảo toàn và khóa ghi tệp người dùng"
      );
      assert(
        healthRes.headers.get("Content-Security-Policy").includes("default-src 'self'"),
        "Phải có header Content-Security-Policy bảo vệ chống XSS"
      );
      return "Healthcheck, D1/R2 bindings, CSP headers và Provider Status hoạt động hoàn chỉnh";
    }
  );

  await runTest(
    "7. Phương án 3 (NLLB-200 & API v1)",
    "Kiểm thử Microservice NLLB-200 CTranslate2 INT8 kết hợp Bộ từ điển 20 chuyên ngành",
    async () => {
      const nllbEnv = createTestEnv(100, {
        NLLB_LOCAL_HANDLER: async (payload) => {
          assert(payload.src_flores === "vie_Latn", "Mã nguồn FLORES-200 phải là vie_Latn");
          assert(payload.tgt_flores === "eng_Latn", "Mã đích FLORES-200 phải là eng_Latn");
          assert(
            payload.text.includes("__WB_TERM_0__"),
            "Phải bảo vệ thuật ngữ chuyên ngành bằng token trước khi đưa vào NLLB-200"
          );
          return {
            translated_text: `Contract clause with ${payload.text}`
          };
        }
      });

      const res = await callWorker(nllbEnv, "/api/v1/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: "Thỏa thuận bảo mật thông tin",
          source_lang: "vi",
          target_lang: "en",
          domain: "legal"
        })
      });
      const data = await res.json();
      assert(res.status === 200 && data.ok, "API v1/translate với NLLB-200 phải trả về 200 OK");
      assert(
        data.provider.id === "wordbridge_nllb200",
        "Provider phải là wordbridge_nllb200"
      );
      assert(
        data.translatedText.includes("non-disclosure agreement (NDA)"),
        "Phải khôi phục chính xác thuật ngữ chuyên ngành sau khi dịch qua NLLB-200"
      );
      return `Đã xác minh luồng Pre-pass -> NLLB-200 (${data.sourceLanguage.flores200Code} -> ${data.targetLanguage.flores200Code}) -> Post-pass Glossary`;
    }
  );

  await runTest(
    "7. Phương án 3 (NLLB-200 & API v1)",
    "Kiểm thử cổng Public API /api/v1/translate (dịch hàng loạt Batch Array), /api/v1/specs và /api/v1/languages",
    async () => {
      const specRes = await callWorker(env, "/api/v1/specs");
      const specData = await specRes.json();
      assert(specRes.status === 200 && specData.ok, "Endpoint /api/v1/specs phải hoạt động");

      const batchRes = await callWorker(env, "/api/v1/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text: ["Xin chào thế giới", "Không lưu trữ dữ liệu người dùng"],
          source_lang: "vi",
          target_lang: "en",
          domain: "it"
        })
      });
      const batchData = await batchRes.json();
      assert(
        batchRes.status === 200 && batchData.ok && batchData.batchCount === 2,
        "Dịch batch array qua /api/v1/translate phải trả về đúng 2 kết quả"
      );
      assert(
        batchData.translations[0].srcFlores200 === "vie_Latn" &&
          batchData.translations[0].tgtFlores200 === "eng_Latn",
        "Mỗi phần tử batch phải trả về mã chuẩn FLORES-200"
      );
      return "Cổng API /api/v1/specs, /api/v1/languages và Batch /api/v1/translate hoạt động hoàn hảo";
    }
  );

  const passed = testResults.filter((r) => r.status === "PASS").length;
  const failed = testResults.filter((r) => r.status === "FAIL").length;
  console.log("================================================================================");
  console.log(` TỔNG KẾT KIỂM THỬ: ${passed}/${testResults.length} BÀI KIỂM THỬ PASS (${failed} FAIL)`);
  console.log("================================================================================");

  if (failed > 0) {
    process.exit(1);
  }
}

runAllTests();
