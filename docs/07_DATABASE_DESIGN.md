# 07 — Database Design

مرجع ملزم لقاعدة البيانات. أي تعديل على Prisma Schema أثناء التنفيذ يجب أن يُعكس هنا أولًا. المحرك: PostgreSQL عبر Prisma.

## ERD نصّي (العلاقات الرئيسية)

```
User ──1:N── AnalyzedAccount (accounts أضافها/تتبعها المستخدم)
User ──1:N── Subscription
User ──1:N── AgencyApplication (كمقدّم طلب، اختياري إن كان مسجلاً)
User ──1:N── AuditLog (كفاعل)
User ──1:N── Notification

AnalyzedAccount ──1:N── AccountSnapshot (بيانات خام من كل عملية جمع)
AccountSnapshot ──1:1── AnalysisReport (نتائج AI لتلك اللقطة)
AnalyzedAccount ──1:N── LiveSession (سجل بثوث مباشرة معروفة/مقدّرة)
AnalyzedAccount ──1:N── AgencyApplication

AnalysisReport ──1:N── ReportInsight (نقاط قوة/ضعف/توصيات، عنصر لكل سطر)

AgencyApplication ──1:N── ApplicationNote
AgencyApplication ──1:N── ApplicationStatusHistory
AgencyApplication ──N:1── User (assignee من فريق التوظيف، Nullable)

Role ──N:M── User (عبر UserRole)
Role ──1:N── Permission (عبر RolePermission)

Provider (enum/جدول مرجعي) ──1:N── AnalyzedAccount
```

## الجداول (Models)

### User

| الحقل                 | النوع                  | ملاحظة                                          |
| --------------------- | ---------------------- | ----------------------------------------------- |
| id                    | uuid (PK)              |                                                 |
| email                 | string, unique         |                                                 |
| passwordHash          | string, nullable       | nullable لأن OAuth لا يحتاج كلمة مرور           |
| name                  | string                 |                                                 |
| avatarUrl             | string, nullable       |                                                 |
| emailVerifiedAt       | datetime, nullable     |                                                 |
| preferredLocale       | string, default `"ar"` | العربية افتراضيًا، `"en"` إن بدّل المستخدم لغته |
| planId                | FK → Plan              | الخطة الحالية                                   |
| createdAt / updatedAt | datetime               |                                                 |

### Role / Permission / UserRole / RolePermission

نظام RBAC قياسي:

- `Role`: id, name (creator, agency_staff, agency_admin, platform_admin), description.
- `Permission`: id, key (مثال: `crm.view_applicants`, `admin.manage_users`), description.
- `RolePermission`: roleId, permissionId (جدول ربط).
- `UserRole`: userId, roleId (جدول ربط، يسمح بأكثر من دور لكل مستخدم).

راجع `13_AUTH_SYSTEM.md` لقائمة الصلاحيات الكاملة.

### Plan / Subscription

- `Plan`: id, name (free/pro/agency), priceCents, billingInterval, reportsPerDay (nullable = unlimited), features (JSON).
- `Subscription`: id, userId (FK), planId (FK), status (active/canceled/past_due), startedAt, currentPeriodEnd, paymentProviderRef.

### Provider (مرجعي)

- `Provider`: id, key (tiktok, instagram, youtube, kick, twitch), displayName, isActive (boolean). جدول مرجعي بسيط يدعم بنية Multi-Provider من `05_SYSTEM_ARCHITECTURE.md`.

### AnalyzedAccount

| الحقل            | النوع               | ملاحظة                                     |
| ---------------- | ------------------- | ------------------------------------------ |
| id               | uuid (PK)           |                                            |
| providerId       | FK → Provider       |                                            |
| externalUsername | string              | اليوزر في المنصة المصدر                    |
| externalId       | string, nullable    | معرف داخلي من المزود إن توفر               |
| ownerId          | FK → User, nullable | مالك الحساب إن ربطه بنفسه (Claimed)        |
| trackedByUserId  | FK → User, nullable | من قام بتحليله أول مرة (قد لا يكون المالك) |
| firstAnalyzedAt  | datetime            |                                            |
| lastAnalyzedAt   | datetime            |                                            |
| createdAt        | datetime            |                                            |

فهرس مركّب unique على (`providerId`, `externalUsername`).

### AccountSnapshot

| الحقل                                         | النوع                              | ملاحظة                                             |
| --------------------------------------------- | ---------------------------------- | -------------------------------------------------- |
| id                                            | uuid (PK)                          |                                                    |
| accountId                                     | FK → AnalyzedAccount               |                                                    |
| capturedAt                                    | datetime                           |                                                    |
| followers                                     | int                                |                                                    |
| following                                     | int                                |                                                    |
| totalLikes                                    | bigint                             |                                                    |
| videoCount                                    | int                                |                                                    |
| avgViews / avgLikes / avgComments / avgShares | float, nullable                    | من عينة آخر N فيديو                                |
| isVerified                                    | boolean                            |                                                    |
| accountType                                   | enum (personal, business, unknown) |                                                    |
| bioLanguageGuess                              | string, nullable                   | تقديري                                             |
| countryGuess                                  | string, nullable                   | **تقديري** — راجع `10_TIKTOK_DATA_ENGINE.md`       |
| countryGuessConfidence                        | float, nullable                    | 0–1                                                |
| accountCreatedAtGuess                         | date, nullable                     | **تقديري**                                         |
| rawPayload                                    | JSON                               | نسخة كاملة من استجابة المزود، للتتبع وإعادة الحساب |

