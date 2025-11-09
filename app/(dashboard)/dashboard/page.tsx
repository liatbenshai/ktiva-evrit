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

const writingTools = [
  {
    title: 'מאמרים',
    description: 'כתיבת מאמרים מקצועיים עם אופטימיזציה מלאה.',
    icon: FileText,
    href: '/dashboard/articles',
  },
  {
    title: 'תסריטים',
    description: 'בניית תסריטים לסרטונים, מצגות ופודקאסטים.',
    icon: FileText,
    href: '/dashboard/scripts',
  },
  {
    title: 'דפי עבודה',
    description: 'יצירת דפי עבודה מוכנים להדפסה לכל רמה.',
    icon: FileText,
    href: '/dashboard/worksheets',
  },
  {
    title: 'מיילים',
    description: 'כתיבת מיילים מקצועיים, תשובות ושיפורים.',
    icon: Mail,
    href: '/dashboard/emails',
  },
  {
    title: 'פוסטים וסיפורים',
    description: 'תוכן לרשתות חברתיות וכתיבה יצירתית.',
    icon: MessageSquare,
    href: '/dashboard/posts',
  },
  {
    title: 'סיכומים ופרוטוקולים',
    description: 'סיכום מסמכים וניסוח פרוטוקולים רשמיים.',
    icon: ScrollText,
    href: '/dashboard/summaries',
  },
];

const learningTools = [
  {
    title: 'תיקון כתיבת AI',
    description: 'תקני טקסטים שנוצרו ב-AI והמערכת תלמד את התיקונים שלך.',
    icon: Brain,
    href: '/dashboard/ai-correction',
  },
  {
    title: 'מילים נרדפות',
    description: 'בניית מילון אישי של ניסוחים חלופיים.',
    icon: BookMarked,
    href: '/dashboard/synonyms',
  },
  {
    title: 'למידת טקסט ופתגמים',
    description: 'הזיני טקסטים או פתגמים והמערכת תשמר את הסגנון שלך.',
    icon: Languages,
    href: '/dashboard/learn',
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

      <main className="mx-auto w-full max-w-5xl px-4 pb-16">
        <section className="mt-6 rounded-2xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-6 text-white shadow-lg sm:p-10">
          <div className="space-y-4 text-center sm:space-y-5">
            <h2 className="text-2xl font-semibold sm:text-3xl">מתחילים לכתוב?</h2>
            <p className="text-sm text-white/90 sm:text-base">
              הזיני טקסט לקבלת ניתוח, תיקון ולמידה בזמן אמת. כל תיקון שתאשרי משפר את המערכת שלך.
            </p>
            <div className="flex justify-center">
              <Link
                href="/dashboard/ai-correction"
                className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-indigo-600 shadow-md transition hover:-translate-y-0.5 hover:shadow-lg"
              >
                התחילי לתקן טקסט
                <span aria-hidden>→</span>
              </Link>
            </div>
          </div>
        </section>

        <section className="mt-12 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">כלי יצירה</h3>
            <p className="text-xs text-slate-500 sm:text-sm">בחרי כלי אחד והתחילי לעבוד – בלי קיצורים כפולים.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            {writingTools.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:border-indigo-200 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
                    <Icon className="h-5 w-5" />
                  </span>
                  <h4 className="text-base font-semibold text-slate-900">{title}</h4>
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

        <section className="mt-12 space-y-5">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900 sm:text-xl">מערכת הלמידה</h3>
            <p className="text-xs text-slate-500 sm:text-sm">כל פעולה כאן מחזקת את הסגנון והקול האישי שלך.</p>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {learningTools.map(({ title, description, icon: Icon, href }) => (
              <Link
                key={href}
                href={href}
                className="group flex h-full flex-col justify-between rounded-xl border border-slate-200 bg-slate-50/70 p-5 transition hover:-translate-y-1 hover:border-indigo-200 hover:bg-white hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
              >
                <div className="flex items-center gap-3">
                  <span className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-100 text-indigo-600">
                    <Icon className="h-4 w-4" />
                  </span>
                  <h4 className="text-base font-semibold text-slate-900">{title}</h4>
                </div>
                <p className="mt-3 flex-1 text-sm text-slate-600">{description}</p>
                <span className="mt-4 inline-flex items-center gap-1 text-sm font-medium text-indigo-600 transition group-hover:gap-2">
                  פתחי את הכלי
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