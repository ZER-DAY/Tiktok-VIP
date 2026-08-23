#!/usr/bin/env bash
#
# run-opencode-pipeline.sh
#
# ينفّذ master_prompt.md ثم كل ملفات prompts/phase_01.md إلى phase_08.md
# بالترتيب عبر opencode CLI، بنفس الجلسة (Session) حتى يحتفظ Opencode بالسياق
# الكامل للمشروع من مرحلة لأخرى. مصمم للتشغيل على سيرفر Ubuntu.
#
# الاستخدام:
#   ./run-opencode-pipeline.sh                        # وضع تفاعلي: يتوقف بعد كل مرحلة لمراجعتك
#   ./run-opencode-pipeline.sh --yes                   # وضع تلقائي كامل: يكمل كل المراحل بدون توقف
#   ./run-opencode-pipeline.sh --from phase_04         # يبدأ من مرحلة معينة (يفترض أن الجلسة موجودة أصلاً)
#   ./run-opencode-pipeline.sh --model opencode/gpt-5.5  # يغيّر الموديل المستخدم (افتراضيًا MiMo V2.5 Free)
#
# ملاحظة هامة: هذا السكربت يمرر --auto لـ opencode، أي يوافق تلقائيًا على أي صلاحية
# غير ممنوعة صراحة (كتابة ملفات، تشغيل أوامر...). هذا مطلوب لتشغيله بدون تدخل يدوي،
# لكن راجع صلاحيات الوكيل (Agent permissions) في إعدادات opencode إن كنت تريد قيودًا أكثر.
#
# تحذير: opencode قد يشغّل أدوات سكافولد (مثل create-next-app) تطلب مجلدًا فارغًا
# وقد تحذف ملفات موجودة (بما فيها docs/ وprompts/ نفسها) دون تحذير كافٍ. راجع التحذير
# الصريح في بداية prompts/phase_01.md. يُفضّل عمل نسخة احتياطية لهذا المجلد كاملاً
# (git commit أو نسخ خارجي) قبل بدء التشغيل، وبعد كل مرحلة أيضًا.
#
# الموديل الافتراضي هنا هو MiMo V2.5 Free عبر OpenCode Zen (مجاني لفترة محدودة).
# لاستخدامه لازم تكون سجّلت دخول لـ OpenCode Zen مسبقًا (opencode auth login → OpenCode Zen،
# أو /connect داخل الـ TUI).

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PROMPTS_DIR="prompts"
PHASES=(phase_01 phase_02 phase_03 phase_04 phase_05 phase_06 phase_07 phase_08)

AUTO_YES=false
START_FROM=""
MODEL="opencode/mimo-v2.5-free"

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y)
      AUTO_YES=true
      shift
      ;;
    --from)
      START_FROM="$2"
      shift 2
      ;;
    --model|-m)
      MODEL="$2"
      shift 2
      ;;
    *)
      echo "خيار غير معروف: $1" >&2
      exit 1
      ;;
  esac
done

echo "الموديل المستخدم: $MODEL"

if ! command -v opencode &> /dev/null; then
  echo "خطأ: أداة opencode غير موجودة في PATH. تأكد من تثبيتها أولًا على السيرفر." >&2
  exit 1
fi

if [[ ! -f "$PROMPTS_DIR/master_prompt.md" ]]; then
  echo "خطأ: لم أجد $PROMPTS_DIR/master_prompt.md. شغّل هذا السكربت من داخل مجلد المشروع." >&2
  exit 1
fi

check_project_files_intact() {
  local missing=false
  for f in "docs/01_PROJECT_OVERVIEW.md" "prompts/master_prompt.md" "README.md"; do
    if [[ ! -f "$f" ]]; then
      echo "!! تحذير: الملف $f غير موجود بعد آخر خطوة. تأكد يدويًا (ls -la) قبل المتابعة." >&2
      missing=true
    fi
  done
  if [[ "$missing" == true ]]; then
    echo "!! ملفات المشروع الأساسية (docs/prompts/README) قد تكون انمسحت. توقّف وتحقق يدويًا." >&2
    exit 1
  fi
}

