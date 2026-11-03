#!/usr/bin/env bash
# يثبّت مفتاحك العام على الخادم مرة واحدة (يطلب كلمة سر root مرة واحدة فقط)، فتعمل بعدها كل الأوامر بلا كلمة سر.
#   bash scripts/setup-ssh-key.sh            (الافتراضي root@187.126.25.41 والمفتاح ~/.ssh/id_ed25519.pub)
set -euo pipefail
HOST="${DEPLOY_HOST:-root@187.126.25.41}"
KEY="${DEPLOY_KEY_PUB:-$HOME/.ssh/id_ed25519.pub}"
[ -f "$KEY" ] || { echo "المفتاح العام غير موجود: $KEY (أنشئه: ssh-keygen -t ed25519)"; exit 1; }

echo "سيُطلب منك إدخال كلمة سر $HOST مرة واحدة…"
ssh -o StrictHostKeyChecking=accept-new "$HOST" \
  'umask 077; mkdir -p ~/.ssh; cat >> ~/.ssh/authorized_keys; sort -u ~/.ssh/authorized_keys -o ~/.ssh/authorized_keys' < "$KEY"

if ssh -o BatchMode=yes -o ConnectTimeout=10 "$HOST" 'echo OK' >/dev/null 2>&1; then
  echo "✔ تم تثبيت المفتاح، والدخول بالمفتاح يعمل."
else
  echo "✘ لم ينجح الدخول بالمفتاح؛ راجع إعدادات sshd على الخادم."
  exit 1
fi
