#!/usr/bin/env bash
# يرفع ملف الأسرار deploy/.env.production إلى الخادم كـ /opt/nmrievent/.env بصلاحيات 600 (للقراءة من root فقط).
#   bash scripts/push-secrets.sh
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${DEPLOY_HOST:-root@187.126.25.41}"
APP_DIR="${DEPLOY_DIR:-/opt/nmrievent}"
SRC="${SECRETS_FILE:-deploy/.env.production}"

[ -f "$SRC" ] || { echo "ملف الأسرار غير موجود. أنشئه أولًا:  node scripts/make-secrets.mjs"; exit 1; }

# الكتابة إلى ملف مؤقت ثم mv ذري، فلا يبقى ملف نصف مكتوب ولا تتسرب الصلاحيات
ssh "$HOST" "umask 077; mkdir -p '$APP_DIR'; cat > '$APP_DIR/.env.tmp' && chmod 600 '$APP_DIR/.env.tmp' && mv '$APP_DIR/.env.tmp' '$APP_DIR/.env'" < "$SRC"
echo "✔ رُفع إلى $HOST:$APP_DIR/.env (600)"
