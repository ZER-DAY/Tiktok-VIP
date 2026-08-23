# 18 — Deployment

## البيئات

| البيئة     | الغرض                                                           |
| ---------- | --------------------------------------------------------------- |
| Local/Dev  | تطوير يومي، Docker Compose كامل (`06_TECH_STACK.md`)            |
| Staging    | اختبار كل مرحلة قبل الدمج بأمان، نسخة مطابقة للإنتاج بموارد أقل |
| Production | البيئة الحيّة للمستخدمين — سيرفر Ubuntu                         |

## البنية التحتية المقترحة (MVP)

- **الاستضافة (App)**: سيرفر Ubuntu (VPS/Cloud VM)، يُشغَّل عبر Docker أو مباشرة عبر PM2/systemd. القرار النهائي (Docker vs عملية مباشرة) يُحدَّد في `phase_08` حسب موارد السيرفر الفعلية، لكن يجب ألا يفرض قفلًا (Vendor lock-in) على طبقات DB/Queue/Storage (`04_NON_FUNCTIONAL_REQUIREMENTS.md`).
- **قاعدة البيانات**: PostgreSQL على نفس السيرفر أو مُدار (Managed) — نسخ احتياطي تلقائي إلزامي بغض النظر عن الخيار.
- **Redis**: على نفس السيرفر أو Container مخصص، يخدم Cache + BullMQ Queue.
- **Object Storage**: أي مزود متوافق مع S3 API (`06_TECH_STACK.md`).
- **Workers**: عملية منفصلة (Process) عن Next.js الرئيسي لتشغيل BullMQ Workers، قابلة للتوسع أفقيًا بشكل مستقل عن الـ Web process.

## التشغيل عبر Opencode على السيرفر

هذا المشروع مُصمَّم ليُبنى بالكامل على سيرفر Ubuntu عبر `opencode` CLI (راجع `README.md` وسكربت `run-opencode-pipeline.sh` بجذر المشروع):

1. نقل مجلد المشروع (`docs/`, `prompts/`, `README.md`, `run-opencode-pipeline.sh`) إلى السيرفر.
2. تثبيت `opencode` وتسجيل الدخول (`opencode auth login`) على السيرفر نفسه.
3. تشغيل `./run-opencode-pipeline.sh` من جذر المشروع على السيرفر — تُنفَّذ كل المراحل بالترتيب مع توقف للمراجعة بعد كل مرحلة.
4. تثبيت Node.js (LTS)، pnpm، Docker/Docker Compose، PostgreSQL client، على السيرفر قبل بدء `phase_01` (يُتحقق من ذلك كخطوة أولى في `phase_01.md`).

## CI/CD (GitHub Actions)

Pipeline لكل Pull Request:

1. Install dependencies (`pnpm install`).
2. Lint (`eslint`).
3. Type check (`tsc --noEmit`).
4. Unit + Integration tests (`19_TESTING.md`).
5. Build (`next build`) للتأكد من عدم وجود أخطاء بناء.

Pipeline عند الدمج في `main`:

6. نشر تلقائي إلى Staging (على نفس السيرفر أو سيرفر منفصل).
7. نشر إلى Production يتطلب موافقة يدوية (Manual approval gate) في MVP، حتى يثبت الفريق ثقة كافية بالـ Pipeline للانتقال لنشر تلقائي كامل.

## Migrations

- كل تغيير على `schema.prisma` يُرافقه ملف Migration (`prisma migrate dev` محليًا، `prisma migrate deploy` في CI/CD قبل تشغيل النسخة الجديدة).
- ممنوع تعديل قاعدة بيانات الإنتاج يدويًا خارج نظام الـ Migrations تحت أي ظرف.

## متغيرات البيئة (Environment Variables) — الحد الأدنى

```
DATABASE_URL=
REDIS_URL=
BETTER_AUTH_SECRET=
GOOGLE_OAUTH_CLIENT_ID=
GOOGLE_OAUTH_CLIENT_SECRET=
S3_ENDPOINT=
S3_ACCESS_KEY=
S3_SECRET_KEY=
S3_BUCKET=
NEXT_PUBLIC_APP_URL=
PAYMENT_PROVIDER_SECRET_KEY=
```

القائمة الكاملة والنهائية تُحدَّث أثناء التنفيذ الفعلي في `.env.example` بالمشروع.

## المراقبة (Monitoring) — الحد الأدنى لـ MVP

- تسجيل مركزي للأخطاء (Structured logs)، مع أداة تجميع أساسية (يمكن البدء بحل مفتوح المصدر ذاتي الاستضافة أو خدمة خارجية خفيفة).
- تنبيه (Alert) عند: ارتفاع نسبة فشل Jobs في Queue فوق عتبة، توقف الاتصال بقاعدة البيانات، ارتفاع زمن استجابة API فوق عتبة (`04_NON_FUNCTIONAL_REQUIREMENTS.md`).
- صفحة Health check (`/api/health`) تفحص اتصال DB وRedis، تُستخدم من أداة المراقبة/السيرفر.

## النسخ الاحتياطي (Backups)

- نسخ احتياطي يومي تلقائي لقاعدة البيانات، مع اختبار استعادة (Restore drill) دوري (يدوي في MVP، لا يقل عن مرة كل ربع).
- الاحتفاظ بالنسخ الاحتياطية لا يقل عن 14 يومًا في الإنتاج.
- **نسخ احتياطي دوري لمجلد المشروع نفسه (بما فيه `docs/` و`prompts/`) خارج السيرفر** — لتفادي فقدان الوثائق أو الكود بسبب عملية سكافولد أو تنظيف تلقائي (درس مستفاد: تأكد أن أي أداة scaffolding —مثل إعداد Next.js— لا تُشغَّل داخل مجلد يحتوي ملفات موجودة أصلاً دون تأكيد صريح).

## استراتيجية التوسع (لاحقًا، ليس MVP)

توسع أفقي لعمليات Workers أولاً (أكثر عرضة للضغط مع نمو عدد التحليلات)، ثم Web process، مع الإبقاء على قاعدة بيانات ونسخة Redis واحدة موحّدة حتى يثبت الحمل الفعلي حاجة للتقسيم (Sharding/Read replicas) — لا تحسين مبكر غير ضروري.
