import Link from "next/link";
import "./globals.css";

// The root layout is a passthrough (locale layouts own <html>/<body>), so any
// route outside /[locale] — every unmatched URL — has to supply them itself.
// Without this, a 404 threw "Missing <html> and <body> tags in the root layout".
export default function RootNotFound() {
  return (
    <html lang="ar" dir="rtl">
      <body className="antialiased">
        <main className="grid min-h-screen place-items-center bg-background px-6 py-16">
          <div className="w-full max-w-md text-center">
            <p className="font-mono text-sm font-bold tracking-[0.2em] text-brand">404</p>
            <h1 className="mt-4 text-2xl font-black text-foreground">الصفحة غير موجودة</h1>
            <p className="mt-3 text-sm leading-7 text-muted-foreground">
              الرابط الذي فتحته غير صحيح أو تم حذف الصفحة.
            </p>
            <Link
              href="/ar"
              className="mt-7 inline-flex h-12 items-center justify-center rounded-xl bg-brand px-6 font-bold text-brand-foreground transition hover:bg-brand/90"
            >
              العودة للرئيسية
            </Link>
          </div>
        </main>
      </body>
    </html>
  );
}
