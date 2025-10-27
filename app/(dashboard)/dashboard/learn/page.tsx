'use client'

import { useState, useEffect } from 'react'
import { Home, RefreshCw, CheckCircle, XCircle, Edit3 } from 'lucide-react'
import Link from 'next/link'

interface TextSample {
  id: string
  originalText: string
  category: string
  correctedText?: string
  isLearned: boolean
}

export default function LearnPage() {
  const [currentText, setCurrentText] = useState<TextSample | null>(null)
  const [correctedText, setCorrectedText] = useState('')
  const [history, setHistory] = useState<TextSample[]>([])

  // Sample texts that need correction
  const textSamples: TextSample[] = [
    {
      id: '1',
      originalText: 'האנשים עושים עבודה טובה בזאת.',
      category: 'כללי',
      isLearned: false
    },
    {
      id: '2',
      originalText: 'אני חושב שהמסקנה היא נכונה.',
      category: 'דעות',
      isLearned: false
    },
    {
      id: '3',
      originalText: 'המערכת היא מהר מאוד.',
      category: 'תיאור',
      isLearned: false
    },
    {
      id: '4',
      originalText: 'המצב הוא חמור לכן נדרש לפעול מיד.',
      category: 'דחיפות',
      isLearned: false
    },
    {
      id: '5',
      originalText: 'בהתחשב בדברים האלה, אנחנו צריכים להמשיך.',
      category: 'החלטה',
      isLearned: false
    },
    {
      id: '6',
      originalText: 'המוצר יכול לעבוד טוב.',
      category: 'יכולות',
      isLearned: false
    },
    {
      id: '7',
      originalText: 'החברה עשתה שינוי גדול.',
      category: 'פעילות',
      isLearned: false
    },
    {
      id: '8',
      originalText: 'הדוח מתאים לצרכים שלנו.',
      category: 'הערכה',
      isLearned: false
    },
  ]

  const getRandomText = () => {
    const unlearnedTexts = textSamples.filter(text => 
      !history.find(h => h.id === text.id && h.isLearned)
    )
    
    if (unlearnedTexts.length === 0) {
      // Reset when all are learned
      setHistory([])
      return textSamples[Math.floor(Math.random() * textSamples.length)]
    }
    
    return unlearnedTexts[Math.floor(Math.random() * unlearnedTexts.length)]
  }

  const handleStartLearning = () => {
    const text = getRandomText()
    setCurrentText(text)
    setCorrectedText('')
  }

  const handleSubmit = () => {
    if (!currentText || !correctedText.trim()) {
      alert('נא להזין טקסט מתוקן')
      return
    }

    const updatedText = {
      ...currentText,
      correctedText: correctedText.trim(),
      isLearned: true
    }

    setHistory([...history, updatedText])
    setCurrentText(null)
    setCorrectedText('')
  }

  const handleSkip = () => {
    if (currentText) {
      setHistory([...history, { ...currentText, isLearned: false }])
      setCurrentText(null)
      setCorrectedText('')
    }
  }

  const getProgress = () => {
    const learnedCount = history.filter(h => h.isLearned).length
    return Math.round((learnedCount / textSamples.length) * 100)
  }

  const getLearnedCount = () => {
    return history.filter(h => h.isLearned).length
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-teal-50" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-blue-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
                🧠 למידת תיקון טקסטים
              </h1>
              <p className="text-gray-600 mt-1">
                למד את המערכת לתקן טקסטים ולהפוך אותם לעברית תקנית
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
              תיקנת {getLearnedCount()} מתוך {textSamples.length} טקסטים
            </p>
          </div>
        </div>

        {/* Current Text Card */}
        {!currentText ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
            <div className="text-8xl mb-6">📝</div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">
              מוכן להתחיל ללמד?
            </h3>
            <p className="text-gray-600 text-lg mb-8 max-w-md mx-auto">
              המערכת תציג לך טקסט בעברית. תקן אותו והמערכת תלמד מהתיקונים שלך.
            </p>
            <button
              onClick={handleStartLearning}
              className="inline-flex items-center gap-2 px-8 py-4 bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-xl hover:shadow-lg transform hover:scale-105 transition-all duration-200 font-medium text-lg"
            >
              <RefreshCw className="w-6 h-6" />
              התחל ללמד
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Original Text Card */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-red-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-2 bg-red-100 text-red-800 rounded-full text-sm font-medium">
                  {currentText.category}
                </span>
                <span className="text-sm text-gray-600">טקסט המקורי - צריך תיקון</span>
              </div>
              
              <div className="bg-red-50 border-2 border-red-200 rounded-xl p-6 min-h-[150px] flex items-center">
                <p className="text-2xl font-bold text-red-700 text-center w-full" dir="rtl">
                  {currentText.originalText}
                </p>
              </div>
            </div>

            <div className="text-center">
              <div className="text-6xl">⬇️</div>
            </div>

            {/* Corrected Text Input */}
            <div className="bg-white rounded-xl shadow-lg border-2 border-green-200 p-8">
              <div className="flex items-center gap-3 mb-4">
                <span className="px-4 py-2 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {currentText.category}
                </span>
                <span className="text-sm text-gray-600">הטקסט המתוקן שלך</span>
              </div>
              
              <textarea
                value={correctedText}
                onChange={(e) => setCorrectedText(e.target.value)}
                placeholder="הזן כאן את הטקסט המתוקן..."
                className="w-full bg-green-50 border-2 border-green-200 rounded-xl p-6 min-h-[150px] text-2xl font-bold text-green-700 resize-none focus:ring-2 focus:ring-green-500 focus:border-green-400"
                dir="rtl"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-4">
              <button
                onClick={handleSkip}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-lg"
              >
                <RefreshCw className="w-6 h-6" />
                דלג
              </button>
              <button
                onClick={handleSubmit}
                className="flex-1 flex items-center justify-center gap-3 px-6 py-4 bg-green-500 text-white rounded-xl hover:bg-green-600 transition-all font-medium text-lg"
              >
                <CheckCircle className="w-6 h-6" />
                שלח תיקון
              </button>
            </div>
          </div>
        )}

        {/* History */}
        {history.length > 0 && (
          <div className="mt-12">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">היסטוריית תיקונים</h2>
            <div className="space-y-4">
              {history.slice(-5).reverse().map((item, index) => (
                <div 
                  key={`${item.id}-${index}`} 
                  className="bg-white rounded-lg shadow-sm border-2 border-gray-200 p-6"
                >
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="border-r-2 border-gray-200 pr-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-red-100 text-red-800 rounded text-sm font-medium">
                          לפני
                        </span>
                      </div>
                      <p className="text-lg text-red-700 font-semibold" dir="rtl">
                        {item.originalText}
                      </p>
                    </div>
                    <div className="pl-6">
                      <div className="flex items-center gap-2 mb-3">
                        <span className="px-3 py-1 bg-green-100 text-green-800 rounded text-sm font-medium">
                          אחרי
                        </span>
                        {item.isLearned && (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        )}
                      </div>
                      <p className="text-lg text-green-700 font-semibold" dir="rtl">
                        {item.correctedText || 'לא תוקן'}
                      </p>
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