### LiveSession

| الحقل                    | النوع                | ملاحظة                                         |
| ------------------------ | -------------------- | ---------------------------------------------- |
| id                       | uuid (PK)            |                                                |
| accountId                | FK → AnalyzedAccount |                                                |
| startedAt                | datetime, nullable   | فعلي إن رُصد وقت الطلب، وإلا تقديري            |
| estimatedDurationMinutes | float, nullable      |                                                |
| isEstimated              | boolean              | يميّز البيانات الفعلية عن التقديرية            |
| source                   | string               | كيف رُصدت (live_check, historical_estimate...) |

### AnalysisReport

| الحقل                   | النوع                        | ملاحظة                                  |
| ----------------------- | ---------------------------- | --------------------------------------- |
| id                      | uuid (PK)                    |                                         |
| snapshotId              | FK → AccountSnapshot, unique | علاقة 1:1                               |
| accountStrengthScore    | int (0-100)                  |                                         |
| contentQualityScore     | int                          |                                         |
| engagementQualityScore  | int                          |                                         |
| postingConsistencyScore | int                          |                                         |
| explorePotentialPercent | int (0-100)                  |                                         |
| livePotentialScore      | int                          |                                         |
| professionalismScore    | int                          |                                         |
| growthRatePercent       | float, nullable              | يتطلب Snapshot سابق                     |
| scoreBreakdown          | JSON                         | تفصيل كامل لكل مكوّن دخل بحساب كل Score |
| generatedAt             | datetime                     |                                         |

### ReportInsight

| الحقل       | النوع                                                           | ملاحظة                                                           |
| ----------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| id          | uuid (PK)                                                       |                                                                  |
| reportId    | FK → AnalysisReport                                             |                                                                  |
| type        | enum (strength, weakness, recommendation, audience, competitor) |                                                                  |
| title       | string                                                          | نص عربي (مترجم عبر منطق العرض، لا يُخزَّن مترجَمًا مسبقًا لغتين) |
| description | string                                                          |                                                                  |
| evidenceRef | JSON, nullable                                                  | إشارة للحقل/الرقم الذي بُنيت عليه النقطة                         |
| order       | int                                                             |                                                                  |

### AgencyApplication

| الحقل                 | النوع                                             | ملاحظة                   |
| --------------------- | ------------------------------------------------- | ------------------------ |
| id                    | uuid (PK)                                         |                          |
| accountId             | FK → AnalyzedAccount                              |                          |
| applicantUserId       | FK → User, nullable                               | إن كان مسجلاً            |
| fullName              | string                                            |                          |
| phone                 | string                                            |                          |
| telegram              | string                                            |                          |
| email                 | string                                            |                          |
| status                | enum (new, reviewed, contacted, joined, rejected) |                          |
| assigneeUserId        | FK → User, nullable                               | عضو فريق التوظيف المسؤول |
| createdAt / updatedAt | datetime                                          |                          |

### ApplicationNote

id, applicationId (FK), authorUserId (FK), body (text), createdAt.

### ApplicationStatusHistory

id, applicationId (FK), fromStatus, toStatus, changedByUserId (FK), changedAt.

### Notification

id, userId (FK), type, title, body, isRead (boolean), createdAt.

### AuditLog

id, actorUserId (FK, nullable للنظام), action (string), entityType, entityId, metadata (JSON), createdAt.

## قواعد سلامة البيانات (Integrity Rules)

- كل `AccountSnapshot` غير قابل للتعديل بعد الإنشاء (Append-only) — أي تحديث لاحق ينشئ Snapshot جديدًا، لضمان قابلية تتبّع النمو التاريخي.
- `AnalysisReport` يُشتق دائمًا من Snapshot واحد محدد (لا حساب Score بدون Snapshot مرتبط).
- حذف `User` (طلب حذف بيانات وفق `04_NON_FUNCTIONAL_REQUIREMENTS.md`) يُنفَّذ كـ Soft delete (حقل `deletedAt`) وليس حذفًا فعليًا فوريًا، لضمان سلامة السجلات المرتبطة (Audit, Applications)، مع Job دوري لحذف نهائي بعد فترة احتفاظ محددة.
- كل الحقول التقديرية (`*Guess`, `isEstimated`, `*Estimated*`) إلزامية التمييز في الـ Schema، بحيث لا يمكن للـ Frontend عرضها بالخطأ كبيانات فعلية دون توفر الحقل المصاحب.

## الفهرسة (Indexing) الأساسية

- `AnalyzedAccount(providerId, externalUsername)` — unique composite.
- `AccountSnapshot(accountId, capturedAt DESC)` — لاستعلامات "آخر Snapshot" السريعة.
- `AgencyApplication(status)` و`AgencyApplication(assigneeUserId)` — لفلترة لوحة CRM.
- `AuditLog(entityType, entityId)` — لاستعراض سجل كيان معين بسرعة.
