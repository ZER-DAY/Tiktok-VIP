# Phase 02 — Database

المرجع الملزم: `docs/07_DATABASE_DESIGN.md` (بند بند، بدون تخطي أي جدول أو حقل).

## الهدف

Schema كاملة في Prisma تطابق `07_DATABASE_DESIGN.md` حرفيًا، مع Migrations وبيانات Seed للاختبار اليدوي والتطوير.

## المهام

1. كتابة `schema.prisma` الكاملة لكل الجداول المذكورة: `User`, `Role`, `Permission`, `UserRole`, `RolePermission`, `Plan`, `Subscription`, `Provider`, `AnalyzedAccount`, `AccountSnapshot`, `LiveSession`, `AnalysisReport`, `ReportInsight`, `AgencyApplication`, `ApplicationNote`, `ApplicationStatusHistory`, `Notification`, `AuditLog`.
2. تطبيق كل العلاقات والفهارس المذكورة في `07_DATABASE_DESIGN.md` (بما فيها الفهرس المركّب unique على `AnalyzedAccount(providerId, externalUsername)`).
3. تطبيق Soft delete على `User` (`deletedAt`)، وحقل `preferredLocale` (افتراضي `"ar"`).
4. إنشاء Migration أولى (`prisma migrate dev --name init`).
5. Seed script (`prisma/seed.ts`) ينشئ:
   - الأدوار الأربعة (`creator`, `agency_staff`, `agency_admin`, `platform_admin`) وصلاحياتها الأساسية من `docs/13_AUTH_SYSTEM.md`.
   - خطط اشتراك أولية (`free`, `pro`, `agency`) من `docs/02_BUSINESS_REQUIREMENTS.md`.
   - مزود `tiktok` في جدول `Provider` (`isActive: true`)، وبقية المزودين (`instagram`, `youtube`, `kick`, `twitch`) بـ `isActive: false` (جاهزون بنيويًا فقط).
   - مستخدم Admin تجريبي واحد (بيانات دخول تُطبع في الـ Console عند تشغيل الـ Seed، لا تُكتب في التوثيق).
   - 2-3 حسابات `AnalyzedAccount` وهمية مع Snapshot وAnalysisReport بأرقام معقولة، لاختبار الواجهات لاحقًا قبل جاهزية Data Provider الفعلي.
6. التأكد أن الـ Seed script قابل لإعادة التشغيل بأمان (Idempotent — لا يكرر البيانات عند تشغيله مرتين).

## معيار القبول (Phase Gate)

- `prisma migrate dev` ينجح من الصفر على قاعدة بيانات فارغة.
- `prisma db seed` ينجح ويُنتج بيانات متسقة قابلة للفحص عبر Prisma Studio.
- كل حقل تقديري في الـ Schema (`countryGuess`, `accountCreatedAtGuess`, `isEstimated`...) موجود فعليًا كما في `07_DATABASE_DESIGN.md`، لا حقل ناقص.

قدّم عند الانتهاء: مخرج `prisma studio` وصفًا نصيًا لعينة من الجداول المعبأة، وتأكيد أن كل جدول من القائمة أعلاه موجود فعليًا في الـ Schema.
