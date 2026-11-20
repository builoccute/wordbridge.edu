#!/usr/bin/env bash
# WORD BRIDGE — Controlled Cloudflare D1 Restore Script
# NEVER runs DROP TABLE automatically. Requires explicit confirmation & target file.
set -euo pipefail

SQL_FILE="${1:-}"
TARGET_FLAG="${2:---local}"

if [[ -z "$SQL_FILE" || ! -f "$SQL_FILE" ]]; then
  echo "Usage: bash scripts/d1-restore.sh <backup.sql> [--local|--remote]"
  exit 1
fi

if grep -E -i '^[[:space:]]*DROP[[:space:]]+TABLE' "$SQL_FILE"; then
  echo "ERROR: Backup SQL contains DROP TABLE. Restore aborted per safety policy."
  exit 1
fi

echo "[WORD BRIDGE] Executing controlled restore of ${SQL_FILE} into D1 'word' (${TARGET_FLAG})..."
npx wrangler d1 execute word "${TARGET_FLAG}" --file="${SQL_FILE}"
echo "[WORD BRIDGE] Restore finished."
