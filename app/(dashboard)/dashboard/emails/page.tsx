'use client';

import { useState } from 'react';
import { Home, Mail, Reply, Sparkles } from 'lucide-react';
import Link from 'next/link';
import CreateEmail from '@/components/emails/CreateEmail';
import ReplyEmail from '@/components/emails/ReplyEmail';
import ImproveEmail from '@/components/emails/ImproveEmail';

type Mode = 'create' | 'reply' | 'improve';

export default function EmailsPage() {
  const [mode, setMode] = useState<Mode>('create');

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" dir="rtl">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-100 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
            <div className="flex-1">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ✉️ מיילים
              </h1>
              <p className="mt-1 sm:mt-2 text-sm sm:text-base lg:text-lg text-gray-700">
                כתיבה, מענה ושיפור מיילים בעברית תקנית
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base flex-shrink-0"
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
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-green-200'
              }`}
            >
              <Mail className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>כתוב מייל חדש</span>
            </button>
            <button
              onClick={() => setMode('reply')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base ${
                mode === 'reply'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-teal-200'
              }`}
            >
              <Reply className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>ענה למייל</span>
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex-1 sm:flex-initial flex items-center justify-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 rounded-lg sm:rounded-xl font-medium transition-all duration-200 transform hover:scale-105 text-sm sm:text-base ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-emerald-200'
              }`}
            >
              <Sparkles className="w-4 h-4 sm:w-5 sm:h-5" />
              <span>שפר מייל</span>
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-4 sm:py-6 lg:py-8">
        {mode === 'create' && <CreateEmail />}
        {mode === 'reply' && <ReplyEmail />}
        {mode === 'improve' && <ImproveEmail />}
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-green-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}