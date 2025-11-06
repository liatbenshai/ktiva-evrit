'use client';

import { useState } from 'react';
import { Home, Film, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CreateScript from '../../../../components/scripts/CreateScript';
import ImproveScript from '../../../../components/scripts/ImproveScript';

type Mode = 'create' | 'improve';

export default function ScriptsPage() {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-sky-50 to-blue-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-cyan-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                🎬 תסריטים
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-700">
                כתיבת תסריטים מקצועיים לסרטונים ומצגות
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0"
            >
              <Home className="w-4 h-4 sm:w-5 sm:h-5 group-hover:scale-110 transition-transform" />
              <span className="hidden sm:inline">חזרה לדשבורד</span>
              <span className="sm:hidden">דשבורד</span>
            </Link>
          </div>

          {/* Mode Selector */}
          <div className="mt-4 sm:mt-6 flex gap-2 sm:gap-4 flex-wrap">
            <button
              onClick={() => setMode('create')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-cyan-200'
              }`}
            >
              <Film className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>תסריט חדש</span>
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-blue-200'
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>שפר תסריט קיים</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {mode === 'create' ? <CreateScript /> : <ImproveScript />}
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-cyan-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}