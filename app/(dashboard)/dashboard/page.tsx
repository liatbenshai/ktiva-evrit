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
  CheckCircle2,
  ArrowRight,
  PenLine,
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
    <div dir="rtl" className="min-h-screen bg-gradient-to-b from-indigo-50 via-white to-purple-50">
      <header className="sticky top-0 z-40 border-b border-white/40 bg-white/80 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <Wand2 className="h-5 w-5" />
            <span className="text-base font-semibold">כתיבה בעברית</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/ai-correction"
              className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-500 to-indigo-500 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
            >
              <Brain className="h-4 w-4" />
              התחילי לתקן
            </Link>
            <Link
              href="/dashboard/articles"
              className="hidden items-center gap-2 rounded-full border border-indigo-200 bg-white px-4 py-2 text-sm font-semibold text-indigo-600 transition hover:border-indigo-300 hover:text-indigo-700 sm:inline-flex"
            >
              <PenLine className="h-4 w-4" />
              התחילי לכתוב
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="mt-8 rounded-4xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-2xl sm:p-12">
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] sm:items-center">
            <div className="space-y-5 text-center sm:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1 text-xs font-semibold uppercase tracking-wide text-white/90 sm:text-sm">
                <Sparkles className="h-4 w-4" /> פלטפורמת כתיבה צבעונית בעברית
              </span>
              <h1 className="text-3xl font-bold leading-tight sm:text-4xl">
                כל התוכן שלך – כתיבה, תסריטים וסיפורים – בעברית טבעית ומבריקה
              </h1>
              <p className="text-sm text-white/85 sm:text-base">
                בחרי כלי וצללי פנימה: מאמרים, מיילים, פוסטים, סיפורים ודפי עבודה. כל שינוי שלך נשמר והמערכת ממשיכה ללמוד את ההעדפות שלך.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/dashboard/ai-correction"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:text-purple-500"
                >
                  <Brain className="h-4 w-4" />
                  להתחיל בתיקון חכם
                </Link>
                <Link
                  href="/dashboard/articles"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-white/60 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
                >
                  <PenLine className="h-4 w-4" />
                  להתחיל בכתיבה
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-4 text-xs text-white/85 sm:justify-end sm:text-sm">
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" /> שומרת כל דפוס ותיקון
                </span>
                <span className="inline-flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-200" /> מנגישה מילים נרדפות ולמידה אישית
                </span>
              </div>
            </div>
            <div className="grid gap-4 sm:gap-6">
              <div className="rounded-3xl bg-white/90 p-5 text-indigo-700 shadow-lg backdrop-blur">
                <h2 className="text-base font-semibold">נקודת פתיחה מהירה</h2>
                <p className="mt-1 text-sm text-indigo-500">הכלים הכי פופולריים לפתיחה מהירה</p>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'תיקון AI', href: '/dashboard/ai-correction', icon: Brain, tint: 'from-purple-500 to-indigo-500' },
                    { label: 'מאמר חדש', href: '/dashboard/articles', icon: FileText, tint: 'from-sky-500 to-indigo-500' },
                    { label: 'תסריט ווידאו', href: '/dashboard/scripts', icon: MessageSquare, tint: 'from-rose-500 to-orange-500' },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`group flex items-center justify-between rounded-2xl bg-gradient-to-r ${item.tint} px-3 py-2 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:shadow-lg`}
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-white/80 transition group-hover:translate-x-0.5" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-3xl bg-white/90 p-5 text-indigo-700 shadow-lg backdrop-blur">
                <h3 className="text-sm font-semibold">מה חדש בפלטפורמה?</h3>
                <ul className="mt-3 space-y-2 text-sm text-indigo-500">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" /> גרסאות חלופיות צבעוניות בכל כלי
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" /> שמירת דפוסים מיידית מתוך כל מסך
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-purple-500" /> חוויית מובייל מותאמת ואינטואיטיבית
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-2 text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">כלי יצירת תוכן</h2>
              <p className="text-sm text-indigo-500">בחירה במהירות – כל כרטיס פותח כלי מלא וצבעוני.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {creationCards.map(({ title, description, icon: Icon, href, gradient }) => (
              <Link
                key={href}
                href={href}
                className={`group flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-100`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-white/25">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white/95 transition group-hover:gap-2">
                  כניסה לכלי
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 space-y-6">
          <div className="flex flex-col gap-2 text-indigo-900 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-semibold">מערכת הלמידה האישית</h2>
              <p className="text-sm text-indigo-500">המערכת מבינה את התיקונים שלך ויישמת אותם בכל הכלים.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {learningCards.map(({ title, description, icon: Icon, href, gradient }) => (
              <Link
                key={href}
                href={href}
                className={`group flex h-full flex-col justify-between rounded-3xl bg-gradient-to-br ${gradient} p-6 text-white shadow-lg transition hover:-translate-y-1 hover:shadow-2xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/80 focus-visible:ring-offset-2 focus-visible:ring-offset-purple-100`}
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/25">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-lg font-semibold">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-white/90">{description}</p>
                <span className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-white/95 transition group-hover:gap-2">
                  המשיכי מכאן
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-18 rounded-4xl bg-gradient-to-br from-purple-500 via-indigo-500 to-blue-500 px-6 py-10 text-center text-white shadow-2xl sm:px-10 sm:py-14">
          <h2 className="text-2xl font-semibold sm:text-3xl">מוכנה לכתוב בעברית שתעשה וואו?</h2>
          <p className="mt-2 text-sm text-white/85 sm:text-base">
            הצטרפי לאלפי כותבים שנהנים מחוויית כתיבה צבעונית, נוחה ומותאמת אישית.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard/ai-correction"
              className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-lg transition hover:-translate-y-0.5 hover:text-purple-500"
            >
              להתחיל בתיקון
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/articles"
              className="inline-flex items-center gap-2 rounded-full bg-white/15 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/25"
            >
              לעבור לכתיבה
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}