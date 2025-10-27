'use client'

import { useState } from 'react'
import { Home, BookOpen, CheckCircle, XCircle, RefreshCw, ArrowLeft, ArrowRight } from 'lucide-react'
import Link from 'next/link'

interface Idiom {
  id: string
  english: string
  hebrew: string
  category: string
  learned: boolean
}

export default function IdiomsPage() {
  const [currentIdiom, setCurrentIdiom] = useState<Idiom | null>(null)
  const [learnedIds, setLearnedIds] = useState<Set<string>>(new Set())
  const [history, setHistory] = useState<Idiom[]>([])

  // Sample idioms database
  const idiomsDatabase: Idiom[] = [
    { id: '1', english: 'To take into account', hebrew: 'להביא בחשבון', category: 'ביטוי', learned: false },
    { id: '2', english: 'In the meantime', hebrew: 'בינתיים', category: 'זמן', learned: false },
    { id: '3', english: 'On the other hand', hebrew: 'מצד שני', category: 'ניגוד', learned: false },
    { id: '4', english: 'In other words', hebrew: 'במילים אחרות', category: 'הסבר', learned: false },
    { id: '5', english: 'As a matter of fact', hebrew: 'למעשה', category: 'עובדות', learned: false },
    { id: '6', english: 'All in all', hebrew: 'בסך הכל', category: 'סיכום', learned: false },
    { id: '7', english: 'As long as', hebrew: 'כל עוד', category: 'תנאי', learned: false },
    { id: '8', english: 'In order to', hebrew: 'על מנת', category: 'מטרה', learned: false },
    { id: '9', english: 'In addition', hebrew: 'בנוסף', category: 'הוספה', learned: false },
    { id: '10', english: 'On purpose', hebrew: 'במכוון', category: 'כוונה', learned: false },
  ]

  const getRandomIdiom = () => {
    const unlearnedIdioms = idiomsDatabase.filter(idiom => !learnedIds.has(idiom.id))
    if (unlearnedIdioms.length === 0) {
      // Reset when all are learned
      setLearnedIds(new Set())
      return idiomsDatabase[Math.floor(Math.random() * idiomsDatabase.length)]
    }
    return unlearnedIdioms[Math.floor(Math.random() * unlearnedIdioms.length)]
  }

  const handleShowIdiom = () => {
    const idiom = getRandomIdiom()
    setCurrentIdiom(idiom)
  }

  const handleLearned = () => {
    if (currentIdiom) {
      setLearnedIds(new Set([...learnedIds, currentIdiom.id]))
      setHistory([...history, { ...currentIdiom, learned: true }])
      setCurrentIdiom(null)
    }
  }

  const handleNotLearned = () => {
    if (currentIdiom) {
      setHistory([...history, { ...currentIdiom, learned: false }])
      setCurrentIdiom(null)
    }
  }

  const getProgress = () => {
    return Math.round((learnedIds.size / idiomsDatabase.length) * 100)
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🎓 למידת פתגמים ומטבעות לשון
              </h1>
              <p className="text-gray-600 mt-1">
                למד את המערכת לתרגום נכון של פתגמים ואנגלית לעברית תקנית
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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress */}
        <div className="mb-8">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-900">התקדמות הלמידה</h2>
              <span className="text-2xl font-bold text-blue-600">{getProgress()}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-4">
              <div 
                className="bg-gradient-to-r from-blue-500 to-cyan-600 h-4 rounded-full transition-all duration-500"
                style={{ width: `${getProgress()}%` }}
              />
            </div>
            <p className="text-gray-600 mt-2">
              למדת {learnedIds.size} מתוך {idiomsDatabase.length} פתגמים
            </p>
          </div>
        </div>

        {/* Current Idiom Card */}
        {!currentIdiom ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">📖</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              מוכן להתחיל ללמד?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              המערכת תציג לך ביטוי באנגלית, ואתה תרגם אותו לעברית תקנית.
              המערכת תלמד מהתרגום הנכון שלך.
            </p>
            <button
              onClick={handleShowIdiom}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-lg"
            >
              <BookOpen className="w-6 h-6" />
              התחל ללמד
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Idiom Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-blue-200 p-8">
              <div className="text-center">
                <div className="inline-block px-4 py-2 bg-blue-100 text-blue-800 rounded-full text-sm font-medium mb-6">
                  {currentIdiom.category}
                </div>
                
                <h3 className="text-4xl font-bold text-gray-900 mb-8">
                  {currentIdiom.english}
                </h3>
                
                <div className="flex items-center justify-center gap-8 mb-8">
                  <ArrowLeft className="w-12 h-12 text-gray-400" />
                  <div className="text-6xl">💬</div>
                  <ArrowRight className="w-12 h-12 text-gray-400" />
                </div>

                <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-8 min-h-[100px] flex items-center justify-center">
                  <p className="text-3xl font-bold text-blue-600">
                    {currentIdiom.hebrew}
                  </p>
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleNotLearned}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-red-100 text-red-700 rounded-xl hover:bg-red-200 transition-all font-medium text-lg"
              >
                <XCircle className="w-6 h-6" />
                לא נכון - תרגם מחדש
              </button>
              <button
                onClick={handleLearned}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-100 text-green-700 rounded-xl hover:bg-green-200 transition-all font-medium text-lg"
              >
                <CheckCircle className="w-6 h-6" />
                נכון! למדתי
              </button>
              <button
                onClick={handleShowIdiom}
                className="flex items-center justify-center gap-2 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium"
              >
                <RefreshCw className="w-5 h-5" />
                דלג
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">היסטוריית למידה</h2>
            <div className="space-y-3">
              {history.slice(-10).reverse().map((idiom) => (
                <div 
                  key={idiom.id} 
                  className={`bg-white rounded-lg shadow-sm border p-4 flex items-center justify-between ${
                    idiom.learned ? 'border-green-200 bg-green-50' : 'border-red-200 bg-red-50'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    {idiom.learned ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <XCircle className="w-6 h-6 text-red-600" />
                    )}
                    <div>
                      <p className="font-semibold text-gray-900">{idiom.english}</p>
                      <p className="text-gray-600">{idiom.hebrew}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
