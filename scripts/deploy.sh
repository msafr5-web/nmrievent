#!/usr/bin/env bash
# ينشر آخر نسخة من https://github.com/msafr5-web/nmrievent (فرع main) على الخادم عبر Docker Compose.
#   bash scripts/deploy.sh
# المتطلبات: وصول SSH إلى الخادم (يفضّل بالمفتاح: bash scripts/setup-ssh-key.sh).
set -euo pipefail
cd "$(dirname "$0")/.."
HOST="${DEPLOY_HOST:-root@187.126.25.41}"
APP_DIR="${DEPLOY_DIR:-/opt/nmrievent}"
REPO="${DEPLOY_REPO:-https://github.com/msafr5-web/nmrievent.git}"
BRANCH="${DEPLOY_BRANCH:-main}"

[ -f deploy/.env.production ] || node scripts/make-secrets.mjs
bash scripts/push-secrets.sh

ssh "$HOST" "APP_DIR='$APP_DIR' REPO='$REPO' BRANCH='$BRANCH' bash -s" <<'REMOTE'
set -euo pipefail
export DEBIAN_FRONTEND=noninteractive
COMPOSE="docker compose --env-file $APP_DIR/.env -f deploy/docker-compose.yml"

if ! command -v docker >/dev/null 2>&1; then
  echo "-> installing Docker"
  curl -fsSL https://get.docker.com | sh
fi
docker compose version >/dev/null 2>&1 || { echo "Docker Compose v2 is missing"; exit 1; }
command -v git >/dev/null 2>&1 || { apt-get update -y && apt-get install -y git; }

mkdir -p "$APP_DIR"
if [ -d "$APP_DIR/repo/.git" ]; then
  echo "-> updating code"
  git -C "$APP_DIR/repo" fetch --depth 1 origin "$BRANCH"
  git -C "$APP_DIR/repo" reset --hard "origin/$BRANCH"
else
  echo "-> cloning repository"
  git clone --depth 1 --branch "$BRANCH" "$REPO" "$APP_DIR/repo"
fi

cd "$APP_DIR/repo"
echo "-> building and starting containers"
$COMPOSE up -d --build --remove-orphans
docker image prune -f >/dev/null 2>&1 || true

echo "-> status"
$COMPOSE ps
for i in $(seq 1 30); do
  if curl -fsS http://127.0.0.1/api/health >/dev/null 2>&1; then
    echo "OK: site is up (http://127.0.0.1/api/health)"
    exit 0
  fi
  sleep 2
done
echo "FAILED: site did not respond; recent logs:"
$COMPOSE logs --tail=40 app web
exit 1
REMOTE
echo "✔ اكتمل النشر على $HOST"
