'use client'

import Link from 'next/link';
import { useState } from 'react';
import { 
  FileText, 
  Mail, 
  MessageSquare, 
  BookOpen, 
  FileCheck, 
  ScrollText,
  User,
  BookMarked,
  Brain,
  TrendingUp,
  Lightbulb,
  Zap
} from 'lucide-react';

const modules = [
  {
    title: 'מאמרים',
    description: 'כתיבת מאמרים מקצועיים ואיכותיים',
    icon: FileText,
    href: '/dashboard/articles',
    color: 'bg-blue-500',
  },
  {
    title: 'תסריטים',
    description: 'כתיבת תסריטים לסרטונים ומצגות',
    icon: FileText,
    href: '/dashboard/scripts',
    color: 'bg-cyan-500',
  },
  {
    title: 'הצעות מחיר',
    description: 'יצירת הצעות מחיר מקצועיות',
    icon: FileText,
    href: '/dashboard/quotes',
    color: 'bg-yellow-500',
  },
  {
    title: 'Prompts',
    description: 'כתיבת prompts אפקטיביים ל-AI',
    icon: MessageSquare,
    href: '/dashboard/prompts',
    color: 'bg-teal-500',
  },
  {
    title: 'מיילים',
    description: 'כתיבת מיילים מקצועיים ומנומסים',
    icon: Mail,
    href: '/dashboard/emails',
    color: 'bg-green-500',
  },
  {
    title: 'פוסטים',
    description: 'יצירת פוסטים לרשתות חברתיות',
    icon: MessageSquare,
    href: '/dashboard/posts',
    color: 'bg-purple-500',
  },
  {
    title: 'סיפורים',
    description: 'כתיבה יצירתית וסיפורים',
    icon: BookOpen,
    href: '/dashboard/stories',
    color: 'bg-orange-500',
  },
  {
    title: 'סיכומים',
    description: 'סיכום מסמכים וטקסטים',
    icon: FileCheck,
    href: '/dashboard/summaries',
    color: 'bg-pink-500',
  },
  {
    title: 'פרוטוקולים',
    description: 'יצירת פרוטוקולים מתמלולי ישיבות',
    icon: ScrollText,
    href: '/dashboard/protocols',
    color: 'bg-indigo-500',
  },
  {
    title: 'ניהול מילים נרדפות',
    description: 'הוסף וערוך מילים נרדפות למילון',
    icon: BookMarked,
    href: '/dashboard/synonyms',
    color: 'bg-teal-600',
  },
];

const learningFeatures = [
  {
    icon: Brain,
    title: 'המערכת יוצרת טקסט',
    description: 'המערכת יוצרת עבורך טקסט בעברית - טקסט שצריך תיקון',
    href: '/dashboard/learn/generate',
    color: 'from-purple-500 to-pink-600',
  },
  {
    icon: TrendingUp,
    title: 'אתה מתקן',
    description: 'תקן את הטקסט שהמערכת יצרה - כל תיקון הוא למידה',
    href: '/dashboard/learn/correct',
    color: 'from-blue-500 to-cyan-600',
  },
];

