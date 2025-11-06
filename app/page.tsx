'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogIn, User, BookOpen, Brain, Sparkles } from 'lucide-react'

export default function Home() {
  // Authentication system disabled - direct access to dashboard
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-3 sm:py-4 lg:py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 sm:gap-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 sm:w-6 sm:h-6 text-white" />
              </div>
              <h1 className="text-lg sm:text-xl lg:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                כתיבה עברית
              </h1>
            </div>
            <div className="flex gap-2 sm:gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-1 sm:gap-2 px-3 sm:px-4 lg:px-6 py-2 sm:py-2.5 lg:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-lg sm:rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-sm sm:text-base"
              >
                <User className="w-4 h-4 sm:w-5 sm:h-5" />
                <span className="hidden sm:inline">התחל לכתוב</span>
                <span className="sm:hidden">התחל</span>
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-3 sm:px-4 lg:px-8 py-8 sm:py-12 lg:py-16">
        <div className="text-center mb-8 sm:mb-12 lg:mb-16">
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-4 sm:mb-6 px-2">
            עוזר הכתיבה החכם שלך
          </h2>
          <p className="text-base sm:text-lg lg:text-xl text-gray-600 mb-6 sm:mb-8 max-w-3xl mx-auto px-2">
            פלטפורמה חכמה לכתיבת מאמרים, מיילים, פוסטים, סיפורים ופרוטוקולים בעברית תקנית עם בינה מלאכותית מתקדמת
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-base sm:text-lg font-medium rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
            התחל עכשיו
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8 mb-8 sm:mb-12 lg:mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <BookOpen className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">מאמרים מקצועיים</h3>
            <p className="text-sm sm:text-base text-gray-600">יצירת מאמרים איכותיים עם אופטימיזציה למנועי חיפוש</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Brain className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">בינה מלאכותית מתקדמת</h3>
            <p className="text-sm sm:text-base text-gray-600">טכנולוגיית Claude AI לכתיבה חכמה ומדויקת</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-xl sm:rounded-2xl p-6 sm:p-8 shadow-lg hover:shadow-xl transition-shadow sm:col-span-2 lg:col-span-1">
            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-4 sm:mb-6">
              <Sparkles className="w-5 h-5 sm:w-6 sm:h-6 text-purple-600" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-3 sm:mb-4">מרכז למידה אישי</h3>
            <p className="text-sm sm:text-base text-gray-600">מעקב אחר התקדמות ושיפור כישורי הכתיבה שלך</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl sm:rounded-2xl p-6 sm:p-8 lg:p-12 text-center text-white">
          <h3 className="text-2xl sm:text-3xl font-bold mb-3 sm:mb-4">מוכן להתחיל לכתוב?</h3>
          <p className="text-base sm:text-lg lg:text-xl mb-6 sm:mb-8 opacity-90">הצטרף לאלפי משתמשים שכבר משפרים את הכתיבה שלהם</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-6 sm:px-8 py-3 sm:py-4 bg-white text-blue-600 text-base sm:text-lg font-medium rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <User className="w-5 h-5 sm:w-6 sm:h-6" />
            התחל לכתוב עכשיו
          </a>
        </div>
      </main>
    </div>
  )
}