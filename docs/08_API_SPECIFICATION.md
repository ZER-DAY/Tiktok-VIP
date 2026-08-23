# 08 — API Specification

هذا API **داخلي فقط** — يخدم Frontend المنصة حصرًا، ولا يُطرح كمنتج للمطورين الخارجيين (راجع `05_SYSTEM_ARCHITECTURE.md`). المصادقة عبر جلسة (Session cookie via Better Auth)، لا API Keys عامة.

## تنسيق موحّد للاستجابات

```json
// نجاح
{ "success": true, "data": { ... }, "meta": { ... } }

// خطأ
{ "success": false, "error": { "code": "STRING_CODE", "message": "نص عربي واضح", "details": { } } }
```

رسائل `message` في الأخطاء تُعاد بالعربية افتراضيًا (حسب لغة المستخدم/الطلب — راجع `16_UI_UX.md`)، والكود (`code`) ثابت بالإنجليزية للتعامل البرمجي.

## أكواد الأخطاء الموحّدة

| Code                   | HTTP Status | متى                                           |
| ---------------------- | ----------- | --------------------------------------------- |
| `VALIDATION_ERROR`     | 400         | فشل التحقق من المدخلات (Zod)                  |
| `UNAUTHENTICATED`      | 401         | لا جلسة صالحة                                 |
| `FORBIDDEN`            | 403         | جلسة صالحة لكن بلا صلاحية                     |
| `NOT_FOUND`            | 404         | الكيان غير موجود                              |
| `RATE_LIMITED`         | 429         | تجاوز حد الاستخدام (خطة مجانية أو حماية عامة) |
| `PROVIDER_UNAVAILABLE` | 502         | فشل مؤقت في مصدر بيانات خارجي                 |
| `INTERNAL_ERROR`       | 500         | خطأ غير متوقع                                 |

## Endpoints — Analyzer (عام)

### `POST /api/analyze`

يبدأ تحليل حساب. متاح بدون تسجيل دخول بحد استخدام (Rate limit صارم للزوار غير المسجلين).

Request:

```json
{ "provider": "tiktok", "username": "example_user" }
```

Response (202 — إن ذهب لطابور معالجة):

```json
{ "success": true, "data": { "jobId": "uuid", "status": "queued" } }
```

Response (200 — إن وُجد Snapshot حديث صالح من Cache):

```json
{ "success": true, "data": { "reportId": "uuid", "status": "ready" } }
```

### `GET /api/analyze/:jobId/status`

Response:

```json
{ "success": true, "data": { "status": "queued|processing|ready|failed", "reportId": "uuid|null" } }
```

### `GET /api/reports/:reportId`

يُرجع التقرير الكامل: معلومات الحساب، الإحصائيات، البث المباشر، كل الـ Scores، Strengths/Weaknesses، تحليل Explore، تحليل الجمهور، المنافسين. بنية `data` تطابق حقول `03_FUNCTIONAL_REQUIREMENTS.md` FR-1.2 إلى FR-1.9 بالكامل، وكل حقل تقديري يحمل `isEstimated: true`.

### `GET /api/reports/:reportId/export/pdf` (Pro+)

يُرجع رابط تحميل PDF (يُنشأ Job في Queue إن لم يكن مولّدًا مسبقًا). الـ PDF بالعربية RTL افتراضيًا حسب لغة التقرير.

## Endpoints — Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `POST /api/auth/verify-email`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `GET /api/auth/session` — يُرجع المستخدم الحالي وأدواره ولغته المفضّلة (`preferredLocale`)

(هذه المسارات قد تُدار مباشرة عبر Better Auth حسب `13_AUTH_SYSTEM.md`؛ القائمة هنا للتوثيق الوظيفي.)

## Endpoints — Creator Dashboard

### `GET /api/me/accounts`

قائمة الحسابات التي تتبّعها/يملكها المستخدم الحالي مع آخر Score لكل منها.

### `GET /api/me/accounts/:accountId/history`

تطور المؤشرات عبر الزمن (لكل Snapshot متاح).

### `GET /api/me/reports`

كل التقارير المرتبطة بحسابات المستخدم.

### `POST /api/me/accounts/:accountId/compare`

Request: `{ "competitorUsernames": ["user1", "user2"] }` → يُرجع مقارنة جنبًا إلى جنب (Pro+).

## Endpoints — Agency (يتطلب صلاحية agency_staff أو أعلى)

### `POST /api/agency/applications`

تقديم طلب انضمام (متاح للمستخدم النهائي بعد التحليل، وليس فقط للموظفين):

```json
{ "accountId": "uuid", "fullName": "...", "phone": "...", "telegram": "...", "email": "..." }
```

### `GET /api/agency/applications`

قائمة مع فلاتر: `?status=&country=&minFollowers=&minScore=&assignee=&search=`. Pagination إلزامي (`?page=&pageSize=`).

### `GET /api/agency/applications/:id`

تفاصيل كاملة + التقرير المرتبط + الملاحظات + سجل الحالات.

### `PATCH /api/agency/applications/:id/status`

```json
{ "status": "reviewed|contacted|joined|rejected" }
```

يُنشئ سطرًا في `ApplicationStatusHistory` تلقائيًا (منطق Service، ليس مسؤولية الـ Frontend).

### `POST /api/agency/applications/:id/notes`

```json
{ "body": "..." }
```

### `PATCH /api/agency/applications/:id/assignee`

```json
{ "assigneeUserId": "uuid|null" }
```

## Endpoints — Admin (يتطلب صلاحية platform_admin)

- `GET /api/admin/users` — قائمة مع فلاتر وPagination
- `PATCH /api/admin/users/:id` — تعديل خطة/حالة/أدوار
- `GET /api/admin/stats` — إحصائيات المنصة (مستخدمون، تقارير، تحويلات)
- `GET /api/admin/audit-logs` — سجل العمليات مع فلاتر
- `GET/PATCH /api/admin/settings` — إعدادات النظام (عتبة تأهل الوكالة، حدود الخطة المجانية...)
- `GET/POST/PATCH /api/admin/plans` — إدارة خطط الاشتراك

## قواعد عامة إلزامية على كل Endpoint

1. تحقق مدخلات بـ Zod schema مشترك بين الواجهة والخادم.
2. فحص RBAC عبر Middleware مركزي واحد (`05_SYSTEM_ARCHITECTURE.md` مبدأ 6) — لا فحص صلاحيات يدوي متكرر داخل كل Handler.
3. Rate limiting لكل Endpoint عام (خصوصًا `/api/analyze`).
4. تسجيل (Log) لكل خطأ 500 مع Correlation ID.
5. لا إرجاع أي حقل حساس (passwordHash، أسرار) في أي استجابة تحت أي ظرف.
