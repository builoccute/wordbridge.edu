#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
@file self-hosted-nmt/app.py
@description Máy chủ Microservice API Dịch thuật Tự vận hành của Word Bridge (Phương án 3)
Sử dụng mô hình Meta NLLB-200 Distilled 600M tối ưu hóa 8-bit (CTranslate2 INT8 + SentencePiece).
Tuân thủ tuyệt đối chính sách ZERO USER DATA STORAGE:
  - Không ghi access log hoặc payload log.
  - Xử lý hoàn toàn trên RAM, giải phóng biến tạm ngay sau khi dịch xong.
  - Gắn header Cache-Control: no-store trên mọi phản hồi.
"""

import gc
import os
import time
from typing import List, Optional, Union
from fastapi import FastAPI, Header, HTTPException, Response
from pydantic import BaseModel, Field

MODEL_DIR = os.environ.get("NLLB_CT2_MODEL_DIR", "/models/nllb-200-distilled-600M-int8")
SP_MODEL_PATH = os.environ.get("NLLB_SP_MODEL_PATH", "/models/nllb-200-distilled-600M-int8/sentencepiece.bpe.model")
API_TOKEN = os.environ.get("WORDBRIDGE_NLLB_TOKEN", "").strip()
INTR_THREADS = int(os.environ.get("CT2_INTER_THREADS", "2"))
INTRA_THREADS = int(os.environ.get("CT2_INTRA_THREADS", "4"))

app = FastAPI(
    title="Word Bridge Self-Hosted NLLB-200 NMT Microservice",
    version="1.0.0",
    docs_url=None,
    redoc_url=None,
)

_translator = None
_tokenizer = None


def get_engine():
    """Khởi tạo lười (Lazy-load) CTranslate2 Translator và SentencePiece trên RAM."""
    global _translator, _tokenizer
    if _translator is not None and _tokenizer is not None:
        return _translator, _tokenizer

    try:
        import ctranslate2
        import sentencepiece as spm

        if os.path.isdir(MODEL_DIR) and os.path.isfile(SP_MODEL_PATH):
            _translator = ctranslate2.Translator(
                MODEL_DIR,
                device="cpu",
                compute_type="int8",
                inter_threads=INTR_THREADS,
                intra_threads=INTRA_THREADS,
            )
            sp = spm.SentencePieceProcessor()
            sp.load(SP_MODEL_PATH)
            _tokenizer = sp
    except Exception:
        _translator = None
        _tokenizer = None

    return _translator, _tokenizer


class NllbTranslateRequest(BaseModel):
    text: Union[str, List[str]] = Field(..., description="Văn bản hoặc mảng văn bản cần dịch (tối đa 15.000 ký tự)")
    source_lang: str = Field(default="vi")
    target_lang: str = Field(default="en")
    src_flores: str = Field(default="vie_Latn", description="Mã ngôn ngữ nguồn chuẩn FLORES-200")
    tgt_flores: str = Field(default="eng_Latn", description="Mã ngôn ngữ đích chuẩn FLORES-200")
    domain: str = Field(default="general")
    beam_size: int = Field(default=2, ge=1, le=5)
    zero_data_retention: bool = Field(default=True)


def apply_no_store_headers(response: Response):
    response.headers["Cache-Control"] = "no-store, no-cache, must-revalidate, max-age=0"
    response.headers["Pragma"] = "no-cache"
    response.headers["Expires"] = "0"
    response.headers["X-Zero-User-Data-Storage"] = "enforced"


@app.get("/health")
def health_check(response: Response):
    apply_no_store_headers(response)
    translator, _ = get_engine()
    return {
        "ok": True,
        "service": "Word Bridge Self-Hosted NLLB-200 CTranslate2 INT8 Engine",
        "model": "facebook/nllb-200-distilled-600M (CTranslate2 INT8)",
        "supported_flores_languages": 200,
        "model_weights_loaded": translator is not None,
        "zero_user_data_storage": True,
    }


@app.post("/v1/nllb/translate")
def translate_nllb(
    req: NllbTranslateRequest,
    response: Response,
    authorization: Optional[str] = Header(default=None),
):
    apply_no_store_headers(response)
    start_ts = time.perf_counter()

    if API_TOKEN:
        expected = f"Bearer {API_TOKEN}"
        if authorization != expected:
            raise HTTPException(status_code=401, detail="ERR_UNAUTHORIZED_NLLB_TOKEN")

    is_batch = isinstance(req.text, list)
    inputs = req.text if is_batch else [req.text]

    if not inputs or any(len(str(x)) > 15000 for x in inputs):
        raise HTTPException(status_code=400, detail="ERR_INVALID_TEXT_LENGTH")

    translator, tokenizer = get_engine()
    if translator is None or tokenizer is None:
        raise HTTPException(
            status_code=503,
            detail="ERR_NLLB_WEIGHTS_NOT_MOUNTED: Vui lòng mount thư mục trọng số CTranslate2 INT8 vào /models/nllb-200-distilled-600M-int8.",
        )

    try:
        # Mã hóa từng dòng sang token SentencePiece kèm thẻ ngôn ngữ nguồn FLORES-200
        source_sents = []
        for item in inputs:
            pieces = tokenizer.encode_as_pieces(item)
            source_sents.append([req.src_flores] + pieces + ["</s>"])

        target_prefix = [[req.tgt_flores]] * len(source_sents)
        results = translator.translate_batch(
            source_sents,
            target_prefix=target_prefix,
            beam_size=req.beam_size,
            max_batch_size=16,
        )

        decoded_outputs = []
        for res in results:
            tokens = res.hypotheses[0]
            if tokens and tokens[0] == req.tgt_flores:
                tokens = tokens[1:]
            if tokens and tokens[-1] == "</s>":
                tokens = tokens[:-1]
            decoded_outputs.append(tokenizer.decode_pieces(tokens))

        duration_ms = round((time.perf_counter() - start_ts) * 1000, 2)
        return {
            "ok": True,
            "translated_text": decoded_outputs if is_batch else decoded_outputs[0],
            "src_flores": req.src_flores,
            "tgt_flores": req.tgt_flores,
            "engine": "ctranslate2-nllb-200-int8",
            "duration_ms": duration_ms,
            "zero_user_data_storage": True,
        }
    finally:
        # Giải phóng tham chiếu dữ liệu trong RAM ngay lập tức
        del inputs
        gc.collect()
