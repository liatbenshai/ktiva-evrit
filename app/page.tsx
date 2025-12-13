'use client'

import { User, Sparkles, Wand2, ArrowLeft } from 'lucide-react'

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 via-pink-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/70 backdrop-blur-md shadow-sm sticky top-0 z-50 border-b border-white/50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-6 xl:px-8 py-3 sm:py-4 lg:py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3 lg:gap-4">
              <div className="w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 bg-gradient-to-br from-indigo-500 via-purple-600 to-pink-600 rounded-xl sm:rounded-2xl flex items-center justify-center flex-shrink-0 shadow-lg">
                <Wand2 className="w-5 h-5 sm:w-6 sm:h-6 lg:w-7 lg:h-7 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl xl:text-3xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent">
                כתיבה עברית
              </h1>
            </div>
            <div className="flex gap-1.5 sm:gap-2 lg:gap-3">
              <a
                href="/login"
                className="hidden sm:flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-semibold text-gray-700 hover:text-indigo-600 transition-colors"
              >
                התחברות
              </a>
              <a
                href="/dashboard"
                className="flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white rounded-lg sm:rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200 font-bold text-xs sm:text-sm lg:text-base"
              >
                <User className="w-3.5 h-3.5 sm:w-4 sm:h-4 lg:w-5 lg:h-5" />
                <span className="hidden sm:inline">התחל לכתוב</span>
                <span className="sm:hidden">התחל</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section - Minimalist */}
      <main className="flex items-center justify-center min-h-[calc(100vh-80px)] py-8 sm:py-12">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-1.5 sm:py-2 rounded-full bg-gradient-to-r from-indigo-100 to-purple-100 border border-indigo-200 mb-4 sm:mb-6 lg:mb-8">
            <Sparkles className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-indigo-600" />
            <span className="text-xs sm:text-sm lg:text-base font-semibold text-indigo-700">פלטפורמה חכמה לכתיבה בעברית</span>
          </div>
          <h2 className="text-2xl sm:text-4xl lg:text-5xl xl:text-7xl font-bold bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 bg-clip-text text-transparent mb-4 sm:mb-6 lg:mb-8 leading-tight px-2">
            עוזר הכתיבה החכם שלך
          </h2>
          <p className="text-sm sm:text-base lg:text-lg xl:text-xl text-gray-700 mb-6 sm:mb-8 lg:mb-10 max-w-3xl mx-auto leading-relaxed px-2">
            פלטפורמה חכמה לכתיבת מאמרים, מיילים, פוסטים, סיפורים ופרוטוקולים בעברית תקנית עם בינה מלאכותית מתקדמת
          </p>
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3 sm:gap-4 lg:gap-5 px-2">
            <a
              href="/dashboard"
              className="group inline-flex items-center justify-center gap-2 sm:gap-3 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-gradient-to-r from-indigo-500 via-purple-600 to-pink-600 text-white text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl hover:shadow-2xl transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              <User className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6" />
              התחל עכשיו
              <ArrowLeft className="w-4 h-4 sm:w-5 sm:h-5 lg:w-6 lg:h-6 group-hover:-translate-x-1 transition-transform" />
            </a>
            <a
              href="/login"
              className="inline-flex items-center justify-center gap-2 px-6 sm:px-8 lg:px-10 py-3 sm:py-4 lg:py-5 bg-white border-2 border-indigo-200 text-indigo-600 text-base sm:text-lg lg:text-xl font-bold rounded-xl sm:rounded-2xl hover:border-indigo-400 hover:shadow-lg transform hover:scale-105 transition-all duration-300 w-full sm:w-auto"
            >
              התחברות
            </a>
          </div>
        </div>
      </main>
    </div>
  )
}