export default function DashboardPage() {
  const [showLearningMode, setShowLearningMode] = useState(false);

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-blue-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-purple-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-xl flex items-center justify-center">
                <User className="w-6 h-6 text-white" />
              </div>
              <div>
                <p className="text-sm text-gray-600">שלום,</p>
                <p className="font-medium text-gray-900">משתמש</p>
              </div>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowLearningMode(!showLearningMode)}
                className={`px-4 py-2 rounded-lg font-medium transition-all ${
                  showLearningMode 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-purple-100 text-purple-700 hover:bg-purple-200'
                }`}
              >
                {showLearningMode ? 'מצב למידה פעיל' : 'הפעל מצב למידה'}
              </button>
              <a
                href="/"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-lg transition-colors"
              >
                חזרה לעמוד הראשי
              </a>
            </div>
          </div>
          <div className="text-center">
            <h1 className="text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
              כתיבה בעברית ✨
            </h1>
            <p className="mt-3 text-lg text-gray-700 font-medium">
              הפלטפורמה שלך לכתיבה מקצועית וזורמת בעברית תקנית
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="mb-10 text-center">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">
            🎯 מה נכתוב היום?
          </h2>
          <p className="text-gray-600 text-lg">
            בחרי כלי ונתחיל ליצור תוכן מדהים
          </p>
        </div>

        {/* Modules Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {modules.map((module, index) => {
            const Icon = module.icon;
            return (
              <Link
                key={module.href}
                href={module.href}
                className="group block transform transition-all duration-300 hover:scale-105 hover:-translate-y-2"
                style={{
                  animationDelay: `${index * 50}ms`,
                }}
              >
                <div className={`relative bg-gradient-to-br ${getGradientClass(module.color)} rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-white/50`}>
                  {/* Decorative element */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/10 rounded-full -mr-8 -mt-8 blur-2xl"></div>
                  
                  <div className="relative">
                    <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                      <Icon className="w-8 h-8 text-gray-800" />
                    </div>
                    <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                      {module.title}
                    </h3>
                    <p className="text-white/90 text-sm leading-relaxed">
                      {module.description}
                    </p>
                  </div>

                  {/* Hover arrow */}
                  <div className="absolute bottom-6 left-6 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                    <span className="text-white text-2xl">←</span>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Learning Features Section */}
        {showLearningMode && (
          <div className="mt-16">
            <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
              🧠 מערכת למידה מתקדמת
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-8">
              {learningFeatures.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <Link
                    key={feature.href}
                    href={feature.href}
                    className="group block transform transition-all duration-300 hover:scale-105"
                  >
                    <div className={`relative bg-gradient-to-br ${feature.color} rounded-2xl shadow-lg p-8 hover:shadow-2xl transition-all duration-300 border-2 border-white/50 h-full`}>
                      <div className="relative">
                        <div className="bg-white/90 backdrop-blur-sm p-4 rounded-xl w-fit mb-4 shadow-md group-hover:scale-110 transition-transform duration-300">
                          <Icon className="w-8 h-8 text-gray-800" />
                        </div>
                        <h3 className="text-2xl font-bold text-white mb-2 drop-shadow-md">
                          {feature.title}
                        </h3>
                        <p className="text-white/90 text-sm leading-relaxed">
                          {feature.description}
                        </p>
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Info Banner */}
            <div className="bg-gradient-to-r from-purple-100 via-pink-100 to-blue-100 rounded-3xl shadow-xl border-2 border-white/50 p-8">
              <div className="text-center">
                <div className="text-6xl mb-4">🤖</div>
                <h3 className="text-2xl font-bold text-gray-800 mb-3">
                  איך זה עובד?
                </h3>
                <p className="text-gray-700 text-lg mb-6 max-w-3xl mx-auto leading-relaxed">
                  המערכת יוצרת עבורך טקסטים בעברית. כשתתקן אותם, היא תשמור את התיקונים ותלמד מהם.
                  ככל שתתקן יותר, כך המערכת תשתפר ותבין מה זה עברית תקנית ומושלמת.
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer decoration */}
      <div className="h-32 bg-gradient-to-t from-purple-100/50 to-transparent"></div>
    </div>
  );
}

// Helper function to get gradient colors
function getGradientClass(baseColor: string) {
  const gradients: { [key: string]: string } = {
    'bg-blue-500': 'from-blue-400 to-blue-600',
    'bg-cyan-500': 'from-cyan-400 to-teal-600',
    'bg-yellow-500': 'from-yellow-400 to-orange-500',
    'bg-teal-500': 'from-teal-400 to-green-600',
    'bg-teal-600': 'from-teal-500 to-green-700',
    'bg-green-500': 'from-green-400 to-emerald-600',
    'bg-purple-500': 'from-purple-400 to-purple-600',
    'bg-orange-500': 'from-orange-400 to-red-500',
    'bg-pink-500': 'from-pink-400 to-rose-600',
    'bg-indigo-500': 'from-indigo-400 to-purple-600',
  };
  return gradients[baseColor] || 'from-gray-400 to-gray-600';
}