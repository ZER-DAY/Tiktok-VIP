# Phase 01 — Foundation & Setup

المرجع: `docs/06_TECH_STACK.md`, `docs/05_SYSTEM_ARCHITECTURE.md`, `docs/16_UI_UX.md` (القسم 0 — اللغة الافتراضية)، `docs/18_DEPLOYMENT.md`.

## تحذير قبل البدء

هذا المشروع يُبنى داخل مجلد يحتوي فعلاً على `docs/`, `prompts/`, `README.md`. **قبل تشغيل أي أداة سكافولد (مثل `create-next-app`)، تحقق أنها لن تحذف أو تستبدل هذه الملفات.** إذا طلبت الأداة مجلدًا فارغًا، أنشئ المشروع في مجلد فرعي مؤقت ثم انقل محتواه لجذر المشروع يدويًا مع الحفاظ على `docs/` و`prompts/` و`README.md` سليمين، أو استخدم خيارات الأداة التي تسمح بالتهيئة داخل مجلد غير فارغ دون حذف. لا تفترض — تحقق فعليًا بعد كل خطوة أن `docs/` و`prompts/` ما زالا موجودين (`ls`).

## الهدف

مشروع Next.js يعمل فعليًا على سيرفر Ubuntu (أو بيئة تطوير مكافئة) عبر Docker Compose، بكل الأدوات الأساسية مهيّأة — **بما فيها العربية كلغة افتراضية RTL** — جاهز لبناء أي ميزة فوقه دون إعادة إعداد لاحقًا.

## المهام

1. إنشاء مشروع Next.js 16 (App Router) بـ TypeScript (strict mode)، بدون المساس بـ `docs/`, `prompts/`, `README.md`.
2. تثبيت وتهيئة: Tailwind CSS 4، shadcn/ui، lucide-react، Recharts، React Hook Form + Zod، TanStack Query، Framer Motion.
3. **تهيئة next-intl بالكامل**: Locale افتراضي `ar` مع `dir="rtl"`، Locale ثانوي `en` مع `dir="ltr"`، بنية مسارات `/[locale]/...`، ملفات `messages/ar.json` و`messages/en.json` (تبدأ بمفاتيح أساسية: عنوان الموقع، زر التحليل، إلخ). التأكد أن فتح `/` يوجّه فعليًا لتجربة عربية RTL كاملة دون خطوة وسيطة.
4. تثبيت وتهيئة خط عربي احترافي (Tajawal أو IBM Plex Sans Arabic أو Cairo) + Inter كخط إنجليزي، في Tailwind config كخطوط أساسية.
5. تهيئة Prisma مع اتصال PostgreSQL (بدون Schema فعلي بعد — Schema كاملة في `phase_02`)، فقط تأكيد أن `prisma db pull`/`prisma migrate dev` يعملان على قاعدة بيانات فارغة.
6. تهيئة Redis client (لاستخدام لاحق في Cache وQueue بـ BullMQ، دون بناء منطق فعلي بعد).
7. تهيئة Better Auth بأدنى إعداد (بريد/كلمة مرور + Google OAuth placeholder)، بدون شاشات كاملة بعد — فقط التأكد أن الجلسة تعمل.
8. Docker Compose يشغّل: تطبيق Next.js، PostgreSQL، Redis، (MinIO اختياري لهذه المرحلة).
9. ESLint + Prettier + Husky + lint-staged.
10. هيكل مجلدات `/src/modules/{auth,providers,ai-engine,analytics,agency-crm,admin}` فارغة بـ `.gitkeep` أو ملف `index.ts` بسيط لكل موديول.
11. `.env.example` بكل المتغيرات المذكورة في `docs/18_DEPLOYMENT.md`.
12. صفحة رئيسية مؤقتة (`/`) تعرض فقط "قريبًا" بالعربية RTL بالخط المهيّأ، للتأكد أن next-intl وكل الطبقات (DB, Redis, Auth) متصلة وتعمل عبر Health check بسيط. نفس الصفحة بالإنجليزية على `/en`.
13. `GET /api/health` يفحص اتصال DB وRedis فعليًا (`docs/18_DEPLOYMENT.md`).

## معيار القبول (Phase Gate)

- `docs/` و`prompts/` و`README.md` ما زالوا موجودين وسليمين بعد كل خطوة سكافولد (تحقق فعلي، ليس افتراضًا).
- `docker compose up` يشغّل كل الخدمات بدون أخطاء.
- فتح `/` يعرض عربي RTL فعليًا (تحقق من `dir="rtl"` في الـ HTML الناتج)، وفتح `/en` يعرض إنجليزي LTR.
- `/api/health` يُرجع حالة ناجحة فعلية (ليست Hardcoded) لاتصال DB وRedis.
- `pnpm lint` و`pnpm typecheck` (أو مكافئهما) يمران بدون أخطاء.
- لا كود ميزات فعلية بعد (Auth الكامل، Analyzer) — هذه المرحلة تأسيس بحت.

قدّم عند الانتهاء: أوامر التشغيل الفعلية، تأكيد أن `docs/`/`prompts/`/`README.md` سليمون، ووصف نصي لناتج `/api/health` و`/` بالعربي RTL.
