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
    <div dir="rtl" className="min-h-screen bg-slate-50">
      <header className="sticky top-0 z-40 border-b border-slate-200/60 bg-white/90 backdrop-blur">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-4 py-3 sm:py-4">
          <Link href="/dashboard" className="flex items-center gap-2 text-indigo-600 hover:text-indigo-700">
            <Wand2 className="h-5 w-5" />
            <span className="text-base font-semibold">כתיבה בעברית</span>
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/dashboard/ai-correction"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
            >
              <Brain className="h-4 w-4" />
              התחילי לתקן
            </Link>
            <Link
              href="/dashboard/articles"
              className="hidden items-center gap-2 rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700 sm:inline-flex"
            >
              <PenLine className="h-4 w-4" />
              התחילי לכתוב
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-6xl px-4 pb-16">
        <section className="mt-8 rounded-3xl border border-indigo-100/70 bg-gradient-to-br from-white via-indigo-50/60 to-blue-50/60 p-6 shadow-sm sm:p-10">
          <div className="grid gap-8 sm:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] sm:items-center">
            <div className="space-y-4 text-center sm:text-right">
              <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-semibold text-indigo-600 shadow-sm sm:text-sm">
                <Sparkles className="h-4 w-4" /> ניהול כל התוכן בעברית מושלמת
              </span>
              <h1 className="text-3xl font-bold leading-tight text-slate-900 sm:text-4xl">
                הכלי שמחבר כתיבה, תיקון ולמידה בעברית אחת
              </h1>
              <p className="text-sm text-slate-600 sm:text-base">
                בחרי את הכלי המתאים ברגע – כתיבה של מאמרים ומיילים, יצירת תסריטים ופוסטים, או מערכת למידה שמבינה את הסגנון האישי שלך.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row sm:justify-end">
                <Link
                  href="/dashboard/ai-correction"
                  className="inline-flex items-center justify-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:-translate-y-0.5 hover:bg-indigo-700 hover:shadow-lg"
                >
                  <Brain className="h-4 w-4" />
                  להתחיל בתיקון
                </Link>
                <Link
                  href="/dashboard/articles"
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-slate-200 bg-white px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
                >
                  <PenLine className="h-4 w-4" />
                  להתחיל בכתיבה
                </Link>
              </div>
              <div className="flex flex-wrap justify-center gap-4 sm:justify-end">
                <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  זוכרת כל תיקון והעדפה
                </div>
                <div className="flex items-center gap-2 text-xs text-slate-500 sm:text-sm">
                  <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                  כתיבה טבעית בעברית ללא מאמץ
                </div>
              </div>
            </div>
            <div className="grid gap-4 sm:gap-5">
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm sm:p-6">
                <h2 className="text-base font-semibold text-slate-900 sm:text-lg">התחלה מהירה</h2>
                <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  {[
                    { label: 'תיקון AI', href: '/dashboard/ai-correction', icon: Brain },
                    { label: 'מאמר חדש', href: '/dashboard/articles', icon: FileText },
                    { label: 'תסריט ווידאו', href: '/dashboard/scripts', icon: MessageSquare },
                  ].map((item) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="group flex items-center justify-between rounded-xl border border-slate-200 px-3 py-2 text-sm font-medium text-slate-600 transition hover:border-indigo-200 hover:text-indigo-600"
                    >
                      <span className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        {item.label}
                      </span>
                      <ArrowRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-indigo-500" />
                    </Link>
                  ))}
                </div>
              </div>
              <div className="rounded-2xl border border-white/70 bg-white/80 p-4 shadow-sm sm:p-6">
                <h3 className="text-sm font-semibold text-slate-900">מה חדש?</h3>
                <ul className="mt-3 space-y-2 text-xs text-slate-600 sm:text-sm">
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    שמרי דפוסים מהירים בכל כלי כתיבה
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    מענה אוטומטי למילים נרדפות וגרסאות חלופיות
                  </li>
                  <li className="flex items-center gap-2">
                    <Sparkles className="h-4 w-4 text-indigo-400" />
                    חוויית מובייל חדשה ונוחה לשימוש
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between text-slate-900">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">כלי יצירת תוכן</h2>
              <p className="text-xs text-slate-500 sm:text-sm">כל מה שצריך לכתוב בעברית מקצועית במקום אחד.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {creationCards.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 text-slate-900">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-500">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2">
                  כניסה לכלי
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-6">
          <div className="flex items-center justify-between text-slate-900">
            <div>
              <h2 className="text-lg font-semibold sm:text-xl">מערכת הלמידה האישית</h2>
              <p className="text-xs text-slate-500 sm:text-sm">המערכת מאמצת את הבחירות שלך בכלי התיקון והסינונים.</p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {learningCards.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col justify-between rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-lg"
              >
                <div className="flex items-center gap-3 text-slate-900">
                  <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-emerald-50 text-emerald-500">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h3 className="text-base font-semibold sm:text-lg">{title}</h3>
                </div>
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 transition group-hover:gap-2">
                  המשיכי מכאן
                  <ArrowRight className="h-4 w-4" />
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-16 rounded-3xl border border-slate-200 bg-white px-6 py-8 text-center shadow-sm sm:px-10 sm:py-12">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">מוכנה להתחיל כתיבה חכמה בעברית?</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            הצטרפי לאלפי כותבים שכבר שדרגו את התהליכים שלהם עם מערכת שמבינה עברית טבעית ומותאמת אישית.
          </p>
          <div className="mt-6 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Link
              href="/dashboard/ai-correction"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition hover:bg-indigo-700"
            >
              להתחיל בתיקון
              <ArrowRight className="h-4 w-4" />
            </Link>
            <Link
              href="/dashboard/articles"
              className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-600 transition hover:border-slate-300 hover:text-slate-700"
            >
              לעבור לכתיבה
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}