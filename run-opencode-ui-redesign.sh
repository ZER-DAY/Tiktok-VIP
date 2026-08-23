#!/usr/bin/env bash

set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$PROJECT_DIR"

PROMPTS_DIR="prompts/ui_redesign"
PHASES=(ui_00_audit ui_01_foundation ui_02_marketing_auth ui_03_analysis_report ui_04_creator_dashboard ui_05_agency_crm ui_06_admin_qa)
MODEL="opencode/mimo-v2.5-free"
START_FROM=""
ONLY_PHASE=""
AUTO_YES=false

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes|-y) AUTO_YES=true; shift ;;
    --from) START_FROM="$2"; shift 2 ;;
    --only) ONLY_PHASE="$2"; shift 2 ;;
    --model|-m) MODEL="$2"; shift 2 ;;
    *) echo "خيار غير معروف: $1" >&2; exit 1 ;;
  esac
done

command -v opencode >/dev/null 2>&1 || { echo "opencode غير مثبت أو غير موجود في PATH" >&2; exit 1; }
[[ -f "$PROMPTS_DIR/master_ui.md" ]] || { echo "ملفات برومبت إعادة التصميم غير موجودة" >&2; exit 1; }

run_prompt() {
  local title="$1"
  local file="$2"
  local continuation="$3"
  opencode run $continuation --auto --model "$MODEL" -f "$file" --title "$title" -- \
    "نفّذ الملف المرفق فقط. التزم بـ prompts/ui_redesign/master_ui.md وdocs/21_ARABIC_UI_REDESIGN.md. افحص العمل بصريًا ووظيفيًا، ولا تنتقل إلى مرحلة أخرى."
}

pause_review() {
  local phase="$1"
  [[ "$AUTO_YES" == true ]] && return 0
  echo "اكتملت $phase. راجع الصفحات على 360px و768px و1440px، ثم Enter للمتابعة أو q للإيقاف."
  read -r answer
  [[ "${answer:-}" == "q" ]] && exit 0
}

run_prompt "ui_master" "$PROMPTS_DIR/master_ui.md" ""
pause_review "قراءة خطة UI"

started=false
[[ -z "$START_FROM" ]] && started=true

for phase in "${PHASES[@]}"; do
  if [[ -n "$ONLY_PHASE" && "$phase" != "$ONLY_PHASE" ]]; then
    continue
  fi
  if [[ "$started" == false ]]; then
    [[ "$phase" == "$START_FROM" ]] && started=true || continue
  fi
  run_prompt "$phase" "$PROMPTS_DIR/$phase.md" "--continue"
  pause_review "$phase"
  [[ -n "$ONLY_PHASE" ]] && break
done

echo "اكتملت مراحل إعادة التصميم. راجع تقرير UI-06 قبل النشر."
