'use client'

import Link from 'next/link';
import {
  BookMarked,
  Brain,
  FileCheck,
  FileText,
  Home as HomeIcon,
  Languages,
  Mail,
  MessageSquare,
  ScrollText,
} from 'lucide-react';
import PageHeader from '@/components/layout/PageHeader';

const modules = [
  {
    title: 'מאמרים',
    description: 'כתיבת מאמרים מקצועיים ואיכותיים',
    icon: FileText,
    href: '/dashboard/articles',
    badgeClass: 'bg-blue-100 text-blue-700',
  },
  {
    title: 'תסריטים',
    description: 'כתיבת תסריטים לסרטונים ומצגות',
    icon: FileText,
    href: '/dashboard/scripts',
    badgeClass: 'bg-cyan-100 text-cyan-700',
  },
  {
    title: 'דפי עבודה ללימודים',
    description: 'יצירת דפי עבודה מוכנים להדפסה',
    icon: FileText,
    href: '/dashboard/worksheets',
    badgeClass: 'bg-yellow-100 text-yellow-700',
  },
  {
    title: 'תרגום',
    description: 'תרגום מתוחכם עם למידה מתיקונים',
    icon: Languages,
    href: '/dashboard/prompts',
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'מיילים',
    description: 'כתיבת מיילים מקצועיים ומנומסים',
    icon: Mail,
    href: '/dashboard/emails',
    badgeClass: 'bg-green-100 text-green-700',
  },
  {
    title: 'פוסטים',
    description: 'יצירת פוסטים לרשתות חברתיות',
    icon: MessageSquare,
    href: '/dashboard/posts',
    badgeClass: 'bg-purple-100 text-purple-700',
  },
  {
    title: 'סיפורים',
    description: 'כתיבה יצירתית וסיפורים',
    icon: FileText,
    href: '/dashboard/stories',
    badgeClass: 'bg-amber-100 text-amber-700',
  },
  {
    title: 'סיכומים',
    description: 'סיכום מסמכים וטקסטים',
    icon: FileCheck,
    href: '/dashboard/summaries',
    badgeClass: 'bg-rose-100 text-rose-700',
  },
  {
    title: 'פרוטוקולים',
    description: 'יצירת פרוטוקולים מתמלולי ישיבות',
    icon: ScrollText,
    href: '/dashboard/protocols',
    badgeClass: 'bg-indigo-100 text-indigo-700',
  },
  {
    title: 'ניהול מילים נרדפות',
    description: 'הוספה ועריכה של מילים נרדפות למילון',
    icon: BookMarked,
    href: '/dashboard/synonyms',
    badgeClass: 'bg-teal-100 text-teal-700',
  },
  {
    title: 'למידת פתגמים',
    description: 'למד את המערכת פתגמים ומטבעות לשון',
    icon: Languages,
    href: '/dashboard/idioms',
    badgeClass: 'bg-fuchsia-100 text-fuchsia-700',
  },
  {
    title: 'תיקון כתיבת AI',
    description: 'תקני טקסטים שנוצרו על ידי AI והמערכת תלמד מהם',
    icon: Brain,
    href: '/dashboard/ai-correction',
    badgeClass: 'bg-slate-900 text-white',
  },
];

const learningTiles = [
  {
    title: 'מילים נרדפות',
    description: 'ניהול מילים נרדפות למילון',
    href: '/dashboard/synonyms',
    icon: BookMarked,
    badgeClass: 'bg-emerald-100 text-emerald-700',
  },
  {
    title: 'למידת פתגמים',
    description: 'למד את המערכת פתגמים בעברית',
    href: '/dashboard/idioms',
    icon: Languages,
    badgeClass: 'bg-violet-100 text-violet-700',
  },
  {
    title: 'למידת טקסט',
    description: 'למד את המערכת לתקן טקסטים מסובכים',
    href: '/dashboard/learn',
    icon: Brain,
    badgeClass: 'bg-sky-100 text-sky-700',
  },
];

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <PageHeader
        icon={HomeIcon}
        title="כתיבה בעברית"
        description="כל הכלים שלך לכתיבה מקצועית, שוטפת וטבעית בעברית – במקום אחד"
      />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:py-10">
        <section className="mb-8 flex flex-col items-center gap-3 text-center sm:mb-10">
          <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
            🎯 במה תרצי להתמקד היום?
          </h2>
          <p className="max-w-2xl text-sm text-slate-600 sm:text-base">
            בחרי קטגוריה, הזיני טקסט או הוראות – והמערכת תוביל אותך צעד-צעד לכתיבה עברית טבעית ומקצועית.
          </p>
        </section>

        <section aria-label="כלי כתיבה" className="space-y-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {modules.map(({ title, description, icon: Icon, href, badgeClass }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <div className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                  <Icon className="h-4 w-4" />
                  <span>{title}</span>
                </div>
                <p className="text-sm text-slate-600">{description}</p>
                <span className="mt-6 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                  הכניסה לכלי
                  <span aria-hidden>→</span>
                </span>
              </Link>
            ))}
          </div>
        </section>

        <section className="mt-14 space-y-4">
          <div className="flex flex-col items-center gap-2 text-center">
            <h2 className="text-2xl font-semibold text-slate-900 sm:text-3xl">
              🧠 מערכת הלמידה האישית שלך
            </h2>
            <p className="max-w-3xl text-sm text-slate-600 sm:text-base">
              ככל שתלמדי את המערכת יותר – היא תבין טוב יותר את הניסוח המועדף עלייך, המונחים והטון האישי.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              {learningTiles.map(({ title, description, href, icon: Icon, badgeClass }) => (
                <Link
                  key={href}
                  href={href}
                  className="group flex flex-col rounded-xl border border-slate-200 bg-slate-50/80 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
                >
                  <div className={`mb-4 inline-flex w-fit items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${badgeClass}`}>
                    <Icon className="h-4 w-4" />
                    <span>{title}</span>
                  </div>
                  <p className="text-sm text-slate-600">{description}</p>
                  <span className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                    התחילי ללמוד
                    <span aria-hidden>→</span>
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}