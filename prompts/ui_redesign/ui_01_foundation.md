# UI-01 — نظام التصميم والهيكل المشترك

نفّذ قسم UI-01 من `docs/21_ARABIC_UI_REDESIGN.md` اعتمادًا على نتائج `docs/ui-audit.md`.

افتح اللوحات الأربع في `docs/ui-concepts/` واستخرج منها tokens مشتركة قبل التعديل. يجب أن يصبح الوضع الفاتح المرجعي هو الافتراضي، لا الخلفية الداكنة الحالية.

- ثبّت tokens الدلالية في CSS بدل ألوان مبعثرة: background/surface/border/text/muted/brand/success/warning/danger.
- أكمل primitives المطلوبة فقط داخل `src/components/ui`، مع variants واضحة واختبارات عند وجود منطق.
- ابنِ shell مشتركًا للوحات: sidebar RTL، topbar، mobile drawer، page header، breadcrumbs وحالات الصفحة.
- وحّد typography والمسافات والحواف والfocus والحركة وreduced-motion.
- أنشئ صفحة تطوير داخلية أو story showcase فقط إذا كانت محمية من الإنتاج أو غير قابلة للشحن للمستخدم.
- لا تعِد تصميم صفحات المنتج في هذه المرحلة إلا بالقدر اللازم لتوصيل shell.

افحص 360/768/1440 وar/en. شغّل typecheck وlint وtest وbuild.
