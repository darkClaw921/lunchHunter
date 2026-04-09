#!/usr/bin/env bash
#
# LunchHunter — запуск production-окружения.
#
# Что делает:
#   1. Проверяет окружение (pnpm, Node.js >=20, .env, обязательные переменные)
#   2. Устанавливает только production-зависимости
#   3. Применяет миграции БД (без seed по умолчанию)
#   4. Прогоняет typecheck + lint (fail-fast)
#   5. Делает production build (next build + serwist SW)
#   6. Запускает `next start` на порту ${PORT:-3000}
#
# Использование:
#   ./scripts/prod.sh                  # build + start
#   ./scripts/prod.sh --no-build       # только start (используй готовый .next)
#   ./scripts/prod.sh --skip-checks    # пропустить typecheck/lint (не рекомендуется)
#   ./scripts/prod.sh --seed-admin     # создать admin-юзера (только первый запуск)
#   PORT=80 HOSTNAME=0.0.0.0 ./scripts/prod.sh

set -euo pipefail

cd "$(dirname "$0")/.."
PROJECT_ROOT="$(pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()  { printf "${BLUE}[prod]${NC} %s\n" "$*"; }
warn()  { printf "${YELLOW}[prod]${NC} %s\n" "$*"; }
error() { printf "${RED}[prod]${NC} %s\n" "$*" >&2; }
ok()    { printf "${GREEN}[prod]${NC} %s\n" "$*"; }

# Флаги
DO_BUILD=1
SKIP_CHECKS=0
SEED_ADMIN=0
for arg in "$@"; do
  case "$arg" in
    --no-build)    DO_BUILD=0 ;;
    --skip-checks) SKIP_CHECKS=1 ;;
    --seed-admin)  SEED_ADMIN=1 ;;
    -h|--help)
      sed -n '2,20p' "$0"
      exit 0
      ;;
    *) warn "Неизвестный флаг: $arg (игнорирую)" ;;
  esac
done

export NODE_ENV=production

# 1. Окружение
info "Проверка окружения..."
command -v pnpm >/dev/null 2>&1 || { error "pnpm не установлен"; exit 1; }
command -v node >/dev/null 2>&1 || { error "node не установлен"; exit 1; }

NODE_MAJOR=$(node -v | sed 's/v\([0-9]*\).*/\1/')
if [ "$NODE_MAJOR" -lt 20 ]; then
  error "Требуется Node.js >= 20 (текущая: $(node -v))"
  exit 1
fi

# 2. .env + обязательные переменные
if [ ! -f .env ] && [ ! -f .env.production ] && [ ! -f .env.local ]; then
  error ".env / .env.production / .env.local отсутствует"
  exit 1
fi

# Загружаем .env в текущий shell для валидации
if [ -f .env.production ]; then
  set -a; . ./.env.production; set +a
elif [ -f .env ]; then
  set -a; . ./.env; set +a
fi

REQUIRED_VARS=(
  "OPENROUTER_API_KEY"
  "TELEGRAM_BOT_TOKEN"
  "ADMIN_EMAIL"
  "ADMIN_PASSWORD"
)

MISSING=0
for var in "${REQUIRED_VARS[@]}"; do
  if [ -z "${!var:-}" ]; then
    error "Переменная $var не задана в .env"
    MISSING=1
  fi
done
[ "$MISSING" = "1" ] && exit 1

ok ".env валиден"

# 3. Зависимости
if [ "$DO_BUILD" = "1" ]; then
  info "Установка зависимостей (все, для build)..."
  pnpm install --frozen-lockfile
else
  if [ ! -d node_modules ]; then
    info "Установка production-зависимостей..."
    pnpm install --prod --frozen-lockfile
  fi
fi

# 4. Подготовка директорий
mkdir -p data public/uploads

# 5. Миграции
info "Применение миграций БД..."
pnpm db:migrate

# 5.1. Admin seed (опционально)
if [ "$SEED_ADMIN" = "1" ]; then
  info "Создание admin-пользователя..."
  pnpm db:seed || warn "Seed завершился с ошибкой (возможно, данные уже существуют)"
fi

# 6. Checks (typecheck + lint) — fail fast
if [ "$DO_BUILD" = "1" ] && [ "$SKIP_CHECKS" = "0" ]; then
  info "Typecheck..."
  pnpm typecheck
  info "Lint..."
  pnpm lint
  ok "Проверки пройдены"
fi

# 7. Production build
if [ "$DO_BUILD" = "1" ]; then
  info "Production build (next build + serwist SW)..."
  pnpm build
  ok "Build готов (.next + public/sw.js)"
else
  if [ ! -d .next ]; then
    error ".next отсутствует. Запустите без --no-build"
    exit 1
  fi
  warn "--no-build: использую существующий .next"
fi

# 8. Запуск
PORT="${PORT:-3000}"
HOSTNAME="${HOSTNAME:-0.0.0.0}"

ok "Запуск production-сервера"
echo
info "URL:       http://${HOSTNAME}:${PORT}"
info "Admin:     http://${HOSTNAME}:${PORT}/admin/login"
info "Telegram:  http://${HOSTNAME}:${PORT}/tg (публичный URL должен быть HTTPS)"
info "PWA:       manifest.webmanifest + sw.js активны"
echo

exec pnpm start --port "${PORT}" --hostname "${HOSTNAME}"
