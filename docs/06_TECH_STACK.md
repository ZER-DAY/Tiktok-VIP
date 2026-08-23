# 06 — Tech Stack

مرجع ملزم للأدوات والمكتبات. لا يُستبدل أي عنصر هنا دون تحديث هذا الملف صراحة أولًا.

## Frontend

| العنصر         | الاختيار                                                                             | ملاحظة                                                                                                                 |
| -------------- | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------- |
| Framework      | Next.js 16 (App Router)                                                              | Server Components افتراضيًا، Client Components فقط عند الحاجة (تفاعل)                                                  |
| Language       | TypeScript (strict mode)                                                             | ممنوع `any` بدون تبرير موثّق                                                                                           |
| UI Library     | React 19                                                                             |                                                                                                                        |
| Styling        | Tailwind CSS 4                                                                       | لا CSS-in-JS إضافي                                                                                                     |
| Components     | shadcn/ui                                                                            | مبني فوق Radix UI، يجب التأكد من انعكاسه الصحيح بالـ RTL                                                               |
| Icons          | lucide-react                                                                         |                                                                                                                        |
| Charts         | Recharts                                                                             | لعرض مؤشرات الأداء والنمو                                                                                              |
| Forms          | React Hook Form + Zod                                                                | نفس مخططات Zod تُستخدم للتحقق في الـ API                                                                               |
| State (Client) | React Query (TanStack Query)                                                         | لإدارة حالة البيانات القادمة من API                                                                                    |
| Animation      | Framer Motion (خفيف، لا مبالغة)                                                      | للـ Micro-interactions بصفحة Landing حسب `16_UI_UX.md`                                                                 |
| i18n           | **next-intl**                                                                        | **العربية (`ar`) هي الـ Locale الافتراضي**، الإنجليزية (`en`) لغة ثانوية عبر مسار `/en`. تفاصيل كاملة في `16_UI_UX.md` |
| Fonts          | خط عربي احترافي (Tajawal / IBM Plex Sans Arabic / Cairo) + Inter كـ fallback إنجليزي | يُهيّأ في Tailwind كخط أساسي                                                                                           |

## Backend

| العنصر              | الاختيار                                              | ملاحظة                                                                           |
| ------------------- | ----------------------------------------------------- | -------------------------------------------------------------------------------- |
| Runtime             | Node.js (LTS)                                         |                                                                                  |
| API                 | Next.js Route Handlers + Server Actions               | لا Express منفصل إلا إذا استدعت الحاجة خدمة مستقلة (Workers)                     |
| ORM                 | Prisma                                                | مصدر الحقيقة الوحيد للوصول لقاعدة البيانات                                       |
| Database            | PostgreSQL                                            | راجع `07_DATABASE_DESIGN.md`                                                     |
| Cache               | Redis                                                 | Cache للتقارير الحديثة + Queue backend                                           |
| Queue               | BullMQ (فوق Redis)                                    | لمعالجة جمع البيانات والتحليل بشكل غير متزامن                                    |
| Auth                | Better Auth                                           | جلسات، OAuth، RBAC                                                               |
| Validation          | Zod                                                   | مشتركة بين Frontend وBackend                                                     |
| File/Object Storage | S3-compatible (MinIO محليًا / S3 أو مكافئ في الإنتاج) | لتخزين تقارير PDF وصور مخزَّنة مؤقتًا                                            |
| PDF Generation      | راجع `11_ANALYTICS_ENGINE.md`                         | مكتبة توليد PDF من HTML/React، يجب أن تدعم العربية RTL بشكل صحيح بالـ PDF الناتج |

## AI / Analysis Engine

- طبقة منطق داخلية (TypeScript) لحساب الـ Scores بقواعد وخوارزميات وزنية (Weighted heuristics) — راجع `09_AI_ANALYSIS_ENGINE.md`.
- استدعاء نموذج لغوي (LLM) اختياري لتوليد صياغة نقاط القوة/الضعف والتوصيات بلغة عربية طبيعية بناءً على المؤشرات المحسوبة رقميًا (وليس لتوليد الأرقام نفسها).

## DevOps / Infrastructure

| العنصر                | الاختيار                              |
| --------------------- | ------------------------------------- |
| بيئة التشغيل الأساسية | سيرفر Ubuntu Linux (عبر opencode CLI) |
| Containerization      | Docker + Docker Compose               |
| CI/CD                 | GitHub Actions                        |
| Linting               | ESLint                                |
| Formatting            | Prettier                              |
| Git hooks             | Husky + lint-staged                   |
| Monitoring/Logs       | راجع `18_DEPLOYMENT.md`               |
| Testing               | راجع `19_TESTING.md`                  |

## إدارة الحزم

- Package manager: `pnpm` (أسرع وأكثر كفاءة بالمساحة من npm/yarn لمشروع بهذا الحجم).
- مشروع Next.js واحد يضم Frontend + API + Workers logic (نفس الـ repo)، مع فصل واضح بالمجلدات. لا حاجة لـ Monorepo (Turborepo) قبل الحاجة الفعلية للتوسع.

## هيكل المجلدات المقترح (على مستوى عالٍ)

```
/src
  /app                → Next.js App Router (pages, layouts, route handlers)
    /[locale]           → مسارات مترجمة (ar افتراضي، en ثانوي) عبر next-intl
  /components          → مكونات UI قابلة لإعادة الاستخدام
  /modules
    /auth
    /providers          → Data Provider Engine (tiktok/, instagram/ لاحقًا...)
    /ai-engine           → AI Analysis Engine
    /analytics
    /agency-crm
    /admin
  /lib                 → أدوات مشتركة (db client, redis client, zod schemas)
  /workers             → BullMQ workers
/messages
  ar.json               → نصوص الواجهة بالعربية (اللغة الافتراضية)
  en.json               → نصوص الواجهة بالإنجليزية
/prisma
  schema.prisma
  /migrations
/docs
/prompts
```

هذا الهيكل مرجعي، والتفاصيل النهائية تُحدَّد فعليًا في `phase_01.md` عند التنفيذ.
