# 05 — System Architecture

هذه الوثيقة، مع `07_DATABASE_DESIGN.md` و`16_UI_UX.md`، هي المرجع الملزم لأي قرار بنيوي. لا يُسمح لـ Opencode أو أي منفّذ بتغيير هذه المعمارية دون تحديث هذا الملف أولًا.

## نظرة عامة على الطبقات

```
┌─────────────────────────────────────────────────────────┐
│  Frontend (Next.js App Router) — عربي RTL افتراضيًا       │
│  - صفحات عامة (Landing, Analyzer, Report)                │
│  - لوحة تحكم المبدع (Creator Dashboard)                  │
│  - لوحة CRM الوكالة (Agency Dashboard)                   │
│  - لوحة الإدارة (Admin Panel)                             │
└───────────────────────┬───────────────────────────────────┘
                         │ REST/HTTP (Internal API فقط)
┌───────────────────────▼───────────────────────────────────┐
│  API Layer (Next.js Route Handlers / Server Actions)      │
│  - Auth Middleware (Better Auth)                           │
│  - RBAC Middleware                                          │
│  - Rate Limiting                                             │
└───────────────────────┬───────────────────────────────────┘
                         │
      ┌──────────────────┼───────────────────────┐
      ▼                  ▼                       ▼
┌───────────┐   ┌─────────────────┐   ┌───────────────────┐
│ Business   │   │ AI Analysis     │   │ Data Provider      │
│ Services   │   │ Engine          │   │ Engine (Providers) │
│ (CRM, Auth,│   │ (Scoring,       │   │ (TikTok Provider,  │
│ Users,     │   │ Strengths/      │   │  future: IG/YT/    │
│ Subs)      │   │ Weaknesses,     │   │  Kick/Twitch)       │
│            │   │ Explore %)      │   │                     │
└─────┬──────┘   └────────┬────────┘   └──────────┬──────────┘
      │                   │                        │
      │                   │              ┌─────────▼─────────┐
      │                   │              │ Queue (BullMQ +    │
      │                   │              │ Redis) — جمع بيانات │
      │                   │              │ غير متزامن         │
      │                   │              └─────────┬─────────┘
      ▼                   ▼                        ▼
┌─────────────────────────────────────────────────────────┐
│  PostgreSQL (Prisma ORM) — مصدر الحقيقة الوحيد            │
└─────────────────────────────────────────────────────────┘
                         │
                         ▼
              ┌─────────────────────┐
              │ Redis (Cache + Queue)│
              │ S3-compatible storage│
              │ (تقارير PDF، صور)     │
              └─────────────────────┘
```

## المبادئ المعمارية الملزمة

1. **API داخلي فقط.** لا يوجد منتج "API عام للمطورين". كل Endpoint مصمم لخدمة Frontend المنصة نفسها فقط، ويُحمى بمصادقة جلسة، ليس API Keys عامة للبيع.
2. **Provider Pattern لمصادر البيانات.** أي مصدر بيانات (TikTok اليوم، Instagram/YouTube/Kick/Twitch لاحقًا) يُنفَّذ كـ Class/Module يطبّق واجهة (Interface) موحّدة `DataProvider` (راجع `10_TIKTOK_DATA_ENGINE.md`). الطبقات الأعلى (AI Engine، API) لا تعرف تفاصيل أي مزود بعينه.
3. **فصل جمع البيانات عن التحليل.** جمع البيانات الخام (Data Provider Engine) طبقة منفصلة تمامًا عن حساب المؤشرات (AI Analysis Engine). النتيجة الخام تُخزَّن كـ Snapshot، ثم يُشتق منها التحليل.
4. **كل تحليل تقديري قابل لإعادة الحساب.** أي Score يُخزَّن مع نسخة من المدخلات التي أنتجته (Inputs snapshot) لضمان قابلية التتبع والتحقق لاحقًا.
5. **معالجة غير متزامنة للعمليات الثقيلة.** أي عملية جمع بيانات قد تستغرق وقتًا (أول تحليل لحساب لم يُحلَّل من قبل) تمر عبر Queue، مع تحديث تقدّمي للواجهة (Polling أو WebSocket بسيط).
6. **RBAC مركزي.** كل الأدوار (Creator, Agency Staff, Agency Admin, Platform Admin) تُفحص عبر طبقة واحدة مشتركة، لا فحوصات صلاحيات متفرقة داخل كل Route يدويًا بمنطق مختلف.
7. **لا منطق أعمال في مكونات الواجهة.** أي حساب أو قرار (هل الحساب مؤهل للوكالة؟ ما هو الـ Score؟) يعيش في طبقة Services/Engine على الخادم، لا في React components.
8. **i18n من الأساس، عربي افتراضي.** كل نص ظاهر للمستخدم يمر عبر نظام ترجمة (`16_UI_UX.md`)، ولا يُبنى أي مكوّن بنص إنجليزي أو عربي مباشر (Hardcoded).

