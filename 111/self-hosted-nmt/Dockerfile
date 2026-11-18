# ============================================================================
# DOCKERFILE: WORD BRIDGE SELF-HOSTED NLLB-200 (CTRANSLATE2 INT8) MICROSERVICE
# Mô hình: facebook/nllb-200-distilled-600M (Lượng tử hóa INT8 ~650 MB RAM)
# Chính sách: ZERO USER DATA STORAGE (Chạy với --no-access-log, không lưu đĩa)
# ============================================================================
FROM python:3.11-slim

ENV PYTHONDONTWRITEBYTECODE=1 \
    PYTHONUNBUFFERED=1 \
    NLLB_CT2_MODEL_DIR=/models/nllb-200-distilled-600M-int8 \
    NLLB_SP_MODEL_PATH=/models/nllb-200-distilled-600M-int8/sentencepiece.bpe.model

WORKDIR /app

COPY requirements.txt /app/requirements.txt
RUN pip install --no-cache-dir -r /app/requirements.txt && \
    mkdir -p /models/nllb-200-distilled-600M-int8 && \
    python3 -c "from huggingface_hub import snapshot_download; snapshot_download(repo_id='JustFrederik/nllb-200-distilled-600M-ct2-int8', local_dir='/models/nllb-200-distilled-600M-int8')"

COPY app.py /app/app.py

# Chạy dưới quyền user không đặc quyền (non-root)
RUN useradd -m -u 10001 wbtrans && chown -R wbtrans:wbtrans /app /models
USER wbtrans

EXPOSE 8080

# Tắt hoàn toàn access log (--no-access-log) để bảo vệ quyền riêng tư tuyệt đối
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8080", "--no-access-log"]
