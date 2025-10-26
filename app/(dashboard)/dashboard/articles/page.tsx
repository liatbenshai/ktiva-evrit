'use client';

import { useState } from 'react';
import { Home, FileText, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CreateArticle from '@/components/articles/CreateArticle';
import ImproveArticle from '@/components/articles/ImproveArticle';

type Mode = 'create' | 'improve';

export default function ArticlesPage() {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                📝 מאמרים
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                כתיבת מאמרים מקצועיים עם אופטימיזציה ל-SEO
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Mode Selector */}
        <div className="mb-8">
          <div className="inline-flex gap-4">
            <button
              onClick={() => setMode('create')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-blue-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              יצירה חדשה
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-cyan-500 to-teal-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-cyan-200'
              }`}
            >
              <FileText className="w-5 h-5" />
              שיפור קיים
            </button>
          </div>
        </div>

        {/* Content */}
        <div>
          {mode === 'create' ? <CreateArticle /> : <ImproveArticle />}
        </div>
      </main>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-blue-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}