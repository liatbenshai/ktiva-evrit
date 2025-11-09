'use client';

import { useState } from 'react';
import { Home, Film, Sparkles } from 'lucide-react';
import PageHeader, { PageHeaderLink } from '@/components/layout/PageHeader';
import CreateScript from '../../../../components/scripts/CreateScript';
import ImproveScript from '../../../../components/scripts/ImproveScript';

type Mode = 'create' | 'improve';

export default function ScriptsPage() {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div className="min-h-screen bg-slate-50" dir="rtl">
      <PageHeader
        icon={Film}
        title="תסריטים"
        description="כתיבת תסריטים מקצועיים לסרטונים ומצגות"
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
        <div className="mb-5 flex flex-col gap-2 sm:mb-8 sm:flex-row sm:items-center sm:gap-3">
          <button
            onClick={() => setMode('create')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-5 sm:py-2.5 sm:text-base ${
              mode === 'create'
                ? 'border-cyan-500 bg-cyan-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>תסריט חדש</span>
          </button>
          <button
            onClick={() => setMode('improve')}
            className={`flex flex-1 items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors sm:flex-initial sm:px-5 sm:py-2.5 sm:text-base ${
              mode === 'improve'
                ? 'border-blue-500 bg-blue-500 text-white shadow-sm'
                : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300'
            }`}
          >
            <Film className="w-4 h-4 sm:w-5 sm:h-5" />
            <span>שפר תסריט קיים</span>
          </button>
        </div>

        <div className="space-y-6">
          {mode === 'create' ? <CreateScript /> : <ImproveScript />}
        </div>
      </main>
    </div>
  );
}