#!/usr/bin/env bash
# WORD BRIDGE — Safe Cloudflare D1 Backup Script
# Database: word (ce84cc48-6d49-409b-b45a-13ba3bc4a771)
set -euo pipefail

TIMESTAMP=$(date +"%Y%m%d-%H%M%S")
OUT_DIR="${1:-./backups}"
mkdir -p "$OUT_DIR"
OUT_FILE="${OUT_DIR}/word-d1-backup-${TIMESTAMP}.sql"

echo "[WORD BRIDGE] Exporting remote D1 database 'word' to ${OUT_FILE}..."
npx wrangler d1 export word --remote --output="${OUT_FILE}"
echo "[WORD BRIDGE] Backup completed: ${OUT_FILE}"
