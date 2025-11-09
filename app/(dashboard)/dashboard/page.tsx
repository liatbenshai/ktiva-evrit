'use client'

import Link from 'next/link';
import {
  BookMarked,
  Brain,
  FileCheck,
  FileText,
  Mail,
  MessageSquare,
  ScrollText,
  Sparkles,
  Wand2,
} from 'lucide-react';

const creationCards = [
  {
    title: 'מאמרים מקצועיים',
    description: 'הפקת מאמרים עם עברית טבעית ואופטימיזציה מלאה לקידום אורגני.',
    icon: FileText,
    href: '/dashboard/articles',
  },
  {
    title: 'תסריטים ומצגות',
    description: 'בניית תסריטים לסרטונים, וובינרים ופודקאסטים בשפה רהוטה.',
    icon: MessageSquare,
    href: '/dashboard/scripts',
  },
  {
    title: 'מיילים ותגובות',
    description: 'כתיבה, שיפור ומענה למיילים עסקיים ואישיים.',
    icon: Mail,
    href: '/dashboard/emails',
  },
  {
    title: 'דפי עבודה וסיכומים',
    description: 'יצירת דפי עבודה להדפסה, סיכומי פגישות ופרוטוקולים.',
    icon: FileCheck,
    href: '/dashboard/worksheets',
  },
];

const learningCards = [
  {
    title: 'תיקון כתיבת AI',
    description: 'תקני טקסטים שנוצרו ב-AI ותני למערכת ללמוד מהתיקונים שלך.',
    icon: Brain,
    href: '/dashboard/ai-correction',
  },
  {
    title: 'מילון מילים נרדפות',
    description: 'צרי מילון אישי של ניסוחים חלופיים ומשפרי סגנון.',
    icon: BookMarked,
    href: '/dashboard/synonyms',
  },
  {
    title: 'למידת טקסטים אישיים',
    description: 'הזיני טקסטים מורכבים או פתגמים והמערכת תאומץ לסגנון שלך.',
    icon: ScrollText,
    href: '/dashboard/learn',
  },
];

export default function DashboardPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-white">
      <header className="sticky top-0 z-30 border-b border-indigo-100/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wand2 className="h-5 w-5" />
            <span className="text-sm font-semibold sm:text-base">כתיבה בעברית</span>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/dashboard/ai-correction"
              className="hidden rounded-full border border-indigo-200 px-4 py-2 text-xs font-medium text-indigo-600 transition hover:border-indigo-300 hover:bg-indigo-50 sm:inline-flex"
            >
              התחל/י לתקן
            </Link>
            <Link
              href="/dashboard/posts"
              className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
            >
              התחיל/י לכתוב
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="mt-6 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-xl sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              עוזר הכתיבה החכם שלך בעברית טבעית
            </h1>
            <p className="text-sm text-white/90 sm:text-base">
              כתיבה, תיקון ולמידה של מאמרים, מיילים, פוסטים, סיפורים ופרוטוקולים בעברית תקנית. כל תיקון שלך נשמר – והמערכת משתפרת עבורך בכל שימוש.
            </p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link
                href="/dashboard/ai-correction"
                className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:shadow-xl"
              >
                התחילי תיקון עכשיו
                <span aria-hidden>→</span>
              </Link>
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center justify-center gap-2 rounded-full border border-white/70 px-6 py-3 text-sm font-semibold text-white transition hover:border-white hover:bg-white/10"
              >
                צרי תוכן חדש
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">יצירת תוכן</h2>
              <p className="text-xs text-slate-500 sm:text-sm">בחרי כלי אחד והתחילי – אין הפניות כפולות או קיצורים מיותרים.</p>
            </div>
            <Sparkles className="hidden h-5 w-5 text-indigo-400 sm:block" aria-hidden />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {creationCards.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                  כניסה לכלי
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-12 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold text-slate-900 sm:text-xl">מערכת הלמידה</h2>
              <p className="text-xs text-slate-500 sm:text-sm">הכלים שמלמדים את המערכת את הסגנון והקול שלך.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {learningCards.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold text-slate-900">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                  המשיכי מכאן
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}