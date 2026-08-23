# Fix — Docker Build & Deployment Issues

هذا برومبت تشخيص وإصلاح، وليس مرحلة جديدة من docs/20_PROJECT_ROADMAP.md. الهدف: جعل docker compose up -d ينجح بالكامل والتطبيق يعمل فعليًا على localhost:3000 مع /api/health ناجح — دون المساس بأي معمارية أو ميزة موثّقة في docs/.

## القاعدة

اتّبع نفس قواعد master_prompt.md (لا ارتجال معماري، لا تغيير في docs/ إلا لتوثيق سبب فعلي، لا حذف لملفات docs/prompts/). هذا العمل إصلاح بنية بناء/نشر (Build & Deployment configuration) فقط، ليس تغييرًا وظيفيًا.

## خطوات العمل

1. شغّل docker compose build --no-cache app (أو اسم خدمة التطبيق الفعلي في docker-compose.yml) والتقط الخرج كاملاً.
2. إن فشل البناء، شخّص السبب الجذري من رسالة الخطأ الفعلية (لا تخمّن) وأصلحه. مشاكل معروفة يجب التحقق منها والتعامل معها إن وُجدت:
   - husky يفشل داخل Docker برسالة شبيهة بـ ".git can't be found": أضف ENV HUSKY=0 في كل مرحلة (FROM node...) بالـ Dockerfile، لأن husky غير مطلوب أصلاً داخل بيئة بناء/تشغيل الحاوية.
   - [ERR_PNPM_IGNORED_BUILDS]: pnpm الحديث يتجاهل build/postinstall scripts للحزم الأصلية (Prisma، swc، esbuild وغيرها) لأسباب أمنية افتراضيًا. أضف حقل pnpm.onlyBuiltDependencies في package.json يتضمن كل الحزم المذكورة بالتحذير (خصوصًا @prisma/client وprisma — إن لم يُسمح لهما بالبناء فـ Prisma Client لن يعمل وقت التشغيل رغم نجاح البناء ظاهريًا).
   - عدم توافق نسخة Node مع pnpm (ERR_UNKNOWN_BUILTIN_MODULE، node:sqlite غير موجود): تأكد أن نسخة node في الـ Dockerfile (كل المراحل) متوافقة مع نسخة pnpm التي يُفعّلها corepack — الأفضل تثبيت نسخة pnpm محددة صراحة (وليس pnpm@latest) تطابق نسخة Node المستخدمة، أو رفع نسخة Node لأحدث LTS متوافقة.
   - أي خطأ آخر غير مذكور هنا: شخّصه من نص الخطأ الفعلي وأصلحه بأقل تغيير ممكن، موثّقًا السبب في رسالتك.
3. أعد تشغيل docker compose build --no-cache app بعد كل إصلاح، وكرّر حتى ينجح البناء بالكامل من الصفر.
4. شغّل docker compose up -d وتأكد أن كل الخدمات (db, redis, app) بحالة Up/healthy عبر docker compose ps.
5. شغّل prisma migrate deploy و(إن لزم) prisma db seed داخل الحاوية أو كخطوة نشر منفصلة، وتأكد أنها تنجح.
6. تحقق فعليًا (وليس افتراضًا):
   - curl http://localhost:3000/api/health يرجع حالة ناجحة فعلية لاتصال DB وRedis.
   - curl -s http://localhost:3000 | grep -o 'dir="rtl"' يُظهر أن الصفحة الرئيسية تُخرج عربي RTL فعليًا (docs/16_UI_UX.md).
7. تحقق أن لا تراجع (Regression) حصل: أي متغير بيئة أو ملف حذفته/عدّلته أثناء الإصلاح موثّق بوضوح في ردّك، ولم يُغيَّر أي سلوك وظيفي موثّق في docs/.

## ممنوع

- ممنوع حذف docs/ أو prompts/ أو README.md أو أي محتوى غير متعلق بمشكلة البناء.
- ممنوع تعطيل اختبارات أو Type checking أو ESLint لمجرد تجاوز الخطأ (docs/19_TESTING.md، master_prompt.md معايير الجودة) — الإصلاح يجب أن يكون جذريًا لا تحايلًا.
- ممنوع تغيير معمارية قاعدة البيانات أو الـ API بدون داعٍ متعلق فعليًا بمشكلة البناء.

## عند الانتهاء

قدّم: (1) قائمة دقيقة بكل ملف عدّلته والسبب، (2) نص أوامر التحقق الفعلية ونتائجها (docker compose ps، /api/health، dir="rtl")، (3) تأكيد أن docker compose up -d ينجح من الصفر (docker compose down -v && docker compose up -d --build) بدون تدخل يدوي إضافي.
