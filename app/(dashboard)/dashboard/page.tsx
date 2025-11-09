'use client'

import Link from 'next/link';
import {
  BookMarked,
  Brain,
  FileCheck,
  FileText,
  Languages,
  Mail,
  MessageSquare,
  ScrollText,
  Sparkles,
  Wand2,
} from 'lucide-react';

const creationCards = [
  {
    title: 'מאמרים מקצועיים',
    description: 'כתיבה ושיפור מאמרים בעברית טבעית עם אופטימיזציה מתקדמת.',
    icon: FileText,
    href: '/dashboard/articles',
    gradient: 'from-sky-500 via-sky-600 to-indigo-600',
  },
  {
    title: 'תסריטים ומצגות',
    description: 'בניית תסריטים לסרטונים, וובינרים ופודקאסטים עם סיפור זורם.',
    icon: MessageSquare,
    href: '/dashboard/scripts',
    gradient: 'from-violet-500 via-purple-500 to-purple-600',
  },
  {
    title: 'מיילים מקצועיים',
    description: 'כתיבה, מענה ושיפור מיילים עסקיים ואישיים.',
    icon: Mail,
    href: '/dashboard/emails',
    gradient: 'from-emerald-500 via-green-500 to-teal-600',
  },
  {
    title: 'פוסטים חברתייים',
    description: 'תוכן לרשתות חברתיות, קריא וממיר.',
    icon: MessageSquare,
    href: '/dashboard/posts',
    gradient: 'from-pink-500 via-rose-500 to-fuchsia-600',
  },
  {
    title: 'סיפורים ויצירה',
    description: 'כתיבה יצירתית, סיפורים קצרים וסדרות תוכן.',
    icon: FileText,
    href: '/dashboard/stories',
    gradient: 'from-orange-500 via-amber-500 to-yellow-500',
  },
  {
    title: 'סיכומים מדויקים',
    description: 'סיכום מסמכים, מאמרים ותמלולים לרעיונות עיקריים.',
    icon: FileCheck,
    href: '/dashboard/summaries',
    gradient: 'from-indigo-500 via-indigo-600 to-slate-700',
  },
  {
    title: 'פרוטוקולים רשמיים',
    description: 'הפיכת תמלולים לפרוטוקולים מקצועיים וברורים.',
    icon: ScrollText,
    href: '/dashboard/protocols',
    gradient: 'from-teal-500 via-cyan-500 to-sky-500',
  },
  {
    title: 'דפי עבודה מודפסים',
    description: 'יצירת דפי עבודה להדפסה לפי כיתה ומקצוע.',
    icon: FileCheck,
    href: '/dashboard/worksheets',
    gradient: 'from-amber-500 via-orange-500 to-rose-500',
  },
  {
    title: 'תרגום חכם',
    description: 'תרגום טקסטים והנחיות בגרסה עברית טבעית ומותאמת.',
    icon: Languages,
    href: '/dashboard/prompts',
    gradient: 'from-purple-500 via-indigo-500 to-blue-500',
  },
];

const learningCards = [
  {
    title: 'תיקון כתיבת AI',
    description: 'תקני טקסטים שנוצרו ב-AI והמערכת תלמד את הבחירות שלך.',
    icon: Brain,
    href: '/dashboard/ai-correction',
    gradient: 'from-indigo-500 via-purple-500 to-pink-500',
  },
  {
    title: 'מילון מילים נרדפות',
    description: 'צרי מילון אישי של ניסוחים חלופיים ומילים אהובות.',
    icon: BookMarked,
    href: '/dashboard/synonyms',
    gradient: 'from-teal-500 via-emerald-500 to-lime-500',
  },
  {
    title: 'למידת טקסטים',
    description: 'הזיני טקסטים מורכבים והמערכת תאומץ לסגנון שלך.',
    icon: ScrollText,
    href: '/dashboard/learn',
    gradient: 'from-fuchsia-500 via-rose-500 to-orange-500',
  },
  {
    title: 'למידת פתגמים',
    description: 'הוסיפי פתגמים ומטבעות לשון שהמערכת תדע להשתמש בהם.',
    icon: Languages,
    href: '/dashboard/idioms',
    gradient: 'from-blue-500 via-sky-500 to-cyan-500',
  },
];

export default function DashboardPage() {
  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <header className="sticky top-0 z-30 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-2 text-indigo-600">
            <Wand2 className="h-5 w-5" />
            <span className="text-sm font-semibold sm:text-base">כתיבה בעברית</span>
          </div>
          <Link
            href="/dashboard/ai-correction"
            className="rounded-full bg-indigo-600 px-4 py-2 text-xs font-medium text-white shadow-sm transition hover:bg-indigo-700"
          >
            התחילי לתקן
          </Link>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="mt-8 rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-8 text-white shadow-2xl sm:p-12">
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
              עוזר הכתיבה החכם שלך בעברית טבעית
            </h1>
            <p className="text-sm text-white/85 sm:text-base">
              כתיבה, תיקון ולמידה של מאמרים, מיילים, פוסטים וסיפורים בעברית תקנית. כל תיקון שלך נשמר והמערכת משתפרת בכל שימוש – כך שהתוכן הבא ירגיש כבר שלך.
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

        <section className="mt-14 space-y-5">
          <div className="flex items-center justify-between text-slate-900">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">יצירת תוכן</h2>
              <p className="text-xs text-slate-500 sm:text-sm">כל כלי מופיע פעם אחת בלבד – בחרי ויצאנו לדרך.</p>
            </div>
            <Sparkles className="hidden h-5 w-5 text-indigo-400 sm:block" aria-hidden />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {creationCards.map(({ title, description, icon: Icon, href, gradient }) => (
              <Link
                key={href}
                href={href}
                className={`group flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${gradient} p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100`}
              >
                <div className="flex items-center gap-3 text-white">
                  <span className="flex h-10 w-10 items-center justify-center rounded-2xl bg-white/20 text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white transition group-hover:gap-2">
                  כניסה לכלי
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-5">
          <div className="flex items-center justify-between text-slate-900">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">מערכת הלמידה</h2>
              <p className="text-xs text-slate-500 sm:text-sm">כאן המערכת מאמצת את הסגנון האישי שלך.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {learningCards.map(({ title, description, icon: Icon, href, gradient }) => (
              <Link
                key={href}
                href={href}
                className={`group flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${gradient} p-5 shadow-lg transition hover:-translate-y-1 hover:shadow-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/70 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-100`}
              >
                <div className="flex items-center gap-3 text-white">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-white">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-white transition group-hover:gap-2">
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