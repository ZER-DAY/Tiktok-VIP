"use client";

import "./globals.css";

// Last-resort boundary: replaces the root layout entirely, so it must render
// <html>/<body> itself.
export default function GlobalError({ reset }: { error: Error; reset: () => void }) {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <main className="grid min-h-screen place-items-center bg-background px-6 py-16">
          <div className="w-full max-w-md text-center">
            <h1 className="text-2xl font-black text-foreground">حدث خطأ غير متوقع</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              لم نتمكن من تحميل الصفحة. جرّب مرة أخرى، وإن تكرر الأمر تواصل معنا.
            </p>
            <button
              type="button"
              onClick={reset}
              className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 font-bold text-brand-foreground transition hover:bg-brand/90"
            >
              إعادة المحاولة
            </button>
          </div>
        </main>
      </body>
    </html>
  );
}