## الوحدات (Modules) الرئيسية

| الوحدة               | المسؤولية                                  | الوثيقة المرجعية                            |
| -------------------- | ------------------------------------------ | ------------------------------------------- |
| Auth Module          | تسجيل، دخول، جلسات، RBAC                   | `13_AUTH_SYSTEM.md`                         |
| Data Provider Engine | جمع بيانات خام من مصادر متعددة             | `10_TIKTOK_DATA_ENGINE.md`                  |
| AI Analysis Engine   | حساب كل الـ Scores والمؤشرات التقديرية     | `09_AI_ANALYSIS_ENGINE.md`                  |
| Analytics/Reporting  | تجميع، تخزين تاريخي، مقارنات، تصدير PDF    | `11_ANALYTICS_ENGINE.md`                    |
| Agency CRM           | إدارة المتقدمين وworkflow التوظيف          | `12_AGENCY_CRM.md`                          |
| Creator Dashboard    | واجهة المبدع                               | `15_USER_DASHBOARD.md`                      |
| Admin Panel          | إدارة شاملة للمنصة                         | `14_ADMIN_PANEL.md`                         |
| i18n / Design System | العربية الافتراضية + معيار التصميم العالمي | `16_UI_UX.md`                               |
| Notifications        | إشعارات داخل المنصة + بريد                 | جزء من `03_FUNCTIONAL_REQUIREMENTS.md` FR-6 |

## تدفّق تنفيذ طلب تحليل جديد (Sequence عالي المستوى)

1. المستخدم يُدخل يوزر → Frontend يستدعي `POST /api/analyze`.
2. API Layer يتحقق من Rate limit وصلاحية الطلب، يبحث في Cache/DB عن Snapshot حديث (< X ساعات).
3. إن وُجد Snapshot صالح → يُعاد التقرير فورًا من DB (مسار سريع).
4. إن لم يوجد → يُنشأ Job في Queue → Worker يستدعي `TikTokProvider.fetchProfile()` → يخزّن Raw Snapshot في DB.
5. AI Analysis Engine يُشغَّل على الـ Snapshot → ينتج Scores + Strengths/Weaknesses + Explore % → يُخزَّن كـ AnalysisReport مرتبط بالـ Snapshot.
6. Frontend يستقصي حالة الـ Job (Polling كل 1-2 ثانية) أو يستقبل تحديثًا، ويعرض التقرير فور اكتماله بالعربية RTL افتراضيًا.
7. إن كان الـ Score فوق العتبة المُعرَّفة → يُفعَّل عرض "مؤهل للوكالة" في الواجهة.

## بيئات التشغيل (Environments)

- **Local/Dev**: Docker Compose (App + PostgreSQL + Redis)، سواء على سيرفر Ubuntu أو أي جهاز تطوير.
- **Staging**: نسخة طبق الأصل من Production بموارد أقل، لاختبار كل مرحلة قبل الدمج.
- **Production**: سيرفر Ubuntu (أو مكافئ) — راجع `18_DEPLOYMENT.md` للتفاصيل الكاملة.

## حدود صارمة (Hard Constraints)

- ممنوع تنفيذ ميزة "API عام يُباع للعملاء الخارجيين" تحت أي مسمى.
- ممنوع دمج منطق الـ AI Analysis Engine داخل Data Provider (يجب أن يبقيا موديولين منفصلين قابلين للاختبار كل على حدة).
- ممنوع تخزين كلمات مرور أو أسرار بنص صريح في أي جدول أو ملف.
- ممنوع بناء أي صفحة أو مكوّن بنص إنجليزي كلغة أساسية — العربية أولًا دائمًا (`16_UI_UX.md`).
