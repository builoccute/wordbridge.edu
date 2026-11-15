#!/usr/bin/env bash
set -euo pipefail
if [[ $# -ne 1 ]]; then echo "Usage: ./scripts_promote_admin.sh email@example.com"; exit 2; fi
EMAIL="$1"
read -r -p "Promote ${EMAIL} to super_admin in REMOTE D1? Type PROMOTE: " CONFIRM
[[ "$CONFIRM" == "PROMOTE" ]] || { echo "Cancelled"; exit 1; }
npx wrangler d1 execute word --remote --command "UPDATE users SET role='super_admin',updated_at=CURRENT_TIMESTAMP WHERE email='${EMAIL//\'/\'\'}';"
echo "Role updated. Confirm the account exists and protect its credentials with MFA at the identity/provider layer."
