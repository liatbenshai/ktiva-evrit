'use client';

import { useState } from 'react';
import { Home, Mail, Reply, Sparkles } from 'lucide-react';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';
import CreateEmail from '@/components/emails/CreateEmail';
import ReplyEmail from '@/components/emails/ReplyEmail';
import ImproveEmail from '@/components/emails/ImproveEmail';

type Mode = 'create' | 'reply' | 'improve';

export default function EmailsPage() {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <PageHeader
        icon={Mail}
        title="מיילים"
        description="כתיבה, מענה ושיפור מיילים בעברית תקנית"
        actions={
          <PageHeaderLink
            href="/dashboard"
            label="חזרה לדשבורד"
            icon={Home}
            variant="outline"
          />
        }
      />

      <main className="mx-auto w-full max-w-5xl px-4 py-5 sm:py-8">
        <div className="mb-5 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
          <button
            onClick={() => setMode('create')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-5 sm:py-2.5 sm:text-base ${
              mode === 'create'
                ? 'border-emerald-500 bg-emerald-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>כתוב מייל חדש</span>
          </button>
          <button
            onClick={() => setMode('reply')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-5 sm:py-2.5 sm:text-base ${
              mode === 'reply'
                ? 'border-teal-500 bg-teal-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Reply className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>ענה למייל</span>
          </button>
          <button
            onClick={() => setMode('improve')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-5 sm:py-2.5 sm:text-base ${
              mode === 'improve'
                ? 'border-green-500 bg-green-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>שפר מייל</span>
          </button>
        </div>

        <div className="space-y-6">
          {mode === 'create' && <CreateEmail />}
          {mode === 'reply' && <ReplyEmail />}
          {mode === 'improve' && <ImproveEmail />}
        </div>
      </main>
    </div>
  );
}