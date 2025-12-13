'use client'

import Link from 'next/link';
import {
  BookMarked,
  Brain,
  FileCheck,
  FileText,
  Languages,
  Lightbulb,
  Mail,
  MessageSquare,
  RotateCcw,
  ScrollText,
  Search,
  Sparkles,
  Users,
  Wand2,
} from 'lucide-react';
import UserMenu from '@/components/auth/UserMenu';
import { useSession } from 'next-auth/react';

const creationCards = [
  {
    title: 'liatAI',
    description: 'שאלי כל שאלה או כתבי מה את צריכה, ואני אענה בעברית תקנית. אפשר לשאול שאלות המשך.',
    icon: Brain,
    href: '/dashboard/claude-assistant',
    gradient: 'from-indigo-500 via-purple-600 to-pink-600',
  },
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
  {
    title: 'לימוד שפות',
    description: 'מונחים וביטויים בעברית עם מקבילות באנגלית, רומנית ואיטלקית.',
    icon: Languages,
    href: '/dashboard/languages',
    gradient: 'from-teal-500 via-blue-500 to-purple-500',
  },
  {
    title: 'היפוך מסמך עברי',
    description: 'הופך מסמך עברית שנסרק הפוך - הופך כל שורה בנפרד.',
    icon: RotateCcw,
    href: '/dashboard/flip-document',
    gradient: 'from-slate-500 via-gray-500 to-zinc-600',
  },
  {
    title: 'עוזר החלטות לניסוח',
    description: 'עוזר להחלטות בניסוח וסימון - הציגי דילמה ואני אציע לך אפשרויות מעשיות.',
    icon: Lightbulb,
    href: '/dashboard/transcription-guidelines',
    gradient: 'from-yellow-500 via-amber-500 to-orange-500',
  },
  {
    title: 'מחקר מעמיק ברשת',
    description: 'שאל שאלה וקבל מחקר מעמיק עם מידע ממקורות שונים ברשת, כולל הפניות למקורות.',
    icon: Search,
    href: '/dashboard/research',
    gradient: 'from-blue-500 via-indigo-500 to-purple-600',
  },
  {
    title: 'שיפור תוכן',
    description: 'הזיני טקסט ובחרי מקצוע או מטרה, והמערכת תשפר את התוכן בהתאם.',
    icon: Sparkles,
    href: '/dashboard/content-improvement',
    gradient: 'from-emerald-500 via-teal-500 to-cyan-500',
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
  const { data: session, status } = useSession();
  const isAdmin = status === 'authenticated' && session?.user?.email === 'admin@ktiva-evrit.com';

  return (
    <div dir="rtl" className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50">
      <header className="sticky top-0 z-30 border-b border-indigo-100/50 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-4 py-3 sm:py-4">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="flex h-10 w-10 sm:h-12 sm:w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 shadow-lg">
              <Wand2 className="h-5 w-5 sm:h-6 sm:w-6 text-white" />
            </div>
            <span className="text-base sm:text-lg font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              כתיבה בעברית
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            {isAdmin && (
              <Link
                href="/admin/users"
                className="flex items-center gap-1.5 sm:gap-2 rounded-xl bg-gradient-to-r from-purple-500 to-pink-500 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
                title="ניהול משתמשים"
              >
                <Users className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
                <span className="hidden sm:inline">משתמשים</span>
              </Link>
            )}
            <Link
              href="/dashboard/ai-correction"
              className="rounded-xl bg-gradient-to-r from-indigo-500 to-purple-600 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg hover:scale-105"
            >
              <span className="hidden sm:inline">התחילי לתקן</span>
              <span className="sm:hidden">תיקון</span>
            </Link>
            <UserMenu />
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl px-4 sm:px-6 pb-8 sm:pb-16">
        <section className="mt-4 sm:mt-6 lg:mt-8 rounded-2xl sm:rounded-3xl bg-gradient-to-br from-indigo-500 via-purple-500 via-pink-500 to-rose-500 p-4 sm:p-6 lg:p-10 xl:p-14 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48Y2lyY2xlIGN4PSIzMCIgY3k9IjMwIiByPSIyIi8+PC9nPjwvZz48L3N2Zz4=')] opacity-20"></div>
          <div className="mx-auto flex max-w-4xl flex-col items-center gap-3 sm:gap-4 lg:gap-6 text-center relative z-10">
            <h1 className="text-xl sm:text-2xl lg:text-3xl xl:text-5xl font-bold leading-tight drop-shadow-lg px-2">
              עוזר הכתיבה החכם שלך בעברית טבעית
            </h1>
            <p className="text-xs sm:text-sm lg:text-base xl:text-lg text-white/95 max-w-2xl leading-relaxed px-2">
              כתיבה, תיקון ולמידה של מאמרים, מיילים, פוסטים וסיפורים בעברית תקנית. כל תיקון שלך נשמר והמערכת משתפרת בכל שימוש – כך שהתוכן הבא ירגיש כבר שלך.
            </p>
            <div className="flex flex-col sm:flex-row gap-2 sm:gap-3 lg:gap-4 w-full sm:w-auto px-2">
              <Link
                href="/dashboard/ai-correction"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl bg-white px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 text-xs sm:text-sm lg:text-base font-bold text-indigo-600 shadow-xl transition-all hover:-translate-y-1 hover:shadow-2xl hover:scale-105 w-full sm:w-auto"
              >
                התחילי תיקון עכשיו
                <span aria-hidden className="text-base sm:text-lg">→</span>
              </Link>
              <Link
                href="/dashboard/articles"
                className="inline-flex items-center justify-center gap-2 rounded-xl sm:rounded-2xl border-2 border-white/80 bg-white/10 backdrop-blur-sm px-5 sm:px-6 lg:px-8 py-2.5 sm:py-3 lg:py-4 text-xs sm:text-sm lg:text-base font-bold text-white transition-all hover:bg-white/20 hover:border-white hover:scale-105 w-full sm:w-auto"
              >
                צרי תוכן חדש
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-10 sm:mt-14 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                יצירת תוכן
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">כל כלי מופיע פעם אחת בלבד – בחרי ויצאנו לדרך.</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-100 to-purple-100">
              <Sparkles className="h-6 w-6 text-indigo-500" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            {creationCards.map(({ title, description, icon: Icon, href, gradient }) => {
              if (!Icon) return null;
              return (
                <Link
                  key={href}
                  href={href}
                  className={`group relative flex h-full flex-col justify-between rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradient} p-4 sm:p-5 lg:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:ring-offset-2 overflow-hidden`}
                >
                  <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <div className="relative z-10">
                    <div className="flex items-center gap-2 sm:gap-3 lg:gap-4 text-white mb-2 sm:mb-3">
                      <span className="flex h-10 w-10 sm:h-12 sm:w-12 lg:h-14 lg:w-14 items-center justify-center rounded-xl sm:rounded-2xl bg-white/25 backdrop-blur-sm shadow-lg group-hover:bg-white/30 transition-colors flex-shrink-0">
                        <Icon className="h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7" />
                      </span>
                      <h3 className="text-sm sm:text-base lg:text-lg xl:text-xl font-bold drop-shadow-sm leading-tight">{title}</h3>
                    </div>
                    <p className="mt-2 sm:mt-3 lg:mt-4 flex-1 text-xs sm:text-sm lg:text-base leading-relaxed text-white/95 drop-shadow-sm">{description}</p>
                    <span className="mt-3 sm:mt-4 lg:mt-5 inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm lg:text-base font-bold text-white transition-all group-hover:gap-2 sm:group-hover:gap-3">
                      כניסה לכלי
                      <span aria-hidden className="text-base sm:text-lg group-hover:translate-x-[-2px] transition-transform">→</span>
                    </span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>

        <section className="mt-10 sm:mt-14 space-y-4 sm:space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                מערכת הלמידה
              </h2>
              <p className="text-xs sm:text-sm text-gray-600 mt-1">כאן המערכת מאמצת את הסגנון האישי שלך.</p>
            </div>
            <div className="hidden sm:flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100">
              <Brain className="h-6 w-6 text-purple-500" aria-hidden />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 lg:gap-5 xl:gap-6">
            {learningCards.map(({ title, description, icon: Icon, href, gradient }) => (
              <Link
                key={href}
                href={href}
                className={`group relative flex h-full flex-col justify-between rounded-2xl sm:rounded-3xl bg-gradient-to-br ${gradient} p-4 sm:p-5 lg:p-6 shadow-lg transition-all duration-300 hover:-translate-y-1 sm:hover:-translate-y-2 hover:shadow-2xl hover:scale-[1.01] sm:hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-white/50 focus-visible:ring-offset-2 overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/0 via-white/0 to-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 sm:gap-3 text-white mb-2 sm:mb-3">
                    <span className="flex h-10 w-10 sm:h-11 sm:w-11 lg:h-12 lg:w-12 items-center justify-center rounded-lg sm:rounded-xl bg-white/25 backdrop-blur-sm shadow-lg group-hover:bg-white/30 transition-colors flex-shrink-0">
                      <Icon className="h-4 w-4 sm:h-5 sm:w-5 lg:h-6 lg:w-6" />
                    </span>
                    <h3 className="text-sm sm:text-base lg:text-lg font-bold drop-shadow-sm leading-tight">{title}</h3>
                  </div>
                  <p className="mt-2 sm:mt-3 lg:mt-4 flex-1 text-xs sm:text-sm lg:text-base leading-relaxed text-white/95 drop-shadow-sm">{description}</p>
                  <span className="mt-3 sm:mt-4 lg:mt-5 inline-flex items-center gap-1 sm:gap-1.5 text-xs sm:text-sm lg:text-base font-bold text-white transition-all group-hover:gap-2 sm:group-hover:gap-3">
                    המשיכי מכאן
                    <span aria-hidden className="text-base sm:text-lg group-hover:translate-x-[-2px] transition-transform">→</span>
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}