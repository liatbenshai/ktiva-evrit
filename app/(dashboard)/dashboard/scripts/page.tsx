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
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-cyan-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                🎬 תסריטים
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                כתיבת תסריטים מקצועיים לסרטונים ומצגות
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
            >
              <Home className="w-5 h-5 group-hover:scale-110 transition-transform" />
              חזרה לדשבורד
            </Link>
          </div>

          {/* Mode Selector */}
          <div className="mt-6 flex gap-4 flex-wrap">
            <button
              onClick={() => setMode('create')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'create'
                  ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-cyan-200'
              }`}
            >
              <Film className="w-5 h-5" />
              תסריט חדש
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-blue-500 to-indigo-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-blue-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              שפר תסריט קיים
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'create' ? <CreateScript /> : <ImproveScript />}
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-cyan-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}