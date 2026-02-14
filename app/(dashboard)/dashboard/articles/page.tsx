'use client';

import { useState } from 'react';
import { FileText, Sparkles } from 'lucide-react';
import DashboardPageWrapper from '@/components/layout/DashboardPageWrapper';
import { getPageTheme } from '@/lib/page-themes';
import CreateArticle from '@/components/articles/CreateArticle';
import ImproveArticle from '@/components/articles/ImproveArticle';

type Mode = 'create' | 'improve';

export default function ArticlesPage() {
  const [mode, setMode] = useState<Mode>('create');
  const theme = getPageTheme('articles');

  return (
    <DashboardPageWrapper
      icon={FileText}
      title="מאמרים"
      description="כתיבת מאמרים מקצועיים עם אופטימיזציה ל-SEO"
      theme={theme}
    >
        <div className="mb-5 sm:mb-8">
          <div className="inline-flex w-full items-center gap-0 rounded-2xl border border-sky-100 bg-white/70 p-1.5 shadow-sm backdrop-blur sm:w-auto">
            <button
              onClick={() => setMode('create')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:flex-initial sm:px-6 sm:py-2.5 sm:text-base ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/80'
              }`}
            >
              <Sparkles className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>יצירה חדשה</span>
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex flex-1 items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all duration-200 sm:flex-initial sm:px-6 sm:py-2.5 sm:text-base ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-sky-500 to-indigo-600 text-white shadow-md'
                  : 'text-gray-600 hover:bg-white/80'
              }`}
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5" />
              <span>שיפור קיים</span>
            </button>
          </div>
        </div>

        <div>
          {mode === 'create' ? <CreateArticle /> : <ImproveArticle />}
        </div>
    </DashboardPageWrapper>
  );
}
