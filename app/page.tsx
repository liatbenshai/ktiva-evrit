'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { LogIn, User, BookOpen, Brain, Sparkles } from 'lucide-react'

export default function Home() {
  // Authentication system disabled - direct access to dashboard
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                <BookOpen className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                כתיבה עברית
              </h1>
            </div>
            <div className="flex gap-3">
              <a
                href="/dashboard"
                className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium"
              >
                <User className="w-5 h-5" />
                התחל לכתוב
              </a>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="text-center mb-16">
          <h2 className="text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-6">
            עוזר הכתיבה החכם שלך
          </h2>
          <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
            פלטפורמה חכמה לכתיבת מאמרים, מיילים, פוסטים, סיפורים ופרוטוקולים בעברית תקנית עם בינה מלאכותית מתקדמת
          </p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white text-lg font-medium rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <User className="w-6 h-6" />
            התחל עכשיו
          </a>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center mb-6">
              <BookOpen className="w-6 h-6 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">מאמרים מקצועיים</h3>
            <p className="text-gray-600">יצירת מאמרים איכותיים עם אופטימיזציה למנועי חיפוש</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mb-6">
              <Brain className="w-6 h-6 text-green-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">בינה מלאכותית מתקדמת</h3>
            <p className="text-gray-600">טכנולוגיית Claude AI לכתיבה חכמה ומדויקת</p>
          </div>

          <div className="bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-lg hover:shadow-xl transition-shadow">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mb-6">
              <Sparkles className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">מרכז למידה אישי</h3>
            <p className="text-gray-600">מעקב אחר התקדמות ושיפור כישורי הכתיבה שלך</p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl p-12 text-center text-white">
          <h3 className="text-3xl font-bold mb-4">מוכן להתחיל לכתוב?</h3>
          <p className="text-xl mb-8 opacity-90">הצטרף לאלפי משתמשים שכבר משפרים את הכתיבה שלהם</p>
          <a
            href="/dashboard"
            className="inline-flex items-center gap-2 px-8 py-4 bg-white text-blue-600 text-lg font-medium rounded-xl hover:shadow-xl transform hover:scale-105 transition-all duration-200"
          >
            <User className="w-6 h-6" />
            התחל לכתוב עכשיו
          </a>
        </div>
      </main>
    </div>
  )
}