#!/usr/bin/env bash
#
# إعداد حساب مدير المنصة بأمر واحد.
#
#   ./scripts/setup-admin.sh tarek@livestreamtech.app "المهندس طارق صقر"
#
# بيدور على DATABASE_URL بالترتيب ده:
#   1. متغير البيئة DATABASE_URL لو انت مررته
#   2. .env.worker  (ده مكانه على سيرفر الأوبنتو — رابط Neon الحقيقي)
#   3. .env.production.local  ثم  .env.production
#   4. vercel env pull  (لو Vercel CLI مثبت والمشروع مربوط)
#   5. بيسألك تكتبه
#
# وبيتحقق من الاتصال والجداول عن طريق create-admin.ts نفسه، بنفس عميل
# Prisma اللي التطبيق شغال بيه — مش بأمر CLI منفصل.
#
# وبيسأل عن كلمة المرور لو ADMIN_PASSWORD مش متعيّن — الكتابة مخفية،
# وما بتتسجلش في history التيرمنال.

set -euo pipefail

EMAIL="${1:-}"
NAME="${2:-مدير المنصة}"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT"

c_red=$'\033[31m'; c_grn=$'\033[32m'; c_ylw=$'\033[33m'; c_dim=$'\033[2m'; c_off=$'\033[0m'
step() { printf '\n%s▸ %s%s\n' "$c_dim" "$1" "$c_off"; }
die()  { printf '\n%s✖ %s%s\n\n' "$c_red" "$1" "$c_off" >&2; exit 1; }

[ -n "$EMAIL" ] || die "الاستخدام: ./scripts/setup-admin.sh <email> [\"الاسم\"]"

# ─── 1. أدوات مطلوبة ────────────────────────────────────────
step "فحص الأدوات"
command -v node >/dev/null || die "Node.js مش مثبت."
if   command -v pnpm >/dev/null; then RUN="pnpm exec"
elif command -v npx  >/dev/null; then RUN="npx --yes"
else die "لا pnpm ولا npx موجودين."
fi
printf '  node %s · %s\n' "$(node -v)" "$RUN"

[ -d node_modules ] || {
  step "تثبيت الحزم (أول مرة بس)"
  if command -v pnpm >/dev/null; then pnpm install --frozen-lockfile; else npm install; fi
}

# ─── 2. DATABASE_URL ───────────────────────────────────────
step "البحث عن DATABASE_URL"

read_from_env_file() {
  [ -f "$1" ] || return 1
  local v
  v="$(grep -m1 -E '^[[:space:]]*(export[[:space:]]+)?DATABASE_URL[[:space:]]*=' "$1" \
       | sed -E 's/^[[:space:]]*(export[[:space:]]+)?DATABASE_URL[[:space:]]*=[[:space:]]*//' \
       | sed -E 's/^"(.*)"$/\1/; s/^'"'"'(.*)'"'"'$/\1/')" || return 1
  [ -n "$v" ] || return 1
  DATABASE_URL="$v"; SOURCE="$1"; return 0
}

SOURCE=""
if [ -n "${DATABASE_URL:-}" ]; then
  SOURCE="متغير البيئة"
elif read_from_env_file .env.worker; then :
elif read_from_env_file .env.production.local; then :
elif read_from_env_file .env.production; then :
elif command -v vercel >/dev/null && [ -d .vercel ]; then
  printf '  بسحب المتغيرات من Vercel...\n'
  vercel env pull .env.production.local --environment=production --yes >/dev/null 2>&1 || true
  read_from_env_file .env.production.local || true
fi

if [ -z "${DATABASE_URL:-}" ]; then
  printf '\n  %sما لقيتش DATABASE_URL.%s\n' "$c_ylw" "$c_off"
  printf '  على سيرفر الأوبنتو: الرابط المفروض يكون في .env.worker\n'
  printf '  وإلا: Vercel ← المشروع ← Settings ← Environment Variables\n'
  printf '  وانسخ قيمة DATABASE_URL بتاعة production.\n\n'
  printf '  DATABASE_URL: '
  read -r DATABASE_URL
  SOURCE="إدخال يدوي"
fi
[ -n "${DATABASE_URL:-}" ] || die "DATABASE_URL فاضي."
export DATABASE_URL

# اطبع المضيف بس — من غير كلمة المرور.
printf '  المصدر: %s\n' "${SOURCE:-?}"
printf '  الخادم: %s\n' "$(printf '%s' "$DATABASE_URL" | sed -E 's#^[^:]+://[^@]*@##; s#\?.*$##')"

case "$DATABASE_URL" in
  *localhost*|*127.0.0.1*)
    printf '\n  %s⚠  ده رابط محلي.%s Vercel مش هيقدر يوصله من الإنترنت.\n' "$c_ylw" "$c_off"
    printf '     لو قصدك قاعدة بيانات الإنتاج، هات الرابط من Vercel.\n'
    printf '     أكمل بالرابط ده؟ [y/N] '
    read -r reply
    case "$reply" in y|Y|yes|YES) ;; *) die "اتوقف." ;; esac
    ;;
esac

# ─── 3. كلمة المرور ────────────────────────────────────────
if [ -z "${ADMIN_PASSWORD:-}" ]; then
  step "كلمة المرور"
  printf '  اضغط Enter على طول عشان يتولّد واحدة عشوائية وتتطبع مرة واحدة.\n'
  printf '  الكتابة مخفية — مش هتشوف حروف وانت بتلصق، وده طبيعي.\n'
  while :; do
    printf '  كلمة المرور: '
    read -rs ADMIN_PASSWORD; printf '\n'
    # فاضية = ولّد واحدة عشوائية
    [ -z "$ADMIN_PASSWORD" ] && break
    [ "${#ADMIN_PASSWORD}" -ge 12 ] && break
    printf '  %sقصيرة (%s حرف). لازم 12 حرف على الأقل — جرّب تاني.%s\n' \
      "$c_ylw" "${#ADMIN_PASSWORD}" "$c_off"
  done
  export ADMIN_PASSWORD
fi

# ─── 4. إنشاء الحساب ───────────────────────────────────────
# create-admin.ts بيختبر الاتصال والجداول بنفسه بنفس عميل Prisma
# اللي التطبيق بيستخدمه، ويرجّع 3 لو مفيش اتصال و 2 لو الجداول ناقصة.
step "إنشاء حساب المدير"
set +e
$RUN tsx scripts/create-admin.ts "$EMAIL" "$NAME"
code=$?
set -e

if [ "$code" -eq 2 ]; then
  step "الجداول ناقصة — بشغّل الهجرات"
  $RUN prisma migrate deploy || die "فشلت الهجرات."
  step "إعادة المحاولة"
  $RUN tsx scripts/create-admin.ts "$EMAIL" "$NAME" || die "فشل إنشاء الحساب."
elif [ "$code" -ne 0 ]; then
  exit "$code"
fi

