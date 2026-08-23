# Phase 03 — Landing Page (معيار عالمي) + Data Provider Engine + Analyzer الأساسي

المرجع: `docs/16_UI_UX.md` (القسم 0 اللغة الافتراضية، القسم 3 معيار Landing العالمي، والقسم 6 نظام الألوان والمكوّنات — بند بند بدون تخطي)، `docs/assets/ui-design-reference.png` (**افتح هذه الصورة فعليًا وطابق الثيم الداكن والـ Gradient الوردي-البنفسجي وأسلوب البطاقات منها — مرجع بصري إلزامي، وليس اختياريًا**)، `docs/10_TIKTOK_DATA_ENGINE.md` (كامل)، `docs/03_FUNCTIONAL_REQUIREMENTS.md` (FR-1.1 إلى FR-1.4)، `docs/08_API_SPECIFICATION.md` (Analyzer endpoints).

**تذكير صريح**: توگل "تحليل فيديو" ونظام "رصيد التحليلات" الظاهران بالصورة المرجعية **لا يُبنيان في هذه المرحلة ولا في أي مرحلة من الـ MVP** — الصورة مرجع بصري فقط (`16_UI_UX.md` القسم 6). ابنِ تحليل الحساب الكامل فقط بنفس الشكل البصري.

## الهدف

مسار كامل يعمل فعليًا: زائر يفتح `/` (عربي RTL بجودة تصميم عالمية) → يُدخل يوزر TikTok → يُجلَب بيانات خام حقيقية → تُخزَّن كـ `AccountSnapshot` → تُعرض في صفحة تقرير عربية (بدون AI Scores بعد — تلك في `phase_04`).

## المهام

### Landing Page — بمعيار عالمي، ليس تصميمًا عامًا

طبّق **حرفيًا** كل بند من `docs/16_UI_UX.md` القسم 3:

1. **Hero Section**: خلفية Gradient/Mesh ناعم متحرك بهدوء، عنوان عربي كبير وقوي مع عنوان فرعي مباشر، **معاينة حية مصغّرة لتقرير حقيقي (Live report mockup) داخل الـ Hero نفسه**، CTA واحد رئيسي بارز (حقل يوزر + زر تحليل).
2. **Micro-interactions**: Hover states ناعمة بـ transition واضح، Animate on scroll خفيف (Framer Motion) للأقسام، عداد متحرك (Count-up) للأرقام المهمة عند ظهورها بالشاشة.
3. **قسم "كيف يعمل"**: 3 خطوات بأيقونات lucide-react، نص عربي مختصر.
4. **إثبات اجتماعي**: قسم شهادات/أرقام ثقة بتصميم بطاقات أنيقة (محتوى Placeholder مقبول، التصميم لا).
5. **قسم الخطط المختصر** + رابط لـ `/pricing`.
6. **قسم تشويق الوكالة** ("مؤهل للوكالة؟") دون تفاصيل كاملة — خفيف الوزن بصريًا، لا ينافس الـ Hero وحقل التحليل بالبروز؛ المستخدم يجي عشان يحلل حسابه أولًا، راجع `docs/01_PROJECT_OVERVIEW.md` (أولوية العرض للمستخدم).
7. **Footer** منظم بأعمدة (روابط المنتج، الشركة، قانوني).
8. **Dark mode**، مسافات بيضاء سخية، Lazy loading للصور بدون Layout shift، استهداف Lighthouse عالٍ (Performance + Accessibility).
9. لا نص عربي أو إنجليزي Hardcoded — كل شيء عبر `next-intl` (`messages/ar.json` كأساس).

قيّم النتيجة بنفسك قبل تسليم المرحلة: هل هذا يوازي بصريًا مستوى Stripe/Linear/Vercel/Framer؟ إن كان الجواب لا، أعد العمل قبل الانتقال.

### Data Provider Engine

10. بناء واجهة `DataProvider` كما في `docs/10_TIKTOK_DATA_ENGINE.md` بالضبط (TypeScript interface).
11. تنفيذ `TikTokProvider` فعليًا: `fetchProfile`, `fetchRecentContent` (N=20 افتراضيًا)، `fetchLiveStatus`. الالتزام الصارم بالقيود: بيانات عامة فقط، لا مصادر مسربة، Throttling وRetry with backoff.
12. BullMQ queue + worker: `AnalyzeAccountJob` يستدعي الـ Provider ويخزّن `AccountSnapshot`.
13. سياسة Cache: Snapshot أحدث من مدة قابلة للتهيئة (افتراضي 6 ساعات) يُستخدم مباشرة بدل إعادة الجلب.
14. معالجة الحقول المشتقة البسيطة هنا فقط (averages، language detection أولي) — وليس أي Score.

### API + واجهة النتيجة

15. `POST /api/analyze`, `GET /api/analyze/:jobId/status`, `GET /api/reports/:reportId` كما في `docs/08_API_SPECIFICATION.md` (التقرير في هذه المرحلة يعرض فقط معلومات الحساب + الإحصائيات + البث المباشر — أقسام AI تُعرض كـ"قيد التحليل" مؤقتًا).
16. صفحة `/report/:reportId` (و`/en/report/:reportId`) بحالات Loading (Skeleton تقدّمي حسب `docs/16_UI_UX.md`)/Empty/Error فعلية، عربية RTL افتراضيًا.

## معيار القبول (Phase Gate)

- إدخال يوزر TikTok حقيقي ينتج بيانات حقيقية فعلية (لا Mock) تُخزَّن وتُعرض.
- طلب ثانٍ لنفس اليوزر خلال ساعة الـ Cache يعيد النتيجة فورًا من DB دون استدعاء خارجي جديد.
- فشل الجلب (يوزر غير موجود، حظر مؤقت) يُعرض برسالة عربية واضحة، لا شاشة بيضاء أو تعليق غير محدود.
- صفحة `/` تفتح عربي RTL فورًا وتحقق كل بنود معيار التصميم العالمي أعلاه.
- لا حساب لأي Score من `09_AI_ANALYSIS_ENGINE.md` في هذه المرحلة — يبقى ذلك لـ `phase_04` بوضوح تام.

قدّم عند الانتهاء: مثالاً فعليًا (يوزر حقيقي جُرِّب) مع وصف البيانات التي عادت، ووصف مختصر لكيف تحقق معيار التصميم العالمي في الـ Landing Page.
