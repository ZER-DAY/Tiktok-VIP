# TikTok Intelligence Platform

منصة SaaS لتحليل حسابات TikTok بالذكاء الاصطناعي، موجهة للمبدعين والستريمرز والوكالات وشركات التسويق. المنصة تخدم منتجين في نفس الموقع:

1. **TikTok Profile Analyzer** — أي زائر يدخل يوزر TikTok ويحصل على تقرير احترافي شامل (إحصائيات، تحليل AI، قوة الحساب، نقاط قوة/ضعف، فرصة الوصول لـ For You، تحليل جمهور ومنافسين).
2. **Agency CRM & Recruitment** — بعد التحليل، الحسابات المؤهلة تتلقى عرض انضمام لوكالة TikTok LIVE. الطلبات تدخل مباشرة إلى CRM داخلي لإدارة المتقدمين والتوظيف.

النظام مصمم كمنصة قابلة للتوسع (Multi-Provider) بحيث يمكن لاحقًا إضافة Instagram وYouTube وKick وTwitch كمصادر بيانات إضافية دون تغيير المعمارية.

## لغة المنصة

**العربية (RTL) هي اللغة الافتراضية والأساسية للمنصة بالكامل** — ليست لغة مضافة أو ثانوية. الإنجليزية متاحة كلغة ثانوية عبر مبدّل لغة. التفاصيل الكاملة في `docs/16_UI_UX.md`.

## لماذا هذا المشروع مختلف عن "بيع API"

المشروع لا يبيع بيانات لمطورين. هو منتج نهائي (End-user Product) يقدّم قيمة مباشرة للمبدع (تقرير عن حسابه) وفي نفس الوقت يعمل كقناة توظيف واكتساب مبدعين لوكالة البث المباشر. الـ API الداخلي أداة تنفيذية فقط، وليس منتجًا يُباع.

## هيكل الوثائق

```
TikTok Intelligence Platform
│
├── docs/                           ← حزمة التصميم الكاملة (Software Design Specification)
│   ├── 01_PROJECT_OVERVIEW.md
│   ├── 02_BUSINESS_REQUIREMENTS.md
│   ├── 03_FUNCTIONAL_REQUIREMENTS.md
│   ├── 04_NON_FUNCTIONAL_REQUIREMENTS.md
│   ├── 05_SYSTEM_ARCHITECTURE.md
│   ├── 06_TECH_STACK.md
│   ├── 07_DATABASE_DESIGN.md
│   ├── 08_API_SPECIFICATION.md
│   ├── 09_AI_ANALYSIS_ENGINE.md
│   ├── 10_TIKTOK_DATA_ENGINE.md
│   ├── 11_ANALYTICS_ENGINE.md
│   ├── 12_AGENCY_CRM.md
│   ├── 13_AUTH_SYSTEM.md
│   ├── 14_ADMIN_PANEL.md
│   ├── 15_USER_DASHBOARD.md
│   ├── 16_UI_UX.md                 ← يتضمن معيار العربية الافتراضية + التصميم العالمي
│   ├── assets/
│   │   └── ui-design-reference.png ← مرجع بصري (موودبورد 9 شاشات: ثيم داكن + Gradient وردي-بنفسجي)
│   ├── 17_SECURITY.md
│   ├── 18_DEPLOYMENT.md
│   ├── 19_TESTING.md
│   └── 20_PROJECT_ROADMAP.md
│
├── prompts/                        ← برومبتات جاهزة للتنفيذ عبر Opencode
│   ├── master_prompt.md            ← البرومبت الرئيسي (يُعطى أولًا، دائمًا)
│   ├── phase_01.md … phase_08.md   ← برومبت لكل مرحلة تنفيذ
│
├── run-opencode-pipeline.sh        ← سكربت يشغّل كل المراحل بالترتيب عبر opencode CLI
└── README.md                       ← هذا الملف
```

## طريقة التشغيل مع Opencode

هذا المشروع مُعد للتشغيل على سيرفر (Ubuntu) عبر opencode CLI. الخطوات:

1. انقل مجلد المشروع كاملاً (بما فيه `docs/` و`prompts/` و`run-opencode-pipeline.sh`) إلى السيرفر.
2. تأكد أن `opencode` مثبت ومسجّل دخول (`opencode auth login`) على السيرفر.
3. من داخل مجلد المشروع على السيرفر:
   ```bash
   chmod +x run-opencode-pipeline.sh
   ./run-opencode-pipeline.sh
   ```
4. السكربت يعطي `master_prompt.md` أولًا (يوجّه Opencode لقراءة كل `docs/` قبل أي كود)، ثم يمرّ على `phase_01.md` حتى `phase_08.md` بالترتيب، ويتوقف بعد كل مرحلة لمراجعتك قبل المتابعة (Phase Gate).
5. أي تعديل على المعمارية أو قاعدة البيانات يجب أن يُحدَّث أولًا في ملفات `docs/` ذات الصلة، ثم يُطلب من Opencode تنفيذه — وليس العكس.

## مبدأ أساسي بخصوص البيانات

النظام **لا يعتمد على بيانات مسربة أو غير مصرح بها**. مصادر البيانات المعتمدة:

- بيانات عامة يمكن الوصول إليها بشكل مشروع (Public data ضمن حدود الاستخدام المسموح).
- بيانات يُدخلها المستخدم بنفسه.
- تحليلات وخوارزميات داخلية (AI/Heuristics) لتوليد مؤشرات وتوصيات تقديرية.

حقول مثل بلد المنشأ، تاريخ إنشاء الحساب، نسبة الوصول للـ Explore/For You، قوة الحساب، ونقاط الضعف هي **مؤشرات تقديرية محسوبة**، وليست بيانات رسمية من TikTok، ويجب أن تُعرض للمستخدم دائمًا مع توضيح "تقديري" (Estimated). التفاصيل الكاملة في `docs/09_AI_ANALYSIS_ENGINE.md` و`docs/10_TIKTOK_DATA_ENGINE.md`.

## الاسم المؤقت للمشروع

**TikTok Intelligence Platform**
