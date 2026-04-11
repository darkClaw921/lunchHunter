#!/usr/bin/env bash
#
# LunchHunter — запуск dev-окружения.
#
# Что делает:
#   1. Проверяет pnpm, Node.js >=20, наличие .env
#   2. Устанавливает зависимости, если node_modules отсутствует или pnpm-lock обновился
#   3. Применяет миграции БД (SQLite + FTS5 + R*Tree)
#   4. Сидит БД (идемпотентно), если флаг --seed или БД пустая
#   5. Запускает `next dev` на порту ${PORT:-3000}
#
# Использование:
#   ./scripts/dev.sh              # обычный запуск (http://localhost)
#   ./scripts/dev.sh --seed       # принудительный re-seed
#   ./scripts/dev.sh --fresh      # удалить БД и пересоздать с нуля
#   ./scripts/dev.sh --https      # HTTPS через --experimental-https
#                                 #   (нужно для PWA/Push API на телефоне по LAN)
#   PORT=4000 ./scripts/dev.sh    # кастомный порт

set -euo pipefail

# Переход в корень проекта
cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

# Цвета для вывода
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { printf "${BLUE}[dev]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[dev]${NC} %s\n" "$*"; }
error() { printf "${RED}[dev]${NC} %s\n" "$*" >&2; }
ok()    { printf "${GREEN}[dev]${NC} %s\n" "$*"; }

# Парсинг флагов
FORCE_SEED=0
FRESH_DB=0
USE_HTTPS=0
for arg in "$@"; do
  case "$arg" in
    --seed)  FORCE_SEED=1 ;;
    --fresh) FRESH_DB=1; FORCE_SEED=1 ;;
    --https) USE_HTTPS=1 ;;
    -h|--help)
      sed -n '2,22p' "$0"
      exit 0
      ;;
    *) warn "Неизвестный флаг: $arg (игнорирую)" ;;
  esac
done

# 1. Проверка окружения
info "Проверка окружения..."
command -v pnpm >/dev/null 2>&1 || { error "pnpm не установлен. npm i -g pnpm"; exit 1; }
command -v node >/dev/null 2>&1 || { error "node не установлен"; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Требуется Node.js >= 20 (текущая: $(node -v))"
  exit 1
fi

# 2. .env
if [ ! -f .env ] && [ ! -f .env.local ]; then
  if [ -f .env.example ]; then
    warn ".env не найден — копирую из .env.example"
    cp .env.example .env
    warn "Отредактируйте .env (OPENROUTER_API_KEY, TELEGRAM_BOT_TOKEN, ADMIN_EMAIL/PASSWORD)"
  else
    error ".env и .env.example отсутствуют"
    exit 1
  fi
fi

# 3. Зависимости
if [ ! -d node_modules ] || [ pnpm-lock.yaml -nt node_modules/.pnpm-lock-hash ] 2>/dev/null; then
  info "Установка зависимостей..."
  pnpm install
  mkdir -p node_modules
  cp pnpm-lock.yaml node_modules/.pnpm-lock-hash 2>/dev/null || true
else
  ok "Зависимости актуальны"
fi

# 4. База данных
mkdir -p data public/uploads

DB_FILE="${DATABASE_URL:-./data/lunchhunter.db}"
DB_FILE="${DB_FILE#file:}"

if [ "$FRESH_DB" = "1" ] && [ -f "$DB_FILE" ]; then
  warn "Удаляю БД: $DB_FILE"
  rm -f "$DB_FILE"
fi

info "Применение миграций..."
pnpm db:migrate

DB_EMPTY=0
if [ -f "$DB_FILE" ]; then
  COUNT=$(sqlite3 "$DB_FILE" "SELECT COUNT(*) FROM restaurants;" 2>/dev/null || echo "0")
  [ "$COUNT" = "0" ] && DB_EMPTY=1
fi

if [ "$FORCE_SEED" = "1" ] || [ "$DB_EMPTY" = "1" ]; then
  info "Сидирование БД..."
  pnpm db:seed
else
  ok "БД уже содержит данные (используй --seed для пересева)"
fi

# 5. Запуск dev-сервера
PORT="${PORT:-3002}"

if [ "$USE_HTTPS" = "1" ]; then
  SCHEME="https"
  ok "Next.js dev-сервер (HTTPS) запускается на https://localhost:${PORT}"
  warn "При первом запуске браузер покажет предупреждение о самоподписанном сертификате — прими его."
  warn "Для доступа с телефона по LAN открой https://<LAN-IP>:${PORT} и прими серт."
  echo
  info "Админка:  https://localhost:${PORT}/admin/login"
  info "Mobile:   DevTools → Toggle device toolbar → iPhone 14 Pro"
  info "Telegram: https://localhost:${PORT}/tg"
  echo
  exec pnpm dev --experimental-https --port "${PORT}"
else
  ok "Next.js dev-сервер запускается на http://localhost:${PORT}"
  warn "Push API / Notification API работают ТОЛЬКО на localhost или https://."
  warn "Для тестов PWA с телефона по LAN запусти: ./scripts/dev.sh --https"
  echo
  info "Админка:  http://localhost:${PORT}/admin/login"
  info "Mobile:   DevTools → Toggle device toolbar → iPhone 14 Pro"
  info "Telegram: http://localhost:${PORT}/tg (требует запуск через Telegram BotFather)"
  echo
  exec pnpm dev --port "${PORT}"
fi