pause_for_review() {
  local name="$1"
  check_project_files_intact
  if [[ "$AUTO_YES" == true ]]; then
    return 0
  fi
  echo ""
  echo "=================================================================="
  echo " اكتملت: $name"
  echo " راجع النتيجة يدويًا الآن (شغّل المشروع، افحص الكود والاختبارات)."
  echo " اضغط Enter للمتابعة للمرحلة التالية، أو اكتب q ثم Enter للإيقاف."
  echo "=================================================================="
  read -r answer
  if [[ "${answer:-}" == "q" ]]; then
    echo "تم الإيقاف بطلبك. يمكنك إكمال المسار لاحقًا عبر: $0 --from <phase_NN>"
    exit 0
  fi
}

run_step() {
  local title="$1"
  local file="$2"
  local continue_flag="$3"   # "" أو "--continue"
  local instruction="$4"

  echo ""
  echo ">>> تشغيل: $title  ($file)"
  echo "------------------------------------------------------------------"

  # shellcheck disable=SC2086
  opencode run $continue_flag --auto --model "$MODEL" -f "$file" --title "$title" -- "$instruction"
  local status=$?

  if [[ $status -ne 0 ]]; then
    echo "!! فشل تنفيذ $title (exit code $status). توقّف السكربت." >&2
    exit $status
  fi
}

MASTER_INSTRUCTION="اقرأ هذا الملف (master_prompt.md) بالكامل أولًا، ثم اقرأ README.md وكل ملفات docs/ الموجودة في هذا المشروع بالترتيب الرقمي من 01 إلى 20. لا تبدأ أي كتابة كود الآن. بعد القراءة، لخّص فهمك للمشروع كما هو مطلوب في نهاية الملف (المنتج الأول والثاني، القاعدة الذهبية بخصوص البيانات التقديرية، واللغة الافتراضية للمنصة)، وانتظر تعليمات المرحلة الأولى."

PHASE_INSTRUCTION_TEMPLATE="نفّذ هذه المرحلة بالكامل وفق التعليمات في الملف المرفق، وبالتقيد الصارم بقواعد master_prompt.md وملفات docs/ ذات الصلة المذكورة داخل الملف (خصوصًا اللغة العربية الافتراضية RTL من docs/16_UI_UX.md). لا تحذف أو تستبدل أي ملف موجود (docs/, prompts/, README.md) دون تأكيد صريح مني. لا تنتقل لأي مرحلة تالية. عند الانتهاء، قدّم تقرير إنجاز المرحلة (ماذا نُفّذ، كيف يُختبر يدويًا، وأي نواقص) كما هو مطلوب في معيار القبول (Phase Gate)."

# --- تحديد نقطة البدء ---
STARTED=false
if [[ -z "$START_FROM" ]]; then
  run_step "master_prompt" "$PROMPTS_DIR/master_prompt.md" "" "$MASTER_INSTRUCTION"
  pause_for_review "master_prompt (القراءة والفهم الأولي)"
  STARTED=true
fi

for phase in "${PHASES[@]}"; do
  if [[ "$STARTED" == false ]]; then
    if [[ "$phase" == "$START_FROM" ]]; then
      STARTED=true
    else
      continue
    fi
  fi

  run_step "$phase" "$PROMPTS_DIR/$phase.md" "--continue" "$PHASE_INSTRUCTION_TEMPLATE"
  pause_for_review "$phase"
done

echo ""
echo "=================================================================="
echo " انتهى تنفيذ كل المراحل (master_prompt + phase_01 .. phase_08)."
echo " راجع docs/20_PROJECT_ROADMAP.md للتأكد أن كل Phase Gate تحقق فعليًا."
echo "=================================================================="
