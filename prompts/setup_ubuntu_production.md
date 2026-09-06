# مهمة تشغيل TikTok Intelligence على Ubuntu وربطه بـ Vercel

أنت تعمل على خادم Ubuntu الخاص بالشركة. المطلوب إكمال نشر مشروع
`ZER-DAY/Tiktok-VIP` بأمان بحيث تعمل واجهة Vercel والمصادقة والطابور والـworker معًا.

## النتيجة المطلوبة

- يبقى تطبيق Next.js وواجهات API منشورة على Vercel عبر:
  `https://tiktok-vip-six.vercel.app`
- يعمل BullMQ worker بصورة دائمة على خادم Ubuntu.
- يستخدم Vercel وخادم Ubuntu نفس PostgreSQL ونفس Redis المُدارين.
- يعمل التسجيل وتسجيل الدخول، ويعيد المستخدم إلى صفحة الدفع بعد المصادقة.
- لا تُعرض أي قيمة سرية في الطرفية أو الرد النهائي.

## قواعد أمان إلزامية

1. لا تضع أي سر داخل Git أو GitHub أو متغير يبدأ بـ `NEXT_PUBLIC_`.
2. لا تطبع محتوى `.env.worker` ولا قيم `DATABASE_URL` أو `REDIS_URL` أو مفاتيح Paymob.
3. لا تفتح المنافذ `5432` أو `6379` على الراوتر أو الإنترنت.
4. لا تستخدم PostgreSQL أو Redis محليين للربط مع Vercel. يجب أن تكون الروابط لخدمات مُدارة ومتاحة باتصال TLS صادر.
5. يجب أن يبدأ رابط Redis المباشر بـ `redis://` أو `rediss://`، وليس رابط Upstash REST.
6. لا تستخدم `git reset --hard` ولا تحذف بيانات أو volumes.

## خطوات التنفيذ

1. حدّد مسار نسخة المشروع الحالية ثم افحصها:

   ```bash
   git status --short
   git remote -v
   git branch --show-current
   ```

2. إذا كانت هناك تغييرات محلية، لا تستبدلها. اعرض ملخصًا عنها وتوقف قبل السحب إن كانت تتعارض مع التحديث. إذا كانت الشجرة نظيفة:

   ```bash
   git fetch origin main
   git pull --ff-only origin main
   ```

3. تأكد من وجود `.env.worker` ومن أسماء المتغيرات فقط، من دون طباعة قيمها. يجب أن يتضمن على الأقل:

   ```dotenv
   DATABASE_URL=<نفس PostgreSQL المستخدم في Vercel>
   REDIS_URL=<نفس Redis المباشر المستخدم في Vercel>
   NEXT_PUBLIC_APP_URL=https://tiktok-vip-six.vercel.app
   DISABLE_WORKERS=false
   ALLOW_LOCAL_SERVICES=false
   ```

4. افحص الاتصال بالخدمات من خلال أدوات المشروع، من دون إظهار الروابط السرية.

5. ابنِ صورة الـworker من آخر commit أولًا، ثم طبّق migrations على قاعدة الإنتاج المشتركة، وخصوصًا migration الخاصة بـ Better Auth:

   ```bash
   docker compose -f docker-compose.worker.yml build worker
   docker compose -f docker-compose.worker.yml run --rm --entrypoint sh worker -lc \
     "./node_modules/.bin/prisma migrate deploy"
   ```

6. شغّل الـworker:

   ```bash
   docker compose -f docker-compose.worker.yml up -d worker
   docker compose -f docker-compose.worker.yml ps
   docker compose -f docker-compose.worker.yml logs --tail=150 worker
   ```

7. يجب ألا تحتوي السجلات على `ECONNREFUSED` أو أخطاء Prisma أو Redis. لا تعتبر الرسائل التحذيرية العادية فشلًا إذا كان فحص worker سليمًا.

8. راجع متغيرات Vercel التالية من لوحة Vercel أو CLI المصرّح به، من دون طباعة قيم الأسرار:

   - `DATABASE_URL`
   - `REDIS_URL`
   - `BETTER_AUTH_SECRET` (قيمة ثابتة وآمنة بطول 32 حرفًا على الأقل)
   - `BETTER_AUTH_URL=https://tiktok-vip-six.vercel.app`
   - `NEXT_PUBLIC_APP_URL=https://tiktok-vip-six.vercel.app`

   يجب تطبيقها على Production. لا تغيّر `BETTER_AUTH_SECRET` إذا كانت هناك جلسات إنتاج فعّالة إلا عند الضرورة.

9. إذا كان Vercel CLI مسجل الدخول ومربوطًا بالمشروع الصحيح، أعد نشر `main` إلى Production. لا تنشئ مشروع Vercel جديدًا ولا تغيّر الدومين. إن لم يكن CLI مصرحًا، توقف وأبلغ المستخدم أن عليه تنفيذ Redeploy من لوحة Vercel.

10. تحقّق بعد نجاح النشر:

    ```bash
    curl -fsS https://tiktok-vip-six.vercel.app/api/health
    curl -sS -o /dev/null -w '%{http_code}\n' \
      https://tiktok-vip-six.vercel.app/api/auth/get-session
    ```

    النتيجة المطلوبة: الصحة `healthy` ومسار الجلسة يرجع HTTP `200` حتى عندما لا توجد جلسة.

11. أنشئ حساب اختبار عادي من صفحة التسجيل، ثم تحقّق من تسجيل الدخول والوصول إلى:

    `https://tiktok-vip-six.vercel.app/ar/dashboard/billing`

12. في التقرير النهائي اذكر فقط:

    - commit المنشور.
    - حالة migrations.
    - حالة worker.
    - نتائج `/api/health` و`/api/auth/get-session`.
    - أي خطوة تحتاج تدخل المستخدم.

لا تعرض كلمات مرور أو مفاتيح أو روابط اتصال قاعدة البيانات وRedis في التقرير.
