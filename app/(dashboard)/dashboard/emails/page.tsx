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
      <div className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-green-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-emerald-600 bg-clip-text text-transparent">
                ✉️ מיילים
              </h1>
              <p className="mt-2 text-gray-700 text-lg">
                כתיבה, מענה ושיפור מיילים בעברית תקנית
              </p>
            </div>
            <Link
              href="/dashboard"
              className="group flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
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
                  ? 'bg-gradient-to-r from-green-500 to-emerald-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-green-200'
              }`}
            >
              <Mail className="w-5 h-5" />
              כתוב מייל חדש
            </button>
            <button
              onClick={() => setMode('reply')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'reply'
                  ? 'bg-gradient-to-r from-teal-500 to-cyan-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-teal-200'
              }`}
            >
              <Reply className="w-5 h-5" />
              ענה למייל
            </button>
            <button
              onClick={() => setMode('improve')}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all duration-200 transform hover:scale-105 ${
                mode === 'improve'
                  ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg'
                  : 'bg-white/70 text-gray-700 hover:bg-white border-2 border-emerald-200'
              }`}
            >
              <Sparkles className="w-5 h-5" />
              שפר מייל
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {mode === 'create' && <CreateEmail />}
        {mode === 'reply' && <ReplyEmail />}
        {mode === 'improve' && <ImproveEmail />}
      </div>
      
      {/* Footer decoration */}
      <div className="h-20 bg-gradient-to-t from-green-100 via-transparent to-transparent mt-12 opacity-30"></div>
    </div>
  );
}